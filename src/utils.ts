
import { Uri, workspace } from "./workspace";
// import { Position } from "./core/leoNodes";
type Position = any;

// String and other types/structures helper functions, along with common vscode API calls

/**
 * Throttle function execution to limit how often it can be called
 * @param func Function to throttle
 * @param limit Minimum time between calls in milliseconds
 * @returns Throttled version of the function
 */
export function throttle<T extends any[]>(func: (...args: T) => void, limit: number) {
    let lastCall = 0;
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: T): void => {
        const now = Date.now();
        if (timeout) {
            clearTimeout(timeout);
        }
        if (now - lastCall >= limit) {
            lastCall = now;
            func(...args);
        } else {
            timeout = setTimeout(() => {
                lastCall = Date.now();
                func(...args);
            }, limit - (now - lastCall));
        }
    };
}
/**
 * Safely access localStorage.getItem with error handling
 */
export function safeLocalStorageGet(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}
/**
 * Safely access localStorage.setItem with error handling
 */
export function safeLocalStorageSet(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // ignore
    }
}
export function showHtmlInNewTab(htmlContent: string, title: string) {
    const newWindow = window.open('', '_blank');
    if (newWindow) {

        // Check current theme and set colors accordingly
        const isDark = workspace.layout.currentTheme === 'dark';
        const bodyBg = isDark ? '#1e1e2e' : '#fff';
        const bodyColor = isDark ? '#cdd6f4' : '#222';
        const preBg = isDark ? '#2a2536' : '#f5f5f5';
        const linkColor = isDark ? '#929bda' : '#0b5ed7';

        newWindow.document.open();
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont,
                            "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 16px;
                line-height: 1.55;
                padding: 1.25rem;
                color: ${bodyColor};
                background: ${bodyBg};
                }

                h1, h2, h3, h4 {
                margin-top: 1.4em;
                }

                pre, code {
                font-family: ui-monospace, SFMono-Regular, Consolas,
                            "Liberation Mono", Menlo, monospace;
                }

                pre {
                background: ${preBg};
                padding: 0.75rem;
                border-radius: 4px;
                overflow-x: auto;
                }

                a {
                color: ${linkColor};
                text-decoration: none;
                }

                a:hover {
                text-decoration: underline;
                }
            </style>
            </head>
            <body>
            ${htmlContent}
            </body>
            </html>
            `);
        newWindow.document.close();
        newWindow.focus();
    }
}

export function showTextDocument(uri: Uri): void {
    // Read the file, and open in a new tab or window
    workspace.fs.readFile(uri).then(data => {
        const text = new TextDecoder().decode(data);
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.title = uri.fsPath.split('/').pop() || 'Document';
            const pre = newWindow.document.createElement('pre');
            pre.textContent = text;
            newWindow.document.body.appendChild(pre);
        }
    }).catch(err => {
        console.error('Error reading file for showTextDocument:', err);
    });
}

/**
 * Prevent default event behavior - useful as event handler
 */
export function preventDefault(e: Event): void {
    e.preventDefault();
}
/**
 * Get the text node and offset at a given global character index within a root node
 */
export function getTextNodeAtIndex(root: Node, index: number): { node: Node; offset: number } | null {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let currentNode = walker.nextNode();
    let remaining = index;

    while (currentNode) {
        const len = currentNode!.nodeValue!.length;
        if (remaining <= len) {
            return { node: currentNode, offset: remaining };
        }
        remaining -= len;
        currentNode = walker.nextNode();
    }
    return null;
}
/**
 * Get the global character offset within a root node for a given text node and offset
 */
export function getGlobalOffset(root: Node, container: Node, offset: number): number {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let total = 0;
    let current: Node | null = walker.nextNode();

    while (current) {
        if (current === container) {
            return total + offset;
        }
        total += current.nodeValue!.length;
        current = walker.nextNode();
    }
    return total;
}
/**
 * Read all entries from a directory handle, returning an array of name/kind/handle objects
 */
export async function readDirectory(dirHandle: FileSystemDirectoryHandle): Promise<Array<{ name: string; kind: 'file' | 'directory'; handle: FileSystemHandle }>> {
    const entries = [];
    for await (const [name, handle] of dirHandle.entries()) {
        entries.push({
            name,
            kind: handle.kind, // "file" or "directory"
            handle
        });
    }
    return entries;
}
/**
 * * window.performace.now browser/node crossover utility
 */
export function performanceNow(): number {
    const w_now = process.hrtime();
    const [w_secs, w_nanosecs] = w_now;
    return w_secs * 1000 + Math.floor(w_nanosecs / 1000000);
}

/**
 * * Unique numeric Id
 */
var uniqueId: number = 0;

/**
 * * Get new uniqueID
 */
export function getUniqueId(): string {
    const id = uniqueId++;
    return id.toString();
}

export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * * Build a string for representing a number that's 2 digits wide, padding with a zero if needed
 * @param p_number Between 0 and 99
 * @returns a 2 digit wide string representation of the number, left padded with zeros as needed.
 */
export function padNumber2(p_number: number): string {
    return ("0" + p_number).slice(-2);
}

/**
 * Convert Leo's internal filetype descriptions array
 * to vscode's option format for open/save dialogs.
 */
export function convertLeoFiletypes(p_filetypes: [string, string][]): { [name: string]: string[] } {
    /*
        from :
            [
                ["", ""],
                ["Leo files", "*.leojs *.leo *.db"]
                ['C/C++ files', '*.c'],
                ['C/C++ files', '*.cpp'],
                ['C/C++ files', '*.h'],
                ['C/C++ files', '*.hpp'],
                ['Images', '*.png *.jpg'],
                ['TypeScript', '*.ts *.tsx']
            ],

        to :
        {
            'Leo files': ['leojs', 'leo', 'db'],
            'C/C++ files': ['c', 'cpp', 'h', 'hpp']
            'Images': ['png', 'jpg']
            'TypeScript': ['ts', 'tsx']
        }
    */

    const w_types: { [name: string]: string[] } = {};
    p_filetypes.forEach(type => {
        const typeName = type[0];
        if (!typeName) {
            return; // Skip empty type names
        }

        // Extract extensions from current entry
        const extensions = type[1].split(" ").map((p_entry) => {
            return p_entry.startsWith("*.") ? p_entry.substring(2) : p_entry;
        }).filter(ext => ext); // Filter out empty strings

        // If type already exists, merge extensions, otherwise create new entry
        if (w_types[typeName]) {
            // Add only extensions that don't already exist in the array
            extensions.forEach(ext => {
                if (!w_types[typeName]!.includes(ext)) {
                    w_types[typeName]!.push(ext);
                }
            });
        } else {
            w_types[typeName] = extensions;
        }
    });
    return w_types;
}
/**
 * * Returns milliseconds between the p_start process.hrtime tuple and p_end (or current call to process.hrtime)
 * @param p_start starting process.hrtime to subtract from p_end or current immediate time
 * @param p_end optional end process.hrtime (or immediate time)
 * @returns number of milliseconds passed since the given start hrtime
 */
export function getDurationMs(p_start: [number, number], p_end?: [number, number]): number {
    if (!p_end) {
        p_end = process.hrtime();
    }
    const w_secs = p_end[0] - p_start[0];
    const w_nanosecs = p_end[1] - p_start[1];

    return w_secs * 1000 + Math.floor(w_nanosecs / 1000000);
}

/**
 * Milliseconds converted into seconds, limiting to two decimals. 
 */
export function getDurationSeconds(p_start: [number, number], p_end?: [number, number]): number {
    return parseFloat((getDurationMs(p_start, p_end) / 1000).toFixed(2));
}
/**
 * * Extracts the file name from a full path, such as "foo.bar" from "/abc/def/foo.bar"
 * @param p_path Full path such as "/var/drop/foo/boo/moo.js" or "C:\Documents and Settings\img\recycled log.jpg"
 * @returns file name string such as "moo.js" or "recycled log.jpg""
 */
export function getFileFromPath(p_path: string): string {
    return p_path.replace(/^.*[\\\/]/, '');
}

export function isAlphaNumeric(str: string): boolean {
    let code: number;
    let i: number;
    let len: number;
    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123) // lower alpha (a-z)
        ) {
            return false;
        }
    }
    return true;
};
/**
 * * Checks if a node would become dirty if it were to now have body content at all
 * @param p_node LeoNode from vscode's outline
 * @param p_newHasBody Flag to signify presence of body content, to be compared with its current state
 * @returns True if it would change the icon with actual body content, false otherwise
 */
export function isIconChangedByEdit(p_node: Position, p_newHasBody: boolean): boolean {
    // hasBody can be undefined so force boolean.
    if (!p_node.isDirty() || (!!p_node.bodyString().length === !p_newHasBody)) {
        return true;
    }
    return false;
}

/**
 * * Checks if a string is formatted as a valid rrggbb color code.
 * @param p_hexString hexadecimal 6 digits string, without leading '0x'
 * @returns True if the string is a valid representation of an hexadecimal 6 digit number
 */
export function isHexColor(p_hexString: string): boolean {
    return typeof p_hexString === 'string'
        && p_hexString.length === 6
        && !isNaN(Number('0x' + p_hexString));
}

/**
 * * Sets a context variable to be used by the UI (e.g. enabling/disabling commands, etc.)
 * @param p_key Key string name such as constants 'leoReady' or 'treeOpened', etc.
 * @param p_value Value to be assigned to the p_key 'key'
 */
export function setContext(p_key: string, p_value: any): Thenable<unknown> {

    // return vscode.commands.executeCommand(Constants.VSCODE_COMMANDS.SET_CONTEXT, p_key, p_value);
    workspace.setContext(p_key, p_value);

    return Promise.resolve();
}

