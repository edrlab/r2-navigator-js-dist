"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var url_1 = require("url");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var sessions_1 = require("../common/sessions");
var url_params_1 = require("./common/url-params");
var epubReadingSystem_1 = require("./epubReadingSystem");
var readium_css_1 = require("./readium-css");
var URI = require("urijs");
var debug = debug_("r2:navigator#electron/renderer/location");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function locationHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    var activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
    }
    else if (eventChannel === events_1.R2_EVENT_SHIFT_VIEW_X) {
        shiftWebview(activeWebView, eventArgs[0].offset, eventArgs[0].backgroundColor);
    }
    else if (eventChannel === events_1.R2_EVENT_PAGE_TURN_RES) {
        var publication = window.READIUM2.publication;
        var publicationURL = window.READIUM2.publicationURL;
        if (!publication) {
            return true;
        }
        var payload = eventArgs[0];
        var goPREVIOUS = payload.go === "PREVIOUS";
        if (!activeWebView.READIUM2.link) {
            debug("WEBVIEW READIUM2_LINK ??!!");
            return true;
        }
        var nextOrPreviousSpineItem = void 0;
        if (publication.Spine) {
            for (var i = 0; i < publication.Spine.length; i++) {
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
            var uri = new url_1.URL(nextOrPreviousSpineItem.Href, publicationURL);
            uri.hash = "";
            uri.search = "";
            var urlNoQueryParams = uri.toString();
            handleLink(urlNoQueryParams, goPREVIOUS, false);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_READING_LOCATION) {
        var payload = eventArgs[0];
        if (activeWebView.READIUM2.link && _saveReadingLocation) {
            _saveReadingLocation(activeWebView.READIUM2.link.Href, payload);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_LINK) {
        var payload = eventArgs[0];
        handleLinkUrl(payload.url);
    }
    else {
        return false;
    }
    return true;
}
exports.locationHandleIpcMessage = locationHandleIpcMessage;
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, function (_event, payload) {
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
            var domSlidingViewport = window.READIUM2.domSlidingViewport;
            domSlidingViewport.style.backgroundColor = backgroundColor;
        }
        webview.style.transform = "translateX(" + offset + "px)";
    }
}
exports.shiftWebview = shiftWebview;
function navLeftOrRight(left) {
    var publication = window.READIUM2.publication;
    if (!publication) {
        return;
    }
    var rtl = readium_css_1.isRTL();
    var goPREVIOUS = left ? !rtl : rtl;
    var payload = {
        direction: rtl ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    var activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView) {
        activeWebView.send(events_1.R2_EVENT_PAGE_TURN, payload);
    }
}
exports.navLeftOrRight = navLeftOrRight;
function handleLink(href, previous, useGoto) {
    var special = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        loadLink(href, previous, useGoto);
    }
    else {
        var okay = loadLink(href, previous, useGoto);
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
    var publication = window.READIUM2.publication;
    var publicationURL = window.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return;
    }
    var linkToLoad;
    var linkToLoadGoto;
    if (location && location.href) {
        if (publication.Spine && publication.Spine.length) {
            linkToLoad = publication.Spine.find(function (spineLink) {
                return spineLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
        if (!linkToLoad &&
            publication.Resources && publication.Resources.length) {
            linkToLoad = publication.Resources.find(function (resLink) {
                return resLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
    }
    if (!linkToLoad) {
        if (publication.Spine && publication.Spine.length) {
            var firstLinear = publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    if (linkToLoad) {
        var useGoto = typeof linkToLoadGoto !== "undefined";
        var uri = new url_1.URL(linkToLoad.Href, publicationURL);
        uri.hash = "";
        uri.search = "";
        var urlNoQueryParams = uri.toString();
        var hrefToLoad = urlNoQueryParams +
            ((useGoto) ? ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                UrlUtils_1.encodeURIComponent_RFC3986(Buffer.from(JSON.stringify(linkToLoadGoto, null, "")).toString("base64"))) :
                "");
        handleLink(hrefToLoad, undefined, useGoto);
    }
}
exports.handleLinkLocator = handleLinkLocator;
function loadLink(hrefFull, previous, useGoto) {
    var publication = window.READIUM2.publication;
    var publicationURL = window.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return false;
    }
    if (hrefFull.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefFull = sessions_1.convertCustomSchemeToHttpUrl(hrefFull);
    }
    var pubJsonUri = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        sessions_1.convertCustomSchemeToHttpUrl(publicationURL) : publicationURL;
    var linkPath;
    var urlToLink = new url_1.URL(hrefFull);
    urlToLink.hash = "";
    urlToLink.search = "";
    var urlPublication = new url_1.URL(pubJsonUri);
    urlPublication.hash = "";
    urlPublication.search = "";
    var iBreak = -1;
    for (var i = 0; i < urlPublication.pathname.length; i++) {
        var c1 = urlPublication.pathname[i];
        if (i < urlToLink.pathname.length) {
            var c2 = urlToLink.pathname[i];
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
    var pubLink = publication.Spine ? publication.Spine.find(function (spineLink) {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink) {
        pubLink = publication.Resources.find(function (spineLink) {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        debug("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return false;
    }
    var linkUri = new URI(hrefFull);
    linkUri.search(function (data) {
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
    var rcssJson = readium_css_1.__computeReadiumCssJsonMessage(pubLink);
    var rcssJsonstr = JSON.stringify(rcssJson, null, "");
    var rcssJsonstrBase64 = Buffer.from(rcssJsonstr).toString("base64");
    var rersJson = epubReadingSystem_1.getEpubReadingSystemInfo();
    var rersJsonstr = JSON.stringify(rersJson, null, "");
    var rersJsonstrBase64 = Buffer.from(rersJsonstr).toString("base64");
    linkUri.search(function (data) {
        data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
        data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
        data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV && window.READIUM2.DEBUG_VISUALS) ?
            "true" : "false";
    });
    var activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView && activeWebView.READIUM2.link === pubLink) {
        var goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        var hash = useGoto ? undefined : linkUri.fragment();
        debug("ALREADY LOADED: " + pubLink.Href);
        var payload_1 = {
            goto: goto,
            hash: hash,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            var msgStr = JSON.stringify(payload_1);
            debug(msgStr);
        }
        if (activeWebView) {
            if (activeWebView.style.transform !== "none") {
                activeWebView.send("R2_EVENT_HIDE");
                setTimeout(function () {
                    shiftWebview(activeWebView, 0, undefined);
                    activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload_1);
                }, 10);
            }
            else {
                activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload_1);
            }
        }
        return true;
    }
    if (activeWebView) {
        var uriStr = linkUri.toString();
        var webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
            && activeWebView.READIUM2.link !== null;
        activeWebView.READIUM2.link = pubLink;
        var needConvert = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
        var uriStr_1 = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
            uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
        if (IS_DEV) {
            debug("setAttribute SRC:");
            debug(uriStr_1);
        }
        if (activeWebView.style.transform !== "none") {
            if (webviewAlreadyHasContent) {
                activeWebView.send("R2_EVENT_HIDE");
            }
            setTimeout(function () {
                shiftWebview(activeWebView, 0, undefined);
                activeWebView.setAttribute("src", uriStr_1);
            }, 10);
        }
        else {
            activeWebView.setAttribute("src", uriStr_1);
        }
    }
    return true;
}
var _lastSavedReadingLocation;
function getCurrentReadingLocation() {
    return _lastSavedReadingLocation;
}
exports.getCurrentReadingLocation = getCurrentReadingLocation;
var _readingLocationSaver;
var _saveReadingLocation = function (docHref, locator) {
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
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    var activeWebView = window.READIUM2.getActiveWebView();
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
                    var cb = function (event) {
                        if (event.channel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
                            var webview = event.currentTarget;
                            if (webview !== activeWebView) {
                                reject("Wrong navigator webview?!");
                                return;
                            }
                            var payloadPong = event.args[0];
                            activeWebView.removeEventListener("ipc-message", cb);
                            resolve(payloadPong.visible);
                        }
                    };
                    activeWebView.addEventListener("ipc-message", cb);
                    var payloadPing = { location: locator.locations, visible: false };
                    activeWebView.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payloadPing);
                })];
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
//# sourceMappingURL=location.js.map