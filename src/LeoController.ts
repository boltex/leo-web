import { Position } from "./core/leoNodes";
import { LeoModel } from "./LeoModel";
import { LeoView } from "./LeoView";
import * as g from './core/leoGlobals';
import { TreeNode, FlatRow, FlatRowLeo } from "./types";
import * as utils from './utils';

import { workspace } from "./workspace";
import { Constants } from "./constants";
import { menuData } from "./menu";

const defaultTitle = "Leo Editor for the web";

export class LeoController {
    private model: LeoModel;
    private view: LeoView;
    private urlRegex = /\b(?:(?:https?|ftp):\/\/|file:\/\/\/?|mailto:)[^\s<]+/gi; // http(s)/ftp with '://', file with // or ///, and mailto: without '//'
    private outlinePaneKeyMap: { [key: string]: () => void };

    constructor(model: LeoModel, view: LeoView) {
        this.model = model;
        this.view = view;

        console.log('todo: replace with real leo commands');
        this.outlinePaneKeyMap = {
            'Enter': () => view.BODY_PANE.focus(),
            'Tab': () => view.BODY_PANE.focus(),

            // ' ': () => this.toggleSelected(),
            // 'ArrowUp': () => this.selectVisBack(),
            // 'ArrowDown': () => this.selectVisNext(),
            // 'ArrowLeft': () => this.contractNodeOrGoToParent(),
            // 'ArrowRight': () => this.expandNodeAndGoToFirstChild(),
            // 'PageUp': () => this.gotoFirstSiblingOrParent(),
            // 'PageDown': () => this.gotoLastSiblingOrVisNext(),
            // 'Home': () => this.gotoFirstVisibleNode(),
            // 'End': () => this.gotoLastVisibleNode()
        };

        view.buildMenu(menuData);
        view.setWindowTitle(defaultTitle)
        view.initializeThemeAndLayout(); // gets ratios from localStorage and applies layout and theme
    }

