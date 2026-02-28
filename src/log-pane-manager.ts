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
    public FIND_INPUT: HTMLInputElement;
    public REPLACE_INPUT: HTMLInputElement;
    public OPT_HEADLINE: HTMLInputElement;
    public OPT_BODY: HTMLInputElement;
    public OPT_WHOLE: HTMLInputElement;
    public OPT_IGNORECASE: HTMLInputElement;
    public OPT_REGEXP: HTMLInputElement;
    public OPT_MARK_FINDS: HTMLInputElement;
    public OPT_MARK_CHANGES: HTMLInputElement;

    // Nav controls
    public SEARCH_OPTIONS: HTMLSelectElement;
    public IS_TAG: HTMLInputElement;
    public SHOW_PARENT: HTMLInputElement;
    public NAV_TEXT: HTMLInputElement;
    public FREEZE: HTMLElement;
    public GOTO_PANE: HTMLElement;

    public HTML_ELEMENT: HTMLElement;

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
        this.FIND_INPUT = document.getElementById('find-input')! as HTMLInputElement;
        this.REPLACE_INPUT = document.getElementById('replace-input')! as HTMLInputElement;
        this.OPT_HEADLINE = document.getElementById('opt-headline')! as HTMLInputElement;
        this.OPT_BODY = document.getElementById('opt-body')! as HTMLInputElement;
        this.OPT_WHOLE = document.getElementById('opt-whole')! as HTMLInputElement;
        this.OPT_IGNORECASE = document.getElementById('opt-ignorecase')! as HTMLInputElement;
        this.OPT_REGEXP = document.getElementById('opt-regexp')! as HTMLInputElement;
        this.OPT_MARK_FINDS = document.getElementById('opt-mark-finds')! as HTMLInputElement;
        this.OPT_MARK_CHANGES = document.getElementById('opt-mark-changes')! as HTMLInputElement;

        // Nav controls
        this.SEARCH_OPTIONS = document.getElementById('searchOptions') as HTMLSelectElement;
        this.IS_TAG = document.getElementById('isTag') as HTMLInputElement;
        this.SHOW_PARENT = document.getElementById('showParents') as HTMLInputElement;
        this.NAV_TEXT = document.getElementById('navText') as HTMLInputElement;
        this.FREEZE = document.getElementById('freeze') as HTMLElement; // Simple div
        this.GOTO_PANE = document.getElementById('gotoPane') as HTMLElement; // Simple div

        this.HTML_ELEMENT = document.documentElement;

    }

    public showTab(tabName: string) {
        this.HTML_ELEMENT.setAttribute('data-active-tab', tabName);
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

