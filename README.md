# Leo Web Editor

A browser-based version of the Leo Editor.

Leo is a fundamentally different way of using and organizing data, programs and scripts. [📺 Introduction Video](https://www.youtube.com/watch?v=SYwlfdEukD4)

> See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
> or on [github](https://github.com/leo-editor/leo-editor).

## About

This project is a TypeScript implementation that brings the Leo Editor experience to the web. (_Scriptable in either Javascript or Typescript_) It uses the browser's **File System API** for local file access.

### Commonly Prohibited or Restricted Locations:

- **System Directories:** C:\Windows, C:\Program Files, C:\Program Files (x86).
- **Root Directories:** The root of the C: drive or other fixed drives.
- **User Profiles:** Often directly, Documents, Downloads, Desktop.
- **System Files:** Any folder containing crucial system data or "sensitive" locations.

### How to Overcome Restrictions:

- **Subdirectories:** The API usually allows access to subdirectories within user folders (e.g., Documents/MyProject), just not the top-level restricted folders themselves.

For other usage scenarios, see [other Leo implementations](#other-leo-editor-implementations) for versions that support online repositories, or integrated as VSCode extensions.

## Limitations

- U.I. related settings are accessed in a tab from the log pane instead of the usual 'LeoSettings/myLeoSettings' files.
- To keep Leo-Web light and fast, it does not support .db files.
- Running in the browser, Leo scripts cannot launch OS shell commands.
- Absolute paths are not supported with the browser's file API. Use relative paths exclusively for external files.
- `Ctrl+TAB`, `Ctrl+N` and `Ctrl+T` are reserved by the browser for opening new windows or tabs.
- There is a single log pane, shared across opened Leo documents.
- Leo-Web shares the same core implementation as LeoJS for the web, so the original Leo docutils features are missing.

### Not Yet Implemented

- Nav pane
- \@button pane
- Undo history pane

## Contributing

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Build

1. Clone the repository

```bash
git clone https://github.com/boltex/leo-web.git
```

2. Install dependencies

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

The generated files will be in the `dist/` directory.

### Other Scripts

- `npm run type-check` - Run TypeScript type checking without building
- `npm run clean` - Clean the dist directory

## Other Leo Editor implementations

To instead work with _files directly inside online repositories_, such as on GitHub and Azure-Repos, use the [LeoJS VSCode extension](https://github.com/boltex/leojs#web-based-development) within VSCode for the web. (It also can run in the desktop version of VSCode for local file editing)

To work with the original Python implementation of Leo integrated into VSCode, use the [LeoInteg VSCode extension](https://github.com/boltex/leointeg#-leo-for-visual-studio-code).

## Acknowledgments

See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
or on [github](https://github.com/leo-editor/leo-editor).

### _Special Thanks to_

Edward K. Ream, and to all who have participated, no matter how small or big the contribution, to the creation of the original Leo Editor!

## 🤍 To sponsor, donate or contribute see my [user page 🦁](https://boltex.github.io/)
