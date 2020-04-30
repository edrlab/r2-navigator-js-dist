"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var debounce_1 = require("debounce");
var debug_ = require("debug");
var electron_1 = require("electron");
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
var win = window;
function readiumCssOnOff(rcss) {
    var _this = this;
    var activeWebView = win.READIUM2.getActiveWebView();
    if (activeWebView) {
        var loc_1 = location_1.getCurrentReadingLocation();
        var actualReadiumCss = readium_css_1.obtainReadiumCss(rcss);
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
        var payloadRcss_1 = readium_css_1.adjustReadiumCssJsonMessageForFixedLayout(activeWebView.READIUM2.link, actualReadiumCss);
        if (activeWebView.style.transform !== "none") {
            setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, activeWebView.send("R2_EVENT_HIDE")];
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
                            return [4, activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss_1)];
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
                        case 0: return [4, activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss_1)];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            }); }, 0);
        }
        if (loc_1) {
            setTimeout(function () {
                debug("readiumCssOnOff -> handleLinkLocator");
                location_1.handleLinkLocator(loc_1.locator, activeWebView.READIUM2.readiumCss);
            }, 60);
        }
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
function readiumCssUpdate(rcss) {
    return readiumCssOnOff(rcss);
}
exports.readiumCssUpdate = readiumCssUpdate;
var _webview1;
function createWebViewInternal(preloadScriptPath) {
    var wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    var publicationURL_ = win.READIUM2.publicationURL;
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
        if (IS_DEV) {
            var wc_1 = electron_1.remote.webContents.fromId(wv.getWebContentsId());
            wc_1.on("context-menu", function (_ev, params) {
                var x = params.x, y = params.y;
                var openDevToolsAndInspect = function () {
                    var devToolsOpened = function () {
                        wc_1.off("devtools-opened", devToolsOpened);
                        wc_1.inspectElement(x, y);
                        setTimeout(function () {
                            if (wc_1.devToolsWebContents && wc_1.isDevToolsOpened()) {
                                wc_1.devToolsWebContents.focus();
                            }
                        }, 500);
                    };
                    wc_1.on("devtools-opened", devToolsOpened);
                    wc_1.openDevTools({ activate: true, mode: "detach" });
                };
                electron_1.remote.Menu.buildFromTemplate([{
                        click: function () {
                            var wasOpened = wc_1.isDevToolsOpened();
                            if (!wasOpened) {
                                openDevToolsAndInspect();
                            }
                            else {
                                if (!wc_1.isDevToolsFocused()) {
                                    wc_1.closeDevTools();
                                    setImmediate(function () {
                                        openDevToolsAndInspect();
                                    });
                                }
                                else {
                                    wc_1.inspectElement(x, y);
                                }
                            }
                        },
                        label: "Inspect element",
                    }]).popup({ window: electron_1.remote.getCurrentWindow() });
            });
        }
        if (win.READIUM2) {
            readaloud_1.ttsClickEnable(win.READIUM2.ttsClickEnabled);
        }
    });
    wv.addEventListener("ipc-message", function (event) {
        var webview = event.currentTarget;
        var activeWebView = win.READIUM2.getActiveWebView();
        if (webview !== activeWebView) {
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
        else if (event.channel === events_1.R2_EVENT_CLIPBOARD_COPY) {
            var clipboardInterceptor = win.READIUM2.clipboardInterceptor;
            if (clipboardInterceptor) {
                var payload = event.args[0];
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
    var adjustResize_1 = function (webview) {
        var width = webview.clientWidth;
        var height = webview.clientHeight;
        var wc = electron_1.webContents.fromId(webview.getWebContentsId());
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
        var activeWebView = win.READIUM2.getActiveWebView();
        if (activeWebView) {
            adjustResize_1(activeWebView);
        }
    }, 200);
    window.addEventListener("resize", function () {
        onResizeDebounced_1();
    });
}
function createWebView() {
    var preloadScriptPath = win.READIUM2.preloadScriptPath;
    _webview1 = createWebViewInternal(preloadScriptPath);
    _webview1.READIUM2 = {
        id: 1,
        link: undefined,
        readiumCss: undefined,
    };
    _webview1.setAttribute("id", "webview1");
    var domSlidingViewport = win.READIUM2.domSlidingViewport;
    domSlidingViewport.appendChild(_webview1);
}
function destroyWebView() {
    var domSlidingViewport = win.READIUM2.domSlidingViewport;
    domSlidingViewport.removeChild(_webview1);
    _webview1.READIUM2 = undefined;
    _webview1 = undefined;
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
    domSlidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    win.READIUM2 = {
        DEBUG_VISUALS: false,
        clipboardInterceptor: clipboardInterceptor,
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
        sessionInfo: sessionInfo,
        ttsClickEnabled: false,
    };
    if (IS_DEV) {
        debug("||||||++||||| installNavigatorDOM: ", JSON.stringify(location));
        var debugVisualz = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisualz);
        win.READIUM2.DEBUG_VISUALS = debugVisualz;
        window.READIUM2.debug = function (debugVisuals) {
            debug("debugVisuals SET: ", debugVisuals);
            win.READIUM2.DEBUG_VISUALS = debugVisuals;
            var activeWebView = win.READIUM2.getActiveWebView();
            if (activeWebView) {
                var payload_1 = { debugVisuals: debugVisuals };
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload_1)];
                            case 1:
                                _a.sent();
                                return [2];
                        }
                    });
                }); }, 0);
            }
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
            }
            setTimeout(function () {
                var loc = location_1.getCurrentReadingLocation();
                if (loc) {
                    debug("READIUM2.debug -> handleLinkLocator");
                    location_1.handleLinkLocator(loc.locator, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
                }
            }, 100);
        };
        window.READIUM2.debugItems =
            function (cssSelector, cssClass, cssStyles) {
                if (cssStyles) {
                    debug("debugVisuals ITEMS: ", cssSelector + " --- " + cssClass + " --- " + cssStyles);
                }
                var activeWebView = win.READIUM2.getActiveWebView();
                if (activeWebView) {
                    var d = win.READIUM2.DEBUG_VISUALS;
                    var payload_2 = { debugVisuals: d, cssSelector: cssSelector, cssClass: cssClass, cssStyles: cssStyles };
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload_2)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); }, 0);
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