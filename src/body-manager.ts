import { workspace } from './workspace';
import * as body from './body'
import * as Prism from 'prismjs';
// Css, Html and XML are supported by default, so we don't need to import them explicitly.
// See https://prismjs.com/#supported-languages
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-batch';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markup-templating'; // Needed for php and other templating languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rest';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-typescript';

Prism.hooks.add('before-tokenize', (env) => {
    env.grammar = {
        // @doc/@ ... @code/@c  →  whole block as comment, delimiters as keywords
        'leo-doc-block': {
            pattern: /^(?:@doc|@)(?:[ \t][^\n]*)?\n(?:[\s\S]*?^(?:@code|@c)(?:[ \t][^\n]*)?(?:\n|$)|[\s\S]*)/m,
            greedy: true,
            alias: 'comment',
            inside: {
                'keyword': /^(?:@doc|@code|@c|@)(?:[ \t][^\n]*)?/m
            }
        },
        // @nocolor ... @color  →  same treatment as doc block
        'leo-nocolor-block': {
            pattern: /^@nocolor(?:[ \t][^\n]*)?\n(?:[\s\S]*?^@color(?:[ \t][^\n]*)?(?:\n|$)|[\s\S]*)/m,
            greedy: true,
            alias: 'comment',
            inside: {
                'keyword': /^(?:@nocolor|@color)(?:[ \t][^\n]*)?/m
            }
        },
        // <<section reference>>  →  delimiters as punctuation, name as string
        'leo-section-ref': {
            pattern: /<<[^>\n]+>>/,
            inside: {
                'punctuation': /^<<|>>$/,
                'leo-section-name': {
                    pattern: /\S(?:[^<>]*\S)?/,
                    alias: 'string'
                }
            }
        },
        // @comment and @delims are deprecated — invalid/error color
        'leo-invalid': {
            pattern: /^(?:@comment|@delims)(?=[ \t]|$)/m,
            alias: 'invalid'
        },
        // @language with its argument
        'leo-language': {
            pattern: /^@language[ \t]+(?:batch|c|cplusplus|csharp|css|fortran|fortran90|go|haskell|html|java|javascript|json|julia|latex|lua|makefile|matlab|md|pascal|perl|php|python|rest|ruby|rust|typescript|xml)(?=[ \t]|$)/m,
            alias: 'keyword'
        },
        // All other recognized Leo directives
        'leo-directive': {
            pattern: /^[ \t]*(?:@others|@all)(?=[ \t]|$)|^(?:@encoding|@ignore|@lineending|@path|@pagewidth|@tabwidth|@color|@killcolor|@nocolor|@nocolor-node|@first|@last|@section-delims|@wrap|@nowrap)(?=[ \t]|$)/m,
            alias: 'keyword'
        },
        // Leo UNL: unl:gnx://...#<gnx>  (must be before leo-unl-headline)
        'leo-unl-gnx': {
            pattern: /\bunl:gnx:\/\/[^\r\n#]*#\S*/,
            greedy: true
        },
        // Leo UNL: unl://...#<headline path>
        'leo-unl-headline': {
            pattern: /\bunl:\/\/[^\r\n#]*#[^\r\n]*\S/,
            greedy: true
        },
        // Bare gnx reference: gnx:felix.20251231182235.2  (not inside a unl:gnx: match)
        'leo-unl-gnxonly': {
            pattern: /(?<![:\w])gnx:[\w.]+/,
            greedy: true
        },
        // Standard URLs
        'leo-url': {
            pattern: /\b(?:(?:https?|ftp):\/\/|file:\/\/\/?|mailto:)[^\s<]+/i,
            greedy: true
        },
        ...env.grammar
    };
});

const LANGUAGE_ALIASES: Record<string, string> = {
    shell: "bash",
    sh: "bash",
    restructuredtext: "rest",
    rst: "rest",
    html: "markup",
    xml: "markup"
};

const SENTINEL_CLASS = "leo-sentinel";
const SENTINEL_CHAR = "\u200B";
const MAX_COLOR_LENGTH = 100000; // Max length of text to apply syntax highlighting to, to avoid performance issues.

/**
 * Body Manager is responsible for managing the body pane, which includes rendering the body text, handling user interactions
 * (selection, scroll, input), and providing an API for the controller to manipulate the body content and state.
 */
export class BodyManager {

    private _changeSelectionTimer: ReturnType<typeof setTimeout> | undefined;
    private _changeScrollTimer: ReturnType<typeof setTimeout> | undefined;

    private _correctScrollRAF: number | undefined;
    private _probingRect = false;

    private _bodyPane!: HTMLElement;

    private _textLength = 0;
    private _lineStarts: number[] = [0];
    private _lineStartsDirty = true;

    private _sentinel: HTMLElement | null = null;

    public HTML_ELEMENT: HTMLElement;

    constructor() {

        this.HTML_ELEMENT = document.documentElement;
        this._bodyPane = workspace.layout.BODY_PANE;

        if (!this._bodyPane) {
            throw new Error("Body pane not found");
        }

    }

    private _getLineStarts(): number[] {
        if (this._lineStartsDirty) {
            const text = this.getBody();
            this._textLength = text.length;
            const starts = [0];
            for (let i = 0; i < text.length; i++) {
                if (text[i] === '\n') starts.push(i + 1);
            }
            this._lineStarts = starts;
            this._lineStartsDirty = false;
        }
        return this._lineStarts;
    }

    private _rebuildLineIndex(text: string): void {
        this._lineStarts = [0];
        this._textLength = text.length;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') {
                this._lineStarts.push(i + 1);
            }
        }
        this._lineStartsDirty = false;
    }

    private _offsetToPositionFast(offset: number): body.Position {
        const lineStarts = this._getLineStarts();
        const safeOffset = Math.max(0, Math.min(offset, this._textLength));

        let low = 0;
        let high = lineStarts.length - 1;

        while (low <= high) {
            const mid = (low + high) >> 1;

            if (lineStarts[mid] <= safeOffset) {
                if (mid === lineStarts.length - 1 || lineStarts[mid + 1] > safeOffset) {
                    return new body.Position(mid, safeOffset - lineStarts[mid]);
                }
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return new body.Position(0, safeOffset);
    }

    // Helper method to convert DOM offset to Position
    private offsetToPosition(offset: number, node: Node | null): body.Position {
        if (!node) return new body.Position(0, 0);

        const totalOffset = this._domPointToTextOffset(node, offset);
        return this._offsetToPositionFast(totalOffset);

    }

    private _domPointToTextOffset(node: Node, offset: number): number {
        const range = document.createRange();
        range.setStart(this._bodyPane, 0);
        range.setEnd(node, offset);
        return range.toString().length;
    }


    private _ensureSentinel(): void {
        if (!this._sentinel) {
            this._sentinel = document.createElement("span");
            this._sentinel.className = SENTINEL_CLASS;
            this._sentinel.contentEditable = "false";
            this._sentinel.textContent = SENTINEL_CHAR;
        }
        this._bodyPane.appendChild(this._sentinel);
    }

    public setChangeTextEditorSelectionCallback(callback: (selection: body.Selection) => void) {
        const handleSelectionChange = () => {
            if (this._probingRect) return;

            // check if cursor is in body pane, if not, ignore
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            if (!this._bodyPane.contains(sel.focusNode)) return;


            // Schedule scroll correction for the next frame (after browser's own scroll)
            if (this._correctScrollRAF) {
                cancelAnimationFrame(this._correctScrollRAF);
            }
            this._correctScrollRAF = requestAnimationFrame(() => {
                this._correctCaretScroll();
            });

            if (this._changeSelectionTimer) {
                clearTimeout(this._changeSelectionTimer);
            }
            this._changeSelectionTimer = setTimeout(() => {
                const selection = this.getCurrentBodyPaneSelection();
                if (selection) {
                    callback(selection);
                }
            }, 50); // debounce delay in ms

        };

        // Listen on document, not on BODY_PANE
        document.addEventListener('selectionchange', handleSelectionChange);
    }

    public setCtrlClickLinkCallback(
        callback: (link: string, type: 'url' | 'unl-gnx' | 'unl-headline' | 'unl-gnxonly') => void
    ) {
        this._bodyPane.addEventListener('click', (e) => {
            if (!e.ctrlKey) return;

            const span = (e.target as Element).closest(
                '.token.leo-url, .token.leo-unl-gnx, .token.leo-unl-headline, .token.leo-unl-gnxonly'
            );
            if (!span) return;

            e.preventDefault();
            e.stopPropagation();

            const link = span.textContent ?? '';
            let type: 'url' | 'unl-gnx' | 'unl-headline' | 'unl-gnxonly' = 'url';
            if (span.classList.contains('leo-unl-gnx')) type = 'unl-gnx';
            else if (span.classList.contains('leo-unl-headline')) type = 'unl-headline';
            else if (span.classList.contains('leo-unl-gnxonly')) type = 'unl-gnxonly';

            callback(link, type);
        });
    }

    private _correctCaretScroll(): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        if (!this._bodyPane.contains(sel.focusNode)) return;

        const focusRange = document.createRange();
        focusRange.setStart(sel.focusNode!, sel.focusOffset);
        focusRange.collapse(true);
        const rects = focusRange.getClientRects();
        let rect = rects[0] ?? focusRange.getBoundingClientRect();

        // On empty lines, getClientRects() is empty and getBoundingClientRect() is all zeros.
        // Insert a temporary probe element to get a measurable position.
        if (!rect || (rect.width === 0 && rect.height === 0 && rect.x === 0)) {
            const probe = document.createElement("span");
            probe.textContent = "\u200B";
            this._probingRect = true;
            focusRange.insertNode(probe);
            rect = probe.getBoundingClientRect();
            probe.remove();
            this._probingRect = false;
        }

        const pane = this._bodyPane;
        const paneRect = pane.getBoundingClientRect();
        const H_MARGIN = 8; // comfort margin in px — tune to taste
        const V_MARGIN = 8; // comfort margin in px — tune to taste

        const caretLeft = rect.left - paneRect.left;
        if (caretLeft < H_MARGIN) {
            pane.scrollLeft = Math.max(0, pane.scrollLeft - (H_MARGIN - caretLeft));
        }

        const caretTop = rect.top - paneRect.top;
        if (caretTop < V_MARGIN) {
            pane.scrollTop = Math.max(0, pane.scrollTop - (V_MARGIN - caretTop));
        }

    }

    public setChangeTextEditorScrollCallback(callback: (event: number) => void) {
        this._bodyPane.addEventListener('scroll', (e) => {
            if (this._changeScrollTimer) {
                clearTimeout(this._changeScrollTimer);
            }
            this._changeScrollTimer = setTimeout(() => {

                callback(this._bodyPane.scrollTop);

            }, 100); // debounce delay in ms
        });
    }

    public setBodyScroll(scroll: number) {
        this._bodyPane.scrollTop = scroll;
    }

    public setBodySelection(selection: body.Selection, scrollSelectionIntoView: boolean = false) {
        // Convert body.Selection to DOM Range and set it in the BODY_PANE
        const BODY_PANE = this._bodyPane;
        const { anchor, active } = selection;
        const anchorInfo = this.positionToNodeOffset(anchor);
        const activeInfo = this.positionToNodeOffset(active);

        const selectionObj = window.getSelection();
        if (selectionObj) {
            selectionObj.removeAllRanges();
            // Use setBaseAndExtent to support both forward and backward selections.
            // A DOM Range always requires start <= end, which collapses backward
            // selections. setBaseAndExtent preserves the direction.
            selectionObj.setBaseAndExtent(
                anchorInfo.node, anchorInfo.offset,
                activeInfo.node, activeInfo.offset
            );
            if (scrollSelectionIntoView) {
                const range = selectionObj.getRangeAt(0);
                const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
                const paneRect = BODY_PANE.getBoundingClientRect();
                const targetMid =
                    rect.top - paneRect.top + BODY_PANE.scrollTop + rect.height / 2;

                BODY_PANE.scrollTop = Math.max(0, targetMid - BODY_PANE.clientHeight / 2);
            }
        }
    }

    private positionToNodeOffset(position: body.Position): { node: Node; offset: number } {
        // Convert body.Position (line/character) to a DOM node and offset within BODY_PANE
        const BODY_PANE = this._bodyPane;
        const lineStarts = this._getLineStarts();
        const line = Math.min(position.line, lineStarts.length - 1);
        const charCount = Math.max(
            0,
            Math.min(lineStarts[line] + position.character, this._textLength)
        );

        // Find the corresponding DOM node and offset
        const walker = document.createTreeWalker(
            BODY_PANE,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Check if this text node is inside our sentinel
                    const isSentinel = node.parentElement?.classList.contains(SENTINEL_CLASS);
                    return isSentinel ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let currentNode;
        let accumulatedLength = 0;
        while (currentNode = walker.nextNode()) {
            const nodeLength = currentNode.textContent?.length || 0;
            if (accumulatedLength + nodeLength >= charCount) {
                return { node: currentNode, offset: charCount - accumulatedLength };
            }
            accumulatedLength += nodeLength;
        }

        // Fallback: If we reach the end, find the sentinel and return the position right before it.
        const sentinel = BODY_PANE.querySelector("." + SENTINEL_CLASS);
        if (sentinel) {
            const index = Array.from(BODY_PANE.childNodes).indexOf(sentinel);
            return { node: BODY_PANE, offset: index };
        }

        // Fallback to the end of BODY_PANE
        return { node: BODY_PANE, offset: BODY_PANE.childNodes.length };
    }

    public setEditorTouchedCallback(callback: () => void) {
        const BODY_PANE = this._bodyPane;

        BODY_PANE.addEventListener('input', (e) => {
            if (this._probingRect) return;
            this._lineStartsDirty = true;
            this._ensureSentinel();
            callback();
        });

        BODY_PANE.addEventListener('paste', (e) => {
            if (BODY_PANE.contentEditable !== "true") {
                return;
            }

            const clipboardEvent = e as ClipboardEvent;
            const plainText = clipboardEvent.clipboardData?.getData('text/plain') ?? "";

            e.preventDefault();
            if (plainText) {
                document.execCommand('insertText', false, plainText);
            }
        });

    }

    public setBodyFocusOutCallback(callback: () => void) {
        this._bodyPane.addEventListener('blur', () => {
            callback();
        });
    }

    private getCurrentBodyPaneSelection(): body.Selection | undefined {
        const domSelection = document.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
            return undefined;
        }

        const range = domSelection.getRangeAt(0);
        if (!this._bodyPane.contains(range.commonAncestorContainer)) {
            return undefined;
        }

        if (domSelection.isCollapsed) {
            const pos = this.offsetToPosition(domSelection.anchorOffset, domSelection.anchorNode);
            return new body.Selection(pos, pos);
        }

        const anchorPos = this.offsetToPosition(domSelection.anchorOffset, domSelection.anchorNode);
        const activePos = this.offsetToPosition(domSelection.focusOffset, domSelection.focusNode);

        return new body.Selection(anchorPos, activePos);
    }

    private renderHighlightedBody(text: string, language: string): void {

        if (text.length > MAX_COLOR_LENGTH) {
            this._sentinel = null;
            this._bodyPane.textContent = text;
            this._ensureSentinel();
            return;
        }

        const normalized =
            LANGUAGE_ALIASES[language.toLowerCase()] ??
            language.toLowerCase() ??
            ""; // Default to empty string if language is undefined or doesn't have toLowerCase method

        const grammar = Prism.languages[normalized] ?? Prism.languages.plaintext;

        if (!Prism.languages[normalized]) {
            workspace.dialog.showToast(
                `Unsupported language "${language}", falling back to plain text.`
            );
        }
        this._sentinel = null;  // innerHTML destroyed the old element.
        this._bodyPane.innerHTML = Prism.highlight(text, grammar, normalized);

        this._ensureSentinel();
    }

    public setBodyLanguage(language: string): void {
        let selection;

        // Only grab selection if the body pane is focused, otherwise it might be stale and cause issues after re-rendering.
        if (document.activeElement === this._bodyPane) {
            selection = this.getCurrentBodyPaneSelection();
        }

        this.renderHighlightedBody(this.getBody(), language);

        if (selection) {
            this.setBodySelection(selection, true);
        }
    }

    public setBody(text: string, wrap: boolean, language = "plain"): void {
        this.setBodyWrap(wrap);
        this._rebuildLineIndex(text);
        this.renderHighlightedBody(text, language);
    }

    public setBodyEditable(editable: boolean) {
        const BODY_PANE = this._bodyPane;
        if (editable) {
            // Try plaintext-only first; fall back to true for Firefox
            BODY_PANE.contentEditable = "plaintext-only";
            if (BODY_PANE.contentEditable !== "plaintext-only") {
                BODY_PANE.contentEditable = "true";
            }
        } else {
            BODY_PANE.contentEditable = "false";
        }
    }

    public setBodyWrap(wrap: boolean) {
        this.HTML_ELEMENT.setAttribute('data-body-wrap', wrap ? 'true' : 'false');
    }

    public getBody(): string {
        const text = this._bodyPane.textContent ?? "";
        return text.endsWith(SENTINEL_CHAR) ? text.slice(0, -1) : text;
    }

    private getTextNodeAtIndex(root: Node, index: number): { node: Node; offset: number } | null {
        const SENTINEL_CLASS = "leo-sentinel";

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Ignore text nodes that live inside the sentinel span
                    const isSentinel = node.parentElement?.classList.contains(SENTINEL_CLASS);
                    return isSentinel ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let currentNode = walker.nextNode();
        let remaining = index;

        while (currentNode) {
            const nodeValue = currentNode.nodeValue || "";
            const len = nodeValue.length;
            // If 'remaining' is less than or equal to length, we've found our node.
            if (remaining <= len) {
                return { node: currentNode, offset: remaining };
            }
            remaining -= len;
            currentNode = walker.nextNode();
        }
        return null;
    }

    public highlightMatchInBody(startIndex: number, endIndex: number) {
        const BODY_PANE = this._bodyPane;
        // The body pane content is set directly as textContent, so it's a single text node
        if (!BODY_PANE.firstChild) return;
        try {
            const range = document.createRange();
            const start = this.getTextNodeAtIndex(BODY_PANE, startIndex);
            const end = this.getTextNodeAtIndex(BODY_PANE, endIndex);

            if (!start || !end) {
                console.warn("Invalid range: could not resolve text nodes");
                return;
            }

            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);

            const sel = window.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) {
            console.error('Error setting body selection:', e);
        }
    }

}