//@+leo-ver=5-thin
//@+node:felix.20251214160853.386: * @file src/commands/editFileCommands.ts
/**
 * Leo's file-editing commands.
 */
//@+<< editFileCommands imports & annotations >>
//@+node:felix.20251214160853.387: ** << editFileCommands imports & annotations >>
import * as difflib from 'difflib';
import * as g from '../core/leoGlobals';
import * as path from 'path';
import { new_cmd_decorator } from '../core/decorators';
import { BaseEditCommandsClass } from './baseCommands';
import { Commands } from '../core/leoCommands';
import { Position, VNode } from '../core/leoNodes';

//@-<< editFileCommands imports & annotations >>

//@+others
//@+node:felix.20251214160853.388: ** editFileCommands.cmd (decorator)
/**
 * Command decorator for the editCommandsClass class.
 */
function cmd(p_name: string, p_doc: string) {
    return new_cmd_decorator(p_name, p_doc, ['c', 'editFileCommands']);
}
//@+node:felix.20251214160853.389: ** class ConvertAtRoot
/**
 * A class to convert @root directives to @clean nodes:
 *
 * - Change @root directive in body to @clean in the headline.
 * - Make clones of section references defined outside of @clean nodes,
 *   moving them so they are children of the nodes that reference them.
 */
export class ConvertAtRoot {
    public errors = 0;
    public root: Position | undefined; // Root of @root tree.
    public root_pat = /^@root\s+(.+)$/gm;
    public section_pat = /\s*<\<(.*)>\>/;
    public units: Position[] = []; // List of positions containing @unit.

    constructor() { }

    //@+others
    //@+node:felix.20251214160853.390: *3* atRoot.check_move
    /**
     * Return False if p or any of p's descendants is a clone of parent
     * or any of parents ancestors.
     */
    public check_clone_move(p_p: Position, parent: Position): boolean {
        // Like as checkMoveWithParentWithWarning without warning.
        const clonedVnodes: { [key: string]: VNode } = {};
        for (const ancestor of parent.self_and_parents(false)) {
            if (ancestor.isCloned()) {
                const v = ancestor.v;
                clonedVnodes[v.gnx] = v;
            }
        }
        if (Object.keys(clonedVnodes).length === 0) {
            return true;
        }
        for (const p of p_p.self_and_subtree(false)) {
            if (p.isCloned() && clonedVnodes[p.v.gnx]) {
                return false;
            }
        }
        return true;
    }
    //@+node:felix.20251214160853.391: *3* atRoot.convert_file
    /**
     * Convert @root to @clean in the the .leo file at the given path.
     */
    public convert_file(c: Commands): void {
        this.find_all_units(c);
        for (const p of c.all_positions()) {
            this.root_pat.lastIndex = 0;
            const m = this.root_pat.exec(p.b);
            const w_path = m && m.length && m[1];
            if (w_path) {
                // Weird special case. Don't change section definition!
                if (this.section_pat.test(p.h)) {
                    console.log(`\nCan not create @clean node: ${p.h}\n`);
                    this.errors += 1;
                } else {
                    this.root = p.copy();
                    p.h = `@clean ${w_path}`;
                }
                this.do_root(p);
                this.root = undefined;
            }
        }
        //
        // Check the results.
        const link_errors = c.checkOutline();
        this.errors += link_errors;
        console.log(
            `${this.errors} error${g.plural(
                this.errors
            )} in ${c.shortFileName()}`
        );
        c.redraw();
        // if not this.errors: this.dump(c)
    }
    //@+node:felix.20251214160853.392: *3* atRoot.dump
    public dump(c: Commands): void {
        console.log(`Dump of ${c.shortFileName()}...`);
        for (const p of c.all_positions()) {
            console.log(' '.repeat(2 * p.level()), p.h);
        }
    }
    //@+node:felix.20251214160853.393: *3* atRoot.do_root
    /**
     * Make all necessary clones for section definitions.
     */
    public do_root(p: Position): void {
        for (const w_p of p.self_and_subtree()) {
            this.make_clones(w_p);
        }
    }
    //@+node:felix.20251214160853.394: *3* atRoot.find_all_units
    /**
     * Scan for all @unit nodes.
     */
    public find_all_units(c: Commands): void {
        for (const p of c.all_positions()) {
            if (p.b.includes('@unit')) {
                this.units.push(p.copy());
            }
        }
    }
    //@+node:felix.20251214160853.395: *3* atRoot.find_section
    /**
     * Find the section definition node in root's subtree for the given section.
     */
    public find_section(
        root: Position,
        section_name: string
    ): Position | undefined {
        const munge = (s: string) => {
            return s.trim().replace(/ /g, '').toLowerCase();
        };

        for (const p of root.subtree()) {
            if (munge(p.h).startsWith(munge(section_name))) {
                return p;
            }
        }

        return undefined;
    }
    //@+node:felix.20251214160853.396: *3* atRoot.make_clones
    /**
     * Make clones for all undefined sections in p.b.
     */
    public make_clones(p: Position): void {
        for (const s of g.splitLines(p.b)) {
            const m = this.section_pat.exec(s);
            if (m && m.length) {
                const section_name = g.angleBrackets(m[1]!.trim());
                const section_p = this.make_clone(p, section_name);
                if (!section_p || !section_p.__bool__()) {
                    console.log(`MISSING: ${section_name} ${p.h}`);
                    this.errors += 1;
                }
            }
        }
    }
    //@+node:felix.20251214160853.397: *3* atRoot.make_clone
    /**
     * Make c clone for section, if necessary.
     */
    public make_clone(p: Position, section_name: string): Position | undefined {
        const clone_and_move = (parent: Position, section_p: Position) => {
            const clone = section_p.clone();
            if (this.check_clone_move(clone, parent)) {
                console.log(`  CLONE: ${section_p.h} parent: ${parent.h}`);
                clone.moveToLastChildOf(parent);
            } else {
                console.log(
                    `Can not clone: ${section_p.h} parent: ${parent.h}`
                );
                clone.doDelete();
                this.errors += 1;
            }
        };
        //
        // First, look in p's subtree.
        const section_p = this.find_section(p, section_name);
        if (section_p && section_p.__bool__()) {
            // g.trace('FOUND', section_name)
            // Already defined in a good place.
            return section_p;
        }
        //
        // Finally, look in the @unit tree.
        for (const unit_p of this.units) {
            const section_p = this.find_section(unit_p, section_name);
            if (section_p && section_p.__bool__()) {
                clone_and_move(p, section_p);
                return section_p;
            }
        }
        return undefined;
    }
    //@-others
}
//@+node:felix.20251214160853.398: ** class CompareTreesController

