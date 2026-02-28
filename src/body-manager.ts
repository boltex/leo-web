import * as utils from './utils';
import { workspace } from './workspace';
import * as body from './body'

/**
 * Body Manager is responsible for managing the body pane, which includes rendering the body text, handling user interactions
 * (selection, scroll, input), and providing an API for the controller to manipulate the body content and state.
 */
export class BodyManager {

    private _changeSelectionTimer: ReturnType<typeof setTimeout> | undefined;
    private _changeScrollTimer: ReturnType<typeof setTimeout> | undefined;

    public HTML_ELEMENT: HTMLElement;

    constructor() {

        this.HTML_ELEMENT = document.documentElement;

    }

    public setChangeTextEditorSelectionCallback(callback: (selection: body.Selection) => void) {
        const handleSelectionChange = () => {

            if (this._changeSelectionTimer) {
                clearTimeout(this._changeSelectionTimer);
            }

            this._changeSelectionTimer = setTimeout(() => {
                const domSelection = document.getSelection();
                if (!domSelection || domSelection.rangeCount === 0) return;

                // Check if the selection is within the BODY_PANE
                const range = domSelection.getRangeAt(0);
                if (!workspace.layout.BODY_PANE.contains(range.commonAncestorContainer)) {
                    return; // Selection is not in the body pane
                }

                // Convert DOM selection to Position/Selection objects
                const anchorPos = this.offsetToPosition(domSelection.anchorOffset, domSelection.anchorNode);
                const activePos = this.offsetToPosition(domSelection.focusOffset, domSelection.focusNode);

                const selection = new body.Selection(anchorPos, activePos);
                callback(selection);
            }, 50); // debounce delay in ms

        };

        // Listen on document, not on BODY_PANE
        document.addEventListener('selectionchange', handleSelectionChange);
    }

    // Helper method to convert DOM offset to Position
    private offsetToPosition(offset: number, node: Node | null): body.Position {
        if (!node) return new body.Position(0, 0);

        const bodyText = workspace.layout.BODY_PANE.innerText;
        const beforeNode = this.getTextBeforeNode(node);
        const totalOffset = beforeNode.length + offset;

        // Convert absolute offset to line/character
        const lines = bodyText.substring(0, totalOffset).split('\n');
        const line = lines.length - 1;
        const character = lines[lines.length - 1].length;

        return new body.Position(line, character);
    }

    private getTextBeforeNode(node: Node): string {
        // Implementation to get all text before the given node within BODY_PANE
        // This is a simplified version - you may need to refine based on your DOM structure
        let text = '';
        const walker = document.createTreeWalker(
            workspace.layout.BODY_PANE,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode === node) break;
            text += currentNode.textContent || '';
        }

        return text;
    }

    public setChangeTextEditorScrollCallback(callback: (event: number) => void) {
        const BODY_PANE = workspace.layout.BODY_PANE;
        BODY_PANE.addEventListener('scroll', (e) => {
            if (this._changeScrollTimer) {
                clearTimeout(this._changeScrollTimer);
            }
            this._changeScrollTimer = setTimeout(() => {

                callback(BODY_PANE.scrollTop);

            }, 100); // debounce delay in ms
        });
    }

    public setBodyScroll(scroll: number) {
        workspace.layout.BODY_PANE.scrollTop = scroll;
    }

    public setBodySelection(selection: body.Selection) {
        // Convert body.Selection to DOM Range and set it in the BODY_PANE
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
        }
    }

    private positionToNodeOffset(position: body.Position): { node: Node; offset: number } {
        const BODY_PANE = workspace.layout.BODY_PANE;
        // Convert body.Position (line/character) to a DOM node and offset within BODY_PANE
        const bodyText = BODY_PANE.innerText;
        const lines = bodyText.split('\n');
        let charCount = 0;
        for (let i = 0; i < position.line; i++) {
            charCount += lines[i].length + 1; // +1 for the newline character
        }
        charCount += position.character;

        // Find the corresponding DOM node and offset
        const walker = document.createTreeWalker(
            BODY_PANE,
            NodeFilter.SHOW_TEXT,
            null
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

        // Fallback to the end of BODY_PANE
        return { node: BODY_PANE, offset: BODY_PANE.childNodes.length };
    }

    public setEditorTouchedCallback(callback: (change: { type: string; content: string | null }) => void) {
        const BODY_PANE = workspace.layout.BODY_PANE;

        BODY_PANE.addEventListener('input', (e) => {
            const inputEvent = e as InputEvent;
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

            callback({
                type: 'paste',
                content: plainText
            });
        });
        BODY_PANE.addEventListener('cut', (e) => {
            const clipboardEvent = e as ClipboardEvent;
            callback({
                type: 'cut',
                content: clipboardEvent.clipboardData?.getData('text/plain') ?? null
            });
        });
    }

    public setBodyFocusOutCallback(callback: () => void) {
        workspace.layout.BODY_PANE.addEventListener('blur', () => {
            callback();
        });
    }

    public setBody(text: string, wrap: boolean) {
        this.setBodyWrap(wrap);

        // Escape the text to prevent HTML injection, <, >, &, etc. but preserve newlines and spaces
        text = this._escapeBodyText(text);

        workspace.layout.BODY_PANE.innerHTML = text;
    }

    public setBodyEditable(editable: boolean) {
        const BODY_PANE = workspace.layout.BODY_PANE;
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
        return workspace.layout.BODY_PANE.textContent || "";
    }

    public highlightMatchInBody(startIndex: number, endIndex: number) {
        const BODY_PANE = workspace.layout.BODY_PANE
        // The body pane content is set directly as textContent, so it's a single text node
        if (!BODY_PANE.firstChild) return;
        try {
            const range = document.createRange();
            const start = utils.getTextNodeAtIndex(BODY_PANE, startIndex);
            const end = utils.getTextNodeAtIndex(BODY_PANE, endIndex);

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