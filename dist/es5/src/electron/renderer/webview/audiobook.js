"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudioBook = void 0;
var tslib_1 = require("tslib");
var debounce_1 = require("debounce");
var electron_1 = require("electron");
var audiobook_1 = require("../../common/audiobook");
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
            fn.apply(void 0, tslib_1.__spreadArray([], tslib_1.__read(args), false));
            called = true;
            setTimeout(function () {
                called = false;
            }, time);
        }
    };
}
function setupAudioBook(_docTitle, audioPlaybackRate) {
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
    var rateElement = win.document.getElementById(styles_1.AUDIO_RATE_ID);
    if (audioPlaybackRate) {
        rateElement.value = "".concat(audioPlaybackRate);
    }
    else {
        rateElement.value = "".concat(audioElement.playbackRate);
    }
    rateElement.addEventListener("change", function () {
        var speed = parseFloat(rateElement.value);
        audioElement.playbackRate = speed;
        var payload = {
            speed: speed,
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_AUDIO_PLAYBACK_RATE, payload);
    });
    function refreshTimeElements(p) {
        var prettyPercent = percentElement.displayAlt ? "".concat(p, "%") : "".concat(formatTime(audioElement.duration));
        percentElement.innerText = prettyPercent;
        var prettyTime = timeElement.displayAlt ?
            "-".concat(formatTime(audioElement.duration - audioElement.currentTime)) :
            "".concat(formatTime(audioElement.currentTime));
        timeElement.innerText = prettyTime;
    }
    function onTimeElementsClick(el) {
        if (el.displayAlt) {
            el.displayAlt = false;
        }
        else {
            el.displayAlt = true;
        }
        var percent = audioElement.currentTime / audioElement.duration;
        var p = Math.round(percent * 100);
        refreshTimeElements(p);
    }
    timeElement.addEventListener("click", function () {
        onTimeElementsClick(timeElement);
    });
    percentElement.addEventListener("click", function () {
        onTimeElementsClick(percentElement);
    });
    var bufferCanvasElement = audiobook_1.DEBUG_AUDIO ?
        win.document.getElementById(styles_1.AUDIO_BUFFER_CANVAS_ID) : undefined;
    if (bufferCanvasElement) {
        var context_1 = bufferCanvasElement.getContext("2d");
        if (context_1) {
            var refreshBufferCanvas_1 = function () {
                var pixelsPerSecond = bufferCanvasElement.width / audioElement.duration;
                context_1.fillStyle = "red";
                context_1.fillRect(0, 0, bufferCanvasElement.width, bufferCanvasElement.height);
                context_1.fillStyle = "green";
                context_1.strokeStyle = "magenta";
                console.log("audio -- buffered.length: ".concat(audioElement.buffered.length));
                for (var i = 0; i < audioElement.buffered.length; i++) {
                    var start = audioElement.buffered.start(i);
                    var end = audioElement.buffered.end(i);
                    console.log("audio -- buffered: ".concat(start, " ... ").concat(end));
                    var x1 = start * pixelsPerSecond;
                    var x2 = end * pixelsPerSecond;
                    var w = x2 - x1;
                    context_1.fillRect(x1, 0, w, bufferCanvasElement.height);
                    context_1.rect(x1, 0, w, bufferCanvasElement.height);
                    context_1.stroke();
                }
            };
            var refreshBufferCanvasThrottled_1 = throttle(function () {
                refreshBufferCanvas_1();
            }, 500);
            context_1.fillStyle = "silver";
            context_1.fillRect(0, 0, bufferCanvasElement.width, bufferCanvasElement.height);
            audioElement.addEventListener("timeupdate", function () {
                if (audioElement.duration <= 0) {
                    return;
                }
                refreshBufferCanvasThrottled_1();
            });
        }
    }
    function rewind() {
        var newTime = Math.max(0, audioElement.currentTime - 30);
        audioElement.currentTime = newTime;
    }
    rewindElement.addEventListener("click", function () {
        rewind();
    });
    function forward() {
        var newTime = Math.min(audioElement.duration, audioElement.currentTime + 30);
        audioElement.currentTime = newTime;
    }
    forwardElement.addEventListener("click", function () {
        forward();
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
        sliderElement.style.setProperty("--audiopercent", "".concat(sliderElement.valueAsNumber, "%"));
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
    if (coverElement) {
        coverElement.addEventListener("mouseup", function (ev) {
            if (ev.button === 0) {
                togglePlayPause();
            }
        });
    }
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
        return "".concat(nHours > 0 ? (nHours.toString().padStart(2, "0") + ":") : "").concat(nMinutes > 0 ? (nMinutes.toString().padStart(2, "0") + ":") : "00:").concat(remainingSeconds > 0 ? (remainingSeconds.toString().padStart(2, "0")) : "00");
    }
    function notifyPlaybackLocation() {
        var percent = audioElement.currentTime / audioElement.duration;
        var p = Math.round(percent * 100);
        refreshTimeElements(p);
        sliderElement.valueAsNumber = p;
        sliderElement.style.setProperty("--audiopercent", "".concat(p, "%"));
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
            epubPage: undefined,
            headings: undefined,
            href: "",
            locations: {
                cfi: undefined,
                cssSelector: undefined,
                position: undefined,
                progression: percent,
            },
            paginationInfo: undefined,
            secondWebViewHref: undefined,
            selectionInfo: undefined,
            selectionIsNew: undefined,
            text: undefined,
            title: _docTitle,
            userInteract: false,
        };
        var payload = win.READIUM2.locationHashOverrideInfo;
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    }
    var notifyPlaybackLocationThrottled = throttle(function () {
        notifyPlaybackLocation();
    }, 1000);
    var progressDebounced = (0, debounce_1.debounce)(function (progress) {
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
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE, function (_event) {
        togglePlayPause();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_REWIND, function (_event) {
        rewind();
    });
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_FORWARD, function (_event) {
        forward();
    });
}
exports.setupAudioBook = setupAudioBook;
//# sourceMappingURL=audiobook.js.map