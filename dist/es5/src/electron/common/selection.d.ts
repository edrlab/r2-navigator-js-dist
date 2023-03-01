export interface IRangeInfo {
    startContainerElementCssSelector: string;
    startContainerElementCFI: string | undefined;
    startContainerChildTextNodeIndex: number;
    startOffset: number;
    endContainerElementCssSelector: string;
    endContainerElementCFI: string | undefined;
    endContainerChildTextNodeIndex: number;
    endOffset: number;
    cfi: string | undefined;
}
export declare function sameRanges(r1: IRangeInfo, r2: IRangeInfo): boolean;
export interface ISelectedTextInfo {
    cleanBefore: string;
    cleanText: string;
    cleanAfter: string;
    rawBefore: string;
    rawText: string;
    rawAfter: string;
}
export interface ISelectionInfo extends ISelectedTextInfo {
    rangeInfo: IRangeInfo;
}
export declare function sameSelections(sel1: ISelectionInfo, sel2: ISelectionInfo): boolean;
