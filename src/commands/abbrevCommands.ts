//@+leo-ver=5-thin
//@+node:felix.20260411212425.1: * @file src/commands/abbrevCommands.ts
/**
 * Leo's abbreviations commands.
 */

//@+<< abbrevCommands imports & abbreviations >>
//@+node:felix.20260411212747.1: ** << abbrevCommands imports & abbreviations >>
import * as g from '../core/leoGlobals';
import { new_cmd_decorator } from '../core/decorators';
import { BaseEditCommandsClass } from './baseCommands';
import { Commands } from '../core/leoCommands';
import { Position, VNode } from '../core/leoNodes';
import { StringTextWrapper } from '../core/leoFrame';
import * as path from 'path';
import * as os from 'os';
import * as et from 'elementtree';
import * as difflib from 'difflib';
import * as csv from 'csvtojson';
import KSUID from 'ksuid';
import * as typescript from 'typescript';

//@-<< abbrevCommands imports & abbreviations >>

/**
 * Command decorator for the abbrevCommandsClass class. 
 */
function cmd(p_name: string, p_doc: string) {
    return new_cmd_decorator(p_name, p_doc, ['c', 'abbrevCommands']);
}

//@+others
//@+node:felix.20260518221202.1: ** class AbbrevCommands
/**
 * A class to handle user-defined abbreviations.
 * See apropos-abbreviations for details.
 */
export class AbbrevCommandsClass extends BaseEditCommandsClass {

    public abbrevs: Record<string, string>; // Keys are names, values are abbreviations.
    public dyna_regex: RegExp
    public in_head: boolean;
    public number_regex: RegExp
    public scripting_enabled: boolean;
    public globalDynamicAbbrevs: boolean; // Whether dynamic abbrevivs are global or local.
    public expanding: boolean; // True: expanding abbreviations.
    public subst_env: string[] = []; // The environment for all substitutions. May be augmented in init_env.
    public tree_abbrevs_d: Record<string, string>  // Keys are names, values are (tree,tag).

    //@+others
    //@+node:felix.20260518221202.3: *3* abbrev.__init__
    /**
     * Ctor for AbbrevCommandsClass class.
     */
    constructor(c: Commands) {
        super(c); // Call the parent class constructor

        this.c = c;
        // Set local ivars.
        this.abbrevs = {};  // Keys are names, values are (abbrev,tag).
        this.dyna_regex = /[a-zA-Z0-9_-]+/g; // For dynamic abbreviations
        this.in_head = false;
        this.number_regex = /(?<!\\)\\n/g; // to replace \\n but not \\\\n
        this.scripting_enabled = false;  // Global setting.
        this.expanding = false;  // True: expanding abbreviations.
        this.subst_env = [];  // The scripting environment.
        this.tree_abbrevs_d = {};  // Keys are names, values are (tree,tag).
        this.w = null;
        this.globalDynamicAbbrevs = false;  // Whether dynamic abbrevs are global or local.

    }

    //@+node:felix.20260518221202.4: *3* abbrev.expandAbbrev & helpers (entry point)
    /**
     * Not a command.  Expand abbreviations..
     *
     * Return True if the abbreviation was expanded.
     */
    public expandAbbrev(event: any, stroke: KeyboardEvent): false | Promise<boolean> {

        // Define ins, prefixes, self.in_head and self.w
        // Return if there is nothing to do.
        //@+<< expandAbbrev: prolog >>
        //@+node:felix.20260518221202.5: *4* << expandAbbrev: prolog >>

        const ch = this.get_ch(event, stroke);
        const w = this.editWidget(false);

        if (
            this.expanding ||
            !g.isTextWrapper(w) ||
            w.hasSelection() ||
            !ch.trim()
        ) {
            return false;
        }

        const w_name = g.app.gui.widget_name(w);

        if (!w_name.startsWith('body') && !w_name.startsWith('head')) {
            return false;
        }

        // LEO-WEB: get all text and insertion point directly from the dom.
        const inHeadline = !!g.workspace.outline.headlineFinish;
        let s;
        let ins;
        if (inHeadline) {
            s = g.workspace.outline.HEADLINE_INPUT.value;
            ins = g.workspace.outline.HEADLINE_INPUT.selectionStart || 0;
        } else {
            s = g.workspace.body.getBody();
            ins = g.workspace.body.getBodyInsertOffset();
        }
        if (!s) {
            return false;
        }

        const prefixes = this.get_prefixes(ins, s);

        if (!prefixes || !prefixes.length) {
            return false;
        }

        // Set local ivars.
        this.in_head = w_name.startsWith('head');
        this.w = w;

        if (inHeadline === this.in_head) {
            // 
        } else {
            console.warn('in_head may be incorrectly set to', this.in_head, 'based on widget name', w_name);
        }

        //@-<< expandAbbrev: prolog >>

        // Try to match an abbreviation.
        for (const prefix of prefixes) {
            const word = prefix + ch;
            const i = ins - prefix.length;

            const tree_expansion = this.tree_abbrevs_d[word];
            if (tree_expansion) {
                // Ok there really is an abbreviation to expand.
                g.app.gui.triggerBodySave();
                this.expand_tree(i, ins, word, tree_expansion);
                return this.make_all_scripting_substitutions(word).then(() => {
                    return this.init_place_holder_search(false);
                }).then(() => {
                    return true;
                });
            }

            const expansion = this.abbrevs[word];
            if (expansion) {
                // Ok there really is an abbreviation to expand.
                g.app.gui.triggerBodySave();
                this.replace_selection(i, ins, expansion);
                return this.make_script_substitutions(word).then(() => {
                    return this.init_place_holder_search(true);
                }).then(() => {
                    return true;
                });
            }
        }

        return false;

    }

