// import { Position } from "./core/leoNodes";
// import { RClick } from "./core/mod_scripting";

import { Uri } from "./workspace";

// For now, these imports are commented out until implemented.
type RClick = any;
type Position = any;

export interface MessageOptions {

    /**
        * Indicates that this message should be modal.
        */
    modal?: boolean;

    /**
        * Human-readable detail message that is rendered less prominent. _Note_ that detail
        * is only shown for modal messages.
        */
    detail?: string;
}

export interface TreeNode {
    gnx: number;
    parent?: TreeNode;
    children?: TreeNode[];
    toggled?: boolean; // To track if node was toggled (expanded/collapsed) since last render
}
export interface NodeData {
    headString: string;
    bodyString: string;
    icon?: number; // Bitmask for icons: hasBody: 1, isMarked: 2, isClone: 4, isDirty: 8
}
export interface FlatRow {
    label: string;
    depth: number;
    toggled: boolean; // Will make it render with toggled class
    hasChildren: boolean;
    isExpanded: boolean;
    node: TreeNode;
    isSelected: boolean;
    isAncestor: boolean;      // Is ancestor of selected node
    isInitialFind: boolean;   // Used for find scope highlighting
    icon: number;             // Icon number for the node
}
export interface MenuEntry {
    label: string;
    action?: string;
    entries?: MenuEntry[];
}
export interface FileStat {
    type: 'file' | 'directory';
    size?: number;
    mtime?: number;
    permissions?: FilePermission;
}
/**
    * Permissions of a file.
    */
export enum FilePermission {
    /**
        * The file is readonly.
        *
        * *Note:* All `FileStat` from a `FileSystemProvider` that is registered with
        * the option `isReadonly: true` will be implicitly handled as if `FilePermission.Readonly`
        * is set. As a consequence, it is not possible to have a readonly file system provider
        * registered where some `FileStat` are not readonly.
        */
    Readonly = 1
};

export interface FilePath {
    name: string;
    handle: FileSystemDirectoryHandle;
}

/**
 * Options to configure the behaviour of a file open dialog.
 *
 * * Note 1: On Windows and Linux, a file dialog cannot be both a file selector and a folder selector, so if you
 * set both `canSelectFiles` and `canSelectFolders` to `true` on these platforms, a folder selector will be shown.
 * * Note 2: Explicitly setting `canSelectFiles` and `canSelectFolders` to `false` is futile
 * and the editor then silently adjusts the options to select files.
 */
export interface OpenDialogOptions {
    /**
     * The resource the dialog shows when opened.
     */
    defaultUri?: Uri;

    /**
     * A human-readable string for the open button.
     */
    openLabel?: string;

    /**
     * Allow to select files, defaults to `true`.
     */
    canSelectFiles?: boolean;

    /**
     * Allow to select folders, defaults to `false`.
     */
    canSelectFolders?: boolean;

    /**
     * Allow to select many files or folders.
     */
    canSelectMany?: boolean;

    /**
     * A set of file filters that are used by the dialog. Each entry is a human-readable label,
     * like "TypeScript", and an array of extensions, for example:
     * ```ts
     * {
     * 	'Images': ['png', 'jpg'],
     * 	'TypeScript': ['ts', 'tsx']
     * }
     * ```
     */
    filters?: { [name: string]: string[] };

    /**
     * Dialog title.
     *
     * This parameter might be ignored, as not all operating systems display a title on open dialogs
     * (for example, macOS).
     */
    title?: string;
}

/**
 * Options to configure the behaviour of a file save dialog.
 */
export interface SaveDialogOptions {
    /**
     * The resource the dialog shows when opened.
     */
    defaultUri?: Uri;

    /**
     * A human-readable string for the save button.
     */
    saveLabel?: string;

    /**
     * A set of file filters that are used by the dialog. Each entry is a human-readable label,
     * like "TypeScript", and an array of extensions, for example:
     * ```ts
     * {
     * 	'Images': ['png', 'jpg'],
     * 	'TypeScript': ['ts', 'tsx']
     * }
     * ```
     */
    filters?: { [name: string]: string[] };

    /**
     * Dialog title.
     *
     * This parameter might be ignored, as not all operating systems display a title on save dialogs
     * (for example, macOS).
     */
    title?: string;
}
export interface InputDialogOptions {
    title: string;
    prompt: string;
    placeholder?: string;
    value?: string;
}
/**
 * * Types of the various JSON configuration keys such as treeKeepFocus, defaultReloadIgnore, etc.
 */
export interface ConfigMembers {
    checkForChangeExternalFiles: string;
    defaultReloadIgnore: string;
    sessionPerWorkspace: boolean;
    leoTreeBrowse: boolean;
    treeKeepFocus: boolean;
    treeKeepFocusWhenAside: boolean;

    collapseAllShortcut: boolean;
    activityViewShortcut: boolean;
    goAnywhereShortcut: boolean;

    showUnlOnStatusBar: boolean,

    treeInExplorer: boolean;

