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