    //@+node:felix.20260518221202.6: *4* abbrev: startup
    //@+node:felix.20260518221202.7: *5* abbrev.get_ch
    /**
     * Get the ch from the stroke.
     */
    public get_ch(event: any, stroke: KeyboardEvent): string {
        let ch: string = g.checkUnicode(event ? event.char : '');
        if (stroke.key === 'Backspace' || stroke.key === 'Delete') {
            return '';
        }
        const d: Record<string, string> = {
            'Enter': '\n',
            'Tab': '\t',
            ' ': ' ',
            'Space': ' ',
            'Underscore': '_',
        };
        if (stroke.key) {
            ch = d[stroke.key] || stroke.key;
            if (ch.length > 1) {
                if (stroke.ctrlKey || stroke.altKey || stroke.metaKey) {
                    ch = '';
                } else {
                    ch = event ? event.char : '';
                }
            }
        }
        return ch;
    }
    //@+node:felix.20260518221202.8: *5* abbrev.get_prefixes
    /**
     * Return the prefixes at given insert point.
     *
     * Any sequence longer than 1 may abbreviation.
     *
     * Any whitespace stops the search.
     */
    public get_prefixes(ins: number, s: string): string[] {

        let i = ins - 1;
        const prefixes: string[] = [];
        while (i >= 0 && !' \t\n'.includes(s[i])) {
            prefixes.push(s.slice(i, ins));
            i -= 1;
        }
        prefixes.reverse();
        if (!prefixes.includes('')) {
            prefixes.push('');
        }
        return prefixes;

    }

    //@+node:felix.20260518221202.9: *4* abbrev: expansion
    //@+node:felix.20260518221202.10: *5* abbrev.expand_tree
    /**
     * Paste `expansion` as children of c.p.
     * This happens *before* any substitutions are made.
     */
    public async expand_tree(i: number, j: number, word: string, expansion: string): Promise<void> {

        const c = this.c;
        const u = c.undoer;
        const undoType = 'Expand Tree Abbreviation';

        if (c.p.hasChildren()) {
            g.es_print('tree abbreviations must not have children', { color: 'blue' });
            return;
        }
        if (!c.canPasteOutline(expansion)) {
            g.es_print(`bad copied outline: ${expansion}`);
            return;
        }

        // Begin the undo.
        u.beforeChangeGroup(c.p, undoType, true);
        this.replace_selection(i, j, '');

        // Set status flags.
        const isRoot = c.p.isRoot();
        const wasHoisted = c.hoistStack.length > 0;
        const parent = c.p.getParent();
        const noSiblings = parent && parent.v && parent.numberOfChildren() === 1;
        const isFirstChild = parent && parent.v && parent.firstChild() === c.p;
        const prevSibling = c.p.moveToBack();
        const prevSiblingExpanded = prevSibling && prevSibling.v && prevSibling.isExpanded();

        // Carefully replace the old node with the new node.
        if (c.canDeleteHeadline()) {
            if (prevSiblingExpanded) {
                prevSibling.contract();  // To prevent pasting as last child of prevSibling.
            }
            c.deleteOutline("Cut Node");
            c.pasteOutline(expansion);
            if (noSiblings) {
                c.moveOutlineRight();  // Inserted below instead of as child, so move right.
            }
            if (isRoot) {
                c.moveOutlineUp();  // Delete & paste made it second position, so move up.
            }
        } else {
            c.pasteOutline(expansion);
            c.selectPosition(c.p.moveToBack());
            c.deleteOutline("Cut Node");
            if (wasHoisted) {
                c.selectVisNext();
            }
        }

        // Replace the container node with its first child.
        const child = c.p.copy().moveToFirstChild();
        if (child) {
            c.selectPosition(child);
            c.moveOutlineLeft();
            c.goToPrevSibling();
            c.deleteOutline("Cut Node");
            if (isFirstChild || !isRoot) {
                c.selectVisNext();
            }
        }

        // Restore the previous expansion.
        if (prevSiblingExpanded) {
            prevSibling.expand();
        }

        // End the undo.
        u.afterChangeGroup(c.p, undoType);
        c.redraw(c.p);

    }

