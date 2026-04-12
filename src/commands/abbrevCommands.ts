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
    init_abbrev(): void {

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
    public init_env(): void {
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
        /*
        c = self.c
        hidden_root = c.fileCommands.getPosFromClipboard(tree_s)
        if not hidden_root:
            g.trace('no pasted node')
            return
        for p in hidden_root.children():
            for s in g.splitLines(p.b):
                if s.strip() and not s.startswith('#'):
                    abbrev_name = s.strip()
                    # #926: Allow organizer nodes by searching all descendants.
                    for child in p.subtree():
                        if child.h.strip() == abbrev_name:
                            abbrev_s = c.fileCommands.outline_to_clipboard_string(child)
                            d[abbrev_name] = abbrev_s
                            break
                    else:
                        g.trace(f"no definition for {abbrev_name}")
        */

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
    public expandAbbrev(event: Event, stroke: KeyboardEvent): boolean {

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
        let new_i: number, tag: string, word: string, val: string;
        tag = '';
        word = '';
        val = '';
        new_i = i;
        for (const prefix of prefixes) {
            [new_i, tag, word, val] = this.match_prefix(ch, i, j, prefix, s);
            if (word) {
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
        c.abbrev_subst_env['_abr'] = word;
        if (tag === 'tree') {
            this.root = p.copy();
            this.last_hit = p.copy();
            this.expand_tree(w, i, j, val, word);
            c.undoer.clearAndWarn('tree-abbreviation');
        } else {
            // Never expand a search for text matches.
            const place_holder = val.includes('__NEXT_PLACEHOLDER');
            const expand_search = place_holder && !!(this.last_hit && this.last_hit.v);
            if (!expand_search) {
                this.last_hit = null;
            }
            this.expand_text(w, i, j, val, word, expand_search);
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
        /*
        c = self.c
        # Do #438: Search for placeholder in headline.
        s = p.h
        if do_placeholder or c.abbrev_place_start and c.abbrev_place_start in s:
            new_s, i, j = self.next_place(s, offset=0)
            if i is not None:
                p.h = new_s
                c.redraw(p)
                c.editHeadline()
                w = c.edit_widget(p)
                w.setSelectionRange(i, j, insert=j)
                return True
        s = p.b
        if do_placeholder or c.abbrev_place_start and c.abbrev_place_start in s:
            new_s, i, j = self.next_place(s, offset=0)
            if i is None:
                return False
            w = c.frame.body.wrapper
            switch = p != c.p
            if switch:
                c.selectPosition(p)
            else:
                scroll = w.getYScrollPosition()
            w.setAllText(new_s)
            p.v.b = new_s
            if switch:
                c.redraw()
            w.setSelectionRange(i, j, insert=j)
            if switch:
                w.seeInsertPoint()
            else:
                # Keep the scroll point if possible.
                w.setYScrollPosition(scroll)
                w.seeInsertPoint()
            c.bodyWantsFocusNow()
            return True
        # #453: do nothing here.
        # c.frame.body.forceFullRecolor()
        # c.bodyWantsFocusNow()
        return False
        */

        return false; // TODO: Implement.

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
        return [val, false]; // temporary
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
    }

    //@+node:felix.20260412000214.9: *4* abbrev.match_prefix
    /**
     * A match helper.
     */
    public match_prefix(
        ch: string, i: number, j: number, prefix: string, s: string
    ): [number, string, string, string] {
        /*
        i = j - len(prefix)
        word = g.checkUnicode(prefix) + g.checkUnicode(ch)
        tag = 'tree'
        val = self.tree_abbrevs_d.get(word)
        if not val:
            val, tag = self.abbrevs.get(word, (None, None))
        if val:
            # Require a word match if the abbreviation is itself a word.
            if ch in ' \t\n':
                word = word.rstrip()
            if word.isalnum() and word[0].isalpha():
                if i == 0 or s[i - 1] in ' \t\n':
                    pass
                else:
                    i -= 1
                    word, val = None, None  # 2017/03/19.
        else:
            i -= 1
            word, val = None, None
        return i, tag, word, val
        */
        return [0, '', '', '']; // Dummy.
    }

    //@+node:felix.20260412000214.10: *4* abbrev.next_place
    /**
     * Given string s containing a placeholder like <| block |>,
     * return (s2,start,end) where s2 is s without the <| and |>,
     * and start, end are the positions of the beginning and end of block.
     */
    public next_place(s: string, offset = 0): [string, number, number] {
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
        return [s, 0, 0]; // Dummy.
    }

    //@+node:felix.20260412000214.11: *4* abbrev.replace_selection
    /** 
     * Replace w[i:j] by s.
     */
    public replace_selection(w: StringTextWrapper, i: number, j: number, s?: string): void {
        /*
        p, u = self.c.p, self.c.undoer
        w_name = g.app.gui.widget_name(w)
        bunch = u.beforeChangeBody(p)
        if i == j:
            abbrev = ''
        else:
            abbrev = w.get(i, j)
            w.delete(i, j)
        if s is not None:
            w.insert(i, s)
        if w_name.startswith('head'):
            pass  # Don't set p.h here!
        else:
            # Fix part of #438. Don't leave the headline.
            p.v.b = w.getAllText()
            u.afterChangeBody(p, 'Abbreviation', bunch)
        # Adjust self.save_sel & self.save_ins
        if s is not None and self.save_sel is not None:
            i, j = self.save_sel
            ins = self.save_ins
            delta = len(s) - len(abbrev)
            self.save_sel = i + delta, j + delta
            self.save_ins = ins + delta
        */
    }

    //@+node:felix.20260412000214.12: *4* abbrev_get_ch
    /**
     * Get the ch from the stroke.
     */
    public get_ch(event: Event, stroke: KeyboardEvent, w: StringTextWrapper): string {
        /*
        ch = g.checkUnicode(event and event.char or '')
        if self.expanding:
            return None
        if w.hasSelection():
            return None
        assert g.isStrokeOrNone(stroke), stroke
        if stroke in ('BackSpace', 'Delete'):
            return None
        d = {'Return': '\n', 'Tab': '\t', 'space': ' ', 'underscore': '_'}
        if stroke:
            ch = d.get(stroke.s, stroke.s)
            if len(ch) > 1:
                if (
                    stroke.find('Ctrl+') > -1 or
                    stroke.find('Alt+') > -1 or
                    stroke.find('Meta+') > -1
                ):  # fmt: skip
                    ch = ''
                else:
                    ch = event.char if event else ''
        else:
            ch = event.char
        return ch
        */
        return ''; // TODO
    }

    //@+node:felix.20260412000214.13: *4* abbrev_get_prefixes
    /**
     * Return the prefixes at the current insertion point of w.
     */
    public get_prefixes(w: StringTextWrapper): [string, number, number, string[]] {
        /*
        # New code allows *any* sequence longer than 1 to be an abbreviation.
        # Any whitespace stops the search.
        s = w.getAllText()
        j = w.getInsertPoint()
        i, prefixes = j - 1, []
        while len(s) > i >= 0 and s[i] not in ' \t\n':
            prefixes.append(s[i:j])
            i -= 1
        prefixes = list(reversed(prefixes))
        if '' not in prefixes:
            prefixes.append('')
        return s, i, j, prefixes
        */

        return ['', 0, 0, []]  // Stub.
    }
    //@+node:felix.20260412000219.1: *3* abbrev.dynamic abbreviation...
    //@+node:felix.20260412000219.2: *4* abbrev.dynamicCompletion C-M-/
    @cmd('dabbrev-completion', 'Insert the common prefix of all dynamic abbrev\'s matching the present word. This corresponds to C-M-/ in Emacs.')
    public dynamicCompletion(event?: Event): void {
        /*
        c, p = self.c, self.c.p
        w = self.editWidget(event)
        if not w:
            return
        s = w.getAllText()
        ins = ins1 = w.getInsertPoint()
        if 0 < ins < len(s) and not g.isWordChar(s[ins]):
            ins1 -= 1
        i, j = g.getWord(s, ins1)
        word = w.get(i, j)
        aList = self.getDynamicList(w, word)
        if not aList:
            return
        # Bug fix: remove s itself, otherwise we can not extend beyond it.
        if word in aList and len(aList) > 1:
            aList.remove(word)
        prefix = functools.reduce(g.longestCommonPrefix, aList)
        if prefix.strip():
            ypos = w.getYScrollPosition()
            b = c.undoer.beforeChangeNodeContents(p)
            s = s[:i] + prefix + s[j:]
            w.setAllText(s)
            w.setInsertPoint(i + len(prefix))
            w.setYScrollPosition(ypos)
            c.undoer.afterChangeNodeContents(p, command='dabbrev-completion', bunch=b)
            c.recolor()
        */
    }

    //@+node:felix.20260412000219.3: *4* abbrev.dynamicExpansion M-/ & helper
    @cmd('dabbrev-expands',
        'Inserts the longest common prefix of the word at the cursor. Displays all possible completions if the prefix is the same as the word.'
    )
    public dynamicExpansion(event?: Event): void {
        /*
        w = self.editWidget(event)
        if not w:
            return
        s = w.getAllText()
        ins = ins1 = w.getInsertPoint()
        if 0 < ins < len(s) and not g.isWordChar(s[ins]):
            ins1 -= 1
        i, j = g.getWord(s, ins1)
        # This allows the cursor to be placed anywhere in the word.
        w.setInsertPoint(j)
        word = w.get(i, j)
        aList = self.getDynamicList(w, word)
        if not aList:
            return
        if word in aList and len(aList) > 1:
            aList.remove(word)
        prefix = functools.reduce(g.longestCommonPrefix, aList)
        prefix = prefix.strip()
        self.dynamicExpandHelper(event, prefix, aList, w)
        */
    }

    //@+node:felix.20260412000219.4: *5* abbrev.dynamicExpandHelper
    /**
     * State handler for dabbrev-expands command.
     */
    public dynamicExpandHelper(
        event: Event,
        prefix?: string,
        aList?: string[],
        w?: StringTextWrapper
    ): void {
        /*
        c, k = self.c, self.c.k
        self.w = w
        if prefix is None:
            prefix = ''
        prefix2 = 'dabbrev-expand: '
        c.frame.log.deleteTab('Completion')
        g.es('', '\n'.join(aList or []), tabName='Completion')
        # Protect only prefix2 so tab completion and backspace to work properly.
        k.setLabelBlue(prefix2, protect=True)
        k.setLabelBlue(prefix2 + prefix, protect=False)
        k.get1Arg(event, handler=self.dynamicExpandHelper1, tabList=aList, prefix=prefix)

        */
    }

    /**
     * Finisher for dabbrev-expands.
     */
    public dynamicExpandHelper1(event: Event): void {
        /*
        c, k = self.c, self.c.k
        p = c.p
        c.frame.log.deleteTab('Completion')
        k.clearState()
        k.resetLabel()
        if k.arg:
            w = self.w
            s = w.getAllText()
            ypos = w.getYScrollPosition()
            b = c.undoer.beforeChangeNodeContents(p)
            ins = ins1 = w.getInsertPoint()
            if 0 < ins < len(s) and not g.isWordChar(s[ins]):
                ins1 -= 1
            i, j = g.getWord(s, ins1)
            # word = s[i: j]
            s = s[:i] + k.arg + s[j:]
            w.setAllText(s)
            w.setInsertPoint(i + len(k.arg))
            w.setYScrollPosition(ypos)
            c.undoer.afterChangeNodeContents(p, command='dabbrev-expand', bunch=b)
            c.recolor()
        
        */
    }

    //@+node:felix.20260412000219.5: *4* abbrev.getDynamicList (helper)
    /**
     * Return a list of dynamic abbreviations.
     */
    public getDynamicList(w: StringTextWrapper, s: string): string[] {
        /*
        if self.globalDynamicAbbrevs:
            # Look in all nodes.h
            items = []
            for p in self.c.all_unique_positions():
                items.extend(self.dynaregex.findall(p.b))
        else:
            # Just look in this node.
            items = self.dynaregex.findall(w.getAllText())
        items = sorted(set([z for z in items if z.startswith(s)]))
        return items
        */
        return []; // todo: implement
    }

    //@+node:felix.20260412000224.1: *3* abbrev.static abbrevs
    //@+node:felix.20260412000224.2: *4* abbrev.addAbbrevHelper
    /**
     * Enter the abbreviation 's' into the self.abbrevs dict.
     */
    public addAbbrevHelper(s: string, tag = ''): void {
        /*
        if not s.strip():
            return
        try:
            d = self.abbrevs
            data = s.split('=')
            # Do *not* strip ws so the user can specify ws.
            name = data[0].replace('\\t', '\t').replace('\\n', '\n')
            val = '='.join(data[1:])
            if val.endswith('\n'):
                val = val[:-1]
            val = self.n_regex.sub('\n', val).replace('\\\\n', '\\n')
            old, tag = d.get(
                name,
                (None, None),
            )
            if old and old != val and not g.unitTesting:
                g.es_print(f"redefining abbreviation {name}\nfrom {old!r} to {val!r}")
            d[name] = val, tag
        except ValueError:
            g.es_print(f"bad abbreviation: {s}")
        */
        // TODO !

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
                g.es_print('', `${tag_display}${name}=${val_display}`);
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
