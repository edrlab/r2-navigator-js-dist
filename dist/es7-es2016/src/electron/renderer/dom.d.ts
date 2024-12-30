import { Locator } from "../common/locator";
import { Publication } from "r2-shared-js/dist/es7-es2016/src/models/publication";
import { IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_READIUMCSS, IKeyboardEvent } from "../common/events";
export declare function fixedLayoutZoomPercent(zoomPercent: number): void;
export declare function readiumCssOnOff(rcss?: IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function readiumCssUpdate(rcss: IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function installNavigatorDOM(publication: Publication, publicationURL: string, rootHtmlElementID: string, preloadScriptPath: string, location: Locator | undefined, enableScreenReaderAccessibilityWebViewHardRefresh: boolean, clipboardInterceptor: ((data: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => void) | undefined, sessionInfo: string | undefined, rcss: IEventPayload_R2_EVENT_READIUMCSS | undefined): void;
export declare function setKeyDownEventHandler(func: (ev: IKeyboardEvent, elementName: string, elementAttributes: {
    [name: string]: string;
}) => void): void;
export declare function setKeyUpEventHandler(func: (ev: IKeyboardEvent, elementName: string, elementAttributes: {
    [name: string]: string;
}) => void): void;
