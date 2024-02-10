import * as debounce from "debounce";
import { IColor, IHighlight, IHighlightDefinition } from "../../common/highlight";
import { ISelectionInfo } from "../../common/selection";
import { ReadiumElectronWebviewWindow } from "./state";
export declare const CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
export declare const CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
export declare const CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
export declare const CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN";
export declare function getBoundingClientRectOfDocumentBody(win: ReadiumElectronWebviewWindow): DOMRect;
export declare function hideAllhighlights(_documant: Document): void;
export declare function destroyAllhighlights(documant: Document): void;
export declare function destroyHighlight(documant: Document, id: string): void;
export declare function recreateAllHighlightsRaw(win: ReadiumElectronWebviewWindow): void;
export declare const recreateAllHighlightsDebounced: debounce.DebouncedFunction<(win: ReadiumElectronWebviewWindow) => void>;
export declare function recreateAllHighlights(win: ReadiumElectronWebviewWindow): void;
export declare function createHighlights(win: ReadiumElectronWebviewWindow, highDefs: IHighlightDefinition[], pointerInteraction: boolean): Array<IHighlight | null>;
export declare function createHighlight(win: ReadiumElectronWebviewWindow, selectionInfo: ISelectionInfo | undefined, range: Range | undefined, color: IColor | undefined, pointerInteraction: boolean, drawType: number | undefined, expand: number | undefined, bodyRect: DOMRect, bodyWidth: number): [IHighlight, HTMLDivElement | null];
