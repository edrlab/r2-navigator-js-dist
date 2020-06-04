import { IColor, IHighlight, IHighlightDefinition } from "../../common/highlight";
import { ISelectionInfo } from "../../common/selection";
import { IReadiumElectronWebviewWindow } from "./state";
export declare const ID_HIGHLIGHTS_CONTAINER = "R2_ID_HIGHLIGHTS_CONTAINER";
export declare const CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
export declare const CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
export declare const CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
export declare function getBoundingClientRectOfDocumentBody(win: IReadiumElectronWebviewWindow): DOMRect;
export declare function hideAllhighlights(_documant: Document): void;
export declare function destroyAllhighlights(documant: Document): void;
export declare function destroyHighlight(documant: Document, id: string): void;
export declare function recreateAllHighlightsRaw(win: IReadiumElectronWebviewWindow): void;
export declare const recreateAllHighlightsDebounced: ((win: IReadiumElectronWebviewWindow) => void) & {
    clear(): void;
};
export declare function recreateAllHighlights(win: IReadiumElectronWebviewWindow): void;
export declare function createHighlights(win: IReadiumElectronWebviewWindow, highDefs: IHighlightDefinition[], pointerInteraction: boolean): Array<IHighlight | null>;
export declare function createHighlight(win: IReadiumElectronWebviewWindow, selectionInfo: ISelectionInfo, color: IColor | undefined, pointerInteraction: boolean, drawType: number | undefined, expand: number | undefined, bodyRect: DOMRect): [IHighlight, HTMLDivElement | null];
