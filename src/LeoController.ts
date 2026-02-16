import { Position } from "./core/leoNodes";
import { LeoView } from "./LeoView";
import * as g from './core/leoGlobals';
import { FlatRowLeo } from "./types";
import * as utils from './utils';

import { workspace } from "./workspace";
import { Constants } from "./constants";
import { menuData } from "./menu";
import { keybindings } from "./keybindings";

const defaultTitle = "Leo Editor for the web";

export class LeoController {
    private view: LeoView;
    private _commands: Record<string, (...args: any[]) => any> = {};

    // Unused for now, but we can use this regex to detect URLs in the future if we want to add link-clicking functionality in the body pane or elsewhere.
    private urlRegex = /\b(?:(?:https?|ftp):\/\/|file:\/\/\/?|mailto:)[^\s<]+/gi; // http(s)/ftp with '://', file with // or ///, and mailto: without '//'

    constructor(view: LeoView) {

        this.view = view;

        view.buildMenu(menuData);
        view.setWindowTitle(defaultTitle)
        view.initializeThemeAndLayout(); // gets ratios from localStorage and applies layout and theme
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
        this.view.setupLastFocusedElementTracking();
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
        const view = this.view;
        view.OUTLINE_PANE.addEventListener("mousedown", this.handleOutlinePaneMouseDown);
        view.OUTLINE_PANE.addEventListener('click', this.handleOutlinePaneClick);
        view.OUTLINE_PANE.addEventListener('dblclick', this.handleOutlinePaneDblClick);
        view.OUTLINE_PANE.addEventListener('keydown', this.handleOutlinePaneKeyDown);
        view.OUTLINE_PANE.addEventListener("scroll", utils.throttle(view.renderTree, 33));
        view.OUTLINE_PANE.addEventListener("contextmenu", this.handleContextMenu);
        document.addEventListener("click", (e) => {
            view.closeMenusEvent(e);
        });
    }

    private setupBodyPaneHandlers() {
        const view = this.view;
        view.BODY_PANE.addEventListener('keydown', this.handleBodyPaneKeyDown);
    }

    private setupLogPaneHandlers() {
        const view = this.view;
        view.LOG_PANE.addEventListener('keydown', this.handleLogPaneKeyDown);
    }

    private setupResizerHandlers() {
        const view = this.view;
        view.VERTICAL_RESIZER.addEventListener('mousedown', this.startDrag);
        view.VERTICAL_RESIZER.addEventListener('touchstart', this.startDrag);
        view.HORIZONTAL_RESIZER.addEventListener('mousedown', this.startSecondaryDrag);
        view.HORIZONTAL_RESIZER.addEventListener('touchstart', this.startSecondaryDrag);
        view.CROSS_RESIZER.addEventListener('mousedown', this.startCrossDrag);
        view.CROSS_RESIZER.addEventListener('touchstart', this.startCrossDrag);
    }

    private setupWindowHandlers() {
        window.addEventListener('resize', utils.throttle(() => this.view.handleWindowResize(), 33));
        window.addEventListener('keydown', this.handleGlobalKeyDown);
        window.addEventListener('beforeunload', this.saveAllPreferences);
    }

