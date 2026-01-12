import { NullGui } from "./core/leoGui";
import * as g from './core/leoGlobals';
import { Constants } from "./constants";
import { LeoStates } from "./leoStates";
import { IdleTime } from "./core/idle_time";
import * as utils from "./utils";
import { Uri, workspace } from "./workspace";
import { Commands } from "./core/leoCommands";
import { CommandOptions, ConfigSetting, Focus, LeoPackageStates, QuickPickItem, QuickPickItemKind, QuickPickOptions, ReqRefresh, RevealType } from "./types";
import { StringTextWrapper } from "./core/leoFrame";
import { Position } from "./core/leoNodes";
import { debounce, DebouncedFunc } from "lodash";
import { Config } from "./config";

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
        // TODO : implement body selection saving


        // save the cursor selection, supports both body and detached bodies
        this._bodySaveSelection();
    }

    /**
     * * Sets new body text on leo's side.
     * @returns a promise that resolves when the complete saving process is finished
     */
    private _bodySaveDocument(): Thenable<boolean> {
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
        return Promise.resolve();
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

        const c = g.app.windowList[this.frameIndex].c;

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
        this.leoStates.leoOpenedFileName = c.fileName();

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

        console.log('in _setupNoOpenedLeoDocument');

        this.leoStates.fileOpenedReady = false;

    }

    /**
     * * A Leo file was opened: setup UI accordingly.
     */
    private _setupOpenedLeoDocument(): void {
        console.log('in _setupOpenedLeoDocument');
        const c = g.app.windowList[this.frameIndex].c;
        this.leoStates.leoOpenedFileName = c.fileName();
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