class CompareTreesController {
    public c: Commands | undefined;

    //@+others
    //@+node:felix.20251214160853.399: *3* ct.compare
    /**
     * Compare dicts d1 and d2.
     */
    public compare(
        d1: { [key: string]: Position },
        d2: { [key: string]: Position },
        root: Position
    ): Position {
        let p: Position;
        let p1: Position;
        let p2: Position;

        for (const h of Object.keys(d1).sort()) {
            [p1, p2] = [d1[h]!, d2[h]!];
            if (d2[h]) {
                const [lines1, lines2] = [
                    g.splitLines(p1.b),
                    g.splitLines(p2.b),
                ];
                // const aList = list(difflib.unified_diff(lines1, lines2, 'vr1', 'vr2'))
                const aList = difflib.unifiedDiff(lines1, lines2, {
                    fromfile: 'vr1',
                    tofile: 'vr2',
                });
                if (aList && aList.length) {
                    p = root.insertAsLastChild();
                    p.h = h;
                    p.b = aList.join('');
                    p1.clone().moveToLastChildOf(p);
                    p2.clone().moveToLastChildOf(p);
                }
            } else if (p1.b.trim()) {
                // Only in p1 tree, and not an organizer node.
                p = root.insertAsLastChild();
                p.h = h + `(${p1.h} only)`;
                p1.clone().moveToLastChildOf(p);
            }
        }
        for (const h of Object.keys(d2).sort()) {
            p2 = d2[h]!;
            if (!d1[h] && p2.b.trim()) {
                // Only in p2 tree, and not an organizer node.
                p = root.insertAsLastChild();
                p.h = h + `(${p2.h} only)`;
                p2.clone().moveToLastChildOf(p);
            }
        }
        return root;
    }
    //@+node:felix.20251214160853.400: *3* ct.run
    /**
     * Main line.
     */
    public run(c: Commands, p1: Position, p2: Position, tag: string): void {
        this.c = c;
        const root = c.p.insertAfter();
        root.h = tag;
        const d1 = this.scan(p1);
        const d2 = this.scan(p2);
        this.compare(d1, d2, root);
        c.p.contract();
        root.expand();
        c.selectPosition(root);
        c.redraw();
    }
    //@+node:felix.20251214160853.401: *3* ct.scan
    /**
     * Create a dict of the methods in p1.
     * Keys are headlines, stripped of prefixes.
     * Values are copies of positions.
     */
    public scan(p1: Position): { [key: string]: Position } {
        const d: { [key: string]: Position } = {};
        for (const p of p1.self_and_subtree(false)) {
            let h = p.h.trim();
            const i = h.indexOf('.');
            if (i > -1) {
                h = h.substring(i + 1).trim();
            }
            if (d[h]) {
                g.es_print('duplicate', p.h);
            } else {
                d[h] = p.copy();
            }
        }
        return d;
    }
    //@-others
}
//@+node:felix.20251214160853.402: ** class EditFileCommandsClass
/**
 * A class to load files into buffers and save buffers to files.
 */
