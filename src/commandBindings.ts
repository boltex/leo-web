import { Constants } from "./constants";
import { Position } from "./core/leoNodes";
import { LeoController } from "./LeoController";
import { LeoUI } from "./leoUI";
import { Focus, ReqRefresh } from "./types";
import { Uri } from "./workspace";

/**
 * * Make all command/key bindings 
 */
export function makeAllBindings(leoUI: LeoUI, controller: LeoController): void {
    // Shortcut pointers for readability
    const U = undefined;
    const CMD = Constants.COMMANDS;
    const LEOCMD = Constants.LEO_COMMANDS;

    const NO_REFRESH: ReqRefresh = {};
    const REFRESH_NODE_BODY: ReqRefresh = {
        node: true, // Reveal the returned 'selected position' without changes to the tree
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

    // TODO : Uncomment those as they are implemented in leoUI :)

    const commands: [string, (...args: any[]) => any][] = [

        [CMD.SHOW_WELCOME, () => leoUI.showSettings()],
        [CMD.SHOW_SETTINGS, () => leoUI.showSettings()],
        // [CMD.SHOW_OUTLINE, () => p_leoUI.showOutline(true)], // Also focuses on outline
        [CMD.SHOW_LOG, () => leoUI.showLogPane()],
        // [CMD.SHOW_BODY, () => p_leoUI.showBody(false, undefined)], // Also focuses on body
        [CMD.EXECUTE, () => leoUI.command(LEOCMD.EXECUTE_SCRIPT, { refreshType: REFRESH_ALL, finalFocus: Focus.NoChange })],

        // [CMD.SHORT_GNX_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("shortGnx")], // Not referenced in package.json
        // [CMD.FULL_GNX_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("fullGnx")], // Not referenced in package.json
        // [CMD.SHORT_LEGACY_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("shortLegacy")], // Not referenced in package.json
        // [CMD.FULL_LEGACY_UNL_TO_CLIPBOARD, () => p_leoUI.unlToClipboard("fullLegacy")], // Not referenced in package.json

        // [CMD.STATUS_BAR, () => p_leoUI.statusBar()], // Not referenced in package.json
        [CMD.MINIBUFFER, () => leoUI.minibuffer()], // Is referenced in package.json
        [CMD.SET_LEO_ID, () => leoUI.setLeoIDCommand()],
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
        [CMD.SAVE_FILE_FO, () => leoUI.saveLeoFile(true)],

        [CMD.SWITCH_FILE, () => leoUI.switchLeoFile()],
        [CMD.RECENT_FILES, () => leoUI.showRecentLeoFiles()],

        [CMD.WRITE_AT_FILE_NODES, () => leoUI.command(LEOCMD.WRITE_AT_FILE_NODES, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.WRITE_AT_FILE_NODES_FO, () => leoUI.command(LEOCMD.WRITE_AT_FILE_NODES, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],
        [CMD.WRITE_DIRTY_AT_FILE_NODES, () => leoUI.command(LEOCMD.WRITE_DIRTY_AT_FILE_NODES, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.WRITE_DIRTY_AT_FILE_NODES_FO, () => leoUI.command(LEOCMD.WRITE_DIRTY_AT_FILE_NODES, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.SET_OPENED_FILE, (p_index: number) => leoUI.selectOpenedLeoDocument(p_index)],

        [CMD.REFRESH_FROM_DISK, (p_node: Position) => leoUI.command(LEOCMD.REFRESH_FROM_DISK, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.REFRESH_FROM_DISK_SELECTION, () => leoUI.command(LEOCMD.REFRESH_FROM_DISK, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.REFRESH_FROM_DISK_SELECTION_FO, () => leoUI.command(LEOCMD.REFRESH_FROM_DISK, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

        [CMD.OPEN_AT_LEO_FILE, (p_node: Position) => leoUI.command(LEOCMD.OPEN_AT_LEO_FILE, { node: p_node, refreshType: REFRESH_ALL, finalFocus: Focus.Outline })], // DO NOT KEEP SELECTION
        [CMD.OPEN_AT_LEO_FILE_SELECTION, () => leoUI.command(LEOCMD.OPEN_AT_LEO_FILE, { refreshType: REFRESH_ALL, finalFocus: Focus.Body })],
        [CMD.OPEN_AT_LEO_FILE_SELECTION_FO, () => leoUI.command(LEOCMD.OPEN_AT_LEO_FILE, { refreshType: REFRESH_ALL, finalFocus: Focus.Outline })],

        [CMD.GIT_DIFF, () => leoUI.command(LEOCMD.GIT_DIFF, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],

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

        [CMD.HEADLINE, (p_node: Position) => leoUI.editHeadline(p_node, true)],
        [CMD.HEADLINE_SELECTION, () => leoUI.editHeadline(U, false)],
        [CMD.HEADLINE_SELECTION_FO, () => leoUI.editHeadline(U, true)],

        // cut/copy/paste/delete given node.
        [CMD.COPY, (p_node: Position) => leoUI.command(LEOCMD.COPY_PNODE, { node: p_node, refreshType: NO_REFRESH, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.CUT, (p_node: Position) => leoUI.command(LEOCMD.CUT_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.DELETE, (p_node: Position) => leoUI.command(LEOCMD.DELETE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.PASTE, (p_node: Position) => leoUI.command(LEOCMD.PASTE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.PASTE_CLONE, (p_node: Position) => leoUI.command(LEOCMD.PASTE_CLONE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],

        // cut/copy/paste/delete current selection (self.commander.p)
        [CMD.COPY_SELECTION, () => leoUI.command(LEOCMD.COPY_PNODE, { refreshType: NO_REFRESH, finalFocus: Focus.NoChange })],
        [CMD.CUT_SELECTION, () => leoUI.command(LEOCMD.CUT_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.CUT_SELECTION_FO, () => leoUI.command(LEOCMD.CUT_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.DELETE_SELECTION, () => leoUI.command(LEOCMD.DELETE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.DELETE_SELECTION_FO, () => leoUI.command(LEOCMD.DELETE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.PASTE_AS_TEMPLATE, () => leoUI.command(LEOCMD.PASTE_AS_TEMPLATE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.PASTE_CLONE_SELECTION, () => leoUI.command(LEOCMD.PASTE_CLONE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.PASTE_CLONE_SELECTION_FO, () => leoUI.command(LEOCMD.PASTE_CLONE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.PASTE_SELECTION, () => leoUI.command(LEOCMD.PASTE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.PASTE_SELECTION_FO, () => leoUI.command(LEOCMD.PASTE_PNODE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

        [CMD.SET_UA, () => leoUI.command(LEOCMD.SET_UA, { refreshType: REFRESH_TREE, finalFocus: Focus.NoChange })],

        // Called by nodes in the tree when selected either by mouse, or with enter
        [CMD.SELECT_NODE, (p_outlineNode: any) => leoUI.selectTreeNode(p_outlineNode.position, false)], // Select is NOT a Position! TODO : FIX THIS TYPE ISSUE
        // [CMD.OPEN_ASIDE, (p_position?: Position) => p_leoUI.openAside(p_position)],

        [CMD.CONTRACT_ALL, () => leoUI.command(LEOCMD.CONTRACT_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.CONTRACT_ALL_FO, () => leoUI.command(LEOCMD.CONTRACT_ALL, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

        [CMD.CONTRACT_OR_GO_LEFT, () => leoUI.command(LEOCMD.CONTRACT_OR_GO_LEFT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.EXPAND_AND_GO_RIGHT, () => leoUI.command(LEOCMD.EXPAND_AND_GO_RIGHT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.GOTO_NEXT_CLONE, (p_node: Position) => leoUI.command(LEOCMD.GOTO_NEXT_CLONE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_CLONE_SELECTION, () => leoUI.command(LEOCMD.GOTO_NEXT_CLONE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body, isNavigation: true })],
        [CMD.GOTO_NEXT_CLONE_SELECTION_FO, () => leoUI.command(LEOCMD.GOTO_NEXT_CLONE, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.GOTO_NEXT_MARKED, () => leoUI.command(LEOCMD.GOTO_NEXT_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_FIRST_SIBLING, () => leoUI.command(LEOCMD.GOTO_FIRST_SIBLING, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_LAST_SIBLING, () => leoUI.command(LEOCMD.GOTO_LAST_SIBLING, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_FIRST_VISIBLE, () => leoUI.command(LEOCMD.GOTO_FIRST_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_LAST_VISIBLE, () => leoUI.command(LEOCMD.GOTO_LAST_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_NEXT_VISIBLE, () => leoUI.command(LEOCMD.GOTO_NEXT_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.GOTO_PREV_VISIBLE, () => leoUI.command(LEOCMD.GOTO_PREV_VISIBLE, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.PAGE_UP, () => leoUI.command(LEOCMD.PAGE_UP, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],
        [CMD.PAGE_DOWN, () => leoUI.command(LEOCMD.PAGE_DOWN, { refreshType: REFRESH_NODE_BODY, finalFocus: Focus.Outline, isNavigation: true })],

        [CMD.DEHOIST, () => leoUI.command(LEOCMD.DEHOIST, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.DEHOIST_FO, () => leoUI.command(LEOCMD.DEHOIST, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.HOIST, (p_node: Position) => leoUI.command(LEOCMD.HOIST_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.HOIST_SELECTION, () => leoUI.command(LEOCMD.HOIST_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.HOIST_SELECTION_FO, () => leoUI.command(LEOCMD.HOIST_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.CHAPTER_NEXT, () => leoUI.command(LEOCMD.CHAPTER_NEXT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.CHAPTER_BACK, () => leoUI.command(LEOCMD.CHAPTER_BACK, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.CHAPTER_MAIN, () => leoUI.command(LEOCMD.CHAPTER_MAIN, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],
        [CMD.CHAPTER_SELECT, () => leoUI.command(LEOCMD.CHAPTER_SELECT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.INSERT, (p_node: Position) => leoUI.insertNode(p_node, true, false)],
        [CMD.INSERT_SELECTION, () => leoUI.insertNode(U, false, false)],
        [CMD.INSERT_SELECTION_FO, () => leoUI.insertNode(U, true, false)],

        [CMD.INSERT_CHILD, (p_node: Position) => leoUI.insertNode(p_node, true, true)],
        [CMD.INSERT_CHILD_SELECTION, () => leoUI.insertNode(U, false, true)],
        [CMD.INSERT_CHILD_SELECTION_FO, () => leoUI.insertNode(U, true, true)],

        [CMD.CLONE, (p_node: Position) => leoUI.command(LEOCMD.CLONE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.CLONE_SELECTION, () => leoUI.command(LEOCMD.CLONE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.CLONE_SELECTION_FO, () => leoUI.command(LEOCMD.CLONE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.PROMOTE, (p_node: Position) => leoUI.command(LEOCMD.PROMOTE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.PROMOTE_SELECTION, () => leoUI.command(LEOCMD.PROMOTE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.PROMOTE_SELECTION_FO, () => leoUI.command(LEOCMD.PROMOTE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.DEMOTE, (p_node: Position) => leoUI.command(LEOCMD.DEMOTE_PNODE, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.DEMOTE_SELECTION, () => leoUI.command(LEOCMD.DEMOTE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.DEMOTE_SELECTION_FO, () => leoUI.command(LEOCMD.DEMOTE_PNODE, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.SORT_CHILDREN, () => leoUI.command(LEOCMD.SORT_CHILDREN, { refreshType: REFRESH_TREE, finalFocus: Focus.Body, keepSelection: true })],
        [CMD.SORT_SIBLING, () => leoUI.command(LEOCMD.SORT_SIBLINGS, { refreshType: REFRESH_TREE, finalFocus: Focus.Body, keepSelection: true })],
        [CMD.SORT_SIBLING_FO, () => leoUI.command(LEOCMD.SORT_SIBLINGS, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline, keepSelection: true })],

        [CMD.MARK, (p_node: Position) => leoUI.command(LEOCMD.TOGGLE_MARK, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MARK_SELECTION, () => leoUI.command(LEOCMD.TOGGLE_MARK, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.MARK_SELECTION_FO, () => leoUI.command(LEOCMD.TOGGLE_MARK, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],
        [CMD.UNMARK, (p_node: Position) => leoUI.command(LEOCMD.TOGGLE_MARK, { node: p_node, refreshType: REFRESH_TREE, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.UNMARK_SELECTION, () => leoUI.command(LEOCMD.TOGGLE_MARK, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.UNMARK_SELECTION_FO, () => leoUI.command(LEOCMD.TOGGLE_MARK, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],
        [CMD.UNMARK_ALL, () => leoUI.command(LEOCMD.UNMARK_ALL, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.EXTRACT, () => leoUI.command(LEOCMD.EXTRACT, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.EXTRACT_NAMES, () => leoUI.command(LEOCMD.EXTRACT_NAMES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],

        [CMD.MOVE_DOWN, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_DOWN, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_DOWN_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_DOWN, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.MOVE_DOWN_SELECTION_FO, () => leoUI.command(LEOCMD.MOVE_PNODE_DOWN, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.MOVE_LEFT, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_LEFT, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_LEFT_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_LEFT, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.MOVE_LEFT_SELECTION_FO, () => leoUI.command(LEOCMD.MOVE_PNODE_LEFT, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.MOVE_RIGHT, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_RIGHT, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_RIGHT_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_RIGHT, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.MOVE_RIGHT_SELECTION_FO, () => leoUI.command(LEOCMD.MOVE_PNODE_RIGHT, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.MOVE_UP, (p_node: Position) => leoUI.command(LEOCMD.MOVE_PNODE_UP, { node: p_node, refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline, keepSelection: true })],
        [CMD.MOVE_UP_SELECTION, () => leoUI.command(LEOCMD.MOVE_PNODE_UP, { refreshType: REFRESH_TREE, finalFocus: Focus.Body })],
        [CMD.MOVE_UP_SELECTION_FO, () => leoUI.command(LEOCMD.MOVE_PNODE_UP, { refreshType: REFRESH_TREE, finalFocus: Focus.Outline })],

        [CMD.REDO, () => leoUI.command(LEOCMD.REDO, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.REDO_FO, () => leoUI.command(LEOCMD.REDO, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.UNDO, () => leoUI.command(LEOCMD.UNDO, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.UNDO_FO, () => leoUI.command(LEOCMD.UNDO, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

        // [CMD.REVERT_TO_UNDO, (p_undo: LeoUndoNode) => p_leoUI.revertToUndo(p_undo)],

        [CMD.COPY_MARKED, () => leoUI.command(LEOCMD.COPY_MARKED, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.DIFF_MARKED_NODES, () => leoUI.command(LEOCMD.DIFF_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.MARK_CHANGED_ITEMS, () => leoUI.command(LEOCMD.MARK_CHANGED_ITEMS, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.MARK_SUBHEADS, () => leoUI.command(LEOCMD.MARK_SUBHEADS, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.CLONE_MARKED_NODES, () => leoUI.command(LEOCMD.CLONE_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.DELETE_MARKED_NODES, () => leoUI.command(LEOCMD.DELETE_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],
        [CMD.MOVE_MARKED_NODES, () => leoUI.command(LEOCMD.MOVE_MARKED_NODES, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

        [CMD.PREV_NODE, () => leoUI.command(LEOCMD.GOTO_PREV_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.PREV_NODE_FO, () => leoUI.command(LEOCMD.GOTO_PREV_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

        [CMD.NEXT_NODE, () => leoUI.command(LEOCMD.GOTO_NEXT_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Body })],
        [CMD.NEXT_NODE_FO, () => leoUI.command(LEOCMD.GOTO_NEXT_HISTORY, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.Outline })],

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
        [CMD.FIND_NEXT_FO, () => leoUI.find(true, false)],
        [CMD.FIND_PREVIOUS, () => leoUI.find(false, true)],
        [CMD.FIND_PREVIOUS_FO, () => leoUI.find(true, true)],

        [CMD.FIND_DEF, () => leoUI.command(LEOCMD.FIND_DEF, { refreshType: REFRESH_TREE_BODY, finalFocus: Focus.NoChange })],

        [CMD.REPLACE, () => leoUI.replace(false, false)],
        [CMD.REPLACE_FO, () => leoUI.replace(true, false)],
        [CMD.REPLACE_THEN_FIND, () => leoUI.replace(false, true)],
        [CMD.REPLACE_THEN_FIND_FO, () => leoUI.replace(true, true)],

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

        [CMD.SET_BODY_WRAP_SETTINGS, () => leoUI.config.setBodyWrap()],
        [CMD.SET_ENABLE_PREVIEW, () => leoUI.config.setEnablePreview()],
        [CMD.CLEAR_CLOSE_EMPTY_GROUPS, () => leoUI.config.clearCloseEmptyGroups()],

    ];

    controller.setCommands(commands);

}

