import { IEventPayload_R2_EVENT_READIUMCSS } from "./events";
export declare const DEBUG_VISUALS = false;
export declare function isDocVertical(document: Document): boolean;
export declare function isDocRTL(document: Document): boolean;
export declare function isPaginated(document: Document): boolean;
export declare function readiumCSSSet(document: Document, messageJson: IEventPayload_R2_EVENT_READIUMCSS, urlRootReadiumCSS: string | undefined, isVerticalWritingMode: boolean, isRTL: boolean): void;
export interface IwidthHeight {
    width: number;
    height: number;
}
export declare function configureFixedLayout(document: Document, isFixedLayout: boolean, fxlViewportWidth: number, fxlViewportHeight: number, innerWidth: number, innerHeight: number): IwidthHeight | undefined;
export declare function ensureHead(document: Document): void;
export declare function appendCSSInline(document: Document, id: string, css: string): void;
export declare function appendCSS(document: Document, mod: string, urlRoot: string): void;
export declare function removeCSS(document: Document, mod: string): void;
export declare function removeAllCSS(document: Document): void;
export declare function injectDefaultCSS(document: Document): void;
export declare function injectReadPosCSS(document: Document): void;
export declare function transformHTML(htmlStr: string, readiumcssJson: IEventPayload_R2_EVENT_READIUMCSS | undefined, mediaType: string | undefined): string;
