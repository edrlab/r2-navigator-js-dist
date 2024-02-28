"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOverlaps = exports.removeContainedRects = exports.getRectOverlapY = exports.getRectOverlapX = exports.replaceOverlapingRects = exports.mergeTouchingRects = exports.rectsTouchOrOverlap = exports.getBoundingRect = exports.rectContains = exports.rectContainsPoint = exports.rectSame = exports.rectSubtract = exports.rectIntersect = exports.getClientRectsNoOverlap = exports.getTextClientRects = exports.DOMRectListToArray = exports.VERBOSE = void 0;
var tslib_1 = require("tslib");
exports.VERBOSE = false;
var IS_DEV = exports.VERBOSE &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
var LOG_PREFIX = "RECTs -- ";
var logRect = function (rect) {
    var LOG_PREFIX_LOCAL = "logRect ~~ ";
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "TOP:".concat(rect.top, " BOTTOM:").concat(rect.bottom, " LEFT:").concat(rect.left, " RIGHT:").concat(rect.right, " WIDTH:").concat(rect.width, " HEIGHT:").concat(rect.height));
    }
};
function DOMRectListToArray(domRects) {
    var e_1, _a;
    var rects = [];
    try {
        for (var domRects_1 = tslib_1.__values(domRects), domRects_1_1 = domRects_1.next(); !domRects_1_1.done; domRects_1_1 = domRects_1.next()) {
            var domRect = domRects_1_1.value;
            rects.push({
                bottom: domRect.bottom,
                height: domRect.height,
                left: domRect.left,
                right: domRect.right,
                top: domRect.top,
                width: domRect.width,
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (domRects_1_1 && !domRects_1_1.done && (_a = domRects_1.return)) _a.call(domRects_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return rects;
}
exports.DOMRectListToArray = DOMRectListToArray;
function getTextClientRects(range, elementNamesToSkip) {
    var doc = range.commonAncestorContainer.ownerDocument;
    if (!doc) {
        return [];
    }
    var iter = doc.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
            var _a;
            if (node.nodeType === Node.TEXT_NODE && range.intersectsNode(node)) {
                if (!elementNamesToSkip) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                var parentName = (_a = node.parentElement) === null || _a === void 0 ? void 0 : _a.nodeName.toLowerCase();
                if (!parentName || !elementNamesToSkip.includes(parentName)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
            return NodeFilter.FILTER_REJECT;
        },
    });
    var rects = [];
    while (iter.nextNode()) {
        var r = doc.createRange();
        if (iter.referenceNode.nodeValue && iter.referenceNode === range.startContainer) {
            r.setStart(iter.referenceNode, range.startOffset);
            r.setEnd(iter.referenceNode, iter.referenceNode === range.endContainer ? range.endOffset : iter.referenceNode.nodeValue.length);
        }
        else if (iter.referenceNode.nodeValue && iter.referenceNode === range.endContainer) {
            r.setStart(iter.referenceNode, 0);
            r.setEnd(iter.referenceNode, range.endOffset);
        }
        else {
            r.selectNode(iter.referenceNode);
        }
        if (r.collapsed) {
            continue;
        }
        var nodeRects = DOMRectListToArray(r.getClientRects());
        rects.push.apply(rects, tslib_1.__spreadArray([], tslib_1.__read(nodeRects), false));
    }
    return rects;
}
exports.getTextClientRects = getTextClientRects;
function getClientRectsNoOverlap(originalRects, doNotMergeAlignedRects, vertical, expand) {
    var e_2, _a, e_3, _b;
    var LOG_PREFIX_LOCAL = "getClientRectsNoOverlap ~~ ";
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "original number of rects = " + originalRects.length);
    }
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "expand = " + expand);
    }
    var ex = expand ? expand : 0;
    if (ex) {
        try {
            for (var originalRects_1 = tslib_1.__values(originalRects), originalRects_1_1 = originalRects_1.next(); !originalRects_1_1.done; originalRects_1_1 = originalRects_1.next()) {
                var rect = originalRects_1_1.value;
                rect.left -= ex;
                rect.top -= ex;
                rect.right += ex;
                rect.bottom += ex;
                rect.width += (2 * ex);
                rect.height += (2 * ex);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (originalRects_1_1 && !originalRects_1_1.done && (_a = originalRects_1.return)) _a.call(originalRects_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    var rectsLandscapeAspectRatio = originalRects.filter(function (r) {
        return r.width >= r.height;
    });
    var rectsPortraitAspectRatio = originalRects.filter(function (r) {
        return r.width < r.height;
    });
    var sortFunc = function (r1, r2) {
        var areaR1 = r1.width * r1.height;
        var areaR2 = r2.width * r2.height;
        return areaR1 < areaR2 ? -1 : areaR1 === areaR2 ? 0 : 1;
    };
    rectsLandscapeAspectRatio.sort(sortFunc);
    rectsPortraitAspectRatio.sort(sortFunc);
    originalRects = vertical ? rectsPortraitAspectRatio.concat(rectsLandscapeAspectRatio) : rectsLandscapeAspectRatio.concat(rectsPortraitAspectRatio);
    var tolerance = 3;
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "tolerance = " + tolerance);
    }
    var mergedRects = mergeTouchingRects(originalRects, tolerance, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [mergeTouchingRects], number of rects = " + mergedRects.length);
    }
    var noContainedRects = removeContainedRects(mergedRects, tolerance, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [removeContainedRects], number of rects = " + noContainedRects.length);
    }
    var newRects = replaceOverlapingRects(noContainedRects, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [replaceOverlapingRects], number of rects = " + newRects.length);
    }
    var minArea = 2 * 2;
    for (var j = newRects.length - 1; j >= 0; j--) {
        var rect = newRects[j];
        var bigEnough = (rect.width * rect.height) > minArea;
        if (bigEnough && ex && (rect.width <= ex || rect.height <= ex)) {
            bigEnough = false;
        }
        if (!bigEnough) {
            if (newRects.length > 1) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "removed small");
                }
                newRects.splice(j, 1);
            }
            else {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "removed all smalls, but must keep last small one otherwise array empty!");
                }
                break;
            }
        }
    }
    if (IS_DEV) {
        checkOverlaps(newRects);
    }
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "total reduction ".concat(originalRects.length, " --> ").concat(newRects.length));
        try {
            for (var newRects_1 = tslib_1.__values(newRects), newRects_1_1 = newRects_1.next(); !newRects_1_1.done; newRects_1_1 = newRects_1.next()) {
                var r = newRects_1_1.value;
                logRect(r);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (newRects_1_1 && !newRects_1_1.done && (_b = newRects_1.return)) _b.call(newRects_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    }
    return newRects;
}
exports.getClientRectsNoOverlap = getClientRectsNoOverlap;
function almostEqual(a, b, tolerance) {
    return Math.abs(a - b) <= tolerance;
}
function rectIntersect(rect1, rect2) {
    var maxLeft = Math.max(rect1.left, rect2.left);
    var minRight = Math.min(rect1.right, rect2.right);
    var maxTop = Math.max(rect1.top, rect2.top);
    var minBottom = Math.min(rect1.bottom, rect2.bottom);
    var rect = {
        bottom: minBottom,
        height: Math.max(0, minBottom - maxTop),
        left: maxLeft,
        right: minRight,
        top: maxTop,
        width: Math.max(0, minRight - maxLeft),
    };
    return rect;
}
exports.rectIntersect = rectIntersect;
function rectSubtract(rect1, rect2) {
    var rectIntersected = rectIntersect(rect2, rect1);
    if (rectIntersected.height === 0 || rectIntersected.width === 0) {
        return [rect1];
    }
    var rects = [];
    {
        var rectA = {
            bottom: rect1.bottom,
            height: 0,
            left: rect1.left,
            right: rectIntersected.left,
            top: rect1.top,
            width: 0,
        };
        rectA.width = rectA.right - rectA.left;
        rectA.height = rectA.bottom - rectA.top;
        if (rectA.height !== 0 && rectA.width !== 0) {
            rects.push(rectA);
        }
    }
    {
        var rectB = {
            bottom: rectIntersected.top,
            height: 0,
            left: rectIntersected.left,
            right: rectIntersected.right,
            top: rect1.top,
            width: 0,
        };
        rectB.width = rectB.right - rectB.left;
        rectB.height = rectB.bottom - rectB.top;
        if (rectB.height !== 0 && rectB.width !== 0) {
            rects.push(rectB);
        }
    }
    {
        var rectC = {
            bottom: rect1.bottom,
            height: 0,
            left: rectIntersected.left,
            right: rectIntersected.right,
            top: rectIntersected.bottom,
            width: 0,
        };
        rectC.width = rectC.right - rectC.left;
        rectC.height = rectC.bottom - rectC.top;
        if (rectC.height !== 0 && rectC.width !== 0) {
            rects.push(rectC);
        }
    }
    {
        var rectD = {
            bottom: rect1.bottom,
            height: 0,
            left: rectIntersected.right,
            right: rect1.right,
            top: rect1.top,
            width: 0,
        };
        rectD.width = rectD.right - rectD.left;
        rectD.height = rectD.bottom - rectD.top;
        if (rectD.height !== 0 && rectD.width !== 0) {
            rects.push(rectD);
        }
    }
    return rects;
}
exports.rectSubtract = rectSubtract;
function rectSame(rect1, rect2, tolerance) {
    return almostEqual(rect1.left, rect2.left, tolerance) &&
        almostEqual(rect1.right, rect2.right, tolerance) &&
        almostEqual(rect1.top, rect2.top, tolerance) &&
        almostEqual(rect1.bottom, rect2.bottom, tolerance);
}
exports.rectSame = rectSame;
function rectContainsPoint(rect, x, y, tolerance) {
    return (rect.left < x || almostEqual(rect.left, x, tolerance)) &&
        (rect.right > x || almostEqual(rect.right, x, tolerance)) &&
        (rect.top < y || almostEqual(rect.top, y, tolerance)) &&
        (rect.bottom > y || almostEqual(rect.bottom, y, tolerance));
}
exports.rectContainsPoint = rectContainsPoint;
function rectContains(rect1, rect2, tolerance) {
    return (rectContainsPoint(rect1, rect2.left, rect2.top, tolerance) &&
        rectContainsPoint(rect1, rect2.right, rect2.top, tolerance) &&
        rectContainsPoint(rect1, rect2.left, rect2.bottom, tolerance) &&
        rectContainsPoint(rect1, rect2.right, rect2.bottom, tolerance));
}
exports.rectContains = rectContains;
function getBoundingRect(rect1, rect2) {
    var left = Math.min(rect1.left, rect2.left);
    var right = Math.max(rect1.right, rect2.right);
    var top = Math.min(rect1.top, rect2.top);
    var bottom = Math.max(rect1.bottom, rect2.bottom);
    return {
        bottom: bottom,
        height: bottom - top,
        left: left,
        right: right,
        top: top,
        width: right - left,
    };
}
exports.getBoundingRect = getBoundingRect;
function rectsTouchOrOverlap(rect1, rect2, tolerance) {
    return ((rect1.left < rect2.right || (tolerance >= 0 && almostEqual(rect1.left, rect2.right, tolerance))) &&
        (rect2.left < rect1.right || (tolerance >= 0 && almostEqual(rect2.left, rect1.right, tolerance))) &&
        (rect1.top < rect2.bottom || (tolerance >= 0 && almostEqual(rect1.top, rect2.bottom, tolerance))) &&
        (rect2.top < rect1.bottom || (tolerance >= 0 && almostEqual(rect2.top, rect1.bottom, tolerance))));
}
exports.rectsTouchOrOverlap = rectsTouchOrOverlap;
function mergeTouchingRects(rects, tolerance, doNotMergeAlignedRects, vertical) {
    var LOG_PREFIX_LOCAL = "mergeTouchingRects ~~ ";
    for (var i = 0; i < rects.length; i++) {
        var _loop_1 = function (j) {
            var rect1 = rects[i];
            var rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "rect1 === rect2 ??!");
                }
                return "continue";
            }
            var rectsLineUpVertically = almostEqual(rect1.top, rect2.top, tolerance) &&
                almostEqual(rect1.bottom, rect2.bottom, tolerance);
            var mergeAllowedForVerticallyLinedUpRects = !doNotMergeAlignedRects || !vertical;
            var rectsLineUpHorizontally = almostEqual(rect1.left, rect2.left, tolerance) &&
                almostEqual(rect1.right, rect2.right, tolerance);
            var mergeAllowedForHorizontallyLinedUpRects = !doNotMergeAlignedRects || vertical;
            var doMerge = ((rectsLineUpVertically && !rectsLineUpHorizontally)
                ||
                    (!rectsLineUpVertically && rectsLineUpHorizontally))
                &&
                    ((rectsLineUpHorizontally && mergeAllowedForHorizontallyLinedUpRects)
                        ||
                            (rectsLineUpVertically && mergeAllowedForVerticallyLinedUpRects))
                &&
                    rectsTouchOrOverlap(rect1, rect2, tolerance);
            if (doMerge) {
                var newRects = rects.filter(function (rect) {
                    return rect !== rect1 && rect !== rect2;
                });
                var boundingRect = getBoundingRect(rect1, rect2);
                newRects.push(boundingRect);
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "merged ".concat(rects.length, " ==> ").concat(newRects.length, ", VERTICAL ALIGN: ").concat(rectsLineUpVertically, " HORIZONTAL ALIGN: ").concat(rectsLineUpHorizontally, " (DO NOT MERGE: ").concat(doNotMergeAlignedRects, ", VERTICAL: ").concat(vertical, ") "));
                    logRect(rect1);
                    console.log("+");
                    logRect(rect2);
                    console.log("=");
                    logRect(boundingRect);
                }
                return { value: mergeTouchingRects(newRects, tolerance, doNotMergeAlignedRects, vertical) };
            }
        };
        for (var j = i + 1; j < rects.length; j++) {
            var state_1 = _loop_1(j);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    }
    return rects;
}
exports.mergeTouchingRects = mergeTouchingRects;
function replaceOverlapingRects(rects, doNotMergeAlignedRects, vertical) {
    var LOG_PREFIX_LOCAL = "replaceOverlapingRects ~~ ";
    if (doNotMergeAlignedRects) {
        return rects;
    }
    for (var i = 0; i < rects.length; i++) {
        var _loop_2 = function (j) {
            var e_4, _a;
            var rect1 = rects[i];
            var rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "rect1 === rect2 ??!");
                }
                return "continue";
            }
            if (!rectsTouchOrOverlap(rect1, rect2, -1)) {
                return "continue";
            }
            var toAdd = [];
            var toRemove;
            var toPreserve = void 0;
            var n = 0;
            var subtractRects1 = rectSubtract(rect1, rect2);
            if (subtractRects1.length === 1) {
                n = 1;
                toAdd = subtractRects1;
                toRemove = rect1;
                toPreserve = rect2;
            }
            else {
                var subtractRects2 = rectSubtract(rect2, rect1);
                if (subtractRects1.length < subtractRects2.length) {
                    n = 2;
                    toAdd = subtractRects1;
                    toRemove = rect1;
                    toPreserve = rect2;
                }
                else {
                    n = 3;
                    toAdd = subtractRects2;
                    toRemove = rect2;
                    toPreserve = rect1;
                }
            }
            if (IS_DEV) {
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "overlap ".concat(n, " ADD: ").concat(toAdd.length));
                try {
                    for (var toAdd_1 = (e_4 = void 0, tslib_1.__values(toAdd)), toAdd_1_1 = toAdd_1.next(); !toAdd_1_1.done; toAdd_1_1 = toAdd_1.next()) {
                        var r = toAdd_1_1.value;
                        logRect(r);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (toAdd_1_1 && !toAdd_1_1.done && (_a = toAdd_1.return)) _a.call(toAdd_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "overlap ".concat(n, " REMOVE:"));
                logRect(toRemove);
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "overlap ".concat(n, " KEEP:"));
                logRect(toPreserve);
            }
            if (IS_DEV) {
                var toCheck = [];
                toCheck.push(toPreserve);
                toCheck.push.apply(toCheck, tslib_1.__spreadArray([], tslib_1.__read(toAdd), false));
                checkOverlaps(toCheck);
            }
            var newRects = rects.filter(function (rect) {
                return rect !== toRemove;
            });
            newRects.push.apply(newRects, tslib_1.__spreadArray([], tslib_1.__read(toAdd), false));
            if (IS_DEV) {
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "overlap removed: ".concat(rects.length, " ==> ").concat(newRects.length));
            }
            return { value: replaceOverlapingRects(newRects, doNotMergeAlignedRects, vertical) };
        };
        for (var j = i + 1; j < rects.length; j++) {
            var state_2 = _loop_2(j);
            if (typeof state_2 === "object")
                return state_2.value;
        }
    }
    return rects;
}
exports.replaceOverlapingRects = replaceOverlapingRects;
function getRectOverlapX(rect1, rect2) {
    return Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
}
exports.getRectOverlapX = getRectOverlapX;
function getRectOverlapY(rect1, rect2) {
    return Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
}
exports.getRectOverlapY = getRectOverlapY;
function removeContainedRects(rects, tolerance, doNotMergeAlignedRects, vertical) {
    var e_5, _a, e_6, _b;
    var LOG_PREFIX_LOCAL = "removeContainedRects ~~ ";
    var rectsToKeep = new Set(rects);
    try {
        for (var rects_1 = tslib_1.__values(rects), rects_1_1 = rects_1.next(); !rects_1_1.done; rects_1_1 = rects_1.next()) {
            var rect = rects_1_1.value;
            var bigEnough = rect.width > 1 && rect.height > 1;
            if (!bigEnough) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + "removed tiny:");
                    logRect(rect);
                }
                rectsToKeep.delete(rect);
                continue;
            }
            try {
                for (var rects_2 = (e_6 = void 0, tslib_1.__values(rects)), rects_2_1 = rects_2.next(); !rects_2_1.done; rects_2_1 = rects_2.next()) {
                    var possiblyContainingRect = rects_2_1.value;
                    if (rect === possiblyContainingRect) {
                        continue;
                    }
                    if (!rectsToKeep.has(possiblyContainingRect) || !rectsToKeep.has(rect)) {
                        continue;
                    }
                    if (!rectContains(possiblyContainingRect, rect, tolerance)) {
                        continue;
                    }
                    if (doNotMergeAlignedRects) {
                        var rectsLineUpVertically = almostEqual(possiblyContainingRect.top, rect.top, tolerance) &&
                            almostEqual(possiblyContainingRect.bottom, rect.bottom, tolerance);
                        var rectsLineUpHorizontally = almostEqual(possiblyContainingRect.left, rect.left, tolerance) &&
                            almostEqual(possiblyContainingRect.right, rect.right, tolerance);
                        if (rectsLineUpVertically && rectsLineUpHorizontally) {
                            if (IS_DEV) {
                                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[identical] removed container (keep contained):");
                                logRect(possiblyContainingRect);
                                logRect(rect);
                            }
                            rectsToKeep.delete(possiblyContainingRect);
                            continue;
                        }
                        else if (rectsLineUpVertically || rectsLineUpHorizontally) {
                            if (rectsLineUpVertically && !vertical || rectsLineUpHorizontally && vertical) {
                                if (IS_DEV) {
                                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[aligned] removed contained (keep container):");
                                    logRect(rect);
                                    logRect(possiblyContainingRect);
                                }
                                rectsToKeep.delete(rect);
                                continue;
                            }
                            continue;
                        }
                    }
                    else {
                        if (IS_DEV) {
                            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[merge yes] removed contained (keep container):");
                            logRect(rect);
                            logRect(possiblyContainingRect);
                        }
                        rectsToKeep.delete(rect);
                    }
                    continue;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (rects_2_1 && !rects_2_1.done && (_b = rects_2.return)) _b.call(rects_2);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (rects_1_1 && !rects_1_1.done && (_a = rects_1.return)) _a.call(rects_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    return Array.from(rectsToKeep);
}
exports.removeContainedRects = removeContainedRects;
function checkOverlaps(rects) {
    var e_7, _a, e_8, _b;
    var LOG_PREFIX_LOCAL = "checkOverlaps ~~ ";
    var stillOverlapingRects = [];
    try {
        for (var rects_3 = tslib_1.__values(rects), rects_3_1 = rects_3.next(); !rects_3_1.done; rects_3_1 = rects_3.next()) {
            var rect1 = rects_3_1.value;
            try {
                for (var rects_4 = (e_8 = void 0, tslib_1.__values(rects)), rects_4_1 = rects_4.next(); !rects_4_1.done; rects_4_1 = rects_4.next()) {
                    var rect2 = rects_4_1.value;
                    if (rect1 === rect2) {
                        continue;
                    }
                    var has1 = stillOverlapingRects.includes(rect1);
                    var has2 = stillOverlapingRects.includes(rect2);
                    if (!has1 || !has2) {
                        if (rectsTouchOrOverlap(rect1, rect2, -1)) {
                            if (!has1) {
                                stillOverlapingRects.push(rect1);
                            }
                            if (!has2) {
                                stillOverlapingRects.push(rect2);
                            }
                            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "RECT 1:");
                            logRect(rect1);
                            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "RECT 2:");
                            logRect(rect2);
                            var xOverlap = getRectOverlapX(rect1, rect2);
                            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "X overlap: ".concat(xOverlap));
                            var yOverlap = getRectOverlapY(rect1, rect2);
                            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "Y overlap: ".concat(yOverlap));
                        }
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (rects_4_1 && !rects_4_1.done && (_b = rects_4.return)) _b.call(rects_4);
                }
                finally { if (e_8) throw e_8.error; }
            }
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (rects_3_1 && !rects_3_1.done && (_a = rects_3.return)) _a.call(rects_3);
        }
        finally { if (e_7) throw e_7.error; }
    }
    if (stillOverlapingRects.length) {
        if (IS_DEV) {
            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "still overlaping = ".concat(stillOverlapingRects.length));
        }
    }
}
exports.checkOverlaps = checkOverlaps;
//# sourceMappingURL=rect-utils.js.map