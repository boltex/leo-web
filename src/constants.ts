/**
 * Text and numeric constants used throughout leo-web.
 */
export class Constants {

    /**
     * Identity of account that can publish extensions to the Visual Studio Code Marketplace. 
     */
    public static PUBLISHER: string = "boltex";

    /**
     * The name of the extension - should be all lowercase with no spaces.
     */
    public static NAME: string = "leoWeb";

    public static VERSION_STATE_KEY: string = "leoWebVersion";

    public static FILE_EXTENSION: string = "leo";
    public static DB_FILE_EXTENSION: string = "db";
    public static JS_FILE_EXTENSION: string = "leojs";

    public static UNTITLED_FILE_NAME: string = "untitled";

    public static LOCAL_STORAGE_KEY: string = "leoWebConfig";
    public static REFRESH_DEBOUNCE_DELAY: number = 0;
    public static STATES_DEBOUNCE_DELAY: number = 40;

    /**
     * Supported Languages
     */
    public static LANGUAGES = [
        "plain",
        "julia",
        "batch",
        "shell",
        "python",
        "javascript",
        "typescript",
        "c",
        "cpp",
        "css",
        "fortran",
        "fortran90",
        "html",
        "java",
        "json",
        "markdown",
        "php",
        "restructuredtext",
        "rust",
        "xml",
    ];

    /**
     * * Configuration Defaults used in config.ts
     */
    public static CONFIG_DEFAULTS = {
        CHECK_FOR_CHANGE_EXTERNAL_FILES: "none",
        DEFAULT_RELOAD_IGNORE: "none",
        LEO_ID: ""
    };
    public static CHECK_FOR_CHANGE_EXTERNAL_FILES_OPTIONS = {
        "none": "Default from Leo's config",
        "force-check": "Check for changes",
        "force-ignore": "Ignore all changes"
    }
    public static DEFAULT_RELOAD_IGNORE_OPTIONS = {
        "none": "Choose each time",
        "yes-all": "Reload All",
        "no-all": "Ignore All"
    }

    /**
     * Basic user messages strings for messages and dialogs
     */
    public static USER_MESSAGES = {
        SCRIPT_BUTTON: "from selected node",
        SCRIPT_BUTTON_TOOLTIP:
            "Creates a new button with the presently selected node.\n" +
            "For example, to run a script on any part of an outline:\n" +
            "\n" +
            "1.  Select the node containing a script. e.g. \"g.es(p.h)\"\n" +
            "2.  Press 'Script Button' to create a new button.\n" +
            "3.  Select another node on which to run the script.\n" +
            "4.  Press the *new* button.",
        SAVE_CHANGES: "Save changes to",
        SAVE_DIALOG_LABEL: "Save Leo File",
        BEFORE_CLOSING: "before closing?",
        CANCEL: "Cancel",
        OPEN_WITH_LEO: "Open this Leo file?",
        OPEN_RECENT_FILE: "Open Recent Leo File",
        RIGHT_CLICK_TO_OPEN: "Right-click to open with leo",
        FILE_ALREADY_OPENED: "Leo file already opened",

        CLEARED_RECENT: "Cleared recent files list",
        CHOOSE_OPENED_FILE: "Select an opened Leo File",
        FILE_NOT_OPENED: "No files opened.",

        PROMPT_EDIT_HEADLINE: "Edit Headline",
        PROMPT_INSERT_NODE: "Insert Node",
        PROMPT_INSERT_CHILD: "Insert Child",
        DEFAULT_HEADLINE: "New Headline",

        TITLE_GOTO_GLOBAL_LINE: "Goto global line", // TODO : REMOVE IF NOT USED
        PLACEHOLDER_GOTO_GLOBAL_LINE: "#", // TODO : REMOVE IF NOT USED
        PROMPT_GOTO_GLOBAL_LINE: "Line number", // TODO : REMOVE IF NOT USED

        REPLACE_TITLE: "Replace with",
        REPLACE_PROMPT: "Type text to replace with and press enter.",
        REPLACE_PLACEHOLDER: "Replace pattern here",

        SEARCH_TITLE: "Search for",
        SEARCH_PROMPT: "Type text to search for and press enter.",
        SEARCH_PLACEHOLDER: "Find pattern here",

        INT_SEARCH_TITLE: "Search",
        INT_SEARCH_PROMPT: "'Enter' to search",
        INT_SEARCH_BACKWARD: " Backward", // Leading space intended
        INT_SEARCH_REGEXP: "Regexp ", // Trailing space intended
        INT_SEARCH_WORD: "Word ", // Trailing space intended

        SEARCH_NOT_FOUND: "Not found",
        FIND_PATTERN_HERE: "<find pattern here>",

        TAGS_CHARACTERS_ERROR: "Cannot add tags containing any of these characters: &|^-",
        NO_TAGS_ON_NODE: "No tags on node: ", // Trailing space intended

        TITLE_TAG_CHILDREN: "Tag Children",
        TITLE_REMOVE_TAG: "Remove Tag",
        TITLE_TAG_NODE: "Tag Node",
        PLACEHOLDER_TAG: "<tag>",
        PROMPT_TAG: "Enter a tag name",

        TITLE_FIND_TAG: "Find Tag", // TODO remove if used directly in leoFind.ts
        PLACEHOLDER_CLONE_FIND_TAG: "<tag>", // TODO remove if used directly in leoFind.ts
        PROMPT_CLONE_FIND_TAG: "Enter a tag name",// TODO remove if used directly in leoFind.ts

        CLOSE_ERROR: "Cannot close: No files opened.",
        YES: "Yes",
        NO: "No",
        YES_ALL: "Yes to all",
        NO_ALL: "No to all",
        CHOOSE_BUTTON: "Choose @button or @rclick",
        SEARCH_POSITION_BY_HEADLINE: "Search positions by headline",
        MINIBUFFER_PROMPT: "Minibuffer Full Command",
        SELECT_CHAPTER_PROMPT: "Select chapter",
        CHANGES_DETECTED: "Changes to external files were detected.",
        REFRESHED: " Nodes refreshed.", // with voluntary leading space
        IGNORED: " They were ignored.", // with voluntary leading space
        TOO_FAST: "Leo is busy! ", // with voluntary trailing space

        LANGUAGE_NOT_SUPPORTED: " language coloring not yet supported.", // with leading space
        MINIBUFFER_BUTTON_START: "@button-",
        MINIBUFFER_RCLICK_START: "@rclick-",
        MINIBUFFER_SCRIPT_BUTTON: "script-button",
        MINIBUFFER_DEL_SCRIPT_BUTTON: "delete-script-",
        MINIBUFFER_DEL_BUTTON_START: "delete-@button-",
        MINIBUFFER_COMMAND_START: "@command-",
        MINIBUFFER_USER_DEFINED: "User defined command.",
        MINIBUFFER_BUTTON: "$(run) @button",
        MINIBUFFER_RCLICK: "$(chevron-right) @rclick",
        MINIBUFFER_COMMAND: "$(zap) @command",
        MINIBUFFER_BAD_COMMAND: "$(error) Not Available",
        MINIBUFFER_HISTORY_LABEL: "Minibuffer History",
        MINIBUFFER_HISTORY_DESC: "Choose from last run commands...",

        FIX_IT: "Fix it",
        ENABLE_PREVIEW_SET: "'Enable Preview' setting was set",
        ENABLE_PREVIEW_RECOMMEND: "'Enable Preview' setting is recommended (currently disabled)",
        CLOSE_EMPTY_CLEARED: "'Close Empty Groups' setting was cleared",
        CLOSE_EMPTY_RECOMMEND: "'Close Empty Groups' setting is NOT recommended!",
        SET_LEO_ID_MESSAGE: "Leo ID not found. Please enter an id that identifies you uniquely.",
        GET_LEO_ID_PROMPT: "Please enter an id that identifies you uniquely.\n(Letters and numbers only, and at least 3 characters in length)",
        ENTER_LEO_ID: "Enter Leo id"
    };

