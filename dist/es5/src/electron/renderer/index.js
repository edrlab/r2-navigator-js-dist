"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    var cr = require("./common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/index", process.stdout, process.stderr, true);
}
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var debounce_1 = require("debounce");
var debug_ = require("debug");
var electron_1 = require("electron");
var events_1 = require("../common/events");
var sessions_1 = require("../common/sessions");
var url_params_1 = require("./common/url-params");
var URI = require("urijs");
var CLASS_POS_RIGHT = "r2_posRight";
var CLASS_SHIFT_LEFT = "r2_shiftedLeft";
var CLASS_ANIMATED = "r2_animated";
var ELEMENT_ID_SLIDING_VIEWPORT = "r2_navigator_sliding_viewport";
var debug = debug_("r2:navigator#electron/renderer/index");
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
var _epubReadingSystemNameVersion = { name: "Readium2", version: "0.0.0" };
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
    var readiumCssJsonMessage = _computeReadiumCssJsonMessage();
    return readiumCssJsonMessage;
}
exports.__computeReadiumCssJsonMessage = __computeReadiumCssJsonMessage;
var _computeReadiumCssJsonMessage = function () {
    return { setCSS: undefined, isFixedLayout: false };
};
function setReadiumCssJsonGetter(func) {
    _computeReadiumCssJsonMessage = func;
}
exports.setReadiumCssJsonGetter = setReadiumCssJsonGetter;
var _lastSavedReadingLocation;
function getCurrentReadingLocation() {
    return _lastSavedReadingLocation;
}
exports.getCurrentReadingLocation = getCurrentReadingLocation;
var _readingLocationSaver;
var _saveReadingLocation = function (docHref, locator) {
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
        var payload1 = __computeReadiumCssJsonMessage(_webview1.READIUM2.link);
        _webview1.send(events_1.R2_EVENT_READIUMCSS, payload1);
    }
}
exports.readiumCssOnOff = readiumCssOnOff;
var _webview1;
var _publication;
var _publicationJsonUrl;
var _rootHtmlElement;
function handleLink(href, previous, useGoto) {
    var okay = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (!okay && _publicationJsonUrl) {
        var prefix = _publicationJsonUrl.replace("manifest.json", "");
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
    var linkToLoad;
    var linkToLoadGoto;
    if (location && location.href) {
        if (_publication.Spine && _publication.Spine.length) {
            linkToLoad = _publication.Spine.find(function (spineLink) {
                return spineLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
        if (!linkToLoad &&
            _publication.Resources && _publication.Resources.length) {
            linkToLoad = _publication.Resources.find(function (resLink) {
                return resLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
    }
    if (!linkToLoad) {
        if (_publication.Spine && _publication.Spine.length) {
            var firstLinear = _publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    if (linkToLoad) {
        var useGoto = typeof linkToLoadGoto !== "undefined";
        var hrefToLoad = _publicationJsonUrl + "/../" + linkToLoad.Href +
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
        var debugVisuals = (window.localStorage &&
            window.localStorage.getItem(url_params_1.URL_PARAM_DEBUG_VISUALS) === "true") ? true : false;
        debug("debugVisuals GET: ", debugVisuals);
        window.READIUM2 = {
            DEBUG_VISUALS: debugVisuals,
            publication: _publication,
            publicationURL: _publicationJsonUrl,
        };
        window.READIUM2.debug = function (debugVisualz) {
            debug("debugVisuals SET: ", debugVisualz);
            window.READIUM2.DEBUG_VISUALS = debugVisualz;
            if (_webview1) {
                _webview1.send(events_1.R2_EVENT_DEBUG_VISUALS, debugVisualz ? "true" : "false");
            }
            if (window.localStorage) {
                window.localStorage.setItem(url_params_1.URL_PARAM_DEBUG_VISUALS, debugVisualz ? "true" : "false");
            }
            setTimeout(function () {
                var loc = getCurrentReadingLocation();
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
    var slidingViewport = document.createElement("div");
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
    setTimeout(function () {
        handleLinkLocator(location);
    }, 100);
}
exports.installNavigatorDOM = installNavigatorDOM;
function navLeftOrRight(left) {
    if (!_publication) {
        return;
    }
    var activeWebView = getActiveWebView();
    var rtl = isRTL();
    var goPREVIOUS = left ? !rtl : rtl;
    var payload = {
        direction: rtl ? "RTL" : "LTR",
        go: goPREVIOUS ? "PREVIOUS" : "NEXT",
    };
    activeWebView.send(events_1.R2_EVENT_PAGE_TURN, payload);
}
exports.navLeftOrRight = navLeftOrRight;
var getActiveWebView = function () {
    return _webview1;
};
function loadLink(hrefFull, previous, useGoto) {
    if (!_publication || !_publicationJsonUrl) {
        return;
    }
    if (hrefFull.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefFull = sessions_1.convertCustomSchemeToHttpUrl(hrefFull);
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
    var pubJsonUri = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        sessions_1.convertCustomSchemeToHttpUrl(_publicationJsonUrl) : _publicationJsonUrl;
    var pubUri = new URI(pubJsonUri);
    var pathPrefix = decodeURIComponent(pubUri.path().replace("manifest.json", ""));
    var normPath = decodeURIComponent(linkUri.normalizePath().path());
    var linkPath = normPath.replace(pathPrefix, "");
    var pubLink = _publication.Spine.find(function (spineLink) {
        return spineLink.Href === linkPath;
    });
    if (!pubLink) {
        pubLink = _publication.Resources.find(function (spineLink) {
            return spineLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        debug("FATAL WEBVIEW READIUM2_LINK ??!! " + hrefFull + " ==> " + linkPath);
        return;
    }
    var rcssJson = __computeReadiumCssJsonMessage(pubLink);
    var rcssJsonstr = JSON.stringify(rcssJson, null, "");
    var rcssJsonstrBase64 = new Buffer(rcssJsonstr).toString("base64");
    var rersJson = _epubReadingSystemNameVersion;
    var rersJsonstr = JSON.stringify(rersJson, null, "");
    var rersJsonstrBase64 = new Buffer(rersJsonstr).toString("base64");
    linkUri.search(function (data) {
        data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
        data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
        data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV && window.READIUM2.DEBUG_VISUALS) ?
            "true" : "false";
    });
    var activeWebView = getActiveWebView();
    var wv1AlreadyLoaded = _webview1.READIUM2.link === pubLink;
    if (wv1AlreadyLoaded) {
        var goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        var hash = useGoto ? undefined : linkUri.fragment();
        debug("ALREADY LOADED: " + pubLink.Href);
        var webviewToReuse = _webview1;
        if (webviewToReuse !== activeWebView) {
            debug("INTO VIEW ...");
            var slidingView = document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT);
            if (slidingView) {
                var animate = true;
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
        var payload = {
            goto: goto,
            hash: hash,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            var msgStr = JSON.stringify(payload);
            debug(msgStr);
        }
        webviewToReuse.send(events_1.R2_EVENT_SCROLLTO, payload);
        return;
    }
    var uriStr = linkUri.toString();
    if (IS_DEV) {
        debug("####### >>> ---");
        debug(activeWebView.READIUM2.id);
        debug(pubLink.Href);
        debug(uriStr);
        debug(linkUri.hash());
        debug(linkUri.fragment());
        var gto = linkUri.search(true)[url_params_1.URL_PARAM_GOTO];
        debug(gto ? (new Buffer(gto, "base64").toString("utf8")) : "");
        debug(linkUri.search(true)[url_params_1.URL_PARAM_PREVIOUS]);
        debug(linkUri.search(true)[url_params_1.URL_PARAM_CSS]);
        debug("####### >>> ---");
    }
    activeWebView.READIUM2.link = pubLink;
    var needConvert = _publicationJsonUrl.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    var uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
        uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
    if (IS_DEV) {
        debug("setAttribute SRC:");
        debug(uriStr_);
    }
    activeWebView.setAttribute("src", uriStr_);
}
function createWebView(preloadScriptPath) {
    var wv = document.createElement("webview");
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
    setTimeout(function () {
        wv.removeAttribute("tabindex");
    }, 500);
    wv.addEventListener("dom-ready", function () {
        wv.clearHistory();
    });
    wv.addEventListener("ipc-message", function (event) {
        var webview = event.currentTarget;
        var activeWebView = getActiveWebView();
        if (webview !== activeWebView) {
            return;
        }
        if (event.channel === events_1.R2_EVENT_LINK) {
            var payload = event.args[0];
            handleLinkUrl(payload.url);
        }
        else if (event.channel === events_1.R2_EVENT_WEBVIEW_READY) {
            var payload = event.args[0];
            debug("WEBVIEW READY: " + payload.href);
        }
        else if (event.channel === events_1.R2_EVENT_READING_LOCATION) {
            var payload = event.args[0];
            if (webview.READIUM2.link && _saveReadingLocation) {
                _saveReadingLocation(webview.READIUM2.link.Href, payload);
            }
        }
        else if (event.channel === events_1.R2_EVENT_PAGE_TURN_RES) {
            if (!_publication) {
                return;
            }
            var payload = event.args[0];
            var goPREVIOUS = payload.go === "PREVIOUS";
            if (!webview.READIUM2.link) {
                debug("WEBVIEW READIUM2_LINK ??!!");
                return;
            }
            var nextOrPreviousSpineItem = void 0;
            for (var i = 0; i < _publication.Spine.length; i++) {
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
                var linkHref = _publicationJsonUrl + "/../" + nextOrPreviousSpineItem.Href;
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
var adjustResize = function (webview) {
    var width = webview.clientWidth;
    var height = webview.clientHeight;
    var wc = webview.getWebContents();
    if (wc && width && height) {
        wc.setSize({
            normal: {
                height: height,
                width: width,
            },
        });
    }
};
var onResizeDebounced = debounce_1.debounce(function () {
    adjustResize(_webview1);
}, 200);
window.addEventListener("resize", function () {
    onResizeDebounced();
});
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, function (_event, payload) {
    debug("R2_EVENT_LINK");
    debug(payload.url);
    handleLinkUrl(payload.url);
});
//# sourceMappingURL=index.js.map