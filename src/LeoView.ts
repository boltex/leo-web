import { FlatRowLeo } from './types';
import * as utils from './utils';
import { workspace } from './workspace';
import { Position } from './core/leoNodes';
import * as body from './body'


export class LeoView {
    // Elements
    public selectedLabelElement: HTMLSpanElement | null = null; // Track the currently selected label element in the outline pane

    private SPACER: HTMLElement;
    public HEADLINE_INPUT: HTMLInputElement;

    // Find controls
    public FIND_INPUT: HTMLInputElement;
    public REPLACE_INPUT: HTMLInputElement;
    public OPT_HEADLINE: HTMLInputElement;
    public OPT_BODY: HTMLInputElement;
    public OPT_WHOLE: HTMLInputElement;
    public OPT_IGNORECASE: HTMLInputElement;
    public OPT_REGEXP: HTMLInputElement;
    public OPT_MARK_FINDS: HTMLInputElement;
    public OPT_MARK_CHANGES: HTMLInputElement;

    // Nav controls
    public SEARCH_OPTIONS: HTMLSelectElement;
    public IS_TAG: HTMLInputElement;
    public SHOW_PARENT: HTMLInputElement;
    public NAV_TEXT: HTMLInputElement;
    public FREEZE: HTMLElement;
    public GOTO_PANE: HTMLElement;

    public LOG_CONTENT: HTMLElement;

    public LOG_TAB: HTMLDivElement;
    public FIND_TAB: HTMLDivElement;
    public NAV_TAB: HTMLDivElement;
    // public UNDO_TAB: HTMLDivElement; // Maybe add undo tab functionality later
    public SETTINGS_TAB: HTMLDivElement;

    public HTML_ELEMENT: HTMLElement;

    private _flatRowsLeo: FlatRowLeo[] | null = null; // Array of nodes currently visible in the outline pane, null at init time to not trigger render
    public get flatRowsLeo(): FlatRowLeo[] | null {
        return this._flatRowsLeo;
    }
    public setTreeDataLeo(rows: FlatRowLeo[]) {
        this._flatRowsLeo = rows;
        this.renderTree();
    }

    public ROW_HEIGHT = 26;
    private LEFT_OFFSET = 16; // Padding from left edge

    public headlineFinish: (() => void) | null = null; // Force-close any previous headline edit

    private _changeSelectionTimer: ReturnType<typeof setTimeout> | undefined;
    private _changeScrollTimer: ReturnType<typeof setTimeout> | undefined;

    constructor() {

        this.SPACER = document.getElementById("spacer")!;
        this.HEADLINE_INPUT = document.getElementById("headline-input")! as HTMLInputElement;

        // Find controls
        this.FIND_INPUT = document.getElementById('find-input')! as HTMLInputElement;
        this.REPLACE_INPUT = document.getElementById('replace-input')! as HTMLInputElement;
        this.OPT_HEADLINE = document.getElementById('opt-headline')! as HTMLInputElement;
        this.OPT_BODY = document.getElementById('opt-body')! as HTMLInputElement;
        this.OPT_WHOLE = document.getElementById('opt-whole')! as HTMLInputElement;
        this.OPT_IGNORECASE = document.getElementById('opt-ignorecase')! as HTMLInputElement;
        this.OPT_REGEXP = document.getElementById('opt-regexp')! as HTMLInputElement;
        this.OPT_MARK_FINDS = document.getElementById('opt-mark-finds')! as HTMLInputElement;
        this.OPT_MARK_CHANGES = document.getElementById('opt-mark-changes')! as HTMLInputElement;

        // Nav controls
        this.SEARCH_OPTIONS = document.getElementById('searchOptions') as HTMLSelectElement;
        this.IS_TAG = document.getElementById('isTag') as HTMLInputElement;
        this.SHOW_PARENT = document.getElementById('showParents') as HTMLInputElement;
        this.NAV_TEXT = document.getElementById('navText') as HTMLInputElement;
        this.FREEZE = document.getElementById('freeze') as HTMLElement; // Simple div
        this.GOTO_PANE = document.getElementById('gotoPane') as HTMLElement; // Simple div

        // this.LOG_CONTENT = document.getElementById('log-content')!;
        this.LOG_CONTENT = document.getElementById('log-controls')!;

        this.LOG_TAB = document.getElementById('log-tab')! as HTMLDivElement;
        this.FIND_TAB = document.getElementById('find-tab')! as HTMLDivElement;
        this.NAV_TAB = document.getElementById('nav-tab')! as HTMLDivElement;
        // this.UNDO_TAB = document.getElementById('undo-tab')! as HTMLDivElement;
        this.SETTINGS_TAB = document.getElementById('settings-tab')! as HTMLDivElement;

        this.HTML_ELEMENT = document.documentElement;

    }

