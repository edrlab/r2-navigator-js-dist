"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    const cr = require("../common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
}
const debounce_1 = require("debounce");
const debug_ = require("debug");
const electron_1 = require("electron");
const tabbable = require("tabbable");
const events_1 = require("../../common/events");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const selection_1 = require("../../common/selection");
const styles_1 = require("../../common/styles");
const animateProperty_1 = require("../common/animateProperty");
const cssselector2_1 = require("../common/cssselector2");
const easings_1 = require("../common/easings");
const popup_dialog_1 = require("../common/popup-dialog");
const querystring_1 = require("../common/querystring");
const rect_utils_1 = require("../common/rect-utils");
const url_params_1 = require("../common/url-params");
const webview_resize_1 = require("../common/webview-resize");
const epubReadingSystem_1 = require("./epubReadingSystem");
const highlight_1 = require("./highlight");
const popupFootNotes_1 = require("./popupFootNotes");
const readaloud_1 = require("./readaloud");
const readium_css_1 = require("./readium-css");
const selection_2 = require("./selection");
const ResizeSensor = require("css-element-queries/src/ResizeSensor");
const debug = debug_("r2:navigator#electron/renderer/webview/preload");
const win = global.window;
win.READIUM2 = {
    DEBUG_VISUALS: false,
    fxlViewportHeight: 0,
    fxlViewportScale: 1,
    fxlViewportWidth: 0,
    hashElement: null,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideInfo: {
        docInfo: undefined,
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
        },
        paginationInfo: undefined,
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
    },
    ttsClickEnabled: false,
    urlQueryParams: win.location.search ? querystring_1.getURLQueryParams(win.location.search) : undefined,
};
win.alert = (...args) => {
    console.log.apply(win, args);
};
win.confirm = (...args) => {
    console.log.apply(win, args);
    return false;
};
win.prompt = (...args) => {
    console.log.apply(win, args);
    return "";
};
window.document.addEventListener("keydown", (ev) => {
    const payload = {
        keyCode: ev.keyCode,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_WEBVIEW_KEYDOWN, payload);
});
if (win.READIUM2.urlQueryParams) {
    let readiumEpubReadingSystemJson;
    const base64EpubReadingSystem = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_EPUBREADINGSYSTEM];
    if (base64EpubReadingSystem) {
        try {
            const str = new Buffer(base64EpubReadingSystem, "base64").toString("utf8");
            readiumEpubReadingSystemJson = JSON.parse(str);
        }
        catch (err) {
            debug(err);
        }
    }
    if (readiumEpubReadingSystemJson) {
        epubReadingSystem_1.setWindowNavigatorEpubReadingSystem(win, readiumEpubReadingSystemJson);
    }
    win.READIUM2.DEBUG_VISUALS = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_DEBUG_VISUALS] === "true";
}
if (IS_DEV) {
    electron_1.ipcRenderer.on(events_1.R2_EVENT_DEBUG_VISUALS, (_event, payload) => {
        win.READIUM2.DEBUG_VISUALS = payload.debugVisuals;
        if (!payload.debugVisuals) {
            const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr1}], *[${styles_1.readPosCssStylesAttr2}], *[${styles_1.readPosCssStylesAttr3}], *[${styles_1.readPosCssStylesAttr4}]`);
            existings.forEach((existing) => {
                existing.removeAttribute(`${styles_1.readPosCssStylesAttr1}`);
                existing.removeAttribute(`${styles_1.readPosCssStylesAttr2}`);
                existing.removeAttribute(`${styles_1.readPosCssStylesAttr3}`);
                existing.removeAttribute(`${styles_1.readPosCssStylesAttr4}`);
            });
        }
        if (payload.cssClass) {
            if (_blacklistIdClassForCssSelectors.indexOf(payload.cssClass) < 0) {
                _blacklistIdClassForCssSelectors.push(payload.cssClass);
            }
            if (payload.debugVisuals && payload.cssStyles && payload.cssStyles.length) {
                const idSuffix = `debug_for_class_${payload.cssClass}`;
                readium_css_inject_1.appendCSSInline(win.document, idSuffix, payload.cssStyles);
                if (payload.cssSelector) {
                    const toHighlights = win.document.querySelectorAll(payload.cssSelector);
                    toHighlights.forEach((toHighlight) => {
                        const clazz = `${payload.cssClass}`;
                        if (!toHighlight.classList.contains(clazz)) {
                            toHighlight.classList.add(clazz);
                        }
                    });
                }
            }
            else {
                const existings = win.document.querySelectorAll(`.${payload.cssClass}`);
                existings.forEach((existing) => {
                    existing.classList.remove(`${payload.cssClass}`);
                });
            }
        }
    });
}
function computeVisibility_(element) {
    if (win.READIUM2.isFixedLayout) {
        return true;
    }
    else if (!win.document || !win.document.documentElement || !win.document.body) {
        return false;
    }
    if (element === win.document.body || element === win.document.documentElement) {
        return true;
    }
    const elStyle = win.getComputedStyle(element);
    if (elStyle) {
        const display = elStyle.getPropertyValue("display");
        if (display === "none") {
            if (IS_DEV) {
                console.log("element DISPLAY NONE");
            }
            return false;
        }
        const opacity = elStyle.getPropertyValue("opacity");
        if (opacity === "0") {
            if (IS_DEV) {
                console.log("element OPACITY ZERO");
            }
            return false;
        }
    }
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    if (!readium_css_inject_1.isPaginated(win.document)) {
        const rect = element.getBoundingClientRect();
        if (rect.top >= 0 &&
            rect.top <= win.document.documentElement.clientHeight) {
            return true;
        }
        return false;
    }
    if (readium_css_1.isVerticalWritingMode()) {
        return false;
    }
    const scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element);
    const extraShift = scrollElement.scrollLeftExtra;
    let currentOffset = scrollElement.scrollLeft;
    if (extraShift) {
        currentOffset += (((currentOffset < 0) ? -1 : 1) * extraShift);
    }
    if (scrollLeftPotentiallyExcessive >= (currentOffset - 10) &&
        scrollLeftPotentiallyExcessive <= (currentOffset + 10)) {
        return true;
    }
    return false;
}
function computeVisibility(location) {
    let visible = false;
    if (win.READIUM2.isFixedLayout) {
        visible = true;
    }
    else if (!win.document || !win.document.documentElement || !win.document.body) {
        visible = false;
    }
    else if (!location || !location.cssSelector) {
        visible = false;
    }
    else {
        let selected = null;
        try {
            selected = win.document.querySelector(location.cssSelector);
        }
        catch (err) {
            debug(err);
        }
        if (selected) {
            visible = computeVisibility_(selected);
        }
    }
    return visible;
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_LOCATOR_VISIBLE, (_event, payload) => {
    payload.visible = computeVisibility(payload.location);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LOCATOR_VISIBLE, payload);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, (_event, payload) => {
    showHideContentMask(false);
    selection_2.clearCurrentSelection(win);
    popup_dialog_1.closePopupDialogs(win.document);
    _cancelInitialScrollCheck = true;
    if (!win.READIUM2.urlQueryParams) {
        win.READIUM2.urlQueryParams = {};
    }
    if (payload.previous) {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS] = "true";
    }
    else {
        if (typeof win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS] !== "undefined") {
            delete win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
        }
    }
    if (payload.goto) {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO] = payload.goto;
    }
    else {
        if (typeof win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO] !== "undefined") {
            delete win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO];
        }
    }
    let delayScrollIntoView = false;
    if (payload.hash) {
        win.READIUM2.hashElement = win.document.getElementById(payload.hash);
        if (win.READIUM2.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                win.READIUM2.hashElement.setAttribute(styles_1.readPosCssStylesAttr1, "R2_EVENT_SCROLLTO hashElement");
            }
        }
        win.location.href = "#" + payload.hash;
        delayScrollIntoView = true;
    }
    else {
        win.location.href = "#";
        win.READIUM2.hashElement = null;
    }
    win.READIUM2.locationHashOverride = undefined;
    resetLocationHashOverrideInfo();
    if (delayScrollIntoView) {
        setTimeout(() => {
            debug("++++ scrollToHashRaw FROM DELAYED SCROLL_TO");
            scrollToHashRaw();
        }, 100);
    }
    else {
        debug("++++ scrollToHashRaw FROM SCROLL_TO");
        scrollToHashRaw();
    }
});
function resetLocationHashOverrideInfo() {
    win.READIUM2.locationHashOverrideInfo = {
        docInfo: undefined,
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
        },
        paginationInfo: undefined,
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
    };
}
let _lastAnimState;
function elementCapturesKeyboardArrowKeys(target) {
    let curElement = target;
    while (curElement && curElement.nodeType === Node.ELEMENT_NODE) {
        const editable = curElement.getAttribute("contenteditable");
        if (editable) {
            return true;
        }
        const arrayOfKeyboardCaptureElements = ["input", "textarea", "video", "audio", "select"];
        if (arrayOfKeyboardCaptureElements.indexOf(curElement.tagName.toLowerCase()) >= 0) {
            return true;
        }
        curElement = curElement.parentNode;
    }
    return false;
}
function ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable() {
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const val = scrollElement.scrollLeftExtra;
    if (val === 0) {
        return 0;
    }
    scrollElement.scrollLeftExtra = 0;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, { offset: 0, backgroundColor: undefined });
    return val;
}
function ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(scrollLeftExtra) {
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    scrollElement.scrollLeftExtra = scrollLeftExtra;
    const scrollLeftExtraBackgroundColor = scrollElement.scrollLeftExtraBackgroundColor;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, {
        backgroundColor: scrollLeftExtraBackgroundColor ? scrollLeftExtraBackgroundColor : undefined,
        offset: (readium_css_1.isRTL() ? 1 : -1) * scrollLeftExtra,
    });
}
function ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, maxScrollShift) {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const noChange = popup_dialog_1.isPopupDialogOpen(win.document) ||
        !readium_css_inject_1.isPaginated(win.document) ||
        !readium_css_1.isTwoPageSpread() ||
        readium_css_1.isVerticalWritingMode() ||
        maxScrollShift <= 0 ||
        Math.abs(scrollOffset) <= maxScrollShift;
    if (noChange) {
        scrollElement.scrollLeftExtra = 0;
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, { offset: 0, backgroundColor: undefined });
        return;
    }
    const extraOffset = Math.abs(scrollOffset) - maxScrollShift;
    let backgroundColor;
    const docStyle = win.getComputedStyle(win.document.documentElement);
    if (docStyle) {
        backgroundColor = docStyle.getPropertyValue("background-color");
    }
    if (!backgroundColor || backgroundColor === "transparent") {
        const bodyStyle = win.getComputedStyle(win.document.body);
        backgroundColor = bodyStyle.getPropertyValue("background-color");
        if (backgroundColor === "transparent") {
            backgroundColor = undefined;
        }
    }
    scrollElement.scrollLeftExtra = extraOffset;
    scrollElement.scrollLeftExtraBackgroundColor = backgroundColor;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, {
        backgroundColor: backgroundColor ? backgroundColor : undefined,
        offset: (readium_css_1.isRTL() ? 1 : -1) * extraOffset,
    });
}
function onEventPageTurn(payload) {
    let leftRightKeyWasUsedInsideKeyboardCapture = false;
    if (win.document.activeElement &&
        elementCapturesKeyboardArrowKeys(win.document.activeElement)) {
        if (win.document.hasFocus()) {
            leftRightKeyWasUsedInsideKeyboardCapture = true;
        }
        else {
            const oldDate = win.document.activeElement.r2_leftrightKeyboardTimeStamp;
            if (oldDate) {
                const newDate = new Date();
                const msDiff = newDate.getTime() - oldDate.getTime();
                if (msDiff <= 300) {
                    leftRightKeyWasUsedInsideKeyboardCapture = true;
                }
            }
        }
    }
    if (leftRightKeyWasUsedInsideKeyboardCapture) {
        return;
    }
    selection_2.clearCurrentSelection(win);
    popup_dialog_1.closePopupDialogs(win.document);
    if (win.READIUM2.isFixedLayout || !win.document.body) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
        return;
    }
    if (!win.document || !win.document.documentElement) {
        return;
    }
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    const goPREVIOUS = payload.go === "PREVIOUS";
    if (_lastAnimState && _lastAnimState.animating) {
        win.cancelAnimationFrame(_lastAnimState.id);
        _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
    }
    if (!goPREVIOUS) {
        const maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) < maxScrollShift)) {
                const unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                const scrollOffsetPotentiallyExcessive_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollTop + unit) :
                    (scrollElement.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * unit);
                const nWholes = Math.floor(scrollOffsetPotentiallyExcessive_ / unit);
                const scrollOffsetPotentiallyExcessive = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                const scrollOffset = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                    Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                const targetObj = scrollElement;
                const targetProp = readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = scrollOffset;
                }
                else {
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, 300, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) < maxScrollShift)) {
                const newVal = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop + win.document.documentElement.clientHeight);
                const targetObj = scrollElement;
                const targetProp = readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = newVal;
                }
                else {
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, 300, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) > 0)) {
                const unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                const scrollOffset_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollTop - unit) :
                    (scrollElement.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * unit);
                const nWholes = readium_css_1.isRTL() ? Math.floor(scrollOffset_ / unit) : Math.ceil(scrollOffset_ / unit);
                const scrollOffset = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, 0);
                const targetObj = scrollElement;
                const targetProp = readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = scrollOffset;
                }
                else {
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, 300, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) > 0)) {
                const newVal = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop - win.document.documentElement.clientHeight);
                const targetObj = scrollElement;
                const targetProp = readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = newVal;
                }
                else {
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, 300, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                return;
            }
        }
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_PAGE_TURN, (_event, payload) => {
    setTimeout(() => {
        onEventPageTurn(payload);
    }, 100);
});
function scrollElementIntoView(element) {
    if (win.READIUM2.DEBUG_VISUALS) {
        const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr3}]`);
        existings.forEach((existing) => {
            existing.removeAttribute(`${styles_1.readPosCssStylesAttr3}`);
        });
        element.setAttribute(styles_1.readPosCssStylesAttr3, "scrollElementIntoView");
    }
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    if (isPaged) {
        scrollIntoView(element);
    }
    else {
        const scrollElement = readium_css_1.getScrollingElement(win.document);
        const rect = element.getBoundingClientRect();
        const scrollTopMax = scrollElement.scrollHeight - win.document.documentElement.clientHeight;
        let offset = scrollElement.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2));
        if (offset > scrollTopMax) {
            offset = scrollTopMax;
        }
        else if (offset < 0) {
            offset = 0;
        }
        scrollElement.scrollTop = offset;
    }
}
function getScrollOffsetIntoView(element) {
    if (!win.document || !win.document.documentElement || !win.document.body ||
        !readium_css_inject_1.isPaginated(win.document) || readium_css_1.isVerticalWritingMode()) {
        return 0;
    }
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const rect = element.getBoundingClientRect();
    const columnDimension = readium_css_1.calculateColumnDimension();
    const isTwoPage = readium_css_1.isTwoPageSpread();
    const fullOffset = (readium_css_1.isRTL() ?
        ((columnDimension * (isTwoPage ? 2 : 1)) - (rect.left + rect.width)) :
        rect.left) +
        ((readium_css_1.isRTL() ? -1 : 1) * scrollElement.scrollLeft);
    const columnIndex = Math.floor(fullOffset / columnDimension);
    const spreadIndex = isTwoPage ? Math.floor(columnIndex / 2) : columnIndex;
    return (readium_css_1.isRTL() ? -1 : 1) *
        (spreadIndex * (columnDimension * (isTwoPage ? 2 : 1)));
}
function scrollIntoView(element) {
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return;
    }
    const maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
    const scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element);
    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const scrollOffset = (scrollLeftPotentiallyExcessive < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive), maxScrollShift);
    scrollElement.scrollLeft = scrollOffset;
}
const scrollToHashRaw = () => {
    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    debug("++++ scrollToHashRaw");
    highlight_1.recreateAllHighlights(win);
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    if (win.READIUM2.locationHashOverride) {
        scrollElementIntoView(win.READIUM2.locationHashOverride);
        notifyReadingLocationDebounced();
        return;
    }
    else if (win.READIUM2.hashElement) {
        win.READIUM2.locationHashOverride = win.READIUM2.hashElement;
        scrollElementIntoView(win.READIUM2.hashElement);
        notifyReadingLocationDebounced();
        return;
    }
    else {
        const scrollElement = readium_css_1.getScrollingElement(win.document);
        if (win.READIUM2.urlQueryParams) {
            const previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
            const isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                const { maxScrollShift, maxScrollShiftAdjusted } = readium_css_1.calculateMaxScrollShift();
                _ignoreScrollEvent = true;
                if (isPaged) {
                    if (readium_css_1.isVerticalWritingMode()) {
                        scrollElement.scrollLeft = 0;
                        scrollElement.scrollTop = maxScrollShift;
                    }
                    else {
                        const scrollLeftPotentiallyExcessive = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShiftAdjusted;
                        ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
                        const scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShift;
                        scrollElement.scrollLeft = scrollLeft;
                        scrollElement.scrollTop = 0;
                    }
                }
                else {
                    if (readium_css_1.isVerticalWritingMode()) {
                        scrollElement.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShift;
                        scrollElement.scrollTop = 0;
                    }
                    else {
                        scrollElement.scrollLeft = 0;
                        scrollElement.scrollTop = maxScrollShift;
                    }
                }
                win.READIUM2.locationHashOverride = undefined;
                resetLocationHashOverrideInfo();
                setTimeout(() => {
                    processXYRaw(0, 0, false);
                    showHideContentMask(false);
                    if (!win.READIUM2.locationHashOverride) {
                        notifyReadingLocationDebounced();
                    }
                    setTimeout(() => {
                        _ignoreScrollEvent = false;
                    }, 10);
                }, 60);
                return;
            }
            const gto = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO];
            let gotoCssSelector;
            let gotoProgression;
            if (gto) {
                const s = new Buffer(gto, "base64").toString("utf8");
                const js = JSON.parse(s);
                gotoCssSelector = js.cssSelector;
                gotoProgression = js.progression;
            }
            if (gotoCssSelector) {
                gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");
                let selected = null;
                try {
                    selected = win.document.querySelector(gotoCssSelector);
                }
                catch (err) {
                    debug(err);
                }
                if (selected) {
                    win.READIUM2.locationHashOverride = selected;
                    resetLocationHashOverrideInfo();
                    if (win.READIUM2.locationHashOverrideInfo) {
                        win.READIUM2.locationHashOverrideInfo.locations.cssSelector = gotoCssSelector;
                    }
                    scrollElementIntoView(selected);
                    notifyReadingLocationDebounced();
                    return;
                }
            }
            else if (gotoProgression) {
                const { maxScrollShift } = readium_css_1.calculateMaxScrollShift();
                if (isPaged) {
                    const isTwoPage = readium_css_1.isTwoPageSpread();
                    const nColumns = readium_css_1.calculateTotalColumns();
                    const nUnits = isTwoPage ? Math.ceil(nColumns / 2) : nColumns;
                    const unitIndex = Math.floor(gotoProgression * nUnits);
                    const unit = readium_css_1.isVerticalWritingMode() ?
                        win.document.documentElement.offsetHeight :
                        win.document.documentElement.offsetWidth;
                    const scrollOffsetPotentiallyExcessive = readium_css_1.isVerticalWritingMode() ?
                        (unitIndex * unit) :
                        ((readium_css_1.isRTL() ? -1 : 1) * unitIndex * unit);
                    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                    const scrollOffsetPaged = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                        Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                    _ignoreScrollEvent = true;
                    if (readium_css_1.isVerticalWritingMode()) {
                        scrollElement.scrollTop = scrollOffsetPaged;
                    }
                    else {
                        scrollElement.scrollLeft = scrollOffsetPaged;
                    }
                    setTimeout(() => {
                        _ignoreScrollEvent = false;
                    }, 10);
                    win.READIUM2.locationHashOverride = win.document.body;
                    resetLocationHashOverrideInfo();
                    processXYRaw(0, 0, false);
                    if (!win.READIUM2.locationHashOverride) {
                        notifyReadingLocationDebounced();
                    }
                    return;
                }
                const scrollOffset = gotoProgression * maxScrollShift;
                _ignoreScrollEvent = true;
                if (readium_css_1.isVerticalWritingMode()) {
                    scrollElement.scrollLeft = scrollOffset;
                }
                else {
                    scrollElement.scrollTop = scrollOffset;
                }
                setTimeout(() => {
                    _ignoreScrollEvent = false;
                }, 10);
                win.READIUM2.locationHashOverride = win.document.body;
                resetLocationHashOverrideInfo();
                processXYRaw(0, 0, false);
                if (!win.READIUM2.locationHashOverride) {
                    notifyReadingLocationDebounced();
                }
                return;
            }
        }
        _ignoreScrollEvent = true;
        scrollElement.scrollLeft = 0;
        scrollElement.scrollTop = 0;
        setTimeout(() => {
            _ignoreScrollEvent = false;
        }, 10);
        win.READIUM2.locationHashOverride = win.document.body;
        resetLocationHashOverrideInfo();
        processXYRaw(0, 0, false);
    }
    notifyReadingLocationDebounced();
};
const scrollToHashDebounced = debounce_1.debounce(() => {
    debug("++++ scrollToHashRaw FROM DEBOUNCED");
    scrollToHashRaw();
}, 100);
let _ignoreScrollEvent = false;
electron_1.ipcRenderer.on("R2_EVENT_HIDE", (_event) => {
    showHideContentMask(true);
});
function showHideContentMask(doHide) {
    if (doHide) {
        win.document.body.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    }
    else {
        win.document.body.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    }
}
function focusScrollRaw(el, doFocus) {
    win.READIUM2.locationHashOverride = el;
    scrollElementIntoView(win.READIUM2.locationHashOverride);
    if (doFocus) {
        setTimeout(() => {
            el.focus();
        }, 10);
    }
    notifyReadingLocationDebounced();
}
const focusScrollDebounced = debounce_1.debounce((el, doFocus) => {
    focusScrollRaw(el, doFocus);
}, 80);
let _ignoreFocusInEvent = false;
function handleTab(target, tabKeyDownEvent) {
    if (!target || !win.document.body) {
        return;
    }
    _ignoreFocusInEvent = false;
    const tabbables = win.document.body.tabbables ?
        win.document.body.tabbables :
        (win.document.body.tabbables = tabbable(win.document.body));
    const i = tabbables.indexOf(target);
    if (i === 0) {
        if (!tabKeyDownEvent || tabKeyDownEvent.shiftKey) {
            _ignoreFocusInEvent = true;
            focusScrollDebounced(target, true);
            return;
        }
        if (i < (tabbables.length - 1)) {
            tabKeyDownEvent.preventDefault();
            const nextTabbable = tabbables[i + 1];
            focusScrollDebounced(nextTabbable, true);
            return;
        }
    }
    else if (i === (tabbables.length - 1)) {
        if (!tabKeyDownEvent || !tabKeyDownEvent.shiftKey) {
            _ignoreFocusInEvent = true;
            focusScrollDebounced(target, true);
            return;
        }
        if (i > 0) {
            tabKeyDownEvent.preventDefault();
            const previousTabbable = tabbables[i - 1];
            focusScrollDebounced(previousTabbable, true);
            return;
        }
    }
    else if (i > 0) {
        if (tabKeyDownEvent) {
            if (tabKeyDownEvent.shiftKey) {
                tabKeyDownEvent.preventDefault();
                const previousTabbable = tabbables[i - 1];
                focusScrollDebounced(previousTabbable, true);
                return;
            }
            else {
                tabKeyDownEvent.preventDefault();
                const nextTabbable = tabbables[i + 1];
                focusScrollDebounced(nextTabbable, true);
                return;
            }
        }
    }
    if (!tabKeyDownEvent) {
        focusScrollDebounced(target, true);
    }
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, (_event, payload) => {
    showHideContentMask(false);
    readium_css_1.readiumCSS(win.document, payload);
    highlight_1.recreateAllHighlights(win);
});
let _docTitle;
win.addEventListener("DOMContentLoaded", () => {
    debug("############# DOMContentLoaded");
    const titleElement = win.document.documentElement.querySelector("head > title");
    if (titleElement && titleElement.textContent) {
        _docTitle = titleElement.textContent;
    }
    _cancelInitialScrollCheck = true;
    if (win.location.hash && win.location.hash.length > 1) {
        win.READIUM2.hashElement = win.document.getElementById(win.location.hash.substr(1));
        if (win.READIUM2.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                win.READIUM2.hashElement.setAttribute(styles_1.readPosCssStylesAttr1, "DOMContentLoaded hashElement");
            }
        }
    }
    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.ttsClickEnabled = false;
    let readiumcssJson;
    if (win.READIUM2.urlQueryParams) {
        const base64ReadiumCSS = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_CSS];
        if (base64ReadiumCSS) {
            let str;
            try {
                str = new Buffer(base64ReadiumCSS, "base64").toString("utf8");
                readiumcssJson = JSON.parse(str);
            }
            catch (err) {
                debug("################## READIUM CSS PARSE ERROR?!");
                debug(base64ReadiumCSS);
                debug(err);
                debug(str);
            }
        }
    }
    if (readiumcssJson) {
        win.READIUM2.isFixedLayout = (typeof readiumcssJson.isFixedLayout !== "undefined") ?
            readiumcssJson.isFixedLayout : false;
    }
    let didHide = false;
    if (!win.READIUM2.isFixedLayout) {
        if (win.READIUM2.urlQueryParams) {
            const previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
            const isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                didHide = true;
                showHideContentMask(true);
            }
        }
    }
    if (!didHide) {
        showHideContentMask(false);
    }
    const w = (readiumcssJson && readiumcssJson.fixedLayoutWebViewWidth) || win.innerWidth;
    const h = (readiumcssJson && readiumcssJson.fixedLayoutWebViewHeight) || win.innerHeight;
    const wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, w, h);
    if (wh) {
        win.READIUM2.fxlViewportWidth = wh.width;
        win.READIUM2.fxlViewportHeight = wh.height;
        win.READIUM2.fxlViewportScale = wh.scale;
    }
    const alreadedInjected = win.document.documentElement.hasAttribute("data-readiumcss-injected");
    if (alreadedInjected) {
        debug(">>>>> ReadiumCSS already injected by streamer");
    }
    readium_css_1.computeVerticalRTL();
    if (readiumcssJson) {
        if (readium_css_1.isVerticalWritingMode() ||
            !alreadedInjected) {
            debug(">>>>>> ReadiumCSS inject again");
            readium_css_1.readiumCSS(win.document, readiumcssJson);
        }
    }
    if (!win.READIUM2.isFixedLayout) {
        if (!alreadedInjected) {
            readium_css_inject_1.injectDefaultCSS(win.document);
            if (IS_DEV) {
                readium_css_inject_1.injectReadPosCSS(win.document);
            }
        }
        if (alreadedInjected) {
            readium_css_1.checkHiddenFootNotes(win.document);
        }
    }
    setTimeout(() => {
        loaded(true);
    }, 500);
});
let _cancelInitialScrollCheck = false;
let _loaded = false;
function loaded(forced) {
    if (_loaded) {
        return;
    }
    _loaded = true;
    if (forced) {
        debug(">>> LOAD EVENT WAS FORCED!");
    }
    else {
        debug(">>> LOAD EVENT was not forced.");
    }
    if (!win.READIUM2.isFixedLayout) {
        debug("++++ scrollToHashDebounced FROM LOAD");
        scrollToHashDebounced();
        _cancelInitialScrollCheck = false;
        setTimeout(() => {
            if (_cancelInitialScrollCheck) {
                return;
            }
        }, 500);
    }
    else {
        win.READIUM2.locationHashOverride = win.document.body;
        notifyReadingLocationDebounced();
    }
    const useResizeSensor = !win.READIUM2.isFixedLayout;
    if (useResizeSensor && win.document.body) {
        setTimeout(() => {
            let _firstResizeSensor = true;
            new ResizeSensor(win.document.body, () => {
                if (_firstResizeSensor) {
                    _firstResizeSensor = false;
                    debug("ResizeSensor SKIP FIRST");
                    return;
                }
                debug("ResizeSensor");
                win.document.body.tabbables = undefined;
                debug("++++ scrollToHashDebounced FROM RESIZE SENSOR");
                scrollToHashDebounced();
            });
            setTimeout(() => {
                if (_firstResizeSensor) {
                    _firstResizeSensor = false;
                    debug("ResizeSensor CANCEL SKIP FIRST");
                }
            }, 700);
        }, 1000);
    }
    win.document.body.addEventListener("focusin", (ev) => {
        if (_ignoreFocusInEvent) {
            _ignoreFocusInEvent = false;
            return;
        }
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        if (ev.target) {
            let mouseClickOnLink = false;
            if (win.document && win.document.documentElement) {
                if (!win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_KEYBOARD_INTERACT)) {
                    if (ev.target.tagName.toLowerCase() === "a" && ev.target.href) {
                        mouseClickOnLink = true;
                    }
                }
            }
            if (!mouseClickOnLink) {
                handleTab(ev.target, undefined);
            }
        }
    });
    win.document.body.addEventListener("keydown", (ev) => {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        const TAB_KEY = 9;
        if (ev.which === TAB_KEY) {
            if (ev.target) {
                handleTab(ev.target, ev);
            }
        }
    }, true);
    win.document.documentElement.addEventListener("keydown", (ev) => {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.add(styles_1.ROOT_CLASS_KEYBOARD_INTERACT);
        }
        if (ev.keyCode === 37 || ev.keyCode === 39) {
            if (ev.target && elementCapturesKeyboardArrowKeys(ev.target)) {
                ev.target.r2_leftrightKeyboardTimeStamp = new Date();
            }
        }
    }, true);
    win.document.documentElement.addEventListener("mousedown", (_ev) => {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_KEYBOARD_INTERACT);
        }
    }, true);
    win.document.addEventListener("click", (ev) => {
        let currentElement = ev.target;
        let href;
        while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
            if (currentElement.tagName.toLowerCase() === "a") {
                href = currentElement.href;
                break;
            }
            currentElement = currentElement.parentNode;
        }
        if (!href) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        const done = popupFootNotes_1.popupFootNote(currentElement, focusScrollRaw, href, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        if (!done) {
            focusScrollDebounced.clear();
            processXYDebounced.clear();
            notifyReadingLocationDebounced.clear();
            scrollToHashDebounced.clear();
            const payload = {
                url: href,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
        }
        return false;
    }, true);
    const onResizeRaw = () => {
        const wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight);
        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
            win.READIUM2.fxlViewportScale = wh.scale;
        }
        debug("++++ scrollToHashDebounced FROM RESIZE");
        scrollToHashDebounced();
    };
    const onResizeDebounced = debounce_1.debounce(() => {
        onResizeRaw();
    }, 200);
    let _firstWindowResize = true;
    win.addEventListener("resize", () => {
        if (_firstWindowResize) {
            debug("Window resize, SKIP FIRST");
            _firstWindowResize = false;
            return;
        }
        if (webview_resize_1.ENABLE_WEBVIEW_RESIZE) {
            onResizeRaw();
        }
        else {
            onResizeDebounced();
        }
    });
    setTimeout(() => {
        win.addEventListener("scroll", (_ev) => {
            if (_ignoreScrollEvent) {
                _ignoreScrollEvent = false;
                return;
            }
            if (!win.document || !win.document.documentElement) {
                return;
            }
            const x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
            processXYDebounced(x, 0, false);
        });
    }, 200);
    function handleMouseEvent(ev) {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        const x = ev.clientX;
        const y = ev.clientY;
        processXYDebounced(x, y, false);
        if (win.READIUM2.ttsClickEnabled) {
            let element;
            const range = win.document.caretRangeFromPoint(x, y);
            if (range) {
                const node = range.startContainer;
                if (node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        element = node;
                    }
                    else if (node.nodeType === Node.TEXT_NODE) {
                        if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                            element = node.parentNode;
                        }
                    }
                }
            }
            if (element) {
                if (ev.altKey) {
                    readaloud_1.ttsPlay(focusScrollRaw, element, undefined, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                    return;
                }
                readaloud_1.ttsPlay(focusScrollRaw, element.ownerDocument.body, element, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
            }
        }
    }
    win.document.documentElement.addEventListener("mouseup", (ev) => {
        handleMouseEvent(ev);
    });
}
win.addEventListener("load", () => {
    debug("############# load");
    loaded(false);
});
function checkBlacklisted(el) {
    let blacklistedId;
    const id = el.getAttribute("id");
    if (id && _blacklistIdClassForCFI.indexOf(id) >= 0) {
        console.log("checkBlacklisted ID: " + id);
        blacklistedId = id;
    }
    let blacklistedClass;
    for (const item of _blacklistIdClassForCFI) {
        if (el.classList.contains(item)) {
            console.log("checkBlacklisted CLASS: " + item);
            blacklistedClass = item;
            break;
        }
    }
    if (blacklistedId || blacklistedClass) {
        return true;
    }
    return false;
}
function findFirstVisibleElement(rootElement) {
    const blacklisted = checkBlacklisted(rootElement);
    if (blacklisted) {
        return undefined;
    }
    for (let i = 0; i < rootElement.children.length; i++) {
        const child = rootElement.children[i];
        if (child.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }
        const visibleElement = findFirstVisibleElement(child);
        if (visibleElement) {
            return visibleElement;
        }
    }
    if (rootElement !== win.document.body &&
        rootElement !== win.document.documentElement) {
        const visible = computeVisibility_(rootElement);
        if (visible) {
            return rootElement;
        }
    }
    return undefined;
}
const processXYRaw = (x, y, reverse) => {
    if (popup_dialog_1.isPopupDialogOpen(win.document)) {
        return;
    }
    let element;
    const range = win.document.caretRangeFromPoint(x, y);
    if (range) {
        const node = range.startContainer;
        if (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                element = node;
            }
            else if (node.nodeType === Node.TEXT_NODE) {
                if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                    element = node.parentNode;
                }
            }
        }
    }
    if (!element || element === win.document.body || element === win.document.documentElement) {
        const root = win.document.body;
        element = findFirstVisibleElement(root);
        if (!element) {
            debug("|||||||||||||| cannot find visible element inside BODY / HTML????");
            element = win.document.body;
        }
    }
    else if (!computeVisibility_(element)) {
        let next = element;
        let found;
        while (next) {
            const firstInside = findFirstVisibleElement(next);
            if (firstInside) {
                found = firstInside;
                break;
            }
            let sibling = reverse ? next.previousElementSibling : next.nextElementSibling;
            let parent = next;
            while (!sibling) {
                parent = parent.parentNode;
                if (!parent || parent.nodeType !== Node.ELEMENT_NODE) {
                    break;
                }
                sibling = reverse ?
                    parent.previousElementSibling :
                    parent.nextElementSibling;
            }
            next = sibling ? sibling : undefined;
        }
        if (found) {
            element = found;
        }
        else {
            debug("|||||||||||||| cannot find visible element after current????");
        }
    }
    if (element === win.document.body || element === win.document.documentElement) {
        debug("|||||||||||||| BODY/HTML selected????");
    }
    if (element) {
        win.READIUM2.locationHashOverride = element;
        notifyReadingLocationDebounced();
        if (win.READIUM2.DEBUG_VISUALS) {
            const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr2}]`);
            existings.forEach((existing) => {
                existing.removeAttribute(`${styles_1.readPosCssStylesAttr2}`);
            });
            element.setAttribute(styles_1.readPosCssStylesAttr2, "processXYRaw");
        }
    }
};
const processXYDebounced = debounce_1.debounce((x, y, reverse) => {
    processXYRaw(x, y, reverse);
}, 300);
exports.computeProgressionData = () => {
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    const isTwoPage = readium_css_1.isTwoPageSpread();
    const { maxScrollShift, maxScrollShiftAdjusted } = readium_css_1.calculateMaxScrollShift();
    const totalColumns = readium_css_1.calculateTotalColumns();
    let progressionRatio = 0;
    let currentColumn = 0;
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    let extraShift = 0;
    if (isPaged) {
        if (maxScrollShift > 0) {
            if (readium_css_1.isVerticalWritingMode()) {
                progressionRatio = scrollElement.scrollTop / maxScrollShift;
            }
            else {
                extraShift = scrollElement.scrollLeftExtra;
                if (extraShift) {
                    progressionRatio = (((readium_css_1.isRTL() ? -1 : 1) * scrollElement.scrollLeft) + extraShift) /
                        maxScrollShiftAdjusted;
                }
                else {
                    progressionRatio = ((readium_css_1.isRTL() ? -1 : 1) * scrollElement.scrollLeft) / maxScrollShift;
                }
            }
        }
        const adjustedTotalColumns = (extraShift ? (totalColumns + 1) : totalColumns) - (isTwoPage ? 2 : 1);
        currentColumn = adjustedTotalColumns * progressionRatio;
        currentColumn = Math.round(currentColumn);
    }
    else {
        if (maxScrollShift > 0) {
            if (readium_css_1.isVerticalWritingMode()) {
                progressionRatio = ((readium_css_1.isRTL() ? -1 : 1) * scrollElement.scrollLeft) / maxScrollShift;
            }
            else {
                progressionRatio = scrollElement.scrollTop / maxScrollShift;
            }
        }
    }
    if (win.READIUM2.locationHashOverride) {
        const element = win.READIUM2.locationHashOverride;
        let offset = 0;
        if (isPaged) {
            const visible = computeVisibility_(element);
            if (visible) {
                const curCol = extraShift ? (currentColumn - 1) : currentColumn;
                const columnDimension = readium_css_1.calculateColumnDimension();
                if (readium_css_1.isVerticalWritingMode()) {
                    const rect = element.getBoundingClientRect();
                    offset = (curCol * scrollElement.scrollWidth) + rect.left +
                        (rect.top >= columnDimension ? scrollElement.scrollWidth : 0);
                }
                else {
                    const boundingRect = element.getBoundingClientRect();
                    const clientRects = rect_utils_1.getClientRectsNoOverlap_(element.getClientRects());
                    let rectangle;
                    for (const rect of clientRects) {
                        if (!rectangle) {
                            rectangle = rect;
                            continue;
                        }
                        if (readium_css_1.isRTL()) {
                            if ((rect.left + rect.width) > (columnDimension * (isTwoPage ? 2 : 1))) {
                                continue;
                            }
                            if (isTwoPage) {
                                if ((boundingRect.left + boundingRect.width) >= columnDimension &&
                                    (rect.left + rect.width) < columnDimension) {
                                    continue;
                                }
                            }
                            if ((boundingRect.left + boundingRect.width) >= 0 &&
                                (rect.left + rect.width) < 0) {
                                continue;
                            }
                        }
                        else {
                            if (rect.left < 0) {
                                continue;
                            }
                            if (boundingRect.left < columnDimension &&
                                rect.left >= columnDimension) {
                                continue;
                            }
                            if (isTwoPage) {
                                const boundary = 2 * columnDimension;
                                if (boundingRect.left < boundary &&
                                    rect.left >= boundary) {
                                    continue;
                                }
                            }
                        }
                        if (rect.top < rectangle.top) {
                            rectangle = rect;
                            continue;
                        }
                    }
                    if (!rectangle) {
                        rectangle = element.getBoundingClientRect();
                    }
                    offset = (curCol * scrollElement.scrollHeight) + rectangle.top;
                    if (isTwoPage) {
                        if (readium_css_1.isRTL()) {
                            if (rectangle.left < columnDimension) {
                                offset += scrollElement.scrollHeight;
                            }
                        }
                        else {
                            if (rectangle.left >= columnDimension) {
                                offset += scrollElement.scrollHeight;
                            }
                        }
                    }
                }
                const totalDocumentDimension = ((readium_css_1.isVerticalWritingMode() ? scrollElement.scrollWidth :
                    scrollElement.scrollHeight) * totalColumns);
                progressionRatio = offset / totalDocumentDimension;
                currentColumn = totalColumns * progressionRatio;
                currentColumn = Math.floor(currentColumn);
            }
        }
        else {
            const rect = element.getBoundingClientRect();
            if (readium_css_1.isVerticalWritingMode()) {
                offset = ((readium_css_1.isRTL() ? -1 : 1) * scrollElement.scrollLeft) + rect.left + (readium_css_1.isRTL() ? rect.width : 0);
            }
            else {
                offset = scrollElement.scrollTop + rect.top;
            }
            progressionRatio = offset /
                (readium_css_1.isVerticalWritingMode() ? scrollElement.scrollWidth : scrollElement.scrollHeight);
        }
    }
    let spreadIndex = 0;
    if (isPaged) {
        spreadIndex = isTwoPage ? Math.floor(currentColumn / 2) : currentColumn;
    }
    return {
        paginationInfo: isPaged ? {
            currentColumn,
            isTwoPageSpread: isTwoPage,
            spreadIndex,
            totalColumns,
        } : undefined,
        percentRatio: progressionRatio,
    };
};
const _blacklistIdClassForCssSelectors = [styles_1.POPUP_DIALOG_CLASS, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_ID_SPEAKING_DOC_ELEMENT, styles_1.ROOT_CLASS_KEYBOARD_INTERACT, styles_1.ROOT_CLASS_INVISIBLE_MASK, readium_css_inject_1.CLASS_PAGINATED, styles_1.ROOT_CLASS_NO_FOOTNOTES];
const _blacklistIdClassForCFI = [styles_1.POPUP_DIALOG_CLASS, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, "resize-sensor"];
exports.computeCFI = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    let cfi = "";
    let currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        const blacklisted = checkBlacklisted(currentElement);
        if (!blacklisted) {
            const currentElementParentChildren = currentElement.parentNode.children;
            let currentElementIndex = -1;
            for (let i = 0; i < currentElementParentChildren.length; i++) {
                if (currentElement === currentElementParentChildren[i]) {
                    currentElementIndex = i;
                    break;
                }
            }
            if (currentElementIndex >= 0) {
                const cfiIndex = (currentElementIndex + 1) * 2;
                cfi = cfiIndex +
                    (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                    (cfi.length ? ("/" + cfi) : "");
            }
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
function getCssSelector(element) {
    const options = {
        className: (str) => {
            return _blacklistIdClassForCssSelectors.indexOf(str) < 0;
        },
        idName: (str) => {
            return _blacklistIdClassForCssSelectors.indexOf(str) < 0;
        },
    };
    return cssselector2_1.uniqueCssSelector(element, win.document, options);
}
const notifyReadingLocationRaw = () => {
    if (!win.READIUM2.locationHashOverride) {
        return;
    }
    let progressionData;
    const cssSelector = getCssSelector(win.READIUM2.locationHashOverride);
    const cfi = exports.computeCFI(win.READIUM2.locationHashOverride);
    let progression = 0;
    if (win.READIUM2.isFixedLayout) {
        progression = 1;
    }
    else {
        progressionData = exports.computeProgressionData();
        progression = progressionData.percentRatio;
    }
    const pinfo = (progressionData && progressionData.paginationInfo) ?
        progressionData.paginationInfo : undefined;
    const selInfo = selection_2.getCurrentSelectionInfo(win, getCssSelector, exports.computeCFI);
    const text = selInfo ? {
        after: undefined,
        before: undefined,
        highlight: selInfo.cleanText,
    } : undefined;
    let selectionIsNew;
    if (selInfo) {
        selectionIsNew =
            !win.READIUM2.locationHashOverrideInfo ||
                !win.READIUM2.locationHashOverrideInfo.selectionInfo ||
                !selection_1.sameSelections(win.READIUM2.locationHashOverrideInfo.selectionInfo, selInfo);
    }
    win.READIUM2.locationHashOverrideInfo = {
        docInfo: {
            isFixedLayout: win.READIUM2.isFixedLayout,
            isRightToLeft: readium_css_1.isRTL(),
            isVerticalWritingMode: readium_css_1.isVerticalWritingMode(),
        },
        href: "",
        locations: {
            cfi,
            cssSelector,
            position: undefined,
            progression,
        },
        paginationInfo: pinfo,
        selectionInfo: selInfo,
        selectionIsNew,
        text,
        title: _docTitle,
    };
    const payload = win.READIUM2.locationHashOverrideInfo;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (win.READIUM2.DEBUG_VISUALS) {
        const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr4}]`);
        existings.forEach((existing) => {
            existing.removeAttribute(`${styles_1.readPosCssStylesAttr4}`);
        });
        win.READIUM2.locationHashOverride.setAttribute(styles_1.readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
const notifyReadingLocationDebounced = debounce_1.debounce(() => {
    notifyReadingLocationRaw();
}, 250);
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PLAY, (_event, payload) => {
    const rootElement = win.document.querySelector(payload.rootElement);
    const startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;
    readaloud_1.ttsPlay(focusScrollRaw, rootElement ? rootElement : undefined, startElement ? startElement : undefined, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_STOP, (_event) => {
    readaloud_1.ttsStop();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PAUSE, (_event) => {
    readaloud_1.ttsPause();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_RESUME, (_event) => {
    readaloud_1.ttsResume();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_NEXT, (_event) => {
    readaloud_1.ttsNext();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PREVIOUS, (_event) => {
    readaloud_1.ttsPrevious();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_CLICK_ENABLE, (_event, payload) => {
    win.READIUM2.ttsClickEnabled = payload.doEnable;
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_CREATE, (_event, payloadPing) => {
    if (payloadPing.highlightDefinitions &&
        payloadPing.highlightDefinitions.length === 1 &&
        payloadPing.highlightDefinitions[0].selectionInfo) {
        const selection = win.getSelection();
        if (selection) {
            selection.collapseToStart();
        }
    }
    const highlightDefinitions = !payloadPing.highlightDefinitions ?
        [{ color: undefined, selectionInfo: undefined }] :
        payloadPing.highlightDefinitions;
    const highlights = [];
    highlightDefinitions.forEach((highlightDefinition) => {
        const selInfo = highlightDefinition.selectionInfo ? highlightDefinition.selectionInfo :
            selection_2.getCurrentSelectionInfo(win, getCssSelector, exports.computeCFI);
        if (selInfo) {
            const highlight = highlight_1.createHighlight(win, selInfo, highlightDefinition.color, true);
            highlights.push(highlight);
        }
        else {
            highlights.push(null);
        }
    });
    const payloadPong = {
        highlightDefinitions: payloadPing.highlightDefinitions,
        highlights: highlights.length ? highlights : undefined,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPong);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_REMOVE, (_event, payload) => {
    payload.highlightIDs.forEach((highlightID) => {
        highlight_1.destroyHighlight(win.document, highlightID);
    });
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL, (_event) => {
    highlight_1.destroyAllhighlights(win.document);
});
//# sourceMappingURL=preload.js.map