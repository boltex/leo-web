//@+leo-ver=5-thin
//@+node:felix.20260321195657.1: * @file src/keybindings.ts
//@+<< imports >>
//@+node:felix.20260323140207.1: ** << imports >>
import { Constants } from "./constants";
import { Keybinding } from "./types";
//@-<< imports >>
//@+others
//@+node:felix.20260323140218.1: ** Documentation

// Keybinding "enabled flags" are less restrictive than for the menu, 
// because we dont want to have to wait for flags, and the commands
// themselves do check for the necessary flags before executing.

//@+node:felix.20260323140223.1: ** Constants
const CMD = Constants.COMMANDS;
const FLAGS = Constants.CONTEXT_FLAGS;
//@+node:felix.20260323140231.1: ** Keybindings
export const keybindings: Keybinding[] = [
    {
        command: CMD.EXECUTE,
        key: "ctrl+b",
        mac: "meta+b",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MINIBUFFER,
        key: "alt+x",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MINIBUFFER,
        key: "ctrl+shift+p",
        mac: "meta+shift+p",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SHOW_OUTLINE,
        key: "alt+t",
        body: true,
        find: true
    },
    {
        command: CMD.SHOW_OUTLINE,
        key: "ctrl+t", // BROWSER MAY INTERCEPT!
        body: true
    },
    {
        command: CMD.SHOW_BODY,
        key: "ctrl+t", // BROWSER MAY INTERCEPT!
        outline: true
    },
    {
        command: CMD.SHOW_BODY,
        key: "alt+d",
        outline: true,
        find: true,
    },
    {
        command: CMD.SHOW_BODY,
        key: "tab",
        outline: true,
        // find: true,
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.SHOW_BODY,
        key: "shift+tab",
        outline: true,
        // find: true,
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.INDENT_REGION,
        key: "tab",
        body: true,
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.UNINDENT_REGION,
        key: "shift+tab",
        body: true,
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.SHOW_BODY,
        key: "enter",
        outline: true,
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.TAB_CYCLE_NEXT,
        key: "ctrl+tab", // Maybe browser will intercept?
        mac: "meta+tab",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SAVE_FILE,
        key: "ctrl+s",
        mac: "meta+s",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.NEW_FILE,
        key: "ctrl+n", // Maybe browser will intercept?
        mac: "meta+n",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.OPEN_FILE,
        key: "ctrl+o",
        mac: "meta+o",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.WRITE_AT_FILE_NODES,
        key: "ctrl+shift+w",
        mac: "meta+shift+w",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.WRITE_DIRTY_AT_FILE_NODES,
        key: "ctrl+shift+q",
        mac: "meta+shift+q",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.CONTRACT_ALL,
        key: "alt+-",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.HEADLINE_SELECTION,
        key: "ctrl+h",
        mac: "meta+h",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MARK_SELECTION,
        key: "ctrl+m",
        mac: "meta+m",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.EXTRACT,
        key: "ctrl+shift+d",
        mac: "meta+shift+d",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.EXTRACT_NAMES,
        key: "ctrl+shift+n", // Maybe browser will intercept?
        mac: "meta+shift+n",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_DOWN_SELECTION,
        key: "ctrl+d",
        mac: "meta+d",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_DOWN_SELECTION,
        key: "shift+arrowdown",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_DOWN_SELECTION,
        key: "shift+alt+arrowdown",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_LEFT_SELECTION,
        key: "ctrl+l",
        mac: "meta+l",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_LEFT_SELECTION,
        key: "shift+arrowleft",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_LEFT_SELECTION,
        key: "shift+alt+arrowleft",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_RIGHT_SELECTION,
        key: "ctrl+r",
        mac: "meta+r",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_RIGHT_SELECTION,
        key: "shift+arrowright",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_RIGHT_SELECTION,
        key: "shift+alt+arrowright",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_UP_SELECTION,
        key: "ctrl+u",
        mac: "meta+u",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_UP_SELECTION,
        key: "shift+arrowup",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.MOVE_UP_SELECTION,
        key: "shift+alt+arrowup",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SORT_SIBLINGS,
        key: "alt+a",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.PROMOTE_SELECTION,
        key: "ctrl+[", // TODO : test if browser intercepts
        code: "ctrl+bracketleft", // Has priority over key when specified

        // mac: "meta+[",
        // linux: "ctrl+[",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.DEMOTE_SELECTION,
        key: "ctrl+]", // TODO : test if browser intercepts
        code: "ctrl+bracketright", // Has priority over key when specified.
        // mac: "meta+]",
        // linux: "ctrl+]",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "ctrl+i",
        mac: "meta+i",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "shift+insert",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "insert",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "shift+insert",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.INSERT_CHILD_SELECTION,
        key: "ctrl+insert",
        mac: "meta+insert",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.CLONE_SELECTION,
        key: "ctrl+`",
        code: "ctrl+backquote", // Has priority over key when specified.
        // win: "ctrl+oem_3",
        // linux: "ctrl+`",
        // mac: "meta+`",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.CUT_SELECTION,
        key: "ctrl+shift+x",
        mac: "meta+shift+x",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.COPY_SELECTION,
        key: "ctrl+shift+c",
        mac: "meta+shift+c",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.PASTE_SELECTION,
        key: "ctrl+shift+v",
        mac: "meta+shift+v",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.DELETE_SELECTION,
        key: "ctrl+shift+backspace",
        mac: "meta+shift+backspace",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.DELETE_SELECTION,
        key: "delete",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.UNDO,
        key: "ctrl+z",
        mac: "meta+z",
        outline: true,
        body: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_UNDO],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.REDO,
        key: "ctrl+shift+z",
        mac: "meta+shift+z",
        outline: true,
        body: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED, FLAGS.LEO_CAN_REDO],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.FIND_QUICK_GO_ANYWHERE,
        key: "ctrl+p",
        mac: "meta+p",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.START_SEARCH,
        key: "ctrl+f",
        mac: "meta+f",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    // TODO : UNDOMMENT WHEN NAV PANEL IS READY
    // {
    //     command: CMD.FIND_QUICK_SELECTED,
    //     key: "ctrl+shift+f",
    //     mac: "meta+shift+f",
    //     outline: true,
    //     body: true,
    //     find: true
    // }
    {
        command: CMD.FIND_NEXT,
        key: "f3",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.FIND_PREVIOUS,
        key: "f2",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.REPLACE,
        key: "ctrl+=",
        mac: "meta+=",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.REPLACE_THEN_FIND,
        key: "ctrl+-",
        mac: "meta+-",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.GOTO_GLOBAL_LINE,
        key: "alt+g",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SET_FIND_EVERYWHERE_OPTION,
        key: "ctrl+alt+e",
        mac: "meta+alt+e",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SET_FIND_NODE_ONLY_OPTION,
        key: "ctrl+alt+n",
        mac: "meta+alt+n",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SET_FIND_FILE_ONLY_OPTION,
        key: "ctrl+alt+l",
        mac: "meta+alt+l",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.SET_FIND_SUBOUTLINE_ONLY_OPTION,
        key: "ctrl+alt+s",
        mac: "meta+alt+s",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_IGNORE_CASE_OPTION,
        key: "ctrl+alt+i",
        mac: "meta+alt+i",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_MARK_CHANGES_OPTION,
        key: "ctrl+alt+c",
        mac: "meta+alt+c",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_MARK_FINDS_OPTION,
        key: "ctrl+alt+f",
        mac: "meta+alt+f",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_REGEXP_OPTION,
        key: "ctrl+alt+x",
        mac: "meta+alt+x",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_WORD_OPTION,
        key: "ctrl+alt+w",
        mac: "meta+alt+w",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_SEARCH_BODY_OPTION,
        key: "ctrl+alt+b",
        mac: "meta+alt+b",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_FIND_SEARCH_HEADLINE_OPTION,
        key: "ctrl+alt+h",
        mac: "meta+alt+h",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.GOTO_FIRST_VISIBLE,
        key: "alt+home",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.GOTO_LAST_VISIBLE,
        key: "alt+end",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.GOTO_FIRST_VISIBLE,
        key: "home",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.GOTO_LAST_VISIBLE,
        key: "end",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.PAGE_UP,
        key: "pageup",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.PAGE_DOWN,
        key: "pagedown",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.GOTO_NEXT_CLONE,
        key: "alt+n",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.GOTO_NEXT_VISIBLE,
        key: "arrowdown",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.GOTO_NEXT_VISIBLE,
        key: "alt+arrowdown",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.GOTO_PREV_VISIBLE,
        key: "arrowup",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.GOTO_PREV_VISIBLE,
        key: "alt+arrowup",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.CONTRACT_OR_GO_LEFT,
        key: "arrowleft",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.CONTRACT_OR_GO_LEFT,
        key: "alt+arrowleft",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.EXPAND_AND_GO_RIGHT,
        key: "arrowright",
        outline: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED],
        enabledFlagsClear: [FLAGS.IN_HEADLINE_EDIT]
    },
    {
        command: CMD.EXPAND_AND_GO_RIGHT,
        key: "alt+arrowright",
        outline: true,
        body: true,
        find: true,
        enabledFlagsSet: [FLAGS.TREE_OPENED]
    },
    {
        command: CMD.TOGGLE_MENU,
        key: "shift+f11",
        outline: true,
        body: true,
        find: true,
    },

];
//@-others
//@@language typescript
//@@tabwidth -4
//@-leo
