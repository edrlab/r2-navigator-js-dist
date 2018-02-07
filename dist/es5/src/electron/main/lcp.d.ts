import { Server } from "@r2-streamer-js/http/server";
export declare function doTryLcpPass(publicationsServer: Server, publicationFilePath: string, lcpPasses: string[], isSha256Hex: boolean): Promise<void | {}>;
