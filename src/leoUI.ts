import * as showdown from "showdown";

import { NullGui } from "./core/leoGui";
import * as g from './core/leoGlobals';
import { Constants } from "./constants";
import { LeoStates } from "./leoStates";
import { IdleTime } from "./core/idle_time";
import * as utils from "./utils";
import { Uri, workspace } from "./workspace";
import { Commands } from "./core/leoCommands";
import { ChooseDocumentItem, CommandOptions, ConfigSetting, Focus, LeoDocument, LeoPackageStates, QuickPickItem, QuickPickItemKind, QuickPickOptions, ReqRefresh, RevealType } from "./types";
import { StringTextWrapper } from "./core/leoFrame";
import { Position } from "./core/leoNodes";
import { debounce, DebouncedFunc } from "lodash";
import { Config } from "./config";
import { Range } from "./body";
import { makeAllBindings } from "./commandBindings";

/**
 * Creates and manages instances of the UI elements along with their events
 */
export class LeoUI extends NullGui {

    public leoStates: LeoStates;
    public trace: boolean = false; //true;

    // * Log Pane
    protected _leoLogPane: boolean = false;
    private _currentOutlineTitle: string = "";

    // * Timers
    public refreshTimer: [number, number] | undefined; // until the selected node is found - even if already started refresh
    public lastRefreshTimer: [number, number] | undefined; // until the selected node is found - refreshed even if not found
    public commandRefreshTimer: [number, number] | undefined; // until the selected node is found -  keep if starting a new command already pending
    public lastCommandRefreshTimer: [number, number] | undefined; // until the selected node is found - refreshed if starting a new command
    public commandTimer: [number, number] | undefined; // until the command done - keep if starting a new one already pending
    public lastCommandTimer: [number, number] | undefined; // until the command done - refreshed if starting a new one

    // * Refresh Cycle
    private _refreshType: ReqRefresh = {}; // Flags for commands to require parts of UI to refresh
    private _revealType: RevealType = RevealType.NoReveal; // Type of reveal for the selected node (when refreshing outline)

    public finalFocus: Focus = Focus.NoChange; // Set in _setupRefresh : Last command issued had focus on outline, as opposed to the body
    public refreshPreserveRange = false; // this makes the next refresh cycle preserve the "findFocusTree" flag once.

    private __refreshNode: Position | undefined; // Set in _setupRefresh : Last command issued a specific node to reveal
    private _lastRefreshNodeTS: number = 0;
    get _refreshNode(): Position | undefined {
        return this.__refreshNode;
    }
    set _refreshNode(p_ap: Position | undefined) {
        // Needs undefined type because it cannot be set in the constructor
        this.__refreshNode = p_ap;
        this._lastRefreshNodeTS = utils.performanceNow();
    }

    private _lastSelectedNode: Position | undefined;
    public lastSelectedNodeTime: number | undefined = 0; // Falsy means not set
    private _lastSelectedNodeTS: number = 0;
    get lastSelectedNode(): Position | undefined {
        return this._lastSelectedNode;
    }
    set lastSelectedNode(p_ap: Position | undefined) {
        // Needs undefined type because it cannot be set in the constructor
        this._lastSelectedNode = p_ap;
        this._lastSelectedNodeTS = utils.performanceNow();
    }

    // * Help Panel
    public showdownConverter: showdown.Converter;

    // * Selection & scroll
    private _selectionDirty: boolean = false; // Flag set when cursor selection is changed
    private _selectionGnx: string = ''; // Packaged into 'BodySelectionInfo' structures, sent to Leo
    private _selection: Selection | undefined; // also packaged into 'BodySelectionInfo'
    private _scrollDirty: boolean = false; // Flag set when cursor selection is changed
    private _scrollGnx: string = '';
    private _scroll: Range | undefined;

    private _editorTouched: boolean = false; // Signifies that the body editor DOM element has been modified by the user since last save

    // * Debounced method used to get states for UI display flags (commands such as undo, redo, save, ...)
    public getStates: (() => void);

    // * Debounced method for refreshing the UI
    public launchRefresh: DebouncedFunc<() => Promise<unknown>>;

    constructor(guiName = 'browserGui') {
        super(guiName);
        console.log('LeoUI initialized with gui:', guiName);
        this.isNullGui = false;

        this.idleTimeClass = IdleTime;

        // * Setup States
        this.leoStates = new LeoStates(this);
        // * Get configuration settings
        this.config = new Config();

        // * also check workbench.editor.enablePreview
        this.config.buildFromSavedSettings();

        this.getStates = debounce(
            this._triggerGetStates,
            Constants.STATES_DEBOUNCE_DELAY
        );

        this.launchRefresh = debounce(
            this._launchRefresh,
            Constants.REFRESH_DEBOUNCE_DELAY
        );

        // * Help panel helper
        this.showdownConverter = new showdown.Converter();

        window.addEventListener('beforeunload', this.onBeforeUnload);
    }

    private onBeforeUnload = (event: BeforeUnloadEvent) => {

        // Loop all opened commanders and check for dirty ones
        let someDirty = false;
        for (const c of g.app.commanders()) {
            if (c.changed) {
                someDirty = true;
                break;
            }
        }
        if (!someDirty) {
            return;
        }

        // If reached this point, some documents are dirty: ask for confirmation
        event.preventDefault();
        event.returnValue = '';
    };

    public applyLayout(orientation: string): void {
        workspace.view.applyLayout(orientation);
    }
    public equalSizedPanes(): void {
        workspace.view.equalSizedPanes();
    }

    public todo(): void {
        workspace.view.showInformationMessage("TODO: Not yet implemented.");
    }

    public async chooseNewWorkspace(): Promise<boolean> {
        // Perform the 'quit' command to force asking to save unsaved changes
        // Then clear the workspace from db and force-refresh the page to restart leojs
        // This will have the effect of closing all opened documents and then asking for a new workspace
        for (const c of g.app.commanders()) {
            const allow = c.exists && g.app.closeLeoWindow(c.frame);
            if (!allow) {
                return Promise.resolve(false);
            }
        }

        workspace.clearWorkspace().catch((e) => {
            console.error('Error clearing workspace:', e);
        });

        // Reload the page to restart leojs
        window.location.reload();


        return Promise.resolve(true);
    }


    /**
     * * Set all remaining local objects, set ready flag(s) and refresh all panels
     */
    public finishStartup(): void {

        if (g.app.windowList[this.frameIndex]) {
            g.app.windowList[this.frameIndex].startupWindow = true;
        }

        // TODO: other startup tasks...

        if (g.app.windowList.length) {
            this._setupOpenedLeoDocument();// this sets this.leoStates.fileOpenedReady
        } else {
            this._setupNoOpenedLeoDocument(); // All closed now!
        }

        if (g.app.leoID && g.app.leoID !== 'None') {
            this.createLogPane();
            this.leoStates.leoIdUnset = false;
            this.leoStates.leoReady = true;
        } else {
            this.leoStates.leoIdUnset = true; // Block most UI & commands until 'setLeoIDCommand' succeeds.
        }
        this.leoStates.leojsStartupDone = true;

    }

    /**
     * Make all key and commands bindings
     */
    public makeAllBindings(): void {
        makeAllBindings(this, workspace.controller);
    }

    public showSettings(): Promise<unknown> {
        // TODO !
        console.log('TODO ! showSettings called to show settings UI');
        return Promise.resolve();
    }