    public setCommands(commands: [string, (...args: any[]) => any][]) {
        this.view.setCommands(commands);
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
        // view.BODY_PANE.addEventListener("beforeinput", utils.preventDefault); // Block text changes
        // view.BODY_PANE.addEventListener("paste", utils.preventDefault); // Block text changes

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
        console.log('Setting up button handlers');

        // * Outline Actions (TODO: connect these methods) *
        // view.COLLAPSE_ALL_BTN.addEventListener('click', this.collapseAll);
        // view.HOIST_BTN.addEventListener('click', this.hoistNode);
        // view.DEHOIST_BTN.addEventListener('click', this.dehoistNode);
        // view.PREV_BTN.addEventListener('click', this.previousHistory);
        // view.NEXT_BTN.addEventListener('click', this.nextHistory);
        // view.TOGGLE_MARK_BTN.addEventListener('click', this.toggleMarkCurrentNode);
        // view.NEXT_MARKED_BTN.addEventListener('click', this.gotoNextMarkedNode);
        // view.PREV_MARKED_BTN.addEventListener('click', this.gotoPrevMarkedNode);
        // view.ACTION_MARK.addEventListener('click', this.toggleMarkCurrentNode);
        // view.ACTION_UNMARK.addEventListener('click', this.toggleMarkCurrentNode); // Same action
        // view.ACTION_HOIST.addEventListener('click', this.hoistNode);
        // view.ACTION_DEHOIST.addEventListener('click', this.dehoistNode);

        // * Interface Only Actions *
        view.THEME_TOGGLE.addEventListener('click', this.handleThemeToggleClick);
        view.LAYOUT_TOGGLE.addEventListener('click', this.handleLayoutToggleClick);
        view.MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        view.TOP_MENU_TOGGLE.addEventListener('click', this.handleMenuToggleClick);
        view.LOG_TAB.addEventListener('click', () => { view.showTab("log") });
        view.FIND_TAB.addEventListener('click', () => { view.showTab("find") });
        view.UNDO_TAB.addEventListener('click', () => { view.showTab("undo") });
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
        this.view.updateButtonVisibility(this.model.marked.size > 0, this.model.navigationHistory.length > 1);
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
                this.model.initialFindNode = null; // Reset initial find node when scope changes
                this.buildRowsRenderTree(); // Re-render to update node highlighting
            });
        });
    }

    public setupDocumentTabsAndHandlers() {
        const hasOpenedDocuments = g.app.windowList.length > 0;
        this.view.setHasOpenedDocuments(hasOpenedDocuments);

        // Set body pane contenteditable based on whether there are opened documents
        this.view.BODY_PANE.contentEditable = hasOpenedDocuments ? "plaintext-only" : "false";

        // First call the view method to clear existing tabs
        this.view.clearDocumentTabs();

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
        const model = this.model;
        this.initializeInteractions(); // sets up event handlers and button focus prevention
        view.OUTLINE_FIND_CONTAINER.style.visibility = 'visible';
        this.loadConfigPreferences();

        view.setupButtonContainerAutoHide();
        view.updateMarkedButtonStates(model.marked.size > 0);
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
        console.log("Workspace ready:", dirHandle);

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
        if (rowIndex < 0 || rowIndex >= view.flatRows!.length) return;

        const row = view.flatRows![rowIndex]!;

        // Handle different click targets
        if (target.classList.contains('caret') && row.hasChildren) {
            event.stopPropagation();
            view.closeMenusEvent(event);
            // Both toggle and select in one operation
            this.selectAndOrToggleAndRedraw(
                row.node !== this.model.selectedNode ? row.node : null,
                row.node
            );
        } else {
            // Rest of the node (including icon and text)
            event.stopPropagation();
            view.closeMenusEvent(event);
            if (row.node !== this.model.selectedNode) {
                this.selectAndOrToggleAndRedraw(row.node); // Just selection
            }
        }
    }

    private handleOutlinePaneDblClick = (event: MouseEvent) => {
        const view = this.view;
        const target = event.target as Element;

        if (target.classList.contains('node-text')) {
            event.preventDefault();
            event.stopPropagation();

            const nodeEl = target.closest('.node') as HTMLElement | null;
            if (!nodeEl) return;

            const rowIndex = Math.floor(parseInt(nodeEl.style.top) / view.ROW_HEIGHT);
            if (rowIndex >= 0 && rowIndex < view.flatRows!.length) {
                const row = view.flatRows![rowIndex]!;
                if (row.hasChildren) {
                    // Handle both selection and toggle in one update
                    this.selectAndOrToggleAndRedraw(
                        row.node !== this.model.selectedNode ? row.node : null,
                        row.node
                    );
                }
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
        if (rowIndex < 0 || rowIndex >= view.flatRows!.length) return;
        const row = view.flatRows![rowIndex]!;

        // Select the node if not already selected
        if (row.isSelected === false) {
            this.selectAndOrToggleAndRedraw(row.node);
        }

        console.log('Context menu on node:', row.node);

        // Position and show the custom context menu
        view.MENU.style.top = `${e.clientY}px`;
        view.MENU.style.left = `${e.clientX}px`;
        view.MENU.style.display = 'block';
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
            this.view.OUTLINE_PANE.focus();
        }
        // check for undo/redo and prevent it for now (later: implement undo/redo)
        if (e.key.toLowerCase() === 'z' && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
            console.log('Undo shortcut detected');
            e.preventDefault();
        }
        if (
            (e.key.toLowerCase() === 'y' && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ||
            (e.key.toLowerCase() === 'z' && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey)
        ) {
            console.log('Redo shortcut detected');
            e.preventDefault();
        }
    }

    // Global key handlers (work anywhere)
    private handleGlobalKeyDown = (e: KeyboardEvent) => {
        const view = this.view;
        if (view.isDialogOpen) return; // Prevent handling when a dialog is open

        console.log('Global keydown:', e.key, 'Ctrl:', e.ctrlKey, 'Alt:', e.altKey, 'Meta:', e.metaKey);
        // if (e.key.toLowerCase() === 'f' && e.ctrlKey && !e.altKey && !e.metaKey) {
        //     e.preventDefault();
        //     this.startFind();
        // } else if (e.key.toLowerCase() === 'm' && e.ctrlKey && !e.altKey && !e.metaKey) {
        //     e.preventDefault();
        //     this.toggleMarkCurrentNode();
        // } else if (e.key === 'F2') {
        //     e.preventDefault();
        //     this.findPrevious();
        // } else if (e.key === 'F3') {
        //     e.preventDefault();
        //     this.findNext();
        // } else if (e.key === '-' && e.altKey && !e.ctrlKey && !e.metaKey) {
        //     e.preventDefault();
        //     this.collapseAll();
        // } else if (e.altKey && !e.ctrlKey && !e.metaKey) {
        //     // Handle Alt+Arrow keys globally
        //     switch (e.key) {
        //         case 'ArrowUp':
        //             e.preventDefault();
        //             view.OUTLINE_PANE.focus();
        //             this.selectVisBack();
        //             break;
        //         case 'ArrowDown':
        //             e.preventDefault();
        //             view.OUTLINE_PANE.focus();
        //             this.selectVisNext();
        //             break;
        //         case 'ArrowLeft':
        //             e.preventDefault();
        //             view.OUTLINE_PANE.focus();
        //             this.contractNodeOrGoToParent();
        //             break;
        //         case 'ArrowRight':
        //             e.preventDefault();
        //             view.OUTLINE_PANE.focus();
        //             this.expandNodeAndGoToFirstChild();
        //             break;
        //     }
        // }
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
        const model = this.model;
        const isCurrentlyHoisted = model.hoistStack.length > 0 && model.hoistStack[model.hoistStack.length - 1] === model.selectedNode;
        this.view.updateHoistButtonStates(
            !model.selectedNode || !model.hasChildren(model.selectedNode) || isCurrentlyHoisted,
            model.hoistStack.length === 0
        );
    }

    private refreshContextMenuState(): void {
        const model = this.model;
        const hasSelectedNode = !!model.selectedNode;
        const isCurrentlyHoisted = model.hoistStack.length > 0 && hasSelectedNode && model.hoistStack[model.hoistStack.length - 1] === model.selectedNode;
        this.view.updateContextMenuState(
            hasSelectedNode && !model.marked.has(model.selectedNode!.gnx),
            hasSelectedNode && model.marked.has(model.selectedNode!.gnx),
            hasSelectedNode && model.hasChildren(model.selectedNode!) && !isCurrentlyHoisted,
            model.hoistStack.length > 0
        );
    }

    private selectAndOrToggleAndRedraw(newSelectedNode: TreeNode | null = null, nodeToToggle: TreeNode | null = null) {

        const view = this.view;
        // this.buildRowsRenderTree();

        // TODO : Rename/Implement this method properly
        console.log('selectAndOrToggleAndRedraw called with newSelectedNode:', newSelectedNode, 'nodeToToggle:', nodeToToggle);

    }

    private computeBody(node: TreeNode): [string, boolean] {
        // Look for a line in the text starting with "@wrap" or "@nowrap",
        // if not found, check the parent of node recursively.
        // Note: wrap is default so only need to check for nowrap
        let currentNode = node;
        let nowrapFound = false;
        while (currentNode.parent) { // Make sure to stop at the hidden root node
            const body = this.model.data[currentNode.gnx]?.bodyString || "";
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
        let text = this.model.data[node.gnx]?.bodyString || "";
        text = text.replace(this.urlRegex, url => {
            return `<a href="${url}" target="_blank" contenteditable="plaintext-only" rel="noopener noreferrer">${url}</a>`;
        });
        return [text, !nowrapFound];
    }

    // * Controller Methods (Search Orchestration) *
    private startFind() {
        const view = this.view;
        const model = this.model;
        model.initialFindNode = null; // If null, find next will set this, used with "Suboutline Only" find radio option (value: suboutline)
        view.showTab("find");
        view.FIND_INPUT.focus();
        view.FIND_INPUT.select();
        this.buildRowsRenderTree(); // To show or remove initial-find highlight
    }

    private findNext() {
        const view = this.view;
        const model = this.model;
        if (!model.selectedNode) return; // No selection, nothing to search from
        const searchText = view.FIND_INPUT.value.trim();
        if (!searchText) {
            view.showToast('Empty find pattern', 1500);
            return; // Empty search, do nothing
        }

        const searchInBody = view.OPT_BODY.checked;
        const searchInHeadlines = view.OPT_HEADLINE.checked;
        const ignoreCase = view.OPT_IGNORECASE.checked;
        const isRegexp = view.OPT_REGEXP.checked;
        const wholeWord = view.OPT_WHOLE.checked;
        const markFind = view.OPT_MARK.checked;
        if (!searchInBody && !searchInHeadlines) {
            view.showToast('not searching headline or body', 2000);
            return; // Nothing to search in
        }
        if (!model.initialFindNode) {
            model.initialFindNode = model.selectedNode; // Set initial find node if not already set
        }

        let selectedRadioValue = this.getFindScope();

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

            const startIndex = model.allNodesInOrder.indexOf(model.selectedNode);
            if (startIndex === -1) return;

            const totalNodes = model.allNodesInOrder.length;
            let currentIndex = startIndex; // start from current selection

            while (currentIndex < totalNodes) {
                const node = model.allNodesInOrder[currentIndex]!;
                if (selectedRadioValue === 'suboutline' && (model.initialFindNode !== node && model.isAncestorOf(model.initialFindNode, node) === false)) {
                    break; // Reached outside suboutline of initialFindNode
                }

                let headString = model.data[node.gnx]?.headString || "";
                let body = model.data[node.gnx]?.bodyString || "";

                // If searching headlines, check there first, but skip if the focus in in the body pane and its the currently selected node
                if (searchInHeadlines && headString && !(node === model.selectedNode && view.findFocus() === 2)) {
                    regex.lastIndex = 0; // Reset regex state
                    let startOffset = 0;
                    // If this is the currently selected node, check for current selection range existing in selectedLabelElement with getSelection()
                    // and only search after that range. Keep that offset, if any, and apply it to the match index later.
                    if (node === model.selectedNode && view.selectedLabelElement) {
                        const selection = window.getSelection()!;
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            if (view.selectedLabelElement.contains(range.commonAncestorContainer)) {
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
                            if (!model.marked.has(node.gnx)) {
                                model.marked.add(node.gnx);
                                if (model.data[node.gnx]) {
                                    model.data[node.gnx]!.icon = (model.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                                }
                            }
                        }
                        this.selectAndOrToggleAndRedraw(node); // This also calls scrollSelectedNodeIntoView

                        // Focus outline pane and highlight match
                        if (view.findFocus() !== 1) {
                            view.OUTLINE_PANE.focus();
                        }

                        // Highlight the match in the headline using selectedLabelElement
                        setTimeout(() => {
                            view.highlightMatchInHeadline(match.index + startOffset, match.index + startOffset + match[0].length);
                        });

                        return;
                    }
                }

                if (searchInBody && body) {
                    regex.lastIndex = 0; // Reset regex state

                    // If this is the currently selected node, check for current selection range existing in BODY_PANE with getSelection()
                    // and only search after that range. Keep that offset, if any, and apply it to the match index later.
                    let startOffset = 0;
                    if (node === model.selectedNode && view.BODY_PANE) {
                        const selection = window.getSelection()!;
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            if (view.BODY_PANE.contains(range.commonAncestorContainer)) {
                                // Compute global offset across all text nodes in BODY_PANE
                                startOffset = utils.getGlobalOffset(view.BODY_PANE, range.endContainer, range.endOffset);
                                body = body.substring(startOffset);
                            }
                        }
                    }

                    const match = regex.exec(body);
                    if (match) {
                        if (markFind) {
                            if (!model.marked.has(node.gnx)) {
                                model.marked.add(node.gnx);
                                if (model.data[node.gnx]) {
                                    model.data[node.gnx]!.icon = (model.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                                }
                            }
                        }
                        this.selectAndOrToggleAndRedraw(node); // This also calls scrollSelectedNodeIntoView
                        if (view.findFocus() !== 2) {
                            view.BODY_PANE.focus();
                        }
                        setTimeout(() => {
                            view.highlightMatchInBody(match.index + startOffset, match.index + startOffset + match[0].length);
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
            view.showToast(`Not found: (${searchedParams.join(", ")}) ${searchText}`, 1500);

        } catch (e: any) {
            view.showToast('Invalid search pattern: ' + e.message, 2000);
        }

    }

    private findPrevious() {
        const view = this.view;
        const model = this.model;
        if (!model.selectedNode) return; // No selection, nothing to search from
        const searchText = view.FIND_INPUT.value.trim();
        if (!searchText) {
            view.showToast('Empty find pattern', 1500);
            return; // Empty search, do nothing
        }

        const searchInBody = view.OPT_BODY.checked;
        const searchInHeadlines = view.OPT_HEADLINE.checked;
        const ignoreCase = view.OPT_IGNORECASE.checked;
        const isRegexp = view.OPT_REGEXP.checked;
        const wholeWord = view.OPT_WHOLE.checked;
        const markFind = view.OPT_MARK.checked;
        if (!searchInBody && !searchInHeadlines) {
            view.showToast('not searching headline or body', 2000);
            return; // Nothing to search in
        }
        if (!model.initialFindNode) {
            model.initialFindNode = model.selectedNode; // Set initial find node if not already set
        }

        let selectedRadioValue = this.getFindScope();

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

            const startIndex = model.allNodesInOrder.indexOf(model.selectedNode);
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
            const node = model.selectedNode;
            let headString = model.data[node.gnx]?.headString || "";
            let body = model.data[node.gnx]?.bodyString || "";

            // Get current selection info
            const selection = window.getSelection() as Selection;
            let headlineOffset = Infinity;
            let bodyOffset = Infinity;

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (view.selectedLabelElement && view.selectedLabelElement.contains(range.commonAncestorContainer)) {
                    // Selection is in headline — safe, no <a> tags
                    headlineOffset = range.startOffset;

                } else if (view.BODY_PANE.contains(range.commonAncestorContainer)) {
                    // Selection is in body — compute global offset across text nodes
                    bodyOffset = utils.getGlobalOffset(view.BODY_PANE, range.startContainer, range.startOffset);
                }
            }

            const currentFocus = view.findFocus();

            // Check current node based on focus
            if (currentFocus === 2 && searchInBody && body) {
                // If focused in body, check body first
                const limitedBody = body.substring(0, bodyOffset);
                const match = findLastMatch(limitedBody);

                if (match) {
                    if (markFind && !model.marked.has(node.gnx)) {
                        model.marked.add(node.gnx);
                        if (model.data[node.gnx]) {
                            model.data[node.gnx]!.icon = (model.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                        }
                    }
                    this.selectAndOrToggleAndRedraw(node);
                    view.BODY_PANE.focus();
                    setTimeout(() => {
                        view.highlightMatchInBody(match.index, match.index + match.length);
                    });
                    return;
                }
            }

            // Check headline if appropriate
            if (searchInHeadlines && headString) {
                const limitedHeadline = currentFocus !== 2 ? headString.substring(0, headlineOffset) : headString;
                const match = findLastMatch(limitedHeadline);

                if (match) {
                    if (markFind && !model.marked.has(node.gnx)) {
                        model.marked.add(node.gnx);
                        if (model.data[node.gnx]) {
                            model.data[node.gnx]!.icon = (model.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                        }
                    }
                    this.selectAndOrToggleAndRedraw(node);
                    view.OUTLINE_PANE.focus();
                    setTimeout(() => {
                        view.highlightMatchInHeadline(match.index, match.index + match.length);
                    });
                    return;
                }
            }

            // Continue searching through previous nodes if no match was found in current node
            let currentIndex = startIndex - 1;

            while (currentIndex >= 0) {
                const node = model.allNodesInOrder[currentIndex]!;
                if (selectedRadioValue === 'nodeonly') {
                    break; // Only search current node
                }
                if (selectedRadioValue === 'suboutline' && (model.initialFindNode !== node && model.isAncestorOf(model.initialFindNode, node) === false)) {
                    break; // Reached outside suboutline of initialFindNode
                }
                let headString = model.data[node.gnx]?.headString || "";
                let body = model.data[node.gnx]?.bodyString || "";
                // In previous nodes, check body first (since we're going backward)
                if (searchInBody && body) {
                    const match = findLastMatch(body);
                    if (match) {
                        if (markFind && !model.marked.has(node.gnx)) {
                            model.marked.add(node.gnx);
                            if (model.data[node.gnx]) {
                                model.data[node.gnx]!.icon = (model.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                            }
                        }
                        this.selectAndOrToggleAndRedraw(node);
                        view.BODY_PANE.focus();
                        setTimeout(() => {
                            view.highlightMatchInBody(match.index, match.index + match.length);
                        });
                        return;
                    }
                }

                // Then check headline
                if (searchInHeadlines && headString) {
                    const match = findLastMatch(headString);

                    if (match) {
                        if (markFind && !model.marked.has(node.gnx)) {
                            model.marked.add(node.gnx);
                            if (model.data[node.gnx]) {
                                model.data[node.gnx]!.icon = (model.data[node.gnx]!.icon || 0) | 2; // Set marked bit
                            }
                        }

                        this.selectAndOrToggleAndRedraw(node);
                        view.OUTLINE_PANE.focus();
                        setTimeout(() => {
                            view.highlightMatchInHeadline(match.index, match.index + match.length);
                        });
                        return;
                    }
                }
                currentIndex--;
            }

            let searchedParams = [];
            if (searchInHeadlines) searchedParams.push('head');
            if (searchInBody) searchedParams.push('body');
            view.showToast(`Not found: (${searchedParams.join(", ")}) ${searchText}`, 1500);
        } catch (e: any) {
            view.showToast('Invalid search pattern: ' + e.message, 2000);
        }
    }

    // * Controller Methods (Persistence) *

    private saveAllPreferences = () => {
        this.saveLayoutPreferences();
        this.saveConfigPreferences();
        this.saveDocumentStateToLocalStorage();
    }

    private saveDocumentStateToLocalStorage() {
        const model = this.model;
        // Use the allNodesInOrder tree, the full list from the top as if all nodes were expanded,
        // to note the position of hoisted node(s), expanded node(s), and the currently selected node.
        let hoistStackPositions = []; // empty means no hoist
        for (const hoisted of model.hoistStack) {
            const pos = model.allNodesInOrder.indexOf(hoisted);
            if (pos !== -1) {
                hoistStackPositions.push(pos);
            }
        }
        const expandedPositions = [];
        for (const node of model.expanded) {
            const pos = model.allNodesInOrder.indexOf(node);
            if (pos !== -1) {
                expandedPositions.push(pos);
            }
        }
        const selectedPosition = model.allNodesInOrder.indexOf(model.selectedNode!); // -1 means no selection
        const markedArray = Array.from(model.marked); // Marked are the gnx keys, not numeric positions from allNodesInOrder
        const dataToSave = {
            marked: markedArray,
            hoistStack: hoistStackPositions,
            selected: selectedPosition,
            expanded: expandedPositions
        };
        utils.safeLocalStorageSet(model.genTimestamp, JSON.stringify(dataToSave));
    }

    private loadDocumentStateFromLocalStorage(): TreeNode | null {
        // returns the selected node if found, otherwise null
        const model = this.model;
        let initialSelectedNode = null;
        const savedData = utils.safeLocalStorageGet(model.genTimestamp);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Start by rebuilding marked set and their related node icons
                if (parsedData && Array.isArray(parsedData.marked)) {
                    model.marked.clear();
                    parsedData.marked.forEach((gnx: number) => {
                        model.marked.add(gnx);
                        // Update icon state to reflect marked status
                        if (model.data[gnx]) {
                            model.data[gnx].icon = (model.data[gnx].icon || 0) | 2; // Set marked bit
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
                        if (hoisted >= 0 && hoisted < model.allNodesInOrder.length) {
                            model.hoistStack.push(model.allNodesInOrder[hoisted]!);
                        }
                    }
                    for (const node of expandedPositions) {
                        if (node >= 0 && node < model.allNodesInOrder.length) {
                            model.expanded.add(model.allNodesInOrder[node]!);
                        }
                    }
                    if (selectedPosition >= 0 && selectedPosition < model.allNodesInOrder.length) {
                        initialSelectedNode = model.allNodesInOrder[selectedPosition]!;
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
    private buildRowsRenderTree(): void {
        const view = this.view;
        const model = this.model;
        // Calculate data, then pass to View. View handles the rendering.
        const rows = this.flattenTree(model.getCurrentRoot(), 0, !model.hoistStack.length, model.selectedNode, model.initialFindNode);
        view.setTreeData(rows);
    }

    private flattenTree(
        node: TreeNode,
        depth = 0,
        isRoot = true,
        selectedNode: TreeNode | null,
        initialFindNode: TreeNode | null,
    ): FlatRow[] {
        // In an MVC model, this belongs to the controller as it builds the view model (flatRows) from the model (tree, expanded, hoistStack, selectedNode)
        const model = this.model;
        const flatRows: FlatRow[] = [];

        if (!isRoot && !model.isVisible(node)) {
            return flatRows; // Skip hidden nodes
        }

        if (!isRoot) {
            flatRows.push({
                label: model.data[node.gnx]!.headString || `Node ${node.gnx}`,
                depth: depth,
                toggled: false, // Reset each time
                hasChildren: model.hasChildren(node),
                isExpanded: model.isExpanded(node),
                node: node,
                // Computed display properties
                isSelected: node === selectedNode,
                isAncestor: selectedNode ? model.isAncestorOf(node, selectedNode) : false,
                isInitialFind: this.computeIsInitialFind(node, initialFindNode, model.selectedNode),
                icon: model.data[node.gnx]!.icon || 0
            });
        }

        if (model.isExpanded(node) || isRoot) {
            const children = model.children(node);
            for (const child of children) {
                // Root node's children appear at depth 0
                flatRows.push(...this.flattenTree(child, depth + (isRoot ? 0 : 1), false, selectedNode, initialFindNode));
            }
        }

        return flatRows;
    }

    // Migration to a real Leo core. redo base methods to use LeoJS's core API.
    public buildRowsRenderTreeLeo(): void {
        console.log('buildRowsRenderTreeLeo called');
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
                !this.model.hoistStack.length,
                c.p,
                null // TODO: Implement initialFindNode tracking in Leo core
            );
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
                flatRowsLeo.push({
                    label: node.h,
                    depth: depth,
                    toggled: false, // Reset each time
                    hasChildren: node.hasChildren(),
                    isExpanded: node.isExpanded(),
                    node: node,
                    isSelected: node === selectedNode,
                    isAncestor: selectedNode ? node.isAncestorOf(selectedNode) : false,
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
            return node === initialFindNode || this.model.isAncestorOf(initialFindNode, node);
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

}