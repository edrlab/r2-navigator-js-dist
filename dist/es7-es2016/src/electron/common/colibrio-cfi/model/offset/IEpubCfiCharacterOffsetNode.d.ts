import { EpubCfiOffsetType } from './EpubCfiOffsetType.js';
import { IEpubCfiOffsetNode } from './IEpubCfiOffsetNode.js';
export declare interface IEpubCfiCharacterOffsetNode extends IEpubCfiOffsetNode {
    characterOffset: number;
    type: EpubCfiOffsetType.CHARACTER;
}