    //@+node:felix.20260518221202.11: *5* abbrev.init_place_holder_search
    public init_place_holder_search(node_only: boolean): void {

        const c = this.c;
        const p = c.p;
        const finder = c.findCommands;
        const start_pat = c.abbrev_place_start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const end_pat = c.abbrev_place_end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const template_regex = new RegExp(`^.*?${start_pat}.*?${end_pat}`);
        finder.reverse = false;

        // Define the settings for Leo's find command.
        const settings = {
            p: c.p,
            in_headline: false,
            find_text: `(${start_pat}.*?${end_pat})`,
            change_text: '',
            file_only: true,
            mark_changes: false,
            mark_finds: false,
            ignore_case: true,
            node_only: node_only,
            pattern_match: true,
            search_body: true,
            search_headline: true,
            suboutline_only: true,
            whole_word: false,
        };

        const find_template = (s: string): boolean => {
            return g.splitLines(s).some(z => template_regex.test(z));
        };

        // Init the search only if <\...\> appears in the expansion.
        const positions = node_only ? [p] : [...p.self_and_subtree()]
        let found = false;
        for (const pos of positions) {
            if (find_template(pos.h) || find_template(pos.b)) {
                found = true;
                break;
            }
        }
        if (!found) {
            return;
        }
        if (node_only) {
            // Tell the search command to restore settings on failure.
            finder.previous_settings = {
                find_text: finder.find_text,
                change_text: finder.change_text,
                file_only: finder.file_only,
                mark_changes: finder.mark_changes,
                mark_finds: finder.mark_finds,
                ignore_case: finder.ignore_case,
                node_only: finder.node_only,
                pattern_match: finder.pattern_match,
                search_body: finder.search_body,
                search_headline: finder.search_headline,
                suboutline_only: finder.suboutline_only,
                whole_word: finder.whole_word,
            };
        }

        // Search!
        // c.endEditing();  // No need to re-edit the headline!
        this.w?.setInsertPoint(0);  // Start search at start.
        finder.interactive_search_helper(undefined, undefined, settings);

    }

    //@+node:felix.20260518221202.12: *5* abbrev.replace_selection
    /**
     * Undoably replace w[i:j] by s.
     */
    public replace_selection(i: number, j: number, s: string): void {

        console.log(`Replacing selection from ${i} to ${j} with "${s}"`);

        const c = this.c;
        const p = c.p;
        const u = c.undoer;
        const w = this.w;

        if (!w) {
            return;
        }

        // Start the undo.
        const bunch = u.beforeChangeNodeContents(p);

        // Make the replacement.
        w.delete(i, j);
        w.insert(i, s);

        // Update only body text. Setting p.h here would be wrong. (LEO-WEB Maybe do set headline after all?)
        if (!this.in_head) {
            p.v.b = w.getAllText();
        } else {
            c.endEditing(); // TEST THIS HERE INSTEAD OF 
            p.v.h = w.getAllText();
            // const ins = i + s.length;
            // c.frame.tree.editLabel(p, false, [ins, ins, ins]);
        }
        // Complete the undo.
        u.afterChangeNodeContents(p, 'Abbreviation', bunch);
    }
    //@+node:felix.20260518221202.13: *4* abbrev: script substitution
    //@+node:felix.20260518221202.14: *5* abbrev.make_all_scripting_substitutions

