//@+leo-ver=5-thin
//@+node:felix.20260321195553.1: * @file src/dialog-manager.ts
//@+<< imports & annotations >>
//@+node:felix.20260322223745.1: ** << imports & annotations >>
import {
    OpenDialogOptions,
    SaveDialogOptions,
    InputDialogOptions,
    MessageOptions,
    QuickPickItem,
    QuickPickOptions,
    TipsDialogOptions
} from './types';
import { Uri, workspace } from './workspace';

type QuickPickInternalItem = QuickPickItem & { renderedLabel?: string };
//@-<< imports & annotations >>
//@+others
//@+node:felix.20260322224447.1: ** DialogManager
/**
 * Dialog Manager is responsible for managing all modal and non-modal dialogs in the application.
 * It maintains a queue of dialog requests to ensure that only one dialog is open at a time and handles focus management.
 */
export class DialogManager {

    public HTML_ELEMENT: HTMLElement;

    private MODAL_DIALOG: HTMLElement;
    private INPUT_DIALOG: HTMLElement;
    private QUICKPICK_DIALOG: HTMLElement;
    private TIPS_DIALOG: HTMLElement;

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

    private TIPS_DIALOG_TITLE: HTMLElement;
    private TIPS_DIALOG_DESCRIPTION: HTMLElement;
    private TIPS_DIALOG_CONTENT: HTMLElement;
    private TIPS_DIALOG_BTN: HTMLButtonElement;
    private TIPS_DIALOG_SHOW_STARTUP: HTMLInputElement;

    private __toastTimer: ReturnType<typeof setTimeout> | null = null;
    private __quickPickScrollTimeout: ReturnType<typeof setTimeout> | null = null;
    private __toastResolvers: Array<(value: PromiseLike<undefined> | undefined) => void> = [];

    private __dialogQueue: Array<{
        type: 'message' | 'input' | 'singleChar' | 'quickPick' | 'tips' | 'openFile' | 'saveFile';
        // For message dialogs
        message?: string;
        options?: MessageOptions;
        items?: string[];
        // For input dialogs
        inputOptions?: InputDialogOptions;
        // For quick pick
        quickPickItems?: QuickPickItem[];
        quickPickOptions?: QuickPickOptions;
        // for tips dialog
        tipsDialogOptions?: TipsDialogOptions;
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

        this.MODAL_DIALOG = document.getElementById('message-dialog')!;
        this.INPUT_DIALOG = document.getElementById('input-dialog')!;
        this.QUICKPICK_DIALOG = document.getElementById('quickpick-dialog')!;
        this.TIPS_DIALOG = document.getElementById('tips-dialog')!;

        this.MODAL_DIALOG_TITLE = document.getElementById('modal-dialog-title')!;
        this.MODAL_DIALOG_DESCRIPTION = document.getElementById('modal-dialog-description')!;
        this.MODAL_DIALOG_BTN_CONTAINER = document.getElementById('modal-dialog-btn-container')!;

        this.INPUT_DIALOG_TITLE = document.getElementById('input-dialog-title')!;
        this.INPUT_DIALOG_DESCRIPTION = document.getElementById('input-dialog-description')!;
        this.INPUT_DIALOG_INPUT = document.getElementById('input-dialog-input')! as HTMLInputElement;
        this.INPUT_DIALOG_BTN = document.getElementById('input-dialog-btn')! as HTMLButtonElement;

        this.QUICKPICK_DIALOG_INPUT = document.getElementById('quickpick-dialog-input')! as HTMLInputElement;
        this.QUICKPICK_DIALOG_LIST = document.getElementById('quickpick-dialog-list')!;

        this.TIPS_DIALOG_TITLE = document.getElementById('tips-dialog-title')!;
        this.TIPS_DIALOG_DESCRIPTION = document.getElementById('tips-dialog-description')!;
        this.TIPS_DIALOG_CONTENT = document.getElementById('tips-dialog-content')!;
        this.TIPS_DIALOG_BTN = document.getElementById('tips-dialog-btn')! as HTMLButtonElement;
        this.TIPS_DIALOG_SHOW_STARTUP = document.getElementById('show-tips-startup')! as HTMLInputElement;
    }

