import { Server } from "r2-streamer-js/dist/es8-es2017/src/http/server";
export declare function secureSessions(server: Server): void;
export declare function initSessions(): void;
export declare function clearSession(sess: Electron.Session, str: string): Promise<void>;
export declare function getWebViewSession(): Electron.Session;
export declare function clearWebviewSession(): Promise<void>;
export declare function clearDefaultSession(): Promise<void>;
export declare function clearSessions(): Promise<void>;