    /**
     * Used in 'when' clauses, set with vscode.commands.executeCommand("setContext",...)
     */
    public static CONTEXT_FLAGS = {
        // Main flags for connection and opened file
        LEO_STARTUP_DONE: "leoWebStartupDone",
        LEO_OPENING_FILE: "leoWebOpeningFile",
        LEO_ID_UNSET: "leoWebIdUnset",
        LEO_READY: "leoWebReady", // Extension activated and classes created and ready
        TREE_OPENED: "leoWebTreeOpened", // At least one Leo file opened
        TREE_TITLED: "leoWebTreeTitled", // Tree is a Leo file and not a new untitled document

        // 'states' flags for currently opened tree view
        LEO_CHANGED: "leoWebChanged",
        LEO_CAN_UNDO: "leoWebCanUndo",
        LEO_CAN_REDO: "leoWebCanRedo",
        LEO_CAN_BACK: "leoWebCanGoBack",
        LEO_CAN_NEXT: "leoWebCanGoNext",
        LEO_CAN_DEMOTE: "leoWebCanDemote",
        LEO_CAN_PROMOTE: "leoWebCanPromote",
        LEO_CAN_DEHOIST: "leoWebCanDehoist",
        LEO_CAN_HOIST: "leoWebCanHoist", // isNotRoot equivalent, Computed by hand
        LEO_TOP_HOIST_CHAPTER: "leoWebTopHoistChapter",
        LEO_EDIT_HEADLINE: "leoWebEditHeadline",

        // 'states' flags about current selection, for visibility and commands availability
        SELECTED_MARKED: "leoWebMarked", // no need for unmarked here, use !leoWebMarked
        SELECTED_CLONE: "leoWebCloned",
        SELECTED_DIRTY: "leoWebDirty",
        SELECTED_EMPTY: "leoWebEmpty",
        SELECTED_CHILD: "leoWebChild", // Has children
        SELECTED_ATFILE: "leoWebAtFile", // Can be refreshed
        SELECTED_ATLEOFILE: "leoWebAtLeoFile", // Can be used with 'open-at-leo-file' command

        // Statusbar Flag 'keybindings in effect'
        LEO_SELECTED: "leoWebObjectSelected", // keybindings "On": Outline or body has focus

        // Context Flags for 'when' clauses, used concatenated, for each outline node
        NODE_MARKED: "leoWebNodeMarked",  // Selected node is marked
        NODE_UNMARKED: "leoWebNodeUnmarked", // Selected node is unmarked (Needed for regexp)
        NODE_ATFILE: "leoWebNodeAtFile", // Selected node is an @file or @clean, etc...
        NODE_ATLEOFILE: "leoWebNodeAtLeoFile", // Selected node is an @leo file
        NODE_CLONED: "leoWebNodeCloned",
        NODE_ROOT: "leoWebNodeRoot",
        NODE_NOT_ROOT: "leoWebNodeNotRoot",
        NODE_TAGS: "leoWebNodeTags",

        // Flags for undo nodes 
        UNDO_BEAD: "leoWebUndoNode",
        NOT_UNDO_BEAD: "leoWebNoUndoNode",

        // Flags for Leo documents tree view icons and hover node command buttons
        DOCUMENT_SELECTED_TITLED: "leoWebDocumentSelectedTitled",
        DOCUMENT_TITLED: "leoWebDocumentTitled",
        DOCUMENT_SELECTED_UNTITLED: "leoWebDocumentSelectedUntitled",
        DOCUMENT_UNTITLED: "leoWebDocumentUntitled",

        // Flags for focus context
        FOCUS_FIND: "leoWebFindFocus",

    };