    /**
     * Make scripting substitutions throughout c.p's tree.
     */
    public async make_all_scripting_substitutions(word: string): Promise<void> {

        const c = this.c;
        if (!this.scripting_enabled) {
            return;
        }

        // Do nothing if {|{... appears nowwhere in c.p's tree.
        const start_pat = c.abbrev_subst_start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const end_pat = c.abbrev_subst_end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const substitution_regex = new RegExp(`^.*?${start_pat}.*?${end_pat}`);

        const find_template = (s: string): boolean => {
            return g.splitLines(s).some(z => substitution_regex.test(z));
        };

        let found = false;
        for (const p of c.p.self_and_subtree()) {
            if (find_template(p.h) || find_template(p.b)) {
                found = true;
                break;
            }
        }
        if (!found) {
            return;
        }

        c.abbrev_subst_env['_abr'] = word;
        // c.endEditing();  // No need to re-edit the headline!

        // A hack to accommodate existing abbreviations: evaluate bodies before headlines.

        for (const p of c.p.self_and_subtree()) {
            p.b = await this._substitution_helper(p.b);
            p.h = await this._substitution_helper(p.h);
        }

    }

    //@+node:felix.20260518221202.15: *5* abbrev.make_script_substitutions
    /**
     * Replace word by scripting expansion in p.h or p.b.
     */
    public async make_script_substitutions(word: string): Promise<void> {
        const c = this.c;
        const p = c.p;
        const w = this.w;
        if (!this.scripting_enabled) {
            return;
        }

        c.abbrev_subst_env['_abr'] = word;

        // Replace the contents only if they have changed!
        const ins = w?.getInsertPoint() || 0;
        if (this.in_head) {
            // c.endEditing();
            try {
                const contents = p.h;
                const new_contents = await this._substitution_helper(contents);
                if (new_contents !== contents) {
                    p.h = new_contents;
                }
            } finally {
                c.treeWantsFocusNow();
                c.editHeadline();
                const new_ins = Math.min(ins, p.h.length);
                w?.setInsertPoint(new_ins);
            }
        } else {
            const contents = p.b;
            const new_contents = await this._substitution_helper(contents);
            if (new_contents !== contents) {
                p.b = new_contents;
                const new_ins = Math.min(ins, p.b.length);
                p.setSelection(new_ins, p.b.length);
                w?.setInsertPoint(new_ins);
            }
        }

    }

    //@+node:felix.20260518221202.16: *5* abbrev._substitution_helper
    /**
     * Replace 'word' by the 'definition' in the 'content' string.
     */
    public async _substitution_helper(p_content: string): Promise<string> {

        const c = this.c;
        if (!c.abbrev_subst_start || !c.abbrev_subst_end) {
            return p_content;
        }

        const splitAtFirst = (s: string, sep: string): [string, string] | null => {
            const i = s.indexOf(sep);
            if (i < 0) {
                return null;
            }
            return [
                s.slice(0, i),
                s.slice(i + sep.length)
            ];
        };

        while (p_content.includes(c.abbrev_subst_start)) {
            // let [prefix, rest] = p_content.split(c.abbrev_subst_start, 2);
            // const content_list = rest.split(c.abbrev_subst_end, 2);
            // if (content_list.length !== 2) {
            //     break;
            // }
            // let content = content_list[0];
            // rest = content_list[1];
            const first = splitAtFirst(p_content, c.abbrev_subst_start);
            if (!first) {
                break;
            }

            const [prefix, rest1] = first;

            const second = splitAtFirst(rest1, c.abbrev_subst_end);
            if (!second) {
                break;
            }

            let [content, rest] = second;


            let x;
            let func;

            const tsCompileOptions: typescript.CompilerOptions = {
                noEmitOnError: true,
                noImplicitAny: false,
                target: typescript.ScriptTarget.ES2020,
                module: typescript.ModuleKind.CommonJS
            };

            const result = typescript.transpileModule(content, {
                compilerOptions: tsCompileOptions
            });
            const errors: string[] = [];

            if (result.diagnostics && result.diagnostics.length > 0) {
                // Handle the compilation errors.
                // For example, you can log them:
                result.diagnostics.forEach(diagnostic => {
                    const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    errors.push(message);
                });
                g.es(errors.join("\n"));
                return content; // Print errors and cancel running the script.
            } else {
                // The code compiled successfully, you can now proceed to run it.
                content = result.outputText;
            }

            try {
                this.expanding = true;
                content += '\n'; // Make sure we end the script properly.
                const scriptWrapper = `return (async () => {
                    try {
                        ${content}
                    } catch (e) { 
                        g.handleScriptException(c, p, e); 
                    }
                })();`;

                func = new Function(
                    ...Object.keys(c.abbrev_subst_env),
                    scriptWrapper
                );

                if (func) {
                    x = await func(...Object.keys(c.abbrev_subst_env).map(k => c.abbrev_subst_env[k]));
                } else {
                    x = "";
                }

            } catch (e) {
                g.es_print('exception evaluating', content);
                g.es_exception(e);
            } finally {
                this.expanding = false;
            }
            x = x || '';
            x.replaceAll(c.abbrev_subst_start, '').replaceAll(c.abbrev_subst_end, '');
            p_content = `${prefix}${x}${rest}`;

        }
        return p_content;


    }