    private setupButtonHandlers() {
        const view = this.view;

        // * Outline Actions *
        view.COLLAPSE_ALL_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.CONTRACT_ALL) });
        view.HOIST_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.HOIST) });
        view.DEHOIST_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.DEHOIST) });
        view.PREV_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GO_BACK) });
        view.NEXT_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GO_FORWARD) });
        view.TOGGLE_MARK_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.MARK) });
        view.NEXT_MARKED_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GOTO_NEXT_MARKED) });
        view.PREV_MARKED_BTN.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.GOTO_PREV_MARKED) });
        view.ACTION_MARK.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.MARK) });
        view.ACTION_UNMARK.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.MARK) });
        view.ACTION_HOIST.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.HOIST) });
        view.ACTION_DEHOIST.addEventListener('click', () => { workspace.controller.doCommand(Constants.COMMANDS.DEHOIST) });

        // * Interface Only Actions *
        view.THEME_TOGGLE.addEventListener('click', this.handleThemeToggleClick);
        view.LAYOUT_TOGGLE.addEventListener('click', this.handleLayoutToggleClick);
        view.MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        view.TOP_MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        view.LOG_TAB.addEventListener('click', () => { view.showTab("log") });
        view.FIND_TAB.addEventListener('click', () => { view.showTab("find") });
        // view.UNDO_TAB.addEventListener('click', () => { view.showTab("undo") }); // Maybe add undo tab functionality later
        view.SETTINGS_TAB.addEventListener('click', () => { view.showTab("settings") });
    }


    private setupButtonFocusPrevention() {
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        });
        this.view.TOP_MENU_TOGGLE.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }

    private setupConfigCheckboxes() {
        const view = this.view;
        view.SHOW_PREV_NEXT_MARK.addEventListener('change', this.refreshButtonVisibility);
        view.SHOW_TOGGLE_MARK.addEventListener('change', this.refreshButtonVisibility);
        view.SHOW_PREV_NEXT_HISTORY.addEventListener('change', this.refreshButtonVisibility);
        view.SHOW_HOIST_DEHOIST.addEventListener('change', this.refreshButtonVisibility);
        view.SHOW_LAYOUT_ORIENTATION.addEventListener('change', this.refreshButtonVisibility);
        view.SHOW_THEME_TOGGLE.addEventListener('change', this.refreshButtonVisibility);
        view.SHOW_NODE_ICONS.addEventListener('change', view.updateNodeIcons);
        view.SHOW_COLLAPSE_ALL.addEventListener('change', this.refreshButtonVisibility);
    }

    private refreshButtonVisibility = () => {
        let hasMarked = false;
        let hasHistory = false;

        hasMarked = workspace.getContext(Constants.CONTEXT_FLAGS.LEO_HAS_MARKED) || false;
        hasHistory = workspace.getContext(Constants.CONTEXT_FLAGS.LEO_CAN_BACK) || workspace.getContext(Constants.CONTEXT_FLAGS.LEO_CAN_NEXT) || false;

        this.view.updateButtonVisibility(hasMarked, hasHistory);

    }

    private setupTopMenuHandlers() {
        const view = this.view;
        document.addEventListener("keydown", (e) => {
            if (!view.activeTopMenu) return;

            const topItems = view.topLevelItems;
            const topIndex = topItems.indexOf(view.activeTopMenu);
            if (topIndex === -1) return;

            let openSubmenu = view.focusedMenuItem
                ? view.focusedMenuItem.closest(".submenu")
                : view.topLevelSubmenus.get(view.activeTopMenu);

            if (!openSubmenu) return;

            // Handle top-level navigation
            if (!view.focusedMenuItem || !openSubmenu.contains(view.focusedMenuItem)) {
                switch (e.key) {
                    case "ArrowRight":
                        e.preventDefault();
                        const nextTop = topItems[(topIndex + 1) % topItems.length];
                        const nextSub = view.topLevelSubmenus.get(nextTop);
                        if (nextTop && nextSub) {
                            view.openTopMenu(nextTop, nextSub, 0);
                            view.focusMenuItem(nextSub.querySelector(".menu-item"));
                        }
                        return;
                    case "ArrowLeft":
                        e.preventDefault();
                        const prevTop = topItems[(topIndex - 1 + topItems.length) % topItems.length];
                        const prevSub = view.topLevelSubmenus.get(prevTop);
                        if (prevTop && prevSub) {
                            view.openTopMenu(prevTop, prevSub, 0);
                            view.focusMenuItem(prevSub.querySelector(".menu-item"));
                        }
                        return;
                    case "ArrowDown":
                        e.preventDefault();
                        const currentSub = view.topLevelSubmenus.get(view.activeTopMenu);
                        if (currentSub) {
                            const firstItem = currentSub.querySelector(".menu-item");
                            if (firstItem) view.focusMenuItem(firstItem);
                        }
                        return;
                    case "Escape":
                        e.preventDefault();
                        view.closeAllSubmenus();
                        view.activeTopMenu = null;
                        view.restoreLastFocusedElement();
                        return;
                }
                return; // stop here if we just handled top-level
            }

            // Handle submenu navigation
            const items: HTMLDivElement[] = Array.from(openSubmenu.querySelectorAll(":scope > .menu-item"));
            const index = view.focusedMenuItem ? items.indexOf(view.focusedMenuItem) : -1;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    if (index < items.length - 1) {
                        view.focusMenuItem(items[index + 1]!);
                    } else {
                        view.focusMenuItem(items[0]!); // Wrap to first item
                    }
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    if (index > 0) {
                        view.focusMenuItem(items[index - 1]!);
                    } else {
                        view.focusMenuItem(items[items.length - 1]!); // Wrap to last item
                    }
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    if (view.focusedMenuItem?.classList.contains("has-sub")) {
                        const sub: HTMLElement | null = view.focusedMenuItem.querySelector(":scope > .submenu");
                        if (sub) {
                            view.positionSubmenu(view.focusedMenuItem, sub, 1);
                            sub.classList.add("visible");
                            view.focusMenuItem(sub.querySelector(".menu-item"));
                        }
                    } else {
                        const nextTop = topItems[(topIndex + 1) % topItems.length];
                        const nextSub = view.topLevelSubmenus.get(nextTop);
                        if (nextTop && nextSub) {
                            view.openTopMenu(nextTop, nextSub, 0);
                            view.focusMenuItem(nextSub.querySelector(".menu-item"));
                        }
                    }
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    const parentMenu: HTMLElement | null = view.focusedMenuItem.closest(".submenu")!;
                    const parentItem: HTMLDivElement | null = parentMenu?.parentElement?.closest(".menu-item")!;

                    if (parentItem) {
                        parentMenu.classList.remove("visible");
                        view.focusMenuItem(parentItem);
                    } else {
                        const prevTop = topItems[(topIndex - 1 + topItems.length) % topItems.length];
                        const prevSub = view.topLevelSubmenus.get(prevTop);
                        if (prevTop && prevSub) {
                            view.openTopMenu(prevTop, prevSub, 0);
                            view.focusMenuItem(prevSub.querySelector(".menu-item"));
                        }
                    }
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (view.focusedMenuItem?.classList.contains("has-sub")) {
                        const sub: HTMLElement | null = view.focusedMenuItem.querySelector(":scope > .submenu");
                        if (sub) {
                            view.positionSubmenu(view.focusedMenuItem, sub, 1);
                            sub.classList.add("visible");
                            view.focusMenuItem(sub.querySelector(".menu-item"));
                            return;
                        }
                    }
                    view.focusedMenuItem?.click();
                    break;
                case "Escape":
                    e.preventDefault();
                    view.closeAllSubmenus();
                    view.activeTopMenu = null;
                    view.restoreLastFocusedElement();
                    break;
            }
        });

    }

    private setupFindPaneHandlers() {
        const view = this.view;
        this.view.FIND_INPUT.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.view.OPT_BODY.focus();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                this.findNext();
            }
        });
        this.view.OPT_BODY.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.view.FIND_INPUT.focus();
            }
        });
        const findScopeRadios = view.getFindScopeRadios();
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

        const hasOpenedDocuments = g.app.windowList.length > 0;
        this.view.setHasOpenedDocuments(hasOpenedDocuments);

        // Set body pane contenteditable based on whether there are opened documents
        this.view.BODY_PANE.contentEditable = hasOpenedDocuments ? "plaintext-only" : "false";

        // First call the view method to clear existing tabs
        this.view.clearDocumentTabs();

        if (g.app.windowList.length === 0) {
            this.view.setWindowTitle(defaultTitle);
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

            const tab = this.view.createDocumentTab(label, isActive);
            // If active, also set the broswer's title
            if (isActive) {
                this.view.setWindowTitle(label);
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
        const view = this.view;

        // outline-find-container is initially hidden to prevent FOUC
        view.OUTLINE_FIND_CONTAINER.style.visibility = 'visible';
        this.loadConfigPreferences();

        view.setupButtonContainerAutoHide();
        view.showTab("log");

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
            dirHandle = await view.requestWorkspaceDirectory().catch(e => {
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
        view.OUTLINE_PANE.focus();
    }


    private handleOutlinePaneMouseDown = (e: MouseEvent) => {
        if (e.detail === 2) {
            e.preventDefault(); // Prevent text selection on double-click
        }
    }

    private handleOutlinePaneClick = (event: MouseEvent) => {
        const view = this.view;
        const target = event.target as Element;
        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl) {
            return;
        }

        const rowIndex = Math.floor(parseInt(nodeEl.style.top) / view.ROW_HEIGHT);
        if (rowIndex < 0 || rowIndex >= view.flatRowsLeo!.length) return;

        const row = view.flatRowsLeo![rowIndex]!;

        // Currently Selected Document's Commander
        const c = g.app.windowList[g.app.gui.frameIndex].c;

        event.stopPropagation();
        view.closeMenusEvent(event);
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
        const view = this.view;
        const target = event.target as Element;


        // Currently Selected Document's Commander
        const c = g.app.windowList[g.app.gui.frameIndex].c;

        if (target.classList.contains('node-text')) {
            event.preventDefault();
            event.stopPropagation();

            const nodeEl = target.closest('.node') as HTMLElement | null;
            if (!nodeEl) return;

            const rowIndex = Math.floor(parseInt(nodeEl.style.top) / view.ROW_HEIGHT);
            if (rowIndex >= 0 && rowIndex < view.flatRowsLeo!.length) {
                // const row = view.flatRowsLeo![rowIndex]!;
                // Double click should trigger 'rename/edit' headline
                this.doCommand(Constants.COMMANDS.HEADLINE_SELECTION);
            }
        }
    }


    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const target = e.target as Element;
        const view = this.view;

        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl) {
            // close possible existing right-click menu
            view.MENU.style.display = 'none';
            return;
        }

        const rowIndex = Math.floor(parseInt(nodeEl.style.top) / view.ROW_HEIGHT);
        if (rowIndex < 0 || rowIndex >= view.flatRowsLeo!.length) return;
        const row = view.flatRowsLeo![rowIndex]!;

        // Select the node if not already selected
        if (row.isSelected === false) {
            this.selectAndOrToggleAndRedraw(row.node);
        }

        // Position and show the custom context menu
        view.MENU.style.top = `${e.clientY}px`;
        view.MENU.style.left = `${e.clientX}px`;
        view.MENU.style.display = 'block';
    }

    private handleOutlinePaneKeyDown = (e: KeyboardEvent) => {
        // Build key string representation (e.g., "ctrl+shift+q", "shift+alt+left")
        const parts: string[] = [];

        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');

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

        // Normalize the key name to lowercase
        let key = e.key.toLowerCase();

        // Handle special cases for consistency with keybindings
        if (key === ' ') key = 'space';

        parts.push(key);

        const keyString = parts.join('+');

        // Find matching keybinding for outline pane
        // const platform = navigator.platform.toLowerCase();
        // const isMac = platform.includes('mac');
        // const isLinux = platform.includes('linux');

        for (const keybind of keybindings) {
            if (!keybind.outline) continue;
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

    }

    private handleBodyPaneKeyDown = (e: KeyboardEvent) => {
        // Build key string representation (e.g., "ctrl+shift+q", "shift+alt+left")
        const parts: string[] = [];

        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');

        // Block if its CTRL+S even if its not enabled 
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
        }

        // Normalize the key name to lowercase
        let key = e.key.toLowerCase();

        // Handle special cases for consistency with keybindings
        if (key === ' ') key = 'space';

        parts.push(key);

        const keyString = parts.join('+');

        // Find matching keybinding for outline pane
        // const platform = navigator.platform.toLowerCase();
        // const isMac = platform.includes('mac');
        // const isLinux = platform.includes('linux');

        for (const keybind of keybindings) {
            if (!keybind.body) continue;
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
    }

    private handleLogPaneKeyDown = (e: KeyboardEvent) => {
        // Similar implementation to the other keydown handlers, but for the log pane if needed.
        // For now, we don't have specific keybindings for the log pane, but this can be implemented in the future.

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

    }

    // Global key handlers (work anywhere)
    private handleGlobalKeyDown = (e: KeyboardEvent) => {
        const view = this.view;
        if (view.isDialogOpen) return; // Prevent handling when a dialog is open

        // TODO : Remove this method if not needed when the rest of leo's core is integrated in this UI,
        // since most keybindings should be handled in the outline or body panes. 
        // For now, we can keep it for global shortcuts like opening settings, or for debugging.
        // console.log('Global keydown:', e.key, 'Ctrl:', e.ctrlKey, 'Alt:', e.altKey, 'Meta:', e.metaKey);

    }

    private handleDrag = utils.throttle((e) => {
        const view = this.view;
        if (view.currentLayout === 'vertical') {
            let clientX = e.clientX;
            if (e.touches) {
                clientX = e.touches[0].clientX;
            }
            const newWidth = clientX;
            if (newWidth >= view.minWidth) {
                view.OUTLINE_FIND_CONTAINER.style.width = (newWidth - 3) + 'px';
            } else {
                view.OUTLINE_FIND_CONTAINER.style.width = (view.minWidth - 3) + 'px';
            }
        } else {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const newHeight = clientY - view.TOP_MENU_TOGGLE.offsetHeight;
            if (newHeight >= view.minWidth) {
                view.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                view.OUTLINE_FIND_CONTAINER.style.height = (view.minWidth - 3) + 'px';
            }
            view.renderTree(); // Resizing vertically, so need to re-render tree
        }
        view.positionCrossDragger();
        view.updateCollapseAllPosition();
    }, 33);

    private startDrag = (e: Event) => {
        this.view.isDragging = true;
        document.body.classList.add('dragging-main');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('touchmove', this.handleDrag, { passive: false });
        document.addEventListener('touchend', this.stopDrag);
    }

    private stopDrag = () => {
        const view = this.view;
        if (view.isDragging) {
            view.isDragging = false;
            document.body.classList.remove('dragging-main');
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.stopDrag);
            document.removeEventListener('touchmove', this.handleDrag);
            document.removeEventListener('touchend', this.stopDrag);
            view.updateProportion();
            view.renderTree();
        }
    }

    private handleSecondaryDrag = utils.throttle((e) => {
        const view = this.view;
        if (view.currentLayout === 'vertical') {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const containerRect = view.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeY = clientY - containerRect.top;
            const containerHeight = view.OUTLINE_FIND_CONTAINER.offsetHeight;
            if (relativeY >= view.minHeight && relativeY <= containerHeight - view.minHeight) {
                view.OUTLINE_PANE.style.flex = `0 0 ${relativeY - 8}px`;
                view.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
            view.renderTree(); // Resizing vertically, so need to re-render tree
        } else {
            let clientX = e.clientX;
            if (e.touches) {
                clientX = e.touches[0].clientX;
            }
            const containerRect = view.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;
            const containerWidth = view.OUTLINE_FIND_CONTAINER.offsetWidth;
            if (relativeX >= view.minHeight && relativeX <= containerWidth - view.minHeight) {
                view.OUTLINE_PANE.style.flex = `0 0 ${relativeX - 3}px`;
                view.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        }
        view.positionCrossDragger();
        view.updateCollapseAllPosition();
    }, 33);

    private startSecondaryDrag = (e: Event) => {
        this.view.secondaryIsDragging = true;
        document.body.classList.add('dragging-secondary');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleSecondaryDrag);
        document.addEventListener('mouseup', this.stopSecondaryDrag);
        document.addEventListener('touchmove', this.handleSecondaryDrag, { passive: false });
        document.addEventListener('touchend', this.stopSecondaryDrag);
    }

    private stopSecondaryDrag = () => {
        const view = this.view;
        if (view.secondaryIsDragging) {
            view.secondaryIsDragging = false;
            document.body.classList.remove('dragging-secondary');
            document.removeEventListener('mousemove', this.handleSecondaryDrag);
            document.removeEventListener('mouseup', this.stopSecondaryDrag);
            document.removeEventListener('touchmove', this.handleSecondaryDrag);
            document.removeEventListener('touchend', this.stopSecondaryDrag);
            view.updateSecondaryProportion();
            view.renderTree();
        }
    }

    private handleCrossDrag = utils.throttle((e) => {
        const view = this.view;
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (view.currentLayout === 'vertical') {
            // Handle cross drag when in vertical layout

            // do main first as per handleDrag
            const newWidth = clientX;
            if (newWidth >= view.minWidth) {
                view.OUTLINE_FIND_CONTAINER.style.width = (newWidth - 3) + 'px';
            } else {
                view.OUTLINE_FIND_CONTAINER.style.width = (view.minWidth - 3) + 'px';
            }
            // then secondary as per handleSecondaryDrag
            const containerRect = view.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeY = clientY - containerRect.top;
            const containerHeight = view.OUTLINE_FIND_CONTAINER.offsetHeight;
            if (relativeY >= view.minHeight && relativeY <= containerHeight - view.minHeight) {
                view.OUTLINE_PANE.style.flex = `0 0 ${relativeY - 8}px`;
                view.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        } else {
            // Handle cross drag when in horizontal layout

            // do main first as per handleDrag
            const newHeight = clientY - view.TOP_MENU_TOGGLE.offsetHeight;
            if (newHeight >= view.minWidth) {
                view.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                view.OUTLINE_FIND_CONTAINER.style.height = (view.minWidth - 3) + 'px';
            }
            // then secondary as per handleSecondaryDrag
            const containerRect = view.OUTLINE_FIND_CONTAINER.getBoundingClientRect();
            const relativeX = clientX - containerRect.left;
            const containerWidth = view.OUTLINE_FIND_CONTAINER.offsetWidth;
            if (relativeX >= view.minHeight && relativeX <= containerWidth - view.minHeight) {
                view.OUTLINE_PANE.style.flex = `0 0 ${relativeX - 3}px`;
                view.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
            }
        }
        view.positionCrossDragger();
        view.renderTree(); // Render afterward as it would be in each branch of the if/else
        view.updateCollapseAllPosition();
    }, 33);

    private startCrossDrag = (e: Event) => {
        this.view.crossIsDragging = true;
        document.body.classList.add('dragging-cross');
        e.preventDefault();
        document.addEventListener('mousemove', this.handleCrossDrag);
        document.addEventListener('mouseup', this.stopCrossDrag);
        document.addEventListener('touchmove', this.handleCrossDrag, { passive: false });
        document.addEventListener('touchend', this.stopCrossDrag);

    }

    private stopCrossDrag = () => {
        const view = this.view;
        if (view.crossIsDragging) {
            view.crossIsDragging = false;
            document.body.classList.remove('dragging-cross');
            document.removeEventListener('mousemove', this.handleCrossDrag);
            document.removeEventListener('mouseup', this.stopCrossDrag);
            document.removeEventListener('touchmove', this.handleCrossDrag);
            document.removeEventListener('touchend', this.stopCrossDrag);
            view.updateProportion();
            view.updateSecondaryProportion();
            view.renderTree();
        }
    }

    private handleLayoutToggleClick = () => {
        this.view.toggleLayout();
    }

    private handleMenuToggleClick = () => {
        this.view.toggleMenu();
    }

    private handleThemeToggleClick = () => {
        this.view.toggleTheme();
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
        this.view.updateHoistButtonStates(
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

        this.view.updateContextMenuState(
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
        const view = this.view;
        const layoutPreferences = {
            mainRatio: view.mainRatio,
            secondaryRatio: view.secondaryRatio,
            theme: view.currentTheme,
            layout: view.currentLayout,
            menuVisible: view.isMenuShown
        };
        utils.safeLocalStorageSet('layoutPreferences', JSON.stringify(layoutPreferences));
    }

    private saveConfigPreferences() {
        const view = this.view;
        const selectedFindScope = this.getFindScope();

        const preferences = {
            showPrevNextMark: view.SHOW_PREV_NEXT_MARK.checked,
            showToggleMark: view.SHOW_TOGGLE_MARK.checked,
            showPrevNextHistory: view.SHOW_PREV_NEXT_HISTORY.checked,
            showHoistDehoist: view.SHOW_HOIST_DEHOIST.checked,
            showLayoutOrientation: view.SHOW_LAYOUT_ORIENTATION.checked,
            showThemeToggle: view.SHOW_THEME_TOGGLE.checked,
            showNodeIcons: view.SHOW_NODE_ICONS.checked,
            showCollapseAll: view.SHOW_COLLAPSE_ALL.checked,
            // Find-pane options
            findWholeWord: view.OPT_WHOLE.checked,
            findIgnoreCase: view.OPT_IGNORECASE.checked,
            findRegexp: view.OPT_REGEXP.checked,
            findMark: view.OPT_MARK.checked,
            findHeadline: view.OPT_HEADLINE.checked,
            findBody: view.OPT_BODY.checked,
            findScope: selectedFindScope
        };
        utils.safeLocalStorageSet('configPreferences', JSON.stringify(preferences));
    }

    private loadConfigPreferences() {
        const view = this.view;
        const savedPrefs = utils.safeLocalStorageGet('configPreferences');
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                view.SHOW_PREV_NEXT_MARK.checked = prefs.showPrevNextMark ?? false;
                view.SHOW_TOGGLE_MARK.checked = prefs.showToggleMark ?? false;
                view.SHOW_PREV_NEXT_HISTORY.checked = prefs.showPrevNextHistory ?? true;
                view.SHOW_HOIST_DEHOIST.checked = prefs.showHoistDehoist ?? false;
                view.SHOW_LAYOUT_ORIENTATION.checked = prefs.showLayoutOrientation ?? true;
                view.SHOW_THEME_TOGGLE.checked = prefs.showThemeToggle ?? true;
                view.SHOW_NODE_ICONS.checked = prefs.showNodeIcons ?? true;
                view.SHOW_COLLAPSE_ALL.checked = prefs.showCollapseAll ?? true;
                // Find-pane options
                view.OPT_WHOLE.checked = prefs.findWholeWord ?? view.OPT_WHOLE.checked;
                view.OPT_IGNORECASE.checked = prefs.findIgnoreCase ?? view.OPT_IGNORECASE.checked;
                view.OPT_REGEXP.checked = prefs.findRegexp ?? view.OPT_REGEXP.checked;
                view.OPT_MARK.checked = prefs.findMark ?? view.OPT_MARK.checked;
                view.OPT_HEADLINE.checked = prefs.findHeadline ?? view.OPT_HEADLINE.checked;
                view.OPT_BODY.checked = prefs.findBody ?? view.OPT_BODY.checked;
                // Set the find scope radio
                if (prefs.findScope) {
                    const scopeRadio = document.getElementById('scope-' + prefs.findScope) as HTMLInputElement | null;
                    if (scopeRadio) scopeRadio.checked = true;
                }

                this.refreshButtonVisibility();
                view.updateNodeIcons();
            } catch (e) {
                console.error('Error loading config preferences:', e);
            }
        } else {
            this.refreshButtonVisibility();
            view.updateNodeIcons();
        }
    }

    // * Controller Methods (Finally, the actual render tree building) *
    public buildRowsRenderTreeLeo(): void {
        const view = this.view;
        let root = null;
        if (g.app.windowList[g.app.gui.frameIndex]) {
            // Currently Selected Document's Commander
            const c = g.app.windowList[g.app.gui.frameIndex].c;
            if (c.hoistStack.length) {
                // HOISTED: Topmost hoisted node starts the outline as single root 'child'
                const w_rootPosition = c.hoistStack[c.hoistStack.length - 1].p;
                w_rootPosition._isRoot = true;
                root = w_rootPosition;
            } else {
                // NOT HOISTED
            }
            // Calculate data, then pass to View. View handles the rendering.
            const rows = this.flattenTreeLeo(
                root,
                0,
                !c.hoistStack.length,
                c.p,
                null // TODO: Implement initialFindNode tracking in Leo core
            );
            // Clear list of positions to animate at the end of the render, since they have now been rendered
            g.app.gui.positionsToAnimate = [];
            view.setTreeDataLeo(rows);
        } else {
            view.setTreeDataLeo([]);
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