    /**
     * Command strings to be used with vscode.commands.executeCommand
     * See https://code.visualstudio.com/api/extension-guides/command#programmatically-executing-a-command
     */
    public static VSCODE_COMMANDS = {
        SET_CONTEXT: "setContext",
        CLOSE_ACTIVE_EDITOR: "workbench.action.closeActiveEditor",
        QUICK_OPEN: "workbench.action.quickOpen"
    };

    /**
     * All commands this expansion exposes to the user via GUI/keybindings in package.json
     */
    public static COMMANDS = {

        // Frame body text commands 
        CUT_TEXT: Constants.NAME + ".cutText",
        COPY_TEXT: Constants.NAME + ".copyText",
        PASTE_TEXT: Constants.NAME + ".pasteText",
        SELECT_ALL_TEXT: Constants.NAME + ".selectAllText",

        OPEN_LEO_SETTINGS: Constants.NAME + ".openLeoSettings",
        RELOAD_SETTINGS: Constants.NAME + ".reloadSettings",

        // Window/UI
        DOCUMENTATION: Constants.NAME + ".documentation",
        ABOUT_LEO: Constants.NAME + ".aboutLeo",
        LIGHT_THEME: Constants.NAME + ".lightTheme",
        DARK_THEME: Constants.NAME + ".darkTheme",
        HORIZONTAL_LAYOUT: Constants.NAME + ".horizontalLayout",
        VERTICAL_LAYOUT: Constants.NAME + ".verticalLayout",
        EQUAL_SIZED_PANES: Constants.NAME + ".equalSizedPanes",
        CHOOSE_NEW_WORKSPACE: Constants.NAME + ".chooseNewWorkspace",

        // Access to the Settings/Welcome Webview
        SHOW_WELCOME: Constants.NAME + ".showWelcomePage", // Always available: not in the commandPalette section of package.json
        SHOW_SETTINGS: Constants.NAME + ".showSettingsPage", // Always available: not in the commandPalette section of package.json
        STATUS_BAR: Constants.NAME + ".statusBar", // Status Bar Click Command
        // Leo Documents
        SET_OPENED_FILE: Constants.NAME + ".setOpenedFile",
        OPEN_FILE: Constants.NAME + ".openLeoFile", // sets focus on BODY
        REVERT: Constants.NAME + ".revert",
        CLEAR_RECENT_FILES: Constants.NAME + ".clearRecentFiles",
        // Import Export Commands
        IMPORT_ANY_FILE: Constants.NAME + ".importAnyFile",
        READ_FILE_INTO_NODE: Constants.NAME + ".readFileIntoNode",
        EXPORT_HEADLINES: Constants.NAME + ".exportHeadlines",
        FLATTEN_OUTLINE: Constants.NAME + ".flattenOutline",
        OUTLINE_TO_CWEB: Constants.NAME + ".outlineToCweb",
        OUTLINE_TO_NOWEB: Constants.NAME + ".outlineToNoweb",
        REMOVE_SENTINELS: Constants.NAME + ".removeSentinels",
        WEAVE: Constants.NAME + ".weave",
        WRITE_FILE_FROM_NODE: Constants.NAME + ".writeFileFromNode",
        // Leo Document Files
        RECENT_FILES: Constants.NAME + ".recentLeoFiles", // shows recent Leo files, opens one on selection
        SWITCH_FILE: Constants.NAME + ".switchLeoFile",
        NEW_FILE: Constants.NAME + ".newLeoFile",
        SAVE_FILE: Constants.NAME + ".saveLeoFile",
        SAVE_FILE_FO: Constants.NAME + ".saveLeoFileFromOutline",
        SAVE_AS_FILE: Constants.NAME + ".saveAsLeoFile",
        SAVE_AS_LEOJS: Constants.NAME + ".saveAsLeoJsFile",
        CLOSE_FILE: Constants.NAME + ".closeLeoFile",
        MINIBUFFER: Constants.NAME + ".minibuffer",
        SET_LEO_ID: Constants.NAME + ".setLeoID",
        GOTO_LINE_IN_LEO_OUTLINE: Constants.NAME + ".gotoLineInLeoOutline",
        IMPORT_INTO_LEO_OUTLINE: Constants.NAME + ".importIntoLeoOutline",
        HANDLE_UNL: Constants.NAME + ".handleUnl",
        SHORT_GNX_UNL_TO_CLIPBOARD: Constants.NAME + ".shortGnxUnlToClipboard",
        FULL_GNX_UNL_TO_CLIPBOARD: Constants.NAME + ".fullGnxUnlToClipboard",
        SHORT_LEGACY_UNL_TO_CLIPBOARD: Constants.NAME + "shortLegacyUnlToClipboard",
        FULL_LEGACY_UNL_TO_CLIPBOARD: Constants.NAME + "fullLegacyUnlToClipboard",
        GIT_DIFF: Constants.NAME + ".gitDiff",
        TAB_CYCLE_NEXT: Constants.NAME + ".tabCycleNext",
        WRITE_AT_FILE_NODES: Constants.NAME + ".writeAtFileNodes",
        WRITE_AT_FILE_NODES_FO: Constants.NAME + ".writeAtFileNodesFromOutline",
        WRITE_DIRTY_AT_FILE_NODES: Constants.NAME + ".writeDirtyAtFileNodes",
        WRITE_DIRTY_AT_FILE_NODES_FO: Constants.NAME + ".writeDirtyAtFileNodesFromOutline",
        // At-buttons
        CLICK_BUTTON: Constants.NAME + ".clickButton",
        REMOVE_BUTTON: Constants.NAME + ".removeButton",
        GOTO_SCRIPT: Constants.NAME + ".gotoScript",
        // Outline Node User Interaction
        SELECT_NODE: Constants.NAME + ".selectTreeNode",
        OPEN_ASIDE: Constants.NAME + ".openAside", // Opens aside a body pane locked to this gnx & commander.
        // Goto operations that always finish with focus in outline
        PAGE_UP: Constants.NAME + ".pageUp",
        PAGE_DOWN: Constants.NAME + ".pageDown",
        GOTO_FIRST_VISIBLE: Constants.NAME + ".gotoFirstVisible",
        GOTO_LAST_VISIBLE: Constants.NAME + ".gotoLastVisible",
        GOTO_FIRST_SIBLING: Constants.NAME + ".gotoFirstSibling",
        GOTO_LAST_SIBLING: Constants.NAME + ".gotoLastSibling",
        GOTO_NEXT_VISIBLE: Constants.NAME + ".gotoNextVisible",
        GOTO_PREV_VISIBLE: Constants.NAME + ".gotoPrevVisible",
        GOTO_NEXT_MARKED: Constants.NAME + ".gotoNextMarked",
        GOTO_PREV_MARKED: Constants.NAME + ".gotoPrevMarked",
        GOTO_NEXT_CLONE: Constants.NAME + ".gotoNextClone",
        GOTO_NEXT_CLONE_SELECTION: Constants.NAME + ".gotoNextCloneSelection",
        GOTO_NEXT_CLONE_SELECTION_FO: Constants.NAME + ".gotoNextCloneSelectionFromOutline",
        CONTRACT_OR_GO_LEFT: Constants.NAME + ".contractOrGoLeft",
        EXPAND_AND_GO_RIGHT: Constants.NAME + ".expandAndGoRight",
        // Leo Operations
        UNDO: Constants.NAME + ".undo", // From command Palette
        UNDO_FO: Constants.NAME + ".undoFromOutline", // from button, return focus on OUTLINE
        REDO: Constants.NAME + ".redo", // From command Palette
        REDO_FO: Constants.NAME + ".redoFromOutline", // from button, return focus on OUTLINE
        REVERT_TO_UNDO: Constants.NAME + ".revertToUndo",
        EXECUTE: Constants.NAME + ".executeScript",
        SHOW_BODY: Constants.NAME + ".showBody",
        SHOW_OUTLINE: Constants.NAME + ".showOutline",
        SHOW_LOG: Constants.NAME + ".showLogPane",
        SORT_CHILDREN: Constants.NAME + ".sortChildrenSelection",
        SORT_CHILDREN_FO: Constants.NAME + ".sortChildrenSelectionFromOutline",
        SORT_SIBLINGS: Constants.NAME + ".sortSiblingsSelection",
        SORT_SIBLINGS_FO: Constants.NAME + ".sortSiblingsSelectionFromOutline",
        CONTRACT_ALL_OTHER_NODES: Constants.NAME + ".contractAllOtherNodes", // From command Palette
        CONTRACT_ALL: Constants.NAME + ".contractAll", // From command Palette
        CONTRACT_ALL_FO: Constants.NAME + ".contractAllFromOutline", // from button, return focus on OUTLINE
        // TODO : hook up
        CONTRACT_NODE: Constants.NAME + ".contractNode",
        CONTRACT_PARENT: Constants.NAME + ".contractParent",
        EXPAND_PREV_LEVEL: Constants.NAME + ".expandPrevLevel",
        EXPAND_NEXT_LEVEL: Constants.NAME + ".expandNextLevel",
        EXPAND_OR_GO_RIGHT: Constants.NAME + ".expandOrGoRight",
        EXPAND_TO_LEVEL_1: Constants.NAME + ".expandToLevel1",
        EXPAND_TO_LEVEL_2: Constants.NAME + ".expandToLevel2",
        EXPAND_TO_LEVEL_3: Constants.NAME + ".expandToLevel3",
        EXPAND_TO_LEVEL_4: Constants.NAME + ".expandToLevel4",
        EXPAND_TO_LEVEL_5: Constants.NAME + ".expandToLevel5",
        EXPAND_TO_LEVEL_6: Constants.NAME + ".expandToLevel6",
        EXPAND_TO_LEVEL_7: Constants.NAME + ".expandToLevel7",
        EXPAND_TO_LEVEL_8: Constants.NAME + ".expandToLevel8",
        EXPAND_ALL: Constants.NAME + ".expandAll",
        EXPAND_NODE: Constants.NAME + ".expandNode",

        FIND_NEXT_CLONE: Constants.NAME + ".findNextClone",
        GOTO_FIRST_NODE: Constants.NAME + ".gotoFirstNode",

        GOTO_NEXT_CHANGED: Constants.NAME + ".gotoNextChanged",
        GOTO_NEXT_NODE: Constants.NAME + ".gotoNextNode",
        GOTO_NEXT_SIBLING: Constants.NAME + ".gotoNextSibling",
        GO_FORWARD: Constants.NAME + ".goForward",
        GOTO_PARENT: Constants.NAME + ".gotoParent",
        GOTO_PREV_NODE: Constants.NAME + ".gotoPrevNode",
        GOTO_PREV_SIBLING: Constants.NAME + ".gotoPrevSibling",
        GO_BACK: Constants.NAME + ".goBack",
        GOTO_LAST_NODE: Constants.NAME + ".gotoLastNode",

        PREV_NODE: Constants.NAME + ".prev",
        PREV_NODE_FO: Constants.NAME + ".prevFromOutline",
        NEXT_NODE: Constants.NAME + ".next",
        NEXT_NODE_FO: Constants.NAME + ".nextFromOutline",
        // Commands from tree panel buttons or context: focus on OUTLINE
        SET_UA: Constants.NAME + ".setUa",
        MARK: Constants.NAME + ".mark",
        UNMARK: Constants.NAME + ".unmark",
        COPY: Constants.NAME + ".copyNode",
        CUT: Constants.NAME + ".cutNode",
        PASTE: Constants.NAME + ".pasteNode",
        PASTE_CLONE: Constants.NAME + ".pasteNodeAsClone",
        PASTE_AS_TEMPLATE: Constants.NAME + ".pasteAsTemplate",
        DELETE: Constants.NAME + ".delete",
        HEADLINE: Constants.NAME + ".editHeadline",
        MOVE_DOWN: Constants.NAME + ".moveOutlineDown",
        MOVE_LEFT: Constants.NAME + ".moveOutlineLeft",
        MOVE_RIGHT: Constants.NAME + ".moveOutlineRight",
        MOVE_UP: Constants.NAME + ".moveOutlineUp",
        INSERT: Constants.NAME + ".insertNode",
        INSERT_CHILD: Constants.NAME + ".insertChildNode",
        CLONE: Constants.NAME + ".cloneNode",
        PROMOTE: Constants.NAME + ".promote",
        DEMOTE: Constants.NAME + ".demote",
        REFRESH_FROM_DISK: Constants.NAME + ".refreshFromDisk",
        OPEN_AT_LEO_FILE: Constants.NAME + ".openAtLeoFile",
        // Commands from keyboard, while focus on BODY (command-palette returns to BODY for now)
        MARK_SELECTION: Constants.NAME + ".markSelection",
        UNMARK_SELECTION: Constants.NAME + ".unmarkSelection",
        COPY_SELECTION: Constants.NAME + ".copyNodeSelection", // Nothing to refresh/focus so no "FO" version
        CUT_SELECTION: Constants.NAME + ".cutNodeSelection",
        PASTE_SELECTION: Constants.NAME + ".pasteNodeAtSelection",
        PASTE_CLONE_SELECTION: Constants.NAME + ".pasteNodeAsCloneAtSelection",
        DELETE_SELECTION: Constants.NAME + ".deleteSelection",
        HEADLINE_SELECTION: Constants.NAME + ".editSelectedHeadline",
        MOVE_DOWN_SELECTION: Constants.NAME + ".moveOutlineDownSelection",
        MOVE_LEFT_SELECTION: Constants.NAME + ".moveOutlineLeftSelection",
        MOVE_RIGHT_SELECTION: Constants.NAME + ".moveOutlineRightSelection",
        MOVE_UP_SELECTION: Constants.NAME + ".moveOutlineUpSelection",
        INSERT_SELECTION: Constants.NAME + ".insertNodeSelection", // Can be interrupted
        INSERT_SELECTION_INTERRUPT: Constants.NAME + ".insertNodeSelectionInterrupt", // Interrupted version
        INSERT_CHILD_SELECTION: Constants.NAME + ".insertChildNodeSelection", // Can be interrupted
        INSERT_CHILD_SELECTION_INTERRUPT: Constants.NAME + ".insertChildNodeSelectionInterrupt", // Can be interrupted
        CLONE_SELECTION: Constants.NAME + ".cloneNodeSelection",
        PROMOTE_SELECTION: Constants.NAME + ".promoteSelection",
        DEMOTE_SELECTION: Constants.NAME + ".demoteSelection",
        REFRESH_FROM_DISK_SELECTION: Constants.NAME + ".refreshFromDiskSelection",
        OPEN_AT_LEO_FILE_SELECTION: Constants.NAME + ".openAtLeoFileSelection",
        // Commands from keyboard, while focus on OUTLINE (no need for COPY_SELECTION)
        MARK_SELECTION_FO: Constants.NAME + ".markSelectionFromOutline",
        UNMARK_SELECTION_FO: Constants.NAME + ".unmarkSelectionFromOutline",
        CUT_SELECTION_FO: Constants.NAME + ".cutNodeSelectionFromOutline",
        PASTE_SELECTION_FO: Constants.NAME + ".pasteNodeAtSelectionFromOutline",
        PASTE_CLONE_SELECTION_FO: Constants.NAME + ".pasteNodeAsCloneAtSelectionFromOutline",
        DELETE_SELECTION_FO: Constants.NAME + ".deleteSelectionFromOutline",
        HEADLINE_SELECTION_FO: Constants.NAME + ".editSelectedHeadlineFromOutline",
        MOVE_DOWN_SELECTION_FO: Constants.NAME + ".moveOutlineDownSelectionFromOutline",
        MOVE_LEFT_SELECTION_FO: Constants.NAME + ".moveOutlineLeftSelectionFromOutline",
        MOVE_RIGHT_SELECTION_FO: Constants.NAME + ".moveOutlineRightSelectionFromOutline",
        MOVE_UP_SELECTION_FO: Constants.NAME + ".moveOutlineUpSelectionFromOutline",
        INSERT_SELECTION_FO: Constants.NAME + ".insertNodeSelectionFromOutline",
        INSERT_CHILD_SELECTION_FO: Constants.NAME + ".insertChildNodeSelectionFromOutline",
        CLONE_SELECTION_FO: Constants.NAME + ".cloneNodeSelectionFromOutline",
        PROMOTE_SELECTION_FO: Constants.NAME + ".promoteSelectionFromOutline",
        DEMOTE_SELECTION_FO: Constants.NAME + ".demoteSelectionFromOutline",
        REFRESH_FROM_DISK_SELECTION_FO: Constants.NAME + ".refreshFromDiskSelectionFromOutline",
        OPEN_AT_LEO_FILE_SELECTION_FO: Constants.NAME + ".openAtLeoFileSelectionFromOutline",
        HOIST: Constants.NAME + ".hoistNode",
        HOIST_SELECTION: Constants.NAME + ".hoistSelection",
        HOIST_SELECTION_FO: Constants.NAME + ".hoistSelectionFromOutline",
        DEHOIST: Constants.NAME + ".deHoist",
        DEHOIST_FO: Constants.NAME + ".deHoistFromOutline",
        CHAPTER_NEXT: Constants.NAME + ".chapterNext",
        CHAPTER_BACK: Constants.NAME + ".chapterBack",
        CHAPTER_MAIN: Constants.NAME + ".chapterMain",
        CHAPTER_SELECT: Constants.NAME + ".chapterSelect",
        EXTRACT: Constants.NAME + ".extract",
        EXTRACT_NAMES: Constants.NAME + ".extractNames",
        COPY_MARKED: Constants.NAME + ".copyMarked",
        DIFF_MARKED_NODES: Constants.NAME + ".diffMarkedNodes",
        MARK_CHANGED_ITEMS: Constants.NAME + ".markChangedItems",
        MARK_SUBHEADS: Constants.NAME + ".markSubheads",
        UNMARK_ALL: Constants.NAME + ".unmarkAll",
        CLONE_MARKED_NODES: Constants.NAME + ".cloneMarkedNodes",
        DELETE_MARKED_NODES: Constants.NAME + ".deleteMarkedNodes",
        MOVE_MARKED_NODES: Constants.NAME + ".moveMarkedNodes",

        FIND_QUICK: Constants.NAME + ".findQuick",
        FIND_QUICK_SELECTED: Constants.NAME + ".findQuickSelected",
        FIND_QUICK_TIMELINE: Constants.NAME + ".findQuickTimeline",
        FIND_QUICK_CHANGED: Constants.NAME + ".findQuickChanged",
        FIND_QUICK_HISTORY: Constants.NAME + ".history",
        FIND_QUICK_MARKED: Constants.NAME + ".markedList",
        FIND_QUICK_GO_ANYWHERE: Constants.NAME + ".goAnywhere",
        GOTO_NAV_ENTRY: Constants.NAME + ".gotoNav",

        GOTO_NAV_PREV: Constants.NAME + ".gotoNavPrev",
        GOTO_NAV_NEXT: Constants.NAME + ".gotoNavNext",
        GOTO_NAV_FIRST: Constants.NAME + ".gotoNavFirst",
        GOTO_NAV_LAST: Constants.NAME + ".gotoNavLast",

        CAPITALIZE_HEADLINE: Constants.NAME + ".capitalizeHeadline",
        END_EDIT_HEADLINE: Constants.NAME + ".endEditHeadline",
        INSERT_HEADLINE_TIME: Constants.NAME + ".insertHeadlineTime",
        INSERT_BODY_TIME: Constants.NAME + ".insertBodyTime",
        REFORMAT_PARAGRAPH: Constants.NAME + ".reformatParagraph",
        RST3: Constants.NAME + ".rst3",

        HELP_FOR_FIND_COMMANDS: Constants.NAME + ".helpForFindCommands",
        HELP_FOR_MINIBUFFER: Constants.NAME + ".helpForMinibuffer",
        START_SEARCH: Constants.NAME + ".startSearch",
        SEARCH_BACKWARD: Constants.NAME + ".searchBackward",
        RE_SEARCH: Constants.NAME + ".reSearch",
        RE_SEARCH_BACKWARD: Constants.NAME + ".reSearchBackward",
        WORD_SEARCH: Constants.NAME + ".wordSearch",
        WORD_SEARCH_BACKWARD: Constants.NAME + ".wordSearchBackward",
        FIND_ALL: Constants.NAME + ".findAll",
        FIND_NEXT: Constants.NAME + ".findNext",
        FIND_NEXT_FO: Constants.NAME + ".findNextFromOutline",
        FIND_PREVIOUS: Constants.NAME + ".findPrevious",
        FIND_PREVIOUS_FO: Constants.NAME + ".findPreviousFromOutline",
        FIND_DEF: Constants.NAME + ".findDef",
        REPLACE: Constants.NAME + ".replace",
        REPLACE_FO: Constants.NAME + ".replaceFromOutline",
        REPLACE_THEN_FIND: Constants.NAME + ".replaceThenFind",
        REPLACE_THEN_FIND_FO: Constants.NAME + ".replaceThenFindFromOutline",
        REPLACE_ALL: Constants.NAME + ".replaceAll",

        CLONE_FIND_ALL: Constants.NAME + ".cloneFindAll",
        CLONE_FIND_ALL_FLATTENED: Constants.NAME + ".cloneFindAllFlattened",
        CLONE_FIND_TAG: Constants.NAME + ".cloneFindTag",
        CLONE_FIND_MARKED: Constants.NAME + ".cloneFindMarked",
        CLONE_FIND_FLATTENED_MARKED: Constants.NAME + ".cloneFindFlattenedMarked",

        CLONE_FIND_PARENTS: Constants.NAME + ".cloneFindParents",
        GOTO_GLOBAL_LINE: Constants.NAME + ".gotoGlobalLine",
        TAG_CHILDREN: Constants.NAME + ".tagChildren",
        TAG_NODE: Constants.NAME + ".tagNode",
        REMOVE_TAG: Constants.NAME + ".removeTag",
        REMOVE_TAGS: Constants.NAME + ".removeTags",
        SET_FIND_EVERYWHERE_OPTION: Constants.NAME + ".setFindEverywhereOption",
        SET_FIND_NODE_ONLY_OPTION: Constants.NAME + ".setFindNodeOnlyOption",
        SET_FIND_FILE_ONLY_OPTION: Constants.NAME + ".setFindFileOnlyOption",
        SET_FIND_SUBOUTLINE_ONLY_OPTION: Constants.NAME + ".setFindSuboutlineOnlyOption",
        TOGGLE_FIND_IGNORE_CASE_OPTION: Constants.NAME + ".toggleFindIgnoreCaseOption",
        TOGGLE_FIND_MARK_CHANGES_OPTION: Constants.NAME + ".toggleFindMarkChangesOption",
        TOGGLE_FIND_MARK_FINDS_OPTION: Constants.NAME + ".toggleFindMarkFindsOption",
        TOGGLE_FIND_REGEXP_OPTION: Constants.NAME + ".toggleFindRegexpOption",
        TOGGLE_FIND_WORD_OPTION: Constants.NAME + ".toggleFindWordOption",
        TOGGLE_FIND_SEARCH_BODY_OPTION: Constants.NAME + ".toggleFindSearchBodyOption",
        TOGGLE_FIND_SEARCH_HEADLINE_OPTION: Constants.NAME + ".toggleFindSearchHeadlineOption",
        SET_BODY_WRAP_SETTINGS: Constants.NAME + ".setBodyWrapSettings",
        SET_ENABLE_PREVIEW: Constants.NAME + ".setEnablePreview",
        CLEAR_CLOSE_EMPTY_GROUPS: Constants.NAME + ".clearCloseEmptyGroups",
    };

