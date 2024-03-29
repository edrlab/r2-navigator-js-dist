"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocatorVisible = exports.setReadingLocationSaver = exports.getCurrentReadingLocation = exports.reloadContent = exports.handleLinkLocator = exports.handleLinkUrl = exports.handleLink = exports.navLeftOrRight = exports.navPreviousOrNext = exports.shiftWebview = exports.locationHandleIpcMessage = exports.setWebViewStyle = void 0;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const electron_1 = require("electron");
const path = require("path");
const url_1 = require("url");
const metadata_properties_1 = require("r2-shared-js/dist/es7-es2016/src/models/metadata-properties");
const UrlUtils_1 = require("r2-utils-js/dist/es7-es2016/src/_utils/http/UrlUtils");
const audiobook_1 = require("../common/audiobook");
const events_1 = require("../common/events");
const readium_css_inject_1 = require("../common/readium-css-inject");
const sessions_1 = require("../common/sessions");
const styles_1 = require("../common/styles");
const audiobook_2 = require("./audiobook");
const url_params_1 = require("./common/url-params");
const epubReadingSystem_1 = require("./epubReadingSystem");
const media_overlays_1 = require("./media-overlays");
const readium_css_1 = require("./readium-css");
const URI = require("urijs");
const debug = debug_("r2:navigator#electron/renderer/location");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const win = global.window;
const webviewStyleCommon = "display: flex; border: 0; margin: 0; padding: 0; box-sizing: border-box; position: absolute; ";
const webviewStyleLeft = "opacity: 0; " + webviewStyleCommon + "left: 0; width: 50%; bottom: 0; top: 0;";
const webviewStyleRight = "opacity: 0; " + webviewStyleCommon + "left: 50%; right: 0; bottom: 0; top: 0;";
const webviewStyleCenter = "opacity: 0; " + webviewStyleCommon + "left: 0; right: 0; bottom: 0; top: 0;";
const webviewStyleLeft_ = "opacity: 1; " + webviewStyleCommon +
    "left: 0; top: calc(0 - max(var(--R2_FXL_Y_SHIFT), var(--R2_FXL_Y_SHIFT_)));";
const webviewStyleRight_ = "opacity: 1; " + webviewStyleCommon +
    "left: calc(50% - var(--R2_FXL_X_SHIFT));" +
    "top: calc(0 - max(var(--R2_FXL_Y_SHIFT), var(--R2_FXL_Y_SHIFT_)));";
const webviewStyleCenter_ = "opacity: 1; " + webviewStyleCommon +
    "left: 0; top: calc(0 - var(--R2_FXL_Y_SHIFT));";
