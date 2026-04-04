//@+leo-ver=5-thin
//@+node:felix.20260321200500.1: * @file src/outline-manager.ts
//@+<< imports & annotations >>
//@+node:felix.20260323010902.1: ** << imports & annotations >>
import { Constants } from './constants';
import { Position } from './core/leoNodes';
import { FlatRowLeo } from './types';
import { workspace } from './workspace';

export type HeadlineFinishedResult = {
    node: Position;
    blurred: boolean;
    saveSelectionOnly: boolean;
    newHeadline: string;
    selection: [number, number, number];
};
//@-<< imports & annotations >>
//@+others
//@+node:felix.20260323010932.1: ** OutlineManager
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

    private clearToggledTimer: ReturnType<typeof setTimeout> | undefined; // for debouncing the call to clearToggled.
    private firstRenderDone = false; // Flag to track if the first render has been completed, used to control toggled state clearing after initial render.

    public ROW_HEIGHT = 26;
    private LEFT_OFFSET = 16; // Padding from left edge

    public headlineFinish: ((blurred?: boolean, p_saveSelectionOnly?: boolean) => HeadlineFinishedResult | undefined) | null = null; // Force-close any previous headline edit.

    private _headlineFinishedCallback: ((result: HeadlineFinishedResult) => void) | null = null; // Other technique.

    constructor() {
        this.SPACER = document.getElementById("spacer")!;
        this.HEADLINE_INPUT = document.getElementById("headline-input")! as HTMLInputElement;
        this.HTML_ELEMENT = document.documentElement;
    }

    //@+others
    //@+node:felix.20260323011156.1: *3* setEditFinishedCallback
    public setEditFinishedCallback(callback: (result: HeadlineFinishedResult) => void) {
        this._headlineFinishedCallback = callback;
    }
    //@+node:felix.20260323011149.1: *3* updateNodeIcons
    public updateNodeIcons = () => {
        this.HTML_ELEMENT.setAttribute('data-show-icons', workspace.menu.SHOW_NODE_ICONS.checked ? 'true' : 'false');
        this.renderTree(); // Re-render to apply icon changes
    }
    //@+node:felix.20260323011107.1: *3* openHeadlineInputBox
    /**
     * Open an input box for editing the headline of a node.
     * @param node The Position for which to find corresponding outlive view node.
     * @param selectAll select whole (or falsy)
     * @param selection specific selection range (overrides selectAll if provided) its start,end and insertionn point which needs to be compared to to start and end to set direction
     * @returns A promise that resolves to a HeadlineFinishedResult containing the new headline string, a boolean indicating whether the headline was changed, and the last selection state info.
     */
    public openHeadlineInputBox(node: Position, selectAll?: boolean, selection?: [number, number, number]): Promise<HeadlineFinishedResult> {
        // Force-close any previous headline edit (resolves its pending promise)
        if (this.headlineFinish) {
            this.headlineFinish();
        }

        // Adds an input box element right over the position, overlapping it.
        // (not virtual like the regular nodes) It should exist until enter or escape, or focused-out, and returns the new headline string

        // the node vertical position needs to be calculated similarly to 
        if (!this._flatRowsLeo) {
            console.warn('Headline edit requested but flatRowsLeo is not initialized');
            return Promise.resolve({ node, newHeadline: node.h, blurred: false, saveSelectionOnly: false, selection: [0, 0, 0] });  // Not initialized yet, should never happen.
        };

        const index = this._flatRowsLeo.findIndex(row => row.node.__eq__(node));
        if (index === -1) {
            console.warn('Headline edit requested but node not found in flatRowsLeo');
            return Promise.resolve({ node, newHeadline: node.h, blurred: false, saveSelectionOnly: false, selection: [0, 0, 0] }); // Not found (shouldn't happen)
        }

        const nodeOffsetY = index * this.ROW_HEIGHT;
        const row = this._flatRowsLeo[index]!;
        // Attach an input box to the outline pane at the correct left and top position, pre-filled with the current headline, and focused
        // Accept its content even if escaped or focus-out, we return its content no matter what,
        // and the caller will decide what to do with it (update headline or not)

        return new Promise<HeadlineFinishedResult>((resolve) => {

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
                    if (selection[2] === selection[0]) {
                        input.selectionDirection = "backward";
                    } else if (selection[2] === selection[1]) {
                        input.selectionDirection = "forward";
                    }
                } else if (selectAll) {
                    input.select();
                } else {
                    // Defaults to placing the cursor at the end.
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }, 0);

            let resolved = false;

            const finish = (blurred?: boolean, p_saveSelectionOnly?: boolean): HeadlineFinishedResult | undefined => {
                if (resolved) return;
                resolved = true;
                const newHeadline = input.value;
                this.headlineFinish = null;

                this.HTML_ELEMENT.setAttribute('data-show-headline-edit', 'false');

                // Clean up event handlers to prevent memory leaks and unintended behavior in future edits.
                input.onkeydown = null;
                input.onblur = null;

                // * Do a 3 step process to notify both the headline edit initiator and any other interested parties:

                // 1- Call the callback to notify that headline editing is finished, passing the new headline and whether it was blurred.
                if (this._headlineFinishedCallback) {
                    this._headlineFinishedCallback({
                        node: node,
                        newHeadline,
                        blurred: !!blurred,
                        saveSelectionOnly: !!p_saveSelectionOnly,
                        selection: [input.selectionStart || 0, input.selectionEnd || 0, input.selectionDirection === "backward" ? input.selectionStart || 0 : input.selectionEnd || 0]
                    });
                }

                // 2- Resolve the promise to notify the original edit-headline initiator with the new headline, whether it was blurred, and the last selection state.
                resolve({
                    node: node,
                    newHeadline,
                    blurred: !!blurred,
                    saveSelectionOnly: !!p_saveSelectionOnly,
                    selection: [input.selectionStart || 0, input.selectionEnd || 0, input.selectionDirection === "backward" ? input.selectionStart || 0 : input.selectionEnd || 0]
                });

                // 3- Also return the last selection state so the 'finish' caller have access to it and can decide to use it or not 
                return {
                    node: node,
                    newHeadline,
                    blurred: !!blurred,
                    saveSelectionOnly: !!p_saveSelectionOnly,
                    selection: [input.selectionStart || 0, input.selectionEnd || 0, input.selectionDirection === "backward" ? input.selectionStart || 0 : input.selectionEnd || 0]
                };

            };

            this.headlineFinish = finish;

            input.onkeydown = (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === "Escape") {
                    e.preventDefault();
                    // Prevent keydown from becoming a keypress and triggering keybindings in the outline pane
                    e.stopImmediatePropagation();
                    finish();
                }
                // If tab or shift tab, we need to focus on the body pane.
                else if (e.key === "Tab") {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    workspace.controller.doCommand(Constants.COMMANDS.SHOW_BODY);
                    // Loss of focus will trigger the finish function and resolve the promise.
                }

            };

            input.onblur = () => {
                finish(true);
            };
        });
    }
    //@+node:felix.20260404155820.1: *3* clearToggled
    public clearToggled(): void {
        for (const row of this._flatRowsLeo || []) {
            row.toggled = false;
        }
    }

    //@+node:felix.20260323011044.1: *3* renderTree
    public renderTree = () => {
        const OUTLINE_PANE: HTMLElement = workspace.layout.OUTLINE_PANE;
        if (!this._flatRowsLeo) {
            return; // Not initialized yet
        }
        const flatRows = this._flatRowsLeo!;

        // Render visible rows only
        const scrollTop = OUTLINE_PANE.scrollTop;
        const viewportHeight = OUTLINE_PANE.clientHeight;

        const startIndex = Math.floor(scrollTop / this.ROW_HEIGHT);
        const visibleCount = Math.ceil(viewportHeight / this.ROW_HEIGHT) + 1;
        const endIndex = Math.min(flatRows.length, startIndex + visibleCount);
        let leftOffset = this.LEFT_OFFSET;
        let hadToggled = false;

        // If all nodes have no children, remove the left offset
        if (flatRows.every(row => !row.hasChildren)) {
            leftOffset = 0;
        }

        this.SPACER.innerHTML = "";
        this.SPACER.style.height = flatRows.length * this.ROW_HEIGHT + "px";
        // since scrollbars can appear and reduce the viewport width, we need to get it dynamically here after setting the height of its contained spacer.
        const viewportWidth = OUTLINE_PANE.clientWidth;

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
            if (row.toggled && this.firstRenderDone) {
                caret.className = "caret toggled";
                // row.toggled = false; // ! CANNOT DO THIS WAY: scroll may do a double render!
                hadToggled = true; // Use this debounced clearing technique instead.
            } else {
                caret.className = "caret";
            }

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
        if (hadToggled) {
            // Had toggled rows, but we might re-render in the very next moments, so we don't want to clear toggled state yet,
            // but we want to make sure it will be cleared before the next real render to avoid keeping toggled state.
            if (this.clearToggledTimer) {
                clearTimeout(this.clearToggledTimer);
            }
            this.clearToggledTimer = setTimeout(() => {
                this.clearToggled();
            }, 5);
        }
        this.firstRenderDone = true;

    }
    //@+node:felix.20260323011031.1: *3* scrollNodeIntoView
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
    //@+node:felix.20260323011026.1: *3* highlightMatchInHeadline
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
    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4

//@-leo
