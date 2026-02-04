import { MenuEntry } from "./types";
import { Constants } from "./constants";

const CMD = Constants.COMMANDS;

export const menuData: MenuEntry[] = [
    {
        label: "File",
        entries: [
            { label: "Choose New Workspace...", action: CMD.CHOOSE_NEW_WORKSPACE },
            { label: "New", action: CMD.NEW_FILE },
            { label: "Open-File", action: CMD.OPEN_FILE, keyboardShortcut: "Ctrl+O" },
            { label: "Recent Files", action: CMD.RECENT_FILES },
            { label: "Save...", action: CMD.SAVE_FILE, keyboardShortcut: "Ctrl+S" },
            { label: "Save As...", action: CMD.SAVE_AS_FILE },
            { label: "Save As .leojs (JSON)...", action: CMD.SAVE_AS_LEOJS },
            { label: "Save As .leo (XML)...", action: CMD.SAVE_AS_FILE },
            { label: "Revert To Saved", action: CMD.REVERT },
            {
                label: "Read/Write Files",
                entries: [
                    { label: "Read-File-Into-Node", action: CMD.READ_FILE_INTO_NODE },
                    { label: "Write-File-From-Node", action: CMD.WRITE_FILE_FROM_NODE },
                    { label: "Write @<file> Nodes", action: CMD.WRITE_AT_FILE_NODES, keyboardShortcut: "Ctrl+Shift+W" },
                    { label: "Write Dirty @<file> Nodes", action: CMD.WRITE_DIRTY_AT_FILE_NODES, keyboardShortcut: "Ctrl+Shift+Q" },

                ],
            },
            { label: "Import Any File...", action: CMD.IMPORT_ANY_FILE, },
            {
                label: "Export Files",
                entries: [
                    { label: "Export Outline...", action: CMD.EXPORT_HEADLINES },
                    { label: "Flatten Selected Outline...", action: CMD.FLATTEN_OUTLINE },
                    { label: "Outline To CWEB...", action: CMD.OUTLINE_TO_CWEB },
                    { label: "Outline To NOWEB...", action: CMD.OUTLINE_TO_NOWEB },
                    { label: "Remove Sentinels", action: CMD.REMOVE_SENTINELS },
                    { label: "Weave", action: CMD.WEAVE },
                ],
            },

        ],
    },
    {
        label: "Edit",
        entries: [
            { label: "Undo", action: CMD.UNDO, keyboardShortcut: "Ctrl+Z" },
            { label: "Redo", action: CMD.REDO, keyboardShortcut: "Ctrl+SHIFT+Z" },
            { label: "Cut", action: CMD.CUT_TEXT, keyboardShortcut: "Ctrl+X" },
            { label: "Copy", action: CMD.COPY_TEXT, keyboardShortcut: "Ctrl+C" },
            { label: "Paste", action: CMD.PASTE_TEXT, keyboardShortcut: "Ctrl+V" },
            { label: "Select All", action: CMD.SELECT_ALL_TEXT, keyboardShortcut: "Ctrl+A" },
            //
            {
                label: "Edit Headline", entries: [
                    { label: "Capitalize-Headline", action: CMD.CAPITALIZE_HEADLINE },
                    { label: "Edit-Headline", action: CMD.HEADLINE_SELECTION, keyboardShortcut: "Ctrl+H" },
                    { label: "End-Edit-Headline", action: CMD.END_EDIT_HEADLINE, keyboardShortcut: "ENTER" },
                    { label: "Insert-Headline-Time", action: CMD.INSERT_HEADLINE_TIME },
                ]
            },
            // { label: "Edit Text", entries: [
            // TODO : Edit menu entries when body pane is implemented
            // ]},
            {
                label: "Format Text", entries: [
                    { label: "Insert-Body-Time", action: CMD.INSERT_BODY_TIME },
                    { label: "Reformat-Paragraph", action: CMD.REFORMAT_PARAGRAPH },
                    { label: "Rst3", action: CMD.RST3 },

                ]
            },
            {
                label: "Select Chapters", entries: [
                    { label: "Chapter-Select", action: CMD.CHAPTER_SELECT },
                    { label: "Chapter-Select-Main", action: CMD.CHAPTER_MAIN },
                ]
            },
        ],
    },
    {
        label: "Search",
        entries: [
            { label: "Help for Find Commands", action: CMD.HELP_FOR_FIND_COMMANDS },
            { label: "Goto Global Line", action: CMD.GOTO_GLOBAL_LINE, keyboardShortcut: "Alt+G" },
            { label: "Start Search", action: CMD.START_SEARCH, keyboardShortcut: "Ctrl+F" },
            { label: "Find Next", action: CMD.FIND_NEXT, keyboardShortcut: "F3" },
            { label: "Find Previous", action: CMD.FIND_PREVIOUS, keyboardShortcut: "F2" },
            { label: "Replace", action: CMD.REPLACE, keyboardShortcut: "Ctrl+=" },
            { label: "Replace Then Find", action: CMD.REPLACE_THEN_FIND, keyboardShortcut: "Ctrl+-" },
            { label: "Replace All", action: CMD.REPLACE_ALL },
            {
                label: "Clone-Find Commands",
                entries: [
                    { label: "Clone-Find-All", action: CMD.CLONE_FIND_ALL },
                    { label: "Clone-Find-All-Flattened", action: CMD.CLONE_FIND_ALL_FLATTENED },
                    { label: "Clone-Find-All-Flattened-marked", action: CMD.CLONE_FIND_FLATTENED_MARKED },
                    { label: "Clone-Find-Parents", action: CMD.CLONE_FIND_PARENTS },
                    { label: "Clone-Find-Tag", action: CMD.CLONE_FIND_TAG },
                ]
            },
            {
                label: "Set Search Settings",
                entries: [
                    { label: "Set Find-Everywhere", action: CMD.SET_FIND_EVERYWHERE_OPTION, keyboardShortcut: "Alt+Ctrl+E" },
                    { label: "Set Find-Node-Only", action: CMD.SET_FIND_NODE_ONLY_OPTION, keyboardShortcut: "Alt+Ctrl+N" },
                    { label: "Set Find-Suboutline-Only", action: CMD.SET_FIND_SUBOUTLINE_ONLY_OPTION, keyboardShortcut: "Alt+Ctrl+S" },
                    { label: "Toggle Ignore-Case", action: CMD.TOGGLE_FIND_IGNORE_CASE_OPTION, keyboardShortcut: "Alt+Ctrl+I" },
                    { label: "Toggle Mark-Changes", action: CMD.TOGGLE_FIND_MARK_CHANGES_OPTION, keyboardShortcut: "Alt+Ctrl+C" },
                    { label: "Toggle Mark-Finds", action: CMD.TOGGLE_FIND_MARK_FINDS_OPTION, keyboardShortcut: "Alt+Ctrl+F" },
                    { label: "Toggle Regex", action: CMD.TOGGLE_FIND_REGEXP_OPTION, keyboardShortcut: "Alt+Ctrl+X" },
                    { label: "Toggle Word", action: CMD.TOGGLE_FIND_WORD_OPTION, keyboardShortcut: "Alt+Ctrl+W" },
                ]
            },
        ],
    },
    {
        label: "Settings",
        entries: [
            { label: "Open LeoSettings.leo", action: CMD.OPEN_LEO_SETTINGS },
            { label: "Reload Settings", action: CMD.RELOAD_SETTINGS },
        ],
    },
    {
        label: "Outline",
        entries: [
            { label: "Clone-Node", action: CMD.CLONE_SELECTION, keyboardShortcut: "Ctrl+`" },
            { label: "Delete-Node", action: CMD.DELETE_SELECTION, keyboardShortcut: "Delete" },
            { label: "Insert-Node", action: CMD.INSERT_SELECTION, keyboardShortcut: "Ctrl+I, Shift+Insert" },
            { label: "Insert-Child", action: CMD.INSERT_CHILD_SELECTION, keyboardShortcut: "Ctrl+Insert" },
            { label: "Cut-Node", action: CMD.CUT_SELECTION, keyboardShortcut: "Ctrl+Shift+X" },
            { label: "Copy-Node", action: CMD.COPY_SELECTION, keyboardShortcut: "Ctrl+Shift+C" },
            { label: "Paste-Node", action: CMD.PASTE_SELECTION, keyboardShortcut: "Ctrl+Shift+V" },
            { label: "Paste Node As Clone", action: CMD.PASTE_CLONE_SELECTION },
            { label: "Demote Siblings", action: CMD.DEMOTE_SELECTION, keyboardShortcut: "Ctrl+]" },
            { label: "Promote Children", action: CMD.PROMOTE_SELECTION, keyboardShortcut: "Ctrl+[" },
            { label: "Refresh From Disk", action: CMD.REFRESH_FROM_DISK_SELECTION },
            {
                label: "Expand/Contract Nodes", entries: [
                    { label: "Contract-All", action: CMD.CONTRACT_ALL, keyboardShortcut: "Alt+-" },
                    { label: "Contract-All-Other-Nodes", action: CMD.CONTRACT_ALL_OTHER_NODES, keyboardShortcut: "Ctrl+Alt+-" },
                    { label: "Contract-Node", action: CMD.CONTRACT_NODE, keyboardShortcut: "Alt+[" },
                    { label: "Contract-Parent", action: CMD.CONTRACT_PARENT },
                    { label: "Contract-Or-Go-Left", action: CMD.CONTRACT_OR_GO_LEFT, keyboardShortcut: "Left, Alt+Left" },
                    //
                    { label: "Expand-Prev-Level", action: CMD.EXPAND_PREV_LEVEL },
                    { label: "Expand-Next-Level", action: CMD.EXPAND_NEXT_LEVEL },
                    { label: "Expand-And-Go-Right", action: CMD.EXPAND_AND_GO_RIGHT, keyboardShortcut: "Right, Alt+Right" },
                    { label: "Expand-Or-Go-Right", action: CMD.EXPAND_OR_GO_RIGHT },
                    //
                    { label: "Expand-To-Level-1", action: CMD.EXPAND_TO_LEVEL_1 },
                    { label: "Expand-To-Level-2", action: CMD.EXPAND_TO_LEVEL_2 },
                    { label: "Expand-To-Level-3", action: CMD.EXPAND_TO_LEVEL_3 },
                    { label: "Expand-To-Level-4", action: CMD.EXPAND_TO_LEVEL_4 },
                    { label: "Expand-To-Level-5", action: CMD.EXPAND_TO_LEVEL_5 },
                    { label: "Expand-To-Level-6", action: CMD.EXPAND_TO_LEVEL_6 },
                    { label: "Expand-To-Level-7", action: CMD.EXPAND_TO_LEVEL_7 },
                    { label: "Expand-To-Level-8", action: CMD.EXPAND_TO_LEVEL_8 },
                    //
                    { label: "Expand-All", action: CMD.EXPAND_ALL },
                    { label: "Expand-Node", action: CMD.EXPAND_NODE, keyboardShortcut: "Alt+]" },
                ]
            },
            {
                label: "Go To Nodes", entries: [
                    { label: "Find-Next-Clone", action: CMD.FIND_NEXT_CLONE },
                    { label: "Goto-First-Node", action: CMD.GOTO_FIRST_NODE },
                    { label: "Goto-First-Visible", action: CMD.GOTO_FIRST_VISIBLE, keyboardShortcut: "Alt+Home" },
                    { label: "Goto-First-Sibling", action: CMD.GOTO_FIRST_SIBLING },
                    //
                    { label: "Goto-Next-Changed", action: CMD.GOTO_NEXT_CHANGED },
                    { label: "Goto-Next-Clone", action: CMD.GOTO_NEXT_CLONE, keyboardShortcut: "Alt+N" },
                    { label: "Goto-Next-Marked", action: CMD.GOTO_NEXT_MARKED },
                    { label: "Goto-Next-Node", action: CMD.GOTO_NEXT_NODE },
                    { label: "Goto-Next-Sibling", action: CMD.GOTO_NEXT_SIBLING },
                    { label: "Goto-Next-Visible", action: CMD.GOTO_NEXT_VISIBLE, keyboardShortcut: "Down, Alt+Down" },
                    { label: "Go-Forward", action: CMD.GO_FORWARD },
                    //
                    { label: "Goto-Parent", action: CMD.GOTO_PARENT },
                    //
                    { label: "Goto-Prev-Node", action: CMD.GOTO_PREV_NODE },
                    { label: "Goto-Prev-Sibling", action: CMD.GOTO_PREV_SIBLING },
                    { label: "Goto-Prev-Visible", action: CMD.GOTO_PREV_VISIBLE, keyboardShortcut: "Up, Alt+Up" },
                    { label: "Go-Back", action: CMD.GO_BACK },
                    //
                    { label: "Goto-Last-Node", action: CMD.GOTO_LAST_NODE },
                    { label: "Goto-Last-Sibling", action: CMD.GOTO_LAST_SIBLING },
                    { label: "Goto-Last-Visible", action: CMD.GOTO_LAST_VISIBLE, keyboardShortcut: "Alt+End" },
                ]
            },
            {
                label: "Hoist/Dehoist Nodes", entries: [
                    { label: "Hoist", action: CMD.HOIST_SELECTION },
                    { label: "De-Hoist", action: CMD.DEHOIST },

                ]
            },
            {
                label: "Mark Nodes", entries: [
                    { label: "Clone-Marked-Nodes", action: CMD.CLONE_MARKED_NODES },
                    { label: "Toggle Mark", action: CMD.MARK_SELECTION, keyboardShortcut: "Ctrl+M" },
                    { label: "Mark-Subheads", action: CMD.MARK_SUBHEADS },
                    { label: "Mark-Changed-Items", action: CMD.MARK_CHANGED_ITEMS },
                    { label: "Unmark-All", action: CMD.UNMARK_ALL },

                ]
            },
            {
                label: "Move Nodes", entries: [
                    { label: "Move-Outline-Down", action: CMD.MOVE_DOWN_SELECTION, keyboardShortcut: "Shift+Down, Alt+Shift+Down, Ctrl+D" },
                    { label: "Move-Outline-Left", action: CMD.MOVE_LEFT_SELECTION, keyboardShortcut: "Shift+Left, Alt+Shift+Left, Ctrl+L" },
                    { label: "Move-Outline-Right", action: CMD.MOVE_RIGHT_SELECTION, keyboardShortcut: "Shift+Right, Alt+Shift+Right, Ctrl+R" },
                    { label: "Move-Outline-Up", action: CMD.MOVE_UP_SELECTION, keyboardShortcut: "Shift+Up, Alt+Shift+Up, Ctrl+U" },

                ]
            },
            {
                label: "Sort Nodes", entries: [
                    { label: "Sort-Children", action: CMD.SORT_CHILDREN },
                    { label: "Sort-Siblings", action: CMD.SORT_SIBLINGS, keyboardShortcut: "Alt+A" },
                ]
            },
        ],
    },
    {
        label: "Run",
        entries: [
            { label: "Help For Minibuffer", action: CMD.HELP_FOR_MINIBUFFER },
            { label: "Execute Script", action: CMD.EXECUTE, keyboardShortcut: "Ctrl+B" },
            { label: "Full Command", action: CMD.MINIBUFFER, keyboardShortcut: "Alt+X" },
        ],
    },
    {
        label: "Window",
        entries: [
            { label: "Equal Sized Panes", action: CMD.EQUAL_SIZED_PANES },
            { label: "Horizontal Window Layout", action: CMD.HORIZONTAL_LAYOUT },
            { label: "Vertical Window Layout", action: CMD.VERTICAL_LAYOUT },
            { label: "Light Theme", action: CMD.LIGHT_THEME },
            { label: "Dark Theme", action: CMD.DARK_THEME },
        ],
    },
    {
        label: "Help",
        entries: [
            { label: "Documentation", action: CMD.DOCUMENTATION },
            { label: "About", action: CMD.ABOUT_LEO },
        ],
    },
];