export declare function combineTextNodes(textNodes: Node[], skipNormalize?: boolean): string;
export declare function getLanguage(el: Element): string | undefined;
export declare function getDirection(el: Element): string | undefined;
export declare function normalizeHtmlText(str: string): string;
export declare function normalizeText(str: string): string;
export interface ITtsQueueItem {
    dir: string | undefined;
    lang: string | undefined;
    parentElement: Element;
    textNodes: Node[];
    combinedText: string;
    combinedTextSentences: string[] | undefined;
    combinedTextSentencesRangeBegin: number[] | undefined;
    combinedTextSentencesRangeEnd: number[] | undefined;
}
export interface ITtsQueueItemReference {
    item: ITtsQueueItem;
    iArray: number;
    iSentence: number;
    iGlobal: number;
}
export declare function consoleLogTtsQueueItem(i: ITtsQueueItem): void;
export declare function consoleLogTtsQueue(f: ITtsQueueItem[]): void;
export declare function getTtsQueueLength(items: ITtsQueueItem[]): number;
export declare function getTtsQueueItemRefText(obj: ITtsQueueItemReference): string;
export declare function getTtsQueueItemRef(items: ITtsQueueItem[], index: number): ITtsQueueItemReference | undefined;
export declare function findTtsQueueItemIndex(ttsQueue: ITtsQueueItem[], element: Element, startTextNode: Node | undefined, startTextNodeOffset: number, rootElem: Element): number;
export declare function generateTtsQueue(rootElement: Element, splitSentences: boolean): ITtsQueueItem[];
