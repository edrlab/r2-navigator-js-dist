import { Locator } from "r2-shared-js/dist/es8-es2017/src/models/locator";
import { Publication } from "r2-shared-js/dist/es8-es2017/src/models/publication";
import { IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_READIUMCSS, IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, IEventPayload_R2_EVENT_WEBVIEW_KEYUP } from "../common/events";
export declare function readiumCssOnOff(rss?: IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function readiumCssUpdate(rss: IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function installNavigatorDOM(publication: Publication, publicationURL: string, rootHtmlElementID: string, preloadScriptPath: string, location: Locator | undefined, enableScreenReaderAccessibilityWebViewHardRefresh: boolean, clipboardInterceptor: ((data: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => void) | undefined, sessionInfo: string | undefined): void;
export declare function setKeyDownEventHandler(func: (ev: IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN) => void): void;
export declare function setKeyUpEventHandler(func: (ev: IEventPayload_R2_EVENT_WEBVIEW_KEYUP) => void): void;
