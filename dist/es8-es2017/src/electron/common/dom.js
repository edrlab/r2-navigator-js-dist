"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDOM = serializeDOM;
exports.parseDOM = parseDOM;
const xmldom = require("@xmldom/xmldom");
function serializeDOM(documant) {
    const isWeb = typeof window !== "undefined" && documant instanceof window.Document;
    console.log("--DOMDOM: SERIALIZE--", isWeb);
    const serialized = isWeb
        ? new XMLSerializer().serializeToString(documant)
        : new xmldom.XMLSerializer().serializeToString(documant);
    return serialized;
}
function parseDOM(htmlStrToParse, mediaType) {
    if (!mediaType) {
        mediaType = "application/xml";
    }
    const isWeb = typeof window !== "undefined" && (mediaType === "application/xhtml+xml" || mediaType === "application/xml" || mediaType === "image/svg+xml" || mediaType === "text/html" || mediaType === "text/xml");
    console.log("--DOMDOM: PARSE--", isWeb);
    const documant = isWeb
        ? new DOMParser().parseFromString(htmlStrToParse, mediaType)
        : new xmldom.DOMParser().parseFromString(htmlStrToParse, mediaType);
    const docNodeJS = documant;
    const docWeb = documant;
    if (!isWeb) {
        if (!docWeb.head) {
            definePropertyGetterSetter_DocHeadBody(docNodeJS, "head");
        }
        if (!docWeb.body) {
            definePropertyGetterSetter_DocHeadBody(docNodeJS, "body");
        }
        if (docWeb.documentElement && !docWeb.documentElement.style) {
            definePropertyGetterSetter_ElementStyle(docNodeJS.documentElement);
        }
        if (docWeb.body && !docWeb.body.style) {
            definePropertyGetterSetter_ElementStyle(docWeb.body);
        }
        if (docWeb.documentElement && !docWeb.documentElement.classList) {
            definePropertyGetterSetter_ElementClassList(docNodeJS.documentElement);
        }
    }
    return docWeb;
}
function definePropertyGetterSetter_ElementClassList(element) {
    const classListObj = {};
    classListObj.element = element;
    classListObj.contains = classListContains.bind(classListObj);
    classListObj.add = classListAdd.bind(classListObj);
    classListObj.remove = classListRemove.bind(classListObj);
    element.classList = classListObj;
}
function classListContains(className) {
    const style = this;
    const elem = style.element;
    const classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return false;
    }
    const classes = classAttr.split(" ");
    for (const clazz of classes) {
        if (clazz === className) {
            return true;
        }
    }
    return false;
}
function classListAdd(className) {
    const style = this;
    const elem = style.element;
    const classAttr = elem.getAttribute("class");
    if (!classAttr) {
        elem.setAttribute("class", className);
        return;
    }
    let needsAdding = true;
    const classes = classAttr.split(" ");
    for (const clazz of classes) {
        if (clazz === className) {
            needsAdding = false;
            break;
        }
    }
    if (needsAdding) {
        elem.setAttribute("class", `${classAttr} ${className}`);
    }
}
function classListRemove(className) {
    const style = this;
    const elem = style.element;
    const classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return;
    }
    const arr = [];
    const classes = classAttr.split(" ");
    for (const clazz of classes) {
        if (clazz !== className) {
            arr.push(clazz);
        }
    }
    elem.setAttribute("class", arr.join(" "));
}
function definePropertyGetterSetter_DocHeadBody(documant, elementName) {
    Object.defineProperty(documant, elementName, {
        get() {
            var _a;
            const doc = this;
            const key = elementName + "_";
            if (doc[key]) {
                return doc[key];
            }
            if (((_a = doc.documentElement) === null || _a === void 0 ? void 0 : _a.childNodes) && doc.documentElement.childNodes.length) {
                for (let i = 0; i < doc.documentElement.childNodes.length; i++) {
                    const child = doc.documentElement.childNodes[i];
                    if (child.nodeType === 1) {
                        const element = child;
                        if (element.localName && element.localName.toLowerCase() === elementName) {
                            doc[key] = element;
                            return element;
                        }
                    }
                }
            }
            return undefined;
        },
        set(_val) {
            console.log("documant." + elementName + " CANNOT BE SET!!");
        },
    });
}
function definePropertyGetterSetter_ElementStyle(element) {
    const styleObj = {};
    styleObj.element = element;
    styleObj.setProperty = cssSetProperty.bind(styleObj);
    styleObj.removeProperty = cssRemoveProperty.bind(styleObj);
    styleObj.item = cssStyleItem.bind(styleObj);
    Object.defineProperty(styleObj, "length", {
        get() {
            const style = this;
            const elem = style.element;
            const styleAttr = elem.getAttribute("style");
            if (!styleAttr) {
                return 0;
            }
            let count = 0;
            const cssProps = styleAttr.split(";");
            for (const cssProp of cssProps) {
                if (cssProp.trim().length) {
                    count++;
                }
            }
            return count;
        },
        set(_val) {
            console.log("style.length CANNOT BE SET!!");
        },
    });
    const cssProperties = ["overflow", "width", "height", "margin", "transformOrigin", "transform"];
    cssProperties.forEach((cssProperty) => {
        Object.defineProperty(styleObj, cssProperty, {
            get() {
                const style = this;
                const elem = style.element;
                return cssStyleGet(cssProperty, elem);
            },
            set(val) {
                const style = this;
                const elem = style.element;
                cssStyleSet(cssProperty, val, elem);
            },
        });
    });
    element.style = styleObj;
}
function cssSetProperty(cssProperty, val) {
    const style = this;
    const elem = style.element;
    cssStyleSet(cssProperty, val, elem);
}
function cssRemoveProperty(cssProperty) {
    const style = this;
    const elem = style.element;
    cssStyleSet(cssProperty, undefined, elem);
}
function cssStyleItem(i) {
    const style = this;
    const elem = style.element;
    const styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    let count = -1;
    const cssProps = styleAttr.split(";");
    for (const cssProp of cssProps) {
        const trimmed = cssProp.trim();
        if (trimmed.length) {
            count++;
            if (count === i) {
                const regExStr = "(.+)[\s]*:[\s]*(.+)";
                const regex = new RegExp(regExStr, "g");
                const regexMatch = regex.exec(trimmed);
                if (regexMatch) {
                    return regexMatch[1];
                }
            }
        }
    }
    return undefined;
}
function cssStyleGet(cssProperty, elem) {
    const styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    const regExStr = `${cssProperty}[\s]*:[\s]*(.+)`;
    const cssProps = styleAttr.split(";");
    let cssPropertyValue;
    for (const cssProp of cssProps) {
        const regex = new RegExp(regExStr, "g");
        const regexMatch = regex.exec(cssProp.trim());
        if (regexMatch) {
            cssPropertyValue = regexMatch[1];
            break;
        }
    }
    return cssPropertyValue ? cssPropertyValue : undefined;
}
function cssStyleSet(cssProperty, val, elem) {
    const str = val ? `${cssProperty}: ${val}` : undefined;
    const styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        if (str) {
            elem.setAttribute("style", str);
        }
    }
    else {
        const regExStr = `${cssProperty}[\s]*:[\s]*(.+)`;
        const regex = new RegExp(regExStr, "g");
        const regexMatch = regex.exec(styleAttr);
        if (regexMatch) {
            elem.setAttribute("style", styleAttr.replace(regex, str ? `${str}` : ""));
        }
        else {
            if (str) {
                elem.setAttribute("style", `${styleAttr}; ${str}`);
            }
        }
    }
}
//# sourceMappingURL=dom.js.map