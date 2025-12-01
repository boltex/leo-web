/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor
 */

import './style.css';

import { LeoModel } from './LeoModel';
import { LeoView } from './LeoView';
import { LeoController } from './LeoController';

class LeoWebApp {

    private model!: LeoModel;
    private view!: LeoView;
    private controller!: LeoController;

    constructor() {
        this.init();
    }

    private init(): void {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    private async setupApp(): Promise<void> {

        // Initialize the MVC components
        this.model = new LeoModel();
        this.view = new LeoView();
        this.controller = new LeoController(this.model, this.view);
        this.controller.initialize();

        // this.controller = new LeoController(this.model, this.view);
        const dirHandle = await this.view.requestWorkspaceDirectory();
        // this.model.setWorkspace(dirHandle);
        console.log('Workspace directory selected:', dirHandle);
        this.view.hideWorkspaceDialog();

        // Continue bootstrapping: Initialize controller after workspace is set
        this.controller.initializeInteractions();
    }

}

// Initialize the application
new LeoWebApp();