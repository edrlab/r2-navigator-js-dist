import { Server } from "r2-streamer-js/dist/es8-es2017/src/http/server";
import { IDeviceIDManager } from "./lsd-deviceid-manager";
export declare function installLcpHandler(publicationsServer: Server, deviceIDManager: IDeviceIDManager): void;
export declare function downloadFromLCPL(filePath: string, dir: string, destFileName: string): Promise<string[]>;
