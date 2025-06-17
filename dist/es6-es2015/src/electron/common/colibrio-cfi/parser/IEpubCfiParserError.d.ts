import { EpubCfiParserErrorType } from './EpubCfiParserErrorType.js';
export interface IEpubCfiParserError {
    srcOffset: number | undefined;
    type: EpubCfiParserErrorType;
    value: string;
}
