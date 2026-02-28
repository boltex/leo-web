import { Constants } from "./constants";
import { Position } from "./core/leoNodes";
import { LeoController } from "./controller";
import { LeoUI } from "./leo-ui";
import { Focus, ReqRefresh } from "./types";
import { Uri } from "./workspace";

/**
 * Make all command/key bindings for the application.
 */
export function makeAllBindings(leoUI: LeoUI, controller: LeoController): void {
    // Shortcut pointers for readability
    const U = undefined;
    const CMD = Constants.COMMANDS;
    const LEOCMD = Constants.LEO_COMMANDS;

    const NO_REFRESH: ReqRefresh = {};
    const REFRESH_NODE_BODY: ReqRefresh = {
        tree: true, // IN LEO-WEB, body refresh also needs tree refresh to update icons
        body: true, // Goto/select another node needs the body pane refreshed
        states: true
    };
    const REFRESH_TREE: ReqRefresh = {
        tree: true,
        states: true
    };
    const REFRESH_TREE_BODY: ReqRefresh = {
        tree: true,
        body: true,
        states: true
    };
    const REFRESH_ALL: ReqRefresh = {
        tree: true,
        body: true,
        states: true,
        documents: true,
        buttons: true
    };

    const commands: [string, (...args: any[]) => any][] = [

        [CMD.ABOUT_LEO, () => leoUI.command(LEOCMD.ABOUT_LEO, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.DOCUMENTATION, () => leoUI.showDocumentation()],

        [CMD.CAPITALIZE_HEADLINE, () => leoUI.command(LEOCMD.CAPITALIZE_HEADLINE, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],
        [CMD.END_EDIT_HEADLINE, () => leoUI.command(LEOCMD.END_EDIT_HEADLINE, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],
        [CMD.INSERT_HEADLINE_TIME, () => leoUI.command(LEOCMD.INSERT_HEADLINE_TIME, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],
        [CMD.INSERT_BODY_TIME, () => leoUI.command(LEOCMD.INSERT_BODY_TIME, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.NoChange })],
        [CMD.REFORMAT_PARAGRAPH, () => leoUI.command(LEOCMD.REFORMAT_PARAGRAPH, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.NoChange })],
        [CMD.RST3, () => leoUI.command(LEOCMD.RST3, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        [CMD.HELP_FOR_FIND_COMMANDS, () => leoUI.command(LEOCMD.HELP_FOR_FIND_COMMANDS, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.HELP_FOR_MINIBUFFER, () => leoUI.command(LEOCMD.HELP_FOR_MINIBUFFER, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        [CMD.LIGHT_THEME, () => leoUI.lightTheme()],
        [CMD.DARK_THEME, () => leoUI.darkTheme()],
        [CMD.HORIZONTAL_LAYOUT, () => leoUI.applyLayout('horizontal')],
        [CMD.VERTICAL_LAYOUT, () => leoUI.applyLayout('vertical')],
        [CMD.EQUAL_SIZED_PANES, () => leoUI.equalSizedPanes()],
        [CMD.CHOOSE_NEW_WORKSPACE, () => leoUI.chooseNewWorkspace()],

        [CMD.CUT_TEXT, () => leoUI.cutText()],
        [CMD.COPY_TEXT, () => leoUI.copyText()],
        [CMD.PASTE_TEXT, () => leoUI.pasteText()],
        [CMD.SELECT_ALL_TEXT, () => leoUI.selectAllText()],

        [CMD.SHOW_WELCOME, () => leoUI.showSettings()],
        [CMD.SHOW_SETTINGS, () => leoUI.showSettings()],
        [CMD.SHOW_OUTLINE, () => leoUI.showOutline()], // Also focuses on outline
        [CMD.SHOW_LOG, () => leoUI.showLogPane()],
        [CMD.SHOW_BODY, () => leoUI.showBody()], // Also focuses on body
        [CMD.EXECUTE, () => leoUI.command(LEOCMD.EXECUTE_SCRIPT, { refreshType: REFRESH_ALL, finalFocus: Focus.NoChange })],

        // [CMD.SHORT_GNX_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("shortGnx")], // Not referenced in package.json
        // [CMD.FULL_GNX_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("fullGnx")], // Not referenced in package.json
        // [CMD.SHORT_LEGACY_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("shortLegacy")], // Not referenced in package.json
        // [CMD.FULL_LEGACY_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("fullLegacy")], // Not referenced in package.json

        // [CMD.STATUS_BAR, () => p_leoUI.statusBar()], // Not referenced in package.json
        [CMD.MINIBUFFER, () => leoUI.minibuffer()], // Is referenced in package.json
        [CMD.SET_LEO_ID, () => leoUI.setLeoIDCommand()],
        [CMD.OPEN_LEO_SETTINGS, () => leoUI.command(LEOCMD.OPEN_LEO_SETTINGS, { refreshType: REFRESH_ALL, finalFocus: Focus.NoChange })],
        [CMD.RELOAD_SETTINGS, () => leoUI.command(LEOCMD.RELOAD_SETTINGS, { refreshType: REFRESH_ALL, finalFocus: Focus.NoChange })],

        [CMD.HANDLE_UNL, (p_arg: { unl: string }) => leoUI.handleUnl(p_arg)],

        // [CMD.GOTO_LINE_IN_LEO_OUTLINE, (p_arg: any) => p_leoUI.gotoLineInLeoOutline(p_arg)],
        // [CMD.IMPORT_INTO_LEO_OUTLINE, (p_arg: any) => p_leoUI.importIntoLeoOutline(p_arg)],

        // [CMD.CLICK_BUTTON, (p_node: LeoButtonNode) => p_leoUI.clickAtButton(p_node)], // Not referenced in package.json
        // [CMD.GOTO_SCRIPT, (p_node: LeoButtonNode) => p_leoUI.gotoScript(p_node)],
        // [CMD.REMOVE_BUTTON, (p_node: LeoButtonNode) => p_leoUI.removeAtButton(p_node)],

        [CMD.CLOSE_FILE, () => leoUI.closeLeoFile()],
        [CMD.NEW_FILE, () => leoUI.newLeoFile()],
        [CMD.OPEN_FILE, (p_uri?: Uri) => leoUI.openLeoFile(p_uri)],
        [CMD.REVERT, () => leoUI.command(LEOCMD.REVERT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],

        [CMD.SAVE_AS_FILE, () => leoUI.saveAsLeoFile()],
        [CMD.SAVE_AS_LEOJS, () => leoUI.saveAsLeoJsFile()],
        [CMD.SAVE_FILE, () => leoUI.saveLeoFile()],

        [CMD.SWITCH_FILE, () => leoUI.switchLeoFile()],
        [CMD.RECENT_FILES, () => leoUI.showRecentLeoFiles()],

        [CMD.WRITE_AT_FILE_NODES, () => leoUI.command(LEOCMD.WRITE_AT_FILE_NODES, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],
        [CMD.WRITE_DIRTY_AT_FILE_NODES, () => leoUI.command(LEOCMD.WRITE_DIRTY_AT_FILE_NODES, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.SET_OPENED_FILE, (p_index: number) => leoUI.selectOpenedLeoDocument(p_index)],

        [CMD.REFRESH_FROM_DISK, (p_node: Position) => leoUI.command(LEOCMD.REFRESH_FROM_DISK, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange, keepSelection: true })],
        [CMD.REFRESH_FROM_DISK_SELECTION, () => leoUI.command(LEOCMD.REFRESH_FROM_DISK, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.OPEN_AT_LEO_FILE, (p_node: Position) => leoUI.command(LEOCMD.OPEN_AT_LEO_FILE, { node: p_node, refreshType: REFRESH_ALL, finalFocus: Focus.Outline })], // DO NOT KEEP SELECTION
        [CMD.OPEN_AT_LEO_FILE_SELECTION, () => leoUI.command(LEOCMD.OPEN_AT_LEO_FILE, { refreshType: REFRESH_ALL, finalFocus: Focus.NoChange })],

        [CMD.TAB_CYCLE_NEXT, () => leoUI.tabCycle()],

        [CMD.IMPORT_ANY_FILE, () => leoUI.command(LEOCMD.IMPORT_ANY_FILE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.READ_FILE_INTO_NODE, () => leoUI.command(LEOCMD.READ_FILE_INTO_NODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.WRITE_FILE_FROM_NODE, () => leoUI.command(LEOCMD.WRITE_FILE_FROM_NODE, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        [CMD.EXPORT_HEADLINES, () => leoUI.command(LEOCMD.EXPORT_HEADLINES, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.FLATTEN_OUTLINE, () => leoUI.command(LEOCMD.FLATTEN_OUTLINE, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.OUTLINE_TO_CWEB, () => leoUI.command(LEOCMD.OUTLINE_TO_CWEB, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.OUTLINE_TO_NOWEB, () => leoUI.command(LEOCMD.OUTLINE_TO_NOWEB, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.REMOVE_SENTINELS, () => leoUI.command(LEOCMD.REMOVE_SENTINELS, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.WEAVE, () => leoUI.command(LEOCMD.WEAVE, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        [CMD.HEADLINE, (p_node: Position, p_doubleClicked?: boolean) => leoUI.editHeadline(p_node, p_doubleClicked)],
        [CMD.HEADLINE_SELECTION, (p_doubleClicked?: boolean) => leoUI.editHeadline(U, p_doubleClicked)],

        // cut/copy/paste/delete given node.
        [CMD.COPY, (p_node: Position) => leoUI.command(LEOCMD.COPY_PNODE, { node: p_node, refreshType: NO_REFRESH, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.CUT, (p_node: Position) => leoUI.command(LEOCMD.CUT_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.DELETE, (p_node: Position) => leoUI.command(LEOCMD.DELETE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.PASTE, (p_node: Position) => leoUI.command(LEOCMD.PASTE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.PASTE_CLONE, (p_node: Position) => leoUI.command(LEOCMD.PASTE_CLONE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],

        // cut/copy/paste/delete current selection (self.commander.p)
        [CMD.COPY_SELECTION, () => leoUI.command(LEOCMD.COPY_PNODE, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.CUT_SELECTION, () => leoUI.command(LEOCMD.CUT_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.DELETE_SELECTION, () => leoUI.command(LEOCMD.DELETE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.PASTE_AS_TEMPLATE, () => leoUI.command(LEOCMD.PASTE_AS_TEMPLATE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.PASTE_CLONE_SELECTION, () => leoUI.command(LEOCMD.PASTE_CLONE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.PASTE_SELECTION, () => leoUI.command(LEOCMD.PASTE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.SET_UA, () => leoUI.command(LEOCMD.SET_UA, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        // Called by nodes in the tree when selected either by mouse, or with enter
        [CMD.SELECT_NODE, (p_node: Position, p_CtrlClick: boolean) => leoUI.selectTreeNode(p_node, p_CtrlClick)],

        [CMD.CONTRACT_ALL_OTHER_NODES, () => leoUI.command(LEOCMD.CONTRACT_ALL_OTHER_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CONTRACT_ALL, () => leoUI.command(LEOCMD.CONTRACT_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.CONTRACT_OR_GO_LEFT, () => leoUI.command(LEOCMD.CONTRACT_OR_GO_LEFT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.EXPAND_AND_GO_RIGHT, () => leoUI.command(LEOCMD.EXPAND_AND_GO_RIGHT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.CONTRACT_NODE, (p_node?: Position) => leoUI.command(LEOCMD.CONTRACT_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CONTRACT_PARENT, () => leoUI.command(LEOCMD.CONTRACT_PARENT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.GOTO_NEXT_CLONE, (p_node: Position) => leoUI.command(LEOCMD.GOTO_NEXT_CLONE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_CLONE_SELECTION, () => leoUI.command(LEOCMD.GOTO_NEXT_CLONE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body, isNavigation: true })],
        [CMD.EXPAND_PREV_LEVEL, () => leoUI.command(LEOCMD.EXPAND_PREV_LEVEL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.EXPAND_NEXT_LEVEL, () => leoUI.command(LEOCMD.EXPAND_NEXT_LEVEL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.EXPAND_OR_GO_RIGHT, () => leoUI.command(LEOCMD.EXPAND_OR_GO_RIGHT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.EXPAND_TO_LEVEL_1, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_1, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_2, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_2, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_3, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_3, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_4, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_4, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_5, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_5, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_6, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_6, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_7, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_7, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_TO_LEVEL_8, () => leoUI.command(LEOCMD.EXPAND_TO_LEVEL_8, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_ALL, () => leoUI.command(LEOCMD.EXPAND_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.EXPAND_NODE, (p_node?: Position) => leoUI.command(LEOCMD.EXPAND_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.FIND_NEXT_CLONE, () => leoUI.command(LEOCMD.FIND_NEXT_CLONE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_FIRST_NODE, () => leoUI.command(LEOCMD.GOTO_FIRST_NODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_CHANGED, () => leoUI.command(LEOCMD.GOTO_NEXT_CHANGED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_NODE, () => leoUI.command(LEOCMD.GOTO_NEXT_NODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_SIBLING, () => leoUI.command(LEOCMD.GOTO_NEXT_SIBLING, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GO_FORWARD, () => leoUI.command(LEOCMD.GOTO_NEXT_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })], // Uses same GOTO_NEXT_HISTORY command
        [CMD.GOTO_PARENT, () => leoUI.command(LEOCMD.GOTO_PARENT, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_PREV_NODE, () => leoUI.command(LEOCMD.GOTO_PREV_NODE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_PREV_SIBLING, () => leoUI.command(LEOCMD.GOTO_PREV_SIBLING, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GO_BACK, () => leoUI.command(LEOCMD.GOTO_PREV_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })], // Uses same GOTO_PREV_HISTORY command
        [CMD.GOTO_LAST_NODE, () => leoUI.command(LEOCMD.GOTO_LAST_NODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.GOTO_PREV_MARKED, () => leoUI.command(LEOCMD.GOTO_PREV_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_MARKED, () => leoUI.command(LEOCMD.GOTO_NEXT_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_FIRST_SIBLING, () => leoUI.command(LEOCMD.GOTO_FIRST_SIBLING, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_LAST_SIBLING, () => leoUI.command(LEOCMD.GOTO_LAST_SIBLING, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_FIRST_VISIBLE, () => leoUI.command(LEOCMD.GOTO_FIRST_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_LAST_VISIBLE, () => leoUI.command(LEOCMD.GOTO_LAST_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_VISIBLE, () => leoUI.command(LEOCMD.GOTO_NEXT_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_PREV_VISIBLE, () => leoUI.command(LEOCMD.GOTO_PREV_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.PAGE_UP, () => leoUI.command(LEOCMD.PAGE_UP, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.PAGE_DOWN, () => leoUI.command(LEOCMD.PAGE_DOWN, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.DEHOIST, () => leoUI.command(LEOCMD.DEHOIST, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.HOIST, (p_node: Position) => leoUI.command(LEOCMD.HOIST_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.HOIST_SELECTION, () => leoUI.command(LEOCMD.HOIST_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.CHAPTER_NEXT, () => leoUI.command(LEOCMD.CHAPTER_NEXT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CHAPTER_BACK, () => leoUI.command(LEOCMD.CHAPTER_BACK, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CHAPTER_MAIN, () => leoUI.command(LEOCMD.CHAPTER_MAIN, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CHAPTER_SELECT, () => leoUI.command(LEOCMD.CHAPTER_SELECT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.INSERT_SELECTION, () => leoUI.command(LEOCMD.INSERT_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.INSERT_CHILD_SELECTION, () => leoUI.command(LEOCMD.INSERT_CHILD_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.CLONE, (p_node: Position) => leoUI.command(LEOCMD.CLONE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.CLONE_SELECTION, () => leoUI.command(LEOCMD.CLONE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.PROMOTE, (p_node: Position) => leoUI.command(LEOCMD.PROMOTE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.PROMOTE_SELECTION, () => leoUI.command(LEOCMD.PROMOTE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.DEMOTE, (p_node: Position) => leoUI.command(LEOCMD.DEMOTE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.DEMOTE_SELECTION, () => leoUI.command(LEOCMD.DEMOTE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.SORT_CHILDREN, () => leoUI.command(LEOCMD.SORT_CHILDREN, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange, keepSelection: true })],
        [CMD.SORT_SIBLINGS, () => leoUI.command(LEOCMD.SORT_SIBLINGS, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange, keepSelection: true })],

        [CMD.MARK, (p_node: Position) => leoUI.command(LEOCMD.TOGGLE_MARK, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MARK_SELECTION, () => leoUI.command(LEOCMD.TOGGLE_MARK, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],
        [CMD.UNMARK, (p_node: Position) => leoUI.command(LEOCMD.TOGGLE_MARK, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.UNMARK_SELECTION, () => leoUI.command(LEOCMD.TOGGLE_MARK, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],
        [CMD.UNMARK_ALL, () => leoUI.command(LEOCMD.UNMARK_ALL, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.EXTRACT, () => leoUI.command(LEOCMD.EXTRACT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.EXTRACT_NAMES, () => leoUI.command(LEOCMD.EXTRACT_NAMES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],

        [CMD.MOVE_DOWN, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_DOWN, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_DOWN_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_DOWN, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.MOVE_LEFT, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_LEFT, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_LEFT_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_LEFT, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.MOVE_RIGHT, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_RIGHT, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_RIGHT_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_RIGHT, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.MOVE_UP, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_UP, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_UP_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_UP, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        [CMD.REDO, () => leoUI.command(LEOCMD.REDO, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.UNDO, () => leoUI.command(LEOCMD.UNDO, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        // [CMD.REVERT_TO_UNDO, (p_undo: LeoUndoNode) => p_leoUI.revertToUndo(p_undo)], // Repeat undos/redo to given undo node.

        [CMD.COPY_MARKED, () => leoUI.command(LEOCMD.COPY_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.DIFF_MARKED_NODES, () => leoUI.command(LEOCMD.DIFF_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.MARK_CHANGED_ITEMS, () => leoUI.command(LEOCMD.MARK_CHANGED_ITEMS, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.MARK_SUBHEADS, () => leoUI.command(LEOCMD.MARK_SUBHEADS, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CLONE_MARKED_NODES, () => leoUI.command(LEOCMD.CLONE_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.DELETE_MARKED_NODES, () => leoUI.command(LEOCMD.DELETE_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.MOVE_MARKED_NODES, () => leoUI.command(LEOCMD.MOVE_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.PREV_NODE, () => leoUI.command(LEOCMD.GOTO_PREV_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.NEXT_NODE, () => leoUI.command(LEOCMD.GOTO_NEXT_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        // [CMD.FIND_QUICK, () => p_leoUI.findQuick()],
        // [CMD.FIND_QUICK_SELECTED, () => p_leoUI.findQuickSelected()],
        // [CMD.FIND_QUICK_TIMELINE, () => p_leoUI.findQuickTimeline()],
        // [CMD.FIND_QUICK_CHANGED, () => p_leoUI.findQuickChanged()],
        // [CMD.FIND_QUICK_HISTORY, () => p_leoUI.findQuickHistory()],
        // [CMD.FIND_QUICK_MARKED, () => p_leoUI.findQuickMarked()],
        [CMD.FIND_QUICK_GO_ANYWHERE, () => leoUI.goAnywhere()],

        // [CMD.GOTO_NAV_PREV, () => p_leoUI.navigateNavEntry(LeoGotoNavKey.prev)],
        // [CMD.GOTO_NAV_NEXT, () => p_leoUI.navigateNavEntry(LeoGotoNavKey.next)],
        // [CMD.GOTO_NAV_FIRST, () => p_leoUI.navigateNavEntry(LeoGotoNavKey.first)],
        // [CMD.GOTO_NAV_LAST, () => p_leoUI.navigateNavEntry(LeoGotoNavKey.last)],

        // [CMD.GOTO_NAV_ENTRY, (p_node: LeoGotoNode) => p_leoUI.gotoNavEntry(p_node)],

        [CMD.START_SEARCH, () => leoUI.command(LEOCMD.START_SEARCH, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.SEARCH_BACKWARD, () => leoUI.command(LEOCMD.SEARCH_BACKWARD, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.RE_SEARCH, () => leoUI.command(LEOCMD.RE_SEARCH, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.RE_SEARCH_BACKWARD, () => leoUI.command(LEOCMD.RE_SEARCH_BACKWARD, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.WORD_SEARCH, () => leoUI.command(LEOCMD.WORD_SEARCH, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.WORD_SEARCH_BACKWARD, () => leoUI.command(LEOCMD.WORD_SEARCH_BACKWARD, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        [CMD.FIND_ALL, () => leoUI.command(LEOCMD.FIND_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.REPLACE_ALL, () => leoUI.command(LEOCMD.REPLACE_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.FIND_NEXT, () => leoUI.find(false, false)],
        [CMD.FIND_PREVIOUS, () => leoUI.find(false, true)],

        [CMD.FIND_DEF, () => leoUI.command(LEOCMD.FIND_DEF, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.REPLACE, () => leoUI.replace(false, false)],
        [CMD.REPLACE_THEN_FIND, () => leoUI.replace(false, true)],

        [CMD.GOTO_GLOBAL_LINE, () => leoUI.command(LEOCMD.GOTO_GLOBAL_LINE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],

        [CMD.TAG_CHILDREN, (p_node?: Position) => leoUI.command(LEOCMD.TAG_CHILDREN, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.NoChange, keepSelection: true })],
        [CMD.TAG_NODE, (p_node?: Position) => leoUI.command(LEOCMD.TAG_NODE, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.NoChange, keepSelection: true })],
        [CMD.REMOVE_TAG, (p_node?: Position) => leoUI.command(LEOCMD.REMOVE_TAG, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.NoChange, keepSelection: true })],
        [CMD.REMOVE_TAGS, (p_node?: Position) => leoUI.command(LEOCMD.REMOVE_ALL_TAGS, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.NoChange, keepSelection: true })],

        [CMD.CLONE_FIND_TAG, () => leoUI.command(LEOCMD.CLONE_FIND_TAG, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.CLONE_FIND_PARENTS, () => leoUI.command(LEOCMD.CLONE_FIND_PARENTS, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.CLONE_FIND_ALL, () => leoUI.command(LEOCMD.CLONE_FIND_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CLONE_FIND_ALL_FLATTENED, () => leoUI.command(LEOCMD.CLONE_FIND_ALL_FLATTENED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CLONE_FIND_MARKED, () => leoUI.command(LEOCMD.CLONE_FIND_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CLONE_FIND_FLATTENED_MARKED, () => leoUI.command(LEOCMD.CLONE_FIND_FLATTENED_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.SET_FIND_EVERYWHERE_OPTION, () => leoUI.command(LEOCMD.SET_FIND_EVERYWHERE_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.SET_FIND_NODE_ONLY_OPTION, () => leoUI.command(LEOCMD.SET_FIND_NODE_ONLY_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.SET_FIND_FILE_ONLY_OPTION, () => leoUI.command(LEOCMD.SET_FIND_FILE_ONLY_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.SET_FIND_SUBOUTLINE_ONLY_OPTION, () => leoUI.command(LEOCMD.SET_FIND_SUBOUTLINE_ONLY_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        [CMD.TOGGLE_FIND_IGNORE_CASE_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_IGNORE_CASE_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.TOGGLE_FIND_MARK_CHANGES_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_MARK_CHANGES_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.TOGGLE_FIND_MARK_FINDS_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_MARK_FINDS_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.TOGGLE_FIND_REGEXP_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_REGEXP_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.TOGGLE_FIND_WORD_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_WORD_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.TOGGLE_FIND_SEARCH_BODY_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_SEARCH_BODY_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.TOGGLE_FIND_SEARCH_HEADLINE_OPTION, () => leoUI.command(LEOCMD.TOGGLE_FIND_SEARCH_HEADLINE_OPTION, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],

        // Edit Commands
        [CMD.BACKWARD_DELETE_CHAR, () => leoUI.command(LEOCMD.BACKWARD_DELETE_CHAR, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CENTER_LINE, () => leoUI.command(LEOCMD.CENTER_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CENTER_REGION, () => leoUI.command(LEOCMD.CENTER_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CAPITALIZE_WORD, () => leoUI.command(LEOCMD.CAPITALIZE_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.DOWNCASE_REGION, () => leoUI.command(LEOCMD.DOWNCASE_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.DOWNCASE_WORD, () => leoUI.command(LEOCMD.DOWNCASE_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.UPCASE_REGION, () => leoUI.command(LEOCMD.UPCASE_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.UPCASE_WORD, () => leoUI.command(LEOCMD.UPCASE_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CONVERT_ALL_BLANKS, () => leoUI.command(LEOCMD.CONVERT_ALL_BLANKS, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CONVERT_ALL_TABS, () => leoUI.command(LEOCMD.CONVERT_ALL_TABS, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CONVERT_BLANKS, () => leoUI.command(LEOCMD.CONVERT_BLANKS, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.CONVERT_TABS, () => leoUI.command(LEOCMD.CONVERT_TABS, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_CLEAR, () => leoUI.command(LEOCMD.RECTANGLE_CLEAR, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_CLOSE, () => leoUI.command(LEOCMD.RECTANGLE_CLOSE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_DELETE, () => leoUI.command(LEOCMD.RECTANGLE_DELETE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_KILL, () => leoUI.command(LEOCMD.RECTANGLE_KILL, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_OPEN, () => leoUI.command(LEOCMD.RECTANGLE_OPEN, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_STRING, () => leoUI.command(LEOCMD.RECTANGLE_STRING, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.RECTANGLE_YANK, () => leoUI.command(LEOCMD.RECTANGLE_YANK, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.ALWAYS_INDENT_REGION, () => leoUI.command(LEOCMD.ALWAYS_INDENT_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.INDENT_RIGIDLY, () => leoUI.command(LEOCMD.INDENT_RIGIDLY, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.INDENT_REGION, () => leoUI.command(LEOCMD.INDENT_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.INDENT_RELATIVE, () => leoUI.command(LEOCMD.INDENT_RELATIVE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.UNINDENT_REGION, () => leoUI.command(LEOCMD.UNINDENT_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_CHAR, () => leoUI.command(LEOCMD.BACK_CHAR, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_PARAGRAPH, () => leoUI.command(LEOCMD.BACK_PARAGRAPH, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_SENTENCE, () => leoUI.command(LEOCMD.BACK_SENTENCE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_WORD, () => leoUI.command(LEOCMD.BACK_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BEGINNING_OF_BUFFER, () => leoUI.command(LEOCMD.BEGINNING_OF_BUFFER, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BEGINNING_OF_LINE, () => leoUI.command(LEOCMD.BEGINNING_OF_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.PREVIOUS_LINE, () => leoUI.command(LEOCMD.PREVIOUS_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_CHAR_EXTEND_SELECTION, () => leoUI.command(LEOCMD.BACK_CHAR_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_PARAGRAPH_EXTEND_SELECTION, () => leoUI.command(LEOCMD.BACK_PARAGRAPH_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_SENTENCE_EXTEND_SELECTION, () => leoUI.command(LEOCMD.BACK_SENTENCE_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BACK_WORD_EXTEND_SELECTION, () => leoUI.command(LEOCMD.BACK_WORD_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BEGINNING_OF_BUFFER_EXTEND_SELECTION, () => leoUI.command(LEOCMD.BEGINNING_OF_BUFFER_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.BEGINNING_OF_LINE_EXTEND_SELECTION, () => leoUI.command(LEOCMD.BEGINNING_OF_LINE_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.PREVIOUS_LINE_EXTEND_SELECTION, () => leoUI.command(LEOCMD.PREVIOUS_LINE_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.EXTEND_TO_LINE, () => leoUI.command(LEOCMD.EXTEND_TO_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.EXTEND_TO_PARAGRAPH, () => leoUI.command(LEOCMD.EXTEND_TO_PARAGRAPH, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.EXTEND_TO_SENTENCE, () => leoUI.command(LEOCMD.EXTEND_TO_SENTENCE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.EXTEND_TO_WORD, () => leoUI.command(LEOCMD.EXTEND_TO_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.END_OF_BUFFER, () => leoUI.command(LEOCMD.END_OF_BUFFER, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.END_OF_LINE, () => leoUI.command(LEOCMD.END_OF_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_CHAR, () => leoUI.command(LEOCMD.FORWARD_CHAR, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_PARAGRAPH, () => leoUI.command(LEOCMD.FORWARD_PARAGRAPH, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_SENTENCE, () => leoUI.command(LEOCMD.FORWARD_SENTENCE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_WORD, () => leoUI.command(LEOCMD.FORWARD_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.NEXT_LINE, () => leoUI.command(LEOCMD.NEXT_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.END_OF_BUFFER_EXTEND_SELECTION, () => leoUI.command(LEOCMD.END_OF_BUFFER_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.END_OF_LINE_EXTEND_SELECTION, () => leoUI.command(LEOCMD.END_OF_LINE_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_CHAR_EXTEND_SELECTION, () => leoUI.command(LEOCMD.FORWARD_CHAR_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_PARAGRAPH_EXTEND_SELECTION, () => leoUI.command(LEOCMD.FORWARD_PARAGRAPH_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_SENTENCE_EXTEND_SELECTION, () => leoUI.command(LEOCMD.FORWARD_SENTENCE_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.FORWARD_WORD_EXTEND_SELECTION, () => leoUI.command(LEOCMD.FORWARD_WORD_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.NEXT_LINE_EXTEND_SELECTION, () => leoUI.command(LEOCMD.NEXT_LINE_EXTEND_SELECTION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.SORT_COLUMNS, () => leoUI.command(LEOCMD.SORT_COLUMNS, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.SORT_LINES, () => leoUI.command(LEOCMD.SORT_LINES, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.KILL_LINE, () => leoUI.command(LEOCMD.KILL_LINE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.KILL_REGION, () => leoUI.command(LEOCMD.KILL_REGION, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.KILL_REGION_SAVE, () => leoUI.command(LEOCMD.KILL_REGION_SAVE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.KILL_SENTENCE, () => leoUI.command(LEOCMD.KILL_SENTENCE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.KILL_WS, () => leoUI.command(LEOCMD.KILL_WS, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.KILL_WORD, () => leoUI.command(LEOCMD.KILL_WORD, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.YANK, () => leoUI.command(LEOCMD.YANK, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],
        [CMD.YANK_POP, () => leoUI.command(LEOCMD.YANK_POP, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Body })],

    ];

    controller.setCommands(commands);

}

