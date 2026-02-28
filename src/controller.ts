import { Position } from "./core/leoNodes";
import * as g from './core/leoGlobals';
import { FlatRowLeo } from "./types";
import * as utils from './utils';

import { workspace } from "./workspace";
import { Constants } from "./constants";
import { menuData } from "./menu";
import { keybindings } from "./keybindings";

const defaultTitle = "Leo Editor for the web";

export class Controller {

    private _commands: Record<string, (...args: any[]) => any> = {};

    // Unused for now, but we can use this regex to detect URLs in the future if we want to add link-clicking functionality in the body pane or elsewhere.
    private urlRegex = /\b(?:(?:https?|ftp):\/\/|file:\/\/\/?|mailto:)[^\s<]+/gi; // http(s)/ftp with '://', file with // or ///, and mailto: without '//'

    constructor() {
        workspace.menu.buildMenu(menuData);
        workspace.layout.setWindowTitle(defaultTitle)
        workspace.layout.initializeThemeAndLayout(); // gets ratios from localStorage and applies layout and theme
    }

    public setCommands(commands: [string, (...args: any[]) => any][]) {
        for (const [name, func] of commands) {
            this._commands[name] = func;
        }
    }

    public doCommand(commandName: string, ...args: any[]): any {
        const command = this._commands[commandName];
        if (command) {
            return command(...args);
        } else {
            console.warn(`Command not found: ${commandName}`);
        }
    }

    // * Controller Methods (Initialization & Setup) *
    public initializeInteractions() {
        this.setupEventHandlers();
        this.setupButtonFocusPrevention();
        workspace.layout.setupLastFocusedElementTracking();
    }

    private setupEventHandlers() {
        this.setupOutlinePaneHandlers();
        this.setupBodyPaneHandlers();
        this.setupLogPaneHandlers();
        this.setupResizerHandlers();
        this.setupWindowHandlers();
        this.setupButtonHandlers();
        this.setupFindPaneHandlers();
        this.setupConfigCheckboxes();
        this.setupTopMenuHandlers();
    }

    private setupOutlinePaneHandlers() {
        const OUTLINE_PANE = workspace.layout.OUTLINE_PANE;
        // Use only mousedown for selection. Otherwise focus out of edit-headline messes with click events. We can still detect double-clicks by checking the event.detail property in the mousedown handler.
        OUTLINE_PANE.addEventListener("mousedown", this.handleOutlinePaneMouseDown);
        // OUTLINE_PANE.addEventListener('click', this.handleOutlinePaneClick);
        OUTLINE_PANE.addEventListener('dblclick', this.handleOutlinePaneDblClick);
        OUTLINE_PANE.addEventListener('keydown', this.handleOutlinePaneKeyDown);
        OUTLINE_PANE.addEventListener("scroll", utils.throttle(workspace.outline.renderTree, Constants.OUTLINE_THROTTLE_DELAY));
        OUTLINE_PANE.addEventListener("contextmenu", this.handleContextMenu);
        document.addEventListener("click", (e) => {
            workspace.menu.closeMenusEvent(e);
        });
    }

    private setupBodyPaneHandlers() {
        workspace.layout.BODY_PANE.addEventListener('keydown', this.handleBodyPaneKeyDown);
    }

    private setupLogPaneHandlers() {
        workspace.layout.LOG_PANE.addEventListener('keydown', this.handleLogPaneKeyDown);
    }

    private setupResizerHandlers() {
        const layout = workspace.layout;
        layout.VERTICAL_RESIZER.addEventListener('mousedown', this.startDrag);
        layout.VERTICAL_RESIZER.addEventListener('touchstart', this.startDrag);
        layout.HORIZONTAL_RESIZER.addEventListener('mousedown', this.startSecondaryDrag);
        layout.HORIZONTAL_RESIZER.addEventListener('touchstart', this.startSecondaryDrag);
        layout.CROSS_RESIZER.addEventListener('mousedown', this.startCrossDrag);
        layout.CROSS_RESIZER.addEventListener('touchstart', this.startCrossDrag);
    }

    private setupWindowHandlers() {
        window.addEventListener('resize', utils.throttle(() => workspace.layout.handleWindowResize(), Constants.DRAG_DEBOUNCE_DELAY));
        window.addEventListener('keydown', this.handleGlobalKeyDown);
        window.addEventListener('beforeunload', this.saveAllPreferences);
    }