    public put_help(c: Commands, s: string, short_title: string): void {
        s = g.dedent(s.trimEnd());
        s = this.showdownConverter.makeHtml(s);
        workspace.view.showHtmlInNewTab(s, short_title);
    }

    /**
     * Handles the calls from the DocumentLinkProvider for clicks on UNLs.
     */
    public async handleUnl(p_arg: { unl: string }): Promise<void> {
        if (!g.app.windowList.length) {
            // No file opened: exit
            g.es('Handle Unl: No Commanders opened');
            return;
        }
        const c = g.app.windowList[this.frameIndex].c;
        await this.triggerBodySave(true);
        try {

            if (p_arg.unl) {
                this.setupRefresh(
                    Focus.Body, // Finish in body pane given explicitly because last focus was in input box.
                    {
                        tree: true,
                        body: true,
                        goto: true,
                        states: true,
                        documents: true,
                        buttons: true
                    }
                );
                await g.openUrlOnClick(c, p_arg.unl);
                void this.launchRefresh();
                this.loadSearchSettings();

            } else {
                console.log('NO ARGUMENT FOR HANDLE URL! ', p_arg);
            }
        }
        catch (e) {
            console.log('FAILED HANDLE URL! ', p_arg);
        }
    }

    /**
     * * Bind the log output to the log pane of the web UI
     */
    public createLogPane(): void {
        if (!this._leoLogPane) {
            // * Log pane instantiation
            this._leoLogPane = true;
            workspace.view.addToLogPane('', true); // Clear log pane
            console.log("Log pane created.");
            if (g.logBuffer.length) {
                const buffer = g.logBuffer;
                while (buffer.length > 0) {
                    // Pop the bottom one and append it
                    g.es_print(buffer.shift()!);
                }
            }
        }
    }

    public override addLogPaneEntry(p_message: string): void {
        if (this._leoLogPane) {
            workspace.view.addToLogPane(p_message);
        } else {
            g.logBuffer.push(p_message);
        }
    }


    /**
     * * Sets the outline pane top bar string message or refreshes with existing title if no title passed
     * @param p_title new string to replace the current title
     */
    public setTreeViewTitle(p_title?: string): void {
        const w_changed = this.leoStates.fileOpenedReady && this.leoStates.leoOpenedFileName && this.leoStates.leoChanged ? "*" : "";
        if (p_title) {
            this._currentOutlineTitle = p_title;
        }
        let w_title = this._currentOutlineTitle + w_changed;

        // TODO : Set/Change outline pane/web-page title"

        this.refreshDesc();
    }


    public checkConfirmBeforeClose(): void {
        let hasDirty = false;
        for (const frame of g.app.windowList) {
            if (frame.c.changed) {
                hasDirty = true;
            }
        }
        // TODO : SETUP BROWSER TO ASK BEFORE EXITING IF hasDirty IS TRUE, REMOVE IF FALSE
    }


    /**
     * * Validate headline edit input box if active, or, Save body to the Leo app if its dirty.
     *   That is, only if a change has been made to the body 'document' so far
     * @param p_forcedVsCodeSave Flag to also have vscode 'save' the content of this editor through the filesystem
     * @returns a promise that resolves when the possible saving process is finished
     */
    public triggerBodySave(p_forcedVsCodeSave?: boolean, p_fromFocusChange?: boolean): Thenable<unknown> {

        // * Check if headline edit input box is active. Validate it with current value.
        // TODO : implement headline edit box check and validation
        // if (!p_fromFocusChange && this._hib && this._hib.enabled) {
        //     this._hibInterrupted = true;
        //     this._hib.enabled = false;
        //     this._hibLastValue = this._hib.value;
        //     this._hib.hide();
        //     if (this._onDidHideResolve) {
        //         console.error('IN triggerBodySave AND _onDidHideResolve PROMISE ALREADY EXISTS!');
        //     }
        //     const w_resolveAfterEditHeadline = new Promise<void>((p_resolve, p_reject) => {
        //         this._onDidHideResolve = p_resolve;
        //     });
        //     return w_resolveAfterEditHeadline;
        // }

        // * Save body to Leo if a change has been made to the body 'document' so far
        let q_savePromise: Thenable<boolean>;
        if (this._editorTouched) {
            this._editorTouched = false;
            q_savePromise = this._bodySaveDocument();
        } else {
            q_savePromise = Promise.resolve(true);
        }

        return q_savePromise;
    }

    /**
     * Saves the cursor position along with the text selection range and scroll position
     * of the last body, or detached body pane, that had its cursor info set in this._selection, etc.
     */
    private _bodySaveSelection(): void {

        if (!this._selectionDirty || !this._selection) {
            return;
        }

        // Prepare scroll data separately
        let scroll: number;
        if (this._selectionGnx === this._scrollGnx && this._scrollDirty) {
            scroll = this._scroll?.start.line || 0;
        } else {
            scroll = 0;
        }

        let gnx: string | undefined;
        let c: Commands | undefined;
    }

    /**
     * * Sets new body text on leo's side.
     * @returns a promise that resolves when the complete saving process is finished
     */
    private _bodySaveDocument(): Thenable<boolean> {
        // TODO !
        console.log('TODO ! _bodySaveDocument called to save body text to Leo');
        return Promise.resolve(true);
    }

    /**
     * Set filename as description
     */
    public refreshDesc(): void {
        let titleDesc = "";

        if (this.leoStates.fileOpenedReady) {

            const s = this.leoStates.leoOpenedFileName;
            const w_filename = s ? utils.getFileFromPath(s) : Constants.UNTITLED_FILE_NAME;
            let w_path = "";
            const n = s ? s.lastIndexOf(w_filename) : -1;
            if (n >= 0 && n + w_filename.length >= s.length) {
                w_path = s.substring(0, n);
            }
            titleDesc = w_filename + (w_path ? " in " + w_path : '');
        }
        // TODO : Set/Change outline pane/web-page description"

    }

    public refreshDocumentsPane(): void {
        // TODO : implement documents pane refresh
        // The opened documents are in g.app.windowList.
        // The selected document index is this.frameIndex,
        // so the active document (LeoFrame) is g.app.windowList[this.frameIndex]
        // a LeoFrame has a 'c' property which is the commander, and c.fileName() gives the filename.
        workspace.controller.setupDocumentTabsAndHandlers();

    }

    public refreshUndoPane(): void {
        // TODO : implement undo pane refresh
    }
    public refreshBodyStates(): void {
        // TODO : implement body states refresh
    }
    public refreshGotoPane(): void {
        // TODO : implement goto pane refresh
    }
    public refreshButtonsPane(): void {
        // TODO : implement buttons pane refresh
    }

    /**
     * * Setup global refresh options
     * @param p_finalFocus Flag for focus to be placed in outline
     * @param p_refreshType Refresh flags for each UI part
    */
    public setupRefresh(p_finalFocus: Focus, p_refreshType?: ReqRefresh, p_preserveRange?: boolean): void {
        if (p_preserveRange) {
            this.refreshPreserveRange = true; // Will be cleared after a refresh cycle.
        }
        // Set final "focus-placement" EITHER true or false
        this.finalFocus = p_finalFocus;

        if (p_refreshType) {
            // Set all properties WITHOUT clearing others.
            Object.assign(this._refreshType, p_refreshType);
        }
    }