    showFileOnOutline: boolean;
    showHoistDehoistOnOutline: boolean;
    showPrevNextOnOutline: boolean;
    showPromoteDemoteOnOutline: boolean;
    showRecentFilesOnOutline: boolean;
    showSettingsOnOutline: boolean;
    showShowLogOnOutline: boolean;
    showUndoRedoOnOutline: boolean;

    showEditOnNodes: boolean;
    showAddOnNodes: boolean;
    showMarkOnNodes: boolean;
    showCloneOnNodes: boolean;
    showCopyOnNodes: boolean;

    // showEditionOnBody: boolean; // clone delete insert(s)
    // showClipboardOnBody: boolean; // cut copy paste(s)
    // showPromoteOnBody: boolean; // promote demote
    // showExecuteOnBody: boolean; // extract(s)
    // showExtractOnBody: boolean;
    // showImportOnBody: boolean;
    // showRefreshOnBody: boolean;
    // showHoistOnBody: boolean;
    // showMarkOnBody: boolean;
    // showSortOnBody: boolean;

    invertNodeContrast: boolean;
    leoID: string;
}

/**
 * * Structure for configuration settings changes used along with welcome/settings webview.
 */
export interface ConfigSetting {
    code: string;
    value: any;
}

/**
 * * Location of focus to be set when current/last command is resolved
 */
export const enum Focus {
    NoChange = 0, // Stays on goto pane, or other current panel.
    Body, // Forces body to appear, refresh leaves focus on body.
    Outline, // Forces outline to appear, refresh leaves focus on Outline.
    Goto
}

/**
 * * When refreshing the outline and getting to Leo's selected node
 */
export const enum RevealType {
    NoReveal = 0, // Re-use the old treeId with "NoReveal" for the selected node.
    Reveal,
    RevealSelect,
    RevealSelectFocus
}

/**
 * * Required Refresh Dictionary of "elements to refresh" flags
 */
export interface ReqRefresh {
    node?: boolean; // Reveal received selected node (Navigation only, no tree change)
    tree?: boolean; // Tree needs refresh
    body?: boolean; // Body needs refresh
    excludeDetached?: boolean; // Body needs refresh EXCLUDE DETACHED

    scroll?: boolean; // Body needs to set and reveal text selection

    states?: boolean; // Currently opened tree view states needs refresh:
    // changed, canUndo, canRedo, canGoBack, canGoNext, canDemote, canPromote, 
    // canHoist, canDehoist, inChapter, topHoistChapter

    buttons?: boolean; // Buttons needs refresh
    documents?: boolean; // Documents needs refresh
    goto?: boolean; // Goto pane needs refresh
}

export interface CommandOptions {
    node?: Position, // facultative, precise node onto which the command is run (also see p_keepSelection)
    refreshType: ReqRefresh, // Object containing flags for sections needing to refresh after command ran
    finalFocus: Focus, // final focus placement
    keepSelection?: boolean, // flag to bring back selection on the original node
    isNavigation?: boolean // Navigation commands force-show the body and outline
}

/**
 * * LeoBody virtual file time information object
 */
export interface BodyTimeInfo {
    ctime: number;
    mtime: number;
    lastBodyLength?: number;
}

/**
 * * General state flags for UI representation and controls visibility.
 */
export interface LeoPackageStates {
    changed: boolean; // Leo document has changed (is dirty)
    canUndo: boolean; // Leo document can undo the last operation done
    canRedo: boolean; // Leo document can redo the last operation 'undone'
    canGoBack: boolean; // Has history
    canGoNext: boolean; // Has used goBack at least once
    canDemote: boolean; // Currently selected node can have its siblings demoted
    canPromote: boolean; // Currently selected node can have its children promoted
    canDehoist: boolean; // Leo Document is currently hoisted and can be de-hoisted
    canHoist: boolean; // Selected node is not the first top node already root
    topIsChapter: boolean; // Top of the hoisted outline is an @chapter node
}

/**
 * * Leo document structure used in the 'Opened Leo Documents' tree view provider
 */
export interface LeoDocument {
    name: string;
    index: number;
    changed: boolean;
    selected: boolean;
}

/**
 * * Leo '@button' structure used in the '@buttons' tree view provider
 */
export interface LeoButton {
    name: string;
    index: number;
    rclicks?: RClick[];
}

export type TGotoTypes = "tag" | "headline" | "body" | "parent" | "generic";

export interface LeoGoto {
    key: number; // id from python
    h: string;
    t: TGotoTypes;
}

export const enum LeoGotoNavKey {
    prev = 0,
    next,
    first,
    last
}

/**
 * * Enum type for the search scope radio buttons of the find panel.
 */
export const enum LeoSearchScope {
    entireOutline = 0,
    subOutlineOnly,
    nodeOnly,
    fileOnly
}

/**
 * * Search settings structure for use with the 'find' webview
 */
