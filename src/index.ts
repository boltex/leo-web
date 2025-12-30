/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor
 */

import './style.css';

import * as g from './core/leoGlobals';
import { LeoApp, LoadManager, PreviousSettings } from './core/leoApp';

import { LeoModel } from './LeoModel';
import { LeoView } from './LeoView';
import { LeoController } from './LeoController';
import { Uri, workspace } from "./workspace";
import * as utils from "./utils";
import { ScriptingController } from './core/mod_scripting';
process.hrtime = require('browser-process-hrtime'); // Overwrite 'hrtime' of process

class LeoWebApp {

    private model!: LeoModel;
    private view!: LeoView;
    private controller!: LeoController;

    constructor() {
        this.init();
    }

    private init(): void {

        // Wait for all resources to be loaded before removing the gray 'loading screen'
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
            document.documentElement.classList.add('loaded');
        });

        // Wait for DOM to be ready to setup the app
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }

    }

    private async setupApp(): Promise<void> {

        // Initialize the MVC components
        this.model = new LeoModel(); // The model will ultimately be the same core as LeoJS

        this.view = new LeoView();
        this.controller = new LeoController(this.model, this.view);
        workspace.setView(this.view);

        await this.controller.initialize();

        // Test out UI experiments (if any)
        await this.uiExperiments();

        console.log('Leo Web UI initialized.');

        // Ok, now properly start the app
        const w_start = process.hrtime(); // For calculating total startup time duration
        (g.workspaceUri as Uri) = new Uri('/');
        // #1472: bind to g immediately.
        (g.app as LeoApp) = new LeoApp();

        g.app.loadManager = new LoadManager();
        await g.app.loadManager.load();
        console.log(`leo-web startup launched in ${utils.getDurationMs(w_start)} ms`);

        // Now test the Leo code itself by creating a new commander, inserting a node, change its headeline/body, and printing the outline to console.
        // TODO.
        // For now, check if the startup created any commanders (windows).
        g.app.disable_redraw = true;
        const lm = g.app.loadManager;
        const c = g.app.newCommander('', g.app.gui, new PreviousSettings(lm.globalSettingsDict, lm.globalBindingsDict));
        lm.createMenu(c);
        lm.finishOpen(c);
        g.doHook('new', { old_c: undefined, c: c, new_c: c });
        c.theScriptingController = new ScriptingController(c);
        await c.theScriptingController.createAllButtons();
        // c.setLog();
        c.clearChanged(); // Fix #387: Clear all dirty bits.
        g.app.disable_redraw = false;
        console.log('Done creating first commander.', c);

    }

    private async uiExperiments(): Promise<void> {

        // // 1 - TEST OPEN FILE DIALOG
        // const chosenFileHandle: FileSystemFileHandle | null = await view.showOpenDialog();
        // console.log('Chosen OPEN FILE handle:', chosenFileHandle);
        // if (chosenFileHandle) {
        //     const resolveResult = await workspace.getWorkspaceDirHandle()?.resolve(chosenFileHandle!);
        //     console.log('Resolves to:', resolveResult);
        // } else {
        //     console.log('No file chosen in OPEN dialog');
        // }

        // // 2 - TEST THE SAVE DIALOG
        // const saveFileHandle: FileSystemFileHandle | null = await view.showSaveDialog();
        // console.log('Chosen SAVE FILE handle:', saveFileHandle);
        // if (saveFileHandle) {
        //     const resolveResult = await workspace.getWorkspaceDirHandle()?.resolve(saveFileHandle!);
        //     console.log('Resolves to:', resolveResult);
        // } else {
        //     console.log('No file chosen in SAVE dialog');
        // }

        // // 3 - TEST INPUT DIALOG
        // const inputResult = await view.showInputDialog({
        //     title: "Input Dialog Test",
        //     prompt: "Please enter some text:",
        //     value: "Default value",
        //     placeholder: "Type here..."
        // });
        // console.log("Input dialog result:", inputResult);

        // // 4 - TEST QUICK PICK DIALOG (for minibuffer, command-palette, etc.)
        // const items: QuickPickItem[] = [
        //     { label: "Option 1", description: "The first option" },
        //     { label: "Option 2", description: "The second option", detail: "Additional details about option 2" },
        //     { label: "", kind: QuickPickItemKind.Separator },
        //     { label: "Option 3", description: "The third option after a separator", detail: "More details here but super long to make sure it does not wrap and end with ellipsis blablabla im super long blablablabl" },
        //     { label: "Option 4", description: "some other option", detail: "Detailed description for option 4 goes here." },
        //     { label: "Option 5", description: "some other option with a longer descriptions blablabla blabla, blablabla..." },
        //     { label: "Option 6 with longer title", description: "some other option" },
        //     { label: "Option 7 with extra long title to make sure it does not wrap and end with ellipsis", description: "some other option" },
        //     { label: "Option 8", description: "some other option" },
        //     { label: "Option 9", description: "some other option but super long to make sure it does not wrap and end with ellipsis blablabla im super long blablablabl" },
        //     { label: "Option 10", description: "some other option" },
        //     { label: "Option 11", description: "some other option" },
        //     { label: "Option 12", description: "some other option" },
        // ];
        // const result = await view.showQuickPick(items, {
        //     title: "Quick Pick Dialog Test",
        //     placeHolder: "Select an option",
        //     onDidSelectItem: (item) => {
        //         console.log("Highlighted item:", item);
        //     }
        // });
        // console.log("Quick pick result:", result);

    }

}

// Initialize the application
new LeoWebApp();