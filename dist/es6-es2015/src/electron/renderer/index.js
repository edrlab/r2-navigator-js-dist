"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    const cr = require("./common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/index", process.stdout, process.stderr, true);
}
const url_1 = require("url");
const UrlUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const debounce_1 = require("debounce");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("./common/url-params");
const URI = require("urijs");
const ENABLE_WEBVIEW_RESIZE = true;
const ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
const debug = debug_("r2:navigator#electron/renderer/index");
function isRTL() {
    if (_publication &&
        _publication.Metadata &&
        _publication.Metadata.Direction) {
        return _publication.Metadata.Direction.toLowerCase() === "rtl";
    }
    return false;
}
function isFixedLayout(link) {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }
    if (_publication &&
        _publication.Metadata &&
        _publication.Metadata.Rendition) {
        return _publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}
let _epubReadingSystemNameVersion = { name: "Readium2", version: "0.0.0" };
function setEpubReadingSystemInfo(nv) {
    _epubReadingSystemNameVersion = nv;
}
exports.setEpubReadingSystemInfo = setEpubReadingSystemInfo;
function __computeReadiumCssJsonMessage(link) {
    if (isFixedLayout(link)) {
        return { setCSS: undefined, isFixedLayout: true };
    }
    if (!_computeReadiumCssJsonMessage) {
        return { setCSS: undefined, isFixedLayout: false };
    }
    const readiumCssJsonMessage = _computeReadiumCssJsonMessage();
    return readiumCssJsonMessage;
}
exports.__computeReadiumCssJsonMessage = __computeReadiumCssJsonMessage;
let _computeReadiumCssJsonMessage = () => {
    return { setCSS: undefined, isFixedLayout: false };
};
function setReadiumCssJsonGetter(func) {
    _computeReadiumCssJsonMessage = func;
}
exports.setReadiumCssJsonGetter = setReadiumCssJsonGetter;
let _lastSavedReadingLocation;
function getCurrentReadingLocation() {
    return _lastSavedReadingLocation;
}
exports.getCurrentReadingLocation = getCurrentReadingLocation;
let _readingLocationSaver;
const _saveReadingLocation = (docHref, locator) => {
    _lastSavedReadingLocation = {
        locator: {
            href: docHref,
            locations: {
                cfi: locator.locations.cfi ?
                    locator.locations.cfi : undefined,
                cssSelector: locator.locations.cssSelector ?
                    locator.locations.cssSelector : undefined,
                position: (typeof locator.locations.position !== "undefined") ?
                    locator.locations.position : undefined,
                progression: (typeof locator.locations.progression !== "undefined") ?
                    locator.locations.progression : undefined,
            },
            title: locator.title,
        },
        paginationInfo: locator.paginationInfo,
    };
    if (IS_DEV) {
        debug("|||||||||||||| notifyReadingLocation: ", JSON.stringify(_lastSavedReadingLocation));
    }
    if (_readingLocationSaver) {
        _readingLocationSaver(_lastSavedReadingLocation);
    }
};
function setReadingLocationSaver(func) {
    _readingLocationSaver = func;
}
exports.setReadingLocationSaver = setReadingLocationSaver;
function readiumCssOnOff() {
    const _savedReadingLocation = _lastSavedReadingLocation;
    if (_webview1) {
        const payload1 = __computeReadiumCssJsonMessage(_webview1.READIUM2.link);
        if (_webview1.style.transform !== "none") {
            _webview1.send("R2_EVENT_HIDE");
            setTimeout(() => {
                shiftWebview(_webview1, 0, undefined);
                _webview1.send(events_1.R2_EVENT_READIUMCSS, payload1);
            }, 10);
        }
        else {
            _webview1.send(events_1.R2_EVENT_READIUMCSS, payload1);
        }
    }
    if (_savedReadingLocation) {
        setTimeout(() => {
            handleLinkLocator(_savedReadingLocation.locator);
        }, 60);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
function isLocatorVisible(locator) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (!_webview1) {
                reject("No navigator webview?!");
                return;
            }
            if (!_webview1.READIUM2.link) {
                reject("No navigator webview link?!");
                return;
            }
            if (_webview1.READIUM2.link.Href !== locator.href) {
                debug(`isLocatorVisible FALSE: ${_webview1.READIUM2.link.Href} !== ${locator.href}`);
                resolve(false);
                return;
            }
            const cb = (event) => {
                if (event.channel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
                    const webview = event.currentTarget;
                    if (webview !== _webview1) {
                        reject("Wrong navigator webview?!");
                        return;
                    }
                    const payload_ = event.args[0];
                    debug(`isLocatorVisible: ${payload_.visible}`);
                    _webview1.removeEventListener("ipc-message", cb);
                    resolve(payload_.visible);
                }
            };
            _webview1.addEventListener("ipc-message", cb);
            const payload = { location: locator.locations, visible: false };
            _webview1.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payload);
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
let _webview1;
let _publication;
let _publicationJsonUrl;
let _rootHtmlElement;
let _slidingViewport;
function handleLink(href, previous, useGoto) {
    const special = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        loadLink(href, previous, useGoto);
    }
    else {
        const okay = loadLink(href, previous, useGoto);
        if (!okay) {
            debug("EXTERNAL LINK:");
            debug(href);
            electron_1.shell.openExternal(href);
        }
    }
}
exports.handleLink = handleLink;
function handleLinkUrl(href) {
    handleLink(href, undefined, false);
}
exports.handleLinkUrl = handleLinkUrl;
function handleLinkLocator(location) {
    if (!_publication || !_publicationJsonUrl) {
        return;
    }
    let linkToLoad;
    let linkToLoadGoto;
    if (location && location.href) {
        if (_publication.Spine && _publication.Spine.length) {
            linkToLoad = _publication.Spine.find((spineLink) => {
                return spineLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
        if (!linkToLoad &&
            _publication.Resources && _publication.Resources.length) {
            linkToLoad = _publication.Resources.find((resLink) => {
                return resLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
    }
    if (!linkToLoad) {
        if (_publication.Spine && _publication.Spine.length) {
            const firstLinear = _publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    if (linkToLoad) {
        const useGoto = typeof linkToLoadGoto !== "undefined";
        const uri = new url_1.URL(linkToLoad.Href, _publicationJsonUrl);
        uri.hash = "";
        uri.search = "";
        const urlNoQueryParams = uri.toString();
        const hrefToLoad = urlNoQueryParams +
            ((useGoto) ? ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                UrlUtils_1.encodeURIComponent_RFC3986(new Buffer(JSON.stringify(linkToLoadGoto, null, "")).toString("base64"))) :
                "");
        handleLink(hrefToLoad, undefined, useGoto);
    }
}
exports.handleLinkLocator = handleLinkLocator;
function installNavigatorDOM(publication, publicationJsonUrl, rootHtmlElementID, preloadScriptPath, location) {
    _publication = publication;
    _publicationJsonUrl = publicationJsonUrl;
    if (IS_DEV) {
        debug("|||||||||||||| installNavigatorDOM: ", JSON.stringify(location));
        const debugVisuals = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisuals);
        window.READIUM2 = {
            DEBUG_VISUALS: debugVisuals,
            publication: _publication,
            publicationURL: _publicationJsonUrl,
            ttsClickEnabled: false,
        };
        window.READIUM2.debug = (debugVisualz) => {
            debug("debugVisuals SET: ", debugVisualz);
            window.READIUM2.DEBUG_VISUALS = debugVisualz;
            if (_webview1) {
                _webview1.send(events_1.R2_EVENT_DEBUG_VISUALS, debugVisualz ? "true" : "false");
            }
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisualz ? "true" : "false");
            }
            setTimeout(() => {
                const loc = getCurrentReadingLocation();
                debug("|||||||||||||| getCurrentReadingLocation: ", JSON.stringify(loc));
                if (loc) {
                    handleLinkLocator(loc.locator);
                }
            }, 100);
        };
    }
    _rootHtmlElement = document.getElementById(rootHtmlElementID);
    if (!_rootHtmlElement) {
        debug("!rootHtmlElement ???");
        return;
    }
    _slidingViewport = document.createElement("div");
    _slidingViewport.setAttribute("id", ELEMENT_ID_SLIDING_VIEWPORT);
    _slidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    _webview1 = createWebView(preloadScriptPath);
    _webview1.READIUM2 = {
        id: 1,
        link: undefined,
    };
    _webview1.setAttribute("id", "webview1");
    _slidingViewport.appendChild(_webview1);
    _rootHtmlElement.appendChild(_slidingViewport);
    setTimeout(() => {
        handleLinkLocator(location);
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
function navLeftOrRight(left) {
    if (!_publication) {
        return;
    }
    const activeWebView = getActiveWebView();
    const rtl = isRTL();
    const goPREVIOUS = left ? !rtl : rtl;
    const payload = {
        direction: rtl ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    activeWebView.send(events_1.R2_EVENT_PAGE_TURN, payload);
}
exports.navLeftOrRight = navLeftOrRight;
const getActiveWebView = () => {
    return _webview1;
};
function loadLink(hrefFull, previous, useGoto) {
    if (!_publication || !_publicationJsonUrl) {
        return false;
    }
    if (hrefFull.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefFull = sessions_1.convertCustomSchemeToHttpUrl(hrefFull);
    }
    const pubJsonUri = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        sessions_1.convertCustomSchemeToHttpUrl(_publicationJsonUrl) : _publicationJsonUrl;
    let linkPath;
    const urlToLink = new url_1.URL(hrefFull);
    urlToLink.hash = "";
    urlToLink.search = "";
    const urlPublication = new url_1.URL(pubJsonUri);
    urlPublication.hash = "";
    urlPublication.search = "";
    let iBreak = -1;
    for (let i = 0; i < urlPublication.pathname.length; i++) {
        const c1 = urlPublication.pathname[i];
        if (i < urlToLink.pathname.length) {
            const c2 = urlToLink.pathname[i];
            if (c1 !== c2) {
                iBreak = i;
                break;
            }
        }
        else {
            break;
        }
    }
    if (iBreak > 0) {
        linkPath = urlToLink.pathname.substr(iBreak);
    }
    if (!linkPath) {
        return false;
    }
    let pubLink = _publication.Spine ? _publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink) {
        pubLink = _publication.Resources.find((spineLink) => {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        debug("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return false;
    }
    const linkUri = new URI(hrefFull);
    linkUri.search((data) => {
        if (typeof previous === "undefined") {
            data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
        }
        else {
            data[url_params_1.URL_PARAM_PREVIOUS] = previous ? "true" : "false";
        }
        if (!useGoto) {
            data[url_params_1.URL_PARAM_GOTO] = undefined;
        }
    });
    if (useGoto) {
        linkUri.hash("").normalizeHash();
    }
    const rcssJson = __computeReadiumCssJsonMessage(pubLink);
    const rcssJsonstr = JSON.stringify(rcssJson, null, "");
    const rcssJsonstrBase64 = new Buffer(rcssJsonstr).toString("base64");
    const rersJson = _epubReadingSystemNameVersion;
    const rersJsonstr = JSON.stringify(rersJson, null, "");
    const rersJsonstrBase64 = new Buffer(rersJsonstr).toString("base64");
    linkUri.search((data) => {
        data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
        data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
        data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV && window.READIUM2.DEBUG_VISUALS) ?
            "true" : "false";
    });
    const activeWebView = getActiveWebView();
    const wv1AlreadyLoaded = _webview1.READIUM2.link === pubLink;
    if (wv1AlreadyLoaded) {
        const goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        const hash = useGoto ? undefined : linkUri.fragment();
        debug("ALREADY LOADED: " + pubLink.Href);
        const webviewToReuse = _webview1;
        const payload = {
            goto,
            hash,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            const msgStr = JSON.stringify(payload);
            debug(msgStr);
        }
        if (activeWebView.style.transform !== "none") {
            webviewToReuse.send("R2_EVENT_HIDE");
            setTimeout(() => {
                shiftWebview(webviewToReuse, 0, undefined);
                webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, payload);
            }, 10);
        }
        else {
            webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, payload);
        }
        return true;
    }
    const uriStr = linkUri.toString();
    activeWebView.READIUM2.link = pubLink;
    const needConvert = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    const uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
    if (IS_DEV) {
        debug("setAttribute SRC:");
        debug(uriStr_);
    }
    if (activeWebView.style.transform !== "none") {
        activeWebView.send("R2_EVENT_HIDE");
        setTimeout(() => {
            shiftWebview(activeWebView, 0, undefined);
            activeWebView.setAttribute("src", uriStr_);
        }, 10);
    }
    else {
        activeWebView.setAttribute("src", uriStr_);
    }
    return true;
}
function shiftWebview(webview, offset, backgroundColor) {
    if (!offset) {
        webview.style.transform = "none";
    }
    else {
        if (_slidingViewport && backgroundColor) {
            _slidingViewport.style.backgroundColor = backgroundColor;
        }
        webview.style.transform = `translateX(${offset}px)`;
    }
}
function createWebView(preloadScriptPath) {
    const wv = document.createElement("webview");
    wv.setAttribute("webpreferences", "nodeIntegration=0, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0");
    wv.setAttribute("partition", sessions_1.R2_SESSION_WEBVIEW);
    if (_publicationJsonUrl) {
        wv.setAttribute("httpreferrer", _publicationJsonUrl);
    }
    wv.setAttribute("style", "display: flex; margin: 0; padding: 0; box-sizing: border-box; " +
        "position: absolute; left: 0; width: 50%; bottom: 0; top: 0;");
    wv.setAttribute("preload", preloadScriptPath);
    if (ENABLE_WEBVIEW_RESIZE) {
        wv.setAttribute("disableguestresize", "");
    }
    setTimeout(() => {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", () => {
        wv.clearHistory();
        if (window.READIUM2) {
            ttsClickEnable(window.READIUM2.ttsClickEnabled);
        }
    });
    wv.addEventListener("ipc-message", (event) => {
        const webview = event.currentTarget;
        const activeWebView = getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_SHIFT_VIEW_X) {
            shiftWebview(webview, event.args[0].offset, event.args[0].backgroundColor);
        }
        else if (event.channel === events_1.R2_EVENT_LINK) {
            const payload = event.args[0];
            handleLinkUrl(payload.url);
        }
        else if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
            const payload = event.args[0];
            if (webview.READIUM2.link && _saveReadingLocation) {
                _saveReadingLocation(webview.READIUM2.link.Href, payload);
            }
        }
        else if (event.channel === events_1.R2_EVENT_PAGE_TURN_RES) {
            if (!_publication) {
                return;
            }
            const payload = event.args[0];
            const goPREVIOUS = payload.go === "PREVIOUS";
            if (!webview.READIUM2.link) {
                debug("WEBVIEW READIUM2_LINK ??!!");
                return;
            }
            let nextOrPreviousSpineItem;
            if (_publication.Spine) {
                for (let i = 0; i < _publication.Spine.length; i++) {
                    if (_publication.Spine[i] === webview.READIUM2.link) {
                        if (goPREVIOUS && (i - 1) >= 0) {
                            nextOrPreviousSpineItem = _publication.Spine[i - 1];
                        }
                        else if (!goPREVIOUS && (i + 1) < _publication.Spine.length) {
                            nextOrPreviousSpineItem = _publication.Spine[i + 1];
                        }
                        break;
                    }
                }
            }
            if (!nextOrPreviousSpineItem) {
                return;
            }
            if (_publicationJsonUrl) {
                const uri = new url_1.URL(nextOrPreviousSpineItem.Href, _publicationJsonUrl);
                uri.hash = "";
                uri.search = "";
                const urlNoQueryParams = uri.toString();
                handleLink(urlNoQueryParams, goPREVIOUS, false);
            }
        }
        else if (event.channel === events_1.R2_EVENT_TTS_IS_PAUSED) {
            if (_ttsListener) {
                _ttsListener(TTSStateEnum.PAUSED);
            }
        }
        else if (event.channel === events_1.R2_EVENT_TTS_IS_STOPPED) {
            if (_ttsListener) {
                _ttsListener(TTSStateEnum.STOPPED);
            }
        }
        else if (event.channel === events_1.R2_EVENT_TTS_IS_PLAYING) {
            if (_ttsListener) {
                _ttsListener(TTSStateEnum.PLAYING);
            }
        }
        else {
            debug("webview1 ipc-message");
            debug(event.channel);
        }
    });
    return wv;
}
if (ENABLE_WEBVIEW_RESIZE) {
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
        adjustResize(_webview1);
    }, 200);
    window.addEventListener("resize", () => {
        onResizeDebounced();
    });
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, payload) => {
    debug("R2_EVENT_LINK (ipcRenderer.on)");
    debug(payload.url);
    handleLinkUrl(payload.url);
});
function ttsPlay() {
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    let startElementCSSSelector;
    if (_lastSavedReadingLocation && activeWebView.READIUM2 && activeWebView.READIUM2.link) {
        if (_lastSavedReadingLocation.locator.href === activeWebView.READIUM2.link.Href) {
            startElementCSSSelector = _lastSavedReadingLocation.locator.locations.cssSelector;
        }
    }
    const payload = {
        rootElement: "html > body",
        startElement: startElementCSSSelector,
    };
    activeWebView.send(events_1.R2_EVENT_TTS_DO_PLAY, payload);
}
exports.ttsPlay = ttsPlay;
function ttsPause() {
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_PAUSE);
}
exports.ttsPause = ttsPause;
function ttsStop() {
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_STOP);
}
exports.ttsStop = ttsStop;
function ttsResume() {
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_RESUME);
}
exports.ttsResume = ttsResume;
function ttsPrevious() {
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_PREVIOUS);
}
exports.ttsPrevious = ttsPrevious;
function ttsNext() {
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    activeWebView.send(events_1.R2_EVENT_TTS_DO_NEXT);
}
exports.ttsNext = ttsNext;
var TTSStateEnum;
(function (TTSStateEnum) {
    TTSStateEnum["PAUSED"] = "PAUSED";
    TTSStateEnum["PLAYING"] = "PLAYING";
    TTSStateEnum["STOPPED"] = "STOPPED";
})(TTSStateEnum = exports.TTSStateEnum || (exports.TTSStateEnum = {}));
let _ttsListener;
function ttsListen(ttsListener) {
    _ttsListener = ttsListener;
}
exports.ttsListen = ttsListen;
function ttsClickEnable(doEnable) {
    if (window.READIUM2) {
        window.READIUM2.ttsClickEnabled = doEnable;
    }
    const activeWebView = getActiveWebView();
    if (!activeWebView) {
        return;
    }
    const payload = {
        doEnable,
    };
    activeWebView.send(events_1.R2_EVENT_TTS_CLICK_ENABLE, payload);
}
exports.ttsClickEnable = ttsClickEnable;
//# sourceMappingURL=index.js.map