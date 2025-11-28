import { TreeNode, FlatRow, MenuEntry } from './types';
import * as utils from './utils';

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
    public HTML_ELEMENT: HTMLElement;

    public activeTopMenu: HTMLDivElement | null = null;
    public focusedMenuItem: HTMLDivElement | null = null;
    public topLevelItems: HTMLDivElement[] = [];
    public topLevelSubmenus = new Map();

    private _flatRows: FlatRow[] | null = null; // Array of nodes currently visible in the outline pane, null at init time to not trigger render
    public get flatRows(): FlatRow[] | null {
        return this._flatRows;
    }
    public setTreeData(rows: FlatRow[]) {
        this._flatRows = rows;
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

        // Build the menu
        this.topLevelItems.length = 0;
        this.topLevelSubmenus.clear();
    }

    public renderTree = () => {
        if (!this._flatRows) {
            return; // Not initialized yet
        }

        // Render visible rows only
        const scrollTop = this.OUTLINE_PANE.scrollTop;
        const viewportHeight = this.OUTLINE_PANE.clientHeight;
        const viewportWidth = this.OUTLINE_PANE.clientWidth;

        const startIndex = Math.floor(scrollTop / this.ROW_HEIGHT);
        const visibleCount = Math.ceil(viewportHeight / this.ROW_HEIGHT) + 1;
        const endIndex = Math.min(this._flatRows.length, startIndex + visibleCount);
        let leftOffset = this.LEFT_OFFSET;

        // If all nodes have no children, remove the left offset
        if (this._flatRows.every(row => !row.hasChildren)) {
            leftOffset = 0;
        }

        this.SPACER.innerHTML = "";
        this.SPACER.style.height = this._flatRows.length * this.ROW_HEIGHT + "px";
        for (let i = startIndex; i < endIndex; i++) {
            const row = this._flatRows[i]!;
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

    public buildMenu(entries: MenuEntry[], level = 0) {
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

    public scrollNodeIntoView(node: TreeNode) {
        if (!this._flatRows) return; // Not initialized yet

        const selectedIndex = this._flatRows.findIndex(row => row.node === node);
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

    public initializeThemeAndLayout(defaultTitle: string) {
        document.title = defaultTitle;
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
            } catch (e) {
                console.error('Error loading layout preferences:', e);
            }
        } else {
            this.applyTheme(this.currentTheme);
            this.applyLayout(this.currentLayout);
        }
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

    public showToast(message: string, duration = 2000) {
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

    public showBody(text: string, wrap: boolean) {
        if (wrap) {
            this.BODY_PANE.style.whiteSpace = "pre-wrap"; // Wrap text
        } else {
            this.BODY_PANE.style.whiteSpace = "pre"; // No wrapping
        }
        this.BODY_PANE.innerHTML = text;
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

}