function setWebViewStyle(wv, wvSlot, fxl) {
    const v = fxl ? JSON.stringify(fxl).replace(/{/g, "").replace(/}/g, "").replace(/"/g, "") : "NO FXL";
    debug("setWebViewStyle fxl: " + v);
    if (fxl) {
        let wvSlot_ = wv.getAttribute("data-wv-slot");
        if (!wvSlot_) {
            wvSlot_ = wvSlot;
        }
        const tx = fxl.tx >= 0 ? fxl.tx : 0;
        if (wvSlot_ === styles_1.WebViewSlotEnum.left || wvSlot_ === styles_1.WebViewSlotEnum.center) {
            win.document.documentElement.style.setProperty("--R2_FXL_X_SHIFT", fxl.tx >= 0 ? "0px" : `${fxl.tx}px`);
        }
        const ty = fxl.ty >= 0 ? fxl.ty : 0;
        win.document.documentElement.style.setProperty((wvSlot_ === styles_1.WebViewSlotEnum.left || wvSlot_ === styles_1.WebViewSlotEnum.center) ? "--R2_FXL_Y_SHIFT" : "--R2_FXL_Y_SHIFT_", fxl.ty >= 0 ? "0px" : `${fxl.ty}px`);
        const cxx = ` width:${fxl.width * fxl.scale}px; height:${fxl.height * fxl.scale}px; transform-origin: 0 0; transform: translate(${tx}px, ${ty}px) scale(${"1"});`;
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
    const activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
    }
    else if (eventChannel === events_1.R2_EVENT_SHIFT_VIEW_X) {
        if (!activeWebView.hasAttribute("data-wv-fxl")) {
            shiftWebview(activeWebView, eventArgs[0].offset, eventArgs[0].backgroundColor);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_PAGE_TURN_RES) {
        const payload = eventArgs[0];
        if (payload.nav) {
            navPreviousOrNext(payload.go === "PREVIOUS");
            return true;
        }
        const publication = win.READIUM2.publication;
        const publicationURL = win.READIUM2.publicationURL;
        if (!publication) {
            return true;
        }
        const doNothing = payload.go === "";
        if (doNothing) {
            return true;
        }
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
            debug(`locationHandleIpcMessage R2_EVENT_PAGE_TURN_RES: ${urlNoQueryParams}`);
            handleLink(urlNoQueryParams, goPREVIOUS, false, activeWebView.READIUM2.readiumCss);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_READING_LOCATION_CLEAR_SELECTION) {
        if (_lastSavedReadingLocation === null || _lastSavedReadingLocation === void 0 ? void 0 : _lastSavedReadingLocation.selectionInfo) {
            _lastSavedReadingLocation.selectionInfo = undefined;
        }
    }
    else if (eventChannel === events_1.R2_EVENT_READING_LOCATION) {
        const payload = eventArgs[0];
        if (activeWebView.READIUM2.link) {
            _saveReadingLocation(activeWebView, payload);
        }
    }
    else if (eventChannel === events_1.R2_EVENT_LINK) {
        const payload = eventArgs[0];
        debug(`locationHandleIpcMessage R2_EVENT_LINK: ${payload.url}`);
        let href = payload.url;
        if (!/^(https?|thoriumhttps):\/\//.test(href) &&
            !href.startsWith((sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) &&
            activeWebView.READIUM2.link) {
            const sourceUrl = new url_1.URL(activeWebView.READIUM2.link.Href, win.READIUM2.publicationURL);
            const destUrl = new url_1.URL(href, sourceUrl);
            href = destUrl.toString();
            debug(`R2_EVENT_LINK ABSOLUTE-ized: ${href}`);
        }
        const eventPayload = {
            url: href,
            rcss: activeWebView.READIUM2.readiumCss,
        };
        electron_1.ipcRenderer.emit(events_1.R2_EVENT_LINK, eventPayload);
    }
    else if (eventChannel === events_1.R2_EVENT_AUDIO_PLAYBACK_RATE) {
        const payload = eventArgs[0];
        (0, audiobook_2.setCurrentAudioPlaybackRate)(payload.speed);
    }
    else {
        return false;
    }
    return true;
}
exports.locationHandleIpcMessage = locationHandleIpcMessage;
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, (event, payload) => {
    if (!win.READIUM2) {
        return;
    }
    debug("R2_EVENT_LINK (ipcRenderer.on)");
    const pay = (!payload && event.url) ? event : payload;
    debug(pay.url);
    if (pay.url.indexOf("#" + url_params_1.FRAG_ID_CSS_SELECTOR) >= 0) {
        debug("R2_EVENT_LINK (ipcRenderer.on) SKIP link activation [FRAG_ID_CSS_SELECTOR]");
        return;
    }
    const activeWebView = pay.rcss ? undefined : win.READIUM2.getFirstOrSecondWebView();
    handleLinkUrl(pay.url, pay.rcss ? pay.rcss :
        (activeWebView ? activeWebView.READIUM2.readiumCss : undefined));
});
function shiftWebview(webview, offset, backgroundColor) {
    if (!offset) {
        webview.style.transform = "none";
    }
    else {
        if (backgroundColor) {
            const domSlidingViewport = win.READIUM2.domSlidingViewport;
            domSlidingViewport.style.backgroundColor = backgroundColor;
        }
        webview.style.transform = `translateX(${offset}px)`;
    }
}
exports.shiftWebview = shiftWebview;
function navPreviousOrNext(goPREVIOUS, spineNav, ignorePageSpreadHandling) {
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return undefined;
    }
    if (!publication.Spine) {
        return undefined;
    }
    const loc = _lastSavedReadingLocation;
    let href = loc ? loc.locator.href : undefined;
    if (!ignorePageSpreadHandling) {
        let linkFirst;
        let linkSecond;
        const firstWebView = win.READIUM2.getFirstWebView();
        if (firstWebView) {
            linkFirst = firstWebView.READIUM2.link;
        }
        const secondWebView = win.READIUM2.getSecondWebView(false);
        if (secondWebView) {
            linkSecond = secondWebView.READIUM2.link;
        }
        if (linkFirst && linkSecond) {
            const indexFirst = publication.Spine.indexOf(linkFirst);
            const indexSecond = publication.Spine.indexOf(linkSecond);
            if (indexSecond >= 0 && indexFirst >= 0) {
                const boundaryLink = indexSecond < indexFirst ?
                    (goPREVIOUS ? linkSecond : linkFirst) :
                    (goPREVIOUS ? linkFirst : linkSecond);
                debug(`navLeftOrRight spineNav = true force ${href} => ${boundaryLink.Href}`);
                spineNav = true;
                href = boundaryLink.Href;
            }
        }
    }
    if (spineNav) {
        if (!href) {
            return undefined;
        }
        const offset = goPREVIOUS ? -1 : 1;
        const currentSpineIndex = publication.Spine.findIndex((link) => {
            return link.Href === href;
        });
        if (currentSpineIndex >= 0) {
            const spineIndex = currentSpineIndex + offset;
            if (spineIndex >= 0 && spineIndex <= (publication.Spine.length - 1)) {
                const nextOrPreviousSpineItem = publication.Spine[spineIndex];
                const uri = new url_1.URL(nextOrPreviousSpineItem.Href, publicationURL);
                uri.hash = "";
                uri.search = "";
                const urlNoQueryParams = uri.toString();
                const activeWebView = win.READIUM2.getFirstOrSecondWebView();
                debug(`navLeftOrRight: ${urlNoQueryParams}`);
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
        const payload = {
            go: goPREVIOUS ? "PREVIOUS" : "NEXT",
        };
        const activeWebView = win.READIUM2.getFirstOrSecondWebView();
        if (activeWebView) {
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                var _a;
                if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                    yield activeWebView.send(events_1.R2_EVENT_PAGE_TURN, payload);
                }
            }), 0);
        }
    }
    return undefined;
}
exports.navPreviousOrNext = navPreviousOrNext;
function navLeftOrRight(left, spineNav, ignorePageSpreadHandling) {
    var _a;
    const loc = _lastSavedReadingLocation;
    const rtl = (0, readium_css_1.isRTL_PackageMeta)() ||
        (typeof ((_a = loc === null || loc === void 0 ? void 0 : loc.docInfo) === null || _a === void 0 ? void 0 : _a.isRightToLeft) !== "undefined" ?
            loc.docInfo.isRightToLeft :
            (0, readium_css_1.isRTL_PackageMeta)());
    const goPREVIOUS = left ? !rtl : rtl;
    return navPreviousOrNext(goPREVIOUS, spineNav, ignorePageSpreadHandling);
}
exports.navLeftOrRight = navLeftOrRight;
function handleLink(href, previous, useGoto, rcss) {
    debug(`handleLink: ${href}`);
    const special = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        debug("handleLink R2 URL");
        const okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            debug(`Readium link fail?! ${href}`);
        }
    }
    else {
        debug("handleLink non-R2 URL");
        const okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            if (/^https?:\/\/127\.0\.0\.1/.test(href)) {
                debug(`Internal link, fails to match publication document: ${href}`);
            }
            else {
                debug(`External link: ${href}`);
                (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        yield electron_1.shell.openExternal(href);
                    }
                    catch (err) {
                        debug(err);
                    }
                }))();
            }
        }
    }
}
exports.handleLink = handleLink;
function handleLinkUrl(href, rcss) {
    debug(`handleLinkUrl: ${href}`);
    handleLink(href, undefined, false, rcss);
}
exports.handleLinkUrl = handleLinkUrl;
function handleLinkLocator(location, rcss) {
    var _a;
    const rangeInfo = (_a = location === null || location === void 0 ? void 0 : location.locations) === null || _a === void 0 ? void 0 : _a.rangeInfo;
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
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
        debug(`handleLinkLocator FAIL ${publicationURL} + ${location ? location.href : "NIL"}`);
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
            (useGoto ? ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                (0, UrlUtils_1.encodeURIComponent_RFC3986)(Buffer.from(JSON.stringify(linkToLoadGoto, null, "")).toString("base64"))) :
                "") +
            ((useGoto && rangeInfo) ? ("&" + url_params_1.URL_PARAM_GOTO_DOM_RANGE + "=" +
                (0, UrlUtils_1.encodeURIComponent_RFC3986)(Buffer.from(JSON.stringify(rangeInfo, null, "")).toString("base64"))) :
                "");
        debug(`handleLinkLocator: ${hrefToLoad}`);
        handleLink(hrefToLoad, undefined, useGoto, rcss);
    }
}
exports.handleLinkLocator = handleLinkLocator;
let _reloadCounter = 0;
function reloadContent() {
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        reloadWebView(activeWebView);
    }
}
exports.reloadContent = reloadContent;
function reloadWebView(activeWebView) {
    setTimeout(() => {
        activeWebView.READIUM2.forceRefresh = true;
        if (activeWebView.READIUM2.link) {
            const uri = new url_1.URL(activeWebView.READIUM2.link.Href, win.READIUM2.publicationURL);
            uri.hash = "";
            uri.search = "";
            const urlNoQueryParams = uri.toString();
            debug(`reloadContent: ${urlNoQueryParams}`);
            handleLinkUrl(urlNoQueryParams, activeWebView.READIUM2.readiumCss);
        }
    }, 0);
}
function loadLink(hrefToLoad, previous, useGoto, rcss, secondWebView) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return false;
    }
    (0, media_overlays_1.mediaOverlaysInterrupt)();
    let hrefToLoadHttp = hrefToLoad;
    if (hrefToLoadHttp.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefToLoadHttp = (0, sessions_1.convertCustomSchemeToHttpUrl)(hrefToLoadHttp);
    }
    const pubIsServedViaSpecialUrlProtocol = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    const publicationURLHttp = pubIsServedViaSpecialUrlProtocol ?
        (0, sessions_1.convertCustomSchemeToHttpUrl)(publicationURL) : publicationURL;
    const hrefToLoadHttpObj = new url_1.URL(hrefToLoadHttp);
    hrefToLoadHttpObj.hash = "";
    hrefToLoadHttpObj.search = "";
    const publicationURLHttpObj = new url_1.URL(publicationURLHttp);
    publicationURLHttpObj.hash = "";
    publicationURLHttpObj.search = "";
    const rootPath = publicationURLHttpObj.pathname.replace(/manifest\.json$/, "");
    let linkPath = hrefToLoadHttpObj.pathname.replace(rootPath, "");
    linkPath = decodeURIComponent(linkPath);
    debug(`R2LOADLINK: ${hrefToLoad} ... ${publicationURL} ==> ${linkPath}`);
    let pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink && publication.Resources) {
        pubLink = publication.Resources.find((resLink) => {
            return resLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        let hrefToLoadHttpNoHash;
        try {
            const hrefToLoadHttpObjUri = new URI(hrefToLoadHttp);
            hrefToLoadHttpObjUri.hash("").normalizeHash();
            hrefToLoadHttpObjUri.search((data) => {
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
            hrefToLoadHttpNoHash = hrefToLoadHttpObjUri.toString();
        }
        catch (err) {
            debug(err);
        }
        if (hrefToLoadHttpNoHash) {
            pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
                return spineLink.Href === hrefToLoadHttpNoHash;
            }) : undefined;
            if (!pubLink && publication.Resources) {
                pubLink = publication.Resources.find((resLink) => {
                    return resLink.Href === hrefToLoadHttpNoHash;
                });
            }
        }
        if (!pubLink) {
            debug(`CANNOT LOAD EXT LINK ${hrefToLoad} ... ${publicationURL} --- (${hrefToLoadHttpNoHash}) ==> ${linkPath}`);
            return false;
        }
    }
    if (!pubLink) {
        debug(`CANNOT LOAD LINK ${hrefToLoad} ... ${publicationURL} ==> ${linkPath}`);
        return false;
    }
    if (!secondWebView) {
        win.document.documentElement.style.setProperty("--R2_FXL_X_SHIFT", "0px");
        win.document.documentElement.style.setProperty("--R2_FXL_Y_SHIFT", "0px");
        win.document.documentElement.style.setProperty("--R2_FXL_Y_SHIFT_", "0px");
    }
    const webview1 = win.READIUM2.getFirstWebView();
    const webview2 = win.READIUM2.getSecondWebView(false);
    const webviewSpreadSwap = secondWebView ?
        (webview2 && webview1 && webview1.READIUM2.link === pubLink) :
        (webview2 && webview2.READIUM2.link === pubLink);
    const secondWebViewWasJustCreated = secondWebView && !webviewSpreadSwap && !webview2;
    const activeWebView = webviewSpreadSwap ?
        (secondWebView ? webview1 : win.READIUM2.getSecondWebView(true)) :
        (secondWebView ? win.READIUM2.getSecondWebView(true) : webview1);
    const actualReadiumCss = (activeWebView && activeWebView.READIUM2.readiumCss) ?
        activeWebView.READIUM2.readiumCss :
        (0, readium_css_1.obtainReadiumCss)(rcss);
    if (activeWebView) {
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
    }
    const fileName = path.basename(linkPath);
    const ext = path.extname(fileName);
    const isAudio = publication.Metadata &&
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
    let webViewSlot = styles_1.WebViewSlotEnum.center;
    let loadingSecondWebView;
    const linkIndex = publication.Spine ? publication.Spine.indexOf(pubLink) : -1;
    if (publication.Spine &&
        linkIndex >= 0 &&
        (0, readium_css_1.isFixedLayout)(pubLink)) {
        const rtl = (0, readium_css_1.isRTL_PackageMeta)();
        const publicationSpreadNone = ((_b = (_a = publication.Metadata) === null || _a === void 0 ? void 0 : _a.Rendition) === null || _b === void 0 ? void 0 : _b.Spread) === metadata_properties_1.SpreadEnum.None;
        const slotOfFirstPageInSpread = rtl ? metadata_properties_1.PageEnum.Right : metadata_properties_1.PageEnum.Left;
        const slotOfSecondPageInSpread = slotOfFirstPageInSpread === metadata_properties_1.PageEnum.Right ? metadata_properties_1.PageEnum.Left : metadata_properties_1.PageEnum.Right;
        const linkSpreadNoneForced = ((_c = rcss === null || rcss === void 0 ? void 0 : rcss.setCSS) === null || _c === void 0 ? void 0 : _c.colCount) === "1" ||
            ((_d = rcss === null || rcss === void 0 ? void 0 : rcss.setCSS) === null || _d === void 0 ? void 0 : _d.colCount) === "auto" &&
                win.READIUM2.domSlidingViewport &&
                win.READIUM2.domSlidingViewport.clientWidth !== 0 &&
                win.READIUM2.domSlidingViewport.clientHeight !== 0 &&
                win.READIUM2.domSlidingViewport.clientWidth < win.READIUM2.domSlidingViewport.clientHeight;
        publication.Spine.forEach((spineLink, i) => {
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
            if (linkSpreadNoneForced) {
                spineLink.__notInSpreadForced = true;
            }
            const linkSpreadNone = linkSpreadNoneForced || ((_a = spineLink.Properties) === null || _a === void 0 ? void 0 : _a.Spread) === metadata_properties_1.SpreadEnum.None;
            const linkSpreadOther = !linkSpreadNone && ((_b = spineLink.Properties) === null || _b === void 0 ? void 0 : _b.Spread);
            const notInSpread = linkSpreadNone || (publicationSpreadNone && !linkSpreadOther);
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
                    spineLink.Properties.Page = notInSpread ? metadata_properties_1.PageEnum.Center : slotOfSecondPageInSpread;
                }
                else {
                    const firstPageInSpread = publication.Spine &&
                        ((_e = publication.Spine[i - 1].Properties) === null || _e === void 0 ? void 0 : _e.Page) !== slotOfFirstPageInSpread;
                    spineLink.Properties.Page = notInSpread ? metadata_properties_1.PageEnum.Center :
                        (firstPageInSpread ? slotOfFirstPageInSpread : slotOfSecondPageInSpread);
                }
            }
        });
        const prev = previous ? true : false;
        const page = pubLink.__notInSpreadForced ? metadata_properties_1.PageEnum.Center : (_e = pubLink.Properties) === null || _e === void 0 ? void 0 : _e.Page;
        if (page === metadata_properties_1.PageEnum.Left) {
            webViewSlot = styles_1.WebViewSlotEnum.left;
            if (!secondWebView && !pubLink.__notInSpread) {
                const otherIndex = linkIndex + (rtl ? -1 : 1);
                const otherLink = publication.Spine[otherIndex];
                if (otherLink && !otherLink.__notInSpread &&
                    ((_f = otherLink.Properties) === null || _f === void 0 ? void 0 : _f.Page) === metadata_properties_1.PageEnum.Right) {
                    const needToInverse = !webviewSpreadSwap &&
                        prev && publication.Spine.indexOf(pubLink) > otherIndex;
                    const otherLinkURLObj = new url_1.URL(otherLink.Href, publicationURL);
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
                const otherIndex = linkIndex + (!rtl ? -1 : 1);
                const otherLink = publication.Spine[otherIndex];
                if (otherLink && !otherLink.__notInSpread &&
                    ((_g = otherLink.Properties) === null || _g === void 0 ? void 0 : _g.Page) === metadata_properties_1.PageEnum.Left) {
                    const needToInverse = !webviewSpreadSwap &&
                        prev && publication.Spine.indexOf(pubLink) > otherIndex;
                    const otherLinkURLObj = new url_1.URL(otherLink.Href, publicationURL);
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
    const rcssJson = (0, readium_css_1.adjustReadiumCssJsonMessageForFixedLayout)(activeWebView, pubLink || (activeWebView === null || activeWebView === void 0 ? void 0 : activeWebView.READIUM2.link), actualReadiumCss);
    const rcssJsonstr = JSON.stringify(rcssJson, null, "");
    const rcssJsonstrBase64 = Buffer.from(rcssJsonstr).toString("base64");
    const hrefToLoadHttpUri = new URI(hrefToLoadHttp);
    if ((_h = hrefToLoadHttpUri.fragment()) === null || _h === void 0 ? void 0 : _h.startsWith(url_params_1.FRAG_ID_CSS_SELECTOR)) {
        const cssSelector = decodeURIComponent(hrefToLoadHttpUri.fragment().substring(url_params_1.FRAG_ID_CSS_SELECTOR.length));
        debug("FRAG_ID_CSS_SELECTOR: " + cssSelector);
        hrefToLoadHttpUri.hash("").normalizeHash();
        hrefToLoadHttpUri.search((data) => {
            data[url_params_1.URL_PARAM_GOTO] = Buffer.from(JSON.stringify({ cssSelector }, null, "")).toString("base64");
        });
        useGoto = true;
    }
    if (isAudio) {
        if (useGoto) {
            hrefToLoadHttpUri.hash("").normalizeHash();
            if (pubLink.Duration) {
                const gotoBase64 = hrefToLoadHttpUri.search(true)[url_params_1.URL_PARAM_GOTO];
                if (gotoBase64) {
                    const str = Buffer.from(gotoBase64, "base64").toString("utf8");
                    const json = JSON.parse(str);
                    const gotoProgression = json.progression;
                    if (typeof gotoProgression !== "undefined") {
                        const time = gotoProgression * pubLink.Duration;
                        hrefToLoadHttpUri.hash(`t=${time}`).normalizeHash();
                    }
                }
            }
        }
        hrefToLoadHttpUri.search((data) => {
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
        hrefToLoadHttpUri.search((data) => {
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
        const rersJson = (0, epubReadingSystem_1.getEpubReadingSystemInfo)();
        const rersJsonstr = JSON.stringify(rersJson, null, "");
        const rersJsonstrBase64 = Buffer.from(rersJsonstr).toString("base64");
        hrefToLoadHttpUri.search((data) => {
            data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
            data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
            data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV &&
                win.READIUM2.DEBUG_VISUALS) ?
                "true" : "false";
            data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] =
                win.READIUM2.clipboardInterceptor ?
                    "true" : "false";
            data[url_params_1.URL_PARAM_WEBVIEW_SLOT] = webViewSlot;
            data[url_params_1.URL_PARAM_SECOND_WEBVIEW] = secondWebView ? "1" :
                (loadingSecondWebView ? `0${loadingSecondWebView.Href}` : "0");
        });
    }
    const webviewNeedsForcedRefresh = !isAudio && (win.READIUM2.ttsClickEnabled ||
        activeWebView && activeWebView.READIUM2.forceRefresh);
    if (activeWebView) {
        activeWebView.READIUM2.forceRefresh = undefined;
    }
    const webviewNeedsHardRefresh = !isAudio &&
        (win.READIUM2.enableScreenReaderAccessibilityWebViewHardRefresh
            && win.READIUM2.isScreenReaderMounted);
    if (!isAudio && !webviewNeedsHardRefresh && !webviewNeedsForcedRefresh &&
        activeWebView && activeWebView.READIUM2.link === pubLink && !(0, readium_css_1.isFixedLayout)(pubLink)) {
        const goto = useGoto ? hrefToLoadHttpUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        const gotoDomRange = useGoto ? hrefToLoadHttpUri.search(true)[url_params_1.URL_PARAM_GOTO_DOM_RANGE] : undefined;
        const hash = useGoto ? undefined : hrefToLoadHttpUri.fragment();
        debug("WEBVIEW ALREADY LOADED: " + pubLink.Href);
        const payload = {
            goto,
            gotoDomRange,
            hash,
            isSecondWebView: secondWebView ? true : false,
            previous: previous ? true : false,
        };
        if (IS_DEV) {
            const msgStr = JSON.stringify(payload);
            debug(msgStr);
        }
        if (activeWebView) {
            if (activeWebView.style.transform &&
                activeWebView.style.transform !== "none" &&
                !activeWebView.hasAttribute("data-wv-fxl")) {
                activeWebView.style.opacity = "0";
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    var _j;
                    shiftWebview(activeWebView, 0, undefined);
                    if ((_j = activeWebView.READIUM2) === null || _j === void 0 ? void 0 : _j.DOMisReady) {
                        yield activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload);
                    }
                }), 10);
            }
            else {
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    var _k;
                    if ((_k = activeWebView.READIUM2) === null || _k === void 0 ? void 0 : _k.DOMisReady) {
                        yield activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload);
                    }
                }), 0);
            }
        }
        return true;
    }
    if (activeWebView) {
        if (webviewNeedsForcedRefresh) {
            hrefToLoadHttpUri.search((data) => {
                data[url_params_1.URL_PARAM_REFRESH] = `${++_reloadCounter}`;
            });
        }
        if (win.READIUM2.sessionInfo) {
            hrefToLoadHttpUri.search((data) => {
                if (win.READIUM2.sessionInfo) {
                    const b64SessionInfo = Buffer.from(win.READIUM2.sessionInfo).toString("base64");
                    data[url_params_1.URL_PARAM_SESSION_INFO] = b64SessionInfo;
                }
            });
        }
        const uriStr = hrefToLoadHttpUri.toString();
        const uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
            (pubIsServedViaSpecialUrlProtocol ? (0, sessions_1.convertHttpUrlToCustomScheme)(uriStr) : uriStr);
        if (isAudio) {
            if (IS_DEV) {
                debug(`___HARD AUDIO___ WEBVIEW REFRESH: ${uriStr_}`);
            }
            const readiumCssBackup = activeWebView.READIUM2.readiumCss;
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
            const newActiveWebView = secondWebView ?
                win.READIUM2.getSecondWebView(false) :
                win.READIUM2.getFirstWebView();
            if (newActiveWebView) {
                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                newActiveWebView.READIUM2.link = pubLink;
                const coverLink = publication.GetCover();
                let title;
                if (pubLink.Title) {
                    const regExp = /&(nbsp|amp|quot|lt|gt);/g;
                    const map = {
                        amp: "&",
                        gt: ">",
                        lt: "<",
                        nbsp: " ",
                        quot: "\"",
                    };
                    title = pubLink.Title.replace(regExp, (_match, entityName) => {
                        return map[entityName] ? map[entityName] : entityName;
                    });
                }
                const audioPlaybackRate = (0, audiobook_2.getCurrentAudioPlaybackRate)();
                if (rcssJson.setCSS) {
                    rcssJson.setCSS.paged = false;
                }
                let htmlMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <meta charset="utf-8" />
    ${title ? `<title>${title}</title>` : "<!-- NO TITLE -->"}
    <base href="${publicationURLHttp}" id="${readium_css_inject_1.READIUM2_BASEURL_ID}" />
    <style type="text/css">
    /*<![CDATA[*/
    /*]]>*/
    </style>

    <script>
    //<![CDATA[

    const DEBUG_AUDIO = ${IS_DEV};
    const DEBUG_AUDIO_X = ${audiobook_1.DEBUG_AUDIO};

    document.addEventListener("DOMContentLoaded", () => {
        const _audioElement = document.getElementById("${styles_1.AUDIO_ID}");
        _audioElement.playbackRate = ${audioPlaybackRate};

        _audioElement.addEventListener("error", function()
            {
                console.debug("-1) error");
                if (_audioElement.error) {
                    // 1 === MEDIA_ERR_ABORTED
                    // 2 === MEDIA_ERR_NETWORK
                    // 3 === MEDIA_ERR_DECODE
                    // 4 === MEDIA_ERR_SRC_NOT_SUPPORTED
                    console.log(_audioElement.error.code);
                    console.log(_audioElement.error.message);
                }
            }
        );

        if (DEBUG_AUDIO)
        {
            _audioElement.addEventListener("load", function()
                {
                    console.debug("0) load");
                }
            );

            _audioElement.addEventListener("loadstart", function()
                {
                    console.debug("1) loadstart");
                }
            );

            _audioElement.addEventListener("durationchange", function()
                {
                    console.debug("2) durationchange");
                }
            );

            _audioElement.addEventListener("loadedmetadata", function()
                {
                    console.debug("3) loadedmetadata");
                }
            );

            _audioElement.addEventListener("loadeddata", function()
                {
                    console.debug("4) loadeddata");
                }
            );

            _audioElement.addEventListener("progress", function()
                {
                    console.debug("5) progress");
                }
            );

            _audioElement.addEventListener("canplay", function()
                {
                    console.debug("6) canplay");
                }
            );

            _audioElement.addEventListener("canplaythrough", function()
                {
                    console.debug("7) canplaythrough");
                }
            );

            _audioElement.addEventListener("play", function()
                {
                    console.debug("8) play");
                }
            );

            _audioElement.addEventListener("pause", function()
                {
                    console.debug("9) pause");
                }
            );

            _audioElement.addEventListener("ended", function()
                {
                    console.debug("10) ended");
                }
            );

            _audioElement.addEventListener("seeked", function()
                {
                    console.debug("11) seeked");
                }
            );

            if (DEBUG_AUDIO_X) {
                _audioElement.addEventListener("timeupdate", function()
                    {
                        console.debug("12) timeupdate");
                    }
                );
            }

            _audioElement.addEventListener("seeking", function()
                {
                    console.debug("13) seeking");
                }
            );

            _audioElement.addEventListener("waiting", function()
                {
                    console.debug("14) waiting");
                }
            );

            _audioElement.addEventListener("volumechange", function()
                {
                    console.debug("15) volumechange");
                }
            );

            _audioElement.addEventListener("suspend", function()
                {
                    console.debug("16) suspend");
                }
            );

            _audioElement.addEventListener("stalled", function()
                {
                    console.debug("17) stalled");
                }
            );

            _audioElement.addEventListener("ratechange", function()
                {
                    console.debug("18) ratechange");
                }
            );

            _audioElement.addEventListener("playing", function()
                {
                    console.debug("19) playing");
                }
            );

            _audioElement.addEventListener("interruptend", function()
                {
                    console.debug("20) interruptend");
                }
            );

            _audioElement.addEventListener("interruptbegin", function()
                {
                    console.debug("21) interruptbegin");
                }
            );

            _audioElement.addEventListener("emptied", function()
                {
                    console.debug("22) emptied");
                }
            );

            _audioElement.addEventListener("abort", function()
                {
                    console.debug("23) abort");
                }
            );
        }
    }, false);

    //]]>
    </script>
</head>
<body id="${styles_1.AUDIO_BODY_ID}">
<section id="${styles_1.AUDIO_SECTION_ID}">
${title ? `<h3 id="${styles_1.AUDIO_TITLE_ID}">${title}</h3>` : ""}
${coverLink ? `<img id="${styles_1.AUDIO_COVER_ID}" src="${coverLink.Href}" alt="" ${coverLink.Height ? `height="${coverLink.Height}"` : ""} ${coverLink.Width ? `width="${coverLink.Width}"` : ""} ${coverLink.Width || coverLink.Height ? `style="${coverLink.Height ? `height: ${coverLink.Height}px !important;` : ""} ${coverLink.Width ? `width: ${coverLink.Width}px !important;` : ""}"` : ""}/>` : ""}
    <audio
        id="${styles_1.AUDIO_ID}"
        ${audiobook_1.DEBUG_AUDIO ? "controlsx=\"controlsx\"" : ""}
        autoplay="autoplay"
        preload="metadata">

        <source src="${uriStr}" type="${pubLink.TypeLink}" />
    </audio>
    ${audiobook_1.DEBUG_AUDIO ?
                    `
<canvas id="${styles_1.AUDIO_BUFFER_CANVAS_ID}"> </canvas>
    `
                    : ""}

    <!-- SVG credits (tweaked sizing and coloring): https://material.io/resources/icons/?style=round -->

    <div id="${styles_1.AUDIO_CONTROLS_ID}">
        <button id="${styles_1.AUDIO_PREVIOUS_ID}" title="previous">
            <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" width="48px" height="48px">
                <path d="M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z"/></svg>
        </button>
        <button id="${styles_1.AUDIO_REWIND_ID}" title="rewind">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px">
            <path d="M12 5V2.21c0-.45-.54-.67-.85-.35l-3.8 3.79c-.2.2-.2.51 0 .71l3.79 3.79c.32.31.86.09.86-.36V7c3.73 0 6.68 3.42 5.86 7.29-.47 2.27-2.31 4.1-4.57 4.57-3.57.75-6.75-1.7-7.23-5.01-.07-.48-.49-.85-.98-.85-.6 0-1.08.53-1 1.13.62 4.39 4.8 7.64 9.53 6.72 3.12-.61 5.63-3.12 6.24-6.24C20.84 9.48 16.94 5 12 5zm-2.44 8.49h.45c.21 0 .37-.05.48-.16s.16-.25.16-.43c0-.08-.01-.15-.04-.22s-.06-.12-.11-.17-.11-.09-.18-.11-.16-.04-.25-.04c-.08 0-.15.01-.22.03s-.13.05-.18.1-.09.09-.12.15-.05.13-.05.2h-.85c0-.18.04-.34.11-.48s.17-.27.3-.37.27-.18.44-.23.35-.08.54-.08c.21 0 .41.03.59.08s.33.13.46.23.23.23.3.38.11.33.11.53c0 .09-.01.18-.04.27s-.07.17-.13.25-.12.15-.2.22-.17.12-.28.17c.24.09.42.21.54.39s.18.38.18.61c0 .2-.04.38-.12.53s-.18.29-.32.39-.29.19-.48.24-.38.08-.6.08c-.18 0-.36-.02-.53-.07s-.33-.12-.46-.23-.25-.23-.33-.38-.12-.34-.12-.55h.85c0 .08.02.15.05.22s.07.12.13.17.12.09.2.11.16.04.25.04c.1 0 .19-.01.27-.04s.15-.07.2-.12.1-.11.13-.18.04-.15.04-.24c0-.11-.02-.21-.05-.29s-.08-.15-.14-.2-.13-.09-.22-.11-.18-.04-.29-.04h-.47v-.65zm5.74.75c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.11-.32c.03-.13.04-.29.04-.48v-.97z"/></svg>
        </button>
        <button id="${styles_1.AUDIO_PLAYPAUSE_ID}" title="play / pause">
            <svg id="${styles_1.AUDIO_PLAYPAUSE_ID}_0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" width="60px" height="60px">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1zm4 0c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1z"/></svg>
            <svg id="${styles_1.AUDIO_PLAYPAUSE_ID}_1" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" width="60px" height="60px">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4z"/></svg>
        </button>
        <button id="${styles_1.AUDIO_FORWARD_ID}" title="forward">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px">
            <path d="M18.92 13c-.5 0-.91.37-.98.86-.48 3.37-3.77 5.84-7.42 4.96-2.25-.54-3.91-2.27-4.39-4.53C5.32 10.42 8.27 7 12 7v2.79c0 .45.54.67.85.35l3.79-3.79c.2-.2.2-.51 0-.71l-3.79-3.79c-.31-.31-.85-.09-.85.36V5c-4.94 0-8.84 4.48-7.84 9.6.6 3.11 2.9 5.5 5.99 6.19 4.83 1.08 9.15-2.2 9.77-6.67.09-.59-.4-1.12-1-1.12zm-8.38 2.22c-.06.05-.12.09-.2.12s-.17.04-.27.04c-.09 0-.17-.01-.25-.04s-.14-.06-.2-.11-.1-.1-.13-.17-.05-.14-.05-.22h-.85c0 .21.04.39.12.55s.19.28.33.38.29.18.46.23.35.07.53.07c.21 0 .41-.03.6-.08s.34-.14.48-.24.24-.24.32-.39.12-.33.12-.53c0-.23-.06-.44-.18-.61s-.3-.3-.54-.39c.1-.05.2-.1.28-.17s.15-.14.2-.22.1-.16.13-.25.04-.18.04-.27c0-.2-.04-.37-.11-.53s-.17-.28-.3-.38-.28-.18-.46-.23-.37-.08-.59-.08c-.19 0-.38.03-.54.08s-.32.13-.44.23-.23.22-.3.37-.11.3-.11.48h.85c0-.07.02-.14.05-.2s.07-.11.12-.15.11-.07.18-.1.14-.03.22-.03c.1 0 .18.01.25.04s.13.06.18.11.08.11.11.17.04.14.04.22c0 .18-.05.32-.16.43s-.26.16-.48.16h-.43v.66h.45c.11 0 .2.01.29.04s.16.06.22.11.11.12.14.2.05.18.05.29c0 .09-.01.17-.04.24s-.08.11-.13.17zm3.9-3.44c-.18-.07-.37-.1-.59-.1s-.41.03-.59.1-.33.18-.45.33-.23.34-.29.57-.1.5-.1.82v.74c0 .32.04.6.11.82s.17.42.3.57.28.26.46.33.37.1.59.1.41-.03.59-.1.33-.18.45-.33.22-.34.29-.57.1-.5.1-.82v-.74c0-.32-.04-.6-.11-.82s-.17-.42-.3-.57-.28-.26-.46-.33zm.01 2.57c0 .19-.01.35-.04.48s-.06.24-.11.32-.11.14-.19.17-.16.05-.25.05-.18-.02-.25-.05-.14-.09-.19-.17-.09-.19-.12-.32-.04-.29-.04-.48v-.97c0-.19.01-.35.04-.48s.06-.23.12-.31.11-.14.19-.17.16-.05.25-.05.18.02.25.05.14.09.19.17.09.18.12.31.04.29.04.48v.97z"/></svg>
        </button>
        <button id="${styles_1.AUDIO_NEXT_ID}" title="next">
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" width="48px" height="48px">
            <path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>
        </button>
        <input id="${styles_1.AUDIO_SLIDER_ID}" type="range" min="0" max="100" value="0" step="1" title="progress" />
        <button id="${styles_1.AUDIO_TIME_ID}" title="time information 1">-</button>
        <button id="${styles_1.AUDIO_PERCENT_ID}" title="time information 2">-</button>
        <select id="${styles_1.AUDIO_RATE_ID}" title="playback speed">
            <option value="2">2x</option>
            <option value="1.75">1.75x</option>
            <option value="1.5">1.5x</option>
            <option value="1.25">1.25x</option>
            <option value="1">1x</option>
            <option value="0.75">0.75x</option>
            <option value="0.5">0.5x</option>
            <option value="0.35">0.35x</option>
            <option value="0.25">0.25x</option>
        </select>
    </div>
</section>
</body>
</html>`;
                const contentType = "application/xhtml+xml";
                htmlMarkup = (0, readium_css_inject_1.readiumCssTransformHtml)(htmlMarkup, rcssJson, contentType);
                const b64HTML = Buffer.from(htmlMarkup).toString("base64");
                const dataUri = `data:${contentType};base64,${b64HTML}`;
                newActiveWebView.setAttribute("src", dataUri);
            }
            return true;
        }
        else if (webviewNeedsHardRefresh) {
            const highlights = activeWebView.READIUM2.link === pubLink ? activeWebView.READIUM2.highlights : undefined;
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (highlights) {
                    const jsonStr = JSON.stringify({
                        margin: win.READIUM2.highlightsDrawMargin,
                        list: highlights,
                    });
                    const cs = new CompressionStream("gzip");
                    const csWriter = cs.writable.getWriter();
                    csWriter.write(new TextEncoder().encode(jsonStr));
                    csWriter.close();
                    const buff = Buffer.from(yield new Response(cs.readable).arrayBuffer());
                    const b64Highlights = buff.toString("base64");
                    hrefToLoadHttpUri.search((data) => {
                        data[url_params_1.URL_PARAM_HIGHLIGHTS] = b64Highlights;
                    });
                }
                const uriStr = hrefToLoadHttpUri.toString();
                const uriStr__ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
                    (pubIsServedViaSpecialUrlProtocol ? (0, sessions_1.convertHttpUrlToCustomScheme)(uriStr) : uriStr);
                if (IS_DEV) {
                    debug(`___HARD___ WEBVIEW REFRESH: ${uriStr__}`);
                }
                const readiumCssBackup = activeWebView.READIUM2.readiumCss;
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
                const newActiveWebView = secondWebView ?
                    win.READIUM2.getSecondWebView(false) :
                    win.READIUM2.getFirstWebView();
                if (newActiveWebView) {
                    newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                    newActiveWebView.READIUM2.highlights = highlights;
                    newActiveWebView.READIUM2.link = pubLink;
                    newActiveWebView.setAttribute("src", uriStr__);
                }
            }), highlights ? 500 : win.READIUM2.ttsClickEnabled ? 100 : 10);
        }
        else {
            const highlights = activeWebView.READIUM2.link === pubLink ? activeWebView.READIUM2.highlights : undefined;
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (highlights) {
                    const jsonStr = JSON.stringify({
                        margin: win.READIUM2.highlightsDrawMargin,
                        list: highlights,
                    });
                    const cs = new CompressionStream("gzip");
                    const csWriter = cs.writable.getWriter();
                    csWriter.write(new TextEncoder().encode(jsonStr));
                    csWriter.close();
                    const buff = Buffer.from(yield new Response(cs.readable).arrayBuffer());
                    const b64Highlights = buff.toString("base64");
                    hrefToLoadHttpUri.search((data) => {
                        data[url_params_1.URL_PARAM_HIGHLIGHTS] = b64Highlights;
                    });
                }
                const uriStr = hrefToLoadHttpUri.toString();
                const uriStr__ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
                    (pubIsServedViaSpecialUrlProtocol ? (0, sessions_1.convertHttpUrlToCustomScheme)(uriStr) : uriStr);
                if (IS_DEV) {
                    debug(`___SOFT___ WEBVIEW REFRESH: ${uriStr__}`);
                }
                const webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
                    && activeWebView.READIUM2.link !== null;
                activeWebView.READIUM2.link = pubLink;
                activeWebView.READIUM2.highlights = highlights;
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
            }), highlights ? 500 : win.READIUM2.ttsClickEnabled ? 100 : 10);
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
const _saveReadingLocation = (activeWebView, locator) => {
    var _a, _b;
    const docHref = (_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href;
    if (!docHref) {
        return;
    }
    const activeWebViews = win.READIUM2.getActiveWebViews();
    let otherActive;
    for (const active of activeWebViews) {
        if (active === activeWebView) {
            continue;
        }
        otherActive = active;
        break;
    }
    const publication = win.READIUM2.publication;
    let position;
    if (publication && publication.Spine) {
        const isAudio = publication.Metadata &&
            publication.Metadata.RDFType &&
            /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
        if (isAudio) {
            const metaDuration = publication.Metadata.Duration;
            let totalDuration = 0;
            let timePosition;
            for (const spineItem of publication.Spine) {
                if (typeof spineItem.Duration !== "undefined") {
                    if (docHref === spineItem.Href) {
                        const percent = typeof locator.locations.progression !== "undefined" ?
                            locator.locations.progression : 0;
                        const time = percent * spineItem.Duration;
                        if (typeof timePosition === "undefined") {
                            timePosition = totalDuration + time;
                        }
                    }
                    totalDuration += spineItem.Duration;
                }
            }
            if (totalDuration !== metaDuration) {
                console.log(`DIFFERENT AUDIO DURATIONS?! ${totalDuration} (spines) !== ${metaDuration} (metadata)`);
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
        secondWebViewHref: locator.secondWebViewHref || ((_b = otherActive === null || otherActive === void 0 ? void 0 : otherActive.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href),
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            var _a;
            const activeWebViews = win.READIUM2.getActiveWebViews();
            for (const activeWebView of activeWebViews) {
                if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== locator.href) {
                    continue;
                }
                const cb = (event) => {
                    if (event.channel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
                        const webview = event.currentTarget;
                        if (webview !== activeWebView) {
                            console.log("Wrong navigator webview?!");
                            return;
                        }
                        const payloadPong = event.args[0];
                        activeWebView.removeEventListener("ipc-message", cb);
                        resolve(payloadPong.visible);
                    }
                };
                activeWebView.addEventListener("ipc-message", cb);
                const payloadPing = { location: locator.locations, visible: false };
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    var _b;
                    if ((_b = activeWebView.READIUM2) === null || _b === void 0 ? void 0 : _b.DOMisReady) {
                        yield activeWebView.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payloadPing);
                    }
                }), 0);
                return;
            }
            reject("isLocatorVisible - no webview href match.");
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
//# sourceMappingURL=location.js.map