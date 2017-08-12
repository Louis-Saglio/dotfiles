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
const valid_url_1 = require("valid-url");
const errorhandler_1 = require("./util/errorhandler");
const vscode_1 = require("vscode");
const gitblame_1 = require("./gitblame");
const view_1 = require("./view");
const textdecorator_1 = require("./textdecorator");
const constants_1 = require("./constants");
class GitBlameController {
    constructor() {
        const disposables = [];
        this.statusBarView = new view_1.StatusBarView(vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left));
        this.gitBlame = new gitblame_1.GitBlame();
        disposables.push(this.statusBarView, this.gitBlame);
        this.setupListeners(disposables);
        this.disposable = vscode_1.Disposable.from(...disposables);
        this.onTextEditorMove();
    }
    setupListeners(disposables) {
        vscode_1.window.onDidChangeActiveTextEditor(this.onTextEditorMove, this, disposables);
        vscode_1.window.onDidChangeTextEditorSelection(this.onTextEditorMove, this, disposables);
    }
    onTextEditorMove() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.statusBarView.update(yield this.gitBlame.getCurrentLineInfo());
            }
            catch (err) {
                errorhandler_1.handleErrorToLog(err);
                this.statusBarView.clear();
            }
        });
    }
    showMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = vscode_1.workspace.getConfiguration('gitblame');
            const messageFormat = config.get('infoMessageFormat');
            const commitInfo = yield this.getCommitInfo();
            if (!commitInfo) {
                return;
            }
            const commitToolUrl = yield this.getToolUrl(commitInfo);
            const message = textdecorator_1.TextDecorator.parseTokens(messageFormat, textdecorator_1.TextDecorator.normalizeCommitInfoTokens(commitInfo));
            const extraAction = commitToolUrl ? constants_1.VIEW_ONLINE_TITLE : null;
            const item = yield vscode_1.window.showInformationMessage(message, extraAction);
            if (item === constants_1.VIEW_ONLINE_TITLE) {
                vscode_1.commands.executeCommand('vscode.open', commitToolUrl);
            }
        });
    }
    blameLink() {
        return __awaiter(this, void 0, void 0, function* () {
            const commitInfo = yield this.getCommitInfo();
            if (!commitInfo) {
                return;
            }
            const commitToolUrl = yield this.getToolUrl(commitInfo);
            if (commitToolUrl) {
                vscode_1.commands.executeCommand('vscode.open', commitToolUrl);
            }
            else {
                vscode_1.window.showErrorMessage('Missing gitblame.commitUrl configuration value.');
            }
        });
    }
    getCommitInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let commitInfo = null;
            try {
                commitInfo = yield this.gitBlame.getCurrentLineInfo();
            }
            catch (err) {
                errorhandler_1.handleErrorToLog(err);
                return;
            }
            if (commitInfo === null || commitInfo.hash === constants_1.EMPTY_GIT_HASH) {
                vscode_1.window.showErrorMessage('The current file and line can not be blamed.');
                return;
            }
            return commitInfo;
        });
    }
    getToolUrl(commitInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = vscode_1.workspace.getConfiguration('gitblame');
            const commitUrl = config.get('commitUrl');
            let parsedUrl = textdecorator_1.TextDecorator.parseTokens(commitUrl, {
                'hash': commitInfo.hash
            });
            if (valid_url_1.isWebUri(parsedUrl)) {
                return vscode_1.Uri.parse(parsedUrl);
            }
            else {
                vscode_1.window.showErrorMessage('Malformed URL in setting gitblame.commitUrl. Must be a valid web url.');
                return null;
            }
        });
    }
    dispose() {
        this.disposable.dispose();
    }
}
exports.GitBlameController = GitBlameController;
//# sourceMappingURL=controller.js.map