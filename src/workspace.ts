class Fs {
    // File system related properties and methods can be defined here
    readFile() {
        console.log("Fs readFile method called");
    }
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


}

export let workspace = new Workspace();

