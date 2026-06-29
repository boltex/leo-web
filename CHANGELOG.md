# Change Log

## 1.0.32

- Made fonts uniform across all OSes.
- Made some fonts 'pre-load' to prevent flash of unstyled content.

## 1.0.31

- Fixed markdown writer to preserve titles that start with '!'.

## 1.0.30

- Fixed external file outline refresh upon change detection

## 1.0.29

-- Fixed css references

## 1.0.28

- Fixed logo images

## 1.0.27

- Fixed broken links in documentation

## 1.0.26

- Added documentation with docusaurus at /docs/.
- Improved documentation and help commands for the 'Abbreviations' features.
- Improved error messages when writing external files. Mirror of Leo's #4732
- Fixed nav pane 'frozen' state and icon persistence across documents.
- Fixed 'focus-to-...' commands.
- Added show-node-files command as per Leo's #4749

## 1.0.25

- Fixed UI Freeze that happened when loading a leo file with missing external files

## 1.0.24

- Fixed UI freeze that happened when reloading modified opened Leo documents (.leo, .leojs files themselves)

## 1.0.23

- Removed test tree-abbreviation from default settings.

## 1.0.22

- Added 'Copy UNL to clipboard' to the body and outline context-menus.
- Added tooltips to the body pane's UNL and URL links.
- Fixed handleUrlHelper to give focus to the opened browser tab in all circumstances.
- Fixed abbreviation to match the latest Leo implementation of 6.8.9 which uses F3 instead of ',,' for next placeholder selection.
- Added find panel 'history' with up/down arrows to access previous/next used find settings.

## 1.0.21

- Allow .leojs JSON format for "myLeoSettings".
- Fixed 'home' key in body pane to go to the start of non-space characters, or start of line if non before cursor.
- Fixed find-def triggers: ctrl+click on spaces will no longer call find-def.
- Brought back a 'demo;;' abbreviation in leoSettings.leo. (a simple script for now, but may get more complex)

## 1.0.20

- Fixed Java importer as per Leo's #4471

## 1.0.19

- Improved system clipboard permissions handling and messaging.
- Fixed backslashes in replacement strings, as per Leo's #4660

## 1.0.18

- Added select-chapter and select-chapter-main buttons visible only if the outline actually contains @chapter nodes.
- Fixed cff command as per Leo's #4640
- Added quick-find buttons to the NAV pane.

## 1.0.17

- Fixed welcome screen.

## 1.0.16

- Simplified welcome screen.
- Made 'open leoSettings.leo' open as non-dirty.
- Fixed markdown writer.

## 1.0.15

- Fixed build process.

## 1.0.14

- Implemented Leo's abbreviations functionality.
- Fixed arrow key and undo/redo behavior while typing in outline headlines.
- Added welcome screen.

## 1.0.13

- Improved icon font and icons-buttons padding & size.

## 1.0.12

- Fixed bug that occured when reading \@buttons from config at startup (submitted by lewis https://groups.google.com/g/leo-editor/c/ykQY2nw1L8k/m/FrGyCpj4AAAJ)

## 1.0.11

- Fixed behavior of top menu and tab switching by having the mouse pointer-down/up events to navigate.

## 1.0.10

- Fixed showQuickPick dialog and added escape keypress detection to all modal dialogs.
- Fixed minibuffer icons.

## 1.0.9

- Made button-toolbar mouse-scrollable horizontally.
- Added icon buttons for most common commands in toolbar.

## 1.0.8

- Added Leo's 'at-button' features.
- Fixed 'choose new workspace' feature.
- Polished UI behavior and styling.

## 1.0.7

- Added Nav Pane and quickSearch plugin features originally by Ville M. Vainio <vivainio@gmail.com>
- Fixed minibuffer's 'goto-global-line' easter egg command.
- Fixed expand/contract caret animations.

## 1.0.6

- Fixed 'enter' to insert a newline while respecting the indentation of the current line. Fixes [#9](https://github.com/boltex/leo-web/issues/9)
- Improved Undo Pane.

## 1.0.5

- Added undo pane.
- Fixed context menu behavior.
- Added setting to bypass file-update dialogs as per Leo's #4570 and Removed now unused UI file-update settings.

## 1.0.4

- Changed keybinding for clone, promote and demote with positional codes.
- Enabled and Updated key mappings for macOS.

## 1.0.3

- Corrected meta tag.

## 1.0.2

- Modified webmanifest file to set app id to 'leo-web', to offer 'install as app', theme/background colors and to support more platforms.
- Improved external file refreshing logic involving clones as per Leo's #4565.

## 1.0.1

- Fixed 'extract' command to limit finding 'defs' to first line for javascript/typescript.
- Fixed c.deletePositionsInList as per Leo's #4567.
- Inverted icon dirty/clean contrast to match original Leo's standard.

## 1.0.0

- Launched on March 21st 2026!
