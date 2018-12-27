import { LocatorLocations } from "r2-shared-js/dist/es8-es2017/src/models/locator";
import { IReadiumCSS } from "./readium-css-settings";
export declare const R2_EVENT_LOCATOR_VISIBLE = "R2_EVENT_LOCATOR_VISIBLE";
export interface IEventPayload_R2_EVENT_LOCATOR_VISIBLE {
    visible: boolean;
    location: LocatorLocations;
}
export declare const R2_EVENT_READIUMCSS = "R2_EVENT_READIUMCSS";
export interface IEventPayload_R2_EVENT_READIUMCSS {
    setCSS: IReadiumCSS | undefined;
    isFixedLayout?: boolean;
    urlRoot?: string;
}
export declare const R2_EVENT_DEBUG_VISUALS = "R2_EVENT_DEBUG_VISUALS";
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
export interface IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO {
    totalColumns: number | undefined;
    currentColumn: number | undefined;
    isTwoPageSpread: boolean | undefined;
    spreadIndex: number | undefined;
}
export interface IEventPayload_R2_EVENT_READING_LOCATION extends LocatorLocations {
    paginationInfo: IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO | undefined;
}
export declare const R2_EVENT_LINK = "R2_EVENT_LINK";
export interface IEventPayload_R2_EVENT_LINK {
    url: string;
}
export declare const R2_EVENT_WEBVIEW_READY = "R2_EVENT_WEBVIEW_READY";
export interface IEventPayload_R2_EVENT_WEBVIEW_READY {
    href: string;
}
