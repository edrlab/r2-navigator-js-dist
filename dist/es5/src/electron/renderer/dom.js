"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKeyUpEventHandler = exports.setKeyDownEventHandler = exports.installNavigatorDOM = exports.readiumCssUpdate = exports.readiumCssOnOff = exports.fixedLayoutZoomPercent = void 0;
var tslib_1 = require("tslib");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var debug_ = require("debug");
var electron_1 = require("electron");
var media_overlays_1 = require("./media-overlays");
var context_menu_1 = require("../common/context-menu");
var events_1 = require("../common/events");
var readium_css_settings_1 = require("../common/readium-css-settings");
var sessions_1 = require("../common/sessions");
var styles_1 = require("../common/styles");
var url_params_1 = require("./common/url-params");
var highlight_1 = require("./highlight");
var location_1 = require("./location");
var media_overlays_2 = require("./media-overlays");
var readaloud_1 = require("./readaloud");
var readium_css_1 = require("./readium-css");
var soundtrack_1 = require("./soundtrack");
var ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
var ELEMENT_ID_CAPTIONS = "r2_navigator_captions_overlay";
var ELEMENT_ID_READIUM_CSS_STYLE = "r2_navigator_readium_css";
var captionsOverlayCssStyles = "\n    overflow: hidden;\n    overflow-y: auto;\n    display: flex;\n    justify-content: center;\n    position: absolute;\n    left: 0;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    box-sizing: border-box;\n    border: 0;\n    margin: 0;\n    padding: 2em;\n    line-height: initial;\n    user-select: none;\n".replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
var captionsOverlayParaCssStyles = "\n    margin: 0;\n    margin-top: auto;\n    margin-bottom: auto;\n    padding: 0;\n    max-width: 900px;\n    font-weight: bolder;\n    text-align: center;\n".replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
var readiumCssStyle = "\n@font-face {\nfont-family: AccessibleDfA;\nfont-style: normal;\nfont-weight: normal;\nsrc: local(\"AccessibleDfA\"),\nurl(\"{RCSS_BASE_URL}fonts/AccessibleDfA.otf\") format(\"opentype\");\n}\n\n@font-face {\nfont-family: \"IA Writer Duospace\";\nfont-style: normal;\nfont-weight: normal;\nsrc: local(\"iAWriterDuospace-Regular\"),\nurl(\"{RCSS_BASE_URL}fonts/iAWriterDuospace-Regular.ttf\") format(\"truetype\");\n}\n";
var debug = debug_("r2:navigator#electron/renderer/index");
var win = global.window;
var _resizeSkip = 0;
var _resizeWebviewsNeedReset = true;
var _resizeTimeout;
win.addEventListener("resize", function () {
    var e_1, _a;
    var _b, _c, _d;
    if (!win.READIUM2) {
        return;
    }
    if (((_d = (_c = (_b = win.READIUM2.publication) === null || _b === void 0 ? void 0 : _b.Metadata) === null || _c === void 0 ? void 0 : _c.Rendition) === null || _d === void 0 ? void 0 : _d.Layout) !== "fixed") {
        return;
    }
    if (_resizeSkip > 0) {
        debug("Window resize (TOP), SKIP ...", _resizeSkip);
        return;
    }
    if (_resizeWebviewsNeedReset) {
        _resizeWebviewsNeedReset = false;
        debug("Window resize (TOP), IMMEDIATE");
        var activeWebViews = win.READIUM2.getActiveWebViews();
        try {
            for (var activeWebViews_1 = tslib_1.__values(activeWebViews), activeWebViews_1_1 = activeWebViews_1.next(); !activeWebViews_1_1.done; activeWebViews_1_1 = activeWebViews_1.next()) {
                var activeWebView = activeWebViews_1_1.value;
                var wvSlot = activeWebView.getAttribute("data-wv-slot");
                if (wvSlot) {
                    debug("Window resize (TOP), IMMEDIATE ... setWebViewStyle");
                    (0, location_1.setWebViewStyle)(activeWebView, wvSlot);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (activeWebViews_1_1 && !activeWebViews_1_1.done && (_a = activeWebViews_1.return)) _a.call(activeWebViews_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    if (_resizeTimeout) {
        clearTimeout(_resizeTimeout);
    }
    _resizeTimeout = win.setTimeout(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var activeWebViews, activeWebViews_2, activeWebViews_2_1, activeWebView, wvSlot, e_2, e_3_1;
        var e_3, _a;
        var _b;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    debug("Window resize (TOP), DEFERRED");
                    _resizeTimeout = undefined;
                    _resizeWebviewsNeedReset = true;
                    activeWebViews = win.READIUM2.getActiveWebViews();
                    _resizeSkip = activeWebViews.length;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 9, 10, 11]);
                    activeWebViews_2 = tslib_1.__values(activeWebViews), activeWebViews_2_1 = activeWebViews_2.next();
                    _c.label = 2;
                case 2:
                    if (!!activeWebViews_2_1.done) return [3, 8];
                    activeWebView = activeWebViews_2_1.value;
                    wvSlot = activeWebView.getAttribute("data-wv-slot");
                    if (!wvSlot) return [3, 7];
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 6, , 7]);
                    if (!((_b = activeWebView.READIUM2) === null || _b === void 0 ? void 0 : _b.DOMisReady)) return [3, 5];
                    return [4, activeWebView.send("R2_EVENT_WINDOW_RESIZE", win.READIUM2.fixedLayoutZoomPercent)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [3, 7];
                case 6:
                    e_2 = _c.sent();
                    debug(e_2);
                    return [3, 7];
                case 7:
                    activeWebViews_2_1 = activeWebViews_2.next();
                    return [3, 2];
                case 8: return [3, 11];
                case 9:
                    e_3_1 = _c.sent();
                    e_3 = { error: e_3_1 };
                    return [3, 11];
                case 10:
                    try {
                        if (activeWebViews_2_1 && !activeWebViews_2_1.done && (_a = activeWebViews_2.return)) _a.call(activeWebViews_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                    return [7];
                case 11: return [2];
            }
        });
    }); }, 1000);
});
electron_1.ipcRenderer.on("accessibility-support-changed", function (_e, accessibilitySupportEnabled) {
    if (!win.READIUM2) {
        return;
    }
    debug("accessibility-support-changed event received in WebView ", accessibilitySupportEnabled);
    win.READIUM2.isScreenReaderMounted = accessibilitySupportEnabled;
});
function readiumCssApplyToWebview(loc, activeWebView, rcss) {
    var _this = this;
    var _a;
    var actualReadiumCss = (0, readium_css_1.obtainReadiumCss)(rcss);
    activeWebView.READIUM2.readiumCss = actualReadiumCss;
    var payloadRcss = (0, readium_css_1.adjustReadiumCssJsonMessageForFixedLayout)(activeWebView, actualReadiumCss);
    if (activeWebView.style.transform &&
        activeWebView.style.transform !== "none" &&
        !activeWebView.hasAttribute("data-wv-fxl")) {
        activeWebView.style.opacity = "0";
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        (0, location_1.shiftWebview)(activeWebView, 0, undefined);
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 10);
    }
    else {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    }
    if (loc && loc.locator.href === ((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href)) {
        setTimeout(function () {
            debug("readiumCssOnOff -> handleLinkLocator");
            (0, location_1.handleLinkLocator)(loc.locator, actualReadiumCss);
        }, 60);
    }
}
var _fixedLayoutZoomPercentTimers = {};
function fixedLayoutZoomPercent(zoomPercent) {
    var e_4, _a;
    var _this = this;
    win.READIUM2.domSlidingViewport.style.overflow = zoomPercent === 0 ? "hidden" : "auto";
    if (win.READIUM2) {
        win.READIUM2.fixedLayoutZoomPercent = zoomPercent;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_1 = function (activeWebView) {
        if (_fixedLayoutZoomPercentTimers[activeWebView.id]) {
            win.clearTimeout(_fixedLayoutZoomPercentTimers[activeWebView.id]);
            _fixedLayoutZoomPercentTimers[activeWebView.id] = undefined;
        }
        var wvSlot = activeWebView.getAttribute("data-wv-slot");
        if (wvSlot) {
            debug("fixedLayoutZoomPercent ... setWebViewStyle");
            (0, location_1.setWebViewStyle)(activeWebView, wvSlot);
            _fixedLayoutZoomPercentTimers[activeWebView.id] = win.setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var e_5;
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            _fixedLayoutZoomPercentTimers[activeWebView.id] = undefined;
                            if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                            return [4, activeWebView.send("R2_EVENT_WINDOW_RESIZE", zoomPercent)];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2: return [3, 4];
                        case 3:
                            e_5 = _b.sent();
                            debug(e_5);
                            return [3, 4];
                        case 4: return [2];
                    }
                });
            }); }, 500);
        }
    };
    try {
        for (var activeWebViews_3 = tslib_1.__values(activeWebViews), activeWebViews_3_1 = activeWebViews_3.next(); !activeWebViews_3_1.done; activeWebViews_3_1 = activeWebViews_3.next()) {
            var activeWebView = activeWebViews_3_1.value;
            _loop_1(activeWebView);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (activeWebViews_3_1 && !activeWebViews_3_1.done && (_a = activeWebViews_3.return)) _a.call(activeWebViews_3);
        }
        finally { if (e_4) throw e_4.error; }
    }
}
exports.fixedLayoutZoomPercent = fixedLayoutZoomPercent;
function readiumCssOnOff(rcss) {
    var e_6, _a;
    var loc = (0, location_1.getCurrentReadingLocation)();
    var activeWebViews = win.READIUM2.getActiveWebViews();
    try {
        for (var activeWebViews_4 = tslib_1.__values(activeWebViews), activeWebViews_4_1 = activeWebViews_4.next(); !activeWebViews_4_1.done; activeWebViews_4_1 = activeWebViews_4.next()) {
            var activeWebView = activeWebViews_4_1.value;
            readiumCssApplyToWebview(loc, activeWebView, rcss);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (activeWebViews_4_1 && !activeWebViews_4_1.done && (_a = activeWebViews_4.return)) _a.call(activeWebViews_4);
        }
        finally { if (e_6) throw e_6.error; }
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
function readiumCssUpdate(rcss) {
    return readiumCssOnOff(rcss);
}
exports.readiumCssUpdate = readiumCssUpdate;
var _webview1;
var _webview2;
function createWebViewInternal(preloadScriptPath) {
    var wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "enableRemoteModule=0, allowRunningInsecureContent=0, backgroundThrottling=0, nodeIntegration=0, contextIsolation=0, nodeIntegrationInWorker=0, sandbox=0, webSecurity=1, webviewTag=0, partition=".concat(sessions_1.R2_SESSION_WEBVIEW));
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    var publicationURL_ = win.READIUM2.publicationURL;
    if (publicationURL_) {
        wv.setAttribute("httpreferrer", publicationURL_);
    }
    debug("createWebViewInternal ... setWebViewStyle");
    (0, location_1.setWebViewStyle)(wv, styles_1.WebViewSlotEnum.center);
    wv.setAttribute("preload", preloadScriptPath);
    wv.addEventListener("did-start-loading", function () {
        debug("DOMisReady... did-start-loading => false");
        wv.READIUM2.DOMisReady = false;
    });
    wv.addEventListener("did-navigate-in-page", function () {
        debug("DOMisReady... did-navigate-in-page => true");
        wv.READIUM2.DOMisReady = true;
    });
    wv.addEventListener("dom-ready", function () {
        debug("DOMisReady... dom-ready => true");
        wv.READIUM2.DOMisReady = true;
        wv.clearHistory();
        if (IS_DEV) {
            electron_1.ipcRenderer.send(context_menu_1.CONTEXT_MENU_SETUP, wv.getWebContentsId());
        }
        if (win.READIUM2) {
            (0, readaloud_1.ttsVoice)(win.READIUM2.ttsVoice);
            (0, readaloud_1.ttsPlaybackRate)(win.READIUM2.ttsPlaybackRate);
            (0, readaloud_1.ttsClickEnable)(win.READIUM2.ttsClickEnabled);
            (0, readaloud_1.ttsSentenceDetectionEnable)(win.READIUM2.ttsSentenceDetectionEnabled);
            (0, readaloud_1.ttsSkippabilityEnable)(win.READIUM2.ttsSkippabilityEnabled);
            (0, readaloud_1.ttsOverlayEnable)(win.READIUM2.ttsOverlayEnabled);
        }
        (0, readaloud_1.checkTtsState)(wv);
    });
    wv.addEventListener("ipc-message", function (event) {
        var _a, _b;
        var webview = event.currentTarget;
        if (webview !== wv) {
            debug("Wrong navigator webview?!");
            return;
        }
        if (event.channel === events_1.R2_EVENT_MEDIA_OVERLAY_INTERRUPT) {
            (0, media_overlays_1.mediaOverlaysInterrupt)();
        }
        else if (event.channel === events_1.R2_EVENT_KEYBOARD_FOCUS_REQUEST) {
            debug("KEYBOARD FOCUS REQUEST (2) ", webview.id, (_a = win.document.activeElement) === null || _a === void 0 ? void 0 : _a.id);
            if (win.document.activeElement && win.document.activeElement.blur) {
                win.document.activeElement.blur();
            }
            var iframe = (_b = webview.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("iframe");
            if (iframe) {
                iframe.focus();
            }
            else {
                webview.focus();
            }
        }
        else if (event.channel === events_1.R2_EVENT_SHOW) {
            webview.style.opacity = "1";
        }
        else if (event.channel === events_1.R2_EVENT_FXL_CONFIGURE) {
            var payload = event.args[0];
            debug("R2_EVENT_FXL_CONFIGURE ... setWebViewStyle");
            if (payload.fxl) {
                (0, location_1.setWebViewStyle)(webview, styles_1.WebViewSlotEnum.center, payload.fxl);
            }
            else {
                (0, location_1.setWebViewStyle)(webview, styles_1.WebViewSlotEnum.center, null);
            }
            _resizeSkip--;
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYDOWN) {
            var payload = event.args[0];
            if (_keyDownEventHandler) {
                _keyDownEventHandler(payload, payload.elementName, payload.elementAttributes);
            }
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYUP) {
            var payload = event.args[0];
            if (_keyUpEventHandler) {
                _keyUpEventHandler(payload, payload.elementName, payload.elementAttributes);
            }
        }
        else if (event.channel === events_1.R2_EVENT_CAPTIONS) {
            var payload = event.args[0];
            var captionElement = win.document.getElementById(ELEMENT_ID_CAPTIONS);
            var rssStyleElement = win.document.getElementById(ELEMENT_ID_READIUM_CSS_STYLE);
            var rootElement = win.document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT);
            if (payload.text && rootElement) {
                if (!rssStyleElement) {
                    var urlStr = win.READIUM2.publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
                        (0, sessions_1.convertCustomSchemeToHttpUrl)(win.READIUM2.publicationURL) :
                        win.READIUM2.publicationURL;
                    var rcssUrl = new URL(urlStr);
                    rcssUrl.pathname = "".concat(readium_css_settings_1.READIUM_CSS_URL_PATH, "/");
                    rssStyleElement = win.document.createElement("style");
                    rssStyleElement.setAttribute("id", ELEMENT_ID_READIUM_CSS_STYLE);
                    var styleTxtNode = win.document.createTextNode(readiumCssStyle.replace(/{RCSS_BASE_URL}/g, rcssUrl.toString()));
                    rssStyleElement.appendChild(styleTxtNode);
                    win.document.head.appendChild(rssStyleElement);
                }
                if (!captionElement) {
                    captionElement = win.document.createElement("div");
                    captionElement.setAttribute("id", ELEMENT_ID_CAPTIONS);
                    var para = win.document.createElement("p");
                    captionElement.appendChild(para);
                    rootElement.appendChild(captionElement);
                }
                captionElement.setAttribute("style", captionsOverlayCssStyles +
                    (payload.containerStyle ? " ".concat(payload.containerStyle) : " "));
                var p = captionElement.firstElementChild;
                if (p) {
                    p.setAttribute("style", captionsOverlayParaCssStyles +
                        (payload.textStyle ? " ".concat(payload.textStyle) : " "));
                    p.textContent = payload.text;
                }
            }
            else {
                if (captionElement && captionElement.parentNode) {
                    captionElement.parentNode.removeChild(captionElement);
                }
            }
        }
        else if (event.channel === events_1.R2_EVENT_CLIPBOARD_COPY) {
            var clipboardInterceptor = win.READIUM2.clipboardInterceptor;
            if (clipboardInterceptor) {
                var payload = event.args[0];
                clipboardInterceptor(payload);
            }
        }
        else if (event.channel === events_1.R2_EVENT_PAGE_TURN_RES &&
            event.args[0].go === "" &&
            event.args[0].direction === "") {
            (0, readaloud_1.checkTtsState)(wv);
        }
        else if (!(0, highlight_1.highlightsHandleIpcMessage)(event.channel, event.args, webview) &&
            !(0, readaloud_1.ttsHandleIpcMessage)(event.channel, event.args, webview) &&
            !(0, location_1.locationHandleIpcMessage)(event.channel, event.args, webview) &&
            !(0, media_overlays_2.mediaOverlaysHandleIpcMessage)(event.channel, event.args, webview) &&
            !(0, soundtrack_1.soundtrackHandleIpcMessage)(event.channel, event.args, webview)) {
            debug("webview ipc-message");
            debug(event.channel);
        }
    });
    return wv;
}
function createWebView(second) {
    var preloadScriptPath = win.READIUM2.preloadScriptPath;
    var domSlidingViewport = win.READIUM2.domSlidingViewport;
    if (second) {
        if (_webview2) {
            destroyWebView(true);
        }
        _webview2 = createWebViewInternal(preloadScriptPath);
        _webview2.READIUM2 = {
            id: 2,
            link: undefined,
            readiumCss: undefined,
        };
        _webview2.setAttribute("id", "r2_webview2");
        domSlidingViewport.appendChild(_webview2);
    }
    else {
        if (_webview1) {
            destroyWebView(false);
        }
        _webview1 = createWebViewInternal(preloadScriptPath);
        _webview1.READIUM2 = {
            id: 1,
            link: undefined,
            readiumCss: undefined,
        };
        _webview1.setAttribute("id", "r2_webview1");
        domSlidingViewport.appendChild(_webview1);
    }
}
function destroyWebView(second) {
    var domSlidingViewport = win.READIUM2.domSlidingViewport;
    if (second) {
        if (_webview2) {
            domSlidingViewport.removeChild(_webview2);
            _webview2.READIUM2 = undefined;
            _webview2 = undefined;
        }
    }
    else {
        if (_webview1) {
            domSlidingViewport.removeChild(_webview1);
            _webview1.READIUM2 = undefined;
            _webview1 = undefined;
        }
    }
}
function installNavigatorDOM(publication, publicationURL, rootHtmlElementID, preloadScriptPath, location, enableScreenReaderAccessibilityWebViewHardRefresh, clipboardInterceptor, sessionInfo, rcss) {
    var _this = this;
    var domRootElement = document.getElementById(rootHtmlElementID);
    if (!domRootElement) {
        debug("!rootHtmlElementID ???");
        return;
    }
    var domSlidingViewport = document.createElement("div");
    domSlidingViewport.setAttribute("id", ELEMENT_ID_SLIDING_VIEWPORT);
    domSlidingViewport.setAttribute("style", "display: block; position: relative; width: 100%; height: 100%; " +
        "margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    win.READIUM2 = {
        DEBUG_VISUALS: false,
        clipboardInterceptor: clipboardInterceptor,
        createFirstWebView: createWebView,
        createSecondWebView: function () {
            createWebView(true);
        },
        destroyFirstWebView: destroyWebView,
        destroySecondWebView: function () {
            destroyWebView(true);
        },
        domRootElement: domRootElement,
        domSlidingViewport: domSlidingViewport,
        enableScreenReaderAccessibilityWebViewHardRefresh: enableScreenReaderAccessibilityWebViewHardRefresh ? false : false,
        fixedLayoutZoomPercent: 0,
        getActiveWebViews: function () {
            var arr = [];
            if (_webview1) {
                arr.push(_webview1);
            }
            if (_webview2) {
                arr.push(_webview2);
            }
            return arr;
        },
        getFirstOrSecondWebView: function () {
            return _webview1 ? _webview1 : _webview2;
        },
        getFirstWebView: function () {
            return _webview1;
        },
        getSecondWebView: function (create) {
            if (!_webview2 && create) {
                createWebView(true);
            }
            return _webview2;
        },
        isScreenReaderMounted: false,
        preloadScriptPath: preloadScriptPath,
        publication: publication,
        publicationURL: publicationURL,
        sessionInfo: sessionInfo,
        ttsClickEnabled: false,
        ttsOverlayEnabled: false,
        ttsPlaybackRate: 1,
        ttsSkippabilityEnabled: false,
        ttsSentenceDetectionEnabled: true,
        ttsVoice: null,
    };
    electron_1.ipcRenderer.send("accessibility-support-changed");
    if (IS_DEV) {
        debug("||||||++||||| installNavigatorDOM: ", JSON.stringify(location));
        var debugVisualz = (win.localStorage &&
            win.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisualz);
        win.READIUM2.DEBUG_VISUALS = debugVisualz;
        win.READIUM2.debug = function (debugVisuals) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var loc, activeWebViews, _loop_2, activeWebViews_5, activeWebViews_5_1, activeWebView, e_7_1;
            var e_7, _a;
            var _this = this;
            var _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        debug("debugVisuals SET: ", debugVisuals);
                        win.READIUM2.DEBUG_VISUALS = debugVisuals;
                        if (win.localStorage) {
                            win.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
                        }
                        loc = (0, location_1.getCurrentReadingLocation)();
                        activeWebViews = win.READIUM2.getActiveWebViews();
                        _loop_2 = function (activeWebView) {
                            var payload;
                            return tslib_1.__generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        payload = { debugVisuals: debugVisuals };
                                        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            var _a;
                                            return tslib_1.__generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                                                        return [4, activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload)];
                                                    case 1:
                                                        _b.sent();
                                                        _b.label = 2;
                                                    case 2: return [2];
                                                }
                                            });
                                        }); }, 0);
                                        if (!(loc && loc.locator.href === ((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href))) return [3, 2];
                                        return [4, new Promise(function (res, _rej) {
                                                setTimeout(function () {
                                                    debug("READIUM2.debug -> handleLinkLocator");
                                                    (0, location_1.handleLinkLocator)(loc.locator, activeWebView.READIUM2.readiumCss);
                                                    res();
                                                }, 100);
                                            })];
                                    case 1:
                                        _d.sent();
                                        _d.label = 2;
                                    case 2: return [2];
                                }
                            });
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, 7, 8]);
                        activeWebViews_5 = tslib_1.__values(activeWebViews), activeWebViews_5_1 = activeWebViews_5.next();
                        _c.label = 2;
                    case 2:
                        if (!!activeWebViews_5_1.done) return [3, 5];
                        activeWebView = activeWebViews_5_1.value;
                        return [5, _loop_2(activeWebView)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        activeWebViews_5_1 = activeWebViews_5.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_7_1 = _c.sent();
                        e_7 = { error: e_7_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (activeWebViews_5_1 && !activeWebViews_5_1.done && (_a = activeWebViews_5.return)) _a.call(activeWebViews_5);
                        }
                        finally { if (e_7) throw e_7.error; }
                        return [7];
                    case 8: return [2];
                }
            });
        }); };
        win.READIUM2.debugItems =
            function (href, cssSelector, cssClass, cssStyles) {
                var e_8, _a;
                var _b;
                if (cssStyles) {
                    debug("debugVisuals ITEMS: ", "".concat(cssSelector, " --- ").concat(cssClass, " --- ").concat(cssStyles));
                }
                var activeWebViews = win.READIUM2.getActiveWebViews();
                var _loop_3 = function (activeWebView) {
                    if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
                        return "continue";
                    }
                    var d = win.READIUM2.DEBUG_VISUALS;
                    var payload = { debugVisuals: d, cssSelector: cssSelector, cssClass: cssClass, cssStyles: cssStyles };
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var _a;
                        return tslib_1.__generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                                    return [4, activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload)];
                                case 1:
                                    _b.sent();
                                    _b.label = 2;
                                case 2: return [2];
                            }
                        });
                    }); }, 0);
                };
                try {
                    for (var activeWebViews_6 = tslib_1.__values(activeWebViews), activeWebViews_6_1 = activeWebViews_6.next(); !activeWebViews_6_1.done; activeWebViews_6_1 = activeWebViews_6.next()) {
                        var activeWebView = activeWebViews_6_1.value;
                        _loop_3(activeWebView);
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (activeWebViews_6_1 && !activeWebViews_6_1.done && (_a = activeWebViews_6.return)) _a.call(activeWebViews_6);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            };
    }
    domRootElement.appendChild(domSlidingViewport);
    createWebView();
    setTimeout(function () {
        debug("installNavigatorDOM -> handleLinkLocator");
        (0, location_1.handleLinkLocator)(location, rcss);
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
var _keyDownEventHandler;
function setKeyDownEventHandler(func) {
    _keyDownEventHandler = func;
}
exports.setKeyDownEventHandler = setKeyDownEventHandler;
var _keyUpEventHandler;
function setKeyUpEventHandler(func) {
    _keyUpEventHandler = func;
}
exports.setKeyUpEventHandler = setKeyUpEventHandler;
//# sourceMappingURL=dom.js.map