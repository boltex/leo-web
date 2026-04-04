//@+leo-ver=5-thin
//@+node:felix.20260321200113.1: * @file src/leo-ui.ts
//@+<< imports >>
//@+node:felix.20260322232646.1: ** << imports >>

import { NullGui } from "./core/leoGui";
import * as g from './core/leoGlobals';
import { Constants } from "./constants";
import { LeoStates } from "./leo-states";
import { IdleTime } from "./core/idle_time";
import * as utils from "./utils";
import { Uri, workspace } from "./workspace";
import { Commands } from "./core/leoCommands";
import {
    BodySelectionInfo,
    ChooseDocumentItem,
    CommandOptions,
    ConfigSetting,
    Focus,
    LeoDocument,
    LeoGotoNavKey,
    LeoGotoNode,
    LeoGuiFindTabManagerSettings,
    LeoPackageStates,
    LeoSearchSettings,
    QuickPickItem,
    QuickPickItemKind,
    QuickPickOptions,
    ReqRefresh,
    RevealType,
    UnlType
} from "./types";
import { StringTextWrapper } from "./core/leoFrame";
import { Position } from "./core/leoNodes";
import { debounce, DebouncedFunc } from "lodash";
import { Config } from "./config";
import { Selection } from "./cursor-position";
import { makeAllBindings } from "./command-bindings";
import { menuData, bodyPaneContextMenuData, outlinePaneContextMenuData } from "./menu";
import { StringFindTabManager } from "./core/findTabManager";
import { LeoFind } from "./core/leoFind";
import { QuickSearchController } from "./core/quicksearch";
import { HeadlineFinishedResult } from "./outline-manager";
//@-<< imports >>
//@+others
//@+node:felix.20260322232711.1: ** Leo UI
/**
 * Implements LeoGUI instanced as g.app.gui at startup.
 * Uses workspace members such as workspace.controller, workspace.body, workspace.outline, etc. to manipulate the UI and react to user interactions. 
 */
export class LeoUI extends NullGui {

    public leoStates: LeoStates;
    public trace: boolean = false; //true;

    // * Log Pane
    protected _leoLogPane: boolean = false;

    // * Timers
    public inEditHeadline: number = 0; // (incrementable in case of nested edits) Flag to indicate if we're currently editing a headline, to avoid triggering refresh.
    public refreshTimer: [number, number] | undefined; // until the selected node is found - even if already started refresh
    public lastRefreshTimer: [number, number] | undefined; // until the selected node is found - refreshed even if not found
    public commandRefreshTimer: [number, number] | undefined; // until the selected node is found -  keep if starting a new command already pending
    public lastCommandRefreshTimer: [number, number] | undefined; // until the selected node is found - refreshed if starting a new command
    public commandTimer: [number, number] | undefined; // until the command done - keep if starting a new one already pending
    public lastCommandTimer: [number, number] | undefined; // until the command done - refreshed if starting a new one

    // * Configuration Settings Service
    public config: Config;

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

    // * Find panel
    private _findNeedsFocus: number = 0; // 0 none, 1 find, 2 nav
    private _lastSettingsUsed: LeoSearchSettings | undefined; // Last settings loaded / saved for current document
    public findFocusTree = false;
    public findHeadlineRange: [number, number] = [0, 0];
    public findHeadlinePosition: Position | undefined;

    // * Selection & scroll
    private _selectionDirty: boolean = false; // Flag set when cursor selection is changed
    private _selectionGnx: string = ''; // Packaged into 'BodySelectionInfo' structures, sent to Leo
    private _selection: Selection | undefined; // also packaged into 'BodySelectionInfo'
    private _scrollDirty: boolean = false; // Flag set when cursor selection is changed
    private _scrollGnx: string = '';
    private _scroll: number | undefined;

    // * Body pane
    private _editorTouched: boolean = false; // Signifies that the body editor DOM element has been modified by the user since last save
    private _bodyStatesTimer: ReturnType<typeof setTimeout> | undefined;

    // * Debounced method used to get states for UI display flags (commands such as undo, redo, save, ...)
    public getStates: (() => void);

    // * Debounced method for refreshing the UI
    public launchRefresh: DebouncedFunc<() => Promise<unknown>>;

    constructor(guiName = 'browserGui') {
        super(guiName);
        this.isNullGui = false;

        this.idleTimeClass = IdleTime;

        this.leoStates = new LeoStates(this);

        this.config = new Config();
        this.config.buildFromSavedSettings();

        // If app.leoId is set, then save it in the config.
        if (!this.config.leoID && g.app.leoID && g.app.leoID !== 'None') {
            const w_changes: ConfigSetting[] = [{
                code: "leoID",
                value: g.app.leoID
            }];
            this.config.setLeoWebSettings(w_changes);
        }

        this.getStates = debounce(
            this._triggerGetStates,
            Constants.STATES_DEBOUNCE_DELAY
        );

        this.launchRefresh = debounce(
            this._launchRefresh,
            Constants.REFRESH_DEBOUNCE_DELAY
        );

    }

    //@+others
    //@+node:felix.20260323003644.1: *3* onBeforeUnload Exit Handler
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
            g.app.saveSession(); // Save the latest state of the workspace.

            // Consider all commanders closed now, to avoid triggering the "this document is already opened".
            for (const c of g.app.commanders()) {
                g.app.forgetOpenFile(c.fileName());
            }

