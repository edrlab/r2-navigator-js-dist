export declare const R2_EVENT_READIUMCSS = "R2_EVENT_READIUMCSS";
export interface IEventPayload_R2_EVENT_READIUMCSS {
    injectCSS: string;
    setCSS: string | {
        align: string;
        colCount: string;
        dark: boolean;
        font: string;
        fontSize: string;
        invert: boolean;
        lineHeight: string;
        night: boolean;
        paged: boolean;
        sepia: boolean;
    };
    isFixedLayout?: boolean;
    urlRoot?: string;
}
export declare const R2_EVENT_SCROLLTO = "R2_EVENT_SCROLLTO";
export interface IEventPayload_R2_EVENT_SCROLLTO {
    goto: string | undefined;
    hash: string | undefined;
    previous: boolean;
}
export declare const R2_EVENT_PAGE_TURN = "R2_EVENT_PAGE_TURN";
export declare const R2_EVENT_PAGE_TURN_RES = "R2_EVENT_PAGE_TURN_RES";
export interface IEventPayload_R2_EVENT_PAGE_TURN {
    direction: string;
    go: string;
}
export declare const R2_EVENT_READING_LOCATION = "R2_EVENT_READING_LOCATION";
export interface IEventPayload_R2_EVENT_READING_LOCATION {
    cssSelector: string;
}
export declare const R2_EVENT_LINK = "R2_EVENT_LINK";
export interface IEventPayload_R2_EVENT_LINK {
    url: string;
}
export declare const R2_EVENT_WEBVIEW_READY = "R2_EVENT_WEBVIEW_READY";
export interface IEventPayload_R2_EVENT_WEBVIEW_READY {
    href: string;
}
