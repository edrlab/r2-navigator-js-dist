import { IEventPayload_R2_EVENT_READIUMCSS } from "../../common/events";
export declare const DEBUG_VISUALS: boolean;
export declare const configureFixedLayout: (isFixedLayout: boolean) => void;
export declare const injectDefaultCSS: () => void;
export declare const injectReadPosCSS: () => void;
export declare function isVerticalWritingMode(): boolean;
export declare function isRTL(): boolean;
export declare const readiumCSS: (messageJson: IEventPayload_R2_EVENT_READIUMCSS) => void;
