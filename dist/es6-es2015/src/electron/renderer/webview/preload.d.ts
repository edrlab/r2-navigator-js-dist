import { IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO } from "../../common/events";
interface IProgressionData {
    percentRatio: number;
    paginationInfo: IEventPayload_R2_EVENT_READING_LOCATION_PAGINATION_INFO | undefined;
}
export declare const computeProgressionData: () => IProgressionData;
export declare const computeCFI: (node: Node) => string | undefined;
export {};