            g.app.global_cacher.commit(); // Save the latest state of the cache.
            return;
        }

        // If reached this point, some documents are dirty: ask for confirmation
        event.preventDefault();
        event.returnValue = '';
    };
    //@+node:felix.20260323003355.1: *3* runMainLoop
    /**
     * * Set all remaining local objects, set ready flag(s) and refresh all panels
     */
    public runMainLoop(): void {

        if (g.app.windowList[this.frameIndex]) {
            g.app.windowList[this.frameIndex].startupWindow = true;
        }

        // * React to change in selection, cursor position and scroll position
        workspace.body.setChangeTextEditorSelectionCallback((event) =>
            this._onChangeEditorSelection(event)
        );
        workspace.body.setChangeTextEditorScrollCallback((event) =>
            this._onChangeEditorScroll(event)
        );

        workspace.body.setEditorTouchedCallback(() =>
            this._onDocumentChanged()
        );

        workspace.body.setBodyFocusOutCallback(() => {
            this.triggerBodySave(true);
        });

        workspace.body.setCtrlClickLinkCallback((url, type) => {
            // If url is empty, it means the click was on a non-link element, so try the 'FIND_DEF' command, else handle the unl.
            if (!url) {
                workspace.controller.doCommand(Constants.COMMANDS.FIND_DEF);
                return;
            }
            if (type === 'unl-gnxonly') {
                url = "";
            }
            this.handleUnl({ unl: url });
        });

        workspace.outline.setEditFinishedCallback(this._finishEditHeadline.bind(this));

        window.addEventListener('beforeunload', this.onBeforeUnload);

        // Firefox or other may not support that.
        try {
            navigator.clipboard.addEventListener("clipboardchange", (event) => {
                navigator.clipboard.readText().then((s) => {
                    this.clipboardContents = s;
                }).catch((e) => {
                    console.error('Error reading clipboard contents: ', e);
                });
            });
        } catch (e) {
            console.warn('Clipboard API not available, clipboard change events will not be detected.', e);
        }

        // * Leo Find Panel
        workspace.logPane.setPostMessageCallback(this._resolveFindPaneMessage.bind(this));

        // TODO: other startup tasks... (if any)

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
        this.leoStates.leoWebStartupDone = true;
        this.fullRefresh();
    }
    //@+node:felix.20260323003341.1: *3* makeAllBindings
    /**
     * Make all key and commands bindings
     */
    public makeAllBindings(): void {
        makeAllBindings(this, workspace.controller);
    }
    //@+node:felix.20260323004032.1: *3* GUI Commands
    //@+others
    //@+node:felix.20260323003609.1: *4* Themes
    public lightTheme(): void {
        workspace.layout.applyTheme('light');
    }
    public darkTheme(): void {
        workspace.layout.applyTheme('dark');
    }
    //@+node:felix.20260323003605.1: *4* Layout
    public applyLayout(orientation: string): void {
        workspace.layout.applyLayout(orientation);
    }
    public equalSizedPanes(): void {
        workspace.layout.equalSizedPanes();
    }
    //@+node:felix.20260323003601.1: *4* Menu
    public toggleMenu(): void {
        workspace.menu.toggleMenu();
    }
    //@+node:felix.20260323003442.1: *4* showDocumentation
    public showDocumentation(): void {
        // Open Leo Web documentation URL in new browser tab (for now, github repo)
        const docUrl = 'https://github.com/boltex/leo-web/';
        window.open(docUrl, '_blank');
    }
    //@+node:felix.20260323003430.1: *4* todo
    public todo(): void {
        workspace.dialog.showInformationMessage("TODO: Not yet implemented.");
    }
    //@+node:felix.20260323003423.1: *4* chooseNewWorkspace
    public async chooseNewWorkspace(): Promise<boolean> {
        // Perform the 'quit' command to force asking to save unsaved changes
        // Then clear the workspace from db and force-refresh the page to restart leoWeb
        // This will have the effect of closing all opened documents and then asking for a new workspace
        for (const c of g.app.commanders()) {
            const closed = await g.app.closeLeoWindow(c.frame)
            const allow = c.exists && closed;
            if (!allow) {
                return Promise.resolve(false);
            }
        }

        workspace.clearWorkspace().catch((e) => {
            console.error('Error clearing workspace:', e);
        });

        // Clear recent files, DB cache and sessions from local storage to avoid auto-reopening them on reload
        utils.safeLocalStorageSet('leoRecentFiles', undefined);
        utils.safeLocalStorageSet('leoSession', undefined);
        utils.safeLocalStorageSet('leoCache', undefined);

        // Reload the page to restart leoWeb
        window.location.reload();

        return Promise.resolve(true);
    }
    //@+node:felix.20260323003332.1: *4* showSettings
    public showSettings(): Promise<unknown> {
        // TODO : Remove? or implement a settings/welcome UI ?
        console.log('TODO ! showSettings called to show settings UI');
        return Promise.resolve();
    }
    //@+node:felix.20260323003252.1: *4* put_help
    public put_help(c: Commands, s: string, short_title: string): void {
        s = g.dedent(s.trimEnd());
        s = workspace.showdownConverter.makeHtml(s);
        utils.showHtmlInNewTab(s, short_title);
    }
    //@-others
    //@+node:felix.20260323003057.1: *3* handleUnl
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
        this.triggerBodySave();
        try {

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

        }
        catch (e) {
            console.log('FAILED HANDLE URL! ', p_arg);
        }
    }
    //@+node:felix.20260323002920.1: *3* Log Pane
    /**
     * * Bind the log output to the log pane of the web UI
     */
    public createLogPane(): void {
        if (!this._leoLogPane) {
            // * Log pane instantiation
            this._leoLogPane = true;
            workspace.logPane.addToLogPane('', true); // Clear log pane
            if (g.logBuffer.length) {
                const buffer = g.logBuffer;
                while (buffer.length > 0) {
                    // Pop the bottom one and append it
                    g.es(buffer.shift()!);
                }
            }
        }
    }

    public override addLogPaneEntry(p_message: string): void {
        if (this._leoLogPane) {
            workspace.logPane.addToLogPane(p_message);
        } else {
            g.logBuffer.push(p_message);
        }
    }

    public showLogPane(p_focus?: boolean): void {
        workspace.logPane.showTab('log');
    }
    //@+node:felix.20260323002847.1: *3* Body States Change Handlers
    /**
     * * Handles detection of the active editor's selection change or cursor position
     * @param p_event a change event containing the active editor's selection, if any.
     */
    private _onChangeEditorSelection(p_event: Selection): void {
        if (g.app.windowList.length === 0) {
            return; // No file opened: exit 
        }
        const c = g.app.windowList[this.frameIndex].c;
        if (p_event) {
            this._selectionDirty = true;
            this._selection = p_event;
            this._selectionGnx = c.p.gnx;
        }
    }

    /**
     * * Handles detection of the active editor's scroll position changes
     * @param p_event a change event containing the active editor's visible range, if any.
     */
    private _onChangeEditorScroll(p_event: number): void {
        const c = g.app.windowList[this.frameIndex].c;
        if (p_event != null) {
            this._scrollDirty = true;
            this._scroll = p_event;
            this._scrollGnx = c.p.gnx;
        }
    }

    private _onDocumentChanged(): void {

        const c = g.app.windowList[this.frameIndex].c;
        this._editorTouched = true; // To make sure to transfer content to Leo even if all undone

        const w_bodyText = workspace.body.getBody();
        const w_hasBody = !!w_bodyText.length;
        const w_iconChanged = (!c.p.isDirty() || (!!c.p.bodyString().length === !w_hasBody))
        if (!this.leoStates.leoChanged || w_iconChanged) {
            // Document pane icon needs refresh (changed) and/or outline icon changed
            this._bodySaveDocument()

            if (w_iconChanged) {
                this.findFocusTree = false;
                // NOT incrementing this.treeID to keep ids intact
                // NoReveal since we're keeping the same id.
                this._refreshOutline(RevealType.NoReveal);
            }

            if (!this.leoStates.leoChanged) {
                // also refresh document panel (icon may be dirty now)
                this.leoStates.leoChanged = true;
                this.refreshDocumentsPane();
            }
        }

        // Maybe color syntaxing, wrap or some other body state needs refresh after a change...
        // do it with a small debounce to avoid doing it on every keystroke while editing.
        this.debouncedRefreshBodyStates(750);

    }

    /**
     * * Refresh body states after a small debounced delay.
     */
    private debouncedRefreshBodyStates(p_delay?: number) {

        if (!p_delay) {
            p_delay = 0;
        }

        if (this._bodyStatesTimer) {
            clearTimeout(this._bodyStatesTimer);
        }
        if (p_delay === 0) {
            if (this.leoStates.fileOpenedReady) {
                void this._bodySaveDocument();
            }
            this.refreshBodyStates();
        } else {
            this._bodyStatesTimer = setTimeout(() => {
                if (this.leoStates.fileOpenedReady) {
                    void this._bodySaveDocument();
                }
                this.refreshBodyStates();
            }, p_delay);
        }
    }
    //@+node:felix.20260323002618.1: *3* Save Body states to Leo
    /**
     * * Validate headline edit input box if active, or, Save body to the Leo app if its dirty.
     *   That is, only if a change has been made to the body 'document' so far
     * @returns a promise that resolves when the possible saving process is finished
     */
    public triggerBodySave(p_fromFocusChange?: boolean, p_saveSelectionOnly?: boolean): HeadlineFinishedResult | undefined {

        let hadEditHeadline: HeadlineFinishedResult | undefined = undefined;

        if (!p_fromFocusChange) {
            hadEditHeadline = this.endEditHeadline(p_saveSelectionOnly);
        }

        // * Save body to Leo if a change has been made to the body 'document' so far
        if (this._editorTouched) {
            this._editorTouched = false;
            this._bodySaveDocument();
        }
        this._bodySaveSelection();
        return hadEditHeadline;
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
            scroll = this._scroll || 0;
        } else {
            scroll = 0;
        }

        let gnx: string | undefined;
        let c: Commands | undefined;

        c = g.app.windowList[this.frameIndex].c;
        gnx = this._selectionGnx;

        const start = {
            line: this._selection.start.line || 0,
            col: this._selection.start.character || 0,
        };
        const end = {
            line: this._selection.end.line || 0,
            col: this._selection.end.character || 0,
        };
        const active = {
            line: this._selection.active.line || 0,
            col: this._selection.active.character || 0,
        };
        if (!c || !gnx) {
            return;
        }
        let p: Position | undefined;
        if (c.p.gnx === gnx) {
            p = c.p;
        } else {
            // find p.
            for (let p_p of c.all_positions()) {
                if (p_p.v.gnx === gnx) {
                    p = p_p;
                    break;
                }
            }
        }
        if (!p) {
            return;
        }

        // - "start":  The start of the selection.
        // - "end":    The end of the selection.
        // - "active": The insert point. Must be either start or end.
        // - "scroll": An optional scroll position.

        const v = p.v;
        const wrapper = c.frame.body.wrapper;
        const insert = g.convertRowColToPythonIndex(v.b, active['line'], active['col']);
        const startSel = g.convertRowColToPythonIndex(v.b, start['line'], start['col']);
        const endSel = g.convertRowColToPythonIndex(v.b, end['line'], end['col']);

        // If it's the currently selected node set the wrapper's states too
        if (p.__eq__(c.p)) {
            wrapper.setSelectionRange(startSel, endSel, insert);
            wrapper.setYScrollPosition(scroll);
        }
        // Always set vnode attrs.
        v.scrollBarSpot = scroll;
        v.insertSpot = insert;
        v.selectionStart = startSel < endSel ? startSel : endSel;
        v.selectionLength = Math.abs(startSel - endSel);

        this._scrollDirty = false;
        this._selectionDirty = false;
    }

    /**
     * * Sets new body text on leo's side.
     * @returns a promise that resolves when the complete saving process is finished
     */
    private _bodySaveDocument(): void {

        const body = workspace.body.getBody();
        const c = g.app.windowList[this.frameIndex].c;
        const u = c.undoer;
        const wrapper = c.frame.body.wrapper;
        const w_v = c.p.v;

        // If already exactly the same, return without doing anything
        if (body === c.p.bodyString()) {
            return;
        }

        // ok we got a valid p.
        const bunch = u.beforeChangeNodeContents(c.p);
        c.p.v.setBodyString(body);
        u.afterChangeNodeContents(c.p, "Body Text", bunch);

        wrapper.setAllText(body);
        if (!c.isChanged()) {
            c.setChanged();
        }
        if (!c.p.v.isDirty()) {
            c.p.setDirty();
        }
        g.doHook("bodykey2", { c: c, v: w_v });

        this._bodySaveSelection();
        this._refreshType.states = true;
        this.getStates();

    }
    //@+node:felix.20260323002420.1: *3* showOutline
    public showOutline(): void {
        workspace.layout.OUTLINE_PANE.focus();
    }
    //@+node:felix.20260323002416.1: *3* showBody
    public showBody(preventFocus?: boolean): void {

        // If preventFocus is true, make sure to save focused element and restore it after setting selection.
        const focusedElement = document.activeElement as HTMLElement;
        const c = g.app.windowList[this.frameIndex].c;
        const p = c.p;

        const insert = p.v.insertSpot;
        const start = p.v.selectionStart;
        const end = p.v.selectionStart + p.v.selectionLength;
        const scroll = p.v.scrollBarSpot;

        let w_leoBodySel: BodySelectionInfo = {
            "gnx": p.v.gnx,
            "scroll": scroll,
            "insert": this._row_col_pv_dict(insert, p.v.b),
            "start": this._row_col_pv_dict(start, p.v.b),
            "end": this._row_col_pv_dict(end, p.v.b)
        };
        const wrapper = c.frame.body.wrapper;
        const test_insert = wrapper.getInsertPoint();
        let test_start, test_end;
        [test_start, test_end] = wrapper.getSelectionRange(true);

        // ! OVERRIDE !
        w_leoBodySel = {
            "gnx": p.v.gnx,
            "scroll": scroll,
            "insert": this._row_col_wrapper_dict(test_insert, wrapper),
            "start": this._row_col_wrapper_dict(test_start, wrapper),
            "end": this._row_col_wrapper_dict(test_end, wrapper)
        };

        // Cursor position and selection range
        const w_activeRow: number = w_leoBodySel.insert.line;
        const w_activeCol: number = w_leoBodySel.insert.col;
        let w_anchorLine: number = w_leoBodySel.start.line;
        let w_anchorCharacter: number = w_leoBodySel.start.col;

        if (w_activeRow === w_anchorLine && w_activeCol === w_anchorCharacter) {
            // Active insertion same as start selection, so use the other ones
            w_anchorLine = w_leoBodySel.end.line;
            w_anchorCharacter = w_leoBodySel.end.col;
        }

        const w_selection = new Selection(
            w_anchorLine,
            w_anchorCharacter,
            w_activeRow,
            w_activeCol
        );

        // Add no-focus-outline class to body pane to avoid unwanted focus outline when preventFocus is true
        if (preventFocus) {
            workspace.layout.BODY_PANE.classList.add('no-focus-outline');
        }

        workspace.body.setBodySelection(w_selection, this._refreshType.scroll); // Note, in some browser, this has a side-effect of setting focus in body.
        this._refreshType.scroll = false;

        if (preventFocus) {
            // Wait for the Scroll and Selection-Focus to "settle" in the browser's eyes
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    focusedElement?.focus({ preventScroll: true });
                    workspace.layout.BODY_PANE.classList.remove('no-focus-outline');
                });
            });
        }

    }
    //@+node:felix.20260323002150.1: *3* Refresh & helpers
    /**
     * * Setup global refresh options
     * @param p_finalFocus kind of pane for focus to be placed after refresh, if any. If not specified, focus will be preserved.
     * @param p_refreshType Refresh flags for each UI part
    */
    public setupRefresh(p_finalFocus: Focus, p_refreshType?: ReqRefresh, p_preserveRange?: boolean): void {
        if (p_preserveRange) {
            this.refreshPreserveRange = true; // Will be cleared after a refresh cycle.
        }
        // Set final "focus-placement"
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
        if (this.inEditHeadline) {
            return; // editHeadline will end with a refresh!
        }

        // Check states for having at least a document opened
        if (this.leoStates.leoReady && this.leoStates.fileOpenedReady) {
            // Had some opened...
            if (!g.app.windowList.length) {
                return this._setupNoOpenedLeoDocument(); // ...But all closed now!
            }
        }

        // Maybe this is the first refresh after opening?
        if (this.leoStates.leoReady && !this.leoStates.fileOpenedReady) {
            // Was all closed
            if (g.app.windowList.length) {
                this._setupOpenedLeoDocument();
            } else {
                // First time starting: not even an untitled nor workbook.leo
                return;
            }
        }

        // Consider last command finished since the refresh cycle is starting
        if (this.trace && this.commandTimer !== undefined) {
            console.log('commandTimer: ' + utils.getDurationMs(this.commandTimer));
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
            this._refreshOutline(w_revealType);
        }

        if (this._refreshNode) {
            this.leoStates.setSelectedNodeFlags(this._refreshNode);
        }

        if (this._refreshType.body) {
            this._refreshType.body = false;
            let w_showBodyNoFocus: boolean = this.finalFocus.valueOf() !== Focus.Body; // Will preserve focus where it is without forcing into the body pane if true
            this._tryApplyNodeToBody(this._refreshNode, w_showBodyNoFocus);
        }

        // getStates will check if documents, buttons and states flags are set and refresh accordingly
        return this.getStates();
    }

    /**
     * * Refreshes all parts.
     */
    public fullRefresh(p_keepFocus?: boolean, instantRefresh?: boolean): void {
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
        if (instantRefresh) {
            // Launch the tree and body refresh immediately!
            workspace.controller.buildRowsRenderTreeLeo();
            if (g.app.windowList[this.frameIndex]) {
                const c = g.app.windowList[this.frameIndex].c;
                this._tryApplyNodeToBody(c.p, true);
            }
        } else {
            void this.launchRefresh(); // Debounced, for better performance when multiple things need refreshing at once (ex: after a command execution)
        }
    }

    /**
     * * Refreshes the outline. A reveal type can be passed along to specify the reveal type for the selected node
     * @param p_revealType Facultative reveal type to specify type of reveal when the 'selected node' is encountered
     */
    private _refreshOutline(p_revealType?: RevealType): void {

        if (p_revealType !== undefined && p_revealType.valueOf() >= this._revealType.valueOf()) { // To check if selected node should self-select while redrawing whole tree
            this._revealType = p_revealType; // To be read/cleared (in arrayToLeoNodesArray instead of directly by nodes)
        }
        workspace.controller.buildRowsRenderTreeLeo();
        if (this._revealType !== undefined) {
            const focusTree = (this._revealType.valueOf() >= RevealType.RevealSelectFocus.valueOf());
            if (focusTree) {
                // set focus to outline pane
                this.showOutline();
            }
            if (this._revealType.valueOf() >= RevealType.Reveal.valueOf()) {
                // should reveal selected node in the tree, so scroll to it if needed
                if (g.app.windowList.length) {
                    const c = g.app.windowList[this.frameIndex].c;
                    workspace.outline.scrollNodeIntoView(c.p);
                }
            }
            this._revealType = RevealType.NoReveal; // Clear after use
        }
    }

    public refreshDocumentsPane(): void {
        workspace.controller.setupDocumentTabsAndHandlers();
        // In case the new document has a scrollbar or not,
        // which changes the available width for the collapse all button.
        workspace.layout.updateCollapseAllPosition();
    }

    public refreshUndoPane(): void {
        workspace.controller.buildUndoElements();
    }

    public refreshBodyStates(): void {
        const c = g.app.windowList[this.frameIndex].c;
        const [w_language, w_wrap] = this._getBodyLanguage(c.p);
        workspace.body.setBodyLanguage(w_language);
        workspace.body.setBodyWrap(w_wrap);
    }

    public refreshGotoPane(): void {
        workspace.logPane.refreshGotoPane();
    }

    public refreshButtonsPane(): void {
        // TODO : implement buttons pane refresh
        // console.log('TODO ! in leo-ui: refreshButtonsPane called to refresh buttons pane');
    }
    //@+node:felix.20260323002101.1: *3* selectTreeNode
    /**
     * * Called by UI when the user selects in the tree (click or 'open aside' through context menu)
     * @param node is the position node selected in the tree
     * @param isCtrlClick is true if the click was a Ctrl-Click, which triggers different hooks and behavior
     * @returns thenable for reveal to finish or select position to finish
     */
    public async selectTreeNode(
        node: Position,
        isCtrlClick: boolean,
    ): Promise<unknown> {

        const c = node.v.context;

        this.triggerBodySave(); // Needed for self-selection to avoid 'cant save file is newer...'

        if (!isCtrlClick) {
            // Is not Ctrl-Click, so normal headline click
            if (g.doHook("headclick1", { c: c, p: node, v: node })) {
                // returned not falsy, so skip the rest
                return Promise.resolve();
            }

        } else {
            // Is Ctrl-Click, try to open url if headline starts with @url or @mime, or unl: and then skip the rest of the selection process,
            // otherwise just return without doing anything (except the "icondclick2" hook) since Ctrl-Click is meant to trigger side effects, not selection.
            if (g.doHook("icondclick1", { c: c, p: node, v: node })) {
                // returned not falsy, so skip the rest
                return Promise.resolve();
            }

            // If headline starts with @url call g.openUrl, if @mime call g.open_mimetype
            const w_headline = node.h;
            let openPromise;
            if (w_headline.trim().startsWith("@url ")) {
                openPromise = g.openUrl(node);
            } else if (w_headline.trim().startsWith("@mime ")) {
                openPromise = g.open_mimetype(node.v.context, node);
            } else if (w_headline.startsWith("unl:")) {
                openPromise = g.openUrlHelper(c, w_headline);
            }

            if (openPromise) {
                await utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, true);
                setTimeout(() => {
                    void utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, false);
                }, 60);
                await openPromise.then(() => {
                    g.doHook("icondclick2", { c: c, p: node, v: node });
                });
                // Slight delay to help finish opening possible new document/file.
                return new Promise((resolve) => {
                    setTimeout(() => {
                        this.setupRefresh(
                            Focus.Outline,
                            {
                                tree: true,
                                body: true,
                                goto: true,
                                states: true,
                                documents: true,
                                buttons: true
                            }
                        );
                        resolve(this.launchRefresh());
                    }, 30);
                });
            }
            // Ctrl click didn't trigger a special action, so just return.
            g.doHook("icondclick2", { c: c, p: node, v: node });
            return Promise.resolve();
        }

        this.leoStates.setSelectedNodeFlags(node);

        c.selectPosition(node);

        // * Unused in Leo-Web
        // if (this.findFocusTree) {
        //     // had a range but now refresh from other than find/replace
        //     // So make sure tree is also refreshed.
        //     this.findFocusTree = false;
        //     this.setupRefresh(
        //         Focus.Outline,
        //         {
        //             tree: true,
        //             body: true,
        //             // documents: false,
        //             // buttons: false,
        //             // states: false,
        //         }
        //     );
        //     g.doHook("headclick2", { c: c, p: node, v: node });
        //     return this._launchRefresh();
        // }
        this.finalFocus = Focus.Outline; // Force focus in outline after selection, since user just clicked in it.
        this._refreshType.states = true;
        this.getStates();

        g.doHook("headclick2", { c: c, p: node, v: node });

        // * Apply the node to the body text without waiting for the selection promise to resolve
        // In Leo-Web, no 'this.config.treeKeepFocus' to check for, we keep focus in outline.
        return this._tryApplyNodeToBody(node, true);

    }
    //@+node:felix.20260323002042.1: *3* _tryApplyNodeToBody
    private _tryApplyNodeToBody(node: Position, showBodyNoFocus: boolean): void {
        // In LeoJS, this required a bunch of helper methods because the body pane itself was not readily available and the body text was not directly settable,
        // so it required to find the right "editor" object in the DOM, then set its value, then restore scroll and selection, etc.   
        // Here in Leo-Web, the body pane is always readily available and we can directly set its content and send it the scroll and selection info,
        // so this should be more straightforward.

        const c = g.app.windowList[this.frameIndex].c;
        const p = c.p;

        if (!node.__eq__(c.p)) {
            // Oh, should never happen
            console.error('Trying to apply a node to body that is different from the selected one! This should not happen. Node:', node, ' Selected:', c.p);
        }

        const [w_language, w_wrap] = this._getBodyLanguage(node);

        workspace.body.setBody(p.b, w_wrap, w_language);
        // this._setBodyLanguage(w_language); // Unused?

        const scroll = p.v.scrollBarSpot;
        workspace.body.setBodyScroll(scroll);

        // If the desired final focus is the goto-items of the nav pane, then we call showBody (which sets selection and optional focus)
        // but with showBodyNoFocus true to preserve focus in the nav pane.

        // * note that other 'finalFocus', e.g. on Outline, will not have the selection range set *
        const isGotoFocus = this.finalFocus === Focus.Goto;
        if (!showBodyNoFocus || isGotoFocus) {
            this.showBody(isGotoFocus);
        }

    }
    //@+node:felix.20260323002027.1: *3* Row Col Convertion Utilities
    /**
     * Utility to convert a string index into a line, col dict
     */
    private _row_col_pv_dict(i: number, s: string): { line: number, col: number, index: number } {
        if (!i) {
            i = 0; // prevent none type
        }
        // BUG: this uses current selection wrapper only, use
        // g.convertPythonIndexToRowCol instead !
        let line: number;
        let col: number;
        [line, col] = g.convertPythonIndexToRowCol(s, i);
        return { "line": line, "col": col, "index": i };
    };

    /**
     * Converts from wrapper text index to line /col
     */
    private _row_col_wrapper_dict(i: number, wrapper: StringTextWrapper): { "line": number, "col": number, "index": number } {
        if (!i) {
            i = 0; // prevent none type
        }
        let line, col;
        [line, col] = wrapper.toPythonIndexRowCol(i);
        return { "line": line, "col": col, "index": i };
    }
    //@+node:felix.20260323001955.1: *3* _getBodyLanguage
    /**
     * * Looks for given position's coloring language and wrap, taking account of '@killcolor', etc.
     */
    private _getBodyLanguage(p: Position): [string, boolean] {
        const c = p.v.context;
        let w_language = "plain";
        const w_wrap = !!c.getWrap(p);
        if (g.useSyntaxColoring(p)) {

            // DEPRECATED:  leojs old colorizer language detection
            // const aList = g.get_directives_dict_list(p);
            // const d = g.scanAtCommentAndAtLanguageDirectives(aList);
            // w_language =
            //     (d && d['language'])
            //     || g.getLanguageFromAncestorAtFileNode(p)
            //     || c.config.getLanguage('target-language')
            //     || 'plain';

            // * as per original Leo's leoColorizer.py
            w_language = c.getLanguage(p) || c.config.getLanguage('target-language');
            w_language = w_language.toLowerCase();
        }

        return [w_language, w_wrap];
    }
    //@+node:felix.20260323001345.1: *3* Trigger GetStates
    /**
     * * 'getStates' action for use in debounced method call
     */
    private _triggerGetStates(): void {

        const frame = g.app.windowList[this.frameIndex];
        const c = frame.c;
        const states = this.leoStates;
        const menu = workspace.menu;

        if (this._refreshType.states) {
            this._refreshType.states = false;
            const p = c.p;
            // TODO : set status bar info? (If any, and if implemented in the web UI)
            // if (this._leoStatusBar && p && p.v) {
            //     const unl = c.frame.computeStatusUnl(p);
            //     this._leoStatusBar.setString(unl);
            //     this._leoStatusBar.setTooltip(p.h);
            // }
            let w_canHoist = true;
            let w_topIsChapter = false;
            let w_hasMarked = false;
            for (const v of c.all_unique_nodes()) {
                if (v.isMarked()) {
                    w_hasMarked = true;
                    break;
                }
            }
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
                topIsChapter: w_topIsChapter,
                hasMarked: w_hasMarked,
                // 
            };
            states.setLeoStateFlags(w_states);
            this.refreshUndoPane();
        }
        // Set leoChanged and leoOpenedFilename
        states.leoChanged = c.changed;
        states.leoOpenedFileName = frame.getTitle();

        this.refreshBodyStates(); // Set language and wrap states, if different.

        menu.updateButtonVisibility(states.leoHasMarked, states.leoCanGoBack || states.leoCanGoNext);
        menu.updateMarkedButtonStates(states.leoHasMarked);
        menu.updateHoistButtonStates(!states.leoRoot, states.leoCanDehoist);
        menu.updateHistoryButtonStates(states.leoCanGoBack, states.leoCanGoNext);
        menu.refreshMenu(menuData);
        menu.refreshBodyContextMenu(bodyPaneContextMenuData);
        menu.refreshOutlineContextMenu(outlinePaneContextMenuData);

        // Refresh other panes if needed
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
    //@+node:felix.20260323001309.1: *3* Setup open and no-open document
    /**
     * * Setup UI for having no opened Leo documents
     */
    private _setupNoOpenedLeoDocument(): void {
        this.leoStates.fileOpenedReady = false;
        this._refreshOutline(RevealType.NoReveal);
        const states = this.leoStates;
        const menu = workspace.menu;
        menu.updateButtonVisibility(states.leoHasMarked, states.leoCanGoBack || states.leoCanGoNext);
        menu.updateMarkedButtonStates(states.leoHasMarked);
        menu.updateHoistButtonStates(!states.leoRoot, states.leoCanDehoist);
        menu.updateHistoryButtonStates(states.leoCanGoBack, states.leoCanGoNext);
        menu.refreshMenu(menuData);
        menu.refreshBodyContextMenu(bodyPaneContextMenuData);
        menu.refreshOutlineContextMenu(outlinePaneContextMenuData);
        this.refreshDocumentsPane();
        this.refreshButtonsPane();
        this.refreshUndoPane();
        // Empty body pane
        workspace.body.setBody('', false);
        // Make body pane not editable.
        workspace.body.setBodyEditable(false);
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

        // In case it's the first file openind, make body pane editable again.
        workspace.body.setBodyEditable(true);

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
    //@+node:felix.20260323001205.1: *3* Leo Command
    /**
     * Leo Command. This is used in "command bindings" from the UI to execute commands.
     * @param p_cmd Command name string
     * @param p_options: CommandOptions for the command
     */
    public async command(
        p_cmd: string,
        p_options: CommandOptions,
        p_retried?: boolean
    ): Promise<unknown> {
        this.lastCommandTimer = process.hrtime();
        if (this.commandTimer === undefined) {
            this.commandTimer = this.lastCommandTimer;
        }
        this.lastCommandRefreshTimer = this.lastCommandTimer;
        if (this.commandRefreshTimer === undefined) {
            this.commandRefreshTimer = this.lastCommandTimer;
        }

        const hadEditHeadline = this.triggerBodySave();
        if (hadEditHeadline && !p_retried) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(this.command(p_cmd, p_options, true));
                }, 0);
            });
        }

        if (g.app.windowList.length === 0) {
            void workspace.dialog.showInformationMessage("No document opened. Please open a Leo file to execute commands.");
            return Promise.resolve();
        }

        if (p_options.finalFocus === Focus.NoChange) {
            // Get the current focus (body outline, or other will be noChange)
            if (workspace.layout.isOutlineFocused()) {
                p_options.finalFocus = Focus.Outline;
            } else if (workspace.layout.isBodyFocused()) {
                p_options.finalFocus = Focus.Body;
            }
        }

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
            void workspace.dialog.showInformationMessage("LeoUI Error: " + e);
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
    //@+node:felix.20260323001131.1: *3* Minibuffer & helpers
    /**
     * Opens quickPick minibuffer pallette to choose from all commands in this file's commander
     * @returns Promise from the command resolving - or resolve with undefined if cancelled
     */
    public async minibuffer(): Promise<unknown> {

        this.triggerBodySave();
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

        const w_picked = await workspace.dialog.showQuickPick(w_choices, {
            placeHolder: Constants.USER_MESSAGES.MINIBUFFER_PROMPT,
        });

        // To check for numeric line goto 'easter egg'
        const lastInput = workspace.dialog.getLastQuickPickInput();
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
            console.log('TODO: FIX EASTER EGG GOTO LINE:', lastInput);
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
        this.triggerBodySave();

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
        const w_picked = await workspace.dialog.showQuickPick(w_commandList, w_options);
        return this._doMinibufferCommand(w_picked);
    }

    /**
     * * Perform chosen minibuffer command
     */
    private _doMinibufferCommand(p_picked?: QuickPickItem): Promise<unknown> {
        if (p_picked && p_picked.label) {

            let finalFocus = Focus.NoChange;
            // Get the current focus (body outline, or other will be noChange)
            if (workspace.layout.isOutlineFocused()) {
                finalFocus = Focus.Outline;
            } else if (workspace.layout.isBodyFocused()) {
                finalFocus = Focus.Body;
            }

            // Setup refresh
            this.setupRefresh(
                finalFocus,
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
    //@+node:felix.20260323001118.1: *3* saveLeoFile
    /**
     * * Invokes the commander.save() command
     * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
     * @returns Promise that resolves when the save command is done
     */
    public async saveLeoFile(p_fromOutline?: boolean): Promise<unknown> {

        this.triggerBodySave();

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
    //@+node:felix.20260323001112.1: *3* selectOpenedLeoDocument
    /**
     * * Switches Leo document directly by index number.
     */
    public async selectOpenedLeoDocument(index: number): Promise<unknown> {

        if (this.frameIndex === index) {
            // already selected
            return Promise.resolve();
        }

        let finalFocus = Focus.NoChange;
        // Get the current focus (body outline, or other will be noChange)
        if (workspace.layout.isOutlineFocused()) {
            finalFocus = Focus.Outline;
        } else if (workspace.layout.isBodyFocused()) {
            finalFocus = Focus.Body;
        }

        this.triggerBodySave();
        this.frameIndex = index;
        // Like we just opened or made a new file
        if (g.app.windowList.length) {
            this.setupRefresh(
                finalFocus,
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
    //@+node:felix.20260323000247.1: *3* editHeadline & helper
    /**
     * * Asks for a new headline label, and replaces the current label with this new one one the specified, or currently selected node
     * @param p_node Specifies which node to rename, or leave undefined to rename the currently selected node
     * @returns Thenable that resolves when done
     */
    public async editHeadline(p_node?: Position, selectAll?: boolean, selection?: [number, number, number], p_retried?: boolean): Promise<Position> {
        const c = g.app.windowList[this.frameIndex].c;
        const u = c.undoer;
        const w_p: Position = p_node || c.p;

        this.triggerBodySave();

        // If coming from an 'insert-node' the STATES SHOULD BE REFRESHED (undo pane, dirty document indicator, etc.)
        this.getStates();

        // For now, always focus outline after insert, since the editable headline input box will be in the outline. 
        this.setupRefresh(Focus.Outline, { tree: true, states: true });

        this.inEditHeadline++;
        this.leoStates.inHeadlineEdit = true;

        // this await will pause so the debounced 'getStates' can run and refresh the undo pane and other states.
        let headlineResult = await workspace.outline.openHeadlineInputBox(w_p, selectAll, selection);

        this.inEditHeadline--;
        if (!this.inEditHeadline) {
            this.leoStates.inHeadlineEdit = false;
        }

        if (headlineResult.saveSelectionOnly) {
            return w_p;
        }

        // refreshing states AGAIN after headline edit.
        this.setupRefresh(Focus.Outline, { tree: true, states: true });

        if (headlineResult.blurred) {
            // call setupRefresh so as to not force focus on anything.
            this.setupRefresh(Focus.NoChange, { tree: true, states: true });
        }
        void this._launchRefresh();
        return w_p;
    }

    public endEditHeadline(p_saveSelectionOnly?: boolean): HeadlineFinishedResult | undefined {
        if (workspace.outline.headlineFinish) {
            const result = workspace.outline.headlineFinish(false, p_saveSelectionOnly);
            return result;
        }
        return undefined;
    }

    private _finishEditHeadline(result: HeadlineFinishedResult): void {
        const c = g.app.windowList[this.frameIndex].c;
        const u = c.undoer;
        let w = this.get_focus(c);
        const node = result.node;
        let newHeadline = result.newHeadline;
        const newSelection = result.selection;
        const saveSelectionOnly = result.saveSelectionOnly;

        const focus = this.widget_name(w);

        if (saveSelectionOnly) {
            c.frame.tree.editLabel(node); // <-- THIS SHOULD CREATE IT !
            const headlineWidget = c.edit_widget(node) as StringTextWrapper;
            if (headlineWidget && headlineWidget.sel) {
                headlineWidget.setSelectionRange(newSelection[0], newSelection[1], newSelection[2]);
            } else {
                console.error('Could not find the StringTextWrapper to set selection on after headline edit', w);
            }
        } else {
            const d = c.frame.tree.editWidgetsDict;
            if (d[c.p.v.gnx]) {
                delete d[c.p.v.gnx];
            }
        }

        let w_truncated = false;
        if (newHeadline.indexOf("\n") >= 0) {
            newHeadline = newHeadline.split("\n")[0];
            w_truncated = true;
        }
        if (newHeadline.length > 1000) {
            newHeadline = newHeadline.substring(0, 1000);
            w_truncated = true;
        }

        if (node && node.h !== newHeadline) {
            if (w_truncated) {
                void workspace.dialog.showInformationMessage("Truncating headline");
            }
            if (g.doHook("headkey1", { c: c, p: c.p, ch: '\n', changed: true })) {
                // return node;  // The hook claims to have handled the event.
            }
            const undoData = u.beforeChangeHeadline(node);
            c.setHeadString(node, newHeadline); // Set v.h *after* calling the undoer's before method.
            if (!c.changed) {
                c.setChanged();
            }
            u.afterChangeHeadline(node, 'Edit Headline', undoData);
            g.doHook("headkey2", { c: c, p: c.p, ch: '\n', changed: true });
        }
    }
    //@+node:felix.20260323000155.1: *3* Clipboard
    /**
     * Replaces the system's clipboard with the given string
     * @param s actual string content to go onto the clipboard
     * @returns a promise that resolves when the string is put on the clipboard
     */
    public replaceClipboardWith(s: string): Thenable<string> {
        this.clipboardContents = s; // also set immediate clipboard string
        return navigator.clipboard.writeText(s).then(() => { return s; });
    }

    /**
     * Asynchronous clipboards getter
     * Get the system's clipboard contents and returns a promise
     * Also puts it in the global clipboardContents variable
     * @returns a promise of the clipboard string content
     */
    public asyncGetTextFromClipboard(): Thenable<string> {
        return navigator.clipboard.readText().then((s) => {
            // also set immediate clipboard string for possible future read
            this.clipboardContents = s;
            return this.getTextFromClipboard();
        });
    }

    /**
     * Returns clipboard content
    */
    public getTextFromClipboard(): string {
        return this.clipboardContents;
    }

    /**
     * Put UNL of current node on the clipboard. 
     * @para optional unlType to specify type.
     */
    public unlToClipboard(unlType?: UnlType): Thenable<string> {
        let unl = "";
        const c = g.app.windowList[this.frameIndex].c;
        const p = c.p;
        if (!p.v) {
            return Promise.resolve('');
        }
        if (unlType) {
            switch (unlType) {
                case 'shortGnx':
                    unl = p.get_short_gnx_UNL();
                    break;
                case 'fullGnx':
                    unl = p.get_full_gnx_UNL();
                    break;
                case 'shortLegacy':
                    unl = p.get_short_legacy_UNL();
                    break;
                case 'fullLegacy':
                    unl = p.get_full_legacy_UNL();
                    break;
            }
        } else {
            unl = c.frame.computeStatusUnl(p);
        }
        return this.replaceClipboardWith(unl);
    }
    //@+node:felix.20260322235938.1: *3* goAnywhere
    /**
     * Mimic vscode and sublime-text's CTRL+P to find any position by it's headline
     */
    public async goAnywhere(): Promise<unknown> {
        this.triggerBodySave();

        const allPositions: { label: string; description?: string; position?: Position; }[] = [];
        // Options for date to look like : Saturday, September 17, 2016
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: "long", year: 'numeric', month: "long", day: 'numeric' };
        const c = g.app.windowList[this.frameIndex].c;

        // 'true' parameter because each position is kept individually for the time the QuickPick control is opened
        for (const p_position of c.all_unique_positions(true)) {

            let description = p_position.gnx; // Defaults as gnx.
            const w_gnxParts = description.split('.');
            const dateString = w_gnxParts[1] ? w_gnxParts[1] : "";

            if (dateString && w_gnxParts.length === 3 && dateString.length === 14 && /^\d+$/.test(dateString)) {
                // legit 3 part numeric gnx, so build a string date
                const w_year = +dateString.substring(0, 4); // unary + operator to convert the strings to numbers.
                const w_month = +dateString.substring(4, 6);
                const w_day = +dateString.substring(6, 8);
                const w_date = new Date(w_year, w_month - 1, w_day);
                description = `by ${w_gnxParts[0]} on ${w_date.toLocaleDateString("en-US", dateOptions)}`;
            }
            allPositions.push({
                label: p_position.h,
                position: p_position,
                description: description
            });
        };

        // Add Nav tab special commands
        const w_options: QuickPickOptions = {
            placeHolder: Constants.USER_MESSAGES.SEARCH_POSITION_BY_HEADLINE
        };

        const picked = (await workspace.dialog.showQuickPick(allPositions, w_options)) as QuickPickItem & { position: Position };;

        if (picked && picked.label && picked.position) {
            if (c.positionExists(picked.position)) {
                c.selectPosition(picked.position);  // set this node as selection
            }
            this.setupRefresh(
                Focus.Body, // Finish in body pane given explicitly because last focus was in input box.
                {
                    tree: true,
                    body: true,
                    // documents: false,
                    // buttons: false,
                    states: true,
                }
            );
            void this.launchRefresh();
        }

        return Promise.resolve(undefined); // Canceled

    }
    //@+node:felix.20260322235907.1: *3* Nav and Goto
    /**
     * * Goto the next, previous, first or last nav entry via arrow keys in
     */
    public navigateNavEntry(p_nav: LeoGotoNavKey): void {
        workspace.controller.navigateNavEntry(p_nav);
    }

    /**
     * * Handles an enter press in the 'nav pattern' input
     */
    public async navEnter(): Promise<unknown> {
        this.triggerBodySave();
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;

        const inp = scon.navText;
        if (scon.isTag) {
            scon.qsc_find_tags(inp);
        } else {
            scon.qsc_search(inp);
        }

        return this.showNavResults();

    }

    /**
     * * Handles a debounced text change in the nav pattern input box
     */
    public async navTextChange(): Promise<unknown> {
        this.triggerBodySave();
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;

        const inp = scon.navText;
        if (scon.isTag) {
            scon.qsc_find_tags(inp);
        } else {
            const exp = inp.replace(/ /g, '*');
            scon.qsc_background_search(exp);
        }
        return this.showNavResults();
    }

    /**
     * * Clears the nav search results of the goto pane
     */
    public navTextClear(): void {
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;
        scon.clear();
        workspace.controller.buildGotoElements();
    }


    /**
     * Opens the Nav tab and focus on nav text input
     */
    public findQuick(text?: string, p_forceEnter?: boolean): void {
        this.triggerBodySave();
        workspace.logPane.selectNav(text, p_forceEnter);
    }

    /**
     * Opens the Nav tab with the selected text as the search string
     */
    public findQuickSelected(): void {
        this.triggerBodySave();
        if (g.app.windowList.length === 0) {
            return;
        }
        const frame = g.app.windowList[this.frameIndex];
        const body = frame.body;

        let [, s] = body.getSelectionLines();
        if (s) {
            s = s.replace(/\r\n/g, "\n");
        }

        return this.findQuick(s || "", true);
    }

    /**
     * Lists all nodes in reversed gnx order, newest to oldest
     */
    public findQuickTimeline(): void {
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;
        scon.qsc_sort_by_gnx();
        workspace.controller.buildGotoElements();
        workspace.logPane.showTab('nav');
    }

    /**
     * Lists all nodes that are changed (aka "dirty") since last save.
     */
    public findQuickChanged(): void {
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;
        scon.qsc_find_changed();
        workspace.controller.buildGotoElements();
        workspace.logPane.showTab('nav');
    }

    /**
     * Lists nodes from c.nodeHistory.
     */
    public findQuickHistory(): void {
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;
        scon.qsc_get_history();
        workspace.controller.buildGotoElements();
        workspace.logPane.showTab('nav');
    }

    /**
     * List all marked nodes.
     */
    public findQuickMarked(p_preserveFocus?: boolean): void {
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;
        scon.qsc_show_marked();
        workspace.controller.buildGotoElements();
        if (p_preserveFocus && workspace.logPane.HTML_ELEMENT.getAttribute('data-active-tab') === 'nav') {
            return
        }
        workspace.logPane.showTab('nav');
    }


    /**
     * * Handles a click (selection) of a nav panel node: Sends 'goto' command to server.
     */
    public async gotoNavEntry(p_node: LeoGotoNode): Promise<unknown> {
        if (!p_node) {
            console.log('ERROR NO NODE TO SHOW IN GOTO PANE!');
            return;
        }

        this.triggerBodySave(true);
        workspace.controller.resetSelectedNode(p_node); // Inform controller of last index chosen
        const c = g.app.windowList[this.frameIndex].c;
        const scon: QuickSearchController = c.quicksearchController;

        if (p_node.entryType === 'tag') {
            // * For when the nav input IS CLEARED : GOTO PANE LISTS ALL TAGS!
            // The node clicked was one of the tags, pre-fill the nac search with this tag and open find pane
            let w_string: string = p_node.label || "";

            workspace.logPane.showTab('nav');

            const w_message: { [key: string]: string; } = { type: 'selectNav' };
            if (w_string && w_string.trim()) {
                w_message["text"] = w_string.trim();
            }

            workspace.logPane.selectNav(w_string.trim());
            // Do search
            setTimeout(() => {
                const inp = scon.navText;
                if (scon.isTag) {
                    scon.qsc_find_tags(inp);
                } else {
                    scon.qsc_search(inp);
                }
                workspace.controller.buildGotoElements();
                // void this.showGotoPane({ preserveFocus: true }); // show but dont change focus
            }, 10);

        } else if (p_node.entryType !== 'generic' && p_node.entryType !== 'parent') {
            // Other and not a tag so just locate the entry in either body or outline
            // const p_navEntryResult = await this.sendAction(
            //     Constants.LEOBRIDGE.GOTO_NAV_ENTRY,
            //     { key: p_node.key }
            // );

            const it = p_node.key;
            scon.onSelectItem(it);

            const w = g.app.gui.get_focus(c);
            let focus = g.app.gui.widget_name(w);

            if (!focus) {
                return workspace.dialog.showInformationMessage('Not found');
            } else {
                let w_revealTarget = Focus.Body;
                focus = focus.toLowerCase();

                if (focus.includes('tree') || focus.includes('head')) {
                    // tree
                    w_revealTarget = Focus.Outline;
                }
                this.setupRefresh(
                    // ! KEEP FOCUS ON GOTO PANE !
                    Focus.Goto,
                    {
                        tree: true,
                        body: true,
                        scroll: w_revealTarget === Focus.Body,
                        // documents: false,
                        // buttons: false,
                        states: true,
                    }
                );
                return this.launchRefresh();
            }
        }

    }

    public showNavResults(): void {
        workspace.controller.buildGotoElements();
        workspace.logPane.showTab('nav');
    }

    //@+node:felix.20260322235817.1: *3* Search and Replace
    /**
     * * Opens the find panel and selects all & focuses on the find field.
     */
    public startSearch(): void {
        this.triggerBodySave();
        workspace.logPane.showTab('find');
        setTimeout(() => {
            workspace.logPane.focusFindInput();
        }, 0);
    }

    /**
     * * Find next / previous commands
     * @param p_reverse
     * @returns Promise that resolves when the "launch refresh" is started
     */
    public async find(p_reverse: boolean): Promise<unknown> {

        this.triggerBodySave(false, true); // From Find: save selection and insert pos only

        const c = g.app.windowList[this.frameIndex].c;
        const fc = c.findCommands;
        let p: Position | undefined = c.p;

        // Detect focus instead of using parameter 
        const fromBody = workspace.layout.getLastFocusedBodyOrOutline() === 'body';
        const fromOutline = !fromBody;

        let w = this.get_focus(c);
        let focus = this.widget_name(w);

        const inOutline = (focus.includes("tree")) || (focus.includes("head"));
        const inBody = !inOutline;

        if (fromOutline && inBody) {
            fc.in_headline = true;
        } else if (fromBody && inOutline) {
            fc.in_headline = false;
            c.bodyWantsFocus();
            c.bodyWantsFocusNow();
        }

        let pos, newpos, settings;
        settings = fc.ftm.get_settings();
        if (p_reverse) {
            [p, pos, newpos] = fc.do_find_prev(settings);
        } else {
            [p, pos, newpos] = fc.do_find_next(settings);
        }

        w = this.get_focus(c); // get focus again after the operation
        focus = this.widget_name(w);

        let found = p && p.__bool__();

        this.findFocusTree = false; // Reset flag for headline range
        let w_finalFocus = Focus.Body;
        let w_focus = focus.toLowerCase();

        if (!found) {
            w = c.get_requested_focus(); // get the focus that the commander requested to be focused after the find operation, which is more accurate for cases where the find operation itself changes the focus (e.g. find in body focusing headline if found there)
            focus = this.widget_name(w);
            w_focus = focus.toLowerCase();

            if (w_focus.includes('tree') || w_focus.includes('head')) {
                w_finalFocus = Focus.Outline
            }
            this.setupRefresh(
                w_finalFocus, // ! Unlike gotoNavEntry, this sets focus in outline -or- body.
                {
                    tree: true, // HAVE to refresh tree because find folds/unfolds only result outline paths
                    body: true,
                    scroll: false, // not found: dont scroll.
                    // documents: false,
                    // buttons: false,
                    states: true,
                },
                this.findFocusTree
            );
            this.launchRefresh();

            return workspace.dialog.showInformationMessage('Not found');
        } else {

            if (w_focus.includes('tree') || w_focus.includes('head')) {
                w_finalFocus = Focus.NoChange; // NoChange because its going to be headline selected, so it will be headline edit mode, which already focuses the headline. 
                // If we set it to Outline, it will try to focus the tree and mess up the headline edit focus!
                this.findFocusTree = true;
            }
            const w_scroll = (found && w_finalFocus === Focus.Body) || undefined;

            this.setupRefresh(
                w_finalFocus, // ! Unlike gotoNavEntry, this sets focus in outline -or- body.
                {
                    tree: true, // HAVE to refresh tree because find folds/unfolds only result outline paths
                    body: true,
                    scroll: w_scroll,
                    // documents: false,
                    // buttons: false,
                    states: true,
                },
                this.findFocusTree
            );

            this.launchRefresh();

            if (this.findFocusTree && w.sel) {
                setTimeout(() => {
                    // Select headline if needed after refresh.
                    this.editHeadline(undefined, false, [w.sel[0], w.sel[1], w.ins]);
                }, 0);
            }
        }
    }

    /**
     * * Replace / Replace-Then-Find commands
     * @param p_fromOutline
     * @param p_thenFind
     * @returns Promise that resolves when the "launch refresh" is started
     */
    public async replace(p_thenFind?: boolean): Promise<unknown> {

        this.triggerBodySave(false, true); // From Find: save selection and insert pos only

        const c = g.app.windowList[this.frameIndex].c;
        const fc = c.findCommands;

        // Detect focus instead of using parameter 
        const fromBody = workspace.layout.getLastFocusedBodyOrOutline() === 'body';
        const fromOutline = !fromBody;

        let w = this.get_focus(c);
        let focus = this.widget_name(w);

        const inOutline = (focus.includes("tree")) || (focus.includes("head"));
        const inBody = !inOutline;

        if (fromOutline && inBody) {
            fc.in_headline = true;
        } else if (fromBody && inOutline) {
            fc.in_headline = false;
            c.bodyWantsFocus();
            c.bodyWantsFocusNow();
        }

        let found = false;

        const settings = fc.ftm.get_settings();
        fc.init_ivars_from_settings(settings); // ? Needed for fc.change_selection

        fc.check_args('replace');
        if (p_thenFind) {
            found = fc.do_change_then_find(settings);
        } else {
            fc.change_selection(c.p);
            found = true;
        }

        w = this.get_focus(c); // get focus again after the operation
        focus = this.widget_name(w);

        this.findFocusTree = false; // Reset flag for headline range
        let w_finalFocus = Focus.Body;
        let w_focus = focus.toLowerCase();

        if (!found) {
            w = c.get_requested_focus(); // get the focus that the commander requested to be focused after the find operation, which is more accurate for cases where the find operation itself changes the focus (e.g. find in body focusing headline if found there)
            focus = this.widget_name(w);
            w_focus = focus.toLowerCase();

            if (w_focus.includes('tree') || w_focus.includes('head')) {
                w_finalFocus = Focus.Outline
            }
            this.setupRefresh(
                w_finalFocus, // ! Unlike gotoNavEntry, this sets focus in outline -or- body.
                {
                    tree: true, // HAVE to refresh tree because find folds/unfolds only result outline paths
                    body: true,
                    scroll: false, // not found: dont scroll.
                    // documents: false,
                    // buttons: false,
                    states: true,
                },
                this.findFocusTree
            );
            this.launchRefresh();

            return workspace.dialog.showInformationMessage('Not found');
        } else {
            if (w_focus.includes('tree') || w_focus.includes('head')) {
                w_finalFocus = Focus.NoChange; // NoChange because its going to be headline selected, so it will be headline edit mode, which already focuses the headline. 
                // If we set it to Outline, it will try to focus the tree and mess up the headline edit focus!
                this.findFocusTree = true;
            }
            const w_scroll = (found && w_finalFocus === Focus.Body) || undefined;

            this.setupRefresh(
                w_finalFocus, // ! Unlike gotoNavEntry, this sets focus in outline -or- body.
                {
                    tree: true, // HAVE to refresh tree because find folds/unfolds only result outline paths
                    body: true,
                    scroll: w_scroll,
                    // documents: false,
                    // buttons: false,
                    states: true,
                },
                this.findFocusTree
            );

            this.launchRefresh();

            if (this.findFocusTree && w.sel) {
                setTimeout(() => {
                    // Select headline if needed after refresh.
                    this.editHeadline(undefined, false, [w.sel[0], w.sel[1], w.ins]);
                }, 0);
            }
        }
    }

    /**
     * * Gets the search settings from Leo, and applies them to the find panel webviews
     */
    public loadSearchSettings(): void {

        if (!g.app.windowList.length || !g.app.windowList[this.frameIndex]) {
            return;
        }
        const c = g.app.windowList[this.frameIndex].c;
        const scon = c.quicksearchController;
        const leoISettings = c.findCommands.ftm.get_settings();
        const w_settings: LeoSearchSettings = {
            // Nav options
            navText: scon.navText,
            showParents: scon.showParents,
            isTag: scon.isTag,
            searchOptions: scon.searchOptions,
            //Find/change strings...
            findText: leoISettings.find_text,
            replaceText: leoISettings.change_text,
            // Find options...
            ignoreCase: leoISettings.ignore_case,
            markChanges: leoISettings.mark_changes,
            markFinds: leoISettings.mark_finds,
            wholeWord: leoISettings.whole_word,
            regExp: leoISettings.pattern_match,
            searchHeadline: leoISettings.search_headline,
            searchBody: leoISettings.search_body,
            // 0, 1 or 2 for outline, sub-outline, or node.
            searchScope:
                0 +
                (leoISettings.suboutline_only ? 1 : 0) +
                (leoISettings.node_only ? 2 : 0) +
                (leoISettings.file_only ? 3 : 0),
        };
        if (w_settings.searchScope > 2) {
            console.error('searchScope SHOULD BE 0, 1, 2 only: ', w_settings.searchScope);
        }
        this._lastSettingsUsed = w_settings;

        workspace.logPane.setSettings(w_settings);

    }

    /**
     * * Send the settings to Leo implementation
     * @param p_settings the search settings to be set in Leo implementation to affect next results
     * @returns
     */
    public saveSearchSettings(p_settings: LeoSearchSettings): Thenable<unknown> {

        if (!g.app.windowList.length || !g.app.windowList[this.frameIndex]) {
            return Promise.resolve();
        }

        this._lastSettingsUsed = p_settings;
        // convert to LeoGuiFindTabManagerSettings
        const searchSettings: LeoGuiFindTabManagerSettings = {
            // Nav settings
            is_tag: p_settings.isTag,
            nav_text: p_settings.navText,
            show_parents: p_settings.showParents,
            search_options: p_settings.searchOptions,
            // Find/change strings...
            find_text: p_settings.findText,
            change_text: p_settings.replaceText,
            // Find options...
            ignore_case: p_settings.ignoreCase,
            mark_changes: p_settings.markChanges,
            mark_finds: p_settings.markFinds,
            node_only: !!(p_settings.searchScope === 2),
            file_only: !!(p_settings.searchScope === 3),
            pattern_match: p_settings.regExp,
            search_body: p_settings.searchBody,
            search_headline: p_settings.searchHeadline,
            suboutline_only: !!(p_settings.searchScope === 1),
            whole_word: p_settings.wholeWord,
        };

        // Sets search options. Init widgets and ivars from param.searchSettings
        const c = g.app.windowList[this.frameIndex].c;
        const scon = c.quicksearchController;
        const find = c.findCommands;
        const ftm = c.findCommands.ftm;

        // * Try to set the search settings
        // nav settings
        scon.navText = searchSettings.nav_text;
        scon.showParents = searchSettings.show_parents;
        scon.isTag = searchSettings.is_tag;
        scon.searchOptions = searchSettings.search_options;

        // Find/change text boxes.
        const table: [string, string, string][] = [
            ['find_findbox', 'find_text', ''],
            ['find_replacebox', 'change_text', ''],
        ];
        for (let [widget_ivar, setting_name, w_default] of table) {
            const w = ftm[widget_ivar as keyof StringFindTabManager]; // getattr(ftm, widget_ivar)
            const s = searchSettings[setting_name as keyof LeoGuiFindTabManagerSettings] || w_default;
            w.clear();
            w.insert(s);
        }

        // Check boxes.
        const table2: [string, string][] = [
            ['ignore_case', 'check_box_ignore_case'],
            ['mark_changes', 'check_box_mark_changes'],
            ['mark_finds', 'check_box_mark_finds'],
            ['pattern_match', 'check_box_regexp'],
            ['search_body', 'check_box_search_body'],
            ['search_headline', 'check_box_search_headline'],
            ['whole_word', 'check_box_whole_word'],
        ];
        for (let [setting_name, widget_ivar] of table2) {
            const w = ftm[widget_ivar as keyof StringFindTabManager]; // getattr(ftm, widget_ivar)
            const val = searchSettings[setting_name as keyof LeoGuiFindTabManagerSettings];
            (find as any)[setting_name as keyof LeoFind] = val;
            if (val !== w.isChecked()) {
                w.toggle();
            }
        }

        // Radio buttons
        const table3: [string, string, string][] = [
            ['node_only', 'node_only', 'radio_button_node_only'],
            ['file_only', 'file_only', 'radio_button_file_only'],
            ['entire_outline', "", 'radio_button_entire_outline'],
            ['suboutline_only', 'suboutline_only', 'radio_button_suboutline_only'],
        ];
        for (let [setting_name, ivar, widget_ivar] of table3) {
            const w = ftm[widget_ivar as keyof StringFindTabManager]; // getattr(ftm, widget_ivar)
            const val = searchSettings[setting_name as keyof LeoGuiFindTabManagerSettings] || false;

            if (ivar) {
                // assert hasattr(find, setting_name), setting_name

                // setattr(find, setting_name, val)
                (find as any)[setting_name as keyof LeoFind] = val;

                if (val !== w.isChecked()) {
                    w.toggle();
                }
            }
        }

        // Ensure one radio button is set.
        const w = ftm.radio_button_entire_outline;
        const nodeOnly = searchSettings.node_only || false;
        const fileOnly = searchSettings.file_only || false;
        const suboutlineOnly = searchSettings.suboutline_only || false;

        if (!nodeOnly && !suboutlineOnly && !fileOnly) {
            find.entire_outline = true;
            if (!w.isChecked()) {
                w.toggle();
            }
        } else {
            find.entire_outline = false;
            if (w.isChecked()) {
                w.toggle();
            }
        }

        return Promise.resolve();
    }

    private _resolveFindPaneMessage = (message: any): void => {
        switch (message.type) {
            case 'leoNavEnter': {
                void this.navEnter();
                break;
            }
            case 'leoNavTextChange': {
                void this.navTextChange();
                break;
            }
            case 'leoNavClear': {
                void this.navTextClear();
                break;
            }
            case 'leoNavMarkedList': {
                void this.findQuickMarked(true);
                break;
            }
            case 'leoFindNext': {
                this.find(false);
                break;
            }
            case 'leoFindPrevious': {
                this.find(true);
                break;
            }
            case 'searchConfig': {
                void this.saveSearchSettings(message.value);
                break;
            }
            case 'replace': {
                void this.replace(false);
                break;
            }
            case 'replaceThenFind': {
                void this.replace(true);
                break;
            }

            case 'navigateNavEntry': {
                void this.navigateNavEntry(message.value);
                break;
            }
            case 'refreshSearchConfig': {
                void this.triggerBodySave();
                // Leave a cycle before getting settings
                setTimeout(() => {
                    this.loadSearchSettings();
                }, 0);
                break;
            }
            case 'gotoCommand': {
                try {
                    const w_index = Number(message.value);
                    if (!isNaN(w_index) && workspace.controller.nodeList[w_index]) {
                        void this.gotoNavEntry(workspace.controller.nodeList[w_index]);
                    }
                } catch (e) {
                    console.log('goto nav entry failed for index: ', message.value);
                }
                break;
            }
        }
    }
    //@+node:felix.20260322234219.1: *3* tabCycle
    /**
     * * Cycle opened documents
     */
    public async tabCycle(): Promise<unknown> {
        this.triggerBodySave();

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

        return this.selectOpenedLeoDocument(w_chosenIndex);
    }
    //@+node:felix.20260329222451.1: *3* revertToUndo
    /**
     * * Reverts to a particular undo bead state
     */
    public revertToUndo(beadIndex: number): Promise<any> {

        let action = "redo";
        let repeat = beadIndex;
        if (beadIndex <= 0) {
            action = "undo";
            repeat = (-beadIndex) + 1;
        }
        const c = g.app.windowList[this.frameIndex].c;
        const u = c.undoer;
        for (let x = 0; x < repeat; x++) {
            if (action === "redo") {
                if (u.canRedo()) {
                    u.redo();
                }
            } else if (action === "undo") {
                if (u.canUndo()) {
                    u.undo();
                }
            }
        }
        this.setupRefresh(
            Focus.Outline,
            {
                tree: true,
                body: true,
                documents: true,
                states: true,
                buttons: true,
            }
        );
        return Promise.resolve(this.launchRefresh());
    }

    //@+node:felix.20260322233732.1: *3* File Commands
    //@+others
    //@+node:felix.20260322234040.1: *4* showRecentLeoFiles
    /**
     * * Shows the recent Leo files list, choosing one will open it
     * @returns A promise that resolves when the a file is finally opened, rejected otherwise
     */
    public async showRecentLeoFiles(): Promise<unknown> {

        // if shown, chosen and opened
        let w_recentFiles: string[] = g.app.recentFilesManager.recentFiles;
        w_recentFiles = w_recentFiles.filter(str => str.trim() !== "");

        const w_recentFilesQuickPicks = w_recentFiles.map((file) => {
            return {
                label: file,
                description: file
            } as QuickPickItem;
        });


        let q_chooseFile: Promise<QuickPickItem | undefined>
        if (w_recentFiles.length) {
            q_chooseFile = workspace.dialog.showQuickPick(w_recentFilesQuickPicks, {
                placeHolder: Constants.USER_MESSAGES.OPEN_RECENT_FILE,
            });
        } else {
            // No file to list
            return workspace.dialog.showInformationMessage('Recent files list empty');
        }
        const w_result = await q_chooseFile;
        if (w_result) {
            const filename = w_result.label;
            // Is there a file opened?
            if (g.app.windowList.length && g.app.windowList[this.frameIndex]) {
                const c = g.app.windowList[this.frameIndex].c;
                this.triggerBodySave(true);
                if (g.doHook("recentfiles1", { c: c, p: c.p, v: c.p.v, fileName: filename })) {
                    return Promise.resolve(undefined);
                }
            }

            console.log('Opening recent file: ', filename);
            // Either way, try to open the file
            await this.openLeoFile(new Uri(filename));

            // Now, maybe there is a file opened?
            if (g.app.windowList.length && g.app.windowList[this.frameIndex]) {
                // Already opened file
                const c = g.app.windowList[this.frameIndex].c;
                g.doHook("recentfiles2", { c: c, p: c.p, v: c.p.v, fileName: filename });
            }
        }
        return Promise.resolve(undefined);

    }
    //@+node:felix.20260322234034.1: *4* newLeoFile
    /**
    * * Creates a new Leo file
    * @returns the promise started after it's done creating the frame and commander
    */
    public async newLeoFile(): Promise<unknown> {
        this.triggerBodySave();

        // this.showBodyIfClosed = true;
        // this.showOutlineIfClosed = true;

        let finalFocus = Focus.NoChange;
        // Get the current focus (body outline, or other will be noChange)
        if (workspace.layout.isOutlineFocused()) {
            finalFocus = Focus.Outline;
        } else if (workspace.layout.isBodyFocused()) {
            finalFocus = Focus.Body;
        }

        this.setupRefresh(finalFocus, {
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
            this.triggerBodySave();
            const c = g.app.windowList[this.frameIndex].c;
            await c.new(this);
            setTimeout(() => {
                void utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, false);
            }, 60);
        }
        this.loadSearchSettings();
        return this.launchRefresh();
    }
    //@+node:felix.20260322234028.1: *4* closeLeoFile
    public async closeLeoFile(index?: number): Promise<unknown> {
        // If no index, find current
        if (index === undefined) {
            index = this.frameIndex;
        }

        if (index < 0 || index >= g.app.windowList.length) {
            return Promise.reject('closeLeoDocument: index out of range');
        }
        this.triggerBodySave();

        let finalFocus = Focus.NoChange;
        // Get the current focus (body outline, or other will be noChange)
        if (workspace.layout.isOutlineFocused()) {
            finalFocus = Focus.Outline;
        } else if (workspace.layout.isBodyFocused()) {
            finalFocus = Focus.Body;
        }

        const c = g.app.windowList[index].c;
        await c.close();

        this.setupRefresh(finalFocus, {
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
    //@+node:felix.20260322234024.1: *4* openLeoFile
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

        let finalFocus = Focus.NoChange;
        // Get the current focus (body outline, or other will be noChange)
        if (workspace.layout.isOutlineFocused()) {
            finalFocus = Focus.Outline;
        } else if (workspace.layout.isBodyFocused()) {
            finalFocus = Focus.Body;
        }

        if (!this.leoStates.fileOpenedReady) {
            // override with given argument
            let fileName: string;

            // make sure it's a real uri !

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
                    void workspace.dialog.showInformationMessage('can not open:' + '"' + fileName + '"');
                    return Promise.resolve();
                }
                // this.showBodyIfClosed = true;
                // this.showOutlineIfClosed = true;
                this.setupRefresh(finalFocus, {
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
            this.triggerBodySave();
            const c = g.app.windowList[this.frameIndex].c;
            await utils.setContext(Constants.CONTEXT_FLAGS.LEO_OPENING_FILE, true);
            await c.open_outline(p_uri);
            // this.showBodyIfClosed = true;
            // this.showOutlineIfClosed = true;
            this.setupRefresh(finalFocus, {
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
    //@+node:felix.20260322234018.1: *4* saveAsLeoFile
    /**
     * * Asks for file name and path, then saves the Leo file
     * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
     * @returns a promise from saving the file results.
     */
    public async saveAsLeoFile(): Promise<unknown> {
        this.triggerBodySave();

        let finalFocus = Focus.NoChange;
        // Get the current focus (body outline, or other will be noChange)
        if (workspace.layout.isOutlineFocused()) {
            finalFocus = Focus.Outline;
        } else if (workspace.layout.isBodyFocused()) {
            finalFocus = Focus.Body;
        }

        const c = g.app.windowList[this.frameIndex].c;

        this.setupRefresh(
            finalFocus,
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
    //@+node:felix.20260322234010.1: *4* saveAsLeoJsFile
    /**
     * * Asks for .leojs file name and path, then saves the JSON Leo file
     * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
     * @returns a promise from saving the file results.
     */
    public async saveAsLeoJsFile(): Promise<unknown> {
        this.triggerBodySave();

        const c = g.app.windowList[this.frameIndex].c;

        let finalFocus = Focus.NoChange;
        // Get the current focus (body outline, or other will be noChange)
        if (workspace.layout.isOutlineFocused()) {
            finalFocus = Focus.Outline;
        } else if (workspace.layout.isBodyFocused()) {
            finalFocus = Focus.Body;
        }

        this.setupRefresh(
            finalFocus,
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
    //@-others
    //@+node:felix.20260322233644.1: *3* switchLeoFile
    /**
     * * Show switch document 'QuickPick' dialog and switch file if selection is made, or just return if no files are opened.
     * @returns A promise that resolves with a textEditor of the selected node's body from the newly selected document
     */
    public async switchLeoFile(): Promise<unknown> {

        this.triggerBodySave();

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
            w_chosenDocument = await workspace.dialog.showQuickPick(w_entries, w_pickOptions) as ChooseDocumentItem | undefined;
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
    //@+node:felix.20260322233602.1: *3* show_find_success
    /**
     * Handle a successful find match.
     */
    public show_find_success(c: Commands, in_headline: boolean, insert: number, p: Position): void {
        // TODO : see focus_to_body !
        // TODO : USE ONLY 'WRAPPER' OR 'WIDGET' like in show_find_success!
        if (in_headline) {
            // edit_widget(p)
            // c.frame.edit_widget(p);
            // console.log('try to set');
            try {
                g.app.gui.set_focus(c, c.frame.tree.edit_widget(p));
            }
            catch (e) {
                console.log('oops!', e);

            }
            // g.app.gui.set_focus(c, { _name: 'tree' });
        } else {
            try {
                g.app.gui.set_focus(c, c.frame.body.widget);
            }
            catch (e) {
                console.log('oops!', e);
            }
        }

        // edit_widget
        // ? needed ?

        // trace = False and not g.unitTesting
        // if in_headline:
        //     if trace:
        //         g.trace('HEADLINE', p.h)
        //     c.frame.tree.widget.select_leo_node(p)
        //     self.focus_to_head(c, p)  # Does not return.
        // else:
        //     w = c.frame.body.widget
        //     row, col = g.convertPythonIndexToRowCol(p.b, insert)
        //     if trace:
        //         g.trace('BODY ROW', row, p.h)
        //     w.cursor_line = row
        //     self.focus_to_body(c)  # Does not return.
    }
    //@+node:felix.20260322233307.1: *3* Leo ID
    /**
        * Show info window about requiring leoID to start
        * and a button to perform the 'set leoID' command.
        */
    public showLeoIDMessage(): void {
        void workspace.dialog.showInformationMessage(
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
        * Start Leo-Web if the ID is valid, and not already started.
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
        * * Returns the leoID from the Leo-Web settings
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
                g.blue('leoID=' + p_leoID);
            }

            if (g.app.nodeIndices) {
                g.app.nodeIndices.userId = p_leoID;
            }
            // If Leo-Web had finish its startup without valid LeoID, set ready flags!
            if (!this.leoStates.leoReady && this.leoStates.leoWebStartupDone && this.leoStates.leoIdUnset) {
                if (g.app.leoID && g.app.leoID !== 'None') {
                    this.createLogPane();
                    this.leoStates.leoIdUnset = false;
                    this.leoStates.leoReady = true;
                    if (g.app.windowList.length) {
                        this.leoStates.fileOpenedReady = true;
                        this.fullRefresh();
                    }
                } else {
                    void workspace.dialog.showInformationMessage("'None' is a reserved LeoID, please choose another one.");
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
            return Promise.resolve(this.config.setLeoWebSettings(w_changes));
        }
        return Promise.resolve();
    }
    //@+node:felix.20260322233253.1: *3* widget_name
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
    //@+node:felix.20260322233248.1: *3* Get & Set Focus
    public set_focus(commander: Commands, widget: any): void {
        this.focusWidget = widget;
        const w_widgetName = this.widget_name(widget);
        // ! TODO: Test if this really works and if check for NoChange is needed, or if we can just always check widget name and set focus type accordingly.
        if (widget && this.finalFocus === Focus.NoChange) {
            // * Check which panel to focus
            let w_target = Focus.NoChange;
            if (w_widgetName === 'body') {
                w_target = Focus.Body;
            } else if (w_widgetName === 'tree') {
                w_target = Focus.Outline;
            }
            this.setupRefresh(w_target);
        } else {
            // pass
        }
    }

    public get_focus(c?: Commands): StringTextWrapper {
        return this.focusWidget!;
    }
    //@+node:felix.20260322233148.1: *3* get1Arg
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
            return workspace.dialog.showQuickPick(itemList, options).then(
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
            return workspace.dialog.showInputDialog(options);
        }
    }
    //@+node:felix.20260322233136.1: *3* get1Char
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
        return workspace.dialog.showSingleCharInputDialog(options);
    }
    //@+node:felix.20260322233127.1: *3* About Leo Dialog
    public runAboutLeoDialog(
        c: Commands | undefined,
        version: string,
        theCopyright: string,
        url: string,
        email: string
    ): Thenable<unknown> {
        return workspace.dialog.showInformationMessage(
            version,
            {
                modal: true,
                detail: theCopyright
            });
    }
    //@+node:felix.20260322232941.1: *3* Ask Dialogs
    public runAskOkDialog(
        c: Commands | undefined,
        title: string,
        message: string,
        text = "Ok"
    ): Thenable<unknown> {
        return workspace.dialog.showInformationMessage(
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

        return workspace.dialog
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

        return workspace.dialog
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
    //@+node:felix.20260322232836.1: *3* File Dialogs
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
        return workspace.dialog.showOpenDialog(
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
        return workspace.dialog.showOpenDialog(
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
        return workspace.dialog.showSaveDialog(
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
    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4
//@-leo