    /**
     * * Launches refresh for UI components and context states (Debounced)
     */
    public async _launchRefresh(): Promise<unknown> {
        // TODO : implement actual refresh of UI components based on this._refreshType and this.finalFocus

        console.log('Launching UI refresh with options:', this._refreshType, ' finalFocus:', this.finalFocus);


        // check states for having at least a document opened
        if (this.leoStates.leoReady && this.leoStates.fileOpenedReady) {
            // Had some opened
            if (!g.app.windowList.length) {
                return this._setupNoOpenedLeoDocument(); // All closed now!
            }
        }


        // Maybe first refresh after opening
        if (this.leoStates.leoReady && !this.leoStates.fileOpenedReady) {
            // Was all closed
            if (g.app.windowList.length) {
                this._setupOpenedLeoDocument();
                // Has a commander opened, but wait for UI!
                await this.leoStates.qLastContextChange;
            } else {
                // First time starting: not even an untitled nor workbook.leo
                return;
            }
        }

        // Consider last command finished since the refresh cycle is starting
        if (this.trace) {
            if (this.commandTimer !== undefined) {
                console.log('commandTimer', utils.getDurationMs(this.commandTimer));
            }
        }
        this.commandTimer = undefined;

        // Start reset-timer capture, if has been reset.
        this.lastRefreshTimer = process.hrtime();
        if (this.refreshTimer === undefined) {
            this.refreshTimer = this.lastRefreshTimer;
        }

        let w_revealType: RevealType;
        if (this.finalFocus.valueOf() === Focus.Outline) {
            w_revealType = RevealType.RevealSelectFocus;
        } else {
            w_revealType = RevealType.RevealSelect;
        }

        const c = g.app.windowList[this.frameIndex].c;
        this._refreshNode = c.p;

        if (this._refreshType.tree) {
            this._refreshType.tree = false;
            this._refreshType.node = false; // Also clears node
            // TODO : implement outline/tree refresh with this._refreshNode and w_revealType
            this._refreshOutline(w_revealType);
        } else if (this._refreshType.node && this._refreshNode) {
            // * Force single node "refresh" by revealing it, instead of "refreshing" it
            this._refreshType.node = false;
            this.leoStates.setSelectedNodeFlags(this._refreshNode);
        }

        if (this._refreshType.body) {
            this._refreshType.body = false;
            let w_showBodyNoFocus: boolean = this.finalFocus.valueOf() !== Focus.Body; // Will preserve focus where it is without forcing into the body pane if true

            this._tryApplyNodeToBody(this._refreshNode || this.lastSelectedNode!, false, w_showBodyNoFocus);
        }

        // getStates will check if documents, buttons and states flags are set and refresh accordingly
        return this.getStates();
    }

    /**
     * * Refreshes all parts.
     * @returns Promise back from command's execution, if added on stack, undefined otherwise.
     */
    public fullRefresh(p_keepFocus?: boolean): void {
        this.setupRefresh(
            p_keepFocus ? Focus.NoChange : this.finalFocus,
            {
                tree: true,
                body: true,
                states: true,
                buttons: true,
                documents: true,
                goto: true,
            }
        );
        void this.launchRefresh();
    }

    /**
         * * Refreshes the outline. A reveal type can be passed along to specify the reveal type for the selected node
         * @param p_revealType Facultative reveal type to specify type of reveal when the 'selected node' is encountered
         */
    private _refreshOutline(p_revealType?: RevealType): void {
        // TODO
        console.log('TODO ! _refreshOutline called with reveal type:', p_revealType);
        workspace.controller.buildRowsRenderTreeLeo();
    }

    /**
     * * Called by UI when the user selects in the tree (click or 'open aside' through context menu)
     * @param p_node is the position node selected in the tree
     * @param p_internalCall Flag used to indicate the selection is forced, and NOT originating from user interaction
     * @returns thenable for reveal to finish or select position to finish
     */
    public async selectTreeNode(
        p_node: Position,
        p_internalCall?: boolean,
    ): Promise<unknown> {
        // TODO
        console.log('TODO ! selectTreeNode called with node:', p_node, ' internalCall:', p_internalCall);
        return Promise.resolve();

    }

    private _tryApplyNodeToBody(node: Position, p_forceShow: boolean, p_showBodyNoFocus: boolean): void {
        // TODO
        console.log('TODO ! _tryApplyNodeToBody called with node:', node, ' forceShow:', p_forceShow, ' showBodyNoFocus:', p_showBodyNoFocus);
    }


    /**
     * * Looks for given position's coloring language and wrap, taking account of '@killcolor', etc.
     */
    private _getBodyLanguage(p: Position): [string, boolean] {
        const c = p.v.context;
        let w_language = "plain";
        const w_wrap = !!c.getWrap(p);
        if (g.useSyntaxColoring(p)) {

            // DEPRECATED leojs old colorizer language detection--------
            // const aList = g.get_directives_dict_list(p);
            // const d = g.scanAtCommentAndAtLanguageDirectives(aList);
            // w_language =
            //     (d && d['language'])
            //     || g.getLanguageFromAncestorAtFileNode(p)
            //     || c.config.getLanguage('target-language')
            //     || 'plain';
            // ---------------------------------------------------------

            // * as per original Leo's leoColorizer.py
            w_language = c.getLanguage(p) || c.config.getLanguage('target-language');
            w_language = w_language.toLowerCase();
        }

        return [w_language, w_wrap];
    }

    /**
     * * 'getStates' action for use in debounced method call
     */
    private _triggerGetStates(): void {

        const frame = g.app.windowList[this.frameIndex];
        const c = frame.c;

        if (this._refreshType.states) {
            this._refreshType.states = false;
            const p = c.p;
            // TODO : set status bar info
            // if (this._leoStatusBar && p && p.v) {
            //     const unl = c.frame.computeStatusUnl(p);
            //     this._leoStatusBar.setString(unl);
            //     this._leoStatusBar.setTooltip(p.h);
            // }
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
            const w_states: LeoPackageStates = {
                changed: c.changed, // Document has changed (is dirty)
                canUndo: c.canUndo(), // Document can undo the last operation done
                canRedo: c.canRedo(), // Document can redo the last operation 'undone'
                canGoBack: c.nodeHistory.beadPointer > 0,
                canGoNext: c.nodeHistory.beadPointer + 1 < c.nodeHistory.beadList.length,
                canDemote: c.canDemote(), // Selected node can have its siblings demoted
                canPromote: c.canPromote(), // Selected node can have its children promoted
                canDehoist: c.canDehoist(), // Document is currently hoisted and can be de-hoisted
                canHoist: w_canHoist,
                topIsChapter: w_topIsChapter
                // 
            };
            this.leoStates.setLeoStateFlags(w_states);
            this.refreshUndoPane();
        }
        // Set leoChanged and leoOpenedFilename
        this.leoStates.leoChanged = c.changed;
        this.leoStates.leoOpenedFileName = frame.getTitle();

        this.refreshBodyStates(); // Set language and wrap states, if different.

        if (this._refreshType.documents) {
            this._refreshType.documents = false;
            this.refreshDocumentsPane();
        }
        if (this._refreshType.goto) {
            this._refreshType.goto = false;
            this.refreshGotoPane();
        }
        if (this._refreshType.buttons) {
            this._refreshType.buttons = false;
            this.refreshButtonsPane();
        }
    }

