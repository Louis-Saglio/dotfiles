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
const Path = require("path");
const FS = require("fs");
const gitBlameShell = require("git-blame");
const errorhandler_1 = require("./util/errorhandler");
const vscode_1 = require("vscode");
const execcommand_1 = require("./util/execcommand");
const gitblame_1 = require("./gitblame");
const gitblamefilebase_1 = require("./gitblamefilebase");
const constants_1 = require("./constants");
const getgitcommand_1 = require("./util/getgitcommand");
class GitBlameFile extends gitblamefilebase_1.GitBlameFileBase {
    constructor(fileName, disposeCallback = () => { }) {
        super(fileName, disposeCallback);
        this.workingOn = null;
        this.workTreePromise = null;
        this.repositoryPromise = null;
        this.properties = vscode_1.workspace.getConfiguration('gitblame');
        this.fileSystemWatcher = this.setupWatcher();
    }
    findGitRepository() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.workTree && this.repository) {
                return;
            }
            this.workTreePromise = this.workTreePromise || this.findWorkTree(this.fileName);
            this.repositoryPromise = this.repositoryPromise || this.findRepository(this.fileName);
            try {
                [this.workTree, this.repository] = yield Promise.all([this.workTreePromise, this.repositoryPromise]);
            }
            catch (err) {
                errorhandler_1.handleErrorToLog(err);
            }
            this.workTreePromise = null;
            this.repositoryPromise = null;
        });
    }
    setupWatcher() {
        const fileWatcherOptions = {
            persistent: false
        };
        return FS.watch(this.fileName.fsPath, fileWatcherOptions, this.handleFileWatchEvent.bind(this));
    }
    handleFileWatchEvent(eventType, fileName) {
        if (eventType === constants_1.FS_EVENT_TYPE_REMOVE) {
            this.dispose();
        }
        else if (eventType === constants_1.FS_EVENT_TYPE_CHANGE) {
            this.changed();
        }
    }
    findRepository(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeGitRevParseCommandInPath('--git-dir', path);
        });
    }
    findWorkTree(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeGitRevParseCommandInPath('--show-toplevel', path);
        });
    }
    executeGitRevParseCommandInPath(command, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDirectory = Path.dirname(path.fsPath);
            const gitCommand = getgitcommand_1.getGitCommand();
            const gitRev = yield execcommand_1.execute(`${gitCommand} rev-parse ${command}`, {
                cwd: currentDirectory
            });
            const cleanGitRev = gitRev.trim();
            if (cleanGitRev === '.git') {
                return Path.join(currentDirectory, '.git');
            }
            else {
                return cleanGitRev;
            }
        });
    }
    blame() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasBlameInfo()) {
                return Promise.resolve(this.blameInfo);
            }
            yield this.findGitRepository();
            this.workingOn = this.workingOn || new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const blameInfo = gitblame_1.GitBlame.blankBlameInfo();
                const gitBlameOptions = {
                    file: this.fileName.fsPath,
                    workTree: this.workTree,
                    rev: false,
                    ignoreWhitespace: this.properties.get('ignoreWhitespace')
                };
                const gitStream = gitBlameShell(this.repository, gitBlameOptions, getgitcommand_1.getGitCommand());
                const gitOver = this.gitStreamOver(gitStream, reject, resolve, blameInfo);
                const gitData = this.gitStreamData(blameInfo);
                gitStream.on('data', gitData);
                gitStream.on('error', gitOver);
                gitStream.on('end', gitOver);
            }));
            return this.workingOn;
        });
    }
    gitStreamData(blameInfo) {
        return (type, data) => {
            if (type === 'line') {
                blameInfo['lines'][data.finalLine] = data;
            }
            else if (type === 'commit') {
                blameInfo['commits'][data.hash] = data;
            }
        };
    }
    gitStreamOver(gitStream, reject, resolve, blameInfo) {
        return (err) => {
            gitStream.removeAllListeners();
            this.workingOn = null;
            if (err) {
                this.blameInfo = gitblame_1.GitBlame.blankBlameInfo();
                reject(err);
            }
            else {
                this.blameInfo = blameInfo;
                resolve(this.blameInfo);
            }
        };
    }
    dispose() {
        this.fileSystemWatcher.close();
        super.dispose();
    }
}
exports.GitBlameFile = GitBlameFile;
//# sourceMappingURL=gitblamefile.js.map