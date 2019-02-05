export interface IRangeInfo {
    startContainerElementCssSelector: string;
    startContainerChildTextNodeIndex: number;
    startOffset: number;
    endContainerElementCssSelector: string;
    endContainerChildTextNodeIndex: number;
    endOffset: number;
    cfi: string | undefined;
}
export interface ISelectionInfo {
    rangeInfo: IRangeInfo;
    cleanText: string;
    rawText: string;
}
