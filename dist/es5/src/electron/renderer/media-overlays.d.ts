import { Publication } from "r2-shared-js/dist/es5/src/models/publication";
import { IReadiumElectronWebview } from "./webview/state";
export declare function publicationHasMediaOverlays(publication: Publication): boolean;
export declare function mediaOverlaysHandleIpcMessage(eventChannel: string, eventArgs: any[], eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare enum MediaOverlaysStateEnum {
    PAUSED = "PAUSED",
    PLAYING = "PLAYING",
    STOPPED = "STOPPED"
}
export declare function mediaOverlaysListen(mediaOverlaysListener: (mediaOverlaysState: MediaOverlaysStateEnum) => void): void;
export declare function mediaOverlaysPlay(speed: number): void;
export declare function mediaOverlaysPause(): void;
export declare function mediaOverlaysInterrupt(): void;
export declare function mediaOverlaysStop(stayActive?: boolean): void;
export declare function mediaOverlaysResume(): void;
export declare function mediaOverlaysPrevious(): void;
export declare function mediaOverlaysNext(escape?: boolean): void;
export declare function mediaOverlaysEscape(): void;
export declare function mediaOverlaysEnableCaptionsMode(captionsMode: boolean): void;
export declare function mediaOverlaysClickEnable(doEnable: boolean): void;
export declare function mediaOverlaysPlaybackRate(speed: number): void;
export declare function mediaOverlaysEnableSkippability(doEnable: boolean): void;
