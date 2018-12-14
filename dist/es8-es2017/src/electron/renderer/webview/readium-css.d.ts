import { IEventPayload_R2_EVENT_READIUMCSS } from "../../common/events";
export declare const calculateMaxScrollShift: () => number;
export declare const isTwoPageSpread: () => boolean;
export declare const calculateTotalColumns: () => number;
export declare function calculateColumnDimension(): number;
export declare function isVerticalWritingMode(): boolean;
export declare function isRTL(): boolean;
export declare function computeVerticalRTL(): void;
export declare const readiumCSS: (document: Document, messageJson: IEventPayload_R2_EVENT_READIUMCSS) => void;
