import { IDeviceIDManager } from "r2-lcp-js/dist/es8-es2017/src/lsd/deviceid-manager";
import { Server } from "r2-streamer-js/dist/es8-es2017/src/http/server";
export declare function doLsdReturn(publicationsServer: Server, deviceIDManager: IDeviceIDManager, publicationFilePath: string): Promise<any>;
export declare function doLsdRenew(publicationsServer: Server, deviceIDManager: IDeviceIDManager, publicationFilePath: string, endDateStr: string): Promise<any>;
