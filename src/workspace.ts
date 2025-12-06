export class URI {
    // Absolute, root-anchored path (e.g., "/folder/sub/file.txt")
    public resolves: string[]; // path segments under workspace root
    public fspath: string;     // canonical absolute path string

    constructor(path: string) {
        const normalized = URI.normalize(path);
        const parts = normalized.slice(1).split('/').filter(Boolean);
        this.resolves = parts;
        this.fspath = '/' + parts.join('/');
    }

    static normalize(path: string): string {
        if (!path) throw new Error('Path is empty');
        let p = path.trim();
        if (!p.startsWith('/')) {
            throw new Error(`URI must start with '/': ${path}`);
        }
        const out: string[] = [];
        for (const seg of p.split('/')) {
            if (!seg || seg === '.') continue;
            if (seg === '..') {
                if (out.length) out.pop();
                continue;
            }
            out.push(seg);
        }
        return '/' + out.join('/');
    }

    toString(): string {
        return this.fspath;
    }

    static joinPath(base: URI, ...segments: string[]): URI {
        const joined = [base.fspath, ...segments].join('/').replace(/\/+/g, '/');
        return new URI(joined);
    }
}

class Fs {
    private _workspaceDirHandle: FileSystemDirectoryHandle;

    constructor(workspaceDirHandle: FileSystemDirectoryHandle) {
        this._workspaceDirHandle = workspaceDirHandle;
    }

    private async getDirHandle(parts: string[], create: boolean): Promise<FileSystemDirectoryHandle> {
        let current = this._workspaceDirHandle;
        for (const part of parts) {
            if (!part) continue;
            current = await current.getDirectoryHandle(part, { create });
        }
        return current;
    }

    private async resolveParentAndName(uri: URI): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
        if (uri.resolves.length === 0) {
            throw new Error(`Path points to workspace root; expected entry: ${uri.fspath}`);
        }
        const parentParts = uri.resolves.slice(0, -1);
        const name = uri.resolves[uri.resolves.length - 1]!;
        const dir = await this.getDirHandle(parentParts, false);
        return { dir, name };
    }

    async writeFile(uri: URI, content: Uint8Array): Promise<void> {
        const { dir, name } = await this.resolveParentAndName(uri);
        const handle = await dir.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        // Ensure ArrayBuffer (not SharedArrayBuffer) by copying
        const ab = new Uint8Array(content).buffer;
        await writable.write(ab);
        await writable.close();
    }

    async readFile(uri: URI): Promise<Uint8Array> {
        const { dir, name } = await this.resolveParentAndName(uri);
        const handle = await dir.getFileHandle(name);
        const file = await handle.getFile();
        return new Uint8Array(await file.arrayBuffer());
    }

    async createDirectory(uri: URI): Promise<void> {
        await this.getDirHandle(uri.resolves, true);
    }

    async delete(uri: URI, opts: { recursive?: boolean } = {}): Promise<void> {
        const { dir, name } = await this.resolveParentAndName(uri);
        await dir.removeEntry(name, opts);
    }

    async stat(uri: URI): Promise<{ type: 'file' | 'directory'; size?: number; mtime?: number }> {
        const { dir, name } = await this.resolveParentAndName(uri);
        try {
            const fh = await dir.getFileHandle(name);
            const file = await fh.getFile();
            return { type: 'file', size: file.size, mtime: file.lastModified };
        } catch {
            try {
                await dir.getDirectoryHandle(name, { create: false });
                return { type: 'directory' };
            } catch {
                throw new Error(`Entry not found: ${uri.fspath}`);
            }
        }
    }

    async readDirectory(uri: URI): Promise<Array<[string, 'file' | 'directory']>> {
        const dir = await this.getDirHandle(uri.resolves, false);
        const entries: Array<[string, 'file' | 'directory']> = [];
        // @ts-ignore: for older lib.dom.d.ts where entries() may not be typed as async iterable
        for await (const [name, handle] of dir.entries()) {
            entries.push([name, handle.kind as 'file' | 'directory']);
        }
        return entries;
    }
}

class Workspace {
    // Window's workspace in use
    public workspaceDirHandle: FileSystemDirectoryHandle | null = null; // The FileSystemDirectoryHandle for the workspace

    public fs: Fs | undefined;

    constructor() { }

    test() {
        console.log("Workspace test method called");
    }

    public setWorkspaceDirHandle(handle: FileSystemDirectoryHandle) {
        this.workspaceDirHandle = handle;
        this.fs = new Fs(handle);
    }

    public getWorkspaceDirHandle(): FileSystemDirectoryHandle | null {
        return this.workspaceDirHandle;
    }

    // Utility methods for URI creation
    // Example of a path is "/folder1/folder2/file.txt" where root "/" is the workspaceDirHandle
    public makeUri(path: string): URI {
        console.log(`Making URI for path: ${path}`);
        if (!this.workspaceDirHandle) {
            throw new Error("Workspace directory not set");
        }
        return new URI(path);
    }

    // Optional convenience: derive a URI from a known handle using native resolve()
    public async uriFromHandle(handle: FileSystemHandle): Promise<URI> {
        if (!this.workspaceDirHandle) {
            throw new Error("Workspace directory not set");
        }
        const rel = await this.workspaceDirHandle.resolve(handle);
        const path = '/' + (rel?.join('/') ?? '');
        const uri = new URI(path);
        return uri;
    }

}

export let workspace = new Workspace();