    /**
     * * Setup UI for having no opened Leo documents
     */
    private _setupNoOpenedLeoDocument(): void {
        this.leoStates.fileOpenedReady = false;
        void this.checkConfirmBeforeClose();
        this.leoStates.fileOpenedReady = false;
        this.lastSelectedNode = undefined;
        this._refreshOutline(RevealType.NoReveal);
        this.refreshDocumentsPane();
        this.refreshButtonsPane();
        this.refreshUndoPane();
        // Empty body pane
        workspace.view.setBody('', false);
    }

    /**
     * * A Leo file was opened: setup UI accordingly.
     */
    private _setupOpenedLeoDocument(): void {
        const frame = g.app.windowList[this.frameIndex];
        const c = frame.c;
        this.leoStates.leoOpenedFileName = frame.getTitle();
        this.leoStates.leoChanged = c.changed;

        // * Startup flag
        if (!this.leoStates.leoIdUnset && g.app.leoID !== 'None') {
            this.leoStates.fileOpenedReady = true;
        }

        this._revealType = RevealType.RevealSelect; // For initial outline 'visible' event

        this.setupRefresh(
            Focus.Body, // Original Leo seems to open itself with focus in body.
            {
                tree: true,
                body: true,
                states: true,
                buttons: true,
                documents: true,
                goto: true
            },
        );

        this.loadSearchSettings();

    }

