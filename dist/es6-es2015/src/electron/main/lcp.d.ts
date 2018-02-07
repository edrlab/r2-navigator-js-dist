import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";
export declare function doTryLcpPass(publicationsServer: Server, publicationFilePath: string, lcpPasses: string[], isSha256Hex: boolean): Promise<void | {}>;
