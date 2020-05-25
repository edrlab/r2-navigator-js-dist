"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaOverlaysEnableSkippability = exports.mediaOverlaysPlaybackRate = exports.mediaOverlaysClickEnable = exports.mediaOverlaysEnableCaptionsMode = exports.mediaOverlaysEscape = exports.mediaOverlaysNext = exports.mediaOverlaysPrevious = exports.mediaOverlaysResume = exports.mediaOverlaysStop = exports.mediaOverlaysInterrupt = exports.mediaOverlaysPause = exports.mediaOverlaysPlay = exports.mediaOverlaysListen = exports.MediaOverlaysStateEnum = exports.mediaOverlaysHandleIpcMessage = exports.publicationHasMediaOverlays = void 0;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const util = require("util");
const serializable_1 = require("r2-lcp-js/dist/es6-es2015/src/serializable");
const media_overlay_1 = require("r2-shared-js/dist/es6-es2015/src/models/media-overlay");
const audiobook_1 = require("../common/audiobook");
const events_1 = require("../common/events");
const sessions_1 = require("../common/sessions");
const location_1 = require("./location");
const readium_css_1 = require("./readium-css");
const debug = debug_("r2:navigator#electron/renderer/media-overlays");
const IS_DEV = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
const win = window;
const AUDIO_MO_ID = "R2_AUDIO_MO_ID";
function publicationHasMediaOverlays(publication) {
    if (publication.Spine) {
        const firstMoLink = publication.Spine.find((link) => {
            var _a;
            if ((_a = link.Properties) === null || _a === void 0 ? void 0 : _a.MediaOverlay) {
                return true;
            }
            if (link.Alternate) {
                for (const altLink of link.Alternate) {
                    if (altLink.TypeLink === "application/vnd.syncnarr+json") {
                        return true;
                    }
                }
            }
            return false;
        });
        if (firstMoLink) {
            return true;
        }
    }
    return false;
}
exports.publicationHasMediaOverlays = publicationHasMediaOverlays;
let _captionsMode = false;
let _mediaOverlaysClickEnabled = false;
let _mediaOverlaysPlaybackRate = 1;
let _currentAudioUrl;
let _previousAudioUrl;
let _currentAudioBegin;
let _currentAudioEnd;
let _previousAudioEnd;
let _currentAudioElement;
let _mediaOverlayRoot;
let _mediaOverlayTextAudioPair;
let _mediaOverlayTextId;
let _mediaOverlayTextHref;
let _mediaOverlayActive = false;
function playMediaOverlays(textHref, rootMo, textFragmentIDChain) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (IS_DEV) {
            debug("playMediaOverlays()");
        }
        let textFragmentIDChain_ = textFragmentIDChain ? textFragmentIDChain.filter((id) => id) : undefined;
        if (textFragmentIDChain_ && textFragmentIDChain_.length === 0) {
            textFragmentIDChain_ = undefined;
        }
        let moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_);
        if (!moTextAudioPair && textFragmentIDChain_) {
            if (IS_DEV) {
                debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE ");
                debug(JSON.stringify(textFragmentIDChain_, null, 4));
                debug(JSON.stringify(rootMo, null, 4));
            }
            moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, undefined);
        }
        if (moTextAudioPair) {
            if (moTextAudioPair.Audio) {
                if (IS_DEV) {
                    debug("playMediaOverlays() - playMediaOverlaysAudio()");
                }
                _mediaOverlayRoot = rootMo;
                yield playMediaOverlaysAudio(moTextAudioPair, undefined, undefined);
                if (_mediaOverlaysListener) {
                    _mediaOverlaysListener(MediaOverlaysStateEnum.PLAYING);
                }
            }
        }
        else {
            if (IS_DEV) {
                debug("playMediaOverlays() - !moTextAudioPair " + textHref);
            }
        }
    });
}
const ontimeupdate = (ev) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const currentAudioElement = ev.currentTarget;
    if (_currentAudioEnd && currentAudioElement.currentTime >= (_currentAudioEnd - 0.05)) {
        if (IS_DEV) {
            debug("ontimeupdate - mediaOverlaysNext()");
        }
        mediaOverlaysNext();
    }
});
const ensureOnTimeUpdate = (remove) => {
    if (_currentAudioElement) {
        if (remove) {
            if (_currentAudioElement.__ontimeupdate) {
                _currentAudioElement.__ontimeupdate = false;
                _currentAudioElement.removeEventListener("timeupdate", ontimeupdate);
            }
        }
        else {
            if (!_currentAudioElement.__ontimeupdate) {
                _currentAudioElement.__ontimeupdate = true;
                _currentAudioElement.addEventListener("timeupdate", ontimeupdate);
            }
        }
    }
};
function playMediaOverlaysAudio(moTextAudioPair, begin, end) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (IS_DEV) {
            debug("playMediaOverlaysAudio()");
        }
        ensureKillAutoNextTimeout();
        _mediaOverlayActive = true;
        _mediaOverlayTextAudioPair = moTextAudioPair;
        _mediaOverlayTextId = undefined;
        moHighlight_(moTextAudioPair);
        if (!moTextAudioPair.Audio) {
            return;
        }
        let publicationURL = win.READIUM2.publicationURL;
        if (publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
            publicationURL = sessions_1.convertCustomSchemeToHttpUrl(publicationURL);
        }
        const urlObjFull = new URL(moTextAudioPair.Audio, publicationURL);
        const urlFull = urlObjFull.toString();
        const urlObjNoQuery = new URL(urlFull);
        urlObjNoQuery.hash = "";
        urlObjNoQuery.search = "";
        const urlNoQuery = urlObjNoQuery.toString();
        const hasBegin = typeof begin !== "undefined";
        const hasEnd = typeof end !== "undefined";
        _previousAudioEnd = _currentAudioEnd;
        _currentAudioBegin = undefined;
        _currentAudioEnd = undefined;
        if (!hasBegin && !hasEnd) {
            if (urlObjFull.hash) {
                const matches = urlObjFull.hash.match(/t=([0-9\.]+)(,([0-9\.]+))?/);
                if (matches && matches.length >= 1) {
                    const b = matches[1];
                    try {
                        _currentAudioBegin = parseFloat(b);
                    }
                    catch (err) {
                        debug(err);
                    }
                    if (matches.length >= 3) {
                        const e = matches[3];
                        try {
                            _currentAudioEnd = parseFloat(e);
                        }
                        catch (err) {
                            debug(err);
                        }
                    }
                }
            }
        }
        else {
            _currentAudioBegin = begin;
            _currentAudioEnd = end;
        }
        if (IS_DEV) {
            debug(`${urlFull} => [${_currentAudioBegin}-${_currentAudioEnd}]`);
        }
        const playClip = (initial) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!_currentAudioElement) {
                return;
            }
            const timeToSeekTo = _currentAudioBegin ? _currentAudioBegin : 0;
            if (initial || _currentAudioElement.paused) {
                if ((initial && !timeToSeekTo) ||
                    _currentAudioElement.currentTime === timeToSeekTo) {
                    if (IS_DEV) {
                        debug("playMediaOverlaysAudio() - playClip() - _currentAudioElement.play()");
                    }
                    ensureOnTimeUpdate(false);
                    _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                    yield _currentAudioElement.play();
                }
                else {
                    if (IS_DEV) {
                        debug("playMediaOverlaysAudio() - playClip() - ontimeupdateSeeked");
                    }
                    const ontimeupdateSeeked = (ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const currentAudioElement = ev.currentTarget;
                        currentAudioElement.removeEventListener("timeupdate", ontimeupdateSeeked);
                        if (IS_DEV) {
                            debug("playMediaOverlaysAudio() - playClip() - ontimeupdateSeeked - .play()");
                        }
                        ensureOnTimeUpdate(false);
                        if (_currentAudioElement) {
                            _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                            yield _currentAudioElement.play();
                        }
                    });
                    _currentAudioElement.addEventListener("timeupdate", ontimeupdateSeeked);
                    _currentAudioElement.currentTime = timeToSeekTo;
                }
            }
            else {
                const contiguous = _previousAudioUrl === _currentAudioUrl &&
                    typeof _previousAudioEnd !== "undefined" &&
                    _previousAudioEnd > (timeToSeekTo - 0.02) &&
                    _previousAudioEnd <= timeToSeekTo &&
                    _currentAudioElement.currentTime >= (timeToSeekTo - 0.1);
                ensureOnTimeUpdate(false);
                if (contiguous) {
                    if (IS_DEV) {
                        debug("playMediaOverlaysAudio() - playClip() - ensureOnTimeUpdate");
                    }
                }
                else {
                    if (IS_DEV) {
                        debug("playMediaOverlaysAudio() - playClip() - currentTime = timeToSeekTo");
                    }
                    _currentAudioElement.currentTime = timeToSeekTo;
                }
            }
        });
        _previousAudioUrl = _currentAudioUrl;
        if (!_currentAudioUrl || urlNoQuery !== _currentAudioUrl) {
            _currentAudioUrl = urlNoQuery;
            if (IS_DEV) {
                debug("playMediaOverlaysAudio() - RESET: " + _previousAudioUrl + " => " + _currentAudioUrl);
            }
            ensureOnTimeUpdate(true);
            if (_currentAudioElement) {
                _currentAudioElement.pause();
                _currentAudioElement.setAttribute("src", "");
                if (_currentAudioElement.parentNode) {
                    _currentAudioElement.parentNode.removeChild(_currentAudioElement);
                }
            }
            _currentAudioElement = document.createElement("audio");
            _currentAudioElement.setAttribute("style", "display: none");
            _currentAudioElement.setAttribute("id", AUDIO_MO_ID);
            _currentAudioElement.setAttribute("role", "media-overlays");
            document.body.appendChild(_currentAudioElement);
            _currentAudioElement.addEventListener("error", (ev) => {
                debug("-1) error: " +
                    (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                    + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                if (_currentAudioElement && _currentAudioElement.error) {
                    debug(_currentAudioElement.error.code);
                    debug(_currentAudioElement.error.message);
                }
            });
            if (IS_DEV) {
                _currentAudioElement.addEventListener("load", (ev) => {
                    debug("0) load: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("loadstart", (ev) => {
                    debug("1) loadstart: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("durationchange", (ev) => {
                    debug("2) durationchange: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("loadedmetadata", (ev) => {
                    debug("3) loadedmetadata: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("loadeddata", (ev) => {
                    debug("4) loadeddata: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("progress", (ev) => {
                    debug("5) progress: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("canplay", (ev) => {
                    debug("6) canplay: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("canplaythrough", (ev) => {
                    debug("7) canplaythrough: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("play", (ev) => {
                    debug("8) play: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("pause", (ev) => {
                    debug("9) pause: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("ended", (ev) => {
                    debug("10) ended: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("seeked", (ev) => {
                    debug("11) seeked: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                if (audiobook_1.DEBUG_AUDIO) {
                    _currentAudioElement.addEventListener("timeupdate", (ev) => {
                        debug("12) timeupdate: " +
                            (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                            + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                    });
                }
                _currentAudioElement.addEventListener("seeking", (ev) => {
                    debug("13) seeking: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("waiting", (ev) => {
                    debug("14) waiting: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("volumechange", (ev) => {
                    debug("15) volumechange: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("suspend", (ev) => {
                    debug("16) suspend: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("stalled", (ev) => {
                    debug("17) stalled: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("ratechange", (ev) => {
                    debug("18) ratechange: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("playing", (ev) => {
                    debug("19) playing: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("interruptend", (ev) => {
                    debug("20) interruptend: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("interruptbegin", (ev) => {
                    debug("21) interruptbegin: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("emptied", (ev) => {
                    debug("22) emptied: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
                _currentAudioElement.addEventListener("abort", (ev) => {
                    debug("23) abort: " +
                        (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                        + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                });
            }
            const oncanplaythrough = (ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const currentAudioElement = ev.currentTarget;
                currentAudioElement.removeEventListener("canplaythrough", oncanplaythrough);
                debug("oncanplaythrough");
                yield playClip(true);
            });
            _currentAudioElement.addEventListener("canplaythrough", oncanplaythrough);
            const onpause = (_ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                debug("onpause");
            });
            _currentAudioElement.addEventListener("pause", onpause);
            const onplay = (_ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                debug("onplay");
            });
            _currentAudioElement.addEventListener("play", onplay);
            _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
            _currentAudioElement.setAttribute("src", _currentAudioUrl);
        }
        else {
            if (IS_DEV) {
                debug("playMediaOverlaysAudio() - playClip()");
            }
            yield playClip(false);
        }
    });
}
const _skippables = [
    "footnote",
    "endnote",
    "pagebreak",
    "note",
    "rearnote",
    "sidebar",
    "marginalia",
    "annotation",
];
function isSkippable(mo) {
    return mo.Role && mo.Role.findIndex((r) => {
        return _skippables.includes(r);
    }) >= 0;
}
function findNextTextAudioPair(mo, moToMatch, previousMo, escape) {
    if (audiobook_1.DEBUG_AUDIO) {
        debug("findNextTextAudioPair()");
        debug(JSON.stringify(moToMatch));
        debug(JSON.stringify(previousMo.prev));
    }
    const isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
    if (isSkip) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findNextTextAudioPair() - isSkippable");
            debug(JSON.stringify(mo));
        }
        return null;
    }
    if (!mo.Children || !mo.Children.length) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findNextTextAudioPair() - leaf text/audio pair");
            debug(JSON.stringify(mo));
        }
        if (previousMo.prev === moToMatch) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - prevMo === moToMatch");
            }
            return mo;
        }
        if (!_mediaOverlaySkippabilityIsEnabled || !isSkippable(mo)) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - set previous");
                debug(JSON.stringify(mo));
            }
            previousMo.prev = mo;
        }
        return undefined;
    }
    for (const child of mo.Children) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findNextTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findNextTextAudioPair(child, moToMatch, previousMo, escape);
        if (match) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - match");
                debug(JSON.stringify(match));
            }
            return match;
        }
    }
    return undefined;
}
function findPreviousTextAudioPair(mo, moToMatch, previousMo) {
    if (audiobook_1.DEBUG_AUDIO) {
        debug("findPreviousTextAudioPair()");
        debug(JSON.stringify(moToMatch));
        debug(JSON.stringify(previousMo.prev));
    }
    const isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
    if (isSkip) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findPreviousTextAudioPair() - isSkippable");
            debug(JSON.stringify(mo));
        }
        return null;
    }
    if (!mo.Children || !mo.Children.length) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findPreviousTextAudioPair() - leaf text/audio pair");
            debug(JSON.stringify(mo));
        }
        if (previousMo.prev &&
            mo === moToMatch) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - mo === moToMatch");
                debug(JSON.stringify(previousMo.prev));
            }
            return previousMo.prev;
        }
        if (!_mediaOverlaySkippabilityIsEnabled || !isSkippable(mo)) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - set previous");
                debug(JSON.stringify(mo));
            }
            previousMo.prev = mo;
        }
        return undefined;
    }
    for (const child of mo.Children) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findPreviousTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findPreviousTextAudioPair(child, moToMatch, previousMo);
        if (match) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - match");
                debug(JSON.stringify(match));
            }
            return match;
        }
    }
    return undefined;
}
function findDepthFirstTextAudioPair(textHref, mo, textFragmentIDChain) {
    if (audiobook_1.DEBUG_AUDIO) {
        debug("findDepthFirstTextAudioPair()");
    }
    const isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
    let isTextUrlMatch;
    let isFragmentIDMatch;
    if (mo.Text) {
        const hrefUrlObj = new URL("https://dummy.com/" + mo.Text);
        if (hrefUrlObj.pathname.substr(1) === textHref) {
            isTextUrlMatch = true;
            if (hrefUrlObj.hash && textFragmentIDChain) {
                isFragmentIDMatch = false;
                const id = hrefUrlObj.hash.substr(1);
                for (const frag of textFragmentIDChain) {
                    if (frag === id) {
                        isFragmentIDMatch = true;
                        break;
                    }
                }
            }
        }
        else {
            isTextUrlMatch = false;
        }
    }
    if (audiobook_1.DEBUG_AUDIO) {
        debug("isSkip: " + isSkip);
        debug("isFragmentIDMatch: " + isFragmentIDMatch);
        debug("isTextUrlMatch: " + isTextUrlMatch);
    }
    if (!mo.Children || !mo.Children.length) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findDepthFirstTextAudioPair() - leaf text/audio pair");
        }
        if (!isTextUrlMatch) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - leaf - !isTextUrlMatch");
            }
            return undefined;
        }
        if (isFragmentIDMatch || (isTextUrlMatch && !textFragmentIDChain)) {
            if (isSkip) {
                if (audiobook_1.DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - leaf - isFragmentIDMatch || (isTextUrlMatch && !textFragmentIDChain (isSkip)");
                }
                return null;
            }
            else {
                if (audiobook_1.DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - leaf - isFragmentIDMatch || (isTextUrlMatch && !textFragmentIDChain");
                }
                return mo;
            }
        }
        return undefined;
    }
    let frags = textFragmentIDChain;
    for (const child of mo.Children) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findDepthFirstTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findDepthFirstTextAudioPair(textHref, child, frags);
        if (match === null) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - child - match null (skip)");
            }
            frags = undefined;
        }
        if (match) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - child - match");
                debug(JSON.stringify(match));
            }
            return match;
        }
    }
    if (isFragmentIDMatch) {
        if (isSkip) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch (skip)");
            }
            return null;
        }
        else {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch");
            }
            const match = findDepthFirstTextAudioPair(textHref, mo, undefined);
            if (match) {
                if (audiobook_1.DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch - match");
                    debug(JSON.stringify(match));
                }
                return match;
            }
        }
    }
    return undefined;
}
let _timeoutAutoNext;
function ensureKillAutoNextTimeout() {
    if (_timeoutAutoNext) {
        clearTimeout(_timeoutAutoNext);
        _timeoutAutoNext = undefined;
    }
}
function playMediaOverlaysForLink(link, textFragmentIDChain) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (IS_DEV) {
            debug("playMediaOverlaysForLink()");
            debug(link.Href);
            debug(link.HrefDecoded);
            debug(JSON.stringify(textFragmentIDChain, null, 4));
        }
        let moUrl;
        if ((_a = link.Properties) === null || _a === void 0 ? void 0 : _a.MediaOverlay) {
            moUrl = link.Properties.MediaOverlay;
            if (IS_DEV) {
                debug(link.Properties.MediaOverlay);
                debug(link.Duration);
            }
        }
        if (link.Alternate) {
            for (const altLink of link.Alternate) {
                if (altLink.TypeLink === "application/vnd.syncnarr+json") {
                    if (!moUrl) {
                        moUrl = altLink.Href;
                    }
                    if (IS_DEV) {
                        debug(altLink.Href);
                        debug(altLink.HrefDecoded);
                        debug(altLink.TypeLink);
                        debug(altLink.Duration);
                    }
                }
            }
        }
        ensureKillAutoNextTimeout();
        if (!moUrl) {
            if (IS_DEV) {
                debug("playMediaOverlaysForLink() - navLeftOrRight()");
            }
            _timeoutAutoNext = window.setTimeout(() => {
                _timeoutAutoNext = undefined;
                mediaOverlaysStop(true);
                const rtl = readium_css_1.isRTL();
                location_1.navLeftOrRight(rtl, true, true);
            }, 600);
            if (_mediaOverlaysListener) {
                _mediaOverlaysListener(MediaOverlaysStateEnum.PLAYING);
            }
            return;
        }
        if (!link.MediaOverlays || !link.MediaOverlays.initialized) {
            let publicationURL = win.READIUM2.publicationURL;
            if (publicationURL.startsWith(sessions_1.READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                publicationURL = sessions_1.convertCustomSchemeToHttpUrl(publicationURL);
            }
            const moUrlObjFull = new URL(moUrl, publicationURL);
            const moUrlFull = moUrlObjFull.toString();
            let response;
            try {
                response = yield fetch(moUrlFull);
            }
            catch (e) {
                debug(e);
                debug(moUrlFull);
                return;
            }
            if (!response.ok) {
                debug("BAD RESPONSE?!");
            }
            let moJson;
            try {
                moJson = yield response.json();
            }
            catch (e) {
                debug(e);
            }
            if (!moJson) {
                return;
            }
            link.MediaOverlays = serializable_1.TaJsonDeserialize(moJson, media_overlay_1.MediaOverlayNode);
            link.MediaOverlays.initialized = true;
            if (IS_DEV) {
                debug(util.inspect(link.MediaOverlays, { showHidden: false, depth: 1000, colors: true, customInspect: true }));
            }
        }
        if (!link.MediaOverlays || !link.MediaOverlays.initialized) {
            debug("Has MO but no Media Overlays?! " + link.Href);
            if (IS_DEV) {
                debug(JSON.stringify(win.READIUM2.publication, null, 4));
                debug(util.inspect(win.READIUM2.publication, { showHidden: false, depth: 1000, colors: true, customInspect: true }));
            }
            return;
        }
        if (IS_DEV) {
            debug("playMediaOverlaysForLink() - playMediaOverlays()");
        }
        const href = link.HrefDecoded || link.Href;
        const hrefUrlObj = new URL("https://dummy.com/" + href);
        yield playMediaOverlays(hrefUrlObj.pathname.substr(1), link.MediaOverlays, textFragmentIDChain);
    });
}
let _lastClickedNotification;
function mediaOverlaysHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    const activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_MEDIA_OVERLAY_CLICK) {
        if (publicationHasMediaOverlays(win.READIUM2.publication)) {
            if (IS_DEV) {
                debug("R2_EVENT_MEDIA_OVERLAY_CLICK");
            }
            const payload = eventArgs[0];
            mediaOverlaysInterrupt();
            _lastClickedNotification = {
                link: activeWebView.READIUM2.link,
                textFragmentIDChain: payload.textFragmentIDChain,
            };
            if ((payload.userInteract && _mediaOverlaysClickEnabled) ||
                _mediaOverlayActive) {
                if (IS_DEV) {
                    debug("playMediaOverlaysForLink");
                }
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (activeWebView.READIUM2.link) {
                        yield playMediaOverlaysForLink(activeWebView.READIUM2.link, payload.textFragmentIDChain);
                    }
                }), 0);
            }
        }
    }
    else if (eventChannel === events_1.R2_EVENT_MEDIA_OVERLAY_STARTSTOP) {
        const payload = eventArgs[0];
        if (IS_DEV) {
            debug("R2_EVENT_MEDIA_OVERLAY_STARTSTOP");
        }
        mediaOverlaysStop();
        if (payload.start) {
            const rate = _mediaOverlaysPlaybackRate;
            mediaOverlaysPlay(1);
            _mediaOverlaysPlaybackRate = rate;
        }
        else if (payload.stop) {
        }
        else {
            if (_currentAudioElement && !_currentAudioElement.paused) {
            }
            else {
                const rate = _mediaOverlaysPlaybackRate;
                mediaOverlaysPlay(1);
                _mediaOverlaysPlaybackRate = rate;
            }
        }
    }
    else {
        return false;
    }
    return true;
}
exports.mediaOverlaysHandleIpcMessage = mediaOverlaysHandleIpcMessage;
function moHighlight_(moTextAudioPair) {
    if (IS_DEV) {
        debug("moHighlight ...");
    }
    if (moTextAudioPair.Text) {
        const i = moTextAudioPair.Text.lastIndexOf("#");
        if (i >= 0) {
            const id = moTextAudioPair.Text.substr(i + 1);
            if (id) {
                _mediaOverlayTextId = id;
                _mediaOverlayTextHref = moTextAudioPair.Text.substr(0, i);
                moHighlight(_mediaOverlayTextHref, _mediaOverlayTextId);
            }
        }
    }
}
function moHighlight(href, id) {
    var _a, _b, _c, _d, _e;
    if (IS_DEV) {
        debug("moHighlight: " + href + " ## " + id);
    }
    const classActive = (_b = (_a = win.READIUM2.publication.Metadata) === null || _a === void 0 ? void 0 : _a.MediaOverlay) === null || _b === void 0 ? void 0 : _b.ActiveClass;
    const classActivePlayback = (_d = (_c = win.READIUM2.publication.Metadata) === null || _c === void 0 ? void 0 : _c.MediaOverlay) === null || _d === void 0 ? void 0 : _d.PlaybackActiveClass;
    const payload = {
        captionsMode: _captionsMode,
        classActive: classActive ? classActive : undefined,
        classActivePlayback: classActivePlayback ? classActivePlayback : undefined,
        id,
    };
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (href && ((_e = activeWebView.READIUM2.link) === null || _e === void 0 ? void 0 : _e.Href) !== href) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, payload);
        }), 0);
    }
}
var MediaOverlaysStateEnum;
(function (MediaOverlaysStateEnum) {
    MediaOverlaysStateEnum["PAUSED"] = "PAUSED";
    MediaOverlaysStateEnum["PLAYING"] = "PLAYING";
    MediaOverlaysStateEnum["STOPPED"] = "STOPPED";
})(MediaOverlaysStateEnum = exports.MediaOverlaysStateEnum || (exports.MediaOverlaysStateEnum = {}));
let _mediaOverlaysListener;
function mediaOverlaysListen(mediaOverlaysListener) {
    _mediaOverlaysListener = mediaOverlaysListener;
}
exports.mediaOverlaysListen = mediaOverlaysListen;
function mediaOverlaysPlay(speed) {
    var _a;
    if (IS_DEV) {
        debug("mediaOverlaysPlay()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    _mediaOverlaysPlaybackRate = speed;
    if (!_mediaOverlayRoot || !_mediaOverlayTextAudioPair) {
        if (IS_DEV) {
            debug("mediaOverlaysPlay() - playMediaOverlaysForLink()");
        }
        let textFragmentIDChain;
        const href = (_a = _lastClickedNotification === null || _lastClickedNotification === void 0 ? void 0 : _lastClickedNotification.link) === null || _a === void 0 ? void 0 : _a.Href;
        let activeWebView = win.READIUM2.getActiveWebViews().find((webview) => {
            var _a;
            return href && ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href;
        });
        if (activeWebView) {
            textFragmentIDChain = _lastClickedNotification === null || _lastClickedNotification === void 0 ? void 0 : _lastClickedNotification.textFragmentIDChain;
        }
        else {
            activeWebView = win.READIUM2.getFirstWebView();
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (activeWebView && activeWebView.READIUM2.link) {
                yield playMediaOverlaysForLink(activeWebView.READIUM2.link, textFragmentIDChain);
            }
        }), 0);
    }
    else {
        if (IS_DEV) {
            debug("mediaOverlaysPlay() - mediaOverlaysResume()");
        }
        mediaOverlaysResume();
    }
}
exports.mediaOverlaysPlay = mediaOverlaysPlay;
function mediaOverlaysPause() {
    if (IS_DEV) {
        debug("mediaOverlaysPause()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    moHighlight(undefined, undefined);
    ensureOnTimeUpdate(true);
    if (_currentAudioElement) {
        _currentAudioElement.pause();
    }
    if (_mediaOverlaysListener) {
        _mediaOverlaysListener(MediaOverlaysStateEnum.PAUSED);
    }
}
exports.mediaOverlaysPause = mediaOverlaysPause;
function mediaOverlaysInterrupt() {
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    if (!publicationHasMediaOverlays(win.READIUM2.publication)) {
        return;
    }
    if (IS_DEV) {
        debug("mediaOverlaysInterrupt()");
    }
    mediaOverlaysStop(_mediaOverlayActive);
}
exports.mediaOverlaysInterrupt = mediaOverlaysInterrupt;
function mediaOverlaysStop(stayActive) {
    if (IS_DEV) {
        debug("mediaOverlaysStop()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    _mediaOverlayActive = stayActive ? true : false;
    mediaOverlaysPause();
    _mediaOverlayRoot = undefined;
    _mediaOverlayTextAudioPair = undefined;
    _mediaOverlayTextId = undefined;
    if (!_mediaOverlayActive) {
        if (_mediaOverlaysListener) {
            _mediaOverlaysListener(MediaOverlaysStateEnum.STOPPED);
        }
    }
}
exports.mediaOverlaysStop = mediaOverlaysStop;
function mediaOverlaysResume() {
    if (IS_DEV) {
        debug("mediaOverlaysResume()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        if (IS_DEV) {
            debug("mediaOverlaysResume() - _currentAudioElement.play()");
        }
        ensureOnTimeUpdate(false);
        if (_currentAudioElement) {
            setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (_currentAudioElement) {
                    _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                    yield _currentAudioElement.play();
                }
            }), 0);
        }
        if (_mediaOverlaysListener) {
            _mediaOverlaysListener(MediaOverlaysStateEnum.PLAYING);
        }
        moHighlight_(_mediaOverlayTextAudioPair);
    }
    else {
        if (IS_DEV) {
            debug("mediaOverlaysResume() - mediaOverlaysPlay()");
        }
        mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    }
}
exports.mediaOverlaysResume = mediaOverlaysResume;
function mediaOverlaysPrevious() {
    if (IS_DEV) {
        debug("mediaOverlaysPrevious()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    ensureOnTimeUpdate(true);
    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        const previousTextAudioPair = findPreviousTextAudioPair(_mediaOverlayRoot, _mediaOverlayTextAudioPair, { prev: undefined });
        if (!previousTextAudioPair) {
            if (IS_DEV) {
                debug("mediaOverlaysPrevious() - navLeftOrRight()");
            }
            mediaOverlaysStop(true);
            const rtl = readium_css_1.isRTL();
            location_1.navLeftOrRight(!rtl, true, true);
        }
        else {
            let switchDoc = false;
            if (_mediaOverlayTextAudioPair.Text && previousTextAudioPair.Text) {
                const hrefUrlObj1 = new URL("https://dummy.com/" + _mediaOverlayTextAudioPair.Text);
                const hrefUrlObj2 = new URL("https://dummy.com/" + previousTextAudioPair.Text);
                if (hrefUrlObj1.pathname !== hrefUrlObj2.pathname) {
                    if (IS_DEV) {
                        debug("mediaOverlaysPrevious SWITCH! " + hrefUrlObj1.pathname + " != " + hrefUrlObj2.pathname);
                    }
                    switchDoc = true;
                }
            }
            if (switchDoc) {
                mediaOverlaysStop(true);
                const publicationURL = win.READIUM2.publicationURL;
                const urlObjFull = new URL(previousTextAudioPair.Text, publicationURL);
                const urlFull = urlObjFull.toString();
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - handleLinkUrl()");
                }
                const activeWebView = win.READIUM2.getFirstOrSecondWebView();
                location_1.handleLinkUrl(urlFull, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            }
            else {
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - playMediaOverlaysAudio()");
                }
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield playMediaOverlaysAudio(previousTextAudioPair, undefined, undefined);
                }), 0);
            }
        }
    }
    else {
        if (IS_DEV) {
            debug("mediaOverlaysPrevious() - navLeftOrRight() 2");
        }
        mediaOverlaysStop(true);
        const rtl = readium_css_1.isRTL();
        location_1.navLeftOrRight(!rtl, true, true);
    }
}
exports.mediaOverlaysPrevious = mediaOverlaysPrevious;
function mediaOverlaysNext(escape) {
    if (IS_DEV) {
        debug("mediaOverlaysNext()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    ensureOnTimeUpdate(true);
    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        const nextTextAudioPair = findNextTextAudioPair(_mediaOverlayRoot, _mediaOverlayTextAudioPair, { prev: undefined }, escape ? true : false);
        if (!nextTextAudioPair) {
            if (IS_DEV) {
                debug("mediaOverlaysNext() - navLeftOrRight()");
            }
            mediaOverlaysStop(true);
            const rtl = readium_css_1.isRTL();
            location_1.navLeftOrRight(rtl, true, true);
        }
        else {
            let switchDoc = false;
            if (_mediaOverlayTextAudioPair.Text && nextTextAudioPair.Text) {
                const hrefUrlObj1 = new URL("https://dummy.com/" + _mediaOverlayTextAudioPair.Text);
                const hrefUrlObj2 = new URL("https://dummy.com/" + nextTextAudioPair.Text);
                if (hrefUrlObj1.pathname !== hrefUrlObj2.pathname) {
                    if (IS_DEV) {
                        debug("mediaOverlaysNext() SWITCH! " + hrefUrlObj1.pathname + " != " + hrefUrlObj2.pathname);
                    }
                    switchDoc = true;
                }
            }
            if (switchDoc) {
                mediaOverlaysStop(true);
                const publicationURL = win.READIUM2.publicationURL;
                const urlObjFull = new URL(nextTextAudioPair.Text, publicationURL);
                const urlFull = urlObjFull.toString();
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - handleLinkUrl()");
                }
                const activeWebView = win.READIUM2.getFirstOrSecondWebView();
                location_1.handleLinkUrl(urlFull, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            }
            else {
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - playMediaOverlaysAudio()");
                }
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield playMediaOverlaysAudio(nextTextAudioPair, undefined, undefined);
                }), 0);
            }
        }
    }
    else {
        if (IS_DEV) {
            debug("mediaOverlaysNext() - navLeftOrRight() 2");
        }
        mediaOverlaysStop(true);
        const rtl = readium_css_1.isRTL();
        location_1.navLeftOrRight(rtl, true, true);
    }
}
exports.mediaOverlaysNext = mediaOverlaysNext;
function mediaOverlaysEscape() {
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    mediaOverlaysNext(true);
}
exports.mediaOverlaysEscape = mediaOverlaysEscape;
function mediaOverlaysEnableCaptionsMode(captionsMode) {
    _captionsMode = captionsMode;
    if (IS_DEV) {
        debug("mediaOverlaysEnableCaptionsMode() - mediaOverlaysPause() + mediaOverlaysPlay()");
    }
    mediaOverlaysPause();
    setTimeout(() => {
        mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    }, 300);
}
exports.mediaOverlaysEnableCaptionsMode = mediaOverlaysEnableCaptionsMode;
function mediaOverlaysClickEnable(doEnable) {
    _mediaOverlaysClickEnabled = doEnable;
}
exports.mediaOverlaysClickEnable = mediaOverlaysClickEnable;
function mediaOverlaysPlaybackRate(speed) {
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    _mediaOverlaysPlaybackRate = speed;
    if (_currentAudioElement) {
        _currentAudioElement.playbackRate = speed;
    }
}
exports.mediaOverlaysPlaybackRate = mediaOverlaysPlaybackRate;
let _mediaOverlaySkippabilityIsEnabled = true;
function mediaOverlaysEnableSkippability(doEnable) {
    _mediaOverlaySkippabilityIsEnabled = doEnable;
}
exports.mediaOverlaysEnableSkippability = mediaOverlaysEnableSkippability;
//# sourceMappingURL=media-overlays.js.map