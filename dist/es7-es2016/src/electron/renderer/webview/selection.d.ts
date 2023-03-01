import { IRangeInfo, ISelectedTextInfo, ISelectionInfo } from "../../common/selection";
import { IReadiumElectronWebviewWindow } from "./state";
export declare function clearCurrentSelection(win: IReadiumElectronWebviewWindow): void;
export declare const collapseWhitespaces: (str: string) => string;
export declare const cleanupStr: (str: string) => string;
export declare function getCurrentSelectionInfo(win: IReadiumElectronWebviewWindow, getCssSelector: (element: Element) => string, computeElementCFI: (node: Node) => string | undefined): ISelectionInfo | undefined;
export declare function createOrderedRange(startNode: Node, startOffset: number, endNode: Node, endOffset: number): Range | undefined;
export declare function convertRange(range: Range, getCssSelector: (element: Element) => string, computeElementCFI: (node: Node) => string | undefined): [
    IRangeInfo,
    ISelectedTextInfo
] | undefined;
export declare function convertRangeInfo(documant: Document, rangeInfo: IRangeInfo): Range | undefined;
export declare function normalizeRange(r: Range): Range;
