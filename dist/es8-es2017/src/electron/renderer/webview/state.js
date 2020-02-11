"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let _isScreenReaderMounted;
function isScreenReaderMounted() {
    if (typeof _isScreenReaderMounted === "undefined") {
        _isScreenReaderMounted = electron_1.remote.app.accessibilitySupportEnabled;
    }
    return _isScreenReaderMounted;
}
exports.isScreenReaderMounted = isScreenReaderMounted;
//# sourceMappingURL=state.js.map