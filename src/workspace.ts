export class URI {
    // Subset of the URI class needed in leojs for workspace operations to work in leo-web
    // members can be added as needed
    // handle: FileSystemHandle;
    // resolves: string[]; // path segments with root '/' being the base FileSystemDirectoryHandle
    // fspath: string; // full path as a string from root '/' built with resolves array

}

class Fs {
    // File system related properties and methods can be defined here
    readFile() {
        console.log("Fs readFile method called");
    }
    /* TODO : list of methods needed for file system operations 
      rename
      readFile
      writeFile
      delete
      star
      createDirectory
      readDirectory    
    */
}

class Workspace {
    public fs: Fs;

    constructor() {
        this.fs = new Fs();
    }
    // Workspace related properties and methods can be defined here
    test() {
        console.log("Workspace test method called");
    }

    // utility methods to support leojs workspace operations can be added here
    makeUri(path: string): URI {
        console.log(`Making URI for path: ${path}`);
        return new URI();
    }

}

export let workspace = new Workspace();

