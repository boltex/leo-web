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
//@-<< abbrevCommands imports & abbreviations >>

//@+others
//@+node:felix.20260411212839.1: ** abbrevCommands.cmd (decorator)
/**
 * Command decorator for the abbrevCommandsClass class. 
 */
function cmd(p_name: string, p_doc: string) {
    return new_cmd_decorator(p_name, p_doc, ['c', 'abbrevCommands']);
}
//@+node:felix.20260411212941.1: ** class AbbrevCommandsClass
/**
 * A class to handle user-defined abbreviations.
 * See apropos-abbreviations for details.
 */
export class AbbrevCommandsClass extends BaseEditCommandsClass {

    public abbrevs: Record<string, [string, string]>;  // Keys are names, values are (abbrev,tag).
    public dynaregex: RegExp
    public n_regex: RegExp
    public enabled: boolean
    public expanding: boolean  // True: expanding abbreviations.
    public event: KeyboardEvent | null
    public last_hit: Position | null  // Distinguish between text and tree abbreviations.
    public root: Position | null  // The root of tree abbreviations.
    public save_ins: number | null  // Saved insert point.
    public save_sel: [number, number] | null  // Saved selection range.
    public store: { 'rlist': string[], 'stext': string }  // For dynamic expansion.
    public tree_abbrevs_d: Record<string, string>  // Keys are names, values are (tree,tag).
    public w: StringTextWrapper | null;
    public subst_env: string[] = []; // The environment for all substitutions. May be augmented in init_env.
    public globalDynamicAbbrevs: boolean = false;

    //@+others
    //@+node:felix.20260411220834.1: *3* abbrev.Birth
    //@+node:felix.20260411220834.2: *4* abbrev.ctor
    /**
     * Ctor for AbbrevCommandsClass class.
     */
    constructor(c: Commands) {
        super(c); // Call the parent class constructor

        this.c = c;
        // Set local ivars.
        this.abbrevs = {};  // Keys are names, values are (abbrev,tag).

        this.dynaregex = /[a-zA-Z0-9_-]+/g; // For dynamic abbreviations

        // Not a unicode problem.
        this.n_regex = /(?<!\\)\\n/g; // to replace \\n but not \\\\n
        this.enabled = false;
        this.expanding = false;  // True: expanding abbreviations.
        this.event = null;
        this.last_hit = null;  // Distinguish between text and tree abbreviations.
        this.root = null;  // The root of tree abbreviations.
        this.save_ins = null;  // Saved insert point.
        this.save_sel = null;  // Saved selection range.
        this.store = { 'rlist': [], 'stext': '' };  // For dynamic expansion.
        this.tree_abbrevs_d = {};  // Keys are names, values are (tree,tag).
        this.w = null;
    }

    //@+node:felix.20260411220834.3: *4* abbrev.finishCreate & helpers
    /**
     * AbbrevCommandsClass.finishCreate.
     */
    public finishCreate(): void {
        this.reload_settings();
    }

