import { MenuEntry } from './types';
import { workspace } from './workspace';

/**
 * Manages the application menu system including building, positioning, and interacting with menus.
 * Handles both top-level and nested submenus with viewport constraint logic.
 */
export class MenuManager {
    private TOP_MENU: HTMLElement;
    
    public activeTopMenu: HTMLDivElement | null = null;
    public focusedMenuItem: HTMLDivElement | null = null;
    public topLevelItems: HTMLDivElement[] = [];
    public topLevelSubmenus = new Map<HTMLDivElement, HTMLElement>();
    private resizeTimeout: number | undefined;

    // Callbacks
    private restoreLastFocusedElementCallback: (() => void) | null = null;
    private doCommandCallback: ((command: string) => void) | null = null;

    constructor(topMenu: HTMLElement) {
        this.TOP_MENU = topMenu;

        // Setup window resize listener for menu repositioning
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

    /**
     * Set callback to restore focus after menu closes
     */
    public setRestoreLastFocusedElementCallback(callback: () => void): void {
        this.restoreLastFocusedElementCallback = callback;
    }

    /**
     * Set callback to execute commands
     */
    public setDoCommandCallback(callback: (command: string) => void): void {
        this.doCommandCallback = callback;
    }

    /**
     * Build menu from menu entries
     */
    public buildMenu(entries: MenuEntry[], level = 0): HTMLElement {
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
                            if (this.restoreLastFocusedElementCallback) {
                                this.restoreLastFocusedElementCallback();
                            }
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
                    if (this.restoreLastFocusedElementCallback) {
                        this.restoreLastFocusedElementCallback();
                    }
                    this.activeTopMenu = null;
                    if (this.doCommandCallback) {
                        this.doCommandCallback(entry.action as string);
                    }
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

    /**
     * Refresh menu enabled/disabled states based on workspace context
     */
    public refreshMenu(entries: MenuEntry[], level = 0): void {
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

    /**
     * Open a top-level menu
     */
    public openTopMenu(item: HTMLDivElement, sub: HTMLElement | null, level: number): void {
        this.closeAllSubmenus();
        this.activeTopMenu = item;
        const targetSubmenu = sub || this.topLevelSubmenus.get(item);
        if (!targetSubmenu) return;
        this.positionSubmenu(item, targetSubmenu, level);
        targetSubmenu.classList.add("visible");
        item.classList.add("active");
        this.focusedMenuItem = null;
    }

    /**
     * Position a submenu relative to its parent menu item
     */
    public positionSubmenu(parentItem: HTMLDivElement, submenu: HTMLElement, level: number): void {
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
        setTimeout(() => this.constrainToViewport(submenu, level), 0);
    }

    /**
     * Close all open submenus
     */
    public closeAllSubmenus(): void {
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

    /**
     * Focus a specific menu item
     */
    public focusMenuItem(item: HTMLDivElement | null): void {
        if (!item) return; // Safety check
        if (this.focusedMenuItem) this.focusedMenuItem.classList.remove("focused");
        item.classList.add("focused");
        this.focusedMenuItem = item;
        document.querySelectorAll(".menu-item.sub-active").forEach(el =>
            el.classList.remove("sub-active")
        );
        let ancestor = item.parentElement?.closest(".menu-item");
        while (ancestor) {
            ancestor.classList.add("sub-active");
            ancestor = ancestor.parentElement?.closest(".submenu")?.parentElement?.closest(".menu-item");
        }
    }

    /**
     * Handle clicks outside menu to close it
     */
    public closeMenusEvent(target: Element): void {
        if (!target.closest('.menu')) {
            this.closeAllSubmenus();
            this.activeTopMenu = null;
        }
    }

    /**
     * Constrain submenu position to stay within viewport
     */
    private constrainToViewport(submenu: HTMLElement, level: number): void {
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

    /**
     * Reposition all currently open menus (called on window resize)
     */
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

    /**
     * Find the parent menu item for a given submenu
     */
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

    /**
     * Get the nesting level of a submenu
     */
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
}
