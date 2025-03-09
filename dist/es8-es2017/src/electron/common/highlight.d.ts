import { ISelectionInfo } from "./selection";
export interface IColor {
    red: number;
    green: number;
    blue: number;
}
export declare const HighlightDrawTypeBackground = 0;
export declare const HighlightDrawTypeUnderline = 1;
export declare const HighlightDrawTypeStrikethrough = 2;
export declare const HighlightDrawTypeOutline = 3;
export declare const HighlightDrawTypeOpacityMask = 4;
export declare const HighlightDrawTypeOpacityMaskRuler = 5;
export declare const HighlightDrawTypeMarginBookmark = 6;
export interface IHighlight {
    id: string;
    selectionInfo?: ISelectionInfo;
    range?: Range;
    rangeCssHighlight?: Range;
    color: IColor;
    pointerInteraction: boolean;
    drawType?: number;
    expand?: number;
    group: string | undefined;
    marginText?: string;
    textPopup?: ITextPopup;
}
export interface ITextPopup {
    text: string;
    dir?: "ltr" | "rtl";
    lang?: string;
}
export interface IHighlightDefinition {
    selectionInfo: ISelectionInfo | undefined;
    range?: Range;
    color: IColor | undefined;
    drawType?: number;
    expand?: number;
    group: string | undefined;
    marginText?: string;
    textPopup?: ITextPopup;
}
export declare function convertColorHexadecimalToRGBA(cssHex: string, alpha?: number): string | undefined;
