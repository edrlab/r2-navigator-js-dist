"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCFI = exports.computeProgressionData = void 0;
var tslib_1 = require("tslib");
var debounce = require("debounce");
var debug_ = require("debug");
var electron_1 = require("electron");
var tabbable_1 = require("tabbable");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var sessions_1 = require("../../common/sessions");
var events_1 = require("../../common/events");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var selection_1 = require("../../common/selection");
var styles_1 = require("../../common/styles");
var animateProperty_1 = require("../common/animateProperty");
var cssselector2_3_1 = require("../common/cssselector2-3");
var dom_text_utils_1 = require("../common/dom-text-utils");
var easings_1 = require("../common/easings");
var popup_dialog_1 = require("../common/popup-dialog");
var querystring_1 = require("../common/querystring");
var rect_utils_1 = require("../common/rect-utils");
var url_params_1 = require("../common/url-params");
var audiobook_1 = require("./audiobook");
var epubReadingSystem_1 = require("./epubReadingSystem");
var highlight_1 = require("./highlight");
var popoutImages_1 = require("./popoutImages");
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
var INJECTED_LINK_TXT = "__";
var win = global.window;
win.READIUM2 = {
    DEBUG_VISUALS: false,
    fxlViewportHeight: 0,
    fxlViewportScale: 1,
    fxlViewportWidth: 0,
    fxlZoomPercent: 0,
    hashElement: null,
    isAudio: false,
    ignorekeyDownUpEvents: false,
    isClipboardIntercept: false,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideInfo: {
        audioPlaybackInfo: undefined,
        docInfo: undefined,
        epubPage: undefined,
        epubPageID: undefined,
        headings: undefined,
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
    ttsSkippabilityEnabled: false,
    ttsSentenceDetectionEnabled: true,
    ttsVoice: null,
    urlQueryParams: win.location.search ? (0, querystring_1.getURLQueryParams)(win.location.search) : undefined,
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
var TOUCH_SWIPE_DELTA_MIN = 80;
var TOUCH_SWIPE_LONG_PRESS_MAX_TIME = 500;
var TOUCH_SWIPE_MAX_TIME = 500;
var touchstartEvent;
var touchEventEnd;
win.document.addEventListener("touchstart", function (event) {
    if ((0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
        touchstartEvent = undefined;
        touchEventEnd = undefined;
        return;
    }
    if (event.changedTouches.length !== 1) {
        return;
    }
    touchstartEvent = event;
}, true);
win.document.addEventListener("touchend", function (event) {
    if ((0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
        touchstartEvent = undefined;
        touchEventEnd = undefined;
        return;
    }
    if (event.changedTouches.length !== 1) {
        return;
    }
    if (!touchstartEvent) {
        return;
    }
    var startTouch = touchstartEvent.changedTouches[0];
    var endTouch = event.changedTouches[0];
    if (!startTouch || !endTouch) {
        return;
    }
    var deltaX = (startTouch.clientX - endTouch.clientX) / win.devicePixelRatio;
    var deltaY = (startTouch.clientY - endTouch.clientY) / win.devicePixelRatio;
    if (Math.abs(deltaX) < TOUCH_SWIPE_DELTA_MIN &&
        Math.abs(deltaY) < TOUCH_SWIPE_DELTA_MIN) {
        if (touchEventEnd) {
            touchstartEvent = undefined;
            touchEventEnd = undefined;
            return;
        }
        if (event.timeStamp - touchstartEvent.timeStamp >
            TOUCH_SWIPE_LONG_PRESS_MAX_TIME) {
            touchstartEvent = undefined;
            touchEventEnd = undefined;
            return;
        }
        touchstartEvent = undefined;
        touchEventEnd = event;
        return;
    }
    touchEventEnd = undefined;
    if (event.timeStamp - touchstartEvent.timeStamp >
        TOUCH_SWIPE_MAX_TIME) {
        touchstartEvent = undefined;
        return;
    }
    var slope = (startTouch.clientY - endTouch.clientY) /
        (startTouch.clientX - endTouch.clientX);
    if (Math.abs(slope) > 0.5) {
        touchstartEvent = undefined;
        return;
    }
    var rtl = (0, readium_css_1.isRTL)();
    if (deltaX < 0) {
        var payload = {
            go: rtl ? "PREVIOUS" : "NEXT",
            nav: true,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    }
    else {
        var payload = {
            go: rtl ? "NEXT" : "PREVIOUS",
            nav: true,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    }
    touchstartEvent = undefined;
}, true);
function keyDownUpEventHandler(ev, keyDown) {
    if (win.READIUM2.ignorekeyDownUpEvents) {
        return;
    }
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
        (0, epubReadingSystem_1.setWindowNavigatorEpubReadingSystem)(win, readiumEpubReadingSystemJson);
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
            var existings = win.document.querySelectorAll("*[".concat(styles_1.readPosCssStylesAttr1, "], *[").concat(styles_1.readPosCssStylesAttr2, "], *[").concat(styles_1.readPosCssStylesAttr3, "], *[").concat(styles_1.readPosCssStylesAttr4, "]"));
            existings.forEach(function (existing) {
                existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr1));
                existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr2));
                existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr3));
                existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr4));
            });
        }
        if (payload.cssClass) {
            if (_blacklistIdClassForCssSelectors.indexOf(payload.cssClass) < 0) {
                _blacklistIdClassForCssSelectors.push(payload.cssClass.toLowerCase());
            }
            if (payload.debugVisuals && payload.cssStyles && payload.cssStyles.length) {
                var idSuffix = "debug_for_class_".concat(payload.cssClass);
                (0, readium_css_inject_1.appendCSSInline)(win.document, idSuffix, payload.cssStyles);
                if (payload.cssSelector) {
                    var toHighlights = win.document.querySelectorAll(payload.cssSelector);
                    toHighlights.forEach(function (toHighlight) {
                        var clazz = "".concat(payload.cssClass);
                        if (!toHighlight.classList.contains(clazz)) {
                            toHighlight.classList.add(clazz);
                        }
                    });
                }
            }
            else {
                var existings = win.document.querySelectorAll(".".concat(payload.cssClass));
                existings.forEach(function (existing) {
                    existing.classList.remove("".concat(payload.cssClass));
                });
            }
        }
    });
}
function isVisible(element, domRect) {
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
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var vwm = (0, readium_css_1.isVerticalWritingMode)();
    if (!(0, readium_css_inject_1.isPaginated)(win.document)) {
        var rect = domRect || element.getBoundingClientRect();
        if (vwm) {
            if (rect.left >= 0 &&
                (rect.left + rect.width) <= win.document.documentElement.clientWidth) {
                return true;
            }
        }
        else {
            if (rect.top >= 0 &&
                (rect.top + rect.height) <= win.document.documentElement.clientHeight) {
                return true;
            }
        }
        return false;
    }
    if (vwm) {
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
function isVisible_(location) {
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
            visible = isVisible(selected, undefined);
        }
    }
    return visible;
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_LOCATOR_VISIBLE, function (_event, payload) {
    payload.visible = isVisible_(payload.location);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LOCATOR_VISIBLE, payload);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, function (_event, payload) {
    if (win.READIUM2.isAudio) {
        return;
    }
    showHideContentMask(false, win.READIUM2.isFixedLayout);
    (0, selection_2.clearCurrentSelection)(win);
    (0, popup_dialog_1.closePopupDialogs)(win.document);
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
        var x = ((0, readium_css_1.isRTL)() ? win.document.documentElement.offsetWidth - 1 : 0);
        processXYRaw(x, 0, false);
        notifyReadingLocationDebounced();
        return;
    }
    var delayScrollIntoView = false;
    if (payload.hash) {
        debug(".hashElement = 1");
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
        var scrollElement_1 = (0, readium_css_1.getScrollingElement)(win.document);
        var scrollTop_1 = scrollElement_1.scrollTop;
        var scrollLeft_1 = scrollElement_1.scrollLeft;
        win.location.href = "#";
        setTimeout(function () {
            scrollElement_1.scrollTop = scrollTop_1;
            scrollElement_1.scrollLeft = scrollLeft_1;
        }, 0);
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
        epubPageID: undefined,
        headings: undefined,
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
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var val = scrollElement.scrollLeftExtra;
    if (val === 0) {
        return 0;
    }
    scrollElement.scrollLeftExtra = 0;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, { offset: 0, backgroundColor: undefined });
    return val;
}
function ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(scrollLeftExtra) {
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    scrollElement.scrollLeftExtra = scrollLeftExtra;
    var scrollLeftExtraBackgroundColor = scrollElement.scrollLeftExtraBackgroundColor;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHIFT_VIEW_X, {
        backgroundColor: scrollLeftExtraBackgroundColor ? scrollLeftExtraBackgroundColor : undefined,
        offset: ((0, readium_css_1.isRTL)() ? 1 : -1) * scrollLeftExtra,
    });
}
function ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, maxScrollShift) {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var dialogPopup = (0, popup_dialog_1.isPopupDialogOpen)(win.document);
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
        !(0, readium_css_inject_1.isPaginated)(win.document) ||
        !(0, readium_css_1.isTwoPageSpread)() ||
        (0, readium_css_1.isVerticalWritingMode)() ||
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
        offset: ((0, readium_css_1.isRTL)() ? 1 : -1) * extraOffset,
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
    (0, selection_2.clearCurrentSelection)(win);
    (0, popup_dialog_1.closePopupDialogs)(win.document);
    if (win.READIUM2.isAudio || win.READIUM2.isFixedLayout || !win.document.body) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
        return;
    }
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
    var isPaged = (0, readium_css_inject_1.isPaginated)(win.document);
    var goPREVIOUS = payload.go === "PREVIOUS";
    var animationTime = 300;
    if (_lastAnimState && _lastAnimState.animating) {
        win.cancelAnimationFrame(_lastAnimState.id);
        _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
    }
    var vwm = (0, readium_css_1.isVerticalWritingMode)();
    if (!goPREVIOUS) {
        var maxScrollShift = (0, readium_css_1.calculateMaxScrollShift)().maxScrollShift;
        var maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;
        if (isPaged) {
            var unit = vwm ?
                win.document.documentElement.offsetHeight :
                win.document.documentElement.offsetWidth;
            var scrollElementOffset = Math.round(vwm ?
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
            if (vwm && (scrollElementOffsetAbs < maxScrollShiftTolerated) ||
                !vwm && (scrollElementOffsetAbs < maxScrollShiftTolerated)) {
                var scrollOffsetPotentiallyExcessive_ = vwm ?
                    (scrollElementOffset + unit) :
                    (scrollElementOffset + ((0, readium_css_1.isRTL)() ? -1 : 1) * unit);
                var nWholes = Math.floor(scrollOffsetPotentiallyExcessive_ / unit);
                var scrollOffsetPotentiallyExcessive = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                var scrollOffset = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                    Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                var targetObj = scrollElement;
                var targetProp = vwm ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = scrollOffset;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = (0, animateProperty_1.animateProperty)(win.cancelAnimationFrame, function (_cancelled) {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
        else {
            if (vwm && (Math.abs(scrollElement.scrollLeft) < (maxScrollShiftTolerated - CSS_PIXEL_TOLERANCE)) ||
                !vwm && (Math.abs(scrollElement.scrollTop) < (maxScrollShiftTolerated - CSS_PIXEL_TOLERANCE))) {
                var newVal = vwm ?
                    (scrollElement.scrollLeft + ((0, readium_css_1.isRTL)() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop + win.document.documentElement.clientHeight);
                var targetObj = scrollElement;
                var targetProp = vwm ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = newVal;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = (0, animateProperty_1.animateProperty)(win.cancelAnimationFrame, function (_cancelled) {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            var unit = vwm ?
                win.document.documentElement.offsetHeight :
                win.document.documentElement.offsetWidth;
            var scrollElementOffset = Math.round(vwm ?
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
            if (vwm && (scrollElementOffsetAbs > 0) ||
                !vwm && (scrollElementOffsetAbs > 0)) {
                var scrollOffset_ = vwm ?
                    (scrollElementOffset - unit) :
                    (scrollElementOffset - ((0, readium_css_1.isRTL)() ? -1 : 1) * unit);
                var nWholes = (0, readium_css_1.isRTL)() ? Math.floor(scrollOffset_ / unit) : Math.ceil(scrollOffset_ / unit);
                var scrollOffset = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, 0);
                var targetObj = scrollElement;
                var targetProp = vwm ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = scrollOffset;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = (0, animateProperty_1.animateProperty)(win.cancelAnimationFrame, function (_cancelled) {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
                electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
        else {
            if (vwm && (Math.abs(scrollElement.scrollLeft) > CSS_PIXEL_TOLERANCE) ||
                !vwm && (Math.abs(scrollElement.scrollTop) > CSS_PIXEL_TOLERANCE)) {
                var newVal = vwm ?
                    (scrollElement.scrollLeft - ((0, readium_css_1.isRTL)() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop - win.document.documentElement.clientHeight);
                var targetObj = scrollElement;
                var targetProp = vwm ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    targetObj[targetProp] = newVal;
                }
                else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = (0, animateProperty_1.animateProperty)(win.cancelAnimationFrame, function (_cancelled) {
                        _ignoreScrollEvent = false;
                        onScrollDebounced();
                    }, targetProp, animationTime, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                payload.go = "";
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
function focusElement(element) {
    if (element === win.document.body) {
        var attr = element.getAttribute("tabindex");
        if (!attr) {
            element.setAttribute("tabindex", "-1");
            element.classList.add(styles_1.CSS_CLASS_NO_FOCUS_OUTLINE);
            if (IS_DEV) {
                debug("tabindex -1 set BODY (focusable):");
                debug(getCssSelector(element));
            }
        }
        element.focus({ preventScroll: true });
    }
    else {
        element.focus();
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_KEYBOARD_FOCUS_REQUEST, null);
    if (IS_DEV) {
        debug("KEYBOARD FOCUS REQUEST (1) ", getCssSelector(element));
    }
}
var tempLinkTargetOutline = function (element, time, alt) {
    var skip = false;
    var targets = win.document.querySelectorAll(".".concat(styles_1.LINK_TARGET_CLASS));
    targets.forEach(function (t) {
        if (alt && !t.classList.contains(styles_1.LINK_TARGET_ALT_CLASS)) {
            skip = true;
            return;
        }
        t.classList.remove(styles_1.LINK_TARGET_CLASS);
        t.classList.remove(styles_1.LINK_TARGET_ALT_CLASS);
    });
    if (skip) {
        return;
    }
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
    element.classList.add(styles_1.LINK_TARGET_CLASS);
    if (alt) {
        element.classList.add(styles_1.LINK_TARGET_ALT_CLASS);
    }
    if (element._timeoutTargetClass) {
        clearTimeout(element._timeoutTargetClass);
        element._timeoutTargetClass = undefined;
    }
    element._timeoutTargetClass = setTimeout(function () {
        debug("ANIMATION TIMEOUT REMOVE");
        element.classList.remove(styles_1.LINK_TARGET_CLASS);
        element.classList.remove(styles_1.LINK_TARGET_ALT_CLASS);
    }, time);
};
var _lastAnimState2;
var animationTime2 = 400;
function scrollElementIntoView(element, doFocus, animate, domRect) {
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[".concat(styles_1.readPosCssStylesAttr3, "]"));
        existings.forEach(function (existing) {
            existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr3));
        });
        element.setAttribute(styles_1.readPosCssStylesAttr3, "scrollElementIntoView");
    }
    if (win.READIUM2.isFixedLayout) {
        debug("scrollElementIntoView_ SKIP FXL");
        return;
    }
    if (doFocus) {
        if (!domRect && !(0, tabbable_1.isFocusable)(element)) {
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
        tempLinkTargetOutline(element, 2000, false);
        if (!domRect) {
            focusElement(element);
        }
    }
    setTimeout(function () {
        var isPaged = (0, readium_css_inject_1.isPaginated)(win.document);
        if (isPaged) {
            scrollIntoView(element, domRect);
        }
        else {
            var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
            var rect = domRect || element.getBoundingClientRect();
            if (isVisible(element, domRect)) {
                console.log("scrollElementIntoView already visible");
            }
            else {
                var vwm = (0, readium_css_1.isVerticalWritingMode)();
                var scrollTopMax = vwm ?
                    ((0, readium_css_1.isRTL)() ? -1 : 1) * (scrollElement.scrollWidth - win.document.documentElement.clientWidth) :
                    scrollElement.scrollHeight - win.document.documentElement.clientHeight;
                var offset = vwm ?
                    scrollElement.scrollLeft + (rect.left - (win.document.documentElement.clientWidth / 2)) :
                    scrollElement.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2));
                if (vwm && (0, readium_css_1.isRTL)()) {
                    if (offset < scrollTopMax) {
                        offset = scrollTopMax;
                    }
                    else if (offset > 0) {
                        offset = 0;
                    }
                }
                else {
                    if (offset > scrollTopMax) {
                        offset = scrollTopMax;
                    }
                    else if (offset < 0) {
                        offset = 0;
                    }
                }
                var diff = Math.abs((vwm ? scrollElement.scrollLeft : scrollElement.scrollTop) - offset);
                if (diff < 10) {
                    return;
                }
                var targetProp = vwm ? "scrollLeft" : "scrollTop";
                if (animate) {
                    var reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
                    if (_lastAnimState2 && _lastAnimState2.animating) {
                        win.cancelAnimationFrame(_lastAnimState2.id);
                        _lastAnimState2.object[_lastAnimState2.property] = _lastAnimState2.destVal;
                    }
                    var targetObj = scrollElement;
                    if (reduceMotion) {
                        _lastAnimState2 = undefined;
                        targetObj[targetProp] = offset;
                    }
                    else {
                        _ignoreScrollEvent = true;
                        _lastAnimState2 = (0, animateProperty_1.animateProperty)(win.cancelAnimationFrame, function (_cancelled) {
                            _ignoreScrollEvent = false;
                            onScrollDebounced();
                        }, targetProp, animationTime2, targetObj, offset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                    }
                }
                else {
                    scrollElement[targetProp] = offset;
                }
            }
        }
    }, doFocus ? 100 : 0);
}
function getScrollOffsetIntoView(element, domRect) {
    if (!win.document || !win.document.documentElement || !win.document.body ||
        !(0, readium_css_inject_1.isPaginated)(win.document) || (0, readium_css_1.isVerticalWritingMode)()) {
        return 0;
    }
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var rect = domRect || element.getBoundingClientRect();
    var columnDimension = (0, readium_css_1.calculateColumnDimension)();
    var isTwoPage = (0, readium_css_1.isTwoPageSpread)();
    var fullOffset = ((0, readium_css_1.isRTL)() ?
        ((columnDimension * (isTwoPage ? 2 : 1)) - (rect.left + rect.width)) :
        rect.left) +
        (((0, readium_css_1.isRTL)() ? -1 : 1) * scrollElement.scrollLeft);
    var columnIndex = Math.floor(fullOffset / columnDimension);
    var spreadIndex = isTwoPage ? Math.floor(columnIndex / 2) : columnIndex;
    return ((0, readium_css_1.isRTL)() ? -1 : 1) *
        (spreadIndex * (columnDimension * (isTwoPage ? 2 : 1)));
}
function scrollIntoView(element, domRect) {
    if (!win.document || !win.document.documentElement || !win.document.body || !(0, readium_css_inject_1.isPaginated)(win.document)) {
        return;
    }
    var maxScrollShift = (0, readium_css_1.calculateMaxScrollShift)().maxScrollShift;
    var scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element, domRect);
    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var scrollOffset = (scrollLeftPotentiallyExcessive < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive), maxScrollShift);
    scrollElement.scrollLeft = scrollOffset;
}
var scrollToHashRaw = function (animate) {
    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    (0, highlight_1.recreateAllHighlightsRaw)(win);
    debug("++++ scrollToHashRaw");
    var isPaged = (0, readium_css_inject_1.isPaginated)(win.document);
    var vwm = (0, readium_css_1.isVerticalWritingMode)();
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
        var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
        if (win.READIUM2.urlQueryParams) {
            var previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
            var isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                var _a = (0, readium_css_1.calculateMaxScrollShift)(), maxScrollShift = _a.maxScrollShift, maxScrollShiftAdjusted = _a.maxScrollShiftAdjusted;
                _ignoreScrollEvent = true;
                if (isPaged) {
                    if (vwm) {
                        scrollElement.scrollLeft = 0;
                        scrollElement.scrollTop = maxScrollShift;
                    }
                    else {
                        var scrollLeftPotentiallyExcessive = ((0, readium_css_1.isRTL)() ? -1 : 1) * maxScrollShiftAdjusted;
                        ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
                        var scrollLeft = ((0, readium_css_1.isRTL)() ? -1 : 1) * maxScrollShift;
                        scrollElement.scrollLeft = scrollLeft;
                        scrollElement.scrollTop = 0;
                    }
                }
                else {
                    if (vwm) {
                        scrollElement.scrollLeft = ((0, readium_css_1.isRTL)() ? -1 : 1) * maxScrollShift;
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
                    var x = ((0, readium_css_1.isRTL)() ? win.document.documentElement.offsetWidth - 1 : 0);
                    processXYRaw(x, 0, false);
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
                    debug(".hashElement = 2");
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
                            var domRange = (0, selection_2.convertRangeInfo)(win.document, rangeInfo);
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
                var maxScrollShift = (0, readium_css_1.calculateMaxScrollShift)().maxScrollShift;
                if (isPaged) {
                    var isTwoPage = (0, readium_css_1.isTwoPageSpread)();
                    var nColumns = (0, readium_css_1.calculateTotalColumns)();
                    var nUnits = isTwoPage ? Math.ceil(nColumns / 2) : nColumns;
                    var unitIndex = Math.floor(gotoProgression * nUnits);
                    var unit = vwm ?
                        win.document.documentElement.offsetHeight :
                        win.document.documentElement.offsetWidth;
                    var scrollOffsetPotentiallyExcessive = vwm ?
                        (unitIndex * unit) :
                        (((0, readium_css_1.isRTL)() ? -1 : 1) * unitIndex * unit);
                    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                    var scrollOffsetPaged = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                        Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                    _ignoreScrollEvent = true;
                    if (vwm) {
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
                    focusElement(win.READIUM2.locationHashOverride);
                    var x_1 = ((0, readium_css_1.isRTL)() ? win.document.documentElement.offsetWidth - 1 : 0);
                    processXYRaw(x_1, 0, false);
                    if (!win.READIUM2.locationHashOverride) {
                        notifyReadingLocationDebounced();
                    }
                    return;
                }
                var scrollOffset = gotoProgression * maxScrollShift;
                _ignoreScrollEvent = true;
                if (vwm) {
                    scrollElement.scrollLeft = ((0, readium_css_1.isRTL)() ? -1 : 1) * scrollOffset;
                }
                else {
                    scrollElement.scrollTop = scrollOffset;
                }
                setTimeout(function () {
                    _ignoreScrollEvent = false;
                }, 10);
                win.READIUM2.locationHashOverride = win.document.body;
                resetLocationHashOverrideInfo();
                focusElement(win.READIUM2.locationHashOverride);
                var x_2 = ((0, readium_css_1.isRTL)() ? win.document.documentElement.offsetWidth - 1 : 0);
                processXYRaw(x_2, 0, false);
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
        focusElement(win.READIUM2.locationHashOverride);
        debug("processXYRaw BODY");
        var x = ((0, readium_css_1.isRTL)() ? win.document.documentElement.offsetWidth - 1 : 0);
        processXYRaw(x, 0, false);
    }
    notifyReadingLocationDebounced();
};
var scrollToHashDebounced = debounce(function (animate) {
    debug("++++ scrollToHashRaw FROM DEBOUNCED");
    scrollToHashRaw(animate);
}, 100);
var _ignoreScrollEvent = false;
function showHideContentMask(doHide, isFixedLayout) {
    if (doHide) {
        win.document.documentElement.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK);
        win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED);
    }
    else {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_SHOW, null);
        if (isFixedLayout) {
            win.document.documentElement.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED);
        }
        win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    }
}
function focusScrollRaw(el, doFocus, animate, domRect) {
    if (!isVisible(el, domRect)) {
        scrollElementIntoView(el, doFocus, animate, domRect);
    }
    if (win.READIUM2.locationHashOverride === el) {
        return;
    }
    var blacklisted = checkBlacklisted(el);
    if (blacklisted) {
        return;
    }
    debug(".hashElement = 3");
    win.READIUM2.hashElement = doFocus ? el : win.READIUM2.hashElement;
    win.READIUM2.locationHashOverride = el;
    notifyReadingLocationDebounced();
}
var focusScrollDebounced = debounce(function (el, doFocus, animate, domRect) {
    focusScrollRaw(el, doFocus, animate, domRect);
}, 100);
var handleFocusInDebounced = debounce(function (target, tabKeyDownEvent) {
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
    (0, readium_css_1.readiumCSS)(win.document, payload);
    (0, highlight_1.recreateAllHighlights)(win);
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
        debug(".hashElement = 4");
        win.READIUM2.hashElement = win.document.getElementById(win.location.hash.substr(1));
        if (win.READIUM2.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                win.READIUM2.hashElement.setAttribute(styles_1.readPosCssStylesAttr1, "DOMContentLoaded hashElement");
            }
        }
    }
    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.ttsClickEnabled = false;
    win.READIUM2.ttsSkippabilityEnabled = false;
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
        (0, audiobook_1.setupAudioBook)(_docTitle, undefined);
    }
    if (readiumcssJson) {
        win.READIUM2.isFixedLayout = (typeof readiumcssJson.isFixedLayout !== "undefined") ?
            readiumcssJson.isFixedLayout : false;
    }
    if (!win.READIUM2.isFixedLayout && !win.READIUM2.isAudio) {
        var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
        if (!scrollElement.classList.contains(styles_1.ZERO_TRANSFORM_CLASS)) {
            scrollElement.classList.add(styles_1.ZERO_TRANSFORM_CLASS);
        }
    }
    var w = (readiumcssJson && readiumcssJson.fixedLayoutWebViewWidth) || win.innerWidth;
    var h = (readiumcssJson && readiumcssJson.fixedLayoutWebViewHeight) || win.innerHeight;
    win.READIUM2.fxlZoomPercent = (readiumcssJson && readiumcssJson.fixedLayoutZoomPercent) || 0;
    var wh = (0, readium_css_inject_1.configureFixedLayout)(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, w, h, win.READIUM2.webViewSlot, win.READIUM2.fxlZoomPercent);
    if (wh) {
        win.READIUM2.fxlViewportWidth = wh.width;
        win.READIUM2.fxlViewportHeight = wh.height;
        win.READIUM2.fxlViewportScale = wh.scale;
        var payload = {
            fxl: wh,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_FXL_CONFIGURE, payload);
    }
    else {
        var payload = {
            fxl: null,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_FXL_CONFIGURE, payload);
    }
    var alreadedInjected = win.document.documentElement.hasAttribute("data-readiumcss-injected");
    if (alreadedInjected) {
        debug(">>>>> ReadiumCSS already injected by streamer");
    }
    (0, readium_css_1.computeVerticalRTL)();
    if (readiumcssJson) {
        if ((0, readium_css_1.isVerticalWritingMode)() ||
            !alreadedInjected) {
            debug(">>>>>> ReadiumCSS inject again");
            (0, readium_css_1.readiumCSS)(win.document, readiumcssJson);
        }
    }
    if (!win.READIUM2.isFixedLayout) {
        if (!alreadedInjected) {
            (0, readium_css_inject_1.injectDefaultCSS)(win.document);
            if (IS_DEV) {
                (0, readium_css_inject_1.injectReadPosCSS)(win.document);
            }
        }
        if (alreadedInjected) {
            (0, readium_css_1.checkHiddenFootNotes)(win.document);
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
        if (!epubType) {
            epubType = audio.getAttribute("role");
        }
    }
    if (!epubType) {
        return;
    }
    epubType = epubType.trim().replace(/\s\s+/g, " ");
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
    debug("AUDIO SOUNDTRACK: ".concat(src, " ---> ").concat(audio.src));
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
        locationHashOverrideInfo: win.READIUM2.locationHashOverrideInfo,
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
    if (win.document.documentElement.classList.contains(styles_1.R2_MO_CLASS_PLAYING)) {
        debug("onScrollRaw Media OVerlays PLAYING/PAUSED ... skip");
        return;
    }
    if (!win.READIUM2.ttsClickEnabled &&
        !win.document.documentElement.classList.contains(styles_1.TTS_CLASS_PLAYING) &&
        !win.document.documentElement.classList.contains(styles_1.TTS_CLASS_PAUSED)) {
        var el = win.READIUM2.locationHashOverride;
        if (el && isVisible(el, undefined)) {
            debug("onScrollRaw VISIBLE SKIP");
            return;
        }
    }
    var x = ((0, readium_css_1.isRTL)() ? win.document.documentElement.offsetWidth - 1 : 0);
    processXYRaw(x, 0, false);
};
var onScrollDebounced = debounce(function () {
    onScrollRaw();
}, 300);
var _loaded = false;
function loaded(forced) {
    var _this = this;
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
                var focusLink_1 = win.document.createElement("a");
                focusLink_1.setAttribute("id", styles_1.SKIP_LINK_ID);
                focusLink_1.appendChild(win.document.createTextNode(" "));
                focusLink_1.setAttribute("title", INJECTED_LINK_TXT);
                focusLink_1.setAttribute("aria-label", INJECTED_LINK_TXT);
                focusLink_1.setAttribute("href", "javascript:;");
                focusLink_1.setAttribute("tabindex", "0");
                win.document.body.insertAdjacentElement("afterbegin", focusLink_1);
                setTimeout(function () {
                    focusLink_1.addEventListener("click", function (ev) {
                        ev.preventDefault();
                        if (IS_DEV) {
                            debug(">>>> focus link click: ");
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
            else {
                ev.preventDefault();
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
        if ((0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
            return;
        }
        if (ev.target) {
            var ignoreIncomingMouseClickOnFocusable = false;
            if (win.document && win.document.documentElement) {
                var low = ev.target.tagName.toLowerCase();
                if (low === "body") {
                    ignoreIncomingMouseClickOnFocusable = true;
                }
                else if (!win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_KEYBOARD_INTERACT)) {
                    if (low === "a" &&
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
            var resizeObserver = new win.ResizeObserver(function (_entries) {
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
    win.document.addEventListener("auxclick", function (ev) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            debug("AUX __CLICK: ".concat(ev.button, " (SKIP middle)"));
            if (ev.button === 1) {
                ev.preventDefault();
                ev.stopPropagation();
            }
            return [2];
        });
    }); }, true);
    win.document.addEventListener("click", function (ev) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var x, y, domPointData, linkElement, imageElement, href_src, href_src_image_nested_in_link, isSVG, globalSVGDefs, currentElement, _loop_1, state_1, has, destUrl, hrefStr, payload, done, payload_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("!AUX __CLICK: ".concat(ev.button, " ..."));
                    if (win.document.documentElement.classList.contains(styles_1.R2_MO_CLASS_PAUSED) || win.document.documentElement.classList.contains(styles_1.R2_MO_CLASS_PLAYING)) {
                        debug("!AUX __CLICK skip because MO playing/paused");
                        ev.preventDefault();
                        ev.stopPropagation();
                        return [2];
                    }
                    if (!(0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
                        x = ev.clientX;
                        y = ev.clientY;
                        domPointData = domDataFromPoint(x, y);
                        if (domPointData.element && win.READIUM2.ttsClickEnabled) {
                            debug("!AUX __CLICK domPointData.element && win.READIUM2.ttsClickEnabled");
                            ev.preventDefault();
                            ev.stopPropagation();
                            if (ev.altKey) {
                                (0, readaloud_1.ttsPlay)(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice, focusScrollRaw, domPointData.element, undefined, undefined, -1, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                                return [2];
                            }
                            (0, readaloud_1.ttsPlay)(win.READIUM2.ttsPlaybackRate, win.READIUM2.ttsVoice, focusScrollRaw, domPointData.element.ownerDocument.body, domPointData.element, domPointData.textNode, domPointData.textNodeOffset, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                            return [2];
                        }
                    }
                    if (win.READIUM2.ttsClickEnabled || win.document.documentElement.classList.contains(styles_1.TTS_CLASS_PAUSED) || win.document.documentElement.classList.contains(styles_1.TTS_CLASS_PLAYING)) {
                        debug("!AUX __CLICK skip because TTS playing/paused");
                        ev.preventDefault();
                        return [2];
                    }
                    isSVG = false;
                    currentElement = ev.target;
                    _loop_1 = function () {
                        var e_1, _b;
                        var tagName = currentElement.tagName.toLowerCase();
                        if ((tagName === "img" || tagName === "image" || tagName === "svg")
                            && !currentElement.classList.contains(styles_1.POPOUTIMAGE_CONTAINER_ID)) {
                            isSVG = false;
                            if (tagName === "svg") {
                                if (imageElement) {
                                    currentElement = currentElement.parentNode;
                                    return "continue";
                                }
                                isSVG = true;
                                href_src = currentElement.outerHTML;
                                var defs_1 = currentElement.querySelectorAll("defs > *[id]");
                                debug("SVG INNER defs: ", defs_1.length);
                                var uses = currentElement.querySelectorAll("use");
                                debug("SVG INNER uses: ", uses.length);
                                var useIDs_2 = [];
                                uses.forEach(function (useElem) {
                                    var href = useElem.getAttribute("href") || useElem.getAttributeNS("http://www.w3.org/1999/xlink", "href");
                                    if (href === null || href === void 0 ? void 0 : href.startsWith("#")) {
                                        var id = href.substring(1);
                                        var found = false;
                                        for (var i = 0; i < defs_1.length; i++) {
                                            var defElem = defs_1[i];
                                            if (defElem.getAttribute("id") === id) {
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (!found) {
                                            debug("SVG INNER use (need inject def): ", id);
                                            useIDs_2.push(id);
                                        }
                                        else {
                                            debug("SVG INNER use (already has def): ", id);
                                        }
                                    }
                                });
                                var defsToInject_1 = "";
                                var _loop_2 = function (useID) {
                                    if (!globalSVGDefs) {
                                        globalSVGDefs = win.document.querySelectorAll("defs > *[id]");
                                    }
                                    debug("SVG GLOBAL defs: ", globalSVGDefs.length);
                                    var found = false;
                                    globalSVGDefs.forEach(function (globalSVGDef) {
                                        if (globalSVGDef.getAttribute("id") === useID) {
                                            found = true;
                                            var outer = globalSVGDef.outerHTML;
                                            if (outer.includes("<use")) {
                                                debug("!!!!!! SVG WARNING use inside def: " + outer);
                                            }
                                            defsToInject_1 += outer;
                                        }
                                    });
                                    if (found) {
                                        debug("SVG GLOBAL def for INNER use id: ", useID);
                                    }
                                    else {
                                        debug("no SVG GLOBAL def for INNER use id!! ", useID);
                                    }
                                };
                                try {
                                    for (var useIDs_1 = (e_1 = void 0, tslib_1.__values(useIDs_2)), useIDs_1_1 = useIDs_1.next(); !useIDs_1_1.done; useIDs_1_1 = useIDs_1.next()) {
                                        var useID = useIDs_1_1.value;
                                        _loop_2(useID);
                                    }
                                }
                                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                finally {
                                    try {
                                        if (useIDs_1_1 && !useIDs_1_1.done && (_b = useIDs_1.return)) _b.call(useIDs_1);
                                    }
                                    finally { if (e_1) throw e_1.error; }
                                }
                                if (href_src.indexOf("<defs") >= 0) {
                                    href_src = href_src.replace(/<\/defs>/, "".concat(defsToInject_1, " </defs>"));
                                }
                                else {
                                    href_src = href_src.replace(/>/, "> <defs> ".concat(defsToInject_1, " </defs>"));
                                }
                                href_src = href_src.replace(/:href[\s]*=(["|'])(.+?)(["|'])/g, function (match) {
                                    var args = [];
                                    for (var _i = 1; _i < arguments.length; _i++) {
                                        args[_i - 1] = arguments[_i];
                                    }
                                    var l = args[1].trim();
                                    var ret = l.startsWith("#") || l.startsWith("/") || l.startsWith("data:") || /https?:/.test(l) ? match :
                                        ":href=".concat(args[0]).concat(new URL(l, win.location.origin + win.location.pathname)).concat(args[2]);
                                    debug("SVG URL REPLACE: ", match, ret);
                                    return ret;
                                });
                                href_src = href_src.replace(/url[\s]*\((.+?)\)/g, function (match) {
                                    var args = [];
                                    for (var _i = 1; _i < arguments.length; _i++) {
                                        args[_i - 1] = arguments[_i];
                                    }
                                    var l = args[0].trim();
                                    var ret = l.startsWith("#") || l.startsWith("/") || l.startsWith("data:") || /https?:/.test(l) ? match :
                                        "url(".concat(new URL(l, win.location.origin + win.location.pathname), ")");
                                    debug("SVG URL REPLACE: ", match, ret);
                                    return ret;
                                });
                                href_src = href_src.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
                                href_src = href_src.replace(/<desc[^<]+<\/desc>/g, "");
                                debug("SVG CLICK: ".concat(href_src));
                            }
                            else {
                                href_src = currentElement.src;
                                var href_src_ = currentElement.getAttribute("src");
                                if (!href_src) {
                                    href_src = currentElement.href;
                                    href_src_ = currentElement.getAttribute("href") || currentElement.getAttributeNS("http://www.w3.org/1999/xlink", "href");
                                }
                                debug("IMG CLICK: ".concat(href_src, " (").concat(href_src_, ")"));
                            }
                            imageElement = currentElement;
                        }
                        else if (tagName === "a") {
                            if (href_src) {
                                href_src_image_nested_in_link = href_src;
                            }
                            href_src = currentElement.href;
                            var href_ = currentElement.getAttribute("href") || currentElement.getAttributeNS("http://www.w3.org/1999/xlink", "href");
                            linkElement = currentElement;
                            debug("A LINK CLICK: ".concat(href_src, " (").concat(href_, ")"));
                            return "break";
                        }
                        currentElement = currentElement.parentNode;
                    };
                    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
                        state_1 = _loop_1();
                        if (state_1 === "break")
                            break;
                    }
                    currentElement = undefined;
                    if (!href_src || (!imageElement && !linkElement)) {
                        (0, readium_css_1.clearImageZoomOutline)();
                        return [2];
                    }
                    if (href_src_image_nested_in_link && href_src_image_nested_in_link.animVal) {
                        href_src_image_nested_in_link = href_src_image_nested_in_link.animVal;
                        if (!href_src_image_nested_in_link) {
                            (0, readium_css_1.clearImageZoomOutline)();
                            return [2];
                        }
                    }
                    if (href_src.animVal) {
                        href_src = href_src.animVal;
                        if (!href_src) {
                            (0, readium_css_1.clearImageZoomOutline)();
                            return [2];
                        }
                    }
                    if (typeof href_src !== "string") {
                        (0, readium_css_1.clearImageZoomOutline)();
                        return [2];
                    }
                    if (href_src_image_nested_in_link && typeof href_src_image_nested_in_link !== "string") {
                        (0, readium_css_1.clearImageZoomOutline)();
                        return [2];
                    }
                    debug("HREF SRC: ".concat(href_src, " ").concat(href_src_image_nested_in_link, " (").concat(win.location.href, ")"));
                    has = imageElement === null || imageElement === void 0 ? void 0 : imageElement.hasAttribute("data-".concat(styles_1.POPOUTIMAGE_CONTAINER_ID));
                    if (imageElement && href_src && (has ||
                        ((!linkElement && !win.READIUM2.isFixedLayout && !isSVG) || ev.shiftKey))) {
                        if (linkElement && href_src_image_nested_in_link) {
                            href_src = href_src_image_nested_in_link;
                        }
                        (0, readium_css_1.clearImageZoomOutline)();
                        ev.preventDefault();
                        ev.stopPropagation();
                        if (has) {
                            if (!isSVG &&
                                !/^(https?|thoriumhttps):\/\//.test(href_src) &&
                                !href_src.startsWith((sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {
                                destUrl = new URL(href_src, win.location.origin + win.location.pathname);
                                href_src = destUrl.toString();
                                debug("IMG CLICK ABSOLUTE-ized: ".concat(href_src));
                            }
                            (0, popoutImages_1.popoutImage)(win, imageElement, href_src, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                        }
                        else {
                            imageElement.setAttribute("data-".concat(styles_1.POPOUTIMAGE_CONTAINER_ID), "1");
                        }
                        return [2];
                    }
                    if (!linkElement || !href_src) {
                        (0, readium_css_1.clearImageZoomOutline)();
                        return [2];
                    }
                    hrefStr = href_src;
                    if (/^javascript:/.test(hrefStr)) {
                        (0, readium_css_1.clearImageZoomOutline)();
                        return [2];
                    }
                    (0, readium_css_1.clearImageZoomOutline)();
                    ev.preventDefault();
                    ev.stopPropagation();
                    payload = {
                        url: "#" + cssselector2_3_1.FRAG_ID_CSS_SELECTOR + (0, UrlUtils_1.encodeURIComponent_RFC3986)(getCssSelector(linkElement)),
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
                    return [4, (0, popupFootNotes_1.popupFootNote)(linkElement, focusScrollRaw, hrefStr, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable)];
                case 1:
                    done = _a.sent();
                    if (!done) {
                        focusScrollDebounced.clear();
                        processXYDebouncedImmediate.clear();
                        notifyReadingLocationDebounced.clear();
                        notifyReadingLocationDebouncedImmediate.clear();
                        scrollToHashDebounced.clear();
                        onScrollDebounced.clear();
                        onResizeDebounced.clear();
                        handleFocusInDebounced.clear();
                        payload_1 = {
                            url: hrefStr,
                        };
                        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload_1);
                    }
                    return [2];
            }
        });
    }); }, true);
    electron_1.ipcRenderer.on("R2_EVENT_WINDOW_RESIZE", function (_event, zoomPercent) {
        debug("R2_EVENT_WINDOW_RESIZE zoomPercent " + zoomPercent);
        win.READIUM2.fxlZoomPercent = zoomPercent;
        if (!win.READIUM2.isFixedLayout) {
            debug("R2_EVENT_WINDOW_RESIZE skipped, !FXL");
            return;
        }
        var wh = (0, readium_css_inject_1.configureFixedLayout)(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight, win.READIUM2.webViewSlot, win.READIUM2.fxlZoomPercent);
        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
            win.READIUM2.fxlViewportScale = wh.scale;
            var payload = {
                fxl: wh,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_FXL_CONFIGURE, payload);
        }
        else {
            var payload = {
                fxl: null,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_FXL_CONFIGURE, payload);
        }
    });
    var onResizeRaw = function () {
        if (win.READIUM2.isFixedLayout) {
            debug("scrollToHashRaw skipped, FXL");
            return;
        }
        debug("++++ scrollToHashDebounced FROM RESIZE");
        scrollToHashDebounced(false);
    };
    var onResizeDebounced = debounce(function () {
        onResizeRaw();
    }, 200);
    var _firstWindowResize = true;
    win.addEventListener("resize", function () {
        if (_firstWindowResize) {
            debug("Window resize (WEBVIEW), SKIP FIRST");
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
        var isPaged = (0, readium_css_inject_1.isPaginated)(documant);
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
        var scrollElement = (0, readium_css_1.getScrollingElement)(documant);
        var vwm = (0, readium_css_1.isVerticalWritingMode)();
        var goPREVIOUS = ev.deltaY < 0;
        if (!goPREVIOUS) {
            var maxScrollShift = (0, readium_css_1.calculateMaxScrollShift)().maxScrollShift;
            var maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;
            if (isPaged) {
                var unit = vwm ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollElementOffset = Math.round(vwm ?
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
                if (vwm && (scrollElementOffsetAbs >= maxScrollShiftTolerated) ||
                    !vwm && (scrollElementOffsetAbs >= maxScrollShiftTolerated)) {
                    var payload = {
                        go: "NEXT",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
            else {
                if (vwm && (Math.abs(scrollElement.scrollLeft) >= maxScrollShiftTolerated) ||
                    !vwm && (Math.abs(scrollElement.scrollTop) >= maxScrollShiftTolerated)) {
                    var payload = {
                        go: "NEXT",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
        }
        else if (goPREVIOUS) {
            if (isPaged) {
                var unit = vwm ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollElementOffset = Math.round(vwm ?
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
                if (vwm && (scrollElementOffsetAbs <= 0) ||
                    !vwm && (scrollElementOffsetAbs <= 0)) {
                    var payload = {
                        go: "PREVIOUS",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
            else {
                if (vwm && (Math.abs(scrollElement.scrollLeft) <= 0) ||
                    !vwm && (Math.abs(scrollElement.scrollTop) <= 0)) {
                    var payload = {
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
        if ((0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
            return;
        }
        if (win.document.activeElement &&
            win.document.activeElement === win.document.getElementById(styles_1.SKIP_LINK_ID)) {
            debug(".hashElement = 5 => SKIP_LINK_ID mouse click event - screen reader VoiceOver generates mouse click / non-keyboard event");
            return;
        }
        var x = ev.clientX;
        var y = ev.clientY;
        processXYDebouncedImmediate(x, y, false, true);
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
    var e_2, _a, e_3, _b, e_4, _c, e_5, _d;
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
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_blacklistIdClassForCFI_1_1 && !_blacklistIdClassForCFI_1_1.done && (_a = _blacklistIdClassForCFI_1.return)) _a.call(_blacklistIdClassForCFI_1);
        }
        finally { if (e_2) throw e_2.error; }
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
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_blacklistIdClassForCFIMathJax_1_1 && !_blacklistIdClassForCFIMathJax_1_1.done && (_b = _blacklistIdClassForCFIMathJax_1.return)) _b.call(_blacklistIdClassForCFIMathJax_1);
            }
            finally { if (e_3) throw e_3.error; }
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
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCFIMathJax_2_1 && !_blacklistIdClassForCFIMathJax_2_1.done && (_c = _blacklistIdClassForCFIMathJax_2.return)) _c.call(_blacklistIdClassForCFIMathJax_2);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        for (var i = 0; i < el.classList.length; i++) {
            var cl = el.classList[i];
            var lowCl = cl.toLowerCase();
            try {
                for (var _blacklistIdClassForCFIMathJax_3 = (e_5 = void 0, tslib_1.__values(_blacklistIdClassForCFIMathJax)), _blacklistIdClassForCFIMathJax_3_1 = _blacklistIdClassForCFIMathJax_3.next(); !_blacklistIdClassForCFIMathJax_3_1.done; _blacklistIdClassForCFIMathJax_3_1 = _blacklistIdClassForCFIMathJax_3.next()) {
                    var item = _blacklistIdClassForCFIMathJax_3_1.value;
                    if (lowCl.startsWith(item)) {
                        if (IS_DEV) {
                            debug("checkBlacklisted MathJax CLASS: " + cl);
                        }
                        return true;
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCFIMathJax_3_1 && !_blacklistIdClassForCFIMathJax_3_1.done && (_d = _blacklistIdClassForCFIMathJax_3.return)) _d.call(_blacklistIdClassForCFIMathJax_3);
                }
                finally { if (e_5) throw e_5.error; }
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
        if (isVisible(rootElement, undefined)) {
            return rootElement;
        }
    }
    return undefined;
}
var domDataFromPoint = function (x, y) {
    var _a;
    var domPointData = {
        textNode: undefined,
        textNodeOffset: -1,
        element: undefined,
    };
    var range = win.document.caretRangeFromPoint(x, y);
    if (range) {
        var node = range.startContainer;
        if (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                domPointData.element = node;
                var childrenCount = (_a = domPointData.element.childNodes) === null || _a === void 0 ? void 0 : _a.length;
                if (childrenCount > 0 &&
                    range.startOffset > 0 &&
                    range.startOffset === range.endOffset &&
                    range.startOffset < childrenCount) {
                    var c = domPointData.element.childNodes[range.startOffset];
                    if (c.nodeType === Node.ELEMENT_NODE) {
                        domPointData.element = c;
                    }
                    else if (c.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
                        c = domPointData.element.childNodes[range.startOffset - 1];
                        if (c.nodeType === Node.ELEMENT_NODE) {
                            domPointData.element = c;
                        }
                    }
                }
            }
            else if (node.nodeType === Node.TEXT_NODE) {
                domPointData.textNode = node;
                domPointData.textNodeOffset = range.startOffset;
                if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                    domPointData.element = node.parentNode;
                }
            }
        }
    }
    return domPointData;
};
var processXYRaw = function (x, y, reverse, userInteract) {
    debug("processXYRaw ENTRY");
    if ((0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
        debug("processXYRaw isPopupDialogOpen SKIP");
        return;
    }
    var domPointData = domDataFromPoint(x, y);
    if (!domPointData.element ||
        domPointData.element === win.document.body ||
        domPointData.element === win.document.documentElement) {
        var root = win.document.body;
        domPointData.element = findFirstVisibleElement(root);
        if (!domPointData.element) {
            debug("|||||||||||||| cannot find visible element inside BODY / HTML????");
            domPointData.element = win.document.body;
        }
    }
    else if (!userInteract &&
        domPointData.element && !isVisible(domPointData.element, undefined)) {
        var next = domPointData.element;
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
            domPointData.element = found;
        }
        else {
            debug("|||||||||||||| cannot find visible element after current????");
        }
    }
    if (domPointData.element === win.document.body ||
        domPointData.element === win.document.documentElement) {
        debug("|||||||||||||| BODY/HTML selected????");
    }
    if (domPointData.element) {
        if (userInteract ||
            !win.READIUM2.locationHashOverride ||
            win.READIUM2.locationHashOverride === win.document.body ||
            win.READIUM2.locationHashOverride === win.document.documentElement) {
            debug(".hashElement = 5 ", userInteract);
            win.READIUM2.hashElement = userInteract ? domPointData.element : win.READIUM2.hashElement;
            win.READIUM2.locationHashOverride = domPointData.element;
        }
        else {
            if (!isVisible(win.READIUM2.locationHashOverride, undefined)) {
                debug(".hashElement = 6");
                win.READIUM2.hashElement = userInteract ? domPointData.element : win.READIUM2.hashElement;
                win.READIUM2.locationHashOverride = domPointData.element;
            }
            else if (win.READIUM2.hashElement !== win.READIUM2.locationHashOverride &&
                (win.READIUM2.ttsClickEnabled ||
                    win.document.documentElement.classList.contains(styles_1.TTS_CLASS_PLAYING) ||
                    win.document.documentElement.classList.contains(styles_1.TTS_CLASS_PAUSED))) {
                debug(".hashElement = 8");
                win.READIUM2.hashElement = userInteract ? domPointData.element : win.READIUM2.hashElement;
                win.READIUM2.locationHashOverride = domPointData.element;
            }
        }
        if (userInteract && win.READIUM2.DEBUG_VISUALS) {
            notifyReadingLocationDebouncedImmediate(userInteract);
        }
        else {
            notifyReadingLocationDebounced(userInteract);
        }
        if (win.READIUM2.DEBUG_VISUALS) {
            var el = win.READIUM2.locationHashOverride ? win.READIUM2.locationHashOverride : domPointData.element;
            var existings = win.document.querySelectorAll("*[".concat(styles_1.readPosCssStylesAttr2, "]"));
            existings.forEach(function (existing) {
                existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr2));
            });
            el.setAttribute(styles_1.readPosCssStylesAttr2, "processXYRaw");
        }
    }
    debug("processXYRaw EXIT");
};
var processXYDebouncedImmediate = debounce(function (x, y, reverse, userInteract) {
    processXYRaw(x, y, reverse, userInteract);
}, 300, { immediate: true });
var computeProgressionData = function () {
    var e_6, _a;
    var isPaged = (0, readium_css_inject_1.isPaginated)(win.document);
    var isTwoPage = (0, readium_css_1.isTwoPageSpread)();
    var _b = (0, readium_css_1.calculateMaxScrollShift)(), maxScrollShift = _b.maxScrollShift, maxScrollShiftAdjusted = _b.maxScrollShiftAdjusted;
    var totalColumns = (0, readium_css_1.calculateTotalColumns)();
    var progressionRatio = 0;
    var currentColumn = 0;
    var scrollElement = (0, readium_css_1.getScrollingElement)(win.document);
    var vwm = (0, readium_css_1.isVerticalWritingMode)();
    var extraShift = 0;
    if (isPaged) {
        if (maxScrollShift > 0) {
            if (vwm) {
                progressionRatio = scrollElement.scrollTop / maxScrollShift;
            }
            else {
                extraShift = scrollElement.scrollLeftExtra;
                if (extraShift) {
                    progressionRatio = ((((0, readium_css_1.isRTL)() ? -1 : 1) * scrollElement.scrollLeft) + extraShift) /
                        maxScrollShiftAdjusted;
                }
                else {
                    progressionRatio = (((0, readium_css_1.isRTL)() ? -1 : 1) * scrollElement.scrollLeft) / maxScrollShift;
                }
            }
        }
        var adjustedTotalColumns = (extraShift ? (totalColumns + 1) : totalColumns) - (isTwoPage ? 2 : 1);
        currentColumn = adjustedTotalColumns * progressionRatio;
        currentColumn = Math.round(currentColumn);
    }
    else {
        if (maxScrollShift > 0) {
            if (vwm) {
                progressionRatio = Math.abs(scrollElement.scrollLeft) / maxScrollShift;
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
            if (isVisible(element, undefined)) {
                var curCol = extraShift ? (currentColumn - 1) : currentColumn;
                var columnDimension = (0, readium_css_1.calculateColumnDimension)();
                if (vwm) {
                    var rect = element.getBoundingClientRect();
                    offset = (curCol * scrollElement.scrollWidth) + rect.left +
                        (rect.top >= columnDimension ? scrollElement.scrollWidth : 0);
                }
                else {
                    var boundingRect = element.getBoundingClientRect();
                    var clientRects = (0, rect_utils_1.getClientRectsNoOverlap_)(element.getClientRects(), false);
                    var rectangle = void 0;
                    try {
                        for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
                            var rect = clientRects_1_1.value;
                            if (!rectangle) {
                                rectangle = rect;
                                continue;
                            }
                            if ((0, readium_css_1.isRTL)()) {
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
                    catch (e_6_1) { e_6 = { error: e_6_1 }; }
                    finally {
                        try {
                            if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
                        }
                        finally { if (e_6) throw e_6.error; }
                    }
                    if (!rectangle) {
                        rectangle = element.getBoundingClientRect();
                    }
                    offset = (curCol * scrollElement.scrollHeight) + rectangle.top;
                    if (isTwoPage) {
                        if ((0, readium_css_1.isRTL)()) {
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
                var totalDocumentDimension = ((vwm ? scrollElement.scrollWidth :
                    scrollElement.scrollHeight) * totalColumns);
                progressionRatio = offset / totalDocumentDimension;
                currentColumn = totalColumns * progressionRatio;
                currentColumn = Math.floor(currentColumn);
            }
        }
        else {
            var rect = element.getBoundingClientRect();
            if (vwm) {
                offset = scrollElement.scrollLeft + rect.left;
            }
            else {
                offset = scrollElement.scrollTop + rect.top;
            }
            progressionRatio =
                (vwm ? Math.abs(offset - win.document.documentElement.clientWidth) : offset)
                    /
                        (vwm ? scrollElement.scrollWidth : scrollElement.scrollHeight);
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
var _blacklistIdClassForCssSelectors = [styles_1.LINK_TARGET_CLASS, styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, styles_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN, styles_1.TTS_ID_SPEAKING_DOC_ELEMENT, styles_1.ROOT_CLASS_KEYBOARD_INTERACT, styles_1.ROOT_CLASS_INVISIBLE_MASK, styles_1.ROOT_CLASS_INVISIBLE_MASK_REMOVED, styles_1.CLASS_PAGINATED, styles_1.ROOT_CLASS_NO_FOOTNOTES];
var _blacklistIdClassForCssSelectorsMathJax = ["mathjax", "ctxt", "mjx"];
var _blacklistIdClassForCFI = [styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, styles_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN];
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
        var e_7, _a;
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
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCssSelectorsMathJax_1_1 && !_blacklistIdClassForCssSelectorsMathJax_1_1.done && (_a = _blacklistIdClassForCssSelectorsMathJax_1.return)) _a.call(_blacklistIdClassForCssSelectorsMathJax_1);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
        return true;
    },
    idName: function (str) {
        var e_8, _a;
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
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCssSelectorsMathJax_2_1 && !_blacklistIdClassForCssSelectorsMathJax_2_1.done && (_a = _blacklistIdClassForCssSelectorsMathJax_2.return)) _a.call(_blacklistIdClassForCssSelectorsMathJax_2);
                }
                finally { if (e_8) throw e_8.error; }
            }
        }
        return true;
    },
    tagName: function (str) {
        var e_9, _a;
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
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_blacklistIdClassForCssSelectorsMathJax_3_1 && !_blacklistIdClassForCssSelectorsMathJax_3_1.done && (_a = _blacklistIdClassForCssSelectorsMathJax_3.return)) _a.call(_blacklistIdClassForCssSelectorsMathJax_3);
                }
                finally { if (e_9) throw e_9.error; }
            }
        }
        return true;
    },
};
function getCssSelector(element) {
    try {
        return (0, cssselector2_3_1.uniqueCssSelector)(element, win.document, _getCssSelectorOptions);
    }
    catch (err) {
        debug("uniqueCssSelector:");
        debug(err);
        return "";
    }
}
var _htmlNamespaces = {
    epub: "http://www.idpf.org/2007/ops",
    xhtml: "http://www.w3.org/1999/xhtml",
};
var _namespaceResolver = function (prefix) {
    if (!prefix) {
        return null;
    }
    return _htmlNamespaces[prefix] || null;
};
var _allHeadings;
var findPrecedingAncestorSiblingHeadings = function (element) {
    var e_10, _a;
    if (!_allHeadings) {
        var headingElements = Array.from(win.document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
        try {
            for (var headingElements_1 = tslib_1.__values(headingElements), headingElements_1_1 = headingElements_1.next(); !headingElements_1_1.done; headingElements_1_1 = headingElements_1.next()) {
                var n = headingElements_1_1.value;
                if (n) {
                    var el = n;
                    var t = el.textContent || el.getAttribute("title") || el.getAttribute("aria-label");
                    var i = el.getAttribute("id");
                    if (!i) {
                        var cur = el;
                        var p = void 0;
                        while ((p = cur.parentNode) &&
                            (p === null || p === void 0 ? void 0 : p.nodeType) === Node.ELEMENT_NODE) {
                            if (p.firstElementChild !== cur) {
                                break;
                            }
                            var di = p.getAttribute("id");
                            if (di) {
                                i = di;
                                break;
                            }
                            cur = p;
                        }
                    }
                    var heading = {
                        element: el,
                        id: i ? i : undefined,
                        level: parseInt(el.localName.substring(1), 10),
                        text: t ? t : undefined,
                    };
                    if (!_allHeadings) {
                        _allHeadings = [];
                    }
                    _allHeadings.push(heading);
                }
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (headingElements_1_1 && !headingElements_1_1.done && (_a = headingElements_1.return)) _a.call(headingElements_1);
            }
            finally { if (e_10) throw e_10.error; }
        }
        if (!_allHeadings) {
            _allHeadings = [];
        }
        debug("_allHeadings", _allHeadings.length, headingElements.length);
    }
    var arr;
    for (var i = _allHeadings.length - 1; i >= 0; i--) {
        var heading = _allHeadings[i];
        var c = element.compareDocumentPosition(heading.element);
        if (c === 0 || (c & Node.DOCUMENT_POSITION_PRECEDING) || (c & Node.DOCUMENT_POSITION_CONTAINS)) {
            debug("preceding or containing heading", heading.id, heading.text);
            if (!arr) {
                arr = [];
            }
            arr.push({
                id: heading.id,
                level: heading.level,
                txt: heading.text,
            });
        }
    }
    return arr;
};
var _allEpubPageBreaks;
var findPrecedingAncestorSiblingEpubPageBreak = function (element) {
    if (!_allEpubPageBreaks) {
        var xpathResult = win.document.evaluate("//*[contains(concat(' ', normalize-space(@role), ' '), ' doc-pagebreak ')] | //*[contains(concat(' ', normalize-space(@epub:type), ' '), ' pagebreak ')]", win.document.body, _namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0; i < xpathResult.snapshotLength; i++) {
            var n = xpathResult.snapshotItem(i);
            if (n) {
                var el = n;
                var elTitle = el.getAttribute("title");
                var elLabel = el.getAttribute("aria-label");
                var elText = el.textContent;
                var pageLabel = elTitle || elLabel || elText || " ";
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
        debug("_allEpubPageBreaks XPath", _allEpubPageBreaks.length, xpathResult.snapshotLength);
    }
    for (var i = _allEpubPageBreaks.length - 1; i >= 0; i--) {
        var pageBreak = _allEpubPageBreaks[i];
        var c = element.compareDocumentPosition(pageBreak.element);
        if (c === 0 || (c & Node.DOCUMENT_POSITION_PRECEDING) || (c & Node.DOCUMENT_POSITION_CONTAINS)) {
            debug("preceding or containing EPUB page break", pageBreak.text);
            return { epubPage: pageBreak.text, epubPageID: pageBreak.element.getAttribute("id") || undefined };
        }
    }
    var nil = { epubPage: undefined, epubPageID: undefined };
    if (_allEpubPageBreaks.length > 0) {
        var first = { epubPage: _allEpubPageBreaks[0].text, epubPageID: _allEpubPageBreaks[0].element.getAttribute("id") || undefined };
        if (win.document.body.firstChild === _allEpubPageBreaks[0].element) {
            debug("pagebreak first", first);
            return first;
        }
        var range = new Range();
        range.setStart(win.document.body, 0);
        range.setEnd(_allEpubPageBreaks[0].element, 0);
        var txt = range.toString() || "";
        if (txt) {
            txt = txt.trim();
        }
        var pass = txt.length <= 10;
        debug("pagebreak first? txt", first, txt.length, pass ? txt : "");
        return pass ? first : nil;
    }
    return nil;
};
var _elementsWithID;
var findFollowingDescendantSiblingElementsWithID = function (el) {
    var followingElementIDs;
    if (true) {
        followingElementIDs = [];
        if (!_elementsWithID) {
            _elementsWithID = Array.from(win.document.querySelectorAll("*[id]"));
        }
        for (var i = 0; i < _elementsWithID.length; i++) {
            var elementWithID = _elementsWithID[i];
            var id = elementWithID.id || elementWithID.getAttribute("id");
            if (!id) {
                continue;
            }
            var c = el.compareDocumentPosition(elementWithID);
            if ((c & Node.DOCUMENT_POSITION_FOLLOWING) || (c & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                followingElementIDs.push(id);
            }
        }
    }
    return followingElementIDs;
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
    var cfi = (0, exports.computeCFI)(win.READIUM2.locationHashOverride);
    var progression = 0;
    if (win.READIUM2.isFixedLayout) {
        progression = 1;
    }
    else {
        progressionData = (0, exports.computeProgressionData)();
        progression = progressionData.percentRatio;
    }
    var pinfo = (progressionData && progressionData.paginationInfo) ?
        progressionData.paginationInfo : undefined;
    var selInfo = (0, selection_2.getCurrentSelectionInfo)(win, getCssSelector, exports.computeCFI);
    if (selInfo) {
        cssSelector = selInfo.rangeInfo.startContainerElementCssSelector;
        cfi = selInfo.rangeInfo.startContainerElementCFI;
    }
    var text = selInfo ? {
        after: selInfo.cleanAfter,
        before: selInfo.cleanBefore,
        highlight: selInfo.cleanText,
        afterRaw: selInfo.rawAfter,
        beforeRaw: selInfo.rawBefore,
        highlightRaw: selInfo.rawText,
    } : undefined;
    var selectionIsNew;
    if (selInfo) {
        selectionIsNew =
            !win.READIUM2.locationHashOverrideInfo ||
                !win.READIUM2.locationHashOverrideInfo.selectionInfo ||
                !(0, selection_1.sameSelections)(win.READIUM2.locationHashOverrideInfo.selectionInfo, selInfo);
    }
    var _a = findPrecedingAncestorSiblingEpubPageBreak(win.READIUM2.locationHashOverride), epubPage = _a.epubPage, epubPageID = _a.epubPageID;
    var headings = findPrecedingAncestorSiblingHeadings(win.READIUM2.locationHashOverride);
    var followingElementIDs = findFollowingDescendantSiblingElementsWithID(win.READIUM2.locationHashOverride);
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
            isRightToLeft: (0, readium_css_1.isRTL)(),
            isVerticalWritingMode: (0, readium_css_1.isVerticalWritingMode)(),
        },
        epubPage: epubPage,
        epubPageID: epubPageID,
        headings: headings,
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
    if (followingElementIDs) {
        win.READIUM2.locationHashOverrideInfo.followingElementIDs = followingElementIDs;
    }
    var payload = win.READIUM2.locationHashOverrideInfo;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (!ignoreMediaOverlays) {
        mediaOverlaysClickRaw(win.READIUM2.locationHashOverride, userInteract ? true : false);
    }
    if (!win.document.documentElement.classList.contains(styles_1.R2_MO_CLASS_PLAYING)) {
        tempLinkTargetOutline(win.READIUM2.locationHashOverride, 1000, true);
    }
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[".concat(styles_1.readPosCssStylesAttr4, "]"));
        existings.forEach(function (existing) {
            existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr4));
        });
        win.READIUM2.locationHashOverride.setAttribute(styles_1.readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
var notifyReadingLocationDebounced = debounce(function (userInteract, ignoreMediaOverlays) {
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250);
var notifyReadingLocationDebouncedImmediate = debounce(function (userInteract, ignoreMediaOverlays) {
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250, { immediate: true });
if (!win.READIUM2.isAudio) {
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PLAY, function (_event, payload) {
        var rootElement = win.document.querySelector(payload.rootElement);
        var startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;
        (0, readaloud_1.ttsPlay)(payload.speed, payload.voice, focusScrollRaw, rootElement ? rootElement : undefined, startElement ? startElement : undefined, undefined, -1, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_STOP, function (_event) {
        (0, readaloud_1.ttsStop)();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PAUSE, function (_event) {
        (0, readaloud_1.ttsPause)();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_RESUME, function (_event) {
        (0, readaloud_1.ttsResume)();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_NEXT, function (_event, payload) {
        (0, readaloud_1.ttsNext)(payload === null || payload === void 0 ? void 0 : payload.skipSentences);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PREVIOUS, function (_event, payload) {
        (0, readaloud_1.ttsPrevious)(payload === null || payload === void 0 ? void 0 : payload.skipSentences);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_PLAYBACK_RATE, function (_event, payload) {
        (0, readaloud_1.ttsPlaybackRate)(payload.speed);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_VOICE, function (_event, payload) {
        (0, readaloud_1.ttsVoice)(payload.voice);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_SKIP_ENABLE, function (_event, payload) {
        win.READIUM2.ttsSkippabilityEnabled = payload.doEnable;
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
    electron_1.ipcRenderer.on(events_1.R2_EVENT_MEDIA_OVERLAY_STATE, function (_event, payload) {
        (0, readium_css_1.clearImageZoomOutlineDebounced)();
        win.document.documentElement.classList.remove(styles_1.R2_MO_CLASS_PAUSED, styles_1.R2_MO_CLASS_PLAYING, styles_1.R2_MO_CLASS_STOPPED);
        win.document.documentElement.classList.add(payload.state === events_1.MediaOverlaysStateEnum.PAUSED ? styles_1.R2_MO_CLASS_PAUSED :
            (payload.state === events_1.MediaOverlaysStateEnum.PLAYING ? styles_1.R2_MO_CLASS_PLAYING : styles_1.R2_MO_CLASS_STOPPED));
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, function (_event, payload) {
        var styleAttr = win.document.documentElement.getAttribute("style");
        var isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
        var isSepia = styleAttr ? styleAttr.indexOf("readium-sepia-on") > 0 : false;
        var activeClass = (isNight || isSepia) ? styles_1.R2_MO_CLASS_ACTIVE :
            (payload.classActive ? payload.classActive : styles_1.R2_MO_CLASS_ACTIVE);
        var activeClassPlayback = payload.classActivePlayback ? payload.classActivePlayback : styles_1.R2_MO_CLASS_ACTIVE_PLAYBACK;
        if (payload.classActive) {
            var activeMoElements = win.document.body.querySelectorAll(".".concat(payload.classActive));
            activeMoElements.forEach(function (elem) {
                if (payload.classActive) {
                    elem.classList.remove(payload.classActive);
                }
            });
        }
        var activeMoElements_ = win.document.body.querySelectorAll(".".concat(styles_1.R2_MO_CLASS_ACTIVE));
        activeMoElements_.forEach(function (elem) {
            elem.classList.remove(styles_1.R2_MO_CLASS_ACTIVE);
        });
        var removeCaptionContainer = true;
        if (!payload.id) {
            win.document.documentElement.classList.remove(styles_1.R2_MO_CLASS_ACTIVE_PLAYBACK, activeClassPlayback);
        }
        else {
            win.document.documentElement.classList.add(activeClassPlayback);
            var targetEl = win.document.getElementById(payload.id);
            if (targetEl) {
                targetEl.classList.add(activeClass);
                if (payload.captionsMode) {
                    var text = targetEl.textContent;
                    if (text) {
                        text = (0, dom_text_utils_1.normalizeText)(text).trim();
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
                                containerStyle = "background-color: ".concat(rsBackground, "; color: ").concat(rsColor, ";");
                            }
                            else {
                                if (isUserBackground || isUserColor) {
                                    containerStyle = "";
                                }
                                if (isUserBackground) {
                                    var usrBackground = docStyle.getPropertyValue("--USER__backgroundColor");
                                    containerStyle += "background-color: ".concat(usrBackground, ";");
                                }
                                if (isUserColor) {
                                    var usrColor = docStyle.getPropertyValue("--USER__textColor");
                                    containerStyle += "color: ".concat(usrColor, ";");
                                }
                            }
                            var isUserFontSize = styleAttr ?
                                styleAttr.indexOf("--USER__fontSize") >= 0 : false;
                            if (isUserFontSize) {
                                var usrFontSize = docStyle.getPropertyValue("--USER__fontSize");
                                containerStyle += "font-size: ".concat(usrFontSize, ";");
                            }
                            else {
                                containerStyle += "font-size: 120%;";
                            }
                            var isUserLineHeight = styleAttr ?
                                styleAttr.indexOf("--USER__lineHeight") >= 0 : false;
                            if (isUserLineHeight) {
                                var usrLineHeight = docStyle.getPropertyValue("--USER__lineHeight");
                                containerStyle += "line-height: ".concat(usrLineHeight, ";");
                            }
                            else {
                                containerStyle += "line-height: 1.2;";
                            }
                            var isUserFont = styleAttr ?
                                styleAttr.indexOf("--USER__fontFamily") >= 0 : false;
                            if (isUserFont) {
                                var usrFont = docStyle.getPropertyValue("--USER__fontFamily");
                                containerStyle += "font-family: ".concat(usrFont, ";");
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
                debug(".hashElement = 7");
                win.READIUM2.hashElement = targetEl;
                win.READIUM2.locationHashOverride = targetEl;
                if (!isVisible(targetEl, undefined)) {
                    scrollElementIntoView(targetEl, false, true, undefined);
                }
                scrollToHashDebounced.clear();
                notifyReadingLocationRaw(false, true);
                if (win.READIUM2.DEBUG_VISUALS) {
                    var el = win.READIUM2.locationHashOverride;
                    var existings = win.document.querySelectorAll("*[".concat(styles_1.readPosCssStylesAttr2, "]"));
                    existings.forEach(function (existing) {
                        existing.removeAttribute("".concat(styles_1.readPosCssStylesAttr2));
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
        var e_11, _a;
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
                    highlightDefinition.selectionInfo = (0, selection_2.getCurrentSelectionInfo)(win, getCssSelector, exports.computeCFI);
                }
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (highlightDefinitions_1_1 && !highlightDefinitions_1_1.done && (_a = highlightDefinitions_1.return)) _a.call(highlightDefinitions_1);
            }
            finally { if (e_11) throw e_11.error; }
        }
        var highlights = (0, highlight_1.createHighlights)(win, highlightDefinitions, true);
        var payloadPong = {
            highlightDefinitions: payloadPing.highlightDefinitions,
            highlights: highlights.length ? highlights : undefined,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPong);
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_REMOVE, function (_event, payload) {
        payload.highlightIDs.forEach(function (highlightID) {
            (0, highlight_1.destroyHighlight)(win.document, highlightID);
        });
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL, function (_event) {
        (0, highlight_1.destroyAllhighlights)(win.document);
    });
}
//# sourceMappingURL=preload.js.map