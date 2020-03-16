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
export interface ISelectionInfo {
    rangeInfo: IRangeInfo;
    cleanText: string;
    rawText: string;
}
export declare function sameSelections(sel1: ISelectionInfo, sel2: ISelectionInfo): boolean;
