# Leo Web Editor

A browser-based version of the Leo Editor, available at [https://boltex.github.io/leo-web/](https://boltex.github.io/leo-web/)

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

- Unlike LeoInteg & LeoJS, Leo-Web cannot access your ~/.leo folder nor its 'myLeoSettings.leo' file. It can only access your chosen workspace.
- A myLeoSettings file can still be used if it is located at the root of your chosen workspace. (_Leo-Web will generate one for you if absent with the 'open myLeoSettings' command_)
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
- Abbreviations

## Contributing

If you would like to modify or build this project yourself, see CONTRIBUTING.md for how to get started.

## Other Leo Editor implementations

To instead work with _files directly inside online repositories_, such as on GitHub and Azure-Repos, use the [LeoJS VSCode extension](https://github.com/boltex/leojs#web-based-development) within VSCode for the web. (It also can run in the desktop version of VSCode for local file editing)

To work with the original Python implementation of Leo integrated into VSCode, use the [LeoInteg VSCode extension](https://github.com/boltex/leointeg#-leo-for-visual-studio-code).

## Acknowledgments

See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
or on [github](https://github.com/leo-editor/leo-editor).

### _Special Thanks to_

Edward K. Ream, and to all who have participated, no matter how small or big the contribution, to the creation of the original Leo Editor!

## 🤍 To sponsor, donate or contribute see my [user page 🦁](https://boltex.github.io/)
