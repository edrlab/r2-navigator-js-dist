"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCFI = exports.computeProgressionData = void 0;
var tslib_1 = require("tslib");
var debounce_1 = require("debounce");
var debug_ = require("debug");
var electron_1 = require("electron");
var tabbable_1 = require("tabbable");
var events_1 = require("../../common/events");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var selection_1 = require("../../common/selection");
var styles_1 = require("../../common/styles");
var animateProperty_1 = require("../common/animateProperty");
var cssselector2_1 = require("../common/cssselector2");
var dom_text_utils_1 = require("../common/dom-text-utils");
var easings_1 = require("../common/easings");
var popup_dialog_1 = require("../common/popup-dialog");
var querystring_1 = require("../common/querystring");
var rect_utils_1 = require("../common/rect-utils");
var url_params_1 = require("../common/url-params");
var audiobook_1 = require("./audiobook");
var epubReadingSystem_1 = require("./epubReadingSystem");
var highlight_1 = require("./highlight");
var popupFootNotes_1 = require("./popupFootNotes");
var readaloud_1 = require("./readaloud");
var readium_css_1 = require("./readium-css");
var selection_2 = require("./selection");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    var cr = require("../common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
}
var debug = debug_("r2:navigator#electron/renderer/webview/preload");
var win = global.window;
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
win.alert = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(win, args);
};
win.confirm = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(win, args);
    return false;
};
win.prompt = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(win, args);
    return "";
};
var CSS_PIXEL_TOLERANCE = 5;
function keyDownUpEventHandler(ev, keyDown) {
    var elementName = (ev.target && ev.target.nodeName) ?
        ev.target.nodeName : "";
    var elementAttributes = {};
    if (ev.target && ev.target.attributes) {
        for (var i = 0; i < ev.target.attributes.length; i++) {
            var attr = ev.target.attributes[i];
            elementAttributes[attr.name] = attr.value;
        }
    }
    var payload = {
        altKey: ev.altKey,
        code: ev.code,
        ctrlKey: ev.ctrlKey,
        elementAttributes: elementAttributes,
        elementName: elementName,
        key: ev.key,
        metaKey: ev.metaKey,
        shiftKey: ev.shiftKey,
    };
    electron_1.ipcRenderer.sendToHost(keyDown ? events_1.R2_EVENT_WEBVIEW_KEYDOWN : events_1.R2_EVENT_WEBVIEW_KEYUP, payload);
}
win.document.addEventListener("keydown", function (ev) {
    keyDownUpEventHandler(ev, true);
}, {
    capture: true,
    once: false,
    passive: false,
});
win.document.addEventListener("keyup", function (ev) {
    keyDownUpEventHandler(ev, false);
}, {
    capture: true,
    once: false,
    passive: false,
});
win.READIUM2.isAudio = win.location.protocol === "data:";
if (win.READIUM2.urlQueryParams) {
    var readiumEpubReadingSystemJson = void 0;
    var base64EpubReadingSystem = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_EPUBREADINGSYSTEM];
    if (base64EpubReadingSystem) {
        try {
            var str = Buffer.from(base64EpubReadingSystem, "base64").toString("utf8");
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
    electron_1.ipcRenderer.on(events_1.R2_EVENT_DEBUG_VISUALS, function (_event, payload) {
        win.READIUM2.DEBUG_VISUALS = payload.debugVisuals;
        if (!payload.debugVisuals) {
            var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr1 + "], *[" + styles_1.readPosCssStylesAttr2 + "], *[" + styles_1.readPosCssStylesAttr3 + "], *[" + styles_1.readPosCssStylesAttr4 + "]");
            existings.forEach(function (existing) {
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr1);
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr2);
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr3);
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr4);
            });
        }
        if (payload.cssClass) {
            if (_blacklistIdClassForCssSelectors.indexOf(payload.cssClass) < 0) {
                _blacklistIdClassForCssSelectors.push(payload.cssClass.toLowerCase());
            }
            if (payload.debugVisuals && payload.cssStyles && payload.cssStyles.length) {
                var idSuffix = "debug_for_class_" + payload.cssClass;
                readium_css_inject_1.appendCSSInline(win.document, idSuffix, payload.cssStyles);
                if (payload.cssSelector) {
                    var toHighlights = win.document.querySelectorAll(payload.cssSelector);
                    toHighlights.forEach(function (toHighlight) {
                        var clazz = "" + payload.cssClass;
                        if (!toHighlight.classList.contains(clazz)) {
                            toHighlight.classList.add(clazz);
                        }
                    });
                }
            }
            else {
                var existings = win.document.querySelectorAll("." + payload.cssClass);
                existings.forEach(function (existing) {
                    existing.classList.remove("" + payload.cssClass);
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
    var blacklisted = checkBlacklisted(element);
    if (blacklisted) {
        return false;
    }
    var elStyle = win.getComputedStyle(element);
    if (elStyle) {
        var display = elStyle.getPropertyValue("display");
        if (display === "none") {
            if (IS_DEV) {
                debug("element DISPLAY NONE");
            }
            return false;
        }
        var opacity = elStyle.getPropertyValue("opacity");
        if (opacity === "0") {
            if (IS_DEV) {
                debug("element OPACITY ZERO");
            }
            return false;
        }
    }
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    if (!readium_css_inject_1.isPaginated(win.document)) {
        var rect = domRect || element.getBoundingClientRect();
        if (rect.top >= 0 &&
            rect.top <= win.document.documentElement.clientHeight) {
            return true;
        }
        return false;
    }
    if (readium_css_1.isVerticalWritingMode()) {
        return false;
    }
    var scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element, domRect);
    var extraShift = scrollElement.scrollLeftExtra;
    var currentOffset = scrollElement.scrollLeft;
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
    var visible = false;
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
        var selected = null;
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_LOCATOR_VISIBLE, function (_event, payload) {
    payload.visible = computeVisibility(payload.location);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LOCATOR_VISIBLE, payload);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, function (_event, payload) {
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
    var delayScrollIntoView = false;
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
        setTimeout(function () {
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
var _lastAnimState;
function elementCapturesKeyboardArrowKeys(target) {
    var curElement = target;
    while (curElement && curElement.nodeType === Node.ELEMENT_NODE) {
        var editable = curElement.getAttribute("contenteditable");
        if (editable) {
            return true;
        }
        var arrayOfKeyboardCaptureElements = ["input", "textarea", "video", "audio", "select"];
        if (arrayOfKeyboardCaptureElements.indexOf(curElement.tagName.toLowerCase()) >= 0) {
            return true;
        }
        curElement = curElement.parentNode;
    }
    return false;
}
function ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable() {
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var val = scrollElement.scrollLeftExtra;
    if (val === 0) {
        return 0;
    }
    scrollElement.scrollLeftExtra = 0;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, { offset: 0, backgroundColor: undefined });
    return val;
}
function ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(scrollLeftExtra) {
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    scrollElement.scrollLeftExtra = scrollLeftExtra;
    var scrollLeftExtraBackgroundColor = scrollElement.scrollLeftExtraBackgroundColor;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, {
        backgroundColor: scrollLeftExtraBackgroundColor ? scrollLeftExtraBackgroundColor : undefined,
        offset: (readium_css_1.isRTL() ? 1 : -1) * scrollLeftExtra,
    });
}
function ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, maxScrollShift) {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var dialogPopup = popup_dialog_1.isPopupDialogOpen(win.document);
    if (dialogPopup) {
        var diagEl = win.document.getElementById(styles_1.POPUP_DIALOG_CLASS);
        if (diagEl) {
            var isCollapsed = diagEl.classList.contains(styles_1.POPUP_DIALOG_CLASS_COLLAPSE);
            if (isCollapsed) {
                dialogPopup = false;
            }
        }
    }
    var noChange = dialogPopup ||
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
    var extraOffset = Math.abs(scrollOffset) - maxScrollShift;
    var backgroundColor;
    var docStyle = win.getComputedStyle(win.document.documentElement);
    if (docStyle) {
        backgroundColor = docStyle.getPropertyValue("background-color");
    }
    if (!backgroundColor || backgroundColor === "transparent") {
        var bodyStyle = win.getComputedStyle(win.document.body);
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
    var leftRightKeyWasUsedInsideKeyboardCapture = false;
    if (win.document.activeElement &&
        elementCapturesKeyboardArrowKeys(win.document.activeElement)) {
        if (win.document.hasFocus()) {
            leftRightKeyWasUsedInsideKeyboardCapture = true;
        }
        else {
            var oldDate = win.document.activeElement.r2_leftrightKeyboardTimeStamp;
            if (oldDate) {
                var newDate = new Date();
                var msDiff = newDate.getTime() - oldDate.getTime();
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
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    var goPREVIOUS = payload.go === "PREVIOUS";
    var animationTime = 300;
    if (_lastAnimState && _lastAnimState.animating) {
        win.cancelAnimationFrame(_lastAnimState.id);
        _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
    }
    if (!goPREVIOUS) {
        var maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
        var maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;
        if (isPaged) {
            var unit = readium_css_1.isVerticalWritingMode() ?
                win.document.documentElement.offsetHeight :
                win.document.documentElement.offsetWidth;
            var scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                scrollElement.scrollTop :
                scrollElement.scrollLeft);
            var isNegative = scrollElementOffset < 0;
            var scrollElementOffsetAbs = Math.abs(scrollElementOffset);
            var fractional = scrollElementOffsetAbs / unit;
            var integral = Math.floor(fractional);
            var decimal = fractional - integral;
            var partial = decimal * unit;
            if (partial <= CSS_PIXEL_TOLERANCE) {
                scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
            }
            else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
            }
            if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs < maxScrollShiftTolerated) ||
                !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs < maxScrollShiftTolerated)) {
                var scrollOffsetPotentiallyExcessive_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElementOffset + unit) :
                    (scrollElementOffset + (readium_css_1.isRTL() ? -1 : 1) * unit);
                var nWholes = Math.floor(scrollOffsetPotentiallyExcessive_ / unit);
                var scrollOffsetPotentiallyExcessive = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                var scrollOffset = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                    Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                var targetObj = scrollElement;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = scrollOffset;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, function (_cancelled) {
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
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop + win.document.documentElement.clientHeight);
                var targetObj = scrollElement;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = newVal;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, function (_cancelled) {
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
            var unit = readium_css_1.isVerticalWritingMode() ?
                win.document.documentElement.offsetHeight :
                win.document.documentElement.offsetWidth;
            var scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                scrollElement.scrollTop :
                scrollElement.scrollLeft);
            var isNegative = scrollElementOffset < 0;
            var scrollElementOffsetAbs = Math.abs(scrollElementOffset);
            var fractional = scrollElementOffsetAbs / unit;
            var integral = Math.floor(fractional);
            var decimal = fractional - integral;
            var partial = decimal * unit;
            if (partial <= CSS_PIXEL_TOLERANCE) {
                scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
            }
            else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
            }
            if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs > 0) ||
                !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs > 0)) {
                var scrollOffset_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElementOffset - unit) :
                    (scrollElementOffset - (readium_css_1.isRTL() ? -1 : 1) * unit);
                var nWholes = readium_css_1.isRTL() ? Math.floor(scrollOffset_ / unit) : Math.ceil(scrollOffset_ / unit);
                var scrollOffset = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, 0);
                var targetObj = scrollElement;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = scrollOffset;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, function (_cancelled) {
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
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop - win.document.documentElement.clientHeight);
                var targetObj = scrollElement;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = newVal;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, function (_cancelled) {
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_PAGE_TURN, function (_event, payload) {
    setTimeout(function () {
        onEventPageTurn(payload);
    }, 100);
});
var _lastAnimState2;
var animationTime2 = 400;
function scrollElementIntoView(element, doFocus, animate, domRect) {
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr3 + "]");
        existings.forEach(function (existing) {
            existing.removeAttribute("" + styles_1.readPosCssStylesAttr3);
        });
        element.setAttribute(styles_1.readPosCssStylesAttr3, "scrollElementIntoView");
    }
    if (win.READIUM2.isFixedLayout) {
        debug("scrollElementIntoView_ SKIP FXL");
        return;
    }
    if (doFocus) {
        if (!domRect && !tabbable_1.isFocusable(element)) {
            var attr = element.getAttribute("tabindex");
            if (!attr) {
                element.setAttribute("tabindex", "-1");
                element.classList.add(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE);
                if (IS_DEV) {
                    debug("tabindex -1 set (focusable):");
                    debug(getCssSelector(element));
                }
            }
        }
        var targets = win.document.querySelectorAll("." + styles_1.LINK_TARGET_CLASS);
        targets.forEach(function (t) {
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
        element._timeoutTargetClass = setTimeout(function () {
            debug("ANIMATION TIMEOUT REMOVE");
            element.classList.remove(styles_1.LINK_TARGET_CLASS);
        }, 2000);
        if (!domRect) {
            element.focus();
        }
    }
    setTimeout(function () {
        var isPaged = readium_css_inject_1.isPaginated(win.document);
        if (isPaged) {
            scrollIntoView(element, domRect);
        }
        else {
            var scrollElement = readium_css_1.getScrollingElement(win.document);
            var rect = domRect || element.getBoundingClientRect();
            var scrollTopMax = scrollElement.scrollHeight - win.document.documentElement.clientHeight;
            var offset = scrollElement.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2));
            if (offset > scrollTopMax) {
                offset = scrollTopMax;
            }
            else if (offset < 0) {
                offset = 0;
            }
            var diff = Math.abs(scrollElement.scrollTop - offset);
            if (diff < 10) {
                return;
            }
            if (animate) {
                var reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
                if (_lastAnimState2 && _lastAnimState2.animating) {
                    win.cancelAnimationFrame(_lastAnimState2.id);
                    _lastAnimState2.object[_lastAnimState2.property] = _lastAnimState2.destVal;
                }
                var targetObj = scrollElement;
                var targetProp = "scrollTop";
                if (reduceMotion) {
                    _lastAnimState2 = undefined;
                    targetObj[targetProp] = offset;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState2 = animateProperty_1.animateProperty(win.cancelAnimationFrame, function (_cancelled) {
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
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var rect = domRect || element.getBoundingClientRect();
    var columnDimension = readium_css_1.calculateColumnDimension();
    var isTwoPage = readium_css_1.isTwoPageSpread();
    var fullOffset = (readium_css_1.isRTL() ?
        ((columnDimension * (isTwoPage ? 2 : 1)) - (rect.left + rect.width)) :
        rect.left) +
        ((readium_css_1.isRTL() ? -1 : 1) * scrollElement.scrollLeft);
    var columnIndex = Math.floor(fullOffset / columnDimension);
    var spreadIndex = isTwoPage ? Math.floor(columnIndex / 2) : columnIndex;
    return (readium_css_1.isRTL() ? -1 : 1) *
        (spreadIndex * (columnDimension * (isTwoPage ? 2 : 1)));
}
function scrollIntoView(element, domRect) {
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return;
    }
    var maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
    var scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element, domRect);
    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var scrollOffset = (scrollLeftPotentiallyExcessive < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive), maxScrollShift);
    scrollElement.scrollLeft = scrollOffset;
}
var scrollToHashRaw = function (animate) {
    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    highlight_1.recreateAllHighlights(win);
    if (win.READIUM2.isFixedLayout) {
        debug("scrollToHashRaw skipped, FXL");
        return;
    }
    debug("++++ scrollToHashRaw");
    var isPaged = readium_css_inject_1.isPaginated(win.document);
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
        var scrollElement = readium_css_1.getScrollingElement(win.document);
        if (win.READIUM2.urlQueryParams) {
            var previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
            var isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                var _a = readium_css_1.calculateMaxScrollShift(), maxScrollShift = _a.maxScrollShift, maxScrollShiftAdjusted = _a.maxScrollShiftAdjusted;
                _ignoreScrollEvent = true;
                if (isPaged) {
                    if (readium_css_1.isVerticalWritingMode()) {
                        scrollElement.scrollLeft = 0;
                        scrollElement.scrollTop = maxScrollShift;
                    }
                    else {
                        var scrollLeftPotentiallyExcessive = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShiftAdjusted;
                        ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
                        var scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShift;
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
                setTimeout(function () {
                    processXYRaw(0, 0, false);
                    showHideContentMask(false, win.READIUM2.isFixedLayout);
                    if (!win.READIUM2.locationHashOverride) {
                        notifyReadingLocationDebounced();
                    }
                    setTimeout(function () {
                        _ignoreScrollEvent = false;
                    }, 10);
                }, 60);
                return;
            }
            var gto = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO];
            var gotoCssSelector = void 0;
            var gotoProgression = void 0;
            if (gto) {
                var locStr = Buffer.from(gto, "base64").toString("utf8");
                var locObj = JSON.parse(locStr);
                gotoCssSelector = locObj.cssSelector;
                gotoProgression = locObj.progression;
            }
            if (gotoCssSelector) {
                gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");
                var selected = null;
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
                    var domRect = void 0;
                    var gtoDomRange = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO_DOM_RANGE];
                    if (gtoDomRange) {
                        try {
                            var rangeInfoStr = Buffer.from(gtoDomRange, "base64").toString("utf8");
                            var rangeInfo = JSON.parse(rangeInfoStr);
                            debug("rangeInfo", rangeInfo);
                            var domRange = selection_2.convertRangeInfo(win.document, rangeInfo);
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
                var maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
                if (isPaged) {
                    var isTwoPage = readium_css_1.isTwoPageSpread();
                    var nColumns = readium_css_1.calculateTotalColumns();
                    var nUnits = isTwoPage ? Math.ceil(nColumns / 2) : nColumns;
                    var unitIndex = Math.floor(gotoProgression * nUnits);
                    var unit = readium_css_1.isVerticalWritingMode() ?
                        win.document.documentElement.offsetHeight :
                        win.document.documentElement.offsetWidth;
                    var scrollOffsetPotentiallyExcessive = readium_css_1.isVerticalWritingMode() ?
                        (unitIndex * unit) :
                        ((readium_css_1.isRTL() ? -1 : 1) * unitIndex * unit);
                    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                    var scrollOffsetPaged = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                        Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                    _ignoreScrollEvent = true;
                    if (readium_css_1.isVerticalWritingMode()) {
                        scrollElement.scrollTop = scrollOffsetPaged;
                    }
                    else {
                        scrollElement.scrollLeft = scrollOffsetPaged;
                    }
                    setTimeout(function () {
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
                var scrollOffset = gotoProgression * maxScrollShift;
                _ignoreScrollEvent = true;
                if (readium_css_1.isVerticalWritingMode()) {
                    scrollElement.scrollLeft = scrollOffset;
                }
                else {
                    scrollElement.scrollTop = scrollOffset;
                }
                setTimeout(function () {
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
        setTimeout(function () {
            _ignoreScrollEvent = false;
        }, 10);
        win.READIUM2.locationHashOverride = win.document.body;
        resetLocationHashOverrideInfo();
        debug("processXYRaw BODY");
        processXYRaw(0, 0, false);
    }
    notifyReadingLocationDebounced();
};
var scrollToHashDebounced = debounce_1.debounce(function (animate) {
    debug("++++ scrollToHashRaw FROM DEBOUNCED");
    scrollToHashRaw(animate);
}, 100);
var _ignoreScrollEvent = false;
electron_1.ipcRenderer.on("R2_EVENT_HIDE", function (_event, payload) {
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
    var blacklisted = checkBlacklisted(el);
    if (blacklisted) {
        return;
    }
    win.READIUM2.locationHashOverride = el;
    notifyReadingLocationDebounced();
}
var focusScrollDebounced = debounce_1.debounce(function (el, doFocus, animate, domRect) {
    focusScrollRaw(el, doFocus, animate, domRect);
}, 100);
var handleFocusInDebounced = debounce_1.debounce(function (target, tabKeyDownEvent) {
    handleFocusInRaw(target, tabKeyDownEvent);
}, 100);
function handleFocusInRaw(target, _tabKeyDownEvent) {
    if (!target || !win.document.body) {
        return;
    }
    focusScrollRaw(target, false, false, undefined);
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, function (_event, payload) {
    showHideContentMask(true, payload.isFixedLayout || win.READIUM2.isFixedLayout);
    readium_css_1.readiumCSS(win.document, payload);
    highlight_1.recreateAllHighlights(win);
    showHideContentMask(false, payload.isFixedLayout || win.READIUM2.isFixedLayout);
});
var _docTitle;
win.addEventListener("DOMContentLoaded", function () {
    debug("############# DOMContentLoaded");
    var titleElement = win.document.documentElement.querySelector("head > title");
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
    var readiumcssJson;
    if (win.READIUM2.urlQueryParams) {
        var base64ReadiumCSS = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_CSS];
        if (base64ReadiumCSS) {
            var str = void 0;
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
        var scrollElement = readium_css_1.getScrollingElement(win.document);
        if (!scrollElement.classList.contains(styles_1.ZERO_TRANSFORM_CLASS)) {
            scrollElement.classList.add(styles_1.ZERO_TRANSFORM_CLASS);
        }
    }
    var w = (readiumcssJson && readiumcssJson.fixedLayoutWebViewWidth) || win.innerWidth;
    var h = (readiumcssJson && readiumcssJson.fixedLayoutWebViewHeight) || win.innerHeight;
    var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, w, h, win.READIUM2.webViewSlot);
    if (wh) {
        win.READIUM2.fxlViewportWidth = wh.width;
        win.READIUM2.fxlViewportHeight = wh.height;
        win.READIUM2.fxlViewportScale = wh.scale;
    }
    var alreadedInjected = win.document.documentElement.hasAttribute("data-readiumcss-injected");
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
    setTimeout(function () {
        loaded(true);
    }, 500);
});
function checkSoundtrack(documant) {
    var audioNodeList = documant.querySelectorAll("audio");
    if (!audioNodeList || !audioNodeList.length) {
        return;
    }
    var audio = audioNodeList[0];
    var epubType = audio.getAttribute("epub:type");
    if (!epubType) {
        epubType = audio.getAttributeNS("http://www.idpf.org/2007/ops", "type");
    }
    if (!epubType) {
        return;
    }
    if (epubType.indexOf("ibooks:soundtrack") < 0) {
        return;
    }
    var src = audio.getAttribute("src");
    if (!src) {
        if (!audio.childNodes) {
            return;
        }
        for (var i = 0; i < audio.childNodes.length; i++) {
            var childNode = audio.childNodes[i];
            if (childNode.nodeType === 1) {
                var el = childNode;
                var elName = el.nodeName.toLowerCase();
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
    debug("AUDIO SOUNDTRACK: " + src + " ---> " + audio.src);
    if (!audio.src) {
        return;
    }
    var payload = {
        url: audio.src,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_AUDIO_SOUNDTRACK, payload);
}
function mediaOverlaysClickRaw(element, userInteract) {
    var textFragmentIDChain = [];
    if (element) {
        var curEl = element;
        do {
            var id = curEl.getAttribute("id");
            textFragmentIDChain.push(id ? id : null);
            curEl = curEl.parentNode;
        } while (curEl && curEl.nodeType === Node.ELEMENT_NODE);
    }
    var payload = {
        textFragmentIDChain: textFragmentIDChain,
        userInteract: userInteract,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_MEDIA_OVERLAY_CLICK, payload);
}
var onScrollRaw = function () {
    debug("onScrollRaw");
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var el = win.READIUM2.locationHashOverride;
    if (el && computeVisibility_(el, undefined)) {
        debug("onScrollRaw VISIBLE SKIP");
        return;
    }
    var x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
    processXYRaw(x, 0, false);
};
var onScrollDebounced = debounce_1.debounce(function () {
    onScrollRaw();
}, 300);
var _loaded = false;
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
                var linkTxt = "__";
                var focusLink_1 = win.document.createElement("a");
                focusLink_1.setAttribute("id", styles_1.SKIP_LINK_ID);
                focusLink_1.appendChild(win.document.createTextNode(linkTxt));
                focusLink_1.setAttribute("title", linkTxt);
                focusLink_1.setAttribute("aria-label", linkTxt);
                focusLink_1.setAttribute("href", "javascript:;");
                focusLink_1.setAttribute("tabindex", "0");
                win.document.body.insertAdjacentElement("afterbegin", focusLink_1);
                setTimeout(function () {
                    focusLink_1.addEventListener("click", function (_ev) {
                        if (IS_DEV) {
                            debug("focus link click:");
                            debug(win.READIUM2.hashElement ?
                                getCssSelector(win.READIUM2.hashElement) : "!hashElement");
                            debug(win.READIUM2.locationHashOverride ?
                                getCssSelector(win.READIUM2.locationHashOverride) : "!locationHashOverride");
                        }
                        var el = win.READIUM2.hashElement || win.READIUM2.locationHashOverride;
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
    win.document.documentElement.addEventListener("keydown", function (ev) {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.add(styles_1.ROOT_CLASS_KEYBOARD_INTERACT);
        }
        if (ev.code === "ArrowLeft" || ev.code === "ArrowRight") {
            if (ev.target && elementCapturesKeyboardArrowKeys(ev.target)) {
                ev.target.r2_leftrightKeyboardTimeStamp = new Date();
            }
        }
    }, true);
    win.document.documentElement.addEventListener("mousedown", function (_ev) {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_KEYBOARD_INTERACT);
        }
    }, true);
    if (win.READIUM2.isAudio) {
        debug("AUDIOBOOK RENDER ...");
        return;
    }
    win.document.body.addEventListener("focusin", function (ev) {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        if (ev.target) {
            var ignoreIncomingMouseClickOnFocusable = false;
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
    var useResizeObserver = !win.READIUM2.isFixedLayout;
    if (useResizeObserver && win.document.body) {
        setTimeout(function () {
            var _firstResizeObserver = true;
            var resizeObserver = new window.ResizeObserver(function (_entries) {
                if (_firstResizeObserver) {
                    _firstResizeObserver = false;
                    debug("ResizeObserver SKIP FIRST");
                    return;
                }
                win.document.body.tabbables = undefined;
                scrollToHashDebounced(false);
            });
            resizeObserver.observe(win.document.body);
            setTimeout(function () {
                if (_firstResizeObserver) {
                    _firstResizeObserver = false;
                    debug("ResizeObserver CANCEL SKIP FIRST");
                }
            }, 700);
        }, 1000);
    }
    var _mouseMoveTimeout;
    win.document.documentElement.addEventListener("mousemove", function (_ev) {
        if (_mouseMoveTimeout) {
            win.clearTimeout(_mouseMoveTimeout);
            _mouseMoveTimeout = undefined;
        }
        win.document.documentElement.classList.remove(styles_1.HIDE_CURSOR_CLASS);
        _mouseMoveTimeout = win.setTimeout(function () {
            win.document.documentElement.classList.add(styles_1.HIDE_CURSOR_CLASS);
        }, 1000);
    });
    win.document.addEventListener("click", function (ev) {
        var currentElement = ev.target;
        var href;
        while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
            if (currentElement.tagName.toLowerCase() === "a") {
                href = currentElement.href;
                var href_ = currentElement.getAttribute("href");
                debug("A LINK CLICK: " + href + " (" + href_ + ")");
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
        var hrefStr = href;
        if (/^javascript:/.test(hrefStr)) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        var done = popupFootNotes_1.popupFootNote(currentElement, focusScrollRaw, hrefStr, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        if (!done) {
            focusScrollDebounced.clear();
            processXYDebouncedImmediate.clear();
            notifyReadingLocationDebounced.clear();
            notifyReadingLocationDebouncedImmediate.clear();
            scrollToHashDebounced.clear();
            onScrollDebounced.clear();
            onResizeDebounced.clear();
            handleFocusInDebounced.clear();
            var payload = {
                url: hrefStr,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
        }
        return false;
    }, true);
    var onResizeRaw = function () {
        var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight, win.READIUM2.webViewSlot);
        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
            win.READIUM2.fxlViewportScale = wh.scale;
        }
        debug("++++ scrollToHashDebounced FROM RESIZE");
        scrollToHashDebounced(false);
    };
    var onResizeDebounced = debounce_1.debounce(function () {
        onResizeRaw();
    }, 200);
    var _firstWindowResize = true;
    win.addEventListener("resize", function () {
        if (_firstWindowResize) {
            debug("Window resize, SKIP FIRST");
            _firstWindowResize = false;
            return;
        }
        onResizeDebounced();
    });
    var _wheelTimeStamp = -1;
    var _wheelSpin = 0;
    var wheelDebounced = function (ev) {
        var now = (new Date()).getTime();
        if (_wheelTimeStamp === -1) {
            _wheelTimeStamp = now;
        }
        else {
            var msDiff = now - _wheelTimeStamp;
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
        var documant = win.document;
        var isPaged = readium_css_inject_1.isPaginated(documant);
        if (isPaged) {
            return;
        }
        var delta = Math.abs(ev.deltaY);
        _wheelSpin += delta;
        if (_wheelSpin < 300) {
            return;
        }
        _wheelSpin = 0;
        _wheelTimeStamp = -1;
        var scrollElement = readium_css_1.getScrollingElement(documant);
        var goPREVIOUS = ev.deltaY < 0;
        if (!goPREVIOUS) {
            var maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
            var maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;
            if (isPaged) {
                var unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                    scrollElement.scrollTop :
                    scrollElement.scrollLeft);
                var isNegative = scrollElementOffset < 0;
                var scrollElementOffsetAbs = Math.abs(scrollElementOffset);
                var fractional = scrollElementOffsetAbs / unit;
                var integral = Math.floor(fractional);
                var decimal = fractional - integral;
                var partial = decimal * unit;
                if (partial <= CSS_PIXEL_TOLERANCE) {
                    scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
                }
                else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                    scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
                }
                if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs >= maxScrollShiftTolerated) ||
                    !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs >= maxScrollShiftTolerated)) {
                    var payload = {
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
                    var payload = {
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
                var unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollElementOffset = Math.round(readium_css_1.isVerticalWritingMode() ?
                    scrollElement.scrollTop :
                    scrollElement.scrollLeft);
                var isNegative = scrollElementOffset < 0;
                var scrollElementOffsetAbs = Math.abs(scrollElementOffset);
                var fractional = scrollElementOffsetAbs / unit;
                var integral = Math.floor(fractional);
                var decimal = fractional - integral;
                var partial = decimal * unit;
                if (partial <= CSS_PIXEL_TOLERANCE) {
                    scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
                }
                else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                    scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
                }
                if (readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs <= 0) ||
                    !readium_css_1.isVerticalWritingMode() && (scrollElementOffsetAbs <= 0)) {
                    var payload = {
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
                    var payload = {
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
    win.document.addEventListener("scroll", function (_ev) {
        _wheelSpin = 0;
        _wheelTimeStamp = -1;
    });
    setTimeout(function () {
        win.addEventListener("scroll", function (_ev) {
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
        var x = ev.clientX;
        var y = ev.clientY;
        processXYDebouncedImmediate(x, y, false, true);
        var element;
        var textNode;
        var textNodeOffset = -1;
        var range = win.document.caretRangeFromPoint(x, y);
        if (range) {
            var node = range.startContainer;
            var offset = range.startOffset;
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
    win.document.documentElement.addEventListener("mouseup", function (ev) {
        handleMouseEvent(ev);
    });
    win.document.addEventListener("mouseup", function (ev) {
        if (ev.target && ev.target.getAttribute) {
            var iBooksMO = ev.target.getAttribute("ibooks:readaloud") ||
                ev.target.getAttribute("readaloud");
            if (iBooksMO) {
                var payload = {
                    start: iBooksMO === "start" ? true : undefined,
                    startstop: iBooksMO === "startstop" ? true : undefined,
                    stop: iBooksMO === "stop" ? true : undefined,
                };
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_MEDIA_OVERLAY_STARTSTOP, payload);
            }
        }
    }, true);
    win.document.body.addEventListener("copy", function (evt) {
        if (win.READIUM2.isClipboardIntercept) {
            var selection = win.document.getSelection();
            if (selection) {
                var str_1 = selection.toString();
                if (str_1) {
                    evt.preventDefault();
                    setTimeout(function () {
                        var payload = {
                            locator: win.READIUM2.locationHashOverrideInfo,
                            txt: str_1,
                        };
                        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_CLIPBOARD_COPY, payload);
                    }, 500);
                }
            }
        }
    });
}
win.addEventListener("load", function () {
    debug("############# load");
    loaded(false);
});
function checkBlacklisted(el) {
    var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
    var id = el.getAttribute("id");
    if (id && _blacklistIdClassForCFI.indexOf(id) >= 0) {
        if (IS_DEV && id !== styles_1.SKIP_LINK_ID) {
            debug("checkBlacklisted ID: " + id);
        }
        return true;
    }
    try {
        for (var _blacklistIdClassForCFI_1 = tslib_1.__values(_blacklistIdClassForCFI), _blacklistIdClassForCFI_1_1 = _blacklistIdClassForCFI_1.next(); !_blacklistIdClassForCFI_1_1.done; _blacklistIdClassForCFI_1_1 = _blacklistIdClassForCFI_1.next()) {
            var item = _blacklistIdClassForCFI_1_1.value;
            if (el.classList.contains(item)) {
                if (IS_DEV) {
                    debug("checkBlacklisted CLASS: " + item);
                }
                return true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_blacklistIdClassForCFI_1_1 && !_blacklistIdClassForCFI_1_1.done && (_a = _blacklistIdClassForCFI_1.return)) _a.call(_blacklistIdClassForCFI_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
    if (mathJax) {
        var low = el.tagName.toLowerCase();
        try {
            for (var _blacklistIdClassForCFIMathJax_1 = tslib_1.__values(_blacklistIdClassForCFIMathJax), _blacklistIdClassForCFIMathJax_1_1 = _blacklistIdClassForCFIMathJax_1.next(); !_blacklistIdClassForCFIMathJax_1_1.done; _blacklistIdClassForCFIMathJax_1_1 = _blacklistIdClassForCFIMathJax_1.next()) {
                var item = _blacklistIdClassForCFIMathJax_1_1.value;
                if (low.startsWith(item)) {
                    if (IS_DEV) {
                        debug("checkBlacklisted MathJax ELEMENT NAME: " + el.tagName);
                    }
                    return true;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_blacklistIdClassForCFIMathJax_1_1 && !_blacklistIdClassForCFIMathJax_1_1.done && (_b = _blacklistIdClassForCFIMathJax_1.return)) _b.call(_blacklistIdClassForCFIMathJax_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        if (id) {
            var lowId = id.toLowerCase();
            try {
                for (var _blacklistIdClassForCFIMathJax_2 = tslib_1.__values(_blacklistIdClassForCFIMathJax), _blacklistIdClassForCFIMathJax_2_1 = _blacklistIdClassForCFIMathJax_2.next(); !_blacklistIdClassForCFIMathJax_2_1.done; _blacklistIdClassForCFIMathJax_2_1 = _blacklistIdClassForCFIMathJax_2.next()) {
                    var item = _blacklistIdClassForCFIMathJax_2_1.value;
                    if (lowId.startsWith(item)) {
                        if (IS_DEV) {
                            debug("checkBlacklisted MathJax ID: " + id);
                        }
                        return true;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCFIMathJax_2_1 && !_blacklistIdClassForCFIMathJax_2_1.done && (_c = _blacklistIdClassForCFIMathJax_2.return)) _c.call(_blacklistIdClassForCFIMathJax_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        for (var i = 0; i < el.classList.length; i++) {
            var cl = el.classList[i];
            var lowCl = cl.toLowerCase();
            try {
                for (var _blacklistIdClassForCFIMathJax_3 = (e_4 = void 0, tslib_1.__values(_blacklistIdClassForCFIMathJax)), _blacklistIdClassForCFIMathJax_3_1 = _blacklistIdClassForCFIMathJax_3.next(); !_blacklistIdClassForCFIMathJax_3_1.done; _blacklistIdClassForCFIMathJax_3_1 = _blacklistIdClassForCFIMathJax_3.next()) {
                    var item = _blacklistIdClassForCFIMathJax_3_1.value;
                    if (lowCl.startsWith(item)) {
                        if (IS_DEV) {
                            debug("checkBlacklisted MathJax CLASS: " + cl);
                        }
                        return true;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCFIMathJax_3_1 && !_blacklistIdClassForCFIMathJax_3_1.done && (_d = _blacklistIdClassForCFIMathJax_3.return)) _d.call(_blacklistIdClassForCFIMathJax_3);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
    }
    return false;
}
function findFirstVisibleElement(rootElement) {
    var blacklisted = checkBlacklisted(rootElement);
    if (blacklisted) {
        return undefined;
    }
    for (var i = 0; i < rootElement.children.length; i++) {
        var child = rootElement.children[i];
        if (child.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }
        var visibleElement = findFirstVisibleElement(child);
        if (visibleElement) {
            return visibleElement;
        }
    }
    if (rootElement !== win.document.body &&
        rootElement !== win.document.documentElement) {
        var visible = computeVisibility_(rootElement, undefined);
        if (visible) {
            return rootElement;
        }
    }
    return undefined;
}
var processXYRaw = function (x, y, reverse, userInteract) {
    if (popup_dialog_1.isPopupDialogOpen(win.document)) {
        return;
    }
    var element;
    var range = win.document.caretRangeFromPoint(x, y);
    if (range) {
        var node = range.startContainer;
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
        var root = win.document.body;
        element = findFirstVisibleElement(root);
        if (!element) {
            debug("|||||||||||||| cannot find visible element inside BODY / HTML????");
            element = win.document.body;
        }
    }
    else if (!userInteract && !computeVisibility_(element, undefined)) {
        var next = element;
        var found = void 0;
        while (next) {
            var firstInside = findFirstVisibleElement(next);
            if (firstInside) {
                found = firstInside;
                break;
            }
            var sibling = reverse ? next.previousElementSibling : next.nextElementSibling;
            var parent_1 = next;
            while (!sibling) {
                parent_1 = parent_1.parentNode;
                if (!parent_1 || parent_1.nodeType !== Node.ELEMENT_NODE) {
                    break;
                }
                sibling = reverse ?
                    parent_1.previousElementSibling :
                    parent_1.nextElementSibling;
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
            var visible = win.READIUM2.isFixedLayout ||
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
            var el = win.READIUM2.locationHashOverride ? win.READIUM2.locationHashOverride : element;
            var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr2 + "]");
            existings.forEach(function (existing) {
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr2);
            });
            el.setAttribute(styles_1.readPosCssStylesAttr2, "processXYRaw");
        }
    }
};
var processXYDebouncedImmediate = debounce_1.debounce(function (x, y, reverse, userInteract) {
    processXYRaw(x, y, reverse, userInteract);
}, 300, true);
var computeProgressionData = function () {
    var e_5, _a;
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    var isTwoPage = readium_css_1.isTwoPageSpread();
    var _b = readium_css_1.calculateMaxScrollShift(), maxScrollShift = _b.maxScrollShift, maxScrollShiftAdjusted = _b.maxScrollShiftAdjusted;
    var totalColumns = readium_css_1.calculateTotalColumns();
    var progressionRatio = 0;
    var currentColumn = 0;
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var extraShift = 0;
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
        var adjustedTotalColumns = (extraShift ? (totalColumns + 1) : totalColumns) - (isTwoPage ? 2 : 1);
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
        var element = win.READIUM2.locationHashOverride;
        var offset = 0;
        if (isPaged) {
            var visible = computeVisibility_(element, undefined);
            if (visible) {
                var curCol = extraShift ? (currentColumn - 1) : currentColumn;
                var columnDimension = readium_css_1.calculateColumnDimension();
                if (readium_css_1.isVerticalWritingMode()) {
                    var rect = element.getBoundingClientRect();
                    offset = (curCol * scrollElement.scrollWidth) + rect.left +
                        (rect.top >= columnDimension ? scrollElement.scrollWidth : 0);
                }
                else {
                    var boundingRect = element.getBoundingClientRect();
                    var clientRects = rect_utils_1.getClientRectsNoOverlap_(element.getClientRects(), false);
                    var rectangle = void 0;
                    try {
                        for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
                            var rect = clientRects_1_1.value;
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
                                    var boundary = 2 * columnDimension;
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
                    }
                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                    finally {
                        try {
                            if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
                        }
                        finally { if (e_5) throw e_5.error; }
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
                var totalDocumentDimension = ((readium_css_1.isVerticalWritingMode() ? scrollElement.scrollWidth :
                    scrollElement.scrollHeight) * totalColumns);
                progressionRatio = offset / totalDocumentDimension;
                currentColumn = totalColumns * progressionRatio;
                currentColumn = Math.floor(currentColumn);
            }
        }
        else {
            var rect = element.getBoundingClientRect();
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
    var spreadIndex = 0;
    if (isPaged) {
        spreadIndex = isTwoPage ? Math.floor(currentColumn / 2) : currentColumn;
    }
    return {
        paginationInfo: isPaged ? {
            currentColumn: currentColumn,
            isTwoPageSpread: isTwoPage,
            spreadIndex: spreadIndex,
            totalColumns: totalColumns,
        } : undefined,
        percentRatio: progressionRatio,
    };
};
exports.computeProgressionData = computeProgressionData;
var _blacklistIdClassForCssSelectors = [styles_1.LINK_TARGET_CLASS, styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, styles_1.TTS_ID_SPEAKING_DOC_ELEMENT, styles_1.ROOT_CLASS_KEYBOARD_INTERACT, styles_1.ROOT_CLASS_INVISIBLE_MASK, styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED, styles_1.CLASS_PAGINATED, styles_1.ROOT_CLASS_NO_FOOTNOTES];
var _blacklistIdClassForCssSelectorsMathJax = ["mathjax", "ctxt", "mjx"];
var _blacklistIdClassForCFI = [styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA];
var _blacklistIdClassForCFIMathJax = ["mathjax", "ctxt", "mjx"];
var computeCFI = function (node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    var cfi = "";
    var currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        var blacklisted = checkBlacklisted(currentElement);
        if (!blacklisted) {
            var currentElementParentChildren = currentElement.parentNode.children;
            var currentElementIndex = -1;
            var j = 0;
            for (var i = 0; i < currentElementParentChildren.length; i++) {
                var childBlacklisted = checkBlacklisted(currentElementParentChildren[i]);
                if (childBlacklisted) {
                    j++;
                }
                if (currentElement === currentElementParentChildren[i]) {
                    currentElementIndex = i;
                    break;
                }
            }
            if (currentElementIndex >= 0) {
                var cfiIndex = (currentElementIndex - j + 1) * 2;
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
var _getCssSelectorOptions = {
    className: function (str) {
        var e_6, _a;
        if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
            return false;
        }
        var mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
        if (mathJax) {
            var low = str.toLowerCase();
            try {
                for (var _blacklistIdClassForCssSelectorsMathJax_1 = tslib_1.__values(_blacklistIdClassForCssSelectorsMathJax), _blacklistIdClassForCssSelectorsMathJax_1_1 = _blacklistIdClassForCssSelectorsMathJax_1.next(); !_blacklistIdClassForCssSelectorsMathJax_1_1.done; _blacklistIdClassForCssSelectorsMathJax_1_1 = _blacklistIdClassForCssSelectorsMathJax_1.next()) {
                    var item = _blacklistIdClassForCssSelectorsMathJax_1_1.value;
                    if (low.startsWith(item)) {
                        return false;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCssSelectorsMathJax_1_1 && !_blacklistIdClassForCssSelectorsMathJax_1_1.done && (_a = _blacklistIdClassForCssSelectorsMathJax_1.return)) _a.call(_blacklistIdClassForCssSelectorsMathJax_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        return true;
    },
    idName: function (str) {
        var e_7, _a;
        if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
            return false;
        }
        var mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
        if (mathJax) {
            var low = str.toLowerCase();
            try {
                for (var _blacklistIdClassForCssSelectorsMathJax_2 = tslib_1.__values(_blacklistIdClassForCssSelectorsMathJax), _blacklistIdClassForCssSelectorsMathJax_2_1 = _blacklistIdClassForCssSelectorsMathJax_2.next(); !_blacklistIdClassForCssSelectorsMathJax_2_1.done; _blacklistIdClassForCssSelectorsMathJax_2_1 = _blacklistIdClassForCssSelectorsMathJax_2.next()) {
                    var item = _blacklistIdClassForCssSelectorsMathJax_2_1.value;
                    if (low.startsWith(item)) {
                        return false;
                    }
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCssSelectorsMathJax_2_1 && !_blacklistIdClassForCssSelectorsMathJax_2_1.done && (_a = _blacklistIdClassForCssSelectorsMathJax_2.return)) _a.call(_blacklistIdClassForCssSelectorsMathJax_2);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
        return true;
    },
    tagName: function (str) {
        var e_8, _a;
        var mathJax = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_MATHJAX);
        if (mathJax) {
            try {
                for (var _blacklistIdClassForCssSelectorsMathJax_3 = tslib_1.__values(_blacklistIdClassForCssSelectorsMathJax), _blacklistIdClassForCssSelectorsMathJax_3_1 = _blacklistIdClassForCssSelectorsMathJax_3.next(); !_blacklistIdClassForCssSelectorsMathJax_3_1.done; _blacklistIdClassForCssSelectorsMathJax_3_1 = _blacklistIdClassForCssSelectorsMathJax_3.next()) {
                    var item = _blacklistIdClassForCssSelectorsMathJax_3_1.value;
                    if (str.startsWith(item)) {
                        return false;
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCssSelectorsMathJax_3_1 && !_blacklistIdClassForCssSelectorsMathJax_3_1.done && (_a = _blacklistIdClassForCssSelectorsMathJax_3.return)) _a.call(_blacklistIdClassForCssSelectorsMathJax_3);
                }
                finally { if (e_8) throw e_8.error; }
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
var _allEpubPageBreaks;
var _htmlNamespaces = {
    epub: "http://www.idpf.org/2007/ops",
};
var findPrecedingAncestorSiblingEpubPageBreak = function (element) {
    if (!_allEpubPageBreaks) {
        var namespaceResolver = function (prefix) {
            if (!prefix) {
                return null;
            }
            return _htmlNamespaces[prefix] || null;
        };
        var xpathResult = win.document.evaluate("//*[contains(concat(' ', normalize-space(@epub:type), ' '), ' pagebreak ') or contains(concat(' ', normalize-space(role), ' '), ' doc-pagebreak ')]", win.document.body, namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0; i < xpathResult.snapshotLength; i++) {
            var n = xpathResult.snapshotItem(i);
            if (n) {
                var el = n;
                var elTitle = el.getAttribute("title");
                var elLabel = el.getAttribute("aria-label");
                var elText = el.textContent;
                var pageLabel = elTitle || elLabel || elText;
                if (pageLabel) {
                    var pageBreak = {
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
    for (var i = _allEpubPageBreaks.length - 1; i >= 0; i--) {
        var pageBreak = _allEpubPageBreaks[i];
        var c = element.compareDocumentPosition(pageBreak.element);
        if (c === 0 || (c & Node.DOCUMENT_POSITION_PRECEDING) || (c & Node.DOCUMENT_POSITION_CONTAINS)) {
            debug("preceding or containing EPUB page break", pageBreak.text);
            return pageBreak.text;
        }
    }
    return undefined;
};
var notifyReadingLocationRaw = function (userInteract, ignoreMediaOverlays) {
    if (!win.READIUM2.locationHashOverride) {
        return;
    }
    if (win.READIUM2.urlQueryParams && win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] === "1") {
        win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_SECOND_WEBVIEW] = "2";
        return;
    }
    var blacklisted = checkBlacklisted(win.READIUM2.locationHashOverride);
    if (blacklisted) {
        return;
    }
    var progressionData;
    var cssSelector = getCssSelector(win.READIUM2.locationHashOverride);
    var cfi = exports.computeCFI(win.READIUM2.locationHashOverride);
    var progression = 0;
    if (win.READIUM2.isFixedLayout) {
        progression = 1;
    }
    else {
        progressionData = exports.computeProgressionData();
        progression = progressionData.percentRatio;
    }
    var pinfo = (progressionData && progressionData.paginationInfo) ?
        progressionData.paginationInfo : undefined;
    var selInfo = selection_2.getCurrentSelectionInfo(win, getCssSelector, exports.computeCFI);
    if (selInfo) {
        cssSelector = selInfo.rangeInfo.startContainerElementCssSelector;
        cfi = selInfo.rangeInfo.startContainerElementCFI;
    }
    var text = selInfo ? {
        after: undefined,
        before: undefined,
        highlight: selInfo.cleanText,
    } : undefined;
    var selectionIsNew;
    if (selInfo) {
        selectionIsNew =
            !win.READIUM2.locationHashOverrideInfo ||
                !win.READIUM2.locationHashOverrideInfo.selectionInfo ||
                !selection_1.sameSelections(win.READIUM2.locationHashOverrideInfo.selectionInfo, selInfo);
    }
    var epubPage = findPrecedingAncestorSiblingEpubPageBreak(win.READIUM2.locationHashOverride);
    var secondWebViewHref = win.READIUM2.urlQueryParams &&
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
        epubPage: epubPage,
        href: "",
        locations: {
            cfi: cfi,
            cssSelector: cssSelector,
            position: undefined,
            progression: progression,
        },
        paginationInfo: pinfo,
        secondWebViewHref: secondWebViewHref,
        selectionInfo: selInfo,
        selectionIsNew: selectionIsNew,
        text: text,
        title: _docTitle,
        userInteract: userInteract ? true : false,
    };
    var payload = win.READIUM2.locationHashOverrideInfo;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (!ignoreMediaOverlays) {
        mediaOverlaysClickRaw(win.READIUM2.locationHashOverride, userInteract ? true : false);
    }
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr4 + "]");
        existings.forEach(function (existing) {
            existing.removeAttribute("" + styles_1.readPosCssStylesAttr4);
        });
        win.READIUM2.locationHashOverride.setAttribute(styles_1.readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
var notifyReadingLocationDebounced = debounce_1.debounce(function (userInteract, ignoreMediaOverlays) {
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250);
var notifyReadingLocationDebouncedImmediate = debounce_1.debounce(function (userInteract, ignoreMediaOverlays) {
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250, true);
if (!win.READIUM2.isAudio) {
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PLAY, function (_event, payload) {
        var rootElement = win.document.querySelector(payload.rootElement);
        var startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;
        readaloud_1.ttsPlay(payload.speed, payload.voice, focusScrollRaw, rootElement ? rootElement : undefined, startElement ? startElement : undefined, undefined, -1, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_STOP, function (_event) {
        readaloud_1.ttsStop();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PAUSE, function (_event) {
        readaloud_1.ttsPause();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_RESUME, function (_event) {
        readaloud_1.ttsResume();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_NEXT, function (_event, payload) {
        readaloud_1.ttsNext(payload === null || payload === void 0 ? void 0 : payload.skipSentences);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PREVIOUS, function (_event, payload) {
        readaloud_1.ttsPrevious(payload === null || payload === void 0 ? void 0 : payload.skipSentences);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_PLAYBACK_RATE, function (_event, payload) {
        readaloud_1.ttsPlaybackRate(payload.speed);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_VOICE, function (_event, payload) {
        readaloud_1.ttsVoice(payload.voice);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_SENTENCE_DETECT_ENABLE, function (_event, payload) {
        win.READIUM2.ttsSentenceDetectionEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_CLICK_ENABLE, function (_event, payload) {
        win.READIUM2.ttsClickEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_OVERLAY_ENABLE, function (_event, payload) {
        win.READIUM2.ttsOverlayEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, function (_event, payload) {
        var styleAttr = win.document.documentElement.getAttribute("style");
        var isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
        var isSepia = styleAttr ? styleAttr.indexOf("readium-sepia-on") > 0 : false;
        var activeClass = (isNight || isSepia) ? styles_1.R2_MO_CLASS_ACTIVE :
            (payload.classActive ? payload.classActive : styles_1.R2_MO_CLASS_ACTIVE);
        var activeClassPlayback = payload.classActivePlayback ? payload.classActivePlayback : styles_1.R2_MO_CLASS_ACTIVE_PLAYBACK;
        if (payload.classActive) {
            var activeMoElements = win.document.body.querySelectorAll("." + payload.classActive);
            activeMoElements.forEach(function (elem) {
                if (payload.classActive) {
                    elem.classList.remove(payload.classActive);
                }
            });
        }
        var activeMoElements_ = win.document.body.querySelectorAll("." + styles_1.R2_MO_CLASS_ACTIVE);
        activeMoElements_.forEach(function (elem) {
            elem.classList.remove(styles_1.R2_MO_CLASS_ACTIVE);
        });
        var removeCaptionContainer = true;
        if (!payload.id) {
            win.document.documentElement.classList.remove(styles_1.R2_MO_CLASS_ACTIVE_PLAYBACK);
            win.document.documentElement.classList.remove(activeClassPlayback);
        }
        else {
            win.document.documentElement.classList.add(activeClassPlayback);
            var targetEl = win.document.getElementById(payload.id);
            if (targetEl) {
                targetEl.classList.add(activeClass);
                if (payload.captionsMode) {
                    var text = targetEl.textContent;
                    if (text) {
                        text = dom_text_utils_1.normalizeText(text).trim();
                        if (text) {
                            removeCaptionContainer = false;
                            var isUserBackground = styleAttr ?
                                styleAttr.indexOf("--USER__backgroundColor") >= 0 : false;
                            var isUserColor = styleAttr ?
                                styleAttr.indexOf("--USER__textColor") >= 0 : false;
                            var docStyle = win.getComputedStyle(win.document.documentElement);
                            var containerStyle = "background-color: white; color: black;";
                            if (isNight || isSepia) {
                                var rsBackground = docStyle.getPropertyValue("--RS__backgroundColor");
                                var rsColor = docStyle.getPropertyValue("--RS__textColor");
                                containerStyle = "background-color: " + rsBackground + "; color: " + rsColor + ";";
                            }
                            else {
                                if (isUserBackground || isUserColor) {
                                    containerStyle = "";
                                }
                                if (isUserBackground) {
                                    var usrBackground = docStyle.getPropertyValue("--USER__backgroundColor");
                                    containerStyle += "background-color: " + usrBackground + ";";
                                }
                                if (isUserColor) {
                                    var usrColor = docStyle.getPropertyValue("--USER__textColor");
                                    containerStyle += "color: " + usrColor + ";";
                                }
                            }
                            var isUserFontSize = styleAttr ?
                                styleAttr.indexOf("--USER__fontSize") >= 0 : false;
                            if (isUserFontSize) {
                                var usrFontSize = docStyle.getPropertyValue("--USER__fontSize");
                                containerStyle += "font-size: " + usrFontSize + ";";
                            }
                            else {
                                containerStyle += "font-size: 120%;";
                            }
                            var isUserLineHeight = styleAttr ?
                                styleAttr.indexOf("--USER__lineHeight") >= 0 : false;
                            if (isUserLineHeight) {
                                var usrLineHeight = docStyle.getPropertyValue("--USER__lineHeight");
                                containerStyle += "line-height: " + usrLineHeight + ";";
                            }
                            else {
                                containerStyle += "line-height: 1.2;";
                            }
                            var isUserFont = styleAttr ?
                                styleAttr.indexOf("--USER__fontFamily") >= 0 : false;
                            if (isUserFont) {
                                var usrFont = docStyle.getPropertyValue("--USER__fontFamily");
                                containerStyle += "font-family: " + usrFont + ";";
                            }
                            var payloadCaptions = {
                                containerStyle: containerStyle,
                                text: text,
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
                    var el = win.READIUM2.locationHashOverride;
                    var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr2 + "]");
                    existings.forEach(function (existing) {
                        existing.removeAttribute("" + styles_1.readPosCssStylesAttr2);
                    });
                    el.setAttribute(styles_1.readPosCssStylesAttr2, "R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT");
                }
            }
        }
        if (removeCaptionContainer) {
            var payloadCaptions = {
                containerStyle: undefined,
                text: undefined,
                textStyle: undefined,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_CAPTIONS, payloadCaptions);
        }
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_CREATE, function (_event, payloadPing) {
        var e_9, _a;
        if (payloadPing.highlightDefinitions &&
            payloadPing.highlightDefinitions.length === 1 &&
            payloadPing.highlightDefinitions[0].selectionInfo) {
            var selection = win.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        }
        var highlightDefinitions = !payloadPing.highlightDefinitions ?
            [
                {
                    color: undefined,
                    drawType: undefined,
                    expand: undefined,
                    selectionInfo: undefined,
                },
            ] :
            payloadPing.highlightDefinitions;
        try {
            for (var highlightDefinitions_1 = tslib_1.__values(highlightDefinitions), highlightDefinitions_1_1 = highlightDefinitions_1.next(); !highlightDefinitions_1_1.done; highlightDefinitions_1_1 = highlightDefinitions_1.next()) {
                var highlightDefinition = highlightDefinitions_1_1.value;
                if (!highlightDefinition.selectionInfo) {
                    highlightDefinition.selectionInfo = selection_2.getCurrentSelectionInfo(win, getCssSelector, exports.computeCFI);
                }
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (highlightDefinitions_1_1 && !highlightDefinitions_1_1.done && (_a = highlightDefinitions_1.return)) _a.call(highlightDefinitions_1);
            }
            finally { if (e_9) throw e_9.error; }
        }
        var highlights = highlight_1.createHighlights(win, highlightDefinitions, true);
        var payloadPong = {
            highlightDefinitions: payloadPing.highlightDefinitions,
            highlights: highlights.length ? highlights : undefined,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPong);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_REMOVE, function (_event, payload) {
        payload.highlightIDs.forEach(function (highlightID) {
            highlight_1.destroyHighlight(win.document, highlightID);
        });
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL, function (_event) {
        highlight_1.destroyAllhighlights(win.document);
    });
}
//# sourceMappingURL=preload.js.map