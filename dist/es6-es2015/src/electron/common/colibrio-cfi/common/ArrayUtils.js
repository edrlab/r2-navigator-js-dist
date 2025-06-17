"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayUtils = void 0;
class ArrayUtils {
    static first(arr) {
        return arr.length > 0 ? arr[0] : undefined;
    }
    static last(arr) {
        return arr.length > 0 ? arr[arr.length - 1] : undefined;
    }
}
exports.ArrayUtils = ArrayUtils;
//# sourceMappingURL=ArrayUtils.js.map