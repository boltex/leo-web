import { LeoSearchSettings } from "./types";

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

/**
 * Log Pane contains Log, Find, Nav, and Settings controls. Each with its respctive tab at the top. 
 * This class manages the UI controls within this pane, but not the layout of the pane itself (see LayoutManager).
 */
export class LogPaneManager {

    // Tabs
    public LOG_TAB: HTMLDivElement;
    public FIND_TAB: HTMLDivElement;
    public NAV_TAB: HTMLDivElement;
    // public UNDO_TAB: HTMLDivElement; // Maybe add undo tab functionality later
    public SETTINGS_TAB: HTMLDivElement;

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

    public postMessageCallback: ((message: any) => void) | undefined; // Set by controller, used to send messages to LeoWeb when settings change or when user interacts with the controls.

    constructor() {

        // Tabs
        this.LOG_TAB = document.getElementById('log-tab')! as HTMLDivElement;
        this.FIND_TAB = document.getElementById('find-tab')! as HTMLDivElement;
        this.NAV_TAB = document.getElementById('nav-tab')! as HTMLDivElement;
        // this.UNDO_TAB = document.getElementById('undo-tab')! as HTMLDivElement;
        this.SETTINGS_TAB = document.getElementById('settings-tab')! as HTMLDivElement;

        // Log text content
        this.LOG_CONTENT = document.getElementById('log-controls')!;

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

        // Nav controls
        this.SEARCH_OPTIONS = document.getElementById('searchOptions') as HTMLSelectElement; // select
        this.IS_TAG = document.getElementById('isTag') as HTMLInputElement; // checkbox
        this.SHOW_PARENT = document.getElementById('showParents') as HTMLInputElement; // checkbox
        this.NAV_TEXT = document.getElementById('navText') as HTMLInputElement; // text input

        this.FREEZE = document.getElementById('freeze') as HTMLElement; // Simple div
        this.GOTO_PANE = document.getElementById('gotoPane') as HTMLElement; // Simple div

        this.HTML_ELEMENT = document.documentElement;

    }

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

    public sendSearchConfig() {
        this.dirty = false;
        this.postMessageCallback?.({ type: 'searchConfig', value: this.searchSettings });
    }

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
                this.postMessageCallback?.({ type: 'leoNavMarkedList' });

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
            this.postMessageCallback?.({ type: 'leoNavTextChange' });
        }, 400); // almost half second

    }

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

    public resetTagNav() {
        this.navSearchTimer = setTimeout(() => {
            if (this.navTextDirty) {
                this.navTextDirty = false;
                if (this.navSearchTimer) {
                    clearTimeout(this.navSearchTimer);
                }
                this.sendSearchConfig();
            }
            this.postMessageCallback?.({ type: 'leoNavTextChange' });
        }, 250); // quarter second
    }

    public showTab(tabName: string) {
        this.HTML_ELEMENT.setAttribute('data-active-tab', tabName);
    }

    public focusFindInput() {
        this.FIND_INPUT.select();
    }

    public addToLogPane(message: string, replace = false) {
        if (replace) {
            this.LOG_CONTENT.textContent = message + (message ? '\n' : '');
        } else {
            this.LOG_CONTENT.textContent += message + '\n';
        }
        this.LOG_CONTENT.scrollTop = this.LOG_CONTENT.scrollHeight;
    }

    public getFindScopeRadios(): NodeListOf<HTMLInputElement> {
        return document.querySelectorAll('input[name="find-scope"]');
    }

}

