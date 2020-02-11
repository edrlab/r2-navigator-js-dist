"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var styles_1 = require("../../common/styles");
var win = global.window;
function throttle(fn, time) {
    var called = false;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!called) {
            fn.apply(void 0, tslib_1.__spread(args));
            called = true;
            setTimeout(function () {
                called = false;
            }, time);
        }
    };
}
function setupAudioBook(_docTitle) {
    var _this = this;
    win.document.documentElement.classList.add(styles_1.AUDIO_PROGRESS_CLASS);
    var coverElement = win.document.getElementById(styles_1.AUDIO_COVER_ID);
    var audioElement = win.document.getElementById(styles_1.AUDIO_ID);
    var sliderElement = win.document.getElementById(styles_1.AUDIO_SLIDER_ID);
    var timeElement = win.document.getElementById(styles_1.AUDIO_TIME_ID);
    var percentElement = win.document.getElementById(styles_1.AUDIO_PERCENT_ID);
    var playPauseElement = win.document.getElementById(styles_1.AUDIO_PLAYPAUSE_ID);
    var previousElement = win.document.getElementById(styles_1.AUDIO_PREVIOUS_ID);
    var nextElement = win.document.getElementById(styles_1.AUDIO_NEXT_ID);
    var rewindElement = win.document.getElementById(styles_1.AUDIO_REWIND_ID);
    var forwardElement = win.document.getElementById(styles_1.AUDIO_FORWARD_ID);
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_DO_PLAY, function (_event) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, audioElement.play()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_DO_PAUSE, function (_event) {
        audioElement.pause();
    });
    rewindElement.addEventListener("click", function () {
        var newTime = Math.max(0, audioElement.currentTime - 30);
        audioElement.currentTime = newTime;
    });
    forwardElement.addEventListener("click", function () {
        var newTime = Math.min(audioElement.duration, audioElement.currentTime + 30);
        audioElement.currentTime = newTime;
    });
    previousElement.addEventListener("click", function () {
        var payload = {
            direction: "LTR",
            go: "PREVIOUS",
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    });
    nextElement.addEventListener("click", function () {
        var payload = {
            direction: "LTR",
            go: "NEXT",
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    });
    sliderElement.addEventListener("input", function () {
        var p = sliderElement.valueAsNumber / 100;
        audioElement.currentTime = audioElement.duration * p;
    });
    function togglePlayPause() {
        var _this = this;
        if (win.READIUM2.locationHashOverrideInfo &&
            win.READIUM2.locationHashOverrideInfo.audioPlaybackInfo) {
            var isPlaying = win.READIUM2.locationHashOverrideInfo.audioPlaybackInfo.isPlaying;
            if (isPlaying) {
                audioElement.pause();
            }
            else {
                if (audioElement.currentTime >= audioElement.duration - 0.5) {
                    var payload = {
                        direction: "LTR",
                        go: "NEXT",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                }
                else {
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, audioElement.play()];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); }, 0);
                }
            }
        }
    }
    coverElement.addEventListener("mousedown", function () {
        togglePlayPause();
    });
    playPauseElement.addEventListener("click", function () {
        togglePlayPause();
    });
    function formatTime(seconds) {
        var secondsPerMinute = 60;
        var minutesPerHours = 60;
        var secondsPerHour = minutesPerHours * secondsPerMinute;
        var remainingSeconds = seconds;
        var nHours = Math.floor(remainingSeconds / secondsPerHour);
        remainingSeconds -= (nHours * secondsPerHour);
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        var nMinutes = Math.floor(remainingSeconds / secondsPerMinute);
        remainingSeconds -= (nMinutes * secondsPerMinute);
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        remainingSeconds = Math.floor(remainingSeconds);
        return "" + (nHours > 0 ? (nHours.toString().padStart(2, "0") + ":") : "") + (nMinutes > 0 ? (nMinutes.toString().padStart(2, "0") + ":") : "00:") + (remainingSeconds > 0 ? (remainingSeconds.toString().padStart(2, "0")) : "00");
    }
    function notifyPlaybackLocation() {
        var percent = audioElement.currentTime / audioElement.duration;
        var p = Math.round(percent * 100);
        sliderElement.valueAsNumber = p;
        percentElement.innerText = p + "%";
        var prettyTime = formatTime(audioElement.currentTime) + " / " + formatTime(audioElement.duration);
        timeElement.innerText = prettyTime;
        win.READIUM2.locationHashOverrideInfo = {
            audioPlaybackInfo: {
                globalDuration: undefined,
                globalProgression: undefined,
                globalTime: undefined,
                isPlaying: audioElement.isPlaying,
                localDuration: audioElement.duration,
                localProgression: percent,
                localTime: audioElement.currentTime,
            },
            docInfo: {
                isFixedLayout: false,
                isRightToLeft: false,
                isVerticalWritingMode: false,
            },
            href: "",
            locations: {
                cfi: undefined,
                cssSelector: undefined,
                position: undefined,
                progression: percent,
            },
            paginationInfo: undefined,
            selectionInfo: undefined,
            selectionIsNew: false,
            text: undefined,
            title: _docTitle,
        };
        var payload = win.READIUM2.locationHashOverrideInfo;
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    }
    var notifyPlaybackLocationThrottled = throttle(function () {
        notifyPlaybackLocation();
    }, 1000);
    var progressDebounced = debounce_1.debounce(function (progress) {
        if (progress) {
            win.document.documentElement.classList.add(styles_1.AUDIO_PROGRESS_CLASS);
        }
        else {
            win.document.documentElement.classList.remove(styles_1.AUDIO_PROGRESS_CLASS);
        }
    }, 150);
    audioElement.addEventListener("play", function () {
        audioElement.isPlaying = true;
        playPauseElement.classList.add("pause");
        notifyPlaybackLocation();
    });
    audioElement.addEventListener("pause", function () {
        audioElement.isPlaying = false;
        playPauseElement.classList.remove("pause");
        notifyPlaybackLocation();
    });
    audioElement.addEventListener("seeking", function () {
        progressDebounced(true);
    });
    audioElement.addEventListener("canplay", function () {
        progressDebounced(false);
    });
    audioElement.addEventListener("ended", function () {
        audioElement.isPlaying = false;
        playPauseElement.classList.remove("pause");
        notifyPlaybackLocation();
        var payload = {
            direction: "LTR",
            go: "NEXT",
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    });
    audioElement.addEventListener("timeupdate", function () {
        notifyPlaybackLocationThrottled();
    });
}
exports.setupAudioBook = setupAudioBook;
//# sourceMappingURL=audiobook.js.map