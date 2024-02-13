"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsDrawMargin = exports.highlightsCreate = exports.highlightsRemove = exports.highlightsRemoveAll = exports.highlightsClickListen = exports.highlightsHandleIpcMessage = void 0;
var tslib_1 = require("tslib");
var events_1 = require("../common/events");
var win = global.window;
function highlightsHandleIpcMessage(eventChannel, eventArgs, eventCurrentTarget) {
    if (eventChannel === events_1.R2_EVENT_HIGHLIGHT_CLICK) {
        var activeWebView = eventCurrentTarget;
        var payload = eventArgs[0];
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
exports.highlightsHandleIpcMessage = highlightsHandleIpcMessage;
var _highlightsClickListener;
function highlightsClickListen(highlightsClickListener) {
    _highlightsClickListener = highlightsClickListener;
}
exports.highlightsClickListen = highlightsClickListen;
function highlightsRemoveAll(href, groups) {
    var e_1, _a;
    var _this = this;
    var _b;
    console.log("--HIGH-- highlightsRemoveAll: " + href + " ... " + JSON.stringify(groups));
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_1 = function (activeWebView) {
        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
            return "continue";
        }
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var payload;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        payload = {
                            groups: groups,
                        };
                        if (groups) {
                            if (activeWebView.READIUM2.highlights) {
                                activeWebView.READIUM2.highlights = activeWebView.READIUM2.highlights.filter(function (h) {
                                    return !h.group || !groups.includes(h.group);
                                });
                            }
                        }
                        else {
                            activeWebView.READIUM2.highlights = undefined;
                        }
                        return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE_ALL, payload)];
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
    console.log("--HIGH-- highlightsRemove: " + href + " ==> " + highlightIDs.length);
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_2 = function (activeWebView) {
        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
            return "continue";
        }
        var payload = {
            highlightIDs: highlightIDs,
        };
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        if (activeWebView.READIUM2.highlights) {
                            activeWebView.READIUM2.highlights = activeWebView.READIUM2.highlights.filter(function (h) {
                                return !highlightIDs.includes(h.id);
                            });
                        }
                        return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_REMOVE, payload)];
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
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    var e_3, _a;
                    var _b;
                    console.log("--HIGH-- highlightsCreate: " + href + " ==> " + (highlightDefinitions === null || highlightDefinitions === void 0 ? void 0 : highlightDefinitions.length));
                    var activeWebViews = win.READIUM2.getActiveWebViews();
                    var _loop_3 = function (activeWebView) {
                        if (((_b = activeWebView.READIUM2.link) === null || _b === void 0 ? void 0 : _b.Href) !== href) {
                            return "continue";
                        }
                        var cb = function (event) {
                            var _a;
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
                                    if (!webview.READIUM2.highlights) {
                                        webview.READIUM2.highlights = [];
                                    }
                                    (_a = webview.READIUM2.highlights).push.apply(_a, tslib_1.__spreadArray([], tslib_1.__read(payloadPong.highlights.filter(function (h) { return !!h; })), false));
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
                            var _a;
                            return tslib_1.__generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                                        return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_CREATE, payloadPing)];
                                    case 1:
                                        _b.sent();
                                        _b.label = 2;
                                    case 2: return [2];
                                }
                            });
                        }); }, 0);
                        return { value: void 0 };
                    };
                    try {
                        for (var activeWebViews_3 = tslib_1.__values(activeWebViews), activeWebViews_3_1 = activeWebViews_3.next(); !activeWebViews_3_1.done; activeWebViews_3_1 = activeWebViews_3.next()) {
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
function highlightsDrawMargin(drawMargin) {
    var e_4, _a;
    var _this = this;
    console.log("--HIGH-- highlightsDrawMargin: " + JSON.stringify(drawMargin, null, 4));
    win.READIUM2.highlightsDrawMargin = drawMargin;
    var activeWebViews = win.READIUM2.getActiveWebViews();
    var _loop_4 = function (activeWebView) {
        var payload = {
            drawMargin: drawMargin,
        };
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = activeWebView.READIUM2) === null || _a === void 0 ? void 0 : _a.DOMisReady)) return [3, 2];
                        return [4, activeWebView.send(events_1.R2_EVENT_HIGHLIGHT_DRAW_MARGIN, payload)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        }); }, 0);
    };
    try {
        for (var activeWebViews_4 = tslib_1.__values(activeWebViews), activeWebViews_4_1 = activeWebViews_4.next(); !activeWebViews_4_1.done; activeWebViews_4_1 = activeWebViews_4.next()) {
            var activeWebView = activeWebViews_4_1.value;
            _loop_4(activeWebView);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (activeWebViews_4_1 && !activeWebViews_4_1.done && (_a = activeWebViews_4.return)) _a.call(activeWebViews_4);
        }
        finally { if (e_4) throw e_4.error; }
    }
}
exports.highlightsDrawMargin = highlightsDrawMargin;
//# sourceMappingURL=highlight.js.map