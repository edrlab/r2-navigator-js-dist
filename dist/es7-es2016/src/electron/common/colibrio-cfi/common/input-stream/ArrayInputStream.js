"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayInputStream = void 0;
class ArrayInputStream {
    constructor(_arr) {
        this._arr = _arr;
        this._nextPos = 0;
    }
    next() {
        return this._arr[this._nextPos++];
    }
    peek() {
        return this._arr[this._nextPos];
    }
}
exports.ArrayInputStream = ArrayInputStream;
//# sourceMappingURL=ArrayInputStream.js.map