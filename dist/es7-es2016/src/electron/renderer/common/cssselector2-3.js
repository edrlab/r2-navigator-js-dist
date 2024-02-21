"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueCssSelector = void 0;
const debug_ = require("debug");
const cssselector2_1 = require("./cssselector2");
const cssselector3_1 = require("./cssselector3");
const debug = debug_("r2:navigator#electron/renderer/common/cssselector");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function uniqueCssSelector(input, doc, options) {
    const res3 = (0, cssselector3_1.uniqueCssSelector)(input, doc, options);
    if (IS_DEV) {
        const res2 = (0, cssselector2_1.uniqueCssSelector)(input, doc, options);
        if (res2 !== res3) {
            debug(":::: CSS SELECTOR DIFF: ", res2, res3);
        }
    }
    return res3;
}
exports.uniqueCssSelector = uniqueCssSelector;
//# sourceMappingURL=cssselector2-3.js.map