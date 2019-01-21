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
var styles_1 = require("../../common/styles");
var animateProperty_1 = require("../common/animateProperty");
var cssselector2_1 = require("../common/cssselector2");
var easings_1 = require("../common/easings");
var popup_dialog_1 = require("../common/popup-dialog");
var querystring_1 = require("../common/querystring");
var url_params_1 = require("../common/url-params");
var epubReadingSystem_1 = require("./epubReadingSystem");
var popupFootNotes_1 = require("./popupFootNotes");
var readaloud_1 = require("./readaloud");
var readium_css_1 = require("./readium-css");
var ResizeSensor = require("css-element-queries/src/ResizeSensor");
var debug = debug_("r2:navigator#electron/renderer/webview/preload");
var win = global.window;
win.READIUM2 = {
    DEBUG_VISUALS: false,
    fxlViewportHeight: 0,
    fxlViewportWidth: 0,
    hashElement: null,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideInfo: {
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
        },
        paginationInfo: undefined,
    },
    ttsClickEnabled: false,
    urlQueryParams: undefined,
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
win.READIUM2.urlQueryParams = win.location.search ? querystring_1.getURLQueryParams(win.location.search) : undefined;
if (win.READIUM2.urlQueryParams) {
    var readiumEpubReadingSystemJson = void 0;
    var base64EpubReadingSystem = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_EPUBREADINGSYSTEM];
    if (base64EpubReadingSystem) {
        try {
            var str = new Buffer(base64EpubReadingSystem, "base64").toString("utf8");
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
    electron_1.ipcRenderer.on(events_1.R2_EVENT_DEBUG_VISUALS, function (_event, payload) {
        win.READIUM2.DEBUG_VISUALS = payload === "true";
        if (!win.READIUM2.DEBUG_VISUALS) {
            var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr1 + "], *[" + styles_1.readPosCssStylesAttr2 + "], *[" + styles_1.readPosCssStylesAttr3 + "], *[" + styles_1.readPosCssStylesAttr4 + "]");
            existings.forEach(function (existing) {
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr1);
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr2);
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr3);
                existing.removeAttribute("" + styles_1.readPosCssStylesAttr4);
            });
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
    if (element === win.document.body) {
        return true;
    }
    var rect = element.getBoundingClientRect();
    if (!readium_css_inject_1.isPaginated(win.document)) {
        if ((rect.top + rect.height) >= 0 && rect.top <= win.document.documentElement.clientHeight) {
            return true;
        }
        return false;
    }
    if (readium_css_1.isVerticalWritingMode()) {
        return false;
    }
    var scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element);
    var extraShift = win.document.body.scrollLeftExtra;
    var currentOffset = win.document.body.scrollLeft;
    if (extraShift) {
        currentOffset += (((win.document.body.scrollLeft < 0) ? -1 : 1) * extraShift);
    }
    if (scrollLeftPotentiallyExcessive >= (currentOffset - 10) &&
        scrollLeftPotentiallyExcessive <= (currentOffset + 10)) {
        return true;
    }
    return false;
}
function computeVisibility(location) {
    var visible = false;
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
            scrollToHashRaw();
        }, 100);
    }
    else {
        scrollToHashRaw();
    }
});
function resetLocationHashOverrideInfo() {
    win.READIUM2.locationHashOverrideInfo = {
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
        },
        paginationInfo: undefined,
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
function ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, maxScrollShift) {
    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    var noChange = !readium_css_inject_1.isPaginated(win.document) || !readium_css_1.isTwoPageSpread() ||
        readium_css_1.isVerticalWritingMode() ||
        maxScrollShift <= 0 || Math.abs(scrollOffset) <= maxScrollShift;
    if (noChange) {
        win.document.body.scrollLeftExtra = 0;
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
    win.document.body.scrollLeftExtra = extraOffset;
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
    popup_dialog_1.closePopupDialogs(win.document);
    if (win.READIUM2.isFixedLayout || !win.document.body) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
        return;
    }
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var reduceMotion = win.document.documentElement.classList.contains(styles_1.ROOT_CLASS_REDUCE_MOTION);
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    var goPREVIOUS = payload.go === "PREVIOUS";
    if (_lastAnimState && _lastAnimState.animating) {
        win.cancelAnimationFrame(_lastAnimState.id);
        _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
    }
    if (!goPREVIOUS) {
        var maxScrollShift = readium_css_1.calculateMaxScrollShift().maxScrollShift;
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) < maxScrollShift)) {
                var unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollOffsetPotentiallyExcessive_ = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollTop + unit) :
                    (win.document.body.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * unit);
                var nWholes = Math.floor(scrollOffsetPotentiallyExcessive_ / unit);
                var scrollOffsetPotentiallyExcessive = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);
                var scrollOffset = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                    Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);
                var targetObj = win.document.body;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft";
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
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) < maxScrollShift)) {
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop + win.document.documentElement.clientHeight);
                var targetObj = win.document.body;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop";
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
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) > 0)) {
                var unit = readium_css_1.isVerticalWritingMode() ?
                    win.document.documentElement.offsetHeight :
                    win.document.documentElement.offsetWidth;
                var scrollOffset_ = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollTop - unit) :
                    (win.document.body.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * unit);
                var nWholes = Math.ceil(scrollOffset_ / unit);
                var scrollOffset = nWholes * unit;
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, 0);
                var targetObj = win.document.body;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft";
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
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) > 0)) {
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop - win.document.documentElement.clientHeight);
                var targetObj = win.document.body;
                var targetProp = readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop";
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_PAGE_TURN, function (_event, payload) {
    setTimeout(function () {
        onEventPageTurn(payload);
    }, 100);
});
function scrollElementIntoView(element) {
    if (win.READIUM2.DEBUG_VISUALS) {
        var existings = win.document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr3 + "]");
        existings.forEach(function (existing) {
            existing.removeAttribute("" + styles_1.readPosCssStylesAttr3);
        });
        element.setAttribute(styles_1.readPosCssStylesAttr3, "scrollElementIntoView");
    }
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    if (isPaged) {
        scrollIntoView(element);
    }
    else {
        var rect = element.getBoundingClientRect();
        var scrollTopMax = win.document.body.scrollHeight - win.document.documentElement.clientHeight;
        var offset = win.document.body.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2));
        if (offset > scrollTopMax) {
            offset = scrollTopMax;
        }
        else if (offset < 0) {
            offset = 0;
        }
        win.document.body.scrollTop = offset;
    }
}
function getScrollOffsetIntoView(element) {
    if (!win.document || !win.document.documentElement || !win.document.body ||
        !readium_css_inject_1.isPaginated(win.document) || readium_css_1.isVerticalWritingMode()) {
        return 0;
    }
    var rect = element.getBoundingClientRect();
    var columnDimension = readium_css_1.calculateColumnDimension();
    var isTwoPage = readium_css_1.isTwoPageSpread();
    var fullOffset = (readium_css_1.isRTL() ?
        ((columnDimension * (isTwoPage ? 2 : 1)) - rect.left) :
        rect.left) +
        ((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft);
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
    var scrollOffset = (scrollLeftPotentiallyExcessive < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive), maxScrollShift);
    win.document.body.scrollLeft = scrollOffset;
}
var scrollToHashRaw = function () {
    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }
    var isPaged = readium_css_inject_1.isPaginated(win.document);
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
        if (win.READIUM2.urlQueryParams) {
            var previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
            var isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                var _a = readium_css_1.calculateMaxScrollShift(), maxScrollShift = _a.maxScrollShift, maxScrollShiftAdjusted = _a.maxScrollShiftAdjusted;
                _ignoreScrollEvent = true;
                if (isPaged) {
                    if (readium_css_1.isVerticalWritingMode()) {
                        win.document.body.scrollLeft = 0;
                        win.document.body.scrollTop = maxScrollShift;
                    }
                    else {
                        var scrollLeftPotentiallyExcessive = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShiftAdjusted;
                        ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
                        var scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShift;
                        win.document.body.scrollLeft = scrollLeft;
                        win.document.body.scrollTop = 0;
                    }
                }
                else {
                    if (readium_css_1.isVerticalWritingMode()) {
                        win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShift;
                        win.document.body.scrollTop = 0;
                    }
                    else {
                        win.document.body.scrollLeft = 0;
                        win.document.body.scrollTop = maxScrollShift;
                    }
                }
                win.READIUM2.locationHashOverride = undefined;
                resetLocationHashOverrideInfo();
                setTimeout(function () {
                    var y = (isPaged ?
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.offsetWidth :
                            win.document.documentElement.offsetHeight) :
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.clientWidth :
                            win.document.documentElement.clientHeight))
                        - 1;
                    processXYRaw(0, y);
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
            if (gto) {
                var s = new Buffer(gto, "base64").toString("utf8");
                var js = JSON.parse(s);
                gotoCssSelector = js.cssSelector;
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
                    resetLocationHashOverrideInfo();
                    if (win.READIUM2.locationHashOverrideInfo) {
                        win.READIUM2.locationHashOverrideInfo.locations.cssSelector = gotoCssSelector;
                    }
                    scrollElementIntoView(selected);
                    notifyReadingLocationDebounced();
                    return;
                }
            }
        }
        _ignoreScrollEvent = true;
        win.document.body.scrollLeft = 0;
        win.document.body.scrollTop = 0;
        setTimeout(function () {
            _ignoreScrollEvent = false;
        }, 10);
        win.READIUM2.locationHashOverride = win.document.body;
        resetLocationHashOverrideInfo();
        processXYRaw(0, 0);
        if (!win.READIUM2.locationHashOverride) {
            notifyReadingLocationDebounced();
            return;
        }
    }
    notifyReadingLocationDebounced();
};
var scrollToHashDebounced = debounce_1.debounce(function () {
    scrollToHashRaw();
}, 300);
var _ignoreScrollEvent = false;
electron_1.ipcRenderer.on("R2_EVENT_HIDE", function (_event) {
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
        setTimeout(function () {
            el.focus();
        }, 10);
    }
    notifyReadingLocationDebounced();
}
var focusScrollDebounced = debounce_1.debounce(function (el, doFocus) {
    focusScrollRaw(el, doFocus);
}, 80);
var _ignoreFocusInEvent = false;
function handleTab(target, tabKeyDownEvent) {
    if (!target || !win.document.body) {
        return;
    }
    _ignoreFocusInEvent = false;
    var tabbables = win.document.body.tabbables ?
        win.document.body.tabbables :
        (win.document.body.tabbables = tabbable(win.document.body));
    var i = tabbables.indexOf(target);
    if (i === 0) {
        if (!tabKeyDownEvent || tabKeyDownEvent.shiftKey) {
            _ignoreFocusInEvent = true;
            focusScrollDebounced(target, true);
            return;
        }
        if (i < (tabbables.length - 1)) {
            tabKeyDownEvent.preventDefault();
            var nextTabbable = tabbables[i + 1];
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
            var previousTabbable = tabbables[i - 1];
            focusScrollDebounced(previousTabbable, true);
            return;
        }
    }
    else if (i > 0) {
        if (tabKeyDownEvent) {
            if (tabKeyDownEvent.shiftKey) {
                tabKeyDownEvent.preventDefault();
                var previousTabbable = tabbables[i - 1];
                focusScrollDebounced(previousTabbable, true);
                return;
            }
            else {
                tabKeyDownEvent.preventDefault();
                var nextTabbable = tabbables[i + 1];
                focusScrollDebounced(nextTabbable, true);
                return;
            }
        }
    }
    if (!tabKeyDownEvent) {
        focusScrollDebounced(target, true);
    }
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_READIUMCSS, function (_event, payload) {
    showHideContentMask(false);
    readium_css_1.readiumCSS(win.document, payload);
});
var _docTitle;
win.addEventListener("DOMContentLoaded", function () {
    var titleElement = win.document.documentElement.querySelector("head > title");
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
    var readiumcssJson;
    if (win.READIUM2.urlQueryParams) {
        var base64ReadiumCSS = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_CSS];
        if (base64ReadiumCSS) {
            var str = void 0;
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
    var didHide = false;
    if (!win.READIUM2.isFixedLayout) {
        if (win.READIUM2.urlQueryParams) {
            var previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
            var isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                didHide = true;
                showHideContentMask(true);
            }
        }
    }
    if (!didHide) {
        showHideContentMask(false);
    }
    var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight);
    if (wh) {
        win.READIUM2.fxlViewportWidth = wh.width;
        win.READIUM2.fxlViewportHeight = wh.height;
    }
    var alreadedInjected = win.document.documentElement.hasAttribute("data-readiumcss-injected");
    if (alreadedInjected) {
        debug(">>>>> ReadiumCSS already injected by streamer");
    }
    if (!alreadedInjected) {
        readium_css_inject_1.injectDefaultCSS(win.document);
        if (IS_DEV) {
            readium_css_inject_1.injectReadPosCSS(win.document);
        }
    }
    readium_css_1.computeVerticalRTL();
    if (readiumcssJson) {
        if (readium_css_1.isVerticalWritingMode() ||
            !alreadedInjected) {
            debug(">>>>>> ReadiumCSS inject again");
            readium_css_1.readiumCSS(win.document, readiumcssJson);
        }
    }
    if (alreadedInjected) {
        readium_css_1.checkHiddenFootNotes(win.document);
    }
});
var _cancelInitialScrollCheck = false;
win.addEventListener("load", function () {
    if (!win.READIUM2.isFixedLayout) {
        setTimeout(function () {
            scrollToHashRaw();
        }, 100);
        _cancelInitialScrollCheck = false;
        setTimeout(function () {
            if (_cancelInitialScrollCheck) {
                return;
            }
        }, 500);
    }
    else {
        processXYDebounced(0, 0);
    }
    var useResizeSensor = !win.READIUM2.isFixedLayout;
    if (useResizeSensor && win.document.body) {
        setTimeout(function () {
            new ResizeSensor(win.document.body, function () {
                debug("ResizeSensor");
                win.document.body.tabbables = undefined;
                scrollToHashDebounced();
            });
        }, 1000);
    }
    win.document.body.addEventListener("focusin", function (ev) {
        if (_ignoreFocusInEvent) {
            _ignoreFocusInEvent = false;
            return;
        }
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
                handleTab(ev.target, undefined);
            }
        }
    });
    win.document.body.addEventListener("keydown", function (ev) {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        var TAB_KEY = 9;
        if (ev.which === TAB_KEY) {
            if (ev.target) {
                handleTab(ev.target, ev);
            }
        }
    }, true);
    win.document.documentElement.addEventListener("keydown", function (ev) {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.add(styles_1.ROOT_CLASS_KEYBOARD_INTERACT);
        }
        if (ev.keyCode === 37 || ev.keyCode === 39) {
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
    win.document.addEventListener("click", function (e) {
        var href = e.target.href;
        if (!href) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var done = popupFootNotes_1.popupFootNote(e.target, focusScrollRaw, href);
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
    win.addEventListener("resize", function () {
        var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight);
        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
        }
        scrollToHashRaw();
    });
    setTimeout(function () {
        win.addEventListener("scroll", function (_ev) {
            if (_ignoreScrollEvent) {
                _ignoreScrollEvent = false;
                return;
            }
            if (!win.document || !win.document.documentElement) {
                return;
            }
            var x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
            processXYDebounced(x, 0);
        });
    }, 200);
    win.document.body.addEventListener("click", function (ev) {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        var x = ev.clientX;
        var y = ev.clientY;
        processXYDebounced(x, y);
    });
    win.document.body.addEventListener("click", function (ev) {
        if (popup_dialog_1.isPopupDialogOpen(win.document)) {
            return;
        }
        var x = ev.clientX;
        var y = ev.clientY;
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
        if (win.READIUM2.ttsClickEnabled && element) {
            if (ev.altKey) {
                readaloud_1.ttsPlay(focusScrollRaw, element, undefined);
                return;
            }
            readaloud_1.ttsPlay(focusScrollRaw, element.ownerDocument.body, element);
        }
    });
});
function findFirstVisibleElement(rooElement) {
    if (rooElement !== win.document.body) {
        var visible = computeVisibility_(rooElement);
        if (visible) {
            return rooElement;
        }
    }
    for (var i = 0; i < rooElement.children.length; i++) {
        var child = rooElement.children[i];
        if (child.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }
        var visibleElement = findFirstVisibleElement(child);
        if (visibleElement) {
            return visibleElement;
        }
    }
    return undefined;
}
var processXYRaw = function (x, y) {
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
    if (!element || element === win.document.body) {
        element = findFirstVisibleElement(win.document.body);
        if (!element) {
            debug("|||||||||||||| cannot find visible element inside BODY????");
            element = win.document.body;
        }
    }
    else if (readium_css_inject_1.isPaginated(win.document) && !computeVisibility_(element)) {
        var next = element;
        var found = void 0;
        while (next) {
            var firstInside = findFirstVisibleElement(next);
            if (firstInside) {
                found = firstInside;
                break;
            }
            var sibling = next.nextElementSibling;
            next = sibling ? sibling : undefined;
        }
        if (found) {
            element = found;
        }
        else {
            debug("|||||||||||||| cannot find visible element after current????");
        }
    }
    if (element === win.document.body) {
        debug("|||||||||||||| BODY selected????");
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
var processXYDebounced = debounce_1.debounce(function (x, y) {
    processXYRaw(x, y);
}, 300);
exports.computeProgressionData = function () {
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    var isTwoPage = readium_css_1.isTwoPageSpread();
    var _a = readium_css_1.calculateMaxScrollShift(), maxScrollShift = _a.maxScrollShift, maxScrollShiftAdjusted = _a.maxScrollShiftAdjusted;
    var totalColumns = readium_css_1.calculateTotalColumns();
    var progressionRatio = 0;
    var currentColumn = 0;
    var extraShift = 0;
    if (isPaged) {
        if (maxScrollShift > 0) {
            if (readium_css_1.isVerticalWritingMode()) {
                progressionRatio = win.document.body.scrollTop / maxScrollShift;
            }
            else {
                extraShift = win.document.body.scrollLeftExtra;
                if (extraShift) {
                    progressionRatio = (((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft) + extraShift) /
                        maxScrollShiftAdjusted;
                }
                else {
                    progressionRatio = ((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft) / maxScrollShift;
                }
            }
        }
        var adjustedTotalColumns = (extraShift ? (totalColumns + 1) : totalColumns) - (isTwoPage ? 2 : 1);
        currentColumn = adjustedTotalColumns * progressionRatio;
        currentColumn = Math.floor(currentColumn);
    }
    else {
        if (maxScrollShift > 0) {
            if (readium_css_1.isVerticalWritingMode()) {
                progressionRatio = ((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft) / maxScrollShift;
            }
            else {
                progressionRatio = win.document.body.scrollTop / maxScrollShift;
            }
        }
    }
    if (win.READIUM2.locationHashOverride) {
        var element = win.READIUM2.locationHashOverride;
        var rect = element.getBoundingClientRect();
        var offset = 0;
        if (isPaged) {
            var visible = computeVisibility_(element);
            if (visible) {
                var curCol = extraShift ? (currentColumn - 1) : currentColumn;
                var columnDimension = readium_css_1.calculateColumnDimension();
                if (readium_css_1.isVerticalWritingMode()) {
                    offset = (curCol * win.document.body.scrollWidth) + rect.left +
                        (rect.top >= columnDimension ? win.document.body.scrollWidth : 0);
                }
                else {
                    offset = (curCol * win.document.body.scrollHeight) + rect.top +
                        (((readium_css_1.isRTL() ?
                            (win.document.documentElement.clientWidth - (rect.left + rect.width)) :
                            rect.left) >= columnDimension) ? win.document.body.scrollHeight : 0);
                }
                var totalDocumentDimension = ((readium_css_1.isVerticalWritingMode() ? win.document.body.scrollWidth :
                    win.document.body.scrollHeight) * totalColumns);
                progressionRatio = offset / totalDocumentDimension;
                currentColumn = totalColumns * progressionRatio;
                currentColumn = Math.floor(currentColumn);
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode()) {
                offset = ((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft) + rect.left + (readium_css_1.isRTL() ? rect.width : 0);
            }
            else {
                offset = win.document.body.scrollTop + rect.top;
            }
            progressionRatio = offset /
                (readium_css_1.isVerticalWritingMode() ? win.document.body.scrollWidth : win.document.body.scrollHeight);
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
var _blacklistIdClassForCssSelectors = [styles_1.TTS_ID_INJECTED_PARENT, styles_1.TTS_ID_SPEAKING_DOC_ELEMENT, styles_1.POPUP_DIALOG_CLASS, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN, styles_1.ROOT_CLASS_KEYBOARD_INTERACT, styles_1.ROOT_CLASS_INVISIBLE_MASK, readium_css_inject_1.CLASS_PAGINATED, styles_1.ROOT_CLASS_NO_FOOTNOTES];
var _blacklistIdClassForCFI = [styles_1.POPUP_DIALOG_CLASS, styles_1.TTS_CLASS_INJECTED_SPAN, styles_1.TTS_CLASS_INJECTED_SUBSPAN];
exports.computeCFI = function (node) {
    var e_1, _a;
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    var cfi = "";
    var currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        var blacklistedId = void 0;
        var id = currentElement.getAttribute("id");
        if (id && _blacklistIdClassForCFI.indexOf(id) >= 0) {
            console.log("CFI BLACKLIST ID: " + id);
            blacklistedId = id;
        }
        var blacklistedClass = void 0;
        try {
            for (var _blacklistIdClassForCFI_1 = tslib_1.__values(_blacklistIdClassForCFI), _blacklistIdClassForCFI_1_1 = _blacklistIdClassForCFI_1.next(); !_blacklistIdClassForCFI_1_1.done; _blacklistIdClassForCFI_1_1 = _blacklistIdClassForCFI_1.next()) {
                var item = _blacklistIdClassForCFI_1_1.value;
                if (currentElement.classList.contains(item)) {
                    console.log("CFI BLACKLIST CLASS: " + item);
                    blacklistedClass = item;
                    break;
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
        if (!blacklistedId && !blacklistedClass) {
            var currentElementParentChildren = currentElement.parentNode.children;
            var currentElementIndex = -1;
            for (var i = 0; i < currentElementParentChildren.length; i++) {
                if (currentElement === currentElementParentChildren[i]) {
                    currentElementIndex = i;
                    break;
                }
            }
            if (currentElementIndex >= 0) {
                var cfiIndex = (currentElementIndex + 1) * 2;
                cfi = cfiIndex +
                    (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                    (cfi.length ? ("/" + cfi) : "");
            }
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
var notifyReadingLocationRaw = function () {
    if (!win.READIUM2.locationHashOverride) {
        return;
    }
    var progressionData;
    var options = {
        className: function (str) {
            return _blacklistIdClassForCssSelectors.indexOf(str) < 0;
        },
        idName: function (str) {
            return _blacklistIdClassForCssSelectors.indexOf(str) < 0;
        },
    };
    var cssSelector = cssselector2_1.uniqueCssSelector(win.READIUM2.locationHashOverride, win.document, options);
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
    win.READIUM2.locationHashOverrideInfo = {
        href: "",
        locations: {
            cfi: cfi,
            cssSelector: cssSelector,
            position: undefined,
            progression: progression,
        },
        paginationInfo: pinfo,
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
    debug("|||||||||||||| notifyReadingLocation: ", JSON.stringify(payload));
};
var notifyReadingLocationDebounced = debounce_1.debounce(function () {
    notifyReadingLocationRaw();
}, 250);
electron_1.ipcRenderer.on(events_1.R2_EVENT_TTS_DO_PLAY, function (_event, payload) {
    var rootElement = win.document.querySelector(payload.rootElement);
    var startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;
    readaloud_1.ttsPlay(focusScrollRaw, rootElement ? rootElement : undefined, startElement ? startElement : undefined);
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
//# sourceMappingURL=preload.js.map