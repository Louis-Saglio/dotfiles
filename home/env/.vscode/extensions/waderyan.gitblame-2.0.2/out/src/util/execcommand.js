"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const errorhandler_1 = require("./errorhandler");
function execute(command, options = {}) {
    return new Promise((resolve, reject) => {
        errorhandler_1.ErrorHandler.getInstance().logCommand(command);
        child_process.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                errorhandler_1.ErrorHandler.getInstance().logError(new Error(stderr));
                resolve('');
            }
            else {
                resolve(stdout);
            }
        });
    });
}
exports.execute = execute;
//# sourceMappingURL=execcommand.js.map