export class EditFileCommandsClass extends BaseEditCommandsClass {
    //@+others
    //@+node:felix.20251214160853.403: *3* efc.convert-at-root
    @cmd(
        'convert-at-root',
        'The convert-at-root command converts @root to @clean throughout the outline.'
    )
    public convert_at_root(): void {
        //@+<< convert-at-root docstring >>
        //@+node:felix.20251214160853.404: *4* << convert-at-root docstring >>
        //@@wrap
        /*
        The convert-at-root command converts @root to @clean throughout the outline.

        This command is not perfect. You will need to adjust the outline by hand if
        the command reports errors. I recommend using git diff to ensure that the
        resulting external files are roughly equivalent after running this command.

        This command attempts to do the following:

        - For each node with an @root <path> directive in the body, change the head to
          @clean <path>. The command does *not* change the headline if the node is
          a section definition node. In that case, the command reports an error.

        - Clones and moves nodes as needed so that section definition nodes appear
          as descendants of nodes containing section references. To find section
          definition nodes, the command looks in all @unit trees. After finding the
          required definition node, the command makes a clone of the node and moves
          the clone so it is the last child of the node containing the section
          references. This move may fail. If so, the command reports an error.
        */
        //@-<< convert-at-root docstring >>
        const c = this.c;
        if (!c) {
            return;
        }
        new ConvertAtRoot().convert_file(c);
    }
    //@+node:felix.20251214160853.405: *3* efc.clean-at-clean commands
    //@+node:felix.20251214160853.406: *4* efc.cleanAtCleanFiles
    @cmd('clean-at-clean-files', 'Adjust whitespace in all @clean files.')
    public cleanAtCleanFiles(): void {
        const c = this.c;
        const undoType = 'clean-at-clean-files';
        c.undoer.beforeChangeGroup(c.p, undoType, true);
        let total = 0;
        for (const p of c.all_unique_positions()) {
            if (p.isAtCleanNode()) {
                let n = 0;
                for (const p2 of p.subtree()) {
                    const bunch2 = c.undoer.beforeChangeNodeContents(p2);
                    if (this.cleanAtCleanNode(p2)) {
                        n += 1;
                        total += 1;
                        c.undoer.afterChangeNodeContents(p2, undoType, bunch2);
                    }
                }
                g.es_print(`${n} node${g.plural(n)} ${p.h}`);
            }
        }

        // Call this only once, at end.
        c.undoer.afterChangeGroup(c.p, undoType);
        if (total === 0) {
            g.es('Command did not find any whitespace to adjust');
        }
        g.es_print(`${total} total node${g.plural(total)}`);
    }
    //@+node:felix.20251214160853.407: *4* efc.cleanAtCleanNode
    /**
     * Adjust whitespace in p, part of an @clean tree.
     */
    public cleanAtCleanNode(p: Position): boolean {
        const s = p.b.trim();
        if (!s || p.h.trim().startsWith('<<')) {
            return false;
        }
        const ws = g.match_word(s, 0, 'class') ? '\n\n' : '\n';
        const s2 = ws + s + ws;
        const changed = s2 !== p.b;
        if (changed) {
            p.b = s2;
            p.setDirty();
        }
        return changed;
    }
    //@+node:felix.20251214160853.408: *4* efc.cleanAtCleanTree
    @cmd(
        'clean-at-clean-tree',
        'Adjust whitespace in the nearest @clean tree,' +
        'searching c.p and its ancestors.'
    )
    public cleanAtCleanTree(): void {
        const c = this.c;
        let w_p: Position | undefined;
        // Look for an @clean node.
        let found = false;
        for (const p of c.p.self_and_parents(false)) {
            w_p = p;
            if (p.isAtCleanNode()) {
                found = true;
                break;
            }
        }
        if (!found) {
            g.es_print('no @clean node found', c.p?.h);
            return;
        }
        // pylint: disable=undefined-loop-variable
        // w_p is certainly defined here.
        // const bunch = c.undoer.beforeChangeTree(w_p!);
        let n = 0;
        // const undoType = 'clean-@clean-tree';
        for (const p2 of w_p!.subtree()) {
            if (this.cleanAtCleanNode(p2,)) {
                n += 1;
            }
        }
        if (n > 0) {
            c.setChanged();
            //c.undoer.afterChangeTree(w_p!, undoType, bunch);
            c.undoer.clearAndWarn('clean-at-clean-tree');
        }
        g.es_print(`${n} node${g.plural(n)} cleaned`);
    }
    //@+node:felix.20251214160853.409: *3* efc.compareAnyTwoFiles & helpers
    @cmd('file-compare-two-leo-files', 'Compare two files.')
    @cmd('compare-two-leo-files', 'Compare two files.')
    public async compareAnyTwoFiles(): Promise<unknown> {
        const c = this.c;
        let c1 = this.c;
        let c2: Commands | undefined = this.c;
        const w = c.frame.body.wrapper;
        const commanders = g.app.commanders();
        if (g.app.diff) {
            if (commanders.length === 2) {
                [c1, c2] = commanders as [Commands, Commands];
                const fn1 =
                    g.shortFileName(c1.wrappedFileName) || c1.shortFileName();
                const fn2 =
                    g.shortFileName(c2.wrappedFileName) || c2.shortFileName();
                g.es('--diff auto compare');
                g.es(fn1);
                g.es(fn2);
            } else {
                g.es('expecting two .leo files');
                return;
            }
        } else {
            // Prompt for the file to be compared with the present outline.
            const filetypes: [string, string][] = [
                ['Leo files', '*.leojs *.leo *.db'],
                ['All files', '*'],
            ];
            const fileName = await g.app.gui.runOpenFileDialog(
                c,
                'Compare Leo Files',
                filetypes,
            );
            if (!fileName) {
                return;
            }
            // Read the file into the hidden commander.
            c2 = await g.createHiddenCommander(fileName);
            if (!c2) {
                return;
            }
        }
        // Compute the inserted, deleted and changed dicts.
        const d1 = this.createFileDict(c1);
        const d2 = this.createFileDict(c2);
        const [inserted, deleted, changed] = this.computeChangeDicts(d1, d2);
        // Create clones of all inserted, deleted and changed dicts.
        this.createAllCompareClones(c1, c2, inserted, deleted, changed);
        // Fix bug 1231656: File-Compare-Leo-Files leaves other file open-count incremented.
        if (!g.app.diff) {
            g.app.forgetOpenFile(c2.fileName());
            c2.frame.destroySelf();
            g.app.gui.set_focus(c, w);
        }
        // The inserted, deleted and changed dicts may come from c2, a differenct Commander.
        c.recreateGnxDict();  // So update c.fileCommands.gnxDict.
        return;
    }
    //@+node:felix.20251214160853.410: *4* efc.computeChangeDicts
    /**
     * Compute inserted, deleted, changed dictionaries.
     *
     * New in Leo 4.11: show the nodes in the *invisible* file, d2, if possible.
     */
    public computeChangeDicts(
        d1: { [key: string]: Position },
        d2: { [key: string]: Position }
    ): [
            { [key: string]: Position },
            { [key: string]: Position },
            { [key: string]: Position }
        ] {
        const inserted: { [key: string]: Position } = {};
        for (const key in d2) {
            // using 'in' for keys !

            if (!d1.hasOwnProperty(key)) {
                inserted[key] = d2[key]!;
            }
        }

        const deleted: { [key: string]: Position } = {};
        for (const key in d1) {
            if (!d2.hasOwnProperty(key)) {
                deleted[key] = d1[key]!;
            }
        }

        const changed: { [key: string]: Position } = {};
        for (const key in d1) {
            if (d2.hasOwnProperty(key)) {
                const p1 = d1[key]!;
                const p2 = d2[key]!;
                if (p1.h !== p2.h || p1.b !== p2.b) {
                    changed[key] = p2; // Show the node in the *other* file.
                }
            }
        }
        return [inserted, deleted, changed];
    }
    //@+node:felix.20251214160853.411: *4* efc.createAllCompareClones & helper
    /**
     * Create the comparison trees.
     */
    public createAllCompareClones(
        c1: Commands,
        c2: Commands,
        inserted: { [key: string]: Position },
        deleted: { [key: string]: Position },
        changed: { [key: string]: Position }
    ): void {
        const c = this.c; // Always use the visible commander
        g.assert(c === c1);
        // Create parent node at the start of the outline.
        const [u, undoType] = [c.undoer, 'Compare Two Files'];
        u.beforeChangeGroup(c.p, undoType);
        const undoData = u.beforeInsertNode(c.p);
        const parent = c.p.insertAfter();
        parent.setHeadString(undoType);
        u.afterInsertNode(parent, undoType, undoData);
        // Use the wrapped file name if possible.
        const fn1 = g.shortFileName(c1.wrappedFileName) || c1.shortFileName();
        const fn2 = g.shortFileName(c2.wrappedFileName) || c2.shortFileName();
        const table: [{ [key: string]: Position }, string][] = [
            [deleted, `not in ${fn2}`],
            [inserted, `not in ${fn1}`],
            [changed, `changed: as in ${fn2}`],
        ];
        for (const [d, kind] of table) {
            this.createCompareClones(d, kind, parent);
        }
        c.selectPosition(parent);
        u.afterChangeGroup(parent, undoType);
        c.redraw();
    }
    //@+node:felix.20251214160853.412: *5* efc.createCompareClones
    public createCompareClones(
        d: { [key: string]: Position },
        kind: string,
        parent: Position
    ): void {
        if (d && Object.keys(d).length) {
            const c = this.c; // Use the visible commander.
            parent = parent.insertAsLastChild();
            parent.setHeadString(kind);
            for (const key in d) {
                const p = d[key]!;
                if (!(kind.endsWith('.leo') || kind.endsWith('.leojs')) && p.isAnyAtFileNode()) {
                    // Don't make clones of @<file> nodes for wrapped files.
                    // pass
                } else if (p.v.context === c) {
                    const clone = p.clone();
                    clone.moveToLastChildOf(parent);
                } else {
                    // Fix bug 1160660: File-Compare-Leo-Files creates "other file" clones.
                    const copy = p.copyTreeAfter();
                    copy.moveToLastChildOf(parent);
                    for (const p2 of copy.self_and_subtree(false)) {
                        p2.v.context = c;
                    }
                }
            }
        }
    }
    //@+node:felix.20251214160853.413: *4* efc.createFileDict
    /**
     * Create a dictionary of all relevant positions in commander c.
     */
    public createFileDict(c: Commands): { [key: string]: Position } {
        const d: { [key: string]: Position } = {};
        for (const p of c.all_positions()) {
            d[p.v.fileIndex] = p.copy();
        }
        return d;
    }
    //@+node:felix.20251214160853.414: *4* efc.dumpCompareNodes
    public dumpCompareNodes(
        fileName1: string,
        fileName2: string,
        inserted: { [key: string]: Position },
        deleted: { [key: string]: Position },
        changed: { [key: string]: Position }
    ): void {
        const table: [{ [key: string]: Position }, string][] = [
            [inserted, `inserted (only in ${fileName1})`],
            [deleted, `deleted  (only in ${fileName2})`],
            [changed, 'changed'],
        ];
        for (const [d, kind] of table) {
            g.pr('\n', kind);
            for (const key in d) {
                const p = d[key]!;
                g.pr(`${key} ${p.h}`);
            }
        }
    }
    //@+node:felix.20251214160853.415: *3* efc.compareTrees
    public compareTrees(p1: Position, p2: Position, tag: string): void {
        new CompareTreesController().run(this.c, p1, p2, tag);
    }
    //@+node:felix.20251214160853.416: *3* efc.deleteFile
    @cmd('file-delete', 'Prompt for the name of a file and delete it.')
    public async deleteFile(): Promise<void> {
        const w_dir = this.c.fileName() ? g.os_path_dirname(this.c.fileName()) : g.workspaceUri?.fsPath;
        const w_value = w_dir + path.sep;
        const fileName = await g.app.gui.get1Arg({
            title: 'Delete File',
            prompt: 'Choose file to delete',
            placeHolder: 'File Path',
            value: w_value,
            valueSelection: [w_value.length, w_value.length]
        });
        if (!fileName) {
            return;
        }
        try {
            await g.os_remove(fileName);
            void g.setStatusLabel(`Deleted: ${fileName}`);
        } catch (e) {
            void g.setStatusLabel(`Not Deleted: ${fileName}`);
        }
    }
    //@+node:felix.20251214160853.417: *3* efc.diff (file-diff-files)
    @cmd(
        'file-diff-files',
        'Creates a node and puts the diff between 2 files into it.'
    )
    public async diff(): Promise<void> {
        const c = this.c;
        const u = this.c.undoer;
        const fn = await this.getReadableTextFile();
        if (!fn) {
            return;
        }
        const fn2 = await this.getReadableTextFile();
        if (!fn2) {
            return;
        }
        const [s1, e1] = await g.readFileIntoString(fn);
        if (s1 == null) {
            return;
        }
        const [s2, e2] = await g.readFileIntoString(fn2);
        if (s2 == null) {
            return;
        }
        const [lines1, lines2] = [g.splitLines(s1), g.splitLines(s2)];
        const aList = difflib.ndiff(lines1, lines2);
        // add as last top level like other 'diff' result nodes
        c.selectPosition(c.lastTopLevel()); // pre-select to help undo-insert
        const undoData = u.beforeInsertNode(c.p); // c.p is subject of 'insertAfter'
        const p = c.p.insertAfter();
        p.h = 'diff';
        p.b = aList.join('');
        u.afterInsertNode(p, 'file-diff-files', undoData);
        c.redraw();
    }
    //@+node:felix.20251214160853.418: *3* efc.getReadableTextFile
    /**
     * Prompt for a text file.
     */
    public async getReadableTextFile(): Promise<string> {
        const c = this.c;
        const fn = await g.app.gui.runOpenFileDialog(
            c,
            'Open Text File',
            [
                ['Text', '*.txt'],
                ['All files', '*'],
            ],
        );
        return fn;
    }
    //@+node:felix.20251214160853.421: *3* efc.insertFile
    @cmd(
        'file-insert',
        'Prompt for the name of a file. Insert the file\'s contents in the body at the insertion point.'
    )
    public async insertFile(): Promise<void> {
        const w = this.editWidget();
        if (!w) {
            return;
        }
        const fn = await this.getReadableTextFile();
        if (!fn) {
            return;
        }
        const [s, e] = await g.readFileIntoString(fn);
        if (s) {
            this.beginCommand(w, 'insert-file');
            const i = w.getInsertPoint();
            w.insert(i, s);
            w.seeInsertPoint();
            this.endCommand(undefined, true, true);
        }
    }
    //@+node:felix.20251214160853.422: *3* efc.makeDirectory
    @cmd('directory-make', 'Prompt for the name of a directory and create it.')
    public async makeDirectory(): Promise<void> {
        const w_dir = this.c.fileName() ? g.os_path_dirname(this.c.fileName()) : g.workspaceUri?.fsPath;
        const w_value = w_dir + path.sep;
        const folderName = await g.app.gui.get1Arg({
            title: 'Make Directory',
            prompt: 'Directory to create',
            placeHolder: 'Folder Path',
            value: w_value,
            valueSelection: [w_value.length, w_value.length]
        });
        if (!folderName) {
            return;
        }
        try {
            await g.mkdir(folderName);
            void g.setStatusLabel(`Created: ${folderName}`);
        } catch (e) {
            void g.setStatusLabel(`Not Created: ${folderName}`);
        }
    }
    //@+node:felix.20251214160853.423: *3* efc.openOutlineByName
    @cmd(
        'file-open-by-name',
        'file-open-by-name: Prompt for the name of a Leo outline and open it.'
    )
    public async openOutlineByName(): Promise<void> {
        const w_dir = this.c.fileName() ? g.os_path_dirname(this.c.fileName()) : g.workspaceUri?.fsPath;
        const w_value = w_dir + path.sep;
        const fn = await g.app.gui.get1Arg({
            title: 'Open Leo Outline',
            prompt: 'Choose file to open',
            placeHolder: 'File Path',
            value: w_value,
            valueSelection: [w_value.length, w_value.length]
        });
        if (!fn) {
            return;
        }
        const c = this.c;
        const w_exists = await g.os_path_exists(fn);
        const w_isDir = await g.os_path_isdir(fn);
        if (fn && w_exists && !w_isDir) {
            const c2 = await g.openWithFileName(fn, c);
            if (c2) {
                c2.treeWantsFocusNow();
            }
        } else {
            g.es(`ignoring: ${fn}`);
        }
    }
    //@+node:felix.20251214160853.424: *3* efc.removeDirectory
    @cmd(
        'directory-remove',
        'Prompt for the name of a directory and delete it.'
    )
    public async removeDirectory(): Promise<void> {
        const w_dir = this.c.fileName() ? g.os_path_dirname(this.c.fileName()) : g.workspaceUri?.fsPath;
        const w_value = w_dir + path.sep;
        const folderName = await g.app.gui.get1Arg({
            title: 'Remove Directory',
            prompt: 'Directory to delete',
            placeHolder: 'Folder Path',
            value: w_value,
            valueSelection: [w_value.length, w_value.length]
        });
        if (!folderName) {
            return;
        }
        try {
            await g.rmdir(folderName);
            void g.setStatusLabel(`Removed: ${folderName}`);
        } catch (e) {
            void g.setStatusLabel(`Not Removed: ${folderName}`);
        }
    }
    //@+node:felix.20251214160853.425: *3* efc.saveFile (save-file-by-name)
    @cmd(
        'file-save-by-name',
        'Prompt for the name of a file and put the body text of the selected node into it..'
    )
    @cmd(
        'save-file-by-name',
        'Prompt for the name of a file and put the body text of the selected node into it..'
    )
    public async saveFile(): Promise<void> {
        const c = this.c;
        const w = this.editWidget();
        if (!w) {
            return;
        }
        const fileName = (await g.app.gui.runSaveFileDialog(
            c,
            'save-file',
            [
                ['Text', '*.txt'],
                ['All files', '*'],
            ],
        )) as string;
        if (fileName) {
            try {
                const s = w.getAllText();
                await g.writeFile(s, 'utf-8', fileName);
                // with open(fileName, 'w') as f:
                //     f.write(s)
            } catch (IOError) {
                g.es('can not create', fileName);
            }
        }
    }
    //@+node:felix.20251214160853.426: *3* efc.toggleAtAutoAtEdit & helpers
    @cmd(
        'toggle-at-auto-at-edit',
        'Toggle between @auto and @edit, preserving insert point, etc.'
    )
    public async toggleAtAutoAtEdit(): Promise<void> {
        const p = this.c.p;
        if (p.isAtEditNode()) {
            await this.toAtAuto(p);
            return;
        }
        for (const w_p of p.self_and_parents()) {
            if (w_p.isAtAutoNode()) {
                await this.toAtEdit(w_p);
                return;
            }
        }
        g.es_print('Not in an @auto or @edit tree.');
    }
    //@+node:felix.20251214160853.427: *4* efc.toAtAuto
    /**
     * Convert p from @edit to @auto.
     */
    public async toAtAuto(p: Position): Promise<void> {
        const c = this.c;
        // Change the headline.
        p.h = '@auto' + p.h.substring(5);
        await c.refreshFromDisk(p);
        c.bodyWantsFocus();
    }
    //@+node:felix.20251214160853.428: *4* efc.toAtEdit
    /**
     * Convert p from @auto to @edit.
     */
    public async toAtEdit(p: Position): Promise<void> {
        const c = this.c;
        p.h = '@edit' + p.h.substring(5);
        await c.refreshFromDisk(p);
        c.bodyWantsFocus();
    }
    //@-others
}
//@-others
//@@language typescript
//@-leo
