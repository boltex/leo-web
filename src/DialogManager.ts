import { OpenDialogOptions, SaveDialogOptions, InputDialogOptions, MessageOptions, QuickPickItem, QuickPickOptions } from './types';
import { Uri, workspace } from './workspace';

type QuickPickInternalItem = QuickPickItem & { renderedLabel?: string };

/**
 * Manages all dialog interactions for the Leo Web application.
 * Handles message dialogs, input dialogs, quick pick, and file picker dialogs.
 * Maintains a queue to ensure only one dialog is shown at a time.
 */
export class DialogManager {
    // DOM Elements for dialogs
    private HTML_ELEMENT: HTMLElement;
    private MODAL_DIALOG_TITLE: HTMLElement;
    private MODAL_DIALOG_DESCRIPTION: HTMLElement;
    private MODAL_DIALOG_BTN_CONTAINER: HTMLElement;
    private INPUT_DIALOG_TITLE: HTMLElement;
    private INPUT_DIALOG_DESCRIPTION: HTMLElement;
    private INPUT_DIALOG_INPUT: HTMLInputElement;
    private INPUT_DIALOG_BTN: HTMLButtonElement;
    private QUICKPICK_DIALOG_INPUT: HTMLInputElement;
    private QUICKPICK_DIALOG_LIST: HTMLElement;

    // Dialog state management
    private __dialogQueue: Array<{
        type: 'message' | 'input' | 'singleChar' | 'quickPick' | 'openFile' | 'saveFile';
        message?: string;
        options?: MessageOptions;
        items?: string[];
        inputOptions?: InputDialogOptions;
        quickPickItems?: QuickPickItem[];
        quickPickOptions?: QuickPickOptions;
        openDialogOptions?: OpenDialogOptions;
        saveDialogOptions?: SaveDialogOptions;
        resolve: (value: any) => void;
    }> = [];
    public isDialogOpen = false;

    private __activeFocusTrap: (() => void) | null = null;
    private __preDialogFocusedElement: HTMLElement | null = null;

    // Callback for showing toasts
    private showToastCallback: ((message: string, duration: number) => void) | null = null;

    constructor(htmlElement: HTMLElement) {
        this.HTML_ELEMENT = htmlElement;

        // Get DOM element references
        this.MODAL_DIALOG_TITLE = document.getElementById('message-dialog-title')!;
        this.MODAL_DIALOG_DESCRIPTION = document.getElementById('message-dialog-description')!;
        this.MODAL_DIALOG_BTN_CONTAINER = document.getElementById('modal-dialog-btn-container')!;
        this.INPUT_DIALOG_TITLE = document.getElementById('input-dialog-title')!;
        this.INPUT_DIALOG_DESCRIPTION = document.getElementById('input-dialog-description')!;
        this.INPUT_DIALOG_INPUT = document.getElementById('input-dialog-input') as HTMLInputElement;
        this.INPUT_DIALOG_BTN = document.getElementById('input-dialog-btn') as HTMLButtonElement;
        this.QUICKPICK_DIALOG_INPUT = document.getElementById('quickpick-dialog-input') as HTMLInputElement;
        this.QUICKPICK_DIALOG_LIST = document.getElementById('quickpick-dialog-list')!;
    }

    /**
     * Set a callback to show toast messages (for file dialog errors)
     */
    public setShowToastCallback(callback: (message: string, duration: number) => void): void {
        this.showToastCallback = callback;
    }

    /**
     * Get the last quick pick input value
     */
    public getLastQuickPickInput(): string | undefined {
        return this.QUICKPICK_DIALOG_INPUT.value;
    }

