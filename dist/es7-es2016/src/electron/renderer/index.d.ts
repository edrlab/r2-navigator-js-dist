import { Locator } from "r2-shared-js/dist/es7-es2016/src/models/locator";
import { Publication } from "r2-shared-js/dist/es7-es2016/src/models/publication";
import { Link } from "r2-shared-js/dist/es7-es2016/src/models/publication-link";
import { IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO, IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
import { INameVersion } from "./webview/epubReadingSystem";
export declare function setEpubReadingSystemInfo(nv: INameVersion): void;
export declare function __computeReadiumCssJsonMessage(link: Link | undefined): IEventPayload_R2_EVENT_READIUMCSS;
export declare function setReadiumCssJsonGetter(func: () => IEventPayload_R2_EVENT_READIUMCSS): void;
export interface LocatorExtended {
    locator: Locator;
    paginationInfo: IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO | undefined;
}
export declare function getCurrentReadingLocation(): LocatorExtended | undefined;
export declare function setReadingLocationSaver(func: (locator: LocatorExtended) => void): void;
export declare function readiumCssOnOff(): void;
export declare function isLocatorVisible(locator: Locator): Promise<boolean>;
export declare function handleLink(href: string, previous: boolean | undefined, useGoto: boolean): void;
export declare function handleLinkUrl(href: string): void;
export declare function handleLinkLocator(location: Locator | undefined): void;
export declare function installNavigatorDOM(publication: Publication, publicationJsonUrl: string, rootHtmlElementID: string, preloadScriptPath: string, location: Locator | undefined): void;
export declare function navLeftOrRight(left: boolean): void;
