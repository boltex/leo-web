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
                    { label: "Write @<file> Nodes", action: CMD.WRITE_AT_FILE_NODES },
                    { label: "Write Dirty @<file> Nodes", action: CMD.WRITE_DIRTY_AT_FILE_NODES },

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
            { label: "Undo", action: CMD.UNDO },
            { label: "Redo", action: CMD.REDO },
            { label: "Cut", action: CMD.CUT_TEXT },
            { label: "Copy", action: CMD.COPY_TEXT },
            { label: "Paste", action: CMD.PASTE_TEXT },
            { label: "Select All", action: "todo" },
            //
            {
                label: "Edit Headline", entries: [
                    { label: "Capitalize-Headline", action: "todo" },
                    { label: "Edit-Headline", action: "todo" },
                    { label: "End-Edit-Headline", action: "todo" },
                    { label: "Insert-Headline-Time", action: "todo" },
                ]
            },
            // { label: "Edit Text", entries: [

            // ]},
            {
                label: "Format Text", entries: [
                    { label: "Insert-Body-Time", action: "todo" },
                    { label: "Reformat-Paragraph", action: "todo" },
                    { label: "Rst3", action: "todo" },

                ]
            },
            {
                label: "Select Chapters", entries: [
                    { label: "Chapter-Select", action: "todo" },
                    { label: "Chapter-Select-Main", action: "todo" },
                ]
            },
        ],
    },
    {
        label: "Search",
        entries: [
            { label: "Help for Find Commands", action: "todo" },
            { label: "Goto Global Line", action: "todo" },
            { label: "Start Search", action: "todo" },
            { label: "Find Next", action: "todo" },
            { label: "Find Previous", action: "todo" },
            { label: "Replace", action: "todo" },
            { label: "Replace Then Find", action: "todo" },
            { label: "Replace All", action: "todo" },
            {
                label: "Clone-Find Commands",
                entries: [
                    { label: "Clone-Find-All", action: "todo" },
                    { label: "Clone-Find-All-Flattened", action: "todo" },
                    { label: "Clone-Find-All-Flattened-marked", action: "todo" },
                    { label: "Clone-Find-Parents", action: "todo" },
                    { label: "Clone-Find-Tag", action: "todo" },
                ]
            },
            {
                label: "Set Search Settings",
                entries: [
                    { label: "Set Find-Everywhere", action: "todo" },
                    { label: "Set Find-Node-Only", action: "todo" },
                    { label: "Set Find-Suboutline-Only", action: "todo" },
                    { label: "Toggle Ignore-Case", action: "todo" },
                    { label: "Toggle Mark-Changes", action: "todo" },
                    { label: "Toggle Mark-Finds", action: "todo" },
                    { label: "Toggle Regex", action: "todo" },
                    { label: "Toggle Word", action: "todo" },
                ]
            },
        ],
    },
    {
        label: "Settings",
        entries: [
            { label: "Open LeoSettings.leo", action: "todo" },
            { label: "Reload Settings", action: "todo" },
        ],
    },
    {
        label: "Outline",
        entries: [
            { label: "Clone-Node", action: "todo" },
            { label: "Delete-Node", action: "todo" },
            { label: "Insert-Node", action: "todo" },
            { label: "Insert-Child", action: "todo" },
            { label: "Cut-Node", action: "todo" },
            { label: "Copy-Node", action: "todo" },
            { label: "Paste-Node", action: "todo" },
            { label: "Paste Node As Clone", action: "todo" },
            { label: "Demote Siblings", action: "todo" },
            { label: "Promote Children", action: "todo" },
            { label: "Refresh From Disk", action: "todo" },
            {
                label: "Expand/Contract Nodes", entries: [
                    { label: "Contract-All", action: "todo" },
                    { label: "Contract-Node", action: "todo" },
                    { label: "Contract-Parent", action: "todo" },
                    { label: "Contract-Or-Go-Left", action: "todo" },
                    //
                    { label: "Expand-Prev-Level", action: "todo" },
                    { label: "Expand-Next-Level", action: "todo" },
                    { label: "Expand-And-Go-Right", action: "todo" },
                    { label: "Expand-Or-Go-Right", action: "todo" },
                    //
                    { label: "Expand-To-Level-1", action: "todo" },
                    { label: "Expand-To-Level-2", action: "todo" },
                    { label: "Expand-To-Level-3", action: "todo" },
                    { label: "Expand-To-Level-4", action: "todo" },
                    { label: "Expand-To-Level-5", action: "todo" },
                    { label: "Expand-To-Level-6", action: "todo" },
                    { label: "Expand-To-Level-7", action: "todo" },
                    { label: "Expand-To-Level-8", action: "todo" },
                    //
                    { label: "Expand-All", action: "todo" },
                    { label: "Expand-Node", action: "todo" },
                ]
            },
            {
                label: "Go To Nodes", entries: [
                    { label: "Find-Next-Clone", action: "todo" },
                    { label: "Goto-First-Node", action: "todo" },
                    { label: "Goto-First-Visible-Node", action: "todo" },
                    { label: "Goto-First-Sibling", action: "todo" },
                    //
                    { label: "Goto-Next-Changed", action: "todo" },
                    { label: "Goto-Next-Clone", action: "todo" },
                    { label: "Goto-Next-Marked", action: "todo" },
                    { label: "Goto-Next-Node", action: "todo" },
                    { label: "Goto-Next-Sibling", action: "todo" },
                    { label: "Goto-Next-Visible", action: "todo" },
                    { label: "Go-Forward", action: "todo" },
                    //
                    { label: "Goto-Parent", action: "todo" },
                    //
                    { label: "Goto-Prev-Node", action: "todo" },
                    { label: "Goto-Prev-Sibling", action: "todo" },
                    { label: "Goto-Prev-Visible", action: "todo" },
                    { label: "Go-Back", action: "todo" },
                    //
                    { label: "Goto-Last-Node", action: "todo" },
                    { label: "Goto-Last-Sibling", action: "todo" },
                    { label: "Goto-Last-Visible-Node", action: "todo" },
                ]
            },
            {
                label: "Hoist/Dehoist Nodes", entries: [
                    { label: "Hoist", action: "todo" },
                    { label: "De-Hoist", action: "todo" },

                ]
            },
            {
                label: "Mark Nodes", entries: [
                    { label: "Clone-Marked-Nodes", action: "todo" },
                    { label: "Toggle Mark", action: "todo" },
                    { label: "Mark-Subheads", action: "todo" },
                    { label: "Mark-Changed-Items", action: "todo" },
                    { label: "Unmark-All", action: "todo" },

                ]
            },
            {
                label: "Move Nodes", entries: [
                    { label: "Move-Outline-Down", action: "todo" },
                    { label: "Move-Outline-Left", action: "todo" },
                    { label: "Move-Outline-Right", action: "todo" },
                    { label: "Move-Outline-Up", action: "todo" },

                ]
            },
            {
                label: "Sort Nodes", entries: [
                    { label: "Sort-Children", action: "todo" },
                    { label: "Sort-Siblings", action: "todo" },
                ]
            },
        ],
    },
    {
        label: "Run",
        entries: [
            { label: "Help For Minibuffer", action: "todo" },
            { label: "Execute Script", action: "todo" },
            { label: "Full Command", action: "todo" },
        ],
    },
    {
        label: "Window",
        entries: [
            { label: "Equal Sized Panes", action: CMD.EQUAL_SIZED_PANES },
            { label: "Horizontal Window Layout", action: CMD.HORIZONTAL_LAYOUT },
            { label: "Vertical Window Layout", action: CMD.VERTICAL_LAYOUT },
        ],
    },
    {
        label: "Help",
        entries: [
            { label: "Documentation", action: "todo" },
            { label: "About", action: "todo" },
        ],
    },
];