import { IHighlight, IHighlightDefinition } from "../common/highlight";
import { IReadiumElectronWebview } from "./webview/state";
export declare function highlightsHandleIpcMessage(eventChannel: string, eventArgs: any[], eventCurrentTarget: IReadiumElectronWebview): boolean;
export declare function highlightsClickListen(highlightsClickListener: (href: string, highlight: IHighlight) => void): void;
export declare function highlightsRemoveAll(href: string, groups: string[] | undefined): void;
export declare function highlightsRemove(href: string, highlightIDs: string[]): void;
export declare function highlightsCreate(href: string, highlightDefinitions: IHighlightDefinition[] | undefined): Promise<Array<IHighlight | null>>;