    /**
     * Show a message dialog with optional buttons
     */
    public showMessageDialog(
        message: string, options?: MessageOptions, ...items: string[]
    ): Thenable<string | undefined> {
        return new Promise<string | undefined>((resolve) => {
            this.__dialogQueue.push({
                type: 'message',
                message,
                options,
                items,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    /**
     * Show an input dialog for text entry
     */
    public async showInputDialog(options: InputDialogOptions): Promise<string | undefined> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'input',
                inputOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    /**
     * Show an input dialog that accepts a single character
     */
    public showSingleCharInputDialog(options: InputDialogOptions): Promise<string | undefined> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'singleChar',
                inputOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    /**
     * Show a quick pick dialog with searchable items
     */
    public async showQuickPick(items: QuickPickItem[], options?: QuickPickOptions): Promise<QuickPickItem | undefined> {
        if (!items || items.length === 0) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'quickPick',
                quickPickItems: items,
                quickPickOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    /**
     * Show a native file open dialog
     */
    public async showOpenDialog(options?: OpenDialogOptions): Promise<Uri[] | null> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'openFile',
                openDialogOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    /**
     * Show a native file save dialog
     */
    public async showSaveDialog(options?: SaveDialogOptions): Promise<Uri | null> {
        return new Promise((resolve) => {
            this.__dialogQueue.push({
                type: 'saveFile',
                saveDialogOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }

    private _restorePreDialogFocus(): void {
        if (this.__preDialogFocusedElement && this.__preDialogFocusedElement['focus']) {
            // Check if another dialog did not instantly open and capture focus again
            if (this.isDialogOpen) {
                return;
            }
            // Check if element is still in DOM and visible
            const rect = this.__preDialogFocusedElement!.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && document.body.contains(this.__preDialogFocusedElement!)) {
                this.__preDialogFocusedElement!.focus();
            }
            this.__preDialogFocusedElement = null;
        }
    }

    private _processDialogQueue(): void {
        if (this.__dialogQueue.length === 0 || this.isDialogOpen) {
            return;
        }

        // Capture the currently focused element before opening the dialog
        if (!this.__preDialogFocusedElement && document.activeElement instanceof HTMLElement) {
            this.__preDialogFocusedElement = document.activeElement;
        }

        this.isDialogOpen = true;
        const dialog = this.__dialogQueue.shift()!;

        switch (dialog.type) {
            case 'message':
                this._showMessageDialogInternal(dialog);
                break;
            case 'input':
                this._showInputDialogInternal(dialog);
                break;
            case 'singleChar':
                this._showSingleCharInputDialogInternal(dialog);
                break;
            case 'quickPick':
                this._showQuickPickInternal(dialog);
                break;
            case 'openFile':
                this._showOpenDialogInternal(dialog);
                break;
            case 'saveFile':
                this._showSaveDialogInternal(dialog);
                break;
        }
    }

    private _showMessageDialogInternal(dialog: any): void {
        this.HTML_ELEMENT.setAttribute('data-show-message-dialog', 'true');

        this.MODAL_DIALOG_TITLE.textContent = dialog.message;
        this.MODAL_DIALOG_DESCRIPTION.textContent = dialog.options?.detail ?? '';

        const buttonLabels = dialog.items && dialog.items.length > 0 ? dialog.items : ['OK'];

        this.MODAL_DIALOG_BTN_CONTAINER.innerHTML = '';
        let firstButton: HTMLButtonElement | null = null;

        buttonLabels.forEach((label: string) => {
            const btn = document.createElement('button');
            if (!firstButton) {
                firstButton = btn;
            }
            btn.textContent = label;
            btn.className = 'modal-dialog-btn';
            btn.onclick = () => {
                this._cleanupFocusTrap();
                this.HTML_ELEMENT.setAttribute('data-show-message-dialog', 'false');
                this.isDialogOpen = false;
                this._restorePreDialogFocus();
                dialog.resolve(label);
                setTimeout(() => this._processDialogQueue(), 100);
            };
            this.MODAL_DIALOG_BTN_CONTAINER.appendChild(btn);
        });

        // Get the modal dialog container element
        const modalDialog = document.querySelector('#message-dialog') as HTMLElement;
        if (modalDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(modalDialog);
        }

        if (firstButton) {
            setTimeout(() => {
                firstButton!.focus();
            }, 0);
        }
    }

    private _showInputDialogInternal(dialog: any): void {
        const options = dialog.inputOptions;
        this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'true');
        this.INPUT_DIALOG_TITLE.textContent = options.title;
        this.INPUT_DIALOG_DESCRIPTION.textContent = options.prompt;
        this.INPUT_DIALOG_INPUT.value = options.value || '';
        this.INPUT_DIALOG_INPUT.placeholder = options.placeholder || '';

        if (options.value) {
            setTimeout(() => {
                this.INPUT_DIALOG_INPUT.select();
            }, 0);
        }

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            this.isDialogOpen = false;
            this._restorePreDialogFocus();
            dialog.resolve(inputValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.INPUT_DIALOG_BTN.textContent = 'OK';
        this.INPUT_DIALOG_BTN.onclick = inputCallback;
        this.INPUT_DIALOG_INPUT.onkeydown = (e) => {
            if (e.key === 'Enter') {
                inputCallback();
            }
        };

        // Set up focus trap
        const inputDialog = document.querySelector('#input-dialog') as HTMLElement;
        if (inputDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(inputDialog);
        }

        setTimeout(() => {
            this.INPUT_DIALOG_INPUT.focus();
        }, 0);
    }

    private _showSingleCharInputDialogInternal(dialog: any): void {
        const options = dialog.inputOptions;
        this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'true');
        this.INPUT_DIALOG_TITLE.textContent = options.title;
        this.INPUT_DIALOG_DESCRIPTION.textContent = options.prompt;
        this.INPUT_DIALOG_INPUT.value = options.value || '';
        this.INPUT_DIALOG_INPUT.placeholder = options.placeholder || '';

        // Add 'hidden-button' class to OK button since we don't need it for single char input
        this.INPUT_DIALOG_BTN.classList.add('hidden-button');

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            this.isDialogOpen = false;
            this._restorePreDialogFocus();
            // Remove the 'hidden-button' class from OK button for future dialogs
            this.INPUT_DIALOG_BTN.classList.remove('hidden-button');
            dialog.resolve(inputValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.INPUT_DIALOG_INPUT.oninput = () => {
            if (this.INPUT_DIALOG_INPUT.value.length >= 1) {
                this.INPUT_DIALOG_INPUT.value = this.INPUT_DIALOG_INPUT.value.charAt(0);
                inputCallback();
            }
        };

        // Set up focus trap
        const inputDialog = document.querySelector('#input-dialog') as HTMLElement;
        if (inputDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(inputDialog);
        }

        setTimeout(() => {
            this.INPUT_DIALOG_INPUT.focus();
        }, 0);
    }

    private _showQuickPickInternal(dialog: any): void {
        const items: QuickPickItem[] = dialog.quickPickItems;
        const options = dialog.quickPickOptions;

        this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'true');

        this.QUICKPICK_DIALOG_INPUT.placeholder = options?.placeHolder || '';
        this.QUICKPICK_DIALOG_INPUT.value = '';

        let filteredItems: QuickPickItem[] = [...items];
        let selectedIndex = -1;

        for (let i = 0; i < items.length; i++) {
            if (items[i]!.picked) {
                selectedIndex = i;
                break;
            }
        }
        if (selectedIndex === -1) {
            for (let i = 0; i < items.length; i++) {
                if (items[i]!.kind !== -1) {
                    selectedIndex = i;
                    break;
                }
            }
        }

        const renderList = () => {
            this.QUICKPICK_DIALOG_LIST.innerHTML = '';

            if (filteredItems.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No results';
                li.style.fontStyle = 'italic';
                li.style.color = 'var(--find-placeholder-color)';
                li.style.cursor = 'default';
                li.style.pointerEvents = 'none';
                this.QUICKPICK_DIALOG_LIST.appendChild(li);
                return;
            }

            filteredItems.forEach((item, index) => {
                const li = document.createElement('li');

                if (item.kind === -1) {
                    li.classList.add('separator');
                    this.QUICKPICK_DIALOG_LIST.appendChild(li);
                    return;
                }

                const labelSpan = document.createElement('span');
                labelSpan.className = 'quick-pick-label';
                if ((item as QuickPickInternalItem).renderedLabel) {
                    labelSpan.innerHTML = (item as QuickPickInternalItem).renderedLabel!;
                } else {
                    labelSpan.textContent = item.label;
                }

                li.appendChild(labelSpan);

                if (item.description) {
                    const descSpan = document.createElement('span');
                    descSpan.className = 'quick-pick-description';
                    descSpan.textContent = item.description;
                    li.appendChild(descSpan);
                }

                if (item.detail) {
                    const detailDiv = document.createElement('div');
                    detailDiv.className = 'quick-pick-detail';
                    detailDiv.textContent = item.detail;
                    li.appendChild(detailDiv);
                }

                if (index === selectedIndex) {
                    li.classList.add('selected');
                    setTimeout(() => {
                        li.scrollIntoView({ block: 'nearest', behavior: this.QUICKPICK_DIALOG_INPUT.value ? 'smooth' : 'instant' });
                    }, 0);
                }

                li.onclick = () => {
                    this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'false');
                    this.isDialogOpen = false;
                    this._restorePreDialogFocus();
                    if (options?.onDidSelectItem) {
                        options.onDidSelectItem(item);
                    }
                    dialog.resolve(item);
                    setTimeout(() => this._processDialogQueue(), 100);
                };

                this.QUICKPICK_DIALOG_LIST.appendChild(li);
            });
        };

        const filterItems = () => {
            const filterText = this.QUICKPICK_DIALOG_INPUT.value.toLowerCase().trim();

            if (!filterText) {
                items.forEach(item => {
                    (item as QuickPickInternalItem).renderedLabel = undefined;
                });
                filteredItems = [...items];
            } else {
                filteredItems = items.filter(item => {
                    if (item.kind === -1) {
                        return false;
                    }
                    if (item.alwaysShow) {
                        return true;
                    }
                    const labelMatch = item.label.toLowerCase().includes(filterText);

                    // Build renderedLabel with <mark> tags around the first instance of the match
                    if (labelMatch) {
                        const regex = new RegExp(`(${filterText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'i');
                        (item as QuickPickInternalItem).renderedLabel = item.label.replace(regex, '<mark>$1</mark>');
                    } else {
                        (item as QuickPickInternalItem).renderedLabel = undefined;
                    }

                    const descMatch = item.description?.toLowerCase().includes(filterText) || false;
                    const detailMatch = item.detail?.toLowerCase().includes(filterText) || false;
                    return labelMatch || descMatch || detailMatch;
                });
            }

            // Sort filtered items: prioritize items which label start with filterText
            filteredItems.sort((a, b) => {
                if (a.kind === -1 || b.kind === -1) return 0;
                if (a.alwaysShow && b.alwaysShow) return 0;
                if (a.alwaysShow) return -1;
                if (b.alwaysShow) return 1;

                const aLabel = a.label.toLowerCase();
                const bLabel = b.label.toLowerCase();
                const aStartsWith = aLabel.startsWith(filterText);
                const bStartsWith = bLabel.startsWith(filterText);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                return 0;
            });

            selectedIndex = -1;
            for (let i = 0; i < filteredItems.length; i++) {
                if (filteredItems[i]!.kind !== -1) {
                    selectedIndex = i;
                    break;
                }
            }

            renderList();
        };

        const closeDialog = (returnValue: QuickPickItem | string | null) => {
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'false');
            this.isDialogOpen = false;
            this._restorePreDialogFocus();
            this.QUICKPICK_DIALOG_INPUT.onkeydown = null;
            this.QUICKPICK_DIALOG_INPUT.oninput = null;
            dialog.resolve(returnValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.QUICKPICK_DIALOG_INPUT.onkeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        if (options?.onDidSelectItem) {
                            options.onDidSelectItem(selectedItem);
                        }
                        closeDialog(selectedItem);
                    }
                } else {
                    closeDialog(null);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                for (let i = selectedIndex + 1; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                renderList();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                for (let i = selectedIndex - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                renderList();
            } else if (e.key === 'PageDown') {
                e.preventDefault();
                let count = 0;
                for (let i = selectedIndex + 1; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        count++;
                        if (count >= 5) break;
                    }
                }
                renderList();
            } else if (e.key === 'PageUp') {
                e.preventDefault();
                let count = 0;
                for (let i = selectedIndex - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        count++;
                        if (count >= 5) break;
                    }
                }
                renderList();
            } else if (e.key === 'Tab') {
                e.preventDefault();
            }
        };

        this.QUICKPICK_DIALOG_INPUT.oninput = () => {
            filterItems();
        };

        renderList();

        // Set up focus trap
        const quickPickDialog = document.querySelector('#quickpick-dialog') as HTMLElement;
        if (quickPickDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(quickPickDialog);
        }

        setTimeout(() => {
            this.QUICKPICK_DIALOG_INPUT.focus();
        }, 0);
    }

    private async _showOpenDialogInternal(dialog: any): Promise<void> {
        const options = dialog.openDialogOptions;

        try {
            // Build proper options for window.showOpenFilePicker from OpenDialogOptions
            const properOptions: OpenFilePickerOptions = {
                multiple: options?.canSelectMany ?? false,
                excludeAcceptAllOption: false,
            };

            // Add file type filters if provided
            if (options?.filters && Object.keys(options.filters).length > 0) {
                const types: FilePickerAcceptType[] = [];

                for (const [description, extensions] of Object.entries(options.filters as { [name: string]: string[] })) {
                    // Skip "all files" filter - browser provides this by default
                    if (extensions.includes('.*') || extensions.includes('*')) {
                        continue;
                    }

                    // Use a unique MIME type per filter to prevent extension mixing
                    types.push({
                        description,
                        accept: {
                            [`application/${description.toLowerCase().replace(/\s+/g, '-')}`]: extensions.map(ext =>
                                ext.startsWith('.') ? ext : `.${ext}`
                            ) as `.${string}`[]
                        }
                    });
                }

                if (types.length > 0) {
                    properOptions.types = types;
                }
            }

            // Set start location if defaultUri is provided
            if (options?.defaultUri) {
                properOptions.startIn = 'documents';
            }

            const fileHandles = await window.showOpenFilePicker(properOptions);

            // Check that all chosen files are inside the workspace directory
            const workspaceDir = workspace.getWorkspaceDirHandle();
            const uris: Uri[] = [];

            for (const fileHandle of fileHandles) {
                if (workspaceDir) {
                    const result = await workspaceDir.resolve(fileHandle);
                    if (!result || result.length === 0) {
                        if (this.showToastCallback) {
                            this.showToastCallback('⚠️ Selected file is not inside workspace.', 3000);
                        }
                        continue;
                    }
                }
                const resolveResult = await workspace.getWorkspaceDirHandle()?.resolve(fileHandle);
                const filename = resolveResult ? '/' + resolveResult.join('/') : fileHandle.name;
                uris.push(new Uri(filename));
            }

            this.isDialogOpen = false;
            this._restorePreDialogFocus();
            dialog.resolve(uris.length > 0 ? uris : null);
            setTimeout(() => this._processDialogQueue(), 100);
        } catch (e) {
            console.error('Error showing native open file dialog:', e);
            this.isDialogOpen = false;
            dialog.resolve(null);
            setTimeout(() => this._processDialogQueue(), 100);
            this._restorePreDialogFocus();
        }
    }

    private async _showSaveDialogInternal(dialog: any): Promise<void> {
        const options = dialog.saveDialogOptions;

        try {
            // Build proper options for window.showSaveFilePicker from SaveDialogOptions
            const properOptions: SaveFilePickerOptions = {
                excludeAcceptAllOption: false,
            };

            // Add file type filters if provided
            if (options?.filters && Object.keys(options.filters).length > 0) {
                const types: FilePickerAcceptType[] = [];

                for (const [description, extensions] of Object.entries(options.filters as { [name: string]: string[] })) {
                    // Skip "all files" filter - browser provides this by default
                    if (extensions.includes('.*') || extensions.includes('*')) {
                        continue;
                    }

                    // Use a unique MIME type per filter to prevent extension mixing
                    types.push({
                        description,
                        accept: {
                            [`application/${description.toLowerCase().replace(/\s+/g, '-')}`]: extensions.map(ext =>
                                ext.startsWith('.') ? ext : `.${ext}`
                            ) as `.${string}`[]
                        }
                    });
                }

                if (types.length > 0) {
                    properOptions.types = types;
                }
            }

            // Set suggested file name if defaultUri is provided
            if (options?.defaultUri) {
                const pathParts = options.defaultUri.fsPath.split('/');
                const fileName = pathParts[pathParts.length - 1];
                if (fileName) {
                    properOptions.suggestedName = fileName;
                }
                properOptions.startIn = 'documents';
            }

            const fileHandle = await window.showSaveFilePicker(properOptions);

            // Check that the chosen file is inside the workspace directory
            const workspaceDir = workspace.getWorkspaceDirHandle();
            if (workspaceDir) {
                const result = await workspaceDir.resolve(fileHandle);
                if (!result || result.length === 0) {
                    if (this.showToastCallback) {
                        this.showToastCallback('⚠️ Selected file is not inside workspace.', 2000);
                    }
                    this.isDialogOpen = false;
                    dialog.resolve(null);
                    setTimeout(() => this._processDialogQueue(), 100);
                    return;
                }
            }
            const resolveResult = await workspace.getWorkspaceDirHandle()?.resolve(fileHandle);
            const filename = resolveResult ? '/' + resolveResult.join('/') : fileHandle.name;

            this.isDialogOpen = false;
            this._restorePreDialogFocus();
            dialog.resolve(new Uri(filename));
            setTimeout(() => this._processDialogQueue(), 100);
        } catch (e) {
            console.error('Error showing native save file dialog:', e);
            this.isDialogOpen = false;
            dialog.resolve(null);
            setTimeout(() => this._processDialogQueue(), 100);
            this._restorePreDialogFocus();
        }
    }

    private _setupFocusTrap(container: HTMLElement): () => void {
        // Get all focusable elements within the container
        const getFocusableElements = (): HTMLElement[] => {
            const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            return Array.from(container.querySelectorAll<HTMLElement>(selector))
                .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0]!;
            const lastElement = focusableElements[focusableElements.length - 1]!;

            if (e.shiftKey) {
                // Shift+Tab: if on first element, move to last
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: if on last element, move to first
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }

    private _cleanupFocusTrap(): void {
        if (this.__activeFocusTrap) {
            this.__activeFocusTrap();
            this.__activeFocusTrap = null;
        }
    }
}
