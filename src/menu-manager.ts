//@+leo-ver=5-thin
//@+node:felix.20260321200216.1: * @file src/menu-manager.ts
//@+<< imports >>
//@+node:felix.20260323010551.1: ** << imports >>
import { workspace } from './workspace';
import { ButtonEntry, ContextMenuEntry, MenuEntry, QuickPickItemKind } from "./types";

//@-<< imports >>
//@+others
//@+node:felix.20260323010625.1: ** MenuManager
/**
 * Manages the UI controls that launch commands or change settings. 
 * (see LayoutManager for layout related controls and LogPaneManager for log, find, nav, and settings tabs.)
 */
export class MenuManager {

    public HTML_ELEMENT: HTMLElement;

    public COLLAPSE_ALL_BTN: HTMLElement;

    // * Context Menus
    public OUTLINE_MENU: HTMLElement;
    public BODY_MENU: HTMLElement;
    public UNDO_MENU: HTMLElement;
    public AT_BUTTON_MENU: HTMLElement;

    // * Top Menu
    public TOP_BAR: HTMLElement;
    public TOP_MENU: HTMLElement;
    public MENU_TOGGLE: HTMLElement;
    public TOP_BAR_TOGGLE: HTMLElement;
    public DOCUMENT_TABS: HTMLElement;

    // * Button Menu
    public BUTTON_CONTAINER: HTMLElement;
    public TRIGGER_AREA: HTMLElement;

    public LAYOUT_TOGGLE: HTMLElement;
    public THEME_TOGGLE: HTMLElement;
    public THEME_ICON: HTMLElement;

    public DEHOIST_BTN: HTMLButtonElement;
    public HOIST_BTN: HTMLButtonElement;
    public NEXT_BTN: HTMLButtonElement;
    public PREV_BTN: HTMLButtonElement;

    public NEXT_MARKED_BTN: HTMLButtonElement;
    public TOGGLE_MARK_BTN: HTMLButtonElement;
    public PREV_MARKED_BTN: HTMLButtonElement;


    public TOOLBAR: HTMLElement;
    public AT_BUTTONS_CONTAINER: HTMLElement;
    public ICON_BUTTONS_CONTAINER: HTMLElement;

    // * Settings Menu
    public SHOW_PREV_NEXT_MARK: HTMLInputElement;
    public SHOW_TOGGLE_MARK: HTMLInputElement;
    public SHOW_PREV_NEXT_HISTORY: HTMLInputElement;
    public SHOW_HOIST_DEHOIST: HTMLInputElement;
    public SHOW_LAYOUT_ORIENTATION: HTMLInputElement;
    public SHOW_THEME_TOGGLE: HTMLInputElement;
    public SHOW_NODE_ICONS: HTMLInputElement;
    public SHOW_WELCOME_AT_STARTUP: HTMLInputElement;

    public activeTopMenu: HTMLDivElement | null = null;
    public focusedMenuItem: HTMLDivElement | null = null;
    public topLevelItems: HTMLDivElement[] = [];
    public topLevelSubmenus = new Map();

    public isMenuShown = false;

    private resizeTimeout: number | undefined;

