# TODO

First steps to make leo-web, which is not a vscode extension and instead uses plain HTML and javascript for the UI, are the following:

- Saved/Loaded config settings should use the browser's local-storage. (Instead of vscode.workspace.getConfiguration or using 'update' method of WorkspaceConfiguration) Also, no need for 'detection' of config change as was the case when in vscode.
