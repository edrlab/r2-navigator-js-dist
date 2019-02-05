/// <reference types="debounce" />
import { ISelectionInfo } from "../../common/selection";
import { IElectronWebviewTagWindow } from "./state";
export declare const ID_HIGHLIGHTS_CONTAINER = "R2_ID_HIGHLIGHTS_CONTAINER";
export declare const CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
export declare const CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
export declare const CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
export interface IColor {
    red: number;
    green: number;
    blue: number;
}
export declare function hideAllhighlights(_documant: Document): void;
export declare function destroyAllhighlights(documant: Document): void;
export declare function destroyHighlight(documant: Document, id: string): void;
export declare function recreateAllHighlightsRaw(win: IElectronWebviewTagWindow): void;
export declare const recreateAllHighlightsDebounced: ((win: IElectronWebviewTagWindow) => void) & {
    clear(): void;
};
export declare function recreateAllHighlights(win: IElectronWebviewTagWindow): void;
export declare function createHighlight(win: IElectronWebviewTagWindow, selectionInfo: ISelectionInfo, color: IColor | undefined, pointerInteraction: boolean): string;
