"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocatorVisible = exports.setReadingLocationSaver = exports.getCurrentReadingLocation = exports.reloadContent = exports.handleLinkLocator = exports.handleLinkUrl = exports.handleLink = exports.navLeftOrRight = exports.navPreviousOrNext = exports.shiftWebview = exports.locationHandleIpcMessage = exports.setWebViewStyle = void 0;
var tslib_1 = require("tslib");
var debug_ = require("debug");
var electron_1 = require("electron");
var path = require("path");
var url_1 = require("url");
var metadata_properties_1 = require("r2-shared-js/dist/es5/src/models/metadata-properties");
var UrlUtils_1 = require("r2-utils-js/dist/es5/src/_utils/http/UrlUtils");
var audiobook_1 = require("../common/audiobook");
var events_1 = require("../common/events");
var readium_css_inject_1 = require("../common/readium-css-inject");
var sessions_1 = require("../common/sessions");
var styles_1 = require("../common/styles");
var audiobook_2 = require("./audiobook");
var url_params_1 = require("./common/url-params");
var epubReadingSystem_1 = require("./epubReadingSystem");
var media_overlays_1 = require("./media-overlays");
var readium_css_1 = require("./readium-css");
var URI = require("urijs");
var debug = debug_("r2:navigator#electron/renderer/location");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var win = global.window;
var webviewStyleCommon = "display: flex; border: 0; margin: 0; padding: 0; box-sizing: border-box; position: absolute; ";
var webviewStyleLeft = "opacity: 0; " + webviewStyleCommon + "left: 0; width: 50%; bottom: 0; top: 0;";
var webviewStyleRight = "opacity: 0; " + webviewStyleCommon + "left: 50%; right: 0; bottom: 0; top: 0;";
var webviewStyleCenter = "opacity: 0; " + webviewStyleCommon + "left: 0; right: 0; bottom: 0; top: 0;";
var webviewStyleLeft_ = "opacity: 1; " + webviewStyleCommon +
    "left: 0; top: calc(0 - max(var(--R2_FXL_Y_SHIFT), var(--R2_FXL_Y_SHIFT_)));";
var webviewStyleRight_ = "opacity: 1; " + webviewStyleCommon +
    "left: calc(50% - var(--R2_FXL_X_SHIFT));" +
    "top: calc(0 - max(var(--R2_FXL_Y_SHIFT), var(--R2_FXL_Y_SHIFT_)));";
var webviewStyleCenter_ = "opacity: 1; " + webviewStyleCommon +
    "left: 0; top: calc(0 - var(--R2_FXL_Y_SHIFT));";
