"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gitblamefilebase_1 = require("./gitblamefilebase");
class GitBlameFileDummy extends gitblamefilebase_1.GitBlameFileBase {
    constructor(fileName, disposeCallback = () => { }) {
        super(fileName, disposeCallback);
    }
}
exports.GitBlameFileDummy = GitBlameFileDummy;
//# sourceMappingURL=gitblamefiledummy.js.map