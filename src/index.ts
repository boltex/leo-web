/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor
 */

import './style.css';

import { LeoModel } from './LeoModel';
import { LeoView } from './LeoView';
import { LeoController } from './LeoController';

import { LeoEditor } from './LeoEditor';
class LeoWebApp {
    private editor: LeoEditor;

    private model!: LeoModel;
    private view!: LeoView;
    private controller!: LeoController;

    constructor() {
        this.editor = new LeoEditor();
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

    private setupApp(): void {
        this.editor.handleDOMContentLoaded();

        // TODO : Uncomment when MVC components are ready
        // // Initialize the MVC components
        // this.model = new LeoModel();
        // this.view = new LeoView();
        // this.controller = new LeoController(this.model, this.view);

        // // Initialize the application
        // this.controller.initialize();
    }

}

// Initialize the application
new LeoWebApp();