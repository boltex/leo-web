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