import { EpubCfiToken } from './tokens/EpubCfiToken.js';
export declare class EpubCfiLexer {
    readonly src: string;
    private endReached;
    private nextOffset;
    private nextToken;
    private srcModified;
    constructor(src: string);
    getNextOffset(): number;
    isSrcModified(): boolean;
    next(): EpubCfiToken | undefined;
    peek(): EpubCfiToken | undefined;
    private consumeAssertionToken;
    private consumeBadStringToken;
    private consumeNumber;
    private consumeStepReference;
    private consumeValue;
    private getNextToken;
}
