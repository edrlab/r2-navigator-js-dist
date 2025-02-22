import { IReadiumElectronWebview } from "./webview/state";
import { IColor } from "../common/highlight";
export declare function checkTtsState(wv: IReadiumElectronWebview): void;
export declare function playTtsOnReadingLocation(href: string): void;
export declare function ttsHandleIpcMessage(eventChannel: string, _eventArgs: any[], eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare enum TTSStateEnum {
    PAUSED = "PAUSED",
    PLAYING = "PLAYING",
    STOPPED = "STOPPED"
}
export declare function ttsListen(ttsListener: (ttsState: TTSStateEnum) => void): void;
export declare function ttsPlay(speed: number, voice: SpeechSynthesisVoice[] | SpeechSynthesisVoice | null | undefined): void;
export declare function ttsPause(): void;
export declare function ttsStop(): void;
export declare function ttsResume(): void;
export declare function ttsPrevious(skipSentences: boolean, escape?: boolean): void;
export declare function ttsNext(skipSentences: boolean, escape?: boolean): void;
export declare function ttsOverlayEnable(doEnable: boolean): void;
export declare function ttsClickEnable(doEnable: boolean): void;
export declare function ttsVoices(voices: SpeechSynthesisVoice[] | null): void;
export declare function ttsVoice(voice: SpeechSynthesisVoice | null): void;
export declare function ttsPlaybackRate(speed: number): void;
export declare function ttsAndMediaOverlaysManualPlayNext(doEnable: boolean): void;
export declare function ttsSkippabilityEnable(doEnable: boolean): void;
export declare function ttsSentenceDetectionEnable(doEnable: boolean): void;
export declare function ttsHighlightStyle(ttsHighlightStyle: number, ttsHighlightColor: IColor | undefined, ttsHighlightStyle_WORD: number | undefined, ttsHighlightColor_WORD: IColor | undefined): void;
