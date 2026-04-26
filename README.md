# ![Leo Editor](https://raw.githubusercontent.com/boltex/leo-web/master/public/leoapp.png) Leo for the Web

A lightweight, browser-based port of the Leo Editor, the iconic outliner and scriptable literate programming environment.

👉 Try it now: https://boltex.github.io/leo-web/

Leo is a fundamentally different way to organize code, notes, and ideas. [📺 Watch the introduction](https://www.youtube.com/watch?v=SYwlfdEukD4)

> See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
> or on [github](https://github.com/leo-editor/leo-editor).

_If you find it useful, please consider [starring it on GitHub](https://github.com/boltex/leo-web "Star it on GitHub")._

## About

Leo-Web brings the core Leo experience to the browser.

- Work with Leo outlines without installing anything
- Script using JavaScript or TypeScript
- Access local files using the browser File System API

### File System Access

Leo-Web uses the browser's File System API. Due to browser security constraints, access is limited to a user-approved _workspace_ directory.

For example:

- You can work inside project folders (e.g., C:/MyProject)
- You cannot access system-level directories or unrestricted root locations. Although access to _subdirectories_ within user folders (e.g., Documents/MyProject) is permitted.

## Limitations

### Browser Constraints

- No access to the original Leo's `~/.leo` settings folder.
- No execution of OS shell commands
- No absolute file paths (relative paths only)
- Some keybindings are reserved by the browser (`Ctrl+TAB`, `Ctrl+N` and `Ctrl+T`)

### Settings

- `myLeoSettings.leo` must be at the root of your chosen workspace
- UI settings are available via the log pane tab

## Contributing

If you would like to modify or build this project yourself, see CONTRIBUTING.md for how to get started.

## Other Leo Editor implementations

For working with _files directly inside online repositories_, such as on GitHub and Azure-Repos, use the [LeoJS VSCode extension](https://github.com/boltex/leojs#web-based-development) within VSCode for the web. (It also can run in the desktop version of VSCode for unrestricted local file editing)

To work with the original Python implementation of Leo integrated into VSCode, use the [LeoInteg VSCode extension](https://github.com/boltex/leointeg#-leo-for-visual-studio-code).

## Acknowledgments

Leo-Web is built on the ideas and work of the original Leo Editor authors:

[leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)

Special thanks to Edward K. Ream and all contributors to Leo.

---

## Support

If you find this project useful, consider supporting or contributing:  
[boltex.github.io](https://boltex.github.io/)
