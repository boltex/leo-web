// global.d.ts

export { }; // 👈 important: makes this a module

declare global {
    /**
     * Thenable is a common denominator between ES6 promises, Q, jquery.Deferred, WinJS.Promise,
     * and others.
     */
    interface Thenable<T> extends PromiseLike<T> { }
}