    //@+node:felix.20260411220834.4: *5* abbrev.reload_settings & helpers
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
        this.reload_settings()
    }

    //@+node:felix.20260411220834.5: *6* abbrev.init_abbrev
    /**
     * Init the user abbreviations from @data global-abbreviations and @data abbreviations nodes.
     */
    private init_abbrev(): void {

        const c = this.c;
        const table: [string, string][] = [
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
                    if (abbrev.length > 0) {
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
            if (abbrev.length > 0) {
                result.push(abbrev.join(''));
            }
            for (const s of result) {
                this.addAbbrevHelper(s, tag);
            }
        }
        // fake the next placeholder abbreviation
        const nextPlaceholder = c.config.getString("abbreviations-next-placeholder");
        if (nextPlaceholder) {
            this.addAbbrevHelper(
                `${nextPlaceholder}=__NEXT_PLACEHOLDER`,
                'global',
            );
        }

    }

    //@+node:felix.20260411220834.6: *6* abbrev.init_env
    /**
     * Init c.abbrev_subst_env by executing the contents of the @data abbreviations-subst-env node.
     */
    private init_env(): void {
        const c = this.c;
        const at = c.atFileCommands;
        if (c.abbrev_place_start && this.enabled) {
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
            const root = c.rootPosition()!;
            // Similar to g.getScript.
            console.log('TODO : LEO-WEB : @data abbreviations-subst-env : SKIPPING CONVERTING SCRIPT FOR NOW !');
            // script = await at.stringToString(
            //     root,
            //     script,
            //     true,
            //     false,
            // );
            // script = script.replace(/\r\n/g, '\n');

            try {
                // TODO : use Function constructor instead of eval for better security and performance.
                // eslint-disable-next-line no-eval
                // eval(script);
                console.log('TODO : LEO-WEB : @data abbreviations-subst-env : SKIPPING RUNNING SCRIPT FOR NOW !');
                // instead output tehe script to help debug
                console.log('Script from @data abbreviations-subst-env :');
                console.log(script);

            } catch (e) {
                g.es('Error executing @data abbreviations-subst-env');
                g.es_exception(e);
            }

        } else {
            c.abbrev_subst_start = '';  // Was False.
        }
    }
    //@+node:felix.20260411220834.7: *6* abbrev.init_settings (called from reload_settings)
    /**
     * Called from AbbrevCommands.reload_settings aka reloadSettings.
     */
    private init_settings(): void {

        const c = this.c;
        c.k.abbrevOn = c.config.getBool('enable-abbreviations', false);
        c.abbrev_place_end = c.config.getString('abbreviations-place-end') || '';
        c.abbrev_place_start = c.config.getString('abbreviations-place-start') || '';
        c.abbrev_subst_end = c.config.getString('abbreviations-subst-end') || '';
        // The environment for all substitutions.
        // May be augmented in init_env.
        c.abbrev_subst_env = {
            'c': c,
            'g': g,
            '_values': {},
        };
        c.abbrev_subst_start = c.config.getString('abbreviations-subst-start') || '';
        // Local settings.
        this.enabled = (
            c.config.getBool('scripting-at-script-nodes') ||
            c.config.getBool('scripting-abbreviations')
        );
        this.globalDynamicAbbrevs = c.config.getBool('globalDynamicAbbrevs', false);
        // @data abbreviations-subst-env must *only* be defined in leoSettings.leo or myLeoSettings.leo!
        if (c.config) {
            const key = 'abbreviations-subst-env';
            if (c.config.isLocalSetting(key, 'data')) {
                g.issueSecurityWarning(`@data ${key}`);
                this.subst_env = [];
            } else {
                this.subst_env = c.config.getData(key, true, false) || [];
            }
        }

    }

    //@+node:felix.20260411220834.8: *6* abbrev.init_tree_abbrev
    /**
     * Init tree_abbrevs_d from @data tree-abbreviations nodes.
     */
    private init_tree_abbrev(): void {

        const c = this.c;
        const root = c.rootPosition();
        if (!root) {
            return;
        }
        if (!c.p) {
            c.selectPosition(root);
        }
        if (!c.p) {
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

    //@+node:felix.20260411220834.9: *7* abbrev.init_tree_abbrev_helper
    /**
     * Init d from tree_s, the text of a copied outline.
     */
    private init_tree_abbrev_helper(d: Record<string, string>, tree_s: string): void {

        const c = this.c;
        const hidden_root = c.fileCommands.getPosFromClipboard(tree_s);
        if (!hidden_root) {
            g.trace('no pasted node');
            return;
        }
        for (const p of hidden_root.children()) {
            for (const s of g.splitLines(p.b)) {
                if (s.trim() && !s.startsWith('#')) {
                    const abbrev_name = s.trim();
                    // #926: Allow organizer nodes by searching all descendants.
                    let found = false;
                    for (const child of p.subtree()) {
                        if (child.h.trim() === abbrev_name) {
                            const abbrev_s = c.fileCommands.outline_to_clipboard_string(child);
                            d[abbrev_name] = abbrev_s!;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        g.trace(`No definition for ${abbrev_name}`);
                    }
                }
            }
        }

    }

    //@+node:felix.20260412000214.1: *3* abbrev.expandAbbrev & helpers (entry point)
    /**
     * Not a command.  Expand abbreviations in event.widget.
     *
     * Words start with '@'.
     *
     * Return True if the abbreviation was expanded.
     */
    public expandAbbrev(event: any, stroke: KeyboardEvent): boolean {
        console.log('in expandAbbrev', stroke);
        const c = this.c;
        const p = c.p;
        const w = this.editWidget(false);
        const name = g.app.gui.widget_name(w);
        if (!w) {
            return false;
        }
        const ch = this.get_ch(event, stroke, w);
        if (!ch) {
            return false;
        }
        const [s, i, j, prefixes] = this.get_prefixes(w);
        let found = false;
        let new_i: number, tag: string | null, word: string | null, val: string | null;
        tag = '';
        word = '';
        val = '';
        new_i = i;
        console.log('prefixes', prefixes);
        for (const prefix of prefixes) {
            [new_i, tag, word, val] = this.match_prefix(ch, i, j, prefix, s);
            if (word && val != null) {
                // #4462: Make only one substitution in headlines.
                if (name.startsWith('head')) {
                    this.make_first_headline_substitution(i, j, p, val);
                    return true;
                }
                if (val === '__NEXT_PLACEHOLDER') {
                    const insertPoint = w.getInsertPoint();
                    if (insertPoint > 0) {
                        w.delete(insertPoint - 1);
                    }
                }
                // Do not call c.endEditing here.
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
        // Ok there really is an abbreviation to expand.
        g.app.gui.triggerBodySave();
        c.abbrev_subst_env['_abr'] = word;
        if (tag === 'tree') {
            this.root = p.copy();
            this.last_hit = p.copy();
            this.expand_tree(w, i, j, val!, word!);
            c.undoer.clearAndWarn('tree-abbreviation');
        } else {
            // Never expand a search for text matches.
            const place_holder = val!.includes('__NEXT_PLACEHOLDER');
            const expand_search = place_holder && !!(this.last_hit && this.last_hit.v);
            if (!expand_search) {
                this.last_hit = null;
            }
            this.expand_text(w, i, j, val!, word!, expand_search);
            // Restore the selection range.
            if (this.save_ins !== null && this.save_sel !== null) {
                const [sel1, sel2] = this.save_sel;
                w.setSelectionRange(sel1, sel2, this.save_ins);
            }

        }
        return true;

    }

    //@+node:felix.20260412000214.2: *4* abbrev.exec_content
    /**
     * Execute the content in the environment, and return the result.
     */
    public exec_content(content: string): void { }

    //@+node:felix.20260412000214.3: *4* abbrev.expand_text
    /**
     * Make a text expansion at location i,j of widget w.
     */
    public expand_text(
        w: StringTextWrapper,
        i: number,
        j: number,
        val: string,
        word: string,
        expand_search = false,
    ): void {

        const c = this.c;
        let do_placeholder = false;
        if (word === c.config.getString("abbreviations-next-placeholder")) {
            val = '';
            do_placeholder = true;
        } else {
            [val, do_placeholder] = this.make_script_substitutions(i, j, val);
        }
        this.replace_selection(w, i, j, val);
        // Search to the end.  We may have been called via a tree abbrev.
        const p = c.p.copy();
        if (expand_search) {
            while (p && p.v) {
                if (this.find_place_holder(p, do_placeholder)) {
                    return;
                }
                p.moveToThreadNext();
            }
        } else {
            this.find_place_holder(p, do_placeholder);
        }

    }

    //@+node:felix.20260412000214.4: *4* abbrev.expand_tree (entry) & helpers
    /**
     * Paste tree_s as children of c.p.
     * This happens *before* any substitutions are made.
     */
    public expand_tree(w: StringTextWrapper, i: number, j: number, tree_s: string, word: string): void {

        const c = this.c;
        if (!c.canPasteOutline(tree_s)) {
            g.trace(`bad copied outline: ${tree_s}`);
            return;
        }
        const old_p = c.p.copy();
        this.replace_selection(w, i, j, undefined);
        this.paste_tree(old_p, tree_s);
        // Make all script substitutions first.
        // Original code.  Probably unwise to change it.
        let do_placeholder = false;
        for (const p of old_p.self_and_subtree()) {
            const [val, placeholder] = this.make_script_substitutions(0, 0, p.b);
            if (!placeholder) {
                p.b = val;
            }
        }
        // Now search for all place-holders.
        for (const p of old_p.subtree()) {
            if (this.find_place_holder(p, do_placeholder)) {
                break;
            }
        }

    }

    //@+node:felix.20260412000214.5: *5* abbrev.paste_tree
    /**
     * Paste the tree corresponding to s (xml) into the tree.
     */
    public paste_tree(old_p: Position, s: string): void {
        const c = this.c;
        c.fileCommands.leo_file_encoding = 'utf-8';
        const p = c.pasteOutline(s, false);
        if (p) {
            // Promote the name node, then delete it.
            p.moveToLastChildOf(old_p);
            c.selectPosition(p);
            c.promote(false);
            p.doDelete();
            c.redraw(old_p);  // 2017/02/27: required.
        } else {
            g.trace('paste failed');
        }
    }

    //@+node:felix.20260412000214.6: *4* abbrev.find_place_holder
    /**
     * Search for the next place-holder.
     * If found, select the place-holder (without the delims).
     */
    public find_place_holder(p: Position, do_placeholder: boolean): boolean {

        const c = this.c;
        // do #438: Search for placeholder in headline.
        let s = p.h;
        if (do_placeholder || (c.abbrev_place_start && s.includes(c.abbrev_place_start))) {
            const [new_s, i, j] = this.next_place(s, 0);
            if (i != null && j != null) {
                p.h = new_s;
                c.redraw(p);
                c.editHeadline();
                const w = c.edit_widget(p);
                if (w) {
                    w.setSelectionRange(i, j, j);
                }
                return true;
            }
        }
        s = p.b;
        if (do_placeholder || (c.abbrev_place_start && s.includes(c.abbrev_place_start))) {
            const [new_s, i, j] = this.next_place(s, 0);
            if (i == null || j == null) {
                return false;
            }
            const w = c.frame.body.wrapper;
            const switch_ = !p.__eq__(c.p);
            let scroll: number | null = null;
            if (switch_) {
                c.selectPosition(p);
            } else {
                scroll = w.getYScrollPosition();
            }
            w.setAllText(new_s);
            p.v.b = new_s;
            if (switch_) {
                c.redraw();
            }
            w.setSelectionRange(i, j, j);
            if (switch_) {
                w.seeInsertPoint();
            } else {
                // Keep the scroll point if possible.
                w.setYScrollPosition(scroll!);
                w.seeInsertPoint();
            }
            c.bodyWantsFocusNow();
            return true;
        }
        // #453: do nothing here.
        // c.frame.body.forceFullRecolor()
        // c.bodyWantsFocusNow()
        return false;

    }
    //@+node:felix.20260412000214.7: *4* abbrev.make_script_substitutions
    /**
     * Make scripting substitutions in node p.
     */
    public make_script_substitutions(i: number, j: number, val: string): [string, boolean] {
        /*
        c = self.c
        w = c.frame.body.wrapper
        if not c.abbrev_subst_start:
            return val, False
        # Nothing to undo.
        if c.abbrev_subst_start not in val:
            return val, False

        # Perform all scripting substitutions.
        self.save_ins = None
        self.save_sel = None
        while c.abbrev_subst_start in val:
            prefix, rest = val.split(c.abbrev_subst_start, 1)
            content = rest.split(c.abbrev_subst_end, 1)
            if len(content) != 2:
                break
            content, rest = content  # type:ignore
            try:
                self.expanding = True
                c.abbrev_subst_env['x'] = ''
                exec(content, c.abbrev_subst_env, c.abbrev_subst_env)  # type:ignore
            except Exception:
                g.es_print('exception evaluating', content)
                g.es_exception()
            finally:
                self.expanding = False
            x = c.abbrev_subst_env.get('x')
            if x is None:
                x = ''
            val = f"{prefix}{x}{rest}"
            # Save the selection range.
            self.save_ins = w.getInsertPoint()
            self.save_sel = w.getSelectionRange()
        if val == "__NEXT_PLACEHOLDER":
            # user explicitly called for next placeholder in an abbreviation inserted previously
            val = ''
            do_placeholder = True
        else:
            do_placeholder = False
            c.p.v.b = w.getAllText()
        return val, do_placeholder
        */

        const c = this.c;
        const w = c.frame.body.wrapper;

        if (!c.abbrev_subst_start) {
            return [val, false];
        }
        // Nothing to undo.
        if (!val.includes(c.abbrev_subst_start)) {
            return [val, false];
        }
        // Perform all scripting substitutions.
        this.save_ins = null;
        this.save_sel = null;
        while (val.includes(c.abbrev_subst_start)) {
            const [prefix, rest] = val.split(c.abbrev_subst_start, 2);
            const content_split = rest.split(c.abbrev_subst_end, 2);
            if (content_split.length !== 2) {
                break;
            }
            const [content, rest_after] = content_split;
            try {
                this.expanding = true;
                c.abbrev_subst_env['x'] = '';
                // TODO : use Function constructor instead of eval for better security and performance.
                console.log('TODO : LEO-WEB : make_script_substitutions : SKIPPING RUNNING SCRIPT FOR NOW !');
                // eslint-disable-next-line no-eval
                // eval(content);
            } catch (e) {
                g.es_print('exception evaluating', content);
                g.es_exception(e);
            } finally {
                this.expanding = false;
            }
            const x = c.abbrev_subst_env['x'] || '';
            val = `${prefix}${x}${rest_after}`;
            // Save the selection range.
            this.save_ins = w.getInsertPoint();
            this.save_sel = w.getSelectionRange();
        }
        if (val === "__NEXT_PLACEHOLDER") {
            // user explicitly called for next placeholder in an abbreviation inserted previously
            val = '';
            return [val, true];
        } else {
            c.p.v.b = w.getAllText();
            return [val, false];
        }
    }
    //@+node:felix.20260412000214.8: *4* abbrev.make_script_substitutions_in_headline
    /**
     * Make *only* the first scripting substitution in p.h.
     */
    public make_first_headline_substitution(i: number, j: number, p: Position, val: string): void {
        /*
        c = self.c
        c.endEditing()  # Required.
        pattern = re.compile(
            r'^(.*)%s(.+)%s(.*)$'
            % (
                re.escape(c.abbrev_subst_start),
                re.escape(c.abbrev_subst_end),
            )
        )
        if m := pattern.match(val):
            content = m.group(2)
            c.abbrev_subst_env['x'] = ''
            try:
                exec(content, c.abbrev_subst_env, c.abbrev_subst_env)
                x = c.abbrev_subst_env.get('x')
                if x:
                    val = f"{m.group(1)}{x}{m.group(3)}"
            except Exception:
                # Leave p.h alone.
                g.trace('scripting error in', p.h)
                g.es_exception()
        # #4529
        p.h = f"{p.h[:i]}{val}{p.h[j:]}"
        # Set the insertion point and continue editing the headline.
        ins = i + len(val)
        c.frame.tree.editLabel(p, selection=(ins, ins, ins))
        */

        const c = this.c;
        c.endEditing();  // Required.
        const pattern = new RegExp(
            `^(.*)${c.abbrev_subst_start}(.+)${c.abbrev_subst_end}(.*)$`
        );
        const m = pattern.exec(val);
        if (m) {
            const content = m[2];
            c.abbrev_subst_env['x'] = '';
            try {
                // TODO : use Function constructor instead of eval for better security and performance.
                console.log('TODO : LEO-WEB : make_first_headline_substitution : SKIPPING RUNNING SCRIPT FOR NOW !');
                // eslint-disable-next-line no-eval
                // eval(content);
                const x = c.abbrev_subst_env['x'] || '';
                val = `${m[1]}${x}${m[3]}`;
            } catch (e) {
                // Leave p.h alone.
                g.trace('scripting error in', p.h);
                g.es_exception(e);
            }
        }
        // #4529
        p.h = `${p.h.slice(0, i)}${val}${p.h.slice(j)}`;
        // Set the insertion point and continue editing the headline.
        const ins = i + val.length;
        c.frame.tree.editLabel(p, false, [ins, ins, ins]);


    }

    //@+node:felix.20260412000214.9: *4* abbrev.match_prefix
    /**
     * A match helper.
     */
    public match_prefix(
        ch: string, i: number, j: number, prefix: string, s: string
    ): [number, string | null, string | null, string | null] {

        i = j - prefix.length;
        let word: string | null = g.checkUnicode(prefix) + g.checkUnicode(ch);
        let tag: string | null = 'tree';
        let val: string | null = this.tree_abbrevs_d[word];
        if (!val) {
            [val, tag] = this.abbrevs[word] || [null, null];
        }
        if (val) {
            // Require a word match if the abbreviation is itself a word.
            if (' \t\n'.includes(ch)) {
                word = word.trimEnd();
            }
            if (/^[a-zA-Z0-9]+$/.test(word) && /^[a-zA-Z]/.test(word[0])) {
                if (i === 0 || ' \t\n'.includes(s[i - 1])) {
                    // pass
                } else {
                    i -= 1;
                    word = null;
                    val = null;  // 2017/03/19.
                }
            }
        } else {
            i -= 1;
            word = null;
            val = null;
        }
        return [i, tag, word, val];

    }

    //@+node:felix.20260412000214.10: *4* abbrev.next_place
    /**
     * Given string s containing a placeholder like <| block |>,
     * return (s2,start,end) where s2 is s without the <| and |>,
     * and start, end are the positions of the beginning and end of block.
     */
    public next_place(s: string, offset = 0): [string, number | null, number | null] {
        /*
        c = self.c
        if c.abbrev_place_start is None or c.abbrev_place_end is None:
            return s, None, None  # #1345.
        new_pos = s.find(c.abbrev_place_start, offset)
        new_end = s.find(c.abbrev_place_end, offset)
        if (new_pos < 0 or new_end < 0) and offset:
            new_pos = s.find(c.abbrev_place_start)
            new_end = s.find(c.abbrev_place_end)
            if not (new_pos < 0 or new_end < 0):
                g.es("Found earlier placeholder")
        if new_pos < 0 or new_end < 0:
            return s, None, None
        start = new_pos
        place_holder_delim = s[new_pos : new_end + len(c.abbrev_place_end)]
        place_holder = place_holder_delim[len(c.abbrev_place_start) : -len(c.abbrev_place_end)]
        s2 = s[:start] + place_holder + s[start + len(place_holder_delim) :]
        end = start + len(place_holder)
        return s2, start, end
        */

        const c = this.c;
        if (c.abbrev_place_start == null || c.abbrev_place_end == null) {
            return [s, null, null];  // #1345.
        }
        let new_pos = s.indexOf(c.abbrev_place_start, offset);
        let new_end = s.indexOf(c.abbrev_place_end, offset);
        if (new_pos < 0 || new_end < 0) {
            if (offset) {
                new_pos = s.indexOf(c.abbrev_place_start);
                new_end = s.indexOf(c.abbrev_place_end);
                if (new_pos >= 0 && new_end >= 0) {
                    g.es("Found earlier placeholder");
                }
            }
            if (new_pos < 0 || new_end < 0) {
                return [s, null, null];
            }
        }
        const start = new_pos;
        const place_holder_delim = s.slice(new_pos, new_end + c.abbrev_place_end.length);
        const place_holder = place_holder_delim.slice(c.abbrev_place_start.length, -c.abbrev_place_end.length);
        const s2 = s.slice(0, start) + place_holder + s.slice(start + place_holder_delim.length);
        const end = start + place_holder.length;
        return [s2, start, end];

    }

    //@+node:felix.20260412000214.11: *4* abbrev.replace_selection
    /** 
     * Replace w[i:j] by s.
     */
    public replace_selection(w: StringTextWrapper, i: number, j: number, s?: string): void {
        const p = this.c.p;
        const u = this.c.undoer;
        const w_name = g.app.gui.widget_name(w);
        const bunch = u.beforeChangeBody(p);
        let abbrev: string;
        if (i === j) {
            abbrev = '';
        } else {
            abbrev = w.get(i, j);
            w.delete(i, j);
        }
        if (s != null) {
            w.insert(i, s);
        }
        if (!w_name.startsWith('head')) {
            // Fix part of #438. Don't leave the headline.
            p.v.b = w.getAllText();
            u.afterChangeBody(p, 'Abbreviation', bunch);
        }
        // Adjust self.save_sel & self.save_ins
        if (s != null && this.save_sel != null) {
            let [sel_i, sel_j] = this.save_sel;
            const ins = this.save_ins!;
            const delta = s.length - abbrev.length;
            this.save_sel = [sel_i + delta, sel_j + delta];
            this.save_ins = ins + delta;
        }
    }

    //@+node:felix.20260412000214.12: *4* abbrev_get_ch
    /**
     * Get the ch from the stroke.
     */
    public get_ch(event: any, stroke: KeyboardEvent, w: StringTextWrapper): string | null {
        let ch: string | null = g.checkUnicode(event ? event.char : '');
        if (this.expanding) {
            return null;
        }
        if (w.hasSelection()) {
            return null;
        }
        if ('BackSpace Delete'.includes(stroke.key)) {
            return null;
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
        console.log('get_ch', stroke.key, '->', ch);
        return ch;
    }

    //@+node:felix.20260412000214.13: *4* abbrev_get_prefixes
    /**
     * Return the prefixes at the current insertion point of w.
     */
    public get_prefixes(w: StringTextWrapper): [string, number, number, string[]] {


        // New code allows *any* sequence longer than 1 to be an abbreviation.
        // Any whitespace stops the search.
        // const s = w.getAllText();
        // const j = w.getInsertPoint();

        // TODO: get all text and insertion point directly from the dom.
        const inHeadline = !!g.workspace.outline.headlineFinish;
        let s;
        let j;
        if (inHeadline) {
            s = g.workspace.outline.HEADLINE_INPUT.value;
            j = g.workspace.outline.HEADLINE_INPUT.selectionStart || 0;
        } else {
            s = g.workspace.body.getBody();
            j = g.workspace.body.getBodyInsertOffset();
        }

        let i = j - 1;
        const prefixes: string[] = [];
        while (i >= 0 && !' \t\n'.includes(s[i])) {
            prefixes.push(s.slice(i, j));
            i -= 1;
        }
        prefixes.reverse();
        if (!prefixes.includes('')) {
            prefixes.push('');
        }
        return [s, i, j, prefixes];

    }
    //@+node:felix.20260412000219.1: *3* abbrev.dynamic abbreviation...
    //@+node:felix.20260412000219.2: *4* abbrev.dynamicCompletion C-M-/
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
        let aList = this.getDynamicList(w, word);
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

    //@+node:felix.20260412000219.3: *4* abbrev.dynamicExpansion M-/ & helper
    @cmd(
        'dabbrev-expands',
        'Inserts the longest common prefix of the word at the cursor. Displays all possible completions if the prefix is the same as the word.'
    )
    public async dynamicExpansion(event?: Event): Promise<void> {

        // TODO RETURN PROMISE AND/OR MAKE ASYNC!

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
        let aList = this.getDynamicList(w, word);
        if (!aList.length) {
            return;
        }
        if (aList.includes(word) && aList.length > 1) {
            aList = aList.filter(item => item !== word);
        }
        const prefix = aList.reduce((a, b) => g.longestCommonPrefix(a, b)).trim();
        return this.dynamicExpandHelper(event, prefix, aList, w);

    }

    //@+node:felix.20260412000219.4: *5* abbrev.dynamicExpandHelper
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

        // TODO : USE g.app.gui.get1Arg INSTEAD! (chain up to dynamicExpandHelper1 passing the result as an argument)

        // Protect only prefix2 so tab completion and backspace to work properly.
        // k.setLabelBlue(prefix2, true);
        // k.setLabelBlue(prefix2 + prefix, false);
        // k.get1Arg(event, this.dynamicExpandHelper1, aList, prefix);
        // Signature is: 
        /*
            options: {
            title: string;
            value: string;
            prompt: string;
            placeHolder?: string;
        },
        tabList?: string[]
        */
        return g.app.gui.get1Arg({

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

    //@+node:felix.20260412000219.5: *4* abbrev.getDynamicList (helper)
    /**
     * Return a list of dynamic abbreviations.
     */
    public getDynamicList(w: StringTextWrapper, s: string): string[] {
        if (this.globalDynamicAbbrevs) {
            // Look in all nodes.h
            const items: string[] = [];
            for (const p of this.c.all_unique_positions()) {
                const matches = p.b.match(this.dynaregex);
                if (matches) {
                    items.push(...matches);
                }
            }
            return Array.from(new Set(items.filter(z => z.startsWith(s)))).sort();
        } else {
            // Just look in this node.
            const matches = w.getAllText().match(this.dynaregex);
            const items = matches ? matches.filter(z => z.startsWith(s)) : [];
            return Array.from(new Set(items)).sort();
        }
    }

    //@+node:felix.20260412000224.1: *3* abbrev.static abbrevs
    //@+node:felix.20260412000224.2: *4* abbrev.addAbbrevHelper
    /**
     * Enter the abbreviation 's' into the self.abbrevs dict.
     */
    public addAbbrevHelper(s: string, tag = ''): void {
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
            val = val.replace(/\\n/g, '\n');
            let old: string | null = null;
            [old, tag] = d[name] || [null, null];
            if (old && old !== val && !g.unitTesting) {
                g.es_print(`redefining abbreviation ${name}\nfrom ${JSON.stringify(old)} to ${JSON.stringify(val)}`);
            }
            d[name] = [val, tag];

        } catch (e) {
            g.es_print(`bad abbreviation: ${s} `);
        }
    }

    //@+node:felix.20260412000224.3: *4* abbrev.killAllAbbrevs
    @cmd('abbrev-kill-all', 'Delete all abbreviations.')
    public killAllAbbrevs(): void {
        this.abbrevs = {};
    }

    //@+node:felix.20260412000224.4: *4* abbrev.listAbbrevs
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

    //@+node:felix.20260412000224.5: *4* abbrev.toggleAbbrevMode
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
