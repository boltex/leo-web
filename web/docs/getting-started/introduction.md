---
sidebar_position: 1
---

# Introduction

Leo-Web is a lightweight, browser-based port of the Leo Editor, the iconic outliner and scriptable literate programming environment.

👉 Try it now: [https://boltex.github.io/leo-web](https://boltex.github.io/leo-web/)

- Work with Leo outlines without installing anything
- Script using JavaScript or TypeScript
- Access local files using the browser File System API

Leo is a fundamentally different way to organize code, notes, and ideas.

> See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
> or on [github](https://github.com/leo-editor/leo-editor).
## Web-Based Development

Leo-Web uses the browser's File System API. 

Due to browser security constraints, access is limited to a user-approved _workspace_ directory. For example:

- You can work inside project folders (e.g., C:/MyProject)
- You cannot access system-level directories or unrestricted root locations. Although access to _subdirectories_ within user folders (e.g., Documents/MyProject) is permitted.

### Browser Constraints

- No absolute file paths (relative paths only)
- No access to the original Leo's `~/.leo` settings folder
- No execution of OS shell commands
- Some keybindings are reserved by the browser (`Ctrl+TAB`, `Ctrl+N` and `Ctrl+T`)
### User Settings

- `myLeoSettings.leo` or `myLeoSettings.leojs` must be at the root of your chosen workspace
- UI settings are available via the log pane tab

## Features

-   UI controls: Available in the explorer view and a standalone sidebar, such as the **Leo Outline**, **body pane**, **opened documents selector** along with a **Log Window**.
-   **Detached Body Panes**, independent of the selected node, can be opened with the 'Open Aside' command.
-   Keybindings that match those of the Leo editor, including arrow keys behavior for outline keyboard navigation.
-   **Derived files change detection**. See [External Files](#external-files) below for more details
-   **Scriptable in Javascript and Typescript**. All commands and scripts have easy access to outline structure via a simple Javascript API
-   **'@button' panel** for [creating your own commands with @buttons](tutorial-basics.md#button-and-command-nodes)
-   **Find panel** that reacts to Leo's typical keybindings like `Ctrl+F`, `F2` and `F3` when focus is in the outline or body pane
-   **Nav and Tag panel** search controls are integrated in the Find panel
-   **Undo History panel**, showing all actions and allowing going back, or forward, to any undo states.

![LeoJS UI](img/small-hero-docs-montage.png#center)

## Leo Commands

LeoJS offers an extensive set of commands, accessible through a variety of interfaces — toolbar buttons, dedicated menus, and intuitive keybindings. Those commands are also discoverable via the Visual Studio Code Command Palette with **`Ctrl+Shift+P`**.

### The Minibuffer

For those familiar with Leo, the 'minibuffer' serves as the nerve center for command execution. Access it through **`Alt+X`** and use the complete set of Leo's commands!

### Context-Aware Keybindings

The keybinding architecture is designed to be context-aware. When your focus is within the LeoJS Body or Outline pane, LeoJS-specific keybindings take precedence. Shift your focus outside these panes, and Visual Studio Code's native keybindings resume control.

## An Outline Editor

Listed here are the most useful commands and their keyboard shortcuts to edit an outline.

| Outline Commands |                                                                  |
| :--------------- | :--------------------------------------------------------------- |
| Undo / Redo      | `Ctrl + Z` &nbsp;&nbsp;/&nbsp;&nbsp; `Ctrl + Shift + Z`          |
| Insert Node      | `Ctrl + I` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Shift + Insert`         |
| Insert Child     | `Ctrl + Insert`                                                  |
| Edit Headline    | `Ctrl + H`                                                       |
| Mark / Unmark    | `Ctrl + M`                                                       |
| Copy Node        | `Ctrl + Shift + C`                                               |
| Cut Node         | `Ctrl + Shift + X`                                               |
| Paste Node       | `Ctrl + Shift + V`                                               |
| Delete Node      | `Ctrl + Shift + Backspace` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Delete` |
| Clone Node       | `Ctrl + Backtick`                                               |
| Promote / Demote | `Ctrl + {` &nbsp;&nbsp;_and_&nbsp;&nbsp; `Ctrl + }`              |

| Moving Nodes       |                                                                 |
| :----------------- | :-------------------------------------------------------------- |
| Move Outline Up    | `Ctrl + U` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Shift [+ Alt] + Up`    |
| Move Outline Down  | `Ctrl + D` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Shift [+ Alt] + Down`  |
| Move Outline Left  | `Ctrl + L` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Shift [+ Alt] + Left`  |
| Move Outline Right | `Ctrl + R` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Shift [+ Alt] + Right` |

_Move-Outline commands need the `Alt` key modifier only when focus is on body pane._

| Changing Focus                  |                                                   |
| :------------------------------ | :------------------------------------------------ |
| Toggle focus Outline/Body       | `Ctrl + T`                                        |
| Focus on Body (from outline)    | `Tab` &nbsp;&nbsp;_or_&nbsp;&nbsp; `Enter`        |

## External Files

Use either of the **Save Leo Document**, **Write File Nodes** or **Write Dirty Files** commands to derive external files for any type of **@file** nodes.

| @\<file\> Kind | Sentinels | @others | .leo Data | Write Only |
| :------------- | :-------: | :-----: | :-------: | :--------: |
| @asis          |    ❌     |   ❌    |    ✔️     |     ✔️     |
| @auto          |    ❌     |   ✔️    |    ❌     |     ❌     |
| @clean         |    ❌     |   ✔️    |    ✔️     |     ❌     |
| @edit          |    ❌     |   ❌    |    ❌     |     ❌     |
| @file          |    ✔️     |   ✔️    |    ❌     |     ❌     |
| @nosent        |    ❌     |   ✔️    |    ✔️     |     ✔️     |

You can also create most of those nodes by using the context menu in vscode's explorer or file editors, and choosing the **Import into LeoJS Outline** command.

The **Go to Line In LeoJS Outline** command is also available in the editor context menu to find a specific line in the outline. It will offer to import the file if no type of **@file** nodes are found in the outline for that file.

Leo will detect external file changes, and will ask to either **refresh from disk** or **ignore the changes**. 

See the [LeoJS extension settings](#extension-settings) to decide how and when to refresh and synchronize content when external files are modified:

![External File Change Detected](img/external-files-change-detection.png#center)

## Extension Settings

**Open the command palette `Ctrl+Shift+P` and start typing `LeoJS settings` to access its _welcome & settings_ screen**

> _(Changes are auto-saved to the user's profile after 0.5 seconds)_

-   Control the visibility of the outline pane in the explorer view.
-   Decide how and when to refresh and synchronize content when external files are modified.
-   Show additional icons on outline nodes (Move, delete, mark, copy, paste...)
-   Choose to either focus on the body pane, or keep focus in the outline when a node is selected.

## Navigating a Leo Document

Arrow keys, home/end, page up/down are used for basic navigation. But in order to **find and goto specific nodes directly**, use the methods described below:

### Goto Anywhere Command

The **`Ctrl+P`** keybinding allows you to switch to any node directly by typing (part of) its headline.

### Find Panel

With the focus in Leo's outline or body pane, Hit **`Ctrl+F`** to open the Find tab of the _find panel_.

![Find Panel](img/new-find-panel.png#center)

Enter your search pattern directly in the **\<find pattern here\>** field. Press **`Enter`** to find the first match starting from your current position.

Hitting **`F3`** repeatedly will find the subsequent matches. (**`F2`** for previous matches)

Using the Nav tab of the _find panel_, (**`Ctrl+Shift+F`** to accesss directly) you can type your search pattern in the **Nav** field instead to see all results appear below. This will show the headlines as you type.

![Find Panel](img/new-nav-panel-2.png#center)

Press **`Enter`** to freeze the results and show results **also found in body text** of any node. This will add a snowflake icon ❄️ to the **Nav** field.

![Find Panel](img/new-nav-panel-3.png#center)

If you check the **Tag** option, the **Nav** field is then used to find nodes by their tag 🏷 _ua_ (user attribute).

## Undo Panel

Use the undo / redo icons above the outline or above the undo pane itself. You can also right-click on an undo step to directly switch to that specific state!

![Undo pane](img/undo-pane.gif#center)