    //@+others
    //@+node:felix.20260322225911.1: *3* requestWorkspaceDirectory
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
    //@+node:felix.20260322225900.1: *3* showToast
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
    //@+node:felix.20260322225851.1: *3* showMessageDialog
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
    //@+node:felix.20260322225841.1: *3* showInputDialog
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
    //@+node:felix.20260322225831.1: *3* showSingleCharInputDialog
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
    //@+node:felix.20260322225819.1: *3* showQuickPick
    public async showQuickPick<T extends QuickPickItem>(items: T[], options?: QuickPickOptions): Promise<T | undefined> {
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
    //@+node:felix.20260419172756.1: *3* showTipsDialog
    public showTipsDialog(options: TipsDialogOptions): Thenable<undefined> {
        return new Promise<undefined>((resolve) => {
            this.__dialogQueue.push({
                type: 'tips',
                tipsDialogOptions: options,
                resolve
            });

            if (!this.isDialogOpen) {
                this._processDialogQueue();
            }
        });
    }
    //@+node:felix.20260322225815.1: *3* showOpenDialog
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
    //@+node:felix.20260322225750.1: *3* showSaveDialog
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
    //@+node:felix.20260322225731.1: *3* _restorePreDialogFocus
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
    //@+node:felix.20260322225722.1: *3* _processDialogQueue
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
            case 'tips':
                this._showTipsDialogInternal(dialog);
                break;
            case 'openFile':
                this._showOpenDialogInternal(dialog);
                break;
            case 'saveFile':
                this._showSaveDialogInternal(dialog);
                break;
        }
    }
    //@+node:felix.20260322225602.1: *3* showInformationMessage
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
    //@+node:felix.20260322225524.1: *3* _showMessageDialogInternal
    private _showMessageDialogInternal(dialog: any): void {
        this.HTML_ELEMENT.setAttribute('data-show-message-dialog', 'true');
        this.MODAL_DIALOG.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this._cleanupFocusTrap();
                this.HTML_ELEMENT.setAttribute('data-show-message-dialog', 'false');
                this.MODAL_DIALOG.onkeydown = null; // Remove its own keydown.
                this.isDialogOpen = false;
                this._restorePreDialogFocus();
                dialog.resolve(undefined);
                setTimeout(() => this._processDialogQueue(), 100);
            }
        };

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
    //@+node:felix.20260322225432.1: *3* _showInputDialogInternal
    private _showInputDialogInternal(dialog: any): void {
        const options = dialog.inputOptions;
        this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'true');
        this.INPUT_DIALOG_TITLE.textContent = options.title;
        this.INPUT_DIALOG_DESCRIPTION.textContent = options.prompt;
        this.INPUT_DIALOG_INPUT.value = options.value || '';
        this.INPUT_DIALOG_INPUT.placeholder = options.placeholder || '';

        this.INPUT_DIALOG.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.INPUT_DIALOG.onkeydown = null; // Remove its own keydown.
                this._cleanupFocusTrap();
                this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
                this.INPUT_DIALOG_INPUT.onkeydown = null;
                this.INPUT_DIALOG_BTN.onclick = null;
                this.isDialogOpen = false;
                this._restorePreDialogFocus();
                dialog.resolve(undefined);
                setTimeout(() => this._processDialogQueue(), 100);
            }
        };

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            this.INPUT_DIALOG_INPUT.onkeydown = null;
            this.INPUT_DIALOG_BTN.onclick = null;
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
            if (options.value) {
                this.INPUT_DIALOG_INPUT.select();
            }
        }, 0);
    }
    //@+node:felix.20260322225350.1: *3* _showSingleCharInputDialogInternal
    private _showSingleCharInputDialogInternal(dialog: any): void {
        const options = dialog.inputOptions;
        this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'true');
        this.INPUT_DIALOG_TITLE.textContent = options.title;
        this.INPUT_DIALOG_DESCRIPTION.textContent = options.prompt;
        this.INPUT_DIALOG_INPUT.value = options.value || '';
        this.INPUT_DIALOG_INPUT.placeholder = options.placeholder || '';

        this.INPUT_DIALOG.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.INPUT_DIALOG.onkeydown = null; // Remove its own keydown.
                this._cleanupFocusTrap();
                this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
                this.INPUT_DIALOG_INPUT.oninput = null;
                this.isDialogOpen = false;
                this._restorePreDialogFocus();
                dialog.resolve(undefined);
                setTimeout(() => this._processDialogQueue(), 100);
            }
        };

        // add 'hidden-button' class to OK button since we don't need it for single char input
        this.INPUT_DIALOG_BTN.classList.add('hidden-button');

        const inputCallback = () => {
            const inputValue = this.INPUT_DIALOG_INPUT.value;
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-input-dialog', 'false');
            this.INPUT_DIALOG_INPUT.oninput = null;
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
    //@+node:felix.20260322224330.1: *3* _showQuickPickInternal
    private _showQuickPickInternal(dialog: any): void {
        const items: QuickPickItem[] = dialog.quickPickItems;
        const options = dialog.quickPickOptions;

        this.HTML_ELEMENT.setAttribute('data-show-quickpick-dialog', 'true');

        this.QUICKPICK_DIALOG.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeDialog(null);
            }
        };

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
                    if (this.__quickPickScrollTimeout) {
                        clearTimeout(this.__quickPickScrollTimeout);
                    }

                    this.__quickPickScrollTimeout = setTimeout(() => {
                        const selected = this.QUICKPICK_DIALOG_LIST.querySelector('.selected');
                        if (selected) {
                            selected.scrollIntoView({
                                block: 'nearest',
                                behavior: this.QUICKPICK_DIALOG_INPUT.value ? 'smooth' : 'instant'
                            });
                        }
                    }, 0);
                }

                li.onclick = () => {
                    if (options?.onDidSelectItem) {
                        options.onDidSelectItem(item);
                    }
                    closeDialog(item);
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
                        (item as QuickPickInternalItem).renderedLabel = undefined;
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
            this.QUICKPICK_DIALOG.onkeydown = null;
            this.QUICKPICK_DIALOG_INPUT.onkeydown = null;
            this.QUICKPICK_DIALOG_INPUT.oninput = null;
            this._restorePreDialogFocus();
            if (this.__quickPickScrollTimeout) {
                clearTimeout(this.__quickPickScrollTimeout);
            }
            dialog.resolve(returnValue || undefined); // will return undefined if null.
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
                const oldIndex = selectedIndex;
                for (let i = selectedIndex + 1; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                if (options?.onDidSelectItem && oldIndex !== selectedIndex) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        options.onDidSelectItem(selectedItem);
                    }
                }
                renderList();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const oldIndex = selectedIndex;
                for (let i = selectedIndex - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                if (options?.onDidSelectItem && oldIndex !== selectedIndex) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        options.onDidSelectItem(selectedItem);
                    }
                }
                renderList();
            } else if (e.key === 'PageDown') {
                e.preventDefault();
                const oldIndex = selectedIndex;
                let count = 0;
                for (let i = selectedIndex + 1; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        count++;
                        if (count >= 5) break;
                    }
                }
                if (options?.onDidSelectItem && oldIndex !== selectedIndex) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        options.onDidSelectItem(selectedItem);
                    }
                }
                renderList();
            } else if (e.key === 'PageUp') {
                e.preventDefault();
                const oldIndex = selectedIndex;
                let count = 0;
                for (let i = selectedIndex - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        count++;
                        if (count >= 5) break;
                    }
                }
                if (options?.onDidSelectItem && oldIndex !== selectedIndex) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        options.onDidSelectItem(selectedItem);
                    }
                }
                renderList();
            } else if (e.key === 'Home') {
                e.preventDefault();
                const oldIndex = selectedIndex;
                for (let i = 0; i < filteredItems.length; i++) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                if (options?.onDidSelectItem && oldIndex !== selectedIndex) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        options.onDidSelectItem(selectedItem);
                    }
                }
                renderList();
            } else if (e.key === 'End') {
                e.preventDefault();
                const oldIndex = selectedIndex;
                for (let i = filteredItems.length - 1; i >= 0; i--) {
                    if (filteredItems[i]!.kind !== -1) {
                        selectedIndex = i;
                        break;
                    }
                }
                if (options?.onDidSelectItem && oldIndex !== selectedIndex) {
                    const selectedItem = filteredItems[selectedIndex];
                    if (selectedItem && selectedItem.kind !== -1) {
                        options.onDidSelectItem(selectedItem);
                    }
                }
                renderList();
            }
            else if (e.key === 'Tab') {
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
    //@+node:felix.20260419173929.1: *3* _showTipsDialogInternal
    private _showTipsDialogInternal(dialog: any): void {
        const options = dialog.tipsDialogOptions;
        this.HTML_ELEMENT.setAttribute('data-show-tips-dialog', 'true');
        this.TIPS_DIALOG.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this._cleanupFocusTrap();
                this.HTML_ELEMENT.setAttribute('data-show-tips-dialog', 'false');
                this.TIPS_DIALOG.onkeydown = null; // Remove its own keydown.
                this.TIPS_DIALOG_BTN.onclick = null;
                this.isDialogOpen = false;
                this._restorePreDialogFocus();
                dialog.resolve(undefined);
                setTimeout(() => this._processDialogQueue(), 100);
            }
        };

        const tipsCallback = () => {
            this._cleanupFocusTrap();
            this.HTML_ELEMENT.setAttribute('data-show-tips-dialog', 'false');
            this.TIPS_DIALOG.onkeydown = null;
            this.TIPS_DIALOG_BTN.onclick = null;
            this.isDialogOpen = false;
            this._restorePreDialogFocus();
            dialog.resolve(undefined);
            setTimeout(() => this._processDialogQueue(), 100);
        };

        this.TIPS_DIALOG_BTN.textContent = 'OK';
        this.TIPS_DIALOG_BTN.onclick = tipsCallback;
        console.log('dialog', dialog);

        this.TIPS_DIALOG_TITLE.textContent = options.title;
        this.TIPS_DIALOG_DESCRIPTION.textContent = options.description ?? '';
        this.TIPS_DIALOG_CONTENT.innerHTML = options.content ?? '';

        // Get the modal dialog container element
        const tipsDialog = document.querySelector('#tips-dialog') as HTMLElement;
        if (tipsDialog) {
            this._cleanupFocusTrap();
            this.__activeFocusTrap = this._setupFocusTrap(tipsDialog);
        }

        setTimeout(() => {
            this.TIPS_DIALOG_BTN.focus();
        }, 0);

    }
    //@+node:felix.20260322224248.1: *3* _showOpenDialogInternal
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
    //@+node:felix.20260322224224.1: *3* _showSaveDialogInternal
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
    //@+node:felix.20260322223935.1: *3* _setupFocusTrap
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
    //@+node:felix.20260322223915.1: *3* _cleanupFocusTrap
    private _cleanupFocusTrap(): void {
        if (this.__activeFocusTrap) {
            this.__activeFocusTrap();
            this.__activeFocusTrap = null;
        }
    }
    //@+node:felix.20260322223859.1: *3* getLastQuickPickInput
    public getLastQuickPickInput(): string | undefined {
        return this.QUICKPICK_DIALOG_INPUT.value;
    }
    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4
//@-leo
