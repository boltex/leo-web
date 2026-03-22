//@+leo-ver=5-thin
//@+node:felix.20260321195619.1: * @file src/global.d.ts
// global.d.ts

export { }; // 👈 important: makes this a module

declare global {
    /**
     * Thenable is a common denominator between ES6 promises, Q, jquery.Deferred, WinJS.Promise,
     * and others.
     */
    interface Thenable<T> extends PromiseLike<T> { }

}
//@-leo
