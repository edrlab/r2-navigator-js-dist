"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResizeSensor = require("css-element-queries/src/ResizeSensor");
const debounce = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const animateProperty_1 = require("../common/animateProperty");
const cssselector_1 = require("../common/cssselector");
const easings_1 = require("../common/easings");
const querystring_1 = require("../common/querystring");
const url_params_1 = require("../common/url-params");
const epubReadingSystem_1 = require("./epubReadingSystem");
const readium_css_1 = require("./readium-css");
const console_redirect_1 = require("../console-redirect");
console_redirect_1.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
const win = global.window;
win.READIUM2 = {
    fxlViewportHeight: 0,
    fxlViewportWidth: 0,
    hashElement: null,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideCFI: undefined,
    locationHashOverrideCSSselector: undefined,
    readyEventSent: false,
    readyPassDone: false,
    urlQueryParams: undefined,
};
win.READIUM2.urlQueryParams = win.location.search ? querystring_1.getURLQueryParams(win.location.search) : undefined;
if (win.READIUM2.urlQueryParams) {
    let readiumEpubReadingSystemJson = {};
    const base64EpubReadingSystem = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_EPUBREADINGSYSTEM];
    if (base64EpubReadingSystem) {
        try {
            const str = window.atob(base64EpubReadingSystem);
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_SCROLLTO, (_event, payload) => {
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
        console.log("R2_EVENT_SCROLLTO payload.hash: " + payload.hash);
        win.READIUM2.hashElement = win.document.getElementById(payload.hash);
        win.location.href = "#" + payload.hash;
        delayScrollIntoView = true;
    }
    else {
        win.READIUM2.hashElement = null;
    }
    win.READIUM2.readyEventSent = false;
    win.READIUM2.locationHashOverride = undefined;
    if (delayScrollIntoView) {
        setTimeout(() => {
            scrollToHashRaw(false);
        }, 100);
    }
    else {
        scrollToHashRaw(false);
    }
});
let _lastAnimState;
electron_1.ipcRenderer.on(events_1.R2_EVENT_PAGE_TURN, (_event, payload) => {
    if (win.READIUM2.isFixedLayout || !win.document.body) {
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
        return;
    }
    const isPaged = win.document.documentElement.classList.contains("readium-paginated");
    const maxHeightShift = isPaged ?
        ((readium_css_1.isVerticalWritingMode() ?
            (win.document.body.scrollHeight - win.document.documentElement.offsetHeight) :
            (win.document.body.scrollWidth - win.document.documentElement.offsetWidth))) :
        ((readium_css_1.isVerticalWritingMode() ?
            (win.document.body.scrollWidth - win.document.documentElement.clientWidth) :
            (win.document.body.scrollHeight - win.document.documentElement.clientHeight)));
    const goPREVIOUS = payload.go === "PREVIOUS";
    if (!goPREVIOUS) {
        if (isPaged) {
            if (Math.abs(win.document.body.scrollLeft) < maxHeightShift) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = win.document.body.scrollLeft +
                    (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.offsetWidth;
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, "scrollLeft", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
        else {
            if (readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollLeft) < maxHeightShift) ||
                !readium_css_1.isVerticalWritingMode() && (Math.abs(win.document.body.scrollTop) < maxHeightShift)) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft +
                        (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop +
                        win.document.documentElement.clientHeight);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
    }
    else if (goPREVIOUS) {
        if (isPaged) {
            if (Math.abs(win.document.body.scrollLeft) > 0) {
                if (_lastAnimState && _lastAnimState.animating) {
                    win.cancelAnimationFrame(_lastAnimState.id);
                    _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
                }
                const newVal = win.document.body.scrollLeft -
                    (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.offsetWidth;
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, "scrollLeft", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
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
                const newVal = readium_css_1.isVerticalWritingMode() ?
                    (win.document.body.scrollLeft -
                        (readium_css_1.isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (win.document.body.scrollTop -
                        win.document.documentElement.clientHeight);
                _lastAnimState = animateProperty_1.animateProperty(win.cancelAnimationFrame, undefined, readium_css_1.isVerticalWritingMode() ? "scrollLeft" : "scrollTop", 300, win.document.body, newVal, win.requestAnimationFrame, easings_1.easings.easeInOutQuad);
                return;
            }
        }
    }
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
});
const checkReadyPass = () => {
    if (win.READIUM2.readyPassDone) {
        return;
    }
    win.READIUM2.readyPassDone = true;
    if (readium_css_1.DEBUG_VISUALS) {
        if (win.READIUM2.hashElement) {
            win.READIUM2.hashElement.classList.add("readium2-read-pos");
        }
    }
    win.addEventListener("resize", () => {
        readium_css_1.configureFixedLayout(win.READIUM2.isFixedLayout);
        scrollToHashRaw(false);
    });
    setTimeout(() => {
        if (!win.READIUM2.isFixedLayout) {
            scrollToHashRaw(true);
        }
        win.addEventListener("scroll", (_ev) => {
            if (_ignoreScrollEvent) {
                _ignoreScrollEvent = false;
                return;
            }
            const x = (readium_css_1.isRTL() ? win.document.documentElement.offsetWidth - 1 : 0);
            processXY(x, 0);
        });
    }, 800);
    const useResizeSensor = !win.READIUM2.isFixedLayout;
    if (useResizeSensor && win.document.body) {
        setTimeout(() => {
            window.requestAnimationFrame((_timestamp) => {
                new ResizeSensor(win.document.body, () => {
                    console.log("ResizeSensor");
                    scrollToHash();
                });
            });
        }, 2000);
    }
    if (win.document.body) {
        win.document.body.addEventListener("click", (ev) => {
            const x = ev.clientX;
            const y = ev.clientY;
            processXY(x, y);
        });
    }
};
const notifyReady = () => {
    if (win.READIUM2.readyEventSent) {
        return;
    }
    win.READIUM2.readyEventSent = true;
    const payload = {
        href: win.location.href,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_WEBVIEW_READY, payload);
};
function scrollIntoView(element) {
    if (!win.document.body) {
        return;
    }
    let colIndex = (element.offsetTop + (readium_css_1.isRTL() ? -20 : +20)) / win.document.body.scrollHeight;
    colIndex = Math.ceil(colIndex);
    const isTwoPage = win.document.documentElement.offsetWidth > win.document.body.offsetWidth;
    const spreadIndex = isTwoPage ? Math.ceil(colIndex / 2) : colIndex;
    const left = ((spreadIndex - 1) * win.document.documentElement.offsetWidth);
    win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * left;
}
const scrollToHashRaw = (firstCall) => {
    const isPaged = win.document.documentElement.classList.contains("readium-paginated");
    if (win.READIUM2.locationHashOverride) {
        if (win.READIUM2.locationHashOverride === win.document.body) {
            console.log("body...");
            return;
        }
        notifyReady();
        notifyReadingLocation();
        _ignoreScrollEvent = true;
        if (isPaged) {
            scrollIntoView(win.READIUM2.locationHashOverride);
        }
        else {
            win.READIUM2.locationHashOverride.scrollIntoView({
                behavior: "instant",
                block: "start",
                inline: "start",
            });
        }
        return;
    }
    else if (win.READIUM2.hashElement) {
        console.log("win.READIUM2.hashElement");
        win.READIUM2.locationHashOverride = win.READIUM2.hashElement;
        notifyReady();
        notifyReadingLocation();
        if (!firstCall) {
            _ignoreScrollEvent = true;
            if (isPaged) {
                scrollIntoView(win.READIUM2.hashElement);
            }
            else {
                win.READIUM2.hashElement.scrollIntoView({
                    behavior: "instant",
                    block: "start",
                    inline: "start",
                });
            }
        }
        return;
    }
    else {
        if (win.document.body) {
            if (win.READIUM2.urlQueryParams) {
                const previous = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_PREVIOUS];
                const isPreviousNavDirection = previous === "true";
                if (isPreviousNavDirection) {
                    console.log(url_params_1.URL_PARAM_PREVIOUS);
                    const maxHeightShift = isPaged ?
                        ((readium_css_1.isVerticalWritingMode() ?
                            (win.document.body.scrollHeight - win.document.documentElement.offsetHeight) :
                            (win.document.body.scrollWidth - win.document.documentElement.offsetWidth))) :
                        ((readium_css_1.isVerticalWritingMode() ?
                            (win.document.body.scrollWidth - win.document.documentElement.clientWidth) :
                            (win.document.body.scrollHeight - win.document.documentElement.clientHeight)));
                    _ignoreScrollEvent = true;
                    if (isPaged) {
                        if (readium_css_1.isVerticalWritingMode()) {
                            win.document.body.scrollLeft = 0;
                            win.document.body.scrollTop = maxHeightShift;
                        }
                        else {
                            win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxHeightShift;
                            win.document.body.scrollTop = 0;
                        }
                    }
                    else {
                        if (readium_css_1.isVerticalWritingMode()) {
                            win.document.body.scrollLeft = (readium_css_1.isRTL() ? -1 : 1) * maxHeightShift;
                            win.document.body.scrollTop = 0;
                        }
                        else {
                            win.document.body.scrollLeft = 0;
                            win.document.body.scrollTop = maxHeightShift;
                        }
                    }
                    win.READIUM2.locationHashOverride = undefined;
                    win.READIUM2.locationHashOverrideCSSselector = undefined;
                    processXYRaw(0, (isPaged ?
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.offsetWidth :
                            win.document.documentElement.offsetHeight) :
                        (readium_css_1.isVerticalWritingMode() ?
                            win.document.documentElement.clientWidth :
                            win.document.documentElement.clientHeight))
                        - 1);
                    console.log("BOTTOM (previous):");
                    console.log(win.READIUM2.locationHashOverride);
                    notifyReady();
                    notifyReadingLocation();
                    return;
                }
                let gotoCssSelector = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_GOTO];
                if (gotoCssSelector) {
                    gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");
                    let selected = null;
                    try {
                        selected = document.querySelector(gotoCssSelector);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    if (selected) {
                        win.READIUM2.locationHashOverride = selected;
                        win.READIUM2.locationHashOverrideCSSselector = gotoCssSelector;
                        notifyReady();
                        notifyReadingLocation();
                        _ignoreScrollEvent = true;
                        if (isPaged) {
                            scrollIntoView(selected);
                        }
                        else {
                            selected.scrollIntoView({
                                behavior: "instant",
                                block: "start",
                                inline: "start",
                            });
                        }
                        return;
                    }
                }
            }
            console.log("win.READIUM2.locationHashOverride = win.document.body");
            win.READIUM2.locationHashOverride = win.document.body;
            win.READIUM2.locationHashOverrideCSSselector = undefined;
            _ignoreScrollEvent = true;
            win.document.body.scrollLeft = 0;
            win.document.body.scrollTop = 0;
        }
    }
    notifyReady();
    notifyReadingLocation();
};
const scrollToHash = debounce(() => {
    scrollToHashRaw(false);
}, 500);
let _ignoreScrollEvent = false;
win.addEventListener("load", () => {
    checkReadyPass();
});
win.addEventListener("DOMContentLoaded", () => {
    if (win.location.hash && win.location.hash.length > 1) {
        win.READIUM2.hashElement = win.document.getElementById(win.location.hash.substr(1));
    }
    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.readyPassDone = false;
    win.READIUM2.readyEventSent = false;
    let readiumcssJson = {};
    if (win.READIUM2.urlQueryParams) {
        const base64ReadiumCSS = win.READIUM2.urlQueryParams[url_params_1.URL_PARAM_CSS];
        if (base64ReadiumCSS) {
            try {
                const str = window.atob(base64ReadiumCSS);
                readiumcssJson = JSON.parse(str);
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    win.READIUM2.isFixedLayout = readiumcssJson && readiumcssJson.isFixedLayout;
    readium_css_1.configureFixedLayout(win.READIUM2.isFixedLayout);
    if (win.READIUM2.isFixedLayout) {
        notifyReady();
    }
    readium_css_1.injectDefaultCSS();
    if (readium_css_1.DEBUG_VISUALS) {
        readium_css_1.injectReadPosCSS();
    }
    win.document.body.addEventListener("focusin", (ev) => {
        const isPaged = win.document.documentElement.classList.contains("readium-paginated");
        if (isPaged) {
            setTimeout(() => {
                win.READIUM2.locationHashOverride = ev.target;
                scrollIntoView(ev.target);
            }, 30);
        }
    });
    win.document.addEventListener("click", (e) => {
        const href = e.target.href;
        if (!href) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const payload = {
            url: href,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_LINK, payload);
        return false;
    }, true);
    if (readiumcssJson) {
        readium_css_1.readiumCSS(readiumcssJson);
    }
});
const processXYRaw = (x, y) => {
    let element;
    const range = document.caretRangeFromPoint(x, y);
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
    if (readium_css_1.DEBUG_VISUALS) {
        const existings = document.querySelectorAll(".readium2-read-pos, .readium2-read-pos2");
        existings.forEach((existing) => {
            existing.classList.remove("readium2-read-pos");
            existing.classList.remove("readium2-read-pos2");
        });
    }
    if (element) {
        win.READIUM2.locationHashOverride = element;
        notifyReadingLocation();
        if (readium_css_1.DEBUG_VISUALS) {
            element.classList.add("readium2-read-pos2");
        }
    }
};
const processXY = debounce((x, y) => {
    processXYRaw(x, y);
}, 300);
exports.computeCFI = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    let cfi = "";
    let currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        const currentElementChildren = currentElement.parentNode.children;
        let currentElementIndex = -1;
        for (let i = 0; i < currentElementChildren.length; i++) {
            if (currentElement === currentElementChildren[i]) {
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
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
const notifyReadingLocation = () => {
    if (!win.READIUM2.locationHashOverride) {
        return;
    }
    win.READIUM2.locationHashOverrideCSSselector = cssselector_1.fullQualifiedSelector(win.READIUM2.locationHashOverride, false);
    win.READIUM2.locationHashOverrideCFI = exports.computeCFI(win.READIUM2.locationHashOverride);
    const payload = {
        cfi: win.READIUM2.locationHashOverrideCFI,
        cssSelector: win.READIUM2.locationHashOverrideCSSselector,
    };
    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    if (readium_css_1.DEBUG_VISUALS) {
        win.READIUM2.locationHashOverride.classList.add("readium2-read-pos");
        console.log("notifyReadingLocation CSS SELECTOR: " + win.READIUM2.locationHashOverrideCSSselector);
        console.log("notifyReadingLocation CFI: " + win.READIUM2.locationHashOverrideCFI);
    }
};
//# sourceMappingURL=preload.js.map