# Leo Web Editor

A browser-based version of the Leo Editor - a structured document editor that allows you to organize your content in a hierarchical outline format.

Leo is a fundamentally different way of using and organizing data, programs and scripts. [📺 Introduction Video](https://www.youtube.com/watch?v=SYwlfdEukD4)

> See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
> or on [github](https://github.com/leo-editor/leo-editor).

## About

This project is a TypeScript implementation that brings the Leo Editor experience to the web with support for local file access.

For other usage scenarios, see ([other Leo implementations](#other-leo-editor-implementations)) for versions that support online repositories, or integrated as VSCode extentions.

## Limitations

To keep Leo-Web light and fast, it does not support .db files.

Absolute paths are not supported with the browser's file api. Use relative paths exclusively for external files.

`Ctrl+N` and `Ctrl+T` are reserved by the browser for opening new windows or tabs.

## Current Features

- Complete UI implementation with outline, log, settings, and find panes
- Leo's core integrated with menu system, keybindings, and mouse controls in the outline
- Full outline pane with node selection, expansion/collapse, marking, and hoisting
- Multiple document support with tabbed interface
- Theme and layout customization
- Drag-to-resize panes with persistent preferences
- Context menus and keyboard shortcuts

### Not Yet Implemented

- Headline editing in the outline pane
- Find/replace functionality

## Contributing

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Build

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

or, to also automatically open a browser loading the app

```bash
npm start
```

This will start the webpack dev server and automatically open the application in your browser at `http://localhost:8080`.

### Building for Production

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Other Scripts

- `npm run type-check` - Run TypeScript type checking without building
- `npm run clean` - Clean the dist directory

## Contributing

This is the beginning of the Leo Web Editor project. Contributions, suggestions, and feedback are welcome!

## Other Leo Editor implementations

To instead work with _files directly inside online repositories_, such as on GitHub and Azure-Repos, use the [LeoJS VSCode extension](https://github.com/boltex/leojs?#web-based-development) within VSCode for the web. (It also can run in the desktop version of VSCode for local file editing)

To work with the original Python implementation of Leo integrated into VSCode, use the [LeoInteg VSCode extension]().

# Acknowledgments

See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
or on [github](https://github.com/leo-editor/leo-editor).

### _Special Thanks to_

All who have participated, no matter how small or big the contribution, to the creation of the original Leo Editor!

## 🤍 To sponsor, donate or contribute see my [user page 🦁](https://boltex.github.io/)
