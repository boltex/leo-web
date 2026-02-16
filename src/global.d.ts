// global.d.ts

export { }; // 👈 important: makes this a module

declare global {
    /**
     * Thenable is a common denominator between ES6 promises, Q, jquery.Deferred, WinJS.Promise,
     * and others.
     */
    interface Thenable<T> extends PromiseLike<T> { }

    // File System Access API types
    interface FilePickerAcceptType {
        description?: string;
        accept: Record<string, string[]>;
    }

    interface OpenFilePickerOptions {
        multiple?: boolean;
        excludeAcceptAllOption?: boolean;
        types?: FilePickerAcceptType[];
        startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }

    interface SaveFilePickerOptions {
        excludeAcceptAllOption?: boolean;
        suggestedName?: string;
        types?: FilePickerAcceptType[];
        startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }

    interface DirectoryPickerOptions {
        mode?: 'read' | 'readwrite';
        startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }

    interface Window {
        showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
        showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
        showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
    }
}