import { IEpubCfiCharacterOffset } from './IEpubCfiCharacterOffset.js';
import { IEpubCfiSpatialOffset } from './IEpubCfiSpatialOffset.js';
import { IEpubCfiTemporalOffset } from './IEpubCfiTemporalOffset.js';
export declare interface IEpubCfiOffsetRange<T extends EpubCfiOffsetRangeType> {
    end: T | null;
    start: T;
}
export declare type EpubCfiOffsetRangeType = IEpubCfiSpatialOffset | IEpubCfiTemporalOffset | IEpubCfiCharacterOffset;
