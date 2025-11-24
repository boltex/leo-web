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