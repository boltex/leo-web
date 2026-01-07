import { NullGui } from "./core/leoGui";
import * as g from './core/leoGlobals';
import { Constants } from "./constants";
import { LeoStates } from "./leoStates";
import { IdleTime } from "./core/idle_time";
import * as utils from "./utils";
import { Uri, workspace } from "./workspace";
import { Commands } from "./core/leoCommands";
import { ConfigSetting, QuickPickItem } from "./types";
import { StringTextWrapper } from "./core/leoFrame";

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
    }

    /**
 * * Invokes the commander.save() command
 * @param p_fromOutlineSignifies that the focus was, and should be brought back to, the outline
 * @returns Promise that resolves when the save command is done
 */
    public async saveLeoFile(p_fromOutline?: boolean): Promise<unknown> {
        // TODO : MAYBE TRIGGER BODY SAVE?
        // await this.triggerBodySave(true);

        const c = g.app.windowList[this.frameIndex].c;

        await c.save();

        // TODO: MAYBE REMOVE THIS CODE FROM LEOJS LATER?
        // setTimeout(() => {
        //     this.setupRefresh(
        //         p_fromOutline ? Focus.Outline : Focus.Body,
        //         {
        //             tree: true,
        //             states: true,
        //             documents: true
        //         }
        //     );
        //     void this.launchRefresh();
        // });

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
    ): Thenable<string | undefined | null> {
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
        // TODO !
        console.log(' TODO: implement get1Char dialog');
        return Promise.resolve('');
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