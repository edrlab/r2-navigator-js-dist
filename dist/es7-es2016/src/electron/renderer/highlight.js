"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsHandleIpcMessage = highlightsHandleIpcMessage;
exports.highlightsClickListen = highlightsClickListen;
exports.highlightsRemoveAll = highlightsRemoveAll;
exports.highlightsRemove = highlightsRemove;
exports.highlightsCreate = highlightsCreate;
exports.highlightsDrawMargin = highlightsDrawMargin;
const tslib_1 = require("tslib");
const events_1 = require("../common/events");
const win = global.window;
function highlightsHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_HIGHLIGHT_CLICK) {
        const activeWebView = eventCurrentTarget;
        const payload = eventArgs[0];
        if (_highlightsClickListener && activeWebView.READIUM2.link) {
            _highlightsClickListener(activeWebView.READIUM2.link.Href, payload.highlight, payload.event);
        }
        return true;
    }
    else if (eventChannel === events_1.R2_EVENT_HIGHLIGHT_CREATE) {
        return true;
    }
    else {
        return false;
    }
}
let _highlightsClickListener;
function highlightsClickListen(highlightsClickListener) {
    _highlightsClickListener = highlightsClickListener;
}
function highlightsRemoveAll(href, groups) {
    var _a;
    console.log("--HIGH-- highlightsRemoveAll: " + href + " ... " + JSON.stringify(groups));
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                const payload = {
                    groups,
                };
                if (groups) {
                    if (activeWebView.READIUM2.highlights) {
                        activeWebView.READIUM2.highlights = activeWebView.READIUM2.highlights.filter((h) => {
                            return !h.group || !groups.includes(h.group);
                        });
                    }
                }
                else {
                    activeWebView.READIUM2.highlights = undefined;
                }
                yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL, payload);
            }
        }), 0);
    }
}
function highlightsRemove(href, highlightIDs) {
    var _a;
    console.log("--HIGH-- highlightsRemove: " + href + " ==> " + highlightIDs.length);
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
            continue;
        }
        const payload = {
            highlightIDs,
        };
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                if (activeWebView.READIUM2.highlights) {
                    activeWebView.READIUM2.highlights = activeWebView.READIUM2.highlights.filter((h) => {
                        return !highlightIDs.includes(h.id);
                    });
                }
                yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE, payload);
            }
        }), 0);
    }
}
let __eventIDCounter = 0;
function highlightsCreate(href, highlightDefinitions) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            var _a;
            console.log("--HIGH-- highlightsCreate: " + href + " ==> " + (highlightDefinitions === null || highlightDefinitions === void 0 ? void 0 : highlightDefinitions.length));
            const activeWebViews = win.READIUM2.getActiveWebViews();
            for (const activeWebView of activeWebViews) {
                if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
                    continue;
                }
                if (__eventIDCounter >= Number.MAX_SAFE_INTEGER) {
                    __eventIDCounter = 0;
                }
                const eventID = __eventIDCounter++;
                const cb = (event) => {
                    if (event.channel === events_1.R2_EVENT_HIGHLIGHT_CREATE) {
                        const webview = event.currentTarget;
                        if (webview !== activeWebView) {
                            console.log("Wrong navigator webview?!");
                            return;
                        }
                        const payloadPong = event.args[0];
                        if (event.args[1] === eventID) {
                            webview.removeEventListener("ipc-message", cb);
                            if (!payloadPong.highlights) {
                                reject("highlightCreate fail?!");
                            }
                            else {
                                if (!webview.READIUM2.highlights) {
                                    webview.READIUM2.highlights = [];
                                }
                                webview.READIUM2.highlights.push(...payloadPong.highlights.filter((h) => !!h));
                                resolve(payloadPong.highlights);
                            }
                        }
                    }
                };
                activeWebView.addEventListener("ipc-message", cb);
                const payloadPing = {
                    highlightDefinitions,
                    highlights: undefined,
                };
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    var _a;
                    if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                        yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPing, eventID);
                    }
                }), 0);
                return;
            }
            reject("highlightsCreate - no webview match?!");
        });
    });
}
function highlightsDrawMargin(drawMargin) {
    console.log("--HIGH-- highlightsDrawMargin: " + JSON.stringify(drawMargin, null, 4));
    win.READIUM2.highlightsDrawMargin = drawMargin;
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        const payload = {
            drawMargin,
        };
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady) {
                yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_DRAW_MARGIN, payload);
            }
        }), 0);
    }
}
//# sourceMappingURL=highlight.js.map