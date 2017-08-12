"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const gitblame_1 = require("./gitblame");
class GitBlameFileBase {
    constructor(fileName, disposeCallback = () => { }) {
        this.blameInfo = null;
        this.workTree = null;
        this.repository = null;
        this.fileName = vscode_1.Uri.file(fileName);
        this.disposeCallback = disposeCallback;
    }
    getGitInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findGitRepository();
            return Promise.resolve({
                workTree: this.workTree,
                repository: this.repository
            });
        });
    }
    findGitRepository() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    hasBlameInfo() {
        return this.blameInfo !== null;
    }
    changed() {
        this.workTree = null;
        this.repository = null;
        this.blameInfo = null;
    }
    blame() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasBlameInfo()) {
                this.blameInfo = gitblame_1.GitBlame.blankBlameInfo();
            }
            return Promise.resolve(this.blameInfo);
        });
    }
    dispose() {
        this.disposeCallback();
    }
}
exports.GitBlameFileBase = GitBlameFileBase;
//# sourceMappingURL=gitblamefilebase.js.map