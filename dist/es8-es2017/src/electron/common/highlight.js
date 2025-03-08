"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighlightDrawTypeMarginBookmark = exports.HighlightDrawTypeOpacityMaskRuler = exports.HighlightDrawTypeOpacityMask = exports.HighlightDrawTypeOutline = exports.HighlightDrawTypeStrikethrough = exports.HighlightDrawTypeUnderline = exports.HighlightDrawTypeBackground = void 0;
exports.convertColorHexadecimalToRGBA = convertColorHexadecimalToRGBA;
exports.HighlightDrawTypeBackground = 0;
exports.HighlightDrawTypeUnderline = 1;
exports.HighlightDrawTypeStrikethrough = 2;
exports.HighlightDrawTypeOutline = 3;
exports.HighlightDrawTypeOpacityMask = 4;
exports.HighlightDrawTypeOpacityMaskRuler = 5;
exports.HighlightDrawTypeMarginBookmark = 6;
function convertColorHexadecimalToRGBA(cssHex, alpha) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(cssHex)) {
        const hex = cssHex.substring(1);
        const hex_ = hex.length === 3 ?
            `0x${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` :
            `0x${hex[0]}${hex[1]}${hex[2]}${hex[3]}${hex[4]}${hex[5]}`;
        const hexVal = parseInt(hex_, 16);
        return `rgb${alpha ? "a" : ""}(${(hexVal >> 16) & 255}, ${(hexVal >> 8) & 255}, ${hexVal & 255}${alpha ? `, ${alpha}` : ""})`;
    }
    return undefined;
}
//# sourceMappingURL=highlight.js.map