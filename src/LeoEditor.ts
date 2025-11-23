import { TreeNode, NodeData, FlatRow, MenuEntry } from './types';
import * as utils from './utils';

export class LeoEditor {

    private title = "Virtual Tree View Demo 2"; // Also used as key for localstorage save/restore of expanded and marked sets.
    private genTimestamp = "1234567890"; // Change this to force reload of saved localstorage data.
    private tree: TreeNode = {
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
    private data: Record<string, NodeData> = {
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

    private menuData: MenuEntry[] = [
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
    private allNodesInOrder: Array<TreeNode> = []; // Store all nodes in natural tree order (initialized after tree is built)

    private flatRows: FlatRow[] | null = null; // Array of nodes currently visible in the outline pane, null at init time to not trigger render
    private expanded: Set<TreeNode> = new Set(); // No need to add the root because 'isExpanded' will return true for it
    private marked: Set<number> = new Set(); // Set of gnx (not nodes) that are marked
    private selectedNode: TreeNode | null = null; // Track the currently selected node
    private initialFindNode: TreeNode | null = null; // Node where to start the find (null means from the top)
    private currentTheme = 'light'; // Default theme
    private currentLayout = 'vertical'; // Default layout
    private isDragging = false;
    private isMenuShown = false;
    private lastFocusedElement: HTMLElement | null = null; // Used when opening/closing the menu to restore focus
    private mainRatio = 0.25; // Default proportion between outline-find-container and body-pane widths (defaults to 1/4)
    private secondaryIsDragging = false;
    private crossIsDragging = false;
    private secondaryRatio = 0.75; // Default proportion between the outline-pane and the log-pane (defaults to 3/4)
    private __toastTimer: ReturnType<typeof setTimeout> | null = null;
    private navigationHistory: Array<TreeNode> = [];
    private currentHistoryIndex = -1; // -1 means no history yet
    private hoistStack: Array<TreeNode> = []; // Track hoisted nodes

    // Allow http(s)/ftp with '://', file with // or ///, and mailto: without '//'
    private urlRegex = /\b(?:(?:https?|ftp):\/\/|file:\/\/\/?|mailto:)[^\s<]+/gi;

    private minWidth = 20;
    private minHeight = 20;

    private outlinePaneKeyMap: { [key: string]: () => void } = {
        'Enter': () => { console.log('Oops!') },
        'Tab': () => { console.log('Oops!') },
        ' ': () => { console.log('Oops!') },
        'ArrowUp': () => { console.log('Oops!') },
        'ArrowDown': () => { console.log('Oops!') },
        'ArrowLeft': () => { console.log('Oops!') },
        'ArrowRight': () => { console.log('Oops!') },
        'PageUp': () => { console.log('Oops!') },
        'PageDown': () => { console.log('Oops!') },
        'Home': () => { console.log('Oops!') },
        'End': () => { console.log('Oops!') },
    };

    // Elements
    private selectedLabelElement: HTMLSpanElement | null = null; // Track the currently selected label element in the outline pane
    private ROW_HEIGHT = 26;
    private LEFT_OFFSET = 16; // Padding from left edge

    private MAIN_CONTAINER: HTMLElement;
    private OUTLINE_FIND_CONTAINER: HTMLElement;
    private OUTLINE_PANE: HTMLElement;
    private COLLAPSE_ALL_BTN: HTMLElement;
    private SPACER: HTMLElement;
    private BODY_PANE: HTMLElement;
    private VERTICAL_RESIZER: HTMLElement;
    private LOG_PANE: HTMLElement;
    private HORIZONTAL_RESIZER: HTMLElement;
    private CROSS_RESIZER: HTMLElement;
    private THEME_TOGGLE: HTMLElement;
    private THEME_ICON: HTMLElement;
    private LAYOUT_TOGGLE: HTMLElement;
    private MENU_TOGGLE: HTMLElement;
    private TOP_MENU_TOGGLE: HTMLElement;

    private DEHOIST_BTN: HTMLButtonElement;
    private HOIST_BTN: HTMLButtonElement;
    private NEXT_BTN: HTMLButtonElement;
    private PREV_BTN: HTMLButtonElement;

    private NEXT_MARKED_BTN: HTMLButtonElement;
    private TOGGLE_MARK_BTN: HTMLButtonElement;
    private PREV_MARKED_BTN: HTMLButtonElement;

    private BUTTON_CONTAINER: HTMLElement;
    private TRIGGER_AREA: HTMLElement;

    private ACTION_MARK: HTMLElement;
    private ACTION_UNMARK: HTMLElement;
    private ACTION_HOIST: HTMLElement;
    private ACTION_DEHOIST: HTMLElement;

    private FIND_INPUT: HTMLInputElement;
    private OPT_HEADLINE: HTMLInputElement;
    private OPT_BODY: HTMLInputElement;
    private OPT_WHOLE: HTMLInputElement;
    private OPT_IGNORECASE: HTMLInputElement;
    private OPT_REGEXP: HTMLInputElement;
    private OPT_MARK: HTMLInputElement;

    private LOG_TAB: HTMLDivElement;
    private FIND_TAB: HTMLDivElement;
    private UNDO_TAB: HTMLDivElement;
    private SETTINGS_TAB: HTMLDivElement;

    private SHOW_PREV_NEXT_MARK: HTMLInputElement;
    private SHOW_TOGGLE_MARK: HTMLInputElement;
    private SHOW_PREV_NEXT_HISTORY: HTMLInputElement;
    private SHOW_HOIST_DEHOIST: HTMLInputElement;
    private SHOW_LAYOUT_ORIENTATION: HTMLInputElement;
    private SHOW_THEME_TOGGLE: HTMLInputElement;
    private SHOW_NODE_ICONS: HTMLInputElement;
    private SHOW_COLLAPSE_ALL: HTMLInputElement;

    private MENU: HTMLElement;
    private TOAST: HTMLElement;
    private HTML_ELEMENT: HTMLElement;

    private activeTopMenu: HTMLDivElement | null = null;
    private focusedMenuItem: HTMLDivElement | null = null;
    private topLevelItems: HTMLDivElement[] = [];
    private topLevelSubmenus = new Map();

    constructor() {
        this.buildClones(this.tree);
        this.buildParentRefs(this.tree);
        this.allNodesInOrder = this.getAllNodesInTreeOrder(this.tree); // Initialize the global array once

        this.MAIN_CONTAINER = document.getElementById("main-container")!;
        this.OUTLINE_FIND_CONTAINER = document.getElementById("outline-find-container")!;
        this.OUTLINE_PANE = document.getElementById("outline-pane")!;
        this.COLLAPSE_ALL_BTN = document.getElementById("collapse-all-btn")!;
        this.SPACER = document.getElementById("spacer")!;
        this.BODY_PANE = document.getElementById("body-pane")!;
        this.VERTICAL_RESIZER = document.getElementById('main-resizer')!;
        this.LOG_PANE = document.getElementById("log-pane")!;
        this.HORIZONTAL_RESIZER = document.getElementById('secondary-resizer')!;
        this.CROSS_RESIZER = document.getElementById('cross-resizer')!;
        this.THEME_TOGGLE = document.getElementById('theme-toggle')!;
        this.THEME_ICON = document.getElementById('theme-icon')!;
        this.LAYOUT_TOGGLE = document.getElementById('layout-toggle')!;
        this.MENU_TOGGLE = document.getElementById('menu-toggle')!;
        this.TOP_MENU_TOGGLE = document.getElementById("top-menu-toggle")!;

        this.DEHOIST_BTN = document.getElementById('dehoist-btn')! as HTMLButtonElement;
        this.HOIST_BTN = document.getElementById('hoist-btn')! as HTMLButtonElement;
        this.NEXT_BTN = document.getElementById('next-btn')! as HTMLButtonElement;
        this.PREV_BTN = document.getElementById('prev-btn')! as HTMLButtonElement;

        this.NEXT_MARKED_BTN = document.getElementById('next-marked-btn')! as HTMLButtonElement;
        this.TOGGLE_MARK_BTN = document.getElementById('toggle-mark-btn')! as HTMLButtonElement;
        this.PREV_MARKED_BTN = document.getElementById('prev-marked-btn')! as HTMLButtonElement;

        this.BUTTON_CONTAINER = document.getElementById('button-container')!;
        this.TRIGGER_AREA = document.getElementById('button-trigger-area')!;

        this.ACTION_MARK = document.getElementById('action-mark')!;
        this.ACTION_UNMARK = document.getElementById('action-unmark')!;
        this.ACTION_HOIST = document.getElementById('action-hoist')!;
        this.ACTION_DEHOIST = document.getElementById('action-dehoist')!;

        this.FIND_INPUT = document.getElementById('find-input')! as HTMLInputElement;
        this.OPT_HEADLINE = document.getElementById('opt-headline')! as HTMLInputElement;
        this.OPT_BODY = document.getElementById('opt-body')! as HTMLInputElement;
        this.OPT_WHOLE = document.getElementById('opt-whole')! as HTMLInputElement;
        this.OPT_IGNORECASE = document.getElementById('opt-ignorecase')! as HTMLInputElement;
        this.OPT_REGEXP = document.getElementById('opt-regexp')! as HTMLInputElement;
        this.OPT_MARK = document.getElementById('opt-mark')! as HTMLInputElement;

        this.LOG_TAB = document.getElementById('log-tab')! as HTMLDivElement;
        this.FIND_TAB = document.getElementById('find-tab')! as HTMLDivElement;
        this.UNDO_TAB = document.getElementById('undo-tab')! as HTMLDivElement;
        this.SETTINGS_TAB = document.getElementById('settings-tab')! as HTMLDivElement;

        this.SHOW_PREV_NEXT_MARK = document.getElementById('show-prev-next-mark')! as HTMLInputElement;
        this.SHOW_TOGGLE_MARK = document.getElementById('show-toggle-mark')! as HTMLInputElement;
        this.SHOW_PREV_NEXT_HISTORY = document.getElementById('show-prev-next-history')! as HTMLInputElement;
        this.SHOW_HOIST_DEHOIST = document.getElementById('show-hoist-dehoist')! as HTMLInputElement;
        this.SHOW_LAYOUT_ORIENTATION = document.getElementById('show-layout-orientation')! as HTMLInputElement;
        this.SHOW_THEME_TOGGLE = document.getElementById('show-theme-toggle')! as HTMLInputElement;
        this.SHOW_NODE_ICONS = document.getElementById('show-node-icons')! as HTMLInputElement;
        this.SHOW_COLLAPSE_ALL = document.getElementById('show-collapse-all')! as HTMLInputElement;

        this.MENU = document.getElementById('menu')!;
        this.TOAST = document.getElementById('toast')!;
        this.HTML_ELEMENT = document.documentElement;
        this.outlinePaneKeyMap = {
            'Enter': () => this.BODY_PANE.focus(),
            'Tab': () => this.BODY_PANE.focus(),
            ' ': () => this.toggleSelected(),
            'ArrowUp': () => this.selectVisBack(),
            'ArrowDown': () => this.selectVisNext(),
            'ArrowLeft': () => this.contractNodeOrGoToParent(),
            'ArrowRight': () => this.expandNodeAndGoToFirstChild(),
            'PageUp': () => this.gotoFirstSiblingOrParent(),
            'PageDown': () => this.gotoLastSiblingOrVisNext(),
            'Home': () => this.gotoFirstVisibleNode(),
            'End': () => this.gotoLastVisibleNode()
        };
        // Build the menu
        this.topLevelItems.length = 0;
        this.topLevelSubmenus.clear();
        this.buildMenu(this.menuData);
        // Apply theme & layout before anything else to avoid flash of unstyled content
        this.initializeThemeAndLayout(); // gets ratios from localStorage and applies layout and theme
    }

    private buildMenu(entries: MenuEntry[], level = 0) {
        const menu = level === 0 ? document.getElementById("top-menu")! : document.createElement("div");

        menu.className = "menu" + (level > 0 ? " submenu" : "");

        for (const entry of entries) {
            const item = document.createElement("div");
            item.className = "menu-item";
            item.textContent = entry.label;

            item.addEventListener("mouseenter", () => {
                if (this.focusedMenuItem && this.focusedMenuItem !== item) {
                    this.focusedMenuItem.classList.remove("focused");
                    this.focusedMenuItem = null;
                }
            });

            if (entry.entries) {
                if (level > 0) item.classList.add("has-sub");
                const sub = this.buildMenu(entry.entries, level + 1);
                if (level === 0) {
                    document.body.appendChild(sub);
                    this.topLevelSubmenus.set(item, sub);
                } else {
                    item.appendChild(sub);
                }

                if (level === 0) {
                    item.addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (this.activeTopMenu === item) {
                            this.closeAllSubmenus();
                            this.activeTopMenu = null;
                            this.restoreLastFocusedElement();
                        } else {
                            this.openTopMenu(item, sub, level);
                        }
                    });

                    item.addEventListener("mouseenter", () => {
                        if (this.activeTopMenu && this.activeTopMenu !== item) {
                            this.openTopMenu(item, sub, level);
                        }
                    });
                } else {
                    item.addEventListener("mouseenter", () => {
                        this.positionSubmenu(item, sub, level);
                        sub.classList.add("visible");
                    });
                    item.addEventListener("mouseleave", (e) => {
                        const related = e.relatedTarget as Node | null;
                        if (!related || (!item.contains(related) && !sub.contains(related))) {
                            sub.classList.remove("visible");
                        }
                    });
                }
            } else if (entry.action) {
                item.addEventListener("click", () => {
                    console.log("Action triggered:", entry.action);
                    this.closeAllSubmenus();
                    this.restoreLastFocusedElement();
                    this.activeTopMenu = null;
                });
            }

            if (level === 0) {
                this.topLevelItems.push(item);
                // menu.insertBefore(item, this.TOP_MENU_TOGGLE);
                menu.appendChild(item);
            } else {

                menu.appendChild(item);
            }

        }

        return menu;
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
    private children(node: TreeNode): Array<TreeNode> {
        // Given a node, return a shallow copy of its children array or an empty array.
        return node && node.children ? node.children.slice() : [];
    }

    private childIndex(node: TreeNode): number {
        // Given a node, return its index among its siblings (0 for first, 1 for second, etc).
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            return siblings.indexOf(node);
        }
        return 0; // Should not happen for valid nodes because the top nodes are in the #outline-pane div
    }

    private parents(node: TreeNode): Array<TreeNode> {
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

    private isAncestorOf(possibleAncestor: TreeNode, descendant: TreeNode) {
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

    private hasChildren(node: TreeNode): node is TreeNode & { children: [TreeNode, ...TreeNode[]] } {
        // Given a node, return true if it has children.
        return !!(node.children && node.children.length > 0);
    }

    private isExpanded(node: TreeNode): boolean {
        // Given a node, return true if it is expanded.
        if (!node.parent) return true; // The root node is always considered expanded
        return this.expanded.has(node);
    }

    private isDescendantOfHoistedNode(node: TreeNode): boolean {
        if (!node || this.hoistStack.length === 0) {
            return false;
        } else {
            const hoistedNode = this.hoistStack[this.hoistStack.length - 1]!;
            return hoistedNode === node || this.isAncestorOf(hoistedNode, node);
        }
    }

    private isVisible(node: TreeNode): boolean {
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

    private hasBack(node: TreeNode): boolean {
        // Given a node, return true if it has a previous sibling.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index > 0;
        }
        return false;
    }

    private hasNext(node: TreeNode): boolean {
        // Given a node, return true if it has a next sibling.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index < siblings.length - 1;
        }
        return false;
    }

    private hasParent(node: TreeNode): boolean {
        // Given a node, return true if it has a parent. Except if that parent is the hidden root node.
        return !!node.parent && !!node.parent.parent;
    }

    private hasThreadBack(node: TreeNode): boolean {
        // Much cheaper than computing the actual value.
        return this.hasBack(node) || this.hasParent(node);
    }

    private moveToBack(node: TreeNode) {
        // Given a node, return its previous sibling. If first, or no parent, return null.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index > 0 ? siblings[index - 1] : null;
        }
        return null;
    }

    private moveToFirstChild(node: TreeNode): TreeNode | null {
        // Given a node, return its first child if any. Else return null.
        return this.hasChildren(node) ? node.children[0] : null;
    }

    private moveToLastChild(node: TreeNode): TreeNode | null {
        // Given a node, return its last child if any. Else return null.
        return this.hasChildren(node) ? node.children[node.children.length - 1]! : null;
    }

    private moveToLastNode(node: TreeNode): TreeNode {
        // Given a node, return the last node of its tree or itself if no children.
        while (this.hasChildren(node)) {
            node = this.moveToLastChild(node)!;
        }
        return node;
    }

    private moveToNext(node: TreeNode): TreeNode | null {
        // Given a node, return its next sibling. If already last, return null.
        const parent = node.parent;
        if (parent) {
            const siblings = this.children(parent);
            const index = siblings.indexOf(node);
            return index < siblings.length - 1 ? siblings[index + 1]! : null;
        }
        return null;
    }

    private moveToNodeAfterTree(node: TreeNode): TreeNode | null {
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

    private moveToParent(node: TreeNode): TreeNode | null {
        // Given a node, return its parent or null if no parent.
        const parent = node.parent;
        if (parent) {
            return parent;
        }
        return null;
    }

    private moveToThreadBack(node: TreeNode): TreeNode | null {
        // Given a node, return the previous node in the outline.
        if (this.hasBack(node)) {
            node = this.moveToBack(node)!;
            node = this.moveToLastNode(node)!;
        } else {
            node = this.moveToParent(node)!;
        }
        return node;
    }

    private moveToThreadNext(node: TreeNode): TreeNode | null {
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

    private moveToVisBack(node: TreeNode): TreeNode | null {
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

    private moveToVisNext(node: TreeNode): TreeNode | null {
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

    // * Navigation actions
    private hoistNode = () => {
        if (!this.selectedNode) return;

        // If selected node is already hoisted: no-op (Even if button should be disabled in that case)
        if (this.hoistStack.length > 0 && this.hoistStack[this.hoistStack.length - 1] === this.selectedNode) return;

        if (!this.selectedNode.parent) {
            return; // root node (though it should never be selected anyway)
        }

        this.hoistStack.push(this.selectedNode);
        if (this.hasChildren(this.selectedNode) && !this.isExpanded(this.selectedNode)) {
            this.expanded.add(this.selectedNode);
            this.selectedNode.toggled = true; // Mark as toggled
        }
        this.updateHoistButtonStates();
        this.updateContextMenuState(); // Node was already selected so no need to reupdate based on hoist
        this.buildRowsRenderTree();
    }

    private dehoistNode = () => {
        if (this.hoistStack.length === 0) {
            return;
        }
        const previousHoist = this.hoistStack.pop()!;
        this.selectAndOrToggleAndRedraw(previousHoist);
        this.updateHoistButtonStates();
    }

    private expandNodeAndGoToFirstChild() {
        // If the presently selected node has children, expand it if needed and go to the first child.
        let node = this.selectedNode!;
        if (this.hasChildren(node)) {
            if (!this.isExpanded(node)) {
                this.expanded.add(node);
                node.toggled = true; // Mark as toggled
            }
            node = this.moveToFirstChild(node)!;
            this.selectAndOrToggleAndRedraw(node);
        }
    }

    private contractNodeOrGoToParent() {
        // If the presently selected node is expanded, collapse it. Otherwise go to the parent.
        let node = this.selectedNode!;
        if (this.hasChildren(node) && this.isExpanded(node)) {
            this.selectAndOrToggleAndRedraw(null, node);
        } else if (this.hasParent(node)) {
            const parent = this.moveToParent(node)!;
            if (this.isVisible(parent)) {
                // Contract all children first
                for (const child of this.children(parent)) {
                    if (this.isExpanded(child)) {
                        this.expanded.delete(child);
                        child.toggled = true; // Mark as toggled
                    }
                }
                this.selectAndOrToggleAndRedraw(parent);
            }
        }
    }

    private selectVisBack() {
        // Select the visible node preceding the presently selected node.
        let node = this.selectedNode!;
        if (this.moveToVisBack(node)) {
            node = this.moveToVisBack(node)!;
            this.selectAndOrToggleAndRedraw(node);
        }
    }

    private selectVisNext() {
        // Select the visible node following the presently selected node.
        let node = this.selectedNode!;
        if (this.moveToVisNext(node)) {
            node = this.moveToVisNext(node)!;
            this.selectAndOrToggleAndRedraw(node);
        }
    }

    private gotoFirstSiblingOrParent() {
        // Select the first sibling of the presently selected node, or its parent if already first.
        let node = this.selectedNode!;
        const currentRoot = this.getCurrentRoot();
        if (this.hasBack(node)) {
            let firstVisibleSibling = null;
            let current = node;
            while (this.hasBack(current)) {
                let prev = this.moveToBack(current)!;
                if (this.isVisible(prev)) {
                    firstVisibleSibling = prev;
                    current = prev;
                } else {
                    break;
                }
            }
            if (firstVisibleSibling) {
                node = firstVisibleSibling;
            }
        } else if (this.hasParent(node) && node !== currentRoot) {
            const parent = this.moveToParent(node)!;
            if (parent === currentRoot || this.isDescendantOfHoistedNode(parent)) {
                node = parent;
            }
        }
        this.selectAndOrToggleAndRedraw(node);
    };

    private gotoLastSiblingOrVisNext() {
        // Select the last sibling of the presently selected node, or the next visible node if already last.
        let node = this.selectedNode!;
        const currentRoot = this.getCurrentRoot();
        if (this.hasNext(node)) {
            let lastVisibleSibling = null;
            let current = node;
            while (this.hasNext(current)) {
                let next = this.moveToNext(current)!;
                if (this.isVisible(next)) {
                    lastVisibleSibling = next;
                    current = next;
                } else {
                    break;
                }
            }
            if (lastVisibleSibling) {
                node = lastVisibleSibling;
            }
        } else if (this.moveToVisNext(node)) {
            node = this.moveToVisNext(node)!;
        }
        if (node) this.selectAndOrToggleAndRedraw(node);
    };


    private gotoFirstVisibleNode() {
        // Get the current root (could be hoisted node or hidden root)
        const currentRoot = this.getCurrentRoot()!;

        // If we're hoisted, the first visible node could be the hoisted node itself
        if (this.hoistStack.length > 0) {
            this.selectAndOrToggleAndRedraw(currentRoot);
            return;
        }

        // Otherwise, select the first child of the root node
        const firstNode = this.moveToFirstChild(currentRoot);
        if (firstNode) {
            this.selectAndOrToggleAndRedraw(firstNode);
        }
    };

    private gotoLastVisibleNode() {
        // Select the last visible node in the outline.
        let node = this.selectedNode!;
        while (node) {
            const next = this.moveToVisNext(node);
            if (next && this.isVisible(next)) {
                node = next;
            } else {
                break;
            }
        }
        if (node) {
            this.selectAndOrToggleAndRedraw(node);
        }
    };

    private collapseAll = () => {
        // Collapse all nodes in visible outline and select the proper top-level node
        const currentRoot = this.getCurrentRoot()!;
        if (currentRoot === this.tree) {
            this.expanded.clear();
        } else {
            const nodesToRemove: TreeNode[] = [];
            this.expanded.forEach(node => {
                if (node === currentRoot || this.isAncestorOf(currentRoot, node)) {
                    nodesToRemove.push(node);
                }
            });
            nodesToRemove.forEach(node => this.expanded.delete(node));
        }
        if (this.hoistStack.length > 0) {
            this.selectAndOrToggleAndRedraw(currentRoot);
        } else {
            let node = this.selectedNode!;
            // If currently selected node is a descendant of a top-level node, find that top-level node
            while (node && this.hasParent(node) && node.parent !== this.tree) {
                node = this.moveToParent(node)!;
            }
            if (node) this.selectAndOrToggleAndRedraw(node);
        }
    };

    private toggleSelected() {
        if (this.selectedNode && this.selectedNode.children && this.selectedNode.children.length > 0) {
            this.selectAndOrToggleAndRedraw(null, this.selectedNode);
        }
    }

    private toggleMark(node: TreeNode) {
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

    private toggleMarkCurrentNode = () => {
        if (this.selectedNode) {
            this.toggleMark(this.selectedNode);
            this.updateMarkedButtonStates();
            this.updateButtonVisibility();

            // Only need to redraw the affected node if visible, no need to re-flatten because structure didn't change
            if (this.isVisible(this.selectedNode)) {
                this.renderTree();
            }
        }
    }

    private gotoNextMarkedNode = () => {
        if (!this.selectedNode || this.marked.size === 0) {
            return;
        }

        const currentIndex = this.allNodesInOrder.findIndex(node => node === this.selectedNode);
        if (currentIndex === -1) {
            return; // Should never happen
        }

        let foundMarked = false;
        for (let i = 1; i <= this.allNodesInOrder.length; i++) {
            const nextIndex = (currentIndex + i) % this.allNodesInOrder.length; // Wrap around
            const node = this.allNodesInOrder[nextIndex]!;

            if (node === this.selectedNode) {
                continue;
            }

            if (this.marked.has(node.gnx)) {
                this.selectAndOrToggleAndRedraw(node);
                foundMarked = true;
                break;
            }
        }

        if (!foundMarked) {
            if (this.marked.size === 1 && this.marked.has(this.selectedNode.gnx)) {
                this.showToast("Only one marked node.");
            } else {
                this.showToast("No other marked nodes found.");
            }
        }
    }

    private gotoPrevMarkedNode = () => {
        if (!this.selectedNode || this.marked.size === 0) {
            return;
        }

        const currentIndex = this.allNodesInOrder.findIndex(node => node === this.selectedNode);
        if (currentIndex === -1) {
            return; // Should never happen
        }

        let foundMarked = false;
        for (let i = 1; i <= this.allNodesInOrder.length; i++) {
            const prevIndex = (currentIndex - i + this.allNodesInOrder.length) % this.allNodesInOrder.length; // Wrap around
            const node = this.allNodesInOrder[prevIndex]!;

            if (node === this.selectedNode) {
                continue;
            }

            if (this.marked.has(node.gnx)) {
                this.selectAndOrToggleAndRedraw(node);
                foundMarked = true;
                break;
            }
        }

        if (!foundMarked) {
            if (this.marked.size === 1 && this.marked.has(this.selectedNode.gnx)) {
                this.showToast("Only one marked node.");
            } else {
                this.showToast("No other marked nodes found.");
            }
        }
    }

    // * Button states
    private updateMarkedButtonStates() {
        const hasMarkedNodes = this.marked.size > 0;
        this.NEXT_MARKED_BTN.disabled = !hasMarkedNodes;
        this.PREV_MARKED_BTN.disabled = !hasMarkedNodes;
    }

    private updateHoistButtonStates() {
        const isCurrentlyHoisted = this.hoistStack.length > 0 && this.hoistStack[this.hoistStack.length - 1] === this.selectedNode;
        this.DEHOIST_BTN.disabled = this.hoistStack.length === 0;
        this.HOIST_BTN.disabled = !this.selectedNode || !this.hasChildren(this.selectedNode) || isCurrentlyHoisted;
    }

    private updateHistoryButtonStates() {
        this.PREV_BTN.disabled = this.currentHistoryIndex <= 0;
        this.NEXT_BTN.disabled = this.currentHistoryIndex >= this.navigationHistory.length - 1 || this.navigationHistory.length === 0;
    }

    private updateContextMenuState() {
        const hasSelectedNode = !!this.selectedNode;
        const isCurrentlyHoisted = this.hoistStack.length > 0 && hasSelectedNode && this.hoistStack[this.hoistStack.length - 1] === this.selectedNode;
        this.toggleButtonVisibility(this.ACTION_MARK, null, hasSelectedNode && !this.marked.has(this.selectedNode!.gnx));
        this.toggleButtonVisibility(this.ACTION_UNMARK, null, hasSelectedNode && this.marked.has(this.selectedNode!.gnx));
        this.toggleButtonVisibility(this.ACTION_HOIST, null, hasSelectedNode && this.hasChildren(this.selectedNode!) && !isCurrentlyHoisted);
        this.toggleButtonVisibility(this.ACTION_DEHOIST, null, this.hoistStack.length > 0); // only check hoist stack length
    }

    private showTab(tabName: string) {
        // Set HTML_ELEMENT attributes. CSS rules will show/hide tabs based on these.
        this.HTML_ELEMENT.setAttribute('data-active-tab', tabName);
    }

    // * History
    private addToHistory(node: TreeNode) {
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

    private previousHistory = () => {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const node = this.navigationHistory[this.currentHistoryIndex];
            this.selectAndOrToggleAndRedraw(node); // Goto node without adding to history
            this.updateHistoryButtonStates();
        }
    }

    private nextHistory = () => {
        if (this.currentHistoryIndex < this.navigationHistory.length - 1) {
            this.currentHistoryIndex++;
            const node = this.navigationHistory[this.currentHistoryIndex];
            this.selectAndOrToggleAndRedraw(node); // Goto node without adding to history
            this.updateHistoryButtonStates();
        }
    }

    // * Rendering helpers
    private getCurrentRoot(): TreeNode {
        // Return the current top of the hoist stack or the main tree root
        return this.hoistStack.length > 0 ? this.hoistStack[this.hoistStack.length - 1]! : this.tree;
    }

    private flattenTree(
        node: TreeNode,
        depth = 0,
        isRoot = true,
        selectedNode: TreeNode | null,
        initialFindNode: TreeNode | null,
    ): FlatRow[] {
        const findScope = this.getFindScope();
        const flatRows: FlatRow[] = [];

        if (!isRoot && !this.isVisible(node)) {
            return flatRows; // Skip hidden nodes
        }

        if (!isRoot) {
            flatRows.push({
                label: this.data[node.gnx]!.headString || `Node ${node.gnx}`,
                depth: depth,
                toggled: false, // Reset each time
                hasChildren: this.hasChildren(node),
                isExpanded: this.isExpanded(node),
                node: node,
                // Computed display properties
                isSelected: node === selectedNode,
                isAncestor: selectedNode ? this.isAncestorOf(node, selectedNode) : false,
                isInitialFind: this.computeIsInitialFind(node, initialFindNode, this.selectedNode),
                icon: this.data[node.gnx]!.icon || 0
            });
        }

        if (this.isExpanded(node) || isRoot) {
            const children = this.children(node);
            for (const child of children) {
                flatRows.push(...this.flattenTree(child, depth + 1, false, selectedNode, initialFindNode));
            }
        }

        return flatRows;
    }

    private computeIsInitialFind(
        node: TreeNode,
        initialFindNode: TreeNode | null,
        selectedNode: TreeNode | null
    ): boolean {
        const findScope = this.getFindScope();
        if (findScope === 'node' && node === selectedNode) {
            return true;
        }
        if (findScope === 'suboutline' && initialFindNode) {
            return node === initialFindNode || this.isAncestorOf(initialFindNode, node);
        }
        return false;
    }

    private getFindScope(): string {
        let selectedRadioValue = '';
        const selectedRadio = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        if (selectedRadio) {
            selectedRadioValue = selectedRadio.value;
        }
        return selectedRadioValue;
    }

    private buildRowsRenderTree(): void {
        this.flatRows = this.flattenTree(this.getCurrentRoot(), 0, !this.hoistStack.length, this.selectedNode, this.initialFindNode);
        this.renderTree();
    }

    private selectAndOrToggleAndRedraw(newSelectedNode: TreeNode | null = null, nodeToToggle: TreeNode | null = null) {
        // Handle toggling if requested
        if (nodeToToggle) {
            if (this.isExpanded(nodeToToggle)) {
                this.expanded.delete(nodeToToggle);
            } else {
                this.expanded.add(nodeToToggle);
            }
            nodeToToggle.toggled = true; // Mark as toggled
        }

        const isNew = newSelectedNode && newSelectedNode !== this.selectedNode;

        // Handle selection if requested
        if (isNew) {
            let hoistTop = this.getCurrentRoot();

            // While the top of hoist stack is not an ancestor of the new selected node, pop it
            while (newSelectedNode !== hoistTop && this.hoistStack.length > 0 && !this.isAncestorOf(hoistTop, newSelectedNode)) {
                this.hoistStack.pop();
                hoistTop = this.getCurrentRoot();
            }

            // Ensure all parent nodes are expanded so the selected node is visible
            let currentNode = newSelectedNode;
            while (currentNode && currentNode.parent && currentNode !== hoistTop) {
                // Skip the hidden root node since it's always expanded (When hoist is implemented, stop at hoist root)
                if (currentNode.parent.parent) {
                    this.expanded.add(currentNode.parent);
                }
                currentNode = currentNode.parent;
            }

            this.selectedNode = newSelectedNode;
            this.addToHistory(newSelectedNode);
            this.updateHistoryButtonStates();
            this.updateButtonVisibility();
            this.updateHoistButtonStates();
            this.updateContextMenuState();
        }

        this.buildRowsRenderTree();

        // Update body pane if selection changed (selectedNode cannot be null here because of isNew check)
        if (isNew) {
            if (newSelectedNode && this.data[newSelectedNode.gnx]) {
                this.computeBody(newSelectedNode);
            } else {
                this.setBody("", true); // No node selected
            }
        }
        if (this.selectedNode) {
            this.scrollNodeIntoView(this.selectedNode);
        }
        this.updateCollapseAllPosition(); // In case the height made the scrollbar appear/disappear
    }

    private computeBody(node: TreeNode) {
        // Look for a line in the text starting with "@wrap" or "@nowrap",
        // if not found, check the parent of node recursively.
        // Note: wrap is default so only need to check for nowrap
        let currentNode = node;
        let nowrapFound = false;
        while (currentNode.parent) { // Make sure to stop at the hidden root node
            const body = this.data[currentNode.gnx]?.bodyString || "";
            const wrapMatch = body.match(/^\s*@wrap\s*$/m);
            const nowrapMatch = body.match(/^\s*@nowrap\s*$/m);
            if (wrapMatch) {
                break;  // Stop searching if @wrap (default) is found
            }
            if (nowrapMatch) {
                nowrapFound = true;
                break;  // Stop searching if @nowrap is found
            }
            currentNode = currentNode.parent;
        }
        let text = this.data[node.gnx]?.bodyString || "";
        text = text.replace(this.urlRegex, url => {
            return `<a href="${url}" target="_blank" contenteditable="plaintext-only" rel="noopener noreferrer">${url}</a>`;
        });
        this.setBody(text, !nowrapFound);
    }

    public setBody(text: string, wrap: boolean) {
        if (wrap) {
            this.BODY_PANE.style.whiteSpace = "pre-wrap"; // Wrap text
        } else {
            this.BODY_PANE.style.whiteSpace = "pre"; // No wrapping
        }
        this.BODY_PANE.innerHTML = text;
    }

    private scrollNodeIntoView(node: TreeNode) {
        if (!this.flatRows) return; // Not initialized yet

        const selectedIndex = this.flatRows.findIndex(row => row.node === node);
        if (selectedIndex === -1) return; // Not found (shouldn't happen)
        const nodePosition = selectedIndex * this.ROW_HEIGHT;

        const scrollTop = this.OUTLINE_PANE.scrollTop;
        const viewportHeight = this.OUTLINE_PANE.clientHeight;

        if (nodePosition < scrollTop) {
            this.OUTLINE_PANE.scrollTop = nodePosition;
        } else if (nodePosition + this.ROW_HEIGHT > scrollTop + viewportHeight) {
            this.OUTLINE_PANE.scrollTop = nodePosition - viewportHeight + this.ROW_HEIGHT;
        }
    }

    private renderTree = () => {
        if (!this.flatRows) {
            return; // Not initialized yet
        }

        // Render visible rows only
        const scrollTop = this.OUTLINE_PANE.scrollTop;
        const viewportHeight = this.OUTLINE_PANE.clientHeight;
        const viewportWidth = this.OUTLINE_PANE.clientWidth;

        const startIndex = Math.floor(scrollTop / this.ROW_HEIGHT);
        const visibleCount = Math.ceil(viewportHeight / this.ROW_HEIGHT) + 1;
        const endIndex = Math.min(this.flatRows.length, startIndex + visibleCount);
        let leftOffset = this.LEFT_OFFSET;

        // If all nodes have no children, remove the left offset
        if (this.flatRows.every(row => !row.hasChildren)) {
            leftOffset = 0;
        }

        this.SPACER.innerHTML = "";
        this.SPACER.style.height = this.flatRows.length * this.ROW_HEIGHT + "px";

        let selectedRadioValue = ''; // Falsy for now
        const selectedRadio = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        if (selectedRadio) {
            selectedRadioValue = selectedRadio.value;
        }

        const searchSuboutline = selectedRadioValue === 'suboutline' && this.initialFindNode; // Will contain the node or null
        const searchNodeOnly = selectedRadioValue === 'node'; // selected node only

        for (let i = startIndex; i < endIndex; i++) {
            const row = this.flatRows[i]!;
            const div = document.createElement("div");
            div.className = "node";
            if (row.label) {
                div.title = row.label;
            }

            if (row.node === this.selectedNode) {
                div.classList.add("selected");
            } else if (this.selectedNode && this.isAncestorOf(row.node, this.selectedNode)) {
                div.classList.add("ancestor");
            }

            if (searchNodeOnly && row.node === this.selectedNode) {
                div.classList.add("initial-find");
            }

            if (searchSuboutline && (row.node === searchSuboutline || this.isAncestorOf(searchSuboutline, row.node))) {
                div.classList.add("initial-find");
            }

            div.style.top = (i * this.ROW_HEIGHT) + "px";
            div.style.height = this.ROW_HEIGHT + "px";

            const leftPosition = (row.depth * 20) + leftOffset;
            div.style.left = leftPosition + "px";
            div.style.width = (viewportWidth - leftPosition) + "px";

            const caret = document.createElement("span");
            caret.className = row.toggled ? "caret toggled" : "caret";

            row.toggled = false; // Reset toggled state after rendering

            if (row.hasChildren) {
                caret.setAttribute("data-expanded", row.isExpanded ? "true" : "false");
            }
            div.appendChild(caret);

            const labelSpan = document.createElement("span");
            labelSpan.className = "node-text";

            // If dark mode, invert the icons' 4 bit to swap dirty borders inverted
            if (this.currentTheme === 'dark') {
                let invertedIcon = this.data[row.node.gnx]!.icon! ^ 8; // Toggle the 4 bit
                labelSpan.classList.add("icon" + invertedIcon);
            } else {
                labelSpan.classList.add("icon" + (this.data[row.node.gnx]!.icon || 0));
            }

            labelSpan.textContent = row.label;
            if (row.node === this.selectedNode) {
                this.selectedLabelElement = labelSpan;
            }

            div.appendChild(labelSpan);
            this.SPACER.appendChild(div);
        }
    }

    private showToast(message: string, duration = 2000) {
        if (!this.TOAST) return;
        this.TOAST.textContent = message;
        this.TOAST.hidden = false;
        // Force reflow so the transition always runs when toggling
        void this.TOAST.offsetWidth;
        this.TOAST.classList.add('show');
        if (this.__toastTimer) {
            clearTimeout(this.__toastTimer);
        }
        this.__toastTimer = setTimeout(() => {
            this.TOAST.classList.remove('show');
            setTimeout(() => { this.TOAST.hidden = true; }, 220);
            this.__toastTimer = null;
        }, duration);
    }

    private updateProportion() {
        if (this.currentLayout === 'vertical') {
            this.mainRatio = this.OUTLINE_FIND_CONTAINER.offsetWidth / window.innerWidth;
        } else {
            this.mainRatio = this.OUTLINE_FIND_CONTAINER.offsetHeight / this.MAIN_CONTAINER.offsetHeight;
        }
    }

    private updateOutlineContainerSize() {
        if (this.currentLayout === 'vertical') {
            let newWidth = window.innerWidth * this.mainRatio;
            if (newWidth < this.minWidth) {
                newWidth = this.minWidth;
            }
            this.OUTLINE_FIND_CONTAINER.style.width = `${newWidth}px`;
            this.OUTLINE_FIND_CONTAINER.style.height = '100%';
        } else {
            let newHeight = this.MAIN_CONTAINER.offsetHeight * this.mainRatio;
            if (newHeight < this.minWidth) {
                newHeight = this.minWidth;
            }
            this.OUTLINE_FIND_CONTAINER.style.height = `${newHeight}px`;
            this.OUTLINE_FIND_CONTAINER.style.width = '100%';
        }
    }

    private handleDrag = utils.throttle((e) => {
        if (this.currentLayout === 'vertical') {
            let clientX = e.clientX;
            if (e.touches) {
                clientX = e.touches[0].clientX;
            }
            const newWidth = clientX;
            if (newWidth >= this.minWidth) {
                this.OUTLINE_FIND_CONTAINER.style.width = (newWidth - 3) + 'px';
            } else {
                this.OUTLINE_FIND_CONTAINER.style.width = (this.minWidth - 3) + 'px';
            }
        } else {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const newHeight = clientY - this.TOP_MENU_TOGGLE.offsetHeight;
            if (newHeight >= this.minWidth) {
                this.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                this.OUTLINE_FIND_CONTAINER.style.height = (this.minWidth - 3) + 'px';
            }
            this.renderTree(); // Resizing vertically, so need to re-render tree
        }
        this.positionCrossDragger();
        this.updateCollapseAllPosition();
    }, 33);

    private startDrag = (e: Event) => {
        this.isDragging = true;
        document.body.classList.add('dragging-main');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('touchmove', this.handleDrag, { passive: false });
        document.addEventListener('touchend', this.stopDrag);
    }

    private stopDrag = () => {
        if (this.isDragging) {
            this.isDragging = false;
            document.body.classList.remove('dragging-main');
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.stopDrag);
            document.removeEventListener('touchmove', this.handleDrag);
            document.removeEventListener('touchend', this.stopDrag);
            this.updateProportion();
            this.renderTree();
        }
    }

    private updateSecondaryProportion() {
        if (this.currentLayout === 'vertical') {
            this.secondaryRatio = (this.OUTLINE_PANE.offsetHeight - 6) / this.OUTLINE_FIND_CONTAINER.offsetHeight;
        } else {
            this.secondaryRatio = this.OUTLINE_PANE.offsetWidth / this.OUTLINE_FIND_CONTAINER.offsetWidth;
        }
    }

    private updateOutlinePaneSize() {
        if (this.currentLayout === 'vertical') {
            const containerHeight = this.OUTLINE_FIND_CONTAINER.offsetHeight;
            let newHeight = containerHeight * this.secondaryRatio;
            if (newHeight < this.minHeight) {
                newHeight = this.minHeight; // Respect minimum heights
            } else if (newHeight > containerHeight - this.minHeight) {
                newHeight = containerHeight - this.minHeight;
            }
            this.OUTLINE_PANE.style.flex = `0 0 ${newHeight}px`;
        } else {
            const containerWidth = this.OUTLINE_FIND_CONTAINER.offsetWidth;
            let newWidth = containerWidth * this.secondaryRatio;
            if (newWidth < this.minHeight) {
                newWidth = this.minHeight; // Respect minimum widths
            } else if (newWidth > containerWidth - this.minHeight) {
                newWidth = containerWidth - this.minHeight;
            }
            this.OUTLINE_PANE.style.flex = `0 0 ${newWidth}px`;
        }
        this.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
        this.updateCollapseAllPosition();
    }

    private updateCollapseAllPosition() {
        this.COLLAPSE_ALL_BTN.style.inset = `${this.isMenuShown ? 58 : 5}px auto auto ${this.OUTLINE_PANE.clientWidth - 18}px`;
    }

    private handleSecondaryDrag = utils.throttle((e) => {
        if (this.currentLayout === 'vertical') {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const containerRect = this.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeY = clientY - containerRect.top;
            const containerHeight = this.OUTLINE_FIND_CONTAINER.offsetHeight;
            if (relativeY >= this.minHeight && relativeY <= containerHeight - this.minHeight) {
                this.OUTLINE_PANE.style.flex = `0 0 ${relativeY - 8}px`;
                this.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
            this.renderTree(); // Resizing vertically, so need to re-render tree
        } else {
            let clientX = e.clientX;
            if (e.touches) {
                clientX = e.touches[0].clientX;
            }
            const containerRect = this.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;
            const containerWidth = this.OUTLINE_FIND_CONTAINER.offsetWidth;
            if (relativeX >= this.minHeight && relativeX <= containerWidth - this.minHeight) {
                this.OUTLINE_PANE.style.flex = `0 0 ${relativeX - 3}px`;
                this.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        }
        this.positionCrossDragger();
        this.updateCollapseAllPosition();
    }, 33);

    private startSecondaryDrag = (e: Event) => {
        this.secondaryIsDragging = true;
        document.body.classList.add('dragging-secondary');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleSecondaryDrag);
        document.addEventListener('mouseup', this.stopSecondaryDrag);
        document.addEventListener('touchmove', this.handleSecondaryDrag, { passive: false });
        document.addEventListener('touchend', this.stopSecondaryDrag);
    }

    private stopSecondaryDrag = () => {
        if (this.secondaryIsDragging) {
            this.secondaryIsDragging = false;
            document.body.classList.remove('dragging-secondary');
            document.removeEventListener('mousemove', this.handleSecondaryDrag);
            document.removeEventListener('mouseup', this.stopSecondaryDrag);
            document.removeEventListener('touchmove', this.handleSecondaryDrag);
            document.removeEventListener('touchend', this.stopSecondaryDrag);
            this.updateSecondaryProportion();
            this.renderTree();
        }
    }

    private handleCrossDrag = utils.throttle((e) => {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (this.currentLayout === 'vertical') {
            // Handle cross drag when in vertical layout

            // do main first as per handleDrag
            const newWidth = clientX;
            if (newWidth >= this.minWidth) {
                this.OUTLINE_FIND_CONTAINER.style.width = (newWidth - 3) + 'px';
            } else {
                this.OUTLINE_FIND_CONTAINER.style.width = (this.minWidth - 3) + 'px';
            }
            // then secondary as per handleSecondaryDrag
            const containerRect = this.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeY = clientY - containerRect.top;
            const containerHeight = this.OUTLINE_FIND_CONTAINER.offsetHeight;
            if (relativeY >= this.minHeight && relativeY <= containerHeight - this.minHeight) {
                this.OUTLINE_PANE.style.flex = `0 0 ${relativeY - 8}px`;
                this.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        } else {
            // Handle cross drag when in horizontal layout

            // do main first as per handleDrag
            const newHeight = clientY - this.TOP_MENU_TOGGLE.offsetHeight;
            if (newHeight >= this.minWidth) {
                this.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                this.OUTLINE_FIND_CONTAINER.style.height = (this.minWidth - 3) + 'px';
            }
            // then secondary as per handleSecondaryDrag
            const containerRect = this.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;
            const containerWidth = this.OUTLINE_FIND_CONTAINER.offsetWidth;
            if (relativeX >= this.minHeight && relativeX <= containerWidth - this.minHeight) {
                this.OUTLINE_PANE.style.flex = `0 0 ${relativeX - 3}px`;
                this.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        }
        this.positionCrossDragger();

        this.renderTree(); // Render afterward as it would be in each branch of the if/else
        this.updateCollapseAllPosition();
    }, 33);

    private startCrossDrag = (e: Event) => {
        this.crossIsDragging = true;
        document.body.classList.add('dragging-cross');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleCrossDrag);
        document.addEventListener('mouseup', this.stopCrossDrag);
        document.addEventListener('touchmove', this.handleCrossDrag, { passive: false });
        document.addEventListener('touchend', this.stopCrossDrag);

    }

    private stopCrossDrag = () => {
        if (this.crossIsDragging) {
            this.crossIsDragging = false;
            document.body.classList.remove('dragging-cross');
            document.removeEventListener('mousemove', this.handleCrossDrag);
            document.removeEventListener('mouseup', this.stopCrossDrag);
            document.removeEventListener('touchmove', this.handleCrossDrag);
            document.removeEventListener('touchend', this.stopCrossDrag);

            this.updateProportion();
            this.updateSecondaryProportion();

            this.renderTree();
        }
    }

    private positionCrossDragger() {
        if (this.currentLayout === 'vertical') {
            const outlineWidth = this.OUTLINE_FIND_CONTAINER.offsetWidth;
            const paneHeight = this.OUTLINE_PANE.offsetHeight + this.TOP_MENU_TOGGLE.offsetHeight;
            this.CROSS_RESIZER.style.top = (paneHeight) + 'px';
            this.CROSS_RESIZER.style.left = (outlineWidth) + 'px';
        } else {
            const outlineHeight = this.OUTLINE_FIND_CONTAINER.offsetHeight + this.TOP_MENU_TOGGLE.offsetHeight;
            const paneWidth = this.OUTLINE_PANE.offsetWidth;
            this.CROSS_RESIZER.style.left = (paneWidth) + 'px';
            this.CROSS_RESIZER.style.top = (outlineHeight) + 'px';
        }

    }

    private updatePanelSizes() {
        this.updateOutlineContainerSize();
        this.updateOutlinePaneSize();
        this.positionCrossDragger();
    }

    private closeMenusEvent(e: MouseEvent) {
        this.MENU.style.display = "none";
        const target = e.target as Element;
        if (!target.closest('.menu')) {
            this.closeAllSubmenus();
            this.activeTopMenu = null;
        }
    }

    private applyTheme(theme: string) {
        this.currentTheme = theme;
        this.HTML_ELEMENT.setAttribute('data-theme', theme);
        this.THEME_TOGGLE.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        this.THEME_ICON.innerHTML = theme === 'dark' ? '🌙' : '☀️';
    };

    private applyLayout(layout: string) {
        this.currentLayout = layout;
        this.LAYOUT_TOGGLE.title = layout === 'vertical' ? 'Switch to horizontal layout' : 'Switch to vertical layout';
        if (layout === 'horizontal') {
            this.HTML_ELEMENT.setAttribute('data-layout', 'horizontal');
        } else {
            this.HTML_ELEMENT.setAttribute('data-layout', 'vertical');
        }
        this.updatePanelSizes(); // Proportions will have changed so we must update sizes
    };

    private restoreLastFocusedElement() {
        if (this.lastFocusedElement && this.lastFocusedElement.focus) {
            // also check if visible by checking its size
            const rect = this.lastFocusedElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.lastFocusedElement.focus();
            }
        }
    }

    // Setup and organize all event handlers
    private setupEventHandlers() {
        this.setupOutlinePaneHandlers();
        this.setupBodyPaneHandlers();
        this.setupResizerHandlers();
        this.setupWindowHandlers();
        this.setupButtonHandlers();
        this.setupFindPaneHandlers();
        this.setupConfigCheckboxes();
        this.setupTopMenuHandlers();
    }

    private setupOutlinePaneHandlers() {
        this.OUTLINE_PANE.addEventListener("mousedown", this.handleOutlinePaneMouseDown);
        this.OUTLINE_PANE.addEventListener('click', this.handleOutlinePaneClick);
        this.OUTLINE_PANE.addEventListener('dblclick', this.handleOutlinePaneDblClick);
        this.OUTLINE_PANE.addEventListener('keydown', this.handleOutlinePaneKeyDown);
        this.OUTLINE_PANE.addEventListener("scroll", utils.throttle(this.renderTree, 33));
        this.OUTLINE_PANE.addEventListener("contextmenu", this.handleContextMenu);
        document.addEventListener("click", (e) => {
            this.closeMenusEvent(e);
        });
    }

    private setupBodyPaneHandlers() {
        this.BODY_PANE.addEventListener('keydown', this.handleBodyPaneKeyDown);
        this.BODY_PANE.addEventListener("beforeinput", utils.preventDefault); // Block text changes
        this.BODY_PANE.addEventListener("paste", utils.preventDefault); // Block text changes

    }

    private setupResizerHandlers() {
        this.VERTICAL_RESIZER.addEventListener('mousedown', this.startDrag);
        this.VERTICAL_RESIZER.addEventListener('touchstart', this.startDrag);
        this.HORIZONTAL_RESIZER.addEventListener('mousedown', this.startSecondaryDrag);
        this.HORIZONTAL_RESIZER.addEventListener('touchstart', this.startSecondaryDrag);
        this.CROSS_RESIZER.addEventListener('mousedown', this.startCrossDrag);
        this.CROSS_RESIZER.addEventListener('touchstart', this.startCrossDrag);
    }

    private setupWindowHandlers() {
        window.addEventListener('resize', utils.throttle(this.handleWindowResize, 33));
        window.addEventListener('keydown', this.handleGlobalKeyDown);
        window.addEventListener('beforeunload', this.saveAll);
    }

    private setupButtonHandlers() {
        this.COLLAPSE_ALL_BTN.addEventListener('click', this.collapseAll);
        this.THEME_TOGGLE.addEventListener('click', this.handleThemeToggleClick);
        this.LAYOUT_TOGGLE.addEventListener('click', this.handleLayoutToggleClick);
        this.MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        this.TOP_MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        this.HOIST_BTN.addEventListener('click', this.hoistNode);
        this.DEHOIST_BTN.addEventListener('click', this.dehoistNode);
        this.PREV_BTN.addEventListener('click', this.previousHistory);
        this.NEXT_BTN.addEventListener('click', this.nextHistory);
        this.TOGGLE_MARK_BTN.addEventListener('click', this.toggleMarkCurrentNode);
        this.NEXT_MARKED_BTN.addEventListener('click', this.gotoNextMarkedNode);
        this.PREV_MARKED_BTN.addEventListener('click', this.gotoPrevMarkedNode);

        this.LOG_TAB.addEventListener('click', () => { this.showTab("log") });
        this.FIND_TAB.addEventListener('click', () => { this.showTab("find") });
        this.UNDO_TAB.addEventListener('click', () => { this.showTab("undo") });
        this.SETTINGS_TAB.addEventListener('click', () => { this.showTab("settings") });

        this.ACTION_MARK.addEventListener('click', this.toggleMarkCurrentNode);
        this.ACTION_UNMARK.addEventListener('click', this.toggleMarkCurrentNode); // Same action
        this.ACTION_HOIST.addEventListener('click', this.hoistNode);
        this.ACTION_DEHOIST.addEventListener('click', this.dehoistNode);
    }

    private setupFindPaneHandlers() {
        this.FIND_INPUT.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.OPT_BODY.focus();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                this.findNext();
            }
        });
        this.OPT_BODY.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.FIND_INPUT.focus();
            }
        });
        const findScopeRadios = document.querySelectorAll('input[name="find-scope"]');
        findScopeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.initialFindNode = null; // Reset initial find node when scope changes
                this.renderTree(); // Re-render to update node highlighting
            });
        });
    }

    private setupButtonFocusPrevention() {
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        });
        this.TOP_MENU_TOGGLE.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }

    private setupLastFocusedElementTracking() {
        const focusableElements = [this.OUTLINE_PANE, this.BODY_PANE];
        // All elements that also need to be tracked for focus are 'input' elements inside the outline/find container
        const allInputs = this.OUTLINE_FIND_CONTAINER.querySelectorAll<HTMLElement>('input');
        allInputs.forEach(input => {
            focusableElements.push(input);
        });

        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                this.lastFocusedElement = element;
            });
        });
    }

    private setupConfigCheckboxes() {
        this.SHOW_PREV_NEXT_MARK.addEventListener('change', this.updateButtonVisibility);
        this.SHOW_TOGGLE_MARK.addEventListener('change', this.updateButtonVisibility);
        this.SHOW_PREV_NEXT_HISTORY.addEventListener('change', this.updateButtonVisibility);
        this.SHOW_HOIST_DEHOIST.addEventListener('change', this.updateButtonVisibility);
        this.SHOW_LAYOUT_ORIENTATION.addEventListener('change', this.updateButtonVisibility);
        this.SHOW_THEME_TOGGLE.addEventListener('change', this.updateButtonVisibility);
        this.SHOW_NODE_ICONS.addEventListener('change', this.updateNodeIcons);
        this.SHOW_COLLAPSE_ALL.addEventListener('change', this.updateButtonVisibility);
    }

    private setupTopMenuHandlers() {
        document.addEventListener("keydown", (e) => {
            if (!this.activeTopMenu) return;

            const topItems = this.topLevelItems;
            const topIndex = topItems.indexOf(this.activeTopMenu);
            if (topIndex === -1) return;

            let openSubmenu = this.focusedMenuItem
                ? this.focusedMenuItem.closest(".submenu")
                : this.topLevelSubmenus.get(this.activeTopMenu);

            if (!openSubmenu) return;

            // Handle top-level navigation
            if (!this.focusedMenuItem || !openSubmenu.contains(this.focusedMenuItem)) {
                switch (e.key) {
                    case "ArrowRight":
                        e.preventDefault();
                        const nextTop = topItems[(topIndex + 1) % topItems.length];
                        const nextSub = this.topLevelSubmenus.get(nextTop);
                        if (nextTop && nextSub) {
                            this.openTopMenu(nextTop, nextSub, 0);
                            this.focusMenuItem(nextSub.querySelector(".menu-item"));
                        }
                        return;
                    case "ArrowLeft":
                        e.preventDefault();
                        const prevTop = topItems[(topIndex - 1 + topItems.length) % topItems.length];
                        const prevSub = this.topLevelSubmenus.get(prevTop);
                        if (prevTop && prevSub) {
                            this.openTopMenu(prevTop, prevSub, 0);
                            this.focusMenuItem(prevSub.querySelector(".menu-item"));
                        }
                        return;
                    case "ArrowDown":
                        e.preventDefault();
                        const currentSub = this.topLevelSubmenus.get(this.activeTopMenu);
                        if (currentSub) {
                            const firstItem = currentSub.querySelector(".menu-item");
                            if (firstItem) this.focusMenuItem(firstItem);
                        }
                        return;
                    case "Escape":
                        e.preventDefault();
                        this.closeAllSubmenus();
                        this.activeTopMenu = null;
                        this.restoreLastFocusedElement();
                        return;
                }
                return; // stop here if we just handled top-level
            }

            // Handle submenu navigation
            const items: HTMLDivElement[] = Array.from(openSubmenu.querySelectorAll(":scope > .menu-item"));
            const index = this.focusedMenuItem ? items.indexOf(this.focusedMenuItem) : -1;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    if (index < items.length - 1) {
                        this.focusMenuItem(items[index + 1]!);
                    } else {
                        this.focusMenuItem(items[0]!); // Wrap to first item
                    }
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    if (index > 0) {
                        this.focusMenuItem(items[index - 1]!);
                    } else {
                        this.focusMenuItem(items[items.length - 1]!); // Wrap to last item
                    }
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    if (this.focusedMenuItem?.classList.contains("has-sub")) {
                        const sub: HTMLElement | null = this.focusedMenuItem.querySelector(":scope > .submenu");
                        if (sub) {
                            this.positionSubmenu(this.focusedMenuItem, sub, 1);
                            sub.classList.add("visible");
                            this.focusMenuItem(sub.querySelector(".menu-item"));
                        }
                    } else {
                        const nextTop = topItems[(topIndex + 1) % topItems.length];
                        const nextSub = this.topLevelSubmenus.get(nextTop);
                        if (nextTop && nextSub) {
                            this.openTopMenu(nextTop, nextSub, 0);
                            this.focusMenuItem(nextSub.querySelector(".menu-item"));
                        }
                    }
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    const parentMenu: HTMLElement | null = this.focusedMenuItem.closest(".submenu")!;
                    const parentItem: HTMLDivElement | null = parentMenu?.parentElement?.closest(".menu-item")!;

                    if (parentItem) {
                        parentMenu.classList.remove("visible");
                        this.focusMenuItem(parentItem);
                    } else {
                        const prevTop = topItems[(topIndex - 1 + topItems.length) % topItems.length];
                        const prevSub = this.topLevelSubmenus.get(prevTop);
                        if (prevTop && prevSub) {
                            this.openTopMenu(prevTop, prevSub, 0);
                            this.focusMenuItem(prevSub.querySelector(".menu-item"));
                        }
                    }
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (this.focusedMenuItem?.classList.contains("has-sub")) {
                        const sub: HTMLElement | null = this.focusedMenuItem.querySelector(":scope > .submenu");
                        if (sub) {
                            this.positionSubmenu(this.focusedMenuItem, sub, 1);
                            sub.classList.add("visible");
                            this.focusMenuItem(sub.querySelector(".menu-item"));
                            return;
                        }
                    }
                    this.focusedMenuItem?.click();
                    break;
                case "Escape":
                    e.preventDefault();
                    this.closeAllSubmenus();
                    this.activeTopMenu = null;
                    this.restoreLastFocusedElement();
                    break;
            }
        });

    }

    private setupButtonContainerAutoHide() {
        let hideTimeout: ReturnType<typeof setTimeout>;
        const showButtons = () => {
            clearTimeout(hideTimeout);
            if (this.isMenuShown) {
                return;
            }
            this.BUTTON_CONTAINER.classList.remove('hidden');
        }

        const hideButtons = () => {
            hideTimeout = setTimeout(() => {
                this.BUTTON_CONTAINER.classList.add('hidden');
            }, 1000);
        };
        this.TRIGGER_AREA.addEventListener('mouseenter', showButtons);
        this.BUTTON_CONTAINER.addEventListener('mouseenter', showButtons);
        this.TRIGGER_AREA.addEventListener('mouseleave', (e) => {
            if (!this.BUTTON_CONTAINER.contains(e.relatedTarget as Node | null)) {
                hideButtons();
            }
        });
        this.BUTTON_CONTAINER.addEventListener('mouseleave', (e) => {
            if (e.relatedTarget !== this.TRIGGER_AREA) {
                hideButtons();
            }
        });
        showButtons();
        hideTimeout = setTimeout(() => {
            this.BUTTON_CONTAINER.classList.add('hidden');
        }, 1500);
    }

    private handleOutlinePaneMouseDown = (e: MouseEvent) => {
        if (e.detail === 2) {
            e.preventDefault(); // Prevent text selection on double-click
        }
    }

    private handleOutlinePaneClick = (event: MouseEvent) => {
        const target = event.target as Element;
        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl) {
            return;
        }

        const rowIndex = Math.floor(parseInt(nodeEl.style.top) / this.ROW_HEIGHT);
        if (rowIndex < 0 || rowIndex >= this.flatRows!.length) return;

        const row = this.flatRows![rowIndex]!;

        // Handle different click targets
        if (target.classList.contains('caret') && row.hasChildren) {
            event.stopPropagation();
            this.closeMenusEvent(event);
            // Both toggle and select in one operation
            this.selectAndOrToggleAndRedraw(
                row.node !== this.selectedNode ? row.node : null,
                row.node
            );
        } else {
            // Rest of the node (including icon and text)
            event.stopPropagation();
            this.closeMenusEvent(event);
            if (row.node !== this.selectedNode) {
                this.selectAndOrToggleAndRedraw(row.node); // Just selection
            }
        }
    }

    private handleOutlinePaneDblClick = (event: MouseEvent) => {
        const target = event.target as Element;

        if (target.classList.contains('node-text')) {
            event.preventDefault();
            event.stopPropagation();

            const nodeEl = target.closest('.node') as HTMLElement | null;
            if (!nodeEl) return;

            const rowIndex = Math.floor(parseInt(nodeEl.style.top) / this.ROW_HEIGHT);
            if (rowIndex >= 0 && rowIndex < this.flatRows!.length) {
                const row = this.flatRows![rowIndex]!;
                if (row.hasChildren) {
                    // Handle both selection and toggle in one update
                    this.selectAndOrToggleAndRedraw(
                        row.node !== this.selectedNode ? row.node : null,
                        row.node
                    );
                }
            }
        }
    }

    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const target = e.target as Element;

        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl) {
            // close possible existing right-click menu
            this.MENU.style.display = 'none';
            return;
        }

        const rowIndex = Math.floor(parseInt(nodeEl.style.top) / this.ROW_HEIGHT);
        if (rowIndex < 0 || rowIndex >= this.flatRows!.length) return;
        const row = this.flatRows![rowIndex]!;

        // Select the node if not already selected
        if (row.isSelected === false) {
            this.selectAndOrToggleAndRedraw(row.node);
        }

        console.log('Context menu on node:', row.node);

        // Position and show the custom context menu
        this.MENU.style.top = `${e.clientY}px`;
        this.MENU.style.left = `${e.clientX}px`;
        this.MENU.style.display = 'block';
    }

    private handleOutlinePaneKeyDown = (e: KeyboardEvent) => {
        const handler: (() => void) | undefined = this.outlinePaneKeyMap[e.key as keyof typeof this.outlinePaneKeyMap];
        if (handler && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            handler();
        }
    }

    private handleBodyPaneKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.OUTLINE_PANE.focus();
        }
    }

    // Global key handlers (work anywhere)
    private handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'f' && e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.startFind();
        } else if (e.key.toLowerCase() === 'm' && e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.toggleMarkCurrentNode();
        } else if (e.key === 'F2') {
            e.preventDefault();
            this.findPrevious();
        } else if (e.key === 'F3') {
            e.preventDefault();
            this.findNext();
        } else if (e.key === '-' && e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.collapseAll();
        } else if (e.altKey && !e.ctrlKey && !e.metaKey) {
            // Handle Alt+Arrow keys globally
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.OUTLINE_PANE.focus();
                    this.selectVisBack();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.OUTLINE_PANE.focus();
                    this.selectVisNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.OUTLINE_PANE.focus();
                    this.contractNodeOrGoToParent();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.OUTLINE_PANE.focus();
                    this.expandNodeAndGoToFirstChild();
                    break;
            }
        }
    }

    private handleWindowResize = () => {
        this.updatePanelSizes();
        this.renderTree();
    }

    public handleDOMContentLoaded() {
        this.OUTLINE_FIND_CONTAINER.style.visibility = 'visible';
        this.loadConfigPreferences();

        const initialSelectedNode = this.loadDocumentStateFromLocalStorage();
        if (!initialSelectedNode) {
            this.selectAndOrToggleAndRedraw(this.tree.children![0]); // sets selectedNode amd flatRows
        } else {
            this.selectAndOrToggleAndRedraw(initialSelectedNode); // sets selectedNode amd flatRows
        }
        this.setupButtonContainerAutoHide();
        this.updateMarkedButtonStates();
        // Finish startup by setting focus to outline pane and setting the log pane's active tab
        this.OUTLINE_PANE.focus();
        this.showTab("log");
    }

    private handleThemeToggleClick = () => {
        // Only animate once button pressed, so page-load wont animate color changes.
        this.HTML_ELEMENT.setAttribute('data-transition', 'true');
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.renderTree(); // Re-render to update icon colors
    }

    private handleLayoutToggleClick = () => {
        this.HTML_ELEMENT.setAttribute('data-transition', 'true');
        const newLayout = this.currentLayout === 'vertical' ? 'horizontal' : 'vertical';
        this.applyLayout(newLayout);
        if (this.flatRows) {
            this.renderTree();
        }
    }

    private handleMenuToggleClick = () => {
        this.isMenuShown = !this.isMenuShown;
        this.HTML_ELEMENT.setAttribute('data-show-menu', this.isMenuShown ? 'true' : 'false');
        if (this.isMenuShown) {
            this.BUTTON_CONTAINER.classList.add('hidden');
        } else {
            this.BUTTON_CONTAINER.classList.remove('hidden');
            // Set focus on last focused element
            this.restoreLastFocusedElement();
        }
        this.updateOutlinePaneSize();
        this.updateOutlineContainerSize();
        this.positionCrossDragger();
    }

    private updateButtonVisibility = () => {
        this.toggleButtonVisibility(this.NEXT_MARKED_BTN, this.PREV_MARKED_BTN, this.SHOW_PREV_NEXT_MARK.checked && this.marked.size > 0);
        this.toggleButtonVisibility(this.TOGGLE_MARK_BTN, null, this.SHOW_TOGGLE_MARK.checked);
        this.toggleButtonVisibility(this.NEXT_BTN, this.PREV_BTN, this.SHOW_PREV_NEXT_HISTORY.checked && this.navigationHistory.length > 1);
        this.toggleButtonVisibility(this.HOIST_BTN, this.DEHOIST_BTN, this.SHOW_HOIST_DEHOIST.checked);
        this.toggleButtonVisibility(this.LAYOUT_TOGGLE, null, this.SHOW_LAYOUT_ORIENTATION.checked);
        this.toggleButtonVisibility(this.THEME_TOGGLE, null, this.SHOW_THEME_TOGGLE.checked);
        this.toggleButtonVisibility(this.COLLAPSE_ALL_BTN, null, this.SHOW_COLLAPSE_ALL.checked);
        let visibleButtonCount = 0; // Count visible buttons to adjust trigger area width
        if (this.SHOW_PREV_NEXT_MARK.checked && this.marked.size > 0) {
            visibleButtonCount += 2;
        }
        if (this.SHOW_TOGGLE_MARK.checked) {
            visibleButtonCount += 1;
        }
        if (this.SHOW_PREV_NEXT_HISTORY.checked && this.navigationHistory.length > 1) {
            visibleButtonCount += 2;
        }
        if (this.SHOW_HOIST_DEHOIST.checked) {
            visibleButtonCount += 2;
        }
        if (this.SHOW_LAYOUT_ORIENTATION.checked) {
            visibleButtonCount += 1;
        }
        if (this.SHOW_THEME_TOGGLE.checked) {
            visibleButtonCount += 1;
        }
        this.TRIGGER_AREA.style.width = ((visibleButtonCount * 40) + 10) + 'px';
    }

    private updateNodeIcons = () => {
        this.HTML_ELEMENT.setAttribute('data-show-icons', this.SHOW_NODE_ICONS.checked ? 'true' : 'false');
        this.renderTree(); // Re-render to apply icon changes
    }

    private toggleButtonVisibility(button1: HTMLElement | null, button2: HTMLElement | null, isVisible: boolean) {
        if (button1) {
            button1.classList.toggle('hidden-button', !isVisible);
        }
        if (button2) {
            button2.classList.toggle('hidden-button', !isVisible);
        }
    }

    private openTopMenu(item: HTMLDivElement, sub: HTMLElement | null, level: number) {
        this.closeAllSubmenus();
        this.activeTopMenu = item;
        const targetSubmenu = sub || this.topLevelSubmenus.get(item);
        if (!targetSubmenu) return;
        this.positionSubmenu(item, targetSubmenu, level);
        targetSubmenu.classList.add("visible");
        item.classList.add("active");
        this.focusedMenuItem = null;
    }

    private positionSubmenu(parentItem: HTMLDivElement, submenu: HTMLElement, level: number) {
        submenu.style.display = "flex";
        const rect = parentItem.getBoundingClientRect();
        const subRect = submenu.getBoundingClientRect();

        if (level === 0) {
            submenu.style.left = rect.left + "px";
            submenu.style.top = rect.bottom + "px";
        } else {
            const spaceRight = window.innerWidth - rect.right;
            const spaceLeft = rect.left;
            if (spaceRight < subRect.width && spaceLeft > subRect.width) {
                submenu.style.left = -subRect.width + "px";
            } else {
                submenu.style.left = rect.width + "px";
            }
            submenu.style.top = "0px";
        }
        submenu.style.display = "";
    }

    private closeAllSubmenus() {
        document.querySelectorAll(".submenu.visible").forEach(sub =>
            sub.classList.remove("visible")
        );
        document.querySelectorAll(".menu-item.active").forEach(item =>
            item.classList.remove("active")
        );
        document.querySelectorAll(".menu-item.focused").forEach(item =>
            item.classList.remove("focused")
        );
        document.querySelectorAll(".menu-item.sub-active").forEach(item =>
            item.classList.remove("sub-active")
        );
        this.focusedMenuItem = null;
    }

    private focusMenuItem(item: HTMLDivElement | null) {
        if (!item) return; // Safety check
        if (this.focusedMenuItem) this.focusedMenuItem.classList.remove("focused");
        item.classList.add("focused");
        this.focusedMenuItem = item;
        item.scrollIntoView({ block: "nearest" });
        document.querySelectorAll(".menu-item.sub-active").forEach(el =>
            el.classList.remove("sub-active")
        );
        let ancestor = item.parentElement?.closest(".menu-item");
        while (ancestor) {
            ancestor.classList.add("sub-active");
            ancestor = ancestor.parentElement?.closest(".submenu")?.parentElement?.closest(".menu-item");
        }
    }

    private saveAll = () => {
        this.saveLayoutPreferences();
        this.saveConfigPreferences();
        this.saveDocumentStateToLocalStorage();
    }

    private saveDocumentStateToLocalStorage() {
        // Use the allNodesInOrder tree, the full list from the top as if all nodes were expanded,
        // to note the position of hoisted node(s), expanded node(s), and the currently selected node.
        let hoistStackPositions = []; // empty means no hoist
        for (const hoisted of this.hoistStack) {
            const pos = this.allNodesInOrder.indexOf(hoisted);
            if (pos !== -1) {
                hoistStackPositions.push(pos);
            }
        }
        const expandedPositions = [];
        for (const node of this.expanded) {
            const pos = this.allNodesInOrder.indexOf(node);
            if (pos !== -1) {
                expandedPositions.push(pos);
            }
        }
        const selectedPosition = this.allNodesInOrder.indexOf(this.selectedNode!); // -1 means no selection
        const markedArray = Array.from(this.marked); // Marked are the gnx keys, not numeric positions from allNodesInOrder
        const dataToSave = {
            marked: markedArray,
            hoistStack: hoistStackPositions,
            selected: selectedPosition,
            expanded: expandedPositions
        };
        utils.safeLocalStorageSet(this.title + this.genTimestamp, JSON.stringify(dataToSave)); // Key is title + genTimestamp
    }

    private loadDocumentStateFromLocalStorage(): TreeNode | null {
        // returns the selected node if found, otherwise null
        let initialSelectedNode = null;
        const savedData = utils.safeLocalStorageGet(this.title + this.genTimestamp); // Key is title + genTimestamp
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Start by rebuilding marked set and their related node icons
                if (parsedData && Array.isArray(parsedData.marked)) {
                    this.marked.clear();
                    parsedData.marked.forEach((gnx: number) => {
                        this.marked.add(gnx);
                        // Update icon state to reflect marked status
                        if (this.data[gnx]) {
                            this.data[gnx].icon = (this.data[gnx].icon || 0) | 2; // Set marked bit
                        }
                    });
                }
                // If document stated data is found, rebuild hoist stack, expanded set, and selected node
                if (parsedData && Array.isArray(parsedData.expanded) && Array.isArray(parsedData.hoistStack) && typeof parsedData.selected === 'number') {
                    const expandedPositions = parsedData.expanded;
                    let expandedPositionsIndex = 0;
                    const hoistPositions = parsedData.hoistStack;
                    const selectedPosition = parsedData.selected;
                    for (const hoisted of hoistPositions) {
                        if (hoisted >= 0 && hoisted < this.allNodesInOrder.length) {
                            this.hoistStack.push(this.allNodesInOrder[hoisted]!);
                        }
                    }
                    for (const node of expandedPositions) {
                        if (node >= 0 && node < this.allNodesInOrder.length) {
                            this.expanded.add(this.allNodesInOrder[node]!);
                        }
                    }
                    if (selectedPosition >= 0 && selectedPosition < this.allNodesInOrder.length) {
                        initialSelectedNode = this.allNodesInOrder[selectedPosition]!;
                    }
                }
                return initialSelectedNode;
            } catch (e) {
                console.error('Error loading document state from localStorage:', e);
            }
        }
        return null;
    }

    private saveLayoutPreferences() {
        const layoutPreferences = {
            mainRatio: this.mainRatio,
            secondaryRatio: this.secondaryRatio,
            theme: this.currentTheme,
            layout: this.currentLayout
        };
        utils.safeLocalStorageSet('layoutPreferences', JSON.stringify(layoutPreferences));
    }

    private saveConfigPreferences() {
        const findScopeChecked = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        const selectedFindScope = findScopeChecked?.value || 'entire';

        const preferences = {
            showPrevNextMark: this.SHOW_PREV_NEXT_MARK.checked,
            showToggleMark: this.SHOW_TOGGLE_MARK.checked,
            showPrevNextHistory: this.SHOW_PREV_NEXT_HISTORY.checked,
            showHoistDehoist: this.SHOW_HOIST_DEHOIST.checked,
            showLayoutOrientation: this.SHOW_LAYOUT_ORIENTATION.checked,
            showThemeToggle: this.SHOW_THEME_TOGGLE.checked,
            showNodeIcons: this.SHOW_NODE_ICONS.checked,
            showCollapseAll: this.SHOW_COLLAPSE_ALL.checked,
            // Find-pane options
            findWholeWord: this.OPT_WHOLE.checked,
            findIgnoreCase: this.OPT_IGNORECASE.checked,
            findRegexp: this.OPT_REGEXP.checked,
            findMark: this.OPT_MARK.checked,
            findHeadline: this.OPT_HEADLINE.checked,
            findBody: this.OPT_BODY.checked,
            findScope: selectedFindScope
        };
        utils.safeLocalStorageSet('configPreferences', JSON.stringify(preferences));
    }

    private loadThemeAndLayoutPreferences() {
        const savedPrefs = utils.safeLocalStorageGet('layoutPreferences');
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                if (typeof prefs.mainRatio === 'number') {
                    this.mainRatio = prefs.mainRatio;
                }
                if (typeof prefs.secondaryRatio === 'number') {
                    this.secondaryRatio = prefs.secondaryRatio;
                }
                if (prefs.theme) {
                    this.applyTheme(prefs.theme);
                }
                if (prefs.layout) {
                    this.applyLayout(prefs.layout);
                }
            } catch (e) {
                console.error('Error loading layout preferences:', e);
            }
        } else {
            this.applyTheme(this.currentTheme);
            this.applyLayout(this.currentLayout);
        }
    }

    private loadConfigPreferences() {
        const savedPrefs = utils.safeLocalStorageGet('configPreferences');
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                this.SHOW_PREV_NEXT_MARK.checked = prefs.showPrevNextMark ?? false;
                this.SHOW_TOGGLE_MARK.checked = prefs.showToggleMark ?? false;
                this.SHOW_PREV_NEXT_HISTORY.checked = prefs.showPrevNextHistory ?? true;
                this.SHOW_HOIST_DEHOIST.checked = prefs.showHoistDehoist ?? false;
                this.SHOW_LAYOUT_ORIENTATION.checked = prefs.showLayoutOrientation ?? true;
                this.SHOW_THEME_TOGGLE.checked = prefs.showThemeToggle ?? true;
                this.SHOW_NODE_ICONS.checked = prefs.showNodeIcons ?? true;
                this.SHOW_COLLAPSE_ALL.checked = prefs.showCollapseAll ?? true;
                // Find-pane options
                this.OPT_WHOLE.checked = prefs.findWholeWord ?? this.OPT_WHOLE.checked;
                this.OPT_IGNORECASE.checked = prefs.findIgnoreCase ?? this.OPT_IGNORECASE.checked;
                this.OPT_REGEXP.checked = prefs.findRegexp ?? this.OPT_REGEXP.checked;
                this.OPT_MARK.checked = prefs.findMark ?? this.OPT_MARK.checked;
                this.OPT_HEADLINE.checked = prefs.findHeadline ?? this.OPT_HEADLINE.checked;
                this.OPT_BODY.checked = prefs.findBody ?? this.OPT_BODY.checked;
                // Set the find scope radio
                if (prefs.findScope) {
                    const scopeRadio = document.getElementById('scope-' + prefs.findScope) as HTMLInputElement | null;
                    if (scopeRadio) scopeRadio.checked = true;
                }

                this.updateButtonVisibility();
                this.updateNodeIcons();
            } catch (e) {
                console.error('Error loading config preferences:', e);
            }
        } else {
            this.updateButtonVisibility();
            this.updateNodeIcons();
        }
    }

    // Find functionality
    private startFind() {
        this.initialFindNode = null; // If null, find next will set this, used with "Suboutline Only" find radio option (value: suboutline)
        this.showTab("find");
        this.FIND_INPUT.focus();
        this.FIND_INPUT.select();
        this.renderTree(); // To show or remove initial-find highlight
    }

    private findNext() {
        if (!this.selectedNode) return; // No selection, nothing to search from
        const searchText = this.FIND_INPUT.value.trim();
        if (!searchText) {
            this.showToast('Empty find pattern', 1500);
            return; // Empty search, do nothing
        }

        const searchInBody = this.OPT_BODY.checked;
        const searchInHeadlines = this.OPT_HEADLINE.checked;
        const ignoreCase = this.OPT_IGNORECASE.checked;
        const isRegexp = this.OPT_REGEXP.checked;
        const wholeWord = this.OPT_WHOLE.checked;
        const markFind = this.OPT_MARK.checked;

        if (!searchInBody && !searchInHeadlines) {
            this.showToast('not searching headline or body', 2000);
            return; // Nothing to search in
        }
        if (!this.initialFindNode) {
            this.initialFindNode = this.selectedNode; // Set initial find node if not already set
        }

        let selectedRadioValue = ''; // Falsy for now
        const selectedRadio = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        if (selectedRadio) {
            selectedRadioValue = selectedRadio.value;
        }

        let pattern; // Create regex pattern based on search options
        try {
            if (isRegexp) {
                pattern = searchText;
            } else {
                pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
                if (wholeWord) {
                    pattern = '\\b' + pattern + '\\b'; // Add word boundaries if whole word option is enabled
                }
            }
            const flags = ignoreCase ? 'gi' : 'g';
            const regex = new RegExp(pattern, flags);

            const startIndex = this.allNodesInOrder.indexOf(this.selectedNode);
            if (startIndex === -1) return;

            const totalNodes = this.allNodesInOrder.length;
            let currentIndex = startIndex; // start from current selection

            while (currentIndex < totalNodes) {
                const node = this.allNodesInOrder[currentIndex]!;
                if (selectedRadioValue === 'suboutline' && (this.initialFindNode !== node && this.isAncestorOf(this.initialFindNode, node) === false)) {
                    break; // Reached outside suboutline of initialFindNode
                }

                let headString = this.data[node.gnx]?.headString || "";
                let body = this.data[node.gnx]?.bodyString || "";

                // If searching headlines, check there first, but skip if the focus in in the body pane and its the currently selected node
                if (searchInHeadlines && headString && !(node === this.selectedNode && this.findFocus() === 2)) {
                    regex.lastIndex = 0; // Reset regex state
                    let startOffset = 0;
                    // If this is the currently selected node, check for current selection range existing in selectedLabelElement with getSelection()
                    // and only search after that range. Keep that offset, if any, and apply it to the match index later.
                    if (node === this.selectedNode && this.selectedLabelElement) {
                        const selection = window.getSelection()!;
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            if (this.selectedLabelElement.contains(range.commonAncestorContainer)) {
                                // Selection is inside the headline span
                                startOffset = range.endOffset;
                                headString = headString.substring(startOffset);
                            }
                        }
                    }

                    const match = regex.exec(headString);

                    if (match) {
                        // If 'mark find' is checked, mark the found node if not already marked
                        if (markFind) {
                            if (!this.marked.has(node.gnx)) {
                                this.marked.add(node.gnx);
                                if (this.data[node.gnx]) {
                                    this.data[node.gnx]!.icon = (this.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                                }
                            }
                        }
                        this.selectAndOrToggleAndRedraw(node); // This also calls scrollSelectedNodeIntoView

                        // Focus outline pane and highlight match
                        if (this.findFocus() !== 1) {
                            this.OUTLINE_PANE.focus();
                        }

                        // Highlight the match in the headline using selectedLabelElement
                        setTimeout(() => {
                            this.highlightMatchInHeadline(match.index + startOffset, match.index + startOffset + match[0].length);
                        });

                        return;
                    }
                }

                if (searchInBody && body) {
                    regex.lastIndex = 0; // Reset regex state

                    // If this is the currently selected node, check for current selection range existing in BODY_PANE with getSelection()
                    // and only search after that range. Keep that offset, if any, and apply it to the match index later.
                    let startOffset = 0;
                    if (node === this.selectedNode && this.BODY_PANE) {
                        const selection = window.getSelection()!;
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            if (this.BODY_PANE.contains(range.commonAncestorContainer)) {
                                // Compute global offset across all text nodes in BODY_PANE
                                startOffset = this.getGlobalOffset(this.BODY_PANE, range.endContainer, range.endOffset);
                                body = body.substring(startOffset);
                            }
                        }
                    }

                    const match = regex.exec(body);
                    if (match) {
                        if (markFind) {
                            if (!this.marked.has(node.gnx)) {
                                this.marked.add(node.gnx);
                                if (this.data[node.gnx]) {
                                    this.data[node.gnx]!.icon = (this.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                                }
                            }
                        }
                        this.selectAndOrToggleAndRedraw(node); // This also calls scrollSelectedNodeIntoView
                        if (this.findFocus() !== 2) {
                            this.BODY_PANE.focus();
                        }
                        setTimeout(() => {
                            this.highlightMatchInBody(match.index + startOffset, match.index + startOffset + match[0].length);
                        });
                        return;
                    }
                }
                if (selectedRadioValue === 'nodeonly') {
                    break; // Only search current node
                }
                currentIndex++;
            }

            let searchedParams = [];
            if (searchInHeadlines) searchedParams.push('head');
            if (searchInBody) searchedParams.push('body');
            this.showToast(`Not found: (${searchedParams.join(", ")}) ${searchText}`, 1500);

        } catch (e: any) {
            this.showToast('Invalid search pattern: ' + e.message, 2000);
        }

    }

    private findPrevious() {
        if (!this.selectedNode) return; // No selection, nothing to search from
        const searchText = this.FIND_INPUT.value.trim();
        if (!searchText) {
            this.showToast('Empty find pattern', 1500);
            return; // Empty search, do nothing
        }

        const searchInBody = this.OPT_BODY.checked;
        const searchInHeadlines = this.OPT_HEADLINE.checked;
        const ignoreCase = this.OPT_IGNORECASE.checked;
        const isRegexp = this.OPT_REGEXP.checked;
        const wholeWord = this.OPT_WHOLE.checked;
        const markFind = this.OPT_MARK.checked;

        if (!searchInBody && !searchInHeadlines) {
            this.showToast('not searching headline or body', 2000);
            return; // Nothing to search in
        }
        if (!this.initialFindNode) {
            this.initialFindNode = this.selectedNode; // Set initial find node if not already set
        }

        let selectedRadioValue = ''; // Falsy for now
        const selectedRadio = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        if (selectedRadio) {
            selectedRadioValue = selectedRadio.value;
        }

        let pattern; // Create regex pattern based on search options
        try {
            if (isRegexp) {
                pattern = searchText;
            } else {
                pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
                if (wholeWord) {
                    pattern = '\\b' + pattern + '\\b'; // Add word boundaries if whole word option is enabled
                }
            }
            const flags = ignoreCase ? 'gi' : 'g';
            const regex = new RegExp(pattern, flags);

            const startIndex = this.allNodesInOrder.indexOf(this.selectedNode);
            if (startIndex === -1) return;

            // Helper function to find the last match in a string
            const findLastMatch = (str: string) => {
                let lastMatchIndex = -1;
                let lastMatchLength = 0;

                let match;
                while ((match = regex.exec(str)) !== null) {
                    lastMatchIndex = match.index;
                    lastMatchLength = match[0].length;
                    // Prevent infinite loop for zero-width matches
                    if (regex.lastIndex === match.index) regex.lastIndex++;
                }

                return lastMatchIndex !== -1 ? { index: lastMatchIndex, length: lastMatchLength } : null;
            }

            // First, check the current node with respect to the current selection
            const node = this.selectedNode;
            let headString = this.data[node.gnx]?.headString || "";
            let body = this.data[node.gnx]?.bodyString || "";

            // Get current selection info
            const selection = window.getSelection() as Selection;
            let headlineOffset = Infinity;
            let bodyOffset = Infinity;

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (this.selectedLabelElement && this.selectedLabelElement.contains(range.commonAncestorContainer)) {
                    // Selection is in headline — safe, no <a> tags
                    headlineOffset = range.startOffset;

                } else if (this.BODY_PANE.contains(range.commonAncestorContainer)) {
                    // Selection is in body — compute global offset across text nodes
                    bodyOffset = this.getGlobalOffset(this.BODY_PANE, range.startContainer, range.startOffset);
                }
            }

            const currentFocus = this.findFocus();

            // Check current node based on focus
            if (currentFocus === 2 && searchInBody && body) {
                // If focused in body, check body first
                const limitedBody = body.substring(0, bodyOffset);
                const match = findLastMatch(limitedBody);

                if (match) {
                    if (markFind && !this.marked.has(node.gnx)) {
                        this.marked.add(node.gnx);
                        if (this.data[node.gnx]) {
                            this.data[node.gnx]!.icon = (this.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                        }
                    }
                    this.selectAndOrToggleAndRedraw(node);
                    this.BODY_PANE.focus();
                    setTimeout(() => {
                        this.highlightMatchInBody(match.index, match.index + match.length);
                    });
                    return;
                }
            }

            // Check headline if appropriate
            if (searchInHeadlines && headString) {
                const limitedHeadline = currentFocus !== 2 ? headString.substring(0, headlineOffset) : headString;
                const match = findLastMatch(limitedHeadline);

                if (match) {
                    if (markFind && !this.marked.has(node.gnx)) {
                        this.marked.add(node.gnx);
                        if (this.data[node.gnx]) {
                            this.data[node.gnx]!.icon = (this.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                        }
                    }
                    this.selectAndOrToggleAndRedraw(node);
                    this.OUTLINE_PANE.focus();
                    setTimeout(() => {
                        this.highlightMatchInHeadline(match.index, match.index + match.length);
                    });
                    return;
                }
            }

            // Continue searching through previous nodes if no match was found in current node
            let currentIndex = startIndex - 1;

            while (currentIndex >= 0) {
                const node = this.allNodesInOrder[currentIndex]!;
                if (selectedRadioValue === 'nodeonly') {
                    break; // Only search current node
                }
                if (selectedRadioValue === 'suboutline' && (this.initialFindNode !== node && this.isAncestorOf(this.initialFindNode, node) === false)) {
                    break; // Reached outside suboutline of initialFindNode
                }
                let headString = this.data[node.gnx]?.headString || "";
                let body = this.data[node.gnx]?.bodyString || "";

                // In previous nodes, check body first (since we're going backward)
                if (searchInBody && body) {
                    const match = findLastMatch(body);
                    if (match) {
                        if (markFind && !this.marked.has(node.gnx)) {
                            this.marked.add(node.gnx);
                            if (this.data[node.gnx]) {
                                this.data[node.gnx]!.icon = (this.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                            }
                        }
                        this.selectAndOrToggleAndRedraw(node);
                        this.BODY_PANE.focus();
                        setTimeout(() => {
                            this.highlightMatchInBody(match.index, match.index + match.length);
                        });
                        return;
                    }
                }

                // Then check headline
                if (searchInHeadlines && headString) {
                    const match = findLastMatch(headString);

                    if (match) {
                        if (markFind && !this.marked.has(node.gnx)) {
                            this.marked.add(node.gnx);
                            if (this.data[node.gnx]) {
                                this.data[node.gnx]!.icon = (this.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                            }
                        }

                        this.selectAndOrToggleAndRedraw(node);
                        this.OUTLINE_PANE.focus();
                        setTimeout(() => {
                            this.highlightMatchInHeadline(match.index, match.index + match.length);
                        });
                        return;
                    }
                }
                currentIndex--;
            }

            let searchedParams = [];
            if (searchInHeadlines) searchedParams.push('head');
            if (searchInBody) searchedParams.push('body');
            this.showToast(`Not found: (${searchedParams.join(", ")}) ${searchText}`, 1500);
        } catch (e: any) {
            this.showToast('Invalid search pattern: ' + e.message, 2000);
        }
    }

    private highlightMatchInHeadline(startIndex: number, endIndex: number) {
        // Use the global selectedLabelElement which is already set after selectAndOrToggleAndRedraw
        if (!this.selectedLabelElement) return;
        // Find the first text node in the label element
        let textNode = null;
        for (const node of this.selectedLabelElement.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNode = node;
                break;
            }
        }
        if (!textNode) return;
        try {
            const range = document.createRange();
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, endIndex);

            const selection = window.getSelection()!;
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            console.error('Error setting headline selection:', e);
        }
    }

    private highlightMatchInBody(startIndex: number, endIndex: number) {
        // The body pane content is set directly as textContent, so it's a single text node
        if (!this.BODY_PANE.firstChild) return;
        try {
            const range = document.createRange();
            const start = this.getTextNodeAtIndex(this.BODY_PANE, startIndex);
            const end = this.getTextNodeAtIndex(this.BODY_PANE, endIndex);

            if (!start || !end) {
                console.warn("Invalid range: could not resolve text nodes");
                return;
            }

            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);

            const sel = window.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) {
            console.error('Error setting body selection:', e);
        }
    }

    private getTextNodeAtIndex(root: Node, index: number): { node: Node; offset: number } | null {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let currentNode = walker.nextNode();
        let remaining = index;

        while (currentNode) {
            const len = currentNode!.nodeValue!.length;
            if (remaining <= len) {
                return { node: currentNode, offset: remaining };
            }
            remaining -= len;
            currentNode = walker.nextNode();
        }
        return null;
    }

    private getGlobalOffset(root: Node, container: Node, offset: number): number {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let total = 0;
        let current: Node | null = walker.nextNode();

        while (current) {
            if (current === container) {
                return total + offset;
            }
            total += current.nodeValue!.length;
            current = walker.nextNode();
        }
        return total;
    }

    private findFocus() {
        // Returns 1 if focus in outline-pane, 2 if in body-pane, 0 otherwise
        if (document.activeElement === this.OUTLINE_PANE || this.OUTLINE_PANE.contains(document.activeElement)) {
            return 1;
        } else if (document.activeElement === this.BODY_PANE || this.BODY_PANE.contains(document.activeElement)) {
            return 2;
        }
        return 0;
    }

    private initializeThemeAndLayout() {
        document.title = this.title; // Set the document title
        this.loadThemeAndLayoutPreferences();
        this.updateMarkedButtonStates();
        this.updateHoistButtonStates();
        this.setupEventHandlers();
        this.setupButtonFocusPrevention();
        this.setupLastFocusedElementTracking();
    }
}