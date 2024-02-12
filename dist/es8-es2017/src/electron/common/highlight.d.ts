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
    selectionInfo?: ISelectionInfo;
    range?: Range;
    color: IColor;
    pointerInteraction: boolean;
    drawType?: number;
    expand?: number;
    group: string | undefined;
}
export interface IHighlightDefinition {
    selectionInfo: ISelectionInfo | undefined;
    range?: Range;
    color: IColor | undefined;
    drawType?: number;
    expand?: number;
    group: string | undefined;
}
export declare function convertColorHexadecimalToRGBA(cssHex: string, alpha?: number): string | undefined;
