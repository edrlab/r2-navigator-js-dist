"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UrlUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/http/UrlUtils");
const debounce_1 = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("./common/url-params");
const URI = require("urijs");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
exports.DOM_EVENT_HIDE_VIEWPORT = "r2:hide-content-viewport";
exports.DOM_EVENT_SHOW_VIEWPORT = "r2:show-content-viewport";
const ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
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
let _getEpubReadingSystem = () => {
    return { name: "Readium2", version: "0.0.0" };
};
function setEpubReadingSystemJsonGetter(func) {
    _getEpubReadingSystem = func;
}
exports.setEpubReadingSystemJsonGetter = setEpubReadingSystemJsonGetter;
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
    if (_webview2) {
        const payload2 = __computeReadiumCssJsonMessage(_webview2.READIUM2.link);
        _webview2.send(events_1.R2_EVENT_READIUMCSS, payload2);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
let _webview1;
let _webview2;
let _publication;
let _publicationJsonUrl;
let _rootHtmlElement;
function handleLink(href, previous, useGoto) {
    let okay = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (!okay && _publicationJsonUrl) {
        const prefix = _publicationJsonUrl.replace("manifest.json", "");
        okay = decodeURIComponent(href).startsWith(decodeURIComponent(prefix));
    }
    if (okay) {
        loadLink(href, previous, useGoto);
    }
    else {
        console.log("EXTERNAL LINK:");
        console.log(href);
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
        const useGoto = typeof linkToLoadGoto !== "undefined" &&
            typeof linkToLoadGoto.cssSelector !== "undefined";
        const hrefToLoad = _publicationJsonUrl + "/../" + linkToLoad.Href +
            ((useGoto && linkToLoadGoto && linkToLoadGoto.cssSelector) ?
                ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                    UrlUtils_1.encodeURIComponent_RFC3986(linkToLoadGoto.cssSelector)) : "");
        handleLink(hrefToLoad, undefined, useGoto);
    }
}
exports.handleLinkLocator = handleLinkLocator;
function installNavigatorDOM(publication, publicationJsonUrl, rootHtmlElementID, preloadScriptPath, location) {
    _publication = publication;
    _publicationJsonUrl = publicationJsonUrl;
    if (IS_DEV) {
        window.READIUM2_PUB = _publication;
        window.READIUM2_PUBURL = _publicationJsonUrl;
    }
    _rootHtmlElement = document.getElementById(rootHtmlElementID);
    if (!_rootHtmlElement) {
        console.log("!rootHtmlElement ???");
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
    _webview2 = createWebView(preloadScriptPath);
    _webview2.READIUM2 = {
        id: 2,
        link: undefined,
    };
    _webview2.setAttribute("id", "webview2");
    slidingViewport.appendChild(_webview1);
    slidingViewport.appendChild(_webview2);
    _rootHtmlElement.appendChild(slidingViewport);
    if (isRTL()) {
        _webview1.classList.add("posRight");
        _webview1.style.left = "50%";
    }
    else {
        _webview2.classList.add("posRight");
        _webview2.style.left = "50%";
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
    setTimeout(() => {
        if (linkToLoad) {
            const useGoto = typeof linkToLoadGoto !== "undefined" &&
                typeof linkToLoadGoto.cssSelector !== "undefined";
            const hrefToLoad = _publicationJsonUrl + "/../" + linkToLoad.Href +
                ((useGoto && linkToLoadGoto && linkToLoadGoto.cssSelector) ?
                    ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                        UrlUtils_1.encodeURIComponent_RFC3986(linkToLoadGoto.cssSelector)) : "");
            handleLink(hrefToLoad, undefined, useGoto);
        }
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
    let activeWebView;
    const slidingViewport = document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT);
    if (slidingViewport.classList.contains("shiftedLeft")) {
        if (_webview1.classList.contains("posRight")) {
            activeWebView = _webview1;
        }
        else {
            activeWebView = _webview2;
        }
    }
    else {
        if (_webview2.classList.contains("posRight")) {
            activeWebView = _webview1;
        }
        else {
            activeWebView = _webview2;
        }
    }
    return activeWebView;
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
        console.log("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return;
    }
    const rcssJson = __computeReadiumCssJsonMessage(pubLink);
    const rcssJsonstr = JSON.stringify(rcssJson, null, "");
    const rcssJsonstrBase64 = UrlUtils_1.encodeURIComponent_RFC3986(new Buffer(rcssJsonstr).toString("base64"));
    const rersJson = _getEpubReadingSystem();
    const rersJsonstr = JSON.stringify(rersJson, null, "");
    const rersJsonstrBase64 = UrlUtils_1.encodeURIComponent_RFC3986(new Buffer(rersJsonstr).toString("base64"));
    linkUri.search((data) => {
        data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
        data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
    });
    const activeWebView = getActiveWebView();
    const wv1AlreadyLoaded = _webview1.READIUM2.link === pubLink;
    const wv2AlreadyLoaded = _webview2.READIUM2.link === pubLink;
    if (wv1AlreadyLoaded || wv2AlreadyLoaded) {
        const goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        const hash = useGoto ? undefined : linkUri.fragment();
        console.log("ALREADY LOADED: " + pubLink.Href);
        const webviewToReuse = wv1AlreadyLoaded ? _webview1 : _webview2;
        if (webviewToReuse !== activeWebView) {
            console.log("INTO VIEW ...");
            const slidingView = document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT);
            if (slidingView) {
                let animate = true;
                if (goto || hash) {
                    console.log("DISABLE ANIM");
                    animate = false;
                }
                else if (previous) {
                    if (!slidingView.classList.contains("shiftedLeft")) {
                        console.log("DISABLE ANIM");
                        animate = false;
                    }
                }
                if (animate) {
                    if (!slidingView.classList.contains("animated")) {
                        slidingView.classList.add("animated");
                        slidingView.style.transition = "left 500ms ease-in-out";
                    }
                }
                else {
                    if (slidingView.classList.contains("animated")) {
                        slidingView.classList.remove("animated");
                        slidingView.style.transition = "none";
                    }
                }
                if (slidingView.classList.contains("shiftedLeft")) {
                    slidingView.classList.remove("shiftedLeft");
                    slidingView.style.left = "0";
                }
                else {
                    slidingView.classList.add("shiftedLeft");
                    slidingView.style.left = "-100%";
                }
            }
        }
        const payload = {
            goto,
            hash,
            previous: previous ? true : false,
        };
        const msgStr = JSON.stringify(payload);
        console.log(msgStr);
        webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, payload);
        return;
    }
    if (!isFixedLayout(pubLink)) {
        if (_rootHtmlElement) {
            _rootHtmlElement.dispatchEvent(new Event(exports.DOM_EVENT_HIDE_VIEWPORT));
        }
    }
    const uriStr = linkUri.toString();
    console.log("####### >>> ---");
    console.log(activeWebView.READIUM2.id);
    console.log(pubLink.Href);
    console.log(linkUri.hash());
    console.log(linkUri.fragment());
    console.log(linkUri.search(true)[url_params_1.URL_PARAM_GOTO]);
    console.log(linkUri.search(true)[url_params_1.URL_PARAM_PREVIOUS]);
    console.log("####### >>> ---");
    activeWebView.READIUM2.link = pubLink;
    const needConvert = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    const uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
    console.log("setAttribute SRC:");
    console.log(uriStr_);
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
            console.log("WEBVIEW READY: " + payload.href);
            if (_rootHtmlElement) {
                _rootHtmlElement.dispatchEvent(new Event(exports.DOM_EVENT_SHOW_VIEWPORT));
            }
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
                console.log("WEBVIEW READIUM2_LINK ??!!");
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
            console.log("webview1 ipc-message");
            console.log(event.channel);
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
    adjustResize(_webview2);
    setTimeout(() => {
        if (_rootHtmlElement) {
            _rootHtmlElement.dispatchEvent(new Event(exports.DOM_EVENT_SHOW_VIEWPORT));
        }
    }, 1000);
}, 200);
window.addEventListener("resize", () => {
    if (!isFixedLayout(_webview1.READIUM2.link)) {
        if (_rootHtmlElement) {
            _rootHtmlElement.dispatchEvent(new Event(exports.DOM_EVENT_HIDE_VIEWPORT));
        }
    }
    onResizeDebounced();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, payload) => {
    console.log("R2_EVENT_LINK");
    console.log(payload.url);
    handleLinkUrl(payload.url);
});
//# sourceMappingURL=index.js.map