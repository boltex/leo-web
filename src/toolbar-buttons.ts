//@+leo-ver=5-thin
//@+node:felix.20260407013645.1: * @file src/toolbar-buttons.ts
//@+<< imports >>
//@+node:felix.20260407013813.1: ** << imports >>
import { ButtonEntry } from "./types";
import { Constants } from "./constants";
//@-<< imports >>
//@+others
//@+node:felix.20260407225250.1: ** Constants
const CMD = Constants.COMMANDS;
const FLAGS = Constants.CONTEXT_FLAGS;
//@+node:felix.20260407013836.1: ** Toolbar Buttons
export const toolbarButtons: ButtonEntry[] = [

    // New
    { icon: "leo-new-file", action: CMD.NEW_FILE, tooltip: "New Leo File" },
    // Open
    { icon: "leo-folder", action: CMD.OPEN_FILE, tooltip: "Open Leo File (Ctrl+O)" },
    // Save
    { icon: "leo-save", action: CMD.SAVE_FILE, tooltip: "Save Leo File (Ctrl+S)", enabledFlagsSet: [FLAGS.TREE_OPENED] },
    // Prev
    { icon: "leo-prev", action: CMD.GO_BACK, tooltip: "Select Previous Node", enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_BACK] },

    // Next
    { icon: "leo-next", action: CMD.GO_FORWARD, tooltip: "Select Next Node", enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_NEXT] },

    // clone ( maybe? )
    // { icon: "leo-clone", action: CMD.CLONE, tooltip: "Clone Node (Ctrl+Shift+`)", enabledFlagsSet: [FLAGS.TREE_OPENED] },

    // dehoist
    { icon: "leo-dehoist", action: CMD.DEHOIST, tooltip: "De-Hoist", enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_DEHOIST] },
    // hoist
    { icon: "leo-hoist", action: CMD.HOIST_SELECTION, tooltip: "Hoist Selection", enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_HOIST] },

    // promote
    { icon: "leo-promote", action: CMD.PROMOTE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_PROMOTE], tooltip: "Promote Children (Ctrl+[)" },

    // demote
    { icon: "leo-demote", action: CMD.DEMOTE_SELECTION, enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_DEMOTE], tooltip: "Demote Siblings (Ctrl+])" },

    // extract
    { icon: "leo-extract", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTRACT, tooltip: "Extract   Ctrl+Shift+D" },

    // extract name
    { icon: "leo-extract-name", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.EXTRACT_NAMES, tooltip: "Extract Names" },

    // import file
    { icon: "leo-import", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.IMPORT_ANY_FILE, tooltip: "Import File" },

    // recent files
    { icon: "leo-open-recent", action: CMD.RECENT_FILES, tooltip: "Open Recent Files" },

    // select chapter
    { icon: "leo-chapter-select", tooltip: "Select Chapter", enabledFlagsSet: [FLAGS.TREE_OPENED], action: CMD.CHAPTER_SELECT },


    // Execute Script
    { label: "▷", action: CMD.EXECUTE, tooltip: "Run leo script (Ctrl+B)", enabledFlagsSet: [FLAGS.TREE_OPENED] },

    // Add more as needed, but keep the toolbar from getting too crowded.
    // The most important commands should be accessible via keyboard shortcuts and/or the command palette, not just the toolbar.

];
//@-others
//@@language typescript
//@@tabwidth -4

//@-leo
