"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiParser = void 0;
const ArrayInputStream_js_1 = require("../common/input-stream/ArrayInputStream.js");
const Utils_js_1 = require("../common/Utils.js");
const EpubCfiLexer_js_1 = require("../lexer/EpubCfiLexer.js");
const EpubCfiTokenType_js_1 = require("../lexer/EpubCfiTokenType.js");
const EpubCfiOffsetType_js_1 = require("../model/offset/EpubCfiOffsetType.js");
const EpubCfiParserErrorHelper_js_1 = require("./EpubCfiParserErrorHelper.js");
const EpubCfiParserErrorType_js_1 = require("./EpubCfiParserErrorType.js");
const MAX_NUM_VALUES_XML_ID_ASSERTION = 1;
const MAX_NUM_VALUES_TEXT_LOCATION_ASSERTION = 2;
class EpubCfiParser {
    constructor(epubCfiStr) {
        this.errors = [];
        this.lexer = new EpubCfiLexer_js_1.EpubCfiLexer(epubCfiStr);
    }
    static parse(epubCfi) {
        const parser = new EpubCfiParser(epubCfi);
        return parser.parse();
    }
    parse() {
        let parentPath = null;
        let rangeStartPath = null;
        let rangeEndPath = null;
        let nextToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.EPUBCFI_START, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_EPUBCFI_START);
        if (nextToken) {
            parentPath = this.consumePath();
            const peekedToken = this.lexer.peek();
            if (peekedToken && peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA) {
                this.lexer.next();
                rangeStartPath = this.consumePath();
                if (this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.MISSING_END_RANGE)) {
                    rangeEndPath = this.consumePath();
                }
            }
            this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.EPUBCFI_END, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_EPUBCFI_END);
        }
        return {
            srcOffset: 0,
            src: this.lexer.src,
            srcModified: this.lexer.isSrcModified(),
            parentPath: parentPath,
            rangeStartPath: rangeStartPath,
            rangeEndPath: rangeEndPath,
            errors: this.errors,
        };
    }
    consumeAssertion(assertionToken, maxNumValues) {
        const stream = new ArrayInputStream_js_1.ArrayInputStream(assertionToken.value);
        const values = [];
        let nextToken = stream.peek();
        if (nextToken) {
            if (nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.VALUE) {
                values.push(nextToken.value);
                stream.next();
                nextToken = stream.peek();
            }
            else if (nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA) {
                values.push('');
            }
            while (nextToken && nextToken.type !== EpubCfiTokenType_js_1.EpubCfiTokenType.SEMICOLON) {
                if (!this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken, stream)) {
                    return null;
                }
                const valueToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.VALUE, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken, stream);
                if (!valueToken) {
                    return null;
                }
                values.push(valueToken.value);
                nextToken = stream.peek();
            }
        }
        const parameters = this.consumeParameters(stream);
        if ((0, Utils_js_1.isNumber)(maxNumValues) && values.length > maxNumValues) {
            this.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken);
            return null;
        }
        if (values.length === 0 && parameters.length === 0) {
            this.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken);
            return null;
        }
        return createAssertion(values, parameters, assertionToken.srcOffset);
    }
    consumeCharacterOffset(colonToken) {
        const offsetToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.NUMBER, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_CHARACTER_OFFSET, colonToken);
        if (!offsetToken) {
            return null;
        }
        let assertion = null;
        const nextToken = this.lexer.peek();
        if (nextToken && nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            assertion = this.consumeAssertion(nextToken, MAX_NUM_VALUES_TEXT_LOCATION_ASSERTION);
        }
        return {
            type: EpubCfiOffsetType_js_1.EpubCfiOffsetType.CHARACTER,
            srcOffset: colonToken.srcOffset,
            characterOffset: offsetToken.value,
            assertion: assertion,
        };
    }
    consumeExpectedToken(expectedType, errorType, previousToken, stream) {
        stream = stream || this.lexer;
        const nextToken = stream.peek();
        if (!nextToken || nextToken.type !== expectedType) {
            this.createError(errorType, nextToken || createInvalidEndToken(previousToken ?
                previousToken.srcOffset :
                this.lexer.getNextOffset()));
            return;
        }
        return stream.next();
    }
    consumeLocalPaths() {
        const localPaths = [];
        let pathFinished = false;
        let peekedToken;
        let indirection = false;
        while (!pathFinished && (peekedToken = this.lexer.peek())) {
            if (peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.STEP) {
                const steps = this.consumeSteps();
                localPaths.push({
                    steps: steps,
                    indirection: indirection,
                    srcOffset: peekedToken.srcOffset,
                });
                indirection = false;
            }
            else if (peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.EXCLAMATION_MARK) {
                if (indirection) {
                    this.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_INDIRECTION, peekedToken);
                }
                indirection = true;
                this.lexer.next();
            }
            else {
                pathFinished = true;
            }
        }
        if (indirection && peekedToken) {
            localPaths.push({
                steps: [],
                indirection: true,
                srcOffset: peekedToken.srcOffset,
            });
        }
        return localPaths;
    }
    consumeOffset() {
        let offset = null;
        const nextToken = this.lexer.peek();
        if (nextToken) {
            if (nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.TILDE) {
                this.lexer.next();
                offset = this.consumeTemporalOffset(nextToken);
            }
            else if (nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.COMMERCIAL_AT) {
                this.lexer.next();
                offset = this.consumeSpatialOffset(nextToken);
            }
            else if (nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.COLON) {
                this.lexer.next();
                offset = this.consumeCharacterOffset(nextToken);
            }
        }
        return offset;
    }
    consumeParameter(stream) {
        const semiColonToken = stream.next();
        const errorType = EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_PARAMETER;
        if (!semiColonToken) {
            return null;
        }
        if (semiColonToken.type !== EpubCfiTokenType_js_1.EpubCfiTokenType.SEMICOLON) {
            this.createError(errorType, semiColonToken);
            return null;
        }
        const nameToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.VALUE, errorType, semiColonToken, stream);
        if (!nameToken) {
            return null;
        }
        if (nameToken.hasSpaces) {
            this.createError(errorType, nameToken);
            return null;
        }
        const equalSignToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.EQUAL_SIGN, errorType, nameToken, stream);
        if (!equalSignToken) {
            return null;
        }
        let valueToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.VALUE, errorType, semiColonToken, stream);
        if (!valueToken) {
            return null;
        }
        const values = [valueToken.value];
        let nextToken;
        while ((nextToken = stream.peek()) && nextToken.type !== EpubCfiTokenType_js_1.EpubCfiTokenType.SEMICOLON) {
            stream.next();
            if (nextToken.type !== EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA) {
                this.createError(errorType, nextToken);
            }
            else {
                valueToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.VALUE, errorType, nextToken, stream);
                if (valueToken) {
                    values.push(valueToken.value);
                }
            }
        }
        return {
            srcOffset: semiColonToken.srcOffset,
            name: nameToken.value,
            values: values,
        };
    }
    consumeParameters(stream) {
        const parameters = [];
        while (stream.peek()) {
            const parameter = this.consumeParameter(stream);
            if (parameter) {
                parameters.push(parameter);
            }
        }
        return parameters;
    }
    consumePath() {
        const srcOffset = this.lexer.getNextOffset();
        let localPaths = [];
        let offset = null;
        let peekedToken = this.lexer.peek();
        if (peekedToken && (peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.STEP || peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.EXCLAMATION_MARK)) {
            localPaths = this.consumeLocalPaths();
            peekedToken = this.lexer.peek();
        }
        if (peekedToken && isOffsetTokenType(peekedToken.type)) {
            offset = this.consumeOffset();
            peekedToken = this.lexer.peek();
        }
        return {
            offset: offset,
            localPaths: localPaths,
            srcOffset: srcOffset,
            complete: !!peekedToken && (peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.COMMA || peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.EPUBCFI_END),
        };
    }
    consumeSpatialOffset(atToken) {
        const errorType = EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET;
        const xToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.NUMBER, errorType, atToken);
        if (!xToken) {
            return null;
        }
        let x = xToken.value;
        if (x < 0 || x > 100) {
            this.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET_VALUE, xToken);
            x = (0, Utils_js_1.clamp)(x, 0, 100);
        }
        const colonToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.COLON, errorType, xToken);
        if (!colonToken) {
            return null;
        }
        const yToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.NUMBER, errorType, colonToken);
        if (!yToken) {
            return null;
        }
        let y = yToken.value;
        if (y < 0 || y > 100) {
            this.createError(EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET_VALUE, yToken);
            y = (0, Utils_js_1.clamp)(y, 0, 100);
        }
        const nextToken = this.lexer.peek();
        let assertion = null;
        if (nextToken && nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            assertion = this.consumeAssertion(nextToken, 0);
        }
        return {
            type: EpubCfiOffsetType_js_1.EpubCfiOffsetType.SPATIAL,
            srcOffset: atToken.srcOffset,
            assertion: assertion,
            x: x,
            y: y,
        };
    }
    consumeStep(stepToken) {
        const isElementStep = stepToken.value % 2 === 0;
        const srcOffset = stepToken ? stepToken.srcOffset : this.lexer.getNextOffset();
        let assertion = null;
        const nextToken = this.lexer.peek();
        if (nextToken && nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            if (isElementStep) {
                assertion = this.consumeAssertion(nextToken, MAX_NUM_VALUES_XML_ID_ASSERTION);
            }
            else {
                assertion = this.consumeAssertion(nextToken, 0);
            }
        }
        return {
            srcOffset: srcOffset,
            stepValue: stepToken.value,
            assertion: assertion,
        };
    }
    consumeSteps() {
        let peekedToken;
        const steps = [];
        while ((peekedToken = this.lexer.peek()) && peekedToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.STEP) {
            this.lexer.next();
            const step = this.consumeStep(peekedToken);
            steps.push(step);
        }
        return steps;
    }
    consumeTemporalOffset(tildeToken) {
        const secondsToken = this.consumeExpectedToken(EpubCfiTokenType_js_1.EpubCfiTokenType.NUMBER, EpubCfiParserErrorType_js_1.EpubCfiParserErrorType.INVALID_TEMPORAL_OFFSET, tildeToken);
        if (!secondsToken) {
            return null;
        }
        let nextToken = this.lexer.peek();
        let spatialOffset = null;
        let assertion = null;
        if (nextToken && nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.COMMERCIAL_AT) {
            this.lexer.next();
            spatialOffset = this.consumeSpatialOffset(nextToken);
            if (spatialOffset) {
                assertion = spatialOffset.assertion;
            }
            nextToken = this.lexer.peek();
        }
        if (!assertion && nextToken && nextToken.type === EpubCfiTokenType_js_1.EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            assertion = this.consumeAssertion(nextToken, 0);
        }
        return {
            type: EpubCfiOffsetType_js_1.EpubCfiOffsetType.TEMPORAL,
            srcOffset: tildeToken.srcOffset,
            assertion: assertion,
            seconds: secondsToken.value,
            x: spatialOffset ? spatialOffset.x : null,
            y: spatialOffset ? spatialOffset.y : null,
        };
    }
    createError(errorType, token) {
        this.errors.push(EpubCfiParserErrorHelper_js_1.EpubCfiParserErrorHelper.createError(errorType, token));
    }
}
exports.EpubCfiParser = EpubCfiParser;
function createInvalidEndToken(srcOffset) {
    return {
        type: EpubCfiTokenType_js_1.EpubCfiTokenType.INVALID_END,
        value: '',
        srcOffset: srcOffset,
    };
}
function isOffsetTokenType(tokenType) {
    return tokenType === EpubCfiTokenType_js_1.EpubCfiTokenType.TILDE ||
        tokenType === EpubCfiTokenType_js_1.EpubCfiTokenType.COMMERCIAL_AT ||
        tokenType === EpubCfiTokenType_js_1.EpubCfiTokenType.COLON;
}
function createAssertion(values, parameters, srcOffset) {
    return {
        values: values,
        parameters: parameters,
        srcOffset: srcOffset,
    };
}
//# sourceMappingURL=EpubCfiParser.js.map