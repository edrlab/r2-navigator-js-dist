"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    const cr = require("./common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/index", process.stdout, process.stderr, true);
}
const UrlUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/http/UrlUtils");
const debounce_1 = require("debounce");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("./common/url-params");
const URI = require("urijs");
const CLASS_POS_RIGHT = "r2_posRight";
const CLASS_SHIFT_LEFT = "r2_shiftedLeft";
const CLASS_ANIMATED = "r2_animated";
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
                cfi: locator.cfi ? locator.cfi : undefined,
                cssSelector: locator.cssSelector ? locator.cssSelector : undefined,
                position: (typeof locator.position !== "undefined") ? locator.position : undefined,
                progression: (typeof locator.progression !== "undefined") ? locator.progression : undefined,
            },
        },
        paginationInfo: locator.paginationInfo,
    };
    if (_readingLocationSaver) {
        _readingLocationSaver(_lastSavedReadingLocation);
    }
};
function setReadingLocationSaver(func) {
    _readingLocationSaver = func;
}
exports.setReadingLocationSaver = setReadingLocationSaver;
function readiumCssOnOff() {
    if (_webview1) {
        const payload1 = __computeReadiumCssJsonMessage(_webview1.READIUM2.link);
        _webview1.send(events_1.R2_EVENT_READIUMCSS, payload1);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
let _webview1;
let _publication;
let _publicationJsonUrl;
let _rootHtmlElement;
function handleLink(href, previous, useGoto) {
    let okay = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (!okay && _publicationJsonUrl) {
        const prefix = _publicationJsonUrl.replace("manifest.json", "");
        debug("handleLink: ", href, " -- ", prefix);
        okay = decodeURIComponent(href).startsWith(decodeURIComponent(prefix));
    }
    if (okay) {
        loadLink(href, previous, useGoto);
    }
    else {
        debug("EXTERNAL LINK:");
        debug(href);
        electron_1.shell.openExternal(href);
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
        const hrefToLoad = _publicationJsonUrl + "/../" + linkToLoad.Href +
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
    const slidingViewport = document.createElement("div");
    slidingViewport.setAttribute("id", ELEMENT_ID_SLIDING_VIEWPORT);
    slidingViewport.setAttribute("style", "display: block; position: absolute; left: 0; width: 200%; " +
        "top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
    _webview1 = createWebView(preloadScriptPath);
    _webview1.READIUM2 = {
        id: 1,
        link: undefined,
    };
    _webview1.setAttribute("id", "webview1");
    slidingViewport.appendChild(_webview1);
    _rootHtmlElement.appendChild(slidingViewport);
    if (isRTL()) {
        _webview1.classList.add(CLASS_POS_RIGHT);
        _webview1.style.left = "50%";
    }
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
        return;
    }
    if (hrefFull.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefFull = sessions_1.convertCustomSchemeToHttpUrl(hrefFull);
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
    const pubJsonUri = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        sessions_1.convertCustomSchemeToHttpUrl(_publicationJsonUrl) : _publicationJsonUrl;
    const pubUri = new URI(pubJsonUri);
    const pathPrefix = decodeURIComponent(pubUri.path().replace("manifest.json", ""));
    const normPath = decodeURIComponent(linkUri.normalizePath().path());
    const linkPath = normPath.replace(pathPrefix, "");
    let pubLink = _publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    });
    if (!pubLink) {
        pubLink = _publication.Resources.find((spineLink) => {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        debug("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return;
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
        if (webviewToReuse !== activeWebView) {
            debug("INTO VIEW ...");
            const slidingView = document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT);
            if (slidingView) {
                let animate = true;
                if (goto || hash) {
                    debug("DISABLE ANIM");
                    animate = false;
                }
                else if (previous) {
                    if (!slidingView.classList.contains(CLASS_SHIFT_LEFT)) {
                        debug("DISABLE ANIM");
                        animate = false;
                    }
                }
                if (animate) {
                    if (!slidingView.classList.contains(CLASS_ANIMATED)) {
                        slidingView.classList.add(CLASS_ANIMATED);
                        slidingView.style.transition = "left 500ms ease-in-out";
                    }
                }
                else {
                    if (slidingView.classList.contains(CLASS_ANIMATED)) {
                        slidingView.classList.remove(CLASS_ANIMATED);
                        slidingView.style.transition = "none";
                    }
                }
                if (slidingView.classList.contains(CLASS_SHIFT_LEFT)) {
                    slidingView.classList.remove(CLASS_SHIFT_LEFT);
                    slidingView.style.left = "0";
                }
                else {
                    slidingView.classList.add(CLASS_SHIFT_LEFT);
                    slidingView.style.left = "-100%";
                }
            }
        }
        const payload = {
            goto,
            hash,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            const msgStr = JSON.stringify(payload);
            debug(msgStr);
        }
        webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, payload);
        return;
    }
    const uriStr = linkUri.toString();
    if (IS_DEV) {
        debug("####### >>> ---");
        debug(activeWebView.READIUM2.id);
        debug(pubLink.Href);
        debug(uriStr);
        debug(linkUri.hash());
        debug(linkUri.fragment());
        const gto = linkUri.search(true)[url_params_1.URL_PARAM_GOTO];
        debug(gto ? (new Buffer(gto, "base64").toString("utf8")) : "");
        debug(linkUri.search(true)[url_params_1.URL_PARAM_PREVIOUS]);
        debug(linkUri.search(true)[url_params_1.URL_PARAM_CSS]);
        debug("####### >>> ---");
    }
    activeWebView.READIUM2.link = pubLink;
    const needConvert = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    const uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
    if (IS_DEV) {
        debug("setAttribute SRC:");
        debug(uriStr_);
    }
    activeWebView.setAttribute("src", uriStr_);
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
    wv.setAttribute("disableguestresize", "");
    setTimeout(() => {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", () => {
        wv.clearHistory();
    });
    wv.addEventListener("ipc-message", (event) => {
        const webview = event.currentTarget;
        const activeWebView = getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_LINK) {
            const payload = event.args[0];
            handleLinkUrl(payload.url);
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_READY) {
            const payload = event.args[0];
            debug("WEBVIEW READY: " + payload.href);
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
            if (!nextOrPreviousSpineItem) {
                return;
            }
            if (_publicationJsonUrl) {
                const linkHref = _publicationJsonUrl + "/../" + nextOrPreviousSpineItem.Href;
                handleLink(linkHref, goPREVIOUS, false);
            }
        }
        else {
            debug("webview1 ipc-message");
            debug(event.channel);
        }
    });
    return wv;
}
const adjustResize = (webview) => {
    const width = webview.clientWidth;
    const height = webview.clientHeight;
    const wc = webview.getWebContents();
    if (wc && width && height) {
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
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, payload) => {
    debug("R2_EVENT_LINK");
    debug(payload.url);
    handleLinkUrl(payload.url);
});
//# sourceMappingURL=index.js.map