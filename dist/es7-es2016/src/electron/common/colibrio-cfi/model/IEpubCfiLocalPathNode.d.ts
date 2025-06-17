import { IEpubCfiNode } from './IEpubCfiNode.js';
import { IEpubCfiStepNode } from './IEpubCfiStepNode.js';
export declare interface IEpubCfiLocalPathNode extends IEpubCfiNode {
    indirection: boolean;
    steps: IEpubCfiStepNode[];
}
