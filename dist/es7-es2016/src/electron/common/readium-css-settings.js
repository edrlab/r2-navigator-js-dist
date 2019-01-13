"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bodyHyphensEnum;
(function (bodyHyphensEnum) {
    bodyHyphensEnum["auto"] = "auto";
    bodyHyphensEnum["none"] = "none";
})(bodyHyphensEnum = exports.bodyHyphensEnum || (exports.bodyHyphensEnum = {}));
var colCountEnum;
(function (colCountEnum) {
    colCountEnum["auto"] = "auto";
    colCountEnum["one"] = "1";
    colCountEnum["two"] = "2";
})(colCountEnum = exports.colCountEnum || (exports.colCountEnum = {}));
var ligaturesEnum;
(function (ligaturesEnum) {
    ligaturesEnum["none"] = "none";
    ligaturesEnum["common_ligatures"] = "common-ligatures";
})(ligaturesEnum = exports.ligaturesEnum || (exports.ligaturesEnum = {}));
var textAlignEnum;
(function (textAlignEnum) {
    textAlignEnum["left"] = "left";
    textAlignEnum["right"] = "right";
    textAlignEnum["justify"] = "justify";
    textAlignEnum["start"] = "start";
})(textAlignEnum = exports.textAlignEnum || (exports.textAlignEnum = {}));
var fontEnum;
(function (fontEnum) {
    fontEnum["DEFAULT"] = "DEFAULT";
    fontEnum["DUO"] = "DUO";
    fontEnum["DYS"] = "DYS";
    fontEnum["OLD"] = "OLD";
    fontEnum["MODERN"] = "MODERN";
    fontEnum["SANS"] = "SANS";
    fontEnum["HUMAN"] = "HUMAN";
    fontEnum["MONO"] = "MONO";
    fontEnum["JA"] = "JA";
    fontEnum["JA_SANS"] = "JA-SANS";
    fontEnum["JA_V"] = "JA-V";
    fontEnum["JA_V_SANS"] = "JA-V-SANS";
})(fontEnum = exports.fontEnum || (exports.fontEnum = {}));
exports.readiumCSSDefaults = {
    a11yNormalize: false,
    backgroundColor: undefined,
    bodyHyphens: bodyHyphensEnum.auto,
    colCount: colCountEnum.auto,
    darken: false,
    font: fontEnum.DEFAULT,
    fontSize: "100%",
    invert: false,
    letterSpacing: undefined,
    ligatures: ligaturesEnum.none,
    lineHeight: undefined,
    night: false,
    noFootnotes: false,
    pageMargins: undefined,
    paged: false,
    paraIndent: undefined,
    paraSpacing: undefined,
    sepia: false,
    textAlign: textAlignEnum.start,
    textColor: undefined,
    typeScale: undefined,
    wordSpacing: undefined,
};
exports.READIUM_CSS_URL_PATH = "readium-css";
//# sourceMappingURL=readium-css-settings.js.map