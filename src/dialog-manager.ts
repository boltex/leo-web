import {
    OpenDialogOptions,
    SaveDialogOptions,
    InputDialogOptions,
    MessageOptions,
    QuickPickItem,
    QuickPickOptions,
} from './types';
import { Uri, workspace } from './workspace';

type QuickPickInternalItem = QuickPickItem & { renderedLabel?: string };

/**
 * Dialog Manager is responsible for managing all modal and non-modal dialogs in the application.
 * It maintains a queue of dialog requests to ensure that only one dialog is open at a time and handles focus management.
 */
export class DialogManager {

    public HTML_ELEMENT: HTMLElement;

    private TOAST: HTMLElement;
    private MODAL_DIALOG_TITLE: HTMLElement;
    private MODAL_DIALOG_DESCRIPTION: HTMLElement;
    private MODAL_DIALOG_BTN_CONTAINER: HTMLElement;

    private INPUT_DIALOG_TITLE: HTMLElement;
    private INPUT_DIALOG_DESCRIPTION: HTMLElement;
    private INPUT_DIALOG_INPUT: HTMLInputElement;
    private INPUT_DIALOG_BTN: HTMLButtonElement;

    private QUICKPICK_DIALOG_INPUT: HTMLInputElement;
    private QUICKPICK_DIALOG_LIST: HTMLElement;

    private __toastTimer: ReturnType<typeof setTimeout> | null = null;
    private __toastResolvers: Array<(value: PromiseLike<undefined> | undefined) => void> = [];

    private __dialogQueue: Array<{
        type: 'message' | 'input' | 'singleChar' | 'quickPick' | 'openFile' | 'saveFile';
        // For message dialogs
        message?: string;
        options?: MessageOptions;
        items?: string[];
        // For input dialogs
        inputOptions?: InputDialogOptions;
        // For quick pick
        quickPickItems?: QuickPickItem[];
        quickPickOptions?: QuickPickOptions;
        // For file dialogs
        openDialogOptions?: OpenDialogOptions;
        saveDialogOptions?: SaveDialogOptions;
        // Resolver
        resolve: (value: any) => void;
    }> = [];
    public isDialogOpen = false;

    private __activeFocusTrap: (() => void) | null = null;
    private __preDialogFocusedElement: HTMLElement | null = null;


    constructor() {
        this.HTML_ELEMENT = document.documentElement;

        this.TOAST = document.getElementById('toast')!;

        this.MODAL_DIALOG_TITLE = document.getElementById('modal-dialog-title')!;
        this.MODAL_DIALOG_DESCRIPTION = document.getElementById('modal-dialog-description')!;
        this.MODAL_DIALOG_BTN_CONTAINER = document.getElementById('modal-dialog-btn-container')!;

        this.INPUT_DIALOG_TITLE = document.getElementById('input-dialog-title')!;
        this.INPUT_DIALOG_DESCRIPTION = document.getElementById('input-dialog-description')!;
        this.INPUT_DIALOG_INPUT = document.getElementById('input-dialog-input')! as HTMLInputElement;
        this.INPUT_DIALOG_BTN = document.getElementById('input-dialog-btn')! as HTMLButtonElement;

        this.QUICKPICK_DIALOG_INPUT = document.getElementById('quickpick-dialog-input')! as HTMLInputElement;
        this.QUICKPICK_DIALOG_LIST = document.getElementById('quickpick-dialog-list')!;

    }

