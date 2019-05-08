import { IRangeInfo, ISelectionInfo } from "../../common/selection";
import { IReadiumElectronWebviewWindow } from "./state";
export declare function clearCurrentSelection(win: IReadiumElectronWebviewWindow): void;
export declare function getCurrentSelectionInfo(win: IReadiumElectronWebviewWindow, getCssSelector: (element: Element) => string, computeElementCFI: (node: Node) => string | undefined): ISelectionInfo | undefined;
export declare function createOrderedRange(startNode: Node, startOffset: number, endNode: Node, endOffset: number): Range | undefined;
export declare function convertRange(range: Range, getCssSelector: (element: Element) => string, computeElementCFI: (node: Node) => string | undefined): IRangeInfo | undefined;
export declare function convertRangeInfo(documant: Document, rangeInfo: IRangeInfo): Range | undefined;
