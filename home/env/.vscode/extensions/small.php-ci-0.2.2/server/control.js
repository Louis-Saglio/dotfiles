"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const fs = require("fs");
const parse = require("./parse");
class loader {
    constructor() {
        this.cache = {
            //include functions and class data
            system: new Map(),
            model: new Map(),
            // helper:new Map<string,Map<string,fun>>(),
            library: new Map()
        };
        //include const and static
        this.const = new Map();
        //use for class alias
        this.alias = new Map();
        //use for quick search and display
        this.display = new Map();
        //use for refresh cache when file changed
        this.cached_info = new Map();
        this.cache.system.set('input', null);
        this.cache.system.set('db', null);
        this.cache.system.set('load', null);
    }
    allFun(document) {
        let uri = document.uri;
        let content = document.getText();
        let res = [];
        var data = parse.parse.functions(content);
        for (var i of data) {
            res.push({
                name: i.name, kind: vscode_languageserver_1.SymbolKind.Method,
                location: { uri: uri,
                    range: i.Range
                }
            });
        }
        return res;
    }
    complete(textDocumentPosition, text) {
        let words = parse.parse.getWords(text, textDocumentPosition.position);
        let res = [];
        let isStatic = loader.re.isStatic.exec(words);
        if (isStatic) {
            var claName = isStatic[1];
            if (claName.toLowerCase() == 'self') {
                var claInfo = this.cached_info.get(textDocumentPosition.textDocument.uri);
                if (!claInfo) {
                    this.parseConst(text, textDocumentPosition.textDocument.uri);
                    claInfo = this.cached_info.get(textDocumentPosition.textDocument.uri);
                    if (!claInfo)
                        return res;
                }
                claName = claInfo.claName;
            }
            let constData = this.getConstByClaname(claName);
            for (var [key, val] of constData) {
                res.push({ label: key, kind: vscode_languageserver_1.CompletionItemKind.Field, detail: val.value, documentation: val.document });
            }
            return res;
        }
        let chain = words.split('->');
        if (chain.length == 1)
            return res;
        let token = chain[chain.length - 2];
        if (token.indexOf(')') >= 0) {
            if (chain[1] == 'db') {
                token = token.slice(0, -2);
                if (!this.cache.system.get('db'))
                    this.parseFile('db', 'system');
                var fun = this.cache.system.get('db').funs.get(token);
                if (fun) {
                    token = (fun.ret == 'DB_query_builder') ? 'db' : fun.ret;
                }
                else
                    return res; //no chain in DB_result
            }
            else
                return res; //now we only search db for method chaining
        }
        if (token.endsWith('$this')) {
            let l;
            let t;
            l = this.cache.system.keys();
            for (t of l) {
                if (t != 'CI_DB_result')
                    res.push({ label: t, kind: vscode_languageserver_1.CompletionItemKind.Class, detail: 'system class', data: textDocumentPosition });
            }
            for (var [name, type] of this.display) {
                res.push({
                    label: name, kind: vscode_languageserver_1.CompletionItemKind.Class, data: textDocumentPosition,
                    detail: type + ' ' + (this.alias.has(name) ? this.alias.get(name) : name)
                });
            }
            l = parse.parse.functions(text);
            var item;
            for (item of l) {
                if (!item.name.startsWith('__'))
                    res.push({
                        label: item.name, kind: vscode_languageserver_1.CompletionItemKind.Method, data: textDocumentPosition,
                        detail: 'method ' + item.name
                    });
            }
        }
        else {
            token = this.alias.has(token) ? this.alias.get(token) : token;
            var funs, kind;
            for (kind in this.cache) {
                if (this.cache[kind].has(token)) {
                    funs = this.cache[kind].get(token);
                    if (funs === null) {
                        try {
                            funs = this.parseFile(token, kind);
                        }
                        catch (error) {
                            return res;
                        }
                    }
                    else
                        funs = funs.funs.keys();
                    break;
                }
            }
            if (typeof funs == 'undefined')
                return res;
            else {
                let t;
                for (t of funs) {
                    res.push({ label: t, kind: vscode_languageserver_1.CompletionItemKind.Method, detail: `${kind} ${token}` });
                }
            }
        }
        return res;
    }
    signature(textDocumentPosition, text) {
        let words = parse.parse.getWords(text, textDocumentPosition.position, parse.wordsType.signature);
        var arr = words.split(parse.parse.paramDeli);
        words = arr.shift();
        let params = arr.join('');
        var t = parse.parse.cleanParam(params);
        if (t.complete == parse.completeType.over)
            return null;
        else
            params = t.param;
        arr = words.split('->');
        let claName = arr[1];
        claName = this.alias.has(claName) ? this.alias.get(claName) : claName;
        let method = arr.pop();
        let toRet = {
            signatures: [],
            activeSignature: 0,
            activeParameter: params.split(',').length - 1
        };
        method = method.substring(0, method.indexOf('('));
        let data;
        let cla = this.getClassInfo(claName);
        data = cla && cla.data.funs.get(method);
        if (!data)
            return null;
        var lable = method + '(';
        arr = [];
        for (var item of data.param) {
            arr.push(item.label);
        }
        lable += arr.join(',') + ')';
        let signature = { label: lable, parameters: data.param };
        toRet.signatures = [signature];
        return toRet;
    }
    definition(textDocumentPosition, text) {
        let words = parse.parse.getWords(text, textDocumentPosition.position, parse.wordsType.half);
        let isStatic = loader.re.isStatic.exec(words);
        if (isStatic) {
            var claName = isStatic[1];
            if (claName.toLowerCase() == 'self') {
                var claInfo = this.cached_info.get(textDocumentPosition.textDocument.uri);
                if (!claInfo) {
                    this.parseConst(text, textDocumentPosition.textDocument.uri);
                    claInfo = this.cached_info.get(textDocumentPosition.textDocument.uri);
                    if (!claInfo)
                        return null;
                }
                claName = claInfo.claName;
            }
            let constData = this.getConstByClaname(claName);
            if (constData.has(isStatic[2])) {
                var data = constData.get(isStatic[2]);
                return data.location;
            }
            return null;
        }
        let arr = words.split('->');
        if (arr.length == 1 || arr[0] != '$this')
            return null;
        else if (arr.length == 2) {
            let data = this.getClassInfo(arr[1]);
            if (data && data.data.classData) {
                return data.data.classData.location;
            }
            else {
                if (!arr[1].endsWith('()'))
                    return null;
                let fun = arr[1].slice(0, -2);
                let funs = parse.parse.functions(text);
                for (var x of funs) {
                    if (x.name == fun) {
                        return { uri: textDocumentPosition.textDocument.uri, range: x.Range };
                    }
                }
            }
        }
        else if (arr.length == 3) {
            let data = this.getClassInfo(arr[1]);
            if (!data)
                return null;
            let token = arr[2];
            if (!token.endsWith('()'))
                return null;
            token = token.slice(0, -2);
            let info = data.data.funs.get(token);
            return info ? info.location : null;
        }
        else {
            if (arr[1] != 'db')
                return null;
            let method = arr.pop();
            if (!method.endsWith('()'))
                return null;
            method = method.slice(0, -2);
            let data = this.getClassInfo('db');
            let info = data.data.funs.get(method) || this.cache.system.get('CI_DB_result').funs.get(method);
            return info ? info.location : null;
        }
    }
    hover(textDocumentPosition, text) {
        let words = parse.parse.getWords(text, textDocumentPosition.position, parse.wordsType.half);
        words = words.split(parse.parse.paramDeli)[0];
        let arr = words.split('->');
        if (arr.length < 3)
            return null;
        let claName = arr[1];
        claName = this.alias.has(claName) ? this.alias.get(claName) : claName;
        let method = arr.pop();
        method = method.substring(0, method.indexOf('('));
        let data;
        let cla = this.getClassInfo(claName);
        data = cla && cla.data.funs.get(method);
        if (!data)
            return null;
        return { contents: data.document };
    }
    initModels(root) {
        if (root != null) {
            loader.root = root;
        }
        let path = loader.root + '/application/models/';
        this.cache.model = new Map();
        this._initModels(path, '');
    }
    _initModels(root, dir) {
        let that = this;
        let path = root + dir;
        fs.readdir(path, function (err, files) {
            if (err)
                return;
            for (let file of files) {
                if (file.endsWith('.php')) {
                    file = dir + file.slice(0, -4);
                    that.cache.model.set(file, null);
                    if (dir == '') {
                        //add to display if it is in root folder
                        var name = parse.parse.modFirst(file, false);
                        that.display.set(name, 'model');
                        if (name != file)
                            that.alias.set(name, file);
                    }
                    // file = that._setAlise(file);
                    // that.cache.model.set(file, null);
                }
                else if (!file.endsWith('html')) {
                    that._initModels(root, dir + file + '/');
                }
            }
        });
    }
    //deal with $this->load
    parseLoader(content) {
        let match = null;
        while ((match = loader.re.loader.exec(content)) != null) {
            if (match[1] == 'model' || match[1] == 'library') {
                var a = match[2].split(',');
                let name = a[0].trim().slice(1, -1);
                let alias;
                if (a.length == 1 && this.cache[match[1]].has(name))
                    continue; //no alias, has loaded
                if (match[1] == 'model') {
                    if (a.length > 1) {
                        //has alias
                        alias = a[1].trim().slice(1, -1);
                        this._setAlise(name, alias);
                    }
                    else {
                        alias = this._setAlise(name);
                    }
                }
                else {
                    if (a.length >= 3) {
                        alias = a.pop().trim();
                        if (alias.match(/^['"](.+?)['"]$/)) {
                            //has alias
                            alias = alias.slice(1, -1);
                            this._setAlise(name, alias);
                        }
                        else {
                            alias = this._setAlise(name);
                        }
                    }
                    else {
                        alias = this._setAlise(name);
                    }
                }
                this.display.set(alias, match[1]);
                if (this.alias.has(alias))
                    name = this.alias.get(alias);
                if (!this.cache[match[1]].get(name)) {
                    this.parseFile(name, match[1]);
                }
            }
        }
    }
    _setAlise(name, alias = name) {
        if (name.indexOf('/') >= 0) {
            //model is in a directory. alias the name
            var arr = name.split('/');
            var fileName = arr.pop();
            alias = alias == name ? fileName : alias;
            name = arr.join('/') + '/' + parse.parse.modFirst(fileName);
            this.alias.set(alias, name);
        }
        else {
            name = parse.parse.modFirst(name);
            if (alias != name)
                this.alias.set(alias, name);
        }
        return alias;
    }
    //load file in setting-other
    loadOther(str) {
        let path = loader.root + '/' + str;
        let content = fs.readFileSync(path, { encoding: 'utf-8' });
        this.parseConst(content, parse.parse.path2uri(path));
    }
    parseConst(content, path) {
        var data = parse.parse.parseConst(content, path);
        data.forEach((v, k) => {
            this.const.set(k, v);
        });
        if (data.size > 0) {
            if (this.cached_info.has(path)) {
                var ori = this.cached_info.get(path);
                ori.claName = data.keys().next().value;
                this.cached_info.set(path, ori);
            }
            else
                this.cached_info.set(path, { kind: null, claName: data.keys().next().value });
        }
    }
    //parse file to collect info
    parseFile(name, kind) {
        let path = loader.root;
        if (this.alias.has(name))
            name = this.alias.get(name);
        let dir = name.split('/');
        let fileName = dir.pop();
        fileName = fileName[0].toUpperCase() + fileName.substring(1);
        dir.push(fileName);
        let filePath = dir.join('/') + '.php';
        switch (kind) {
            case 'system':
                if (name == 'db') {
                    //load DB_result
                    let retData = parse.parse.parseFile(path + '/system/database/DB_result.php');
                    let qb_db = parse.parse.parseFile(path + '/system/database/drivers/mysql/mysql_result.php').funs;
                    let db = retData.funs;
                    let classData = retData.classData;
                    qb_db.forEach((v, k) => {
                        db.set(k, v);
                    });
                    this.cache[kind].set('CI_DB_result', {
                        funs: db,
                        classData: classData
                    });
                    //load DB_query_builder + DB_driver, with mysql_driver
                    db = parse.parse.parseFile(path + '/system/database/DB_driver.php').funs;
                    retData = parse.parse.parseFile(path + '/system/database/DB_query_builder.php');
                    qb_db = retData.funs;
                    classData = retData.classData;
                    qb_db.forEach((v, k) => {
                        db.set(k, v);
                    });
                    qb_db = parse.parse.parseFile(path + '/system/database/drivers/mysql/mysql_driver.php').funs;
                    qb_db.forEach((v, k) => {
                        db.set(k, v);
                    });
                    this.cache[kind].set(name, {
                        funs: db,
                        classData: classData
                    });
                    //for method chaining
                    this.alias.set('CI_DB_query_builder', 'db');
                    return Array.from(db.keys());
                }
                else if (name == 'load') {
                    path += '/system/core/Loader.php';
                }
                else
                    path += '/system/core/' + filePath;
                break;
            case 'model':
                path += '/application/models/' + filePath;
                break;
            case 'library':
                try {
                    fs.accessSync(path + '/system/libraries/' + filePath);
                    path += '/system/libraries/' + filePath;
                }
                catch (error) {
                    path += '/application/libraries/' + filePath;
                }
                break;
            default:
                return [];
        }
        let data = parse.parse.parseFile(path);
        data.consts.forEach((v, k) => {
            this.const.set(k, v);
        });
        delete data.consts;
        this.cache[kind].set(name, data);
        path = parse.parse.path2uri(path);
        if (this.cached_info.has(path)) {
            var ori = this.cached_info.get(path);
            ori.kind = kind;
            ori.name = name;
            this.cached_info.set(path, ori);
        }
        else
            this.cached_info.set(path, { kind: kind, name: name });
        return Array.from(data.funs.keys());
    }
    getClassInfo(claName) {
        if (this.alias.has(claName))
            claName = this.alias.get(claName);
        for (var kind in this.cache) {
            if (this.cache[kind].has(claName)) {
                var claData = this.cache[kind].get(claName);
                if (!claData)
                    this.parseFile(claName, kind);
                claData = this.cache[kind].get(claName);
                return claData ? {
                    data: claData,
                    kind: kind
                } : null;
            }
        }
        return null;
    }
    getConstByClaname(className) {
        if (this.const.has(className))
            return this.const.get(className);
        else {
            //maybe the class is model. It has not been parsed yet
            for (var kind in this.cache) {
                if (this.cache[kind].has(className)) {
                    var claData = this.cache[kind].get(className);
                    if (!claData)
                        this.parseFile(className, kind);
                    return this.const.has(className) ? this.const.get(className) : new Map();
                }
            }
            return new Map();
        }
    }
}
//root of the workspace
loader.root = '';
loader.re = {
    loader: /\$this->load->(.+?)\((.+?)\);/g,
    isStatic: /([a-zA-Z0-9_]*)::([a-zA-Z0-9_\$]*)$/
};
exports.loader = loader;
//# sourceMappingURL=control.js.map