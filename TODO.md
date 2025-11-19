# TODO

First steps to make leo-web, which is not a vscode extension and instead uses plain HTML and javascript for the UI, are the following:

- (#1 PRIORITY) Replace usage of workspace.fs with a custom 'fs' class, which would also ask for permissions if not already set any folders for read/write permissions when trying to use it (e.g. when calling fs.readFile, fs.fileExists, etc.) Keep a singleton of this in each Leo Commander 'Commands' instance, effectively keeping a 'workspace' root handle for each active Leo document.

- Default settings should be json object (maybe copied as is from original LeoJS extension package.json file)

- Saved/Loaded config settings should use the browser's local-storage. (Instead of vscode.workspace.getConfiguration or using 'update' method of WorkspaceConfiguration) Also, no need for 'detection' of config change as was the case when in vscode.

- For 'quick save' state preservation (when the user quits without saving) use browser's indexedDB as it supports saving things that are more than 50mb.

- toggle wrap no-wrap with a class and css variables instead of setting style directly.
