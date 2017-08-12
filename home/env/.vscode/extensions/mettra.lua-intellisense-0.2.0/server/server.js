/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var fs = require('fs');
var lua_parser = null;
var vscode_languageserver_1 = require('vscode-languageserver');
var InitializeRequest;
(function (InitializeRequest) {
    InitializeRequest.type = { get method() { return 'lua_intellisense/initializeRequest'; } };
})(InitializeRequest || (InitializeRequest = {}));
var PushDocumentsRequest;
(function (PushDocumentsRequest) {
    PushDocumentsRequest.type = { get method() { return 'lua_intellisense/pushDocumentRequest'; } };
})(PushDocumentsRequest || (PushDocumentsRequest = {}));
var ErrorNotSupportedRequest;
(function (ErrorNotSupportedRequest) {
    ErrorNotSupportedRequest.type = { get method() { return 'lua_intellisense/errorNotSupportedRequest'; } };
})(ErrorNotSupportedRequest || (ErrorNotSupportedRequest = {}));
var ReceiveDocumentRequest;
(function (ReceiveDocumentRequest) {
    ReceiveDocumentRequest.type = { get method() { return 'lua_intellisense/receiveDocumentRequest'; } };
})(ReceiveDocumentRequest || (ReceiveDocumentRequest = {}));
var ParseDocuments;
(function (ParseDocuments) {
    ParseDocuments.type = { get method() { return 'lua_intellisense/parseDocuments'; } };
})(ParseDocuments || (ParseDocuments = {}));
var newDocs = [];
var allFileNum = -1;
var parsedAllFiles = false;
var print_con = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a connection for the server. The connection uses Node's IPC as a transport
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
var documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
var workspaceRoot;
connection.onInitialize(function (params) {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', ':']
            }
        }
    };
});
// This handler provides the initial list of the completion items.
connection.onCompletion(function (textDocumentPosition) {
    if (lua_parser == null)
        return [];
    // The pass parameter contains the position of the text document in 
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    var currentDoc = documents.get(textDocumentPosition.textDocument.uri);
    lua_parser.ParseDocument(currentDoc.uri, currentDoc.getText());
    var ret = lua_parser.AutoComplete(currentDoc.uri, textDocumentPosition.position.line, textDocumentPosition.position.character);
    return ret.completion_items;
});
// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(function (item) {
    return item;
});
connection.onDidChangeConfiguration(function () {
});
connection.onRequest(InitializeRequest.type, function () {
    var modulename = "lua_parser/lua_parser_" + process.platform + "_" + process.arch + ".node";
    print_con.console.log("Searching for " + modulename);
    try {
        lua_parser = require(modulename);
    }
    catch (e) {
        print_con.console.log("Not supported! " + e);
        connection.sendRequest(ErrorNotSupportedRequest.type).then();
        return;
    }
    print_con.console.log("Server initialized!");
    connection.sendRequest(PushDocumentsRequest.type).then();
});
connection.onRequest(ReceiveDocumentRequest.type, function (doc) {
    if (lua_parser == null)
        return;
    newDocs.push(doc);
    if (newDocs.length == allFileNum) {
        newDocs.forEach(function (v) {
            lua_parser.ParseDocument(v.name, v.text);
        });
        print_con.console.log("Done parsing all files in the workspace.");
        parsedAllFiles = true;
    }
});
connection.onRequest(ParseDocuments.type, function (v) {
    allFileNum = v;
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map