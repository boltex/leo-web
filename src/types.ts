export interface TreeNode {
    gnx: number;
    parent?: TreeNode;
    children?: TreeNode[];
    toggled?: boolean; // To track if node was toggled (expanded/collapsed) since last render
}

export interface NodeData {
    headString: string;
    bodyString: string;
    icon?: number; // Bitmask for icons: hasBody: 1, isMarked: 2, isClone: 4, isDirty: 8
}

export interface FlatRow {
    label: string;
    depth: number;
    toggled: boolean; // Will make it render with toggled class
    hasChildren: boolean;
    isExpanded: boolean;
    node: TreeNode;
    isSelected: boolean;
    isAncestor: boolean;      // Is ancestor of selected node
    isInitialFind: boolean;   // Used for find scope highlighting
    icon: number;             // Icon number for the node
}

export interface MenuEntry {
    label: string;
    action?: string;
    entries?: MenuEntry[];
}

// E.g. const pathStack: FilePath[] = [{ name: "/", handle: rootHandle }];
export interface FilePath {
    name: string;
    handle: FileSystemDirectoryHandle;
}

// Options for open dialog. More to be added later.
export interface OpenDialogOptions {
    defaultUri?: string; // Default URI to open
    openLabel?: string; // A human-readable string for the open button.
    title?: string; // Dialog title.
}

export interface SaveDialogOptions {
    defaultUri?: string; // Default URI to open
    saveLabel?: string; // A human-readable string for the save button.
    title?: string; // Dialog title.
}