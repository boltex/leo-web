/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor
 */

import './style.css';

import * as g from './core/leoGlobals';
import { LeoApp, LoadManager } from './core/leoApp';

import { LeoModel } from './LeoModel';
import { LeoView } from './LeoView';
import { LeoController } from './LeoController';
import { Uri, workspace } from "./workspace";
import * as utils from "./utils";
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

        console.log('Leo Web UI initialized.');

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