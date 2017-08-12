/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const loader = require("./control");
let mLoader = new loader.loader();
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
connection.onInitialize((params) => {
    mLoader.initModels(params.rootPath);
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Full,
            documentSymbolProvider: true,
            definitionProvider: true,
            hoverProvider: true,
            signatureHelpProvider: {
                triggerCharacters: ['(']
            },
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['>', ':']
            },
            executeCommandProvider: {
                commands: ['extension.refreshModel']
            }
        }
    };
});
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    var str;
    for (str of settings.CI.model) {
        mLoader.parseFile(str, 'model');
    }
    for (str of settings.CI.other) {
        mLoader.loadOther(str);
    }
});
documents.onDidOpen((e) => {
    if (e.document.languageId != 'php')
        return;
    mLoader.parseLoader(e.document.getText());
});
documents.onDidSave((e) => {
    if (e.document.languageId != 'php')
        return;
    let uri = e.document.uri;
    let content = e.document.getText();
    mLoader.parseLoader(content);
    if (mLoader.cached_info.has(uri)) {
        let info = mLoader.cached_info.get(uri);
        if (info.kind == null) {
            mLoader.parseConst(content, uri);
        }
        else
            mLoader.parseFile(info.name, info.kind);
    }
});
connection.onExecuteCommand((param) => {
    mLoader.initModels(null);
});
// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition) => {
    return mLoader.complete(textDocumentPosition, documents.get(textDocumentPosition.textDocument.uri).getText());
});
// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (item.kind == vscode_languageserver_1.CompletionItemKind.Class) {
        item.insertText = item.label + '-';
    }
    else if (item.kind == vscode_languageserver_1.CompletionItemKind.Method) {
        item.insertText = item.label + '($1)$0';
        item.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
    }
    return item;
});
connection.onDocumentSymbol((pram) => {
    return mLoader.allFun(documents.get(pram.textDocument.uri));
});
connection.onSignatureHelp((position) => {
    return mLoader.signature(position, documents.get(position.textDocument.uri).getText());
});
connection.onDefinition((position) => {
    return mLoader.definition(position, documents.get(position.textDocument.uri).getText());
});
connection.onHover((position) => {
    return mLoader.hover(position, documents.get(position.textDocument.uri).getText());
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map