import { ISelectionInfo } from "./selection";
export interface IColor {
    red: number;
    green: number;
    blue: number;
}
export declare const HighlightDrawTypeBackground = 0;
export declare const HighlightDrawTypeUnderline = 1;
export declare const HighlightDrawTypeStrikethrough = 2;
export interface IHighlight {
    id: string;
    selectionInfo: ISelectionInfo;
    color: IColor;
    pointerInteraction: boolean;
    drawType?: number;
    expand?: number;
}
export interface IHighlightDefinition {
    selectionInfo: ISelectionInfo | undefined;
    color: IColor | undefined;
    drawType?: number;
    expand?: number;
}
export declare function convertColorHexadecimalToRGBA(cssHex: string, alpha?: number): string | undefined;
