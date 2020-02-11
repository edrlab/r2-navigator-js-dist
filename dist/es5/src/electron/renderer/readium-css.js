"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var win = window;
function isRTL() {
    var publication = win.READIUM2.publication;
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Direction) {
        return publication.Metadata.Direction.toLowerCase() === "rtl";
    }
    return false;
}
exports.isRTL = isRTL;
function isFixedLayout(link) {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    var publication = win.READIUM2.publication;
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}
exports.isFixedLayout = isFixedLayout;
function __computeReadiumCssJsonMessage(link) {
    if (isFixedLayout(link)) {
        var activeWebView = win.READIUM2.getActiveWebView();
        return {
            fixedLayoutWebViewHeight: activeWebView ? activeWebView.clientHeight : undefined,
            fixedLayoutWebViewWidth: activeWebView ? activeWebView.clientWidth : undefined,
            isFixedLayout: true,
            setCSS: undefined,
        };
    }
    if (!_computeReadiumCssJsonMessage) {
        return { setCSS: undefined, isFixedLayout: false };
    }
    var readiumCssJsonMessage = _computeReadiumCssJsonMessage();
    return readiumCssJsonMessage;
}
exports.__computeReadiumCssJsonMessage = __computeReadiumCssJsonMessage;
var _computeReadiumCssJsonMessage = function () {
    return { setCSS: undefined, isFixedLayout: false };
};
function setReadiumCssJsonGetter(func) {
    _computeReadiumCssJsonMessage = func;
}
exports.setReadiumCssJsonGetter = setReadiumCssJsonGetter;
//# sourceMappingURL=readium-css.js.map