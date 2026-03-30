//@+leo-ver=5-thin
//@+node:felix.20260321200150.1: * @file src/log-pane-manager.ts
//@+<< imports & annotations >>
//@+node:felix.20260323005130.1: ** << imports & annotations >>
import { LeoSearchSettings, LeoUndoNode } from "./types";
import { workspace } from './workspace';

type searchSettingNames = 'entireOutline' |
    'nodeOnly' |
    'fileOnly' |
    'subOutlineOnly' |
    'ignoreCase' |
    'markChanges' |
    'markFinds' |
    'regExp' |
    'searchBody' |
    'searchHeadline' |
    'wholeWord';
//@-<< imports & annotations >>
//@+others
//@+node:felix.20260323005219.1: ** LogPaneManager
/**
 * Log Pane contains Log, Find, Nav, and Settings controls. Each with its respective tab at the top. 
 * This class manages the UI controls within this pane, but not the layout of the pane itself (see LayoutManager).
 */
export class LogPaneManager {

    // Tabs
    public LOG_TAB: HTMLDivElement;
    public FIND_TAB: HTMLDivElement;
    public NAV_TAB: HTMLDivElement;
    public UNDO_TAB: HTMLDivElement;
    public SETTINGS_TAB: HTMLDivElement;
    public HELP_TAB: HTMLDivElement;

    // Log text content
    public LOG_CONTENT: HTMLElement;

    // Find controls
    public FIND_INPUT: HTMLInputElement; // text input
    public REPLACE_INPUT: HTMLInputElement; // text input
    public OPT_HEADLINE: HTMLInputElement; // checkbox
    public OPT_BODY: HTMLInputElement; // checkbox
    public OPT_WHOLE: HTMLInputElement; // checkbox
    public OPT_IGNORECASE: HTMLInputElement; // checkbox
    public OPT_REGEXP: HTMLInputElement; // checkbox
    public OPT_MARK_FINDS: HTMLInputElement; // checkbox
    public OPT_MARK_CHANGES: HTMLInputElement; // checkbox

    public SCOPE_ENTIRE: HTMLInputElement; // radio button
    public SCOPE_SUBOUTLINE: HTMLInputElement; // radio button
    public SCOPE_NODE: HTMLInputElement; // radio button
    public SCOPE_FILE: HTMLInputElement; // radio button

    // Undo controls
    public UNDO_CONTENT: HTMLElement; // Container for undo nodes, which will be rendered as child elements within this container.

    // Config Controls
    public PREVIOUS_NEXT_HISTORY: HTMLInputElement; // checkbox
    public SHOW_COLLAPSE_ALL: HTMLInputElement; // checkbox

    // Nav controls
    public SEARCH_OPTIONS: HTMLSelectElement; // select
    public IS_TAG: HTMLInputElement; // checkbox
    public SHOW_PARENT: HTMLInputElement; // checkbox
    public NAV_TEXT: HTMLInputElement; // text input

    public FREEZE: HTMLElement;
    public GOTO_PANE: HTMLElement;

    public HTML_ELEMENT: HTMLElement;

    // Find/Nav state
    public timer: ReturnType<typeof setTimeout> | undefined; // for debouncing sending the settings from this class to LeoWeb
    public dirty = false; // all but nav input
    public navTextDirty = false; // only nav input

    /**
     * * Flag for freezing the nav 'search as you type' headlines (concept from original nav plugin)
     * - Resets when switching to tag, or when clearing the input field.
     * - Sets when pressing Enter with non-empty input field && not tag mode.
     */
    public frozen = false;
    public navSearchTimer: ReturnType<typeof setTimeout> | undefined; // for debouncing the search-headline while typing if unfrozen

    public searchSettings: LeoSearchSettings = {
        // Nav settings
        navText: '',
        isTag: false,
        showParents: true,
        searchOptions: 0,
        // Find/replace
        findText: '',
        replaceText: '',
        wholeWord: false,
        ignoreCase: true,
        regExp: false,
        markFinds: false,
        markChanges: false,
        searchHeadline: true,
        searchBody: true,
        searchScope: 0, // 0 is entire outline (1: sub-outline, 2: node only)
    };

