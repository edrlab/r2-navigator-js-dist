"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const url_1 = require("url");
const UrlUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const debug_ = require("debug");
const electron_1 = require("electron");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const url_params_1 = require("./common/url-params");
const epubReadingSystem_1 = require("./epubReadingSystem");
const readium_css_1 = require("./readium-css");
const URI = require("urijs");
const debug = debug_("r2:navigator#electron/renderer/location");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function locationHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    const activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
    }
    else if (eventChannel === events_1.R2_EVENT_SHIFT_VIEW_X) {
        shiftWebview(activeWebView, eventArgs[0].offset, eventArgs[0].backgroundColor);
    }
    else if (eventChannel === events_1.R2_EVENT_PAGE_TURN_RES) {
        const publication = window.READIUM2.publication;
        const publicationURL = window.READIUM2.publicationURL;
        if (!publication) {
            return true;
        }
        const payload = eventArgs[0];
        const goPREVIOUS = payload.go === "PREVIOUS";
        if (!activeWebView.READIUM2.link) {
            debug("WEBVIEW READIUM2_LINK ??!!");
            return true;
        }
        let nextOrPreviousSpineItem;
        if (publication.Spine) {
            for (let i = 0; i < publication.Spine.length; i++) {
                if (publication.Spine[i] === activeWebView.READIUM2.link) {
                    if (goPREVIOUS && (i - 1) >= 0) {
                        nextOrPreviousSpineItem = publication.Spine[i - 1];
                    }
                    else if (!goPREVIOUS && (i + 1) < publication.Spine.length) {
                        nextOrPreviousSpineItem = publication.Spine[i + 1];
                    }
                    break;
                }
            }
        }
        if (!nextOrPreviousSpineItem) {
            return true;
        }
        if (publicationURL) {
            const uri = new url_1.URL(nextOrPreviousSpineItem.Href, publicationURL);
            uri.hash = "";
            uri.search = "";
            const urlNoQueryParams = uri.toString();
            handleLink(urlNoQueryParams, goPREVIOUS, false);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_READING_LOCATION) {
        const payload = eventArgs[0];
        if (activeWebView.READIUM2.link && _saveReadingLocation) {
            _saveReadingLocation(activeWebView.READIUM2.link.Href, payload);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_LINK) {
        const payload = eventArgs[0];
        handleLinkUrl(payload.url);
    }
    else {
        return false;
    }
    return true;
}
exports.locationHandleIpcMessage = locationHandleIpcMessage;
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, payload) => {
    debug("R2_EVENT_LINK (ipcRenderer.on)");
    debug(payload.url);
    handleLinkUrl(payload.url);
});
function shiftWebview(webview, offset, backgroundColor) {
    if (!offset) {
        webview.style.transform = "none";
    }
    else {
        if (backgroundColor) {
            const domSlidingViewport = window.READIUM2.domSlidingViewport;
            domSlidingViewport.style.backgroundColor = backgroundColor;
        }
        webview.style.transform = `translateX(${offset}px)`;
    }
}
exports.shiftWebview = shiftWebview;
function navLeftOrRight(left) {
    const publication = window.READIUM2.publication;
    if (!publication) {
        return;
    }
    const rtl = readium_css_1.isRTL();
    const goPREVIOUS = left ? !rtl : rtl;
    const payload = {
        direction: rtl ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    const activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView) {
        activeWebView.send(events_1.R2_EVENT_PAGE_TURN, payload);
    }
}
exports.navLeftOrRight = navLeftOrRight;
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
    const publication = window.READIUM2.publication;
    const publicationURL = window.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return;
    }
    let linkToLoad;
    let linkToLoadGoto;
    if (location && location.href) {
        if (publication.Spine && publication.Spine.length) {
            linkToLoad = publication.Spine.find((spineLink) => {
                return spineLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
        if (!linkToLoad &&
            publication.Resources && publication.Resources.length) {
            linkToLoad = publication.Resources.find((resLink) => {
                return resLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
    }
    if (!linkToLoad) {
        if (publication.Spine && publication.Spine.length) {
            const firstLinear = publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    if (linkToLoad) {
        const useGoto = typeof linkToLoadGoto !== "undefined";
        const uri = new url_1.URL(linkToLoad.Href, publicationURL);
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
function loadLink(hrefFull, previous, useGoto) {
    const publication = window.READIUM2.publication;
    const publicationURL = window.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return false;
    }
    if (hrefFull.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefFull = sessions_1.convertCustomSchemeToHttpUrl(hrefFull);
    }
    const pubJsonUri = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        sessions_1.convertCustomSchemeToHttpUrl(publicationURL) : publicationURL;
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
    linkPath = decodeURIComponent(linkPath);
    let pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink) {
        pubLink = publication.Resources.find((spineLink) => {
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
    const rcssJson = readium_css_1.__computeReadiumCssJsonMessage(pubLink);
    const rcssJsonstr = JSON.stringify(rcssJson, null, "");
    const rcssJsonstrBase64 = new Buffer(rcssJsonstr).toString("base64");
    const rersJson = epubReadingSystem_1.getEpubReadingSystemInfo();
    const rersJsonstr = JSON.stringify(rersJson, null, "");
    const rersJsonstrBase64 = new Buffer(rersJsonstr).toString("base64");
    linkUri.search((data) => {
        data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
        data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
        data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV && window.READIUM2.DEBUG_VISUALS) ?
            "true" : "false";
    });
    const activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView && activeWebView.READIUM2.link === pubLink) {
        const goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        const hash = useGoto ? undefined : linkUri.fragment();
        debug("ALREADY LOADED: " + pubLink.Href);
        const payload = {
            goto,
            hash,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            const msgStr = JSON.stringify(payload);
            debug(msgStr);
        }
        if (activeWebView) {
            if (activeWebView.style.transform !== "none") {
                activeWebView.send("R2_EVENT_HIDE");
                setTimeout(() => {
                    shiftWebview(activeWebView, 0, undefined);
                    activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload);
                }, 10);
            }
            else {
                activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload);
            }
        }
        return true;
    }
    if (activeWebView) {
        const uriStr = linkUri.toString();
        const webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
            && activeWebView.READIUM2.link !== null;
        activeWebView.READIUM2.link = pubLink;
        const needConvert = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
        const uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
            uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
        if (IS_DEV) {
            debug("setAttribute SRC:");
            debug(uriStr_);
        }
        if (activeWebView.style.transform !== "none") {
            if (webviewAlreadyHasContent) {
                activeWebView.send("R2_EVENT_HIDE");
            }
            setTimeout(() => {
                shiftWebview(activeWebView, 0, undefined);
                activeWebView.setAttribute("src", uriStr_);
            }, 10);
        }
        else {
            activeWebView.setAttribute("src", uriStr_);
        }
    }
    return true;
}
let _lastSavedReadingLocation;
function getCurrentReadingLocation() {
    return _lastSavedReadingLocation;
}
exports.getCurrentReadingLocation = getCurrentReadingLocation;
let _readingLocationSaver;
const _saveReadingLocation = (docHref, locator) => {
    _lastSavedReadingLocation = {
        docInfo: locator.docInfo,
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
            text: locator.text,
            title: locator.title,
        },
        paginationInfo: locator.paginationInfo,
        selectionInfo: locator.selectionInfo,
        selectionIsNew: locator.selectionIsNew,
    };
    if (IS_DEV) {
        debug(">->->");
        debug(_lastSavedReadingLocation);
    }
    if (_readingLocationSaver) {
        _readingLocationSaver(_lastSavedReadingLocation);
    }
};
function setReadingLocationSaver(func) {
    _readingLocationSaver = func;
}
exports.setReadingLocationSaver = setReadingLocationSaver;
function isLocatorVisible(locator) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const activeWebView = window.READIUM2.getActiveWebView();
            if (!activeWebView) {
                reject("No navigator webview?!");
                return;
            }
            if (!activeWebView.READIUM2.link) {
                reject("No navigator webview link?!");
                return;
            }
            if (activeWebView.READIUM2.link.Href !== locator.href) {
                resolve(false);
                return;
            }
            const cb = (event) => {
                if (event.channel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
                    const webview = event.currentTarget;
                    if (webview !== activeWebView) {
                        reject("Wrong navigator webview?!");
                        return;
                    }
                    const payloadPong = event.args[0];
                    activeWebView.removeEventListener("ipc-message", cb);
                    resolve(payloadPong.visible);
                }
            };
            activeWebView.addEventListener("ipc-message", cb);
            const payloadPing = { location: locator.locations, visible: false };
            activeWebView.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payloadPing);
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
//# sourceMappingURL=location.js.map