    public requestWorkspaceDirectory(): Promise<FileSystemDirectoryHandle> {
        // First, check if window.showDirectoryPicker is available to adapt the message in the dialog, and just reject if not.
        if (!('showDirectoryPicker' in window)) {
            return new Promise((resolve, reject) => {
                return this.showMessageDialog(
                    '⚠️ Opening Local folders is Unsupported',
                    {
                        detail: 'Your browser does not support opening local folders.',
                    },
                    'View Specification')
                    .then((result) => {
                        if (result === 'View Specification') {
                            window.location.href =
                                'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker';
                        }
                        reject('Browser does not support showDirectoryPicker API.');
                    });
            });

        } else {
            // ok, continue with the normal flow
            return new Promise((resolve, reject) => {
                return this.showMessageDialog(
                    '📁 Choose a Workspace',
                    { detail: 'Leo-Web needs permission to read and write files.', },
                    'Choose Folder'
                ).then((result) => {
                    if (result === 'Choose Folder') {
                        return window.showDirectoryPicker({ mode: 'readwrite' })
                            .then((dir) => {
                                resolve(dir);
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } else {
                        reject('User cancelled directory selection.');
                    }
                });
            });
        }
    }


    public showToast(message: string, duration = 2000, detail?: string): Promise<undefined> {
        if (!this.TOAST) return Promise.resolve(undefined);

        // Set content
        this.TOAST.textContent = message;
        if (detail) {
            // Two newlines for a better separation
            this.TOAST.textContent += `\n\n${detail}`;
        }

        // Show toast
        this.TOAST.hidden = false;
        void this.TOAST.offsetWidth; // Force reflow for transition
        this.TOAST.classList.add('show');

        // Reset any previous timer
        if (this.__toastTimer) {
            clearTimeout(this.__toastTimer);
            this.__toastTimer = null;
        }

        // Schedule hide and resolve all pending promises when finally hidden
        this.__toastTimer = setTimeout(() => {
            this.TOAST.classList.remove('show');
            setTimeout(() => {
                this.TOAST.hidden = true;
                this.__toastTimer = null;
                const resolvers = this.__toastResolvers.splice(0);
                for (const resolve of resolvers) resolve(undefined);
            }, 220); // match CSS transition duration
        }, duration);

        return new Promise<undefined>((resolve) => {
            this.__toastResolvers.push(resolve);
        });
    }



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
            // first check if another dialog did not instantly open and capture focus again, in which case we should not restore focus to the previous element as it would steal focus from the new dialog. We can check this by seeing if __preDialogFocusedElement is still the same, if it was overwritten by a new dialog opening, it would be different or null.
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
        // (check first if last dialog really finished closing and that 
        // focus was restored, and thus this.__preDialogFocusedElement was restored to null, to avoid overwriting it with the dialog's own focus)
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

    /**
     * Method that mimics VSCode's showInformationMessage API.
     */
    public showInformationMessage(message: string, options?: MessageOptions, ...items: string[]): Thenable<string | void> {
        // if modal, use our showMessageDialog and allow for options and buttons for each item in items array like vscode's API
        if (options?.modal) {
            if (options.detail) {
                return this.showMessageDialog(
                    message,
                    options,
                    ...items
                );
            } else {
                return this.showMessageDialog(
                    'ℹ️ Information',
                    {
                        detail: message,
                    },
                    ...items

                );
            }
        } else {
            // if not modal, use toast
            if (options?.detail) {
                return this.showToast(message, 2000, options.detail);
            } else {
                return this.showToast(message, 2000);
            }
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
            // Focus the first button (usually the primary action)
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
                e.preventDefault();
                e.stopPropagation();
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

        // add 'hidden-button' class to OK button since we don't need it for single char input
        this.INPUT_DIALOG_BTN.classList.add('hidden-button');

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            this.isDialogOpen = false;
            // Remove the 'hidden-button' class from OK button for future dialogs
            this.INPUT_DIALOG_BTN.classList.remove('hidden-button');
            this._restorePreDialogFocus();
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
                    if (options?.onDidSelectItem) {
                        options.onDidSelectItem(item);
                    }
                    this._restorePreDialogFocus();
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

                    // if filter match label, build renderedLabel with <mark> tags around the first instance of the match, to be used in rendering the list, so that users can see why the item is showing up in the list.
                    // We will only mark the label, and not description or details for simplicity.
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
                // Keep separators and alwaysShow items in their original positions
                if (a.kind === -1 || b.kind === -1) return 0;
                if (a.alwaysShow && b.alwaysShow) return 0;
                if (a.alwaysShow) return -1;
                if (b.alwaysShow) return 1;

                const aLabel = a.label.toLowerCase();
                const bLabel = b.label.toLowerCase();
                const aStartsWith = aLabel.startsWith(filterText);
                const bStartsWith = bLabel.startsWith(filterText);

                // Items starting with filterText come first
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                // Both start or both don't start - maintain original order (stable sort)
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
            this.QUICKPICK_DIALOG_INPUT.onkeydown = null;
            this.QUICKPICK_DIALOG_INPUT.oninput = null;
            this._restorePreDialogFocus();
            dialog.resolve(returnValue);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.QUICKPICK_DIALOG_INPUT.onkeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeDialog(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
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
                        this.showToast('⚠️ Selected file is not inside workspace.', 3000);
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
            this._restorePreDialogFocus();
            dialog.resolve(null);
            setTimeout(() => this._processDialogQueue(), 100);
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
                    this.showToast('⚠️ Selected file is not inside workspace.', 2000);
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
            this._restorePreDialogFocus();
            dialog.resolve(null);
            setTimeout(() => this._processDialogQueue(), 100);
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
            console.log('Focus trap keydown:', e.key, 'Shift:', e.shiftKey);
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

    public getLastQuickPickInput(): string | undefined {
        return this.QUICKPICK_DIALOG_INPUT.value;
    }

}