"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
function highlightsHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_HIGHLIGHT_CLICK) {
        var activeWebView = eventCurrentTarget;
        var payload = eventArgs[0];
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
var _highlightsClickListener;
function highlightsClickListen(highlightsClickListener) {
    _highlightsClickListener = highlightsClickListener;
}
exports.highlightsClickListen = highlightsClickListen;
function highlightsRemoveAll(href) {
    var _this = this;
    var activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView && activeWebView.READIUM2.link && activeWebView.READIUM2.link.Href === href) {
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 0);
    }
}
exports.highlightsRemoveAll = highlightsRemoveAll;
function highlightsRemove(href, highlightIDs) {
    var _this = this;
    var activeWebView = window.READIUM2.getActiveWebView();
    if (activeWebView && activeWebView.READIUM2.link && activeWebView.READIUM2.link.Href === href) {
        var payload_1 = {
            highlightIDs: highlightIDs,
        };
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE, payload_1)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 0);
    }
}
exports.highlightsRemove = highlightsRemove;
function highlightsCreate(href, highlightDefinitions) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    var activeWebView = window.READIUM2.getActiveWebView();
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
                    var cb = function (event) {
                        if (event.channel === events_1.R2_EVENT_HIGHLIGHT_CREATE) {
                            var webview = event.currentTarget;
                            if (webview !== activeWebView) {
                                reject("Wrong navigator webview?!");
                                return;
                            }
                            var payloadPong = event.args[0];
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
                    var payloadPing = {
                        highlightDefinitions: highlightDefinitions,
                        highlights: undefined,
                    };
                    setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPing)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); }, 0);
                })];
        });
    });
}
exports.highlightsCreate = highlightsCreate;
//# sourceMappingURL=highlight.js.map