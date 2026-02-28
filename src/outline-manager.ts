import { Position } from './core/leoNodes';
import { FlatRowLeo } from './types';
import { workspace } from './workspace';

/**
 * Outline Manager renders only the visible portion of the tree and provides a responsive UI for headline editing.
 * It receives the flat list of visible nodes (flatRowsLeo) from the controller, which computes it based on the current tree state and user interactions.
 */
export class OutlineManager {

    public selectedLabelElement: HTMLSpanElement | null = null; // Track the currently selected label element in the outline pane

    public HTML_ELEMENT: HTMLElement;

    private SPACER: HTMLElement;
    public HEADLINE_INPUT: HTMLInputElement;

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

    constructor() {
        this.SPACER = document.getElementById("spacer")!;
        this.HEADLINE_INPUT = document.getElementById("headline-input")! as HTMLInputElement;
        this.HTML_ELEMENT = document.documentElement;

    }

    public updateNodeIcons = () => {
        this.HTML_ELEMENT.setAttribute('data-show-icons', workspace.menu.SHOW_NODE_ICONS.checked ? 'true' : 'false');
        this.renderTree(); // Re-render to apply icon changes
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

}