    /**
     * Leo Command. This is used in "command bindings" from the UI to execute commands.
     * @param p_cmd Command name string
     * @param p_options: CommandOptions for the command
     */
    public async command(
        p_cmd: string,
        p_options: CommandOptions
    ): Promise<unknown> {
        this.lastCommandTimer = process.hrtime();
        if (this.commandTimer === undefined) {
            this.commandTimer = this.lastCommandTimer;
        }
        this.lastCommandRefreshTimer = this.lastCommandTimer;
        if (this.commandRefreshTimer === undefined) {
            this.commandRefreshTimer = this.lastCommandTimer;
        }

        await this.triggerBodySave(true);


        const c = g.app.windowList[this.frameIndex].c;
        this.setupRefresh(p_options.finalFocus, p_options.refreshType);

        let value: any = undefined;
        const p = p_options.node ? p_options.node : c.p;


        let w_offset = 0;
        if (p_options.keepSelection) {
            if (Constants.OLD_POS_OFFSETS.DELETE.includes(p_cmd)) {
                w_offset = -1;
            } else if (Constants.OLD_POS_OFFSETS.ADD.includes(p_cmd)) {
                w_offset = 1;
            }
        }

        try {
            if (p.__eq__(c.p)) {
                value = c.doCommandByName(p_cmd); // no need for re-selection
            } else {
                const old_p = c.p;
                c.selectPosition(p);
                value = c.doCommandByName(p_cmd);
                if (p_options.keepSelection) {
                    if (value && value.then) {
                        void (value as Thenable<unknown>).then((p_result) => {
                            if (c.positionExists(old_p)) {
                                c.selectPosition(old_p);
                            } else {
                                old_p._childIndex = old_p._childIndex + w_offset;
                                if (c.positionExists(old_p)) {
                                    c.selectPosition(old_p);
                                }
                            }
                        });
                    } else {
                        if (c.positionExists(old_p)) {
                            c.selectPosition(old_p);
                        } else {
                            old_p._childIndex = old_p._childIndex + w_offset;
                            if (c.positionExists(old_p)) {
                                c.selectPosition(old_p);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            void workspace.view.showInformationMessage("LeoUI Error: " + e);
        }

        if (this.trace) {
            if (this.lastCommandTimer) {
                console.log('lastCommandTimer', utils.getDurationMs(this.lastCommandTimer));
            }
        }

        this.lastCommandTimer = undefined;

        if (value && value.then) {
            void (value as Thenable<unknown>).then((p_result) => {
                void this.launchRefresh();
            });
            return value;
        } else {
            void this.launchRefresh();
            return Promise.resolve(value); // value may be a promise but it will resolve all at once.
        }

    }

    /**
     * Opens quickPick minibuffer pallette to choose from all commands in this file's commander
     * @returns Promise from the command resolving - or resolve with undefined if cancelled
     */
    public async minibuffer(): Promise<unknown> {

        await this.triggerBodySave(true);
        const c = g.app.windowList[this.frameIndex].c;
        const commands: QuickPickItem[] = [];
        const cDict = c.commandsDict;
        for (let key in cDict) {
            const command = cDict[key];
            // Going to get replaced. Don't take those that begin with 'async-'
            const w_name = (command as any).__name__ || '';
            if (!w_name.startsWith('async-')) {
                commands.push({
                    label: key,
                    detail: (command as any).__doc__
                });
            }
        }

        const w_noDetails: QuickPickItem[] = [];
        const stash_button: string[] = [];
        const stash_rclick: string[] = [];
        const stash_command: string[] = [];

        for (const w_com of commands) {
            if (
                !w_com.detail && !(
                    w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_BUTTON_START) ||
                    w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_RCLICK_START) ||
                    w_com.label === Constants.USER_MESSAGES.MINIBUFFER_SCRIPT_BUTTON ||
                    w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_DEL_SCRIPT_BUTTON) ||
                    w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_DEL_BUTTON_START) ||
                    w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_COMMAND_START)
                )
            ) {
                w_noDetails.push(w_com);
            }

            if (w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_BUTTON_START)) {
                stash_button.push(w_com.label);
            }
            if (w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_RCLICK_START)) {
                stash_rclick.push(w_com.label);
            }
            if (w_com.label.startsWith(Constants.USER_MESSAGES.MINIBUFFER_COMMAND_START)) {
                stash_command.push(w_com.label);
            }
        }

        for (const p_command of w_noDetails) {
            if (stash_button.includes(Constants.USER_MESSAGES.MINIBUFFER_BUTTON_START + p_command.label)) {
                p_command.description = Constants.USER_MESSAGES.MINIBUFFER_BUTTON;
            }
            if (stash_rclick.includes(Constants.USER_MESSAGES.MINIBUFFER_RCLICK_START + p_command.label)) {
                p_command.description = Constants.USER_MESSAGES.MINIBUFFER_RCLICK;
            }
            if (stash_command.includes(Constants.USER_MESSAGES.MINIBUFFER_COMMAND_START + p_command.label)) {
                p_command.description = Constants.USER_MESSAGES.MINIBUFFER_COMMAND;
            }
            p_command.description = p_command.description ? p_command.description : Constants.USER_MESSAGES.MINIBUFFER_USER_DEFINED;
        }

        const w_withDetails = commands.filter(p_command => !!p_command.detail);

        // Only sort 'regular' Leo commands, leaving custom commands at the top
        w_withDetails.sort((a, b) => {
            return a.label < b.label ? -1 : (a.label === b.label ? 0 : 1);
        });

        const w_choices: QuickPickItem[] = [];

        if (c.commandHistory.length) {
            w_choices.push({
                label: Constants.USER_MESSAGES.MINIBUFFER_HISTORY_LABEL,
                description: Constants.USER_MESSAGES.MINIBUFFER_HISTORY_DESC

            });
        }

        // Finish minibuffer list
        if (w_noDetails.length) {
            w_choices.push(...w_noDetails);
        }

        // Separator above real commands, if needed...
        if (w_noDetails.length || c.commandHistory.length) {
            w_choices.push({
                label: "", kind: QuickPickItemKind.Separator
            });
        }

        w_choices.push(...w_withDetails);

        const w_picked = await workspace.view.showQuickPick(w_choices, {
            placeHolder: Constants.USER_MESSAGES.MINIBUFFER_PROMPT,
        });

        // To check for numeric line goto 'easter egg'
        const lastInput = workspace.view.getLastQuickPickInput();
        if (lastInput && /^\d+$/.test(lastInput)) {
            // * Was an integer EASTER EGG
            this.setupRefresh(
                Focus.Body,
                {
                    tree: true,
                    body: true,
                    scroll: true, // scroll to line
                    documents: false,
                    buttons: false,
                    states: true
                }
            );
            // not awaited
            c.editCommands.gotoGlobalLine(Number(lastInput)).then((p_gotoResult) => {
                if (p_gotoResult[0]) {
                    void this.launchRefresh();
                }
            }, () => {
                // pass
            });
        }

        // First, check for undo-history list being requested
        if (w_picked && w_picked.label === Constants.USER_MESSAGES.MINIBUFFER_HISTORY_LABEL) {
            return this._showMinibufferHistory(w_choices);
        }
        if (w_picked) {
            return this._doMinibufferCommand(w_picked);
        }

    }


    /**
     * * Opens quickPick minibuffer command pallette from the user's session commands usage history
     * @returns Promise that resolves when the chosen command is placed on the front-end command stack
     */
    private async _showMinibufferHistory(p_choices: QuickPickItem[]): Promise<unknown> {

        // Wait for _isBusyTriggerSave resolve because the full body save may change available commands
        await this.triggerBodySave(true);

        const c = g.app.windowList[this.frameIndex].c;

        if (!c.commandHistory.length) {
            return;
        }
        // Build from list of strings (labels).
        let w_commandList: QuickPickItem[] = [];
        for (const w_command of c.commandHistory) {
            let w_found = false;
            for (const w_pick of p_choices) {
                if (w_pick.label === w_command) {
                    w_commandList.push(w_pick);
                    w_found = true;
                    break;
                }
            }
            if (!w_found) {
                w_commandList.push({
                    label: w_command,
                    description: Constants.USER_MESSAGES.MINIBUFFER_BAD_COMMAND,
                    detail: `No command function for ${w_command}`
                });
            }
        }
        if (!w_commandList.length) {
            return;
        }
        // Add Nav tab special commands
        const w_options: QuickPickOptions = {
            placeHolder: Constants.USER_MESSAGES.MINIBUFFER_PROMPT,
        };
        const w_picked = await workspace.view.showQuickPick(w_commandList, w_options);
        return this._doMinibufferCommand(w_picked);
    }

    /**
     * * Perform chosen minibuffer command
     */
    private _doMinibufferCommand(p_picked?: QuickPickItem): Promise<unknown> {
        if (p_picked && p_picked.label) {
            // Setup refresh
            this.setupRefresh(Focus.NoChange,
                {
                    tree: true,
                    body: true,
                    documents: true,
                    buttons: true,
                    states: true
                }
            );

            this._addToMinibufferHistory(p_picked);
            const c = g.app.windowList[this.frameIndex].c;

            let w_command = p_picked.label; // May be overriden with async commands

            // OVERRIDE with custom async commands where applicable
            if (Constants.MINIBUFFER_OVERRIDDEN_NAMES[p_picked.label]) {
                w_command = Constants.MINIBUFFER_OVERRIDDEN_NAMES[p_picked.label];
            }

            const w_commandResult = c.executeMinibufferCommand(w_command);

            if (w_commandResult && w_commandResult.then) {
                // IS A PROMISE so tack-on the launchRefresh to its '.then' chain. 
                void (w_commandResult as Thenable<unknown>).then((p_result) => {
                    void this.launchRefresh();
                });
            } else {
                void this.launchRefresh();
            }
            // In both cases, return the result, or if a promise: the promise itself, not the result.
            return Promise.resolve(w_commandResult);

        } else {
            // Canceled
            return Promise.resolve(undefined);
        }
    }

    /**
     * Add to the minibuffer history (without duplicating entries)
     */
    private _addToMinibufferHistory(p_command: QuickPickItem): void {
        const c = g.app.windowList[this.frameIndex].c;
        const w_found = c.commandHistory.indexOf(p_command.label);
        // If found, will be removed (and placed on top)
        if (w_found >= 0) {
            c.commandHistory.splice(w_found, 1);
        }
        // Add to top of minibuffer history
        c.commandHistory.unshift(p_command.label);
    }



    /**
     * * Invokes the commander.save() command
     * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
     * @returns Promise that resolves when the save command is done
     */
    public async saveLeoFile(p_fromOutline?: boolean): Promise<unknown> {

        await this.triggerBodySave(true);

        const c = g.app.windowList[this.frameIndex].c;

        await c.save();

        setTimeout(() => {
            this.setupRefresh(
                p_fromOutline ? Focus.Outline : Focus.Body,
                {
                    tree: true,
                    states: true,
                    documents: true
                }
            );
            void this.launchRefresh();
        });

        return Promise.resolve();
    }


    /**
     * * Switches Leo document directly by index number.
     */
    public async selectOpenedLeoDocument(index: number): Promise<unknown> {

        if (this.frameIndex === index) {
            // already selected
            return Promise.resolve();
        }

        await this.triggerBodySave(true);
        this.frameIndex = index;
        // Like we just opened or made a new file
        if (g.app.windowList.length) {
            this.setupRefresh(
                this.finalFocus,
                {
                    tree: true,
                    body: true,
                    documents: true,
                    buttons: true,
                    states: true,
                    goto: true

                }
            );
            const result = this.launchRefresh();
            this.loadSearchSettings();
            return result;
        } else {
            void this.launchRefresh(); // dont wait for it
            console.error('Select Opened Leo File Error');
            return Promise.reject('Select Opened Leo File Error');
        }

    }

    private _showHeadlineInputBox(p_options: any): Thenable<string> {

        // TODO : implement headline input box, inserts a node, sets its label editable until enter or escape and returns the new headline string
        console.log('TODO ! _showHeadlineInputBox called with options:', p_options);
        return Promise.resolve('newHeadline');
    }

    /**
     * * Asks for a headline label to be entered and creates (inserts) a new node under the current, or specified, node
     * @param p_node specified under which node to insert, or leave undefined to use whichever is currently selected
     * @param p_fromOutline Signifies that the focus was, and should be brought back to, the outline
     * @param p_asChild Insert as child instead of as sibling
     * @returns Thenable that resolves when done
     */
    public async insertNode(p_node: Position | undefined, p_fromOutline: boolean, p_asChild: boolean): Promise<unknown> {

        let w_finalFocus: Focus = p_fromOutline ? Focus.Outline : Focus.Body; // Use w_fromOutline for where we intend to leave focus when done with the insert

        await this.triggerBodySave(true);

        // * if node has child and is expanded: turn p_asChild to true!
        const w_headlineInputOptions: any = {
            ignoreFocusOut: false,
            value: Constants.USER_MESSAGES.DEFAULT_HEADLINE,
            valueSelection: undefined,
            prompt: p_asChild ? Constants.USER_MESSAGES.PROMPT_INSERT_CHILD : Constants.USER_MESSAGES.PROMPT_INSERT_NODE
        };

        const p_newHeadline = await this._showHeadlineInputBox(w_headlineInputOptions);

        this.lastCommandTimer = process.hrtime();
        if (this.commandTimer === undefined) {
            this.commandTimer = this.lastCommandTimer;
        }
        this.lastCommandRefreshTimer = this.lastCommandTimer;
        if (this.commandRefreshTimer === undefined) {
            this.commandRefreshTimer = this.lastCommandTimer;
        }

        const c = g.app.windowList[this.frameIndex].c;

        let value: any = undefined;
        const p = p_node ? p_node : c.p;

        const w_refreshType: ReqRefresh = { documents: true, buttons: true, states: true };

        w_refreshType.tree = true;
        w_refreshType.body = true;

        if (p.__eq__(c.p)) {
            w_refreshType.body = true;
            this.setupRefresh(w_finalFocus, w_refreshType);
            this._insertAndSetHeadline(p_newHeadline, p_asChild); // no need for re-selection
        } else {
            const old_p = c.p;  // c.p is old already selected
            c.selectPosition(p); // p is now the new one to be operated on
            this._insertAndSetHeadline(p_newHeadline, p_asChild);
            // Only if 'keep' old position was needed (specified with a p_node parameter), and old_p still exists
            if (!!p_node && c.positionExists(old_p)) {
                // no need to refresh body
                this.setupRefresh(w_finalFocus, w_refreshType);
                c.selectPosition(old_p);
            } else {
                old_p._childIndex = old_p._childIndex + 1;
                if (!!p_node && c.positionExists(old_p)) {
                    // no need to refresh body
                    this.setupRefresh(w_finalFocus, w_refreshType);
                    c.selectPosition(old_p);
                } else {
                    w_refreshType.body = true;
                    this.setupRefresh(w_finalFocus, w_refreshType);
                }
            }
        }
        if (this.trace) {
            if (this.lastCommandTimer) {
                console.log('lastCommandTimer', utils.getDurationMs(this.lastCommandTimer));
            }
        }
        this.lastCommandTimer = undefined;

        void this.launchRefresh();

        return value;

    }

    /**
     * * Perform insert and rename commands
     */
    private _insertAndSetHeadline(p_name?: string, p_asChild?: boolean): any {
        const LEOCMD = Constants.LEO_COMMANDS;
        const w_command = p_asChild ? LEOCMD.INSERT_CHILD_PNODE : LEOCMD.INSERT_PNODE;
        const c = g.app.windowList[this.frameIndex].c;
        const u = c.undoer;
        let value: any = c.doCommandByName(w_command);
        if (!p_name) {
            return value;
        }
        if (g.doHook("headkey1", { c: c, p: c.p, ch: '\n', changed: true })) {
            return;  // The hook claims to have handled the event.
        }
        const undoData = u.beforeChangeHeadline(c.p);
        c.setHeadString(c.p, p_name);  // Set v.h *after* calling the undoer's before method.
        if (!c.changed) {
            c.setChanged();
        }
        u.afterChangeHeadline(c.p, 'Edit Headline', undoData);
        g.doHook("headkey2", { c: c, p: c.p, ch: '\n', changed: true });
        return value;
    }


    /**
     * * Cycle opened documents
     */
    public async tabCycle(): Promise<unknown> {
        await this.triggerBodySave(true);

        let w_chosenIndex;
        const w_files = g.app.windowList;

        if (w_files && w_files.length && w_files.length > 1) {
            if (this.frameIndex === w_files.length - 1) {
                w_chosenIndex = 0;
            } else {
                w_chosenIndex = this.frameIndex + 1;
            }
        } else {
            // "Only one, or no opened documents"
            return undefined;
        }

        this.finalFocus = Focus.Outline;
        return this.selectOpenedLeoDocument(w_chosenIndex);
    }

    public async cutText(): Promise<unknown> {
        // TODO : This is for body pane text only!
        workspace.view.showToast('Cut Text: TODO Implement');
        return Promise.resolve();
    }
    public async copyText(): Promise<unknown> {
        // TODO : This is for body pane text only!
        workspace.view.showToast('Copy Text: TODO Implement');
        return Promise.resolve();
    }
    public async pasteText(): Promise<unknown> {
        // TODO : This is for body pane text only!
        workspace.view.showToast('Paste Text: TODO Implement');
        return Promise.resolve();
    }

    /**
    * * Creates a new Leo file
    * @returns the promise started after it's done creating the frame and commander
    */
    public async newLeoFile(): Promise<unknown> {
        await this.triggerBodySave(true);

        // this.showBodyIfClosed = true;
        // this.showOutlineIfClosed = true;

        this.setupRefresh(Focus.NoChange, {
            tree: true,
            body: true,
            goto: true,
            documents: true,
            buttons: true,
            states: true
        });

        if (!this.leoStates.fileOpenedReady) {
            if (g.app.loadManager) {
                g.app.numberOfUntitledWindows += 1; // To create unique names.
                await g.app.loadManager.openEmptyLeoFile(this);
            }
        } else {
            await utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, true);
            await this.triggerBodySave(true);
            const c = g.app.windowList[this.frameIndex].c;
            await c.new(this);
            setTimeout(() => {
                void utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, false);
            }, 60);
        }
        this.loadSearchSettings();
        return this.launchRefresh();
    }


    public async closeLeoFile(index?: number): Promise<unknown> {
        // If no index, find current
        if (index === undefined) {
            index = this.frameIndex;
        }

        if (index < 0 || index >= g.app.windowList.length) {
            return Promise.reject('closeLeoDocument: index out of range');
        }
        await this.triggerBodySave(true);

        const c = g.app.windowList[index].c;
        const w_closed = await c.close();

        this.setupRefresh(Focus.Body, {
            tree: true,
            body: true,
            goto: true,
            documents: true,
            buttons: true,
            states: true
        });

        void this.launchRefresh(); // start to refresh first
        return this.loadSearchSettings();

    }


    /**
     * * Sets up the call to the 'open-outline' command and its possible file url parameter.
     * @param p_leoFileUri optional uri for specifying a file, if missing, a dialog will open
     * @returns A promise that resolves when done trying to open the file
     */
    public async openLeoFile(p_uri?: Uri): Promise<unknown> {

        if (p_uri) {
            if (!!p_uri.fsPath && p_uri.fsPath.trim()) {
                // valid: pass!
            } else {
                p_uri = undefined; // clear uri
            }
        }

        if (!this.leoStates.fileOpenedReady) {
            // override with given argument
            let fileName: string;

            // make sure it's a real uri because vscode may send selected
            // node from other tree that has this command in title

            if (p_uri && p_uri?.fsPath?.trim() && g.app.loadManager) {
                fileName = p_uri.fsPath;
            } else {
                fileName = await this.runOpenFileDialog(
                    undefined,
                    "Open",
                    [
                        ["Leo files", "*.leojs *.leo *.db"],
                        ["Python files", "*.py"],
                        ["All files", "*"]
                    ]
                );
            }
            if (fileName && g.app.loadManager) {
                await utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, true);
                const commander = await g.app.loadManager.loadLocalFile(fileName, this);
                if (!commander) {
                    void workspace.view.showInformationMessage('can not open:' + '"' + fileName + '"');
                    return Promise.resolve();
                }
                // this.showBodyIfClosed = true;
                // this.showOutlineIfClosed = true;
                this.setupRefresh(this.finalFocus, {
                    tree: true,
                    body: true,
                    goto: true,
                    states: true,
                    documents: true,
                    buttons: true
                });
                void this.launchRefresh();
                setTimeout(() => {
                    void utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, false);
                }, 60);
            } else {
                return Promise.resolve();
            }
        } else {
            await this.triggerBodySave(true);
            const c = g.app.windowList[this.frameIndex].c;
            await utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, true);
            await c.open_outline(p_uri);
            // this.showBodyIfClosed = true;
            // this.showOutlineIfClosed = true;
            this.setupRefresh(this.finalFocus, {
                tree: true,
                body: true,
                goto: true,
                states: true,
                documents: true,
                buttons: true
            });
            setTimeout(() => {
                void utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, false);
            }, 60);
            void this.launchRefresh();
        }
        return this.loadSearchSettings();
    }


    /**
     * * Asks for file name and path, then saves the Leo file
     * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
     * @returns a promise from saving the file results.
     */
    public async saveAsLeoFile(p_fromOutline?: boolean): Promise<unknown> {
        await this.triggerBodySave(true);

        const c = g.app.windowList[this.frameIndex].c;

        this.setupRefresh(
            p_fromOutline ? Focus.Outline : Focus.Body,
            {
                tree: true,
                states: true,
                documents: true
            }
        );

        await c.saveAs();
        void this.launchRefresh();
        return;
    }

    /**
     * * Asks for .leojs file name and path, then saves the JSON Leo file
     * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
     * @returns a promise from saving the file results.
     */
    public async saveAsLeoJsFile(p_fromOutline?: boolean): Promise<unknown> {
        await this.triggerBodySave(true);

        const c = g.app.windowList[this.frameIndex].c;

        this.setupRefresh(
            p_fromOutline ? Focus.Outline : Focus.Body,
            {
                tree: true,
                states: true,
                documents: true
            }
        );

        // ! THIS WOULD DO A 'SAVE TO' INSTEAD OF 'SAVE AS' !
        // await c.save_as_leojs();

        // * DO THIS INSTEAD !
        let fileName = await g.app.gui.runSaveFileDialog(
            c,
            'Save As JSON (.leojs)',
            [['Leo JSON files', '*.leojs']],
        );
        if (!fileName) {
            return;
        }
        if (!fileName.endsWith('.leojs')) {
            fileName = `${fileName}.leojs`;
        }
        await c.save(fileName);

        void this.launchRefresh();
        return;
    }


    /**
     * * Show switch document 'QuickPick' dialog and switch file if selection is made, or just return if no files are opened.
     * @returns A promise that resolves with a textEditor of the selected node's body from the newly selected document
     */
    public async switchLeoFile(): Promise<unknown> {

        await this.triggerBodySave(true);

        const w_entries: ChooseDocumentItem[] = []; // Entries to offer as choices.
        let w_index: number = 0;
        const w_files: LeoDocument[] = g.app.windowList.map((p_frame) => {
            const s = p_frame.c.fileName();
            const w_filename = s ? utils.getFileFromPath(s) : Constants.UNTITLED_FILE_NAME;
            return {
                name: w_filename,
                index: w_index++,
                changed: p_frame.c.isChanged(),
                selected: g.app.windowList[this.frameIndex] === p_frame,
            };
        });
        w_index = 0; // reset w_index
        let w_chosenDocument: ChooseDocumentItem | undefined;
        if (w_files && w_files.length) {
            w_files.forEach(function (p_filePath: LeoDocument) {
                w_entries.push({
                    label: w_index.toString(),
                    description: p_filePath.name
                        ? p_filePath.name
                        : Constants.UNTITLED_FILE_NAME,
                    value: w_index,
                });
                w_index++;
            });
            const w_pickOptions: QuickPickOptions = {
                placeHolder: Constants.USER_MESSAGES.CHOOSE_OPENED_FILE,
            };
            w_chosenDocument = await workspace.view.showQuickPick(w_entries, w_pickOptions) as ChooseDocumentItem | undefined;
        } else {
            // "No opened documents"
            return Promise.resolve(undefined);
        }
        if (w_chosenDocument) {
            return Promise.resolve(this.selectOpenedLeoDocument(w_chosenDocument.value));
        } else {
            // Canceled
            return Promise.resolve(undefined);
        }

    }

    /**
     * Show info window about requiring leoID to start
     * and a button to perform the 'set leoID' command.
     */
    public showLeoIDMessage(): void {
        void workspace.view.showInformationMessage(
            Constants.USER_MESSAGES.SET_LEO_ID_MESSAGE,
            { modal: true, detail: Constants.USER_MESSAGES.GET_LEO_ID_PROMPT },
            Constants.USER_MESSAGES.ENTER_LEO_ID
        ).then(p_chosenButton => {
            if (p_chosenButton === Constants.USER_MESSAGES.ENTER_LEO_ID) {
                void this.setLeoIDCommand();
            }
        });
    }

    /**
     * * Command to get the LeoID from dialog, save it to user settings.
     * Start leojs if the ID is valid, and not already started.
     */
    public setLeoIDCommand(): Thenable<unknown> {
        return g.IDDialog().then((p_id) => {
            p_id = p_id.trim();
            p_id = g.app.cleanLeoID(p_id, '');
            if (p_id && p_id.length >= 3 && utils.isAlphaNumeric(p_id)) {
                // valid id: set in config settings
                return this.setIdSetting(p_id);
            } else {
                // Canceled or invalid: (re)warn user.
                this.showLeoIDMessage();
            }
        });
    }

    /**
     * * Returns the leoID from the leojs settings
     */
    public getIdFromSetting(): string {
        return this.config.leoID;
    }

    /**
     * * Sets the leoID setting for immediate use, and in next activation
     */
    public setIdSetting(p_leoID: string): Promise<unknown> {
        const w_changes: ConfigSetting[] = [{
            code: "leoID",
            value: p_leoID
        }];
        if (p_leoID.trim().length >= 3 && utils.isAlphaNumeric(p_leoID)) {
            // OK not empty
            if (g.app.leoID !== p_leoID) {
                g.app.leoID = p_leoID;
                void g.app.setIDFile();
                g.blue('leoID=' + p_leoID);
            }

            if (g.app.nodeIndices) {
                g.app.nodeIndices.userId = p_leoID;
            }
            // If LeoJS had finish its startup without valid LeoID, set ready flags!
            if (!this.leoStates.leoReady && this.leoStates.leojsStartupDone && this.leoStates.leoIdUnset) {
                if (g.app.leoID && g.app.leoID !== 'None') {
                    this.createLogPane();
                    this.leoStates.leoIdUnset = false;
                    this.leoStates.leoReady = true;
                    if (g.app.windowList.length) {

                        this.leoStates.fileOpenedReady = true;
                        this.fullRefresh();
                    }
                } else {
                    void workspace.view.showInformationMessage("'None' is a reserved LeoID, please choose another one.");
                }
            }
        } else if (!p_leoID.trim()) {
            // empty, go back to default
            if (g.app.nodeIndices && g.app.nodeIndices.defaultId) {
                g.app.leoID = g.app.nodeIndices.defaultId;
                g.app.nodeIndices.userId = g.app.nodeIndices.defaultId;
            }
        }

        if (this.config.leoID !== p_leoID) {
            return this.config.setLeojsSettings(w_changes);
        }
        return Promise.resolve();
    }

    public widget_name(w: any): string {
        let name: string;
        if (!w) {
            name = '<no widget>';
        } else if (w['getName']) {
            name = w.getName();
        } else if (w['objectName']) {
            name = w.objectName();
        } else if (w['_name']) {
            name = w._name;
        } else if (w['name']) {
            name = w.name;
        } else {
            name = w.toString();
        }
        return name;
    }

    public set_focus(commander: Commands, widget: any): void {
        this.focusWidget = widget;
        const w_widgetName = this.widget_name(widget);
        // TODO : implement focus change in web UI
        console.log(`Focus set to widget: ${w_widgetName}`);
    }

    public get_focus(c?: Commands): StringTextWrapper {
        return this.focusWidget!;
    }

    public get1Arg(
        options: {
            title: string;
            value: string;
            prompt: string;
            placeHolder?: string;
        },
        tabList?: string[]
    ): Thenable<string | undefined> {
        if (tabList) {
            const itemList: QuickPickItem[] = tabList.map(
                (entry) => { return { label: entry }; }
            );
            return workspace.view.showQuickPick(itemList, options).then(
                (p_picked) => {
                    if (p_picked && typeof p_picked !== 'string' && p_picked.label) {
                        return p_picked.label;
                    } else if (p_picked && typeof p_picked === 'string') {
                        return p_picked;
                    }
                    return undefined;
                }
            );
        } else {
            return workspace.view.showInputDialog(options);
        }
    }

    /**
     * * Gets a single character input from the user, automatically accepting as soon as a character is entered
     * @param options Options for the input box
     * @returns A promise that resolves to the entered character or undefined if cancelled
     */
    public get1Char(
        options?: {
            title: string;
            prompt: string;
            placeHolder: string;
        },
    ): Thenable<string | undefined> {
        if (!options) {
            options = {
                title: 'Enter a single character',
                prompt: 'Please enter a single character:',
                placeHolder: ''
            };
        }
        return workspace.view.showSingleCharInputDialog(options);
    }

    public runAboutLeoDialog(
        c: Commands | undefined,
        version: string,
        theCopyright: string,
        url: string,
        email: string
    ): Thenable<unknown> {
        return workspace.view.showInformationMessage(
            version,
            {
                modal: true,
                detail: theCopyright
            });
    }

    public runAskOkDialog(
        c: Commands | undefined,
        title: string,
        message: string,
        text = "Ok"
    ): Thenable<unknown> {
        return workspace.view.showInformationMessage(
            title,
            {
                modal: true,
                detail: message
            });
    }

    public runAskYesNoDialog(
        c: Commands | undefined,
        title: string,
        message: string,
        yes_all = false,
        no_all = false
    ): Thenable<string> {
        const w_choices = [
            Constants.USER_MESSAGES.YES,
            Constants.USER_MESSAGES.NO
            // Note: Already shows a 'cancel' !
        ];
        if (yes_all) {
            w_choices.push(Constants.USER_MESSAGES.YES_ALL,);
        }
        if (no_all) {
            w_choices.push(Constants.USER_MESSAGES.NO_ALL,);
        }

        return workspace.view
            .showInformationMessage(
                title,
                {
                    modal: true,
                    detail: message
                },
                ...w_choices
            )
            .then((answer) => {
                if (answer === Constants.USER_MESSAGES.YES) {
                    return Constants.USER_MESSAGES.YES.toLowerCase();
                } else if (answer === Constants.USER_MESSAGES.NO) {
                    return Constants.USER_MESSAGES.NO.toLowerCase();
                } else if (answer === Constants.USER_MESSAGES.YES_ALL) {
                    return "yes-all";
                } else { // (answer === Constants.USER_MESSAGES.NO_ALL)
                    return "no-all";
                }
            });
    }

    public runAskYesNoCancelDialog(
        c: Commands | undefined,
        title: string,
        message: string,
        yesMessage = Constants.USER_MESSAGES.YES,
        noMessage = Constants.USER_MESSAGES.NO,
        yesToAllMessage = "",
        defaultButton = Constants.USER_MESSAGES.YES,
        cancelMessage = ""
    ): Thenable<string> {
        const w_choices = [
            yesMessage,
            noMessage,
            // Note: Already shows a 'cancel' !
        ];
        if (yesToAllMessage) {
            w_choices.push(yesToAllMessage);
        }
        if (cancelMessage) {
            w_choices.push(cancelMessage);
        }

        return workspace.view
            .showInformationMessage(
                title,
                {
                    modal: true,
                    detail: message
                },
                ...w_choices
                // Note: Already shows a 'cancel' !
            )
            .then((answer) => {
                if (answer === yesMessage) {
                    return 'yes';
                } else if (answer === noMessage) {
                    return 'no';
                } else if (answer === yesToAllMessage) {
                    return 'yes-to-all';
                } else if (answer === cancelMessage) {
                    return 'cancel';
                } else {
                    return 'cancel'; // undefined will yield this 'cancel'.
                }
            });
    }

    public runOpenFileDialog(
        c: Commands | undefined,
        title: string,
        filetypes: [string, string][],
        startpath?: string,
        startUri?: Uri
    ): Thenable<string> {
        if (startpath && !startUri) {
            startUri = new Uri(startpath);
        }
        // convert to { [name: string]: string[] } typing
        const types: { [name: string]: string[] } = utils.convertLeoFiletypes(filetypes);
        return workspace.view.showOpenDialog(
            {
                title: title,
                canSelectMany: false,
                filters: types,
                defaultUri: startUri
            }
        ).then((p_uris) => {
            const names: string[] = [];
            if (p_uris && p_uris.length) {
                p_uris.forEach(w_uri => {
                    names.push(w_uri.fsPath);
                });
            }
            let fileName = g.os_path_fix_drive(names.length ? names[0] : "");
            fileName = g.os_path_normslashes(fileName);
            return fileName;
        });
    }

    public runOpenFilesDialog(
        c: Commands | undefined,
        title: string,
        filetypes: [string, string][],
        startpath?: string
    ): Thenable<string[]> {
        // convert to { [name: string]: string[] } typing
        const types: { [name: string]: string[] } = utils.convertLeoFiletypes(filetypes);
        return workspace.view.showOpenDialog(
            {
                title: title,
                canSelectMany: true,
                filters: types
            }
        ).then((p_uris) => {
            const names: string[] = [];
            if (p_uris && p_uris.length) {
                p_uris.forEach(w_uri => {
                    names.push(w_uri.fsPath);
                });
            }
            return names.map((p_name) => {
                let fileName = g.os_path_fix_drive(p_name);
                fileName = g.os_path_normslashes(fileName);
                return fileName;
            });
        });
    }

    public runSaveFileDialog(
        c: Commands | undefined,
        title: string,
        filetypes: [string, string][],
    ): Thenable<string> {
        // convert to { [name: string]: string[] } typing
        const types: { [name: string]: string[] } = utils.convertLeoFiletypes(filetypes);
        return workspace.view.showSaveDialog(
            {
                title: title,
                filters: types
            }
        ).then((p_uri) => {
            if (p_uri) {
                let fileName = g.os_path_fix_drive(p_uri.fsPath);
                fileName = g.os_path_normslashes(fileName);
                return fileName;
            } else {
                return "";
            }
        });
    }

}