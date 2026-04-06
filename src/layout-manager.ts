//@+leo-ver=5-thin
//@+node:felix.20260321195752.1: * @file src/layout-manager.ts
//@+<< imports >>
//@+node:felix.20260322230606.1: ** << imports >>
import * as utils from './utils';
import { workspace } from './workspace';
//@-<< imports >>
//@+others
//@+node:felix.20260322230638.1: ** LayoutManager
/**
 * Layout Manager is responsible for managing the overall layout of the application, including the outline pane, body pane, and log pane.
 * It handles drag-handles, resizing, theme and layout toggling, and tracking the last focused element used when opening/closing menus.
 */
export class LayoutManager {

    public HTML_ELEMENT: HTMLElement;
    private MAIN_CONTAINER: HTMLElement;

    public OUTLINE_FIND_CONTAINER: HTMLElement;
    public OUTLINE_PANE: HTMLElement;
    public BODY_PANE: HTMLElement;
    public LOG_PANE: HTMLElement;

    public VERTICAL_RESIZER: HTMLElement;
    public HORIZONTAL_RESIZER: HTMLElement;
    public CROSS_RESIZER: HTMLElement;

    public currentTheme = 'light'; // Default theme
    public currentLayout = 'vertical'; // Default layout
    public mainRatio = 0.25; // Default proportion between outline-find-container and body-pane widths (defaults to 1/4)
    public secondaryRatio = 0.75; // Default proportion between the outline-pane and the log-pane (defaults to 3/4)
    public isDragging = false;

    public secondaryIsDragging = false;
    public crossIsDragging = false;

    public minWidth = 20;
    public minHeight = 20;

    private lastFocusedElement: HTMLElement | null = null; // Used when opening/closing the menu to restore focus
    private lastFocusedBodyOrOutline: 'body' | 'outline' | null = null; // Used to track the last focused element between body and outline. Should never really be null.

    constructor() {
        this.HTML_ELEMENT = document.documentElement;
        this.MAIN_CONTAINER = document.getElementById("main-container")!;

        this.OUTLINE_FIND_CONTAINER = document.getElementById("outline-find-container")!;
        this.OUTLINE_PANE = document.getElementById("outline-pane")!;
        this.BODY_PANE = document.getElementById("body-pane")!;
        this.LOG_PANE = document.getElementById("log-pane")!;

        this.VERTICAL_RESIZER = document.getElementById('main-resizer')!;
        this.HORIZONTAL_RESIZER = document.getElementById('secondary-resizer')!;
        this.CROSS_RESIZER = document.getElementById('cross-resizer')!;

        // Setup 'focusin' listeners for both outline and body panes to track the last focused element between them
        this.OUTLINE_PANE.addEventListener('focusin', () => {
            this.lastFocusedBodyOrOutline = 'outline';
        });
        this.BODY_PANE.addEventListener('focusin', () => {
            this.lastFocusedBodyOrOutline = 'body';
        });
    }

