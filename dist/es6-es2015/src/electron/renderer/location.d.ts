import { Locator } from "r2-shared-js/dist/es6-es2015/src/models/locator";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import { IAudioPlaybackInfo } from "../common/audiobook";
import { IDocInfo } from "../common/document";
import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
import { IwidthHeight } from "../common/fxl";
import { IPaginationInfo } from "../common/pagination";
import { IRangeInfo, ISelectionInfo } from "../common/selection";
import { WebViewSlotEnum } from "../common/styles";
import { IReadiumElectronWebview } from "./webview/state";
export declare function setWebViewStyle(wv: IReadiumElectronWebview, wvSlot: WebViewSlotEnum, fxl?: IwidthHeight | null): void;
export declare function locationHandleIpcMessage(eventChannel: string, eventArgs: any[], eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare function shiftWebview(webview: IReadiumElectronWebview, offset: number, backgroundColor: string | undefined): void;
export declare function navLeftOrRight(left: boolean, spineNav?: boolean, ignorePageSpreadHandling?: boolean): Link | undefined;
export declare function handleLink(href: string, previous: boolean | undefined, useGoto: boolean, rcss?: IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function handleLinkUrl(href: string, rcss?: IEventPayload_R2_EVENT_READIUMCSS): void;
export declare function handleLinkLocator(location: Locator | undefined, rcss?: IEventPayload_R2_EVENT_READIUMCSS, rangeInfo?: IRangeInfo): void;
export declare function reloadContent(): void;
export interface LocatorExtended {
    audioPlaybackInfo: IAudioPlaybackInfo | undefined;
    locator: Locator;
    paginationInfo: IPaginationInfo | undefined;
    selectionInfo: ISelectionInfo | undefined;
    selectionIsNew: boolean | undefined;
    docInfo: IDocInfo | undefined;
    epubPage: string | undefined;
    headings: Array<{
        id: string | undefined;
        txt: string | undefined;
        level: number;
    }> | undefined;
    secondWebViewHref: string | undefined;
}
export declare function getCurrentReadingLocation(): LocatorExtended | undefined;
export declare function setReadingLocationSaver(func: (locator: LocatorExtended) => void): void;
export declare function isLocatorVisible(locator: Locator): Promise<boolean>;
