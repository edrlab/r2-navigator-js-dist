"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var debounce_1 = require("debounce");
var debug_ = require("debug");
var events_1 = require("../common/events");
var sessions_1 = require("../common/sessions");
var url_params_1 = require("./common/url-params");
var webview_resize_1 = require("./common/webview-resize");
var highlight_1 = require("./highlight");
var location_1 = require("./location");
var readaloud_1 = require("./readaloud");
var readium_css_1 = require("./readium-css");
var ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
var debug = debug_("r2:navigator#electron/renderer/index");
function readiumCssOnOff() {
    var loc = location_1.getCurrentReadingLocation();
    var activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView) {
        var payload1_1 = readium_css_1.__computeReadiumCssJsonMessage(activeWebView.READIUM2.link);
        if (activeWebView.style.transform !== "none") {
            activeWebView.send("R2_EVENT_HIDE");
            setTimeout(function () {
                location_1.shiftWebview(activeWebView, 0, undefined);
                activeWebView.send(events_1.R2_EVENT_READIUMCSS, payload1_1);
            }, 10);
        }
        else {
            activeWebView.send(events_1.R2_EVENT_READIUMCSS, payload1_1);
        }
    }
    if (loc) {
        setTimeout(function () {
            location_1.handleLinkLocator(loc.locator);
        }, 60);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
var _webview1;
function createWebViewInternal(preloadScriptPath) {
    var wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    var publicationURL_ = window.READIUM2.publicationURL;
    if (publicationURL_) {
        wv.setAttribute("httpreferrer", publicationURL_);
    }
    wv.setAttribute("style", "display: flex; margin: 0; padding: 0; box-sizing: border-box; " +
        "position: absolute; left: 0; width: 50%; bottom: 0; top: 0;");
    wv.setAttribute("preload", preloadScriptPath);
    if (webview_resize_1.ENABLE_WEBVIEW_RESIZE) {
        wv.setAttribute("disableguestresize", "");
    }
    setTimeout(function () {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", function () {
        wv.clearHistory();
        if (window.READIUM2) {
            readaloud_1.ttsClickEnable(window.READIUM2.ttsClickEnabled);
        }
    });
    wv.addEventListener("ipc-message", function (event) {
        var webview = event.currentTarget;
        var activeWebView = window.READIUM2.getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYDOWN) {
            var payload = event.args[0];
            if (_keyDownEventHandler) {
                _keyDownEventHandler(payload);
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
    var adjustResize_1 = function (webview) {
        var width = webview.clientWidth;
        var height = webview.clientHeight;
        var wc = webview.getWebContents();
        if (wc && wc.setSize && width && height) {
            wc.setSize({
                normal: {
                    height: height,
                    width: width,
                },
            });
        }
    };
    var onResizeDebounced_1 = debounce_1.debounce(function () {
        var activeWebView = window.READIUM2.getActiveWebView();
        if (activeWebView) {
            adjustResize_1(activeWebView);
        }
    }, 200);
    window.addEventListener("resize", function () {
        onResizeDebounced_1();
    });
}
function createWebView() {
    var preloadScriptPath = window.READIUM2.preloadScriptPath;
    _webview1 = createWebViewInternal(preloadScriptPath);
    _webview1.READIUM2 = {
        id: 1,
        link: undefined,
    };
    _webview1.setAttribute("id", "webview1");
    var domSlidingViewport = window.READIUM2.domSlidingViewport;
    domSlidingViewport.appendChild(_webview1);
}
function destroyWebView() {
    var domSlidingViewport = window.READIUM2.domSlidingViewport;
    domSlidingViewport.removeChild(_webview1);
    _webview1.READIUM2 = undefined;
    _webview1 = undefined;
}
function installNavigatorDOM(publication, publicationURL, rootHtmlElementID, preloadScriptPath, location, enableScreenReaderAccessibilityWebViewHardRefresh) {
    var domRootElement = document.getElementById(rootHtmlElementID);
    if (!domRootElement) {
        debug("!rootHtmlElementID ???");
        return;
    }
    var domSlidingViewport = document.createElement("div");
    domSlidingViewport.setAttribute("id", ELEMENT_ID_SLIDING_VIEWPORT);
    domSlidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    window.READIUM2 = {
        DEBUG_VISUALS: false,
        createActiveWebView: createWebView,
        destroyActiveWebView: destroyWebView,
        domRootElement: domRootElement,
        domSlidingViewport: domSlidingViewport,
        enableScreenReaderAccessibilityWebViewHardRefresh: enableScreenReaderAccessibilityWebViewHardRefresh ? true : false,
        getActiveWebView: function () {
            return _webview1;
        },
        preloadScriptPath: preloadScriptPath,
        publication: publication,
        publicationURL: publicationURL,
        ttsClickEnabled: false,
    };
    if (IS_DEV) {
        debug("||||||++||||| installNavigatorDOM: ", JSON.stringify(location));
        var debugVisualz = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisualz);
        window.READIUM2.DEBUG_VISUALS = debugVisualz;
        window.READIUM2.debug = function (debugVisuals) {
            debug("debugVisuals SET: ", debugVisuals);
            window.READIUM2.DEBUG_VISUALS = debugVisuals;
            var activeWebView = window.READIUM2.getActiveWebView();
            if (activeWebView) {
                var payload = { debugVisuals: debugVisuals };
                activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
            }
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
            }
            setTimeout(function () {
                var loc = location_1.getCurrentReadingLocation();
                if (loc) {
                    location_1.handleLinkLocator(loc.locator);
                }
            }, 100);
        };
        window.READIUM2.debugItems =
            function (cssSelector, cssClass, cssStyles) {
                if (cssStyles) {
                    debug("debugVisuals ITEMS: ", cssSelector + " --- " + cssClass + " --- " + cssStyles);
                }
                var activeWebView = window.READIUM2.getActiveWebView();
                if (activeWebView) {
                    var d = window.READIUM2.DEBUG_VISUALS;
                    var payload = { debugVisuals: d, cssSelector: cssSelector, cssClass: cssClass, cssStyles: cssStyles };
                    activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
                }
            };
    }
    domRootElement.appendChild(domSlidingViewport);
    createWebView();
    setTimeout(function () {
        location_1.handleLinkLocator(location);
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
var _keyDownEventHandler;
function setKeyDownEventHandler(func) {
    _keyDownEventHandler = func;
}
exports.setKeyDownEventHandler = setKeyDownEventHandler;
//# sourceMappingURL=dom.js.map