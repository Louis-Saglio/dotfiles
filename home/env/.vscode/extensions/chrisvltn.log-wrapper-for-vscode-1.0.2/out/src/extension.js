'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const vscode_1 = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const edit = (insertAfter) => {
        let editor = vscode.window.activeTextEditor;
        let selections = editor.selections;
        var doc = editor.document;
        var wrapper = getWrapper(editor.document.languageId);
        editor.edit(function (edit) {
            for (var x = 0; x < selections.length; x++) {
                let selectedText = doc.getText(new vscode_1.Range(selections[x].start, selections[x].end));
                let selLine = doc.lineAt(selections[x].end.line);
                let insertPos = selLine.range;
                let insertLineText = selLine.text;
                let indentCharactersLine = selections[x].end.line + (insertAfter ? 1 : 0);
                if (insertAfter && getIndentString(indentCharactersLine).length < getIndentString(indentCharactersLine - 1).length)
                    indentCharactersLine--;
                let indent = getIndentString(indentCharactersLine);
                if (insertAfter)
                    edit.replace(insertPos, insertLineText + '\n' + indent + wrapText(selectedText, wrapper));
                else
                    edit.replace(insertPos, indent + wrapText(selectedText, wrapper) + '\n' + insertLineText);
            }
        });
    };
    let disposables = [
        vscode.commands.registerCommand('extension.debugWrapAfter', () => {
            if (canRunCommand())
                edit(true);
        }),
        vscode.commands.registerCommand('extension.debugWrapBefore', () => {
            if (canRunCommand())
                edit(false);
        }),
        vscode.commands.registerCommand('extension.debugWrapMenu', () => {
            if (!canRunCommand())
                return;
            var items = [];
            items.push({ label: "after", description: "Insert debug wrapper after selected line" });
            items.push({ label: "before", description: "Insert debug wrapper before selected line" });
            vscode.window.showQuickPick(items).then(selection => {
                if (!selection)
                    return;
                switch (selection.label) {
                    case 'after':
                        edit(true);
                        break;
                    case 'before':
                        edit(false);
                        break;
                }
            });
        })
    ];
    context.subscriptions.push(disposables[0]);
    context.subscriptions.push(disposables[1]);
    context.subscriptions.push(disposables[2]);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
function canRunCommand() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Open a file first to manipulate text selections');
        return false;
    }
    if (!editor.selections.length) {
        vscode.window.showInformationMessage('Select one or more texts to run this command');
        return false;
    }
    return true;
}
function getIndentString(lineNumber) {
    let doc = vscode.window.activeTextEditor.document;
    if (doc.lineCount > lineNumber && lineNumber >= 0)
        return (doc.lineAt(lineNumber).text.match(/^\s+/) || ['']).shift();
    return '';
}
function getWrapper(lang) {
    let list = vscode.workspace.getConfiguration("debugwrapper.wrappers");
    var wrapper = list[lang.toLowerCase()] || list['default'];
    return wrapper;
}
exports.getWrapper = getWrapper;
function wrapText(selection, wrapper) {
    return wrapper
        .replace(/\$eSEL/g, selection.replace(/(\"|')/g, "\\$1")).replace(/\$SEL/g, selection);
}
exports.wrapText = wrapText;
//# sourceMappingURL=extension.js.map