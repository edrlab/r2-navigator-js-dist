"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubCfiResolvedTarget = void 0;
class EpubCfiResolvedTarget {
    constructor(ast) {
        this.indirectionErrors = [];
        this.parentPath = null;
        this.rangeEndPath = null;
        this.rangeStartPath = null;
        this.ast = ast;
    }
    createDomRange() {
        if (this.isTargetingOpfDocument()) {
            return null;
        }
        let range = null;
        if (this.rangeStartPath && this.rangeEndPath) {
            let startDocument = this.rangeStartPath.getDocument();
            range = startDocument.createRange();
            range.setStart(this.rangeStartPath.container, this.rangeStartPath.offset);
            if (this.rangeEndPath.getDocument() === startDocument) {
                range.setEnd(this.rangeEndPath.container, this.rangeEndPath.offset);
            }
        }
        else if (this.parentPath) {
            range = this.parentPath.getDocument().createRange();
            range.setStart(this.parentPath.container, this.parentPath.offset);
        }
        return range;
    }
    getElementCharacterOffsets() {
        return this.getOffsetRange('elementCharacterOffset', { characterOffset: 0 });
    }
    getParserErrors() {
        return this.ast.errors;
    }
    getResolverErrors() {
        let errors = [];
        let allPaths = [this.parentPath, this.rangeStartPath, this.rangeEndPath];
        for (let i = 0; i < allPaths.length; i++) {
            let path = allPaths[i];
            if (path) {
                errors.push(...path.getResolverErrors());
            }
        }
        return errors;
    }
    getSideBias() {
        if (this.parentPath && !this.rangeStartPath && !this.rangeEndPath) {
            return this.parentPath.sideBias;
        }
        return null;
    }
    getSpatialOffsets() {
        return this.getOffsetRange('spatialOffset', { x: 0, y: 0 });
    }
    getTargetElement() {
        if (this.rangeStartPath && this.rangeEndPath) {
            let startElement = this.rangeStartPath.getTargetElement();
            return startElement !== null && startElement === this.rangeEndPath.getTargetElement() ? startElement : null;
        }
        else {
            return this.parentPath ? this.parentPath.getTargetElement() : null;
        }
    }
    getTemporalOffsets() {
        return this.getOffsetRange('temporalOffset', { seconds: 0 });
    }
    hasElementOffsets() {
        return this.getSpatialOffsets() !== null || this.getTemporalOffsets() !== null || this.getElementCharacterOffsets() !== null;
    }
    hasErrors() {
        return !this.hasParentPathOrRangePaths() ||
            this.isTargetingOpfDocument() ||
            !this.isEveryIndirectionResolved() ||
            this.ast.errors.length > 0 ||
            !this.isEveryStepAndOffsetParsed() ||
            !this.isEveryStepResolved() ||
            this.isSomeCharacterOffsetOutOfBounds();
    }
    hasParentPathOrRangePaths() {
        return this.parentPath !== null &&
            ((this.rangeStartPath === null && this.rangeStartPath === null) ||
                (this.rangeStartPath !== null && this.rangeEndPath !== null));
    }
    hasRangePaths() {
        return this.rangeStartPath !== null && this.rangeEndPath !== null;
    }
    hasWarnings() {
        return this.isMissingXmlIdAssertions() || this.isRepairedWithXmlIdAssertions();
    }
    isDomRange() {
        let rangeStartPath = this.rangeStartPath;
        let rangeEndPath = this.rangeEndPath;
        return !!rangeStartPath &&
            !!rangeEndPath &&
            !this.isTargetingOpfDocument() &&
            rangeStartPath.getDocument() === rangeEndPath.getDocument() &&
            (rangeStartPath.container !== rangeEndPath.container ||
                rangeStartPath.offset !== rangeEndPath.offset);
    }
    isEveryIndirectionResolved() {
        return this.indirectionErrors.length === 0;
    }
    isEveryStepAndOffsetParsed() {
        return this.ast.parentPath !== null && this.ast.parentPath.complete &&
            (!this.ast.rangeStartPath || this.ast.rangeStartPath.complete) &&
            (!this.ast.rangeEndPath || this.ast.rangeEndPath.complete);
    }
    isEveryStepResolved() {
        return this.parentPath !== null && this.parentPath.stepsResolved &&
            (!this.rangeStartPath || this.rangeStartPath.stepsResolved) &&
            (!this.rangeEndPath || this.rangeEndPath.stepsResolved);
    }
    isMissingXmlIdAssertions() {
        return (this.parentPath !== null && this.parentPath.isMissingXmlIdAssertions()) ||
            (this.rangeStartPath !== null && this.rangeStartPath.isMissingXmlIdAssertions()) ||
            (this.rangeEndPath !== null && this.rangeEndPath.isMissingXmlIdAssertions());
    }
    isOwnedBySingleDocument() {
        if (this.rangeStartPath && this.rangeEndPath) {
            return this.rangeStartPath.getDocument() === this.rangeEndPath.getDocument();
        }
        return true;
    }
    isRepairedWithXmlIdAssertions() {
        return (this.parentPath !== null && this.parentPath.isRepairedWithXmlIdAssertions()) ||
            (this.rangeStartPath !== null && this.rangeStartPath.isRepairedWithXmlIdAssertions()) ||
            (this.rangeEndPath !== null && this.rangeEndPath.isRepairedWithXmlIdAssertions());
    }
    isSomeCharacterOffsetOutOfBounds() {
        return [
            this.parentPath,
            this.rangeStartPath,
            this.rangeEndPath,
        ].some(path => path !== null && path.characterOffsetOutOfBounds);
    }
    isTargetingElement() {
        return this.getTargetElement() !== null;
    }
    isTargetingOpfDocument() {
        if (this.rangeStartPath && this.rangeEndPath) {
            return this.rangeStartPath.isTargetingOpfDocument() || this.rangeEndPath.isTargetingOpfDocument();
        }
        else {
            return this.parentPath !== null && this.parentPath.isTargetingOpfDocument();
        }
    }
    getOffsetRange(offsetProp, defaultStart) {
        let result = null;
        let rangeStart = this.rangeStartPath;
        let rangeEnd = this.rangeEndPath;
        if (rangeStart && rangeEnd) {
            if (rangeEnd[offsetProp]) {
                result = {
                    start: rangeStart[offsetProp] || defaultStart,
                    end: rangeEnd[offsetProp],
                };
            }
            else if (rangeStart[offsetProp]) {
                result = {
                    start: rangeStart[offsetProp],
                    end: null,
                };
            }
        }
        else {
            let parentPath = this.parentPath;
            if (parentPath && parentPath[offsetProp]) {
                result = {
                    start: parentPath[offsetProp],
                    end: null,
                };
            }
        }
        return result;
    }
}
exports.EpubCfiResolvedTarget = EpubCfiResolvedTarget;
//# sourceMappingURL=EpubCfiResolvedTarget.js.map