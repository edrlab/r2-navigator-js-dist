"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debug_ = require("debug");
var electron_1 = require("electron");
var path = require("path");
var url_1 = require("url");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var audiobook_1 = require("../common/audiobook");
var events_1 = require("../common/events");
var readium_css_inject_1 = require("../common/readium-css-inject");
var sessions_1 = require("../common/sessions");
var styles_1 = require("../common/styles");
var url_params_1 = require("./common/url-params");
var epubReadingSystem_1 = require("./epubReadingSystem");
var readium_css_1 = require("./readium-css");
var state_1 = require("./webview/state");
var URI = require("urijs");
var debug = debug_("r2:navigator#electron/renderer/location");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var win = window;
function locationHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    var activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
    }
    else if (eventChannel === events_1.R2_EVENT_SHIFT_VIEW_X) {
        shiftWebview(activeWebView, eventArgs[0].offset, eventArgs[0].backgroundColor);
    }
    else if (eventChannel === events_1.R2_EVENT_PAGE_TURN_RES) {
        var publication = win.READIUM2.publication;
        var publicationURL = win.READIUM2.publicationURL;
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
            handleLink(urlNoQueryParams, goPREVIOUS, false, activeWebView.READIUM2.readiumCss);
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
        handleLinkUrl(payload.url, activeWebView.READIUM2.readiumCss);
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
    var activeWebView = win.READIUM2.getActiveWebView();
    handleLinkUrl(payload.url, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
});
function shiftWebview(webview, offset, backgroundColor) {
    if (!offset) {
        webview.style.transform = "none";
    }
    else {
        if (backgroundColor) {
            var domSlidingViewport = win.READIUM2.domSlidingViewport;
            domSlidingViewport.style.backgroundColor = backgroundColor;
        }
        webview.style.transform = "translateX(" + offset + "px)";
    }
}
exports.shiftWebview = shiftWebview;
function navLeftOrRight(left, spineNav) {
    var _this = this;
    var publication = win.READIUM2.publication;
    var publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return;
    }
    var rtl = readium_css_1.isRTL();
    if (spineNav) {
        if (!publication.Spine) {
            return;
        }
        if (!_lastSavedReadingLocation) {
            return;
        }
        var loc_1 = _lastSavedReadingLocation;
        var rtl_ = loc_1.docInfo && loc_1.docInfo.isRightToLeft;
        if (rtl_ !== rtl) {
            debug("RTL differ?! METADATA " + rtl + " vs. DOCUMENT " + rtl_);
        }
        var offset = (left ? -1 : 1) * (rtl ? -1 : 1);
        var currentSpineIndex = publication.Spine.findIndex(function (link) {
            return link.Href === loc_1.locator.href;
        });
        if (currentSpineIndex >= 0) {
            var spineIndex = currentSpineIndex + offset;
            if (spineIndex >= 0 && spineIndex <= (publication.Spine.length - 1)) {
                var nextOrPreviousSpineItem = publication.Spine[spineIndex];
                var uri = new url_1.URL(nextOrPreviousSpineItem.Href, publicationURL);
                uri.hash = "";
                uri.search = "";
                var urlNoQueryParams = uri.toString();
                var activeWebView = win.READIUM2.getActiveWebView();
                handleLink(urlNoQueryParams, false, false, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
                return;
            }
            else {
                electron_1.shell.beep();
            }
        }
    }
    else {
        var goPREVIOUS = left ? !rtl : rtl;
        var payload_1 = {
            direction: rtl ? "RTL" : "LTR",
            go: goPREVIOUS ? "PREVIOUS" : "NEXT",
        };
        var activeWebView_1 = win.READIUM2.getActiveWebView();
        if (activeWebView_1) {
            setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, activeWebView_1.send(events_1.R2_EVENT_PAGE_TURN, payload_1)];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            }); }, 0);
        }
    }
}
exports.navLeftOrRight = navLeftOrRight;
function handleLink(href, previous, useGoto, rcss) {
    var _this = this;
    var special = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        var okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            debug("Readium link fail?! " + href);
        }
    }
    else {
        var okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            if (/^http[s]?:\/\/127\.0\.0\.1/.test(href)) {
                debug("Internal link, fails to match publication document: " + href);
            }
            else {
                debug("External link: " + href);
                (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var err_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4, electron_1.shell.openExternal(href)];
                            case 1:
                                _a.sent();
                                return [3, 3];
                            case 2:
                                err_1 = _a.sent();
                                debug(err_1);
                                return [3, 3];
                            case 3: return [2];
                        }
                    });
                }); })();
            }
        }
    }
}
exports.handleLink = handleLink;
function handleLinkUrl(href, rcss) {
    handleLink(href, undefined, false, rcss);
}
exports.handleLinkUrl = handleLinkUrl;
function handleLinkLocator(location, rcss) {
    var publication = win.READIUM2.publication;
    var publicationURL = win.READIUM2.publicationURL;
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
        debug("handleLinkLocator FAIL " + publicationURL + " + " + (location ? location.href : "NIL"));
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
        handleLink(hrefToLoad, undefined, useGoto, rcss);
    }
}
exports.handleLinkLocator = handleLinkLocator;
var _reloadCounter = 0;
function reloadContent() {
    var activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(function () {
        activeWebView.READIUM2.forceRefresh = true;
        if (activeWebView.READIUM2.link) {
            var uri = new url_1.URL(activeWebView.READIUM2.link.Href, win.READIUM2.publicationURL);
            uri.hash = "";
            uri.search = "";
            var urlNoQueryParams = uri.toString();
            handleLinkUrl(urlNoQueryParams, activeWebView.READIUM2.readiumCss);
        }
    }, 0);
}
exports.reloadContent = reloadContent;
function loadLink(hrefFull, previous, useGoto, rcss) {
    var _this = this;
    var publication = win.READIUM2.publication;
    var publicationURL = win.READIUM2.publicationURL;
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
    debug("R2LOADLINK: " + pubJsonUri + " (" + publicationURL + ") + " + hrefFull + " ==> " + linkPath);
    var pubLink = publication.Spine ? publication.Spine.find(function (spineLink) {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink && publication.Resources) {
        pubLink = publication.Resources.find(function (resLink) {
            return resLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        var hrefNoHash_1;
        try {
            var u = new URI(hrefFull);
            u.hash("").normalizeHash();
            u.search(function (data) {
                data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
                data[url_params_1.URL_PARAM_GOTO] = undefined;
                data[url_params_1.URL_PARAM_CSS] = undefined;
                data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = undefined;
                data[url_params_1.URL_PARAM_DEBUG_VISUALS] = undefined;
                data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
                data[url_params_1.URL_PARAM_REFRESH] = undefined;
            });
            hrefNoHash_1 = u.toString();
        }
        catch (err) {
            debug(err);
        }
        if (hrefNoHash_1) {
            pubLink = publication.Spine ? publication.Spine.find(function (spineLink) {
                return spineLink.Href === hrefNoHash_1;
            }) : undefined;
            if (!pubLink && publication.Resources) {
                pubLink = publication.Resources.find(function (resLink) {
                    return resLink.Href === hrefNoHash_1;
                });
            }
        }
        if (!pubLink) {
            debug("CANNOT LOAD EXT LINK " + pubJsonUri + " (" + publicationURL + ") + " + hrefFull + " (" + hrefNoHash_1 + ") ==> " + linkPath);
            return false;
        }
    }
    if (!pubLink) {
        debug("CANNOT LOAD LINK " + pubJsonUri + " (" + publicationURL + ") + " + hrefFull + " ==> " + linkPath);
        return false;
    }
    var activeWebView = win.READIUM2.getActiveWebView();
    var actualReadiumCss = (activeWebView && activeWebView.READIUM2.readiumCss) ?
        activeWebView.READIUM2.readiumCss :
        readium_css_1.obtainReadiumCss(rcss);
    if (activeWebView) {
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
    }
    var rcssJson = readium_css_1.adjustReadiumCssJsonMessageForFixedLayout(pubLink, actualReadiumCss);
    var rcssJsonstr = JSON.stringify(rcssJson, null, "");
    var rcssJsonstrBase64 = Buffer.from(rcssJsonstr).toString("base64");
    var fileName = path.basename(linkPath);
    var ext = path.extname(fileName).toLowerCase();
    var isAudio = publication.Metadata &&
        publication.Metadata.RDFType &&
        /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType) &&
        ((pubLink.TypeLink && pubLink.TypeLink.startsWith("audio/")) ||
            /\.mp[3|4]$/.test(ext) ||
            /\.wav$/.test(ext) ||
            /\.aac$/.test(ext) ||
            /\.og[g|b|a]$/.test(ext) ||
            /\.aiff$/.test(ext) ||
            /\.wma$/.test(ext) ||
            /\.flac$/.test(ext));
    var linkUri = new URI(hrefFull);
    if (isAudio) {
        if (useGoto) {
            linkUri.hash("").normalizeHash();
            if (pubLink.Duration) {
                var gotoBase64 = linkUri.search(true)[url_params_1.URL_PARAM_GOTO];
                if (gotoBase64) {
                    var str = Buffer.from(gotoBase64, "base64").toString("utf8");
                    var json = JSON.parse(str);
                    var gotoProgression = json.progression;
                    if (typeof gotoProgression !== "undefined") {
                        var time = gotoProgression * pubLink.Duration;
                        linkUri.hash("t=" + time).normalizeHash();
                    }
                }
            }
        }
        linkUri.search(function (data) {
            data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
            data[url_params_1.URL_PARAM_GOTO] = undefined;
            data[url_params_1.URL_PARAM_CSS] = undefined;
            data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = undefined;
            data[url_params_1.URL_PARAM_DEBUG_VISUALS] = undefined;
            data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
            data[url_params_1.URL_PARAM_REFRESH] = undefined;
        });
    }
    else {
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
        var rersJson = epubReadingSystem_1.getEpubReadingSystemInfo();
        var rersJsonstr = JSON.stringify(rersJson, null, "");
        var rersJsonstrBase64_1 = Buffer.from(rersJsonstr).toString("base64");
        linkUri.search(function (data) {
            data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
            data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64_1;
            data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV &&
                win.READIUM2.DEBUG_VISUALS) ?
                "true" : "false";
            data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] =
                win.READIUM2.clipboardInterceptor ?
                    "true" : "false";
        });
    }
    var webviewNeedsForcedRefresh = !isAudio &&
        activeWebView && activeWebView.READIUM2.forceRefresh;
    if (activeWebView) {
        activeWebView.READIUM2.forceRefresh = undefined;
    }
    var webviewNeedsHardRefresh = !isAudio &&
        (win.READIUM2.enableScreenReaderAccessibilityWebViewHardRefresh
            && state_1.isScreenReaderMounted());
    if (!isAudio && !webviewNeedsHardRefresh && !webviewNeedsForcedRefresh &&
        activeWebView && activeWebView.READIUM2.link === pubLink) {
        var goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        var hash = useGoto ? undefined : linkUri.fragment();
        debug("WEBVIEW ALREADY LOADED: " + pubLink.Href);
        var payload_2 = {
            goto: goto,
            hash: hash,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            var msgStr = JSON.stringify(payload_2);
            debug(msgStr);
        }
        if (activeWebView) {
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
                                shiftWebview(activeWebView, 0, undefined);
                                return [4, activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload_2)];
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
                            case 0: return [4, activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload_2)];
                            case 1:
                                _a.sent();
                                return [2];
                        }
                    });
                }); }, 0);
            }
        }
        return true;
    }
    if (activeWebView) {
        if (webviewNeedsForcedRefresh) {
            linkUri.search(function (data) {
                data[url_params_1.URL_PARAM_REFRESH] = "" + ++_reloadCounter;
            });
        }
        if (win.READIUM2.sessionInfo) {
            linkUri.search(function (data) {
                if (win.READIUM2.sessionInfo) {
                    var b64SessionInfo = Buffer.from(win.READIUM2.sessionInfo).toString("base64");
                    data[url_params_1.URL_PARAM_SESSION_INFO] = b64SessionInfo;
                }
            });
        }
        var uriStr = linkUri.toString();
        var needConvert = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
        var uriStr_1 = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
            uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
        if (isAudio) {
            if (IS_DEV) {
                debug("___HARD AUDIO___ WEBVIEW REFRESH: " + uriStr_1);
            }
            var readiumCssBackup = activeWebView.READIUM2.readiumCss;
            win.READIUM2.destroyActiveWebView();
            win.READIUM2.createActiveWebView();
            var newActiveWebView = win.READIUM2.getActiveWebView();
            if (newActiveWebView) {
                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                newActiveWebView.READIUM2.link = pubLink;
                var coverLink = publication.GetCover();
                var title = void 0;
                if (pubLink.Title) {
                    var regExp = /&(nbsp|amp|quot|lt|gt);/g;
                    var map_1 = {
                        amp: "&",
                        gt: ">",
                        lt: "<",
                        nbsp: " ",
                        quot: "\"",
                    };
                    title = pubLink.Title.replace(regExp, function (_match, entityName) {
                        return map_1[entityName] ? map_1[entityName] : entityName;
                    });
                }
                var htmlMarkup = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n<head>\n    <meta charset=\"utf-8\" />\n    <title>" + title + "</title>\n    <base href=\"" + pubJsonUri + "\" id=\"" + readium_css_inject_1.READIUM2_BASEURL_ID + "\" />\n    <style type=\"text/css\">\n    /*<![CDATA[*/\n    /*]]>*/\n    </style>\n\n    <script>\n    //<![CDATA[\n\n    const DEBUG_AUDIO = " + IS_DEV + ";\n    const DEBUG_AUDIO_X = " + audiobook_1.DEBUG_AUDIO + ";\n\n    document.addEventListener(\"DOMContentLoaded\", () => {\n        const _audioElement = document.getElementById(\"" + styles_1.AUDIO_ID + "\");\n\n        _audioElement.addEventListener(\"error\", function()\n            {\n                console.debug(\"-1) error\");\n                if (_audioElement.error) {\n                    // 1 === MEDIA_ERR_ABORTED\n                    // 2 === MEDIA_ERR_NETWORK\n                    // 3 === MEDIA_ERR_DECODE\n                    // 4 === MEDIA_ERR_SRC_NOT_SUPPORTED\n                    console.log(_audioElement.error.code);\n                    console.log(_audioElement.error.message);\n                }\n            }\n        );\n\n        if (DEBUG_AUDIO)\n        {\n            _audioElement.addEventListener(\"load\", function()\n                {\n                    console.debug(\"0) load\");\n                }\n            );\n\n            _audioElement.addEventListener(\"loadstart\", function()\n                {\n                    console.debug(\"1) loadstart\");\n                }\n            );\n\n            _audioElement.addEventListener(\"durationchange\", function()\n                {\n                    console.debug(\"2) durationchange\");\n                }\n            );\n\n            _audioElement.addEventListener(\"loadedmetadata\", function()\n                {\n                    console.debug(\"3) loadedmetadata\");\n                }\n            );\n\n            _audioElement.addEventListener(\"loadeddata\", function()\n                {\n                    console.debug(\"4) loadeddata\");\n                }\n            );\n\n            _audioElement.addEventListener(\"progress\", function()\n                {\n                    console.debug(\"5) progress\");\n                }\n            );\n\n            _audioElement.addEventListener(\"canplay\", function()\n                {\n                    console.debug(\"6) canplay\");\n                }\n            );\n\n            _audioElement.addEventListener(\"canplaythrough\", function()\n                {\n                    console.debug(\"7) canplaythrough\");\n                }\n            );\n\n            _audioElement.addEventListener(\"play\", function()\n                {\n                    console.debug(\"8) play\");\n                }\n            );\n\n            _audioElement.addEventListener(\"pause\", function()\n                {\n                    console.debug(\"9) pause\");\n                }\n            );\n\n            _audioElement.addEventListener(\"ended\", function()\n                {\n                    console.debug(\"10) ended\");\n                }\n            );\n\n            _audioElement.addEventListener(\"seeked\", function()\n                {\n                    console.debug(\"11) seeked\");\n                }\n            );\n\n            if (DEBUG_AUDIO_X) {\n                _audioElement.addEventListener(\"timeupdate\", function()\n                    {\n                        console.debug(\"12) timeupdate\");\n                    }\n                );\n            }\n\n            _audioElement.addEventListener(\"seeking\", function()\n                {\n                    console.debug(\"13) seeking\");\n                }\n            );\n\n            _audioElement.addEventListener(\"waiting\", function()\n                {\n                    console.debug(\"14) waiting\");\n                }\n            );\n\n            _audioElement.addEventListener(\"volumechange\", function()\n                {\n                    console.debug(\"15) volumechange\");\n                }\n            );\n\n            _audioElement.addEventListener(\"suspend\", function()\n                {\n                    console.debug(\"16) suspend\");\n                }\n            );\n\n            _audioElement.addEventListener(\"stalled\", function()\n                {\n                    console.debug(\"17) stalled\");\n                }\n            );\n\n            _audioElement.addEventListener(\"ratechange\", function()\n                {\n                    console.debug(\"18) ratechange\");\n                }\n            );\n\n            _audioElement.addEventListener(\"playing\", function()\n                {\n                    console.debug(\"19) playing\");\n                }\n            );\n\n            _audioElement.addEventListener(\"interruptend\", function()\n                {\n                    console.debug(\"20) interruptend\");\n                }\n            );\n\n            _audioElement.addEventListener(\"interruptbegin\", function()\n                {\n                    console.debug(\"21) interruptbegin\");\n                }\n            );\n\n            _audioElement.addEventListener(\"emptied\", function()\n                {\n                    console.debug(\"22) emptied\");\n                }\n            );\n\n            _audioElement.addEventListener(\"abort\", function()\n                {\n                    console.debug(\"23) abort\");\n                }\n            );\n        }\n    }, false);\n\n    //]]>\n    </script>\n</head>\n<body id=\"" + styles_1.AUDIO_BODY_ID + "\">\n<section id=\"" + styles_1.AUDIO_SECTION_ID + "\">\n" + (title ? "<h3 id=\"" + styles_1.AUDIO_TITLE_ID + "\">" + title + "</h3>" : "") + "\n" + (coverLink ? "<img id=\"" + styles_1.AUDIO_COVER_ID + "\" src=\"" + coverLink.Href + "\" alt=\"\" " + (coverLink.Height ? "height=\"" + coverLink.Height + "\"" : "") + " " + (coverLink.Width ? "width=\"" + coverLink.Width + "\"" : "") + " " + (coverLink.Width || coverLink.Height ? "style=\"" + (coverLink.Height ? "height: " + coverLink.Height + "px !important;" : "") + " " + (coverLink.Width ? "width: " + coverLink.Width + "px !important;" : "") + "\"" : "") + "/>" : "") + "\n    <audio\n        id=\"" + styles_1.AUDIO_ID + "\"\n        " + (audiobook_1.DEBUG_AUDIO ? "controlsx=\"controlsx\"" : "") + "\n        autoplay=\"autoplay\"\n        preload=\"metadata\">\n\n        <source src=\"" + uriStr + "\" type=\"" + pubLink.TypeLink + "\" />\n    </audio>\n    " + (audiobook_1.DEBUG_AUDIO ?
                    "\n<canvas id=\"" + styles_1.AUDIO_BUFFER_CANVAS_ID + "\"> </canvas>\n    "
                    : "") + "\n    <div id=\"" + styles_1.AUDIO_CONTROLS_ID + "\">\n        <button id=\"" + styles_1.AUDIO_PREVIOUS_ID + "\"></button>\n        <button id=\"" + styles_1.AUDIO_REWIND_ID + "\"></button>\n        <button id=\"" + styles_1.AUDIO_PLAYPAUSE_ID + "\"></button>\n        <button id=\"" + styles_1.AUDIO_FORWARD_ID + "\"></button>\n        <button id=\"" + styles_1.AUDIO_NEXT_ID + "\"></button>\n        <input id=\"" + styles_1.AUDIO_SLIDER_ID + "\" type=\"range\" min=\"0\" max=\"100\" value=\"0\" step=\"1\" />\n        <span id=\"" + styles_1.AUDIO_TIME_ID + "\">-</span>\n        <span id=\"" + styles_1.AUDIO_PERCENT_ID + "\">-</span>\n    </div>\n</section>\n</body>\n</html>";
                var contentType = "application/xhtml+xml";
                if (rcssJson.setCSS) {
                    rcssJson.setCSS.paged = false;
                }
                htmlMarkup = readium_css_inject_1.readiumCssTransformHtml(htmlMarkup, rcssJson, contentType);
                var b64HTML = Buffer.from(htmlMarkup).toString("base64");
                var dataUri = "data:" + contentType + ";base64," + b64HTML;
                newActiveWebView.setAttribute("src", dataUri);
            }
            return true;
        }
        else if (webviewNeedsHardRefresh) {
            if (IS_DEV) {
                debug("___HARD___ WEBVIEW REFRESH: " + uriStr_1);
            }
            var readiumCssBackup = activeWebView.READIUM2.readiumCss;
            win.READIUM2.destroyActiveWebView();
            win.READIUM2.createActiveWebView();
            var newActiveWebView = win.READIUM2.getActiveWebView();
            if (newActiveWebView) {
                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                newActiveWebView.READIUM2.link = pubLink;
                newActiveWebView.setAttribute("src", uriStr_1);
            }
            return true;
        }
        else {
            if (IS_DEV) {
                debug("___SOFT___ WEBVIEW REFRESH: " + uriStr_1);
            }
            var webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
                && activeWebView.READIUM2.link !== null;
            activeWebView.READIUM2.link = pubLink;
            if (activeWebView.style.transform !== "none") {
                if (webviewAlreadyHasContent) {
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
    var e_1, _a;
    var publication = win.READIUM2.publication;
    var position;
    if (publication && publication.Spine) {
        var isAudio = publication.Metadata &&
            publication.Metadata.RDFType &&
            /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
        if (isAudio) {
            var metaDuration = publication.Metadata.Duration;
            var totalDuration = 0;
            var timePosition = void 0;
            try {
                for (var _b = tslib_1.__values(publication.Spine), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var spineItem = _c.value;
                    if (typeof spineItem.Duration !== "undefined") {
                        if (docHref === spineItem.Href) {
                            var percent = typeof locator.locations.progression !== "undefined" ?
                                locator.locations.progression : 0;
                            var time = percent * spineItem.Duration;
                            if (typeof timePosition === "undefined") {
                                timePosition = totalDuration + time;
                            }
                        }
                        totalDuration += spineItem.Duration;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (totalDuration !== metaDuration) {
                console.log("DIFFERENT AUDIO DURATIONS?! " + totalDuration + " (spines) !== " + metaDuration + " (metadata)");
            }
            if (typeof timePosition !== "undefined") {
                position = timePosition / totalDuration;
                if (locator.audioPlaybackInfo) {
                    locator.audioPlaybackInfo.globalTime = timePosition;
                    locator.audioPlaybackInfo.globalDuration = totalDuration;
                    locator.audioPlaybackInfo.globalProgression = position;
                }
            }
        }
    }
    _lastSavedReadingLocation = {
        audioPlaybackInfo: locator.audioPlaybackInfo,
        docInfo: locator.docInfo,
        epubPage: locator.epubPage,
        locator: {
            href: docHref,
            locations: {
                cfi: locator.locations.cfi ?
                    locator.locations.cfi : undefined,
                cssSelector: locator.locations.cssSelector ?
                    locator.locations.cssSelector : undefined,
                position: (typeof locator.locations.position !== "undefined") ?
                    locator.locations.position : position,
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
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    var activeWebView = win.READIUM2.getActiveWebView();
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
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, activeWebView.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payloadPing)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); }, 0);
                })];
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
//# sourceMappingURL=location.js.map