function setWebViewStyle(wv, wvSlot, fxl) {
    var v = fxl ? JSON.stringify(fxl).replace(/{/g, "").replace(/}/g, "").replace(/"/g, "") : "NO FXL";
    debug("setWebViewStyle fxl: " + v);
    if (fxl) {
        var wvSlot_ = wv.getAttribute("data-wv-slot");
        if (!wvSlot_) {
            wvSlot_ = wvSlot;
        }
        var tx = fxl.tx >= 0 ? fxl.tx : 0;
        if (wvSlot_ === styles_1.WebViewSlotEnum.left || wvSlot_ === styles_1.WebViewSlotEnum.center) {
            win.document.documentElement.style.setProperty("--R2_FXL_X_SHIFT", fxl.tx >= 0 ? "0px" : "".concat(fxl.tx, "px"));
        }
        var ty = fxl.ty >= 0 ? fxl.ty : 0;
        win.document.documentElement.style.setProperty((wvSlot_ === styles_1.WebViewSlotEnum.left || wvSlot_ === styles_1.WebViewSlotEnum.center) ? "--R2_FXL_Y_SHIFT" : "--R2_FXL_Y_SHIFT_", fxl.ty >= 0 ? "0px" : "".concat(fxl.ty, "px"));
        var cxx = " width:".concat(fxl.width * fxl.scale, "px; height:").concat(fxl.height * fxl.scale, "px; transform-origin: 0 0; transform: translate(").concat(tx, "px, ").concat(ty, "px) scale(").concat("1", ");");
        wv.setAttribute("style", wvSlot_ === styles_1.WebViewSlotEnum.center ? webviewStyleCenter_ + cxx :
            (wvSlot_ === styles_1.WebViewSlotEnum.left ? webviewStyleLeft_ + cxx :
                webviewStyleRight_ + cxx));
        wv.setAttribute("data-wv-fxl", v);
    }
    else {
        wv.setAttribute("style", wvSlot === styles_1.WebViewSlotEnum.center ? webviewStyleCenter :
            (wvSlot === styles_1.WebViewSlotEnum.left ? webviewStyleLeft :
                webviewStyleRight));
        wv.removeAttribute("data-wv-fxl");
        wv.setAttribute("data-wv-slot", wvSlot === styles_1.WebViewSlotEnum.center ? "center" :
            (wvSlot === styles_1.WebViewSlotEnum.left ? "left" :
                "right"));
    }
}
exports.setWebViewStyle = setWebViewStyle;
function locationHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    var activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
    }
    else if (eventChannel === events_1.R2_EVENT_SHIFT_VIEW_X) {
        if (!activeWebView.hasAttribute("data-wv-fxl")) {
            shiftWebview(activeWebView, eventArgs[0].offset, eventArgs[0].backgroundColor);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_PAGE_TURN_RES) {
        var payload = eventArgs[0];
        if (payload.nav) {
            navPreviousOrNext(payload.go === "PREVIOUS");
            return true;
        }
        var publication = win.READIUM2.publication;
        var publicationURL = win.READIUM2.publicationURL;
        if (!publication) {
            return true;
        }
        var doNothing = payload.go === "";
        if (doNothing) {
            return true;
        }
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
            debug("locationHandleIpcMessage R2_EVENT_PAGE_TURN_RES: ".concat(urlNoQueryParams));
            handleLink(urlNoQueryParams, goPREVIOUS, false, activeWebView.READIUM2.readiumCss);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_READING_LOCATION_CLEAR_SELECTION) {
        if (_lastSavedReadingLocation === null || _lastSavedReadingLocation === void 0 ? void 0 : _lastSavedReadingLocation.selectionInfo) {
            _lastSavedReadingLocation.selectionInfo = undefined;
        }
    }
    else if (eventChannel === events_1.R2_EVENT_READING_LOCATION) {
        var payload = eventArgs[0];
        if (activeWebView.READIUM2.link) {
            _saveReadingLocation(activeWebView, payload);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_LINK) {
        var payload = eventArgs[0];
        debug("locationHandleIpcMessage R2_EVENT_LINK: ".concat(payload.url));
        var href = payload.url;
        if (!/^(https?|thoriumhttps):\/\//.test(href) &&
            !href.startsWith((sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) &&
            activeWebView.READIUM2.link) {
            var sourceUrl = new url_1.URL(activeWebView.READIUM2.link.Href, win.READIUM2.publicationURL);
            var destUrl = new url_1.URL(href, sourceUrl);
            href = destUrl.toString();
            debug("R2_EVENT_LINK ABSOLUTE-ized: ".concat(href));
        }
        var eventPayload = {
            url: href,
            rcss: activeWebView.READIUM2.readiumCss,
        };
        electron_1.ipcRenderer.emit(events_1.R2_EVENT_LINK, eventPayload);
    }
    else if (eventChannel === events_1.R2_EVENT_AUDIO_PLAYBACK_RATE) {
        var payload = eventArgs[0];
        (0, audiobook_2.setCurrentAudioPlaybackRate)(payload.speed);
    }
    else {
        return false;
    }
    return true;
}
exports.locationHandleIpcMessage = locationHandleIpcMessage;
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, function (event, payload) {
    if (!win.READIUM2) {
        return;
    }
    debug("R2_EVENT_LINK (ipcRenderer.on)");
    var pay = (!payload && event.url) ? event : payload;
    debug(pay.url);
    if (pay.url.indexOf("#" + url_params_1.FRAG_ID_CSS_SELECTOR) >= 0) {
        debug("R2_EVENT_LINK (ipcRenderer.on) SKIP link activation [FRAG_ID_CSS_SELECTOR]");
        return;
    }
    var activeWebView = pay.rcss ? undefined : win.READIUM2.getFirstOrSecondWebView();
    handleLinkUrl(pay.url, pay.rcss ? pay.rcss :
        (activeWebView ? activeWebView.READIUM2.readiumCss : undefined));
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
        webview.style.transform = "translateX(".concat(offset, "px)");
    }
}
exports.shiftWebview = shiftWebview;
function navPreviousOrNext(goPREVIOUS, spineNav, ignorePageSpreadHandling) {
    var _this = this;
    var publication = win.READIUM2.publication;
    var publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return undefined;
    }
    if (!publication.Spine) {
        return undefined;
    }
    var loc = _lastSavedReadingLocation;
    var href = loc ? loc.locator.href : undefined;
    if (!ignorePageSpreadHandling) {
        var linkFirst = void 0;
        var linkSecond = void 0;
        var firstWebView = win.READIUM2.getFirstWebView();
        if (firstWebView) {
            linkFirst = firstWebView.READIUM2.link;
        }
        var secondWebView = win.READIUM2.getSecondWebView(false);
        if (secondWebView) {
            linkSecond = secondWebView.READIUM2.link;
        }
        if (linkFirst && linkSecond) {
            var indexFirst = publication.Spine.indexOf(linkFirst);
            var indexSecond = publication.Spine.indexOf(linkSecond);
            if (indexSecond >= 0 && indexFirst >= 0) {
                var boundaryLink = indexSecond < indexFirst ?
                    (goPREVIOUS ? linkSecond : linkFirst) :
                    (goPREVIOUS ? linkFirst : linkSecond);
                debug("navLeftOrRight spineNav = true force ".concat(href, " => ").concat(boundaryLink.Href));
                spineNav = true;
                href = boundaryLink.Href;
            }
        }
    }
    if (spineNav) {
        if (!href) {
            return undefined;
        }
        var offset = goPREVIOUS ? -1 : 1;
        var currentSpineIndex = publication.Spine.findIndex(function (link) {
            return link.Href === href;
        });
        if (currentSpineIndex >= 0) {
            var spineIndex = currentSpineIndex + offset;
            if (spineIndex >= 0 && spineIndex <= (publication.Spine.length - 1)) {
                var nextOrPreviousSpineItem = publication.Spine[spineIndex];
                var uri = new url_1.URL(nextOrPreviousSpineItem.Href, publicationURL);
                uri.hash = "";
                uri.search = "";
                var urlNoQueryParams = uri.toString();
                var activeWebView = win.READIUM2.getFirstOrSecondWebView();
                debug("navLeftOrRight: ".concat(urlNoQueryParams));
                handleLink(urlNoQueryParams, goPREVIOUS, false, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
                return nextOrPreviousSpineItem;
            }
            else {
                electron_1.shell.beep();
            }
        }
        (0, media_overlays_1.mediaOverlaysInterrupt)();
    }
    else {
        (0, media_overlays_1.mediaOverlaysInterrupt)();
        var payload_1 = {
            go: goPREVIOUS ? "PREVIOUS" : "NEXT",
        };
        var activeWebView_1 = win.READIUM2.getFirstOrSecondWebView();
        if (activeWebView_1) {
            setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!((_a = activeWebView_1.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                            return [4, activeWebView_1.send(events_1.R2_EVENT_PAGE_TURN, payload_1)];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2: return [2];
                    }
                });
            }); }, 0);
        }
    }
    return undefined;
}
exports.navPreviousOrNext = navPreviousOrNext;
function navLeftOrRight(left, spineNav, ignorePageSpreadHandling) {
    var _a;
    var loc = _lastSavedReadingLocation;
    var rtl = (0, readium_css_1.isRTL_PackageMeta)() ||
        (typeof ((_a = loc === null || loc === void 0 ? void 0 : loc.docInfo) === null || _a === void 0 ? void 0 : _a.isRightToLeft) !== "undefined" ?
            loc.docInfo.isRightToLeft :
            (0, readium_css_1.isRTL_PackageMeta)());
    var goPREVIOUS = left ? !rtl : rtl;
    return navPreviousOrNext(goPREVIOUS, spineNav, ignorePageSpreadHandling);
}
exports.navLeftOrRight = navLeftOrRight;
function handleLink(href, previous, useGoto, rcss) {
    var _this = this;
    debug("handleLink: ".concat(href));
    var special = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        debug("handleLink R2 URL");
        var okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            debug("Readium link fail?! ".concat(href));
        }
    }
    else {
        debug("handleLink non-R2 URL");
        var okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            if (/^https?:\/\/127\.0\.0\.1/.test(href)) {
                debug("Internal link, fails to match publication document: ".concat(href));
            }
            else {
                debug("External link: ".concat(href));
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
    debug("handleLinkUrl: ".concat(href));
    handleLink(href, undefined, false, rcss);
}
exports.handleLinkUrl = handleLinkUrl;
function handleLinkLocator(location, rcss) {
    var _a;
    var rangeInfo = (_a = location === null || location === void 0 ? void 0 : location.locations) === null || _a === void 0 ? void 0 : _a.rangeInfo;
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
        debug("handleLinkLocator FAIL ".concat(publicationURL, " + ").concat(location ? location.href : "NIL"));
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
            (useGoto ? ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                (0, UrlUtils_1.encodeURIComponent_RFC3986)(Buffer.from(JSON.stringify(linkToLoadGoto, null, "")).toString("base64"))) :
                "") +
            ((useGoto && rangeInfo) ? ("&" + url_params_1.URL_PARAM_GOTO_DOM_RANGE + "=" +
                (0, UrlUtils_1.encodeURIComponent_RFC3986)(Buffer.from(JSON.stringify(rangeInfo, null, "")).toString("base64"))) :
                "");
        debug("handleLinkLocator: ".concat(hrefToLoad));
        handleLink(hrefToLoad, undefined, useGoto, rcss);
    }
}
exports.handleLinkLocator = handleLinkLocator;
var _reloadCounter = 0;
function reloadContent() {
    var e_1, _a;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    try {
        for (var activeWebViews_1 = tslib_1.__values(activeWebViews), activeWebViews_1_1 = activeWebViews_1.next(); !activeWebViews_1_1.done; activeWebViews_1_1 = activeWebViews_1.next()) {
            var activeWebView = activeWebViews_1_1.value;
            reloadWebView(activeWebView);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (activeWebViews_1_1 && !activeWebViews_1_1.done && (_a = activeWebViews_1.return)) _a.call(activeWebViews_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
exports.reloadContent = reloadContent;
function reloadWebView(activeWebView) {
    setTimeout(function () {
        activeWebView.READIUM2.forceRefresh = true;
        if (activeWebView.READIUM2.link) {
            var uri = new url_1.URL(activeWebView.READIUM2.link.Href, win.READIUM2.publicationURL);
            uri.hash = "";
            uri.search = "";
            var urlNoQueryParams = uri.toString();
            debug("reloadContent: ".concat(urlNoQueryParams));
            handleLinkUrl(urlNoQueryParams, activeWebView.READIUM2.readiumCss);
        }
    }, 0);
}
function loadLink(hrefToLoad, previous, useGoto, rcss, secondWebView) {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var publication = win.READIUM2.publication;
    var publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return false;
    }
    (0, media_overlays_1.mediaOverlaysInterrupt)();
    var hrefToLoadHttp = hrefToLoad;
    if (hrefToLoadHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefToLoadHttp = (0, sessions_1.convertCustomSchemeToHttpUrl)(hrefToLoadHttp);
    }
    var pubIsServedViaSpecialUrlProtocol = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    var publicationURLHttp = pubIsServedViaSpecialUrlProtocol ?
        (0, sessions_1.convertCustomSchemeToHttpUrl)(publicationURL) : publicationURL;
    var hrefToLoadHttpObj = new url_1.URL(hrefToLoadHttp);
    hrefToLoadHttpObj.hash = "";
    hrefToLoadHttpObj.search = "";
    var publicationURLHttpObj = new url_1.URL(publicationURLHttp);
    publicationURLHttpObj.hash = "";
    publicationURLHttpObj.search = "";
    var rootPath = publicationURLHttpObj.pathname.replace(/manifest\.json$/, "");
    var linkPath = hrefToLoadHttpObj.pathname.replace(rootPath, "");
    linkPath = decodeURIComponent(linkPath);
    debug("R2LOADLINK: ".concat(hrefToLoad, " ... ").concat(publicationURL, " ==> ").concat(linkPath));
    var pubLink = publication.Spine ? publication.Spine.find(function (spineLink) {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink && publication.Resources) {
        pubLink = publication.Resources.find(function (resLink) {
            return resLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        var hrefToLoadHttpNoHash_1;
        try {
            var hrefToLoadHttpObjUri = new URI(hrefToLoadHttp);
            hrefToLoadHttpObjUri.hash("").normalizeHash();
            hrefToLoadHttpObjUri.search(function (data) {
                data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
                data[url_params_1.URL_PARAM_GOTO] = undefined;
                data[url_params_1.URL_PARAM_GOTO_DOM_RANGE] = undefined;
                data[url_params_1.URL_PARAM_CSS] = undefined;
                data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = undefined;
                data[url_params_1.URL_PARAM_DEBUG_VISUALS] = undefined;
                data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
                data[url_params_1.URL_PARAM_REFRESH] = undefined;
                data[url_params_1.URL_PARAM_WEBVIEW_SLOT] = undefined;
                data[url_params_1.URL_PARAM_SECOND_WEBVIEW] = undefined;
                data[url_params_1.URL_PARAM_HIGHLIGHTS] = undefined;
            });
            hrefToLoadHttpNoHash_1 = hrefToLoadHttpObjUri.toString();
        }
        catch (err) {
            debug(err);
        }
        if (hrefToLoadHttpNoHash_1) {
            pubLink = publication.Spine ? publication.Spine.find(function (spineLink) {
                return spineLink.Href === hrefToLoadHttpNoHash_1;
            }) : undefined;
            if (!pubLink && publication.Resources) {
                pubLink = publication.Resources.find(function (resLink) {
                    return resLink.Href === hrefToLoadHttpNoHash_1;
                });
            }
        }
        if (!pubLink) {
            debug("CANNOT LOAD EXT LINK ".concat(hrefToLoad, " ... ").concat(publicationURL, " --- (").concat(hrefToLoadHttpNoHash_1, ") ==> ").concat(linkPath));
            return false;
        }
    }
    if (!pubLink) {
        debug("CANNOT LOAD LINK ".concat(hrefToLoad, " ... ").concat(publicationURL, " ==> ").concat(linkPath));
        return false;
    }
    if (!secondWebView) {
        win.document.documentElement.style.setProperty("--R2_FXL_X_SHIFT", "0px");
        win.document.documentElement.style.setProperty("--R2_FXL_Y_SHIFT", "0px");
        win.document.documentElement.style.setProperty("--R2_FXL_Y_SHIFT_", "0px");
    }
    var webview1 = win.READIUM2.getFirstWebView();
    var webview2 = win.READIUM2.getSecondWebView(false);
    var webviewSpreadSwap = secondWebView ?
        (webview2 && webview1 && webview1.READIUM2.link === pubLink) :
        (webview2 && webview2.READIUM2.link === pubLink);
    var secondWebViewWasJustCreated = secondWebView && !webviewSpreadSwap && !webview2;
    var activeWebView = webviewSpreadSwap ?
        (secondWebView ? webview1 : win.READIUM2.getSecondWebView(true)) :
        (secondWebView ? win.READIUM2.getSecondWebView(true) : webview1);
    var actualReadiumCss = (activeWebView && activeWebView.READIUM2.readiumCss) ?
        activeWebView.READIUM2.readiumCss :
        (0, readium_css_1.obtainReadiumCss)(rcss);
    if (activeWebView) {
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
    }
    var fileName = path.basename(linkPath);
    var ext = path.extname(fileName);
    var isAudio = publication.Metadata &&
        publication.Metadata.RDFType &&
        /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType) &&
        ((pubLink.TypeLink && pubLink.TypeLink.startsWith("audio/")) ||
            /\.mp[3|4]$/i.test(ext) ||
            /\.wav$/i.test(ext) ||
            /\.aac$/i.test(ext) ||
            /\.og[g|b|a]$/i.test(ext) ||
            /\.aiff$/i.test(ext) ||
            /\.wma$/i.test(ext) ||
            /\.flac$/i.test(ext));
    var webViewSlot = styles_1.WebViewSlotEnum.center;
    var loadingSecondWebView;
    var linkIndex = publication.Spine ? publication.Spine.indexOf(pubLink) : -1;
    if (publication.Spine &&
        linkIndex >= 0 &&
        (0, readium_css_1.isFixedLayout)(pubLink)) {
        var rtl = (0, readium_css_1.isRTL_PackageMeta)();
        var publicationSpreadNone_1 = ((_b = (_a = publication.Metadata) === null || _a === void 0 ? void 0 : _a.Rendition) === null || _b === void 0 ? void 0 : _b.Spread) === metadata_properties_1.SpreadEnum.None;
        var slotOfFirstPageInSpread_1 = rtl ? metadata_properties_1.PageEnum.Right : metadata_properties_1.PageEnum.Left;
        var slotOfSecondPageInSpread_1 = slotOfFirstPageInSpread_1 === metadata_properties_1.PageEnum.Right ? metadata_properties_1.PageEnum.Left : metadata_properties_1.PageEnum.Right;
        var linkSpreadNoneForced_1 = ((_c = rcss === null || rcss === void 0 ? void 0 : rcss.setCSS) === null || _c === void 0 ? void 0 : _c.colCount) === "1" ||
            ((_d = rcss === null || rcss === void 0 ? void 0 : rcss.setCSS) === null || _d === void 0 ? void 0 : _d.colCount) === "auto" &&
                win.READIUM2.domSlidingViewport &&
                win.READIUM2.domSlidingViewport.clientWidth !== 0 &&
                win.READIUM2.domSlidingViewport.clientHeight !== 0 &&
                win.READIUM2.domSlidingViewport.clientWidth < win.READIUM2.domSlidingViewport.clientHeight;
        publication.Spine.forEach(function (spineLink, i) {
            var _a, _b, _c, _d, _e;
            spineLink.__notInSpread = false;
            spineLink.__notInSpreadForced = false;
            if (!(0, readium_css_1.isFixedLayout)(spineLink)) {
                spineLink.__notInSpread = true;
                if (!spineLink.Properties) {
                    spineLink.Properties = new metadata_properties_1.Properties();
                }
                spineLink.Properties.Page = metadata_properties_1.PageEnum.Center;
                return;
            }
            if (linkSpreadNoneForced_1) {
                spineLink.__notInSpreadForced = true;
            }
            var linkSpreadNone = linkSpreadNoneForced_1 || ((_a = spineLink.Properties) === null || _a === void 0 ? void 0 : _a.Spread) === metadata_properties_1.SpreadEnum.None;
            var linkSpreadOther = !linkSpreadNone && ((_b = spineLink.Properties) === null || _b === void 0 ? void 0 : _b.Spread);
            var notInSpread = linkSpreadNone || (publicationSpreadNone_1 && !linkSpreadOther);
            spineLink.__notInSpread = notInSpread;
            if (((_c = spineLink.Properties) === null || _c === void 0 ? void 0 : _c.Page) &&
                spineLink.Properties.Page !== metadata_properties_1.PageEnum.Left &&
                spineLink.Properties.Page !== metadata_properties_1.PageEnum.Right) {
                spineLink.__notInSpread = true;
            }
            if (!((_d = spineLink.Properties) === null || _d === void 0 ? void 0 : _d.Page)) {
                if (!spineLink.Properties) {
                    spineLink.Properties = new metadata_properties_1.Properties();
                }
                if (i === 0) {
                    spineLink.__notInSpread = true;
                    spineLink.Properties.Page = notInSpread ? metadata_properties_1.PageEnum.Center : slotOfSecondPageInSpread_1;
                }
                else {
                    var firstPageInSpread = publication.Spine &&
                        ((_e = publication.Spine[i - 1].Properties) === null || _e === void 0 ? void 0 : _e.Page) !== slotOfFirstPageInSpread_1;
                    spineLink.Properties.Page = notInSpread ? metadata_properties_1.PageEnum.Center :
                        (firstPageInSpread ? slotOfFirstPageInSpread_1 : slotOfSecondPageInSpread_1);
                }
            }
        });
        var prev = previous ? true : false;
        var page = pubLink.__notInSpreadForced ? metadata_properties_1.PageEnum.Center : (_e = pubLink.Properties) === null || _e === void 0 ? void 0 : _e.Page;
        if (page === metadata_properties_1.PageEnum.Left) {
            webViewSlot = styles_1.WebViewSlotEnum.left;
            if (!secondWebView && !pubLink.__notInSpread) {
                var otherIndex = linkIndex + (rtl ? -1 : 1);
                var otherLink = publication.Spine[otherIndex];
                if (otherLink && !otherLink.__notInSpread &&
                    ((_f = otherLink.Properties) === null || _f === void 0 ? void 0 : _f.Page) === metadata_properties_1.PageEnum.Right) {
                    var needToInverse = !webviewSpreadSwap &&
                        prev && publication.Spine.indexOf(pubLink) > otherIndex;
                    var otherLinkURLObj = new url_1.URL(otherLink.Href, publicationURL);
                    otherLinkURLObj.hash = "";
                    otherLinkURLObj.search = "";
                    loadingSecondWebView = otherLink;
                    loadLink(otherLinkURLObj.toString(), undefined, false, rcss, needToInverse ? false : true);
                    if (needToInverse) {
                        return true;
                    }
                }
            }
            if (activeWebView) {
                debug("loadLink LEFT ... setWebViewStyle");
                setWebViewStyle(activeWebView, styles_1.WebViewSlotEnum.left);
            }
        }
        else if (page === metadata_properties_1.PageEnum.Right) {
            webViewSlot = styles_1.WebViewSlotEnum.right;
            if (!secondWebView && !pubLink.__notInSpread) {
                var otherIndex = linkIndex + (!rtl ? -1 : 1);
                var otherLink = publication.Spine[otherIndex];
                if (otherLink && !otherLink.__notInSpread &&
                    ((_g = otherLink.Properties) === null || _g === void 0 ? void 0 : _g.Page) === metadata_properties_1.PageEnum.Left) {
                    var needToInverse = !webviewSpreadSwap &&
                        prev && publication.Spine.indexOf(pubLink) > otherIndex;
                    var otherLinkURLObj = new url_1.URL(otherLink.Href, publicationURL);
                    otherLinkURLObj.hash = "";
                    otherLinkURLObj.search = "";
                    loadingSecondWebView = otherLink;
                    loadLink(otherLinkURLObj.toString(), undefined, false, rcss, needToInverse ? false : true);
                    if (needToInverse) {
                        return true;
                    }
                }
            }
            if (activeWebView) {
                debug("loadLink RIGHT ... setWebViewStyle");
                setWebViewStyle(activeWebView, styles_1.WebViewSlotEnum.right);
            }
        }
        else {
            webViewSlot = styles_1.WebViewSlotEnum.center;
            if (activeWebView) {
                debug("loadLink CENTER ... setWebViewStyle");
                setWebViewStyle(activeWebView, styles_1.WebViewSlotEnum.center);
            }
        }
    }
    if (!secondWebView && !loadingSecondWebView && !webviewSpreadSwap) {
        win.READIUM2.destroySecondWebView();
    }
    var rcssJson = (0, readium_css_1.adjustReadiumCssJsonMessageForFixedLayout)(activeWebView, pubLink || (activeWebView === null || activeWebView === void 0 ? void 0 : activeWebView.READIUM2.link), actualReadiumCss);
    var rcssJsonstr = JSON.stringify(rcssJson, null, "");
    var rcssJsonstrBase64 = Buffer.from(rcssJsonstr).toString("base64");
    var hrefToLoadHttpUri = new URI(hrefToLoadHttp);
    if ((_h = hrefToLoadHttpUri.fragment()) === null || _h === void 0 ? void 0 : _h.startsWith(url_params_1.FRAG_ID_CSS_SELECTOR)) {
        var cssSelector_1 = decodeURIComponent(hrefToLoadHttpUri.fragment().substring(url_params_1.FRAG_ID_CSS_SELECTOR.length));
        debug("FRAG_ID_CSS_SELECTOR: " + cssSelector_1);
        hrefToLoadHttpUri.hash("").normalizeHash();
        hrefToLoadHttpUri.search(function (data) {
            data[url_params_1.URL_PARAM_GOTO] = Buffer.from(JSON.stringify({ cssSelector: cssSelector_1 }, null, "")).toString("base64");
        });
        useGoto = true;
    }
    if (isAudio) {
        if (useGoto) {
            hrefToLoadHttpUri.hash("").normalizeHash();
            if (pubLink.Duration) {
                var gotoBase64 = hrefToLoadHttpUri.search(true)[url_params_1.URL_PARAM_GOTO];
                if (gotoBase64) {
                    var str = Buffer.from(gotoBase64, "base64").toString("utf8");
                    var json = JSON.parse(str);
                    var gotoProgression = json.progression;
                    if (typeof gotoProgression !== "undefined") {
                        var time = gotoProgression * pubLink.Duration;
                        hrefToLoadHttpUri.hash("t=".concat(time)).normalizeHash();
                    }
                }
            }
        }
        hrefToLoadHttpUri.search(function (data) {
            data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
            data[url_params_1.URL_PARAM_GOTO] = undefined;
            data[url_params_1.URL_PARAM_GOTO_DOM_RANGE] = undefined;
            data[url_params_1.URL_PARAM_CSS] = undefined;
            data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = undefined;
            data[url_params_1.URL_PARAM_DEBUG_VISUALS] = undefined;
            data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
            data[url_params_1.URL_PARAM_REFRESH] = undefined;
            data[url_params_1.URL_PARAM_WEBVIEW_SLOT] = undefined;
            data[url_params_1.URL_PARAM_SECOND_WEBVIEW] = undefined;
            data[url_params_1.URL_PARAM_HIGHLIGHTS] = undefined;
        });
    }
    else {
        hrefToLoadHttpUri.search(function (data) {
            if (typeof previous === "undefined") {
                data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
            }
            else {
                data[url_params_1.URL_PARAM_PREVIOUS] = previous ? "true" : "false";
            }
            if (!useGoto) {
                data[url_params_1.URL_PARAM_GOTO] = undefined;
                data[url_params_1.URL_PARAM_GOTO_DOM_RANGE] = undefined;
            }
        });
        if (useGoto) {
            hrefToLoadHttpUri.hash("").normalizeHash();
        }
        var rersJson = (0, epubReadingSystem_1.getEpubReadingSystemInfo)();
        var rersJsonstr = JSON.stringify(rersJson, null, "");
        var rersJsonstrBase64_1 = Buffer.from(rersJsonstr).toString("base64");
        hrefToLoadHttpUri.search(function (data) {
            data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
            data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64_1;
            data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV &&
                win.READIUM2.DEBUG_VISUALS) ?
                "true" : "false";
            data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] =
                win.READIUM2.clipboardInterceptor ?
                    "true" : "false";
            data[url_params_1.URL_PARAM_WEBVIEW_SLOT] = webViewSlot;
            data[url_params_1.URL_PARAM_SECOND_WEBVIEW] = secondWebView ? "1" :
                (loadingSecondWebView ? "0".concat(loadingSecondWebView.Href) : "0");
        });
    }
    var webviewNeedsForcedRefresh = !isAudio && (win.READIUM2.ttsClickEnabled ||
        activeWebView && activeWebView.READIUM2.forceRefresh);
    if (activeWebView) {
        activeWebView.READIUM2.forceRefresh = undefined;
    }
    var webviewNeedsHardRefresh = !isAudio &&
        (win.READIUM2.enableScreenReaderAccessibilityWebViewHardRefresh
            && win.READIUM2.isScreenReaderMounted);
    if (!isAudio && !webviewNeedsHardRefresh && !webviewNeedsForcedRefresh &&
        activeWebView && activeWebView.READIUM2.link === pubLink && !(0, readium_css_1.isFixedLayout)(pubLink)) {
        var goto = useGoto ? hrefToLoadHttpUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        var gotoDomRange = useGoto ? hrefToLoadHttpUri.search(true)[url_params_1.URL_PARAM_GOTO_DOM_RANGE] : undefined;
        var hash = useGoto ? undefined : hrefToLoadHttpUri.fragment();
        debug("WEBVIEW ALREADY LOADED: " + pubLink.Href);
        var payload_2 = {
            goto: goto,
            gotoDomRange: gotoDomRange,
            hash: hash,
            isSecondWebView: secondWebView ? true : false,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            var msgStr = JSON.stringify(payload_2);
            debug(msgStr);
        }
        if (activeWebView) {
            if (activeWebView.style.transform &&
                activeWebView.style.transform !== "none" &&
                !activeWebView.hasAttribute("data-wv-fxl")) {
                activeWebView.style.opacity = "0";
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return tslib_1.__generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                shiftWebview(activeWebView, 0, undefined);
                                if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                                return [4, activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload_2)];
                            case 1:
                                _b.sent();
                                _b.label = 2;
                            case 2: return [2];
                        }
                    });
                }); }, 10);
            }
            else {
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return tslib_1.__generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                                return [4, activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload_2)];
                            case 1:
                                _b.sent();
                                _b.label = 2;
                            case 2: return [2];
                        }
                    });
                }); }, 0);
            }
        }
        return true;
    }
    if (activeWebView) {
        if (webviewNeedsForcedRefresh) {
            hrefToLoadHttpUri.search(function (data) {
                data[url_params_1.URL_PARAM_REFRESH] = "".concat(++_reloadCounter);
            });
        }
        if (win.READIUM2.sessionInfo) {
            hrefToLoadHttpUri.search(function (data) {
                if (win.READIUM2.sessionInfo) {
                    var b64SessionInfo = Buffer.from(win.READIUM2.sessionInfo).toString("base64");
                    data[url_params_1.URL_PARAM_SESSION_INFO] = b64SessionInfo;
                }
            });
        }
        var uriStr = hrefToLoadHttpUri.toString();
        var uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
            (pubIsServedViaSpecialUrlProtocol ? (0, sessions_1.convertHttpUrlToCustomScheme)(uriStr) : uriStr);
        if (isAudio) {
            if (IS_DEV) {
                debug("___HARD AUDIO___ WEBVIEW REFRESH: ".concat(uriStr_));
            }
            var readiumCssBackup = activeWebView.READIUM2.readiumCss;
            if (secondWebView) {
                if (!secondWebViewWasJustCreated) {
                    win.READIUM2.destroySecondWebView();
                    win.READIUM2.createSecondWebView();
                }
            }
            else {
                win.READIUM2.destroyFirstWebView();
                win.READIUM2.createFirstWebView();
            }
            var newActiveWebView = secondWebView ?
                win.READIUM2.getSecondWebView(false) :
                win.READIUM2.getFirstWebView();
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
                var audioPlaybackRate = (0, audiobook_2.getCurrentAudioPlaybackRate)();
                if (rcssJson.setCSS) {
                    rcssJson.setCSS.paged = false;
                }
                var htmlMarkup = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n<head>\n    <meta charset=\"utf-8\" />\n    ".concat(title ? "<title>".concat(title, "</title>") : "<!-- NO TITLE -->", "\n    <base href=\"").concat(publicationURLHttp, "\" id=\"").concat(readium_css_inject_1.READIUM2_BASEURL_ID, "\" />\n    <style type=\"text/css\">\n    /*<![CDATA[*/\n    /*]]>*/\n    </style>\n\n    <script>\n    //<![CDATA[\n\n    const DEBUG_AUDIO = ").concat(IS_DEV, ";\n    const DEBUG_AUDIO_X = ").concat(audiobook_1.DEBUG_AUDIO, ";\n\n    document.addEventListener(\"DOMContentLoaded\", () => {\n        const _audioElement = document.getElementById(\"").concat(styles_1.AUDIO_ID, "\");\n        _audioElement.playbackRate = ").concat(audioPlaybackRate, ";\n\n        _audioElement.addEventListener(\"error\", function()\n            {\n                console.debug(\"-1) error\");\n                if (_audioElement.error) {\n                    // 1 === MEDIA_ERR_ABORTED\n                    // 2 === MEDIA_ERR_NETWORK\n                    // 3 === MEDIA_ERR_DECODE\n                    // 4 === MEDIA_ERR_SRC_NOT_SUPPORTED\n                    console.log(_audioElement.error.code);\n                    console.log(_audioElement.error.message);\n                }\n            }\n        );\n\n        if (DEBUG_AUDIO)\n        {\n            _audioElement.addEventListener(\"load\", function()\n                {\n                    console.debug(\"0) load\");\n                }\n            );\n\n            _audioElement.addEventListener(\"loadstart\", function()\n                {\n                    console.debug(\"1) loadstart\");\n                }\n            );\n\n            _audioElement.addEventListener(\"durationchange\", function()\n                {\n                    console.debug(\"2) durationchange\");\n                }\n            );\n\n            _audioElement.addEventListener(\"loadedmetadata\", function()\n                {\n                    console.debug(\"3) loadedmetadata\");\n                }\n            );\n\n            _audioElement.addEventListener(\"loadeddata\", function()\n                {\n                    console.debug(\"4) loadeddata\");\n                }\n            );\n\n            _audioElement.addEventListener(\"progress\", function()\n                {\n                    console.debug(\"5) progress\");\n                }\n            );\n\n            _audioElement.addEventListener(\"canplay\", function()\n                {\n                    console.debug(\"6) canplay\");\n                }\n            );\n\n            _audioElement.addEventListener(\"canplaythrough\", function()\n                {\n                    console.debug(\"7) canplaythrough\");\n                }\n            );\n\n            _audioElement.addEventListener(\"play\", function()\n                {\n                    console.debug(\"8) play\");\n                }\n            );\n\n            _audioElement.addEventListener(\"pause\", function()\n                {\n                    console.debug(\"9) pause\");\n                }\n            );\n\n            _audioElement.addEventListener(\"ended\", function()\n                {\n                    console.debug(\"10) ended\");\n                }\n            );\n\n            _audioElement.addEventListener(\"seeked\", function()\n                {\n                    console.debug(\"11) seeked\");\n                }\n            );\n\n            if (DEBUG_AUDIO_X) {\n                _audioElement.addEventListener(\"timeupdate\", function()\n                    {\n                        console.debug(\"12) timeupdate\");\n                    }\n                );\n            }\n\n            _audioElement.addEventListener(\"seeking\", function()\n                {\n                    console.debug(\"13) seeking\");\n                }\n            );\n\n            _audioElement.addEventListener(\"waiting\", function()\n                {\n                    console.debug(\"14) waiting\");\n                }\n            );\n\n            _audioElement.addEventListener(\"volumechange\", function()\n                {\n                    console.debug(\"15) volumechange\");\n                }\n            );\n\n            _audioElement.addEventListener(\"suspend\", function()\n                {\n                    console.debug(\"16) suspend\");\n                }\n            );\n\n            _audioElement.addEventListener(\"stalled\", function()\n                {\n                    console.debug(\"17) stalled\");\n                }\n            );\n\n            _audioElement.addEventListener(\"ratechange\", function()\n                {\n                    console.debug(\"18) ratechange\");\n                }\n            );\n\n            _audioElement.addEventListener(\"playing\", function()\n                {\n                    console.debug(\"19) playing\");\n                }\n            );\n\n            _audioElement.addEventListener(\"interruptend\", function()\n                {\n                    console.debug(\"20) interruptend\");\n                }\n            );\n\n            _audioElement.addEventListener(\"interruptbegin\", function()\n                {\n                    console.debug(\"21) interruptbegin\");\n                }\n            );\n\n            _audioElement.addEventListener(\"emptied\", function()\n                {\n                    console.debug(\"22) emptied\");\n                }\n            );\n\n            _audioElement.addEventListener(\"abort\", function()\n                {\n                    console.debug(\"23) abort\");\n                }\n            );\n        }\n    }, false);\n\n    //]]>\n    </script>\n</head>\n<body id=\"").concat(styles_1.AUDIO_BODY_ID, "\">\n<section id=\"").concat(styles_1.AUDIO_SECTION_ID, "\">\n").concat(title ? "<h3 id=\"".concat(styles_1.AUDIO_TITLE_ID, "\">").concat(title, "</h3>") : "", "\n").concat(coverLink ? "<img id=\"".concat(styles_1.AUDIO_COVER_ID, "\" src=\"").concat(coverLink.Href, "\" alt=\"\" ").concat(coverLink.Height ? "height=\"".concat(coverLink.Height, "\"") : "", " ").concat(coverLink.Width ? "width=\"".concat(coverLink.Width, "\"") : "", " ").concat(coverLink.Width || coverLink.Height ? "style=\"".concat(coverLink.Height ? "height: ".concat(coverLink.Height, "px !important;") : "", " ").concat(coverLink.Width ? "width: ".concat(coverLink.Width, "px !important;") : "", "\"") : "", "/>") : "", "\n    <audio\n        id=\"").concat(styles_1.AUDIO_ID, "\"\n        ").concat(audiobook_1.DEBUG_AUDIO ? "controlsx=\"controlsx\"" : "", "\n        autoplay=\"autoplay\"\n        preload=\"metadata\">\n\n        <source src=\"").concat(uriStr, "\" type=\"").concat(pubLink.TypeLink, "\" />\n    </audio>\n    ").concat(audiobook_1.DEBUG_AUDIO ?
                    "\n<canvas id=\"".concat(styles_1.AUDIO_BUFFER_CANVAS_ID, "\"> </canvas>\n    ")
                    : "", "\n\n    <!-- SVG credits (tweaked sizing and coloring): https://material.io/resources/icons/?style=round -->\n\n    <div id=\"").concat(styles_1.AUDIO_CONTROLS_ID, "\">\n        <button id=\"").concat(styles_1.AUDIO_PREVIOUS_ID, "\" title=\"previous\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\"\n                viewBox=\"0 0 24 24\" width=\"48px\" height=\"48px\">\n                <path d=\"M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z\"/></svg>\n        </button>\n        <button id=\"").concat(styles_1.AUDIO_REWIND_ID, "\" title=\"rewind\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"48px\" height=\"48px\">\n            <path d=\"M12 5V2.21c0-.45-.54-.67-.85-.35l-3.8 3.79c-.2.2-.2.51 0 .71l3.79 3.79c.32.31.86.09.86-.36V7c3.73 0 6.68 3.42 5.86 7.29-.47 2.27-2.31 4.1-4.57 4.57-3.57.75-6.75-1.7-7.23-5.01-.07-.48-.49-.85-.98-.85-.6 0-1.08.53-1 1.13.62 4.39 4.8 7.64 9.53 6.72 3.12-.61 5.63-3.12 6.24-6.24C20.84 9.48 16.94 5 12 5zm-2.44 8.49h.45c.21 0 .37-.05.48-.16s.16-.25.16-.43c0-.08-.01-.15-.04-.22s-.06-.12-.11-.17-.11-.09-.18-.11-.16-.04-.25-.04c-.08 0-.15.01-.22.03s-.13.05-.18.1-.09.09-.12.15-.05.13-.05.2h-.85c0-.18.04-.34.11-.48s.17-.27.3-.37.27-.18.44-.23.35-.08.54-.08c.21 0 .41.03.59.08s.33.13.46.23.23.23.3.38.11.33.11.53c0 .09-.01.18-.04.27s-.07.17-.13.25-.12.15-.2.22-.17.12-.28.17c.24.09.42.21.54.39s.18.38.18.61c0 .2-.04.38-.12.53s-.18.29-.32.39-.29.19-.48.24-.38.08-.6.08c-.18 0-.36-.02-.53-.07s-.33-.12-.46-.23-.25-.23-.33-.38-.12-.34-.12-.55h.85c0 .08.02.15.05.22s.07.12.13.17.12.09.2.11.16.04.25.04c.1 0 .19-.01.27-.04s.15-.07.2-.12.1-.11.13-.18.04-.15.04-.24c0-.11-.02-.21-.05-.29s-.08-.15-.14-.2-.13-.09-.22-.11-.18-.04-.29-.04h-.47v-.65zm5.74.75c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.11-.32c.03-.13.04-.29.04-.48v-.97z\"/></svg>\n        </button>\n        <button id=\"").concat(styles_1.AUDIO_PLAYPAUSE_ID, "\" title=\"play / pause\">\n            <svg id=\"").concat(styles_1.AUDIO_PLAYPAUSE_ID, "_0\" xmlns=\"http://www.w3.org/2000/svg\"\n                viewBox=\"0 0 24 24\" width=\"60px\" height=\"60px\">\n                <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1zm4 0c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1z\"/></svg>\n            <svg id=\"").concat(styles_1.AUDIO_PLAYPAUSE_ID, "_1\" xmlns=\"http://www.w3.org/2000/svg\"\n                viewBox=\"0 0 24 24\" width=\"60px\" height=\"60px\">\n                <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4z\"/></svg>\n        </button>\n        <button id=\"").concat(styles_1.AUDIO_FORWARD_ID, "\" title=\"forward\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"48px\" height=\"48px\">\n            <path d=\"M18.92 13c-.5 0-.91.37-.98.86-.48 3.37-3.77 5.84-7.42 4.96-2.25-.54-3.91-2.27-4.39-4.53C5.32 10.42 8.27 7 12 7v2.79c0 .45.54.67.85.35l3.79-3.79c.2-.2.2-.51 0-.71l-3.79-3.79c-.31-.31-.85-.09-.85.36V5c-4.94 0-8.84 4.48-7.84 9.6.6 3.11 2.9 5.5 5.99 6.19 4.83 1.08 9.15-2.2 9.77-6.67.09-.59-.4-1.12-1-1.12zm-8.38 2.22c-.06.05-.12.09-.2.12s-.17.04-.27.04c-.09 0-.17-.01-.25-.04s-.14-.06-.2-.11-.1-.1-.13-.17-.05-.14-.05-.22h-.85c0 .21.04.39.12.55s.19.28.33.38.29.18.46.23.35.07.53.07c.21 0 .41-.03.6-.08s.34-.14.48-.24.24-.24.32-.39.12-.33.12-.53c0-.23-.06-.44-.18-.61s-.3-.3-.54-.39c.1-.05.2-.1.28-.17s.15-.14.2-.22.1-.16.13-.25.04-.18.04-.27c0-.2-.04-.37-.11-.53s-.17-.28-.3-.38-.28-.18-.46-.23-.37-.08-.59-.08c-.19 0-.38.03-.54.08s-.32.13-.44.23-.23.22-.3.37-.11.3-.11.48h.85c0-.07.02-.14.05-.2s.07-.11.12-.15.11-.07.18-.1.14-.03.22-.03c.1 0 .18.01.25.04s.13.06.18.11.08.11.11.17.04.14.04.22c0 .18-.05.32-.16.43s-.26.16-.48.16h-.43v.66h.45c.11 0 .2.01.29.04s.16.06.22.11.11.12.14.2.05.18.05.29c0 .09-.01.17-.04.24s-.08.11-.13.17zm3.9-3.44c-.18-.07-.37-.1-.59-.1s-.41.03-.59.1-.33.18-.45.33-.23.34-.29.57-.1.5-.1.82v.74c0 .32.04.6.11.82s.17.42.3.57.28.26.46.33.37.1.59.1.41-.03.59-.1.33-.18.45-.33.22-.34.29-.57.1-.5.1-.82v-.74c0-.32-.04-.6-.11-.82s-.17-.42-.3-.57-.28-.26-.46-.33zm.01 2.57c0 .19-.01.35-.04.48s-.06.24-.11.32-.11.14-.19.17-.16.05-.25.05-.18-.02-.25-.05-.14-.09-.19-.17-.09-.19-.12-.32-.04-.29-.04-.48v-.97c0-.19.01-.35.04-.48s.06-.23.12-.31.11-.14.19-.17.16-.05.25-.05.18.02.25.05.14.09.19.17.09.18.12.31.04.29.04.48v.97z\"/></svg>\n        </button>\n        <button id=\"").concat(styles_1.AUDIO_NEXT_ID, "\" title=\"next\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\"\n            viewBox=\"0 0 24 24\" width=\"48px\" height=\"48px\">\n            <path d=\"M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z\"/></svg>\n        </button>\n        <input id=\"").concat(styles_1.AUDIO_SLIDER_ID, "\" type=\"range\" min=\"0\" max=\"100\" value=\"0\" step=\"1\" title=\"progress\" />\n        <button id=\"").concat(styles_1.AUDIO_TIME_ID, "\" title=\"time information 1\">-</button>\n        <button id=\"").concat(styles_1.AUDIO_PERCENT_ID, "\" title=\"time information 2\">-</button>\n        <select id=\"").concat(styles_1.AUDIO_RATE_ID, "\" title=\"playback speed\">\n            <option value=\"2\">2x</option>\n            <option value=\"1.75\">1.75x</option>\n            <option value=\"1.5\">1.5x</option>\n            <option value=\"1.25\">1.25x</option>\n            <option value=\"1\">1x</option>\n            <option value=\"0.75\">0.75x</option>\n            <option value=\"0.5\">0.5x</option>\n            <option value=\"0.35\">0.35x</option>\n            <option value=\"0.25\">0.25x</option>\n        </select>\n    </div>\n</section>\n</body>\n</html>");
                var contentType = "application/xhtml+xml";
                htmlMarkup = (0, readium_css_inject_1.readiumCssTransformHtml)(htmlMarkup, rcssJson, contentType);
                var b64HTML = Buffer.from(htmlMarkup).toString("base64");
                var dataUri = "data:".concat(contentType, ";base64,").concat(b64HTML);
                newActiveWebView.setAttribute("src", dataUri);
            }
            return true;
        }
        else if (webviewNeedsHardRefresh) {
            var highlights_1 = activeWebView.READIUM2.link === pubLink ? activeWebView.READIUM2.highlights : undefined;
            setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var jsonStr, cs, csWriter, buff, _a, _b, b64Highlights_1, uriStr, uriStr__, readiumCssBackup, newActiveWebView;
                return tslib_1.__generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!highlights_1) return [3, 2];
                            jsonStr = JSON.stringify({
                                margin: win.READIUM2.highlightsDrawMargin,
                                list: highlights_1,
                            });
                            cs = new CompressionStream("gzip");
                            csWriter = cs.writable.getWriter();
                            csWriter.write(new TextEncoder().encode(jsonStr));
                            csWriter.close();
                            _b = (_a = Buffer).from;
                            return [4, new Response(cs.readable).arrayBuffer()];
                        case 1:
                            buff = _b.apply(_a, [_c.sent()]);
                            b64Highlights_1 = buff.toString("base64");
                            hrefToLoadHttpUri.search(function (data) {
                                data[url_params_1.URL_PARAM_HIGHLIGHTS] = b64Highlights_1;
                            });
                            _c.label = 2;
                        case 2:
                            uriStr = hrefToLoadHttpUri.toString();
                            uriStr__ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
                                (pubIsServedViaSpecialUrlProtocol ? (0, sessions_1.convertHttpUrlToCustomScheme)(uriStr) : uriStr);
                            if (IS_DEV) {
                                debug("___HARD___ WEBVIEW REFRESH: ".concat(uriStr__));
                            }
                            readiumCssBackup = activeWebView.READIUM2.readiumCss;
                            if (secondWebView) {
                                if (!secondWebViewWasJustCreated) {
                                    win.READIUM2.destroySecondWebView();
                                    win.READIUM2.createSecondWebView();
                                }
                            }
                            else {
                                win.READIUM2.destroyFirstWebView();
                                win.READIUM2.createFirstWebView();
                            }
                            newActiveWebView = secondWebView ?
                                win.READIUM2.getSecondWebView(false) :
                                win.READIUM2.getFirstWebView();
                            if (newActiveWebView) {
                                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                                newActiveWebView.READIUM2.highlights = highlights_1;
                                newActiveWebView.READIUM2.link = pubLink;
                                newActiveWebView.setAttribute("src", uriStr__);
                            }
                            return [2];
                    }
                });
            }); }, highlights_1 ? 500 : win.READIUM2.ttsClickEnabled ? 100 : 10);
        }
        else {
            var highlights_2 = activeWebView.READIUM2.link === pubLink ? activeWebView.READIUM2.highlights : undefined;
            setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var jsonStr, cs, csWriter, buff, _a, _b, b64Highlights_2, uriStr, uriStr__, webviewAlreadyHasContent;
                return tslib_1.__generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!highlights_2) return [3, 2];
                            jsonStr = JSON.stringify({
                                margin: win.READIUM2.highlightsDrawMargin,
                                list: highlights_2,
                            });
                            cs = new CompressionStream("gzip");
                            csWriter = cs.writable.getWriter();
                            csWriter.write(new TextEncoder().encode(jsonStr));
                            csWriter.close();
                            _b = (_a = Buffer).from;
                            return [4, new Response(cs.readable).arrayBuffer()];
                        case 1:
                            buff = _b.apply(_a, [_c.sent()]);
                            b64Highlights_2 = buff.toString("base64");
                            hrefToLoadHttpUri.search(function (data) {
                                data[url_params_1.URL_PARAM_HIGHLIGHTS] = b64Highlights_2;
                            });
                            _c.label = 2;
                        case 2:
                            uriStr = hrefToLoadHttpUri.toString();
                            uriStr__ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
                                (pubIsServedViaSpecialUrlProtocol ? (0, sessions_1.convertHttpUrlToCustomScheme)(uriStr) : uriStr);
                            if (IS_DEV) {
                                debug("___SOFT___ WEBVIEW REFRESH: ".concat(uriStr__));
                            }
                            webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
                                && activeWebView.READIUM2.link !== null;
                            activeWebView.READIUM2.link = pubLink;
                            activeWebView.READIUM2.highlights = highlights_2;
                            if (activeWebView.style.transform &&
                                activeWebView.style.transform !== "none" &&
                                !activeWebView.hasAttribute("data-wv-fxl")) {
                                if (webviewAlreadyHasContent) {
                                    activeWebView.style.opacity = "0";
                                }
                                shiftWebview(activeWebView, 0, undefined);
                                activeWebView.setAttribute("src", uriStr__);
                            }
                            else {
                                activeWebView.setAttribute("src", uriStr__);
                            }
                            return [2];
                    }
                });
            }); }, highlights_2 ? 500 : win.READIUM2.ttsClickEnabled ? 100 : 10);
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
var _saveReadingLocation = function (activeWebView, locator) {
    var e_2, _a, e_3, _b;
    var _c, _d;
    var docHref = (_c = activeWebView.READIUM2.link) === null || _c === void 0 ? void 0 : _c.Href;
    if (!docHref) {
        return;
    }
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var otherActive;
    try {
        for (var activeWebViews_2 = tslib_1.__values(activeWebViews), activeWebViews_2_1 = activeWebViews_2.next(); !activeWebViews_2_1.done; activeWebViews_2_1 = activeWebViews_2.next()) {
            var active = activeWebViews_2_1.value;
            if (active === activeWebView) {
                continue;
            }
            otherActive = active;
            break;
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (activeWebViews_2_1 && !activeWebViews_2_1.done && (_a = activeWebViews_2.return)) _a.call(activeWebViews_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var publication = win.READIUM2.publication;
    var position;
    if (publication && publication.Spine) {
        var isAudio = publication.Metadata &&
            publication.Metadata.RDFType &&
            /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
        if (isAudio) {
            var metaDuration = publication.Metadata.Duration;
            var totalDuration = 0;
            var timePosition = void 0;
            try {
                for (var _e = tslib_1.__values(publication.Spine), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var spineItem = _f.value;
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
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
            }
            if (totalDuration !== metaDuration) {
                console.log("DIFFERENT AUDIO DURATIONS?! ".concat(totalDuration, " (spines) !== ").concat(metaDuration, " (metadata)"));
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
        epubPageID: locator.epubPageID,
        headings: locator.headings,
        locator: {
            href: docHref,
            locations: {
                rangeInfo: locator.locations.rangeInfo ?
                    locator.locations.rangeInfo : undefined,
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
        secondWebViewHref: locator.secondWebViewHref || ((_d = otherActive === null || otherActive === void 0 ? void 0 : otherActive.READIUM2.link) === null || _d === void 0 ? void 0 : _d.Href),
        selectionInfo: locator.selectionInfo,
        selectionIsNew: locator.selectionIsNew,
        followingElementIDs: locator.followingElementIDs,
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
                    var e_4, _a;
                    var _b;
                    var activeWebViews = win.READIUM2.getActiveWebViews();
                    var _loop_1 = function (activeWebView) {
                        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== locator.href) {
                            return "continue";
                        }
                        var cb = function (event) {
                            if (event.channel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
                                var webview = event.currentTarget;
                                if (webview !== activeWebView) {
                                    console.log("Wrong navigator webview?!");
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
                            var _a;
                            return tslib_1.__generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                                        return [4, activeWebView.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payloadPing)];
                                    case 1:
                                        _b.sent();
                                        _b.label = 2;
                                    case 2: return [2];
                                }
                            });
                        }); }, 0);
                        return { value: void 0 };
                    };
                    try {
                        for (var activeWebViews_3 = tslib_1.__values(activeWebViews), activeWebViews_3_1 = activeWebViews_3.next(); !activeWebViews_3_1.done; activeWebViews_3_1 = activeWebViews_3.next()) {
                            var activeWebView = activeWebViews_3_1.value;
                            var state_1 = _loop_1(activeWebView);
                            if (typeof state_1 === "object")
                                return state_1.value;
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (activeWebViews_3_1 && !activeWebViews_3_1.done && (_a = activeWebViews_3.return)) _a.call(activeWebViews_3);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                    reject("isLocatorVisible - no webview href match.");
                })];
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
//# sourceMappingURL=location.js.map