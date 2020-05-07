"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const debounce_1 = require("debounce");
const debug_ = require("debug");
const electron_1 = require("electron");
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
function readiumCssOnOff(rcss) {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (activeWebView) {
        const loc = location_1.getCurrentReadingLocation();
        const actualReadiumCss = readium_css_1.obtainReadiumCss(rcss);
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
        const payloadRcss = readium_css_1.adjustReadiumCssJsonMessageForFixedLayout(activeWebView.READIUM2.link, actualReadiumCss);
        if (activeWebView.style.transform !== "none") {
            setTimeout(async () => {
                await activeWebView.send("R2_EVENT_HIDE");
            }, 0);
            setTimeout(async () => {
                location_1.shiftWebview(activeWebView, 0, undefined);
                await activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss);
            }, 10);
        }
        else {
            setTimeout(async () => {
                await activeWebView.send(events_1.R2_EVENT_READIUMCSS, payloadRcss);
            }, 0);
        }
        if (loc) {
            setTimeout(() => {
                debug(`readiumCssOnOff -> handleLinkLocator`);
                location_1.handleLinkLocator(loc.locator, activeWebView.READIUM2.readiumCss);
            }, 60);
        }
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
function readiumCssUpdate(rcss) {
    return readiumCssOnOff(rcss);
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
        const activeWebView = win.READIUM2.getActiveWebView();
        if (webview !== activeWebView) {
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
        const wc = electron_1.webContents.fromId(webview.getWebContentsId());
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
        readiumCss: undefined,
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
function installNavigatorDOM(publication, publicationURL, rootHtmlElementID, preloadScriptPath, location, enableScreenReaderAccessibilityWebViewHardRefresh, clipboardInterceptor, sessionInfo, rcss) {
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
        ttsPlaybackRate: 1,
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
                setTimeout(async () => {
                    await activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
                }, 0);
            }
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisuals ? "true" : "false");
            }
            setTimeout(() => {
                const loc = location_1.getCurrentReadingLocation();
                if (loc) {
                    debug(`READIUM2.debug -> handleLinkLocator`);
                    location_1.handleLinkLocator(loc.locator, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
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
                    setTimeout(async () => {
                        await activeWebView.send(events_1.R2_EVENT_DEBUG_VISUALS, payload);
                    }, 0);
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