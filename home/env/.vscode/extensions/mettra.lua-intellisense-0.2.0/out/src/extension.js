/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var fs = require('fs');
var path = require('path');
var vscode = require('vscode');
var vscode_1 = require('vscode');
var vscode_languageclient_1 = require('vscode-languageclient');
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
function activate(context) {
    // The server is implemented in node
    var serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    // The debug options for the server
    var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    var serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    // Options to control the language client
    var clientOptions = {
        // Register the server for lua documents
        documentSelector: ['lua'],
        synchronize: {
            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: 'lua-intellisense',
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    var client = new vscode_languageclient_1.LanguageClient("ID", 'Lua Intellisense', serverOptions, clientOptions);
    var v;
    client.onReady().then(function () {
        client.onRequest(PushDocumentsRequest.type, function () {
            vscode_1.workspace.findFiles("**/*.lua", "").then(function (value) {
                client.sendRequest(ParseDocuments.type, value.length).then();
                value.forEach(function (uri) {
                    fs.readFile(uri.fsPath, function (err, data) {
                        var d = { name: uri.toString(), text: data.toString() };
                        client.sendRequest(ReceiveDocumentRequest.type, d).then();
                    });
                });
            });
        });
        client.onRequest(ErrorNotSupportedRequest.type, function () {
            vscode.window.showErrorMessage("Unfortunately, lua-intellisense does not support your operating system or cpu architecture.");
        });
        console.log("Registered!");
        client.sendRequest(InitializeRequest.type, v).then();
    });
    // Create the language client and start the client.
    var disposable = client.start();
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//Error handler
process.on('uncaughtException', function (exception) {
    // handle or ignore error
    console.log(exception);
});
//# sourceMappingURL=extension.js.map