"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
if (IS_DEV) {
    const cr = require("./common/console-redirect");
    cr.consoleRedirect("r2:navigator#electron/renderer/index", process.stdout, process.stderr, true);
}
tslib_1.__exportStar(require("./dom"), exports);
tslib_1.__exportStar(require("./readium-css"), exports);
tslib_1.__exportStar(require("./epubReadingSystem"), exports);
tslib_1.__exportStar(require("./location"), exports);
tslib_1.__exportStar(require("./readaloud"), exports);
tslib_1.__exportStar(require("./media-overlays"), exports);
tslib_1.__exportStar(require("./highlight"), exports);
//# sourceMappingURL=index.js.map