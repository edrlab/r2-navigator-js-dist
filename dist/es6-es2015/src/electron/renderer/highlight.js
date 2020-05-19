"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsCreate = exports.highlightsRemove = exports.highlightsRemoveAll = exports.highlightsClickListen = exports.highlightsHandleIpcMessage = void 0;
const tslib_1 = require("tslib");
const events_1 = require("../common/events");
const win = window;
function highlightsHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_HIGHLIGHT_CLICK) {
        const activeWebView = eventCurrentTarget;
        const payload = eventArgs[0];
        if (_highlightsClickListener && activeWebView.READIUM2.link) {
            _highlightsClickListener(activeWebView.READIUM2.link.Href, payload.highlight);
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
exports.highlightsHandleIpcMessage = highlightsHandleIpcMessage;
let _highlightsClickListener;
function highlightsClickListen(highlightsClickListener) {
    _highlightsClickListener = highlightsClickListener;
}
exports.highlightsClickListen = highlightsClickListen;
function highlightsRemoveAll(href) {
    var _a;
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
            continue;
        }
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL);
        }), 0);
    }
}
exports.highlightsRemoveAll = highlightsRemoveAll;
function highlightsRemove(href, highlightIDs) {
    var _a;
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
            continue;
        }
        const payload = {
            highlightIDs,
        };
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE, payload);
        }), 0);
    }
}
exports.highlightsRemove = highlightsRemove;
function highlightsCreate(href, highlightDefinitions) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            var _a;
            const activeWebViews = win.READIUM2.getActiveWebViews();
            for (const activeWebView of activeWebViews) {
                if (((_a = activeWebView.READIUM2.link) === null || _a === void 0 ? void 0 : _a.Href) !== href) {
                    continue;
                }
                const cb = (event) => {
                    if (event.channel === events_1.R2_EVENT_HIGHLIGHT_CREATE) {
                        const webview = event.currentTarget;
                        if (webview !== activeWebView) {
                            console.log("Wrong navigator webview?!");
                            return;
                        }
                        const payloadPong = event.args[0];
                        webview.removeEventListener("ipc-message", cb);
                        if (!payloadPong.highlights) {
                            reject("highlightCreate fail?!");
                        }
                        else {
                            resolve(payloadPong.highlights);
                        }
                    }
                };
                activeWebView.addEventListener("ipc-message", cb);
                const payloadPing = {
                    highlightDefinitions,
                    highlights: undefined,
                };
                setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPing);
                }), 0);
                return;
            }
            reject("highlightsCreate - no webview match?!");
        });
    });
}
exports.highlightsCreate = highlightsCreate;
//# sourceMappingURL=highlight.js.map