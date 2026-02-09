import { Constants } from "./constants";
import { Keybinding } from "./types";

const CMD = Constants.COMMANDS;

export const keybindings: Keybinding[] = [
    {
        command: CMD.EXECUTE,
        key: "ctrl+b",
        mac: "cmd+b",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MINIBUFFER,
        key: "alt+x",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.SHOW_OUTLINE,
        key: "alt+t",
        body: true,
        find: true
    },
    {
        command: CMD.SHOW_OUTLINE,
        key: "ctrl+t",
        body: true,
    },
    {
        command: CMD.SHOW_BODY,
        key: "ctrl+t",
        outline: true,
    },
    {
        command: CMD.SHOW_BODY,
        key: "alt+d",
        outline: true,
        find: true
    },
    {
        command: CMD.SHOW_BODY,
        key: "tab",
        outline: true,
        find: true
    },
    {
        command: CMD.SHOW_BODY,
        key: "enter",
        outline: true,
    },
    {
        command: CMD.TAB_CYCLE_NEXT,
        key: "ctrl+tab",
        mac: "cmd+tab",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.SAVE_FILE,
        key: "ctrl+s",
        mac: "cmd+s",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.NEW_FILE,
        key: "ctrl+n", // Maybe browser will intercept?
        mac: "cmd+n",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.OPEN_FILE,
        key: "ctrl+o",
        mac: "cmd+o",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.WRITE_AT_FILE_NODES,
        key: "ctrl+shift+w",
        mac: "cmd+shift+w",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.WRITE_DIRTY_AT_FILE_NODES,
        key: "ctrl+shift+q",
        mac: "cmd+shift+q",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.CONTRACT_ALL,
        key: "alt+-",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.HEADLINE_SELECTION,
        key: "ctrl+h",
        mac: "cmd+h",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MARK_SELECTION,
        key: "ctrl+m",
        mac: "cmd+m",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.EXTRACT,
        key: "ctrl+shift+d",
        mac: "cmd+shift+d",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.EXTRACT_NAMES,
        key: "ctrl+shift+n",
        mac: "cmd+shift+n",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MOVE_DOWN_SELECTION,
        key: "ctrl+d",
        mac: "cmd+d",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MOVE_DOWN_SELECTION,
        key: "shift+d",
        outline: true,
    },
    {
        command: CMD.MOVE_DOWN_SELECTION,
        key: "shift+alt+arrowdown",
        outline: true,
    },
    {
        command: CMD.MOVE_LEFT_SELECTION,
        key: "ctrl+l",
        mac: "cmd+l",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MOVE_LEFT_SELECTION,
        key: "shift+l",
        outline: true,
    },
    {
        command: CMD.MOVE_LEFT_SELECTION,
        key: "shift+alt+arrowleft",
        outline: true,
    },
    {
        command: CMD.MOVE_RIGHT_SELECTION,
        key: "ctrl+r",
        mac: "cmd+r",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MOVE_RIGHT_SELECTION,
        key: "shift+r",
        outline: true,
    },
    {
        command: CMD.MOVE_RIGHT_SELECTION,
        key: "shift+alt+arrowright",
        outline: true,
    },
    {
        command: CMD.MOVE_UP_SELECTION,
        key: "ctrl+u",
        mac: "cmd+u",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MOVE_UP_SELECTION,
        key: "shift+u",
        outline: true,
    },
    {
        command: CMD.MOVE_UP_SELECTION,
        key: "shift+alt+arrowup",
        outline: true,
    },
    {
        command: CMD.SORT_SIBLINGS,
        key: "alt+a",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.PROMOTE_SELECTION,
        key: "ctrl+[", // TODO : test if browser intercepts on all platforms
        // mac: "cmd+[",
        // linux: "ctrl+[",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.DEMOTE_SELECTION,
        key: "ctrl+]", // TODO : test if browser intercepts on all platforms
        // mac: "cmd+]",
        // linux: "ctrl+]",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "ctrl+i",
        mac: "cmd+i",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "shift+insert",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "insert",
        outline: true,
    },
    {
        command: CMD.INSERT_SELECTION,
        key: "shift+insert",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.INSERT_CHILD_SELECTION,
        key: "ctrl+insert",
        mac: "cmd+insert",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.CLONE_SELECTION,
        key: "ctrl+`",
        // win: "ctrl+oem_3",  // TODO : test if browser intercepts on all platforms
        // linux: "ctrl+`",  // TODO : test if browser intercepts on all platforms
        // mac: "cmd+`",  // TODO : test if browser intercepts on all platforms
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.CUT_SELECTION,
        key: "ctrl+shift+x",
        mac: "cmd+shift+x",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.COPY_SELECTION,
        key: "ctrl+shift+c",
        mac: "cmd+shift+c",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.PASTE_SELECTION,
        key: "ctrl+shift+v",
        mac: "cmd+shift+v",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.DELETE_SELECTION,
        key: "ctrl+shift+backspace",
        mac: "cmd+shift+backspace",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.DELETE_SELECTION,
        key: "delete",
        outline: true,
    },
    {
        command: CMD.UNDO,
        key: "ctrl+z",
        mac: "cmd+z",
        outline: true,
    },
    {
        command: CMD.REDO,
        key: "ctrl+shift+z",
        mac: "cmd+shift+z",
        outline: true,
    },
    {
        command: CMD.START_SEARCH,
        key: "ctrl+f",
        mac: "cmd+f",
        outline: true,
        body: true,
        find: true
    },
    // TODO : UNDOMMENT WHEN NAV PANEL IS READY
    // {
    //     command: CMD.FIND_QUICK_SELECTED,
    //     key: "ctrl+shift+f",
    //     mac: "cmd+shift+f",
    //     outline: true,
    //     body: true,
    //     find: true
    // }
    {
        command: CMD.FIND_NEXT,
        key: "f3",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.FIND_PREVIOUS,
        key: "f2",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.REPLACE,
        key: "ctrl+=",
        mac: "cmd+=",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.REPLACE_THEN_FIND,
        key: "ctrl+-",
        mac: "cmd+-",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.GOTO_GLOBAL_LINE,
        key: "alt+g",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.SET_FIND_EVERYWHERE_OPTION,
        key: "ctrl+alt+e",
        mac: "cmd+alt+e",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.SET_FIND_NODE_ONLY_OPTION,
        key: "ctrl+alt+n",
        mac: "cmd+alt+n",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.SET_FIND_FILE_ONLY_OPTION,
        key: "ctrl+alt+l",
        mac: "cmd+alt+l",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.SET_FIND_SUBOUTLINE_ONLY_OPTION,
        key: "ctrl+alt+s",
        mac: "cmd+alt+s",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_IGNORE_CASE_OPTION,
        key: "ctrl+alt+i",
        mac: "cmd+alt+i",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_MARK_CHANGES_OPTION,
        key: "ctrl+alt+c",
        mac: "cmd+alt+c",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_MARK_FINDS_OPTION,
        key: "ctrl+alt+f",
        mac: "cmd+alt+f",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_REGEXP_OPTION,
        key: "ctrl+alt+x",
        mac: "cmd+alt+x",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_WORD_OPTION,
        key: "ctrl+alt+w",
        mac: "cmd+alt+w",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_SEARCH_BODY_OPTION,
        key: "ctrl+alt+b",
        mac: "cmd+alt+b",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.TOGGLE_FIND_SEARCH_HEADLINE_OPTION,
        key: "ctrl+alt+h",
        mac: "cmd+alt+h",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.GOTO_FIRST_VISIBLE,
        key: "alt+home",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.GOTO_LAST_VISIBLE,
        key: "alt+end",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.GOTO_FIRST_VISIBLE,
        key: "home",
        outline: true,
    },
    {
        command: CMD.GOTO_LAST_VISIBLE,
        key: "end",
        outline: true,
    },
    {
        command: CMD.PAGE_UP,
        key: "pageup",
        outline: true,
    },
    {
        command: CMD.PAGE_DOWN,
        key: "pagedown",
        outline: true,
    },
    {
        command: CMD.GOTO_NEXT_CLONE,
        key: "alt+n",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.GOTO_NEXT_VISIBLE,
        key: "arrowdown",
        outline: true,
    },
    {
        command: CMD.GOTO_NEXT_VISIBLE,
        key: "alt+arrowdown",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.GOTO_PREV_VISIBLE,
        key: "arrowup",
        outline: true,
    },
    {
        command: CMD.GOTO_PREV_VISIBLE,
        key: "alt+arrowup",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.CONTRACT_OR_GO_LEFT,
        key: "arrowleft",
        outline: true,
    },
    {
        command: CMD.CONTRACT_OR_GO_LEFT,
        key: "alt+arrowleft",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.EXPAND_AND_GO_RIGHT,
        key: "arrowright",
        outline: true,
    },
    {
        command: CMD.EXPAND_AND_GO_RIGHT,
        key: "alt+arrowright",
        outline: true,
        body: true,
        find: true
    },

];