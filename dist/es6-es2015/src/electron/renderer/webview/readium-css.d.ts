import { IEventPayload_R2_EVENT_READIUMCSS } from "../../common/events";
export declare const clearImageZoomOutlineDebounced: (() => void) & {
    clear(): void;
};
export declare const clearImageZoomOutline: () => void;
export declare const getScrollingElement: (documant: Document) => Element;
export declare const calculateMaxScrollShift: () => {
    maxScrollShift: number;
    maxScrollShiftAdjusted: number;
};
export declare const isTwoPageSpread: () => boolean;
export declare const calculateTotalColumns: () => number;
export declare function calculateColumnDimension(): number;
export declare function isVerticalWritingMode(): boolean;
export declare function isRTL(): boolean;
export declare function computeVerticalRTL(): void;
export declare function checkHiddenFootNotes(documant: Document): void;
export declare const readiumCSS: (documant: Document, messageJson: IEventPayload_R2_EVENT_READIUMCSS) => void;
