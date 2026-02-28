/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor
 */

import './style.css';
import * as g from './core/leoGlobals';
import { LeoApp, LoadManager } from './core/leoApp';

import { LeoController } from './controller';
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

        // Initialize the components
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

        const controller = new LeoController();
        workspace.setController(controller);

        await controller.initialize();

        // Ok, now properly start the app
        const w_start = process.hrtime(); // For calculating total startup time duration
        (g.workspaceUri as Uri) = new Uri('/');
        // #1472: bind to g immediately.
        (g.app as LeoApp) = new LeoApp();

        g.app.loadManager = new LoadManager();
        await g.app.loadManager.load();
        console.log(`leo-web startup launched in ${utils.getDurationMs(w_start)} ms`);

    }

}

// Initialize the application
new LeoWebApp();