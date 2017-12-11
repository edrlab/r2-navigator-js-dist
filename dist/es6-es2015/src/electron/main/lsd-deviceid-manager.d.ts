import { IStore } from "../common/store";
export declare const electronStoreLSD: IStore;
export interface IDeviceIDManager {
    getDeviceNAME(): string;
    getDeviceID(): string;
    checkDeviceID(key: string): string | undefined;
    recordDeviceID(key: string): void;
}
export declare const deviceIDManager: IDeviceIDManager;
