//@+leo-ver=5-thin
//@+node:felix.20260504161016.1: * @file src/clipboard-manager.ts
import { workspace } from "./workspace";

interface ClipboardState {
    internalText: string;
    systemAvailable: boolean;
    secureContext: boolean;
    permissionRead: PermissionState | 'unknown';
    permissionWrite: PermissionState | 'unknown';
    lastSyncFailed: boolean;
}

export class ClipboardManager {
    private state: ClipboardState;

    private hasWarnedReadFailure = false;
    private hasWarnedWriteFailure = false;
    private listenerAdded = false;

    constructor() {
        this.state = {
            internalText: '',
            systemAvailable: false,
            secureContext: false,
            permissionRead: 'unknown',
            permissionWrite: 'unknown',
            lastSyncFailed: false,
        };
    }

    // To be called by the workspace when initializing, after getting workspace permissions.
    public initialize(): void {
        this.state.systemAvailable =
            typeof navigator !== 'undefined' &&
            !!navigator.clipboard;

        this.state.secureContext =
            typeof window !== 'undefined' &&
            window.isSecureContext;

        // Permission probing is async and browser-dependent.
        // Fire-and-forget is appropriate here.
        void this._detectClipboardCapabilities();
    }

    public getClipboardState(): ClipboardState {
        return { ...this.state };
    }

    public getInternalClipboard(): string {
        return this.state.internalText;
    }

    public setInternalClipboard(text: string): void {
        this.state.internalText = text;
    }

    public async writeClipboardText(text: string): Promise<void> {

        // Set internal clipboard immediately to avoid data loss, even if system clipboard write fails.
        this.setInternalClipboard(text);

        try {
            await navigator.clipboard.writeText(text);
            this.state.lastSyncFailed = false;
        } catch (err) {
            this.state.lastSyncFailed = true;
            this._logClipboardFailure('write', err);

            if (!this.hasWarnedWriteFailure) {
                this.hasWarnedWriteFailure = true;
                const message = this._getClipboardFailureMessage('write', err);
                void workspace.dialog.showInformationMessage(
                    'System Clipboard Unavailable.',
                    { modal: true, detail: message }
                );
            }

        }
    }

    public async readClipboardText(): Promise<string> {
        try {
            const text = await navigator.clipboard.readText();

            this.setInternalClipboard(text);
            this.state.lastSyncFailed = false;

            return text;
        } catch (err) {
            this.state.lastSyncFailed = true;
            this._logClipboardFailure('read', err);

            if (!this.hasWarnedReadFailure) {
                this.hasWarnedReadFailure = true;
                const message = this._getClipboardFailureMessage('read', err);
                void workspace.dialog.showInformationMessage(
                    'System Clipboard Unavailable.',
                    { modal: true, detail: message }
                );
            }

            return this.getInternalClipboard();
        }
    }

    private _getClipboardFailureMessage(operation: 'read' | 'write', error: unknown): string {

        const reason = this._getClipboardFailureReason(operation, error);

        const internalNote = 'Internal copy/paste still works, but not with other apps.';

        const fixHint = this._getClipboardPermissionHint();

        return `${reason} ${internalNote}\n\n${fixHint}`;
    }

    private _getClipboardPermissionHint(): string {
        // Chrome-focused guidance (also valid enough for most Chromium browsers).
        const chromeSteps =
            'Click the leftmost icon inside the address bar ("View site information"), set Clipboard permission to "Allowed", then reload this page.';

        if (!this.state.secureContext) {
            return `Open this app over HTTPS or localhost, then retry. ${chromeSteps}`;
        }

        return chromeSteps;
    }

    private _getClipboardFailureReason(operation: 'read' | 'write', error: unknown): string {
        if (error instanceof DOMException) {
            switch (error.name) {
                case 'NotAllowedError':
                    return `Browser denied clipboard ${operation} access.`;
                case 'SecurityError':
                    return 'Clipboard API requires HTTPS or localhost.';
                case 'NotFoundError':
                    return `Clipboard ${operation} data was not available.`;
            }
        }

        return this._getClipboardUnavailableReason();
    }

    private _describeClipboardError(error: unknown): string {
        if (error instanceof DOMException) {
            return `${error.name}: ${error.message}`;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    private _logClipboardFailure(operation: 'read' | 'write', error: unknown): void {
        console.warn(
            `[ClipboardManager] ${operation} failed`,
            {
                secureContext: this.state.secureContext,
                systemAvailable: this.state.systemAvailable,
                permissionRead: this.state.permissionRead,
                permissionWrite: this.state.permissionWrite,
                error: this._describeClipboardError(error),
                rawError: error,
            }
        );
    }

    private async _detectClipboardCapabilities(): Promise<void> {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            this.state.systemAvailable = false;
            return;
        }
        if (navigator.permissions?.query) {
            try {
                const readPerm = await navigator.permissions.query({
                    name: 'clipboard-read' as PermissionName
                });
                this.state.permissionRead = readPerm.state;
            } catch {
                this.state.permissionRead = 'unknown';
            }
            try {
                const writePerm = await navigator.permissions.query({
                    name: 'clipboard-write' as PermissionName
                });
                this.state.permissionWrite = writePerm.state;
            } catch {
                this.state.permissionWrite = 'unknown';
            }
        } else {
            this.state.permissionRead = 'unknown';
            this.state.permissionWrite = 'unknown';
        }

        // Keep this logic running even when Permissions API is missing.
        if (!this.state.systemAvailable || !this.state.secureContext) {
            const message = this._getClipboardUnavailableReason();
            void workspace.dialog.showInformationMessage(
                'Clipboard API may be unavailable.',
                { detail: message }
            );
        } else {
            try {
                if (!this.listenerAdded) {
                    navigator.clipboard.addEventListener('clipboardchange', () => {
                        void this.readClipboardText();
                    });
                    this.listenerAdded = true;
                }
            } catch (e) {
                console.warn('Clipboard API not available, clipboard change events will not be detected.', e);
            }
        }
    }

    private _getClipboardUnavailableReason(): string {
        if (!this.state.secureContext) {
            return 'Clipboard API requires HTTPS or localhost.';
        }

        if (!this.state.systemAvailable) {
            return 'Clipboard API is not supported by this browser.';
        }

        return 'Browser blocked clipboard access.';
    }
}
//@-leo
