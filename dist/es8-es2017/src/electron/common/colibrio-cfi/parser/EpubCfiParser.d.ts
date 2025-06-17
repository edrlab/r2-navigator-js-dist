import { IEpubCfiRootNode } from '../model/IEpubCfiRootNode.js';
export declare class EpubCfiParser {
    private readonly errors;
    private readonly lexer;
    constructor(epubCfiStr: string);
    static parse(epubCfi: string): IEpubCfiRootNode;
    parse(): IEpubCfiRootNode;
    private consumeAssertion;
    private consumeCharacterOffset;
    private consumeExpectedToken;
    private consumeLocalPaths;
    private consumeOffset;
    private consumeParameter;
    private consumeParameters;
    private consumePath;
    private consumeSpatialOffset;
    private consumeStep;
    private consumeSteps;
    private consumeTemporalOffset;
    private createError;
}
