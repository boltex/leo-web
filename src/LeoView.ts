import { set } from 'lodash';
import { TreeNode, FlatRow, MenuEntry, FilePath, OpenDialogOptions, SaveDialogOptions, InputDialogOptions, MessageOptions, QuickPickItem, QuickPickOptions, FlatRowLeo } from './types';
import * as utils from './utils';
import { Uri, workspace } from './workspace';
import { Position } from './core/leoNodes';

export class LeoView {
    // Elements
    public selectedLabelElement: HTMLSpanElement | null = null; // Track the currently selected label element in the outline pane

    private MAIN_CONTAINER: HTMLElement;
    public OUTLINE_FIND_CONTAINER: HTMLElement;
    public OUTLINE_PANE: HTMLElement;
    public COLLAPSE_ALL_BTN: HTMLElement;
    private SPACER: HTMLElement;
    public BODY_PANE: HTMLElement;
    public VERTICAL_RESIZER: HTMLElement;
    public LOG_PANE: HTMLElement;
    public HORIZONTAL_RESIZER: HTMLElement;
    public CROSS_RESIZER: HTMLElement;
    public THEME_TOGGLE: HTMLElement;
    private THEME_ICON: HTMLElement;
    public LAYOUT_TOGGLE: HTMLElement;
    public MENU_TOGGLE: HTMLElement;
    public TOP_MENU: HTMLElement;
    public DOCUMENT_TABS: HTMLElement;
    public TOP_MENU_TOGGLE: HTMLElement;

    public DEHOIST_BTN: HTMLButtonElement;
    public HOIST_BTN: HTMLButtonElement;
    public NEXT_BTN: HTMLButtonElement;
    public PREV_BTN: HTMLButtonElement;

    public NEXT_MARKED_BTN: HTMLButtonElement;
    public TOGGLE_MARK_BTN: HTMLButtonElement;
    public PREV_MARKED_BTN: HTMLButtonElement;

    public BUTTON_CONTAINER: HTMLElement;
    public TRIGGER_AREA: HTMLElement;

    public ACTION_MARK: HTMLElement;
    public ACTION_UNMARK: HTMLElement;
    public ACTION_HOIST: HTMLElement;
    public ACTION_DEHOIST: HTMLElement;

    public FIND_INPUT: HTMLInputElement;
    public OPT_HEADLINE: HTMLInputElement;
    public OPT_BODY: HTMLInputElement;
    public OPT_WHOLE: HTMLInputElement;
    public OPT_IGNORECASE: HTMLInputElement;
    public OPT_REGEXP: HTMLInputElement;
    public OPT_MARK: HTMLInputElement;

    public LOG_CONTENT: HTMLElement;

    public LOG_TAB: HTMLDivElement;
    public FIND_TAB: HTMLDivElement;
    public UNDO_TAB: HTMLDivElement;
    public SETTINGS_TAB: HTMLDivElement;

    public SHOW_PREV_NEXT_MARK: HTMLInputElement;
    public SHOW_TOGGLE_MARK: HTMLInputElement;
    public SHOW_PREV_NEXT_HISTORY: HTMLInputElement;
    public SHOW_HOIST_DEHOIST: HTMLInputElement;
    public SHOW_LAYOUT_ORIENTATION: HTMLInputElement;
    public SHOW_THEME_TOGGLE: HTMLInputElement;
    public SHOW_NODE_ICONS: HTMLInputElement;
    public SHOW_COLLAPSE_ALL: HTMLInputElement;

    public MENU: HTMLElement;
    private TOAST: HTMLElement;
    private MODAL_DIALOG_TITLE: HTMLElement;
    private MODAL_DIALOG_DESCRIPTION: HTMLElement;
    private MODAL_DIALOG_BTN_CONTAINER: HTMLElement;

    private INPUT_DIALOG_TITLE: HTMLElement;
    private INPUT_DIALOG_DESCRIPTION: HTMLElement;
    private INPUT_DIALOG_INPUT: HTMLInputElement;
    private INPUT_DIALOG_BTN: HTMLButtonElement;

    private QUICKPICK_DIALOG_INPUT: HTMLInputElement;
    private QUICKPICK_DIALOG_LIST: HTMLElement;

    public HTML_ELEMENT: HTMLElement;

    public activeTopMenu: HTMLDivElement | null = null;
    public focusedMenuItem: HTMLDivElement | null = null;
    public topLevelItems: HTMLDivElement[] = [];
    public topLevelSubmenus = new Map();
    private resizeTimeout: number | undefined;

    private _flatRowsLeo: FlatRowLeo[] | null = null; // Array of nodes currently visible in the outline pane, null at init time to not trigger render
    public get flatRowsLeo(): FlatRowLeo[] | null {
        return this._flatRowsLeo;
    }
    public setTreeDataLeo(rows: FlatRowLeo[]) {
        this._flatRowsLeo = rows;
        this.renderTree();
    }

    public currentTheme = 'light'; // Default theme
    public currentLayout = 'vertical'; // Default layout
    public mainRatio = 0.25; // Default proportion between outline-find-container and body-pane widths (defaults to 1/4)
    public secondaryRatio = 0.75; // Default proportion between the outline-pane and the log-pane (defaults to 3/4)
    public isDragging = false;
    public isMenuShown = false;
    public ROW_HEIGHT = 26;
    private LEFT_OFFSET = 16; // Padding from left edge

    private lastFocusedElement: HTMLElement | null = null; // Used when opening/closing the menu to restore focus
    public secondaryIsDragging = false;
    public crossIsDragging = false;
    private __toastTimer: ReturnType<typeof setTimeout> | null = null;
    private __toastResolvers: Array<(value: PromiseLike<undefined> | undefined) => void> = [];

    private __dialogQueue: Array<{
        type: 'message' | 'input' | 'singleChar' | 'quickPick' | 'openFile' | 'saveFile';
        // For message dialogs
        message?: string;
        options?: MessageOptions;
        items?: string[];
        // For input dialogs
        inputOptions?: InputDialogOptions;
        // For quick pick
        quickPickItems?: QuickPickItem[];
        quickPickOptions?: QuickPickOptions;
        // For file dialogs
        openDialogOptions?: OpenDialogOptions;
        saveDialogOptions?: SaveDialogOptions;
        // Resolver
        resolve: (value: any) => void;
    }> = [];
    public isDialogOpen = false;

