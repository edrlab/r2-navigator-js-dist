"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_ = require("debug");
const electron_1 = require("electron");
const path = require("path");
const url_1 = require("url");
const UrlUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/http/UrlUtils");
const audiobook_1 = require("../common/audiobook");
const events_1 = require("../common/events");
const readium_css_inject_1 = require("../common/readium-css-inject");
const sessions_1 = require("../common/sessions");
const styles_1 = require("../common/styles");
const url_params_1 = require("./common/url-params");
const epubReadingSystem_1 = require("./epubReadingSystem");
const readium_css_1 = require("./readium-css");
const state_1 = require("./webview/state");
const URI = require("urijs");
const debug = debug_("r2:navigator#electron/renderer/location");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const win = window;
function locationHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    const activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_LOCATOR_VISIBLE) {
    }
    else if (eventChannel === events_1.R2_EVENT_SHIFT_VIEW_X) {
        shiftWebview(activeWebView, eventArgs[0].offset, eventArgs[0].backgroundColor);
    }
    else if (eventChannel === events_1.R2_EVENT_PAGE_TURN_RES) {
        const publication = win.READIUM2.publication;
        const publicationURL = win.READIUM2.publicationURL;
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
            handleLink(urlNoQueryParams, goPREVIOUS, false, activeWebView.READIUM2.readiumCss);
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
        handleLinkUrl(payload.url, activeWebView.READIUM2.readiumCss);
    }
    else if (eventChannel === events_1.R2_EVENT_AUDIO_SOUNDTRACK) {
        const payload = eventArgs[0];
        handleAudioSoundTrack(payload.url);
    }
    else {
        return false;
    }
    return true;
}
exports.locationHandleIpcMessage = locationHandleIpcMessage;
const AUDIO_SOUNDTRACK_ID = "R2_AUDIO_SOUNDTRACK_ID";
let _currentAudioSoundTrack;
function handleAudioSoundTrack(url) {
    if (url === _currentAudioSoundTrack) {
        return;
    }
    _currentAudioSoundTrack = url;
    let audioEl = document.getElementById(AUDIO_SOUNDTRACK_ID);
    if (audioEl && audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
    }
    audioEl = document.createElement("audio");
    audioEl.setAttribute("style", "display: none");
    audioEl.setAttribute("id", AUDIO_SOUNDTRACK_ID);
    audioEl.setAttribute("src", url);
    audioEl.setAttribute("loop", "loop");
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.setAttribute("role", "ibooks:soundtrack");
    document.body.appendChild(audioEl);
}
electron_1.ipcRenderer.on(events_1.R2_EVENT_LINK, (_event, payload) => {
    debug("R2_EVENT_LINK (ipcRenderer.on)");
    debug(payload.url);
    const activeWebView = win.READIUM2.getActiveWebView();
    handleLinkUrl(payload.url, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
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
function navLeftOrRight(left, spineNav) {
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return;
    }
    const rtl = readium_css_1.isRTL();
    if (spineNav) {
        if (!publication.Spine) {
            return;
        }
        if (!_lastSavedReadingLocation) {
            return;
        }
        const loc = _lastSavedReadingLocation;
        const rtl_ = loc.docInfo && loc.docInfo.isRightToLeft;
        if (rtl_ !== rtl) {
            debug(`RTL differ?! METADATA ${rtl} vs. DOCUMENT ${rtl_}`);
        }
        const offset = (left ? -1 : 1) * (rtl ? -1 : 1);
        const currentSpineIndex = publication.Spine.findIndex((link) => {
            return link.Href === loc.locator.href;
        });
        if (currentSpineIndex >= 0) {
            const spineIndex = currentSpineIndex + offset;
            if (spineIndex >= 0 && spineIndex <= (publication.Spine.length - 1)) {
                const nextOrPreviousSpineItem = publication.Spine[spineIndex];
                const uri = new url_1.URL(nextOrPreviousSpineItem.Href, publicationURL);
                uri.hash = "";
                uri.search = "";
                const urlNoQueryParams = uri.toString();
                const activeWebView = win.READIUM2.getActiveWebView();
                handleLink(urlNoQueryParams, false, false, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
                return;
            }
            else {
                electron_1.shell.beep();
            }
        }
    }
    else {
        const goPREVIOUS = left ? !rtl : rtl;
        const payload = {
            direction: rtl ? "RTL" : "LTR",
            go: goPREVIOUS ? "PREVIOUS" : "NEXT",
        };
        const activeWebView = win.READIUM2.getActiveWebView();
        if (activeWebView) {
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield activeWebView.send(events_1.R2_EVENT_PAGE_TURN, payload);
            }), 0);
        }
    }
}
exports.navLeftOrRight = navLeftOrRight;
function handleLink(href, previous, useGoto, rcss) {
    const special = href.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        const okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            debug(`Readium link fail?! ${href}`);
        }
    }
    else {
        const okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            if (/^http[s]?:\/\/127\.0\.0\.1/.test(href)) {
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
    handleLink(href, undefined, false, rcss);
}
exports.handleLinkUrl = handleLinkUrl;
function handleLinkLocator(location, rcss) {
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
            ((useGoto) ? ("?" + url_params_1.URL_PARAM_GOTO + "=" +
                UrlUtils_1.encodeURIComponent_RFC3986(Buffer.from(JSON.stringify(linkToLoadGoto, null, "")).toString("base64"))) :
                "");
        handleLink(hrefToLoad, undefined, useGoto, rcss);
    }
}
exports.handleLinkLocator = handleLinkLocator;
let _reloadCounter = 0;
function reloadContent() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }
    setTimeout(() => {
        activeWebView.READIUM2.forceRefresh = true;
        if (activeWebView.READIUM2.link) {
            const uri = new url_1.URL(activeWebView.READIUM2.link.Href, win.READIUM2.publicationURL);
            uri.hash = "";
            uri.search = "";
            const urlNoQueryParams = uri.toString();
            handleLinkUrl(urlNoQueryParams, activeWebView.READIUM2.readiumCss);
        }
    }, 0);
}
exports.reloadContent = reloadContent;
function loadLink(hrefFull, previous, useGoto, rcss) {
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
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
    debug(`R2LOADLINK: ${pubJsonUri} (${publicationURL}) + ${hrefFull} ==> ${linkPath}`);
    let pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink && publication.Resources) {
        pubLink = publication.Resources.find((resLink) => {
            return resLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        let hrefNoHash;
        try {
            const u = new URI(hrefFull);
            u.hash("").normalizeHash();
            u.search((data) => {
                data[url_params_1.URL_PARAM_PREVIOUS] = undefined;
                data[url_params_1.URL_PARAM_GOTO] = undefined;
                data[url_params_1.URL_PARAM_CSS] = undefined;
                data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = undefined;
                data[url_params_1.URL_PARAM_DEBUG_VISUALS] = undefined;
                data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
                data[url_params_1.URL_PARAM_REFRESH] = undefined;
            });
            hrefNoHash = u.toString();
        }
        catch (err) {
            debug(err);
        }
        if (hrefNoHash) {
            pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
                return spineLink.Href === hrefNoHash;
            }) : undefined;
            if (!pubLink && publication.Resources) {
                pubLink = publication.Resources.find((resLink) => {
                    return resLink.Href === hrefNoHash;
                });
            }
        }
        if (!pubLink) {
            debug(`CANNOT LOAD EXT LINK ${pubJsonUri} (${publicationURL}) + ${hrefFull} (${hrefNoHash}) ==> ${linkPath}`);
            return false;
        }
    }
    if (!pubLink) {
        debug(`CANNOT LOAD LINK ${pubJsonUri} (${publicationURL}) + ${hrefFull} ==> ${linkPath}`);
        return false;
    }
    const activeWebView = win.READIUM2.getActiveWebView();
    const actualReadiumCss = (activeWebView && activeWebView.READIUM2.readiumCss) ?
        activeWebView.READIUM2.readiumCss :
        readium_css_1.obtainReadiumCss(rcss);
    if (activeWebView) {
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
    }
    const rcssJson = readium_css_1.adjustReadiumCssJsonMessageForFixedLayout(pubLink, actualReadiumCss);
    const rcssJsonstr = JSON.stringify(rcssJson, null, "");
    const rcssJsonstrBase64 = Buffer.from(rcssJsonstr).toString("base64");
    const fileName = path.basename(linkPath);
    const ext = path.extname(fileName).toLowerCase();
    const isAudio = publication.Metadata &&
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
    const linkUri = new URI(hrefFull);
    if (isAudio) {
        if (useGoto) {
            linkUri.hash("").normalizeHash();
            if (pubLink.Duration) {
                const gotoBase64 = linkUri.search(true)[url_params_1.URL_PARAM_GOTO];
                if (gotoBase64) {
                    const str = Buffer.from(gotoBase64, "base64").toString("utf8");
                    const json = JSON.parse(str);
                    const gotoProgression = json.progression;
                    if (typeof gotoProgression !== "undefined") {
                        const time = gotoProgression * pubLink.Duration;
                        linkUri.hash(`t=${time}`).normalizeHash();
                    }
                }
            }
        }
        linkUri.search((data) => {
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
        const rersJson = epubReadingSystem_1.getEpubReadingSystemInfo();
        const rersJsonstr = JSON.stringify(rersJson, null, "");
        const rersJsonstrBase64 = Buffer.from(rersJsonstr).toString("base64");
        linkUri.search((data) => {
            data[url_params_1.URL_PARAM_CSS] = rcssJsonstrBase64;
            data[url_params_1.URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;
            data[url_params_1.URL_PARAM_DEBUG_VISUALS] = (IS_DEV &&
                win.READIUM2.DEBUG_VISUALS) ?
                "true" : "false";
            data[url_params_1.URL_PARAM_CLIPBOARD_INTERCEPT] =
                win.READIUM2.clipboardInterceptor ?
                    "true" : "false";
        });
    }
    const webviewNeedsForcedRefresh = !isAudio &&
        activeWebView && activeWebView.READIUM2.forceRefresh;
    if (activeWebView) {
        activeWebView.READIUM2.forceRefresh = undefined;
    }
    const webviewNeedsHardRefresh = !isAudio &&
        (win.READIUM2.enableScreenReaderAccessibilityWebViewHardRefresh
            && state_1.isScreenReaderMounted());
    if (!isAudio && !webviewNeedsHardRefresh && !webviewNeedsForcedRefresh &&
        activeWebView && activeWebView.READIUM2.link === pubLink) {
        const goto = useGoto ? linkUri.search(true)[url_params_1.URL_PARAM_GOTO] : undefined;
        const hash = useGoto ? undefined : linkUri.fragment();
        debug("WEBVIEW ALREADY LOADED: " + pubLink.Href);
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
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield activeWebView.send("R2_EVENT_HIDE");
                }), 0);
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    shiftWebview(activeWebView, 0, undefined);
                    yield activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload);
                }), 10);
            }
            else {
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield activeWebView.send(events_1.R2_EVENT_SCROLLTO, payload);
                }), 0);
            }
        }
        return true;
    }
    if (activeWebView) {
        if (webviewNeedsForcedRefresh) {
            linkUri.search((data) => {
                data[url_params_1.URL_PARAM_REFRESH] = `${++_reloadCounter}`;
            });
        }
        if (win.READIUM2.sessionInfo) {
            linkUri.search((data) => {
                if (win.READIUM2.sessionInfo) {
                    const b64SessionInfo = Buffer.from(win.READIUM2.sessionInfo).toString("base64");
                    data[url_params_1.URL_PARAM_SESSION_INFO] = b64SessionInfo;
                }
            });
        }
        const uriStr = linkUri.toString();
        const needConvert = publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
        const uriStr_ = uriStr.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ?
            uriStr : (needConvert ? sessions_1.convertHttpUrlToCustomScheme(uriStr) : uriStr);
        if (isAudio) {
            if (IS_DEV) {
                debug(`___HARD AUDIO___ WEBVIEW REFRESH: ${uriStr_}`);
            }
            const readiumCssBackup = activeWebView.READIUM2.readiumCss;
            win.READIUM2.destroyActiveWebView();
            win.READIUM2.createActiveWebView();
            const newActiveWebView = win.READIUM2.getActiveWebView();
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
                let htmlMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <base href="${pubJsonUri}" id="${readium_css_inject_1.READIUM2_BASEURL_ID}" />
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
${title ? `<h3 id="${styles_1.AUDIO_TITLE_ID}">${title}</h3>` : ``}
${coverLink ? `<img id="${styles_1.AUDIO_COVER_ID}" src="${coverLink.Href}" alt="" ${coverLink.Height ? `height="${coverLink.Height}"` : ""} ${coverLink.Width ? `width="${coverLink.Width}"` : ""} ${coverLink.Width || coverLink.Height ? `style="${coverLink.Height ? `height: ${coverLink.Height}px !important;` : ""} ${coverLink.Width ? `width: ${coverLink.Width}px !important;` : ""}"` : ""}/>` : ``}
    <audio
        id="${styles_1.AUDIO_ID}"
        ${audiobook_1.DEBUG_AUDIO ? `controlsx="controlsx"` : ""}
        autoplay="autoplay"
        preload="metadata">

        <source src="${uriStr}" type="${pubLink.TypeLink}" />
    </audio>
    ${audiobook_1.DEBUG_AUDIO ?
                    `
<canvas id="${styles_1.AUDIO_BUFFER_CANVAS_ID}"> </canvas>
    `
                    : ""}
    <div id="${styles_1.AUDIO_CONTROLS_ID}">
        <button id="${styles_1.AUDIO_PREVIOUS_ID}"></button>
        <button id="${styles_1.AUDIO_REWIND_ID}"></button>
        <button id="${styles_1.AUDIO_PLAYPAUSE_ID}"></button>
        <button id="${styles_1.AUDIO_FORWARD_ID}"></button>
        <button id="${styles_1.AUDIO_NEXT_ID}"></button>
        <input id="${styles_1.AUDIO_SLIDER_ID}" type="range" min="0" max="100" value="0" step="1" />
        <span id="${styles_1.AUDIO_TIME_ID}">-</span>
        <span id="${styles_1.AUDIO_PERCENT_ID}">-</span>
    </div>
</section>
</body>
</html>`;
                const contentType = "application/xhtml+xml";
                if (rcssJson.setCSS) {
                    rcssJson.setCSS.paged = false;
                }
                htmlMarkup = readium_css_inject_1.readiumCssTransformHtml(htmlMarkup, rcssJson, contentType);
                const b64HTML = Buffer.from(htmlMarkup).toString("base64");
                const dataUri = `data:${contentType};base64,${b64HTML}`;
                newActiveWebView.setAttribute("src", dataUri);
            }
            return true;
        }
        else if (webviewNeedsHardRefresh) {
            if (IS_DEV) {
                debug(`___HARD___ WEBVIEW REFRESH: ${uriStr_}`);
            }
            const readiumCssBackup = activeWebView.READIUM2.readiumCss;
            win.READIUM2.destroyActiveWebView();
            win.READIUM2.createActiveWebView();
            const newActiveWebView = win.READIUM2.getActiveWebView();
            if (newActiveWebView) {
                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                newActiveWebView.READIUM2.link = pubLink;
                newActiveWebView.setAttribute("src", uriStr_);
            }
            return true;
        }
        else {
            if (IS_DEV) {
                debug(`___SOFT___ WEBVIEW REFRESH: ${uriStr_}`);
            }
            const webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
                && activeWebView.READIUM2.link !== null;
            activeWebView.READIUM2.link = pubLink;
            if (activeWebView.style.transform !== "none") {
                if (webviewAlreadyHasContent) {
                    setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        yield activeWebView.send("R2_EVENT_HIDE");
                    }), 0);
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
    const publication = win.READIUM2.publication;
    let position;
    if (publication && publication.Spine) {
        const isAudio = publication.Metadata &&
            publication.Metadata.RDFType &&
            /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const activeWebView = win.READIUM2.getActiveWebView();
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
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield activeWebView.send(events_1.R2_EVENT_LOCATOR_VISIBLE, payloadPing);
            }), 0);
        });
    });
}
exports.isLocatorVisible = isLocatorVisible;
//# sourceMappingURL=location.js.map