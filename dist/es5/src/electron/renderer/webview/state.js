"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var _isScreenReaderMounted;
function isScreenReaderMounted() {
    if (typeof _isScreenReaderMounted === "undefined") {
        _isScreenReaderMounted = electron_1.remote.app.isAccessibilitySupportEnabled();
    }
    return _isScreenReaderMounted;
}
exports.isScreenReaderMounted = isScreenReaderMounted;
//# sourceMappingURL=state.js.map