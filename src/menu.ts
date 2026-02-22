import { MenuEntry } from "./types";
import { Constants } from "./constants";

const CMD = Constants.COMMANDS;
const FLAGS = Constants.CONTEXT_FLAGS;

// Menu "enabled flags" are more restrictive than for keybindings, because we want 
// to disable menu entries until they are actually usable, to inform users about when
// they can use them, even though the commands themselves also check for the necessary flags before executing.

export const menuData: MenuEntry[] = [
    {
        label: "File",
        entries: [
            { label: "Choose New Workspace...", action: CMD.CHOOSE_NEW_WORKSPACE },
            { label: "New", action: CMD.NEW_FILE },
            { label: "Open-File", action: CMD.OPEN_FILE, keyboardShortcut: "Ctrl+O" },
            { label: "Recent Files", action: CMD.RECENT_FILES },
            { label: "Save...", action: CMD.SAVE_FILE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+S" },
            { label: "Save As...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.SAVE_AS_FILE },
            { label: "Save As .leojs (JSON)...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.SAVE_AS_LEOJS },
            { label: "Save As .leo (XML)...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.SAVE_AS_FILE },
            {
                label: "Revert To Saved", action: CMD.REVERT, enabledFlagsSet: [
                    FLAGS.TREE_OPENED,
                    FLAGS.TREE_TITLED
                ]
            },
            {
                label: "Read/Write Files",
                entries: [
                    { label: "Read-File-Into-Node", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.READ_FILE_INTO_NODE },
                    { label: "Write-File-From-Node", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.WRITE_FILE_FROM_NODE },
                    { label: "Write @<file> Nodes", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.WRITE_AT_FILE_NODES, keyboardShortcut: "Ctrl+Shift+W" },
                    { label: "Write Dirty @<file> Nodes", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.WRITE_DIRTY_AT_FILE_NODES, keyboardShortcut: "Ctrl+Shift+Q" },

                ],
            },
            { label: "Import Any File...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.IMPORT_ANY_FILE, },
            {
                label: "Export Files",
                entries: [
                    { label: "Export Outline...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXPORT_HEADLINES },
                    { label: "Flatten Selected Outline...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FLATTEN_OUTLINE },
                    { label: "Outline To CWEB...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.OUTLINE_TO_CWEB },
                    { label: "Outline To NOWEB...", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.OUTLINE_TO_NOWEB },
                    { label: "Remove Sentinels", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.REMOVE_SENTINELS },
                    { label: "Weave", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.WEAVE },
                ],
            },

        ],
    },
    {
        label: "Edit",
        entries: [
            { label: "Undo", action: CMD.UNDO, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_UNDO], keyboardShortcut: "Ctrl+Z" },
            { label: "Redo", action: CMD.REDO, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_REDO], keyboardShortcut: "Ctrl+SHIFT+Z" },
            { label: "Cut", action: CMD.CUT_TEXT, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+X" },
            { label: "Copy", action: CMD.COPY_TEXT, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+C" },
            { label: "Paste", action: CMD.PASTE_TEXT, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+V" },
            { label: "Select All", action: CMD.SELECT_ALL_TEXT, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+A" },
            //
            {
                label: "Edit Headline", entries: [
                    { label: "Capitalize-Headline", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CAPITALIZE_HEADLINE },
                    { label: "Edit-Headline", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.HEADLINE_SELECTION, keyboardShortcut: "Ctrl+H" },
                    { label: "End-Edit-Headline", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.END_EDIT_HEADLINE, keyboardShortcut: "ENTER" },
                    { label: "Insert-Headline-Time", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.INSERT_HEADLINE_TIME },
                ]
            },
            {
                label: "Edit Text", entries: [
                    { label: "Backward-Delete-Char", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACKWARD_DELETE_CHAR, keyboardShortcut: "Backspace" },
                    {
                        label: "Align Text", entries: [
                            { label: "Center-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CENTER_LINE },
                            { label: "Center-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CENTER_REGION },
                        ]
                    },
                    {
                        label: "Capitalize Text", entries: [
                            { label: "Capitalize-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CAPITALIZE_WORD },
                            { label: "Downcase-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.DOWNCASE_REGION },
                            { label: "Downcase-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.DOWNCASE_WORD },
                            { label: "Upcase-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.UPCASE_REGION },
                            { label: "Upcase-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.UPCASE_WORD },
                        ]
                    },
                    {
                        label: "Convert/View Tabs Or Blanks", entries: [
                            { label: "Convert-All-Blanks", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CONVERT_ALL_BLANKS },
                            { label: "Convert-All-Tabs", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CONVERT_ALL_TABS },
                            { label: "Convert-Blanks", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CONVERT_BLANKS },
                            { label: "Convert-Tabs", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CONVERT_TABS },
                        ]
                    },
                    {
                        label: "Create Sections", entries: [
                            { label: "Extract-Names", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTRACT_NAMES },
                            { label: "Extract", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTRACT },
                        ]
                    },
                    {
                        label: "Edit Rectangular Areas", entries: [
                            { label: "Rectangle-Clear", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_CLEAR },
                            { label: "Rectangle-Close", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_CLOSE },
                            { label: "Rectangle-Delete", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_DELETE },
                            { label: "Rectangle-Kill", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_KILL },
                            { label: "Rectangle-Open", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_OPEN },
                            { label: "Rectangle-String", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_STRING },
                            { label: "Rectangle-Yank", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_YANK },
                        ]
                    },
                    {
                        label: "Indent Text", entries: [
                            { label: "Always-Indent-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.ALWAYS_INDENT_REGION },
                            { label: "Indent-Rigidly", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.INDENT_RIGIDLY },
                            { label: "Indent-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.INDENT_REGION, keyboardShortcut: "Tab" },
                            { label: "Indent-Relative", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.INDENT_RELATIVE },
                            { label: "Unindent-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.UNINDENT_REGION, keyboardShortcut: "Shift+Tab" },
                        ]
                    },
                    {
                        label: "Move Cursor And Make Selections", entries: [
                            {
                                label: "Cursor Back", entries: [
                                    { label: "Back-Char", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_CHAR, keyboardShortcut: "Left" },
                                    { label: "Back-Paragraph", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_PARAGRAPH },
                                    { label: "Back-Sentence", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_SENTENCE },
                                    { label: "Back-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_WORD, keyboardShortcut: "Ctrl+Left" },
                                    { label: "Beginning-Of-Buffer", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BEGINNING_OF_BUFFER, keyboardShortcut: "Home" },
                                    { label: "Beginning-Of-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BEGINNING_OF_LINE, keyboardShortcut: "Ctrl+Home" },
                                    { label: "Previous-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.PREVIOUS_LINE, keyboardShortcut: "Up" },
                                ],
                            },
                            {
                                label: "Cursor Back Extend Selection", entries: [
                                    { label: "Back-Char-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_CHAR_EXTEND_SELECTION, keyboardShortcut: "Shift+Left" },
                                    { label: "Back-Paragraph-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_PARAGRAPH_EXTEND_SELECTION },
                                    { label: "Back-Sentence-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_SENTENCE_EXTEND_SELECTION },
                                    { label: "Back-Word-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BACK_WORD_EXTEND_SELECTION, keyboardShortcut: "Ctrl+Shift+Left" },
                                    { label: "Beginning-Of-Buffer-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BEGINNING_OF_BUFFER_EXTEND_SELECTION, keyboardShortcut: "Shift+Home" },
                                    { label: "Beginning-Of-Line-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.BEGINNING_OF_LINE_EXTEND_SELECTION, keyboardShortcut: "Ctrl+Shift+Home" },
                                    { label: "Previous-Line-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.PREVIOUS_LINE_EXTEND_SELECTION, keyboardShortcut: "Shift+Up" },
                                ],
                            },
                            {
                                label: "Cursor Back Extend to", entries: [
                                    { label: "Extend-To-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTEND_TO_LINE, keyboardShortcut: "Shift+End" },
                                    { label: "Extend-To-Paragraph", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTEND_TO_PARAGRAPH },
                                    { label: "Extend-To-Sentence", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTEND_TO_SENTENCE },
                                    { label: "Extend-To-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTEND_TO_WORD, keyboardShortcut: "Ctrl+Shift+Right" },
                                ],
                            },
                            {
                                label: "Cursor Forward", entries: [
                                    { label: "End-Of-Buffer", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.END_OF_BUFFER, keyboardShortcut: "End" },
                                    { label: "End-Of-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.END_OF_LINE, keyboardShortcut: "Ctrl+End" },
                                    { label: "Forward-Char", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_CHAR, keyboardShortcut: "Right" },
                                    { label: "Forward-Paragraph", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_PARAGRAPH },
                                    { label: "Forward-Sentence", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_SENTENCE },
                                    { label: "Forward-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_WORD, keyboardShortcut: "Ctrl+Right" },
                                    { label: "Next-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.NEXT_LINE, keyboardShortcut: "Down" },
                                ],
                            },
                            {
                                label: "Cursor Forward Extend Selection", entries: [
                                    { label: "End-Of-Buffer-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.END_OF_BUFFER_EXTEND_SELECTION, keyboardShortcut: "Shift+End" },
                                    { label: "End-Of-Line-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.END_OF_LINE_EXTEND_SELECTION, keyboardShortcut: "Ctrl+Shift+End" },
                                    { label: "Forward-Char-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_CHAR_EXTEND_SELECTION, keyboardShortcut: "Shift+Right" },
                                    { label: "Forward-Paragraph-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_PARAGRAPH_EXTEND_SELECTION },
                                    { label: "Forward-Sentence-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_SENTENCE_EXTEND_SELECTION },
                                    { label: "Forward-Word-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.FORWARD_WORD_EXTEND_SELECTION, keyboardShortcut: "Ctrl+Shift+Right" },
                                    { label: "Next-Line-Extend-Selection", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.NEXT_LINE_EXTEND_SELECTION, keyboardShortcut: "Shift+Down" },
                                ],
                            },
                        ]
                    },
                    {
                        label: "Sort Text", entries: [
                            { label: "Sort-Columns", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.SORT_COLUMNS },
                            { label: "Sort-Lines", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.SORT_LINES },
                        ]
                    },
                    {
                        label: "Yank/Kill Text", entries: [
                            { label: "Rectangle-Kill", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_KILL },
                            { label: "Rectangle-Yank", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RECTANGLE_YANK },
                            { label: "Kill-Line", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.KILL_LINE, keyboardShortcut: "Ctrl+K" },
                            { label: "Kill-Region", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.KILL_REGION },
                            { label: "Kill-Region-Save", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.KILL_REGION_SAVE },
                            { label: "Kill-Sentence", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.KILL_SENTENCE },
                            { label: "Kill-Ws", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.KILL_WS, },
                            { label: "Kill-Word", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.KILL_WORD, keyboardShortcut: "Ctrl+Backspace" },
                            { label: "Yank", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.YANK, keyboardShortcut: "Ctrl+Y" },
                            { label: "Yank-Pop", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.YANK_POP, keyboardShortcut: "Alt+Y" },
                        ]
                    }

                ]
            },
            {
                label: "Format Text", entries: [
                    { label: "Insert-Body-Time", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.INSERT_BODY_TIME },
                    { label: "Reformat-Paragraph", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.REFORMAT_PARAGRAPH },
                    { label: "Rst3", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.RST3 },
                ]
            },
            {
                label: "Select Chapters", entries: [
                    { label: "Chapter-Select", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CHAPTER_SELECT },
                    { label: "Chapter-Select-Main", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CHAPTER_MAIN },
                ]
            },
        ],
    },
    {
        label: "Search",
        entries: [
            { label: "Help for Find Commands", action: CMD.HELP_FOR_FIND_COMMANDS, enabledFlagsSet: [FLAGS.TREE_OPENED] },
            { label: "Goto Global Line", action: CMD.GOTO_GLOBAL_LINE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+G" },
            { label: "Start Search", action: CMD.START_SEARCH, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+F" },
            { label: "Find Next", action: CMD.FIND_NEXT, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "F3" },
            { label: "Find Previous", action: CMD.FIND_PREVIOUS, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "F2" },
            { label: "Replace", action: CMD.REPLACE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+=" },
            { label: "Replace Then Find", action: CMD.REPLACE_THEN_FIND, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+-" },
            { label: "Replace All", action: CMD.REPLACE_ALL, enabledFlagsSet: [FLAGS.TREE_OPENED] },
            {
                label: "Clone-Find Commands",
                entries: [
                    { label: "Clone-Find-All", action: CMD.CLONE_FIND_ALL, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Clone-Find-All-Flattened", action: CMD.CLONE_FIND_ALL_FLATTENED, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Clone-Find-All-Flattened-marked", action: CMD.CLONE_FIND_FLATTENED_MARKED, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Clone-Find-Parents", action: CMD.CLONE_FIND_PARENTS, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_CLONE] },
                    { label: "Clone-Find-Tag", action: CMD.CLONE_FIND_TAG, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                ]
            },
            {
                label: "Set Search Settings",
                entries: [
                    { label: "Set Find-Everywhere", action: CMD.SET_FIND_EVERYWHERE_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+E" },
                    { label: "Set Find-Node-Only", action: CMD.SET_FIND_NODE_ONLY_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+N" },
                    { label: "Set Find-Suboutline-Only", action: CMD.SET_FIND_SUBOUTLINE_ONLY_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+S" },
                    { label: "Toggle Ignore-Case", action: CMD.TOGGLE_FIND_IGNORE_CASE_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+I" },
                    { label: "Toggle Mark-Changes", action: CMD.TOGGLE_FIND_MARK_CHANGES_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+C" },
                    { label: "Toggle Mark-Finds", action: CMD.TOGGLE_FIND_MARK_FINDS_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+F" },
                    { label: "Toggle Regex", action: CMD.TOGGLE_FIND_REGEXP_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+X" },
                    { label: "Toggle Word", action: CMD.TOGGLE_FIND_WORD_OPTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Ctrl+W" },
                ]
            },
        ],
    },
    {
        label: "Settings",
        entries: [
            { label: "Open LeoSettings", action: CMD.OPEN_LEO_SETTINGS },
            { label: "Reload Settings", action: CMD.RELOAD_SETTINGS, enabledFlagsSet: [FLAGS.TREE_OPENED] },
            { label: "Change LeoID", action: CMD.SET_LEO_ID },
        ],
    },
    {
        label: "Outline",
        entries: [
            { label: "Clone-Node", action: CMD.CLONE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+`" },
            { label: "Delete-Node", action: CMD.DELETE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Delete" },
            { label: "Insert-Node", action: CMD.INSERT_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+I, Shift+Insert" },
            { label: "Insert-Child", action: CMD.INSERT_CHILD_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+Insert" },
            { label: "Cut-Node", action: CMD.CUT_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+Shift+X" },
            { label: "Copy-Node", action: CMD.COPY_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+Shift+C" },
            { label: "Paste-Node", action: CMD.PASTE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+Shift+V" },
            { label: "Paste Node As Clone", action: CMD.PASTE_CLONE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED] },
            { label: "Demote Siblings", action: CMD.DEMOTE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_DEMOTE], keyboardShortcut: "Ctrl+]" },
            { label: "Promote Children", action: CMD.PROMOTE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_PROMOTE], keyboardShortcut: "Ctrl+[" },
            { label: "Refresh From Disk", action: CMD.REFRESH_FROM_DISK_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.NODE_ATFILE] },
            {
                label: "Expand/Contract Nodes", entries: [
                    { label: "Contract-All", action: CMD.CONTRACT_ALL, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+-" },
                    { label: "Contract-All-Other-Nodes", action: CMD.CONTRACT_ALL_OTHER_NODES, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+Alt+-" },
                    { label: "Contract-Node", action: CMD.CONTRACT_NODE, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_EXPANDED], keyboardShortcut: "Alt+[" },
                    { label: "Contract-Parent", action: CMD.CONTRACT_PARENT, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_HAS_PARENT] },
                    { label: "Contract-Or-Go-Left", action: CMD.CONTRACT_OR_GO_LEFT, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_EXPANDED_OR_HAS_PARENT], keyboardShortcut: "Left, Alt+Left" },
                    //
                    { label: "Expand-Prev-Level", action: CMD.EXPAND_PREV_LEVEL, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_EXPANDED] },
                    { label: "Expand-Next-Level", action: CMD.EXPAND_NEXT_LEVEL, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_CHILD] },
                    { label: "Expand-And-Go-Right", action: CMD.EXPAND_AND_GO_RIGHT, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Right, Alt+Right" },
                    { label: "Expand-Or-Go-Right", action: CMD.EXPAND_OR_GO_RIGHT, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_CHILD] },
                    //
                    { label: "Expand-To-Level-1", action: CMD.EXPAND_TO_LEVEL_1, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-2", action: CMD.EXPAND_TO_LEVEL_2, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-3", action: CMD.EXPAND_TO_LEVEL_3, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-4", action: CMD.EXPAND_TO_LEVEL_4, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-5", action: CMD.EXPAND_TO_LEVEL_5, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-6", action: CMD.EXPAND_TO_LEVEL_6, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-7", action: CMD.EXPAND_TO_LEVEL_7, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-To-Level-8", action: CMD.EXPAND_TO_LEVEL_8, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    //
                    { label: "Expand-All", action: CMD.EXPAND_ALL, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Expand-Node", action: CMD.EXPAND_NODE, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_CHILD], enabledFlagsClear: [FLAGS.SELECTED_EXPANDED], keyboardShortcut: "Alt+]" },
                ]
            },
            {
                label: "Go To Nodes", entries: [
                    { label: "Find-Next-Clone", action: CMD.FIND_NEXT_CLONE, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-First-Node", action: CMD.GOTO_FIRST_NODE, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-First-Visible", action: CMD.GOTO_FIRST_VISIBLE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+Home" },
                    { label: "Goto-First-Sibling", action: CMD.GOTO_FIRST_SIBLING, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    //
                    { label: "Goto-Next-Changed", action: CMD.GOTO_NEXT_CHANGED, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CHANGED] },
                    { label: "Goto-Next-Clone", action: CMD.GOTO_NEXT_CLONE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+N" },
                    { label: "Goto-Next-Marked", action: CMD.GOTO_NEXT_MARKED, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_HAS_MARKED] },
                    { label: "Goto-Next-Node", action: CMD.GOTO_NEXT_NODE, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-Next-Sibling", action: CMD.GOTO_NEXT_SIBLING, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-Next-Visible", action: CMD.GOTO_NEXT_VISIBLE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Down, Alt+Down" },
                    { label: "Go-Forward", action: CMD.GO_FORWARD, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_NEXT] },
                    //
                    { label: "Goto-Parent", action: CMD.GOTO_PARENT, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    //
                    { label: "Goto-Prev-Node", action: CMD.GOTO_PREV_NODE, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-Prev-Sibling", action: CMD.GOTO_PREV_SIBLING, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-Prev-Visible", action: CMD.GOTO_PREV_VISIBLE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Up, Alt+Up" },
                    { label: "Go-Back", action: CMD.GO_BACK, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_BACK] },
                    //
                    { label: "Goto-Last-Node", action: CMD.GOTO_LAST_NODE, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-Last-Sibling", action: CMD.GOTO_LAST_SIBLING, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Goto-Last-Visible", action: CMD.GOTO_LAST_VISIBLE, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+End" },
                ]
            },
            {
                label: "Hoist/Dehoist Nodes", entries: [
                    { label: "Hoist", action: CMD.HOIST_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_HOIST] },
                    { label: "De-Hoist", action: CMD.DEHOIST, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_DEHOIST] },
                ]
            },
            {
                label: "Mark Nodes", entries: [
                    { label: "Clone-Marked-Nodes", action: CMD.CLONE_MARKED_NODES, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_HAS_MARKED] },
                    { label: "Toggle Mark", action: CMD.MARK_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Ctrl+M" },
                    { label: "Mark-Subheads", action: CMD.MARK_SUBHEADS, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Mark-Changed-Items", action: CMD.MARK_CHANGED_ITEMS, enabledFlagsSet: [FLAGS.TREE_OPENED] },
                    { label: "Unmark-All", action: CMD.UNMARK_ALL, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_HAS_MARKED] },
                ]
            },
            {
                label: "Move Nodes", entries: [
                    { label: "Move-Outline-Down", action: CMD.MOVE_DOWN_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Shift+Down, Alt+Shift+Down, Ctrl+D" },
                    { label: "Move-Outline-Left", action: CMD.MOVE_LEFT_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Shift+Left, Alt+Shift+Left, Ctrl+L" },
                    { label: "Move-Outline-Right", action: CMD.MOVE_RIGHT_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Shift+Right, Alt+Shift+Right, Ctrl+R" },
                    { label: "Move-Outline-Up", action: CMD.MOVE_UP_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Shift+Up, Alt+Shift+Up, Ctrl+U" },

                ]
            },
            {
                label: "Sort Nodes", entries: [
                    { label: "Sort-Children", action: CMD.SORT_CHILDREN, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.SELECTED_CHILD] },
                    { label: "Sort-Siblings", action: CMD.SORT_SIBLINGS, enabledFlagsSet: [FLAGS.TREE_OPENED], keyboardShortcut: "Alt+A" },
                ]
            },
        ],
    },
    {
        label: "Run",
        entries: [
            { label: "Help For Minibuffer", action: CMD.HELP_FOR_MINIBUFFER, enabledFlagsSet: [FLAGS.TREE_OPENED] },
            { label: "Execute Script", action: CMD.EXECUTE, keyboardShortcut: "Ctrl+B", enabledFlagsSet: [FLAGS.TREE_OPENED] },
            { label: "Full Command", action: CMD.MINIBUFFER, keyboardShortcut: "Alt+X", enabledFlagsSet: [FLAGS.TREE_OPENED] },
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
            { label: "About", action: CMD.ABOUT_LEO, enabledFlagsSet: [FLAGS.TREE_OPENED] },
        ],
    },
];