/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor
 */

import './style.css';
import { LeoEditor } from './leo/LeoEditor';

class LeoWebApp {

    private editor: LeoEditor;

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
        // Initialize the Leo editor
        this.editor.handleDOMContentLoaded();
    }

}

// Initialize the application
new LeoWebApp();