    private setupButtonHandlers() {
        const logPane = workspace.logPane;
        const menu = workspace.menu;

        // * Outline Actions *
        menu.COLLAPSE_ALL_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.CONTRACT_ALL) });
        menu.HOIST_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.HOIST) });
        menu.DEHOIST_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.DEHOIST) });
        menu.PREV_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GO_BACK) });
        menu.NEXT_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GO_FORWARD) });
        menu.TOGGLE_MARK_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.MARK) });
        menu.NEXT_MARKED_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GOTO_NEXT_MARKED) });
        menu.PREV_MARKED_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GOTO_PREV_MARKED) });
        menu.ACTION_MARK.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.MARK) });
        menu.ACTION_UNMARK.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.MARK) });
        menu.ACTION_HOIST.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.HOIST) });
        menu.ACTION_DEHOIST.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.DEHOIST) });

        // * Interface Only Actions *
        menu.THEME_TOGGLE.addEventListener('click', this.handleThemeToggleClick);
        menu.LAYOUT_TOGGLE.addEventListener('click', this.handleLayoutToggleClick);
        menu.MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        menu.TOP_MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        logPane.LOG_TAB.addEventListener('click', () => { logPane.showTab("log") });
        logPane.FIND_TAB.addEventListener('click', () => { logPane.showTab("find") });
        logPane.NAV_TAB.addEventListener('click', () => { logPane.showTab("nav") });
        // logPane.UNDO_TAB.addEventListener('click', () => { logPane.showTab("undo") }); // Maybe add undo tab functionality later
        logPane.SETTINGS_TAB.addEventListener('click', () => { logPane.showTab("settings") });
    }


    private setupButtonFocusPrevention() {
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        });
        workspace.menu.TOP_MENU_TOGGLE.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }

    private setupConfigCheckboxes() {
        const menu = workspace.menu;
        menu.SHOW_PREV_NEXT_MARK.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_TOGGLE_MARK.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_PREV_NEXT_HISTORY.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_HOIST_DEHOIST.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_LAYOUT_ORIENTATION.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_THEME_TOGGLE.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_NODE_ICONS.addEventListener('change', workspace.outline.updateNodeIcons);
        menu.SHOW_COLLAPSE_ALL.addEventListener('change', this.refreshButtonVisibility);
    }

    private refreshButtonVisibility = () => {
        let hasMarked = false;
        let hasHistory = false;

        hasMarked = workspace.getContext(Constants.CONTEXT_FLAGS.LEO_HAS_MARKED) || false;
        hasHistory = workspace.getContext(Constants.CONTEXT_FLAGS.LEO_CAN_BACK) || workspace.getContext(Constants.CONTEXT_FLAGS.LEO_CAN_NEXT) || false;

        workspace.menu.updateButtonVisibility(hasMarked, hasHistory);

    }

    private setupTopMenuHandlers() {
        const menu = workspace.menu;
        const layout = workspace.layout;
        document.addEventListener("keydown", (e) => {
            if (!menu.activeTopMenu) return;

            const topItems = menu.topLevelItems;
            const topIndex = topItems.indexOf(menu.activeTopMenu);
            if (topIndex === -1) return;

            let openSubmenu = menu.focusedMenuItem
                ? menu.focusedMenuItem.closest(".submenu")
                : menu.topLevelSubmenus.get(menu.activeTopMenu);

            if (!openSubmenu) return;

            // Handle top-level navigation
            if (!menu.focusedMenuItem || !openSubmenu.contains(menu.focusedMenuItem)) {
                switch (e.key) {
                    case "ArrowRight":
                        e.preventDefault();
                        const nextTop = topItems[(topIndex + 1) % topItems.length];
                        const nextSub = menu.topLevelSubmenus.get(nextTop);
                        if (nextTop && nextSub) {
                            menu.openTopMenu(nextTop, nextSub, 0);
                            menu.focusMenuItem(nextSub.querySelector(".menu-item"));
                        }
                        return;
                    case "ArrowLeft":
                        e.preventDefault();
                        const prevTop = topItems[(topIndex - 1 + topItems.length) % topItems.length];
                        const prevSub = menu.topLevelSubmenus.get(prevTop);
                        if (prevTop && prevSub) {
                            menu.openTopMenu(prevTop, prevSub, 0);
                            menu.focusMenuItem(prevSub.querySelector(".menu-item"));
                        }
                        return;
                    case "ArrowDown":
                        e.preventDefault();
                        const currentSub = menu.topLevelSubmenus.get(menu.activeTopMenu);
                        if (currentSub) {
                            const firstItem = currentSub.querySelector(".menu-item");
                            if (firstItem) menu.focusMenuItem(firstItem);
                        }
                        return;
                    case "Escape":
                        e.preventDefault();
                        menu.closeAllSubmenus();
                        menu.activeTopMenu = null;
                        layout.restoreLastFocusedElement();
                        return;
                }
                return; // stop here if we just handled top-level
            }

            // Handle submenu navigation
            const items: HTMLDivElement[] = Array.from(openSubmenu.querySelectorAll(":scope > .menu-item"));
            const index = menu.focusedMenuItem ? items.indexOf(menu.focusedMenuItem) : -1;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    if (index < items.length - 1) {
                        menu.focusMenuItem(items[index + 1]!);
                    } else {
                        menu.focusMenuItem(items[0]!); // Wrap to first item
                    }
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    if (index > 0) {
                        menu.focusMenuItem(items[index - 1]!);
                    } else {
                        menu.focusMenuItem(items[items.length - 1]!); // Wrap to last item
                    }
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    if (menu.focusedMenuItem?.classList.contains("has-sub")) {
                        const sub: HTMLElement | null = menu.focusedMenuItem.querySelector(":scope > .submenu");
                        if (sub) {
                            menu.positionSubmenu(menu.focusedMenuItem, sub, 1);
                            sub.classList.add("visible");
                            menu.focusMenuItem(sub.querySelector(".menu-item"));
                        }
                    } else {
                        const nextTop = topItems[(topIndex + 1) % topItems.length];
                        const nextSub = menu.topLevelSubmenus.get(nextTop);
                        if (nextTop && nextSub) {
                            menu.openTopMenu(nextTop, nextSub, 0);
                            menu.focusMenuItem(nextSub.querySelector(".menu-item"));
                        }
                    }
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    const parentMenu: HTMLElement | null = menu.focusedMenuItem.closest(".submenu")!;
                    const parentItem: HTMLDivElement | null = parentMenu?.parentElement?.closest(".menu-item")!;

                    if (parentItem) {
                        parentMenu.classList.remove("visible");
                        menu.focusMenuItem(parentItem);
                    } else {
                        const prevTop = topItems[(topIndex - 1 + topItems.length) % topItems.length];
                        const prevSub = menu.topLevelSubmenus.get(prevTop);
                        if (prevTop && prevSub) {
                            menu.openTopMenu(prevTop, prevSub, 0);
                            menu.focusMenuItem(prevSub.querySelector(".menu-item"));
                        }
                    }
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (menu.focusedMenuItem?.classList.contains("has-sub")) {
                        const sub: HTMLElement | null = menu.focusedMenuItem.querySelector(":scope > .submenu");
                        if (sub) {
                            menu.positionSubmenu(menu.focusedMenuItem, sub, 1);
                            sub.classList.add("visible");
                            menu.focusMenuItem(sub.querySelector(".menu-item"));
                            return;
                        }
                    }
                    menu.focusedMenuItem?.click();
                    break;
                case "Escape":
                    e.preventDefault();
                    menu.closeAllSubmenus();
                    menu.activeTopMenu = null;
                    layout.restoreLastFocusedElement();
                    break;
            }
        });

    }

    private setupFindPaneHandlers() {
        const logPane = workspace.logPane;
        logPane.FIND_INPUT.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                logPane.OPT_BODY.focus();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                this.findNext();
            }
        });
        logPane.REPLACE_INPUT.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Same as find input. Do not 'replace' on enter.
                // User must use the replace shortcuts (Ctrl+= or Ctrl+-) to trigger replacements.
                this.findNext();
            }
        });
        logPane.OPT_BODY.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                logPane.FIND_INPUT.focus();
            }
        });
        const findScopeRadios = logPane.getFindScopeRadios();
        findScopeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                // TODO : Implement or remove when the rest of leo's core is integrated in this UI.
                // initialFindNode = null; // Reset initial find node when scope changes
                // this.buildRowsRenderTreeLeo(); // Re-render to update node highlighting
            });
        });
    }

    public setupDocumentTabsAndHandlers() {
        // The opened documents are in g.app.windowList.
        // The selected document index is this.frameIndex,
        // so the active document (LeoFrame) is g.app.windowList[this.frameIndex]
        // a LeoFrame has a 'c' property which is the commander, and c.fileName() gives the filename.
        const layout = workspace.layout
        const hasOpenedDocuments = g.app.windowList.length > 0;
        layout.setHasOpenedDocuments(hasOpenedDocuments);

        // Set body pane contenteditable based on whether there are opened documents
        workspace.layout.BODY_PANE.contentEditable = hasOpenedDocuments ? "plaintext-only" : "false";

        // First call the view method to clear existing tabs
        workspace.menu.clearDocumentTabs();

        if (g.app.windowList.length === 0) {
            layout.setWindowTitle(defaultTitle);
        }

        // call view to create the document-tabs, and setup handlers
        for (const frame of g.app.windowList) {
            // Create dom elements for each tab
            const c = frame.c;
            const title = frame.getTitle();
            const filename = c.fileName();
            let label = filename ? utils.getFileFromPath(filename) : title;
            const isActive = frame === g.app.windowList[g.app.gui.frameIndex]

            if (c.changed) {
                label = "* " + label;
            }

            const tab = workspace.menu.createDocumentTab(label, isActive);
            // If active, also set the broswer's title
            if (isActive) {
                layout.setWindowTitle(label);
            }

            // now setup handlers for the tab to call g.app.gui.selectOpenedLeoDocument(index)
            const index = g.app.windowList.indexOf(frame);
            tab.addEventListener("click", () => {
                g.app.gui.selectOpenedLeoDocument(index);
            });
            // Also setup handler for middle-click to close the document
            tab.addEventListener("auxclick", (e) => {
                if (e.button === 1) { // Middle click
                    e.preventDefault();
                    g.app.gui.closeLeoFile(index);
                }
            });
            // Add handler to the close button inside the tab
            const closeBtn = tab.querySelector(".close-btn");
            closeBtn?.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent triggering the tab click event
                g.app.gui.closeLeoFile(index);
            });
        }
    }

    // * Controller Methods (Event Handlers) *
    public async initialize() {
        // outline-find-container is initially hidden to prevent FOUC
        workspace.layout.OUTLINE_FIND_CONTAINER.style.visibility = 'visible';
        this.loadConfigPreferences();

        workspace.menu.setupButtonContainerAutoHide();
        workspace.logPane.showTab("log");

        let dirHandle: FileSystemDirectoryHandle | null = null;

        // 1 Try restoring previous workspace
        try {
            const saved = await workspace.loadWorkspaceDirHandle();
            if (saved && await workspace.ensurePermission(saved)) {
                dirHandle = saved;
            }
        } catch (e) {
            console.warn("Failed to restore workspace:", e);
        }

        // 2 Fallback: prompt user
        while (!dirHandle) {
            dirHandle = await workspace.dialog.requestWorkspaceDirectory().catch(e => {
                console.warn("Error selecting workspace directory:", e);
                return null;
            });

            if (dirHandle) {
                await workspace.saveWorkspaceDirHandle(dirHandle);
            }
        }

        // 3 Commit workspace
        workspace.setWorkspaceDirHandle(dirHandle);

        // 4 Continue bootstrapping
        this.initializeInteractions();
        workspace.layout.OUTLINE_PANE.focus();
    }


    private handleOutlinePaneMouseDown = (e: MouseEvent) => {
        if (e.detail === 2) {
            e.preventDefault(); // Prevent text selection on double-click
        }
        // Check if left mouse button:
        if (e.button === 0) {
            // Handle left mouse button actions here
            this.handleOutlinePaneClick(e);
            // Call from mousedown to ensure it runs before click event
            // and can call preventDefault to stop text selection on double-click
        }
    }

    private handleOutlinePaneClick = (event: MouseEvent) => {
        const outline = workspace.outline;
        const target = event.target as Element;
        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl) {
            return;
        }

        const rowIndex = Math.floor(parseInt(nodeEl.style.top) / outline.ROW_HEIGHT);
        if (rowIndex < 0 || rowIndex >= outline.flatRowsLeo!.length) return;

        const row = outline.flatRowsLeo![rowIndex]!;

        // Currently Selected Document's Commander
        const c = g.app.windowList[g.app.gui.frameIndex].c;

        event.stopPropagation();
        workspace.menu.closeMenusEvent(event);
        // Handle different click targets
        if (target.classList.contains('caret') && row.hasChildren) {
            // Both toggle and select in one operation
            this.selectAndOrToggleAndRedraw(
                !row.node.__eq__(c.p) ? row.node : null,
                row.node,
                event.ctrlKey
            );
        } else {
            // Rest of the node (including icon and text)
            if (!row.node.__eq__(c.p) || event.ctrlKey) {
                this.selectAndOrToggleAndRedraw(row.node, null, event.ctrlKey); // Just selection
            }
        }
    }

    private handleOutlinePaneDblClick = (event: MouseEvent) => {
        const outline = workspace.outline;
        const target = event.target as Element;

        // Currently Selected Document's Commander
        const c = g.app.windowList[g.app.gui.frameIndex].c;

        if (target.classList.contains('node-text')) {
            event.preventDefault();
            event.stopPropagation();

            const nodeEl = target.closest('.node') as HTMLElement | null;
            if (!nodeEl) return;

            const rowIndex = Math.floor(parseInt(nodeEl.style.top) / outline.ROW_HEIGHT);
            if (rowIndex >= 0 && rowIndex < outline.flatRowsLeo!.length) {
                // const row = view.flatRowsLeo![rowIndex]!;
                // Double click should trigger 'rename/edit' headline
                this.doCommand(Constants.COMMANDS.HEADLINE_SELECTION, true);
            }
        }
    }

    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const target = e.target as Element;
        const outline = workspace.outline;
        const MENU = workspace.menu.MENU;

        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl) {
            // close possible existing right-click menu
            MENU.style.display = 'none';
            return;
        }

        const rowIndex = Math.floor(parseInt(nodeEl.style.top) / outline.ROW_HEIGHT);
        if (rowIndex < 0 || rowIndex >= outline.flatRowsLeo!.length) return;
        const row = outline.flatRowsLeo![rowIndex]!;

        // Select the node if not already selected
        if (row.isSelected === false) {
            this.selectAndOrToggleAndRedraw(row.node);
        }

        // Position and show the custom context menu
        MENU.style.top = `${e.clientY}px`;
        MENU.style.left = `${e.clientX}px`;
        MENU.style.display = 'block';
    }

    private handleOutlinePaneKeyDown = (e: KeyboardEvent) => {

        // Block if its CTRL+S even if its not enabled 
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
        }
        // Block if its UNDO or REDO (ctrl+z, ctrl+shift+z, ctrl+y) even if they are not enabled, 
        // to prevent interfering with browser shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
        }
        this.handlePaneKeyDown(e, "outline");

    }

    private handleBodyPaneKeyDown = (e: KeyboardEvent) => {
        // Block if its CTRL+S even if its not enabled 
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
        }

        this.handlePaneKeyDown(e, "body");
    }

    private handleLogPaneKeyDown = (e: KeyboardEvent) => {

        // Block if its CTRL+S even if its not enabled 
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
        }
        // Block if its UNDO or REDO (ctrl+z, ctrl+shift+z, ctrl+y) even if they are not enabled, 
        // to prevent interfering with browser shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
        }

        // 'find' and 'log' panes share the same keybindings for now, so we can check for either
        this.handlePaneKeyDown(e, "find");

    }

    private handlePaneKeyDown(e: KeyboardEvent, pane: "outline" | "body" | "find"): void {
        // Build key string representation (e.g., "ctrl+shift+q", "shift+alt+left")
        const parts: string[] = [];

        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');

        let key = e.key.toLowerCase(); // Normalize the key name to lowercase

        // Handle special cases for consistency with keybindings
        if (key === ' ') key = 'space';

        parts.push(key);

        const keyString = parts.join('+');

        // Find matching keybinding for the specified pane
        // const platform = navigator.platform.toLowerCase();
        // const isMac = platform.includes('mac');
        // const isLinux = platform.includes('linux');

        for (const keybind of keybindings) {
            if (!keybind[pane]) continue;
            let targetKey = keybind.key;

            // // Determine which key property to check based on platform
            // if (isMac && keybind.mac) {
            //     targetKey = keybind.mac;
            // } else if (isLinux && keybind.linux) {
            //     targetKey = keybind.linux;
            // } else if (!isMac && !isLinux && keybind.win) {
            //     targetKey = keybind.win;
            // }

            if (targetKey.toLowerCase() === keyString) {

                // First check for enabledFlagsSet and enabledFlagsClear to determine
                // if the command should run based on the current state of the application.
                // For example, some commands might only be active when a node is selected, 
                // or when there are marked nodes, etc. This allows context-sensitive keybindings.
                let enabled = true;
                if (keybind.enabledFlagsSet) {
                    for (const flag of keybind.enabledFlagsSet) {
                        // just check for falsy here since some may be non-boolean (like selected node id, or undefined)
                        if (!workspace.getContext(flag)) {
                            enabled = false;
                            break;
                        }
                    }
                }
                if (enabled && keybind.enabledFlagsClear) {
                    for (const flag of keybind.enabledFlagsClear) {
                        // just check for truthy here since some may be non-boolean (like selected node id, or undefined)
                        if (workspace.getContext(flag)) {
                            enabled = false;
                            break;
                        }
                    }
                }
                if (!enabled) {
                    continue;
                }

                e.preventDefault();
                this.doCommand(keybind.command);
                return;
            }
        }

    };

    // Global key handlers (work anywhere)
    private handleGlobalKeyDown = (e: KeyboardEvent) => {

        // console.log('Global keydown:', e.key, 'Ctrl:', e.ctrlKey, 'Alt:', e.altKey, 'Meta:', e.metaKey);

        // TODO : Remove this method if not needed when the rest of leo's core is integrated in this UI,
        // since most keybindings should be handled in the outline or body panes. 
    }

    private handleDrag = utils.throttle((e) => {
        const layout = workspace.layout;
        if (layout.currentLayout === 'vertical') {
            let clientX = e.clientX;
            if (e.touches) {
                clientX = e.touches[0].clientX;
            }
            const newWidth = clientX;
            if (newWidth >= layout.minWidth) {
                layout.OUTLINE_FIND_CONTAINER.style.width = (newWidth - 3) + 'px';
            } else {
                layout.OUTLINE_FIND_CONTAINER.style.width = (layout.minWidth - 3) + 'px';
            }
            workspace.outline.renderTree();
        } else {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const newHeight = clientY - workspace.menu.TOP_MENU_TOGGLE.offsetHeight;
            if (newHeight >= layout.minWidth) {
                layout.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                layout.OUTLINE_FIND_CONTAINER.style.height = (layout.minWidth - 3) + 'px';
            }
        }
        layout.positionCrossDragger();
        layout.updateCollapseAllPosition();
    }, Constants.DRAG_DEBOUNCE_DELAY);

    private startDrag = (e: Event) => {
        workspace.layout.isDragging = true;
        document.body.classList.add('dragging-main');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('touchmove', this.handleDrag, { passive: false });
        document.addEventListener('touchend', this.stopDrag);
    }

    private stopDrag = () => {
        const layout = workspace.layout;
        if (layout.isDragging) {
            layout.isDragging = false;
            document.body.classList.remove('dragging-main');
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.stopDrag);
            document.removeEventListener('touchmove', this.handleDrag);
            document.removeEventListener('touchend', this.stopDrag);
            layout.updateProportion();
            workspace.outline.renderTree();
        }
    }

    private handleSecondaryDrag = utils.throttle((e) => {
        const layout = workspace.layout;

        if (layout.currentLayout === 'vertical') {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const containerRect = layout.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeY = clientY - containerRect.top;
            const containerHeight = layout.OUTLINE_FIND_CONTAINER.offsetHeight;
            if (relativeY >= layout.minHeight && relativeY <= containerHeight - layout.minHeight) {
                layout.OUTLINE_PANE.style.flex = `0 0 ${relativeY - 8}px`;
                layout.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        } else {
            let clientX = e.clientX;
            if (e.touches) {
                clientX = e.touches[0].clientX;
            }
            const containerRect = layout.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;
            const containerWidth = layout.OUTLINE_FIND_CONTAINER.offsetWidth;
            if (relativeX >= layout.minHeight && relativeX <= containerWidth - layout.minHeight) {
                layout.OUTLINE_PANE.style.flex = `0 0 ${relativeX - 3}px`;
                layout.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
            workspace.outline.renderTree();
        }
        layout.positionCrossDragger();
        layout.updateCollapseAllPosition();
    }, Constants.DRAG_DEBOUNCE_DELAY);

    private startSecondaryDrag = (e: Event) => {
        workspace.layout.secondaryIsDragging = true;
        document.body.classList.add('dragging-secondary');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleSecondaryDrag);
        document.addEventListener('mouseup', this.stopSecondaryDrag);
        document.addEventListener('touchmove', this.handleSecondaryDrag, { passive: false });
        document.addEventListener('touchend', this.stopSecondaryDrag);
    }

    private stopSecondaryDrag = () => {
        const layout = workspace.layout;
        if (layout.secondaryIsDragging) {
            layout.secondaryIsDragging = false;
            document.body.classList.remove('dragging-secondary');
            document.removeEventListener('mousemove', this.handleSecondaryDrag);
            document.removeEventListener('mouseup', this.stopSecondaryDrag);
            document.removeEventListener('touchmove', this.handleSecondaryDrag);
            document.removeEventListener('touchend', this.stopSecondaryDrag);
            layout.updateSecondaryProportion();
            workspace.outline.renderTree();
        }
    }

    private handleCrossDrag = utils.throttle((e) => {
        const layout = workspace.layout;

        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (layout.currentLayout === 'vertical') {
            // Handle cross drag when in vertical layout

            // do main first as per handleDrag
            const newWidth = clientX;
            if (newWidth >= layout.minWidth) {
                layout.OUTLINE_FIND_CONTAINER.style.width = (newWidth - 3) + 'px';
            } else {
                layout.OUTLINE_FIND_CONTAINER.style.width = (layout.minWidth - 3) + 'px';
            }
            // then secondary as per handleSecondaryDrag
            const containerRect = layout.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeY = clientY - containerRect.top;
            const containerHeight = layout.OUTLINE_FIND_CONTAINER.offsetHeight;
            if (relativeY >= layout.minHeight && relativeY <= containerHeight - layout.minHeight) {
                layout.OUTLINE_PANE.style.flex = `0 0 ${relativeY - 8}px`;
                layout.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        } else {
            // Handle cross drag when in horizontal layout

            // do main first as per handleDrag
            const newHeight = clientY - workspace.menu.TOP_MENU_TOGGLE.offsetHeight;
            if (newHeight >= layout.minWidth) {
                layout.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                layout.OUTLINE_FIND_CONTAINER.style.height = (layout.minWidth - 3) + 'px';
            }
            // then secondary as per handleSecondaryDrag
            const containerRect = layout.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;
            const containerWidth = layout.OUTLINE_FIND_CONTAINER.offsetWidth;
            if (relativeX >= layout.minHeight && relativeX <= containerWidth - layout.minHeight) {
                layout.OUTLINE_PANE.style.flex = `0 0 ${relativeX - 3}px`;
                layout.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        }
        layout.positionCrossDragger();
        workspace.outline.renderTree(); // Render afterward as it would be in each branch of the if/else
        layout.updateCollapseAllPosition();
    }, Constants.DRAG_DEBOUNCE_DELAY);

    private startCrossDrag = (e: Event) => {
        workspace.layout.crossIsDragging = true;
        document.body.classList.add('dragging-cross');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleCrossDrag);
        document.addEventListener('mouseup', this.stopCrossDrag);
        document.addEventListener('touchmove', this.handleCrossDrag, { passive: false });
        document.addEventListener('touchend', this.stopCrossDrag);

    }

    private stopCrossDrag = () => {
        const layout = workspace.layout;
        if (layout.crossIsDragging) {
            layout.crossIsDragging = false;
            document.body.classList.remove('dragging-cross');
            document.removeEventListener('mousemove', this.handleCrossDrag);
            document.removeEventListener('mouseup', this.stopCrossDrag);
            document.removeEventListener('touchmove', this.handleCrossDrag);
            document.removeEventListener('touchend', this.stopCrossDrag);
            layout.updateProportion();
            layout.updateSecondaryProportion();
            workspace.outline.renderTree();
        }
    }

    private handleLayoutToggleClick = () => {
        workspace.layout.toggleLayout();
    }

    private handleMenuToggleClick = () => {
        workspace.menu.toggleMenu();
    }

    private handleThemeToggleClick = () => {
        workspace.layout.toggleTheme();
    }

    private refreshHoistButtonStates(): void {
        const c = g.app.windowList[g.app.gui.frameIndex].c;
        const p = c.p;
        let w_canHoist = true;
        let w_topIsChapter = false;
        if (c.hoistStack.length) {
            const w_ph = c.hoistStack[c.hoistStack.length - 1].p;
            w_topIsChapter = w_ph.h.startsWith('@chapter ');
            if (p.__eq__(w_ph)) {
                // p is already the hoisted node
                w_canHoist = false;
            }
        } else {
            // not hoisted, was it the single top child of the real root?
            if (c.rootPosition()!.__eq__(p) && c.hiddenRootNode.children.length === 1) {
                w_canHoist = false;
            }
        }
        workspace.menu.updateHoistButtonStates(
            w_canHoist,
            !!c.hoistStack.length
        );
    }

    private refreshContextMenuState(): void {
        const c = g.app.windowList[g.app.gui.frameIndex].c;
        const p = c.p;
        const isMarked = p.isMarked();
        let w_canHoist = true;
        let w_topIsChapter = false;
        if (c.hoistStack.length) {
            const w_ph = c.hoistStack[c.hoistStack.length - 1].p;
            w_topIsChapter = w_ph.h.startsWith('@chapter ');
            if (p.__eq__(w_ph)) {
                // p is already the hoisted node
                w_canHoist = false;
            }
        } else {
            // not hoisted, was it the single top child of the real root?
            if (c.rootPosition()!.__eq__(p) && c.hiddenRootNode.children.length === 1) {
                w_canHoist = false;
            }
        }

        workspace.menu.updateContextMenuState(
            !isMarked,
            isMarked,
            w_canHoist,
            !!c.hoistStack.length
        );

    }

    private selectAndOrToggleAndRedraw(newSelectedNode: Position | null = null, nodeToToggle: Position | null = null, isCtrlClick: boolean = false) {
        let result: any;
        if (newSelectedNode) {
            result = this.doCommand(Constants.COMMANDS.SELECT_NODE, newSelectedNode, isCtrlClick);
        }

        if (nodeToToggle) {
            if (nodeToToggle.isExpanded()) {
                nodeToToggle.contract();
            } else {
                nodeToToggle.expand();
            }
        }

        if (result && result.then) {

            result.then(() => {
                this.buildRowsRenderTreeLeo();
            });

        } else {
            this.buildRowsRenderTreeLeo();
        }

    }

    // * Controller Methods (Search Orchestration) *
    private startFind() {
        // TODO : Remove or implement for leo's core into this UI.
    }

    private findNext() {
        // TODO : Remove or implement for leo's core into this UI.
    }

    private findPrevious() {
        // TODO : Remove or implement for leo's core into this UI.
    }

    // * Controller Methods (Persistence) *

    private saveAllPreferences = () => {
        this.saveLayoutPreferences();
        this.saveConfigPreferences();
        this.saveDocumentStateToLocalStorage();
    }

    private saveDocumentStateToLocalStorage() {
        // TODO : Implement or remove when the rest of leo's core is integrated in this UI.
    }

    private saveLayoutPreferences() {
        const layout = workspace.layout;
        const layoutPreferences = {
            mainRatio: layout.mainRatio,
            secondaryRatio: layout.secondaryRatio,
            theme: layout.currentTheme,
            layout: layout.currentLayout,
            menuVisible: workspace.menu.isMenuShown
        };
        utils.safeLocalStorageSet('layoutPreferences', JSON.stringify(layoutPreferences));
    }

    private saveConfigPreferences() {
        const logPane = workspace.logPane;
        const menu = workspace.menu;
        const selectedFindScope = this.getFindScope();

        const preferences = {
            showPrevNextMark: menu.SHOW_PREV_NEXT_MARK.checked,
            showToggleMark: menu.SHOW_TOGGLE_MARK.checked,
            showPrevNextHistory: menu.SHOW_PREV_NEXT_HISTORY.checked,
            showHoistDehoist: menu.SHOW_HOIST_DEHOIST.checked,
            showLayoutOrientation: menu.SHOW_LAYOUT_ORIENTATION.checked,
            showThemeToggle: menu.SHOW_THEME_TOGGLE.checked,
            showNodeIcons: menu.SHOW_NODE_ICONS.checked,
            showCollapseAll: menu.SHOW_COLLAPSE_ALL.checked,
            // Find-pane options
            findWholeWord: logPane.OPT_WHOLE.checked,
            findIgnoreCase: logPane.OPT_IGNORECASE.checked,
            findRegexp: logPane.OPT_REGEXP.checked,
            findMark: logPane.OPT_MARK_FINDS.checked,
            findHeadline: logPane.OPT_HEADLINE.checked,
            findBody: logPane.OPT_BODY.checked,
            findScope: selectedFindScope
        };
        utils.safeLocalStorageSet('configPreferences', JSON.stringify(preferences));
    }

    private loadConfigPreferences() {

        const savedPrefs = utils.safeLocalStorageGet('configPreferences');
        if (savedPrefs) {
            try {
                const logPane = workspace.logPane;
                const menu = workspace.menu;
                const prefs = JSON.parse(savedPrefs);
                menu.SHOW_PREV_NEXT_MARK.checked = prefs.showPrevNextMark ?? false;
                menu.SHOW_TOGGLE_MARK.checked = prefs.showToggleMark ?? false;
                menu.SHOW_PREV_NEXT_HISTORY.checked = prefs.showPrevNextHistory ?? true;
                menu.SHOW_HOIST_DEHOIST.checked = prefs.showHoistDehoist ?? false;
                menu.SHOW_LAYOUT_ORIENTATION.checked = prefs.showLayoutOrientation ?? true;
                menu.SHOW_THEME_TOGGLE.checked = prefs.showThemeToggle ?? true;
                menu.SHOW_NODE_ICONS.checked = prefs.showNodeIcons ?? true;
                menu.SHOW_COLLAPSE_ALL.checked = prefs.showCollapseAll ?? true;
                // Find-pane options
                logPane.OPT_WHOLE.checked = prefs.findWholeWord ?? logPane.OPT_WHOLE.checked;
                logPane.OPT_IGNORECASE.checked = prefs.findIgnoreCase ?? logPane.OPT_IGNORECASE.checked;
                logPane.OPT_REGEXP.checked = prefs.findRegexp ?? logPane.OPT_REGEXP.checked;
                logPane.OPT_MARK_FINDS.checked = prefs.findMark ?? logPane.OPT_MARK_FINDS.checked;
                logPane.OPT_HEADLINE.checked = prefs.findHeadline ?? logPane.OPT_HEADLINE.checked;
                logPane.OPT_BODY.checked = prefs.findBody ?? logPane.OPT_BODY.checked;
                // Set the find scope radio
                if (prefs.findScope) {
                    const scopeRadio = document.getElementById('scope-' + prefs.findScope) as HTMLInputElement | null;
                    if (scopeRadio) scopeRadio.checked = true;
                }

                this.refreshButtonVisibility();
                workspace.outline.updateNodeIcons();
            } catch (e) {
                console.error('Error loading config preferences:', e);
            }
        } else {
            this.refreshButtonVisibility();
            workspace.outline.updateNodeIcons();
        }
    }

    // * Controller Methods (Finally, the actual render tree building) *
    public buildRowsRenderTreeLeo(): void {
        const outline = workspace.outline;
        let root = null;
        if (g.app.windowList[g.app.gui.frameIndex]) {
            // Currently Selected Document's Commander
            const c = g.app.windowList[g.app.gui.frameIndex].c;
            if (c.hoistStack.length) {
                // HOISTED: Topmost hoisted node starts the outline as single root 'child'
                const w_rootPosition = c.hoistStack[c.hoistStack.length - 1].p;
                w_rootPosition._isRoot = true;
                root = w_rootPosition;
            }
            const rows = this.flattenTreeLeo(
                root,
                0,
                !c.hoistStack.length,
                c.p,
                null // TODO: Implement initialFindNode tracking in Leo core
            );
            // Clear list of positions to animate at the end of the render, since they have now been rendered
            g.app.gui.positionsToAnimate = [];
            outline.setTreeDataLeo(rows);
        } else {
            outline.setTreeDataLeo([]);
            console.warn("No active Leo document found for building render tree.");
        }
    }

    public flattenTreeLeo(
        node: Position | null,
        depth = 0,
        isRoot = true,
        selectedNode: Position | null,
        initialFindNode: Position | null,
    ): FlatRowLeo[] {

        const flatRowsLeo: FlatRowLeo[] = [];
        if (node) {
            if (!isRoot) {
                let toggled = false;
                for (let i = 0; i < g.app.gui.positionsToAnimate.length; i++) {
                    if (g.app.gui.positionsToAnimate[i].__eq__(node)) {
                        toggled = true;
                        // Remove from the list to avoid duplicate toggling
                        g.app.gui.positionsToAnimate.splice(i, 1);
                        break;
                    }
                }
                flatRowsLeo.push({
                    label: node.h,
                    depth: depth,
                    toggled: toggled,
                    hasChildren: node.hasChildren(),
                    isExpanded: node.isExpanded(),
                    node: node,
                    isSelected: !!selectedNode && node.__eq__(selectedNode),
                    isAncestor: !!selectedNode && node.isAncestorOf(selectedNode),
                    isInitialFind: false, // TODO: (later stage) Implement initial find state tracking in Leo core
                    icon: (+(!!node.isDirty()) << 3) |
                        (+node.isCloned() << 2) |
                        (+node.isMarked() << 1) |
                        +node.v.hasBody()
                });
            }
            if (node.isExpanded() || isRoot) {
                // for each child, push to flatRowsLeo recursively
                for (const child of node.children()) {
                    flatRowsLeo.push(...this.flattenTreeLeo(child, depth + (isRoot ? 0 : 1), false, selectedNode, initialFindNode));
                }
            }
        } else {
            // No node given, start with hidden root node
            const c = g.app.windowList[g.app.gui.frameIndex].c;
            let preventHoistSingleTopNode = false;
            if (c.hiddenRootNode.children.length === 1) {
                // Exactly one: prevent hoisting on SINGLE top node
                preventHoistSingleTopNode = true;
            }
            for (const child of c.all_root_children()) {
                child._isRoot = preventHoistSingleTopNode;
                flatRowsLeo.push(...this.flattenTreeLeo(child, depth + (isRoot ? 0 : 1), false, selectedNode, initialFindNode));
            }
        }
        return flatRowsLeo;
    }

    private getFindScope(): string {
        let selectedRadioValue = '';
        const selectedRadio = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        if (selectedRadio) {
            selectedRadioValue = selectedRadio.value;
        }
        return selectedRadioValue;
    }

}