"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gitblamefile_1 = require("./gitblamefile");
const gitblamefiledummy_1 = require("./gitblamefiledummy");
const vscode_1 = require("vscode");
function GitBlameFileFactory(fileName, disposeCallback = () => { }) {
    const inWorkspace = fileName.indexOf(vscode_1.workspace.rootPath) === 0;
    if (inWorkspace) {
        return new gitblamefile_1.GitBlameFile(fileName, disposeCallback);
    }
    else {
        return new gitblamefiledummy_1.GitBlameFileDummy(fileName, disposeCallback);
    }
}
exports.GitBlameFileFactory = GitBlameFileFactory;
