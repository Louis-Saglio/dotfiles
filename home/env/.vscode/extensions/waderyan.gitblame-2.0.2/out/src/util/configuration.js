"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
var Properties;
(function (Properties) {
    Properties["CommitUrl"] = "commitUrl";
    Properties["IgnoreWhitespace"] = "ignoreWhitespace";
    Properties["InfoMessageFormat"] = "infoMessageFormat";
    Properties["LogLevel"] = "logLevel";
    Properties["ProgressSpinner"] = "progressSpinner";
    Properties["StatusBarMessageFormat"] = "statusBarMessageFormat";
    Properties["StatusBarMessageNoCommit"] = "statusBarMessageNoCommit";
})(Properties = exports.Properties || (exports.Properties = {}));
function getProperty(name, defaultValue) {
    const properties = vscode_1.workspace.getConfiguration('gitblame');
    return properties.get(name, defaultValue);
}
exports.getProperty = getProperty;
//# sourceMappingURL=configuration.js.map