    //@+node:felix.20260518221202.17: *3* abbrev.finishCreate
    /**
     * AbbrevCommandsClass.finishCreate.
     */
    public finishCreate(): void {
        this.reload_settings();
    }
    //@+node:felix.20260518221202.18: *3* abbrev.reload_settings & helpers
    /**
     * Reload all abbreviation settings.
     */
    public reload_settings(): void {
        this.abbrevs = {};
        this.init_settings();
        this.init_abbrev();
        this.init_tree_abbrev();
        this.init_env();
    }

    public reloadSettings(): void {
        this.reload_settings();
    }
    //@+node:felix.20260518221202.19: *4* abbrev.init_abbrev & helper

    /**
     * Init the user abbreviations from @data global-abbreviations and @data abbreviations nodes.
     */
    public init_abbrev(): void {
        const c = this.c;
        const table = [
            ['global-abbreviations', 'global'],
            ['abbreviations', 'local'],
        ];
        for (const [source, tag] of table) {
            const aList = c.config.getData(source, true, false) || [];
            let abbrev: string[] = [];
            const result: string[] = [];
            for (const s of aList) {
                if (s.startsWith('\\:')) {
                    // Continue the previous abbreviation.
                    abbrev.push(s.slice(2));
                } else {
                    // End the previous abbreviation.
                    if (abbrev.length) {
                        result.push(abbrev.join(''));
                        abbrev = [];
                    }
                    // Start the new abbreviation.
                    if (s.trim()) {
                        abbrev.push(s);
                    }
                }
            }
            // End any remaining abbreviation.
            if (abbrev.length) {
                result.push(abbrev.join(''));
            }
            for (const s of result.sort()) {
                this.addAbbrevHelper(s, tag);
            }
        }
    }

    //@+node:felix.20260518221202.20: *5* abbrev.addAbbrevHelper

    /**
     * Enter the abbreviation 's' into the self.abbrevs dict.
     */
    public addAbbrevHelper(s: string, tag: string = ''): void {
        if (!s.trim()) {
            return;
        }
        try {
            const d = this.abbrevs;
            const data = s.split('=');
            // Do *not* strip ws so the user can specify ws.
            const name = data[0].replace(/\\t/g, '\t').replace(/\\n/g, '\n');
            let val = data.slice(1).join('=');
            if (val.endsWith('\n')) {
                val = val.slice(0, -1);
            }

            // old 
            //val = val.replace(/\\n/g, '\n');
            // new
            val = val.replace(this.number_regex, '\n').replace(/\\\\n/g, '\\n');

            const old = d[name];
            if (old && old !== val && !g.unitTesting) {
                g.es_print(`redefining abbreviation ${name}\nfrom ${JSON.stringify(old)} to ${JSON.stringify(val)}`);
            }
            d[name] = val;
        } catch (e) {
            g.es_print(`bad abbreviation: ${s} `);
        }

    }

