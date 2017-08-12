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
const errorhandler_1 = require("./util/errorhandler");
const gitblamefilefactory_1 = require("./gitblamefilefactory");
const editorvalidator_1 = require("./util/editorvalidator");
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
class GitBlame {
    constructor() {
        this.files = {};
        this.blamed = {};
    }
    getBlameInfo(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.files[fileName]) {
                this.files[fileName] = gitblamefilefactory_1.GitBlameFileFactory.create(fileName, this.generateDisposeFunction(fileName));
            }
            try {
                return yield this.files[fileName].blame();
            }
            catch (err) {
                errorhandler_1.handleErrorToLog(err);
            }
            return Promise.resolve(GitBlame.blankBlameInfo());
        });
    }
    getCurrentLineInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (editorvalidator_1.isActiveEditorValid()) {
                return this.getLineInfo(vscode_1.window.activeTextEditor.document.fileName, vscode_1.window.activeTextEditor.selection.active.line);
            }
        });
    }
    getLineInfo(fileName, lineNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const commitLineNumber = lineNumber + 1;
            const blameInfo = yield this.getBlameInfo(fileName);
            if (blameInfo['lines'][commitLineNumber]) {
                const hash = blameInfo['lines'][commitLineNumber]['hash'];
                return blameInfo['commits'][hash];
            }
            else {
                return null;
            }
        });
    }
    generateDisposeFunction(fileName) {
        return () => {
            delete this.files[fileName];
        };
    }
    dispose() {
        vscode_1.Disposable.from(...Object.values(this.files)).dispose();
        this.files = {};
    }
    static blankBlameInfo() {
        return {
            'commits': {},
            'lines': {}
        };
    }
    static blankCommitInfo() {
        const emptyAuthor = {
            name: '',
            mail: '',
            timestamp: 0,
            tz: ''
        };
        return {
            hash: constants_1.EMPTY_GIT_HASH,
            author: emptyAuthor,
            committer: emptyAuthor,
            summary: '',
            filename: ''
        };
    }
}
exports.GitBlame = GitBlame;
//# sourceMappingURL=gitblame.js.map