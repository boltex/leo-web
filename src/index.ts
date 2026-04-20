//@+leo-ver=5-thin
//@+node:felix.20260320222223.1: * @file src/index.ts
import './style.css';
import * as g from './core/leoGlobals';
import { LeoApp, LoadManager } from './core/leoApp';

import { Controller } from './controller';
import { Uri, workspace } from "./workspace";
import * as utils from "./utils";
import { DialogManager } from './dialog-manager';
import { MenuManager } from './menu-manager';
import { LayoutManager } from './layout-manager';
import { OutlineManager } from './outline-manager';
import { BodyManager } from './body-manager';
import { LogPaneManager } from './log-pane-manager';
process.hrtime = require('browser-process-hrtime'); // Overwrite 'hrtime' of process

class LeoWebApp {

    constructor() {

        window.addEventListener('load', () => {
            document.body.classList.add('loaded'); // Sets opacity to 1 (was 0 to prevent FOUC)
            document.documentElement.classList.add('loaded'); // Resets background (was gray to prevent FOUC)
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    private async setupApp(): Promise<void> {

        const dialog = new DialogManager();
        workspace.setDialogManager(dialog);

        const menu = new MenuManager();
        workspace.setMenuManager(menu);

        const layout = new LayoutManager();
        workspace.setLayoutManager(layout);

        const outline = new OutlineManager();
        workspace.setOutlineView(outline);

        const body = new BodyManager();
        workspace.setBodyView(body);

        const logPane = new LogPaneManager();
        workspace.setLogPaneView(logPane);

        const controller = new Controller();
        workspace.setController(controller);
        await controller.initialize();

        const w_start = process.hrtime();
        (g.workspaceUri as Uri) = new Uri('/');
        // #1472: bind to g immediately.
        (g.app as LeoApp) = new LeoApp();

        g.app.loadManager = new LoadManager();
        await g.app.loadManager.load();
        console.log(`leo-web startup launched in ${utils.getDurationMs(w_start)} ms`);

    }

}

new LeoWebApp(); // Initialize the application
//@-leo
