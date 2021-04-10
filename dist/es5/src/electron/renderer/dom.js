"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKeyUpEventHandler = exports.setKeyDownEventHandler = exports.installNavigatorDOM = exports.readiumCssUpdate = exports.readiumCssOnOff = void 0;
var tslib_1 = require("tslib");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var debug_ = require("debug");
var electron_1 = require("electron");
var context_menu_1 = require("../common/context-menu");
var events_1 = require("../common/events");
var readium_css_settings_1 = require("../common/readium-css-settings");
var sessions_1 = require("../common/sessions");
var styles_1 = require("../common/styles");
var url_params_1 = require("./common/url-params");
var highlight_1 = require("./highlight");
var location_1 = require("./location");
var media_overlays_1 = require("./media-overlays");
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
var win = window;
electron_1.ipcRenderer.on("accessibility-support-changed", function (_e, accessibilitySupportEnabled) {
    debug("accessibility-support-changed event received in WebView ", accessibilitySupportEnabled);
    win.READIUM2.isScreenReaderMounted = accessibilitySupportEnabled;
});
function readiumCssApplyToWebview(loc, activeWebView, rcss) {
    var _this = this;
    var _a;
    var actualReadiumCss = readium_css_1.obtainReadiumCss(rcss);
    activeWebView.READIUM2.readiumCss = actualReadiumCss;
    var payloadRcss = readium_css_1.adjustReadiumCssJsonMessageForFixedLayout(activeWebView, actualReadiumCss);
    if (activeWebView.style.transform &&
        activeWebView.style.transform !== "none") {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send("R2_EVENT_HIDE", activeWebView.READIUM2.link ? readium_css_1.isFixedLayout(activeWebView.READIUM2.link) : null)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 0);
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        location_1.shiftWebview(activeWebView, 0, undefined);
                        return [4, activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 10);
    }
    else {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 0);
    }
    if (loc && loc.locator.href === ((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href)) {
        setTimeout(function () {
            debug("readiumCssOnOff -> handleLinkLocator");
            location_1.handleLinkLocator(loc.locator, actualReadiumCss);
        }, 60);
    }
}
function readiumCssOnOff(rcss) {
    var e_1, _a;
    var loc = location_1.getCurrentReadingLocation();
    var activeWebViews = win.READIUM2.getActiveWebViews();
    try {
        for (var activeWebViews_1 = tslib_1.__values(activeWebViews), activeWebViews_1_1 = activeWebViews_1.next(); !activeWebViews_1_1.done; activeWebViews_1_1 = activeWebViews_1.next()) {
            var activeWebView = activeWebViews_1_1.value;
            readiumCssApplyToWebview(loc, activeWebView, rcss);
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
exports.readiumCssOnOff = readiumCssOnOff;
function readiumCssUpdate(rcss) {
    return readiumCssOnOff(rcss);
}
exports.readiumCssUpdate = readiumCssUpdate;
var _webview1;
var _webview2;
function createWebViewInternal(preloadScriptPath) {
    var wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    var publicationURL_ = win.READIUM2.publicationURL;
    if (publicationURL_) {
        wv.setAttribute("httpreferrer", publicationURL_);
    }
    location_1.setWebViewStyle(wv, styles_1.WebViewSlotEnum.center);
    wv.setAttribute("preload", preloadScriptPath);
    setTimeout(function () {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", function () {
        wv.clearHistory();
        if (IS_DEV) {
            electron_1.ipcRenderer.send(context_menu_1.CONTEXT_MENU_SETUP, wv.getWebContentsId());
        }
        if (win.READIUM2) {
            readaloud_1.ttsVoice(win.READIUM2.ttsVoice);
            readaloud_1.ttsPlaybackRate(win.READIUM2.ttsPlaybackRate);
            readaloud_1.ttsClickEnable(win.READIUM2.ttsClickEnabled);
            readaloud_1.ttsOverlayEnable(win.READIUM2.ttsOverlayEnabled);
        }
        readaloud_1.checkTtsState(wv);
    });
    wv.addEventListener("ipc-message", function (event) {
        var webview = event.currentTarget;
        if (webview !== wv) {
            console.log("Wrong navigator webview?!");
            return;
        }
        if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYDOWN) {
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
                        sessions_1.convertCustomSchemeToHttpUrl(win.READIUM2.publicationURL) :
                        win.READIUM2.publicationURL;
                    var rcssUrl = new URL(urlStr);
                    rcssUrl.pathname = readium_css_settings_1.READIUM_CSS_URL_PATH + "/";
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
                    (payload.containerStyle ? " " + payload.containerStyle : " "));
                var p = captionElement.firstElementChild;
                if (p) {
                    p.setAttribute("style", captionsOverlayParaCssStyles +
                        (payload.textStyle ? " " + payload.textStyle : " "));
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
            readaloud_1.checkTtsState(wv);
        }
        else if (!highlight_1.highlightsHandleIpcMessage(event.channel, event.args, webview) &&
            !readaloud_1.ttsHandleIpcMessage(event.channel, event.args, webview) &&
            !location_1.locationHandleIpcMessage(event.channel, event.args, webview) &&
            !media_overlays_1.mediaOverlaysHandleIpcMessage(event.channel, event.args, webview) &&
            !soundtrack_1.soundtrackHandleIpcMessage(event.channel, event.args, webview)) {
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
    domSlidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; right: 0; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
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
        enableScreenReaderAccessibilityWebViewHardRefresh: enableScreenReaderAccessibilityWebViewHardRefresh ? true : false,
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
        ttsVoice: null,
    };
    electron_1.ipcRenderer.send("accessibility-support-changed");
    if (IS_DEV) {
        debug("||||||++||||| installNavigatorDOM: ", JSON.stringify(location));
        var debugVisualz = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisualz);
        win.READIUM2.DEBUG_VISUALS = debugVisualz;
        window.READIUM2.debug = function (debugVisuals) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var loc, activeWebViews, _loop_1, activeWebViews_2, activeWebViews_2_1, activeWebView, e_2_1;
            var e_2, _a;
            var _this = this;
            var _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        debug("debugVisuals SET: ", debugVisuals);
                        win.READIUM2.DEBUG_VISUALS = debugVisuals;
                        if (window.localStorage) {
                            window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
                        }
                        loc = location_1.getCurrentReadingLocation();
                        activeWebViews = win.READIUM2.getActiveWebViews();
                        _loop_1 = function (activeWebView) {
                            var payload;
                            return tslib_1.__generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        payload = { debugVisuals: debugVisuals };
                                        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload)];
                                                    case 1:
                                                        _a.sent();
                                                        return [2];
                                                }
                                            });
                                        }); }, 0);
                                        if (!(loc && loc.locator.href === ((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href))) return [3, 2];
                                        return [4, new Promise(function (res, _rej) {
                                                setTimeout(function () {
                                                    debug("READIUM2.debug -> handleLinkLocator");
                                                    location_1.handleLinkLocator(loc.locator, activeWebView.READIUM2.readiumCss);
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
                        activeWebViews_2 = tslib_1.__values(activeWebViews), activeWebViews_2_1 = activeWebViews_2.next();
                        _c.label = 2;
                    case 2:
                        if (!!activeWebViews_2_1.done) return [3, 5];
                        activeWebView = activeWebViews_2_1.value;
                        return [5, _loop_1(activeWebView)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        activeWebViews_2_1 = activeWebViews_2.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_2_1 = _c.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (activeWebViews_2_1 && !activeWebViews_2_1.done && (_a = activeWebViews_2.return)) _a.call(activeWebViews_2);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7];
                    case 8: return [2];
                }
            });
        }); };
        window.READIUM2.debugItems =
            function (href, cssSelector, cssClass, cssStyles) {
                var e_3, _a;
                var _b;
                if (cssStyles) {
                    debug("debugVisuals ITEMS: ", cssSelector + " --- " + cssClass + " --- " + cssStyles);
                }
                var activeWebViews = win.READIUM2.getActiveWebViews();
                var _loop_2 = function (activeWebView) {
                    if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
                        return "continue";
                    }
                    var d = win.READIUM2.DEBUG_VISUALS;
                    var payload = { debugVisuals: d, cssSelector: cssSelector, cssClass: cssClass, cssStyles: cssStyles };
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); }, 0);
                };
                try {
                    for (var activeWebViews_3 = tslib_1.__values(activeWebViews), activeWebViews_3_1 = activeWebViews_3.next(); !activeWebViews_3_1.done; activeWebViews_3_1 = activeWebViews_3.next()) {
                        var activeWebView = activeWebViews_3_1.value;
                        _loop_2(activeWebView);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (activeWebViews_3_1 && !activeWebViews_3_1.done && (_a = activeWebViews_3.return)) _a.call(activeWebViews_3);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            };
    }
    domRootElement.appendChild(domSlidingViewport);
    createWebView();
    setTimeout(function () {
        debug("installNavigatorDOM -> handleLinkLocator");
        location_1.handleLinkLocator(location, rcss);
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