import { TreeNode, NodeData, MenuEntry } from './types';

export class LeoModel {
    public defaultTitle = "Leo Editor for the web";
    public genTimestamp = "1234567890"; // For uniqueness of saved localstorage data.
    public tree: TreeNode = {
        "gnx": 0,
        "children": [
            {
                "gnx": 1
            },
            {
                "gnx": 2,
                "children": [
                    {
                        "gnx": 3,
                        "children": [
                            {
                                "gnx": 4,
                                "children": [
                                    {
                                        "gnx": 5
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "gnx": 3
                    },
                    {
                        "gnx": 6
                    },
                    {
                        "gnx": 7
                    }
                ]
            },
            {
                "gnx": 8,
                "children": [
                    {
                        "gnx": 9
                    },
                    {
                        "gnx": 10
                    },
                    {
                        "gnx": 11
                    }
                ]
            }
        ]
    };
    public data: Record<string, NodeData> = {
        "1": {
            "headString": "first node no body",
            "bodyString": ""
        },
        "2": {
            "headString": "second node",
            "bodyString": "@nowrap\nSome body content\nmultiple lines\nblabla blabla blabla blabla\nend of first body"
        },
        "3": {
            "headString": "First child clone",
            "bodyString": "@wrap\nSome child content\nblabla blabla blabla blablablabla blabla blabla blablablabla blabla blabla blabla"
        },
        "4": {
            "headString": "Child of clone",
            "bodyString": "Body of the child of a clone!\nblabla blabla blabla blabla\nblabla blabla blabla blabla blabla blabla"
        },
        "5": {
            "headString": "Also has child!",
            "bodyString": "Yep, child of clone also has child!\n"
        },
        "6": {
            "headString": "trailing newlines",
            "bodyString": "inside other at same level\n\n"
        },
        "7": {
            "headString": "last same level",
            "bodyString": "Some body text"
        },
        "8": {
            "headString": "third top node no body",
            "bodyString": ""
        },
        "9": {
            "headString": "third top node child 1",
            "bodyString": "Some text in child 1\nblabla\n"
        },
        "10": {
            "headString": "third top node child 2",
            "bodyString": "Sample URLs https://example.com and http://example.org for testing links. Here are some more: file://host/path and file:///C:/path and an email mailto:foo@example.com to make sure they all work.\n"
        },
        "11": {
            "headString": "third top node child 3",
            "bodyString": "Last node of the tree's natural tree order.\n"
        }
    };

    public menuData: MenuEntry[] = [
        {
            label: "File",
            entries: [
                { label: "Open...", action: "open" },
                {
                    label: "Export",
                    entries: [
                        { label: "As PDF...", action: "export_pdf" },
                        { label: "As Image...", action: "export_img" },
                    ],
                },
                { label: "Exit", action: "exit" },
            ],
        },
        {
            label: "Edit",
            entries: [
                { label: "Undo", action: "undo" },
                { label: "Redo", action: "redo" },
                { label: "Cut", action: "cut" },
                { label: "Copy", action: "copy" },
                { label: "Paste", action: "paste" },
            ],
        },
        {
            label: "View",
            entries: [
                { label: "Zoom In", action: "zoom_in" },
                { label: "Zoom Out", action: "zoom_out" },
                {
                    label: "Orientation",
                    entries: [
                        { label: "Portrait", action: "orient_portrait" },
                        { label: "Landscape", action: "orient_landscape" },
                    ],
                },
                { label: "Fullscreen", action: "fullscreen" },
            ],
        },
        {
            label: "Help",
            entries: [
                { label: "Documentation", action: "docs" },
                { label: "About", action: "about" },
            ],
        },
    ];


    // Note: Also use buildClones and buildParentRefs
    // to add icon member to data entries as needed:
    // hasBody: 1, isMarked: 2, isClone: 4, isDirty: 8
    public allNodesInOrder: Array<TreeNode> = []; // Store all nodes in natural tree order (initialized after tree is built)

    public expanded: Set<TreeNode> = new Set(); // No need to add the root because 'isExpanded' will return true for it
    public marked: Set<number> = new Set(); // Set of gnx (not nodes) that are marked
    public selectedNode: TreeNode | null = null; // Track the currently selected node
    public hoistStack: Array<TreeNode> = []; // Track hoisted nodes
    public navigationHistory: Array<TreeNode> = [];
    public currentHistoryIndex = -1; // -1 means no history yet
    public initialFindNode: TreeNode | null = null; // Node where to start the find (null means from the top)

    constructor() {
        this.buildClones(this.tree);
        this.buildParentRefs(this.tree);
        this.allNodesInOrder = this.getAllNodesInTreeOrder(this.tree); // Initialize the global array once
    }

    // Build clones when repeated in the tree
    private buildClones(node: TreeNode) {

        const visitedNodes: Record<string, TreeNode> = {}; // Keys are gnx, values are node references

        // Helper function for recursion that has access to the visitedNodes object
        const buildClonesWithChildren = (node: TreeNode) => {
            const gnx = node && node.gnx.toString();
            // Initialize data entry safely if it exists
            if (gnx != null && this.data[gnx]) {
                if (!('icon' in this.data[gnx])) this.data[gnx].icon = 0;
            }
            if (gnx != null && Object.prototype.hasOwnProperty.call(visitedNodes, gnx)) {
                // If we've already seen this node, fill its children with JSON stringify/parse for deep copy.
                node.children = JSON.parse(JSON.stringify(visitedNodes[gnx]?.children || []));
                if (this.data[gnx]) this.data[gnx].icon = (this.data[gnx].icon || 0) | 4; // set clone bit
                // Do not recurse into children, they are already built
            } else {
                if (gnx != null && this.data[gnx] && this.data[gnx].bodyString) {
                    this.data[gnx].icon = (this.data[gnx].icon || 0) | 1; // set hasBody bit
                }
                visitedNodes[gnx] = node;
                if (node.children) {
                    for (const child of node.children) {
                        buildClonesWithChildren(child);
                    }
                }
            }
        }
        buildClonesWithChildren(node); // Start the recursive process
    }

    // Add parent references to all nodes recursively
    private buildParentRefs(node: TreeNode, parent?: TreeNode) {
        node.parent = parent;
        if (node.children) {
            for (const child of node.children) {
                this.buildParentRefs(child, node); // recurse with current node as parent
            }
        }
    }

    // Helper function to get all nodes in tree order
    private getAllNodesInTreeOrder(node: TreeNode): Array<TreeNode> {
        const result: Array<TreeNode> = [];
        const traverse = (n: TreeNode) => {
            if (n !== this.tree) { // Skip the hidden root node itself
                result.push(n);
            }
            if (n.children) {
                for (const child of n.children) {
                    traverse(child);
                }
            }
        }
        traverse(node);
        return result;
    }


    // * Navigation helpers
    public children(node: TreeNode): Array<TreeNode> {
        // Given a node, return a shallow copy of its children array or an empty array.
        return node && node.children ? node.children.slice() : [];
    }

    public parents(node: TreeNode): Array<TreeNode> {
        // Given a node, return an array of its ancestor nodes, closest first.
        const ancestors: Array<TreeNode> = [];
        let current: TreeNode | undefined = node;
        while (current) {
            const parent: TreeNode | undefined = current.parent;
            if (parent) {
                ancestors.push(parent);
            }
            current = parent;
        }
        return ancestors;
    };

    public isAncestorOf(possibleAncestor: TreeNode, descendant: TreeNode) {
        // Return true if possibleAncestor is an ancestor of descendant.
        let current = descendant.parent;
        while (current) {
            if (current === possibleAncestor) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    public hasChildren(node: TreeNode): node is TreeNode & { children: [TreeNode, ...TreeNode[]] } {
        // Given a node, return true if it has children.
        return !!(node.children && node.children.length > 0);
    }

    public hasParent(node: TreeNode): boolean {
        // Given a node, return true if it has a parent. Except if that parent is the hidden root node.
        return !!node.parent && !!node.parent.parent;
    }

    public hasBack(node: TreeNode): boolean {
        // Given a node, return true if it has a previous sibling.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index > 0;
        }
        return false;
    }

    public hasNext(node: TreeNode): boolean {
        // Given a node, return true if it has a next sibling.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index < siblings.length - 1;
        }
        return false;
    }

    public isExpanded(node: TreeNode): boolean {
        // Given a node, return true if it is expanded.
        if (!node.parent) return true; // The root node is always considered expanded
        return this.expanded.has(node);
    }

    public isVisible(node: TreeNode): boolean {
        // Return True if node is visible in the outline.
        if (!node.parent) return false; // Root node is not visible

        // First check if the node is descendant of the hoisted node
        if (this.hoistStack.length > 0 && !this.isDescendantOfHoistedNode(node)) {
            return false;
        }

        // Then check if all ancestors are expanded
        const ancestors = this.parents(node);
        for (const ancestor of ancestors) {
            if (!this.isExpanded(ancestor)) {
                return false;
            }
        }
        return true;
    }

    public isDescendantOfHoistedNode(node: TreeNode): boolean {
        if (!node || this.hoistStack.length === 0) {
            return false;
        } else {
            const hoistedNode = this.hoistStack[this.hoistStack.length - 1]!;
            return hoistedNode === node || this.isAncestorOf(hoistedNode, node);
        }
    }

    public getCurrentRoot(): TreeNode {
        // Return the current top of the hoist stack or the main tree root
        return this.hoistStack.length > 0 ? this.hoistStack[this.hoistStack.length - 1]! : this.tree;
    }

    public hasThreadBack(node: TreeNode): boolean {
        // Much cheaper than computing the actual value.
        return this.hasBack(node) || this.hasParent(node);
    }

    public moveToBack(node: TreeNode) {
        // Given a node, return its previous sibling. If first, or no parent, return null.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index > 0 ? siblings[index - 1] : null;
        }
        return null;
    }

    public moveToNext(node: TreeNode): TreeNode | null {
        // Given a node, return its next sibling. If already last, return null.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index < siblings.length - 1 ? siblings[index + 1]! : null;
        }
        return null;
    }


    public moveToParent(node: TreeNode): TreeNode | null {
        // Given a node, return its parent or null if no parent.
        const parent = node.parent;
        if (parent) {
            return parent;
        }
        return null;
    }

    public moveToFirstChild(node: TreeNode): TreeNode | null {
        // Given a node, return its first child if any. Else return null.
        return this.hasChildren(node) ? node.children[0] : null;
    }

    public moveToLastChild(node: TreeNode): TreeNode | null {
        // Given a node, return its last child if any. Else return null.
        return this.hasChildren(node) ? node.children[node.children.length - 1]! : null;
    }

    public moveToLastNode(node: TreeNode): TreeNode {
        // Given a node, return the last node of its tree or itself if no children.
        while (this.hasChildren(node)) {
            node = this.moveToLastChild(node)!;
        }
        return node;
    }

    public moveToThreadBack(node: TreeNode): TreeNode | null {
        // Given a node, return the previous node in the outline.
        if (this.hasBack(node)) {
            node = this.moveToBack(node)!;
            node = this.moveToLastNode(node)!;
        } else {
            node = this.moveToParent(node)!;
        }
        return node;
    }

    public moveToThreadNext(node: TreeNode): TreeNode | null {
        // Given a node, return the next node in the outline.
        if (this.hasChildren(node)) {
            node = this.moveToFirstChild(node)!;
        } else if (this.hasNext(node)) {
            node = this.moveToNext(node)!;
        } else {
            node = this.moveToParent(node)!;
            while (node) {
                if (node && this.hasNext(node)) {
                    node = this.moveToNext(node)!;
                    break;
                }
                node = this.moveToParent(node)!;
            }
        }
        return node;
    };

    public moveToVisBack(node: TreeNode): TreeNode | null {
        // Given a node, return the previous visible node in the outline.
        while (node) {
            // Short-circuit if possible.
            const back = this.moveToBack(node);
            if (back && this.hasChildren(back) && this.isExpanded(back))
                node = this.moveToThreadBack(node)!;
            else if (back) {
                node = this.moveToBack(node)!;
            } else {
                node = this.moveToParent(node)!;  // Same as p.moveToThreadBack()
            }
            if (node && this.isVisible(node)) {
                return node;
            }
        }
        return node;
    }

    public moveToVisNext(node: TreeNode): TreeNode | null {
        // Given a node, return the next visible node in the outline.
        while (node) {
            if (this.hasChildren(node)) {
                if (this.isExpanded(node)) {
                    node = this.moveToFirstChild(node)!;
                } else {
                    node = this.moveToNodeAfterTree(node)!;
                }
            } else if (this.hasNext(node)) {
                node = this.moveToNext(node)!;
            } else {
                node = this.moveToThreadNext(node)!;
            }
            if (node && this.isVisible(node)) {
                return node;
            }
        }
        return node;
    };

    public moveToNodeAfterTree(node: TreeNode): TreeNode | null {
        // Given a node, return the node after the position's tree.
        while (node) {
            if (this.hasNext(node)) {
                node = this.moveToNext(node)!;
                break;
            }
            node = this.moveToParent(node)!;
        }
        return node;
    }


    public toggleMark(node: TreeNode) {
        if (!node) return;
        const gnx = node.gnx;
        if (this.marked.has(gnx)) {
            this.marked.delete(gnx);
            if (this.data[gnx]) this.data[gnx].icon = (this.data[gnx].icon || 0) & ~2; // Clear marked bit
        } else {
            this.marked.add(gnx);
            if (this.data[gnx]) this.data[gnx].icon = (this.data[gnx].icon || 0) | 2; // Set marked bit
        }

    }

    public addToHistory(node: TreeNode) {
        if (this.navigationHistory.length > 0 &&
            this.navigationHistory[this.currentHistoryIndex] === node) {
            return; // Already the current node, do nothing
        }
        // If we're not at the end, truncate the forward history
        if (this.currentHistoryIndex < this.navigationHistory.length - 1) {
            this.navigationHistory.splice(this.currentHistoryIndex + 1);
        }
        this.navigationHistory.push(node); // Add the new node to history
        this.currentHistoryIndex = this.navigationHistory.length - 1;
    }

}