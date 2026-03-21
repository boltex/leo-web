//@+leo-ver=5-thin
//@+node:felix.20251210234451.1: * @file src/declarations.d.ts
//@@language typescript
//@@tabwidth -4

// ambient module declaration for https://www.npmjs.com/package/date-format-lite
declare module "date-format-lite" { }

// date-format-lite augments built-in Date
interface Date {
    format: (format?: string) => string;
    masks: { default: string };
}
//@-leo