    // private getNodePath(node: Node): number[] {
    //     const path: number[] = [];
    //     let current: Node | null = node;
    //     while (current && current !== this.BODY_PANE) {
    //         const parent: Node | null = current.parentNode;
    //         if (!parent) break;
    //         const index = Array.prototype.indexOf.call(parent.childNodes, current);
    //         path.unshift(index);
    //         current = parent;
    //     }
    //     return path;
    // }

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

    public positionToNodeOffset(position: body.Position): { node: Node; offset: number } {
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

    public openHeadlineInputBox(node: Position, selectAll?: boolean, selection?: [number, number]): Promise<[string, boolean]> {
        // Force-close any previous headline edit (resolves its pending promise)
        if (this.headlineFinish) {
            this.headlineFinish();
        }

        // Adds an input box element right over the position, overlapping it.
        // (not virtual like the regular nodes) It should exist until enter or escape, or focused-out, and returns the new headline string

        // the node vertical position needs to be calculated similarly to 
        if (!this._flatRowsLeo) {
            console.warn('Headline edit requested but flatRowsLeo is not initialized');
            return Promise.resolve([node.h, false]);  // Not initialized yet, should never happen.
        };

        const index = this._flatRowsLeo.findIndex(row => row.node.__eq__(node));
        if (index === -1) {
            console.warn('Headline edit requested but node not found in flatRowsLeo');
            return Promise.resolve([node.h, false]); // Not found (shouldn't happen)
        }

        const nodeOffsetY = index * this.ROW_HEIGHT;
        const row = this._flatRowsLeo[index]!;
        // Attach an input box to the outline pane at the correct left and top position, pre-filled with the current headline, and focused
        // Accept its content even if escaped or focus-out, we return its content no matter what,
        // and the caller will decide what to do with it (update headline or not)

        return new Promise<[string, boolean]>((resolve) => {
            let leftOffset = this.LEFT_OFFSET;
            if (this._flatRowsLeo!.every(r => !r.hasChildren)) {
                leftOffset = 0;
            }
            const leftPosition = (row.depth * 20) + leftOffset + 16;
            const viewportWidth = workspace.layout.OUTLINE_PANE.clientWidth;

            const input = this.HEADLINE_INPUT;
            input.value = node.h;

            // Dynamic positioning only
            input.style.top = (nodeOffsetY + 6) + "px";
            const left = (leftPosition + 4 + (workspace.menu.SHOW_NODE_ICONS.checked ? 22 : 0));
            input.style.left = left + "px";
            input.style.width = (viewportWidth - left - 19) + "px";

            this.scrollNodeIntoView(node);
            this.HTML_ELEMENT.setAttribute('data-show-headline-edit', 'true');

            setTimeout(() => {
                input.focus();
                if (selection) {
                    input.setSelectionRange(selection[0], selection[1]);
                } else if (selectAll) {
                    input.select();
                } else {
                    // Defaults to placing the cursor at the end.
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }, 0);

            let resolved = false;

            const finish = (blurred?: boolean) => {
                if (resolved) return;
                resolved = true;
                const newHeadline = input.value;
                this.headlineFinish = null;

                this.HTML_ELEMENT.setAttribute('data-show-headline-edit', 'false');

                input.onkeydown = null;
                input.onblur = null;
                resolve([newHeadline, !!blurred]);
            };

            this.headlineFinish = finish;

            input.onkeydown = (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === "Escape") {
                    e.preventDefault();
                    // Prevent keydown from becoming a keypress and triggering keybindings in the outline pane
                    e.stopImmediatePropagation();
                    finish();
                }
            };

            input.onblur = () => {
                finish(true);
            };
        });
    }

    public renderTree = () => {
        const OUTLINE_PANE: HTMLElement = workspace.layout.OUTLINE_PANE;
        if (!this._flatRowsLeo) {
            return; // Not initialized yet
        }
        const flatRows = this._flatRowsLeo!;

        // Render visible rows only
        const scrollTop = OUTLINE_PANE.scrollTop;
        const viewportHeight = OUTLINE_PANE.clientHeight;
        const viewportWidth = OUTLINE_PANE.clientWidth;

        const startIndex = Math.floor(scrollTop / this.ROW_HEIGHT);
        const visibleCount = Math.ceil(viewportHeight / this.ROW_HEIGHT) + 1;
        const endIndex = Math.min(flatRows.length, startIndex + visibleCount);
        let leftOffset = this.LEFT_OFFSET;

        // If all nodes have no children, remove the left offset
        if (flatRows.every(row => !row.hasChildren)) {
            leftOffset = 0;
        }

        this.SPACER.innerHTML = "";
        this.SPACER.style.height = flatRows.length * this.ROW_HEIGHT + "px";
        for (let i = startIndex; i < endIndex; i++) {
            const row = flatRows[i]!;
            const div = document.createElement("div");
            div.className = "node";

            if (row.label) {
                div.title = row.label;
            }

            // Apply classes based on computed properties from controller
            if (row.isSelected) {
                div.classList.add("selected");
            }
            if (row.isAncestor) {
                div.classList.add("ancestor");
            }
            if (row.isInitialFind) {
                div.classList.add("initial-find");
            }

            div.style.top = (i * this.ROW_HEIGHT) + "px";
            div.style.height = this.ROW_HEIGHT + "px";

            const leftPosition = (row.depth * 20) + leftOffset;
            div.style.left = leftPosition + "px";
            div.style.width = (viewportWidth - leftPosition) + "px";

            const caret = document.createElement("span");
            caret.className = row.toggled ? "caret toggled" : "caret";

            if (row.hasChildren) {
                caret.setAttribute("data-expanded", row.isExpanded ? "true" : "false");
            }
            div.appendChild(caret);

            const labelSpan = document.createElement("span");
            labelSpan.className = "node-text";

            // Apply icon class from computed property
            labelSpan.classList.add("icon" + row.icon);

            labelSpan.textContent = row.label;
            if (row.isSelected) {
                this.selectedLabelElement = labelSpan;
            }

            div.appendChild(labelSpan);
            this.SPACER.appendChild(div);
        }
        // Update headline input width if it's currently visible
        if (this.HTML_ELEMENT.getAttribute('data-show-headline-edit') === 'true') {
            const inputLeft = parseFloat(this.HEADLINE_INPUT.style.left);
            if (!isNaN(inputLeft)) {
                this.HEADLINE_INPUT.style.width = (viewportWidth - inputLeft) - 19 + "px";
            }
        }
    }

    public updateNodeIcons = () => {
        this.HTML_ELEMENT.setAttribute('data-show-icons', workspace.menu.SHOW_NODE_ICONS.checked ? 'true' : 'false');
        this.renderTree(); // Re-render to apply icon changes
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

    public scrollNodeIntoView(node: Position) {
        const OUTLINE_PANE = workspace.layout.OUTLINE_PANE;
        if (!this._flatRowsLeo) return; // Not initialized yet

        const index = this._flatRowsLeo.findIndex(row => row.node.__eq__(node));
        if (index === -1) return; // Not found (shouldn't happen)
        const nodeOffsetY = index * this.ROW_HEIGHT;

        const scrollTop = OUTLINE_PANE.scrollTop;
        const viewportHeight = OUTLINE_PANE.clientHeight;

        if (nodeOffsetY < scrollTop) {
            OUTLINE_PANE.scrollTop = nodeOffsetY;
        } else if (nodeOffsetY + this.ROW_HEIGHT > scrollTop + viewportHeight) {
            OUTLINE_PANE.scrollTop = nodeOffsetY - viewportHeight + this.ROW_HEIGHT;
        }
    }

    public highlightMatchInHeadline(startIndex: number, endIndex: number) {
        // Use the global selectedLabelElement which is already set after selectAndOrToggleAndRedraw
        if (!this.selectedLabelElement) return;
        // Find the first text node in the label element
        let textNode = null;
        for (const node of this.selectedLabelElement.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNode = node;
                break;
            }
        }
        if (!textNode) return;
        try {
            const range = document.createRange();
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, endIndex);

            const selection = window.getSelection()!;
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            console.error('Error setting headline selection:', e);
        }
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

    public showTab(tabName: string) {
        // Set HTML_ELEMENT attributes. CSS rules will show/hide tabs based on these.
        this.HTML_ELEMENT.setAttribute('data-active-tab', tabName);
    }

    public addToLogPane(message: string, replace = false) {
        // const p = document.createElement('p');
        // p.textContent = message;
        // this.LOG_CONTENT.appendChild(p);
        // this.LOG_CONTENT.scrollTop = this.LOG_CONTENT.scrollHeight;

        // * Add to text content instead of creating elements for performance
        if (replace) {
            this.LOG_CONTENT.textContent = message + (message ? '\n' : '');
        } else {
            this.LOG_CONTENT.textContent += message + '\n';
        }
        this.LOG_CONTENT.scrollTop = this.LOG_CONTENT.scrollHeight;
    }

    // * Getters 
    public getFindScopeRadios(): NodeListOf<HTMLInputElement> {
        return document.querySelectorAll('input[name="find-scope"]');
    }

}