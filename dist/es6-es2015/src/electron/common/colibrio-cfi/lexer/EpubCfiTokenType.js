"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiTokenType = void 0;
var EpubCfiTokenType;
(function (EpubCfiTokenType) {
    EpubCfiTokenType[EpubCfiTokenType["INVALID_END"] = -2] = "INVALID_END";
    EpubCfiTokenType[EpubCfiTokenType["BAD_TOKEN"] = -1] = "BAD_TOKEN";
    EpubCfiTokenType[EpubCfiTokenType["EPUBCFI_START"] = 0] = "EPUBCFI_START";
    EpubCfiTokenType[EpubCfiTokenType["EPUBCFI_END"] = 1] = "EPUBCFI_END";
    EpubCfiTokenType[EpubCfiTokenType["NUMBER"] = 10] = "NUMBER";
    EpubCfiTokenType[EpubCfiTokenType["STEP"] = 11] = "STEP";
    EpubCfiTokenType[EpubCfiTokenType["ASSERTION"] = 20] = "ASSERTION";
    EpubCfiTokenType[EpubCfiTokenType["VALUE"] = 30] = "VALUE";
    EpubCfiTokenType[EpubCfiTokenType["EXCLAMATION_MARK"] = 40] = "EXCLAMATION_MARK";
    EpubCfiTokenType[EpubCfiTokenType["COMMA"] = 41] = "COMMA";
    EpubCfiTokenType[EpubCfiTokenType["COLON"] = 42] = "COLON";
    EpubCfiTokenType[EpubCfiTokenType["SEMICOLON"] = 43] = "SEMICOLON";
    EpubCfiTokenType[EpubCfiTokenType["EQUAL_SIGN"] = 44] = "EQUAL_SIGN";
    EpubCfiTokenType[EpubCfiTokenType["COMMERCIAL_AT"] = 45] = "COMMERCIAL_AT";
    EpubCfiTokenType[EpubCfiTokenType["TILDE"] = 46] = "TILDE";
})(EpubCfiTokenType || (exports.EpubCfiTokenType = EpubCfiTokenType = {}));
//# sourceMappingURL=EpubCfiTokenType.js.map