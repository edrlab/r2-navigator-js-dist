import { IEpubCfiAssertionNode } from './model/assertion/IEpubCfiAssertionNode.js';
import { IEpubCfiLocalPathNode } from './model/IEpubCfiLocalPathNode.js';
import { IEpubCfiPathNode } from './model/IEpubCfiPathNode.js';
import { IEpubCfiRootNode } from './model/IEpubCfiRootNode.js';
import { IEpubCfiStepNode } from './model/IEpubCfiStepNode.js';
import { EpubCfiOffsetNode } from './model/offset/EpubCfiOffsetNode.js';
export declare class EpubCfiUtils {
    static collapseToEnd(rootNode: IEpubCfiRootNode): IEpubCfiRootNode;
    static collapseToStart(rootNode: IEpubCfiRootNode): IEpubCfiRootNode;
    static copyAssertionNode(assertionNode: IEpubCfiAssertionNode): IEpubCfiAssertionNode;
    static copyLocalPathNode(localPathNode: IEpubCfiLocalPathNode): IEpubCfiLocalPathNode;
    static copyOffsetNode(offsetNode: EpubCfiOffsetNode): EpubCfiOffsetNode;
    static copyPathNode(pathNode: IEpubCfiPathNode): IEpubCfiPathNode;
    static copyRootNode(rootNode: IEpubCfiRootNode): IEpubCfiRootNode;
    static copyStepNode(stepNode: IEpubCfiStepNode): IEpubCfiStepNode;
    static createEmptyLocalPathNode(): IEpubCfiLocalPathNode;
    static createEmptyPathNode(): IEpubCfiPathNode;
    static createEmptyRootNode(): IEpubCfiRootNode;
    static createRangeSelector(startRootNode: IEpubCfiRootNode, endRootNode: IEpubCfiRootNode): IEpubCfiRootNode | null;
    static isElementStepNode(node: IEpubCfiStepNode): boolean;
    static isTextStepNode(node: IEpubCfiStepNode): boolean;
    private static areAssertionsEqual;
    private static areOffsetsEqual;
    private static areStepsEqual;
    private static copyAssertionParameterNode;
    private static copyCharacterOffsetNode;
    private static copySpatialOffsetNode;
    private static copyTemporalOffsetNode;
}
