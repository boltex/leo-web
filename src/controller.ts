//@+leo-ver=5-thin
//@+node:felix.20260321195438.1: * @file src/controller.ts
//@+<< imports >>
//@+node:felix.20260322215550.1: ** << imports >>
import { Position } from "./core/leoNodes";
import * as g from './core/leoGlobals';
import { ConfigSetting, FlatRowLeo, Focus, LeoButton, LeoGoto, LeoGotoNavKey, LeoGotoNode, LeoUndoNode, TGotoTypes } from "./types";
import * as utils from './utils';

import { workspace } from "./workspace";
import { Constants } from "./constants";
import { bodyPaneContextMenuData, menuData, outlinePaneContextMenuData } from "./menu";
import { toolbarButtons } from "./toolbar-buttons";
import { keybindings } from "./keybindings";
import { QuickSearchController } from "./core/quicksearch";
import { nullButtonWidget } from "./core/leoFrame";
import { RClick } from "./core/mod_scripting";
import { tips } from "./tips";

//@-<< imports >>
//@+others
//@+node:felix.20260322215901.1: ** Controller
export class Controller {

    private _commands: Record<string, (...args: any[]) => any> = {};

    // Unused for now, but we can use this regex to detect URLs in the future if we want to add link-clicking functionality in the body pane or elsewhere.
    private urlRegex = /\b(?:(?:https?|ftp):\/\/|file:\/\/\/?|mailto:)[^\s<]+/gi; // http(s)/ftp with '://', file with // or ///, and mailto: without '//'

    private _lastUndoBeadIndex: number | null = null; // To track the last right-clicked undo bead index for showing context menu options
    private _lastAtButton: LeoButton | null = null; // To track the last right-clicked at-button for context menu actions

    // Goto Nodes Variables
    public nodeList: LeoGotoNode[] = [];
    public selectedNodeIndex: number = 0;
    public isSelected = false;

    constructor() {
        workspace.menu.buildMenu(menuData);
        workspace.menu.buildIconButtons(toolbarButtons);
        workspace.menu.buildBodyContextMenu(bodyPaneContextMenuData);
        workspace.menu.buildOutlineContextMenu(outlinePaneContextMenuData);
        workspace.layout.setWindowTitle(Constants.DEFAULT_WINDOW_TITLE);
        workspace.layout.initializeThemeAndLayout(); // gets ratios from localStorage and applies layout and theme
    }

