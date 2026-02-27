import { openDB } from "idb";
import { LeoController } from "./LeoController";
import { FileStat } from "./types";
import { BodyView } from "./body-view";
import { DialogManager } from "./dialog-manager";
import { LayoutManager } from "./layout-manager";
import { LogPaneView } from "./log-pane-view";
import { MenuManager } from "./menu-manager";
import { OutlineView } from "./outline-view";

const DB_NAME = "leo-workspace";
const DB_VERSION = 1;
const STORE_HANDLES = "handles";

async function openWorkspaceDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_HANDLES)) {
                db.createObjectStore(STORE_HANDLES);
            }
        }
    });
}

export class Uri {
    // Absolute, root-anchored path (e.g., "/folder/sub/file.txt")
    public resolves: string[]; // path segments under workspace root
    public fsPath: string;     // canonical absolute path string

    constructor(path: string) {
        const normalized = Uri.normalize(path);
        const parts = normalized.slice(1).split('/').filter(Boolean);
        this.resolves = parts;
        this.fsPath = '/' + parts.join('/');
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
        return this.fsPath;
    }

    static joinPath(base: Uri, ...segments: string[]): Uri {
        const joined = [base.fsPath, ...segments].join('/').replace(/\/+/g, '/');
        return new Uri(joined);
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

    private async resolveParentAndName(uri: Uri): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
        if (uri.resolves.length === 0) {
            throw new Error(`Path points to workspace root; expected entry: ${uri.fsPath}`);
        }
        const parentParts = uri.resolves.slice(0, -1);
        const name = uri.resolves[uri.resolves.length - 1]!;
        const dir = await this.getDirHandle(parentParts, false);
        return { dir, name };
    }

    async writeFile(uri: Uri, content: Uint8Array): Promise<void> {
        const { dir, name } = await this.resolveParentAndName(uri);
        const handle = await dir.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        // Ensure ArrayBuffer (not SharedArrayBuffer) by copying
        const ab = new Uint8Array(content).buffer;
        await writable.write(ab);
        await writable.close();
    }

    async readFile(uri: Uri): Promise<Uint8Array> {
        const { dir, name } = await this.resolveParentAndName(uri);
        const handle = await dir.getFileHandle(name);
        const file = await handle.getFile();
        return new Uint8Array(await file.arrayBuffer());
    }

    async createDirectory(uri: Uri): Promise<void> {
        await this.getDirHandle(uri.resolves, true);
    }

    async delete(uri: Uri, opts: { recursive?: boolean } = {}): Promise<void> {
        const { dir, name } = await this.resolveParentAndName(uri);
        await dir.removeEntry(name, opts);
    }

    async rename(src: Uri, dst: Uri, opts: { overwrite?: boolean } = {}): Promise<void> {
        // Emulate rename with copy+delete (File System Access has no native move/rename).
        if (!opts.overwrite) {
            try {
                await this.stat(dst); // throws if not found
                throw new Error(`Destination exists: ${dst.fsPath}`);
            } catch {
                // Destination does not exist; ok to proceed.
            }
        }
        const data = await this.readFile(src);
        await this.writeFile(dst, data);
        await this.delete(src);
    }

    async stat(uri: Uri): Promise<FileStat> {
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
                throw new Error(`Entry not found: ${uri.fsPath}`);
            }
        }
    }

    async readDirectory(uri: Uri): Promise<Array<[string, 'file' | 'directory']>> {
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

    public fs!: Fs; // TODO eventually: (see setWorkspaceDirHandle method below) initialize properly with a fake class that mimics Fs methods but throws errors or forces setting workspace first. (Or something else?)  
    public dialog!: DialogManager;
    public menu!: MenuManager;
    public layout!: LayoutManager;
    public outline!: OutlineView;
    public body!: BodyView;
    public logPane!: LogPaneView;


    public controller!: LeoController;
    private _context: any = {}; // Arbitrary context data

    constructor() { }

    public setContext(key: string, value: any): void {
        this._context[key] = value;
    }

    public getContext(key: string): any {
        return this._context[key];
    }

    public setDialogManager(dialog: DialogManager) {
        this.dialog = dialog;
    }
    public setMenuManager(menu: MenuManager) {
        this.menu = menu;
    }
    public setLayoutManager(layout: LayoutManager) {
        this.layout = layout;
    }
    public setOutlineView(outline: OutlineView) {
        this.outline = outline;
    }
    public setBodyView(body: BodyView) {
        this.body = body;
    }
    public setLogPaneView(logPane: LogPaneView) {
        this.logPane = logPane;
    }

    public setController(controller: LeoController) {
        this.controller = controller;
    }

    public setWorkspaceDirHandle(handle: FileSystemDirectoryHandle) {
        this.workspaceDirHandle = handle;
        this.fs = new Fs(handle);
    }

    public getWorkspaceDirHandle(): FileSystemDirectoryHandle | null {
        return this.workspaceDirHandle;
    }

    // Optional convenience: derive a URI from a known handle using native resolve()
    public async uriFromHandle(handle: FileSystemHandle): Promise<Uri> {
        if (!this.workspaceDirHandle) {
            throw new Error("Workspace directory not set");
        }
        const rel = await this.workspaceDirHandle.resolve(handle);
        const path = '/' + (rel?.join('/') ?? '');
        const uri = new Uri(path);
        return uri;
    }

    public async clearWorkspace(): Promise<void> {
        const db = await openWorkspaceDB();
        await db.delete(STORE_HANDLES, "current");
        this.workspaceDirHandle = null;
        // Optional: replace fs with a guard that throws until a new workspace is set
        this.fs = undefined as unknown as Fs;
    }

    public async saveWorkspaceDirHandle(
        handle: FileSystemDirectoryHandle
    ) {
        const db = await openWorkspaceDB();
        await db.put(STORE_HANDLES, handle, "current");
    }


    public async loadWorkspaceDirHandle():
        Promise<FileSystemDirectoryHandle | null> {

        const db = await openWorkspaceDB();
        const handle = await db.get(STORE_HANDLES, "current");
        return handle ?? null;
    }

    public async ensurePermission(
        handle: FileSystemDirectoryHandle
    ): Promise<boolean> {

        const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };

        if ((await handle.queryPermission(opts)) === "granted") {
            return true;
        }

        if ((await handle.requestPermission(opts)) === "granted") {
            return true;
        }

        return false;
    }

}

export let workspace = new Workspace();

