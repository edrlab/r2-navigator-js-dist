import { IEventPayload_R2_EVENT_READIUMCSS } from "./events";
export declare const READIUM2_BASEURL_ID = "r2_BASEURL_ID";
export declare const CLASS_PAGINATED = "r2-css-paginated";
export declare function isDocVertical(documant: Document): boolean;
export declare function isDocRTL(documant: Document): boolean;
export declare function isPaginated(documant: Document): boolean;
export declare function readiumCSSSet(documant: Document, messageJson: IEventPayload_R2_EVENT_READIUMCSS, isVerticalWritingMode: boolean, isRTL: boolean): void;
export interface IwidthHeight {
    width: number;
    height: number;
    scale: number;
    tx: number;
    ty: number;
}
export declare function configureFixedLayout(documant: Document, isFixedLayout: boolean, fxlViewportWidth: number, fxlViewportHeight: number, innerWidth: number, innerHeight: number): IwidthHeight | undefined;
export declare function ensureHead(documant: Document): void;
export declare function appendCSSInline(documant: Document, id: string, css: string): void;
export declare function appendCSS(documant: Document, mod: string, urlRoot: string): void;
export declare function removeCSS(documant: Document, mod: string): void;
export declare function removeAllCSS(documant: Document): void;
export declare function injectDefaultCSS(documant: Document): void;
export declare function injectReadPosCSS(documant: Document): void;
export declare function transformHTML(htmlStr: string, readiumcssJson: IEventPayload_R2_EVENT_READIUMCSS | undefined, mediaType: string | undefined): string;
