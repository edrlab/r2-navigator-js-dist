import { Locator } from "r2-shared-js/dist/es7-es2016/src/models/locator";
import { Publication } from "r2-shared-js/dist/es7-es2016/src/models/publication";
import { IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN } from "../common/events";
export declare function readiumCssOnOff(): void;
export declare function installNavigatorDOM(publication: Publication, publicationURL: string, rootHtmlElementID: string, preloadScriptPath: string, location: Locator | undefined): void;
export declare function setKeyDownEventHandler(func: (ev: IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN) => void): void;
