"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCFI = exports.computeProgressionData = void 0;
const debounce_1 = require("debounce");
const debug_ = require("debug");
const electron_1 = require("electron");
const tabbable_1 = require("tabbable");
const events_1 = require("../../common/events");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const selection_1 = require("../../common/selection");
const styles_1 = require("../../common/styles");
const animateProperty_1 = require("../common/animateProperty");
const cssselector2_1 = require("../common/cssselector2");
const dom_text_utils_1 = require("../common/dom-text-utils");
const easings_1 = require("../common/easings");
const popup_dialog_1 = require("../common/popup-dialog");
const querystring_1 = require("../common/querystring");
const rect_utils_1 = require("../common/rect-utils");
const url_params_1 = require("../common/url-params");
const audiobook_1 = require("./audiobook");
const epubReadingSystem_1 = require("./epubReadingSystem");
const highlight_1 = require("./highlight");
const popupFootNotes_1 = require("./popupFootNotes");
const readaloud_1 = require("./readaloud");
const readium_css_1 = require("./readium-css");
const selection_2 = require("./selection");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    const cr = require("../common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
}
const debug = debug_("r2:navigator#electron/renderer/webview/preload");
const win = global.window;
win.READIUM2 = {
    DEBUG_VISUALS: false,
    fxlViewportHeight: 0,
    fxlViewportScale: 1,
    fxlViewportWidth: 0,
    hashElement: null,
    isAudio: false,
    isClipboardIntercept: false,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideInfo: {
        audioPlaybackInfo: undefined,
        docInfo: undefined,
        epubPage: undefined,
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
        },
        paginationInfo: undefined,
        secondWebViewHref: undefined,
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
        userInteract: false,
    },
    ttsClickEnabled: false,
    ttsOverlayEnabled: false,
    ttsPlaybackRate: 1,
    ttsSentenceDetectionEnabled: true,
    ttsVoice: null,
    urlQueryParams: win.location.search ? querystring_1.getURLQueryParams(win.location.search) : undefined,
    webViewSlot: styles_1.WebViewSlotEnum.center,
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
const CSS_PIXEL_TOLERANCE = 5;
function keyDownUpEventHandler(ev, keyDown) {
    const elementName = (ev.target && ev.target.nodeName) ?
        ev.target.nodeName : "";
    const elementAttributes = {};
    if (ev.target && ev.target.attributes) {
        for (let i = 0; i < ev.target.attributes.length; i++) {
            const attr = ev.target.attributes[i];
            elementAttributes[attr.name] = attr.value;
        }
    }
    const payload = {
        altKey: ev.altKey,
        code: ev.code,
        ctrlKey: ev.ctrlKey,
        elementAttributes,
        elementName,
        key: ev.key,
        metaKey: ev.metaKey,
        shiftKey: ev.shiftKey,
    };
    electron_1.ipcRenderer.sendToHost(keyDown ? events_1.R2_EVENT_WEBVIEW_KEYDOWN : events_1.R2_EVENT_WEBVIEW_KEYUP, payload);
}
win.document.addEventListener("keydown", (ev) => {
    keyDownUpEventHandler(ev, true);
}, {
    capture: true,
    once: false,
    passive: false,
});
win.document.addEventListener("keyup", (ev) => {
    keyDownUpEventHandler(ev, false);
}, {
    capture: true,
    once: false,
    passive: false,
});
win.READIUM2.isAudio = win.location.protocol === "data:";
if (win.READIUM2.urlQueryParams) {
    let readiumEpubReadingSystemJson;
    const base64EpubReadingSystem = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_EPUBREADINGSYSTEM];
    if (base64EpubReadingSystem) {
        try {
            const str = Buffer.from(base64EpubReadingSystem, "base64").toString("utf8");
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
    win.READIUM2.isClipboardIntercept = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] === "true";
    win.READIUM2.webViewSlot =
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_WEBVIEW_SLOT] === "left" ? styles_1.WebViewSlotEnum.left :
            (win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_WEBVIEW_SLOT] === "right" ? styles_1.WebViewSlotEnum.right :
                styles_1.WebViewSlotEnum.center);
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
                _blacklistIdClassForCssSelectors.push(payload.cssClass.toLowerCase());
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
function computeVisibility_(element, domRect) {
    if (win.READIUM2.isFixedLayout) {
        return true;
    }
    else if (!win.document || !win.document.documentElement || !win.document.body) {
        return false;
    }
    if (element === win.document.body || element === win.document.documentElement) {
        return true;
    }
    const blacklisted = checkBlacklisted(element);
    if (blacklisted) {
        return false;
    }
    const elStyle = win.getComputedStyle(element);
    if (elStyle) {
        const display = elStyle.getPropertyValue("display");
        if (display === "none") {
            if (IS_DEV) {
                debug("element DISPLAY NONE");
            }
            return false;
        }
        const opacity = elStyle.getPropertyValue("opacity");
        if (opacity === "0") {
            if (IS_DEV) {
                debug("element OPACITY ZERO");
            }
            return false;
        }
    }
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    if (!readium_css_inject_1.isPaginated(win.document)) {
        const rect = domRect || element.getBoundingClientRect();
        if (rect.top >= 0 &&
            rect.top <= win.document.documentElement.clientHeight) {
            return true;
        }
        return false;
    }
    if (readium_css_1.isVerticalWritingMode()) {
        return false;
    }
    const scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element, domRect);
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
    if (win.READIUM2.isAudio) {
        visible = true;
    }
    else if (win.READIUM2.isFixedLayout) {
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
            visible = computeVisibility_(selected, undefined);
        }
    }
    return visible;
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_LOCATOR_VISIBLE, (_event, payload) => {
    payload.visible = computeVisibility(payload.location);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LOCATOR_VISIBLE, payload);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, (_event, payload) => {
    if (win.READIUM2.isAudio) {
        return;
    }
    showHideContentMask(false, win.READIUM2.isFixedLayout);
    selection_2.clearCurrentSelection(win);
    popup_dialog_1.closePopupDialogs(win.document);
    if (!win.READIUM2.urlQueryParams) {
        win.READIUM2.urlQueryParams = {};
    }
    if (payload.isSecondWebView) {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] = "1";
    }
    else {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] = "0";
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
    if (payload.gotoDomRange) {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO_DOM_RANGE] = payload.gotoDomRange;
    }
    else {
        if (typeof win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO_DOM_RANGE] !== "undefined") {
            delete win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO_DOM_RANGE];
        }
    }
    if (win.READIUM2.isFixedLayout) {
        win.READIUM2.locationHashOverride = win.document.body;
        resetLocationHashOverrideInfo();
        debug("processXYRaw BODY");
        processXYRaw(0, 0, false);
        notifyReadingLocationDebounced();
        return;
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
            scrollToHashRaw(false);
        }, 100);
    }
    else {
        debug("++++ scrollToHashRaw FROM SCROLL_TO");
        scrollToHashRaw(false);
    }
});
function resetLocationHashOverrideInfo() {
    win.READIUM2.locationHashOverrideInfo = {
        audioPlaybackInfo: undefined,
        docInfo: undefined,
        epubPage: undefined,
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
        },
        paginationInfo: undefined,
        secondWebViewHref: undefined,
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
        userInteract: false,
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
    let dialogPopup = popup_dialog_1.isPopupDialogOpen(win.document);
    if (dialogPopup) {
        const diagEl = win.document.getElementById(styles_1.POPUP_DIALOG_CLASS);
        if (diagEl) {
            const isCollapsed = diagEl.classList.contains(styles_1.POPUP_DIALOG_CLASS_COLLAPSE);
            if (isCollapsed) {
                dialogPopup = false;
            }
        }
    }
    const noChange = dialogPopup ||
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
    if (win.READIUM2.isAudio || win.READIUM2.isFixedLayout || !win.document.body) {
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
    const animationTime = 300;
    if (_lastAnimState && _lastAnimState.animating) {
        win.cancelAnimationFrame(_lastAnimState.id);
        _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
    }
    if (!goPREVIOUS) {
        const maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
        const maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;
        if (isPaged) {
            const unit = readium_css_1.isVerticalWritingMode() ?
                win.document.documentElement.offsetHeight :
                win.document.documentElement.offsetWidth;
            let scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                scrollElement.scrollTop :
                scrollElement.scrollLeft);
            const isNegative = scrollElementOffset < 0;
            const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
            const fractional = scrollElementOffsetAbs / unit;
            const integral = Math.floor(fractional);
            const decimal = fractional - integral;
            const partial = decimal * unit;
            if (partial <= CSS_PIXEL_TOLERANCE) {
                scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
            }
            else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
            }
            if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs < maxScrollShiftTolerated) ||
                !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs < maxScrollShiftTolerated)) {
                const scrollOffsetPotentiallyExcessive_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElementOffset + unit) :
                    (scrollElementOffset + (readium_css_1.isRTL() ? -1 : 1) * unit);
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
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, (_cancelled) => {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                payload.direction = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) < maxScrollShiftTolerated) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) < maxScrollShiftTolerated)) {
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
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, (_cancelled) => {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                payload.direction = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            const unit = readium_css_1.isVerticalWritingMode() ?
                win.document.documentElement.offsetHeight :
                win.document.documentElement.offsetWidth;
            let scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                scrollElement.scrollTop :
                scrollElement.scrollLeft);
            const isNegative = scrollElementOffset < 0;
            const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
            const fractional = scrollElementOffsetAbs / unit;
            const integral = Math.floor(fractional);
            const decimal = fractional - integral;
            const partial = decimal * unit;
            if (partial <= CSS_PIXEL_TOLERANCE) {
                scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
            }
            else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
            }
            if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs > 0) ||
                !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs > 0)) {
                const scrollOffset_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElementOffset - unit) :
                    (scrollElementOffset - (readium_css_1.isRTL() ? -1 : 1) * unit);
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
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, (_cancelled) => {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                payload.direction = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
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
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, (_cancelled) => {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                payload.direction = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
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
let _lastAnimState2;
const animationTime2 = 400;
function scrollElementIntoView(element, doFocus, animate, domRect) {
    if (win.READIUM2.DEBUG_VISUALS) {
        const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr3}]`);
        existings.forEach((existing) => {
            existing.removeAttribute(`${styles_1.readPosCssStylesAttr3}`);
        });
        element.setAttribute(styles_1.readPosCssStylesAttr3, "scrollElementIntoView");
    }
    if (win.READIUM2.isFixedLayout) {
        debug("scrollElementIntoView_ SKIP FXL");
        return;
    }
    if (doFocus) {
        if (!domRect && !tabbable_1.isFocusable(element)) {
            const attr = element.getAttribute("tabindex");
            if (!attr) {
                element.setAttribute("tabindex", "-1");
                element.classList.add(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE);
                if (IS_DEV) {
                    debug("tabindex -1 set (focusable):");
                    debug(getCssSelector(element));
                }
            }
        }
        const targets = win.document.querySelectorAll(`.${styles_1.LINK_TARGET_CLASS}`);
        targets.forEach((t) => {
            t.classList.remove(styles_1.LINK_TARGET_CLASS);
        });
        element.style.animation = "none";
        void element.offsetWidth;
        element.style.animation = "";
        element.classList.add(styles_1.LINK_TARGET_CLASS);
        if (element._timeoutTargetClass) {
            clearTimeout(element._timeoutTargetClass);
            element._timeoutTargetClass = undefined;
        }
        element._timeoutTargetClass = setTimeout(() => {
            debug("ANIMATION TIMEOUT REMOVE");
            element.classList.remove(styles_1.LINK_TARGET_CLASS);
        }, 2000);
        if (!domRect) {
            element.focus();
        }
    }
    setTimeout(() => {
        const isPaged = readium_css_inject_1.isPaginated(win.document);
        if (isPaged) {
            scrollIntoView(element, domRect);
        }
        else {
            const scrollElement = readium_css_1.getScrollingElement(win.document);
            const rect = domRect || element.getBoundingClientRect();
            const scrollTopMax = scrollElement.scrollHeight - win.document.documentElement.clientHeight;
            let offset = scrollElement.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2));
            if (offset > scrollTopMax) {
                offset = scrollTopMax;
            }
            else if (offset < 0) {
                offset = 0;
            }
            const diff = Math.abs(scrollElement.scrollTop - offset);
            if (diff < 10) {
                return;
            }
            if (animate) {
                const reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
                if (_lastAnimState2 && _lastAnimState2.animating) {
                    win.cancelAnimationFrame(_lastAnimState2.id);
                    _lastAnimState2.object[_lastAnimState2.property] = _lastAnimState2.destVal;
                }
                const targetObj = scrollElement;
                const targetProp = "scrollTop";
                if (reduceMotion) {
                    _lastAnimState2 = undefined;
                    targetObj[targetProp] = offset;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState2 = animateProperty_1.animateProperty(win.cancelAnimationFrame, (_cancelled) => {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime2, targetObj, offset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
            }
            else {
                scrollElement.scrollTop = offset;
            }
        }
    }, doFocus ? 100 : 0);
}
function getScrollOffsetIntoView(element, domRect) {
    if (!win.document || !win.document.documentElement || !win.document.body ||
        !readium_css_inject_1.isPaginated(win.document) || readium_css_1.isVerticalWritingMode()) {
        return 0;
    }
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const rect = domRect || element.getBoundingClientRect();
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
function scrollIntoView(element, domRect) {
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return;
    }
    const maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
    const scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element, domRect);
    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
    const scrollElement = readium_css_1.getScrollingElement(win.document);
    const scrollOffset = (scrollLeftPotentiallyExcessive < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive), maxScrollShift);
    scrollElement.scrollLeft = scrollOffset;
}
const scrollToHashRaw = (animate) => {
    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    highlight_1.recreateAllHighlights(win);
    if (win.READIUM2.isFixedLayout) {
        debug("scrollToHashRaw skipped, FXL");
        return;
    }
    debug("++++ scrollToHashRaw");
    const isPaged = readium_css_inject_1.isPaginated(win.document);
    if (win.READIUM2.locationHashOverride) {
        scrollElementIntoView(win.READIUM2.locationHashOverride, true, animate, undefined);
        notifyReadingLocationDebounced();
        return;
    }
    else if (win.READIUM2.hashElement) {
        win.READIUM2.locationHashOverride = win.READIUM2.hashElement;
        scrollElementIntoView(win.READIUM2.hashElement, true, animate, undefined);
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
                    showHideContentMask(false, win.READIUM2.isFixedLayout);
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
                const locStr = Buffer.from(gto, "base64").toString("utf8");
                const locObj = JSON.parse(locStr);
                gotoCssSelector = locObj.cssSelector;
                gotoProgression = locObj.progression;
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
                    win.READIUM2.hashElement = selected;
                    resetLocationHashOverrideInfo();
                    if (win.READIUM2.locationHashOverrideInfo) {
                        win.READIUM2.locationHashOverrideInfo.locations.cssSelector = gotoCssSelector;
                    }
                    let domRect;
                    const gtoDomRange = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO_DOM_RANGE];
                    if (gtoDomRange) {
                        try {
                            const rangeInfoStr = Buffer.from(gtoDomRange, "base64").toString("utf8");
                            const rangeInfo = JSON.parse(rangeInfoStr);
                            debug("rangeInfo", rangeInfo);
                            const domRange = selection_2.convertRangeInfo(win.document, rangeInfo);
                            if (domRange) {
                                domRect = domRange.getBoundingClientRect();
                            }
                        }
                        catch (err) {
                            debug("gtoDomRange", err);
                        }
                    }
                    scrollElementIntoView(selected, true, animate, domRect);
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
        debug("processXYRaw BODY");
        processXYRaw(0, 0, false);
    }
    notifyReadingLocationDebounced();
};
const scrollToHashDebounced = debounce_1.debounce((animate) => {
    debug("++++ scrollToHashRaw FROM DEBOUNCED");
    scrollToHashRaw(animate);
}, 100);
let _ignoreScrollEvent = false;
electron_1.ipcRenderer.on("R2_EVENT_HIDE", (_event, payload) => {
    showHideContentMask(true, payload);
});
function showHideContentMask(doHide, isFixedLayout) {
    if (doHide) {
        win.document.documentElement.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK);
        win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED);
    }
    else {
        if (isFixedLayout) {
            win.document.documentElement.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED);
        }
        win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    }
}
function focusScrollRaw(el, doFocus, animate, domRect) {
    scrollElementIntoView(el, doFocus, animate, domRect);
    if (win.READIUM2.locationHashOverride === el) {
        return;
    }
    const blacklisted = checkBlacklisted(el);
    if (blacklisted) {
        return;
    }
    win.READIUM2.locationHashOverride = el;
    notifyReadingLocationDebounced();
}
const focusScrollDebounced = debounce_1.debounce((el, doFocus, animate, domRect) => {
    focusScrollRaw(el, doFocus, animate, domRect);
}, 100);
const handleFocusInDebounced = debounce_1.debounce((target, tabKeyDownEvent) => {
    handleFocusInRaw(target, tabKeyDownEvent);
}, 100);
function handleFocusInRaw(target, _tabKeyDownEvent) {
    if (!target || !win.document.body) {
        return;
    }
    focusScrollRaw(target, false, false, undefined);
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, (_event, payload) => {
    showHideContentMask(true, payload.isFixedLayout || win.READIUM2.isFixedLayout);
    readium_css_1.readiumCSS(win.document, payload);
    highlight_1.recreateAllHighlights(win);
    showHideContentMask(false, payload.isFixedLayout || win.READIUM2.isFixedLayout);
});
let _docTitle;
win.addEventListener("DOMContentLoaded", () => {
    debug("############# DOMContentLoaded");
    const titleElement = win.document.documentElement.querySelector("head > title");
    if (titleElement && titleElement.textContent) {
        _docTitle = titleElement.textContent;
    }
    if (!win.READIUM2.isAudio &&
        win.location.hash && win.location.hash.length > 1) {
        win.READIUM2.hashElement = win.document.getElementById(win.location.hash.substr(1));
        if (win.READIUM2.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                win.READIUM2.hashElement.setAttribute(styles_1.readPosCssStylesAttr1, "DOMContentLoaded hashElement");
            }
        }
    }
    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.ttsClickEnabled = false;
    win.READIUM2.ttsSentenceDetectionEnabled = true;
    win.READIUM2.ttsOverlayEnabled = false;
    let readiumcssJson;
    if (win.READIUM2.urlQueryParams) {
        const base64ReadiumCSS = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_CSS];
        if (base64ReadiumCSS) {
            let str;
            try {
                str = Buffer.from(base64ReadiumCSS, "base64").toString("utf8");
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
    if (win.READIUM2.isAudio) {
        audiobook_1.setupAudioBook(_docTitle, undefined);
    }
    if (readiumcssJson) {
        win.READIUM2.isFixedLayout = (typeof readiumcssJson.isFixedLayout !== "undefined") ?
            readiumcssJson.isFixedLayout : false;
    }
    if (!win.READIUM2.isFixedLayout && !win.READIUM2.isAudio) {
        const scrollElement = readium_css_1.getScrollingElement(win.document);
        if (!scrollElement.classList.contains(styles_1.ZERO_TRANSFORM_CLASS)) {
            scrollElement.classList.add(styles_1.ZERO_TRANSFORM_CLASS);
        }
    }
    const w = (readiumcssJson && readiumcssJson.fixedLayoutWebViewWidth) || win.innerWidth;
    const h = (readiumcssJson && readiumcssJson.fixedLayoutWebViewHeight) || win.innerHeight;
    const wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, w, h, win.READIUM2.webViewSlot);
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
function checkSoundtrack(documant) {
    const audioNodeList = documant.querySelectorAll("audio");
    if (!audioNodeList || !audioNodeList.length) {
        return;
    }
    const audio = audioNodeList[0];
    let epubType = audio.getAttribute("epub:type");
    if (!epubType) {
        epubType = audio.getAttributeNS("http://www.idpf.org/2007/ops", "type");
    }
    if (!epubType) {
        return;
    }
    if (epubType.indexOf("ibooks:soundtrack") < 0) {
        return;
    }
    let src = audio.getAttribute("src");
    if (!src) {
        if (!audio.childNodes) {
            return;
        }
        for (let i = 0; i < audio.childNodes.length; i++) {
            const childNode = audio.childNodes[i];
            if (childNode.nodeType === 1) {
                const el = childNode;
                const elName = el.nodeName.toLowerCase();
                if (elName === "source") {
                    src = el.getAttribute("src");
                    if (src) {
                        break;
                    }
                }
            }
        }
    }
    if (!src) {
        return;
    }
    debug(`AUDIO SOUNDTRACK: ${src} ---> ${audio.src}`);
    if (!audio.src) {
        return;
    }
    const payload = {
        url: audio.src,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_AUDIO_SOUNDTRACK, payload);
}
function mediaOverlaysClickRaw(element, userInteract) {
    const textFragmentIDChain = [];
    if (element) {
        let curEl = element;
        do {
            const id = curEl.getAttribute("id");
            textFragmentIDChain.push(id ? id : null);
            curEl = curEl.parentNode;
        } while (curEl && curEl.nodeType === Node.ELEMENT_NODE);
    }
    const payload = {
        textFragmentIDChain,
        userInteract,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_MEDIA_OVERLAY_CLICK, payload);
}
const onScrollRaw = () => {
    debug("onScrollRaw");
    if (!win.document || !win.document.documentElement) {
        return;
    }
    const el = win.READIUM2.locationHashOverride;
    if (el && computeVisibility_(el, undefined)) {
        debug("onScrollRaw VISIBLE SKIP");
        return;
    }
    const x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
    processXYRaw(x, 0, false);
};
const onScrollDebounced = debounce_1.debounce(() => {
    onScrollRaw();
}, 300);
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
    if (win.READIUM2.isAudio) {
        showHideContentMask(false, win.READIUM2.isFixedLayout);
    }
    else {
        if (!win.READIUM2.isFixedLayout) {
            showHideContentMask(false, win.READIUM2.isFixedLayout);
            debug("++++ scrollToHashDebounced FROM LOAD");
            scrollToHashDebounced(false);
            if (win.document.body) {
                const linkTxt = "__";
                const focusLink = win.document.createElement("a");
                focusLink.setAttribute("id", styles_1.SKIP_LINK_ID);
                focusLink.appendChild(win.document.createTextNode(linkTxt));
                focusLink.setAttribute("title", linkTxt);
                focusLink.setAttribute("aria-label", linkTxt);
                focusLink.setAttribute("href", "javascript:;");
                focusLink.setAttribute("tabindex", "0");
                win.document.body.insertAdjacentElement("afterbegin", focusLink);
                setTimeout(() => {
                    focusLink.addEventListener("click", (_ev) => {
                        if (IS_DEV) {
                            debug("focus link click:");
                            debug(win.READIUM2.hashElement ?
                                getCssSelector(win.READIUM2.hashElement) : "!hashElement");
                            debug(win.READIUM2.locationHashOverride ?
                                getCssSelector(win.READIUM2.locationHashOverride) : "!locationHashOverride");
                        }
                        const el = win.READIUM2.hashElement || win.READIUM2.locationHashOverride;
                        if (el) {
                            focusScrollDebounced(el, true, false, undefined);
                        }
                    });
                }, 200);
            }
        }
        else {
            showHideContentMask(false, win.READIUM2.isFixedLayout);
            win.READIUM2.locationHashOverride = win.document.body;
            notifyReadingLocationDebounced();
        }
        checkSoundtrack(win.document);
    }
    win.document.documentElement.addEventListener("keydown", (ev) => {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.add(styles_1.ROOT_CLASS_KEYBOARD_INTERACT);
        }
        if (ev.code === "ArrowLeft" || ev.code === "ArrowRight") {
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
    if (win.READIUM2.isAudio) {
        debug("AUDIOBOOK RENDER ...");
        return;
    }
    win.document.body.addEventListener("focusin", (ev) => {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        if (ev.target) {
            let ignoreIncomingMouseClickOnFocusable = false;
            if (win.document && win.document.documentElement) {
                if (!win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_KEYBOARD_INTERACT)) {
                    if (ev.target.tagName.toLowerCase() === "a" &&
                        ev.target.href
                        ||
                            ev.target.getAttribute("tabindex") === "-1" &&
                                ev.target.classList.contains(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE)) {
                        ignoreIncomingMouseClickOnFocusable = true;
                    }
                }
            }
            if (!ignoreIncomingMouseClickOnFocusable) {
                handleFocusInDebounced(ev.target, undefined);
            }
            else {
                debug("focusin mouse click --- IGNORE");
            }
        }
    });
    const useResizeObserver = !win.READIUM2.isFixedLayout;
    if (useResizeObserver && win.document.body) {
        setTimeout(() => {
            let _firstResizeObserver = true;
            const resizeObserver = new window.ResizeObserver((_entries) => {
                if (_firstResizeObserver) {
                    _firstResizeObserver = false;
                    debug("ResizeObserver SKIP FIRST");
                    return;
                }
                win.document.body.tabbables = undefined;
                scrollToHashDebounced(false);
            });
            resizeObserver.observe(win.document.body);
            setTimeout(() => {
                if (_firstResizeObserver) {
                    _firstResizeObserver = false;
                    debug("ResizeObserver CANCEL SKIP FIRST");
                }
            }, 700);
        }, 1000);
    }
    let _mouseMoveTimeout;
    win.document.documentElement.addEventListener("mousemove", (_ev) => {
        if (_mouseMoveTimeout) {
            win.clearTimeout(_mouseMoveTimeout);
            _mouseMoveTimeout = undefined;
        }
        win.document.documentElement.classList.remove(styles_1.HIDE_CURSOR_CLASS);
        _mouseMoveTimeout = win.setTimeout(() => {
            win.document.documentElement.classList.add(styles_1.HIDE_CURSOR_CLASS);
        }, 1000);
    });
    win.document.addEventListener("click", (ev) => {
        let currentElement = ev.target;
        let href;
        while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
            if (currentElement.tagName.toLowerCase() === "a") {
                href = currentElement.href;
                const href_ = currentElement.getAttribute("href");
                debug(`A LINK CLICK: ${href} (${href_})`);
                break;
            }
            currentElement = currentElement.parentNode;
        }
        if (!href) {
            return;
        }
        if (href.animVal) {
            href = href.animVal;
            if (!href) {
                return;
            }
        }
        const hrefStr = href;
        if (/^javascript:/.test(hrefStr)) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        const done = popupFootNotes_1.popupFootNote(currentElement, focusScrollRaw, hrefStr, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        if (!done) {
            focusScrollDebounced.clear();
            processXYDebouncedImmediate.clear();
            notifyReadingLocationDebounced.clear();
            notifyReadingLocationDebouncedImmediate.clear();
            scrollToHashDebounced.clear();
            onScrollDebounced.clear();
            onResizeDebounced.clear();
            handleFocusInDebounced.clear();
            const payload = {
                url: hrefStr,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
        }
        return false;
    }, true);
    const onResizeRaw = () => {
        const wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight, win.READIUM2.webViewSlot);
        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
            win.READIUM2.fxlViewportScale = wh.scale;
        }
        debug("++++ scrollToHashDebounced FROM RESIZE");
        scrollToHashDebounced(false);
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
        onResizeDebounced();
    });
    let _wheelTimeStamp = -1;
    let _wheelSpin = 0;
    const wheelDebounced = (ev) => {
        const now = (new Date()).getTime();
        if (_wheelTimeStamp === -1) {
            _wheelTimeStamp = now;
        }
        else {
            const msDiff = now - _wheelTimeStamp;
            if (msDiff < 500) {
                return;
            }
        }
        if (win.READIUM2.isAudio || win.READIUM2.isFixedLayout || !win.document.body) {
            return;
        }
        if (!win.document || !win.document.documentElement) {
            return;
        }
        const documant = win.document;
        const isPaged = readium_css_inject_1.isPaginated(documant);
        if (isPaged) {
            return;
        }
        const delta = Math.abs(ev.deltaY);
        _wheelSpin += delta;
        if (_wheelSpin < 300) {
            return;
        }
        _wheelSpin = 0;
        _wheelTimeStamp = -1;
        const scrollElement = readium_css_1.getScrollingElement(documant);
        const goPREVIOUS = ev.deltaY < 0;
        if (!goPREVIOUS) {
            const maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
            const maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;
            if (isPaged) {
                const unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                let scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                    scrollElement.scrollTop :
                    scrollElement.scrollLeft);
                const isNegative = scrollElementOffset < 0;
                const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
                const fractional = scrollElementOffsetAbs / unit;
                const integral = Math.floor(fractional);
                const decimal = fractional - integral;
                const partial = decimal * unit;
                if (partial <= CSS_PIXEL_TOLERANCE) {
                    scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
                }
                else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                    scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
                }
                if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs >= maxScrollShiftTolerated) ||
                    !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs >= maxScrollShiftTolerated)) {
                    const payload = {
                        direction: "LTR",
                        go: "NEXT",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
            else {
                if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) >= maxScrollShiftTolerated) ||
                    !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) >= maxScrollShiftTolerated)) {
                    const payload = {
                        direction: "LTR",
                        go: "NEXT",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
        }
        else if (goPREVIOUS) {
            if (isPaged) {
                const unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                let scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                    scrollElement.scrollTop :
                    scrollElement.scrollLeft);
                const isNegative = scrollElementOffset < 0;
                const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
                const fractional = scrollElementOffsetAbs / unit;
                const integral = Math.floor(fractional);
                const decimal = fractional - integral;
                const partial = decimal * unit;
                if (partial <= CSS_PIXEL_TOLERANCE) {
                    scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
                }
                else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                    scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
                }
                if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs <= 0) ||
                    !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs <= 0)) {
                    const payload = {
                        direction: "LTR",
                        go: "PREVIOUS",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
            else {
                if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) <= 0) ||
                    !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) <= 0)) {
                    const payload = {
                        direction: "LTR",
                        go: "PREVIOUS",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
        }
    };
    win.document.addEventListener("wheel", wheelDebounced);
    win.document.addEventListener("scroll", (_ev) => {
        _wheelSpin = 0;
        _wheelTimeStamp = -1;
    });
    setTimeout(() => {
        win.addEventListener("scroll", (_ev) => {
            if (_ignoreScrollEvent) {
                return;
            }
            if (_lastAnimState && _lastAnimState.animating) {
                debug("_lastAnimState");
                return;
            }
            if (_lastAnimState2 && _lastAnimState2.animating) {
                debug("_lastAnimState2");
                return;
            }
            if (!win.document || !win.document.documentElement) {
                return;
            }
            onScrollDebounced();
        });
    }, 200);
    function handleMouseEvent(ev) {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        const x = ev.clientX;
        const y = ev.clientY;
        processXYDebouncedImmediate(x, y, false, true);
        let element;
        let textNode;
        let textNodeOffset = -1;
        const range = win.document.caretRangeFromPoint(x, y);
        if (range) {
            const node = range.startContainer;
            const offset = range.startOffset;
            if (node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    element = node;
                }
                else if (node.nodeType === Node.TEXT_NODE) {
                    textNode = node;
                    textNodeOffset = offset;
                    if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                        element = node.parentNode;
                    }
                }
            }
        }
        if (element && win.READIUM2.ttsClickEnabled) {
            if (element) {
                if (ev.altKey) {
                    readaloud_1.ttsPlay(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice, focusScrollRaw, element, undefined, undefined, -1, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                    return;
                }
                readaloud_1.ttsPlay(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice, focusScrollRaw, element.ownerDocument.body, element, textNode, textNodeOffset, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
            }
        }
    }
    win.document.documentElement.addEventListener("mouseup", (ev) => {
        handleMouseEvent(ev);
    });
    win.document.addEventListener("mouseup", (ev) => {
        if (ev.target && ev.target.getAttribute) {
            const iBooksMO = ev.target.getAttribute("ibooks:readaloud") ||
                ev.target.getAttribute("readaloud");
            if (iBooksMO) {
                const payload = {
                    start: iBooksMO === "start" ? true : undefined,
                    startstop: iBooksMO === "startstop" ? true : undefined,
                    stop: iBooksMO === "stop" ? true : undefined,
                };
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_MEDIA_OVERLAY_STARTSTOP, payload);
            }
        }
    }, true);
    win.document.body.addEventListener("copy", (evt) => {
        if (win.READIUM2.isClipboardIntercept) {
            const selection = win.document.getSelection();
            if (selection) {
                const str = selection.toString();
                if (str) {
                    evt.preventDefault();
                    setTimeout(() => {
                        const payload = {
                            locator: win.READIUM2.locationHashOverrideInfo,
                            txt: str,
                        };
                        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_CLIPBOARD_COPY, payload);
                    }, 500);
                }
            }
        }
    });
}
win.addEventListener("load", () => {
    debug("############# load");
    loaded(false);
});
function checkBlacklisted(el) {
    const id = el.getAttribute("id");
    if (id && _blacklistIdClassForCFI.indexOf(id) >= 0) {
        if (IS_DEV && id !== styles_1.SKIP_LINK_ID) {
            debug("checkBlacklisted ID: " + id);
        }
        return true;
    }
    for (const item of _blacklistIdClassForCFI) {
        if (el.classList.contains(item)) {
            if (IS_DEV) {
                debug("checkBlacklisted CLASS: " + item);
            }
            return true;
        }
    }
    const mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
    if (mathJax) {
        const low = el.tagName.toLowerCase();
        for (const item of _blacklistIdClassForCFIMathJax) {
            if (low.startsWith(item)) {
                if (IS_DEV) {
                    debug("checkBlacklisted MathJax ELEMENT NAME: " + el.tagName);
                }
                return true;
            }
        }
        if (id) {
            const lowId = id.toLowerCase();
            for (const item of _blacklistIdClassForCFIMathJax) {
                if (lowId.startsWith(item)) {
                    if (IS_DEV) {
                        debug("checkBlacklisted MathJax ID: " + id);
                    }
                    return true;
                }
            }
        }
        for (let i = 0; i < el.classList.length; i++) {
            const cl = el.classList[i];
            const lowCl = cl.toLowerCase();
            for (const item of _blacklistIdClassForCFIMathJax) {
                if (lowCl.startsWith(item)) {
                    if (IS_DEV) {
                        debug("checkBlacklisted MathJax CLASS: " + cl);
                    }
                    return true;
                }
            }
        }
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
        const visible = computeVisibility_(rootElement, undefined);
        if (visible) {
            return rootElement;
        }
    }
    return undefined;
}
const processXYRaw = (x, y, reverse, userInteract) => {
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
    else if (!userInteract && !computeVisibility_(element, undefined)) {
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
        if (userInteract ||
            !win.READIUM2.locationHashOverride ||
            win.READIUM2.locationHashOverride === win.document.body ||
            win.READIUM2.locationHashOverride === win.document.documentElement) {
            win.READIUM2.locationHashOverride = element;
        }
        else {
            const visible = win.READIUM2.isFixedLayout ||
                win.READIUM2.locationHashOverride === win.document.body ||
                computeVisibility_(win.READIUM2.locationHashOverride, undefined);
            if (!visible) {
                win.READIUM2.locationHashOverride = element;
            }
        }
        if (userInteract) {
            notifyReadingLocationDebouncedImmediate(userInteract);
        }
        else {
            notifyReadingLocationDebounced(userInteract);
        }
        if (win.READIUM2.DEBUG_VISUALS) {
            const el = win.READIUM2.locationHashOverride ? win.READIUM2.locationHashOverride : element;
            const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr2}]`);
            existings.forEach((existing) => {
                existing.removeAttribute(`${styles_1.readPosCssStylesAttr2}`);
            });
            el.setAttribute(styles_1.readPosCssStylesAttr2, "processXYRaw");
        }
    }
};
const processXYDebouncedImmediate = debounce_1.debounce((x, y, reverse, userInteract) => {
    processXYRaw(x, y, reverse, userInteract);
}, 300, true);
const computeProgressionData = () => {
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
            const visible = computeVisibility_(element, undefined);
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
                    const clientRects = rect_utils_1.getClientRectsNoOverlap_(element.getClientRects(), false);
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
exports.computeProgressionData = computeProgressionData;
const _blacklistIdClassForCssSelectors = [styles_1.LINK_TARGET_CLASS, styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, styles_1.TTS_ID_SPEAKING_DOC_ELEMENT, styles_1.ROOT_CLASS_KEYBOARD_INTERACT, styles_1.ROOT_CLASS_INVISIBLE_MASK, styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED, styles_1.CLASS_PAGINATED, styles_1.ROOT_CLASS_NO_FOOTNOTES];
const _blacklistIdClassForCssSelectorsMathJax = ["mathjax", "ctxt", "mjx"];
const _blacklistIdClassForCFI = [styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA];
const _blacklistIdClassForCFIMathJax = ["mathjax", "ctxt", "mjx"];
const computeCFI = (node) => {
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
            let j = 0;
            for (let i = 0; i < currentElementParentChildren.length; i++) {
                const childBlacklisted = checkBlacklisted(currentElementParentChildren[i]);
                if (childBlacklisted) {
                    j++;
                }
                if (currentElement === currentElementParentChildren[i]) {
                    currentElementIndex = i;
                    break;
                }
            }
            if (currentElementIndex >= 0) {
                const cfiIndex = (currentElementIndex - j + 1) * 2;
                cfi = cfiIndex +
                    (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                    (cfi.length ? ("/" + cfi) : "");
            }
        }
        else {
            cfi = "";
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
exports.computeCFI = computeCFI;
const _getCssSelectorOptions = {
    className: (str) => {
        if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
            return false;
        }
        const mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
        if (mathJax) {
            const low = str.toLowerCase();
            for (const item of _blacklistIdClassForCssSelectorsMathJax) {
                if (low.startsWith(item)) {
                    return false;
                }
            }
        }
        return true;
    },
    idName: (str) => {
        if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
            return false;
        }
        const mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
        if (mathJax) {
            const low = str.toLowerCase();
            for (const item of _blacklistIdClassForCssSelectorsMathJax) {
                if (low.startsWith(item)) {
                    return false;
                }
            }
        }
        return true;
    },
    tagName: (str) => {
        const mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
        if (mathJax) {
            for (const item of _blacklistIdClassForCssSelectorsMathJax) {
                if (str.startsWith(item)) {
                    return false;
                }
            }
        }
        return true;
    },
};
function getCssSelector(element) {
    try {
        return cssselector2_1.uniqueCssSelector(element, win.document, _getCssSelectorOptions);
    }
    catch (err) {
        debug("uniqueCssSelector:");
        debug(err);
        return "";
    }
}
let _allEpubPageBreaks;
const _htmlNamespaces = {
    epub: "http://www.idpf.org/2007/ops",
};
const findPrecedingAncestorSiblingEpubPageBreak = (element) => {
    if (!_allEpubPageBreaks) {
        const namespaceResolver = (prefix) => {
            if (!prefix) {
                return null;
            }
            return _htmlNamespaces[prefix] || null;
        };
        const xpathResult = win.document.evaluate(`//*[contains(concat(' ', normalize-space(@epub:type), ' '), ' pagebreak ') or contains(concat(' ', normalize-space(role), ' '), ' doc-pagebreak ')]`, win.document.body, namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < xpathResult.snapshotLength; i++) {
            const n = xpathResult.snapshotItem(i);
            if (n) {
                const el = n;
                const elTitle = el.getAttribute("title");
                const elLabel = el.getAttribute("aria-label");
                const elText = el.textContent;
                const pageLabel = elTitle || elLabel || elText;
                if (pageLabel) {
                    const pageBreak = {
                        element: el,
                        text: pageLabel,
                    };
                    if (!_allEpubPageBreaks) {
                        _allEpubPageBreaks = [];
                    }
                    _allEpubPageBreaks.push(pageBreak);
                }
            }
        }
        if (!_allEpubPageBreaks) {
            _allEpubPageBreaks = [];
        }
        debug("_allEpubPageBreaks XPath", _allEpubPageBreaks.length);
    }
    for (let i = _allEpubPageBreaks.length - 1; i >= 0; i--) {
        const pageBreak = _allEpubPageBreaks[i];
        const c = element.compareDocumentPosition(pageBreak.element);
        if (c === 0 || (c & Node.DOCUMENT_POSITION_PRECEDING) || (c & Node.DOCUMENT_POSITION_CONTAINS)) {
            debug("preceding or containing EPUB page break", pageBreak.text);
            return pageBreak.text;
        }
    }
    return undefined;
};
const notifyReadingLocationRaw = (userInteract, ignoreMediaOverlays) => {
    if (!win.READIUM2.locationHashOverride) {
        return;
    }
    if (win.READIUM2.urlQueryParams && win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] === "1") {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] = "2";
        return;
    }
    const blacklisted = checkBlacklisted(win.READIUM2.locationHashOverride);
    if (blacklisted) {
        return;
    }
    let progressionData;
    let cssSelector = getCssSelector(win.READIUM2.locationHashOverride);
    let cfi = exports.computeCFI(win.READIUM2.locationHashOverride);
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
    if (selInfo) {
        cssSelector = selInfo.rangeInfo.startContainerElementCssSelector;
        cfi = selInfo.rangeInfo.startContainerElementCFI;
    }
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
    const epubPage = findPrecedingAncestorSiblingEpubPageBreak(win.READIUM2.locationHashOverride);
    const secondWebViewHref = win.READIUM2.urlQueryParams &&
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] &&
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW].length > 1 &&
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW].startsWith("0") ?
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW].substr(1) :
        undefined;
    win.READIUM2.locationHashOverrideInfo = {
        audioPlaybackInfo: undefined,
        docInfo: {
            isFixedLayout: win.READIUM2.isFixedLayout,
            isRightToLeft: readium_css_1.isRTL(),
            isVerticalWritingMode: readium_css_1.isVerticalWritingMode(),
        },
        epubPage,
        href: "",
        locations: {
            cfi,
            cssSelector,
            position: undefined,
            progression,
        },
        paginationInfo: pinfo,
        secondWebViewHref,
        selectionInfo: selInfo,
        selectionIsNew,
        text,
        title: _docTitle,
        userInteract: userInteract ? true : false,
    };
    const payload = win.READIUM2.locationHashOverrideInfo;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (!ignoreMediaOverlays) {
        mediaOverlaysClickRaw(win.READIUM2.locationHashOverride, userInteract ? true : false);
    }
    if (win.READIUM2.DEBUG_VISUALS) {
        const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr4}]`);
        existings.forEach((existing) => {
            existing.removeAttribute(`${styles_1.readPosCssStylesAttr4}`);
        });
        win.READIUM2.locationHashOverride.setAttribute(styles_1.readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
const notifyReadingLocationDebounced = debounce_1.debounce((userInteract, ignoreMediaOverlays) => {
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250);
const notifyReadingLocationDebouncedImmediate = debounce_1.debounce((userInteract, ignoreMediaOverlays) => {
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250, true);
if (!win.READIUM2.isAudio) {
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PLAY, (_event, payload) => {
        const rootElement = win.document.querySelector(payload.rootElement);
        const startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;
        readaloud_1.ttsPlay(payload.speed, payload.voice, focusScrollRaw, rootElement ? rootElement : undefined, startElement ? startElement : undefined, undefined, -1, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
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
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_NEXT, (_event, payload) => {
        readaloud_1.ttsNext(payload === null || payload === void 0 ? void 0 : payload.skipSentences);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PREVIOUS, (_event, payload) => {
        readaloud_1.ttsPrevious(payload === null || payload === void 0 ? void 0 : payload.skipSentences);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_PLAYBACK_RATE, (_event, payload) => {
        readaloud_1.ttsPlaybackRate(payload.speed);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_VOICE, (_event, payload) => {
        readaloud_1.ttsVoice(payload.voice);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_SENTENCE_DETECT_ENABLE, (_event, payload) => {
        win.READIUM2.ttsSentenceDetectionEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_CLICK_ENABLE, (_event, payload) => {
        win.READIUM2.ttsClickEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_OVERLAY_ENABLE, (_event, payload) => {
        win.READIUM2.ttsOverlayEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, (_event, payload) => {
        const styleAttr = win.document.documentElement.getAttribute("style");
        const isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
        const isSepia = styleAttr ? styleAttr.indexOf("readium-sepia-on") > 0 : false;
        const activeClass = (isNight || isSepia) ? styles_1.R2_MO_CLASS_ACTIVE :
            (payload.classActive ? payload.classActive : styles_1.R2_MO_CLASS_ACTIVE);
        const activeClassPlayback = payload.classActivePlayback ? payload.classActivePlayback : styles_1.R2_MO_CLASS_ACTIVE_PLAYBACK;
        if (payload.classActive) {
            const activeMoElements = win.document.body.querySelectorAll(`.${payload.classActive}`);
            activeMoElements.forEach((elem) => {
                if (payload.classActive) {
                    elem.classList.remove(payload.classActive);
                }
            });
        }
        const activeMoElements_ = win.document.body.querySelectorAll(`.${styles_1.R2_MO_CLASS_ACTIVE}`);
        activeMoElements_.forEach((elem) => {
            elem.classList.remove(styles_1.R2_MO_CLASS_ACTIVE);
        });
        let removeCaptionContainer = true;
        if (!payload.id) {
            win.document.documentElement.classList.remove(styles_1.R2_MO_CLASS_ACTIVE_PLAYBACK);
            win.document.documentElement.classList.remove(activeClassPlayback);
        }
        else {
            win.document.documentElement.classList.add(activeClassPlayback);
            const targetEl = win.document.getElementById(payload.id);
            if (targetEl) {
                targetEl.classList.add(activeClass);
                if (payload.captionsMode) {
                    let text = targetEl.textContent;
                    if (text) {
                        text = dom_text_utils_1.normalizeText(text).trim();
                        if (text) {
                            removeCaptionContainer = false;
                            const isUserBackground = styleAttr ?
                                styleAttr.indexOf("--USER__backgroundColor") >= 0 : false;
                            const isUserColor = styleAttr ?
                                styleAttr.indexOf("--USER__textColor") >= 0 : false;
                            const docStyle = win.getComputedStyle(win.document.documentElement);
                            let containerStyle = "background-color: white; color: black;";
                            if (isNight || isSepia) {
                                const rsBackground = docStyle.getPropertyValue("--RS__backgroundColor");
                                const rsColor = docStyle.getPropertyValue("--RS__textColor");
                                containerStyle = `background-color: ${rsBackground}; color: ${rsColor};`;
                            }
                            else {
                                if (isUserBackground || isUserColor) {
                                    containerStyle = "";
                                }
                                if (isUserBackground) {
                                    const usrBackground = docStyle.getPropertyValue("--USER__backgroundColor");
                                    containerStyle += `background-color: ${usrBackground};`;
                                }
                                if (isUserColor) {
                                    const usrColor = docStyle.getPropertyValue("--USER__textColor");
                                    containerStyle += `color: ${usrColor};`;
                                }
                            }
                            const isUserFontSize = styleAttr ?
                                styleAttr.indexOf("--USER__fontSize") >= 0 : false;
                            if (isUserFontSize) {
                                const usrFontSize = docStyle.getPropertyValue("--USER__fontSize");
                                containerStyle += `font-size: ${usrFontSize};`;
                            }
                            else {
                                containerStyle += `font-size: 120%;`;
                            }
                            const isUserLineHeight = styleAttr ?
                                styleAttr.indexOf("--USER__lineHeight") >= 0 : false;
                            if (isUserLineHeight) {
                                const usrLineHeight = docStyle.getPropertyValue("--USER__lineHeight");
                                containerStyle += `line-height: ${usrLineHeight};`;
                            }
                            else {
                                containerStyle += `line-height: 1.2;`;
                            }
                            const isUserFont = styleAttr ?
                                styleAttr.indexOf("--USER__fontFamily") >= 0 : false;
                            if (isUserFont) {
                                const usrFont = docStyle.getPropertyValue("--USER__fontFamily");
                                containerStyle += `font-family: ${usrFont};`;
                            }
                            const payloadCaptions = {
                                containerStyle,
                                text,
                                textStyle: "font-size: 120%;",
                            };
                            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_CAPTIONS, payloadCaptions);
                        }
                    }
                }
                win.READIUM2.locationHashOverride = targetEl;
                scrollElementIntoView(targetEl, false, true, undefined);
                scrollToHashDebounced.clear();
                notifyReadingLocationRaw(false, true);
                if (win.READIUM2.DEBUG_VISUALS) {
                    const el = win.READIUM2.locationHashOverride;
                    const existings = win.document.querySelectorAll(`*[${styles_1.readPosCssStylesAttr2}]`);
                    existings.forEach((existing) => {
                        existing.removeAttribute(`${styles_1.readPosCssStylesAttr2}`);
                    });
                    el.setAttribute(styles_1.readPosCssStylesAttr2, "R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT");
                }
            }
        }
        if (removeCaptionContainer) {
            const payloadCaptions = {
                containerStyle: undefined,
                text: undefined,
                textStyle: undefined,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_CAPTIONS, payloadCaptions);
        }
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_CREATE, (_event, payloadPing) => {
        if (payloadPing.highlightDefinitions &&
            payloadPing.highlightDefinitions.length === 1 &&
            payloadPing.highlightDefinitions[0].selectionInfo) {
            const selection = win.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        }
        const highlightDefinitions = !payloadPing.highlightDefinitions ?
            [
                {
                    color: undefined,
                    drawType: undefined,
                    expand: undefined,
                    selectionInfo: undefined,
                },
            ] :
            payloadPing.highlightDefinitions;
        for (const highlightDefinition of highlightDefinitions) {
            if (!highlightDefinition.selectionInfo) {
                highlightDefinition.selectionInfo = selection_2.getCurrentSelectionInfo(win, getCssSelector, exports.computeCFI);
            }
        }
        const highlights = highlight_1.createHighlights(win, highlightDefinitions, true);
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
}
//# sourceMappingURL=preload.js.map