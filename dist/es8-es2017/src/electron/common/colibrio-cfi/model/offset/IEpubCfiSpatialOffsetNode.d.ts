import { EpubCfiOffsetType } from './EpubCfiOffsetType.js';
import { IEpubCfiOffsetNode } from './IEpubCfiOffsetNode.js';
export declare interface IEpubCfiSpatialOffsetNode extends IEpubCfiOffsetNode {
    type: EpubCfiOffsetType.SPATIAL;
    x: number;
    y: number;
}
