import { EpubCfiToken } from '../lexer/tokens/EpubCfiToken.js';
import { EpubCfiParserErrorType } from './EpubCfiParserErrorType.js';
import { IEpubCfiParserError } from './IEpubCfiParserError.js';
export declare class EpubCfiParserErrorHelper {
    static createError(errorType: EpubCfiParserErrorType, token?: EpubCfiToken | number): IEpubCfiParserError;
}
