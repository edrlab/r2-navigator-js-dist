"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOverlaps = exports.removeContainedRects = exports.getRectOverlapY = exports.getRectOverlapX = exports.replaceOverlapingRects = exports.mergeTouchingRects = exports.rectsTouchOrOverlap = exports.getBoundingRect = exports.rectContains = exports.rectContainsPoint = exports.rectSubtract = exports.rectIntersect = exports.getClientRectsNoOverlap__ = exports.getClientRectsNoOverlap_ = exports.getClientRectsNoOverlap = void 0;
var tslib_1 = require("tslib");
var VERBOSE = false;
var IS_DEV = VERBOSE &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
function getClientRectsNoOverlap(range, doNotMergeHorizontallyAlignedRects, expand) {
    var rangeClientRects = range.getClientRects();
    return getClientRectsNoOverlap_(rangeClientRects, doNotMergeHorizontallyAlignedRects, expand);
}
exports.getClientRectsNoOverlap = getClientRectsNoOverlap;
function getClientRectsNoOverlap_(clientRects, doNotMergeHorizontallyAlignedRects, expand) {
    var e_1, _a;
    var originalRects = [];
    try {
        for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
            var rangeClientRect = clientRects_1_1.value;
            originalRects.push({
                bottom: rangeClientRect.bottom,
                height: rangeClientRect.height,
                left: rangeClientRect.left,
                right: rangeClientRect.right,
                top: rangeClientRect.top,
                width: rangeClientRect.width,
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return getClientRectsNoOverlap__(originalRects, doNotMergeHorizontallyAlignedRects, expand);
}
exports.getClientRectsNoOverlap_ = getClientRectsNoOverlap_;
function getClientRectsNoOverlap__(originalRects, doNotMergeHorizontallyAlignedRects, expand) {
    var e_2, _a;
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
    var tolerance = 1;
    var mergedRects = mergeTouchingRects(originalRects, tolerance, doNotMergeHorizontallyAlignedRects);
    var noContainedRects = removeContainedRects(mergedRects, tolerance);
    var newRects = replaceOverlapingRects(noContainedRects);
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
                    console.log("CLIENT RECT: remove small");
                }
                newRects.splice(j, 1);
            }
            else {
                if (IS_DEV) {
                    console.log("CLIENT RECT: remove small, but keep otherwise empty!");
                }
                break;
            }
        }
    }
    if (IS_DEV) {
        checkOverlaps(newRects);
    }
    if (IS_DEV) {
        console.log("CLIENT RECT: reduced ".concat(originalRects.length, " --> ").concat(newRects.length));
    }
    return newRects;
}
exports.getClientRectsNoOverlap__ = getClientRectsNoOverlap__;
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
function mergeTouchingRects(rects, tolerance, doNotMergeHorizontallyAlignedRects) {
    for (var i = 0; i < rects.length; i++) {
        var _loop_1 = function (j) {
            var rect1 = rects[i];
            var rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log("mergeTouchingRects rect1 === rect2 ??!");
                }
                return "continue";
            }
            var rectsLineUpVertically = almostEqual(rect1.top, rect2.top, tolerance) &&
                almostEqual(rect1.bottom, rect2.bottom, tolerance);
            var rectsLineUpHorizontally = almostEqual(rect1.left, rect2.left, tolerance) &&
                almostEqual(rect1.right, rect2.right, tolerance);
            var horizontalAllowed = !doNotMergeHorizontallyAlignedRects;
            var aligned = (rectsLineUpHorizontally && horizontalAllowed) || (rectsLineUpVertically && !rectsLineUpHorizontally);
            var canMerge = aligned && rectsTouchOrOverlap(rect1, rect2, tolerance);
            if (canMerge) {
                if (IS_DEV) {
                    console.log("CLIENT RECT: merging two into one, VERTICAL: ".concat(rectsLineUpVertically, " HORIZONTAL: ").concat(rectsLineUpHorizontally, " (").concat(doNotMergeHorizontallyAlignedRects, ")"));
                }
                var newRects = rects.filter(function (rect) {
                    return rect !== rect1 && rect !== rect2;
                });
                var replacementClientRect = getBoundingRect(rect1, rect2);
                newRects.push(replacementClientRect);
                return { value: mergeTouchingRects(newRects, tolerance, doNotMergeHorizontallyAlignedRects) };
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
function replaceOverlapingRects(rects) {
    for (var i = 0; i < rects.length; i++) {
        var _loop_2 = function (j) {
            var rect1 = rects[i];
            var rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log("replaceOverlapingRects rect1 === rect2 ??!");
                }
                return "continue";
            }
            if (rectsTouchOrOverlap(rect1, rect2, -1)) {
                var toAdd = [];
                var toRemove_1;
                var toPreserve = void 0;
                var subtractRects1 = rectSubtract(rect1, rect2);
                if (subtractRects1.length === 1) {
                    toAdd = subtractRects1;
                    toRemove_1 = rect1;
                    toPreserve = rect2;
                }
                else {
                    var subtractRects2 = rectSubtract(rect2, rect1);
                    if (subtractRects1.length < subtractRects2.length) {
                        toAdd = subtractRects1;
                        toRemove_1 = rect1;
                        toPreserve = rect2;
                    }
                    else {
                        toAdd = subtractRects2;
                        toRemove_1 = rect2;
                        toPreserve = rect1;
                    }
                }
                if (IS_DEV) {
                    var toCheck = [];
                    toCheck.push(toPreserve);
                    Array.prototype.push.apply(toCheck, toAdd);
                    checkOverlaps(toCheck);
                }
                if (IS_DEV) {
                    console.log("CLIENT RECT: overlap, cut one rect into ".concat(toAdd.length));
                }
                var newRects = rects.filter(function (rect) {
                    return rect !== toRemove_1;
                });
                Array.prototype.push.apply(newRects, toAdd);
                return { value: replaceOverlapingRects(newRects) };
            }
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
function removeContainedRects(rects, tolerance) {
    var e_3, _a, e_4, _b;
    var rectsToKeep = new Set(rects);
    try {
        for (var rects_1 = tslib_1.__values(rects), rects_1_1 = rects_1.next(); !rects_1_1.done; rects_1_1 = rects_1.next()) {
            var rect = rects_1_1.value;
            var bigEnough = rect.width > 1 && rect.height > 1;
            if (!bigEnough) {
                if (IS_DEV) {
                    console.log("CLIENT RECT: remove tiny");
                }
                rectsToKeep.delete(rect);
                continue;
            }
            try {
                for (var rects_2 = (e_4 = void 0, tslib_1.__values(rects)), rects_2_1 = rects_2.next(); !rects_2_1.done; rects_2_1 = rects_2.next()) {
                    var possiblyContainingRect = rects_2_1.value;
                    if (rect === possiblyContainingRect) {
                        continue;
                    }
                    if (!rectsToKeep.has(possiblyContainingRect)) {
                        continue;
                    }
                    if (rectContains(possiblyContainingRect, rect, tolerance)) {
                        if (IS_DEV) {
                            console.log("CLIENT RECT: remove contained");
                        }
                        rectsToKeep.delete(rect);
                        break;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (rects_2_1 && !rects_2_1.done && (_b = rects_2.return)) _b.call(rects_2);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (rects_1_1 && !rects_1_1.done && (_a = rects_1.return)) _a.call(rects_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return Array.from(rectsToKeep);
}
exports.removeContainedRects = removeContainedRects;
function checkOverlaps(rects) {
    var e_5, _a, e_6, _b;
    var stillOverlapingRects = [];
    try {
        for (var rects_3 = tslib_1.__values(rects), rects_3_1 = rects_3.next(); !rects_3_1.done; rects_3_1 = rects_3.next()) {
            var rect1 = rects_3_1.value;
            try {
                for (var rects_4 = (e_6 = void 0, tslib_1.__values(rects)), rects_4_1 = rects_4.next(); !rects_4_1.done; rects_4_1 = rects_4.next()) {
                    var rect2 = rects_4_1.value;
                    if (rect1 === rect2) {
                        continue;
                    }
                    var has1 = stillOverlapingRects.indexOf(rect1) >= 0;
                    var has2 = stillOverlapingRects.indexOf(rect2) >= 0;
                    if (!has1 || !has2) {
                        if (rectsTouchOrOverlap(rect1, rect2, -1)) {
                            if (!has1) {
                                stillOverlapingRects.push(rect1);
                            }
                            if (!has2) {
                                stillOverlapingRects.push(rect2);
                            }
                            console.log("CLIENT RECT: overlap ---");
                            console.log("#1 TOP:".concat(rect1.top, " BOTTOM:").concat(rect1.bottom, " LEFT:").concat(rect1.left, " RIGHT:").concat(rect1.right, " WIDTH:").concat(rect1.width, " HEIGHT:").concat(rect1.height));
                            console.log("#2 TOP:".concat(rect2.top, " BOTTOM:").concat(rect2.bottom, " LEFT:").concat(rect2.left, " RIGHT:").concat(rect2.right, " WIDTH:").concat(rect2.width, " HEIGHT:").concat(rect2.height));
                            var xOverlap = getRectOverlapX(rect1, rect2);
                            console.log("xOverlap: ".concat(xOverlap));
                            var yOverlap = getRectOverlapY(rect1, rect2);
                            console.log("yOverlap: ".concat(yOverlap));
                        }
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (rects_4_1 && !rects_4_1.done && (_b = rects_4.return)) _b.call(rects_4);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (rects_3_1 && !rects_3_1.done && (_a = rects_3.return)) _a.call(rects_3);
        }
        finally { if (e_5) throw e_5.error; }
    }
    if (stillOverlapingRects.length) {
        console.log("CLIENT RECT: overlaps ".concat(stillOverlapingRects.length));
    }
}
exports.checkOverlaps = checkOverlaps;
//# sourceMappingURL=rect-utils.js.map