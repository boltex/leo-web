import { MenuEntry, OpenDialogOptions, SaveDialogOptions, InputDialogOptions, MessageOptions, QuickPickItem, QuickPickOptions, FlatRowLeo } from './types';
import * as utils from './utils';
import { Uri, workspace } from './workspace';
import { Position } from './core/leoNodes';
import * as body from './body';
import { DialogManager } from './DialogManager';

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
    // public UNDO_TAB: HTMLDivElement; // Maybe add undo tab functionality later
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

    // Dialog Manager
    private dialogManager!: DialogManager;

    public get isDialogOpen(): boolean {
        return this.dialogManager?.isDialogOpen ?? false;
    }

    public minWidth = 20;
    public minHeight = 20;

    private _changeSelectionTimer: ReturnType<typeof setTimeout> | undefined;
    private _changeScrollTimer: ReturnType<typeof setTimeout> | undefined;



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
        // this.UNDO_TAB = document.getElementById('undo-tab')! as HTMLDivElement; // Maybe add undo tab functionality later
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

        // Initialize Dialog Manager
        this.dialogManager = new DialogManager(this.HTML_ELEMENT);
        this.dialogManager.setShowToastCallback((message: string, duration: number) => {
            this.showToast(message, duration);
        });

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

    public isOutlineFocused(): boolean {
        // Check if the currently focused element is within the outline pane (OUTLINE_PANE)
        const activeElement = document.activeElement;
        return activeElement !== null && this.OUTLINE_PANE.contains(activeElement);
    }

    public isBodyFocused(): boolean {
        // Check if the currently focused element is within the body pane (BODY_PANE)
        const activeElement = document.activeElement;
        return activeElement !== null && this.BODY_PANE.contains(activeElement);
    }

    // private getNodePath(node: Node): number[] {
    //     const path: number[] = [];
    //     let current: Node | null = node;
    //     while (current && current !== this.BODY_PANE) {
    //         const parent: Node | null = current.parentNode;
    //         if (!parent) break;
    //         const index = Array.prototype.indexOf.call(parent.childNodes, current);
    //         path.unshift(index);
    //         current = parent;
    //     }
    //     return path;
    // }

    public setChangeTextEditorSelectionCallback(callback: (selection: body.Selection) => void) {
        const handleSelectionChange = () => {

            if (this._changeSelectionTimer) {
                clearTimeout(this._changeSelectionTimer);
            }

            this._changeSelectionTimer = setTimeout(() => {
                const domSelection = document.getSelection();
                if (!domSelection || domSelection.rangeCount === 0) return;

                // Check if the selection is within the BODY_PANE
                const range = domSelection.getRangeAt(0);
                if (!this.BODY_PANE.contains(range.commonAncestorContainer)) {
                    return; // Selection is not in the body pane
                }

                // Convert DOM selection to Position/Selection objects
                const anchorPos = this.offsetToPosition(domSelection.anchorOffset, domSelection.anchorNode);
                const activePos = this.offsetToPosition(domSelection.focusOffset, domSelection.focusNode);

                const selection = new body.Selection(anchorPos, activePos);
                callback(selection);
            }, 50); // debounce delay in ms

        };

        // Listen on document, not on BODY_PANE
        document.addEventListener('selectionchange', handleSelectionChange);
    }

    // Helper method to convert DOM offset to Position
    private offsetToPosition(offset: number, node: Node | null): body.Position {
        if (!node) return new body.Position(0, 0);

        const bodyText = this.BODY_PANE.innerText;
        const beforeNode = this.getTextBeforeNode(node);
        const totalOffset = beforeNode.length + offset;

        // Convert absolute offset to line/character
        const lines = bodyText.substring(0, totalOffset).split('\n');
        const line = lines.length - 1;
        const character = lines[lines.length - 1].length;

        return new body.Position(line, character);
    }

    private getTextBeforeNode(node: Node): string {
        // Implementation to get all text before the given node within BODY_PANE
        // This is a simplified version - you may need to refine based on your DOM structure
        let text = '';
        const walker = document.createTreeWalker(
            this.BODY_PANE,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode === node) break;
            text += currentNode.textContent || '';
        }

        return text;
    }

    public setChangeTextEditorScrollCallback(callback: (event: number) => void) {
        this.BODY_PANE.addEventListener('scroll', (e) => {
            if (this._changeScrollTimer) {
                clearTimeout(this._changeScrollTimer);
            }
            this._changeScrollTimer = setTimeout(() => {

                callback(this.BODY_PANE.scrollTop);

            }, 100); // debounce delay in ms
        });
    }

    public setBodyScroll(scroll: number) {
        this.BODY_PANE.scrollTop = scroll;
    }

    public setBodySelection(selection: body.Selection) {
        // Convert body.Selection to DOM Range and set it in the BODY_PANE
        const range = document.createRange();
        const { anchor, active } = selection;
        const anchorInfo = this.positionToNodeOffset(anchor);
        const activeInfo = this.positionToNodeOffset(active);

        range.setStart(anchorInfo.node, anchorInfo.offset);
        range.setEnd(activeInfo.node, activeInfo.offset);

        const selectionObj = window.getSelection();
        if (selectionObj) {
            selectionObj.removeAllRanges();
            selectionObj.addRange(range);
        }
    }

    public positionToNodeOffset(position: body.Position): { node: Node; offset: number } {
        // Convert body.Position (line/character) to a DOM node and offset within BODY_PANE
        const bodyText = this.BODY_PANE.innerText;
        const lines = bodyText.split('\n');
        let charCount = 0;
        for (let i = 0; i < position.line; i++) {
            charCount += lines[i].length + 1; // +1 for the newline character
        }
        charCount += position.character;

        // Find the corresponding DOM node and offset
        const walker = document.createTreeWalker(
            this.BODY_PANE,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentNode;
        let accumulatedLength = 0;
        while (currentNode = walker.nextNode()) {
            const nodeLength = currentNode.textContent?.length || 0;
            if (accumulatedLength + nodeLength >= charCount) {
                return { node: currentNode, offset: charCount - accumulatedLength };
            }
            accumulatedLength += nodeLength;
        }

        // Fallback to the end of BODY_PANE
        return { node: this.BODY_PANE, offset: this.BODY_PANE.childNodes.length };
    }

    public setEditorTouchedCallback(callback: (change: { type: string; content: string | null }) => void) {
        this.BODY_PANE.addEventListener('input', (e) => {
            const inputEvent = e as InputEvent;
            callback({
                type: inputEvent.inputType,
                content: inputEvent.data
            });
        });
        this.BODY_PANE.addEventListener('paste', (e) => {
            const clipboardEvent = e as ClipboardEvent;
            callback({
                type: 'paste',
                content: clipboardEvent.clipboardData?.getData('text/plain') ?? null
            });
        });
        this.BODY_PANE.addEventListener('cut', (e) => {
            const clipboardEvent = e as ClipboardEvent;
            callback({
                type: 'cut',
                content: clipboardEvent.clipboardData?.getData('text/plain') ?? null
            });
        });
    }

    public setBodyFocusOutCallback(callback: () => void) {
        this.BODY_PANE.addEventListener('blur', () => {
            callback();
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
                // First check for enabledFlagsSet and enabledFlagsClear to determine if the item should be enabled
                let enabled = true;
                if (entry.enabledFlagsSet) {
                    for (const flag of entry.enabledFlagsSet) {
                        if (!workspace.getContext(flag)) {
                            enabled = false;
                            break;
                        }
                    }
                }
                if (enabled && entry.enabledFlagsClear) {
                    for (const flag of entry.enabledFlagsClear) {
                        if (workspace.getContext(flag)) {
                            enabled = false;
                            break;
                        }
                    }
                }
                if (!enabled) {
                    item.classList.add("disabled");
                }

                item.addEventListener("click", () => {
                    this.closeAllSubmenus();
                    this.restoreLastFocusedElement();
                    this.activeTopMenu = null;
                    workspace.controller.doCommand(entry.action as string);
                });

                if (entry.enabledFlagsSet || entry.enabledFlagsClear) {
                    // Has a condition so save the DOM element reference for later updates
                    entry.domElementRef = item;
                }

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

    public refreshMenu(entries: MenuEntry[], level = 0) {
        // Go through the menu and for each entry with enabledFlagsSet or enabledFlagsClear, check the conditions and update the disabled state
        for (const entry of entries) {
            if (entry.entries) {
                // Recursively process submenus
                this.refreshMenu(entry.entries, level + 1);
            } else if (entry.domElementRef) {
                // This item has conditions, check them and update disabled state
                let enabled = true;

                if (entry.enabledFlagsSet) {
                    for (const flag of entry.enabledFlagsSet) {
                        if (!workspace.getContext(flag)) {
                            enabled = false;
                            break;
                        }
                    }
                }

                if (enabled && entry.enabledFlagsClear) {
                    for (const flag of entry.enabledFlagsClear) {
                        if (workspace.getContext(flag)) {
                            enabled = false;
                            break;
                        }
                    }
                }

                // Update the DOM element's disabled state
                if (enabled) {
                    entry.domElementRef.classList.remove("disabled");
                } else {
                    entry.domElementRef.classList.add("disabled");
                }
            }
        }
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
        this.setBodyWrap(wrap);

        // Escape the text to prevent HTML injection, <, >, &, etc. but preserve newlines and spaces
        text = this._escapeBodyText(text);

        this.BODY_PANE.innerHTML = text;
    }

    public setBodyWrap(wrap: boolean) {
        this.HTML_ELEMENT.setAttribute('data-body-wrap', wrap ? 'true' : 'false');
    }

    private _escapeBodyText(text: string): string {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    public getBody(): string {
        return this.BODY_PANE.textContent || "";
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

    // * Button states
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

    public updateMarkedButtonStates(hasMarkedNodes: boolean) {
        this.NEXT_MARKED_BTN.disabled = !hasMarkedNodes;
        this.PREV_MARKED_BTN.disabled = !hasMarkedNodes;
    }

    public updateHoistButtonStates(hoist: boolean, deHoist: boolean) {
        this.HOIST_BTN.disabled = !hoist;
        this.DEHOIST_BTN.disabled = !deHoist;
    }

    public updateHistoryButtonStates(previous: boolean, next: boolean) {
        this.PREV_BTN.disabled = !previous;
        this.NEXT_BTN.disabled = !next;
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
        return this.dialogManager.getLastQuickPickInput();
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
        return this.dialogManager.showMessageDialog(message, options, ...items);
    }

    public async showInputDialog(options: InputDialogOptions): Promise<string | undefined> {
        return this.dialogManager.showInputDialog(options);
    }

    public showSingleCharInputDialog(options: InputDialogOptions): Promise<string | undefined> {
        return this.dialogManager.showSingleCharInputDialog(options);
    }

    public async showQuickPick(items: QuickPickItem[], options?: QuickPickOptions): Promise<QuickPickItem | undefined> {
        return this.dialogManager.showQuickPick(items, options);
    }

    public async showOpenDialog(options?: OpenDialogOptions): Promise<Uri[] | null> {
        return this.dialogManager.showOpenDialog(options);
    }

    public async showSaveDialog(options?: SaveDialogOptions): Promise<Uri | null> {
        return this.dialogManager.showSaveDialog(options);
    }


}