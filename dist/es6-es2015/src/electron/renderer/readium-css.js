"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const win = window;
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function isRTL() {
    const publication = win.READIUM2.publication;
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
    const publication = win.READIUM2.publication;
    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}
exports.isFixedLayout = isFixedLayout;
const _defaultReadiumCss = { setCSS: undefined, isFixedLayout: false };
function obtainReadiumCss(rcss) {
    const r = rcss ? rcss :
        (_computeReadiumCssJsonMessage ? _computeReadiumCssJsonMessage() :
            _defaultReadiumCss);
    if (IS_DEV) {
        console.log(`ReadiumCSS obtain: ${rcss ? "provided" : (_computeReadiumCssJsonMessage ? "pulled" : "default")}`);
        console.log(r);
    }
    return r;
}
exports.obtainReadiumCss = obtainReadiumCss;
function adjustReadiumCssJsonMessageForFixedLayout(link, rcss) {
    if (isFixedLayout(link)) {
        const activeWebView = win.READIUM2.getActiveWebView();
        return {
            fixedLayoutWebViewHeight: activeWebView ? activeWebView.clientHeight : undefined,
            fixedLayoutWebViewWidth: activeWebView ? activeWebView.clientWidth : undefined,
            isFixedLayout: true,
            setCSS: undefined,
        };
    }
    return rcss;
}
exports.adjustReadiumCssJsonMessageForFixedLayout = adjustReadiumCssJsonMessageForFixedLayout;
let _computeReadiumCssJsonMessage;
function setReadiumCssJsonGetter(func) {
    _computeReadiumCssJsonMessage = func;
}
exports.setReadiumCssJsonGetter = setReadiumCssJsonGetter;
//# sourceMappingURL=readium-css.js.map