    //@+node:felix.20260518221202.21: *4* abbrev.init_env
    /**
     * Init c.abbrev_subst_env by executing the contents of the @data abbreviations-subst-env node.
     */
    public init_env(): void {
        const c = this.c;
        const at = c.atFileCommands;
        if (!this.scripting_enabled) {
            return;
        }
        if (!c.abbrev_place_start || !c.abbrev_place_end) {
            return;
        }
        const aList = this.subst_env;
        const script_list: string[] = [];
        for (const z of aList) {
            // Compatibility with original design.
            if (z.startsWith('\\:')) {
                script_list.push(z.slice(2));
            } else {
                script_list.push(z);
            }
        }
        let script = script_list.join('');
        // Allow Leo directives in @data abbreviations-subst-env trees.
        // #1674: Avoid unnecessary entries in c.fileCommands.gnxDict.
        let root = c.rootPosition();
        if (root && root.v) {
            // pass
        } else {
            // Defensive programming. Probably will never happen.
            const v = new VNode(c);
            root = new Position(v);
        }
        // Similar to g.getScript.
        at.stringToString(
            root,
            script,
            true, // forcePythonSentinels
            false, // sentinels
        ).then(content => {
            const tsCompileOptions: typescript.CompilerOptions = {
                noEmitOnError: true,
                noImplicitAny: false,
                target: typescript.ScriptTarget.ES2020,
                module: typescript.ModuleKind.CommonJS
            };

            const result = typescript.transpileModule(content, {
                compilerOptions: tsCompileOptions
            });
            const errors: string[] = [];

            if (result.diagnostics && result.diagnostics.length > 0) {
                // Handle the compilation errors.
                // For example, you can log them:
                result.diagnostics.forEach(diagnostic => {
                    const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    errors.push(message);
                });
                g.es(errors.join("\n"));
                return; // Print errors and cancel running the script.
            } else {
                // The code compiled successfully, you can now proceed to run it.
                content = result.outputText;
            }

            content.replace(/\r\n/g, '\n');
            let func;

            try {
                content += '\n'; // Make sure we end the script properly.
                const scriptWrapper = `return (async () => {
                    try {
                        ${content}
                    } catch (e) { 
                        g.handleScriptException(c, p, e); 
                    }
                })();`;

                func = new Function(
                    ...Object.keys(c.abbrev_subst_env),
                    scriptWrapper
                );

                if (func) {
                    func(...Object.keys(c.abbrev_subst_env).map(k => c.abbrev_subst_env[k]));
                } else {
                    g.es('No content in @data abbreviations-subst-env');
                }

            } catch (e) {
                g.es('Error executing @data abbreviations-subst-env');
                g.es_exception(e);
            }

        }).catch(error => {
            console.error('Error in stringToString for @data abbreviations-subst-env:', error);
        });


    }

    //@+node:felix.20260518221202.22: *4* abbrev.init_settings
    /**
     * Called from AbbrevCommands.reload_settings aka reloadSettings.
     */
    public init_settings(): void {
        const c = this.c;
        if (!c.config) {
            return;
        }
        const getBool = (key: string, defaultValue: boolean = false): boolean => {
            const value = c.config.getBool(key);
            return value !== undefined ? value : defaultValue;
        };
        const getString = (key: string, defaultValue: string = ''): string => {
            const value = c.config.getString(key);
            return value !== undefined ? value : defaultValue;
        };

        // Local settings. Normally not accessed via c.abbrev_subst_env.
        this.scripting_enabled = getBool('scripting-at-script-nodes') || getBool('scripting-abbreviations');
        this.globalDynamicAbbrevs = getBool('global-dynamic-abbreviations');

        // Allow @data abbreviations-subst-env *only* in leoSettings.leo or myLeoSettings.leo!
        const key = 'abbreviations-subst-env';
        if (c.config.isLocalSetting(key, 'data')) {
            g.issueSecurityWarning(`@data ${key}`);
            this.subst_env = [];
        } else {
            this.subst_env = c.config.getData(key, true, false) || [];
        }

        // Inject one ivar.
        c.k.abbrevOn = getBool('enable-abbreviations', false);

        // Commander ivars for scripting environments, unit tests, etc.
        c.abbrev_place_end = getString('abbreviations-place-end', '|>');
        c.abbrev_place_start = getString('abbreviations-place-start', '<|');
        c.abbrev_subst_env = { 'c': c, 'g': g, '_values': {} };  // May be augmented in init_env.
        // * Default NODE Modules
        c.abbrev_subst_env['Buffer'] = Buffer;
        c.abbrev_subst_env['crypto'] = crypto;
        c.abbrev_subst_env['os'] = os;
        c.abbrev_subst_env['path'] = path;
        c.abbrev_subst_env['process'] = process;

        // * Imported Libraries
        c.abbrev_subst_env['pako'] = g.pako;
        c.abbrev_subst_env['showdown'] = g.showdown;
        c.abbrev_subst_env['dayjs'] = g.dayjs;
        c.abbrev_subst_env['md5'] = g.md5;
        c.abbrev_subst_env['csvtojson'] = csv;
        c.abbrev_subst_env['difflib'] = difflib;
        c.abbrev_subst_env['elementtree'] = et;
        c.abbrev_subst_env['ksuid'] = KSUID;

        c.abbrev_subst_start = getString('abbreviations-subst-start', '{|{');
        c.abbrev_subst_end = getString('abbreviations-subst-end', '}|}');
    }

