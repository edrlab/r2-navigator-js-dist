"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debounce_1 = require("debounce");
const electron_1 = require("electron");
const audiobook_1 = require("../../common/audiobook");
const events_1 = require("../../common/events");
const styles_1 = require("../../common/styles");
const win = global.window;
function throttle(fn, time) {
    let called = false;
    return (...args) => {
        if (!called) {
            fn(...args);
            called = true;
            setTimeout(() => {
                called = false;
            }, time);
        }
    };
}
function setupAudioBook(_docTitle) {
    win.document.documentElement.classList.add(styles_1.AUDIO_PROGRESS_CLASS);
    const coverElement = win.document.getElementById(styles_1.AUDIO_COVER_ID);
    const audioElement = win.document.getElementById(styles_1.AUDIO_ID);
    const sliderElement = win.document.getElementById(styles_1.AUDIO_SLIDER_ID);
    const timeElement = win.document.getElementById(styles_1.AUDIO_TIME_ID);
    const percentElement = win.document.getElementById(styles_1.AUDIO_PERCENT_ID);
    const playPauseElement = win.document.getElementById(styles_1.AUDIO_PLAYPAUSE_ID);
    const previousElement = win.document.getElementById(styles_1.AUDIO_PREVIOUS_ID);
    const nextElement = win.document.getElementById(styles_1.AUDIO_NEXT_ID);
    const rewindElement = win.document.getElementById(styles_1.AUDIO_REWIND_ID);
    const forwardElement = win.document.getElementById(styles_1.AUDIO_FORWARD_ID);
    const bufferCanvasElement = audiobook_1.DEBUG_AUDIO ?
        win.document.getElementById(styles_1.AUDIO_BUFFER_CANVAS_ID) : undefined;
    if (bufferCanvasElement) {
        const context = bufferCanvasElement.getContext("2d");
        if (context) {
            const refreshBufferCanvas = () => {
                const pixelsPerSecond = bufferCanvasElement.width / audioElement.duration;
                context.fillStyle = "red";
                context.fillRect(0, 0, bufferCanvasElement.width, bufferCanvasElement.height);
                context.fillStyle = "green";
                context.strokeStyle = "magenta";
                console.log(`audio -- buffered.length: ${audioElement.buffered.length}`);
                for (let i = 0; i < audioElement.buffered.length; i++) {
                    const start = audioElement.buffered.start(i);
                    const end = audioElement.buffered.end(i);
                    console.log(`audio -- buffered: ${start} ... ${end}`);
                    const x1 = start * pixelsPerSecond;
                    const x2 = end * pixelsPerSecond;
                    const w = x2 - x1;
                    context.fillRect(x1, 0, w, bufferCanvasElement.height);
                    context.rect(x1, 0, w, bufferCanvasElement.height);
                    context.stroke();
                }
            };
            const refreshBufferCanvasThrottled = throttle(() => {
                refreshBufferCanvas();
            }, 500);
            context.fillStyle = "silver";
            context.fillRect(0, 0, bufferCanvasElement.width, bufferCanvasElement.height);
            audioElement.addEventListener("timeupdate", () => {
                if (audioElement.duration <= 0) {
                    return;
                }
                refreshBufferCanvasThrottled();
            });
        }
    }
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_DO_PLAY, (_event) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield audioElement.play();
    }));
    electron_1.ipcRenderer.on(events_1.R2_EVENT_AUDIO_DO_PAUSE, (_event) => {
        audioElement.pause();
    });
    rewindElement.addEventListener("click", () => {
        const newTime = Math.max(0, audioElement.currentTime - 30);
        audioElement.currentTime = newTime;
    });
    forwardElement.addEventListener("click", () => {
        const newTime = Math.min(audioElement.duration, audioElement.currentTime + 30);
        audioElement.currentTime = newTime;
    });
    previousElement.addEventListener("click", () => {
        const payload = {
            direction: "LTR",
            go: "PREVIOUS",
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    });
    nextElement.addEventListener("click", () => {
        const payload = {
            direction: "LTR",
            go: "NEXT",
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    });
    sliderElement.addEventListener("input", () => {
        const p = sliderElement.valueAsNumber / 100;
        audioElement.currentTime = audioElement.duration * p;
    });
    function togglePlayPause() {
        if (win.READIUM2.locationHashOverrideInfo &&
            win.READIUM2.locationHashOverrideInfo.audioPlaybackInfo) {
            const isPlaying = win.READIUM2.locationHashOverrideInfo.audioPlaybackInfo.isPlaying;
            if (isPlaying) {
                audioElement.pause();
            }
            else {
                if (audioElement.currentTime >= audioElement.duration - 0.5) {
                    const payload = {
                        direction: "LTR",
                        go: "NEXT",
                    };
                    electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
                }
                else {
                    setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        yield audioElement.play();
                    }), 0);
                }
            }
        }
    }
    coverElement.addEventListener("mousedown", () => {
        togglePlayPause();
    });
    playPauseElement.addEventListener("click", () => {
        togglePlayPause();
    });
    function formatTime(seconds) {
        const secondsPerMinute = 60;
        const minutesPerHours = 60;
        const secondsPerHour = minutesPerHours * secondsPerMinute;
        let remainingSeconds = seconds;
        const nHours = Math.floor(remainingSeconds / secondsPerHour);
        remainingSeconds -= (nHours * secondsPerHour);
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        const nMinutes = Math.floor(remainingSeconds / secondsPerMinute);
        remainingSeconds -= (nMinutes * secondsPerMinute);
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        remainingSeconds = Math.floor(remainingSeconds);
        return `${nHours > 0 ? (nHours.toString().padStart(2, "0") + ":") : ``}${nMinutes > 0 ? (nMinutes.toString().padStart(2, "0") + ":") : `00:`}${remainingSeconds > 0 ? (remainingSeconds.toString().padStart(2, "0")) : `00`}`;
    }
    function notifyPlaybackLocation() {
        const percent = audioElement.currentTime / audioElement.duration;
        const p = Math.round(percent * 100);
        sliderElement.valueAsNumber = p;
        percentElement.innerText = `${p}%`;
        const prettyTime = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
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
            epubPage: undefined,
            href: "",
            locations: {
                cfi: undefined,
                cssSelector: undefined,
                position: undefined,
                progression: percent,
            },
            paginationInfo: undefined,
            selectionInfo: undefined,
            selectionIsNew: undefined,
            text: undefined,
            title: _docTitle,
        };
        const payload = win.READIUM2.locationHashOverrideInfo;
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_READING_LOCATION, payload);
    }
    const notifyPlaybackLocationThrottled = throttle(() => {
        notifyPlaybackLocation();
    }, 1000);
    const progressDebounced = debounce_1.debounce((progress) => {
        if (progress) {
            win.document.documentElement.classList.add(styles_1.AUDIO_PROGRESS_CLASS);
        }
        else {
            win.document.documentElement.classList.remove(styles_1.AUDIO_PROGRESS_CLASS);
        }
    }, 150);
    audioElement.addEventListener("play", () => {
        audioElement.isPlaying = true;
        playPauseElement.classList.add("pause");
        notifyPlaybackLocation();
    });
    audioElement.addEventListener("pause", () => {
        audioElement.isPlaying = false;
        playPauseElement.classList.remove("pause");
        notifyPlaybackLocation();
    });
    audioElement.addEventListener("seeking", () => {
        progressDebounced(true);
    });
    audioElement.addEventListener("canplay", () => {
        progressDebounced(false);
    });
    audioElement.addEventListener("ended", () => {
        audioElement.isPlaying = false;
        playPauseElement.classList.remove("pause");
        notifyPlaybackLocation();
        const payload = {
            direction: "LTR",
            go: "NEXT",
        };
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_PAGE_TURN_RES, payload);
    });
    audioElement.addEventListener("timeupdate", () => {
        notifyPlaybackLocationThrottled();
    });
}
exports.setupAudioBook = setupAudioBook;
//# sourceMappingURL=audiobook.js.map