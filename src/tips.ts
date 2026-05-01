//@+leo-ver=5-thin
//@+node:felix.20260419195952.1: * @file src/tips.ts
//@+<< imports >>
//@+node:felix.20260419200011.1: ** << imports >>
import { TipsEntry } from "./types";

//@-<< imports >>
//@+others
//@+node:felix.20260419200019.1: ** tips
export const tips: TipsEntry[] = [
    {
        title: 'Leo for the Web',
        // description: 'Keyboard shortcuts for editing and navigating the outline.',
        description: '',
        content: `
            <div class="help-column">
                <ul class="config-col shortcuts">
                    <li><span class="subtitle">Create & Rename</span></li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>I</kbd></span> — Insert Node</li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>H</kbd></span> — Edit Headline</li>

                    <li><span class="subtitle">Reorganize</span></li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>U</kbd></span> — Move Up</li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>D</kbd></span> — Move Down</li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>L</kbd></span> — Move Left</li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>R</kbd></span> — Move Right</li>

                    <li><span class="subtitle">Clipboard</span></li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd></span> — Copy Node</li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd></span> — Paste Node</li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd></span> — Cut Node</li>
                </ul>
            </div>
            <div class="help-column">
                <ul class="config-col shortcuts">
                    <li><span class="subtitle">Navigate</span></li>
                    <li><span class="kbd-spacer"><kbd>Arrows</kbd></span> — Navigate Outline</li>
                    <li><span class="kbd-spacer"><kbd>Alt</kbd>+<kbd>Arrows</kbd></span> — Navigate from Body</li>
                    <li><span class="kbd-spacer"><kbd>Alt</kbd>+<kbd>-</kbd></span> — Collapse All</li>

                    <li><span class="subtitle">Search</span></li>
                    <li><span class="kbd-spacer"><kbd>Ctrl</kbd>+<kbd>F</kbd></span> — Start Search</li>
                    <li><span class="kbd-spacer"><kbd>F2</kbd>/<kbd>F3</kbd></span> — Previous/Next Match</li>

                    <li><span class="subtitle">Run Any Command</span></li>
                    <li><span class="kbd-spacer"><kbd>Alt</kbd>+<kbd>X</kbd></span> — Command Palette</li>
                </ul>
            </div>
            `
    }
];
//@-others
//@@language typescript
//@@tabwidth -4
//@-leo
