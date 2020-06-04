"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertColorHexadecimalToRGBA = exports.HighlightDrawTypeStrikethrough = exports.HighlightDrawTypeUnderline = exports.HighlightDrawTypeBackground = void 0;
exports.HighlightDrawTypeBackground = 0;
exports.HighlightDrawTypeUnderline = 1;
exports.HighlightDrawTypeStrikethrough = 2;
function convertColorHexadecimalToRGBA(cssHex, alpha) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(cssHex)) {
        var hex = cssHex.substring(1);
        var hex_ = hex.length === 3 ?
            "0x" + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] :
            "0x" + hex[0] + hex[1] + hex[2] + hex[3] + hex[4] + hex[5];
        var hexVal = parseInt(hex_, 16);
        return "rgb" + (alpha ? "a" : "") + "(" + ((hexVal >> 16) & 255) + ", " + ((hexVal >> 8) & 255) + ", " + (hexVal & 255) + (alpha ? ", " + alpha : "") + ")";
    }
    return undefined;
}
exports.convertColorHexadecimalToRGBA = convertColorHexadecimalToRGBA;
//# sourceMappingURL=highlight.js.map