export interface LeoSearchSettings {
    // Nav options
    navText: string;
    isTag: boolean;
    showParents: boolean;
    searchOptions: number;
    // Find/change strings...
    findText: string;  // find_text
    replaceText: string; // change_text
    // Find options...
    wholeWord: boolean;
    ignoreCase: boolean;
    regExp: boolean;
    markFinds: boolean;
    markChanges: boolean;
    searchHeadline: boolean;
    searchBody: boolean;
    searchScope: LeoSearchScope; // 0, 1 or 2 for outline, sub-outline, or node.
}

/**
 * * Leo's GUI search settings internal structure
 */
export interface LeoGuiFindTabManagerSettings {
    // Nav options
    nav_text: string;
    is_tag: boolean;
    show_parents: boolean;
    search_options: number;
    //Find/change strings...
    find_text: string,
    change_text: string,
    // Find options...
    ignore_case: boolean,
    mark_changes: boolean,
    mark_finds: boolean,
    node_only: boolean,
    file_only: boolean,
    pattern_match: boolean,
    search_body: boolean,
    search_headline: boolean,
    suboutline_only: boolean,
    whole_word: boolean
}

/**
 * * LeoBody virtual file time information object
 */
export interface BodyTimeInfo {
    ctime: number;
    mtime: number;
}

/**
 * * Body position
 * Used in BodySelectionInfo interface
 */
export interface BodyPosition {
    line: number;
    col: number;
}

/**
 * * LeoBody cursor active position and text selection state, along with gnx
 */
export interface BodySelectionInfo {
    gnx: string;
    // scroll is stored as-is as the 'scrollBarSpot' in Leo
    // ! TEST scroll as single number only (for Leo vertical scroll value)
    scroll: number;
    // scroll: {
    //     start: BodyPosition;
    //     end: BodyPosition;
    // }
    insert: BodyPosition;
    start: BodyPosition;
    end: BodyPosition;
}

/**
 * * Parameter structure used in the 'runSaveFileDialog' equivalent when asking user input
 */
export interface showSaveAsDialogParameters {
    "initialFile": string;
    "title": string;
    "message": string;
    "filetypes": string[];
}

/**
 * * Parameter structure used in the 'runAskYesNoDialog' equivalent when asking user input
 */
export interface runAskYesNoDialogParameters {
    "ask": string;
    "message": string;
    "yes_all": boolean;
    "no_all": boolean;
}

/**
 * * Parameter structure used in the 'runAskOkDialog' equivalent when showing a warning
 */
export interface runWarnMessageDialogParameters {
    "warn": string;
    "message": string;
}

/**
 * * Parameter structure for non-blocking info message about detected file changes
 */
export interface runInfoMessageDialogParameters {
    "message": string;
}

/**
 * * Used in showAskModalDialog to get answer from user interaction
 */
export interface AskMessageItem {
    label: string;
    description?: string;
    value: string;
}

/**
 * * Used in switch Leo document to get answer from user interaction
 */
export interface ChooseDocumentItem {
    value: number;
    label: string;
    description?: string;
}

/**
 * * Used to select a button's rclick by index
 */
export interface ChooseRClickItem {
    index: number;
    rclick?: RClick;
    label: string;
    description?: string;
}

/**
 * * Used by the minibuffer command pallette
 */
export interface MinibufferCommand {
    func: string;
    label: string;
    description?: string;
}

export type UnlType = 'shortGnx' | 'fullGnx' | 'shortLegacy' | 'fullLegacy';


/**
    * Represents an item that can be selected from
    * a list of items.
    */
export interface QuickPickItem {

    /**
        * A human-readable string which is rendered prominent. 
        */
    label: string;

    /**
        * The kind of QuickPickItem that will determine how this item is rendered in the quick pick. When not specified,
        * the default is QuickPickItemKind.Default.
        */
    kind?: QuickPickItemKind;

    /**
        * A human-readable string which is rendered less prominent in the same line.
        * Note: this property is ignored when kind is set to QuickPickItemKind.Separator
        */
    description?: string;

    /**
        * A human-readable string which is rendered less prominent in a separate line. 
        * Note: this property is ignored when kind is set to QuickPickItemKind.Separator
        */
    detail?: string;

    /**
        * Optional flag indicating if this item is picked initially. 
        * Note: this property is ignored when kind is set to QuickPickItemKind.Separator
        */
    picked?: boolean;

    /**
        * Always show this item.
        *
        * Note: this property is ignored when kind is set to QuickPickItemKind.Separator
        */
    alwaysShow?: boolean;

}

export enum QuickPickItemKind {
    /**
        * The item is just a visual separator and does not represent a real item.
        */
    Separator = -1,
    /**
        * The default is an item that can be selected in the quick pick.
        */
    Default = 0,
}


/**
    * Options to configure the behavior of the quick pick UI.
    */
export interface QuickPickOptions {

    /**
        * An optional string that represents the title of the quick pick.
        */
    title?: string;

    /**
        * An optional string to show as placeholder in the input box to guide the user what to pick on.
        */
    placeHolder?: string;

    /**
        * An optional function that is invoked whenever an item is selected.
        */
    onDidSelectItem?(item: QuickPickItem | string): any;
}