    //@+node:felix.20260518221202.23: *4* abbrev.init_tree_abbrev
    /**
     * Init tree_abbrevs_d from @data tree-abbreviations nodes.
     */
    public init_tree_abbrev(): void {

        const c = this.c;
        // Careful. This happens early in startup.
        let root = c.rootPosition();
        if (!root || !root.v) {
            return;
        }
        if (!c.p || !c.p.v) {
            c.selectPosition(root);
        }
        if (!c.p || !c.p.v) {
            return;
        }
        const data = c.config.getOutlineData('tree-abbreviations');
        if (!data) {
            return;
        }
        const d: Record<string, string> = {};
        // #904: data may be a string or a list of two strings.
        const aList = typeof data === 'string' ? [data] : data;
        for (const tree_s of aList) {
            // Expand the tree so we can traverse it.
            if (!c.canPasteOutline(tree_s)) {
                return;
            }
            c.fileCommands.leo_file_encoding = 'utf-8';
            // As part of #427, disable all redraws.
            const old_disable = g.app.disable_redraw;
            try {
                g.app.disable_redraw = true;
                this.init_tree_abbrev_helper(d, tree_s);
            } finally {
                g.app.disable_redraw = old_disable;
            }
        }
        this.tree_abbrevs_d = d;
    }

