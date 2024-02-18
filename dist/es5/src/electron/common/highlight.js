"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertColorHexadecimalToRGBA = exports.HighlightDrawTypeOutline = exports.HighlightDrawTypeStrikethrough = exports.HighlightDrawTypeUnderline = exports.HighlightDrawTypeBackground = void 0;
exports.HighlightDrawTypeBackground = 0;
exports.HighlightDrawTypeUnderline = 1;
exports.HighlightDrawTypeStrikethrough = 2;
exports.HighlightDrawTypeOutline = 3;
function convertColorHexadecimalToRGBA(cssHex, alpha) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(cssHex)) {
        var hex = cssHex.substring(1);
        var hex_ = hex.length === 3 ?
            "0x".concat(hex[0]).concat(hex[0]).concat(hex[1]).concat(hex[1]).concat(hex[2]).concat(hex[2]) :
            "0x".concat(hex[0]).concat(hex[1]).concat(hex[2]).concat(hex[3]).concat(hex[4]).concat(hex[5]);
        var hexVal = parseInt(hex_, 16);
        return "rgb".concat(alpha ? "a" : "", "(").concat((hexVal >> 16) & 255, ", ").concat((hexVal >> 8) & 255, ", ").concat(hexVal & 255).concat(alpha ? ", ".concat(alpha) : "", ")");
    }
    return undefined;
}
exports.convertColorHexadecimalToRGBA = convertColorHexadecimalToRGBA;
//# sourceMappingURL=highlight.js.map