"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var cssesc = require("cssesc");
var Limit;
(function (Limit) {
    Limit[Limit["All"] = 0] = "All";
    Limit[Limit["Two"] = 1] = "Two";
    Limit[Limit["One"] = 2] = "One";
})(Limit || (Limit = {}));
var config;
var rootDocument;
function uniqueCssSelector(input, doc, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("Can't generate CSS selector for non-element node type.");
    }
    if ("html" === input.tagName.toLowerCase()) {
        return input.tagName.toLowerCase();
    }
    var defaults = {
        className: function (_name) { return true; },
        idName: function (_name) { return true; },
        optimizedMinLength: 2,
        root: doc.body,
        seedMinLength: 1,
        tagName: function (_name) { return true; },
        threshold: 1000,
    };
    config = tslib_1.__assign(tslib_1.__assign({}, defaults), options);
    rootDocument = findRootDocument(config.root, defaults);
    var path = bottomUpSearch(input, Limit.All, function () {
        return bottomUpSearch(input, Limit.Two, function () {
            return bottomUpSearch(input, Limit.One);
        });
    });
    if (path) {
        var optimized = sort(optimize(path, input));
        if (optimized.length > 0) {
            path = optimized[0];
        }
        return selector(path);
    }
    else {
        throw new Error("Selector was not found.");
    }
}
exports.uniqueCssSelector = uniqueCssSelector;
function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
        return rootNode;
    }
    if (rootNode === defaults.root) {
        return rootNode.ownerDocument;
    }
    return rootNode;
}
function bottomUpSearch(input, limit, fallback) {
    var path = null;
    var stack = [];
    var current = input;
    var i = 0;
    var _loop_1 = function () {
        var e_1, _a;
        var level = maybe(id(current)) || maybe.apply(void 0, tslib_1.__spread(classNames(current))) ||
            maybe(tagName(current)) || [any()];
        var nth = index(current);
        if (limit === Limit.All) {
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
            }
        }
        else if (limit === Limit.Two) {
            level = level.slice(0, 1);
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
            }
        }
        else if (limit === Limit.One) {
            var _b = tslib_1.__read(level = level.slice(0, 1), 1), node = _b[0];
            if (nth && dispensableNth(node)) {
                level = [nthChild(node, nth)];
            }
        }
        try {
            for (var level_1 = (e_1 = void 0, tslib_1.__values(level)), level_1_1 = level_1.next(); !level_1_1.done; level_1_1 = level_1.next()) {
                var node = level_1_1.value;
                node.level = i;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (level_1_1 && !level_1_1.done && (_a = level_1.return)) _a.call(level_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        stack.push(level);
        if (stack.length >= config.seedMinLength) {
            path = findUniquePath(stack, fallback);
            if (path) {
                return "break";
            }
        }
        current = current.parentElement;
        i++;
    };
    while (current && current !== config.root.parentElement) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
    if (!path) {
        path = findUniquePath(stack, fallback);
    }
    return path;
}
function findUniquePath(stack, fallback) {
    var e_2, _a;
    var paths = sort(combinations(stack));
    if (paths.length > config.threshold) {
        return fallback ? fallback() : null;
    }
    try {
        for (var paths_1 = tslib_1.__values(paths), paths_1_1 = paths_1.next(); !paths_1_1.done; paths_1_1 = paths_1.next()) {
            var candidate = paths_1_1.value;
            if (unique(candidate)) {
                return candidate;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (paths_1_1 && !paths_1_1.done && (_a = paths_1.return)) _a.call(paths_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return null;
}
function selector(path) {
    var node = path[0];
    var query = node.name;
    for (var i = 1; i < path.length; i++) {
        var level = path[i].level || 0;
        if (node.level === level - 1) {
            query = path[i].name + " > " + query;
        }
        else {
            query = path[i].name + " " + query;
        }
        node = path[i];
    }
    return query;
}
function penalty(path) {
    return path.map(function (node) { return node.penalty; }).reduce(function (acc, i) { return acc + i; }, 0);
}
function unique(path) {
    switch (rootDocument.querySelectorAll(selector(path)).length) {
        case 0:
            throw new Error("Can't select any node with this selector: " + selector(path));
        case 1:
            return true;
        default:
            return false;
    }
}
function id(input) {
    var elementId = input.getAttribute("id");
    if (elementId && config.idName(elementId)) {
        return {
            name: "#" + cssesc(elementId, { isIdentifier: true }),
            penalty: 0,
        };
    }
    return null;
}
function classNames(input) {
    var names = Array.from(input.classList)
        .filter(config.className);
    return names.map(function (name) { return ({
        name: "." + cssesc(name, { isIdentifier: true }),
        penalty: 1,
    }); });
}
function tagName(input) {
    var name = input.tagName.toLowerCase();
    if (config.tagName(name)) {
        return {
            name: name,
            penalty: 2,
        };
    }
    return null;
}
function any() {
    return {
        name: "*",
        penalty: 3,
    };
}
function index(input) {
    var parent = input.parentNode;
    if (!parent) {
        return null;
    }
    var child = parent.firstChild;
    if (!child) {
        return null;
    }
    var i = 0;
    while (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            i++;
        }
        if (child === input) {
            break;
        }
        child = child.nextSibling;
    }
    return i;
}
function nthChild(node, i) {
    return {
        name: node.name + (":nth-child(" + i + ")"),
        penalty: node.penalty + 1,
    };
}
function dispensableNth(node) {
    return node.name !== "html" && !node.name.startsWith("#");
}
function maybe() {
    var level = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        level[_i] = arguments[_i];
    }
    var list = level.filter(notEmpty);
    if (list.length > 0) {
        return list;
    }
    return null;
}
function notEmpty(value) {
    return value !== null && value !== undefined;
}
function combinations(stack, path) {
    var _a, _b, node, e_3_1;
    var e_3, _c;
    if (path === void 0) { path = []; }
    return tslib_1.__generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!(stack.length > 0)) return [3, 9];
                _d.label = 1;
            case 1:
                _d.trys.push([1, 6, 7, 8]);
                _a = tslib_1.__values(stack[0]), _b = _a.next();
                _d.label = 2;
            case 2:
                if (!!_b.done) return [3, 5];
                node = _b.value;
                return [5, tslib_1.__values(combinations(stack.slice(1, stack.length), path.concat(node)))];
            case 3:
                _d.sent();
                _d.label = 4;
            case 4:
                _b = _a.next();
                return [3, 2];
            case 5: return [3, 8];
            case 6:
                e_3_1 = _d.sent();
                e_3 = { error: e_3_1 };
                return [3, 8];
            case 7:
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
                return [7];
            case 8: return [3, 11];
            case 9: return [4, path];
            case 10:
                _d.sent();
                _d.label = 11;
            case 11: return [2];
        }
    });
}
function sort(paths) {
    return Array.from(paths).sort(function (a, b) { return penalty(a) - penalty(b); });
}
function optimize(path, input) {
    var i, newPath;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(path.length > 2 && path.length > config.optimizedMinLength)) return [3, 5];
                i = 1;
                _a.label = 1;
            case 1:
                if (!(i < path.length - 1)) return [3, 5];
                newPath = tslib_1.__spread(path);
                newPath.splice(i, 1);
                if (!(unique(newPath) && same(newPath, input))) return [3, 4];
                return [4, newPath];
            case 2:
                _a.sent();
                return [5, tslib_1.__values(optimize(newPath, input))];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                i++;
                return [3, 1];
            case 5: return [2];
        }
    });
}
function same(path, input) {
    return rootDocument.querySelector(selector(path)) === input;
}
//# sourceMappingURL=cssselector2.js.map