    //@+node:felix.20260518221202.24: *5* abbrev.init_tree_abbrev_helper
    /**
     * Init d from tree_s, the text of a copied outline.
     */
    public init_tree_abbrev_helper(d: Record<string, string>, tree_s: string): void {

        const c = this.c;
        const hidden_root = c.fileCommands.getPosFromClipboard(tree_s);
        if (!hidden_root || !hidden_root.v) {
            g.trace('no pasted node');
            return;
        }
        for (const p of hidden_root.children()) {
            for (const s of g.splitLines(p.b)) {
                if (s.trim() && !s.trim().startsWith('#')) {
                    const abbrev_name = s.trim();
                    // #926: Allow organizer nodes by searching all descendants.
                    let found = false;
                    for (const child of p.subtree()) {
                        if (child.h.trim() === abbrev_name) {
                            const abbrev_s = c.fileCommands.outline_to_clipboard_string(child);
                            d[abbrev_name] = abbrev_s;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        g.trace(`no definition for ${abbrev_name}`);
                    }
                }
            }
        }
    }

    //@+node:felix.20260518221202.25: *3* abbrev: Commands & helpers
    //@+node:felix.20260518221202.26: *4* abbrev._getDynamicList (helper)
    /**
     * Return a list of dynamic abbreviations.
     */
    private _getDynamicList(w: StringTextWrapper, s: string): string[] {

        const c = this.c;
        let items: string[] = [];
        if (this.globalDynamicAbbrevs) {
            // Look in all nodes.h
            for (const p of c.all_unique_positions()) {
                const text = p.b || '';
                const matches = text.match(this.dyna_regex);
                if (matches) {
                    items.push(...matches);
                }
            }
        } else {
            // Just look in this node.
            const text = w.getAllText();
            const matches = text.match(this.dyna_regex);
            if (matches) {
                items.push(...matches);
            }
        }
        items = Array.from(new Set(items.filter(z => z.startsWith(s)))).sort();
        return items;

    }

    //@+node:felix.20260518221202.27: *4* abbrev.dynamicCompletion C-M-/
    @cmd('dabbrev-completion', 'Insert the common prefix of all dynamic abbrev\'s matching the present word. This corresponds to C-M-/ in Emacs.')
    public dynamicCompletion(event?: Event): void {
        const c = this.c;
        const p = c.p;
        const w = this.editWidget();
        if (!w) {
            return;
        }
        const s = w.getAllText();
        const ins = w.getInsertPoint();
        let ins1 = ins;
        if (ins > 0 && ins < s.length && !g.isWordChar(s[ins])) {
            ins1 -= 1;
        }
        const [i, j] = g.getWord(s, ins1);
        const word = w.get(i, j);
        let aList = this._getDynamicList(w, word);
        if (!aList.length) {
            return;
        }
        // Bug fix: remove s itself, otherwise we can not extend beyond it.
        if (aList.includes(word) && aList.length > 1) {
            aList = aList.filter(item => item !== word);
        }
        const prefix = aList.length
            ? aList.reduce((a, b) => g.longestCommonPrefix(a, b))
            : "";
        if (prefix.trim()) {
            const ypos = w.getYScrollPosition();
            const bunch = c.undoer.beforeChangeNodeContents(p);
            const new_s = s.slice(0, i) + prefix + s.slice(j);
            w.setAllText(new_s);
            w.setInsertPoint(i + prefix.length);
            w.setYScrollPosition(ypos);
            c.undoer.afterChangeNodeContents(p, 'dabbrev-completion', bunch);
            c.recolor();
        }
    }

    //@+node:felix.20260518221202.28: *4* abbrev.dynamicExpansion M-/ & helper

    @cmd(
        'dabbrev-expands',
        'Inserts the longest common prefix of the word at the cursor. Displays all possible completions if the prefix is the same as the word.'
    )
    public async dynamicExpansion(event?: Event): Promise<void> {
        const w = this.editWidget();
        if (!w) {
            return;
        }
        const s = w.getAllText();
        const ins = w.getInsertPoint();
        let ins1 = ins;
        if (ins > 0 && ins < s.length && !g.isWordChar(s[ins])) {
            ins1 -= 1;
        }
        const [i, j] = g.getWord(s, ins1);
        // This allows the cursor to be placed anywhere in the word.
        w.setInsertPoint(j);
        const word = w.get(i, j);
        let aList = this._getDynamicList(w, word);
        if (!aList.length) {
            return;
        }
        if (aList.includes(word) && aList.length > 1) {
            aList = aList.filter(item => item !== word);
        }
        const prefix = aList.reduce((a, b) => g.longestCommonPrefix(a, b)).trim();
        return this.dynamicExpandHelper(event, prefix, aList, w);
    }

    //@+node:felix.20260518221202.29: *5* abbrev.dynamicExpandHelper
    /**
     * State handler for dabbrev-expands command.
     */
    public dynamicExpandHelper(
        event: any,
        prefix?: string,
        aList?: string[],
        w?: StringTextWrapper
    ): Thenable<void> {

        const c = this.c;
        const k = this.c.k;
        this.w = w || null;
        if (!prefix) {
            prefix = '';
        }
        const prefix2 = 'dabbrev-expand: ';
        g.es('', (aList || []).join('\n'), 'Completion');
        return g.app.gui.get1Arg({
            title: 'dabbrev-expand',
            value: prefix,
            prompt: 'dabbrev-expand: ',
        }, aList).then((arg) => {
            this.dynamicExpandHelper1(arg);
        });
    }

    /**
     * Finisher for dabbrev-expands.
     */
    public dynamicExpandHelper1(arg?: string): void {
        if (arg == null) {
            return;
        }
        // use arg instead of k.arg, and chain up to this method from dynamicExpandHelper using g.app.gui.get1Arg
        const c = this.c;
        const p = c.p;
        if (arg) {
            const w = this.w;
            if (!w) {
                return;
            }
            const s = w.getAllText();
            const ypos = w.getYScrollPosition();
            const b = c.undoer.beforeChangeNodeContents(p);
            const ins = w.getInsertPoint();
            let ins1 = ins;
            if (ins > 0 && ins < s.length && !g.isWordChar(s[ins])) {
                ins1 -= 1;
            }
            const [i, j] = g.getWord(s, ins1);
            // word = s[i: j]
            const new_s = s.slice(0, i) + arg + s.slice(j);
            w.setAllText(new_s);
            w.setInsertPoint(i + arg.length);
            w.setYScrollPosition(ypos);
            c.undoer.afterChangeNodeContents(p, 'dabbrev-expand', b);
            c.recolor();
        }
    }

    //@+node:felix.20260518221202.30: *4* abbrev.killAllAbbrevs
    @cmd('abbrev-kill-all', 'Delete all abbreviations.')
    public killAllAbbrevs(): void {
        this.abbrevs = {};
    }

    //@+node:felix.20260518221202.31: *4* abbrev.listAbbrevs
    @cmd('abbrev-list', 'List all abbreviations.')
    public listAbbrevs(): void {
        const d = this.abbrevs;
        if (Object.keys(d).length > 0) {
            g.es_print('Abbreviations...');
            const keys = Object.keys(d).sort();
            for (const name of keys) {
                const [val, tag] = d[name];
                const val_display = val.replace('\n', '\\n');
                const tag_display = tag ? `${tag}: ` : '';
                g.es_print('', `${tag_display}${name}=${val_display} `);
            }
        } else {
            g.es_print('No present abbreviations');
        }
    }
    //@+node:felix.20260518221202.32: *4* abbrev.toggleAbbrevMode
    @cmd('toggle-abbrev-mode', 'Toggle abbreviation mode.')
    public toggleAbbrevMode(): void {
        const k = this.c.k;
        k.abbrevOn = !k.abbrevOn;
        k.keyboardQuit?.();
        if (!g.unitTesting && !g.app.batchMode) {
            g.es('Abbreviations are ' + (k.abbrevOn ? 'on' : 'off'));
        }
    }
    //@-others

}
//@-others
//@-leo
