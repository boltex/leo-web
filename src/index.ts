/**
 * Leo Web Editor - Main Entry Point
 * A web-based version of the Leo Editor, a structured document editor
 */

import './styles.css';
import { LeoEditor } from './leo/LeoEditor';

class LeoWebApp {
    private editor: LeoEditor;

    constructor() {
        this.editor = new LeoEditor();
        this.init();
    }

    private init(): void {
        console.log('Leo Web Editor initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    private setupApp(): void {
        console.log('Setting up Leo Web Editor application...');

        // Update status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Leo Web Editor initialized successfully!';
        }

        // Initialize the Leo editor
        this.editor.initialize();

        console.log('Leo Web Editor ready!');
    }
}

// Initialize the application
new LeoWebApp();