    //@+others
    //@+node:felix.20260322231022.1: *3* setHasOpenedDocuments
    public setHasOpenedDocuments(hasOpened: boolean) {
        this.HTML_ELEMENT.setAttribute('data-no-opened-documents', hasOpened ? 'false' : 'true');
    }
    //@+node:felix.20260322231019.1: *3* getLastFocusedBodyOrOutline
    public getLastFocusedBodyOrOutline(): 'body' | 'outline' {
        // Error out if null 
        if (!this.lastFocusedBodyOrOutline) {
            throw new Error('Last focused body or outline is null, this should never happen');
        }
        return this.lastFocusedBodyOrOutline;
    }
    //@+node:felix.20260322231016.1: *3* isOutlineFocused
    public isOutlineFocused(): boolean {
        // Check if the currently focused element is within the outline pane (OUTLINE_PANE)
        const activeElement = document.activeElement;
        return activeElement !== null && this.OUTLINE_PANE.contains(activeElement);
    }
    //@+node:felix.20260322231013.1: *3* isBodyFocused
    public isBodyFocused(): boolean {
        // Check if the currently focused element is within the body pane (BODY_PANE)
        const activeElement = document.activeElement;
        return activeElement !== null && this.BODY_PANE.contains(activeElement);
    }
    //@+node:felix.20260322230955.1: *3* positionCrossDragger
    public positionCrossDragger() {
        if (this.currentLayout === 'vertical') {
            const outlineWidth = this.OUTLINE_FIND_CONTAINER.offsetWidth;
            const paneHeight = this.OUTLINE_PANE.offsetHeight + workspace.menu.TOP_BAR_TOGGLE.offsetHeight;
            this.CROSS_RESIZER.style.top = (paneHeight) + 'px';
            this.CROSS_RESIZER.style.left = (outlineWidth) + 'px';
        } else {
            const outlineHeight = this.OUTLINE_FIND_CONTAINER.offsetHeight + workspace.menu.TOP_BAR_TOGGLE.offsetHeight;
            const paneWidth = this.OUTLINE_PANE.offsetWidth;
            this.CROSS_RESIZER.style.left = (paneWidth) + 'px';
            this.CROSS_RESIZER.style.top = (outlineHeight) + 'px';
        }
    }
    //@+node:felix.20260322230950.1: *3* setupLastFocusedElementTracking
    public setupLastFocusedElementTracking() {
        const focusableElements = [this.OUTLINE_PANE, this.BODY_PANE];
        // All elements that also need to be tracked for focus are 'input' elements inside the outline/find container
        const allInputs = this.OUTLINE_FIND_CONTAINER.querySelectorAll<HTMLElement>('input');
        allInputs.forEach(input => {
            focusableElements.push(input);
        });

        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                this.lastFocusedElement = element;
            });
        });
    }
    //@+node:felix.20260322230946.1: *3* restoreLastFocusedElement
    public restoreLastFocusedElement() {
        if (this.lastFocusedElement && this.lastFocusedElement.focus) {
            // also check if visible by checking its size
            const rect = this.lastFocusedElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.lastFocusedElement.focus();
            }
        }
    }
    //@+node:felix.20260322230942.1: *3* setWindowTitle
    public setWindowTitle(title: string) {
        document.title = title;
    }
    //@+node:felix.20260322230939.1: *3* initializeThemeAndLayout
    public initializeThemeAndLayout() {
        this.loadThemeAndLayoutPreferences();
    }
    //@+node:felix.20260322230936.1: *3* loadThemeAndLayoutPreferences
    private loadThemeAndLayoutPreferences() {
        const savedPrefs = utils.safeLocalStorageGet('layoutPreferences');
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                if (typeof prefs.mainRatio === 'number') {
                    this.mainRatio = prefs.mainRatio;
                }
                if (typeof prefs.secondaryRatio === 'number') {
                    this.secondaryRatio = prefs.secondaryRatio;
                }
                if (prefs.theme) {
                    this.applyTheme(prefs.theme);
                }
                if (prefs.layout) {
                    this.applyLayout(prefs.layout);
                }
                if (prefs.menuVisible && !workspace.menu.isMenuShown) {
                    workspace.menu.toggleMenu();
                    // Starts with menu shown but has yet to open a document
                    this.setHasOpenedDocuments(false);
                }
            } catch (e) {
                console.error('Error loading layout preferences:', e);
            }
        } else {
            this.applyTheme(this.currentTheme);
            this.applyLayout(this.currentLayout);
        }
    }
    //@+node:felix.20260322230917.1: *3* equalSizedPanes
    public equalSizedPanes(): void {
        this.mainRatio = 0.5;
        this.secondaryRatio = 0.5;
        this.updatePanelSizes();
    }
    //@+node:felix.20260322230913.1: *3* applyTheme
    public applyTheme(theme: string) {
        this.currentTheme = theme;
        this.HTML_ELEMENT.setAttribute('data-theme', theme);
        workspace.menu.THEME_TOGGLE.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        workspace.menu.THEME_ICON.innerHTML = theme === 'dark' ? '🌙' : '☀️';
    }
    //@+node:felix.20260322230908.1: *3* applyLayout
    public applyLayout(layout: string) {
        this.currentLayout = layout;
        workspace.menu.LAYOUT_TOGGLE.title = layout === 'vertical' ? 'Switch to horizontal layout' : 'Switch to vertical layout';
        if (layout === 'horizontal') {
            this.HTML_ELEMENT.setAttribute('data-layout', 'horizontal');
        } else {
            this.HTML_ELEMENT.setAttribute('data-layout', 'vertical');
        }
        this.updatePanelSizes(); // Proportions will have changed so we must update sizes
    }
    //@+node:felix.20260322230858.1: *3* updatePanelSizes
    public updatePanelSizes() {
        this.updateOutlineContainerSize();
        this.updateOutlinePaneSize();
        this.positionCrossDragger();
    }
    //@+node:felix.20260322230844.1: *3* updateOutlineContainerSize
    public updateOutlineContainerSize() {
        if (this.currentLayout === 'vertical') {
            let newWidth = window.innerWidth * this.mainRatio;
            if (newWidth < this.minWidth) {
                newWidth = this.minWidth;
            }
            this.OUTLINE_FIND_CONTAINER.style.width = `${newWidth}px`;
            this.OUTLINE_FIND_CONTAINER.style.height = '100%';
        } else {
            let newHeight = this.MAIN_CONTAINER.offsetHeight * this.mainRatio;
            if (newHeight < this.minWidth) {
                newHeight = this.minWidth;
            }
            this.OUTLINE_FIND_CONTAINER.style.height = `${newHeight}px`;
            this.OUTLINE_FIND_CONTAINER.style.width = '100%';
        }
    }
    //@+node:felix.20260322230837.1: *3* updateOutlinePaneSize
    public updateOutlinePaneSize() {
        if (this.currentLayout === 'vertical') {
            const containerHeight = this.OUTLINE_FIND_CONTAINER.offsetHeight;
            let newHeight = containerHeight * this.secondaryRatio;
            if (newHeight < this.minHeight) {
                newHeight = this.minHeight; // Respect minimum heights
            } else if (newHeight > containerHeight - this.minHeight) {
                newHeight = containerHeight - this.minHeight;
            }
            this.OUTLINE_PANE.style.flex = `0 0 ${newHeight}px`;
        } else {
            const containerWidth = this.OUTLINE_FIND_CONTAINER.offsetWidth;
            let newWidth = containerWidth * this.secondaryRatio;
            if (newWidth < this.minHeight) {
                newWidth = this.minHeight; // Respect minimum widths
            } else if (newWidth > containerWidth - this.minHeight) {
                newWidth = containerWidth - this.minHeight;
            }
            this.OUTLINE_PANE.style.flex = `0 0 ${newWidth}px`;
        }
        this.LOG_PANE.style.flex = '1 1 auto'; // Let it take the remaining space
        this.updateCollapseAllPosition();
    }
    //@+node:felix.20260322230829.1: *3* updateProportion
    public updateProportion() {
        if (this.currentLayout === 'vertical') {
            this.mainRatio = this.OUTLINE_FIND_CONTAINER.offsetWidth / window.innerWidth;
        } else {
            this.mainRatio = this.OUTLINE_FIND_CONTAINER.offsetHeight / this.MAIN_CONTAINER.offsetHeight;
        }
    }
    //@+node:felix.20260322230825.1: *3* updateSecondaryProportion
    public updateSecondaryProportion() {
        if (this.currentLayout === 'vertical') {
            this.secondaryRatio = (this.OUTLINE_PANE.offsetHeight - 6) / this.OUTLINE_FIND_CONTAINER.offsetHeight;
        } else {
            this.secondaryRatio = this.OUTLINE_PANE.offsetWidth / this.OUTLINE_FIND_CONTAINER.offsetWidth;
        }
    }
    //@+node:felix.20260322230821.1: *3* updateCollapseAllPosition
    public updateCollapseAllPosition() {
        workspace.menu.COLLAPSE_ALL_BTN.style.inset = `${this.OUTLINE_PANE.offsetTop}px auto auto ${this.OUTLINE_PANE.clientWidth - 18}px`;
    }
    //@+node:felix.20260322230817.1: *3* toggleTheme
    public toggleTheme() {
        this.HTML_ELEMENT.setAttribute('data-transition', 'true');
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        workspace.outline.renderTree(); // Re-render to update inverted icon colors
    }
    //@+node:felix.20260322230813.1: *3* toggleLayout
    public toggleLayout() {
        this.HTML_ELEMENT.setAttribute('data-transition', 'true');
        const newLayout = this.currentLayout === 'vertical' ? 'horizontal' : 'vertical';
        this.applyLayout(newLayout);
        workspace.outline.renderTree();
    }
    //@+node:felix.20260322230807.1: *3* handleWindowResize
    public handleWindowResize() {
        this.updatePanelSizes();
        workspace.outline.renderTree();
    }
    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4

//@-leo
