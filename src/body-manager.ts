import * as utils from './utils';
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

/**
 * Body Manager is responsible for managing the body pane, which includes rendering the body text, handling user interactions
 * (selection, scroll, input), and providing an API for the controller to manipulate the body content and state.
 */
export class BodyManager {

    private _changeSelectionTimer: ReturnType<typeof setTimeout> | undefined;
    private _changeScrollTimer: ReturnType<typeof setTimeout> | undefined;

    private _bodyPane!: HTMLElement;

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
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') {
                this._lineStarts.push(i + 1);
            }
        }
        this._lineStartsDirty = false;
    }

    private _offsetToPositionFast(offset: number): body.Position {

        let low = 0;
        let high = this._lineStarts.length - 1;

        while (low <= high) {
            const mid = (low + high) >> 1;

            if (this._lineStarts[mid] <= offset) {
                if (mid === this._lineStarts.length - 1 || this._lineStarts[mid + 1] > offset) {
                    const line = mid;
                    const character = offset - this._lineStarts[mid];
                    return new body.Position(line, character);
                }
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return new body.Position(0, offset);
    }

    // Helper method to convert DOM offset to Position
    private offsetToPosition(offset: number, node: Node | null): body.Position {
        if (!node) return new body.Position(0, 0);

        const beforeNode = this._getOffsetToNode(node);
        const totalOffset = beforeNode + offset;

        return this._offsetToPositionFast(totalOffset);

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



    private _getOffsetToNode(node: Node): number {
        const walker = document.createTreeWalker(
            this._bodyPane,
            NodeFilter.SHOW_TEXT,
            { acceptNode: (n) => n.parentElement?.classList.contains(SENTINEL_CLASS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }
        );
        let count = 0;
        let current;
        while (current = walker.nextNode()) {
            if (current === node) break;
            count += current.textContent?.length ?? 0;
        }
        return count;
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
                const rect = range.getBoundingClientRect();
                BODY_PANE.scrollTop = rect.top + BODY_PANE.scrollTop - BODY_PANE.clientHeight / 2;
            }
        }
    }

    private positionToNodeOffset(position: body.Position): { node: Node; offset: number } {
        // Convert body.Position (line/character) to a DOM node and offset within BODY_PANE
        const BODY_PANE = this._bodyPane;
        const lineStarts = this._getLineStarts();
        const line = Math.min(position.line, lineStarts.length - 1);
        const charCount = lineStarts[line] + position.character;

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

    public setEditorTouchedCallback(callback: (change: { type: string; content: string | null }) => void) {
        const BODY_PANE = this._bodyPane;

        BODY_PANE.addEventListener('input', (e) => {
            const inputEvent = e as InputEvent;
            this._lineStartsDirty = true;
            this._ensureSentinel();
            callback({
                type: inputEvent.inputType,
                content: inputEvent.data
            });
        });

        BODY_PANE.addEventListener('paste', (e) => {
            const clipboardEvent = e as ClipboardEvent;
            const plainText = clipboardEvent.clipboardData?.getData('text/plain') ?? null;

            // When contentEditable is "true" (Firefox fallback), the browser
            // would insert rich HTML. Prevent that and insert plain text instead.
            if (BODY_PANE.contentEditable === "true") {
                e.preventDefault();
                if (plainText) {
                    document.execCommand('insertText', false, plainText);
                }
            }
            this._lineStartsDirty = true;
            this._ensureSentinel();
            callback({
                type: 'paste',
                content: plainText
            });
        });
        BODY_PANE.addEventListener('cut', (e) => {
            const clipboardEvent = e as ClipboardEvent;
            this._lineStartsDirty = true;
            this._ensureSentinel();
            callback({
                type: 'cut',
                content: clipboardEvent.clipboardData?.getData('text/plain') ?? null
            });
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

        const anchorPos = this.offsetToPosition(domSelection.anchorOffset, domSelection.anchorNode);
        const activePos = this.offsetToPosition(domSelection.focusOffset, domSelection.focusNode);

        return new body.Selection(anchorPos, activePos);
    }

    private renderHighlightedBody(text: string, language: string): void {

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

        // * non-highlighted version, for experiments.
        // text = this._escapeBodyText(text);
        // this._bodyPane.innerHTML = text;

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

    private _escapeBodyText(text: string): string {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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