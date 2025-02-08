"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertRangeToTextFragment = exports.convertTextFragmentToRanges = void 0;
const FORCE_WORD_ALIGNMENT = false;
const USE_SEGMENTER = true;
const isElement = (node) => {
    return node.nodeType === Node.ELEMENT_NODE;
};
const isText = (node) => {
    return node.nodeType === Node.TEXT_NODE;
};
const normalizeString = (str) => {
    return str
        .normalize("NFKD")
        .replace(/\s+/g, " ")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};
const BLOCK_ELEMENTS = [
    "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BR", "DETAILS",
    "DIALOG", "DD", "DIV", "DL", "DT", "FIELDSET",
    "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2",
    "H3", "H4", "H5", "H6", "HEADER", "HGROUP",
    "HR", "LI", "MAIN", "NAV", "OL", "P",
    "PRE", "SECTION", "TABLE", "UL", "TR", "TH",
    "TD", "COLGROUP", "COL", "CAPTION", "THEAD", "TBODY",
    "TFOOT",
    "SVG",
];
const makeNewSegmenter = () => {
    const lang = window.document.documentElement.lang || navigator.languages;
    return new Intl.Segmenter(lang, { granularity: "word" });
};
const isHiddenUntilFound = (elt) => {
    if (elt.hidden === "until-found") {
        return true;
    }
    return false;
};
const isNodeVisible = (node) => {
    let elt = node;
    while (elt && !isElement(elt)) {
        elt = elt.parentNode;
    }
    if (elt) {
        if (isHiddenUntilFound(elt)) {
            return true;
        }
        const nodeStyle = window.getComputedStyle(elt);
        if (nodeStyle.visibility === "hidden"
            || nodeStyle.display === "none" ||
            parseInt(nodeStyle.height, 10) === 0 ||
            parseInt(nodeStyle.width) === 0 ||
            parseInt(nodeStyle.opacity) === 0) {
            return false;
        }
    }
    return true;
};
const acceptNodeIfVisibleInRange = (node, range) => {
    if (range && !range.intersectsNode(node))
        return NodeFilter.FILTER_REJECT;
    return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
};
const forwardTraverse = (walker, finishedSubtrees) => {
    if (!finishedSubtrees.has(walker.currentNode)) {
        const firstChild = walker.firstChild();
        if (firstChild) {
            return firstChild;
        }
    }
    const nextSibling = walker.nextSibling();
    if (nextSibling) {
        return nextSibling;
    }
    const parent = walker.parentNode();
    if (parent) {
        finishedSubtrees.add(parent);
    }
    return parent;
};
const convertTextFragmentToRanges = (textFragment, documant) => {
    const findTextInRange = (query, range) => {
        const findRangeFromNodeList = (query, range, textNodes, _segmenter) => {
            const getTextContent = (nodes, startOffset, endOffset) => {
                var _a;
                let str = "";
                if (!nodes[0].textContent) {
                    return str;
                }
                if (nodes.length === 1) {
                    str = nodes[0].textContent.substring(startOffset, endOffset);
                }
                else {
                    str = nodes[0].textContent.substring(startOffset) +
                        nodes.slice(1, -1).reduce((s, n) => s + (n.textContent || ""), "") +
                        (((_a = nodes.slice(-1)[0].textContent) === null || _a === void 0 ? void 0 : _a.substring(0, endOffset)) || "");
                }
                return str.replace(/\s+/g, " ");
            };
            const getBoundaryPointAtIndex = (index, textNodes, isEnd) => {
                let counted = 0;
                let normalizedData;
                for (let i = 0; i < textNodes.length; i++) {
                    const node = textNodes[i];
                    const nodeData = node.textContent || "";
                    if (!normalizedData) {
                        normalizedData = normalizeString(nodeData);
                    }
                    let nodeEnd = counted + normalizedData.length;
                    if (isEnd) {
                        nodeEnd += 1;
                    }
                    if (nodeEnd > index) {
                        const normalizedOffset = index - counted;
                        let denormalizedOffset = Math.min(index - counted, nodeData.length);
                        const targetSubstring = isEnd ?
                            normalizedData.substring(0, normalizedOffset) :
                            normalizedData.substring(normalizedOffset);
                        let candidateSubstring = isEnd ?
                            normalizeString(nodeData.substring(0, denormalizedOffset)) :
                            normalizeString(nodeData.substring(denormalizedOffset));
                        const direction = (isEnd ? -1 : 1) *
                            (targetSubstring.length > candidateSubstring.length ? -1 : 1);
                        while (denormalizedOffset >= 0 &&
                            denormalizedOffset <= nodeData.length) {
                            if (candidateSubstring.length === targetSubstring.length) {
                                return { node: node, offset: denormalizedOffset };
                            }
                            denormalizedOffset += direction;
                            candidateSubstring = isEnd ?
                                normalizeString(nodeData.substring(0, denormalizedOffset)) :
                                normalizeString(nodeData.substring(denormalizedOffset));
                        }
                    }
                    counted += normalizedData.length;
                    if (i + 1 < textNodes.length) {
                        const str = textNodes[i + 1].textContent;
                        const nextNormalizedData = str ? normalizeString(str) : "";
                        if (normalizedData.slice(-1) === " " &&
                            nextNormalizedData.slice(0, 1) === " ") {
                            counted -= 1;
                        }
                        normalizedData = nextNormalizedData;
                    }
                }
                return undefined;
            };
            if (!textNodes.length) {
                return undefined;
            }
            const data = normalizeString(getTextContent(textNodes, 0, undefined));
            const normalizedQuery = normalizeString(query);
            let searchStart = textNodes[0] === range.startContainer ? range.startOffset : 0;
            let start;
            let end;
            while (searchStart < data.length) {
                const matchIndex = data.indexOf(normalizedQuery, searchStart);
                if (matchIndex === -1) {
                    return undefined;
                }
                start = getBoundaryPointAtIndex(matchIndex, textNodes, false);
                end = getBoundaryPointAtIndex(matchIndex + normalizedQuery.length, textNodes, true);
                if (start && end) {
                    const documant = start.node.ownerDocument || window.document;
                    const foundRange = documant.createRange();
                    foundRange.setStart(start.node, start.offset);
                    foundRange.setEnd(end.node, end.offset);
                    if (range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 &&
                        range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0) {
                        return foundRange;
                    }
                }
                searchStart = matchIndex + 1;
            }
            return undefined;
        };
        const getAllTextNodes = (root, range) => {
            function* getElementsIn(root, filter) {
                const treeWalker = (root.ownerDocument || window.document).createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: filter });
                const finishedSubtrees = new Set();
                while (forwardTraverse(treeWalker, finishedSubtrees)) {
                    yield treeWalker.currentNode;
                }
            }
            ;
            const blocks = [];
            let tmp = [];
            const nodes = Array.from(getElementsIn(root, (node) => {
                return acceptNodeIfVisibleInRange(node, range);
            }));
            for (const node of nodes) {
                if (isText(node)) {
                    tmp.push(node);
                }
                else if (isElement(node) &&
                    BLOCK_ELEMENTS.includes(node.tagName.toUpperCase()) &&
                    tmp.length > 0) {
                    blocks.push(tmp);
                    tmp = [];
                }
            }
            if (tmp.length > 0) {
                blocks.push(tmp);
            }
            return blocks;
        };
        const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range);
        const segmenter = USE_SEGMENTER ? makeNewSegmenter() : undefined;
        for (const list of textNodeLists) {
            const found = findRangeFromNodeList(query, range, list, segmenter);
            if (found) {
                return found;
            }
        }
        return undefined;
    };
    const makeTextNodeWalker = (range) => {
        const acceptTextNodeIfVisibleInRange = (node, range) => {
            if (!range.intersectsNode(node))
                return NodeFilter.FILTER_REJECT;
            if (!isNodeVisible(node)) {
                return NodeFilter.FILTER_REJECT;
            }
            return isText(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        };
        const walker = (range.commonAncestorContainer.ownerDocument || window.document).createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, (node) => {
            return acceptTextNodeIfVisibleInRange(node, range);
        });
        return walker;
    };
    const advanceRangeStartToNonWhitespace = (range) => {
        const walker = makeTextNodeWalker(range);
        let node = walker.nextNode();
        while (!range.collapsed && node) {
            if (node !== range.startContainer) {
                range.setStart(node, 0);
            }
            if (node.textContent !== null && node.textContent.length > range.startOffset) {
                const firstChar = node.textContent[range.startOffset];
                if (!firstChar.match(/\s/)) {
                    return;
                }
            }
            try {
                range.setStart(node, range.startOffset + 1);
            }
            catch (_err) {
                node = walker.nextNode();
                if (!node) {
                    range.collapse();
                }
                else {
                    range.setStart(node, 0);
                }
            }
        }
    };
    const CheckSuffixResult = {
        NO_SUFFIX_MATCH: 0,
        SUFFIX_MATCH: 1,
        MISPLACED_SUFFIX: 2,
    };
    const checkSuffix = (suffix, potentialMatch, searchRange, documant) => {
        const suffixRange = documant.createRange();
        suffixRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
        suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset);
        advanceRangeStartToNonWhitespace(suffixRange);
        const suffixMatch = findTextInRange(suffix, suffixRange);
        if (!suffixMatch) {
            return CheckSuffixResult.NO_SUFFIX_MATCH;
        }
        if (suffixMatch.compareBoundaryPoints(Range.START_TO_START, suffixRange) !== 0) {
            return CheckSuffixResult.MISPLACED_SUFFIX;
        }
        return CheckSuffixResult.SUFFIX_MATCH;
    };
    const advanceRangeStartPastOffset = (range, node, offset) => {
        try {
            range.setStart(node, offset + 1);
        }
        catch (_err) {
            range.setStartAfter(node);
        }
    };
    const results = [];
    const searchRange = documant.createRange();
    searchRange.selectNodeContents(documant.body);
    while (!searchRange.collapsed && results.length < 2) {
        let potentialMatch;
        if (textFragment.prefix) {
            const prefixMatch = findTextInRange(textFragment.prefix, searchRange);
            if (!prefixMatch) {
                break;
            }
            advanceRangeStartPastOffset(searchRange, prefixMatch.startContainer, prefixMatch.startOffset);
            const matchRange = documant.createRange();
            matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset);
            matchRange.setEnd(searchRange.endContainer, searchRange.endOffset);
            advanceRangeStartToNonWhitespace(matchRange);
            if (matchRange.collapsed) {
                break;
            }
            potentialMatch = findTextInRange(textFragment.textStart, matchRange);
            if (!potentialMatch) {
                break;
            }
            if (potentialMatch.compareBoundaryPoints(Range.START_TO_START, matchRange) !== 0) {
                continue;
            }
        }
        else {
            potentialMatch = findTextInRange(textFragment.textStart, searchRange);
            if (!potentialMatch) {
                break;
            }
            advanceRangeStartPastOffset(searchRange, potentialMatch.startContainer, potentialMatch.startOffset);
        }
        if (textFragment.textEnd) {
            const textEndRange = documant.createRange();
            textEndRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
            textEndRange.setEnd(searchRange.endContainer, searchRange.endOffset);
            let matchFound = false;
            while (!textEndRange.collapsed && results.length < 2) {
                const textEndMatch = findTextInRange(textFragment.textEnd, textEndRange);
                if (!textEndMatch) {
                    break;
                }
                advanceRangeStartPastOffset(textEndRange, textEndMatch.startContainer, textEndMatch.startOffset);
                potentialMatch.setEnd(textEndMatch.endContainer, textEndMatch.endOffset);
                if (textFragment.suffix) {
                    const suffixResult = checkSuffix(textFragment.suffix, potentialMatch, searchRange, documant);
                    if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
                        break;
                    }
                    else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
                        matchFound = true;
                        results.push(potentialMatch.cloneRange());
                        continue;
                    }
                    else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
                        continue;
                    }
                }
                else {
                    matchFound = true;
                    results.push(potentialMatch.cloneRange());
                }
            }
            if (!matchFound) {
                break;
            }
        }
        else if (textFragment.suffix) {
            const suffixResult = checkSuffix(textFragment.suffix, potentialMatch, searchRange, documant);
            if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
                break;
            }
            else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
                results.push(potentialMatch.cloneRange());
                advanceRangeStartPastOffset(searchRange, searchRange.startContainer, searchRange.startOffset);
                continue;
            }
            else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
                continue;
            }
        }
        else {
            results.push(potentialMatch.cloneRange());
        }
    }
    return results;
};
exports.convertTextFragmentToRanges = convertTextFragmentToRanges;
const convertRangeToTextFragment = (range) => {
    const BOUNDARY_CHARS = /[\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;
    const NON_BOUNDARY_CHARS = /[^\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;
    const isBlock = (node) => {
        if (!isElement(node)) {
            return false;
        }
        const tagName = node.tagName.toUpperCase();
        return BLOCK_ELEMENTS.includes(tagName) || tagName === "HTML" || tagName === "BODY";
    };
    const reverseString = (str) => {
        return [...(str || "")].reverse().join("");
    };
    const BlockTextAccumulator = class {
        constructor(searchRange, isForwardTraversal) {
            this.searchRange = searchRange;
            this.isForwardTraversal = isForwardTraversal;
            this.textFound = false;
            this.textNodes = [];
            this.textInBlock = null;
        }
        finish() {
            if (this.textFound) {
                if (!this.isForwardTraversal) {
                    this.textNodes.reverse();
                }
                this.textInBlock = this.textNodes.map(textNode => textNode.textContent).join("");
                this.textInBlock = this.textInBlock.trim();
            }
            else {
                this.textNodes = [];
            }
        }
        appendNode(node) {
            if (this.textInBlock !== null) {
                return;
            }
            if (isBlock(node)) {
                this.finish();
                return;
            }
            if (!isText(node)) {
                return;
            }
            const nodeToInsert = this.getNodeIntersectionWithRange(node);
            if (nodeToInsert) {
                this.textFound = true;
                this.textNodes.push(nodeToInsert);
            }
        }
        getNodeIntersectionWithRange(node) {
            let startOffset = null;
            let endOffset = null;
            if (node === this.searchRange.startContainer &&
                this.searchRange.startOffset !== 0) {
                startOffset = this.searchRange.startOffset;
            }
            if (node === this.searchRange.endContainer &&
                (!node.textContent || this.searchRange.endOffset !== node.textContent.length)) {
                endOffset = this.searchRange.endOffset;
            }
            if (node.textContent) {
                let str = node.textContent;
                let changed = false;
                if (startOffset !== null || endOffset !== null) {
                    str = node.textContent.substring(startOffset !== null && startOffset !== void 0 ? startOffset : 0, endOffset !== null && endOffset !== void 0 ? endOffset : node.textContent.length);
                    changed = true;
                }
                return changed ? { textContent: str } : node;
            }
            return undefined;
        }
    };
    const WORDS_TO_ADD_SUBSEQUENT_ITERATIONS = 1;
    const WORDS_TO_ADD_FIRST_ITERATION = 3;
    const MIN_LENGTH_WITHOUT_CONTEXT = 20;
    const ITERATIONS_BEFORE_ADDING_CONTEXT = 1;
    const FragmentFactoryMode = {
        ALL_PARTS: 1,
        SHARED_START_AND_END: 2,
        CONTEXT_ONLY: 3,
    };
    const FragmentFactory = class {
        constructor() {
            this.startOffset = null;
            this.endOffset = null;
            this.prefixOffset = null;
            this.suffixOffset = null;
            this.prefixSearchSpace = "";
            this.backwardsPrefixSearchSpace = "";
            this.suffixSearchSpace = "";
            this.sharedSearchSpace = "";
            this.backwardsSharedSearchSpace = "";
            this.startSearchSpace = "";
            this.endSearchSpace = "";
            this.backwardsEndSearchSpace = "";
            this.numIterations = 0;
        }
        tryToMakeUniqueFragment() {
            let fragment;
            if (this.mode === FragmentFactoryMode.CONTEXT_ONLY) {
                if (!this.exactTextMatch) {
                    return undefined;
                }
                fragment = { textStart: this.exactTextMatch };
            }
            else {
                if (this.startOffset === null || this.endOffset === null) {
                    return undefined;
                }
                fragment = {
                    textStart: this.getStartSearchSpace().substring(0, this.startOffset).trim(),
                    textEnd: this.getEndSearchSpace().substring(this.endOffset).trim(),
                };
            }
            if (this.prefixOffset !== null) {
                const prefix = this.prefixSearchSpace.substring(this.prefixOffset).trim();
                if (prefix) {
                    fragment.prefix = prefix;
                }
            }
            if (this.suffixOffset) {
                const suffix = this.suffixSearchSpace.substring(0, this.suffixOffset).trim();
                if (suffix) {
                    fragment.suffix = suffix;
                }
            }
            return isUniquelyIdentifying(fragment) ? fragment : undefined;
        }
        embiggen() {
            let canExpandRange = true;
            if (this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                if (this.startOffset !== null && this.endOffset !== null && this.startOffset >= this.endOffset) {
                    canExpandRange = false;
                }
            }
            else if (this.mode === FragmentFactoryMode.ALL_PARTS) {
                if (this.startOffset === this.getStartSearchSpace().length &&
                    this.backwardsEndOffset() === this.getEndSearchSpace().length) {
                    canExpandRange = false;
                }
            }
            else if (this.mode === FragmentFactoryMode.CONTEXT_ONLY) {
                canExpandRange = false;
            }
            if (canExpandRange) {
                const desiredIterations = this.getNumberOfRangeWordsToAdd();
                if (this.startOffset !== null && this.startOffset < this.getStartSearchSpace().length) {
                    let i = 0;
                    if (this.getStartSegments()) {
                        while (i < desiredIterations &&
                            this.startOffset < this.getStartSearchSpace().length) {
                            this.startOffset = this.getNextOffsetForwards(this.getStartSegments(), this.startOffset, this.getStartSearchSpace());
                            i++;
                        }
                    }
                    else {
                        let oldStartOffset = this.startOffset;
                        do {
                            const newStartOffset = this.getStartSearchSpace().substring(this.startOffset + 1).search(BOUNDARY_CHARS);
                            if (newStartOffset === -1) {
                                this.startOffset = this.getStartSearchSpace().length;
                            }
                            else {
                                this.startOffset = this.startOffset + 1 + newStartOffset;
                            }
                            if (this.startOffset !== null &&
                                this.getStartSearchSpace().substring(oldStartOffset, this.startOffset).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldStartOffset = this.startOffset;
                                i++;
                            }
                        } while (this.startOffset !== null && this.startOffset < this.getStartSearchSpace().length && i < desiredIterations);
                    }
                    if (this.startOffset !== null && this.endOffset !== null && this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                        this.startOffset = Math.min(this.startOffset, this.endOffset);
                    }
                }
                if (this.backwardsEndOffset() < this.getEndSearchSpace().length) {
                    let i = 0;
                    if (this.getEndSegments()) {
                        while (this.endOffset !== null && i < desiredIterations && this.endOffset > 0) {
                            this.endOffset = this.getNextOffsetBackwards(this.getEndSegments(), this.endOffset);
                            i++;
                        }
                    }
                    else {
                        let oldBackwardsEndOffset = this.backwardsEndOffset();
                        do {
                            const newBackwardsOffset = this.getBackwardsEndSearchSpace().substring(this.backwardsEndOffset() + 1).search(BOUNDARY_CHARS);
                            if (newBackwardsOffset === -1) {
                                this.setBackwardsEndOffset(this.getEndSearchSpace().length);
                            }
                            else {
                                this.setBackwardsEndOffset(this.backwardsEndOffset() + 1 + newBackwardsOffset);
                            }
                            if (this.getBackwardsEndSearchSpace().substring(oldBackwardsEndOffset, this.backwardsEndOffset()).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldBackwardsEndOffset = this.backwardsEndOffset();
                                i++;
                            }
                        } while (this.backwardsEndOffset() < this.getEndSearchSpace().length && i < desiredIterations);
                    }
                    if (this.startOffset !== null && this.endOffset !== null && this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                        this.endOffset = Math.max(this.startOffset, this.endOffset);
                    }
                }
            }
            let canExpandContext = false;
            if (!canExpandRange ||
                (this.startOffset !== null &&
                    ((this.startOffset + this.backwardsEndOffset()) < MIN_LENGTH_WITHOUT_CONTEXT)) ||
                this.numIterations >= ITERATIONS_BEFORE_ADDING_CONTEXT) {
                if ((this.backwardsPrefixOffset() !== null && this.backwardsPrefixOffset() !== this.prefixSearchSpace.length) ||
                    (this.suffixOffset !== null && this.suffixOffset !== this.suffixSearchSpace.length)) {
                    canExpandContext = true;
                }
            }
            if (canExpandContext) {
                const desiredIterations = this.getNumberOfContextWordsToAdd();
                if ((this.backwardsPrefixOffset() || 0) < this.prefixSearchSpace.length) {
                    let i = 0;
                    if (this.prefixSegments) {
                        while (this.prefixOffset !== null && i < desiredIterations && this.prefixOffset > 0) {
                            this.prefixOffset = this.getNextOffsetBackwards(this.prefixSegments, this.prefixOffset);
                            i++;
                        }
                    }
                    else {
                        let oldBackwardsPrefixOffset = this.backwardsPrefixOffset();
                        do {
                            const newBackwardsPrefixOffset = this.backwardsPrefixSearchSpace.substring((this.backwardsPrefixOffset() || 0) + 1).search(BOUNDARY_CHARS);
                            if (newBackwardsPrefixOffset === -1) {
                                this.setBackwardsPrefixOffset(this.backwardsPrefixSearchSpace.length);
                            }
                            else {
                                this.setBackwardsPrefixOffset((this.backwardsPrefixOffset() || 0) + 1 + newBackwardsPrefixOffset);
                            }
                            if (this.backwardsPrefixSearchSpace.substring(oldBackwardsPrefixOffset || 0, this.backwardsPrefixOffset() || 0).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldBackwardsPrefixOffset = this.backwardsPrefixOffset();
                                i++;
                            }
                        } while ((this.backwardsPrefixOffset() || 0) < this.prefixSearchSpace.length &&
                            i < desiredIterations);
                    }
                }
                if (this.suffixOffset !== null && this.suffixOffset < this.suffixSearchSpace.length) {
                    let i = 0;
                    if (this.suffixSegments) {
                        while (this.suffixOffset !== null &&
                            i < desiredIterations &&
                            this.suffixOffset < this.suffixSearchSpace.length) {
                            this.suffixOffset = this.getNextOffsetForwards(this.suffixSegments, this.suffixOffset, this.suffixSearchSpace);
                            i++;
                        }
                    }
                    else {
                        let oldSuffixOffset = this.suffixOffset;
                        do {
                            const newSuffixOffset = this.suffixSearchSpace.substring(this.suffixOffset + 1).search(BOUNDARY_CHARS);
                            if (newSuffixOffset === -1) {
                                this.suffixOffset = this.suffixSearchSpace.length;
                            }
                            else {
                                this.suffixOffset = this.suffixOffset + 1 + newSuffixOffset;
                            }
                            if (this.suffixOffset !== null &&
                                this.suffixSearchSpace.substring(oldSuffixOffset, this.suffixOffset).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldSuffixOffset = this.suffixOffset;
                                i++;
                            }
                        } while (this.suffixOffset !== null &&
                            this.suffixOffset < this.suffixSearchSpace.length &&
                            i < desiredIterations);
                    }
                }
            }
            this.numIterations++;
            return canExpandRange || canExpandContext;
        }
        setStartAndEndSearchSpace(startSearchSpace, endSearchSpace) {
            this.startSearchSpace = startSearchSpace;
            this.endSearchSpace = endSearchSpace;
            this.backwardsEndSearchSpace = reverseString(endSearchSpace);
            this.startOffset = 0;
            this.endOffset = endSearchSpace.length;
            this.mode = FragmentFactoryMode.ALL_PARTS;
        }
        setSharedSearchSpace(sharedSearchSpace) {
            this.sharedSearchSpace = sharedSearchSpace;
            this.backwardsSharedSearchSpace = reverseString(sharedSearchSpace);
            this.startOffset = 0;
            this.endOffset = sharedSearchSpace.length;
            this.mode = FragmentFactoryMode.SHARED_START_AND_END;
        }
        setExactTextMatch(exactTextMatch) {
            this.exactTextMatch = exactTextMatch;
            this.mode = FragmentFactoryMode.CONTEXT_ONLY;
        }
        setPrefixAndSuffixSearchSpace(prefixSearchSpace, suffixSearchSpace) {
            if (prefixSearchSpace) {
                this.prefixSearchSpace = prefixSearchSpace;
                this.backwardsPrefixSearchSpace = reverseString(prefixSearchSpace);
                this.prefixOffset = prefixSearchSpace.length;
            }
            if (suffixSearchSpace) {
                this.suffixSearchSpace = suffixSearchSpace;
                this.suffixOffset = 0;
            }
        }
        useSegmenter(segmenter) {
            if (this.mode === FragmentFactoryMode.ALL_PARTS) {
                this.startSegments = segmenter.segment(this.startSearchSpace);
                this.endSegments = segmenter.segment(this.endSearchSpace);
            }
            else if (this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                this.sharedSegments = segmenter.segment(this.sharedSearchSpace);
            }
            if (this.prefixSearchSpace) {
                this.prefixSegments = segmenter.segment(this.prefixSearchSpace);
            }
            if (this.suffixSearchSpace) {
                this.suffixSegments = segmenter.segment(this.suffixSearchSpace);
            }
        }
        getNumberOfContextWordsToAdd() {
            return (this.backwardsPrefixOffset() === 0 && this.suffixOffset === 0) ?
                WORDS_TO_ADD_FIRST_ITERATION :
                WORDS_TO_ADD_SUBSEQUENT_ITERATIONS;
        }
        getNumberOfRangeWordsToAdd() {
            return (this.startOffset === 0 && this.backwardsEndOffset() === 0) ?
                WORDS_TO_ADD_FIRST_ITERATION :
                WORDS_TO_ADD_SUBSEQUENT_ITERATIONS;
        }
        getNextOffsetForwards(segments, offset, searchSpace) {
            if (!segments) {
                return 0;
            }
            let currentSegment = segments.containing(offset);
            while (currentSegment) {
                const currentSegmentEnd = currentSegment.index + currentSegment.segment.length;
                if (currentSegment.isWordLike) {
                    return currentSegmentEnd;
                }
                currentSegment = segments.containing(currentSegmentEnd);
            }
            return searchSpace.length;
        }
        getNextOffsetBackwards(segments, offset) {
            if (!segments) {
                return 0;
            }
            let currentSegment = segments.containing(offset);
            if (!currentSegment || offset === currentSegment.index) {
                currentSegment = segments.containing(offset - 1);
            }
            while (currentSegment) {
                if (currentSegment.isWordLike) {
                    return currentSegment.index;
                }
                currentSegment = segments.containing(currentSegment.index - 1);
            }
            return 0;
        }
        getStartSearchSpace() {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSearchSpace : this.startSearchSpace;
        }
        getStartSegments() {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSegments : this.startSegments;
        }
        getEndSearchSpace() {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSearchSpace : this.endSearchSpace;
        }
        getEndSegments() {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSegments : this.endSegments;
        }
        getBackwardsEndSearchSpace() {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ?
                this.backwardsSharedSearchSpace :
                this.backwardsEndSearchSpace;
        }
        backwardsEndOffset() {
            return this.getEndSearchSpace().length - (this.endOffset || 0);
        }
        setBackwardsEndOffset(backwardsEndOffset) {
            this.endOffset = this.getEndSearchSpace().length - backwardsEndOffset;
        }
        backwardsPrefixOffset() {
            if (this.prefixOffset === null) {
                return null;
            }
            return this.prefixSearchSpace.length - this.prefixOffset;
        }
        setBackwardsPrefixOffset(backwardsPrefixOffset) {
            if (this.prefixOffset === null) {
                return;
            }
            this.prefixOffset = this.prefixSearchSpace.length - backwardsPrefixOffset;
        }
    };
    const isUniquelyIdentifying = (fragment) => {
        return (0, exports.convertTextFragmentToRanges)(fragment, window.document).length === 1;
    };
    const getFirstNodeForBlockSearch = (range) => {
        let node = range.startContainer;
        if (isElement(node) &&
            range.startOffset < node.childNodes.length) {
            node = node.childNodes[range.startOffset];
        }
        return node;
    };
    const backwardTraverse = (walker, finishedSubtrees) => {
        if (!finishedSubtrees.has(walker.currentNode)) {
            const lastChild = walker.lastChild();
            if (lastChild) {
                return lastChild;
            }
        }
        const previousSibling = walker.previousSibling();
        if (previousSibling) {
            return previousSibling;
        }
        const parent = walker.parentNode();
        if (parent) {
            finishedSubtrees.add(parent);
        }
        return parent;
    };
    const makeWalkerForNode = (node, endNode) => {
        let blockAncestor = node;
        const endNodeNotNull = endNode ? endNode : node;
        while (!blockAncestor.contains(endNodeNotNull) ||
            !isBlock(blockAncestor)) {
            if (blockAncestor.parentNode) {
                blockAncestor = blockAncestor.parentNode;
            }
            else {
                break;
            }
        }
        const walker = (blockAncestor.ownerDocument || window.document).createTreeWalker(blockAncestor, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, (node) => {
            return acceptNodeIfVisibleInRange(node, undefined);
        });
        walker.currentNode = node;
        return walker;
    };
    const containsBlockBoundary = (range) => {
        const tempRange = range.cloneRange();
        let node = getFirstNodeForBlockSearch(tempRange);
        if (!node) {
            return false;
        }
        const walker = makeWalkerForNode(node);
        const finishedSubtrees = new Set();
        while (!tempRange.collapsed && node) {
            if (isBlock(node)) {
                return true;
            }
            if (node) {
                tempRange.setStartAfter(node);
            }
            node = forwardTraverse(walker, finishedSubtrees);
        }
        return false;
    };
    const MAX_EXACT_MATCH_LENGTH = 300;
    const canUseExactMatch = (range) => {
        if (range.toString().length > MAX_EXACT_MATCH_LENGTH) {
            return false;
        }
        return !containsBlockBoundary(range);
    };
    const getSearchSpaceForStart = (range) => {
        let node = getFirstNodeForBlockSearch(range);
        if (!node) {
            return undefined;
        }
        const walker = makeWalkerForNode(node, range.endContainer);
        const finishedSubtrees = new Set();
        if (isElement(range.startContainer) && range.startOffset === range.startContainer.childNodes.length) {
            finishedSubtrees.add(range.startContainer);
        }
        const origin = node;
        const textAccumulator = new BlockTextAccumulator(range, true);
        const tempRange = range.cloneRange();
        while (!tempRange.collapsed && node) {
            if (node.contains(origin)) {
                tempRange.setStartAfter(node);
            }
            else {
                tempRange.setStartBefore(node);
            }
            textAccumulator.appendNode(node);
            if (textAccumulator.textInBlock !== null) {
                return textAccumulator.textInBlock;
            }
            node = forwardTraverse(walker, finishedSubtrees);
        }
        return undefined;
    };
    const getLastNodeForBlockSearch = (range) => {
        let node = range.endContainer;
        if (isElement(node) && range.endOffset > 0) {
            node = node.childNodes[range.endOffset - 1];
        }
        return node;
    };
    const getSearchSpaceForEnd = (range) => {
        let node = getLastNodeForBlockSearch(range);
        if (!node) {
            return undefined;
        }
        const walker = makeWalkerForNode(node, range.startContainer);
        const finishedSubtrees = new Set();
        if (isElement(range.endContainer) &&
            range.endOffset === 0) {
            finishedSubtrees.add(range.endContainer);
        }
        const origin = node;
        const textAccumulator = new BlockTextAccumulator(range, false);
        const tempRange = range.cloneRange();
        while (!tempRange.collapsed && node) {
            if (node.contains(origin)) {
                tempRange.setEnd(node, 0);
            }
            else {
                tempRange.setEndAfter(node);
            }
            textAccumulator.appendNode(node);
            if (textAccumulator.textInBlock !== null) {
                return textAccumulator.textInBlock;
            }
            node = backwardTraverse(walker, finishedSubtrees);
        }
        return undefined;
    };
    const rangeBeforeShrinking = FORCE_WORD_ALIGNMENT ? range.cloneRange() : range;
    let factory;
    const doExactMatch = canUseExactMatch(range);
    if (doExactMatch) {
        const exactText = normalizeString(range.toString());
        const fragment = {
            textStart: exactText,
        };
        if (exactText.length >= MIN_LENGTH_WITHOUT_CONTEXT && isUniquelyIdentifying(fragment)) {
            return fragment;
        }
        factory = new FragmentFactory();
        factory.setExactTextMatch(exactText);
    }
    else {
        const startSearchSpace = getSearchSpaceForStart(range);
        const endSearchSpace = getSearchSpaceForEnd(range);
        if (startSearchSpace && endSearchSpace) {
            factory = new FragmentFactory();
            factory.setStartAndEndSearchSpace(startSearchSpace, endSearchSpace);
        }
        else {
            factory = new FragmentFactory();
            factory.setSharedSearchSpace(range.toString().trim());
        }
    }
    const documant = rangeBeforeShrinking.startContainer.ownerDocument || window.document;
    const prefixRange = documant.createRange();
    prefixRange.selectNodeContents(documant.body);
    const suffixRange = prefixRange.cloneRange();
    prefixRange.setEnd(rangeBeforeShrinking.startContainer, rangeBeforeShrinking.startOffset);
    suffixRange.setStart(rangeBeforeShrinking.endContainer, rangeBeforeShrinking.endOffset);
    const prefixSearchSpace = getSearchSpaceForEnd(prefixRange);
    const suffixSearchSpace = getSearchSpaceForStart(suffixRange);
    if (prefixSearchSpace || suffixSearchSpace) {
        factory.setPrefixAndSuffixSearchSpace(prefixSearchSpace, suffixSearchSpace);
    }
    const segmenter = USE_SEGMENTER ? makeNewSegmenter() : undefined;
    if (segmenter) {
        factory.useSegmenter(segmenter);
    }
    let didEmbiggen = false;
    do {
        didEmbiggen = factory.embiggen();
        const fragment = factory.tryToMakeUniqueFragment();
        if (fragment) {
            return fragment;
        }
    } while (didEmbiggen);
    return undefined;
};
exports.convertRangeToTextFragment = convertRangeToTextFragment;
//# sourceMappingURL=textFragment.js.map