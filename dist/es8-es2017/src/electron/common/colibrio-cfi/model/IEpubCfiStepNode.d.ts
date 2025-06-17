import { IEpubCfiAssertionNode } from './assertion/IEpubCfiAssertionNode.js';
import { IEpubCfiNode } from './IEpubCfiNode.js';
export declare interface IEpubCfiStepNode extends IEpubCfiNode {
    assertion: IEpubCfiAssertionNode | null;
    stepValue: number;
}
