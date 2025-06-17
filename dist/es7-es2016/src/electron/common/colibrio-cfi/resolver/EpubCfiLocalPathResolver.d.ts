import { IEpubCfiLocalPathNode } from '../model/IEpubCfiLocalPathNode.js';
import { IEpubCfiStepNode } from '../model/IEpubCfiStepNode.js';
import { EpubCfiResolvedLocalPath } from './EpubCfiResolvedLocalPath.js';
import { EpubCfiResolvedPath } from './EpubCfiResolvedPath.js';
export declare class EpubCfiLocalPathResolver {
    protected localPathNode: IEpubCfiLocalPathNode;
    protected localPath: EpubCfiResolvedLocalPath;
    protected currentTargetNode: Node;
    protected constructor(localPathNode: IEpubCfiLocalPathNode, localPath: EpubCfiResolvedLocalPath, startNode: Node);
    static createResolverFromElement(pathNode: IEpubCfiLocalPathNode, startElement: Element, documentUrl: URL): EpubCfiLocalPathResolver;
    static createResolverFromExistingPath(pathNode: IEpubCfiLocalPathNode, parentPath: EpubCfiResolvedPath): EpubCfiLocalPathResolver;
    resolve(): EpubCfiResolvedLocalPath;
    protected processElementStepValue(currentTargetElement: Element, step: IEpubCfiStepNode): void;
    protected processTextStepValue(currentTargetElement: Element, step: IEpubCfiStepNode): void;
    protected processXmlIdAssertion(step: IEpubCfiStepNode): boolean;
    protected resolveElementStep(step: IEpubCfiStepNode): void;
    protected resolveTextStep(step: IEpubCfiStepNode): void;
}
