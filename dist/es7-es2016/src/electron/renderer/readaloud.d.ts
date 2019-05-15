import { IReadiumElectronWebview } from "./webview/state";
export declare function ttsHandleIpcMessage(eventChannel: string, _eventArgs: any[], _eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare enum TTSStateEnum {
    PAUSED = "PAUSED",
    PLAYING = "PLAYING",
    STOPPED = "STOPPED"
}
export declare function ttsListen(ttsListener: (ttsState: TTSStateEnum) => void): void;
export declare function ttsPlay(): void;
export declare function ttsPause(): void;
export declare function ttsStop(): void;
export declare function ttsResume(): void;
export declare function ttsPrevious(): void;
export declare function ttsNext(): void;
export declare function ttsClickEnable(doEnable: boolean): void;