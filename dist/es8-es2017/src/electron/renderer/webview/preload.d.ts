import { IPaginationInfo } from "../../common/pagination";
interface IProgressionData {
    percentRatio: number;
    paginationInfo: IPaginationInfo | undefined;
}
export declare const computeProgressionData: () => IProgressionData;
export declare const computeCFI: (node: Node) => string | undefined;
export {};
