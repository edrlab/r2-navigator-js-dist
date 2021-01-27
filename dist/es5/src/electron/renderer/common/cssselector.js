"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullQualifiedSelector = void 0;
var tslib_1 = require("tslib");
var fullQualifiedSelector = function (node, justSelector) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        var lowerCaseName = (node.localName && node.localName.toLowerCase())
            || node.nodeName.toLowerCase();
        return lowerCaseName;
    }
    return cssPath(node, justSelector);
};
exports.fullQualifiedSelector = fullQualifiedSelector;
var cssPath = function (node, optimized) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
    }
    var steps = [];
    var contextNode = node;
    while (contextNode) {
        var step = _cssPathStep(contextNode, !!optimized, contextNode === node);
        if (!step) {
            break;
        }
        steps.push(step.value);
        if (step.optimized) {
            break;
        }
        contextNode = contextNode.parentNode;
    }
    steps.reverse();
    return steps.join(" > ");
};
var _cssPathStep = function (node, optimized, isTargetNode) {
    var e_1, _a;
    var prefixedElementClassNames = function (nd) {
        var classAttribute = nd.getAttribute("class");
        if (!classAttribute) {
            return [];
        }
        return classAttribute.split(/\s+/g).filter(Boolean).map(function (nm) {
            return "$" + nm;
        });
    };
    var idSelector = function (idd) {
        return "#" + escapeIdentifierIfNeeded(idd);
    };
    var escapeIdentifierIfNeeded = function (ident) {
        if (isCSSIdentifier(ident)) {
            return ident;
        }
        var shouldEscapeFirst = /^(?:[0-9]|-[0-9-]?)/.test(ident);
        var lastIndex = ident.length - 1;
        return ident.replace(/./g, function (c, ii) {
            return ((shouldEscapeFirst && ii === 0) || !isCSSIdentChar(c)) ? escapeAsciiChar(c, ii === lastIndex) : c;
        });
    };
    var escapeAsciiChar = function (c, isLast) {
        return "\\" + toHexByte(c) + (isLast ? "" : " ");
    };
    var toHexByte = function (c) {
        var hexByte = c.charCodeAt(0).toString(16);
        if (hexByte.length === 1) {
            hexByte = "0" + hexByte;
        }
        return hexByte;
    };
    var isCSSIdentChar = function (c) {
        if (/[a-zA-Z0-9_-]/.test(c)) {
            return true;
        }
        return c.charCodeAt(0) >= 0xA0;
    };
    var isCSSIdentifier = function (value) {
        return /^-?[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value);
    };
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    var lowerCaseName = (node.localName && node.localName.toLowerCase())
        || node.nodeName.toLowerCase();
    var element = node;
    var id = element.getAttribute("id");
    if (optimized) {
        if (id) {
            return {
                optimized: true,
                value: idSelector(id),
            };
        }
        if (lowerCaseName === "body" || lowerCaseName === "head" || lowerCaseName === "html") {
            return {
                optimized: true,
                value: lowerCaseName,
            };
        }
    }
    var nodeName = lowerCaseName;
    if (id) {
        return {
            optimized: true,
            value: nodeName + idSelector(id),
        };
    }
    var parent = node.parentNode;
    if (!parent || parent.nodeType === Node.DOCUMENT_NODE) {
        return {
            optimized: true,
            value: nodeName,
        };
    }
    var prefixedOwnClassNamesArray_ = prefixedElementClassNames(element);
    var prefixedOwnClassNamesArray = [];
    prefixedOwnClassNamesArray_.forEach(function (arrItem) {
        if (prefixedOwnClassNamesArray.indexOf(arrItem) < 0) {
            prefixedOwnClassNamesArray.push(arrItem);
        }
    });
    var needsClassNames = false;
    var needsNthChild = false;
    var ownIndex = -1;
    var elementIndex = -1;
    var siblings = parent.children;
    var _loop_1 = function (i) {
        var e_2, _a;
        var sibling = siblings[i];
        if (sibling.nodeType !== Node.ELEMENT_NODE) {
            return "continue";
        }
        elementIndex += 1;
        if (sibling === node) {
            ownIndex = elementIndex;
            return "continue";
        }
        if (needsNthChild) {
            return "continue";
        }
        var siblingName = (sibling.localName && sibling.localName.toLowerCase()) || sibling.nodeName.toLowerCase();
        if (siblingName !== nodeName) {
            return "continue";
        }
        needsClassNames = true;
        var ownClassNames = [];
        prefixedOwnClassNamesArray.forEach(function (arrItem) {
            ownClassNames.push(arrItem);
        });
        var ownClassNameCount = ownClassNames.length;
        if (ownClassNameCount === 0) {
            needsNthChild = true;
            return "continue";
        }
        var siblingClassNamesArray_ = prefixedElementClassNames(sibling);
        var siblingClassNamesArray = [];
        siblingClassNamesArray_.forEach(function (arrItem) {
            if (siblingClassNamesArray.indexOf(arrItem) < 0) {
                siblingClassNamesArray.push(arrItem);
            }
        });
        try {
            for (var siblingClassNamesArray_1 = (e_2 = void 0, tslib_1.__values(siblingClassNamesArray)), siblingClassNamesArray_1_1 = siblingClassNamesArray_1.next(); !siblingClassNamesArray_1_1.done; siblingClassNamesArray_1_1 = siblingClassNamesArray_1.next()) {
                var siblingClass = siblingClassNamesArray_1_1.value;
                var ind = ownClassNames.indexOf(siblingClass);
                if (ind < 0) {
                    continue;
                }
                ownClassNames.splice(ind, 1);
                if (!--ownClassNameCount) {
                    needsNthChild = true;
                    break;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (siblingClassNamesArray_1_1 && !siblingClassNamesArray_1_1.done && (_a = siblingClassNamesArray_1.return)) _a.call(siblingClassNamesArray_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    for (var i = 0; (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
        _loop_1(i);
    }
    var result = nodeName;
    if (isTargetNode &&
        nodeName === "input" &&
        element.getAttribute("type") &&
        !element.getAttribute("id") &&
        !element.getAttribute("class")) {
        result += "[type=\"" + element.getAttribute("type") + "\"]";
    }
    if (needsNthChild) {
        result += ":nth-child(" + (ownIndex + 1) + ")";
    }
    else if (needsClassNames) {
        try {
            for (var prefixedOwnClassNamesArray_1 = tslib_1.__values(prefixedOwnClassNamesArray), prefixedOwnClassNamesArray_1_1 = prefixedOwnClassNamesArray_1.next(); !prefixedOwnClassNamesArray_1_1.done; prefixedOwnClassNamesArray_1_1 = prefixedOwnClassNamesArray_1.next()) {
                var prefixedName = prefixedOwnClassNamesArray_1_1.value;
                result += "." + escapeIdentifierIfNeeded(prefixedName.substr(1));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (prefixedOwnClassNamesArray_1_1 && !prefixedOwnClassNamesArray_1_1.done && (_a = prefixedOwnClassNamesArray_1.return)) _a.call(prefixedOwnClassNamesArray_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return {
        optimized: false,
        value: result,
    };
};
//# sourceMappingURL=cssselector.js.map