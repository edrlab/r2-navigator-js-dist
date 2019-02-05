export declare function ttsPlay(focusScrollRaw: (el: HTMLOrSVGElement, doFocus: boolean) => void, rootElem: Element | undefined, startElem: Element | undefined, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: () => number, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: (val: number) => void): void;
export declare function ttsStop(): void;
export declare function ttsPause(): void;
export declare function ttsResume(): void;
export declare function isTtsPlaying(): boolean;
export declare function isTtsActive(): boolean;
export declare function ttsPauseOrResume(): void;
export declare function ttsQueueSize(): number;
export declare function ttsQueueCurrentIndex(): number;
export declare function ttsQueueCurrentText(): string | undefined;
export declare function ttsNext(): void;
export declare function ttsPrevious(): void;
export declare function ttsPreviewAndEventuallyPlayQueueIndex(n: number): void;
export declare function ttsPlayQueueIndex(ttsQueueIndex: number): void;
