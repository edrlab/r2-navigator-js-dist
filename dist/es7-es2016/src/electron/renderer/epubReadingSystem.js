"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEpubReadingSystemInfo = exports.setEpubReadingSystemInfo = void 0;
let _epubReadingSystemNameVersion = { name: "Readium2", version: "0.0.0" };
function setEpubReadingSystemInfo(nv) {
    _epubReadingSystemNameVersion = nv;
}
exports.setEpubReadingSystemInfo = setEpubReadingSystemInfo;
function getEpubReadingSystemInfo() {
    return _epubReadingSystemNameVersion;
}
exports.getEpubReadingSystemInfo = getEpubReadingSystemInfo;
//# sourceMappingURL=epubReadingSystem.js.map