"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const debounce_1 = require("debounce");
const debug_ = require("debug");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("./common/url-params");
const webview_resize_1 = require("./common/webview-resize");
const highlight_1 = require("./highlight");
const location_1 = require("./location");
const readaloud_1 = require("./readaloud");
const readium_css_1 = require("./readium-css");
const ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
const debug = debug_("r2:navigator#electron/renderer/index");
const win = window;
function readiumCssOnOff(rss) {
    const loc = location_1.getCurrentReadingLocation();
    const activeWebView = win.READIUM2.getActiveWebView();
    if (activeWebView) {
        const payload1 = rss || readium_css_1.__computeReadiumCssJsonMessage(activeWebView.READIUM2.link);
        if (activeWebView.style.transform !== "none") {
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield activeWebView.send("R2_EVENT_HIDE");
            }), 0);
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                location_1.shiftWebview(activeWebView, 0, undefined);
                yield activeWebView.send(events_1.R2_EVENT_READIUMCSS, payload1);
            }), 10);
        }
        else {
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield activeWebView.send(events_1.R2_EVENT_READIUMCSS, payload1);
            }), 0);
        }
    }
    if (loc) {
        setTimeout(() => {
            location_1.handleLinkLocator(loc.locator);
        }, 60);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
function readiumCssUpdate(rss) {
    return readiumCssOnOff(rss);
}
exports.readiumCssUpdate = readiumCssUpdate;
let _webview1;
function createWebViewInternal(preloadScriptPath) {
    const wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    const publicationURL_ = win.READIUM2.publicationURL;
    if (publicationURL_) {
        wv.setAttribute("httpreferrer", publicationURL_);
    }
    wv.setAttribute("style", "display: flex; margin: 0; padding: 0; box-sizing: border-box; " +
        "position: absolute; left: 0; width: 50%; bottom: 0; top: 0;");
    wv.setAttribute("preload", preloadScriptPath);
    if (webview_resize_1.ENABLE_WEBVIEW_RESIZE) {
        wv.setAttribute("disableguestresize", "");
    }
    setTimeout(() => {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", () => {
        wv.clearHistory();
        if (win.READIUM2) {
            readaloud_1.ttsClickEnable(win.READIUM2.ttsClickEnabled);
        }
    });
    wv.addEventListener("ipc-message", (event) => {
        const webview = event.currentTarget;
        const activeWebView = win.READIUM2.getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYDOWN) {
            const payload = event.args[0];
            if (_keyDownEventHandler) {
                _keyDownEventHandler(payload);
            }
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYUP) {
            const payload = event.args[0];
            if (_keyUpEventHandler) {
                _keyUpEventHandler(payload);
            }
        }
        else if (event.channel === events_1.R2_EVENT_CLIPBOARD_COPY) {
            const clipboardInterceptor = win.READIUM2.clipboardInterceptor;
            if (clipboardInterceptor) {
                const payload = event.args[0];
                clipboardInterceptor(payload);
            }
        }
        else if (!highlight_1.highlightsHandleIpcMessage(event.channel, event.args, webview) &&
            !readaloud_1.ttsHandleIpcMessage(event.channel, event.args, webview) &&
            !location_1.locationHandleIpcMessage(event.channel, event.args, webview)) {
            debug("webview1 ipc-message");
            debug(event.channel);
        }
    });
    return wv;
}
if (webview_resize_1.ENABLE_WEBVIEW_RESIZE) {
    const adjustResize = (webview) => {
        const width = webview.clientWidth;
        const height = webview.clientHeight;
        const wc = webview.getWebContents();
        if (wc && wc.setSize && width && height) {
            wc.setSize({
                normal: {
                    height,
                    width,
                },
            });
        }
    };
    const onResizeDebounced = debounce_1.debounce(() => {
        const activeWebView = win.READIUM2.getActiveWebView();
        if (activeWebView) {
            adjustResize(activeWebView);
        }
    }, 200);
    window.addEventListener("resize", () => {
        onResizeDebounced();
    });
}
function createWebView() {
    const preloadScriptPath = win.READIUM2.preloadScriptPath;
    _webview1 = createWebViewInternal(preloadScriptPath);
    _webview1.READIUM2 = {
        id: 1,
        link: undefined,
    };
    _webview1.setAttribute("id", "webview1");
    const domSlidingViewport = win.READIUM2.domSlidingViewport;
    domSlidingViewport.appendChild(_webview1);
}
function destroyWebView() {
    const domSlidingViewport = win.READIUM2.domSlidingViewport;
    domSlidingViewport.removeChild(_webview1);
    _webview1.READIUM2 = undefined;
    _webview1 = undefined;
}
function installNavigatorDOM(publication, publicationURL, rootHtmlElementID, preloadScriptPath, location, enableScreenReaderAccessibilityWebViewHardRefresh, clipboardInterceptor, sessionInfo) {
    const domRootElement = document.getElementById(rootHtmlElementID);
    if (!domRootElement) {
        debug("!rootHtmlElementID ???");
        return;
    }
    const domSlidingViewport = document.createElement("div");
    domSlidingViewport.setAttribute("id", ELEMENT_ID_SLIDING_VIEWPORT);
    domSlidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    win.READIUM2 = {
        DEBUG_VISUALS: false,
        clipboardInterceptor,
        createActiveWebView: createWebView,
        destroyActiveWebView: destroyWebView,
        domRootElement,
        domSlidingViewport,
        enableScreenReaderAccessibilityWebViewHardRefresh: enableScreenReaderAccessibilityWebViewHardRefresh ? true : false,
        getActiveWebView: () => {
            return _webview1;
        },
        preloadScriptPath,
        publication,
        publicationURL,
        sessionInfo,
        ttsClickEnabled: false,
    };
    if (IS_DEV) {
        debug("||||||++||||| installNavigatorDOM: ", JSON.stringify(location));
        const debugVisualz = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisualz);
        win.READIUM2.DEBUG_VISUALS = debugVisualz;
        window.READIUM2.debug = (debugVisuals) => {
            debug("debugVisuals SET: ", debugVisuals);
            win.READIUM2.DEBUG_VISUALS = debugVisuals;
            const activeWebView = win.READIUM2.getActiveWebView();
            if (activeWebView) {
                const payload = { debugVisuals };
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
                }), 0);
            }
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
            }
            setTimeout(() => {
                const loc = location_1.getCurrentReadingLocation();
                if (loc) {
                    location_1.handleLinkLocator(loc.locator);
                }
            }, 100);
        };
        window.READIUM2.debugItems =
            (cssSelector, cssClass, cssStyles) => {
                if (cssStyles) {
                    debug("debugVisuals ITEMS: ", `${cssSelector} --- ${cssClass} --- ${cssStyles}`);
                }
                const activeWebView = win.READIUM2.getActiveWebView();
                if (activeWebView) {
                    const d = win.READIUM2.DEBUG_VISUALS;
                    const payload = { debugVisuals: d, cssSelector, cssClass, cssStyles };
                    setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        yield activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
                    }), 0);
                }
            };
    }
    domRootElement.appendChild(domSlidingViewport);
    createWebView();
    setTimeout(() => {
        location_1.handleLinkLocator(location);
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
let _keyDownEventHandler;
function setKeyDownEventHandler(func) {
    _keyDownEventHandler = func;
}
exports.setKeyDownEventHandler = setKeyDownEventHandler;
let _keyUpEventHandler;
function setKeyUpEventHandler(func) {
    _keyUpEventHandler = func;
}
exports.setKeyUpEventHandler = setKeyUpEventHandler;
//# sourceMappingURL=dom.js.map