    private _postMessageCallback: ((message: any) => void) | undefined; // Set by controller, used to send messages to LeoWeb when settings change or when user interacts with the controls.
    private _undoSelection: LeoUndoNode | undefined; // Keep track of the currently selected undo node, so that we can maintain selection when refreshing the undo pane.
    private _undoNodes: LeoUndoNode[] = []; // Keep track of the current list of undo nodes, so that we can refresh the undo pane when it changes.

    constructor() {

        // Tabs
        this.LOG_TAB = document.getElementById('log-tab')! as HTMLDivElement;
        this.FIND_TAB = document.getElementById('find-tab')! as HTMLDivElement;
        this.NAV_TAB = document.getElementById('nav-tab')! as HTMLDivElement;
        this.UNDO_TAB = document.getElementById('undo-tab')! as HTMLDivElement;
        this.SETTINGS_TAB = document.getElementById('settings-tab')! as HTMLDivElement;
        this.HELP_TAB = document.getElementById('help-tab')! as HTMLDivElement;

        // Log text content
        this.LOG_CONTENT = document.getElementById('log-controls')!;

        // Undo content
        this.UNDO_CONTENT = document.getElementById('undo-controls')!;

        // Find controls
        this.FIND_INPUT = document.getElementById('find-input')! as HTMLInputElement; // text input
        this.REPLACE_INPUT = document.getElementById('replace-input')! as HTMLInputElement; // text input

        this.OPT_HEADLINE = document.getElementById('opt-headline')! as HTMLInputElement; // checkbox
        this.OPT_BODY = document.getElementById('opt-body')! as HTMLInputElement; // checkbox
        this.OPT_WHOLE = document.getElementById('opt-whole')! as HTMLInputElement; // checkbox
        this.OPT_IGNORECASE = document.getElementById('opt-ignorecase')! as HTMLInputElement; // checkbox
        this.OPT_REGEXP = document.getElementById('opt-regexp')! as HTMLInputElement; // checkbox
        this.OPT_MARK_FINDS = document.getElementById('opt-mark-finds')! as HTMLInputElement; // checkbox
        this.OPT_MARK_CHANGES = document.getElementById('opt-mark-changes')! as HTMLInputElement; // checkbox

        this.SCOPE_ENTIRE = document.getElementById('scope-entire')! as HTMLInputElement; // radio button
        this.SCOPE_SUBOUTLINE = document.getElementById('scope-suboutline')! as HTMLInputElement; // radio button
        this.SCOPE_NODE = document.getElementById('scope-node')! as HTMLInputElement; // radio button
        this.SCOPE_FILE = document.getElementById('scope-file')! as HTMLInputElement; // radio button

        // Config Controls
        this.PREVIOUS_NEXT_HISTORY = document.getElementById('show-prev-next-history')! as HTMLInputElement; // checkbox
        this.SHOW_COLLAPSE_ALL = document.getElementById('show-collapse-all')! as HTMLInputElement; // checkbox

        // Nav controls
        this.SEARCH_OPTIONS = document.getElementById('searchOptions') as HTMLSelectElement; // select
        this.IS_TAG = document.getElementById('isTag') as HTMLInputElement; // checkbox
        this.SHOW_PARENT = document.getElementById('showParents') as HTMLInputElement; // checkbox
        this.NAV_TEXT = document.getElementById('navText') as HTMLInputElement; // text input

        this.FREEZE = document.getElementById('freeze') as HTMLElement; // Simple div
        this.GOTO_PANE = document.getElementById('gotoPane') as HTMLElement; // Simple div

        this.HTML_ELEMENT = document.documentElement;


        // * Find & Replace controls change detection
        this.SEARCH_OPTIONS.addEventListener('change', () => {
            this.searchSettings.searchOptions = Number(this.SEARCH_OPTIONS.value);
            this.processChange();
        });

        const findReplaceInputs = [this.FIND_INPUT, this.REPLACE_INPUT];
        const checkboxes = [this.OPT_HEADLINE, this.OPT_BODY, this.OPT_WHOLE, this.OPT_IGNORECASE, this.OPT_REGEXP, this.OPT_MARK_FINDS, this.OPT_MARK_CHANGES];
        const radios = [this.SCOPE_ENTIRE, this.SCOPE_SUBOUTLINE, this.SCOPE_NODE, this.SCOPE_FILE];

        for (const input of findReplaceInputs) {
            // first, check for 'enter' press:
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (this.timer) {
                        clearTimeout(this.timer);
                        this.sendSearchConfig();
                    }
                    this._postMessageCallback?.({ type: 'leoFindNext' });
                }
            });
            // Next, listen for 'input' events:
            input.addEventListener('input', () => {
                const inputId = input.id === 'find-input' ? 'findText' : 'replaceText';
                this.searchSettings[inputId] = input.value;
                this.processChange();
            });
        }

        for (const checkbox of checkboxes) {
            checkbox.addEventListener('change', () => {
                const settingKey = checkbox.id.replace('opt-', '') as keyof LeoSearchSettings;
                // @ts-ignore - We know this is safe because the checkbox IDs are designed to match the keys in LeoSearchSettings.
                this.searchSettings[settingKey] = checkbox.checked;
                this.processChange();
            });
        }

        for (const radio of radios) {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    const scopeValue = radio.id.replace('scope-', '');
                    switch (scopeValue) {
                        case 'entire':
                            this.searchSettings.searchScope = 0;
                            break;
                        case 'suboutline':
                            this.searchSettings.searchScope = 1;
                            break;
                        case 'node':
                            this.searchSettings.searchScope = 2;
                            break;
                        case 'file':
                            this.searchSettings.searchScope = 3;
                            break;
                    }
                    this.processChange();
                }
            });
        }

        // Setup tab/shift-tab to manage focus between controls and/or the body/outline panes.
        // * Deal with pressing tab in the log content area to place focus on body-pane itself.
        this.LOG_CONTENT.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                workspace.layout.BODY_PANE.focus();
            }
            // Note, shift-tab works ok by itself in the log content and brings focus to outline.
        });

        // * Deal with keyboard presses on specific 'find' tab controls, which is part of the log pane.
        this.FIND_INPUT.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.OPT_BODY.focus();
            }

        });
        this.OPT_BODY.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.FIND_INPUT.focus();
            }
        });

        // * Deal with keyboard presses on specific 'config' tab controls.
        this.PREVIOUS_NEXT_HISTORY.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.SHOW_COLLAPSE_ALL.focus();
            }
        });
        this.SHOW_COLLAPSE_ALL.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.PREVIOUS_NEXT_HISTORY.focus();
            }
        });
    }

    //@+others
    //@+node:felix.20260323005956.1: *3* processChange
    private processChange() {
        clearTimeout(this.timer);
        this.dirty = true;
        this.timer = setTimeout(() => {
            this.sendSearchConfig();
        }, 300);
    }
    //@+node:felix.20260323005953.1: *3* setPostMessageCallback
    public setPostMessageCallback(callback: (message: any) => void) {
        this._postMessageCallback = callback;
    }
    //@+node:felix.20260323005938.1: *3* setSearchSetting
    public setSearchSetting(name: searchSettingNames) {
        // Only for checkboxes and radios:
        // If a checkbox, toggle it. if a radio button, set it to true.

        // Map scope names to their correct element IDs
        const scopeIdMap: Partial<Record<searchSettingNames, string>> = {
            entireOutline: 'scope-entire',
            subOutlineOnly: 'scope-suboutline',
            nodeOnly: 'scope-node',
            fileOnly: 'scope-file',
        };

        const elementId = scopeIdMap[name] ?? `opt-${name}`;
        const element = document.getElementById(elementId) as HTMLInputElement | null;
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = !element.checked;
                // Also set in this.searchSettings for immediate UI feedback, and to avoid waiting for the response from LeoWeb to update the UI (since this method is called from the keyboard shortcuts, which should feel responsive).
                const settingKey = name as keyof LeoSearchSettings;
                // @ts-ignore - We know this is safe because the searchSettingNames type only includes keys that exist in LeoSearchSettings and are booleans.
                this.searchSettings[settingKey] = element.checked;
            } else if (element.type === 'radio') {
                element.checked = true;
                // Also set in this.searchSettings for immediate UI feedback, and to avoid waiting for the response from LeoWeb to update the UI (since this method is called from the keyboard shortcuts, which should feel responsive).
                this.searchSettings['searchScope'] = parseInt(element.value);
            }
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.sendSearchConfig();

        } else {
            console.warn(`No element found for setting ${name}`); // Should never happen.
        }

    }
    //@+node:felix.20260323005924.1: *3* setSettings
    /**
     * Set this.searchSettings and update the UI DOM controls accordingly. 
     * Called when receiving settings from Leo.
     */
    public setSettings(settings: LeoSearchSettings) {

        this.searchSettings = settings;

        // Nav
        this.NAV_TEXT.value = settings.navText;
        this.IS_TAG.checked = settings.isTag;
        this.SHOW_PARENT.checked = settings.showParents;
        this.SEARCH_OPTIONS.selectedIndex = settings.searchOptions;
        this.handleIsTagSwitch(false);

        // Find/replace
        this.FIND_INPUT.value = settings.findText;
        this.REPLACE_INPUT.value = settings.replaceText;
        this.OPT_WHOLE.checked = settings.wholeWord;
        this.OPT_IGNORECASE.checked = settings.ignoreCase;
        this.OPT_REGEXP.checked = settings.regExp;
        this.OPT_MARK_FINDS.checked = settings.markFinds;
        this.OPT_MARK_CHANGES.checked = settings.markChanges;
        this.OPT_HEADLINE.checked = settings.searchHeadline;
        this.OPT_BODY.checked = settings.searchBody;

        // Set scope radio buttons
        switch (settings.searchScope) {
            case 0:
                this.SCOPE_ENTIRE.checked = true;
                break;
            case 1:
                this.SCOPE_SUBOUTLINE.checked = true;
                break;
            case 2:
                this.SCOPE_NODE.checked = true;
                break;
            case 3:
                this.SCOPE_FILE.checked = true;
                break;
        }
    }
    //@+node:felix.20260323005915.1: *3* handleIsTagSwitch
    public handleIsTagSwitch(wasSet: boolean) {
        if (this.searchSettings.isTag) {

            this.NAV_TEXT.placeholder = "<tag pattern here>";
            this.NAV_TEXT.title = "Enter a tag name to list tagged nodes in the Goto pane\nClear this field to list all tags used in this file";
            this.SHOW_PARENT.disabled = true;
            this.SEARCH_OPTIONS.disabled = true;
            if (wasSet) {
                // if nav text is empty: show all tags
                setTimeout(() => {
                    clearTimeout(this.timer);
                    this.sendSearchConfig();
                    this.navTextChange();
                }, 100);
            }
        } else {
            this.NAV_TEXT.placeholder = "<nav pattern here>";
            this.NAV_TEXT.title = "Typing searches headlines interactively\nEnter freezes input and searches body text";
            this.SHOW_PARENT.disabled = false;
            this.SEARCH_OPTIONS.disabled = false;
        }
    }
    //@+node:felix.20260323005904.1: *3* sendSearchConfig
    public sendSearchConfig() {
        this.dirty = false;
        this._postMessageCallback?.({ type: 'searchConfig', value: this.searchSettings });
    }
    //@+node:felix.20260323005851.1: *3* navTextChange
    public navTextChange() {
        // cancel timer, reset 'debounced' timer after checks, if still needed
        if (this.navSearchTimer) {
            clearTimeout(this.navSearchTimer);
        }

        // * Needed Checks
        if (this.searchSettings.navText.length === 0) {
            this.setFrozen(false);
            // if tagging but empty: SEND SEARCH LIST-ALL-TAGS COMMAND
            if (this.searchSettings.isTag) {
                this.resetTagNav();
            }

        }
        if (this.searchSettings.navText === "m" && !this.searchSettings.isTag) {
            // ! Easter Egg: calls 'marked-list', which list all marked nodes !
            this.navSearchTimer = setTimeout(() => {
                if (this.navTextDirty) {
                    this.navTextDirty = false;
                    if (this.navSearchTimer) {
                        clearTimeout(this.navSearchTimer);
                    }
                    this.sendSearchConfig();
                }
                this._postMessageCallback?.({ type: 'leoNavMarkedList' });

            }, 40); // Shorter delay for this command
            return false;
        }

        // User changed text in nav text input
        if (this.frozen || this.searchSettings.navText.length < 3) {
            return; // dont even continue if not long enough or already frozen
        }

        // DEBOUNCE .25 to .5 seconds with this.navSearchTimer
        this.navSearchTimer = setTimeout(() => {
            if (this.navTextDirty) {
                this.navTextDirty = false;
                if (this.navSearchTimer) {
                    clearTimeout(this.navSearchTimer);
                }
                this.sendSearchConfig();
            }
            this._postMessageCallback?.({ type: 'leoNavTextChange' });
        }, 400); // almost half second

    }
    //@+node:felix.20260323005837.1: *3* setFrozen
    public setFrozen(focus: boolean) {
        this.frozen = focus;
        // TODO : REPLACE THIS WITH A CSS VARIABLE TO AVOID DIRECT DOM MANIPULATION IN THIS CLASS
        if (this.FREEZE) {
            if (this.frozen) {
                this.FREEZE.style.display = '';
            } else {
                this.FREEZE.style.display = 'none';
            }
        }
    }
    //@+node:felix.20260323005828.1: *3* resetTagNav
    public resetTagNav() {
        this.navSearchTimer = setTimeout(() => {
            if (this.navTextDirty) {
                this.navTextDirty = false;
                if (this.navSearchTimer) {
                    clearTimeout(this.navSearchTimer);
                }
                this.sendSearchConfig();
            }
            this._postMessageCallback?.({ type: 'leoNavTextChange' });
        }, 250); // quarter second
    }
    //@+node:felix.20260323005820.1: *3* showTab
    public showTab(tabName: string) {
        this.HTML_ELEMENT.setAttribute('data-active-tab', tabName);
        if (tabName === 'undo') {
            this.refreshUndoPane();
        }
    }
    //@+node:felix.20260323005812.1: *3* focusFindInput
    public focusFindInput() {
        this.FIND_INPUT.select();
    }
    //@+node:felix.20260327222254.1: *3* refreshUndoPane
    public refreshUndoPane(): void {
        // If the undo tab is not active, no need to refresh the pane.
        // It will be refreshed when the user clicks on the undo tab.
        if (this.HTML_ELEMENT.getAttribute('data-active-tab') !== 'undo') {
            return;
        }

        this.UNDO_CONTENT.innerHTML = '';

        const ul = document.createElement('ul');
        ul.classList.add('undo-list');
        let selectedLi: HTMLLIElement | undefined;

        this._undoNodes.forEach((node) => {
            const li = document.createElement('li');
            li.classList.add('undo-node');
            li.classList.add('undo-icon-' + (node.icon || 'default'));
            li.setAttribute('data-undo-context', node.contextValue || 'default');
            li.setAttribute('data-bead-index', node.beadIndex.toString());
            li.title = "Undo bead " + node.beadIndex;
            if (this._undoSelection && node.beadIndex === this._undoSelection.beadIndex) {
                li.classList.add('selected');
                selectedLi = li;
            }

            const labelSpan = document.createElement('span');
            labelSpan.classList.add('undo-label');
            labelSpan.textContent = node.label;

            const descSpan = document.createElement('span');
            descSpan.classList.add('undo-description');
            descSpan.textContent = node.description;

            li.appendChild(labelSpan);
            li.appendChild(descSpan);
            ul.appendChild(li);
        });

        this.UNDO_CONTENT.appendChild(ul);
        // If selectedLi is not null, scroll it into view:
        if (selectedLi != null) {
            selectedLi.scrollIntoView({ block: 'center' });
        }
    }

    //@+node:felix.20260323005755.1: *3* addToLogPane
    public addToLogPane(message: string, replace = false) {
        if (replace) {
            this.LOG_CONTENT.textContent = message + (message ? '\n' : '');
        } else {
            this.LOG_CONTENT.textContent += message + '\n';
        }
        this.LOG_CONTENT.scrollTop = this.LOG_CONTENT.scrollHeight;
    }
    //@+node:felix.20260327225825.1: *3* setUndoSelection
    public setUndoSelection(undoNode: LeoUndoNode | undefined) {
        this._undoSelection = undoNode;
    }

    //@+node:felix.20260327225927.1: *3* setUndoNodes
    public setUndoNodes(undoNodes: LeoUndoNode[]) {
        this._undoNodes = undoNodes;
        this.refreshUndoPane();
    }

    //@-others

}

//@-others
//@@language typescript
//@@tabwidth -4

//@-leo
