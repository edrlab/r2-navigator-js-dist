import { IEventPayload_R2_EVENT_HIGHLIGHT_CLICK } from "../common/events";
import { IHighlight, IHighlightDefinition } from "../common/highlight";
import { IReadiumElectronWebview } from "./webview/state";
export declare function highlightsHandleIpcMessage(eventChannel: string, eventArgs: any[], eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare function highlightsClickListen(highlightsClickListener: (href: string, highlight: IHighlight, event?: IEventPayload_R2_EVENT_HIGHLIGHT_CLICK["event"]) => void): void;
export declare function highlightsRemoveAll(href: string, groups: string[] | undefined): void;
export declare function highlightsRemove(href: string, highlightIDs: string[]): void;
export declare function highlightsCreate(href: string, highlightDefinitions: IHighlightDefinition[] | undefined): Promise<Array<IHighlight | null>>;
export declare function highlightsDrawMargin(drawMargin: boolean | string[]): void;
