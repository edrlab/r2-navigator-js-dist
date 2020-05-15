"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsCreate = exports.highlightsRemove = exports.highlightsRemoveAll = exports.highlightsClickListen = exports.highlightsHandleIpcMessage = void 0;
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
    const activeWebView = win.READIUM2.getActiveWebView();
    if (activeWebView && activeWebView.READIUM2.link && activeWebView.READIUM2.link.Href === href) {
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL);
        }, 0);
    }
}
exports.highlightsRemoveAll = highlightsRemoveAll;
function highlightsRemove(href, highlightIDs) {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (activeWebView && activeWebView.READIUM2.link && activeWebView.READIUM2.link.Href === href) {
        const payload = {
            highlightIDs,
        };
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE, payload);
        }, 0);
    }
}
exports.highlightsRemove = highlightsRemove;
async function highlightsCreate(href, highlightDefinitions) {
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
        if (activeWebView.READIUM2.link.Href !== href) {
            reject("Navigator webview link no match?!");
            return;
        }
        const cb = (event) => {
            if (event.channel === events_1.R2_EVENT_HIGHLIGHT_CREATE) {
                const webview = event.currentTarget;
                if (webview !== activeWebView) {
                    reject("Wrong navigator webview?!");
                    return;
                }
                const payloadPong = event.args[0];
                activeWebView.removeEventListener("ipc-message", cb);
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
        setTimeout(async () => {
            await activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPing);
        }, 0);
    });
}
exports.highlightsCreate = highlightsCreate;
//# sourceMappingURL=highlight.js.map