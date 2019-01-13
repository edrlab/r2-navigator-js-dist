export declare function getLanguage(el: Element): string | undefined;
export declare function getDirection(el: Element): string | undefined;
export declare function normalizeText(str: string): string;
export interface ITtsQueueItem {
    dir: string | undefined;
    lang: string | undefined;
    parentElement: Element;
    textNodes: Node[];
    combinedText: string;
    combinedTextSentences: string[] | undefined;
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
export declare function findTtsQueueItemIndex(ttsQueue: ITtsQueueItem[], element: Element, rootElem: Element): number;
export declare function generateTtsQueue(rootElement: Element): ITtsQueueItem[];
export declare function wrapHighlight(doHighlight: boolean, ttsQueueItemRef: ITtsQueueItemReference, cssClassParent: string, cssClassSpan: string, _cssClassSubSpan: string, word: string | undefined, _start: number, _end: number): void;