    //@+others
    //@+node:felix.20260322222042.1: *3* setCommands
    public setCommands(commands: [string, (...args: any[]) => any][]) {
        for (const [name, func] of commands) {
            this._commands[name] = func;
        }
    }
    //@+node:felix.20260322222039.1: *3* doCommand
    public doCommand(commandName: string, ...args: any[]): any {
        workspace.menu.closeAllSubmenus();
        const command = this._commands[commandName];
        if (command) {
            return command(...args);
        } else {
            console.warn(`Command not found: ${commandName}`);
        }
    }
    //@+node:felix.20260414231550.1: *3* refreshAbbrev
    public refreshAbbrev(): void {

        const w = g.app.gui.get_focus();
        const focus = g.app.gui.widget_name(w).toLowerCase();
        if (focus.includes('tree') || focus.includes('head')) {
            g.app.gui.fullRefresh(true, true);
            // TODO : UNCOMMENT BELOW MAYBE?
            setTimeout(() => {
                // Select headline if needed after refresh.
                g.app.gui.editHeadline(undefined, false, [w.sel[0], w.sel[1], w.ins]);
            }, 0);
        } else {
            g.app.gui.fullRefresh(false, false, Focus.Body, {
                tree: true,
                body: true,
                scroll: true,
                // documents: false,
                // buttons: false,
                states: true,
            });
        }
    }
    //@+node:felix.20260322222300.1: *3* Initialization & Setup
    //@+others
    //@+node:felix.20260322222024.1: *4* initializeInteractions
    // * Controller Methods (Initialization & Setup) *
    public initializeInteractions() {
        this.setupEventHandlers();
        this.setupButtonFocusPrevention();
        workspace.layout.setupLastFocusedElementTracking();
    }
    //@+node:felix.20260322222014.1: *4* setupEventHandlers
    private setupEventHandlers() {
        this.setupOutlinePaneHandlers();
        this.setupBodyPaneHandlers();
        this.setupLogPaneHandlers();
        this.setupAtButtonHandlers();
        this.setupResizerHandlers();
        this.setupWindowHandlers();
        this.setupButtonHandlers();
        this.setupConfigCheckboxes();
        this.setupTopMenuHandlers();
        this.setupToolbarHandlers();
    }
    //@+node:felix.20260322222009.1: *4* setupOutlinePaneHandlers
    private setupOutlinePaneHandlers() {
        const OUTLINE_PANE = workspace.layout.OUTLINE_PANE;
        // Use only mousedown for selection. Otherwise focus out of edit-headline messes with click events. We can still detect double-clicks by checking the event.detail property in the mousedown handler.
        OUTLINE_PANE.addEventListener('mousedown', this.handleOutlinePaneMouseDown);
        // OUTLINE_PANE.addEventListener('click', this.handleOutlinePaneClick);
        OUTLINE_PANE.addEventListener('dblclick', this.handleOutlinePaneDblClick);
        OUTLINE_PANE.addEventListener('keydown', this.handleOutlinePaneKeyDown);
        OUTLINE_PANE.addEventListener('scroll', utils.throttle(workspace.outline.renderTree, Constants.OUTLINE_THROTTLE_DELAY));
        OUTLINE_PANE.addEventListener('contextmenu', this.handleOutlineContextMenu);
        // Add class allow-context to OUTLINE_PANE to allow right-click menu, but prevent it on individual nodes since they have their own context menu
        OUTLINE_PANE.classList.add('allow-context');

    }
    //@+node:felix.20260322222003.1: *4* setupBodyPaneHandlers
    private setupBodyPaneHandlers() {
        const BODY_PANE = workspace.layout.BODY_PANE;
        BODY_PANE.addEventListener('keydown', this.handleBodyPaneKeyDown);
        BODY_PANE.addEventListener('contextmenu', this.handleBodyContextMenu);
        // Add class allow-context to BODY_PANE to allow right-click menu, but prevent it on certain elements if needed by checking event.target in the contextmenu handler
        BODY_PANE.classList.add('allow-context');
    }
    //@+node:felix.20260322221959.1: *4* setupLogPaneHandlers
    private setupLogPaneHandlers() {
        workspace.layout.LOG_PANE.addEventListener('keydown', this.handleLogPaneKeyDown);
        workspace.logPane.UNDO_CONTENT.classList.add('allow-context');
        workspace.logPane.UNDO_CONTENT.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const target = e.target as Element;
            const nodeEl = target.closest('li.undo-node') as HTMLElement | null;
            if (nodeEl && nodeEl.classList.contains('undo-node')) {
                const beadIndex = parseInt(nodeEl.getAttribute('data-bead-index') || '-1');
                const contextValue = nodeEl.getAttribute('data-undo-context') || 'default';
                if (contextValue === Constants.CONTEXT_FLAGS.UNDO_BEAD) {
                    this._lastUndoBeadIndex = beadIndex;
                    const UNDO_MENU = workspace.menu.UNDO_MENU;
                    setTimeout(() => {
                        UNDO_MENU.style.top = `${e.clientY}px`;
                        UNDO_MENU.style.left = `${e.clientX}px`;
                        UNDO_MENU.style.display = 'block';
                    }, 0);

                }
            }
        });
        // Setup handler for the "Revert to Undo State" option in the undo context menu
        const undoMenu = workspace.menu.UNDO_MENU;
        const ul_element = document.createElement('ul');
        const menuItemElement = document.createElement('li');
        menuItemElement.classList.add('menu-item');
        const labelElement = document.createElement('span');
        labelElement.classList.add('menu-label');
        labelElement.textContent = 'Revert to Undo State';
        menuItemElement.appendChild(labelElement);
        menuItemElement.addEventListener('click', () => {
            if (this._lastUndoBeadIndex !== null) {
                workspace.controller.doCommand(Constants.COMMANDS.REVERT_TO_UNDO, this._lastUndoBeadIndex);
                this._lastUndoBeadIndex = null; // Reset after handling
            }
            // close the undo context menu after clicking the option
            workspace.menu.UNDO_MENU.style.display = 'none';
        });
        ul_element.appendChild(menuItemElement);
        undoMenu.appendChild(ul_element);

    }

    //@+node:felix.20260406170001.1: *4* setupAtButtonHandlers
    private setupAtButtonHandlers() {
        // Those will use the this._lastAtButton to know which button was right-clicked 
        // and call either remove or goto script command with the correct LeoButton.
        const atButtonMenu = workspace.menu.AT_BUTTON_MENU;
        const ul_element = document.createElement('ul');
        const REMOVE_BUTTON = document.createElement('li');
        const GOTO_SCRIPT = document.createElement('li');
        REMOVE_BUTTON.classList.add('menu-item');
        GOTO_SCRIPT.classList.add('menu-item');
        const removeLabel = document.createElement('span');
        const gotoLabel = document.createElement('span');
        removeLabel.classList.add('menu-label');
        gotoLabel.classList.add('menu-label');
        removeLabel.textContent = 'Remove Button';
        gotoLabel.textContent = 'Goto Script';
        REMOVE_BUTTON.appendChild(removeLabel);
        GOTO_SCRIPT.appendChild(gotoLabel);
        ul_element.appendChild(REMOVE_BUTTON);
        ul_element.appendChild(GOTO_SCRIPT);
        atButtonMenu.appendChild(ul_element);

        REMOVE_BUTTON.addEventListener('click', () => {
            workspace.menu.AT_BUTTON_MENU.style.display = 'none';
            workspace.layout.restoreLastFocusedElement();
            if (this._lastAtButton) {
                workspace.controller.doCommand(Constants.COMMANDS.REMOVE_BUTTON, this._lastAtButton);
                this._lastAtButton = null; // Reset after handling
            }
        });

        GOTO_SCRIPT.addEventListener('click', () => {
            workspace.menu.AT_BUTTON_MENU.style.display = 'none';
            workspace.layout.restoreLastFocusedElement();
            if (this._lastAtButton) {
                workspace.controller.doCommand(Constants.COMMANDS.GOTO_SCRIPT, this._lastAtButton);
                this._lastAtButton = null; // Reset after handling
            }
        });

    }

    //@+node:felix.20260322221954.1: *4* setupResizerHandlers
    private setupResizerHandlers() {
        const layout = workspace.layout;
        layout.VERTICAL_RESIZER.addEventListener('mousedown', this.startDrag);
        layout.VERTICAL_RESIZER.addEventListener('touchstart', this.startDrag);
        layout.HORIZONTAL_RESIZER.addEventListener('mousedown', this.startSecondaryDrag);
        layout.HORIZONTAL_RESIZER.addEventListener('touchstart', this.startSecondaryDrag);
        layout.CROSS_RESIZER.addEventListener('mousedown', this.startCrossDrag);
        layout.CROSS_RESIZER.addEventListener('touchstart', this.startCrossDrag);
    }
    //@+node:felix.20260322221948.1: *4* setupWindowHandlers
    private setupWindowHandlers() {
        window.addEventListener('resize', utils.throttle(() => workspace.layout.handleWindowResize(), Constants.DRAG_DEBOUNCE_DELAY));
        window.addEventListener('keydown', this.handleGlobalKeyDown);
        window.addEventListener('beforeunload', this.saveAllPreferences);
        document.addEventListener('click', (e) => {
            workspace.menu.closeMenusEvent(e);
        });
    }
    //@+node:felix.20260322221923.1: *4* setupButtonHandlers
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

        // * Interface Only Actions *
        menu.THEME_TOGGLE.addEventListener('click', this.handleThemeToggleClick);
        menu.LAYOUT_TOGGLE.addEventListener('click', this.handleLayoutToggleClick);
        menu.MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        menu.TOP_BAR_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        logPane.LOG_TAB.addEventListener('pointerdown', () => { logPane.showTab('log') });
        logPane.FIND_TAB.addEventListener('pointerdown', () => { logPane.showTab('find', true) });
        logPane.NAV_TAB.addEventListener('pointerdown', () => { logPane.showTab('nav', true) });
        logPane.UNDO_TAB.addEventListener('pointerdown', () => { logPane.showTab('undo') });
        logPane.SETTINGS_TAB.addEventListener('pointerdown', () => { logPane.showTab('settings') });
    }
    //@+node:felix.20260322221915.1: *4* setupButtonFocusPrevention
    private setupButtonFocusPrevention() {

        workspace.menu.TOP_BAR.addEventListener('mousedown', (e) => {

            e.preventDefault();
        });

        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        });
        workspace.menu.TOP_BAR_TOGGLE.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }
    //@+node:felix.20260322221852.1: *4* onDropdownChanged
    private onDropdownChanged = (e: Event) => {
        const element = e.target as HTMLSelectElement;
        if (element) {
            const w_value = element.options[element.selectedIndex].value;
            // frontConfig[element.id] = w_value;
            const w_changes: ConfigSetting[] = [{
                code: element.id,
                value: w_value
            }];
            g.app.gui.config.setLeoWebSettings(w_changes);
        }
    }
    //@+node:felix.20260322221838.1: *4* setupConfigCheckboxes
    private setupConfigCheckboxes() {
        const menu = workspace.menu;
        menu.SHOW_PREV_NEXT_MARK.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_TOGGLE_MARK.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_PREV_NEXT_HISTORY.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_HOIST_DEHOIST.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_LAYOUT_ORIENTATION.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_THEME_TOGGLE.addEventListener('change', this.refreshButtonVisibility);
        menu.SHOW_NODE_ICONS.addEventListener('change', workspace.outline.updateNodeIcons);
    }
    //@+node:felix.20260322221812.1: *4* refreshButtonVisibility
    private refreshButtonVisibility = () => {
        let hasMarked = false;
        let hasHistory = false;

        hasMarked = workspace.getContext(Constants.CONTEXT_FLAGS.LEO_HAS_MARKED) || false;
        hasHistory = workspace.getContext(Constants.CONTEXT_FLAGS.LEO_CAN_BACK) || workspace.getContext(Constants.CONTEXT_FLAGS.LEO_CAN_NEXT) || false;

        workspace.menu.updateButtonVisibility(hasMarked, hasHistory);

    }
    //@+node:felix.20260322221747.1: *4* setupTopMenuHandlers
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
    //@+node:felix.20260408001315.1: *4* setupToolbarHandlers
    private setupToolbarHandlers() {
        // setup horizontal mouse wheel scrolling for toolbar
        const TOOLBAR = workspace.menu.TOOLBAR;
        TOOLBAR.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
            }
            TOOLBAR.scrollLeft += e.deltaY * 1.5; // scroll horizontally, adjust multiplier as needed.
        }, { passive: false });
    }

    //@+node:felix.20260322221701.1: *4* setupDocumentTabsAndHandlers
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
            layout.setWindowTitle(Constants.DEFAULT_WINDOW_TITLE);
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

            let tooltip = title;
            if (c.mFileName && workspace.workspaceDirHandle) {
                let [w_path, fn] = g.os_path_split(c.mFileName);
                if (w_path) {
                    tooltip = fn + ' in ' + workspace.workspaceDirHandle.name + w_path;
                } else {
                    tooltip = fn;
                }
            }

            const tab = workspace.menu.createDocumentTab(label, tooltip, isActive);
            // If active, also set the broswer's title
            if (isActive) {
                layout.setWindowTitle(label);
            }

            // now setup handlers for the tab to call g.app.gui.selectOpenedLeoDocument(index)
            const index = g.app.windowList.indexOf(frame);
            tab.addEventListener("click", () => {
                g.app.gui.selectOpenedLeoDocument(index);
                // Set focus back as per same way the menu items clicked bring back focus.
                workspace.layout.restoreLastFocusedElement();

            });
            // Also setup handler for middle-click to close the document
            tab.addEventListener("auxclick", (e) => {
                if (e.button === 1) { // Middle click
                    e.preventDefault();
                    g.app.gui.closeLeoFile(index);
                    workspace.layout.restoreLastFocusedElement();
                }
            });
            // Add handler to the close button inside the tab
            const closeBtn = tab.querySelector(".close-btn");
            closeBtn?.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent triggering the tab click event
                g.app.gui.closeLeoFile(index);
                workspace.layout.restoreLastFocusedElement();
            });
        }
    }
    //@+node:felix.20260406002306.1: *4* refreshAtButtons
    public refreshAtButtons(): void {

        const hasOpenedDocuments = g.app.windowList.length > 0;

        // First call the view method to clear existing at-buttons
        workspace.menu.clearAtButtons();
        // const w_children: any[] = [];
        if (!hasOpenedDocuments) {
            return;
        }

        const c = g.app.windowList[g.app.gui.frameIndex].c;

        let d: nullButtonWidget[];
        if (c && c.theScriptingController) {
            d = c.theScriptingController.buttonsArray || [];
        } else {
            d = [];
        }

        const buttons = [];

        let i_but = 0;
        for (const but of d) {
            let rclickList: RClick[] = [];

            if (but.rclicks) {
                rclickList = but.rclicks;
            }

            const entry: LeoButton = {
                name: but.text,
                index: i_but,
                rclicks: rclickList,
            };

            buttons.push(entry);
            i_but += 1;
        }

        const AT_BUTTON_MENU = workspace.menu.AT_BUTTON_MENU;
        buttons.forEach(button => {

            const label = button.name || `Button ${button.index}`;
            const isAdd = button.name === Constants.BUTTON_STRINGS.SCRIPT_BUTTON
            const tooltip = isAdd ? Constants.USER_MESSAGES.SCRIPT_BUTTON_TOOLTIP : label;
            const icon = isAdd ? 2 : button.rclicks!.length ? 1 : 0

            const buttonEl = workspace.menu.createAtButton(label, tooltip, icon);
            // now setup handlers for the button to call g.app.gui.clickAtButton(index)
            buttonEl.addEventListener("click", () => {
                g.app.gui.clickAtButton(button);
                workspace.layout.restoreLastFocusedElement();
            });
            // Also setup handler for right-click to show context menu if not the default "Add Script" button
            if (!isAdd) {
                buttonEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this._lastAtButton = button; // Store the last right-clicked button for context menu actions
                    setTimeout(() => {
                        AT_BUTTON_MENU.style.top = `${e.clientY}px`;
                        AT_BUTTON_MENU.style.left = `${e.clientX}px`;
                        AT_BUTTON_MENU.style.display = 'block';
                    }, 0);
                });
            }
        });
        workspace.layout.updateCollapseAllPosition();

    }

    //@-others
    //@+node:felix.20260322222433.1: *3* Event Handlers
    //@+others
    //@+node:felix.20260322221549.1: *4* initialize
    public async initialize() {
        // The context menu prevention is setup before anything to prevent browser's default.
        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            workspace.menu.closeMenusEvent(e);
            if (!(target instanceof Element) || !target.closest('.allow-context')) {
                e.preventDefault();
            }
        });

        // outline-find-container is initially hidden to prevent FOUC
        workspace.layout.OUTLINE_FIND_CONTAINER.style.visibility = 'visible';
        this.loadConfigPreferences();

        workspace.menu.setupButtonContainerAutoHide();
        workspace.logPane.showTab("log");

        let dirHandle: FileSystemDirectoryHandle | null = null;

        // Pre-start: show 'tips' splash screen offering 'show tips at startup' checkbox
        // and wait for the user to press 'ok'. (if the )
        if (workspace.menu.SHOW_WELCOME_AT_STARTUP.checked && tips.length > 0) {
            await workspace.dialog.showWelcomeDialog(tips[0]);
        }

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
    //@+node:felix.20260322221455.1: *4* handleOutlinePaneMouseDown
    private handleOutlinePaneMouseDown = (e: MouseEvent) => {
        // Check if left mouse button:
        if (e.button === 0) {
            // Handle left mouse button actions here
            this.handleOutlinePaneClick(e);
            // Call from mousedown to ensure it runs before click event
            // and can call preventDefault to stop text selection on double-click
        }
    }
    //@+node:felix.20260322221442.1: *4* handleOutlinePaneClick
    private handleOutlinePaneClick = (event: MouseEvent) => {
        const outline = workspace.outline;
        const target = event.target as Element;
        const nodeEl = target.closest('.node') as HTMLElement | null;
        if (!nodeEl || !g.app.windowList.length) {
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
    //@+node:felix.20260322221432.1: *4* handleOutlinePaneDblClick
    private handleOutlinePaneDblClick = (event: MouseEvent) => {
        const outline = workspace.outline;
        const target = event.target as Element;

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
    //@+node:felix.20260322221423.1: *4* handleBodyContextMenu
    private handleBodyContextMenu = (e: MouseEvent) => {

        // Note: setupWindowHandlers will have called closeMenusEvent to close other menus automatically

        e.preventDefault();
        const BODY_MENU = workspace.menu.BODY_MENU;

        // Position and show the custom context menu. No need to wait for state updates here since the body context menu is static and doesn't have options that depend on the current state of the application, unlike the outline context menu which needs to reflect the state of the selected node.
        // But still use the minimal setTimeout to do it on next tick
        setTimeout(() => {
            BODY_MENU.style.top = `${e.clientY}px`;
            BODY_MENU.style.left = `${e.clientX}px`;
            BODY_MENU.style.display = 'block';
        }, 0);

    }
    //@+node:felix.20260322221401.1: *4* handleOutlineContextMenu
    private handleOutlineContextMenu = (e: MouseEvent) => {

        // Note: setupWindowHandlers will have called closeMenusEvent to close other menus automatically

        e.preventDefault();
        const target = e.target as Element;
        const outline = workspace.outline;
        const MENU = workspace.menu.OUTLINE_MENU;

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

        // Position and show the custom context menu after same delay which the states are updated to ensure the menu options are correct based on the current state of the application.
        setTimeout(() => {
            MENU.style.top = `${e.clientY}px`;
            MENU.style.left = `${e.clientX}px`;
            MENU.style.display = 'block';
        }, Constants.STATES_DEBOUNCE_DELAY);
    }
    //@+node:felix.20260322221338.1: *4* handleOutlinePaneKeyDown
    private handleOutlinePaneKeyDown = (e: KeyboardEvent) => {

        // Block if its CTRL+S even if its not enabled 
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
        }
        // Block if its UNDO or REDO (ctrl+z, ctrl+shift+z, ctrl+y) even if they are not enabled, 
        // to prevent interfering with browser shortcuts
        // BUT ONLY IF NOT CURRENTLY EDITING A HEADLINE: we want to let browser regular undo/redo.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (!workspace.outline.headlineFinish) {
                e.preventDefault();
            } else {
                return; // Let browser handle undo/redo in headline editing mode
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            if (!workspace.outline.headlineFinish) {
                e.preventDefault();
            } else {
                return; // Let browser handle undo/redo in headline editing mode
            }
        }
        // Allow arrows, pageup/down, home,end for moving cursor and selecting with editing the headline 
        if (workspace.outline.headlineFinish) {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
                return; // Let browser handle arrow keys in headline editing mode
            }
        }

        // Ok now we actually want to handle the possible command.
        if (
            this.handlePaneKeyDown(e, "outline")
        ) {
            return;
        }

        // Past this point, we only want to handle abbrev expansion.
        if (!workspace.outline.headlineFinish || e.key.length > 1) {
            // Not in headline editing mode, or its a non-printable key, so just get out.
            return;
        }
        // Was a Single Printable Character, so check for abbrev expansion.
        const c = g.app.windowList[g.app.gui.frameIndex].c;
        if (c.k.abbrevOn) {
            const abbrevPromise = c.abbrevCommands.expandAbbrev(e, e)
            if (abbrevPromise) {
                e.preventDefault(); // Prevent the typing from doing anything!
                abbrevPromise.then((expanded) => {
                    g.app.gui.endEditHeadline();
                    setTimeout(() => {
                        this.refreshAbbrev();
                    }, 0);
                    return;
                });
            }
        }
    }
    //@+node:felix.20260322221320.1: *4* handleBodyPaneKeyDown
    private handleBodyPaneKeyDown = (e: KeyboardEvent) => {
        // Block if its CTRL+S even if its not enabled 
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
        }

        if (
            this.handlePaneKeyDown(e, "body")
        ) {
            return;
        }
        // Handle abbreviations.
        if (e.key.length > 1) {
            return;
        }
        // Was a Single Printable Character, so check for abbrev expansion.
        const c = g.app.windowList[g.app.gui.frameIndex].c;
        if (c.k.abbrevOn) {
            const abbrevPromise = c.abbrevCommands.expandAbbrev(e, e)
            if (abbrevPromise) {
                e.preventDefault(); // Prevent the typing from doing anything!
                abbrevPromise.then((expanded) => {
                    this.refreshAbbrev();
                    return;
                });
            }
        }
    }
    //@+node:felix.20260322221302.1: *4* handleLogPaneKeyDown
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
    //@+node:felix.20260322221225.1: *4* handlePaneKeyDown
    /**
     * Returns true if the key event was handled and should not be processed further, false otherwise.
     */
    private handlePaneKeyDown(e: KeyboardEvent, pane: "outline" | "body" | "find"): boolean {
        // Build key string representation (e.g., "ctrl+shift+q", "shift+alt+left")
        const parts: string[] = [];

        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');
        let code = e.code.toLowerCase();
        let key = e.key.toLowerCase(); // Normalize the key name to lowercase

        // Handle special cases for consistency with keybindings
        if (key === ' ') key = 'space';

        const keyString = [...parts, key].join('+');
        let codeString = [...parts, code].join('+');

        for (const keybind of keybindings) {
            if (!keybind[pane]) continue;
            let targetKey = keybind.key;
            let targetCode = keybind.code;

            if (targetCode && g.isMac) {
                targetCode = targetCode.replace('ctrl', 'meta');
            }
            if (g.isMac && keybind.mac) {
                targetKey = keybind.mac;
            } else if (g.isLinux && keybind.linux) {
                targetKey = keybind.linux;
            } else if (!g.isMac && !g.isLinux && keybind.win) {
                targetKey = keybind.win;
            }

            if ((targetCode && targetCode.toLowerCase() === codeString) || (!targetCode && targetKey.toLowerCase() === keyString)) {

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
                return true;
            }
        }
        return false;

    };
    //@+node:felix.20260322221155.1: *4* handleGlobalKeyDown
    // Global key handlers (work anywhere)
    private handleGlobalKeyDown = (e: KeyboardEvent) => {

        // Uncomment to see key details for debugging keybinding issues. Will log every keydown, so can be noisy!
        // console.log('Global keydown:', e.key, 'Ctrl:', e.ctrlKey, 'Alt:', e.altKey, 'Meta:', e.metaKey);
        // console.log('Global keydown:', e);

        // Block if its CTRL+A if it's not in the body pane nor in an input/textarea, 
        // to prevent selecting all sorts of unintended things on the page. We want to allow Ctrl+A in the body pane for text selection,
        // and in any input or textarea for the same reason, but outside of those we should block it to prevent weird interactions with the rest of the UI.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            const activeElement = document.activeElement;
            const isInBodyPane = workspace.layout.BODY_PANE.contains(activeElement);
            const isInInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('contenteditable') === 'true');
            if (!isInBodyPane && !isInInput) {
                e.preventDefault();
            }
        }

    }
    //@+node:felix.20260322221118.1: *4* Primary Drag
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
        } else {
            let clientY = e.clientY;
            if (e.touches) {
                clientY = e.touches[0].clientY;
            }
            const newHeight = clientY - workspace.menu.TOP_BAR_TOGGLE.offsetHeight;
            if (newHeight >= layout.minWidth) {
                layout.OUTLINE_FIND_CONTAINER.style.height = (newHeight - 3) + 'px';
            } else {
                layout.OUTLINE_FIND_CONTAINER.style.height = (layout.minWidth - 3) + 'px';
            }
        }
        workspace.outline.renderTree();
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
    //@+node:felix.20260322221036.1: *4* Secondary Drag
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
        }
        workspace.outline.renderTree();
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
    //@+node:felix.20260322220944.1: *4* Cross Drag
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
            const newHeight = clientY - workspace.menu.TOP_BAR_TOGGLE.offsetHeight;
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
    //@+node:felix.20260322220436.1: *4* handle ToggleClick Methods
    private handleLayoutToggleClick = () => {
        workspace.layout.toggleLayout();
    }


    private handleMenuToggleClick = () => {
        workspace.menu.toggleMenu();
    }


    private handleThemeToggleClick = () => {
        workspace.layout.toggleTheme();
    }
    //@+node:felix.20260322220332.1: *4* selectAndOrToggleAndRedraw
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
    //@-others
    //@+node:felix.20260322222608.1: *3* Persistence
    //@+others
    //@+node:felix.20260322220201.1: *4* saveAllPreferences
    private saveAllPreferences = () => {
        this.saveLayoutPreferences();
        this.saveConfigPreferences();
    }
    //@+node:felix.20260322220121.1: *4* saveLayoutPreferences
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
    //@+node:felix.20260322220100.1: *4* saveConfigPreferences
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
            // Find-pane options
            findWholeWord: logPane.OPT_WHOLE.checked,
            findIgnoreCase: logPane.OPT_IGNORECASE.checked,
            findRegexp: logPane.OPT_REGEXP.checked,
            findMark: logPane.OPT_MARK_FINDS.checked,
            findHeadline: logPane.OPT_HEADLINE.checked,
            findBody: logPane.OPT_BODY.checked,
            findScope: selectedFindScope,
            showWelcomeAtStartup: menu.SHOW_WELCOME_AT_STARTUP.checked
        };
        utils.safeLocalStorageSet('configPreferences', JSON.stringify(preferences));
    }
    //@+node:felix.20260322220049.1: *4* loadConfigPreferences
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
                menu.SHOW_WELCOME_AT_STARTUP.checked = prefs.showWelcomeAtStartup ?? true;
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
    //@+node:felix.20260322215951.1: *4* getFindScope
    private getFindScope(): string {
        let selectedRadioValue = '';
        const selectedRadio = document.querySelector('input[name="find-scope"]:checked') as HTMLInputElement | null;
        if (selectedRadio) {
            selectedRadioValue = selectedRadio.value;
        }
        return selectedRadioValue;
    }
    //@-others
    //@+node:felix.20260322222738.1: *3* Render Tree
    //@+others
    //@+node:felix.20260322220022.1: *4* buildRowsRenderTreeLeo
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
            // No active Leo document found for building render tree
            outline.setTreeDataLeo([]);
        }
    }
    //@+node:felix.20260322220006.1: *4* flattenTreeLeo
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
                    icon: (+(!node.isDirty()) << 3) |
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
    //@-others
    //@+node:felix.20260327223045.1: *3* buildUndoElements
    public buildUndoElements(): void {
        const children: LeoUndoNode[] = [];
        if (!g.app.windowList.length) {
            workspace.logPane.setUndoNodes(children);
            return;
        }
        const c = g.app.windowList[g.app.gui.frameIndex].c;
        const undoer = c.undoer;

        if (undoer.beads.length) {

            let foundNode: LeoUndoNode | undefined;
            let i: number = 0;
            let defaultIcon = 1;

            undoer.beads.forEach(bead => {
                let description: string = "";
                let undoFlag: boolean = false;
                let icon = defaultIcon;
                if (i === undoer.bead) {
                    description = "Undo";
                    undoFlag = true;
                    icon = 0;
                    defaultIcon = 2;
                }
                if (i === undoer.bead + 1) {
                    description = "Redo";
                    icon = 2;
                    defaultIcon = 3;
                    if (!foundNode) {
                        undoFlag = true; // Passed all nodes until 'redo', no undo found.
                    }
                }
                const node: LeoUndoNode = {
                    label: bead.undoType || "unknown",
                    description: description,
                    contextValue: Constants.CONTEXT_FLAGS.UNDO_BEAD,
                    beadIndex: i - undoer.bead,
                    icon: icon
                };
                children.push(node);
                if (undoFlag) {
                    foundNode = node;
                }
                i++;
            });
            if (foundNode) {
                workspace.logPane.setUndoSelection(foundNode);
            }
        } else {
            const node = {
                label: "Unchanged",
                description: "",
                contextValue: Constants.CONTEXT_FLAGS.NOT_UNDO_BEAD,
                beadIndex: 0,
                icon: undefined
                //          "Unchanged",
                // "",
                // (this._beadId++).toString(),
                // Constants.CONTEXT_FLAGS.NOT_UNDO_BEAD,
                // 0,
                // undefined
            };
            children.push(node);
        }
        workspace.logPane.setUndoNodes(children);
    }

    //@+node:felix.20260327235321.1: *3* buildGotoElements
    public buildGotoElements(): void {
        const c = g.app.windowList[g.app.gui.frameIndex].c;

        const scon: QuickSearchController = c.quicksearchController;

        const result: { [key: string]: any } = {};

        const navlist: LeoGoto[] = [];
        for (let k = 0; k < scon.its.length; k++) {
            navlist.push(
                {
                    "key": k,
                    "h": scon.its[k][0]["label"],
                    "t": scon.its[k][0]["type"] as TGotoTypes
                }
            );
        }

        result["navList"] = navlist;
        result["messages"] = scon.lw;
        result["navText"] = scon.navText;
        result["navOptions"] = { "isTag": scon.isTag, "showParents": scon.showParents };

        this.nodeList = [];
        if (result && result.navList) {

            const navList: LeoGoto[] = result.navList;
            if (navList && navList.length) {
                navList.forEach((goto: LeoGoto) => {
                    // (from leojs) new LeoGotoNode(this._leoUI, p_goto, result.navOptions!)
                    let leoPaneLabel = "";
                    let leoPaneDescription = "";
                    let leoPaneTooltip = goto.h.trim();
                    let leoPaneIcon: number | undefined = undefined;
                    if (goto.t !== 'generic') {
                        leoPaneTooltip = goto.t.charAt(0).toUpperCase() + goto.t.slice(1)
                    }
                    let w_spacing = "";
                    if (scon.showParents && !scon.isTag) {
                        w_spacing = "    ";
                    }
                    let w_label = "";
                    if (["tag", "headline"].includes(goto.t)) {
                        w_label = w_spacing + goto.h;
                    }
                    leoPaneLabel = "";
                    if (["tag", "headline"].includes(goto.t)) {
                        leoPaneLabel = goto.h;
                    }
                    const headline = goto.h.trim();

                    if (goto.t === 'body') {
                        leoPaneIcon = 2;
                        if (scon.showParents) {
                            leoPaneDescription = "    " + headline;
                        } else {
                            leoPaneDescription = "  " + headline;
                        }
                        leoPaneLabel = headline;
                    } else if (goto.t === 'parent') {
                        leoPaneIcon = 0;
                        leoPaneDescription = headline.trim();
                        leoPaneLabel = leoPaneDescription;
                    } else if (goto.t === 'generic') {
                        leoPaneIcon = 4;
                        leoPaneDescription = headline;
                        leoPaneLabel = leoPaneDescription;
                    } else if (goto.t === 'headline') {
                        leoPaneIcon = 1;
                    } else {
                        leoPaneIcon = 3; // tag
                    }

                    this.nodeList.push(
                        {
                            // Empty for now...
                            label: leoPaneLabel,
                            description: leoPaneDescription,
                            tooltip: leoPaneTooltip,
                            entryType: goto.t,
                            key: goto.key,
                            icon: leoPaneIcon
                        }
                    );
                });
            }

        }
        workspace.logPane.setGotoNodes(this.nodeList);
    }

    //@+node:felix.20260330235648.1: *3* resetSelectedNode
    public resetSelectedNode(node?: LeoGotoNode): void {
        this.selectedNodeIndex = 0;
        this.isSelected = false;
        if (node) {
            const w_found = this.nodeList.indexOf(node);
            if (w_found >= 0) {
                this.selectedNodeIndex = w_found;
                this.isSelected = true;
                return;
            }
        }
    }
    //@+node:felix.20260330235927.1: *3* navigateNavEntry
    public async navigateNavEntry(nav: LeoGotoNavKey): Promise<void> {
        if (!this.nodeList.length) {
            this.selectedNodeIndex = 0;
            this.isSelected = false;
            return;
        }
        switch (nav.valueOf()) {
            case LeoGotoNavKey.first:
                this.selectedNodeIndex = 0;
                this.isSelected = true;
                break;

            case LeoGotoNavKey.last:
                this.selectedNodeIndex = this.nodeList.length - 1;
                this.isSelected = true;
                break;

            case LeoGotoNavKey.next:
                if (this.selectedNodeIndex < this.nodeList.length - 1) {
                    this.selectedNodeIndex += 1;
                    this.isSelected = true;
                }
                break;

            case LeoGotoNavKey.prev:
                if (this.selectedNodeIndex > 0) {
                    this.selectedNodeIndex -= 1;
                    this.isSelected = true;
                }
                break;
        }
        // Check if array long enough!
        if (!this.nodeList[this.selectedNodeIndex]) {
            this.selectedNodeIndex = 0;
            this.isSelected = true;
            return; // Cancel
        }
        const node = this.nodeList[this.selectedNodeIndex];

        workspace.logPane.revealGotoNavEntry(this.selectedNodeIndex, true);
        g.app.gui.gotoNavEntry(node);

    }


    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4


//@-leo
