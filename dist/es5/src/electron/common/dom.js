"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var xmldom = require("xmldom");
function serializeDOM(documant) {
    var serialized = new xmldom.XMLSerializer().serializeToString(documant);
    return serialized;
}
exports.serializeDOM = serializeDOM;
function parseDOM(htmlStrToParse, mediaType) {
    if (mediaType === "application/xhtml+xml") {
        mediaType = "application/xhtml";
    }
    var documant = mediaType ?
        new xmldom.DOMParser().parseFromString(htmlStrToParse, mediaType) :
        new xmldom.DOMParser().parseFromString(htmlStrToParse);
    if (!documant.head) {
        definePropertyGetterSetter_DocHeadBody(documant, "head");
    }
    if (!documant.body) {
        definePropertyGetterSetter_DocHeadBody(documant, "body");
    }
    if (!documant.documentElement.style) {
        definePropertyGetterSetter_ElementStyle(documant.documentElement);
    }
    if (!documant.body.style) {
        definePropertyGetterSetter_ElementStyle(documant.body);
    }
    if (!documant.documentElement.classList) {
        definePropertyGetterSetter_ElementClassList(documant.documentElement);
    }
    return documant;
}
exports.parseDOM = parseDOM;
function definePropertyGetterSetter_ElementClassList(element) {
    var classListObj = {};
    classListObj.element = element;
    classListObj.contains = classListContains.bind(classListObj);
    classListObj.add = classListAdd.bind(classListObj);
    classListObj.remove = classListRemove.bind(classListObj);
    element.classList = classListObj;
}
function classListContains(className) {
    var e_1, _a;
    var style = this;
    var elem = style.element;
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return false;
    }
    var classes = classAttr.split(" ");
    try {
        for (var classes_1 = tslib_1.__values(classes), classes_1_1 = classes_1.next(); !classes_1_1.done; classes_1_1 = classes_1.next()) {
            var clazz = classes_1_1.value;
            if (clazz === className) {
                return true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (classes_1_1 && !classes_1_1.done && (_a = classes_1.return)) _a.call(classes_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
function classListAdd(className) {
    var e_2, _a;
    var style = this;
    var elem = style.element;
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        elem.setAttribute("class", className);
        return;
    }
    var needsAdding = true;
    var classes = classAttr.split(" ");
    try {
        for (var classes_2 = tslib_1.__values(classes), classes_2_1 = classes_2.next(); !classes_2_1.done; classes_2_1 = classes_2.next()) {
            var clazz = classes_2_1.value;
            if (clazz === className) {
                needsAdding = false;
                break;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (classes_2_1 && !classes_2_1.done && (_a = classes_2.return)) _a.call(classes_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    if (needsAdding) {
        elem.setAttribute("class", classAttr + " " + className);
    }
}
function classListRemove(className) {
    var e_3, _a;
    var style = this;
    var elem = style.element;
    var classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return;
    }
    var arr = [];
    var classes = classAttr.split(" ");
    try {
        for (var classes_3 = tslib_1.__values(classes), classes_3_1 = classes_3.next(); !classes_3_1.done; classes_3_1 = classes_3.next()) {
            var clazz = classes_3_1.value;
            if (clazz !== className) {
                arr.push(clazz);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (classes_3_1 && !classes_3_1.done && (_a = classes_3.return)) _a.call(classes_3);
        }
        finally { if (e_3) throw e_3.error; }
    }
    elem.setAttribute("class", arr.join(" "));
}
function definePropertyGetterSetter_DocHeadBody(documant, elementName) {
    Object.defineProperty(documant, elementName, {
        get: function () {
            var doc = this;
            var key = elementName + "_";
            if (doc[key]) {
                return doc[key];
            }
            if (doc.documentElement.childNodes && doc.documentElement.childNodes.length) {
                for (var i = 0; i < doc.documentElement.childNodes.length; i++) {
                    var child = doc.documentElement.childNodes[i];
                    if (child.nodeType === 1) {
                        var element = child;
                        if (element.localName && element.localName.toLowerCase() === elementName) {
                            doc[key] = element;
                            return element;
                        }
                    }
                }
            }
            return undefined;
        },
        set: function (_val) {
            console.log("documant." + elementName + " CANNOT BE SET!!");
        },
    });
}
function definePropertyGetterSetter_ElementStyle(element) {
    var styleObj = {};
    styleObj.element = element;
    styleObj.setProperty = cssSetProperty.bind(styleObj);
    styleObj.removeProperty = cssRemoveProperty.bind(styleObj);
    styleObj.item = cssStyleItem.bind(styleObj);
    Object.defineProperty(styleObj, "length", {
        get: function () {
            var e_4, _a;
            var style = this;
            var elem = style.element;
            var styleAttr = elem.getAttribute("style");
            if (!styleAttr) {
                return 0;
            }
            var count = 0;
            var cssProps = styleAttr.split(";");
            try {
                for (var cssProps_1 = tslib_1.__values(cssProps), cssProps_1_1 = cssProps_1.next(); !cssProps_1_1.done; cssProps_1_1 = cssProps_1.next()) {
                    var cssProp = cssProps_1_1.value;
                    if (cssProp.trim().length) {
                        count++;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (cssProps_1_1 && !cssProps_1_1.done && (_a = cssProps_1.return)) _a.call(cssProps_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return count;
        },
        set: function (_val) {
            console.log("style.length CANNOT BE SET!!");
        },
    });
    var cssProperties = ["overflow", "width", "height", "margin", "transformOrigin", "transform"];
    cssProperties.forEach(function (cssProperty) {
        Object.defineProperty(styleObj, cssProperty, {
            get: function () {
                var style = this;
                var elem = style.element;
                return cssStyleGet(cssProperty, elem);
            },
            set: function (val) {
                var style = this;
                var elem = style.element;
                cssStyleSet(cssProperty, val, elem);
            },
        });
    });
    element.style = styleObj;
}
function cssSetProperty(cssProperty, val) {
    var style = this;
    var elem = style.element;
    cssStyleSet(cssProperty, val, elem);
}
function cssRemoveProperty(cssProperty) {
    var style = this;
    var elem = style.element;
    cssStyleSet(cssProperty, undefined, elem);
}
function cssStyleItem(i) {
    var e_5, _a;
    var style = this;
    var elem = style.element;
    var styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    var count = -1;
    var cssProps = styleAttr.split(";");
    try {
        for (var cssProps_2 = tslib_1.__values(cssProps), cssProps_2_1 = cssProps_2.next(); !cssProps_2_1.done; cssProps_2_1 = cssProps_2.next()) {
            var cssProp = cssProps_2_1.value;
            var trimmed = cssProp.trim();
            if (trimmed.length) {
                count++;
                if (count === i) {
                    var regExStr = "(.+)[s]*:[s]*(.+)";
                    var regex = new RegExp(regExStr, "g");
                    var regexMatch = regex.exec(trimmed);
                    if (regexMatch) {
                        return regexMatch[1];
                    }
                }
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (cssProps_2_1 && !cssProps_2_1.done && (_a = cssProps_2.return)) _a.call(cssProps_2);
        }
        finally { if (e_5) throw e_5.error; }
    }
    return undefined;
}
function cssStyleGet(cssProperty, elem) {
    var e_6, _a;
    var styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    var regExStr = cssProperty + "[s]*:[s]*(.+)";
    var cssProps = styleAttr.split(";");
    var cssPropertyValue;
    try {
        for (var cssProps_3 = tslib_1.__values(cssProps), cssProps_3_1 = cssProps_3.next(); !cssProps_3_1.done; cssProps_3_1 = cssProps_3.next()) {
            var cssProp = cssProps_3_1.value;
            var regex = new RegExp(regExStr, "g");
            var regexMatch = regex.exec(cssProp.trim());
            if (regexMatch) {
                cssPropertyValue = regexMatch[1];
                break;
            }
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (cssProps_3_1 && !cssProps_3_1.done && (_a = cssProps_3.return)) _a.call(cssProps_3);
        }
        finally { if (e_6) throw e_6.error; }
    }
    return cssPropertyValue ? cssPropertyValue : undefined;
}
function cssStyleSet(cssProperty, val, elem) {
    var str = val ? cssProperty + ": " + val : undefined;
    var styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        if (str) {
            elem.setAttribute("style", str);
        }
    }
    else {
        var regExStr = cssProperty + "[s]*:[s]*(.+)";
        var regex = new RegExp(regExStr, "g");
        var regexMatch = regex.exec(styleAttr);
        if (regexMatch) {
            elem.setAttribute("style", styleAttr.replace(regex, str ? "" + str : ""));
        }
        else {
            if (str) {
                elem.setAttribute("style", styleAttr + "; " + str);
            }
        }
    }
}
//# sourceMappingURL=dom.js.map