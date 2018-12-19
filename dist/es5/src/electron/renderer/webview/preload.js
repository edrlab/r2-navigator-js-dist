"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResizeSensor = require("css-element-queries/src/ResizeSensor");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var styles_1 = require("../../common/styles");
var animateProperty_1 = require("../common/animateProperty");
var console_redirect_1 = require("../common/console-redirect");
var cssselector2_1 = require("../common/cssselector2");
var easings_1 = require("../common/easings");
var querystring_1 = require("../common/querystring");
var url_params_1 = require("../common/url-params");
var epubReadingSystem_1 = require("./epubReadingSystem");
var readium_css_1 = require("./readium-css");
console_redirect_1.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
var win = global.window;
win.READIUM2 = {
    fxlViewportHeight: 0,
    fxlViewportWidth: 0,
    hashElement: null,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideInfo: {
        cfi: undefined,
        cssSelector: undefined,
        paginationInfo: undefined,
        position: undefined,
        progression: undefined,
    },
    readyEventSent: false,
    readyPassDone: false,
    urlQueryParams: undefined,
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
            console.log(err);
        }
    }
    if (readiumEpubReadingSystemJson) {
        epubReadingSystem_1.setWindowNavigatorEpubReadingSystem(win, readiumEpubReadingSystemJson);
    }
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, function (_event, payload) {
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
        if (readium_css_inject_1.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                win.READIUM2.hashElement.setAttribute(styles_1.readPosCssStylesAttr1, "R2_EVENT_SCROLLTO hashElement");
            }
        }
        win.location.href = "#" + payload.hash;
        delayScrollIntoView = true;
    }
    else {
        win.READIUM2.hashElement = null;
    }
    win.READIUM2.readyEventSent = false;
    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.locationHashOverrideInfo = {
        cfi: undefined,
        cssSelector: undefined,
        paginationInfo: undefined,
        position: undefined,
        progression: undefined,
    };
    if (delayScrollIntoView) {
        setTimeout(function () {
            scrollToHashRaw();
        }, 100);
    }
    else {
        scrollToHashRaw();
    }
});
var _lastAnimState;
electron_1.ipcRenderer.on(events_1.R2_EVENT_PAGE_TURN, function (_event, payload) {
    if (win.READIUM2.isFixedLayout || !win.document.body) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
        return;
    }
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    var maxScrollShift = readium_css_1.calculateMaxScrollShift();
    var goPREVIOUS = payload.go === "PREVIOUS";
    if (!goPREVIOUS) {
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) < maxScrollShift)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollTop + win.document.documentElement.offsetHeight) :
                    (win.document.body.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.offsetWidth);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) < maxScrollShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) < maxScrollShift)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft + (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop + win.document.documentElement.clientHeight);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) > 0)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollTop - win.document.documentElement.offsetHeight) :
                    (win.document.body.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.offsetWidth);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollTop" : "scrollLeft", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) > 0) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) > 0)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                var newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft - (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop - win.document.documentElement.clientHeight);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
});
var checkReadyPass = function () {
    if (win.READIUM2.readyPassDone) {
        return;
    }
    win.READIUM2.readyPassDone = true;
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
    }, 800);
    var useResizeSensor = !win.READIUM2.isFixedLayout;
    if (useResizeSensor && win.document.body) {
        setTimeout(function () {
            window.requestAnimationFrame(function (_timestamp) {
                new ResizeSensor(win.document.body, function () {
                    console.log("ResizeSensor");
                    scrollToHashDebounced();
                });
            });
        }, 2000);
    }
    if (win.document.body) {
        win.document.body.addEventListener("click", function (ev) {
            var x = ev.clientX;
            var y = ev.clientY;
            processXYDebounced(x, y);
        });
    }
};
var notifyReady = function () {
    if (win.READIUM2.readyEventSent) {
        return;
    }
    win.READIUM2.readyEventSent = true;
    var payload = {
        href: win.location.href,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_WEBVIEW_READY, payload);
};
function scrollElementIntoView(element) {
    if (readium_css_inject_1.DEBUG_VISUALS) {
        var existings = document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr3 + "]");
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
        element.scrollIntoView({
            behavior: "auto",
            block: "start",
            inline: "start",
        });
    }
}
function scrollIntoView(element) {
    if (!win.document || !win.document.documentElement || !win.document.body || !readium_css_inject_1.isPaginated(win.document)) {
        return;
    }
    var rect = element.getBoundingClientRect();
    var columnDimension = readium_css_1.calculateColumnDimension();
    var isTwoPage = readium_css_1.isTwoPageSpread();
    var fullOffset = (readium_css_1.isRTL() ? ((columnDimension * (isTwoPage ? 2 : 1)) - rect.left) : rect.left) +
        ((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft);
    var columnIndex = Math.floor(fullOffset / columnDimension);
    var spreadIndex = isTwoPage ? Math.floor(columnIndex / 2) : columnIndex;
    win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) *
        (spreadIndex * (columnDimension * (isTwoPage ? 2 : 1)));
}
var scrollToHashRaw = function () {
    if (!win.document || !win.document.documentElement) {
        return;
    }
    var isPaged = readium_css_inject_1.isPaginated(win.document);
    if (win.READIUM2.locationHashOverride) {
        if (win.READIUM2.locationHashOverride === win.document.body) {
            return;
        }
        notifyReady();
        _ignoreScrollEvent = true;
        scrollElementIntoView(win.READIUM2.locationHashOverride);
        notifyReadingLocationDebounced();
        return;
    }
    else if (win.READIUM2.hashElement) {
        win.READIUM2.locationHashOverride = win.READIUM2.hashElement;
        notifyReady();
        _ignoreScrollEvent = true;
        scrollElementIntoView(win.READIUM2.hashElement);
        notifyReadingLocationDebounced();
        return;
    }
    else {
        if (win.document.body) {
            if (win.READIUM2.urlQueryParams) {
                var previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
                var isPreviousNavDirection = previous === "true";
                if (isPreviousNavDirection) {
                    var maxScrollShift = readium_css_1.calculateMaxScrollShift();
                    _ignoreScrollEvent = true;
                    if (isPaged) {
                        if (readium_css_1.isVerticalWritingMode()) {
                            win.document.body.scrollLeft = 0;
                            win.document.body.scrollTop = maxScrollShift;
                        }
                        else {
                            win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxScrollShift;
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
                    win.READIUM2.locationHashOverrideInfo = {
                        cfi: undefined,
                        cssSelector: undefined,
                        paginationInfo: undefined,
                        position: undefined,
                        progression: undefined,
                    };
                    var y = (isPaged ?
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.offsetWidth :
                            win.document.documentElement.offsetHeight) :
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.clientWidth :
                            win.document.documentElement.clientHeight))
                        - 1;
                    processXYRaw(0, y);
                    notifyReady();
                    if (!win.READIUM2.locationHashOverride) {
                        notifyReadingLocationDebounced();
                    }
                    return;
                }
                var gotoCssSelector = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO];
                if (gotoCssSelector) {
                    gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");
                    var selected = null;
                    try {
                        selected = document.querySelector(gotoCssSelector);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    if (selected) {
                        win.READIUM2.locationHashOverride = selected;
                        win.READIUM2.locationHashOverrideInfo = {
                            cfi: undefined,
                            cssSelector: gotoCssSelector,
                            paginationInfo: undefined,
                            position: undefined,
                            progression: undefined,
                        };
                        notifyReady();
                        _ignoreScrollEvent = true;
                        scrollElementIntoView(selected);
                        notifyReadingLocationDebounced();
                        return;
                    }
                }
            }
            win.READIUM2.locationHashOverride = win.document.body;
            win.READIUM2.locationHashOverrideInfo = {
                cfi: undefined,
                cssSelector: undefined,
                paginationInfo: undefined,
                position: undefined,
                progression: undefined,
            };
            _ignoreScrollEvent = true;
            win.document.body.scrollLeft = 0;
            win.document.body.scrollTop = 0;
        }
    }
    notifyReady();
    notifyReadingLocationDebounced();
};
var scrollToHashDebounced = debounce_1.debounce(function () {
    scrollToHashRaw();
}, 500);
var _ignoreScrollEvent = false;
win.addEventListener("DOMContentLoaded", function () {
    if (win.location.hash && win.location.hash.length > 1) {
        win.READIUM2.hashElement = win.document.getElementById(win.location.hash.substr(1));
        if (readium_css_inject_1.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                win.READIUM2.hashElement.setAttribute(styles_1.readPosCssStylesAttr1, "DOMContentLoaded hashElement");
            }
        }
    }
    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.readyPassDone = false;
    win.READIUM2.readyEventSent = false;
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
                console.log("################## READIUM CSS PARSE ERROR?!");
                console.log(base64ReadiumCSS);
                console.log(err);
                console.log(str);
            }
        }
    }
    if (readiumcssJson) {
        win.READIUM2.isFixedLayout = (typeof readiumcssJson.isFixedLayout !== "undefined") ?
            readiumcssJson.isFixedLayout : false;
    }
    var wh = readium_css_inject_1.configureFixedLayout(win.document, win.READIUM2.isFixedLayout, win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight, win.innerWidth, win.innerHeight);
    if (wh) {
        win.READIUM2.fxlViewportWidth = wh.width;
        win.READIUM2.fxlViewportHeight = wh.height;
    }
    if (win.READIUM2.isFixedLayout) {
        notifyReady();
    }
    if (!win.document.documentElement.hasAttribute("data-readiumcss")) {
        readium_css_inject_1.injectDefaultCSS(win.document);
        if (readium_css_inject_1.DEBUG_VISUALS) {
            readium_css_inject_1.injectReadPosCSS(win.document);
        }
    }
    win.document.body.addEventListener("focusin", function (ev) {
        if (!win.document || !win.document.documentElement) {
            return;
        }
        var isPaged = readium_css_inject_1.isPaginated(win.document);
        if (isPaged) {
            setTimeout(function () {
                win.READIUM2.locationHashOverride = ev.target;
                if (win.READIUM2.locationHashOverride) {
                    scrollElementIntoView(win.READIUM2.locationHashOverride);
                }
            }, 30);
        }
    });
    win.document.addEventListener("click", function (e) {
        var href = e.target.href;
        if (!href) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var payload = {
            url: href,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
        return false;
    }, true);
    readium_css_1.computeVerticalRTL();
    if (readiumcssJson) {
        if (readium_css_1.isVerticalWritingMode() ||
            !win.document.documentElement.hasAttribute("data-readiumcss")) {
            readium_css_1.readiumCSS(win.document, readiumcssJson);
        }
    }
});
win.addEventListener("load", function () {
    if (!win.READIUM2.isFixedLayout) {
        scrollToHashRaw();
    }
    checkReadyPass();
});
var processXYRaw = function (x, y) {
    var element;
    var range = document.caretRangeFromPoint(x, y);
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
        win.READIUM2.locationHashOverride = element;
        notifyReadingLocationDebounced();
        if (readium_css_inject_1.DEBUG_VISUALS) {
            var existings = document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr2 + "]");
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
    var maxScrollShift = readium_css_1.calculateMaxScrollShift();
    var totalColumns = readium_css_1.calculateTotalColumns();
    var progressionRatio = 0;
    var currentColumn = 0;
    var spreadIndex = 0;
    if (isPaged) {
        if (maxScrollShift <= 0) {
            progressionRatio = 0;
        }
        else {
            if (readium_css_1.isVerticalWritingMode()) {
                progressionRatio = win.document.body.scrollTop / maxScrollShift;
            }
            else {
                progressionRatio = ((readium_css_1.isRTL() ? -1 : 1) * win.document.body.scrollLeft) / maxScrollShift;
            }
        }
        var adjustedTotalColumns = (totalColumns - (isTwoPage ? 2 : 1));
        currentColumn = adjustedTotalColumns * progressionRatio;
        currentColumn = Math.round(currentColumn);
    }
    else {
        if (maxScrollShift <= 0) {
            progressionRatio = 0;
        }
        else {
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
            var columnDimension = readium_css_1.calculateColumnDimension();
            if (readium_css_1.isVerticalWritingMode()) {
                offset = (currentColumn * win.document.body.scrollWidth) + rect.left +
                    (rect.top >= columnDimension ? win.document.body.scrollWidth : 0);
            }
            else {
                offset = (currentColumn * win.document.body.scrollHeight) + rect.top +
                    (((readium_css_1.isRTL() ?
                        (win.document.documentElement.clientWidth - (rect.left + rect.width)) :
                        rect.left) >= columnDimension) ? win.document.body.scrollHeight : 0);
            }
            progressionRatio = offset /
                ((readium_css_1.isVerticalWritingMode() ? win.document.body.scrollWidth : win.document.body.scrollHeight) *
                    totalColumns);
            currentColumn = totalColumns * progressionRatio;
            currentColumn = Math.floor(currentColumn);
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
exports.computeCFI = function (node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    var cfi = "";
    var currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        var currentElementChildren = currentElement.parentNode.children;
        var currentElementIndex = -1;
        for (var i = 0; i < currentElementChildren.length; i++) {
            if (currentElement === currentElementChildren[i]) {
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
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
var notifyReadingLocationRaw = function () {
    if (!win.READIUM2.locationHashOverride) {
        return;
    }
    var progressionData;
    var cssSelector = cssselector2_1.uniqueCssSelector(win.READIUM2.locationHashOverride, win.document);
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
        cfi: cfi,
        cssSelector: cssSelector,
        paginationInfo: pinfo,
        position: undefined,
        progression: progression,
    };
    var payload = win.READIUM2.locationHashOverrideInfo;
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (readium_css_inject_1.DEBUG_VISUALS) {
        var existings = document.querySelectorAll("*[" + styles_1.readPosCssStylesAttr4 + "]");
        existings.forEach(function (existing) {
            existing.removeAttribute("" + styles_1.readPosCssStylesAttr4);
        });
        win.READIUM2.locationHashOverride.setAttribute(styles_1.readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
var notifyReadingLocationDebounced = debounce_1.debounce(function () {
    notifyReadingLocationRaw();
}, 500);
//# sourceMappingURL=preload.js.map