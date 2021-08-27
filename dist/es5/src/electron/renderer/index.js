"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    var cr = require("./common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/index", process.stdout, process.stderr, true);
}
(0, tslib_1.__exportStar)(require("./dom"), exports);
(0, tslib_1.__exportStar)(require("./readium-css"), exports);
(0, tslib_1.__exportStar)(require("./epubReadingSystem"), exports);
(0, tslib_1.__exportStar)(require("./location"), exports);
(0, tslib_1.__exportStar)(require("./readaloud"), exports);
(0, tslib_1.__exportStar)(require("./media-overlays"), exports);
(0, tslib_1.__exportStar)(require("./highlight"), exports);
//# sourceMappingURL=index.js.map