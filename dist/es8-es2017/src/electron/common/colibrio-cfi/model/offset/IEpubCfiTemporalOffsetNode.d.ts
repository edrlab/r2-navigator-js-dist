import { EpubCfiOffsetType } from './EpubCfiOffsetType.js';
import { IEpubCfiOffsetNode } from './IEpubCfiOffsetNode.js';
export declare interface IEpubCfiTemporalOffsetNode extends IEpubCfiOffsetNode {
    seconds: number;
    type: EpubCfiOffsetType.TEMPORAL;
    x: number | null;
    y: number | null;
}
