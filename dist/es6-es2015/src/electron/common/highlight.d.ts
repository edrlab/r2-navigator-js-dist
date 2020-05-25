import { ISelectionInfo } from "./selection";
export interface IColor {
    red: number;
    green: number;
    blue: number;
}
export interface IHighlight {
    id: string;
    selectionInfo: ISelectionInfo;
    color: IColor;
    pointerInteraction: boolean;
    drawType?: number;
}
export interface IHighlightDefinition {
    selectionInfo: ISelectionInfo | undefined;
    color: IColor | undefined;
    drawType?: number;
}
export declare function convertColorHexadecimalToRGBA(cssHex: string, alpha?: number): string | undefined;
