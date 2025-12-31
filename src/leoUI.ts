import { NullGui } from "./core/leoGui";
import * as g from './core/leoGlobals';
import { Constants } from "./constants";
import { LeoStates } from "./leoStates";
import { IdleTime } from "./core/idle_time";
import * as utils from "./utils";
import { workspace } from "./workspace";

/**
 * Creates and manages instances of the UI elements along with their events
 */
export class LeoUI extends NullGui {

    public leoStates: LeoStates;
    // * Log Pane
    protected _leoLogPane: boolean = false;
    private _currentOutlineTitle: string = "";

    constructor(guiName = 'browserGui') {
        super(guiName);
        console.log('LeoUI initialized with gui:', guiName);
        this.isNullGui = false;

        this.idleTimeClass = IdleTime;

        // * Setup States
        this.leoStates = new LeoStates(this);
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

    /**
     * * Setup UI for having no opened Leo documents
     */
    private _setupNoOpenedLeoDocument(): void {

        this.leoStates.fileOpenedReady = false;

    }

    /**
     * * A Leo file was opened: setup UI accordingly.
     */
    private _setupOpenedLeoDocument(): void {

        const c = g.app.windowList[this.frameIndex].c;
        this.leoStates.leoOpenedFileName = c.fileName();
        this.leoStates.leoChanged = c.changed;

        // * Startup flag
        if (!this.leoStates.leoIdUnset && g.app.leoID !== 'None') {
            this.leoStates.fileOpenedReady = true;
        }
    }

}