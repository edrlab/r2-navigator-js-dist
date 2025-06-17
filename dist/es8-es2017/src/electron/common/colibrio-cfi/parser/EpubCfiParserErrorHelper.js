"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiParserErrorHelper = void 0;
const Utils_js_1 = require("../common/Utils.js");
class EpubCfiParserErrorHelper {
    static createError(errorType, token) {
        let value;
        let srcOffset;
        if ((0, Utils_js_1.isObject)(token)) {
            srcOffset = token.srcOffset;
            if ((0, Utils_js_1.isString)(token.value)) {
                value = token.value;
            }
            else if ((0, Utils_js_1.isArray)(token.value)) {
                value = '[' + token.value.map(val => val.value).join('') + ']';
            }
            else {
                value = '' + token.value;
            }
        }
        else {
            srcOffset = token;
        }
        return {
            type: errorType,
            srcOffset: srcOffset,
            value: value || '',
        };
    }
}
exports.EpubCfiParserErrorHelper = EpubCfiParserErrorHelper;
//# sourceMappingURL=EpubCfiParserErrorHelper.js.map