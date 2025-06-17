"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiLexer = void 0;
const CharCode_js_1 = require("../common/definitions/CharCode.js");
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiTokenType_js_1 = require("./EpubCfiTokenType.js");
class EpubCfiLexer {
    constructor(src) {
        this.endReached = false;
        this.src = (0, Utils_js_1.isString)(src) ? src.replace(/[^\x09\x0A\x0D\u0020-\uFFFD]/g, '') : '';
        const epubCfiStart = this.src.indexOf('epubcfi(');
        if (epubCfiStart > 0) {
            this.src = this.src.substring(epubCfiStart);
        }
        if (epubCfiStart === -1) {
            this.nextOffset = 0;
            this.endReached = true;
            this.nextToken = {
                type: EpubCfiTokenType_js_1.EpubCfiTokenType.BAD_TOKEN,
                value: this.src,
                srcOffset: 0,
            };
        }
        else {
            this.nextOffset = 8;
            this.nextToken = {
                type: EpubCfiTokenType_js_1.EpubCfiTokenType.EPUBCFI_START,
                value: 'epubcfi(',
                srcOffset: 0,
            };
        }
        this.srcModified = this.src !== src;
    }
    getNextOffset() {
        return this.nextOffset;
    }
    isSrcModified() {
        return this.srcModified;
    }
    next() {
        if (this.nextToken) {
            const nextToken = this.nextToken;
            this.nextToken = undefined;
            return nextToken;
        }
        return this.getNextToken();
    }
    peek() {
        if (!this.nextToken) {
            this.nextToken = this.getNextToken();
        }
        return this.nextToken;
    }
    consumeAssertionToken(assertionOffset) {
        let consuming = true;
        const tokens = [];
        while (consuming) {
            let token;
            const offset = this.nextOffset++;
            const charCode = this.src.charCodeAt(offset);
            if (charCode === CharCode_js_1.CharCode.COMMA) {
                token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA, ',', offset);
            }
            else if (charCode === CharCode_js_1.CharCode.SEMICOLON) {
                token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.SEMICOLON, ';', offset);
            }
            else if (charCode === CharCode_js_1.CharCode.EQUAL_SIGN) {
                token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.EQUAL_SIGN, '=', offset);
            }
            else if (charCode === CharCode_js_1.CharCode.RIGHT_SQUARE_BRACKET) {
                consuming = false;
            }
            else if (isNaN(charCode)) {
                token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.INVALID_END, '', offset);
                consuming = false;
            }
            else if (charCode === CharCode_js_1.CharCode.LEFT_SQUARE_BRACKET || charCode === CharCode_js_1.CharCode.LEFT_PARENTHESIS || charCode === CharCode_js_1.CharCode.RIGHT_PARENTHESIS) {
                token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.BAD_TOKEN, String.fromCharCode(charCode), offset);
            }
            else {
                token = this.consumeValue(offset);
            }
            if (token) {
                tokens.push(token);
            }
        }
        return createAssertionToken(tokens, assertionOffset);
    }
    consumeBadStringToken(startOffset) {
        let offset = this.nextOffset;
        while (isAsciiLetterOrNonAscii(this.src.charCodeAt(offset))) {
            offset++;
        }
        this.nextOffset = offset;
        return createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.BAD_TOKEN, this.src.substring(startOffset, offset), startOffset);
    }
    consumeNumber(offset) {
        let nextOffset = this.nextOffset;
        let charCode;
        while (isDigit(charCode = this.src.charCodeAt(nextOffset))) {
            nextOffset++;
        }
        if (charCode === CharCode_js_1.CharCode.FULL_STOP && isDigit(this.src.charCodeAt(nextOffset + 1))) {
            nextOffset += 2;
            while (isDigit(charCode = this.src.charCodeAt(nextOffset))) {
                nextOffset++;
            }
        }
        this.nextOffset = nextOffset;
        return createNumberToken(EpubCfiTokenType_js_1.EpubCfiTokenType.NUMBER, Number(this.src.substring(offset, nextOffset)), offset);
    }
    consumeStepReference(offset) {
        let nextOffset = this.nextOffset;
        const numberStartOffset = nextOffset;
        while (isDigit(this.src.charCodeAt(nextOffset))) {
            nextOffset++;
        }
        this.nextOffset = nextOffset;
        return numberStartOffset === nextOffset ?
            createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.BAD_TOKEN, '/', offset) :
            createNumberToken(EpubCfiTokenType_js_1.EpubCfiTokenType.STEP, Number(this.src.substring(numberStartOffset, nextOffset)), numberStartOffset);
    }
    consumeValue(startOffset) {
        let offset = startOffset;
        let valueStartOffset = startOffset;
        let hasSpaces = false;
        let value = '';
        let consuming = true;
        while (consuming) {
            let charCode = this.src.charCodeAt(offset);
            if (charCode === CharCode_js_1.CharCode.CIRCUMFLEX_ACCENT) {
                charCode = this.src.charCodeAt(offset + 1);
                if (isNaN(charCode)) {
                    consuming = false;
                }
                else {
                    value += this.src.substring(valueStartOffset, offset);
                    if (isHighSurrogateCharCode(charCode)) {
                        value += String.fromCharCode(charCode, this.src.charCodeAt(offset + 2));
                        offset += 3;
                    }
                    else {
                        value += String.fromCharCode(charCode);
                        offset += 2;
                    }
                    valueStartOffset = offset;
                }
            }
            else if (isInvalidValueChar(charCode) || isNaN(charCode)) {
                consuming = false;
            }
            else {
                if (charCode === CharCode_js_1.CharCode.SPACE) {
                    hasSpaces = true;
                }
                offset++;
            }
        }
        this.nextOffset = offset;
        return createValueToken(value + this.src.substring(valueStartOffset, offset), startOffset, hasSpaces);
    }
    getNextToken() {
        if (this.endReached) {
            return undefined;
        }
        const offset = this.nextOffset++;
        const charCode = this.src.charCodeAt(offset);
        let token;
        if (charCode === CharCode_js_1.CharCode.EXCLAMATION_MARK) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.EXCLAMATION_MARK, '!', offset);
        }
        else if (charCode === CharCode_js_1.CharCode.COMMA) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA, ',', offset);
        }
        else if (charCode === CharCode_js_1.CharCode.SOLIDUS) {
            token = this.consumeStepReference(offset);
        }
        else if (charCode === CharCode_js_1.CharCode.COLON) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COLON, ':', offset);
        }
        else if (charCode === CharCode_js_1.CharCode.COMMERCIAL_AT) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COMMERCIAL_AT, '@', offset);
        }
        else if (charCode === CharCode_js_1.CharCode.TILDE) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.TILDE, '~', offset);
        }
        else if (charCode === CharCode_js_1.CharCode.LEFT_SQUARE_BRACKET) {
            token = this.consumeAssertionToken(offset);
        }
        else if (charCode === CharCode_js_1.CharCode.RIGHT_PARENTHESIS) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.EPUBCFI_END, ')', offset);
            this.endReached = true;
        }
        else if (isNaN(charCode)) {
            token = createStringToken(EpubCfiTokenType_js_1.EpubCfiTokenType.INVALID_END, '', offset);
            this.endReached = true;
        }
        else if (isDigit(charCode)) {
            token = this.consumeNumber(offset);
        }
        else {
            token = this.consumeBadStringToken(offset);
        }
        return token;
    }
}
exports.EpubCfiLexer = EpubCfiLexer;
function createAssertionToken(tokens, offset) {
    return {
        type: EpubCfiTokenType_js_1.EpubCfiTokenType.ASSERTION,
        value: tokens,
        srcOffset: offset,
    };
}
function createNumberToken(type, value, offset) {
    return {
        type: type,
        value: value,
        srcOffset: offset,
    };
}
function createStringToken(type, value, offset) {
    return {
        type: type,
        value: value,
        srcOffset: offset,
    };
}
function createValueToken(value, offset, hasSpaces) {
    return {
        type: EpubCfiTokenType_js_1.EpubCfiTokenType.VALUE,
        value: value,
        srcOffset: offset,
        hasSpaces: hasSpaces,
    };
}
function isAsciiLetterOrNonAscii(charCode) {
    return charCode > CharCode_js_1.CharCode.NON_ASCII_CODE_POINT_START ||
        (charCode >= CharCode_js_1.CharCode.LOWERCASE_LETTER_A && charCode <= CharCode_js_1.CharCode.LOWERCASE_LETTER_Z) ||
        (charCode >= CharCode_js_1.CharCode.UPPERCASE_LETTER_A && charCode <= CharCode_js_1.CharCode.LOWERCASE_LETTER_A);
}
function isDigit(charCode) {
    return charCode >= CharCode_js_1.CharCode.DIGIT_0 && charCode <= CharCode_js_1.CharCode.DIGIT_9;
}
function isHighSurrogateCharCode(charCode) {
    return charCode >= CharCode_js_1.CharCode.HIGH_SURROGATE_CODE_POINT_START && charCode <= CharCode_js_1.CharCode.HIGH_SURROGATE_CODE_POINT_END;
}
function isInvalidValueChar(charCode) {
    return charCode === CharCode_js_1.CharCode.LEFT_SQUARE_BRACKET ||
        charCode === CharCode_js_1.CharCode.RIGHT_SQUARE_BRACKET ||
        charCode === CharCode_js_1.CharCode.LEFT_PARENTHESIS ||
        charCode === CharCode_js_1.CharCode.RIGHT_PARENTHESIS ||
        charCode === CharCode_js_1.CharCode.COMMA ||
        charCode === CharCode_js_1.CharCode.SEMICOLON ||
        charCode === CharCode_js_1.CharCode.EQUAL_SIGN;
}
//# sourceMappingURL=EpubCfiLexer.js.map