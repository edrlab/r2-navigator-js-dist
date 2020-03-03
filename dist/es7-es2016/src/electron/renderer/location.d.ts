import { Locator } from "r2-shared-js/dist/es7-es2016/src/models/locator";
import { IAudioPlaybackInfo } from "../common/audiobook";
import { IDocInfo } from "../common/document";
import { IPaginationInfo } from "../common/pagination";
import { ISelectionInfo } from "../common/selection";
import { IReadiumElectronWebview } from "./webview/state";
export declare function locationHandleIpcMessage(eventChannel: string, eventArgs: any[], eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare function shiftWebview(webview: IReadiumElectronWebview, offset: number, backgroundColor: string | undefined): void;
export declare function navLeftOrRight(left: boolean, spineNav?: boolean): void;
export declare function handleLink(href: string, previous: boolean | undefined, useGoto: boolean): void;
export declare function handleLinkUrl(href: string): void;
export declare function handleLinkLocator(location: Locator | undefined): void;
export declare function reloadContent(): void;
export interface LocatorExtended {
    audioPlaybackInfo: IAudioPlaybackInfo | undefined;
    locator: Locator;
    paginationInfo: IPaginationInfo | undefined;
    selectionInfo: ISelectionInfo | undefined;
    selectionIsNew: boolean | undefined;
    docInfo: IDocInfo | undefined;
    epubPage: string | undefined;
}
export declare function getCurrentReadingLocation(): LocatorExtended | undefined;
export declare function setReadingLocationSaver(func: (locator: LocatorExtended) => void): void;
export declare function isLocatorVisible(locator: Locator): Promise<boolean>;