    constructor() {
        this.HTML_ELEMENT = document.documentElement;

        this.COLLAPSE_ALL_BTN = document.getElementById("collapse-all-btn")!;

        this.OUTLINE_MENU = document.getElementById('outline-menu')!;
        this.BODY_MENU = document.getElementById('body-menu')!;
        this.UNDO_MENU = document.getElementById('undo-menu')!;
        this.AT_BUTTON_MENU = document.getElementById('at-button-menu')!;

        this.TOP_BAR = document.getElementById("top-bar")!;
        this.TOP_MENU = document.getElementById("top-menu")!;
        this.MENU_TOGGLE = document.getElementById('menu-toggle')!;
        this.TOP_BAR_TOGGLE = document.getElementById("top-bar-toggle")!;
        this.DOCUMENT_TABS = document.getElementById("document-tabs")!;

        this.BUTTON_CONTAINER = document.getElementById('button-container')!;
        this.TRIGGER_AREA = document.getElementById('button-trigger-area')!;

        this.LAYOUT_TOGGLE = document.getElementById('layout-toggle')!;
        this.THEME_TOGGLE = document.getElementById('theme-toggle')!;
        this.THEME_ICON = document.getElementById('theme-icon')!;

        this.DEHOIST_BTN = document.getElementById('dehoist-btn')! as HTMLButtonElement;
        this.HOIST_BTN = document.getElementById('hoist-btn')! as HTMLButtonElement;
        this.NEXT_BTN = document.getElementById('next-btn')! as HTMLButtonElement;
        this.PREV_BTN = document.getElementById('prev-btn')! as HTMLButtonElement;

        this.NEXT_MARKED_BTN = document.getElementById('next-marked-btn')! as HTMLButtonElement;
        this.TOGGLE_MARK_BTN = document.getElementById('toggle-mark-btn')! as HTMLButtonElement;
        this.PREV_MARKED_BTN = document.getElementById('prev-marked-btn')! as HTMLButtonElement;

        this.TOOLBAR = document.getElementById('toolbar')!;
        this.AT_BUTTONS_CONTAINER = document.getElementById('at-buttons')!;
        this.ICON_BUTTONS_CONTAINER = document.getElementById('icon-buttons')!;

        this.SHOW_PREV_NEXT_MARK = document.getElementById('show-prev-next-mark')! as HTMLInputElement;
        this.SHOW_TOGGLE_MARK = document.getElementById('show-toggle-mark')! as HTMLInputElement;
        this.SHOW_PREV_NEXT_HISTORY = document.getElementById('show-prev-next-history')! as HTMLInputElement;
        this.SHOW_HOIST_DEHOIST = document.getElementById('show-hoist-dehoist')! as HTMLInputElement;
        this.SHOW_LAYOUT_ORIENTATION = document.getElementById('show-layout-orientation')! as HTMLInputElement;
        this.SHOW_THEME_TOGGLE = document.getElementById('show-theme-toggle')! as HTMLInputElement;
        this.SHOW_NODE_ICONS = document.getElementById('show-node-icons')! as HTMLInputElement;
        this.SHOW_WELCOME_AT_STARTUP = document.getElementById('show-welcome')! as HTMLInputElement;

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

    //@+others
    //@+node:felix.20260323010814.1: *3* Context Menus
    //@+node:felix.20260410220507.1: *4* buildContextMenu
    private buildContextMenu(container: HTMLElement, entries: ContextMenuEntry[]) {
        container.innerHTML = '';
        const ul = document.createElement('ul');
        for (const entry of entries) {
            if (entry.kind === QuickPickItemKind.Separator) {
                const sep = document.createElement('li');
                sep.className = 'context-menu-separator';
                ul.appendChild(sep);
                continue;
            }

            const li = document.createElement('li');
            if (entry.command) {
                li.classList.add('menu-item');
            }

            const label = document.createElement('span');
            label.className = 'menu-label';
            label.textContent = entry.label;
            li.appendChild(label);

            if (entry.keyboardShortcut) {
                const shortcut = document.createElement('span');
                shortcut.className = 'menu-shortcut';
                shortcut.textContent = entry.keyboardShortcut;
                li.appendChild(shortcut);
            }
            let enabled = true;
            if (entry.enabledFlagsSet) {
                for (const flag of entry.enabledFlagsSet) {
                    if (!workspace.getContext(flag)) { enabled = false; break; }
                }
            }
            if (enabled && entry.enabledFlagsClear) {
                for (const flag of entry.enabledFlagsClear) {
                    if (workspace.getContext(flag)) { enabled = false; break; }
                }
            }
            if (!enabled) {
                li.classList.add('disabled');
            }
            if (entry.command) {
                li.addEventListener('click', () => {
                    if (!li.classList.contains('disabled')) {
                        workspace.controller.doCommand(entry.command as string);
                    }
                });
            }
            if (entry.enabledFlagsSet || entry.enabledFlagsClear) {
                entry.domElementRef = li;
            }
            ul.appendChild(li);
        }
        container.appendChild(ul);
    }
    //@+node:felix.20260410220513.1: *4* refreshContextMenu
    private refreshContextMenu(entries: ContextMenuEntry[]) {
        for (const entry of entries) {
            if (!entry.domElementRef) { continue; }
            let enabled = true;
            if (entry.enabledFlagsSet) {
                for (const flag of entry.enabledFlagsSet) {
                    if (!workspace.getContext(flag)) { enabled = false; break; }
                }
            }
            if (enabled && entry.enabledFlagsClear) {
                for (const flag of entry.enabledFlagsClear) {
                    if (workspace.getContext(flag)) { enabled = false; break; }
                }
            }
            if (enabled) {
                entry.domElementRef.classList.remove('disabled');
            } else {
                entry.domElementRef.classList.add('disabled');
            }
        }
    }
    //@+node:felix.20260410220518.1: *4* buildBodyContextMenu
    public buildBodyContextMenu(entries: ContextMenuEntry[]) {
        this.buildContextMenu(this.BODY_MENU, entries);
    }
    //@+node:felix.20260410220521.1: *4* refreshBodyContextMenu
    public refreshBodyContextMenu(entries: ContextMenuEntry[]) {
        this.refreshContextMenu(entries);
    }
    //@+node:felix.20260410220527.1: *4* buildOutlineContextMenu
    public buildOutlineContextMenu(entries: ContextMenuEntry[]) {
        this.buildContextMenu(this.OUTLINE_MENU, entries);
    }
    //@+node:felix.20260410220531.1: *4* refreshOutlineContextMenu
    public refreshOutlineContextMenu(entries: ContextMenuEntry[]) {
        this.refreshContextMenu(entries);
    }
    //@+node:felix.20260323010803.1: *3* Top Menu
    //@+node:felix.20260410221205.1: *4* buildMenu
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
                    item.addEventListener("pointerdown", (e) => {
                        e.stopPropagation();
                        if (this.activeTopMenu === item) {
                            this.closeAllSubmenus();
                            this.activeTopMenu = null;
                            workspace.layout.restoreLastFocusedElement();
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
            } else if (entry.command) {
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

                item.addEventListener("pointerup", () => {
                    this.closeAllSubmenus();
                    workspace.layout.restoreLastFocusedElement();
                    this.activeTopMenu = null;
                    workspace.controller.doCommand(entry.command as string);
                });

                if (entry.enabledFlagsSet || entry.enabledFlagsClear) {
                    // Has a condition so save the DOM element reference for later updates
                    entry.domElementRef = item;
                }

            }

            if (level === 0) {
                this.topLevelItems.push(item);
                menu.appendChild(item);
            } else {
                menu.appendChild(item);
            }

        }

        return menu;
    }
    //@+node:felix.20260410221156.1: *4* refreshMenu
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
    //@+node:felix.20260410221149.1: *4* constrainToViewport
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
    //@+node:felix.20260410221143.1: *4* repositionOpenMenus
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
    //@+node:felix.20260410221137.1: *4* findParentMenuItem
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
    //@+node:felix.20260410221131.1: *4* getMenuLevel
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
    //@+node:felix.20260410221058.1: *4* openTopMenu
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
    //@+node:felix.20260410221050.1: *4* positionSubmenu
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
    //@+node:felix.20260410221042.1: *4* closeAllSubmenus
    public closeAllSubmenus() {
        this.OUTLINE_MENU.style.display = "none";
        this.BODY_MENU.style.display = "none";
        this.UNDO_MENU.style.display = "none";
        this.AT_BUTTON_MENU.style.display = "none";
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
    //@+node:felix.20260410221027.1: *4* focusMenuItem
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
    //@+node:felix.20260410221009.1: *4* closeMenusEvent
    public closeMenusEvent(e: MouseEvent) {
        this.OUTLINE_MENU.style.display = "none";
        this.BODY_MENU.style.display = "none";
        this.UNDO_MENU.style.display = "none";
        this.AT_BUTTON_MENU.style.display = "none";
        const target = e.target as Element;
        if (!target.closest('.menu')) {
            this.closeAllSubmenus();
            this.activeTopMenu = null;
        }
    }
    //@+node:felix.20260410221001.1: *4* toggleMenu
    public toggleMenu() {
        this.isMenuShown = !this.isMenuShown;
        this.OUTLINE_MENU.style.display = "none";
        this.BODY_MENU.style.display = "none";
        this.UNDO_MENU.style.display = "none";
        this.AT_BUTTON_MENU.style.display = "none";
        this.HTML_ELEMENT.setAttribute('data-show-menu', this.isMenuShown ? 'true' : 'false');

        if (this.isMenuShown) {
            this.BUTTON_CONTAINER.classList.add('hidden');
        } else {
            this.BUTTON_CONTAINER.classList.remove('hidden');
            // Set focus on last focused element
            workspace.layout.restoreLastFocusedElement();
        }

        // Recalculate layout dependent items
        workspace.layout.updateOutlinePaneSize();
        workspace.layout.updateOutlineContainerSize();
        workspace.layout.positionCrossDragger();
    }
    //@+node:felix.20260407223125.1: *3* Icon Buttons
    //@+node:felix.20260410221235.1: *4* buildIconButtons
    public buildIconButtons(entries: ButtonEntry[]): void {
        // Build div with class "icon-button" for each entry and add to ICON_BUTTONS_CONTAINER
        this.ICON_BUTTONS_CONTAINER.innerHTML = '';
        for (const entry of entries) {
            const button = document.createElement('div');
            button.className = entry.icon ? 'icon-button glicon ' + entry.icon : 'icon-button';
            if (entry.tooltip) {
                button.title = entry.tooltip;
            }
            if (entry.command) {
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
                    button.classList.add("disabled");
                }
                if (entry.label) {
                    const labelSpan = document.createElement("span");
                    labelSpan.className = "button-label";
                    labelSpan.textContent = entry.label;
                    button.appendChild(labelSpan);
                }

                button.addEventListener("click", () => {
                    this.closeAllSubmenus();
                    workspace.layout.restoreLastFocusedElement();
                    this.activeTopMenu = null;
                    workspace.controller.doCommand(entry.command as string);
                });

                if (entry.enabledFlagsSet || entry.enabledFlagsClear) {
                    // Has a condition so save the DOM element reference for later updates
                    entry.domElementRef = button;
                }
            }

            this.ICON_BUTTONS_CONTAINER.appendChild(button);
        }
    }
    //@+node:felix.20260410221228.1: *4* refreshIconButtons
    public refreshIconButtons(entries: ButtonEntry[]): void {
        for (const entry of entries) {
            if (entry.domElementRef) {
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
                if (enabled) {
                    entry.domElementRef.classList.remove("disabled");
                } else {
                    entry.domElementRef.classList.add("disabled");
                }
            }
        }
    }
    //@+node:felix.20260323010746.1: *3* Document Tabs
    //@+node:felix.20260410221252.1: *4* clearDocumentTabs
    public clearDocumentTabs() {
        this.DOCUMENT_TABS.innerHTML = "";
    }
    //@+node:felix.20260410221256.1: *4* createDocumentTab
    public createDocumentTab(title: string, tooltip: string, isActive: boolean): HTMLDivElement {
        const tab = document.createElement("div");
        tab.className = "document-tab" + (isActive ? " active" : "");
        tab.textContent = title;
        tab.title = tooltip;
        this.DOCUMENT_TABS.appendChild(tab);
        // add the close button
        const closeBtn = document.createElement("div");
        closeBtn.className = "close-btn";
        tab.appendChild(closeBtn);
        return tab;
    }
    //@+node:felix.20260323010715.1: *3* Buttons State and Visibility
    //@+node:felix.20260410221347.1: *4* updateButtonVisibility
    public updateButtonVisibility = (hasMarked: boolean, hasHistory: boolean, noOpenedDocuments = false) => {
        this.toggleButtonVisibility(this.NEXT_MARKED_BTN, this.PREV_MARKED_BTN, this.SHOW_PREV_NEXT_MARK.checked && hasMarked && !noOpenedDocuments);
        this.toggleButtonVisibility(this.TOGGLE_MARK_BTN, null, this.SHOW_TOGGLE_MARK.checked && !noOpenedDocuments);
        this.toggleButtonVisibility(this.NEXT_BTN, this.PREV_BTN, this.SHOW_PREV_NEXT_HISTORY.checked && hasHistory && !noOpenedDocuments);
        this.toggleButtonVisibility(this.HOIST_BTN, this.DEHOIST_BTN, this.SHOW_HOIST_DEHOIST.checked && !noOpenedDocuments);
        this.toggleButtonVisibility(this.LAYOUT_TOGGLE, null, this.SHOW_LAYOUT_ORIENTATION.checked);  // show even when no documents opened.
        this.toggleButtonVisibility(this.THEME_TOGGLE, null, this.SHOW_THEME_TOGGLE.checked); // show even when no documents opened.
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
    //@+node:felix.20260410221342.1: *4* updateMarkedButtonStates
    public updateMarkedButtonStates(hasMarkedNodes: boolean) {
        this.NEXT_MARKED_BTN.disabled = !hasMarkedNodes;
        this.PREV_MARKED_BTN.disabled = !hasMarkedNodes;
    }
    //@+node:felix.20260410221338.1: *4* updateHoistButtonStates
    public updateHoistButtonStates(hoist: boolean, deHoist: boolean) {
        this.HOIST_BTN.disabled = !hoist;
        this.DEHOIST_BTN.disabled = !deHoist;
    }
    //@+node:felix.20260410221334.1: *4* updateHistoryButtonStates
    public updateHistoryButtonStates(previous: boolean, next: boolean) {
        this.PREV_BTN.disabled = !previous;
        this.NEXT_BTN.disabled = !next;
    }
    //@+node:felix.20260410221330.1: *4* toggleButtonVisibility
    public toggleButtonVisibility(button1: HTMLElement | null, button2: HTMLElement | null, isVisible: boolean) {
        if (button1) {
            button1.classList.toggle('hidden-button', !isVisible);
        }
        if (button2) {
            button2.classList.toggle('hidden-button', !isVisible);
        }
    }
    //@+node:felix.20260410221325.1: *4* showButtons
    public setupButtonContainerAutoHide() {
        let hideTimeout: ReturnType<typeof setTimeout>;
        const showButtons = () => {
            clearTimeout(hideTimeout);
            if (workspace.menu.isMenuShown) {
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
    //@+node:felix.20260406002848.1: *3* At-Buttons
    //@+node:felix.20260410221409.1: *4* clearAtButtons
    public clearAtButtons(): void {
        this.AT_BUTTONS_CONTAINER.innerHTML = '';
    }
    //@+node:felix.20260410221404.1: *4* createAtButton
    public createAtButton(label: string, tooltip: string, icon: number): HTMLDivElement {
        const button = document.createElement("div");
        button.classList.add("at-button");
        button.textContent = label;
        button.title = tooltip;
        button.classList.add(`icon-${icon}`);
        this.AT_BUTTONS_CONTAINER.appendChild(button);
        return button;
    }
    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4
//@-leo