    /**
     * Leo command names that are called from vscode's gui/menu/buttons/keybindings triggers
     */
    public static LEO_COMMANDS = {

        ABOUT_LEO: "about-leo",

        // * File Commands
        // NEW: 'new', // newLeoFile used instead
        // OPEN_OUTLINE: 'open_outline', // openLeoFile used instead
        WRITE_AT_FILE_NODES: 'write-at-file-nodes',
        WRITE_DIRTY_AT_FILE_NODES: 'write-dirty-at-file-nodes',
        REVERT: 'revert',
        // * More Commands
        GOTO_GLOBAL_LINE: "goto-global-line",
        SET_UA: 'set-ua',

        // * Import Export
        IMPORT_ANY_FILE: "import-file",
        READ_FILE_INTO_NODE: "read-file-into-node",

        EXPORT_HEADLINES: "export-headlines",
        FLATTEN_OUTLINE: "flatten-outline",
        OUTLINE_TO_CWEB: "outline-to-cweb",
        OUTLINE_TO_NOWEB: "outline-to-noweb",
        REMOVE_SENTINELS: "remove-sentinels",
        WEAVE: "weave",
        WRITE_FILE_FROM_NODE: "write-file-from-node",

        // * Edit Operations
        CAPITALIZE_HEADLINE: "capitalize-headline",
        END_EDIT_HEADLINE: "end-edit-headline",
        INSERT_HEADLINE_TIME: "insert-headline-time",
        INSERT_BODY_TIME: "insert-body-time",
        REFORMAT_PARAGRAPH: "reformat-paragraph",
        RST3: "rst3",

        // * Search operations
        HELP_FOR_FIND_COMMANDS: "help-for-find-commands",
        HELP_FOR_MINIBUFFER: "help-for-minibuffer",
        START_SEARCH: "start-search",
        FIND_ALL: "find-all",
        // FIND_NEXT: "!find_next",
        // FIND_PREVIOUS: "!find_previous",
        FIND_DEF: "find-def",
        // REPLACE: "!replace",
        // REPLACE_THEN_FIND: "!replace_then_find",
        REPLACE_ALL: "change-all",

        SET_FIND_EVERYWHERE_OPTION: "set-find-everywhere",
        SET_FIND_NODE_ONLY_OPTION: "set-find-node-only",
        SET_FIND_FILE_ONLY_OPTION: "set-find-file-only",
        SET_FIND_SUBOUTLINE_ONLY_OPTION: "set-find-suboutline-only",
        TOGGLE_FIND_IGNORE_CASE_OPTION: "toggle-find-ignore-case-option",
        TOGGLE_FIND_MARK_CHANGES_OPTION: "toggle-find-mark-changes-option",
        TOGGLE_FIND_MARK_FINDS_OPTION: "toggle-find-mark-finds-option",
        TOGGLE_FIND_REGEXP_OPTION: "toggle-find-regex-option",
        TOGGLE_FIND_WORD_OPTION: "toggle-find-word-option",
        TOGGLE_FIND_SEARCH_BODY_OPTION: "toggle-find-in-body-option",
        TOGGLE_FIND_SEARCH_HEADLINE_OPTION: "toggle-find-in-headline-option",

        SEARCH_BACKWARD: "search-backward",
        RE_SEARCH: "re-search",
        RE_SEARCH_BACKWARD: "re-search-backward",
        WORD_SEARCH: "word-search",
        WORD_SEARCH_BACKWARD: "word-search-backward",

        TAG_NODE: "tag-node",
        TAG_CHILDREN: "tag-children",
        REMOVE_TAG: "remove-tag",
        REMOVE_ALL_TAGS: "remove-all-tags",

        // * Undo Operations
        UNDO: "undo",
        REDO: "redo",
        // * Tree Building
        EXECUTE_SCRIPT: "execute-script",
        REFRESH_FROM_DISK: "refresh-from-disk",
        OPEN_AT_LEO_FILE: "open-at-leo-file",
        GIT_DIFF: "git-diff",
        // * Outline from body text
        EXTRACT: "extract",
        EXTRACT_NAMES: "extract-names",
        // * Hoist Operations
        HOIST_PNODE: "hoist",
        DEHOIST: "de-hoist",
        CHAPTER_NEXT: "chapter-next",
        CHAPTER_BACK: "chapter-back",
        CHAPTER_SELECT: "chapter-select",
        CHAPTER_MAIN: "chapter-select-main",
        // * History Navigation
        GOTO_PREV_HISTORY: "goto-prev-history-node",
        GOTO_NEXT_HISTORY: "goto-next-history-node",
        // * Goto & Folding
        PAGE_UP: "tree-page-up",
        PAGE_DOWN: "tree-page-down",
        GOTO_FIRST_VISIBLE: "goto-first-visible-node",
        GOTO_LAST_VISIBLE: "goto-last-visible-node",
        GOTO_FIRST_SIBLING: "goto-first-sibling",
        GOTO_LAST_SIBLING: "goto-last-sibling",
        GOTO_NEXT_VISIBLE: "goto-next-visible",
        GOTO_PREV_VISIBLE: "goto-prev-visible",
        GOTO_NEXT_MARKED: "goto-next-marked",
        GOTO_PREV_MARKED: "goto-prev-marked",
        GOTO_NEXT_CLONE: "goto-next-clone",
        CONTRACT_OR_GO_LEFT: "contract-or-go-left",
        EXPAND_AND_GO_RIGHT: "expand-and-go-right",
        CONTRACT_ALL_OTHER_NODES: "contract-all-other-nodes",
        CONTRACT_ALL: "contract-all",

        CONTRACT_PNODE: "contract-node",
        CONTRACT_PARENT: "contract-parent",
        EXPAND_PREV_LEVEL: "expand-prev-level",
        EXPAND_NEXT_LEVEL: "expand-next-level",
        EXPAND_OR_GO_RIGHT: "expand-or-go-right",
        EXPAND_TO_LEVEL_1: "expand-to-level-1",
        EXPAND_TO_LEVEL_2: "expand-to-level-2",
        EXPAND_TO_LEVEL_3: "expand-to-level-3",
        EXPAND_TO_LEVEL_4: "expand-to-level-4",
        EXPAND_TO_LEVEL_5: "expand-to-level-5",
        EXPAND_TO_LEVEL_6: "expand-to-level-6",
        EXPAND_TO_LEVEL_7: "expand-to-level-7",
        EXPAND_TO_LEVEL_8: "expand-to-level-8",
        EXPAND_ALL: "expand-all",
        EXPAND_PNODE: "expand-node",

        FIND_NEXT_CLONE: "find-next-clone",
        GOTO_FIRST_NODE: "goto-first-node",

        GOTO_NEXT_CHANGED: "goto-next-changed",
        GOTO_NEXT_NODE: "goto-next-node",
        GOTO_NEXT_SIBLING: "goto-next-sibling",
        GOTO_PARENT: "goto-parent",
        GOTO_PREV_NODE: "goto-prev-node",
        GOTO_PREV_SIBLING: "goto-prev-sibling",
        GOTO_LAST_NODE: "goto-last-node",

        // * Mark Operations
        TOGGLE_MARK: "toggle-mark",
        COPY_MARKED: "copy-marked-nodes",
        DIFF_MARKED_NODES: "diff-marked-nodes",
        MARK_CHANGED_ITEMS: "mark-changed-items",
        MARK_SUBHEADS: "mark-subheads",
        UNMARK_ALL: "unmark-all",
        CLONE_MARKED_NODES: "clone-marked-nodes",
        DELETE_MARKED_NODES: "delete-marked-nodes",
        MOVE_MARKED_NODES: "move-marked-nodes",
        // * Clipboard Operations
        COPY_PNODE: "copy-node",
        CUT_PNODE: "cut-node",
        PASTE_PNODE: "async-paste-node",
        PASTE_CLONE_PNODE: "async-paste-retaining-clones",
        PASTE_AS_TEMPLATE: "async-paste-as-template",
        // * Outline Editing
        DELETE_PNODE: "delete-node",
        MOVE_PNODE_DOWN: "move-outline-down",
        MOVE_PNODE_LEFT: "move-outline-left",
        MOVE_PNODE_RIGHT: "move-outline-right",
        MOVE_PNODE_UP: "move-outline-up",
        INSERT_PNODE: "insert-node",
        INSERT_CHILD_PNODE: "insert-child",
        CLONE_PNODE: "clone-node",
        // * Marshalling Operations
        PROMOTE_PNODE: "promote",
        DEMOTE_PNODE: "demote",
        SORT_CHILDREN: "sort-children",
        SORT_SIBLINGS: "sort-siblings",
        // * Clone-find functionality

        CLONE_FIND_ALL_FLATTENED: "cff",

        CLONE_FIND_FLATTENED_MARKED: "cffm",
        CLONE_FIND_TAG: "cft",
        CLONE_FIND_ALL: "cfa",
        CLONE_FIND_MARKED: "cfam",
        CLONE_FIND_PARENTS: "clone-find-parents",
    };

    /**
     * List of command names for both categories of possible offsets when keeping selection.
     */
    public static OLD_POS_OFFSETS = {
        DELETE: ["cut-node", "delete-node"],
        ADD: ["clone-node", "async-paste-node", "async-paste-retaining-clones"]
    };

    /**
     * * Overridden 'good' minibuffer command name strings
     */
    public static MINIBUFFER_OVERRIDDEN_NAMES: { [key: string]: string } = {
        'paste-node': 'async-paste-node',
        'paste-retaining-clones': 'async-paste-retaining-clones',
        'paste-as-template': 'async-paste-as-template',
        'insert-child': 'async-insert-child',
        'insert-node': 'async-insert-node',
        'insert-as-first-child': 'async-insert-as-first-child',
        'insert-as-last-child': 'async-insert-as-last-child',
        'insert-node-before': 'async-insert-node-before',
    };

}
