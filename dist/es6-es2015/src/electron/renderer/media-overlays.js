"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaOverlaysEnableSkippability = exports.mediaOverlaysPlaybackRate = exports.mediaOverlaysClickEnable = exports.mediaOverlaysEnableCaptionsMode = exports.mediaOverlaysEscape = exports.mediaOverlaysNext = exports.mediaOverlaysPrevious = exports.mediaOverlaysResume = exports.mediaOverlaysStop = exports.mediaOverlaysInterrupt = exports.mediaOverlaysPause = exports.mediaOverlaysPlay = exports.mediaOverlaysListen = exports.mediaOverlaysHandleIpcMessage = exports.publicationHasMediaOverlays = exports.MediaOverlaysStateEnum = void 0;
const tslib_1 = require("tslib");
const debug_ = require("debug");
const util = require("util");
const location_1 = require("./location");
const serializable_1 = require("r2-lcp-js/dist/es6-es2015/src/serializable");
const media_overlay_1 = require("r2-shared-js/dist/es6-es2015/src/models/media-overlay");
const audiobook_1 = require("../common/audiobook");
const events_1 = require("../common/events");
Object.defineProperty(exports, "MediaOverlaysStateEnum", { enumerable: true, get: function () { return events_1.MediaOverlaysStateEnum; } });
const location_2 = require("./location");
const debug = debug_("r2:navigator#electron/renderer/media-overlays");
const IS_DEV = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
const win = global.window;
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
function playMediaOverlays(textHref, rootMo, textFragmentIDChain, isInteract) {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (IS_DEV) {
            debug("playMediaOverlays() : " + textHref + " //// " + decodeURIComponent(textHref));
            debug(JSON.stringify(textFragmentIDChain, null, 4));
        }
        const loc = (0, location_1.getCurrentReadingLocation)();
        const locationHashOverrideInfo = _lastClickedNotification === null || _lastClickedNotification === void 0 ? void 0 : _lastClickedNotification.locationHashOverrideInfo;
        if (!textFragmentIDChain) {
            if (loc) {
                if (IS_DEV) {
                    debug("playMediaOverlays() CURRENT LOCATOR " + textHref + " -- " + ((_a = loc.locator) === null || _a === void 0 ? void 0 : _a.href));
                    debug(JSON.stringify(loc, null, 4));
                }
                const hrefUrlObj = new URL("https://dummy.com/" + ((_b = loc.locator) === null || _b === void 0 ? void 0 : _b.href));
                if (textHref === hrefUrlObj.pathname.substr(1)) {
                    if ((_c = loc.locator.locations) === null || _c === void 0 ? void 0 : _c.cssSelector) {
                        debug("playMediaOverlays() CSS SELECTOR: " + loc.locator.locations.cssSelector);
                        const hashI = loc.locator.locations.cssSelector.lastIndexOf("#");
                        if (hashI >= 0) {
                            const after = loc.locator.locations.cssSelector.substring(hashI + 1);
                            if (after) {
                                const spaceI = after.indexOf(" ");
                                let hashID = after;
                                if (spaceI > 0) {
                                    hashID = after.substring(0, spaceI);
                                }
                                debug("playMediaOverlays() CSS SELECTOR ID: " + hashID);
                            }
                        }
                    }
                    if ((_d = loc.locator.locations) === null || _d === void 0 ? void 0 : _d.cfi) {
                        debug("playMediaOverlays() CFI: " + loc.locator.locations.cfi);
                        let arrayIDs = [];
                        const regexpr = /\[([^\]]+)\]/g;
                        const matches = loc.locator.locations.cfi.matchAll(regexpr);
                        if (matches) {
                            arrayIDs = Array.from(matches, (m) => m[1]);
                        }
                        debug("playMediaOverlays() CFI IDs: " + JSON.stringify(arrayIDs, null, 4));
                        textFragmentIDChain = arrayIDs;
                    }
                }
            }
        }
        let textFragmentIDChain_ = textFragmentIDChain ? textFragmentIDChain.filter((id) => id) : undefined;
        if (textFragmentIDChain_ && textFragmentIDChain_.length === 0) {
            textFragmentIDChain_ = null;
        }
        let moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_, false);
        if (!moTextAudioPair && (textFragmentIDChain_ || textFragmentIDChain_ === null && !isInteract)) {
            const followingElementIDs = (loc === null || loc === void 0 ? void 0 : loc.followingElementIDs) || (locationHashOverrideInfo === null || locationHashOverrideInfo === void 0 ? void 0 : locationHashOverrideInfo.followingElementIDs);
            if (followingElementIDs) {
                if (IS_DEV) {
                    debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE TRY ... ");
                    debug(JSON.stringify(textFragmentIDChain_, null, 4));
                    debug(JSON.stringify(followingElementIDs, null, 4));
                }
                for (const id of followingElementIDs) {
                    moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, [id], false);
                    if (moTextAudioPair) {
                        debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE FOUND: " + id);
                        break;
                    }
                }
            }
            if (!moTextAudioPair) {
                debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE FALLBACK...");
                moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_, true);
            }
        }
        if (moTextAudioPair) {
            if (moTextAudioPair.Audio || moTextAudioPair.Video) {
                if (IS_DEV) {
                    debug("playMediaOverlays() - playMediaOverlaysAudio()");
                }
                _mediaOverlayRoot = rootMo;
                yield playMediaOverlaysAudio(moTextAudioPair, undefined, undefined);
                mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
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
    if (_currentAudioElement && _currentAudioElement.__draggable && _currentAudioElement.__hidden) {
        _currentAudioElement.__hidden = false;
        _currentAudioElement.style.display = "block";
    }
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
function ensureVideoFrameDraggable() {
    if (!_currentAudioElement || _currentAudioElement.__draggable) {
        return;
    }
    _currentAudioElement.__draggable = true;
    let moveDiv;
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;
    let mouseDownX = 0;
    let mouseDownY = 0;
    if (document.pictureInPictureEnabled) {
        _currentAudioElement.addEventListener("enterpictureinpicture", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!_currentAudioElement) {
                return;
            }
            _currentAudioElement.style.opacity = "0.2";
            _currentAudioElement.style.width = "1px";
            _currentAudioElement.style.height = "1px";
            _currentAudioElement.__previousStyleTop = _currentAudioElement.style.top;
            _currentAudioElement.__previousStyleLeft = _currentAudioElement.style.left;
            _currentAudioElement.style.top = "0px";
            _currentAudioElement.style.left = "0px";
        }));
        _currentAudioElement.addEventListener("leavepictureinpicture", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!_currentAudioElement) {
                return;
            }
            _currentAudioElement.style.opacity = "1";
            _currentAudioElement.style.width = "auto";
            _currentAudioElement.style.height = "auto";
            if (_currentAudioElement.__previousStyleTop) {
                _currentAudioElement.style.top = _currentAudioElement.__previousStyleTop;
            }
            if (_currentAudioElement.__previousStyleLeft) {
                _currentAudioElement.style.left = _currentAudioElement.__previousStyleLeft;
            }
        }));
    }
    _currentAudioElement.addEventListener("mousedown", elMouseDown);
    _currentAudioElement.addEventListener("mouseup", elMouseUp);
    function elMouseUp(e) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const _mouseDownX = mouseDownX;
            const _mouseDownY = mouseDownY;
            mouseDownX = 0;
            mouseDownY = 0;
            if (!_currentAudioElement) {
                docMouseUp();
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            if (!_currentAudioElement || !document.pictureInPictureEnabled) {
                return;
            }
            if (Math.abs(_mouseDownX - e.clientX) <= 4 && Math.abs(_mouseDownY - e.clientY) <= 4) {
                try {
                    if (_currentAudioElement !== document.pictureInPictureElement) {
                        yield _currentAudioElement.requestPictureInPicture();
                    }
                    else {
                        yield document.exitPictureInPicture();
                    }
                }
                catch (err) {
                    console.log("VIDEO PiP Error:", err);
                }
            }
        });
    }
    ;
    function elMouseDown(e) {
        if (!_currentAudioElement) {
            docMouseUp();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        mouseDownX = e.clientX;
        mouseDownY = e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        if (moveDiv === null || moveDiv === void 0 ? void 0 : moveDiv.parentNode) {
            moveDiv.parentNode.removeChild(moveDiv);
            moveDiv = undefined;
        }
        moveDiv = document.createElement("div");
        moveDiv.setAttribute("style", "display: block; position: absolute; padding: 0; margin: 0; left: 0; top: 0; right: 0; bottom: 0; z-index: 9998; cursor: move; opacity: 0.4; background-color: black;");
        document.body.insertBefore(moveDiv, _currentAudioElement);
        document.body.addEventListener("mouseup", docMouseUp, true);
        document.body.addEventListener("mousemove", docMouseMove, true);
    }
    function docMouseMove(e) {
        if (!_currentAudioElement) {
            docMouseUp();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        _currentAudioElement.style.top = (_currentAudioElement.offsetTop - pos2) + "px";
        _currentAudioElement.style.left = (_currentAudioElement.offsetLeft - pos1) + "px";
    }
    function docMouseUp(e = undefined) {
        if (e) {
            e.preventDefault();
        }
        if (moveDiv === null || moveDiv === void 0 ? void 0 : moveDiv.parentNode) {
            moveDiv.parentNode.removeChild(moveDiv);
            moveDiv = undefined;
        }
        document.body.removeEventListener("mouseup", docMouseUp, true);
        document.body.removeEventListener("mousemove", docMouseMove, true);
    }
}
function playMediaOverlaysAudio(moTextAudioPair, begin, end) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (IS_DEV) {
            debug("playMediaOverlaysAudio()");
        }
        ensureKillAutoNextTimeout();
        _mediaOverlayActive = true;
        _mediaOverlayTextAudioPair = moTextAudioPair;
        _mediaOverlayTextId = undefined;
        if (!moTextAudioPair.Audio && !moTextAudioPair.Video) {
            if (IS_DEV) {
                debug("playMediaOverlaysAudio - !moTextAudioPair.Audio => mediaOverlaysNext()");
            }
            mediaOverlaysNext();
            return;
        }
        moHighlight_(moTextAudioPair);
        const publicationURL = win.READIUM2.publicationURL;
        const urlObjFull = new URL(moTextAudioPair.Audio || moTextAudioPair.Video, publicationURL);
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
            _currentAudioElement = document.createElement(moTextAudioPair.Video ? "video" : "audio");
            if (moTextAudioPair.Video) {
                _currentAudioElement.setAttribute("style", "display: block; position: absolute; padding: 0; margin: 0; left: 10px; top: 10px; width: auto; height: auto; z-index: 9999; cursor: move; border: 2px solid black;");
                _currentAudioElement.setAttribute("disableremoteplayback", "true");
                _currentAudioElement.setAttribute("controlsList", "nofullscreen nodownload noremoteplayback noplaybackrate");
                ensureVideoFrameDraggable();
            }
            else {
                _currentAudioElement.setAttribute("style", "display: none");
            }
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
                if (_mediaOverlaysState !== events_1.MediaOverlaysStateEnum.PAUSED && _mediaOverlaysState !== events_1.MediaOverlaysStateEnum.STOPPED) {
                    mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PAUSED);
                }
            });
            _currentAudioElement.addEventListener("pause", onpause);
            const onplay = (_ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                debug("onplay");
                if (_mediaOverlaysState !== events_1.MediaOverlaysStateEnum.PLAYING) {
                    mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
                }
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
function findDepthFirstTextAudioPair(textHref, mo, textFragmentIDChain, allowFallbackSeek) {
    var _a;
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
    const isLeaf = (_a = mo.Children) === null || _a === void 0 ? void 0 : _a.length;
    if (!isLeaf) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findDepthFirstTextAudioPair() - leaf text/audio pair");
        }
        if (!isTextUrlMatch) {
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - leaf - !isTextUrlMatch");
            }
            return undefined;
        }
        if (isFragmentIDMatch ||
            (isTextUrlMatch && textFragmentIDChain === undefined)) {
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
    const textFragmentIDChainOriginal = textFragmentIDChain;
    let frags = textFragmentIDChain;
    for (const child of mo.Children) {
        if (audiobook_1.DEBUG_AUDIO) {
            debug("findDepthFirstTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findDepthFirstTextAudioPair(textHref, child, frags, allowFallbackSeek);
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
    if (allowFallbackSeek && isFragmentIDMatch) {
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
            const match = findDepthFirstTextAudioPair(textHref, mo, undefined, false);
            if (match) {
                if (audiobook_1.DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch - match");
                    debug(JSON.stringify(match));
                }
                return match;
            }
            else {
                return match;
            }
        }
    }
    if (textFragmentIDChainOriginal && !frags) {
        return null;
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
function playMediaOverlaysForLink(link, textFragmentIDChain, isInteract) {
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
            _timeoutAutoNext = win.setTimeout(() => {
                _timeoutAutoNext = undefined;
                mediaOverlaysStop(true);
                (0, location_2.navPreviousOrNext)(false, true, true);
            }, 600);
            mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
            return;
        }
        if (!link.MediaOverlays || !link.MediaOverlays.initialized) {
            const publicationURL = win.READIUM2.publicationURL;
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
            link.MediaOverlays = (0, serializable_1.TaJsonDeserialize)(moJson, media_overlay_1.MediaOverlayNode);
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
        yield playMediaOverlays(hrefUrlObj.pathname.substr(1), link.MediaOverlays, textFragmentIDChain, isInteract);
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
            const wasPlaying = _mediaOverlaysState === events_1.MediaOverlaysStateEnum.PLAYING;
            const lastClickedNotification = _lastClickedNotification;
            mediaOverlaysInterrupt();
            _lastClickedNotification = {
                link: activeWebView.READIUM2.link,
                textFragmentIDChain: payload.textFragmentIDChain,
                locationHashOverrideInfo: payload.locationHashOverrideInfo,
            };
            if ((payload.userInteract && _mediaOverlaysClickEnabled) ||
                _mediaOverlayActive) {
                if (IS_DEV) {
                    debug("playMediaOverlaysForLink");
                }
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (activeWebView.READIUM2.link) {
                        yield playMediaOverlaysForLink(activeWebView.READIUM2.link, payload.textFragmentIDChain, payload.userInteract);
                        if (_mediaOverlaysState !== events_1.MediaOverlaysStateEnum.PLAYING) {
                            _lastClickedNotification = lastClickedNotification;
                            if (wasPlaying) {
                                mediaOverlaysResume();
                            }
                        }
                    }
                }), 0);
            }
            else {
                _lastClickedNotification = lastClickedNotification;
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
        if (href) {
            if (id) {
                _lastClickedNotification = {
                    link: activeWebView.READIUM2.link,
                    textFragmentIDChain: [id],
                    locationHashOverrideInfo: undefined,
                };
            }
            else {
                _lastClickedNotification = undefined;
            }
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _f;
            if ((_f = activeWebView.READIUM2) === null || _f === void 0 ? void 0 : _f.DOMisReady) {
                yield activeWebView.send(events_1.R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, payload);
            }
        }), 0);
    }
}
let _mediaOverlaysState = events_1.MediaOverlaysStateEnum.STOPPED;
const mediaOverlaysStateSet = (mediaOverlaysState) => {
    _mediaOverlaysState = mediaOverlaysState;
    debug("mediaOverlaysStateSet", mediaOverlaysState);
    const payload = {
        state: mediaOverlaysState,
    };
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                yield activeWebView.send(events_1.R2_EVENT_MEDIA_OVERLAY_STATE, payload);
            }
        }), 0);
    }
    if (_mediaOverlaysListener) {
        _mediaOverlaysListener(mediaOverlaysState);
    }
};
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
                yield playMediaOverlaysForLink(activeWebView.READIUM2.link, textFragmentIDChain, false);
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
    mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PAUSED);
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
        debug("mediaOverlaysStop() stayActive: " + stayActive);
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
        _lastClickedNotification = undefined;
        mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.STOPPED);
        if (_currentAudioElement && _currentAudioElement.__draggable) {
            _currentAudioElement.__hidden = true;
            _currentAudioElement.style.display = "none";
            if (document.pictureInPictureEnabled) {
                if (_currentAudioElement === document.pictureInPictureElement) {
                    setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        try {
                            yield document.exitPictureInPicture();
                        }
                        catch (err) {
                            console.log("VIDEO PiP Error:", err);
                        }
                    }), 100);
                }
            }
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
        mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
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
            (0, location_2.navPreviousOrNext)(true, true, true);
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
                (0, location_2.handleLinkUrl)(urlFull, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            }
            else {
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - playMediaOverlaysAudio()");
                }
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield playMediaOverlaysAudio(previousTextAudioPair, undefined, undefined);
                }), 0);
                mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
            }
        }
    }
    else {
        if (IS_DEV) {
            debug("mediaOverlaysPrevious() - navLeftOrRight() 2");
        }
        mediaOverlaysStop(true);
        (0, location_2.navPreviousOrNext)(true, true, true);
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
            (0, location_2.navPreviousOrNext)(false, true, true);
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
                (0, location_2.handleLinkUrl)(urlFull, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            }
            else {
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - playMediaOverlaysAudio()");
                }
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield playMediaOverlaysAudio(nextTextAudioPair, undefined, undefined);
                }), 0);
                mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
            }
        }
    }
    else {
        if (IS_DEV) {
            debug("mediaOverlaysNext() - navLeftOrRight() 2");
        }
        mediaOverlaysStop(true);
        (0, location_2.navPreviousOrNext)(false, true, true);
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