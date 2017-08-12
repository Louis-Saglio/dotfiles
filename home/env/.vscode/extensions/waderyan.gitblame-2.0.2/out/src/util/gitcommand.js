"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const FS = require("fs");
const vscode_1 = require("vscode");
const errorhandler_1 = require("./errorhandler");
const constants_1 = require("../constants");
function getGitCommand() {
    const gitConfig = vscode_1.workspace.getConfiguration('git');
    const command = gitConfig.get('path', constants_1.GIT_COMMAND_IN_PATH) || constants_1.GIT_COMMAND_IN_PATH;
    if (command === constants_1.GIT_COMMAND_IN_PATH) {
        return command;
    }
    const commandPath = Path.normalize(command);
    const isCommandPathThere = FS.existsSync(commandPath);
    const isCommandExecutable = isCommandPathThere ? FS.accessSync(commandPath, FS.constants.X_OK) : false;
    if (isCommandExecutable) {
        return commandPath;
    }
    else {
        errorhandler_1.ErrorHandler.getInstance().logError(new Error(`Can not execute "${commandPath}" (your git.path property) falling back to "${constants_1.GIT_COMMAND_IN_PATH}"`));
        return constants_1.GIT_COMMAND_IN_PATH;
    }
}
exports.getGitCommand = getGitCommand;
//# sourceMappingURL=gitcommand.js.map