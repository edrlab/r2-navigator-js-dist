"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaOverlaysEnableSkippability = exports.mediaOverlaysPlaybackRate = exports.mediaOverlaysClickEnable = exports.mediaOverlaysEnableCaptionsMode = exports.mediaOverlaysEscape = exports.mediaOverlaysNext = exports.mediaOverlaysPrevious = exports.mediaOverlaysResume = exports.mediaOverlaysStop = exports.mediaOverlaysInterrupt = exports.mediaOverlaysPause = exports.mediaOverlaysPlay = exports.mediaOverlaysListen = exports.mediaOverlaysHandleIpcMessage = exports.publicationHasMediaOverlays = exports.MediaOverlaysStateEnum = void 0;
var tslib_1 = require("tslib");
var debug_ = require("debug");
var util = require("util");
var location_1 = require("./location");
var serializable_1 = require("r2-lcp-js/dist/es5/src/serializable");
var media_overlay_1 = require("r2-shared-js/dist/es5/src/models/media-overlay");
var audiobook_1 = require("../common/audiobook");
var events_1 = require("../common/events");
Object.defineProperty(exports, "MediaOverlaysStateEnum", { enumerable: true, get: function () { return events_1.MediaOverlaysStateEnum; } });
var location_2 = require("./location");
var debug = debug_("r2:navigator#electron/renderer/media-overlays");
var IS_DEV = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
var win = global.window;
var AUDIO_MO_ID = "R2_AUDIO_MO_ID";
function publicationHasMediaOverlays(publication) {
    if (publication.Spine) {
        var firstMoLink = publication.Spine.find(function (link) {
            var e_1, _a;
            var _b;
            if ((_b = link.Properties) === null || _b === void 0 ? void 0 : _b.MediaOverlay) {
                return true;
            }
            if (link.Alternate) {
                try {
                    for (var _c = tslib_1.__values(link.Alternate), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var altLink = _d.value;
                        if (altLink.TypeLink === "application/vnd.syncnarr+json") {
                            return true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
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
var _captionsMode = false;
var _mediaOverlaysClickEnabled = false;
var _mediaOverlaysPlaybackRate = 1;
var _currentAudioUrl;
var _previousAudioUrl;
var _currentAudioBegin;
var _currentAudioEnd;
var _previousAudioEnd;
var _currentAudioElement;
var _mediaOverlayRoot;
var _mediaOverlayTextAudioPair;
var _mediaOverlayTextId;
var _mediaOverlayTextHref;
var _mediaOverlayActive = false;
function playMediaOverlays(textHref, rootMo, textFragmentIDChain, isInteract) {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var loc, locationHashOverrideInfo, hrefUrlObj, hashI, after, spaceI, hashID, arrayIDs, regexpr, matches, textFragmentIDChain_, moTextAudioPair, followingElementIDs, followingElementIDs_1, followingElementIDs_1_1, id;
        var e_2, _e;
        return tslib_1.__generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (IS_DEV) {
                        debug("playMediaOverlays() : " + textHref + " //// " + decodeURIComponent(textHref));
                        debug(JSON.stringify(textFragmentIDChain, null, 4));
                    }
                    loc = (0, location_1.getCurrentReadingLocation)();
                    locationHashOverrideInfo = _lastClickedNotification === null || _lastClickedNotification === void 0 ? void 0 : _lastClickedNotification.locationHashOverrideInfo;
                    if (!textFragmentIDChain) {
                        if (loc) {
                            if (IS_DEV) {
                                debug("playMediaOverlays() CURRENT LOCATOR " + textHref + " -- " + ((_a = loc.locator) === null || _a === void 0 ? void 0 : _a.href));
                                debug(JSON.stringify(loc, null, 4));
                            }
                            hrefUrlObj = new URL("https://dummy.com/" + ((_b = loc.locator) === null || _b === void 0 ? void 0 : _b.href));
                            if (textHref === hrefUrlObj.pathname.substr(1)) {
                                if ((_c = loc.locator.locations) === null || _c === void 0 ? void 0 : _c.cssSelector) {
                                    debug("playMediaOverlays() CSS SELECTOR: " + loc.locator.locations.cssSelector);
                                    hashI = loc.locator.locations.cssSelector.lastIndexOf("#");
                                    if (hashI >= 0) {
                                        after = loc.locator.locations.cssSelector.substring(hashI + 1);
                                        if (after) {
                                            spaceI = after.indexOf(" ");
                                            hashID = after;
                                            if (spaceI > 0) {
                                                hashID = after.substring(0, spaceI);
                                            }
                                            debug("playMediaOverlays() CSS SELECTOR ID: " + hashID);
                                        }
                                    }
                                }
                                if ((_d = loc.locator.locations) === null || _d === void 0 ? void 0 : _d.cfi) {
                                    debug("playMediaOverlays() CFI: " + loc.locator.locations.cfi);
                                    arrayIDs = [];
                                    regexpr = /\[([^\]]+)\]/g;
                                    matches = loc.locator.locations.cfi.matchAll(regexpr);
                                    if (matches) {
                                        arrayIDs = Array.from(matches, function (m) { return m[1]; });
                                    }
                                    debug("playMediaOverlays() CFI IDs: " + JSON.stringify(arrayIDs, null, 4));
                                    textFragmentIDChain = arrayIDs;
                                }
                            }
                        }
                    }
                    textFragmentIDChain_ = textFragmentIDChain ? textFragmentIDChain.filter(function (id) { return id; }) : undefined;
                    if (textFragmentIDChain_ && textFragmentIDChain_.length === 0) {
                        textFragmentIDChain_ = null;
                    }
                    moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_, false);
                    if (!moTextAudioPair && (textFragmentIDChain_ || textFragmentIDChain_ === null && !isInteract)) {
                        followingElementIDs = (loc === null || loc === void 0 ? void 0 : loc.followingElementIDs) || (locationHashOverrideInfo === null || locationHashOverrideInfo === void 0 ? void 0 : locationHashOverrideInfo.followingElementIDs);
                        if (followingElementIDs) {
                            if (IS_DEV) {
                                debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE TRY ... ");
                                debug(JSON.stringify(textFragmentIDChain_, null, 4));
                                debug(JSON.stringify(followingElementIDs, null, 4));
                            }
                            try {
                                for (followingElementIDs_1 = tslib_1.__values(followingElementIDs), followingElementIDs_1_1 = followingElementIDs_1.next(); !followingElementIDs_1_1.done; followingElementIDs_1_1 = followingElementIDs_1.next()) {
                                    id = followingElementIDs_1_1.value;
                                    moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, [id], false);
                                    if (moTextAudioPair) {
                                        debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE FOUND: " + id);
                                        break;
                                    }
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (followingElementIDs_1_1 && !followingElementIDs_1_1.done && (_e = followingElementIDs_1.return)) _e.call(followingElementIDs_1);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                        if (!moTextAudioPair) {
                            debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE FALLBACK...");
                            moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_, true);
                        }
                    }
                    if (!moTextAudioPair) return [3, 3];
                    if (!(moTextAudioPair.Audio || moTextAudioPair.Video)) return [3, 2];
                    if (IS_DEV) {
                        debug("playMediaOverlays() - playMediaOverlaysAudio()");
                    }
                    _mediaOverlayRoot = rootMo;
                    return [4, playMediaOverlaysAudio(moTextAudioPair, undefined, undefined)];
                case 1:
                    _f.sent();
                    mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
                    _f.label = 2;
                case 2: return [3, 4];
                case 3:
                    if (IS_DEV) {
                        debug("playMediaOverlays() - !moTextAudioPair " + textHref);
                    }
                    _f.label = 4;
                case 4: return [2];
            }
        });
    });
}
var ontimeupdate = function (ev) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var currentAudioElement;
    return tslib_1.__generator(this, function (_a) {
        if (_currentAudioElement && _currentAudioElement.__draggable && _currentAudioElement.__hidden) {
            _currentAudioElement.__hidden = false;
            _currentAudioElement.style.display = "block";
        }
        currentAudioElement = ev.currentTarget;
        if (_currentAudioEnd && currentAudioElement.currentTime >= (_currentAudioEnd - 0.05)) {
            if (IS_DEV) {
                debug("ontimeupdate - mediaOverlaysNext()");
            }
            mediaOverlaysNext();
        }
        return [2];
    });
}); };
var ensureOnTimeUpdate = function (remove) {
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
    var _this = this;
    if (!_currentAudioElement || _currentAudioElement.__draggable) {
        return;
    }
    _currentAudioElement.__draggable = true;
    var moveDiv;
    var pos1 = 0;
    var pos2 = 0;
    var pos3 = 0;
    var pos4 = 0;
    var mouseDownX = 0;
    var mouseDownY = 0;
    if (document.pictureInPictureEnabled) {
        _currentAudioElement.addEventListener("enterpictureinpicture", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (!_currentAudioElement) {
                    return [2];
                }
                _currentAudioElement.style.opacity = "0.2";
                _currentAudioElement.style.width = "1px";
                _currentAudioElement.style.height = "1px";
                _currentAudioElement.__previousStyleTop = _currentAudioElement.style.top;
                _currentAudioElement.__previousStyleLeft = _currentAudioElement.style.left;
                _currentAudioElement.style.top = "0px";
                _currentAudioElement.style.left = "0px";
                return [2];
            });
        }); });
        _currentAudioElement.addEventListener("leavepictureinpicture", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (!_currentAudioElement) {
                    return [2];
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
                return [2];
            });
        }); });
    }
    _currentAudioElement.addEventListener("mousedown", elMouseDown);
    _currentAudioElement.addEventListener("mouseup", elMouseUp);
    function elMouseUp(e) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _mouseDownX, _mouseDownY, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mouseDownX = mouseDownX;
                        _mouseDownY = mouseDownY;
                        mouseDownX = 0;
                        mouseDownY = 0;
                        if (!_currentAudioElement) {
                            docMouseUp();
                            return [2];
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        if (!_currentAudioElement || !document.pictureInPictureEnabled) {
                            return [2];
                        }
                        if (!(Math.abs(_mouseDownX - e.clientX) <= 4 && Math.abs(_mouseDownY - e.clientY) <= 4)) return [3, 7];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!(_currentAudioElement !== document.pictureInPictureElement)) return [3, 3];
                        return [4, _currentAudioElement.requestPictureInPicture()];
                    case 2:
                        _a.sent();
                        return [3, 5];
                    case 3: return [4, document.exitPictureInPicture()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3, 7];
                    case 6:
                        err_1 = _a.sent();
                        console.log("VIDEO PiP Error:", err_1);
                        return [3, 7];
                    case 7: return [2];
                }
            });
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
    function docMouseUp(e) {
        if (e === void 0) { e = undefined; }
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
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var publicationURL, urlObjFull, urlFull, urlObjNoQuery, urlNoQuery, hasBegin, hasEnd, matches, b, e, playClip, oncanplaythrough_1, onpause_1, onplay_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
                        return [2];
                    }
                    moHighlight_(moTextAudioPair);
                    publicationURL = win.READIUM2.publicationURL;
                    urlObjFull = new URL(moTextAudioPair.Audio || moTextAudioPair.Video, publicationURL);
                    urlFull = urlObjFull.toString();
                    urlObjNoQuery = new URL(urlFull);
                    urlObjNoQuery.hash = "";
                    urlObjNoQuery.search = "";
                    urlNoQuery = urlObjNoQuery.toString();
                    hasBegin = typeof begin !== "undefined";
                    hasEnd = typeof end !== "undefined";
                    _previousAudioEnd = _currentAudioEnd;
                    _currentAudioBegin = undefined;
                    _currentAudioEnd = undefined;
                    if (!hasBegin && !hasEnd) {
                        if (urlObjFull.hash) {
                            matches = urlObjFull.hash.match(/t=([0-9\.]+)(,([0-9\.]+))?/);
                            if (matches && matches.length >= 1) {
                                b = matches[1];
                                try {
                                    _currentAudioBegin = parseFloat(b);
                                }
                                catch (err) {
                                    debug(err);
                                }
                                if (matches.length >= 3) {
                                    e = matches[3];
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
                        debug("".concat(urlFull, " => [").concat(_currentAudioBegin, "-").concat(_currentAudioEnd, "]"));
                    }
                    playClip = function (initial) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var timeToSeekTo, ontimeupdateSeeked_1, contiguous;
                        var _this = this;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!_currentAudioElement) {
                                        return [2];
                                    }
                                    timeToSeekTo = _currentAudioBegin ? _currentAudioBegin : 0;
                                    if (!(initial || _currentAudioElement.paused)) return [3, 4];
                                    if (!((initial && !timeToSeekTo) ||
                                        _currentAudioElement.currentTime === timeToSeekTo)) return [3, 2];
                                    if (IS_DEV) {
                                        debug("playMediaOverlaysAudio() - playClip() - _currentAudioElement.play()");
                                    }
                                    ensureOnTimeUpdate(false);
                                    _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                                    return [4, _currentAudioElement.play()];
                                case 1:
                                    _a.sent();
                                    return [3, 3];
                                case 2:
                                    if (IS_DEV) {
                                        debug("playMediaOverlaysAudio() - playClip() - ontimeupdateSeeked");
                                    }
                                    ontimeupdateSeeked_1 = function (ev) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var currentAudioElement;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    currentAudioElement = ev.currentTarget;
                                                    currentAudioElement.removeEventListener("timeupdate", ontimeupdateSeeked_1);
                                                    if (IS_DEV) {
                                                        debug("playMediaOverlaysAudio() - playClip() - ontimeupdateSeeked - .play()");
                                                    }
                                                    ensureOnTimeUpdate(false);
                                                    if (!_currentAudioElement) return [3, 2];
                                                    _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                                                    return [4, _currentAudioElement.play()];
                                                case 1:
                                                    _a.sent();
                                                    _a.label = 2;
                                                case 2: return [2];
                                            }
                                        });
                                    }); };
                                    _currentAudioElement.addEventListener("timeupdate", ontimeupdateSeeked_1);
                                    _currentAudioElement.currentTime = timeToSeekTo;
                                    _a.label = 3;
                                case 3: return [3, 5];
                                case 4:
                                    contiguous = _previousAudioUrl === _currentAudioUrl &&
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
                                    _a.label = 5;
                                case 5: return [2];
                            }
                        });
                    }); };
                    _previousAudioUrl = _currentAudioUrl;
                    if (!(!_currentAudioUrl || urlNoQuery !== _currentAudioUrl)) return [3, 1];
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
                    _currentAudioElement.addEventListener("error", function (ev) {
                        debug("-1) error: " +
                            (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                            + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        if (_currentAudioElement && _currentAudioElement.error) {
                            debug(_currentAudioElement.error.code);
                            debug(_currentAudioElement.error.message);
                        }
                    });
                    if (IS_DEV) {
                        _currentAudioElement.addEventListener("load", function (ev) {
                            debug("0) load: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("loadstart", function (ev) {
                            debug("1) loadstart: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("durationchange", function (ev) {
                            debug("2) durationchange: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("loadedmetadata", function (ev) {
                            debug("3) loadedmetadata: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("loadeddata", function (ev) {
                            debug("4) loadeddata: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("progress", function (ev) {
                            debug("5) progress: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("canplay", function (ev) {
                            debug("6) canplay: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("canplaythrough", function (ev) {
                            debug("7) canplaythrough: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("play", function (ev) {
                            debug("8) play: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("pause", function (ev) {
                            debug("9) pause: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("ended", function (ev) {
                            debug("10) ended: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("seeked", function (ev) {
                            debug("11) seeked: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        if (audiobook_1.DEBUG_AUDIO) {
                            _currentAudioElement.addEventListener("timeupdate", function (ev) {
                                debug("12) timeupdate: " +
                                    (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                    + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                            });
                        }
                        _currentAudioElement.addEventListener("seeking", function (ev) {
                            debug("13) seeking: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("waiting", function (ev) {
                            debug("14) waiting: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("volumechange", function (ev) {
                            debug("15) volumechange: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("suspend", function (ev) {
                            debug("16) suspend: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("stalled", function (ev) {
                            debug("17) stalled: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("ratechange", function (ev) {
                            debug("18) ratechange: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("playing", function (ev) {
                            debug("19) playing: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("interruptend", function (ev) {
                            debug("20) interruptend: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("interruptbegin", function (ev) {
                            debug("21) interruptbegin: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("emptied", function (ev) {
                            debug("22) emptied: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                        _currentAudioElement.addEventListener("abort", function (ev) {
                            debug("23) abort: " +
                                (_currentAudioUrl !== ev.currentTarget.src ? (_currentAudioUrl + " -- ") : "")
                                + ev.currentTarget.src.substr(ev.currentTarget.src.lastIndexOf("/")));
                        });
                    }
                    oncanplaythrough_1 = function (ev) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var currentAudioElement;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    currentAudioElement = ev.currentTarget;
                                    currentAudioElement.removeEventListener("canplaythrough", oncanplaythrough_1);
                                    debug("oncanplaythrough");
                                    return [4, playClip(true)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); };
                    _currentAudioElement.addEventListener("canplaythrough", oncanplaythrough_1);
                    onpause_1 = function (_ev) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            debug("onpause");
                            if (_mediaOverlaysState !== events_1.MediaOverlaysStateEnum.PAUSED && _mediaOverlaysState !== events_1.MediaOverlaysStateEnum.STOPPED) {
                                mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PAUSED);
                            }
                            return [2];
                        });
                    }); };
                    _currentAudioElement.addEventListener("pause", onpause_1);
                    onplay_1 = function (_ev) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            debug("onplay");
                            if (_mediaOverlaysState !== events_1.MediaOverlaysStateEnum.PLAYING) {
                                mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
                            }
                            return [2];
                        });
                    }); };
                    _currentAudioElement.addEventListener("play", onplay_1);
                    _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                    _currentAudioElement.setAttribute("src", _currentAudioUrl);
                    return [3, 3];
                case 1:
                    if (IS_DEV) {
                        debug("playMediaOverlaysAudio() - playClip()");
                    }
                    return [4, playClip(false)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2];
            }
        });
    });
}
var _skippables = [
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
    return mo.Role && mo.Role.findIndex(function (r) {
        return _skippables.includes(r);
    }) >= 0;
}
function findNextTextAudioPair(mo, moToMatch, previousMo, escape) {
    var e_3, _a;
    if (audiobook_1.DEBUG_AUDIO) {
        debug("findNextTextAudioPair()");
        debug(JSON.stringify(moToMatch));
        debug(JSON.stringify(previousMo.prev));
    }
    var isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
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
    try {
        for (var _b = tslib_1.__values(mo.Children), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - child");
                debug(JSON.stringify(child));
            }
            var match = findNextTextAudioPair(child, moToMatch, previousMo, escape);
            if (match) {
                if (audiobook_1.DEBUG_AUDIO) {
                    debug("findNextTextAudioPair() - match");
                    debug(JSON.stringify(match));
                }
                return match;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return undefined;
}
function findPreviousTextAudioPair(mo, moToMatch, previousMo) {
    var e_4, _a;
    if (audiobook_1.DEBUG_AUDIO) {
        debug("findPreviousTextAudioPair()");
        debug(JSON.stringify(moToMatch));
        debug(JSON.stringify(previousMo.prev));
    }
    var isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
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
    try {
        for (var _b = tslib_1.__values(mo.Children), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - child");
                debug(JSON.stringify(child));
            }
            var match = findPreviousTextAudioPair(child, moToMatch, previousMo);
            if (match) {
                if (audiobook_1.DEBUG_AUDIO) {
                    debug("findPreviousTextAudioPair() - match");
                    debug(JSON.stringify(match));
                }
                return match;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return undefined;
}
function findDepthFirstTextAudioPair(textHref, mo, textFragmentIDChain, allowFallbackSeek) {
    var e_5, _a, e_6, _b;
    var _c;
    if (audiobook_1.DEBUG_AUDIO) {
        debug("findDepthFirstTextAudioPair()");
    }
    var isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
    var isTextUrlMatch;
    var isFragmentIDMatch;
    if (mo.Text) {
        var hrefUrlObj = new URL("https://dummy.com/" + mo.Text);
        if (hrefUrlObj.pathname.substr(1) === textHref) {
            isTextUrlMatch = true;
            if (hrefUrlObj.hash && textFragmentIDChain) {
                isFragmentIDMatch = false;
                var id = hrefUrlObj.hash.substr(1);
                try {
                    for (var textFragmentIDChain_1 = tslib_1.__values(textFragmentIDChain), textFragmentIDChain_1_1 = textFragmentIDChain_1.next(); !textFragmentIDChain_1_1.done; textFragmentIDChain_1_1 = textFragmentIDChain_1.next()) {
                        var frag = textFragmentIDChain_1_1.value;
                        if (frag === id) {
                            isFragmentIDMatch = true;
                            break;
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (textFragmentIDChain_1_1 && !textFragmentIDChain_1_1.done && (_a = textFragmentIDChain_1.return)) _a.call(textFragmentIDChain_1);
                    }
                    finally { if (e_5) throw e_5.error; }
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
    var isLeaf = (_c = mo.Children) === null || _c === void 0 ? void 0 : _c.length;
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
    var textFragmentIDChainOriginal = textFragmentIDChain;
    var frags = textFragmentIDChain;
    try {
        for (var _d = tslib_1.__values(mo.Children), _e = _d.next(); !_e.done; _e = _d.next()) {
            var child = _e.value;
            if (audiobook_1.DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - child");
                debug(JSON.stringify(child));
            }
            var match = findDepthFirstTextAudioPair(textHref, child, frags, allowFallbackSeek);
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
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
        }
        finally { if (e_6) throw e_6.error; }
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
            var match = findDepthFirstTextAudioPair(textHref, mo, undefined, false);
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
var _timeoutAutoNext;
function ensureKillAutoNextTimeout() {
    if (_timeoutAutoNext) {
        clearTimeout(_timeoutAutoNext);
        _timeoutAutoNext = undefined;
    }
}
function playMediaOverlaysForLink(link, textFragmentIDChain, isInteract) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var moUrl, _b, _c, altLink, publicationURL, moUrlObjFull, moUrlFull, response, e_7, moJson, e_8, href, hrefUrlObj;
        var e_9, _d;
        return tslib_1.__generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (IS_DEV) {
                        debug("playMediaOverlaysForLink()");
                        debug(link.Href);
                        debug(link.HrefDecoded);
                        debug(JSON.stringify(textFragmentIDChain, null, 4));
                    }
                    if ((_a = link.Properties) === null || _a === void 0 ? void 0 : _a.MediaOverlay) {
                        moUrl = link.Properties.MediaOverlay;
                        if (IS_DEV) {
                            debug(link.Properties.MediaOverlay);
                            debug(link.Duration);
                        }
                    }
                    if (link.Alternate) {
                        try {
                            for (_b = tslib_1.__values(link.Alternate), _c = _b.next(); !_c.done; _c = _b.next()) {
                                altLink = _c.value;
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
                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
                            }
                            finally { if (e_9) throw e_9.error; }
                        }
                    }
                    ensureKillAutoNextTimeout();
                    if (!moUrl) {
                        if (IS_DEV) {
                            debug("playMediaOverlaysForLink() - navLeftOrRight()");
                        }
                        _timeoutAutoNext = win.setTimeout(function () {
                            _timeoutAutoNext = undefined;
                            mediaOverlaysStop(true);
                            (0, location_2.navPreviousOrNext)(false, true, true);
                        }, 600);
                        mediaOverlaysStateSet(events_1.MediaOverlaysStateEnum.PLAYING);
                        return [2];
                    }
                    if (!(!link.MediaOverlays || !link.MediaOverlays.initialized)) return [3, 9];
                    publicationURL = win.READIUM2.publicationURL;
                    moUrlObjFull = new URL(moUrl, publicationURL);
                    moUrlFull = moUrlObjFull.toString();
                    response = void 0;
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4, fetch(moUrlFull)];
                case 2:
                    response = _e.sent();
                    return [3, 4];
                case 3:
                    e_7 = _e.sent();
                    debug(e_7);
                    debug(moUrlFull);
                    return [2];
                case 4:
                    if (!response.ok) {
                        debug("BAD RESPONSE?!");
                    }
                    moJson = void 0;
                    _e.label = 5;
                case 5:
                    _e.trys.push([5, 7, , 8]);
                    return [4, response.json()];
                case 6:
                    moJson = _e.sent();
                    return [3, 8];
                case 7:
                    e_8 = _e.sent();
                    debug(e_8);
                    return [3, 8];
                case 8:
                    if (!moJson) {
                        return [2];
                    }
                    link.MediaOverlays = (0, serializable_1.TaJsonDeserialize)(moJson, media_overlay_1.MediaOverlayNode);
                    link.MediaOverlays.initialized = true;
                    if (IS_DEV) {
                        debug(util.inspect(link.MediaOverlays, { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                    }
                    _e.label = 9;
                case 9:
                    if (!link.MediaOverlays || !link.MediaOverlays.initialized) {
                        debug("Has MO but no Media Overlays?! " + link.Href);
                        if (IS_DEV) {
                            debug(JSON.stringify(win.READIUM2.publication, null, 4));
                            debug(util.inspect(win.READIUM2.publication, { showHidden: false, depth: 1000, colors: true, customInspect: true }));
                        }
                        return [2];
                    }
                    if (IS_DEV) {
                        debug("playMediaOverlaysForLink() - playMediaOverlays()");
                    }
                    href = link.HrefDecoded || link.Href;
                    hrefUrlObj = new URL("https://dummy.com/" + href);
                    return [4, playMediaOverlays(hrefUrlObj.pathname.substr(1), link.MediaOverlays, textFragmentIDChain, isInteract)];
                case 10:
                    _e.sent();
                    return [2];
            }
        });
    });
}
var _lastClickedNotification;
function mediaOverlaysHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    var _this = this;
    var activeWebView = eventCurrentTarget;
    if (eventChannel === events_1.R2_EVENT_MEDIA_OVERLAY_CLICK) {
        if (publicationHasMediaOverlays(win.READIUM2.publication)) {
            if (IS_DEV) {
                debug("R2_EVENT_MEDIA_OVERLAY_CLICK");
            }
            var payload_1 = eventArgs[0];
            var wasPlaying_1 = _mediaOverlaysState === events_1.MediaOverlaysStateEnum.PLAYING;
            var lastClickedNotification_1 = _lastClickedNotification;
            mediaOverlaysInterrupt();
            _lastClickedNotification = {
                link: activeWebView.READIUM2.link,
                textFragmentIDChain: payload_1.textFragmentIDChain,
                locationHashOverrideInfo: payload_1.locationHashOverrideInfo,
            };
            if ((payload_1.userInteract && _mediaOverlaysClickEnabled) ||
                _mediaOverlayActive) {
                if (IS_DEV) {
                    debug("playMediaOverlaysForLink");
                }
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!activeWebView.READIUM2.link) return [3, 2];
                                return [4, playMediaOverlaysForLink(activeWebView.READIUM2.link, payload_1.textFragmentIDChain, payload_1.userInteract)];
                            case 1:
                                _a.sent();
                                if (_mediaOverlaysState !== events_1.MediaOverlaysStateEnum.PLAYING) {
                                    _lastClickedNotification = lastClickedNotification_1;
                                    if (wasPlaying_1) {
                                        mediaOverlaysResume();
                                    }
                                }
                                _a.label = 2;
                            case 2: return [2];
                        }
                    });
                }); }, 0);
            }
            else {
                _lastClickedNotification = lastClickedNotification_1;
            }
        }
    }
    else if (eventChannel === events_1.R2_EVENT_MEDIA_OVERLAY_STARTSTOP) {
        var payload = eventArgs[0];
        if (IS_DEV) {
            debug("R2_EVENT_MEDIA_OVERLAY_STARTSTOP");
        }
        mediaOverlaysStop();
        if (payload.start) {
            var rate = _mediaOverlaysPlaybackRate;
            mediaOverlaysPlay(1);
            _mediaOverlaysPlaybackRate = rate;
        }
        else if (payload.stop) {
        }
        else {
            if (_currentAudioElement && !_currentAudioElement.paused) {
            }
            else {
                var rate = _mediaOverlaysPlaybackRate;
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
        var i = moTextAudioPair.Text.lastIndexOf("#");
        if (i >= 0) {
            var id = moTextAudioPair.Text.substr(i + 1);
            if (id) {
                _mediaOverlayTextId = id;
                _mediaOverlayTextHref = moTextAudioPair.Text.substr(0, i);
                moHighlight(_mediaOverlayTextHref, _mediaOverlayTextId);
            }
        }
    }
}
function moHighlight(href, id) {
    var e_10, _a;
    var _this = this;
    var _b, _c, _d, _e, _f;
    if (IS_DEV) {
        debug("moHighlight: " + href + " ## " + id);
    }
    var classActive = (_c = (_b = win.READIUM2.publication.Metadata) === null || _b === void 0 ? void 0 : _b.MediaOverlay) === null || _c === void 0 ? void 0 : _c.ActiveClass;
    var classActivePlayback = (_e = (_d = win.READIUM2.publication.Metadata) === null || _d === void 0 ? void 0 : _d.MediaOverlay) === null || _e === void 0 ? void 0 : _e.PlaybackActiveClass;
    var payload = {
        captionsMode: _captionsMode,
        classActive: classActive ? classActive : undefined,
        classActivePlayback: classActivePlayback ? classActivePlayback : undefined,
        id: id,
    };
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_1 = function (activeWebView) {
        if (href && ((_f = activeWebView.READIUM2.link) === null || _f === void 0 ? void 0 : _f.Href) !== href) {
            return "continue";
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
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_1 = tslib_1.__values(activeWebViews), activeWebViews_1_1 = activeWebViews_1.next(); !activeWebViews_1_1.done; activeWebViews_1_1 = activeWebViews_1.next()) {
            var activeWebView = activeWebViews_1_1.value;
            _loop_1(activeWebView);
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (activeWebViews_1_1 && !activeWebViews_1_1.done && (_a = activeWebViews_1.return)) _a.call(activeWebViews_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
}
var _mediaOverlaysState = events_1.MediaOverlaysStateEnum.STOPPED;
var mediaOverlaysStateSet = function (mediaOverlaysState) {
    var e_11, _a;
    _mediaOverlaysState = mediaOverlaysState;
    debug("mediaOverlaysStateSet", mediaOverlaysState);
    var payload = {
        state: mediaOverlaysState,
    };
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_2 = function (activeWebView) {
        setTimeout(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_MEDIA_OVERLAY_STATE, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_2 = tslib_1.__values(activeWebViews), activeWebViews_2_1 = activeWebViews_2.next(); !activeWebViews_2_1.done; activeWebViews_2_1 = activeWebViews_2.next()) {
            var activeWebView = activeWebViews_2_1.value;
            _loop_2(activeWebView);
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (activeWebViews_2_1 && !activeWebViews_2_1.done && (_a = activeWebViews_2.return)) _a.call(activeWebViews_2);
        }
        finally { if (e_11) throw e_11.error; }
    }
    if (_mediaOverlaysListener) {
        _mediaOverlaysListener(mediaOverlaysState);
    }
};
var _mediaOverlaysListener;
function mediaOverlaysListen(mediaOverlaysListener) {
    _mediaOverlaysListener = mediaOverlaysListener;
}
exports.mediaOverlaysListen = mediaOverlaysListen;
function mediaOverlaysPlay(speed) {
    var _this = this;
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
        var textFragmentIDChain_2;
        var href_1 = (_a = _lastClickedNotification === null || _lastClickedNotification === void 0 ? void 0 : _lastClickedNotification.link) === null || _a === void 0 ? void 0 : _a.Href;
        var activeWebView_1 = win.READIUM2.getActiveWebViews().find(function (webview) {
            var _a;
            return href_1 && ((_a = webview.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) === href_1;
        });
        if (activeWebView_1) {
            textFragmentIDChain_2 = _lastClickedNotification === null || _lastClickedNotification === void 0 ? void 0 : _lastClickedNotification.textFragmentIDChain;
        }
        else {
            activeWebView_1 = win.READIUM2.getFirstWebView();
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(activeWebView_1 && activeWebView_1.READIUM2.link)) return [3, 2];
                        return [4, playMediaOverlaysForLink(activeWebView_1.READIUM2.link, textFragmentIDChain_2, false)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
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
    var _this = this;
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
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var err_2;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4, document.exitPictureInPicture()];
                                case 1:
                                    _a.sent();
                                    return [3, 3];
                                case 2:
                                    err_2 = _a.sent();
                                    console.log("VIDEO PiP Error:", err_2);
                                    return [3, 3];
                                case 3: return [2];
                            }
                        });
                    }); }, 100);
                }
            }
        }
    }
}
exports.mediaOverlaysStop = mediaOverlaysStop;
function mediaOverlaysResume() {
    var _this = this;
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
            setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!_currentAudioElement) return [3, 2];
                            _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                            return [4, _currentAudioElement.play()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2];
                    }
                });
            }); }, 0);
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
    var _this = this;
    if (IS_DEV) {
        debug("mediaOverlaysPrevious()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    ensureOnTimeUpdate(true);
    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        var previousTextAudioPair_1 = findPreviousTextAudioPair(_mediaOverlayRoot, _mediaOverlayTextAudioPair, { prev: undefined });
        if (!previousTextAudioPair_1) {
            if (IS_DEV) {
                debug("mediaOverlaysPrevious() - navLeftOrRight()");
            }
            mediaOverlaysStop(true);
            (0, location_2.navPreviousOrNext)(true, true, true);
        }
        else {
            var switchDoc = false;
            if (_mediaOverlayTextAudioPair.Text && previousTextAudioPair_1.Text) {
                var hrefUrlObj1 = new URL("https://dummy.com/" + _mediaOverlayTextAudioPair.Text);
                var hrefUrlObj2 = new URL("https://dummy.com/" + previousTextAudioPair_1.Text);
                if (hrefUrlObj1.pathname !== hrefUrlObj2.pathname) {
                    if (IS_DEV) {
                        debug("mediaOverlaysPrevious SWITCH! " + hrefUrlObj1.pathname + " != " + hrefUrlObj2.pathname);
                    }
                    switchDoc = true;
                }
            }
            if (switchDoc) {
                mediaOverlaysStop(true);
                var publicationURL = win.READIUM2.publicationURL;
                var urlObjFull = new URL(previousTextAudioPair_1.Text, publicationURL);
                var urlFull = urlObjFull.toString();
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - handleLinkUrl()");
                }
                var activeWebView = win.READIUM2.getFirstOrSecondWebView();
                (0, location_2.handleLinkUrl)(urlFull, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            }
            else {
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - playMediaOverlaysAudio()");
                }
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, playMediaOverlaysAudio(previousTextAudioPair_1, undefined, undefined)];
                            case 1:
                                _a.sent();
                                return [2];
                        }
                    });
                }); }, 0);
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
    var _this = this;
    if (IS_DEV) {
        debug("mediaOverlaysNext()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    ensureOnTimeUpdate(true);
    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        var nextTextAudioPair_1 = findNextTextAudioPair(_mediaOverlayRoot, _mediaOverlayTextAudioPair, { prev: undefined }, escape ? true : false);
        if (!nextTextAudioPair_1) {
            if (IS_DEV) {
                debug("mediaOverlaysNext() - navLeftOrRight()");
            }
            mediaOverlaysStop(true);
            (0, location_2.navPreviousOrNext)(false, true, true);
        }
        else {
            var switchDoc = false;
            if (_mediaOverlayTextAudioPair.Text && nextTextAudioPair_1.Text) {
                var hrefUrlObj1 = new URL("https://dummy.com/" + _mediaOverlayTextAudioPair.Text);
                var hrefUrlObj2 = new URL("https://dummy.com/" + nextTextAudioPair_1.Text);
                if (hrefUrlObj1.pathname !== hrefUrlObj2.pathname) {
                    if (IS_DEV) {
                        debug("mediaOverlaysNext() SWITCH! " + hrefUrlObj1.pathname + " != " + hrefUrlObj2.pathname);
                    }
                    switchDoc = true;
                }
            }
            if (switchDoc) {
                mediaOverlaysStop(true);
                var publicationURL = win.READIUM2.publicationURL;
                var urlObjFull = new URL(nextTextAudioPair_1.Text, publicationURL);
                var urlFull = urlObjFull.toString();
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - handleLinkUrl()");
                }
                var activeWebView = win.READIUM2.getFirstOrSecondWebView();
                (0, location_2.handleLinkUrl)(urlFull, activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            }
            else {
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - playMediaOverlaysAudio()");
                }
                setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, playMediaOverlaysAudio(nextTextAudioPair_1, undefined, undefined)];
                            case 1:
                                _a.sent();
                                return [2];
                        }
                    });
                }); }, 0);
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
var _mediaOverlaySkippabilityIsEnabled = true;
function mediaOverlaysEnableSkippability(doEnable) {
    _mediaOverlaySkippabilityIsEnabled = doEnable;
}
exports.mediaOverlaysEnableSkippability = mediaOverlaysEnableSkippability;
//# sourceMappingURL=media-overlays.js.map