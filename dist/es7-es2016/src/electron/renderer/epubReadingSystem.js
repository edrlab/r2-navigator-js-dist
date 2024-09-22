"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEpubReadingSystemInfo = setEpubReadingSystemInfo;
exports.getEpubReadingSystemInfo = getEpubReadingSystemInfo;
let _epubReadingSystemNameVersion = { name: "Readium2", version: "0.0.0" };
function setEpubReadingSystemInfo(nv) {
    _epubReadingSystemNameVersion = nv;
}
function getEpubReadingSystemInfo() {
    return _epubReadingSystemNameVersion;
}
//# sourceMappingURL=epubReadingSystem.js.map