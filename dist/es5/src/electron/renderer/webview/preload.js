"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    var cr = require("../common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
}
var debounce_1 = require("debounce");
var debug_ = require("debug");
var electron_1 = require("electron");
var tabbable = require("tabbable");
var events_1 = require("../../common/events");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var selection_1 = require("../../common/selection");
var styles_1 = require("../../common/styles");
var animateProperty_1 = require("../common/animateProperty");
var cssselector2_1 = require("../common/cssselector2");
var easings_1 = require("../common/easings");
var popup_dialog_1 = require("../common/popup-dialog");
var querystring_1 = require("../common/querystring");
var rect_utils_1 = require("../common/rect-utils");
var url_params_1 = require("../common/url-params");
var webview_resize_1 = require("../common/webview-resize");
var audiobook_1 = require("./audiobook");
var epubReadingSystem_1 = require("./epubReadingSystem");
var highlight_1 = require("./highlight");
var popupFootNotes_1 = require("./popupFootNotes");
var readaloud_1 = require("./readaloud");
var readium_css_1 = require("./readium-css");
var selection_2 = require("./selection");
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
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
    },
    ttsClickEnabled: false,
    urlQueryParams: win.location.search ? querystring_1.getURLQueryParams(win.location.search) : undefined,
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
        var rect = element.getBoundingClientRect();
        if (rect.top >= 0 &&
            rect.top <= win.document.documentElement.clientHeight) {
            return true;
        }
        return false;
    }
    if (readium_css_1.isVerticalWritingMode()) {
        return false;
    }
    var scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element);
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
            visible = computeVisibility_(selected);
        }
    }
    return visible;
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_LOCATOR_VISIBLE, function (_event, payload) {
    payload.visible = computeVisibility(payload.location);
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LOCATOR_VISIBLE, payload);
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, function (_event, payload) {
    showHideContentMask(false);
    selection_2.clearCurrentSelection(win);
    popup_dialog_1.closePopupDialogs(win.document);
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
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
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
    var noChange = popup_dialog_1.isPopupDialogOpen(win.document) ||
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
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) < maxScrollShift)) {
                var unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollOffsetPotentiallyExcessive_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollTop + unit) :
                    (scrollElement.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * unit);
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
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) < maxScrollShift)) {
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
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollTop) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(scrollElement.scrollLeft) > 0)) {
                var unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollOffset_ = readium_css_1.isVerticalWritingMode() ?
                    (scrollElement.scrollTop - unit) :
                    (scrollElement.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * unit);
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
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, scrollOffset, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
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
                    _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, targetProp, animationTime, targetObj, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                }
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
function scrollElementIntoView(element, doFocus) {
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr3 + "]");
        existings.forEach(function (existing) {
            existing.removeAttribute("" + styles_1.readPosCssStylesAttr3);
        });
        element.setAttribute(styles_1.readPosCssStylesAttr3, "scrollElementIntoView");
    }
    if (doFocus) {
        if (!tabbable.isFocusable(element)) {
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
        }, 4500);
        element.focus();
    }
    setTimeout(function () {
        var isPaged = readium_css_inject_1.isPaginated(win.document);
        if (isPaged) {
            scrollIntoView(element);
        }
        else {
            var scrollElement = readium_css_1.getScrollingElement(win.document);
            var rect = element.getBoundingClientRect();
            var scrollTopMax = scrollElement.scrollHeight - win.document.documentElement.clientHeight;
            var offset = scrollElement.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2));
            if (offset > scrollTopMax) {
                offset = scrollTopMax;
            }
            else if (offset < 0) {
                offset = 0;
            }
            scrollElement.scrollTop = offset;
        }
    }, doFocus ? 100 : 0);
}
function getScrollOffsetIntoView(element) {
    if (!win.document || !win.document.documentElement || !win.document.body ||
        !readium_css_inject_1.isPaginated(win.document) || readium_css_1.isVerticalWritingMode()) {
        return 0;
    }
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var rect = element.getBoundingClientRect();
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
function scrollIntoView(element) {
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return;
    }
    var maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
    var scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element);
    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
    var scrollElement = readium_css_1.getScrollingElement(win.document);
    var scrollOffset = (scrollLeftPotentiallyExcessive < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive), maxScrollShift);
    scrollElement.scrollLeft = scrollOffset;
}
var scrollToHashRaw = function () {
    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    debug("++++ scrollToHashRaw");
    highlight_1.recreateAllHighlights(win);
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    if (win.READIUM2.locationHashOverride) {
        scrollElementIntoView(win.READIUM2.locationHashOverride, true);
        notifyReadingLocationDebounced();
        return;
    }
    else if (win.READIUM2.hashElement) {
        win.READIUM2.locationHashOverride = win.READIUM2.hashElement;
        scrollElementIntoView(win.READIUM2.hashElement, true);
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
                    showHideContentMask(false);
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
                var s = Buffer.from(gto, "base64").toString("utf8");
                var js = JSON.parse(s);
                gotoCssSelector = js.cssSelector;
                gotoProgression = js.progression;
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
                    scrollElementIntoView(selected, true);
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
        processXYRaw(0, 0, false);
    }
    notifyReadingLocationDebounced();
};
var scrollToHashDebounced = debounce_1.debounce(function () {
    debug("++++ scrollToHashRaw FROM DEBOUNCED");
    scrollToHashRaw();
}, 100);
var _ignoreScrollEvent = false;
electron_1.ipcRenderer.on("R2_EVENT_HIDE", function (_event) {
    showHideContentMask(true);
});
function showHideContentMask(doHide) {
    if (doHide) {
        win.document.documentElement.classList.add(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    }
    else {
        win.document.documentElement.classList.remove(styles_1.ROOT_CLASS_INVISIBLE_MASK);
    }
}
function focusScrollRaw(el, doFocus) {
    scrollElementIntoView(el, doFocus);
    var blacklisted = checkBlacklisted(el);
    if (blacklisted) {
        return;
    }
    win.READIUM2.locationHashOverride = el;
    notifyReadingLocationDebounced();
}
var focusScrollDebounced = debounce_1.debounce(function (el, doFocus) {
    focusScrollRaw(el, doFocus);
}, 100);
var handleFocusInDebounced = debounce_1.debounce(function (target, tabKeyDownEvent) {
    handleFocusInRaw(target, tabKeyDownEvent);
}, 100);
function handleFocusInRaw(target, _tabKeyDownEvent) {
    if (!target || !win.document.body) {
        return;
    }
    focusScrollRaw(target, false);
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, function (_event, payload) {
    showHideContentMask(true);
    readium_css_1.readiumCSS(win.document, payload);
    highlight_1.recreateAllHighlights(win);
    showHideContentMask(false);
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
    var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, w, h);
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
        showHideContentMask(false);
    }
    else {
        if (!win.READIUM2.isFixedLayout) {
            showHideContentMask(false);
            debug("++++ scrollToHashDebounced FROM LOAD");
            scrollToHashDebounced();
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
                            focusScrollDebounced(el, true);
                        }
                    });
                }, 200);
            }
        }
        else {
            showHideContentMask(false);
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
            var mouseClickOnLink = false;
            if (win.document && win.document.documentElement) {
                if (!win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_KEYBOARD_INTERACT)) {
                    if (ev.target.tagName.toLowerCase() === "a" && ev.target.href) {
                        mouseClickOnLink = true;
                    }
                }
            }
            if (!mouseClickOnLink) {
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
                highlight_1.invalidateBoundingClientRectOfDocumentBody(win);
                win.document.body.tabbables = undefined;
                scrollToHashDebounced();
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
        if (/^javascript:/.test(href)) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        var done = popupFootNotes_1.popupFootNote(currentElement, focusScrollRaw, href, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        if (!done) {
            focusScrollDebounced.clear();
            processXYDebounced.clear();
            notifyReadingLocationDebounced.clear();
            scrollToHashDebounced.clear();
            var payload = {
                url: href,
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
        }
        return false;
    }, true);
    var onResizeRaw = function () {
        var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight);
        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
            win.READIUM2.fxlViewportScale = wh.scale;
        }
        debug("++++ scrollToHashDebounced FROM RESIZE");
        scrollToHashDebounced();
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
        if (webview_resize_1.ENABLE_WEBVIEW_RESIZE) {
            onResizeRaw();
        }
        else {
            onResizeDebounced();
        }
    });
    var onScrollRaw = function () {
        if (!win.document || !win.document.documentElement) {
            return;
        }
        var el = win.READIUM2.locationHashOverride;
        if (el && computeVisibility_(el)) {
            return;
        }
        var x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
        processXYRaw(x, 0, false);
    };
    var onScrollDebounced = debounce_1.debounce(function () {
        onScrollRaw();
    }, 300);
    setTimeout(function () {
        win.addEventListener("scroll", function (_ev) {
            if (_ignoreScrollEvent) {
                _ignoreScrollEvent = false;
                return;
            }
            if (_lastAnimState && _lastAnimState.animating) {
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
        processXYDebounced(x, y, false);
        if (win.READIUM2.ttsClickEnabled) {
            var element = void 0;
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
            if (element) {
                if (ev.altKey) {
                    readaloud_1.ttsPlay(focusScrollRaw, element, undefined, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                    return;
                }
                readaloud_1.ttsPlay(focusScrollRaw, element.ownerDocument.body, element, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
            }
        }
    }
    win.document.documentElement.addEventListener("mouseup", function (ev) {
        handleMouseEvent(ev);
    });
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
        var visible = computeVisibility_(rootElement);
        if (visible) {
            return rootElement;
        }
    }
    return undefined;
}
var processXYRaw = function (x, y, reverse) {
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
    else if (!computeVisibility_(element)) {
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
        win.READIUM2.locationHashOverride = element;
        notifyReadingLocationDebounced();
        if (win.READIUM2.DEBUG_VISUALS) {
            var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr2 + "]");
            existings.forEach(function (existing) {
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr2);
            });
            element.setAttribute(styles_1.readPosCssStylesAttr2, "processXYRaw");
        }
    }
};
var processXYDebounced = debounce_1.debounce(function (x, y, reverse) {
    processXYRaw(x, y, reverse);
}, 300);
exports.computeProgressionData = function () {
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
            var visible = computeVisibility_(element);
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
var _blacklistIdClassForCssSelectors = [styles_1.LINK_TARGET_CLASS, styles_1.CSS_CLASS_NO_FOCUS_OUTLINE, styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA, styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_ID_SPEAKING_DOC_ELEMENT, styles_1.ROOT_CLASS_KEYBOARD_INTERACT, styles_1.ROOT_CLASS_INVISIBLE_MASK, styles_1.CLASS_PAGINATED, styles_1.ROOT_CLASS_NO_FOOTNOTES];
var _blacklistIdClassForCssSelectorsMathJax = ["mathjax", "ctxt", "mjx"];
var _blacklistIdClassForCFI = [styles_1.SKIP_LINK_ID, styles_1.POPUP_DIALOG_CLASS, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, highlight_1.ID_HIGHLIGHTS_CONTAINER, highlight_1.CLASS_HIGHLIGHT_CONTAINER, highlight_1.CLASS_HIGHLIGHT_AREA, highlight_1.CLASS_HIGHLIGHT_BOUNDING_AREA];
var _blacklistIdClassForCFIMathJax = ["mathjax", "ctxt", "mjx"];
exports.computeCFI = function (node) {
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
var notifyReadingLocationRaw = function () {
    if (!win.READIUM2.locationHashOverride) {
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
        selectionInfo: selInfo,
        selectionIsNew: selectionIsNew,
        text: text,
        title: _docTitle,
    };
    var payload = win.READIUM2.locationHashOverrideInfo;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr4 + "]");
        existings.forEach(function (existing) {
            existing.removeAttribute("" + styles_1.readPosCssStylesAttr4);
        });
        win.READIUM2.locationHashOverride.setAttribute(styles_1.readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
var notifyReadingLocationDebounced = debounce_1.debounce(function () {
    notifyReadingLocationRaw();
}, 250);
if (!win.READIUM2.isAudio) {
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PLAY, function (_event, payload) {
        var rootElement = win.document.querySelector(payload.rootElement);
        var startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;
        readaloud_1.ttsPlay(focusScrollRaw, rootElement ? rootElement : undefined, startElement ? startElement : undefined, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
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
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_NEXT, function (_event) {
        readaloud_1.ttsNext();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PREVIOUS, function (_event) {
        readaloud_1.ttsPrevious();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_CLICK_ENABLE, function (_event, payload) {
        win.READIUM2.ttsClickEnabled = payload.doEnable;
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_HIGHLIGHT_CREATE, function (_event, payloadPing) {
        if (payloadPing.highlightDefinitions &&
            payloadPing.highlightDefinitions.length === 1 &&
            payloadPing.highlightDefinitions[0].selectionInfo) {
            var selection = win.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        }
        var highlightDefinitions = !payloadPing.highlightDefinitions ?
            [{ color: undefined, selectionInfo: undefined }] :
            payloadPing.highlightDefinitions;
        var highlights = [];
        highlightDefinitions.forEach(function (highlightDefinition) {
            var selInfo = highlightDefinition.selectionInfo ? highlightDefinition.selectionInfo :
                selection_2.getCurrentSelectionInfo(win, getCssSelector, exports.computeCFI);
            if (selInfo) {
                var highlight = highlight_1.createHighlight(win, selInfo, highlightDefinition.color, true);
                highlights.push(highlight);
            }
            else {
                highlights.push(null);
            }
        });
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