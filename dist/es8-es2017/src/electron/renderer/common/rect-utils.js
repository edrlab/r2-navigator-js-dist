"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOverlaps = exports.removeContainedRects = exports.getRectOverlapY = exports.getRectOverlapX = exports.replaceOverlapingRects = exports.mergeTouchingRects = exports.rectsTouchOrOverlap = exports.getBoundingRect = exports.rectContains = exports.rectContainsPoint = exports.rectSubtract = exports.rectIntersect = exports.getClientRectsNoOverlap__ = exports.getClientRectsNoOverlap_ = exports.getClientRectsNoOverlap = void 0;
const VERBOSE = false;
const IS_DEV = VERBOSE &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const LOG_PREFIX = "RECTs -- ";
const logRect = (rect) => {
    const LOG_PREFIX_LOCAL = "logRect ~~ ";
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `TOP:${rect.top} BOTTOM:${rect.bottom} LEFT:${rect.left} RIGHT:${rect.right} WIDTH:${rect.width} HEIGHT:${rect.height}`);
    }
};
function getClientRectsNoOverlap(range, doNotMergeAlignedRects, vertical, expand) {
    const rangeClientRects = range.getClientRects();
    return getClientRectsNoOverlap_(rangeClientRects, doNotMergeAlignedRects, vertical, expand);
}
exports.getClientRectsNoOverlap = getClientRectsNoOverlap;
function getClientRectsNoOverlap_(clientRects, doNotMergeAlignedRects, vertical, expand) {
    const originalRects = [];
    for (const rangeClientRect of clientRects) {
        originalRects.push({
            bottom: rangeClientRect.bottom,
            height: rangeClientRect.height,
            left: rangeClientRect.left,
            right: rangeClientRect.right,
            top: rangeClientRect.top,
            width: rangeClientRect.width,
        });
    }
    return getClientRectsNoOverlap__(originalRects, doNotMergeAlignedRects, vertical, expand);
}
exports.getClientRectsNoOverlap_ = getClientRectsNoOverlap_;
function getClientRectsNoOverlap__(originalRects, doNotMergeAlignedRects, vertical, expand) {
    const LOG_PREFIX_LOCAL = "getClientRectsNoOverlap__ ~~ ";
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "original number of rects = " + originalRects.length);
    }
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "expand = " + expand);
    }
    const ex = expand ? expand : 0;
    if (ex) {
        for (const rect of originalRects) {
            rect.left -= ex;
            rect.top -= ex;
            rect.right += ex;
            rect.bottom += ex;
            rect.width += (2 * ex);
            rect.height += (2 * ex);
        }
    }
    const tolerance = 1;
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "tolerance = " + tolerance);
    }
    const mergedRects = mergeTouchingRects(originalRects, tolerance, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [mergeTouchingRects], number of rects = " + mergedRects.length);
    }
    const noContainedRects = removeContainedRects(mergedRects, tolerance, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [removeContainedRects], number of rects = " + noContainedRects.length);
    }
    const newRects = replaceOverlapingRects(noContainedRects);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [replaceOverlapingRects], number of rects = " + newRects.length);
    }
    const minArea = 2 * 2;
    for (let j = newRects.length - 1; j >= 0; j--) {
        const rect = newRects[j];
        let bigEnough = (rect.width * rect.height) > minArea;
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
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `total reduction ${originalRects.length} --> ${newRects.length}`);
        for (const r of newRects) {
            logRect(r);
        }
    }
    return newRects;
}
exports.getClientRectsNoOverlap__ = getClientRectsNoOverlap__;
function almostEqual(a, b, tolerance) {
    return Math.abs(a - b) <= tolerance;
}
function rectIntersect(rect1, rect2) {
    const maxLeft = Math.max(rect1.left, rect2.left);
    const minRight = Math.min(rect1.right, rect2.right);
    const maxTop = Math.max(rect1.top, rect2.top);
    const minBottom = Math.min(rect1.bottom, rect2.bottom);
    const rect = {
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
    const rectIntersected = rectIntersect(rect2, rect1);
    if (rectIntersected.height === 0 || rectIntersected.width === 0) {
        return [rect1];
    }
    const rects = [];
    {
        const rectA = {
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
        const rectB = {
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
        const rectC = {
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
        const rectD = {
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
    const left = Math.min(rect1.left, rect2.left);
    const right = Math.max(rect1.right, rect2.right);
    const top = Math.min(rect1.top, rect2.top);
    const bottom = Math.max(rect1.bottom, rect2.bottom);
    return {
        bottom,
        height: bottom - top,
        left,
        right,
        top,
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
    const LOG_PREFIX_LOCAL = "mergeTouchingRects ~~ ";
    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            const rect1 = rects[i];
            const rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "rect1 === rect2 ??!");
                }
                continue;
            }
            const rectsLineUpVertically = almostEqual(rect1.top, rect2.top, tolerance) &&
                almostEqual(rect1.bottom, rect2.bottom, tolerance);
            const mergeAllowedForVerticallyLinedUpRects = !doNotMergeAlignedRects || !vertical;
            const rectsLineUpHorizontally = almostEqual(rect1.left, rect2.left, tolerance) &&
                almostEqual(rect1.right, rect2.right, tolerance);
            const mergeAllowedForHorizontallyLinedUpRects = !doNotMergeAlignedRects || vertical;
            const doMerge = ((rectsLineUpVertically && !rectsLineUpHorizontally)
                ||
                    (!rectsLineUpVertically && rectsLineUpHorizontally))
                &&
                    ((rectsLineUpHorizontally && mergeAllowedForHorizontallyLinedUpRects)
                        ||
                            (rectsLineUpVertically && mergeAllowedForVerticallyLinedUpRects))
                &&
                    rectsTouchOrOverlap(rect1, rect2, tolerance);
            if (doMerge) {
                const newRects = rects.filter((rect) => {
                    return rect !== rect1 && rect !== rect2;
                });
                const boundingRect = getBoundingRect(rect1, rect2);
                newRects.push(boundingRect);
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `merged ${rects.length} ==> ${newRects.length}, VERTICAL ALIGN: ${rectsLineUpVertically} HORIZONTAL ALIGN: ${rectsLineUpHorizontally} (DO NOT MERGE: ${doNotMergeAlignedRects}, VERTICAL: ${vertical}) `);
                    logRect(rect1);
                    console.log("+");
                    logRect(rect2);
                    console.log("=");
                    logRect(boundingRect);
                }
                return mergeTouchingRects(newRects, tolerance, doNotMergeAlignedRects, vertical);
            }
        }
    }
    return rects;
}
exports.mergeTouchingRects = mergeTouchingRects;
function replaceOverlapingRects(rects) {
    const LOG_PREFIX_LOCAL = "replaceOverlapingRects ~~ ";
    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            const rect1 = rects[i];
            const rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "rect1 === rect2 ??!");
                }
                continue;
            }
            if (!rectsTouchOrOverlap(rect1, rect2, -1)) {
                continue;
            }
            let toAdd = [];
            let toRemove;
            let toPreserve;
            let n = 0;
            const subtractRects1 = rectSubtract(rect1, rect2);
            if (subtractRects1.length === 1) {
                n = 1;
                toAdd = subtractRects1;
                toRemove = rect1;
                toPreserve = rect2;
            }
            else {
                const subtractRects2 = rectSubtract(rect2, rect1);
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
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap ${n} ADD: ${toAdd.length}`);
                for (const r of toAdd) {
                    logRect(r);
                }
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap ${n} REMOVE:`);
                logRect(toRemove);
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap ${n} KEEP:`);
                logRect(toPreserve);
            }
            if (IS_DEV) {
                const toCheck = [];
                toCheck.push(toPreserve);
                toCheck.push(...toAdd);
                checkOverlaps(toCheck);
            }
            const newRects = rects.filter((rect) => {
                return rect !== toRemove;
            });
            newRects.push(...toAdd);
            if (IS_DEV) {
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap removed: ${rects.length} ==> ${newRects.length}`);
            }
            return replaceOverlapingRects(newRects);
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
    const LOG_PREFIX_LOCAL = "removeContainedRects ~~ ";
    const rectsToKeep = new Set(rects);
    for (const rect of rects) {
        const bigEnough = rect.width > 1 && rect.height > 1;
        if (!bigEnough) {
            if (IS_DEV) {
                console.log(LOG_PREFIX + "removed tiny:");
                logRect(rect);
            }
            rectsToKeep.delete(rect);
            continue;
        }
        for (const possiblyContainingRect of rects) {
            if (rect === possiblyContainingRect) {
                continue;
            }
            if (!rectsToKeep.has(possiblyContainingRect) || !rectsToKeep.has(rect)) {
                continue;
            }
            if (!rectContains(possiblyContainingRect, rect, tolerance)) {
                continue;
            }
            const rectsLineUpVertically = almostEqual(possiblyContainingRect.top, rect.top, tolerance) &&
                almostEqual(possiblyContainingRect.bottom, rect.bottom, tolerance);
            const mergeAllowedForVerticallyLinedUpRects = !doNotMergeAlignedRects || !vertical;
            const rectsLineUpHorizontally = almostEqual(possiblyContainingRect.left, rect.left, tolerance) &&
                almostEqual(possiblyContainingRect.right, rect.right, tolerance);
            const mergeAllowedForHorizontallyLinedUpRects = !doNotMergeAlignedRects || vertical;
            if (rectsLineUpVertically && rectsLineUpHorizontally) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[identical] removed container (keep contained):");
                    logRect(rect);
                    logRect(possiblyContainingRect);
                }
                rectsToKeep.delete(possiblyContainingRect);
                continue;
            }
            else if (rectsLineUpVertically || rectsLineUpHorizontally) {
                const doMerge = (rectsLineUpHorizontally && mergeAllowedForHorizontallyLinedUpRects)
                    ||
                        (rectsLineUpVertically && mergeAllowedForVerticallyLinedUpRects);
                if (!doMerge) {
                    continue;
                }
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[aligned] removed container (keep contained):");
                    logRect(rect);
                    logRect(possiblyContainingRect);
                }
                rectsToKeep.delete(possiblyContainingRect);
                continue;
            }
            if (doNotMergeAlignedRects) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[merge no] removed container (keep contained):");
                    logRect(possiblyContainingRect);
                    logRect(rect);
                }
                rectsToKeep.delete(possiblyContainingRect);
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
    return Array.from(rectsToKeep);
}
exports.removeContainedRects = removeContainedRects;
function checkOverlaps(rects) {
    const LOG_PREFIX_LOCAL = "checkOverlaps ~~ ";
    const stillOverlapingRects = [];
    for (const rect1 of rects) {
        for (const rect2 of rects) {
            if (rect1 === rect2) {
                continue;
            }
            const has1 = stillOverlapingRects.includes(rect1);
            const has2 = stillOverlapingRects.includes(rect2);
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
                    const xOverlap = getRectOverlapX(rect1, rect2);
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `X overlap: ${xOverlap}`);
                    const yOverlap = getRectOverlapY(rect1, rect2);
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `Y overlap: ${yOverlap}`);
                }
            }
        }
    }
    if (stillOverlapingRects.length) {
        if (IS_DEV) {
            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `still overlaping = ${stillOverlapingRects.length}`);
        }
    }
}
exports.checkOverlaps = checkOverlaps;
//# sourceMappingURL=rect-utils.js.map