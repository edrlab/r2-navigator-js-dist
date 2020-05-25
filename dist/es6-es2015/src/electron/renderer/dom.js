"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKeyUpEventHandler = exports.setKeyDownEventHandler = exports.installNavigatorDOM = exports.readiumCssUpdate = exports.readiumCssOnOff = void 0;
const tslib_1 = require("tslib");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const readium_css_settings_1 = require("../common/readium-css-settings");
const sessions_1 = require("../common/sessions");
const styles_1 = require("../common/styles");
const url_params_1 = require("./common/url-params");
const highlight_1 = require("./highlight");
const location_1 = require("./location");
const media_overlays_1 = require("./media-overlays");
const readaloud_1 = require("./readaloud");
const readium_css_1 = require("./readium-css");
const soundtrack_1 = require("./soundtrack");
const ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
const ELEMENT_ID_CAPTIONS = "r2_navigator_captions_overlay";
const ELEMENT_ID_READIUM_CSS_STYLE = "r2_navigator_readium_css";
const captionsOverlayCssStyles = `
    overflow: hidden;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
    border: 0;
    margin: 0;
    padding: 2em;
    line-height: initial;
    user-select: none;
`.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
const captionsOverlayParaCssStyles = `
    margin: 0;
    margin-top: auto;
    margin-bottom: auto;
    padding: 0;
    max-width: 900px;
    font-weight: bolder;
    text-align: center;
`.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
const readiumCssStyle = `
@font-face {
font-family: AccessibleDfA;
font-style: normal;
font-weight: normal;
src: local("AccessibleDfA"),
url("{RCSS_BASE_URL}fonts/AccessibleDfA.otf") format("opentype");
}

@font-face {
font-family: "IA Writer Duospace";
font-style: normal;
font-weight: normal;
src: local("iAWriterDuospace-Regular"),
url("{RCSS_BASE_URL}fonts/iAWriterDuospace-Regular.ttf") format("truetype");
}
`;
const debug = debug_("r2:navigator#electron/renderer/index");
const win = window;
function readiumCssApplyToWebview(loc, activeWebView, rcss) {
    var _a;
    const actualReadiumCss = readium_css_1.obtainReadiumCss(rcss);
    activeWebView.READIUM2.readiumCss = actualReadiumCss;
    const payloadRcss = readium_css_1.adjustReadiumCssJsonMessageForFixedLayout(activeWebView, actualReadiumCss);
    if (activeWebView.style.transform &&
        activeWebView.style.transform !== "none") {
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send("R2_EVENT_HIDE", activeWebView.READIUM2.link ? readium_css_1.isFixedLayout(activeWebView.READIUM2.link) : null);
        }), 0);
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            location_1.shiftWebview(activeWebView, 0, undefined);
            yield activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss);
        }), 10);
    }
    else {
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss);
        }), 0);
    }
    if (loc && loc.locator.href === ((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href)) {
        setTimeout(() => {
            debug(`readiumCssOnOff -> handleLinkLocator`);
            location_1.handleLinkLocator(loc.locator, actualReadiumCss);
        }, 60);
    }
}
function readiumCssOnOff(rcss) {
    const loc = location_1.getCurrentReadingLocation();
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        readiumCssApplyToWebview(loc, activeWebView, rcss);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
function readiumCssUpdate(rcss) {
    return readiumCssOnOff(rcss);
}
exports.readiumCssUpdate = readiumCssUpdate;
let _webview1;
let _webview2;
function createWebViewInternal(preloadScriptPath) {
    const wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    const publicationURL_ = win.READIUM2.publicationURL;
    if (publicationURL_) {
        wv.setAttribute("httpreferrer", publicationURL_);
    }
    location_1.setWebViewStyle(wv, styles_1.WebViewSlotEnum.center);
    wv.setAttribute("preload", preloadScriptPath);
    setTimeout(() => {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", () => {
        wv.clearHistory();
        if (IS_DEV) {
            const wc = electron_1.remote.webContents.fromId(wv.getWebContentsId());
            wc.on("context-menu", (_ev, params) => {
                const { x, y } = params;
                const openDevToolsAndInspect = () => {
                    const devToolsOpened = () => {
                        wc.off("devtools-opened", devToolsOpened);
                        wc.inspectElement(x, y);
                        setTimeout(() => {
                            if (wc.devToolsWebContents && wc.isDevToolsOpened()) {
                                wc.devToolsWebContents.focus();
                            }
                        }, 500);
                    };
                    wc.on("devtools-opened", devToolsOpened);
                    wc.openDevTools({ activate: true, mode: "detach" });
                };
                electron_1.remote.Menu.buildFromTemplate([{
                        click: () => {
                            const wasOpened = wc.isDevToolsOpened();
                            if (!wasOpened) {
                                openDevToolsAndInspect();
                            }
                            else {
                                if (!wc.isDevToolsFocused()) {
                                    wc.closeDevTools();
                                    setImmediate(() => {
                                        openDevToolsAndInspect();
                                    });
                                }
                                else {
                                    wc.inspectElement(x, y);
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
    wv.addEventListener("ipc-message", (event) => {
        const webview = event.currentTarget;
        if (webview !== wv) {
            console.log("Wrong navigator webview?!");
            return;
        }
        if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYDOWN) {
            const payload = event.args[0];
            if (_keyDownEventHandler) {
                _keyDownEventHandler(payload, payload.elementName, payload.elementAttributes);
            }
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_KEYUP) {
            const payload = event.args[0];
            if (_keyUpEventHandler) {
                _keyUpEventHandler(payload, payload.elementName, payload.elementAttributes);
            }
        }
        else if (event.channel === events_1.R2_EVENT_CAPTIONS) {
            const payload = event.args[0];
            let captionElement = win.document.getElementById(ELEMENT_ID_CAPTIONS);
            let rssStyleElement = win.document.getElementById(ELEMENT_ID_READIUM_CSS_STYLE);
            const rootElement = win.document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT);
            if (payload.text && rootElement) {
                if (!rssStyleElement) {
                    const urlStr = win.READIUM2.publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL) ?
                        sessions_1.convertCustomSchemeToHttpUrl(win.READIUM2.publicationURL) :
                        win.READIUM2.publicationURL;
                    const rcssUrl = new URL(urlStr);
                    rcssUrl.pathname = `${readium_css_settings_1.READIUM_CSS_URL_PATH}/`;
                    rssStyleElement = win.document.createElement("style");
                    rssStyleElement.setAttribute("id", ELEMENT_ID_READIUM_CSS_STYLE);
                    const styleTxtNode = win.document.createTextNode(readiumCssStyle.replace(/{RCSS_BASE_URL}/g, rcssUrl.toString()));
                    rssStyleElement.appendChild(styleTxtNode);
                    win.document.head.appendChild(rssStyleElement);
                }
                if (!captionElement) {
                    captionElement = win.document.createElement("div");
                    captionElement.setAttribute("id", ELEMENT_ID_CAPTIONS);
                    const para = win.document.createElement("p");
                    captionElement.appendChild(para);
                    rootElement.appendChild(captionElement);
                }
                captionElement.setAttribute("style", captionsOverlayCssStyles +
                    (payload.containerStyle ? ` ${payload.containerStyle}` : " "));
                const p = captionElement.firstElementChild;
                if (p) {
                    p.setAttribute("style", captionsOverlayParaCssStyles +
                        (payload.textStyle ? ` ${payload.textStyle}` : " "));
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
            const clipboardInterceptor = win.READIUM2.clipboardInterceptor;
            if (clipboardInterceptor) {
                const payload = event.args[0];
                clipboardInterceptor(payload);
            }
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
    const preloadScriptPath = win.READIUM2.preloadScriptPath;
    const domSlidingViewport = win.READIUM2.domSlidingViewport;
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
    const domSlidingViewport = win.READIUM2.domSlidingViewport;
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
    const domRootElement = document.getElementById(rootHtmlElementID);
    if (!domRootElement) {
        debug("!rootHtmlElementID ???");
        return;
    }
    const domSlidingViewport = document.createElement("div");
    domSlidingViewport.setAttribute("id", ELEMENT_ID_SLIDING_VIEWPORT);
    domSlidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; right: 0; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    win.READIUM2 = {
        DEBUG_VISUALS: false,
        clipboardInterceptor,
        createFirstWebView: createWebView,
        createSecondWebView: () => {
            createWebView(true);
        },
        destroyFirstWebView: destroyWebView,
        destroySecondWebView: () => {
            destroyWebView(true);
        },
        domRootElement,
        domSlidingViewport,
        enableScreenReaderAccessibilityWebViewHardRefresh: enableScreenReaderAccessibilityWebViewHardRefresh ? true : false,
        getActiveWebViews: () => {
            const arr = [];
            if (_webview1) {
                arr.push(_webview1);
            }
            if (_webview2) {
                arr.push(_webview2);
            }
            return arr;
        },
        getFirstOrSecondWebView: () => {
            return _webview1 ? _webview1 : _webview2;
        },
        getFirstWebView: () => {
            return _webview1;
        },
        getSecondWebView: (create) => {
            if (!_webview2 && create) {
                createWebView(true);
            }
            return _webview2;
        },
        preloadScriptPath,
        publication,
        publicationURL,
        sessionInfo,
        ttsClickEnabled: false,
        ttsPlaybackRate: 1,
    };
    if (IS_DEV) {
        debug("||||||++||||| installNavigatorDOM: ", JSON.stringify(location));
        const debugVisualz = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisualz);
        win.READIUM2.DEBUG_VISUALS = debugVisualz;
        window.READIUM2.debug = (debugVisuals) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            debug("debugVisuals SET: ", debugVisuals);
            win.READIUM2.DEBUG_VISUALS = debugVisuals;
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
            }
            const loc = location_1.getCurrentReadingLocation();
            const activeWebViews = win.READIUM2.getActiveWebViews();
            for (const activeWebView of activeWebViews) {
                const payload = { debugVisuals };
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
                }), 0);
                if (loc && loc.locator.href === ((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href)) {
                    yield new Promise((res, _rej) => {
                        setTimeout(() => {
                            debug(`READIUM2.debug -> handleLinkLocator`);
                            location_1.handleLinkLocator(loc.locator, activeWebView.READIUM2.readiumCss);
                            res();
                        }, 100);
                    });
                }
            }
        });
        window.READIUM2.debugItems =
            (href, cssSelector, cssClass, cssStyles) => {
                var _a;
                if (cssStyles) {
                    debug("debugVisuals ITEMS: ", `${cssSelector} --- ${cssClass} --- ${cssStyles}`);
                }
                const activeWebViews = win.READIUM2.getActiveWebViews();
                for (const activeWebView of activeWebViews) {
                    if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
                        continue;
                    }
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
        debug(`installNavigatorDOM -> handleLinkLocator`);
        location_1.handleLinkLocator(location, rcss);
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