    private __activeFocusTrap: (() => void) | null = null;

    public minWidth = 20;
    public minHeight = 20;

    constructor() {

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
        this.TOP_MENU = document.getElementById("top-menu")!;
        this.DOCUMENT_TABS = document.getElementById("document-tabs")!;

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

        // this.LOG_CONTENT = document.getElementById('log-content')!;
        this.LOG_CONTENT = document.getElementById('log-controls')!;

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

        this.MODAL_DIALOG_TITLE = document.getElementById('modal-dialog-title')!;
        this.MODAL_DIALOG_DESCRIPTION = document.getElementById('modal-dialog-description')!;
        this.MODAL_DIALOG_BTN_CONTAINER = document.getElementById('modal-dialog-btn-container')!;

        this.INPUT_DIALOG_TITLE = document.getElementById('input-dialog-title')!;
        this.INPUT_DIALOG_DESCRIPTION = document.getElementById('input-dialog-description')!;
        this.INPUT_DIALOG_INPUT = document.getElementById('input-dialog-input')! as HTMLInputElement;
        this.INPUT_DIALOG_BTN = document.getElementById('input-dialog-btn')! as HTMLButtonElement;

        this.QUICKPICK_DIALOG_INPUT = document.getElementById('quickpick-dialog-input')! as HTMLInputElement;
        this.QUICKPICK_DIALOG_LIST = document.getElementById('quickpick-dialog-list')!;

        this.HTML_ELEMENT = document.documentElement;

        // Build the menu
        this.topLevelItems.length = 0;
        this.topLevelSubmenus.clear();

        window.addEventListener('resize', () => {
            if (this.resizeTimeout !== undefined) {
                window.clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = window.setTimeout(() => {
                if (this.activeTopMenu) {
                    this.repositionOpenMenus();
                }
            }, 100); // debounce delay in ms
        });
    }

    public renderTree = () => {
        if (!this._flatRowsLeo) {
            return; // Not initialized yet
        }
        const flatRows = this._flatRowsLeo!;

        // Render visible rows only
        const scrollTop = this.OUTLINE_PANE.scrollTop;
        const viewportHeight = this.OUTLINE_PANE.clientHeight;
        const viewportWidth = this.OUTLINE_PANE.clientWidth;

        const startIndex = Math.floor(scrollTop / this.ROW_HEIGHT);
        const visibleCount = Math.ceil(viewportHeight / this.ROW_HEIGHT) + 1;
        const endIndex = Math.min(flatRows.length, startIndex + visibleCount);
        let leftOffset = this.LEFT_OFFSET;

        // If all nodes have no children, remove the left offset
        if (flatRows.every(row => !row.hasChildren)) {
            leftOffset = 0;
        }

        this.SPACER.innerHTML = "";
        this.SPACER.style.height = flatRows.length * this.ROW_HEIGHT + "px";
        for (let i = startIndex; i < endIndex; i++) {
            const row = flatRows[i]!;
            const div = document.createElement("div");
            div.className = "node";

            if (row.label) {
                div.title = row.label;
            }

            // Apply classes based on computed properties from controller
            if (row.isSelected) {
                div.classList.add("selected");
            }
            if (row.isAncestor) {
                div.classList.add("ancestor");
            }
            if (row.isInitialFind) {
                div.classList.add("initial-find");
            }

            div.style.top = (i * this.ROW_HEIGHT) + "px";
            div.style.height = this.ROW_HEIGHT + "px";

            const leftPosition = (row.depth * 20) + leftOffset;
            div.style.left = leftPosition + "px";
            div.style.width = (viewportWidth - leftPosition) + "px";

            const caret = document.createElement("span");
            caret.className = row.toggled ? "caret toggled" : "caret";

            if (row.hasChildren) {
                caret.setAttribute("data-expanded", row.isExpanded ? "true" : "false");
            }
            div.appendChild(caret);

            const labelSpan = document.createElement("span");
            labelSpan.className = "node-text";

            // Apply icon class from computed property
            labelSpan.classList.add("icon" + row.icon);

            labelSpan.textContent = row.label;
            if (row.isSelected) {
                this.selectedLabelElement = labelSpan;
            }

            div.appendChild(labelSpan);
            this.SPACER.appendChild(div);
        }
    }

    public updateNodeIcons = () => {
        this.HTML_ELEMENT.setAttribute('data-show-icons', this.SHOW_NODE_ICONS.checked ? 'true' : 'false');
        this.renderTree(); // Re-render to apply icon changes
    }

    clearDocumentTabs() {
        this.DOCUMENT_TABS.innerHTML = "";
    }

    public createDocumentTab(title: string, isActive: boolean): HTMLDivElement {
        const tab = document.createElement("div");
        tab.className = "document-tab" + (isActive ? " active" : "");
        tab.textContent = title;
        this.DOCUMENT_TABS.appendChild(tab);
        // add the close button
        const closeBtn = document.createElement("div");
        closeBtn.className = "close-btn";
        tab.appendChild(closeBtn);
        return tab;
    }
    public showHtmlInNewTab(htmlContent: string, title: string) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {

            // Check current theme and set colors accordingly
            const isDark = this.currentTheme === 'dark';
            const bodyBg = isDark ? '#1e1e2e' : '#fff';
            const bodyColor = isDark ? '#cdd6f4' : '#222';
            const preBg = isDark ? '#2a2536' : '#f5f5f5';
            const linkColor = isDark ? '#929bda' : '#0b5ed7';

            newWindow.document.open();
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="utf-8">
                <title>${title}</title>
                <style>
                    body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont,
                                "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.55;
                    padding: 1.25rem;
                    color: ${bodyColor};
                    background: ${bodyBg};
                    }

                    h1, h2, h3, h4 {
                    margin-top: 1.4em;
                    }

                    pre, code {
                    font-family: ui-monospace, SFMono-Regular, Consolas,
                                "Liberation Mono", Menlo, monospace;
                    }

                    pre {
                    background: ${preBg};
                    padding: 0.75rem;
                    border-radius: 4px;
                    overflow-x: auto;
                    }

                    a {
                    color: ${linkColor};
                    text-decoration: none;
                    }

                    a:hover {
                    text-decoration: underline;
                    }
                </style>
                </head>
                <body>
                ${htmlContent}
                </body>
                </html>
                `);
            newWindow.document.close();
            newWindow.focus();
        }
    }

    public buildMenu(entries: MenuEntry[], level = 0) {
        const menu = level === 0 ? this.TOP_MENU : document.createElement("div");

        menu.className = "menu" + (level > 0 ? " submenu" : "");

        for (const entry of entries) {
            const item = document.createElement("div");
            item.className = "menu-item";

            // Create label span
            const labelSpan = document.createElement("span");
            labelSpan.className = "menu-label";
            labelSpan.textContent = entry.label;
            item.appendChild(labelSpan);

            // Add keyboard shortcut if present and no subentries
            if (entry.keyboardShortcut && !entry.entries) {
                const shortcutSpan = document.createElement("span");
                shortcutSpan.className = "menu-shortcut";
                shortcutSpan.textContent = entry.keyboardShortcut;
                item.appendChild(shortcutSpan);
            }

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
                        sub.classList.add("visible");
                        this.positionSubmenu(item, sub, level);
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
                    this.closeAllSubmenus();
                    this.restoreLastFocusedElement();
                    this.activeTopMenu = null;
                    workspace.controller.doCommand(entry.action as string);
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

    private constrainToViewport(
        submenu: HTMLElement,
        level: number
    ): void {
        const rect = submenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const minTop = 25; // Keep top bar visible
        const minLeft = 0; // Left edge of viewport

        // Horizontal constraint - shift left if extending past right edge
        if (rect.right > viewportWidth) {
            const overflow = rect.right - viewportWidth;
            const newLeft = Math.max(minLeft, parseFloat(submenu.style.left) - overflow);
            submenu.style.left = `${newLeft}px`;
        }

        // Also check if too far left (shouldn't happen but just in case)
        if (rect.left < minLeft) {
            submenu.style.left = `${minLeft}px`;
        }

        // Vertical constraint - shift up if extending past bottom edge
        if (rect.bottom > viewportHeight) {
            const overflow = rect.bottom - viewportHeight;

            if (level === 0) {
                // Level 0: position:fixed, use positive coordinates
                const newTop = Math.max(minTop, parseFloat(submenu.style.top) - overflow);
                submenu.style.top = `${newTop}px`;
            } else {
                // Level > 0: position:relative, shift up with negative values
                const currentTop = parseFloat(submenu.style.top) || 0;
                const newTop = currentTop - overflow;
                submenu.style.top = `${newTop}px`;
            }
        }

        // Also check if too high (shouldn't happen for level 0, but can for nested)
        if (rect.top < minTop) {
            if (level === 0) {
                submenu.style.top = `${minTop}px`;
            } else {
                // For relative positioned submenus, calculate how much to shift down
                const overflow = minTop - rect.top;
                const currentTop = parseFloat(submenu.style.top) || 0;
                submenu.style.top = `${currentTop + overflow}px`;
            }
        }
    }

    private repositionOpenMenus(): void {
        // Find all visible submenus
        const visibleSubmenus = document.querySelectorAll('.submenu.visible');

        visibleSubmenus.forEach((submenu) => {
            const menuItem = this.findParentMenuItem(submenu);
            if (menuItem) {
                const level = this.getMenuLevel(submenu);
                this.positionSubmenu(menuItem as HTMLDivElement, submenu as HTMLElement, level);
            }
        });
    }

    private findParentMenuItem(submenu: Element): HTMLDivElement | null {
        // For level 0 submenus attached to body, search in topLevelSubmenus map
        for (const [menuItem, sub] of this.topLevelSubmenus.entries()) {
            if (sub === submenu) {
                return menuItem as HTMLDivElement;
            }
        }

        // For nested submenus, the parent is the containing menu-item
        const parentItem = submenu.parentElement?.closest('.menu-item');
        return parentItem as HTMLDivElement | null;
    }

    private getMenuLevel(submenu: Element): number {
        // Level 0 submenus are attached to document.body
        if (submenu.parentElement === document.body) {
            return 0;
        }

        // Count how many .submenu ancestors this submenu has
        let level = 1;
        let parent = submenu.parentElement;

        while (parent) {
            if (parent.classList.contains('submenu')) {
                level++;
            }
            parent = parent.parentElement;
        }

        return level;
    }

    public openTopMenu(item: HTMLDivElement, sub: HTMLElement | null, level: number) {
        this.closeAllSubmenus();
        this.activeTopMenu = item;
        const targetSubmenu = sub || this.topLevelSubmenus.get(item);
        if (!targetSubmenu) return;
        this.positionSubmenu(item, targetSubmenu, level);
        targetSubmenu.classList.add("visible");
        item.classList.add("active");
        this.focusedMenuItem = null;
    }

    public positionSubmenu(parentItem: HTMLDivElement, submenu: HTMLElement, level: number) {
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
        setTimeout(() => this.constrainToViewport(submenu, level), 0)
    }

    public closeAllSubmenus() {
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

    public focusMenuItem(item: HTMLDivElement | null) {
        if (!item) return; // Safety check
        if (this.focusedMenuItem) this.focusedMenuItem.classList.remove("focused");
        item.classList.add("focused");
        this.focusedMenuItem = item;
        // item.scrollIntoView({ block: "nearest" }); // Commented out because menut items can lay outside the window
        document.querySelectorAll(".menu-item.sub-active").forEach(el =>
            el.classList.remove("sub-active")
        );
        let ancestor = item.parentElement?.closest(".menu-item");
        while (ancestor) {
            ancestor.classList.add("sub-active");
            ancestor = ancestor.parentElement?.closest(".submenu")?.parentElement?.closest(".menu-item");
        }
    }

    public closeMenusEvent(e: MouseEvent) {
        this.MENU.style.display = "none";
        const target = e.target as Element;
        if (!target.closest('.menu')) {
            this.closeAllSubmenus();
            this.activeTopMenu = null;
        }
    }

    public setBody(text: string, wrap: boolean) {
        if (wrap) {
            this.BODY_PANE.style.whiteSpace = "pre-wrap"; // Wrap text
        } else {
            this.BODY_PANE.style.whiteSpace = "pre"; // No wrapping
        }
        this.BODY_PANE.innerHTML = text;
    }

    public scrollNodeIntoView(node: Position) {
        if (!this._flatRowsLeo) return; // Not initialized yet

        const selectedIndex = this._flatRowsLeo.findIndex(row => row.node.__eq__(node));
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

    public highlightMatchInHeadline(startIndex: number, endIndex: number) {
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

    public highlightMatchInBody(startIndex: number, endIndex: number) {
        // The body pane content is set directly as textContent, so it's a single text node
        if (!this.BODY_PANE.firstChild) return;
        try {
            const range = document.createRange();
            const start = utils.getTextNodeAtIndex(this.BODY_PANE, startIndex);
            const end = utils.getTextNodeAtIndex(this.BODY_PANE, endIndex);

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

    public updateButtonVisibility = (hasMarked: boolean, hasHistory: boolean) => {
        this.toggleButtonVisibility(this.NEXT_MARKED_BTN, this.PREV_MARKED_BTN, this.SHOW_PREV_NEXT_MARK.checked && hasMarked);
        this.toggleButtonVisibility(this.TOGGLE_MARK_BTN, null, this.SHOW_TOGGLE_MARK.checked);
        this.toggleButtonVisibility(this.NEXT_BTN, this.PREV_BTN, this.SHOW_PREV_NEXT_HISTORY.checked && hasHistory);
        this.toggleButtonVisibility(this.HOIST_BTN, this.DEHOIST_BTN, this.SHOW_HOIST_DEHOIST.checked);
        this.toggleButtonVisibility(this.LAYOUT_TOGGLE, null, this.SHOW_LAYOUT_ORIENTATION.checked);
        this.toggleButtonVisibility(this.THEME_TOGGLE, null, this.SHOW_THEME_TOGGLE.checked);
        this.toggleButtonVisibility(this.COLLAPSE_ALL_BTN, null, this.SHOW_COLLAPSE_ALL.checked);
        let visibleButtonCount = 0; // Count visible buttons to adjust trigger area width
        if (this.SHOW_PREV_NEXT_MARK.checked && hasMarked) {
            visibleButtonCount += 2;
        }
        if (this.SHOW_TOGGLE_MARK.checked) {
            visibleButtonCount += 1;
        }
        if (this.SHOW_PREV_NEXT_HISTORY.checked && hasHistory) {
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

    // * Button states
    public updateMarkedButtonStates(hasMarkedNodes: boolean) {
        this.NEXT_MARKED_BTN.disabled = !hasMarkedNodes;
        this.PREV_MARKED_BTN.disabled = !hasMarkedNodes;
    }

    public updateHoistButtonStates(hoist: boolean, deHoist: boolean) {
        this.HOIST_BTN.disabled = hoist;
        this.DEHOIST_BTN.disabled = deHoist;
    }

    public updateHistoryButtonStates(previous: boolean, next: boolean) {
        this.PREV_BTN.disabled = previous;
        this.NEXT_BTN.disabled = next;
    }

    public updateContextMenuState(mark: boolean, unmark: boolean, hoist: boolean, dehoist: boolean) {
        this.toggleButtonVisibility(this.ACTION_MARK, null, mark);
        this.toggleButtonVisibility(this.ACTION_UNMARK, null, unmark);
        this.toggleButtonVisibility(this.ACTION_HOIST, null, hoist);
        this.toggleButtonVisibility(this.ACTION_DEHOIST, null, dehoist);
    }

    // * UI utilities
    public toggleButtonVisibility(button1: HTMLElement | null, button2: HTMLElement | null, isVisible: boolean) {
        if (button1) {
            button1.classList.toggle('hidden-button', !isVisible);
        }
        if (button2) {
            button2.classList.toggle('hidden-button', !isVisible);
        }
    }

    public setHasOpenedDocuments(hasOpened: boolean) {
        this.HTML_ELEMENT.setAttribute('data-no-opened-documents', hasOpened ? 'false' : 'true');
    }

    public showTab(tabName: string) {
        // Set HTML_ELEMENT attributes. CSS rules will show/hide tabs based on these.
        this.HTML_ELEMENT.setAttribute('data-active-tab', tabName);
    }

    public setIconsVisible(visible: boolean) {
        this.HTML_ELEMENT.setAttribute('data-show-icons', visible ? 'true' : 'false');
    }

    public setupLastFocusedElementTracking() {
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

    public restoreLastFocusedElement() {
        if (this.lastFocusedElement && this.lastFocusedElement.focus) {
            // also check if visible by checking its size
            const rect = this.lastFocusedElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.lastFocusedElement.focus();
            }
        }
    }

    public setupButtonContainerAutoHide() {
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

    public setWindowTitle(title: string) {
        document.title = title;
    }

    public initializeThemeAndLayout() {
        this.loadThemeAndLayoutPreferences();
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
                if (prefs.menuVisible && !this.isMenuShown) {
                    this.toggleMenu();
                    // Starts with menu shown but has yet to open a document
                    this.setHasOpenedDocuments(false);
                }
            } catch (e) {
                console.error('Error loading layout preferences:', e);
            }
        } else {
            this.applyTheme(this.currentTheme);
            this.applyLayout(this.currentLayout);
        }
    }

    public equalSizedPanes(): void {
        this.mainRatio = 0.5;
        this.secondaryRatio = 0.5;
        this.updatePanelSizes();
    }

    public applyTheme(theme: string) {
        this.currentTheme = theme;
        this.HTML_ELEMENT.setAttribute('data-theme', theme);
        this.THEME_TOGGLE.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        this.THEME_ICON.innerHTML = theme === 'dark' ? '🌙' : '☀️';
    };

    public applyLayout(layout: string) {
        this.currentLayout = layout;
        this.LAYOUT_TOGGLE.title = layout === 'vertical' ? 'Switch to horizontal layout' : 'Switch to vertical layout';
        if (layout === 'horizontal') {
            this.HTML_ELEMENT.setAttribute('data-layout', 'horizontal');
        } else {
            this.HTML_ELEMENT.setAttribute('data-layout', 'vertical');
        }
        this.updatePanelSizes(); // Proportions will have changed so we must update sizes
    };

    public updatePanelSizes() {
        this.updateOutlineContainerSize();
        this.updateOutlinePaneSize();
        this.positionCrossDragger();
    }

    public updateOutlineContainerSize() {
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

    public updateOutlinePaneSize() {
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

    public updateProportion() {
        if (this.currentLayout === 'vertical') {
            this.mainRatio = this.OUTLINE_FIND_CONTAINER.offsetWidth / window.innerWidth;
        } else {
            this.mainRatio = this.OUTLINE_FIND_CONTAINER.offsetHeight / this.MAIN_CONTAINER.offsetHeight;
        }
    }


    public updateSecondaryProportion() {
        if (this.currentLayout === 'vertical') {
            this.secondaryRatio = (this.OUTLINE_PANE.offsetHeight - 6) / this.OUTLINE_FIND_CONTAINER.offsetHeight;
        } else {
            this.secondaryRatio = this.OUTLINE_PANE.offsetWidth / this.OUTLINE_FIND_CONTAINER.offsetWidth;
        }
    }

    public updateCollapseAllPosition() {
        this.COLLAPSE_ALL_BTN.style.inset = `${this.isMenuShown ? 58 : 5}px auto auto ${this.OUTLINE_PANE.clientWidth - 18}px`;
    }

    public toggleMenu() {
        this.isMenuShown = !this.isMenuShown;
        this.HTML_ELEMENT.setAttribute('data-show-menu', this.isMenuShown ? 'true' : 'false');

        if (this.isMenuShown) {
            this.BUTTON_CONTAINER.classList.add('hidden');
        } else {
            this.BUTTON_CONTAINER.classList.remove('hidden');
            // Set focus on last focused element
            this.restoreLastFocusedElement();
        }

        // Recalculate layout dependent items
        this.updateOutlinePaneSize();
        this.updateOutlineContainerSize();
        this.positionCrossDragger();
    }

    public toggleTheme() {
        // Only animate once button pressed, so page-load wont animate color changes.
        this.HTML_ELEMENT.setAttribute('data-transition', 'true');
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.renderTree(); // Re-render to update icon colors
    }

    public toggleLayout() {
        this.HTML_ELEMENT.setAttribute('data-transition', 'true');
        const newLayout = this.currentLayout === 'vertical' ? 'horizontal' : 'vertical';
        this.applyLayout(newLayout);
        this.renderTree();
    }

    public handleWindowResize() {
        this.updatePanelSizes();
        this.renderTree();
    }

    public positionCrossDragger() {
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

    public requestWorkspaceDirectory(): Promise<FileSystemDirectoryHandle> {
        // First, check if window.showDirectoryPicker is available to adapt the message in the dialog, and just reject if not.
        if (!('showDirectoryPicker' in window)) {
            return new Promise((resolve, reject) => {
                return this.showMessageDialog(
                    '⚠️ Opening Local folders is Unsupported',
                    {
                        detail: 'Your browser does not support opening local folders.',
                    },
                    'View Specification')
                    .then((result) => {
                        if (result === 'View Specification') {
                            window.location.href =
                                'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker';
                        }
                        reject('Browser does not support showDirectoryPicker API.');
                    });
            });

        } else {
            // ok, continue with the normal flow
            return new Promise((resolve, reject) => {
                return this.showMessageDialog(
                    '📁 Choose a Workspace',
                    { detail: 'Leo-Web needs permission to read and write files.', },
                    'Choose Folder'
                ).then((result) => {
                    if (result === 'Choose Folder') {
                        return window.showDirectoryPicker({ mode: 'readwrite' })
                            .then((dir) => {
                                resolve(dir);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } else {
                        reject('User cancelled directory selection.');
                    }
                });
            });
        }

    }

    public showToast(message: string, duration = 2000, detail?: string): Promise<undefined> {
        if (!this.TOAST) return Promise.resolve(undefined);

        // Set content
        this.TOAST.textContent = message;
        if (detail) {
            // Two newlines for a better separation
            this.TOAST.textContent += `\n\n${detail}`;
        }

        // Show toast
        this.TOAST.hidden = false;
        void this.TOAST.offsetWidth; // Force reflow for transition
        this.TOAST.classList.add('show');

        // Reset any previous timer
        if (this.__toastTimer) {
            clearTimeout(this.__toastTimer);
            this.__toastTimer = null;
        }

        // Schedule hide and resolve all pending promises when finally hidden
        this.__toastTimer = setTimeout(() => {
            this.TOAST.classList.remove('show');
            setTimeout(() => {
                this.TOAST.hidden = true;
                this.__toastTimer = null;
                const resolvers = this.__toastResolvers.splice(0);
                for (const resolve of resolvers) resolve(undefined);
            }, 220); // match CSS transition duration
        }, duration);

        return new Promise<undefined>((resolve) => {
            this.__toastResolvers.push(resolve);
        });
    }

    public showBody(text: string, wrap: boolean) {
        this.HTML_ELEMENT.setAttribute('data-body-wrap', wrap ? 'true' : 'false');
        this.BODY_PANE.innerHTML = text;
    }

    public addToLogPane(message: string, replace = false) {
        // const p = document.createElement('p');
        // p.textContent = message;
        // this.LOG_CONTENT.appendChild(p);
        // this.LOG_CONTENT.scrollTop = this.LOG_CONTENT.scrollHeight;

        // * Add to text content instead of creating elements for performance
        if (replace) {
            this.LOG_CONTENT.textContent = message + (message ? '\n' : '');
        } else {
            this.LOG_CONTENT.textContent += message + '\n';
        }
        this.LOG_CONTENT.scrollTop = this.LOG_CONTENT.scrollHeight;

    }

    // * Getters 
    public findFocus(): number {
        // Returns 1 if focus in outline-pane, 2 if in body-pane, 0 otherwise
        if (document.activeElement === this.OUTLINE_PANE || this.OUTLINE_PANE.contains(document.activeElement)) {
            return 1;
        } else if (document.activeElement === this.BODY_PANE || this.BODY_PANE.contains(document.activeElement)) {
            return 2;
        }
        return 0;
    }

    public getActionButtons(): HTMLElement[] {
        return Array.from(document.querySelectorAll('.action-button'));
    }

    public getTopMenuToggle(): HTMLElement {
        return this.TOP_MENU_TOGGLE;
    }

    public getFocusableElements(): HTMLElement[] {
        return [
            this.OUTLINE_PANE,
            this.BODY_PANE,
            ...Array.from(this.OUTLINE_FIND_CONTAINER.querySelectorAll<HTMLElement>('input'))
        ];
    }

    public getFindScopeRadios(): NodeListOf<HTMLInputElement> {
        return document.querySelectorAll('input[name="find-scope"]');
    }

    public getConfigCheckboxes() {
        return {
            showPrevNextMark: this.SHOW_PREV_NEXT_MARK,
            showToggleMark: this.SHOW_TOGGLE_MARK,
            showNextHistory: this.SHOW_PREV_NEXT_HISTORY,
            showHoistDehoist: this.SHOW_HOIST_DEHOIST,
            showLayoutOrientation: this.SHOW_LAYOUT_ORIENTATION,
            showThemeToggle: this.SHOW_THEME_TOGGLE,
            showNodeIcons: this.SHOW_NODE_ICONS,
            showCollapseAll: this.SHOW_COLLAPSE_ALL,
        };
    }

    public getConfigState() {
        const checkboxes = this.getConfigCheckboxes();
        return {
            showPrevNextMark: checkboxes.showPrevNextMark.checked,
            showToggleMark: checkboxes.showToggleMark.checked,
            showNextHistory: checkboxes.showNextHistory.checked,
            showHoistDehoist: checkboxes.showHoistDehoist.checked,
            showLayoutOrientation: checkboxes.showLayoutOrientation.checked,
            showThemeToggle: checkboxes.showThemeToggle.checked,
            showNodeIcons: checkboxes.showNodeIcons.checked,
            showCollapseAll: checkboxes.showCollapseAll.checked,
        };
    }

    public showTextDocument(uri: Uri): void {
        // Read the file, and open in a new tab or window
        workspace.fs.readFile(uri).then(data => {
            const text = new TextDecoder().decode(data);
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.title = uri.fsPath.split('/').pop() || 'Document';
                const pre = newWindow.document.createElement('pre');
                pre.textContent = text;
                newWindow.document.body.appendChild(pre);
            }
        }).catch(err => {
            console.error('Error reading file for showTextDocument:', err);
        });
    }

    public getLastQuickPickInput(): string | undefined {
        return this.QUICKPICK_DIALOG_INPUT.value;
    }

    /**
     * Method that mimics VSCode's showInformationMessage API.
     */
    public showInformationMessage(message: string, options?: MessageOptions, ...items: string[]): Thenable<string | void> {
        // if modal, use our showMessageDialog and allow for options and buttons for each item in items array like vscode's API
        if (options?.modal) {
            if (options.detail) {
                return this.showMessageDialog(
                    message,
                    options,
                    ...items
                );
            } else {
                return this.showMessageDialog(
                    'ℹ️ Information',
                    {
                        detail: message,
                    },
                    ...items

                );
            }
        } else {
            // if not modal, use toast
            if (options?.detail) {
                return this.showToast(message, 2000, options.detail);
            } else {
                return this.showToast(message, 2000);
            }
        }
    }

    public showMessageDialog(
        message: string, options?: MessageOptions, ...items: string[]
    ): Thenable<string | undefined> {
        return new Promise<string | undefined>((resolve) => {
            this.__dialogQueue.push({
                type: 'message',
                message,
                options,
                items,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    public async showInputDialog(options: InputDialogOptions): Promise<string | undefined> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'input',
                inputOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    public showSingleCharInputDialog(options: InputDialogOptions): Promise<string | undefined> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'singleChar',
                inputOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    public async showQuickPick(items: QuickPickItem[], options?: QuickPickOptions): Promise<QuickPickItem | undefined> {
        if (!items || items.length === 0) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'quickPick',
                quickPickItems: items,
                quickPickOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    public async showOpenDialog(options?: OpenDialogOptions): Promise<Uri[] | null> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'openFile',
                openDialogOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    public async showSaveDialog(options?: SaveDialogOptions): Promise<Uri | null> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'saveFile',
                saveDialogOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    private _processDialogQueue(): void {
        if (this.__dialogQueue.length === 0 || this.isDialogOpen) {
            return;
        }

        this.isDialogOpen = true;
        const dialog = this.__dialogQueue.shift()!;

        switch (dialog.type) {
            case 'message':
                this._showMessageDialogInternal(dialog);
                break;
            case 'input':
                this._showInputDialogInternal(dialog);
                break;
            case 'singleChar':
                this._showSingleCharInputDialogInternal(dialog);
                break;
            case 'quickPick':
                this._showQuickPickInternal(dialog);
                break;
            case 'openFile':
                this._showOpenDialogInternal(dialog);
                break;
            case 'saveFile':
                this._showSaveDialogInternal(dialog);
                break;
        }
    }

    private _showMessageDialogInternal(dialog: any): void {
        this.HTML_ELEMENT.setAttribute('data-show-message-dialog', 'true');

        this.MODAL_DIALOG_TITLE.textContent = dialog.message;
        this.MODAL_DIALOG_DESCRIPTION.textContent = dialog.options?.detail ?? '';

        const buttonLabels = dialog.items && dialog.items.length > 0 ? dialog.items : ['OK'];

        this.MODAL_DIALOG_BTN_CONTAINER.innerHTML = '';
        let firstButton: HTMLButtonElement | null = null;

        buttonLabels.forEach((label: string) => {
            const btn = document.createElement('button');
            if (!firstButton) {
                firstButton = btn;
            }
            btn.textContent = label;
            btn.className = 'modal-dialog-btn';
            btn.onclick = () => {
                this._cleanupFocusTrap();
                this.HTML_ELEMENT.setAttribute('data-show-message-dialog', 'false');
                this.isDialogOpen = false;
                dialog.resolve(label);
                setTimeout(() => this._processDialogQueue(), 100);
            };
            this.MODAL_DIALOG_BTN_CONTAINER.appendChild(btn);
        });

        // Get the modal dialog container element
        const modalDialog = document.querySelector('#message-dialog') as HTMLElement;
        if (modalDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(modalDialog);
        }

        if (firstButton) {
            // Focus the first button (usually the primary action)
            setTimeout(() => {
                firstButton!.focus();
            }, 0);
        }
    }

    private _showInputDialogInternal(dialog: any): void {
        const options = dialog.inputOptions;
        this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'true');
        this.INPUT_DIALOG_TITLE.textContent = options.title;
        this.INPUT_DIALOG_DESCRIPTION.textContent = options.prompt;
        this.INPUT_DIALOG_INPUT.value = options.value || '';
        this.INPUT_DIALOG_INPUT.placeholder = options.placeholder || '';

        if (options.value) {
            setTimeout(() => {
                this.INPUT_DIALOG_INPUT.select();
            }, 0);
        }

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            this.isDialogOpen = false;
            dialog.resolve(inputValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.INPUT_DIALOG_BTN.textContent = 'OK';
        this.INPUT_DIALOG_BTN.onclick = inputCallback;
        this.INPUT_DIALOG_INPUT.onkeydown = (e) => {
            if (e.key === 'Enter') {
                inputCallback();
            }
        };

        // Set up focus trap
        const inputDialog = document.querySelector('#input-dialog') as HTMLElement;
        if (inputDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(inputDialog);
        }

        setTimeout(() => {
            this.INPUT_DIALOG_INPUT.focus();
        }, 0);
    }

    private _showSingleCharInputDialogInternal(dialog: any): void {
        const options = dialog.inputOptions;
        this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'true');
        this.INPUT_DIALOG_TITLE.textContent = options.title;
        this.INPUT_DIALOG_DESCRIPTION.textContent = options.prompt;
        this.INPUT_DIALOG_INPUT.value = options.value || '';
        this.INPUT_DIALOG_INPUT.placeholder = options.placeholder || '';

        // add 'hidden-button' class to OK button since we don't need it for single char input
        this.INPUT_DIALOG_BTN.classList.add('hidden-button');

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            // Remove the 'hidden-button' class from OK button for future dialogs
            this.INPUT_DIALOG_BTN.classList.remove('hidden-button');
            this.isDialogOpen = false;
            dialog.resolve(inputValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.INPUT_DIALOG_INPUT.oninput = () => {
            if (this.INPUT_DIALOG_INPUT.value.length >= 1) {
                this.INPUT_DIALOG_INPUT.value = this.INPUT_DIALOG_INPUT.value.charAt(0);
                inputCallback();
            }
        };

        // Set up focus trap
        const inputDialog = document.querySelector('#input-dialog') as HTMLElement;
        if (inputDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(inputDialog);
        }

        setTimeout(() => {
            this.INPUT_DIALOG_INPUT.focus();
        }, 0);
    }

    private _showQuickPickInternal(dialog: any): void {
        const items: QuickPickItem[] = dialog.quickPickItems;
        const options = dialog.quickPickOptions;

        this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'true');

        this.QUICKPICK_DIALOG_INPUT.placeholder = options?.placeHolder || '';
        this.QUICKPICK_DIALOG_INPUT.value = '';

        let filteredItems: QuickPickItem[] = [...items];
        let selectedIndex = -1;

        for (let i = 0; i < items.length; i++) {
            if (items[i]!.picked) {
                selectedIndex = i;
                break;
            }
        }
        if (selectedIndex === -1) {
            for (let i = 0; i < items.length; i++) {
                if (items[i]!.kind !== -1) {
                    selectedIndex = i;
                    break;
                }
            }
        }

        const renderList = () => {
            this.QUICKPICK_DIALOG_LIST.innerHTML = '';

            if (filteredItems.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No results';
                li.style.fontStyle = 'italic';
                li.style.color = 'var(--find-placeholder-color)';
                li.style.cursor = 'default';
                li.style.pointerEvents = 'none';
                this.QUICKPICK_DIALOG_LIST.appendChild(li);
                return;
            }

            filteredItems.forEach((item, index) => {
                const li = document.createElement('li');

                if (item.kind === -1) {
                    li.classList.add('separator');
                    li.textContent = item.label;
                    this.QUICKPICK_DIALOG_LIST.appendChild(li);
                    return;
                }

                const labelSpan = document.createElement('span');
                labelSpan.className = 'quick-pick-label';
                labelSpan.textContent = item.label;
                li.appendChild(labelSpan);

                if (item.description) {
                    const descSpan = document.createElement('span');
                    descSpan.className = 'quick-pick-description';
                    descSpan.textContent = item.description;
                    li.appendChild(descSpan);
                }

                if (item.detail) {
                    const detailDiv = document.createElement('div');
                    detailDiv.className = 'quick-pick-detail';
                    detailDiv.textContent = item.detail;
                    li.appendChild(detailDiv);
                }

                if (index === selectedIndex) {
                    li.classList.add('selected');
                    setTimeout(() => {
                        li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }, 0);
                }

                li.onclick = () => {
                    this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'false');
                    if (options?.onDidSelectItem) {
                        options.onDidSelectItem(item);
                    }
                    this.isDialogOpen = false;
                    dialog.resolve(item);
                    setTimeout(() => this._processDialogQueue(), 100);
                };

                this.QUICKPICK_DIALOG_LIST.appendChild(li);
            });
        };

        const filterItems = () => {
            const filterText = this.QUICKPICK_DIALOG_INPUT.value.toLowerCase().trim();

            if (!filterText) {
                filteredItems = [...items];
            } else {
                filteredItems = items.filter(item => {
                    if (item.kind === -1) {
                        return false;
                    }
                    if (item.alwaysShow) {
                        return true;
                    }
                    const labelMatch = item.label.toLowerCase().includes(filterText);
                    const descMatch = item.description?.toLowerCase().includes(filterText) || false;
                    const detailMatch = item.detail?.toLowerCase().includes(filterText) || false;
                    return labelMatch || descMatch || detailMatch;
                });
            }

            selectedIndex = -1;
            for (let i = 0; i < filteredItems.length; i++) {
                if (filteredItems[i]!.kind !== -1) {
                    selectedIndex = i;
                    break;
                }
            }

            renderList();
        };

        const closeDialog = (returnValue: QuickPickItem | string | null) => {
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'false');
            this.QUICKPICK_DIALOG_INPUT.onkeydown = null;
            this.QUICKPICK_DIALOG_INPUT.oninput = null;
            this.isDialogOpen = false;
            dialog.resolve(returnValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.QUICKPICK_DIALOG_INPUT.onkeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        if (options?.onDidSelectItem) {
                            options.onDidSelectItem(selectedItem);
                        }
                        closeDialog(selectedItem);
                    }
                } else {
                    closeDialog(null);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                for (let i = selectedIndex + 1; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                renderList();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                for (let i = selectedIndex - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                renderList();
            } else if (e.key === 'PageDown') {
                e.preventDefault();
                let count = 0;
                for (let i = selectedIndex + 1; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        count++;
                        if (count >= 5) break;
                    }
                }
                renderList();
            } else if (e.key === 'PageUp') {
                e.preventDefault();
                let count = 0;
                for (let i = selectedIndex - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        count++;
                        if (count >= 5) break;
                    }
                }
                renderList();
            } else if (e.key === 'Tab') {
                e.preventDefault();
            }
        };

        this.QUICKPICK_DIALOG_INPUT.oninput = () => {
            filterItems();
        };

        renderList();

        // Set up focus trap
        const quickPickDialog = document.querySelector('#quickpick-dialog') as HTMLElement;
        if (quickPickDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(quickPickDialog);
        }

        setTimeout(() => {
            this.QUICKPICK_DIALOG_INPUT.focus();
        }, 0);
    }

    private async _showOpenDialogInternal(dialog: any): Promise<void> {
        const options = dialog.openDialogOptions;

        try {
            // Build proper options for window.showOpenFilePicker from OpenDialogOptions
            const properOptions: OpenFilePickerOptions = {
                multiple: options?.canSelectMany ?? false,
                excludeAcceptAllOption: false,
            };

            // Add file type filters if provided
            if (options?.filters && Object.keys(options.filters).length > 0) {
                const types: FilePickerAcceptType[] = [];

                for (const [description, extensions] of Object.entries(options.filters as { [name: string]: string[] })) {
                    // Skip "all files" filter - browser provides this by default
                    if (extensions.includes('.*') || extensions.includes('*')) {
                        continue;
                    }

                    // Use a unique MIME type per filter to prevent extension mixing
                    types.push({
                        description,
                        accept: {
                            [`application/${description.toLowerCase().replace(/\s+/g, '-')}`]: extensions.map(ext =>
                                ext.startsWith('.') ? ext : `.${ext}`
                            ) as `.${string}`[]
                        }
                    });
                }

                if (types.length > 0) {
                    properOptions.types = types;
                }
            }

            // Set start location if defaultUri is provided
            if (options?.defaultUri) {
                properOptions.startIn = 'documents';
            }

            const fileHandles = await window.showOpenFilePicker(properOptions);

            // Check that all chosen files are inside the workspace directory
            const workspaceDir = workspace.getWorkspaceDirHandle();
            const uris: Uri[] = [];

            for (const fileHandle of fileHandles) {
                if (workspaceDir) {
                    const result = await workspaceDir.resolve(fileHandle);
                    if (!result || result.length === 0) {
                        this.showToast('⚠️ Selected file is not inside workspace.', 3000);
                        continue;
                    }
                }
                const resolveResult = await workspace.getWorkspaceDirHandle()?.resolve(fileHandle);
                const filename = resolveResult ? '/' + resolveResult.join('/') : fileHandle.name;
                uris.push(new Uri(filename));
            }

            this.isDialogOpen = false;
            dialog.resolve(uris.length > 0 ? uris : null);
            setTimeout(() => this._processDialogQueue(), 100);
        } catch (e) {
            console.error('Error showing native open file dialog:', e);
            this.isDialogOpen = false;
            dialog.resolve(null);
            setTimeout(() => this._processDialogQueue(), 100);
        }
    }

    private async _showSaveDialogInternal(dialog: any): Promise<void> {
        const options = dialog.saveDialogOptions;

        try {
            // Build proper options for window.showSaveFilePicker from SaveDialogOptions
            const properOptions: SaveFilePickerOptions = {
                excludeAcceptAllOption: false,
            };

            // Add file type filters if provided
            if (options?.filters && Object.keys(options.filters).length > 0) {
                const types: FilePickerAcceptType[] = [];

                for (const [description, extensions] of Object.entries(options.filters as { [name: string]: string[] })) {
                    // Skip "all files" filter - browser provides this by default
                    if (extensions.includes('.*') || extensions.includes('*')) {
                        continue;
                    }

                    // Use a unique MIME type per filter to prevent extension mixing
                    types.push({
                        description,
                        accept: {
                            [`application/${description.toLowerCase().replace(/\s+/g, '-')}`]: extensions.map(ext =>
                                ext.startsWith('.') ? ext : `.${ext}`
                            ) as `.${string}`[]
                        }
                    });
                }

                if (types.length > 0) {
                    properOptions.types = types;
                }
            }

            // Set suggested file name if defaultUri is provided
            if (options?.defaultUri) {
                const pathParts = options.defaultUri.fsPath.split('/');
                const fileName = pathParts[pathParts.length - 1];
                if (fileName) {
                    properOptions.suggestedName = fileName;
                }
                properOptions.startIn = 'documents';
            }

            const fileHandle = await window.showSaveFilePicker(properOptions);

            // Check that the chosen file is inside the workspace directory
            const workspaceDir = workspace.getWorkspaceDirHandle();
            if (workspaceDir) {
                const result = await workspaceDir.resolve(fileHandle);
                if (!result || result.length === 0) {
                    this.showToast('⚠️ Selected file is not inside workspace.', 2000);
                    this.isDialogOpen = false;
                    dialog.resolve(null);
                    setTimeout(() => this._processDialogQueue(), 100);
                    return;
                }
            }
            const resolveResult = await workspace.getWorkspaceDirHandle()?.resolve(fileHandle);
            const filename = resolveResult ? '/' + resolveResult.join('/') : fileHandle.name;

            this.isDialogOpen = false;
            dialog.resolve(new Uri(filename));
            setTimeout(() => this._processDialogQueue(), 100);
        } catch (e) {
            console.error('Error showing native save file dialog:', e);
            this.isDialogOpen = false;
            dialog.resolve(null);
            setTimeout(() => this._processDialogQueue(), 100);
        }
    }

    private _setupFocusTrap(container: HTMLElement): () => void {
        // Get all focusable elements within the container
        const getFocusableElements = (): HTMLElement[] => {
            const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            return Array.from(container.querySelectorAll<HTMLElement>(selector))
                .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0]!;
            const lastElement = focusableElements[focusableElements.length - 1]!;

            if (e.shiftKey) {
                // Shift+Tab: if on first element, move to last
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: if on last element, move to first
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }

    private _cleanupFocusTrap(): void {
        if (this.__activeFocusTrap) {
            this.__activeFocusTrap();
            this.__activeFocusTrap = null;
        }
    }

}