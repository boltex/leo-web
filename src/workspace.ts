export class URI {
    // TODO: Implement the URI class as needed
    // Subset of the URI class from vscode that was used in leojs, for workspace operations to work in leo-web
    // (members can be added as needed)
    public handle: FileSystemHandle;
    public resolves: string[]; // path segments with root '/' being the base FileSystemDirectoryHandle
    public fspath: string; // full path as a string from root '/' built with resolves array

    constructor() {
        // TODO: Initialize members as needed
        this.handle = {} as FileSystemHandle;
        this.resolves = [];
        this.fspath = "";
    }

}

class Fs {

    private _workspaceDirHandle: FileSystemDirectoryHandle;

    constructor(workspaceDirHandle: FileSystemDirectoryHandle) {
        this._workspaceDirHandle = workspaceDirHandle;
    }

    // File system related properties and methods can be defined here
    readFile() {
        console.log("Fs readFile method called");
    }
    /* TODO : list of methods needed for file system operations 
      readFile
      writeFile
      delete
      stat
      createDirectory
      readDirectory    
    */
}

class Workspace {
    // Window's workspace in use
    public workspaceDirHandle: FileSystemDirectoryHandle | null = null; // The FileSystemDirectoryHandle for the workspace

    public fs: Fs | undefined;

    constructor() {

    }
    // Workspace related properties and methods can be defined here
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
        // TODO: Implement actual URI creation logic
        return new URI();
    }

}

export let workspace = new Workspace();

