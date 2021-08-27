"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsCreate = exports.highlightsRemove = exports.highlightsRemoveAll = exports.highlightsClickListen = exports.highlightsHandleIpcMessage = void 0;
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
var win = window;
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
    var e_1, _a;
    var _this = this;
    var _b;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_1 = function (activeWebView) {
        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
            return "continue";
        }
        setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_1 = (0, tslib_1.__values)(activeWebViews), activeWebViews_1_1 = activeWebViews_1.next(); !activeWebViews_1_1.done; activeWebViews_1_1 = activeWebViews_1.next()) {
            var activeWebView = activeWebViews_1_1.value;
            _loop_1(activeWebView);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (activeWebViews_1_1 && !activeWebViews_1_1.done && (_a = activeWebViews_1.return)) _a.call(activeWebViews_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
exports.highlightsRemoveAll = highlightsRemoveAll;
function highlightsRemove(href, highlightIDs) {
    var e_2, _a;
    var _this = this;
    var _b;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_2 = function (activeWebView) {
        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
            return "continue";
        }
        var payload = {
            highlightIDs: highlightIDs,
        };
        setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE, payload)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_2 = (0, tslib_1.__values)(activeWebViews), activeWebViews_2_1 = activeWebViews_2.next(); !activeWebViews_2_1.done; activeWebViews_2_1 = activeWebViews_2.next()) {
            var activeWebView = activeWebViews_2_1.value;
            _loop_2(activeWebView);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (activeWebViews_2_1 && !activeWebViews_2_1.done && (_a = activeWebViews_2.return)) _a.call(activeWebViews_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
exports.highlightsRemove = highlightsRemove;
function highlightsCreate(href, highlightDefinitions) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    var e_3, _a;
                    var _b;
                    var activeWebViews = win.READIUM2.getActiveWebViews();
                    var _loop_3 = function (activeWebView) {
                        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
                            return "continue";
                        }
                        var cb = function (event) {
                            if (event.channel === events_1.R2_EVENT_HIGHLIGHT_CREATE) {
                                var webview = event.currentTarget;
                                if (webview !== activeWebView) {
                                    console.log("Wrong navigator webview?!");
                                    return;
                                }
                                var payloadPong = event.args[0];
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
                        var payloadPing = {
                            highlightDefinitions: highlightDefinitions,
                            highlights: undefined,
                        };
                        setTimeout(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
                            return (0, tslib_1.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPing)];
                                    case 1:
                                        _a.sent();
                                        return [2];
                                }
                            });
                        }); }, 0);
                        return { value: void 0 };
                    };
                    try {
                        for (var activeWebViews_3 = (0, tslib_1.__values)(activeWebViews), activeWebViews_3_1 = activeWebViews_3.next(); !activeWebViews_3_1.done; activeWebViews_3_1 = activeWebViews_3.next()) {
                            var activeWebView = activeWebViews_3_1.value;
                            var state_1 = _loop_3(activeWebView);
                            if (typeof state_1 === "object")
                                return state_1.value;
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (activeWebViews_3_1 && !activeWebViews_3_1.done && (_a = activeWebViews_3.return)) _a.call(activeWebViews_3);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                    reject("highlightsCreate - no webview match?!");
                })];
        });
    });
}
exports.highlightsCreate = highlightsCreate;
//# sourceMappingURL=highlight.js.map