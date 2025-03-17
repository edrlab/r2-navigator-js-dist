"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recreateAllHighlightsDebounced = exports.setDrawMargin = exports.HIGHLIGHT_GROUP_PAGEBREAK = exports.HIGHLIGHT_GROUP_TTS = exports.ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT = exports.ENABLE_CSS_HIGHLIGHTS = exports.ENABLE_FLOATING_UI = void 0;
exports.getBoundingClientRectOfDocumentBody = getBoundingClientRectOfDocumentBody;
exports.hideAllhighlights = hideAllhighlights;
exports.destroyAllhighlights = destroyAllhighlights;
exports.destroyHighlight = destroyHighlight;
exports.destroyHighlightsGroup = destroyHighlightsGroup;
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
exports.recreateAllHighlights = recreateAllHighlights;
exports.createHighlights = createHighlights;
exports.createHighlight = createHighlight;
const crypto = require("crypto");
const debounce = require("debounce");
const electron_1 = require("electron");
const events_1 = require("../../common/events");
const highlight_1 = require("../../common/highlight");
const readium_css_inject_1 = require("../../common/readium-css-inject");
const rect_utils_1 = require("../common/rect-utils");
const readium_css_1 = require("./readium-css");
const selection_1 = require("./selection");
const styles_1 = require("../../common/styles");
const readium_css_2 = require("./readium-css");
const core_1 = require("@flatten-js/core");
const { unify, subtract } = core_1.BooleanOperations;
const dom_1 = require("@floating-ui/dom");
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
window.DEBUG_RECTS = IS_DEV && rect_utils_1.VERBOSE;
exports.ENABLE_FLOATING_UI = true;
exports.ENABLE_CSS_HIGHLIGHTS = true && !!CSS.highlights;
exports.ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT = false;
let lastMouseDownX = -1;
let lastMouseDownY = -1;
let bodyEventListenersSet = false;
let _highlightsContainer;
let _timeoutMouseMove;
const TIMEOUT_MOUSE_MS = 200;
const cleanupPolygon = (polygonAccumulator, off) => {
    const DEBUG_RECTS = window.DEBUG_RECTS;
    const minLength = Math.abs(off) + 1;
    let nSegments = 0;
    let nArcs = 0;
    let total = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    for (const e of polygonAccumulator.edges) {
        const edge = e;
        if (edge.isSegment) {
            nSegments++;
            const segment = edge.shape;
            const l = segment.length;
            if (core_1.Utils.LE(l, minLength)) {
                total++;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                }
            }
            else {
                if (DEBUG_RECTS) {
                    console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                }
            }
        }
        else if (edge.isArc) {
            nArcs++;
            if (DEBUG_RECTS) {
                console.log("--POLYGON ARC");
            }
        }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 1: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 1: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 1: " + nArcs);
    }
    total = 0;
    nSegments = 0;
    nArcs = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    for (const f of polygonAccumulator.faces) {
        const face = f;
        for (const e of face.edges) {
            const edge = e;
            if (edge.isSegment) {
                nSegments++;
                const segment = edge.shape;
                const l = segment.length;
                if (core_1.Utils.LE(l, minLength)) {
                    total++;
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                    }
                }
                else {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                    }
                }
            }
            else if (edge.isArc) {
                nArcs++;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON ARC");
                }
            }
        }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 2: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 2: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 2: " + nArcs);
    }
    total = 0;
    nSegments = 0;
    nArcs = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    for (const f of polygonAccumulator.faces) {
        const face = f;
        let edge = face.first;
        while (edge) {
            if (edge.isSegment) {
                nSegments++;
                const segment = edge.shape;
                const l = segment.length;
                if (core_1.Utils.LE(l, minLength)) {
                    total++;
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                    }
                }
                else {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                    }
                }
            }
            else if (edge.isArc) {
                nArcs++;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON ARC");
                }
            }
            if (edge == face.last) {
                break;
            }
            edge = edge.next;
        }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 3: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 3: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 3: " + nArcs);
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    const faces = Array.from(polygonAccumulator.faces);
    for (const f of faces) {
        const face = f;
        if (DEBUG_RECTS) {
            console.log("~~~~ POLY FACE");
        }
        const edges = Array.from(face.edges);
        const edgeShapes = edges.map((edge) => edge.shape);
        let chainedEdgeShapes = [];
        while (edgeShapes.length) {
            if (DEBUG_RECTS) {
                console.log("~~~~ POLY EDGE SHAPE");
            }
            if (!chainedEdgeShapes.length) {
                const last = edgeShapes.pop();
                chainedEdgeShapes.push(last);
                continue;
            }
            const lastInChain = chainedEdgeShapes[chainedEdgeShapes.length - 1];
            const lastInChainStartPoint = lastInChain.breakToFunctional ? lastInChain.start : lastInChain.start;
            const lastInChainEndPoint = lastInChain.breakToFunctional ? lastInChain.end : lastInChain.end;
            const shapesBefore = [];
            const shapesAfter = [];
            for (const edgeShape of edgeShapes) {
                const edgeShapeStartPoint = edgeShape.breakToFunctional ? edgeShape.start : edgeShape.start;
                const edgeShapeEndPoint = edgeShape.breakToFunctional ? edgeShape.end : edgeShape.end;
                if (core_1.Utils.EQ(lastInChainStartPoint.x, edgeShapeEndPoint.x) && core_1.Utils.EQ(lastInChainStartPoint.y, edgeShapeEndPoint.y)) {
                    shapesBefore.push(edgeShape);
                }
                if (core_1.Utils.EQ(lastInChainEndPoint.x, edgeShapeStartPoint.x) && core_1.Utils.EQ(lastInChainEndPoint.y, edgeShapeStartPoint.y)) {
                    shapesAfter.push(edgeShape);
                }
            }
            if (shapesBefore.length > 1 || shapesAfter.length > 1 || shapesAfter.length === 0) {
                if (DEBUG_RECTS) {
                    console.log("~~~~ POLY SHAPES BEFORE/AFTER ABORT: " + shapesBefore.length + " ... " + shapesAfter.length);
                }
                chainedEdgeShapes = [];
                break;
            }
            const startPoint = shapesAfter[0].breakToFunctional ? shapesAfter[0].start : shapesAfter[0].start;
            const endPoint = shapesAfter[0].breakToFunctional ? shapesAfter[0].end : shapesAfter[0].end;
            if (DEBUG_RECTS) {
                console.log("*** SEGMENT/ARC --- START: (" + startPoint.x + ", " + startPoint.y + ") END: (" + endPoint.x + ", " + endPoint.y + ")");
            }
            edgeShapes.splice(edgeShapes.indexOf(shapesAfter[0]), 1);
            chainedEdgeShapes.push(shapesAfter[0]);
            if (chainedEdgeShapes.length === edges.length) {
                const edgeShapeEndPoint = shapesAfter[0].breakToFunctional ? shapesAfter[0].end : shapesAfter[0].end;
                const firstInChainStartPoint = chainedEdgeShapes[0].breakToFunctional ? chainedEdgeShapes[0].start : chainedEdgeShapes[0].start;
                if (!core_1.Utils.EQ(firstInChainStartPoint.x, edgeShapeEndPoint.x) || !core_1.Utils.EQ(firstInChainStartPoint.y, edgeShapeEndPoint.y)) {
                    if (DEBUG_RECTS) {
                        console.log("~~~~ POLY SHAPES TAIL/HEAD ABORT");
                    }
                    chainedEdgeShapes = [];
                    break;
                }
            }
        }
        let previousSegment;
        let previousSmallSegment;
        const newEdgeShapes = [];
        let hasChanged = false;
        for (const edgeShape of chainedEdgeShapes) {
            if (!edgeShape.breakToFunctional) {
                const segment = edgeShape;
                const l = segment.length;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON SLOPES: " + (previousSegment === null || previousSegment === void 0 ? void 0 : previousSegment.slope) + " vs. " + segment.slope);
                }
                if (previousSegment && core_1.Utils.EQ(previousSegment.slope, segment.slope)) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SLOPE EQUAL ... merge :)");
                    }
                    hasChanged = true;
                    newEdgeShapes.pop();
                    const seg = new core_1.Segment(new core_1.Point(previousSegment.start.x, previousSegment.start.y), new core_1.Point(segment.end.x, segment.end.y));
                    newEdgeShapes.push(seg);
                    previousSmallSegment = undefined;
                    previousSegment = seg;
                    if (chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !newEdgeShapes[0].breakToFunctional && core_1.Utils.EQ(newEdgeShapes[0].slope, seg.slope)) {
                        if (DEBUG_RECTS) {
                            console.log("--POLYGON SLOPE EQUAL (tail/head link) 1... merge :)");
                        }
                        hasChanged = true;
                        newEdgeShapes.splice(0, 1);
                        const seg2 = new core_1.Segment(new core_1.Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new core_1.Point(seg.end.x, seg.end.y));
                        newEdgeShapes.push(seg2);
                        previousSmallSegment = undefined;
                        previousSegment = seg2;
                    }
                }
                else if (newEdgeShapes.length && chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !newEdgeShapes[0].breakToFunctional && core_1.Utils.EQ(newEdgeShapes[0].slope, segment.slope)) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SLOPE EQUAL (tail/head link) 2... merge :)");
                    }
                    hasChanged = true;
                    newEdgeShapes.splice(0, 1);
                    const seg = new core_1.Segment(new core_1.Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new core_1.Point(segment.end.x, segment.end.y));
                    newEdgeShapes.push(seg);
                    previousSmallSegment = undefined;
                    previousSegment = seg;
                }
                else if (core_1.Utils.LE(l, minLength)) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                    }
                    if (previousSmallSegment) {
                        if (DEBUG_RECTS) {
                            console.log("-->>>> POLYGON SEGMENT small will merge :) ...");
                        }
                        hasChanged = true;
                        newEdgeShapes.pop();
                        const seg = new core_1.Segment(new core_1.Point(previousSmallSegment.start.x, previousSmallSegment.start.y), new core_1.Point(segment.end.x, segment.end.y));
                        newEdgeShapes.push(seg);
                        previousSmallSegment = undefined;
                        previousSegment = seg;
                    }
                    else if (newEdgeShapes.length && chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !newEdgeShapes[0].breakToFunctional && core_1.Utils.LE(newEdgeShapes[0].length, minLength)) {
                        if (DEBUG_RECTS) {
                            console.log("-->>>> POLYGON SEGMENT small (tail/head link) will merge :) ...");
                        }
                        hasChanged = true;
                        newEdgeShapes.splice(0, 1);
                        const seg = new core_1.Segment(new core_1.Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new core_1.Point(segment.end.x, segment.end.y));
                        ;
                        newEdgeShapes.push(seg);
                        previousSmallSegment = undefined;
                        previousSegment = seg;
                    }
                    else {
                        newEdgeShapes.push(segment);
                        previousSmallSegment = segment;
                        previousSegment = segment;
                    }
                }
                else {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                    }
                    previousSmallSegment = undefined;
                    newEdgeShapes.push(segment);
                    previousSegment = segment;
                }
            }
            else {
                if (DEBUG_RECTS) {
                    console.log("--POLYGON ARC");
                }
                previousSmallSegment = undefined;
                previousSegment = undefined;
                newEdgeShapes.push(edgeShape);
            }
        }
        if (hasChanged) {
            if (DEBUG_RECTS) {
                console.log("-->>>> POLYGON face changed :)");
            }
            polygonAccumulator.deleteFace(face);
            polygonAccumulator.addFace(newEdgeShapes);
        }
    }
};
const addEdgePoints = (polygon, offset) => {
    const boxes = [];
    for (const f of polygon.faces) {
        const face = f;
        for (const edge of face.edges) {
            if (edge.isSegment) {
                const segment = edge.shape;
                const bStart = new core_1.Box(segment.start.x - offset, segment.start.y - offset, segment.start.x + offset * 2, segment.start.y + offset * 2);
                boxes.push(bStart);
                const bEnd = new core_1.Box(segment.end.x - offset, segment.end.y - offset, segment.end.x + offset * 2, segment.end.y + offset * 2);
                boxes.push(bEnd);
            }
            else {
                const arc = edge.shape;
                const bStart = new core_1.Box(arc.start.x - offset, arc.start.y - offset, arc.start.x + offset * 2, arc.start.y + offset * 2);
                boxes.push(bStart);
                const bEnd = new core_1.Box(arc.end.x - offset, arc.end.y - offset, arc.end.x + offset * 2, arc.end.y + offset * 2);
                boxes.push(bEnd);
            }
        }
    }
    for (const box of boxes) {
        polygon.addFace(box);
    }
};
const BASE_ORIENTATION = core_1.ORIENTATION.CCW;
const USE_SEGMENT_JOINS_NOT_ARCS = false;
function arcSE(center, start, end, counterClockwise) {
    const DEBUG_RECTS = window.DEBUG_RECTS;
    const startAngle = Number((new core_1.Vector(center, start).slope).toPrecision(12));
    let endAngle = Number((new core_1.Vector(center, end).slope).toPrecision(12));
    if (core_1.Utils.EQ(startAngle, endAngle)) {
        if (DEBUG_RECTS) {
            console.log("--POLYGON ARC ORIENTATION CCW/CW inverse");
        }
        endAngle += 2 * Math.PI;
        counterClockwise = !counterClockwise;
    }
    const r = Number((new core_1.Vector(center, start).length).toPrecision(12));
    ;
    return new core_1.Arc(center, r, startAngle, endAngle, counterClockwise);
}
function offset_(polygon, off, useSegmentJoinsNotArcs) {
    const DEBUG_RECTS = window.DEBUG_RECTS;
    const postponeFinalUnify = off > 0;
    let polygonAccumulator = postponeFinalUnify ? undefined : polygon.clone();
    for (const f of polygon.faces) {
        const face = f;
        for (const edge of face.edges) {
            if (edge.isSegment) {
                const polygonEdge = new core_1.Polygon();
                const segment = edge.shape;
                const v_seg = new core_1.Vector(segment.end.x - segment.start.x, segment.end.y - segment.start.y);
                const v_seg_unit = v_seg.normalize();
                const absOffset = Math.abs(off);
                const v_left = v_seg_unit.rotate90CCW().multiply(absOffset);
                const v_right = v_seg_unit.rotate90CW().multiply(absOffset);
                const seg_left = segment.translate(v_left).reverse();
                const seg_right = segment.translate(v_right);
                const seg_left_ = new core_1.Segment(new core_1.Point(Number((seg_left.start.x).toPrecision(12)), Number((seg_left.start.y).toPrecision(12))), new core_1.Point(Number((seg_left.end.x).toPrecision(12)), Number((seg_left.end.y).toPrecision(12))));
                const seg_right_ = new core_1.Segment(new core_1.Point(Number((seg_right.start.x).toPrecision(12)), Number((seg_right.start.y).toPrecision(12))), new core_1.Point(Number((seg_right.end.x).toPrecision(12)), Number((seg_right.end.y).toPrecision(12))));
                const orientation = BASE_ORIENTATION === core_1.ORIENTATION.CCW ? core_1.CCW : core_1.CW;
                const cap1 = arcSE(segment.start, seg_left_.end, seg_right_.start, orientation);
                const cap2 = arcSE(segment.end, seg_right_.end, seg_left_.start, orientation);
                const cap1_ = useSegmentJoinsNotArcs
                    ?
                        new core_1.Segment(seg_left_.end, seg_right_.start)
                    :
                        cap1;
                const cap2_ = useSegmentJoinsNotArcs
                    ?
                        new core_1.Segment(seg_right_.end, seg_left_.start)
                    :
                        cap2;
                const face = polygonEdge.addFace([
                    seg_left_,
                    cap1_,
                    seg_right_,
                    cap2_,
                ]);
                if (face.orientation() !== BASE_ORIENTATION) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 1");
                    }
                    face.reverse();
                }
                if (!(polygonAccumulator || polygonEdge).faces.size) {
                    if (DEBUG_RECTS) {
                        console.log("--################# POLYGON BEFORE unify/substract HAS NO FACES!! " + (polygonAccumulator || polygonEdge).faces.size);
                    }
                }
                if (off > 0) {
                    polygonAccumulator = polygonAccumulator ? unify(polygonAccumulator, polygonEdge) : polygonEdge;
                }
                else {
                    polygonAccumulator = polygonAccumulator ? subtract(polygonAccumulator, polygonEdge) : polygonEdge;
                }
                if (!(polygonAccumulator || polygonEdge).faces.size) {
                    if (DEBUG_RECTS) {
                        console.log("--################# POLYGON AFTER unify/substract HAS NO FACES!! " + (polygonAccumulator || polygonEdge).faces.size);
                    }
                    if (!useSegmentJoinsNotArcs) {
                        if (DEBUG_RECTS) {
                            console.log("--##### POLYGON AFTER unify/substract try again without arc, only segment joiners ...");
                        }
                        return offset_(polygon, off, true);
                    }
                }
                else {
                    if (DEBUG_RECTS) {
                        console.log("--################# POLYGON AFTER unify/substract FACES: " + (polygonAccumulator || polygonEdge).edges.size + " /// " + (polygonAccumulator || polygonEdge).faces.size);
                    }
                }
                for (const f of polygonAccumulator.faces) {
                    const face = f;
                    if (face.edges.length < 4) {
                        if (DEBUG_RECTS) {
                            console.log("-------- POLYGON FACE EDGES not at least 4??!");
                        }
                        if (!useSegmentJoinsNotArcs) {
                            if (DEBUG_RECTS) {
                                console.log("--##### POLYGON AFTER unify/substract try again without arc, only segment joiners ...");
                            }
                            return offset_(polygon, off, true);
                        }
                    }
                    if (face.orientation() !== BASE_ORIENTATION) {
                        if (DEBUG_RECTS) {
                            console.log("-------- POLYGON FACE ORIENTATION");
                        }
                    }
                }
            }
            else {
                console.log("!!!!!!!! POLYGON ARC??!");
                return polygon;
            }
        }
    }
    Array.from((polygonAccumulator ? polygonAccumulator : polygon).faces).forEach((face) => {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (offset poly 1))");
            }
            if (polygonAccumulator) {
                polygonAccumulator.deleteFace(face);
            }
        }
    });
    if (polygonAccumulator && postponeFinalUnify) {
        polygonAccumulator = unify(polygonAccumulator, polygon);
    }
    Array.from((polygonAccumulator ? polygonAccumulator : polygon).faces).forEach((face) => {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (offset poly 2))");
            }
            if (polygonAccumulator) {
                polygonAccumulator.deleteFace(face);
            }
        }
    });
    if (polygonAccumulator) {
        if (!polygonAccumulator.faces.size) {
            if (DEBUG_RECTS) {
                console.log("--################# POLYGON INTERMEDIARY HAS NO FACES!! " + polygonAccumulator.faces.size);
            }
        }
        cleanupPolygon(polygonAccumulator, off);
    }
    let resPoly = polygonAccumulator ? polygonAccumulator : polygon;
    if (!resPoly.faces.size) {
        if (DEBUG_RECTS) {
            console.log("--################# POLYGON INTERMEDIARY HAS NO FACES!! " + resPoly.faces.size);
        }
        if (polygonAccumulator) {
            if (DEBUG_RECTS) {
                console.log("--################# FALLBACK TO SINGLE FACE POLY (BEFORE SUBSTRACT/UNIFY): " + polygon.faces.size);
            }
            resPoly = polygon;
        }
    }
    return resPoly;
}
function offset(originaPolygon, off, useSegmentJoinsNotArcs = USE_SEGMENT_JOINS_NOT_ARCS) {
    const DEBUG_RECTS = window.DEBUG_RECTS;
    off = Number((off).toPrecision(12));
    if (core_1.Utils.EQ_0(off)) {
        return originaPolygon;
    }
    const singleFacePolygons = [];
    for (const f of originaPolygon.faces) {
        const face = f;
        const poly = new core_1.Polygon();
        poly.addFace(face.edges.map((edge) => edge.shape));
        singleFacePolygons.push(poly);
    }
    const singlePolygon = new core_1.Polygon();
    for (const polygon of singleFacePolygons) {
        const resPoly = offset_(polygon, off, useSegmentJoinsNotArcs);
        for (const f of resPoly.faces) {
            const face = f;
            singlePolygon.addFace(face.edges.map(((edge) => edge.shape)));
        }
    }
    if (!singlePolygon.faces.size) {
        if (DEBUG_RECTS) {
            console.log("--##### POLYGON OFFSET HAS NO FACES!! " + singlePolygon.faces.size);
        }
        if (!useSegmentJoinsNotArcs) {
            if (DEBUG_RECTS) {
                console.log("--##### POLYGON OFFSET try again without arc, only segment joiners ...");
            }
            return offset(originaPolygon, off, true);
        }
    }
    return singlePolygon;
}
const DEFAULT_BACKGROUND_COLOR = {
    blue: 0,
    green: 0,
    red: 255,
};
const _highlights = [];
exports.HIGHLIGHT_GROUP_TTS = "tts";
exports.HIGHLIGHT_GROUP_PAGEBREAK = "pagebreak";
let _drawMargin = false;
const drawMargin = (h) => {
    if (h.group === exports.HIGHLIGHT_GROUP_TTS) {
        return false;
    }
    if (h.drawType === highlight_1.HighlightDrawTypeOpacityMask || h.drawType === highlight_1.HighlightDrawTypeOpacityMaskRuler || h.drawType === highlight_1.HighlightDrawTypeMarginBookmark) {
        return true;
    }
    if (h.group === exports.HIGHLIGHT_GROUP_PAGEBREAK) {
        return true;
    }
    if (Array.isArray(_drawMargin)) {
        if (h.group) {
            return _drawMargin.includes(h.group);
        }
        return false;
    }
    return _drawMargin;
};
const setDrawMargin = (win, drawMargin) => {
    _drawMargin = drawMargin;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- _drawMargin: " + JSON.stringify(_drawMargin, null, 4));
    }
    recreateAllHighlightsRaw(win);
};
exports.setDrawMargin = setDrawMargin;
const SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
function getBoundingClientRectOfDocumentBody(win) {
    return win.document.body.getBoundingClientRect();
}
function processMouseEvent(win, ev) {
    var _a;
    if (_timeoutMouseMove) {
        clearTimeout(_timeoutMouseMove);
        _timeoutMouseMove = undefined;
    }
    if (!_highlightsContainer) {
        return;
    }
    const isMouseMove = ev.type === "mousemove";
    if (isMouseMove) {
        if (ev.buttons > 0) {
            return;
        }
        if (!_highlights.length) {
            return;
        }
    }
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const x = ev.clientX;
    const y = ev.clientY;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    let hit = false;
    let foundHighlight;
    let foundElement;
    for (let i = _highlights.length - 1; i >= 0; i--) {
        const highlight = _highlights[i];
        const doDrawMargin = drawMargin(highlight);
        let highlightParent = documant.getElementById(`${highlight.id}`);
        if (!highlightParent) {
            highlightParent = _highlightsContainer.querySelector(`#${highlight.id}`);
        }
        if (!highlightParent) {
            continue;
        }
        let highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {
                const svg = highlightFragment;
                hit = (!doDrawMargin || svg.classList.contains(styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN)) && svg.polygon.contains(new core_1.Point((x - xOffset) * scale, (y - yOffset) * scale));
                if (hit) {
                    break;
                }
            }
            highlightFragment = highlightFragment.nextElementSibling;
        }
        if (hit) {
            foundHighlight = highlight;
            foundElement = highlightParent;
            break;
        }
    }
    let highlightContainer = _highlightsContainer.firstElementChild;
    while (highlightContainer) {
        if (!foundElement || foundElement !== highlightContainer) {
            highlightContainer.classList.remove(styles_1.CLASS_HIGHLIGHT_HOVER);
        }
        highlightContainer = highlightContainer.nextElementSibling;
    }
    if (!hit) {
        const _highlightsFloatingUI = win.document.getElementById(styles_1.ID_HIGHLIGHTS_FLOATING);
        if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
            _highlightsFloatingUI.style.display = "none";
        }
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        return;
    }
    if (foundElement && foundHighlight && foundHighlight.pointerInteraction) {
        if (isMouseMove) {
            foundElement.classList.add(styles_1.CLASS_HIGHLIGHT_HOVER);
            if (foundHighlight.group !== exports.HIGHLIGHT_GROUP_PAGEBREAK) {
                documant.documentElement.classList.add(styles_1.CLASS_HIGHLIGHT_CURSOR2);
            }
            const text = ((_a = foundHighlight.textPopup) === null || _a === void 0 ? void 0 : _a.text) ? foundHighlight.textPopup.text : undefined;
            if (text && _highlightsContainer) {
                _timeoutMouseMove = win.setTimeout(() => {
                    var _a, _b;
                    _timeoutMouseMove = undefined;
                    if (!_highlightsContainer) {
                        return;
                    }
                    const _highlightsFloatingUI = win.document.getElementById(styles_1.ID_HIGHLIGHTS_FLOATING);
                    if (!_highlightsFloatingUI) {
                        return;
                    }
                    const _highlightsFloatingUI_ARROW = _highlightsFloatingUI.firstElementChild;
                    if (!_highlightsFloatingUI_ARROW) {
                        return;
                    }
                    const _highlightsFloatingUI_TEXT = _highlightsFloatingUI_ARROW.nextElementSibling;
                    if (!_highlightsFloatingUI_TEXT) {
                        return;
                    }
                    const doDrawArrow = foundHighlight.drawType !== highlight_1.HighlightDrawTypeMarginBookmark;
                    _highlightsFloatingUI_ARROW.style.display = doDrawArrow ? "block" : "none";
                    const dir = ((_a = foundHighlight.textPopup) === null || _a === void 0 ? void 0 : _a.dir) ? foundHighlight.textPopup.dir : "ltr";
                    const lang = ((_b = foundHighlight.textPopup) === null || _b === void 0 ? void 0 : _b.lang) ? foundHighlight.textPopup.lang : "en";
                    const zoom = foundElement.__inverseZoom || 1;
                    if (dir) {
                        _highlightsFloatingUI_TEXT.setAttribute("dir", dir);
                    }
                    else {
                        _highlightsFloatingUI_TEXT.removeAttribute("dir");
                    }
                    if (lang) {
                        _highlightsFloatingUI_TEXT.setAttribute("lang", lang);
                        _highlightsFloatingUI_TEXT.setAttributeNS("http://www.w3.org/XML/1998/", "lang", lang);
                    }
                    else {
                        _highlightsFloatingUI_TEXT.removeAttribute("lang");
                        _highlightsFloatingUI_TEXT.removeAttributeNS("http://www.w3.org/XML/1998/", "lang");
                    }
                    _highlightsFloatingUI_TEXT.style.writingMode = "horizontal-tb";
                    _highlightsFloatingUI_TEXT.textContent = text;
                    if (!exports.ENABLE_FLOATING_UI) {
                        const xx = (x - xOffset) * scale;
                        const yy = (y - yOffset) * scale;
                        Object.assign(_highlightsFloatingUI.style, {
                            display: "block",
                            left: `${xx * zoom}px`,
                            top: `${yy * zoom}px`,
                        });
                    }
                    else {
                        Object.assign(_highlightsFloatingUI.style, {
                            display: "block",
                            left: "0px",
                            top: "-999999px",
                            opacity: "0",
                        });
                        const doDrawMargin = drawMargin(foundHighlight);
                        let anchor = null;
                        const all = foundElement.querySelectorAll("svg.R2_CLASS_HIGHLIGHT_CONTOUR > path");
                        if ((all === null || all === void 0 ? void 0 : all.length) > 0) {
                            anchor = all[(all === null || all === void 0 ? void 0 : all.length) - 1];
                        }
                        if (!anchor && doDrawMargin) {
                            anchor = foundElement.querySelector("svg.R2_CLASS_HIGHLIGHT_CONTOUR_MARGIN > path");
                        }
                        if (anchor) {
                            const paginated = (0, readium_css_inject_1.isPaginated)(documant);
                            const virtualElement = {
                                getBoundingClientRect() {
                                    return {
                                        width: 0,
                                        height: 0,
                                        x: x,
                                        y: y,
                                        top: y,
                                        left: x,
                                        right: x,
                                        bottom: y,
                                    };
                                },
                            };
                            let _highlightsFloatingUI_;
                            if (paginated) {
                                const css = win.getComputedStyle(_highlightsFloatingUI);
                                let width = parseFloat(css.width) || 0;
                                let height = parseFloat(css.height) || 0;
                                const offsetWidth = _highlightsFloatingUI.offsetWidth;
                                const offsetHeight = _highlightsFloatingUI.offsetHeight;
                                const shouldFallback = Math.round(width) !== offsetWidth || Math.round(height) !== offsetHeight;
                                if (shouldFallback) {
                                    width = offsetWidth;
                                    height = offsetHeight;
                                }
                                _highlightsFloatingUI_ = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
                                _highlightsFloatingUI_.setAttribute("id", styles_1.ID_HIGHLIGHTS_FLOATING + "_");
                                Object.assign(_highlightsFloatingUI_.style, {
                                    width: (width / zoom) + "px",
                                    height: (height / zoom) + "px",
                                });
                                _highlightsContainer.append(_highlightsFloatingUI_);
                            }
                            const arrowLen = doDrawArrow ? _highlightsFloatingUI_ARROW.offsetWidth : 0;
                            const floatingOffset = doDrawArrow ? (Math.sqrt(2 * Math.pow(arrowLen, 2)) / 2) : 0;
                            (0, dom_1.computePosition)(anchor || virtualElement, paginated ? _highlightsFloatingUI_ : _highlightsFloatingUI, {
                                strategy: paginated ? "fixed" : "absolute",
                                placement: "bottom",
                                middleware: [
                                    (0, dom_1.offset)(floatingOffset),
                                    (0, dom_1.flip)(),
                                    (0, dom_1.shift)({ padding: 4 }),
                                    doDrawArrow ? (0, dom_1.arrow)({ padding: 8, element: _highlightsFloatingUI_ARROW }) : undefined,
                                ].filter((v) => !!v),
                            })
                                .then(({ x: fuix, y: fuiy, middlewareData, placement }) => {
                                if (doDrawArrow && middlewareData.arrow && _highlightsFloatingUI_ARROW) {
                                    const side = placement.split("-")[0];
                                    const staticSide = {
                                        top: "bottom",
                                        right: "left",
                                        bottom: "top",
                                        left: "right",
                                    }[side];
                                    console.log("middlewareData.arrow", middlewareData.arrow.x, middlewareData.arrow.y);
                                    const { x: xarrow, y: yarrow } = middlewareData.arrow;
                                    if (xarrow != null || yarrow != null) {
                                        Object.assign(_highlightsFloatingUI_ARROW.style, {
                                            left: xarrow != null ? `${xarrow}px` : "",
                                            top: yarrow != null ? `${yarrow}px` : "",
                                            right: "",
                                            bottom: "",
                                            [staticSide]: `${-arrowLen / 2}px`,
                                            transform: staticSide === "top" ? "rotate(45deg)" : "rotate(225deg)",
                                        });
                                    }
                                }
                                const xx = paginated ? (fuix - xOffset) * zoom : fuix;
                                const yy = paginated ? (fuiy - yOffset) * zoom : fuiy;
                                if (_highlightsFloatingUI) {
                                    Object.assign(_highlightsFloatingUI.style, {
                                        display: "block",
                                        left: `${xx}px`,
                                        top: `${yy}px`,
                                        opacity: "1",
                                    });
                                }
                                if (_highlightsFloatingUI_) {
                                    _highlightsFloatingUI_.remove();
                                }
                            });
                        }
                        else {
                            const xx = (x - xOffset) * scale;
                            const yy = (y - yOffset) * scale;
                            Object.assign(_highlightsFloatingUI.style, {
                                display: "block",
                                left: `${xx * zoom}px`,
                                top: `${yy * zoom}px`,
                                opacity: "1",
                            });
                        }
                    }
                }, TIMEOUT_MOUSE_MS);
            }
        }
        else if ((ev.type === "mouseup" || ev.type === "click") && foundHighlight.group !== exports.HIGHLIGHT_GROUP_PAGEBREAK) {
            documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
            const _highlightsFloatingUI = win.document.getElementById(styles_1.ID_HIGHLIGHTS_FLOATING);
            if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
                _highlightsFloatingUI.style.display = "none";
            }
            ev.preventDefault();
            ev.stopPropagation();
            const payload = {
                highlight: foundHighlight,
                event: {
                    type: ev.type,
                    button: ev.button,
                    alt: ev.altKey,
                    shift: ev.shiftKey,
                    ctrl: ev.ctrlKey,
                    meta: ev.metaKey,
                    x: ev.clientX,
                    y: ev.clientY,
                },
            };
            electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_HIGHLIGHT_CLICK, payload);
        }
    }
    else {
        const _highlightsFloatingUI = win.document.getElementById(styles_1.ID_HIGHLIGHTS_FLOATING);
        if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
            _highlightsFloatingUI.style.display = "none";
        }
    }
}
const computeInverseZoom = (bodyComputedStyle, rootComputedStyle) => {
    let zoomStr = rootComputedStyle.zoom;
    if (!zoomStr || zoomStr === "1") {
        zoomStr = bodyComputedStyle.zoom;
    }
    if (zoomStr) {
        const zoomFactor = parseFloat(zoomStr);
        if (zoomFactor !== 0) {
            const inverseZoom = 1 / zoomFactor;
            return inverseZoom;
        }
    }
    return 1;
};
function ensureHighlightsContainer(win, _bodyComputedStyle, _rootComputedStyle) {
    const documant = win.document;
    if (!_highlightsContainer) {
        if (!bodyEventListenersSet) {
            bodyEventListenersSet = true;
            documant.body.addEventListener("mousedown", (ev) => {
                lastMouseDownX = ev.clientX;
                lastMouseDownY = ev.clientY;
            }, false);
            documant.body.addEventListener("mouseup", (ev) => {
                if ((Math.abs(lastMouseDownX - ev.clientX) < 3) &&
                    (Math.abs(lastMouseDownY - ev.clientY) < 3)) {
                    processMouseEvent(win, ev);
                }
            }, false);
            documant.body.addEventListener("mousemove", (ev) => {
                processMouseEvent(win, ev);
            }, false);
        }
        const _highlightsContainer_ = documant.createElement("div");
        _highlightsContainer_.setAttribute("aria-hidden", "true");
        _highlightsContainer_.setAttribute("id", styles_1.ID_HIGHLIGHTS_CONTAINER);
        _highlightsContainer_.setAttribute("class", styles_1.CLASS_HIGHLIGHT_COMMON);
        _highlightsContainer_.setAttribute("style", `width: ${win.READIUM2.isFixedLayout ? "-webkit-fill-available" : "auto"} !important; ` +
            `height: ${win.READIUM2.isFixedLayout ? "-webkit-fill-available" : "auto"} !important; `);
        const _highlightsFloatingUI = documant.createElement("div");
        _highlightsFloatingUI.setAttribute("id", styles_1.ID_HIGHLIGHTS_FLOATING);
        const _highlightsFloatingUI_ARROW = documant.createElement("div");
        _highlightsFloatingUI.append(_highlightsFloatingUI_ARROW);
        const _highlightsFloatingUI_TEXT = documant.createElement("div");
        _highlightsFloatingUI.append(_highlightsFloatingUI_TEXT);
        _highlightsContainer_.append(_highlightsFloatingUI);
        documant.body.append(_highlightsContainer_);
        _highlightsContainer = _highlightsContainer_;
    }
    return _highlightsContainer;
}
function hideAllhighlights(_documant) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- hideAllhighlights: " + _highlights.length);
    }
    if (exports.ENABLE_CSS_HIGHLIGHTS) {
        CSS.highlights.clear();
    }
    if (_highlightsContainer) {
        _highlightsContainer.remove();
        _highlightsContainer = undefined;
    }
}
function destroyAllhighlights(documant) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyAllhighlights: " + _highlights.length);
    }
    hideAllhighlights(documant);
    _highlights.splice(0, _highlights.length);
}
function destroyHighlight(documant, id) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlight: " + id + " ... " + _highlights.length);
    }
    let i = -1;
    const highlight = _highlights.find((h, j) => {
        i = j;
        return h.id === id;
    });
    if (highlight && i >= 0 && i < _highlights.length) {
        _highlights.splice(i, 1);
    }
    const highlightContainer = documant.getElementById(id);
    if (highlightContainer) {
        highlightContainer.remove();
    }
    if (exports.ENABLE_CSS_HIGHLIGHTS && highlight && highlight.rangeCssHighlight) {
        const [_strRGB, cssHighlightID] = computeCssHighlightRGBID(highlight);
        const cssHighlight = CSS.highlights.get(cssHighlightID);
        if (cssHighlight && cssHighlight.has(highlight.rangeCssHighlight)) {
            cssHighlight.delete(highlight.rangeCssHighlight);
        }
    }
}
function destroyHighlightsGroup(documant, group) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlightsGroup: " + group + " ... " + _highlights.length);
    }
    while (true) {
        let i = -1;
        const highlight = _highlights.find((h, j) => {
            i = j;
            return h.group === group;
        });
        if (highlight) {
            if (i >= 0 && i < _highlights.length) {
                _highlights.splice(i, 1);
            }
            const highlightContainer = documant.getElementById(highlight.id);
            if (highlightContainer) {
                highlightContainer.remove();
            }
            if (exports.ENABLE_CSS_HIGHLIGHTS && highlight.rangeCssHighlight) {
                const [_strRGB, cssHighlightID] = computeCssHighlightRGBID(highlight);
                const cssHighlight = CSS.highlights.get(cssHighlightID);
                if (cssHighlight && cssHighlight.has(highlight.rangeCssHighlight)) {
                    cssHighlight.delete(highlight.rangeCssHighlight);
                }
            }
        }
        else {
            break;
        }
    }
}
function recreateAllHighlightsRaw(win, highlights) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw: " + _highlights.length + " ==> " + (highlights === null || highlights === void 0 ? void 0 : highlights.length));
    }
    const documant = win.document;
    if (highlights === null || highlights === void 0 ? void 0 : highlights.length) {
        if (_highlights.length) {
            if (IS_DEV) {
                console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw DESTROY OLD BEFORE RESTORE BACKUP: " + _highlights.length + " ==> " + highlights.length);
            }
            destroyAllhighlights(documant);
        }
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw RESTORE BACKUP: " + _highlights.length + " ==> " + highlights.length);
        }
        _highlights.push(...highlights);
    }
    if (!_highlights.length) {
        return;
    }
    if (!documant.body) {
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- NO BODY?! (retrying...): " + _highlights.length);
        }
        (0, exports.recreateAllHighlightsDebounced)(win);
        return;
    }
    hideAllhighlights(documant);
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const rootComputedStyle = win.getComputedStyle(documant.documentElement);
    const bodyComputedStyle = win.getComputedStyle(documant.body);
    const docFrag = documant.createDocumentFragment();
    for (const highlight of _highlights) {
        const r = adjustRangeInfo(win, highlight.range, highlight.selectionInfo);
        if (r) {
            highlight.range = r;
        }
        else if (r === null) {
        }
        else if (typeof r === "undefined") {
            continue;
        }
        let div;
        try {
            div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle, rootComputedStyle);
        }
        catch (err) {
            console.log("createHighlightDom ERROR:");
            console.log(err);
        }
        if (div) {
            docFrag.append(div);
        }
    }
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlightDom DONE: " + _highlights.length);
    }
    const highlightsContainer = ensureHighlightsContainer(win, bodyComputedStyle, rootComputedStyle);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsDebounced = debounce((win) => {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsDebounced: " + _highlights.length);
    }
    recreateAllHighlightsRaw(win);
}, 500);
function recreateAllHighlights(win) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlights: " + _highlights.length);
    }
    hideAllhighlights(win.document);
    (0, exports.recreateAllHighlightsDebounced)(win);
}
function createHighlights(win, highDefs, pointerInteraction) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlights: " + highDefs.length + " ... " + _highlights.length);
    }
    const documant = win.document;
    const highlights = [];
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const rootComputedStyle = win.getComputedStyle(documant.documentElement);
    const bodyComputedStyle = win.getComputedStyle(documant.body);
    const docFrag = documant.createDocumentFragment();
    for (const highDef of highDefs) {
        if (!highDef.selectionInfo && !highDef.range) {
            highlights.push(null);
            continue;
        }
        const hh = createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, highDef.group, highDef.marginText, highDef.textPopup, bodyRect, bodyComputedStyle, rootComputedStyle);
        if (hh) {
            highlights.push(hh[0]);
            if (hh[1]) {
                docFrag.append(hh[1]);
            }
        }
    }
    const highlightsContainer = ensureHighlightsContainer(win, bodyComputedStyle, rootComputedStyle);
    highlightsContainer.append(docFrag);
    return highlights;
}
const computeCFI = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        if (node.parentNode) {
            return computeCFI(node.parentNode);
        }
        return undefined;
    }
    let cfi = "";
    let currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        const currentElementParentChildren = currentElement.parentNode.children;
        let currentElementIndex = -1;
        for (let i = 0; i < currentElementParentChildren.length; i++) {
            if (currentElement === currentElementParentChildren[i]) {
                currentElementIndex = i;
                break;
            }
        }
        if (currentElementIndex >= 0) {
            const cfiIndex = (currentElementIndex + 1) * 2;
            cfi = cfiIndex +
                (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                (cfi.length ? ("/" + cfi) : "");
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
const adjustRangeInfo = (win, range, selectionInfo) => {
    if ((!range || !range.startContainer) &&
        selectionInfo &&
        selectionInfo.rangeInfo.startContainerElementCssSelector === selectionInfo.rangeInfo.endContainerElementCssSelector &&
        selectionInfo.rangeInfo.startContainerChildTextNodeIndex === -1 &&
        selectionInfo.rangeInfo.startOffset === -1 &&
        selectionInfo.rangeInfo.endOffset === -1) {
        console.log("createHighlight EMPTY selectionInfo", JSON.stringify(selectionInfo, null, 4));
        const el = win.document.querySelector(selectionInfo.rangeInfo.startContainerElementCssSelector);
        if (el) {
            console.log("createHighlight EMPTY selectionInfo: ELEMENT match", selectionInfo.rangeInfo.startContainerElementCssSelector);
            let _firstTextNode;
            const scanTextNodes = (elem) => {
                var _a, _b;
                const lower = elem.tagName.toLowerCase();
                if (elem.getAttribute("id") === styles_1.ID_HIGHLIGHTS_CONTAINER ||
                    lower === "audio" || lower === "img" || lower === "script" || lower === "noscript") {
                    return;
                }
                for (let i = 0; i < elem.childNodes.length; i++) {
                    const childNode = elem.childNodes[i];
                    if (childNode.nodeType === 1) {
                        if (!_firstTextNode) {
                            scanTextNodes(childNode);
                        }
                    }
                    else if (childNode.nodeType === 3 && (((_a = childNode.nodeValue) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0) {
                        let text = (_b = childNode.nodeValue) === null || _b === void 0 ? void 0 : _b.replace(/\s\s+/g, " ");
                        if (text) {
                            text = text.trim();
                        }
                        if (text && !_firstTextNode) {
                            _firstTextNode = childNode;
                        }
                    }
                }
            };
            scanTextNodes(el);
            if (_firstTextNode) {
                console.log("createHighlight EMPTY selectionInfo: FIRST TEXT NODE found", _firstTextNode.nodeValue);
                range = new Range();
                range.selectNodeContents(_firstTextNode);
                range.setStart(range.startContainer, range.startOffset);
                range.setEnd(range.endContainer, range.startOffset + 1);
                return range;
            }
            else {
                if (el === win.document.documentElement || el === win.document.body) {
                    console.log("createHighlight EMPTY selectionInfo: FIRST TEXT NODE not found, fallback ELEMENT inside HTML BODY", el.nodeName);
                    let _firstLeafElement;
                    const scanElementNodes = (elem) => {
                        for (let i = 0; i < elem.childNodes.length; i++) {
                            const childNode = elem.childNodes[i];
                            if (childNode.nodeType === 1) {
                                if (!_firstLeafElement && !childNode.childNodes.length) {
                                    _firstLeafElement = childNode;
                                }
                                if (!_firstLeafElement) {
                                    scanElementNodes(childNode);
                                }
                            }
                        }
                    };
                    scanElementNodes(el);
                    range = new Range();
                    if (!win && _firstLeafElement) {
                        console.log("createHighlight EMPTY selectionInfo: fallback ELEMENT first leaf: ", _firstLeafElement.nodeName);
                        range.selectNode(_firstLeafElement);
                    }
                    else {
                        console.log("createHighlight EMPTY selectionInfo: fallback fail: ", el.nodeName);
                        range.selectNodeContents(el);
                    }
                    return range;
                }
                else {
                    console.log("createHighlight EMPTY selectionInfo: FIRST TEXT NODE not found, fallback ELEMENT", el.nodeName);
                    range = new Range();
                    range.selectNode(el);
                    return range;
                }
            }
        }
        else {
            console.log("createHighlight EMPTY selectionInfo: ELEMENT NOT match", selectionInfo.rangeInfo.startContainerElementCssSelector);
            return undefined;
        }
    }
    return null;
};
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, group, marginText, textPopup, bodyRect, bodyComputedStyle, rootComputedStyle) {
    const r = adjustRangeInfo(win, range, selectionInfo);
    if (r) {
        range = r;
    }
    else if (r === null) {
    }
    else if (typeof r === "undefined") {
        return undefined;
    }
    const uniqueStr = selectionInfo ? `${selectionInfo.rangeInfo.startContainerElementCssSelector}${selectionInfo.rangeInfo.startContainerChildTextNodeIndex}${selectionInfo.rangeInfo.startOffset}${selectionInfo.rangeInfo.endContainerElementCssSelector}${selectionInfo.rangeInfo.endContainerChildTextNodeIndex}${selectionInfo.rangeInfo.endOffset}` : range ? `${range.startOffset}-${range.endOffset}-${computeCFI(range.startContainer)}-${computeCFI(range.endContainer)}` : "_RANGE_";
    const checkSum = crypto.createHash("sha1");
    checkSum.update(uniqueStr);
    const shaHex = checkSum.digest("hex");
    const idBase = "R2_HIGHLIGHT_" + shaHex;
    let id = idBase;
    let idIdx = 0;
    while (_highlights.find((h) => h.id === id) ||
        win.document.getElementById(id)) {
        if (IS_DEV) {
            console.log("HIGHLIGHT ID already exists, increment: " + uniqueStr + " ==> " + id);
        }
        id = `${idBase}_${idIdx++}`;
    }
    const highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        drawType,
        expand,
        id,
        pointerInteraction,
        selectionInfo,
        range,
        group,
        marginText,
        textPopup,
    };
    _highlights.push(highlight);
    let div;
    try {
        div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle, rootComputedStyle);
    }
    catch (err) {
        console.log("createHighlightDom ERROR:");
        console.log(err);
    }
    return [highlight, div || null];
}
const computeCssHighlightRGBID = (highlight) => {
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    const strRGB = `R${highlight.color.red}G${highlight.color.green}B${highlight.color.blue}${drawUnderline ? "_" : drawStrikeThrough ? "__" : ""}`;
    const cssHighlightID = `highlight_${strRGB}`;
    return [strRGB, cssHighlightID];
};
const calcRGB = (rgb) => {
    return (rgb <= 0.03928) ? rgb / 12.92 : Math.pow(((rgb + 0.055) / 1.055), 2.4);
};
const computeHighContrastForegroundColourForBackground = (color) => {
    let foregroundColour = "#ffffff";
    const red = calcRGB(color.red);
    const green = calcRGB(color.green);
    const blue = calcRGB(color.blue);
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const pickBlack = (luminance + 0.05) / 0.05;
    const pickWhite = 1.05 / (luminance + 0.05);
    if (pickBlack > pickWhite) {
        foregroundColour = "#000000";
    }
    return foregroundColour;
};
const JAPANESE_RUBY_TO_SKIP = ["rt", "rp"];
function createHighlightDom(win, highlight, bodyRect, bodyComputedStyle, rootComputedStyle) {
    var _a, _b, _c;
    const DEBUG_RECTS = window.DEBUG_RECTS;
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const range = highlight.range ? highlight.range : highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : undefined;
    if (!range) {
        return null;
    }
    let rangeHasSVG = false;
    let parent = range.startContainer;
    while (parent) {
        if (parent.nodeType === Node.ELEMENT_NODE) {
            const ns = parent.namespaceURI;
            if (ns && ns.includes("svg")) {
                rangeHasSVG = true;
                break;
            }
        }
        parent = parent.parentNode;
    }
    if (!rangeHasSVG) {
        parent = range.endContainer;
        while (parent) {
            if (parent.nodeType === Node.ELEMENT_NODE) {
                const ns = parent.namespaceURI;
                if (ns && ns.includes("svg")) {
                    rangeHasSVG = true;
                    break;
                }
            }
            parent = parent.parentNode;
        }
    }
    const drawBackground = !highlight.drawType || highlight.drawType === highlight_1.HighlightDrawTypeBackground;
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    const drawOutline = highlight.drawType === highlight_1.HighlightDrawTypeOutline;
    const drawOpacityMask = highlight.drawType === highlight_1.HighlightDrawTypeOpacityMask;
    const drawOpacityMaskRuler = highlight.drawType === highlight_1.HighlightDrawTypeOpacityMaskRuler;
    const drawMarginBookmark = highlight.drawType === highlight_1.HighlightDrawTypeMarginBookmark;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
    const rtl = (0, readium_css_2.isRTL)();
    const isVWM = (0, readium_css_1.isVerticalWritingMode)();
    const doDrawMargin = drawMargin(highlight);
    const inverseZoom = computeInverseZoom(bodyComputedStyle, rootComputedStyle);
    const underlineThickness = 3 / inverseZoom;
    const strikeThroughLineThickness = 3 / inverseZoom;
    if (exports.ENABLE_CSS_HIGHLIGHTS && !doDrawMargin && !rangeHasSVG && (drawBackground || (drawUnderline && !isVWM) || (drawStrikeThrough && !isVWM))) {
        highlight.rangeCssHighlight = range;
        const [strRGB, cssHighlightID] = computeCssHighlightRGBID(highlight);
        const styleElement = win.document.getElementById("Readium2-" + strRGB);
        if (!styleElement) {
            const foregroundColour = computeHighContrastForegroundColourForBackground(highlight.color);
            (0, readium_css_inject_1.appendCSSInline)(win.document, strRGB, drawUnderline || drawStrikeThrough
                ?
                    `
::highlight(${cssHighlightID}) {
    text-decoration-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});
    text-decoration-style: solid;
    text-decoration-thickness: ${0.16 / inverseZoom}em;
    text-decoration-line: ${drawUnderline ? "underline" : "line-through"};
}
`
                :
                    `
::highlight(${cssHighlightID}) {
    background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});
    color: ${foregroundColour};
}
@supports (color: contrast-color(red)) {

    ::highlight(${cssHighlightID}) {
        background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});

        color: contrast-color(rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}));
        text-shadow: none;
    }
}
`);
        }
        let cssHighlight = CSS.highlights.get(cssHighlightID);
        if (!cssHighlight) {
            cssHighlight = new Highlight();
            CSS.highlights.set(cssHighlightID, cssHighlight);
        }
        cssHighlight.add(highlight.rangeCssHighlight);
    }
    const highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_CONTAINER} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
    highlightParent.setAttribute("data-type", `${highlight.drawType || highlight_1.HighlightDrawTypeBackground}`);
    if (highlight.group) {
        highlightParent.setAttribute("data-group", highlight.group);
    }
    if (doDrawMargin) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_MARGIN);
    }
    highlightParent.__inverseZoom = inverseZoom;
    if (drawBackground) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_BEHIND);
    }
    if ((drawOpacityMask || drawOpacityMaskRuler)) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_MASK);
    }
    if (!highlight.pointerInteraction &&
        (highlight.rangeCssHighlight)) {
        return highlightParent;
    }
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    let clientRects;
    const rangeClientRects = (0, rect_utils_1.DOMRectListToArray)(range.getClientRects());
    if (doNotMergeHorizontallyAlignedRects) {
        const textClientRects = (0, rect_utils_1.getTextClientRects)(range, JAPANESE_RUBY_TO_SKIP);
        const textReducedClientRects = (0, rect_utils_1.getClientRectsNoOverlap)(textClientRects, true, isVWM, highlight.expand ? highlight.expand : 0);
        clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRects;
    }
    else {
        console.log("DEBUGDANIEL1", JSON.stringify(rangeClientRects, null, 4));
        if (drawMarginBookmark &&
            rangeClientRects.length === 2 &&
            Math.floor(rangeClientRects[0].width) === 0 &&
            Math.floor(rangeClientRects[1].width) === 0) {
            console.log("DEBUGDANIEL2", JSON.stringify(rangeClientRects, null, 4));
            rangeClientRects[0].width = 2;
            rangeClientRects[0].left -= 1;
            rangeClientRects[0].right += 1;
            rangeClientRects[1].width = 2;
            rangeClientRects[1].left -= 1;
            rangeClientRects[1].right += 1;
        }
        clientRects = (0, rect_utils_1.getClientRectsNoOverlap)(rangeClientRects, false, isVWM, highlight.expand ? highlight.expand : 0);
        console.log("DEBUGDANIEL3", JSON.stringify(clientRects, null, 4));
    }
    const gap = 2;
    const gapX = ((drawOutline || drawBackground) ? 4 : 0);
    const boxesNoGapExpanded = [];
    const boxesGapExpanded = [];
    for (const clientRect of clientRects) {
        const rect = {
            height: clientRect.height,
            left: clientRect.left - xOffset,
            top: clientRect.top - yOffset,
            width: clientRect.width,
        };
        const w = rect.width * scale;
        const h = rect.height * scale;
        const x = rect.left * scale;
        const y = rect.top * scale;
        boxesGapExpanded.push(new core_1.Box(Number((x - gap).toPrecision(12)), Number((y - gap).toPrecision(12)), Number((x + w + gap).toPrecision(12)), Number((y + h + gap).toPrecision(12))));
        if (drawStrikeThrough) {
            const thickness = DEBUG_RECTS ? (isVWM ? rect.width : rect.height) : strikeThroughLineThickness;
            const ww = (isVWM ? thickness : rect.width) * scale;
            const hh = (isVWM ? rect.height : thickness) * scale;
            const xx = (isVWM
                ?
                    (DEBUG_RECTS
                        ?
                            rect.left
                        :
                            (rect.left + (rect.width / 2) - (thickness / 2)))
                :
                    rect.left) * scale;
            const yy = (isVWM
                ?
                    rect.top
                :
                    (DEBUG_RECTS
                        ?
                            rect.top
                        :
                            (rect.top + (rect.height / 2) - (thickness / 2)))) * scale;
            boxesNoGapExpanded.push(new core_1.Box(Number((xx - gapX).toPrecision(12)), Number((yy - gapX).toPrecision(12)), Number((xx + ww + gapX).toPrecision(12)), Number((yy + hh + gapX).toPrecision(12))));
        }
        else {
            const thickness = DEBUG_RECTS ? (isVWM ? rect.width : rect.height) : underlineThickness;
            if (drawUnderline) {
                const ww = (isVWM ? thickness : rect.width) * scale;
                const hh = (isVWM ? rect.height : thickness) * scale;
                const xx = (isVWM
                    ?
                        (DEBUG_RECTS
                            ?
                                rect.left
                            :
                                (rect.left - (thickness + thickness / 2)))
                    :
                        rect.left) * scale;
                const yy = (isVWM
                    ?
                        rect.top
                    :
                        (DEBUG_RECTS
                            ?
                                rect.top
                            :
                                (rect.top + rect.height - (thickness / 2)))) * scale;
                boxesNoGapExpanded.push(new core_1.Box(Number((xx - gapX).toPrecision(12)), Number((yy - gapX).toPrecision(12)), Number((xx + ww + gapX).toPrecision(12)), Number((yy + hh + gapX).toPrecision(12))));
            }
            else {
                boxesNoGapExpanded.push(new core_1.Box(Number((x - gapX).toPrecision(12)), Number((y - gapX).toPrecision(12)), Number((x + w + gapX).toPrecision(12)), Number((y + h + gapX).toPrecision(12))));
            }
        }
    }
    const polygonCountourUnionPoly = boxesGapExpanded.reduce((previousPolygon, currentBox) => {
        const p = new core_1.Polygon();
        const f = p.addFace(currentBox);
        if (f.orientation() !== BASE_ORIENTATION) {
            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 2");
            f.reverse();
        }
        return unify(previousPolygon, p);
    }, new core_1.Polygon());
    Array.from(polygonCountourUnionPoly.faces).forEach((face) => {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (contour))");
            }
            polygonCountourUnionPoly.deleteFace(face);
        }
    });
    cleanupPolygon(polygonCountourUnionPoly, gap);
    const bodyPaddingLeft = parseInt(bodyComputedStyle.paddingLeft, 10) / inverseZoom;
    const bodyPaddingRight = parseInt(bodyComputedStyle.paddingRight, 10) / inverseZoom;
    const bodyWidth = parseInt(bodyComputedStyle.width, 10) / inverseZoom;
    const bodyHeight = parseInt(bodyComputedStyle.height, 10) / inverseZoom;
    const paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    const paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    const paginatedGap = (paginatedWidth - bodyWidth) / 2;
    const paginatedOffset = paginatedGap + bodyPaddingLeft;
    const useFastBoundingRect = true;
    if (drawOpacityMask || drawOpacityMaskRuler) {
        let boundingRectMaskBase;
        const polygonMaskBaseRects = [];
        const bodyRect_ = {
            left: win.READIUM2.isFixedLayout
                ?
                    0
                :
                    (rtl
                        ?
                            (paginated
                                ?
                                    -(paginatedGap + paginatedGap + bodyRect.width - (paginatedWidth * (paginatedTwo ? 2 : 1)))
                                :
                                    0)
                        :
                            (paginated
                                ?
                                    0
                                :
                                    0)),
            top: win.READIUM2.isFixedLayout ? 0 : rtl ? 0 : 0,
            width: win.READIUM2.isFixedLayout
                ?
                    bodyRect.width * scale
                :
                    (rtl
                        ?
                            (paginated
                                ?
                                    bodyRect.width + paginatedGap + paginatedGap
                                :
                                    bodyRect.width)
                        :
                            (paginated
                                ?
                                    bodyRect.width + paginatedGap + paginatedGap
                                :
                                    bodyRect.width)),
            height: win.READIUM2.isFixedLayout
                ?
                    bodyRect.height * scale
                :
                    bodyRect.height,
            right: 0,
            bottom: 0,
        };
        bodyRect_.right = bodyRect_.left + bodyRect_.width;
        bodyRect_.bottom = bodyRect_.top + bodyRect_.height;
        boundingRectMaskBase = boundingRectMaskBase ? (0, rect_utils_1.getBoundingRect)(boundingRectMaskBase, bodyRect_) : bodyRect_;
        polygonMaskBaseRects.push(bodyRect_);
        let polygonMaskBaseUnionPoly;
        if (paginated) {
            const tolerance = 1;
            const groups = [];
            for (const r of polygonMaskBaseRects) {
                const group = groups.find((g) => {
                    return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                });
                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                }
                else {
                    (_a = group.boxes) === null || _a === void 0 ? void 0 : _a.push(r);
                }
            }
            boundingRectMaskBase = groups.map((g) => {
                return g.boxes.reduce((prev, cur) => {
                    if (prev === cur) {
                        return cur;
                    }
                    return (0, rect_utils_1.getBoundingRect)(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRectMaskBase.length === 1) {
                boundingRectMaskBase = boundingRectMaskBase[0];
            }
        }
        if (useFastBoundingRect) {
            if (boundingRectMaskBase) {
                polygonMaskBaseUnionPoly = new core_1.Polygon();
                if (Array.isArray(boundingRectMaskBase)) {
                    for (const b of boundingRectMaskBase) {
                        const f = polygonMaskBaseUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                            f.reverse();
                        }
                    }
                }
                else {
                    const f = polygonMaskBaseUnionPoly.addFace(new core_1.Box(boundingRectMaskBase.left, boundingRectMaskBase.top, boundingRectMaskBase.right, boundingRectMaskBase.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                        f.reverse();
                    }
                }
            }
            else {
                const poly = new core_1.Polygon();
                for (const r of polygonMaskBaseRects) {
                    const f = poly.addFace(new core_1.Box(r.left, r.top, r.right, r.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                        f.reverse();
                    }
                }
                polygonMaskBaseUnionPoly = new core_1.Polygon();
                const f = polygonMaskBaseUnionPoly.addFace(poly.box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                    f.reverse();
                }
            }
        }
        else {
            polygonMaskBaseUnionPoly = polygonMaskBaseRects.reduce((previousPolygon, r) => {
                const b = new core_1.Box(r.left, r.top, r.right, r.bottom);
                const p = new core_1.Polygon();
                const f = p.addFace(b);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                return unify(previousPolygon, p);
            }, new core_1.Polygon());
        }
        if (drawOpacityMaskRuler) {
            try {
                polygonMaskBaseUnionPoly = offset(polygonMaskBaseUnionPoly, 20, true);
            }
            catch (e) {
                console.log(e);
            }
        }
        let polygonMaskUnionPoly;
        if (drawOpacityMaskRuler) {
            let boundingRectMask;
            const polygonMaskRects = [];
            for (const f of polygonCountourUnionPoly.faces) {
                const face = f;
                const b = face.box;
                const left = isVWM
                    ?
                        b.xmin
                    :
                        paginated
                            ?
                                ((rtl
                                    ?
                                        paginatedGap + bodyPaddingLeft
                                    :
                                        paginatedGap + bodyPaddingLeft)
                                    + Math.floor(b.xmin / paginatedWidth) * paginatedWidth)
                            :
                                (rtl
                                    ?
                                        0
                                    :
                                        win.READIUM2.isFixedLayout
                                            ?
                                                0
                                            :
                                                0);
                const top = isVWM
                    ?
                        0
                    :
                        b.ymin;
                const width = isVWM
                    ?
                        b.width
                    :
                        paginated
                            ?
                                (rtl
                                    ?
                                        bodyWidth - bodyPaddingLeft - bodyPaddingRight
                                    :
                                        bodyWidth - bodyPaddingLeft - bodyPaddingRight)
                            :
                                bodyWidth;
                const height = isVWM
                    ?
                        bodyHeight
                    :
                        b.height;
                const extra = 0;
                const r = {
                    left: left - (isVWM ? extra : 0),
                    top: top - (isVWM ? 0 : extra),
                    right: left + width + (isVWM ? extra : 0),
                    bottom: top + height + (isVWM ? 0 : extra),
                    width: width + extra * 2,
                    height: height + extra * 2,
                };
                boundingRectMask = boundingRectMask ? (0, rect_utils_1.getBoundingRect)(boundingRectMask, r) : r;
                polygonMaskRects.push(r);
            }
            if (paginated) {
                const tolerance = 1;
                const groups = [];
                for (const r of polygonMaskRects) {
                    const group = groups.find((g) => {
                        return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                    });
                    if (!group) {
                        groups.push({
                            x: r.left,
                            boxes: [r],
                        });
                    }
                    else {
                        (_b = group.boxes) === null || _b === void 0 ? void 0 : _b.push(r);
                    }
                }
                boundingRectMask = groups.map((g) => {
                    return g.boxes.reduce((prev, cur) => {
                        if (prev === cur) {
                            return cur;
                        }
                        return (0, rect_utils_1.getBoundingRect)(prev, cur);
                    }, g.boxes[0]);
                });
                if (boundingRectMask.length === 1) {
                    boundingRectMask = boundingRectMask[0];
                }
            }
            if (useFastBoundingRect) {
                if (boundingRectMask) {
                    polygonMaskUnionPoly = new core_1.Polygon();
                    if (Array.isArray(boundingRectMask)) {
                        for (const b of boundingRectMask) {
                            const f = polygonMaskUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                            if (f.orientation() !== BASE_ORIENTATION) {
                                console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                                f.reverse();
                            }
                        }
                    }
                    else {
                        const f = polygonMaskUnionPoly.addFace(new core_1.Box(boundingRectMask.left, boundingRectMask.top, boundingRectMask.right, boundingRectMask.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                            f.reverse();
                        }
                    }
                }
                else {
                    const poly = new core_1.Polygon();
                    for (const r of polygonMaskRects) {
                        const f = poly.addFace(new core_1.Box(r.left, r.top, r.right, r.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                            f.reverse();
                        }
                    }
                    polygonMaskUnionPoly = new core_1.Polygon();
                    const f = polygonMaskUnionPoly.addFace(poly.box);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                        f.reverse();
                    }
                }
            }
            else {
                polygonMaskUnionPoly = polygonMaskRects.reduce((previousPolygon, r) => {
                    const b = new core_1.Box(r.left, r.top, r.right, r.bottom);
                    const p = new core_1.Polygon();
                    const f = p.addFace(b);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                        f.reverse();
                    }
                    return unify(previousPolygon, p);
                }, new core_1.Polygon());
            }
            try {
                polygonMaskUnionPoly = offset(polygonMaskUnionPoly, 10, false);
            }
            catch (e) {
                console.log(e);
            }
        }
        const polyToDraw = polygonMaskUnionPoly ?
            subtract(polygonMaskBaseUnionPoly, polygonMaskUnionPoly) :
            subtract(polygonMaskBaseUnionPoly, polygonCountourUnionPoly);
        const highlightMaskSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightMaskSVG.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_COMMON_SVG} ${styles_1.CLASS_HIGHLIGHT_SVG} ${styles_1.CLASS_HIGHLIGHT_CONTOUR}`);
        highlightMaskSVG.polygon = polyToDraw;
        let rsBackground = bodyComputedStyle.getPropertyValue("--RS__backgroundColor");
        if (!rsBackground) {
            rsBackground = rootComputedStyle.getPropertyValue("--RS__backgroundColor");
        }
        if (rsBackground === "transparent") {
            rsBackground = "";
        }
        let rsForeground = bodyComputedStyle.getPropertyValue("--RS__textColor");
        if (!rsForeground) {
            rsForeground = rootComputedStyle.getPropertyValue("--RS__textColor");
        }
        const svgPathMask = highlightMaskSVG.polygon.scale(inverseZoom, inverseZoom).svg({
            fillRule: "evenodd",
            fill: rsBackground ? rsBackground : "white",
            fillOpacity: 0.9,
            stroke: drawOpacityMaskRuler ? (rsForeground ? rsForeground : "black") : "transparent",
            strokeWidth: drawOpacityMaskRuler ? 1.5 : 0,
            className: undefined,
        });
        highlightMaskSVG.innerHTML = svgPathMask;
        highlightParent.append(highlightMaskSVG);
    }
    if (!highlight.pointerInteraction &&
        (((drawOpacityMask || drawOpacityMaskRuler) && highlight.group === exports.HIGHLIGHT_GROUP_TTS))) {
        return highlightParent;
    }
    if (!drawOpacityMask && !drawOpacityMaskRuler && !drawMarginBookmark) {
        let polygonSurface;
        if (highlight.rangeCssHighlight) {
            polygonSurface = undefined;
        }
        else if (doNotMergeHorizontallyAlignedRects) {
            const singleSVGPath = !DEBUG_RECTS;
            if (singleSVGPath) {
                polygonSurface = new core_1.Polygon();
                for (const box of boxesNoGapExpanded) {
                    const f = polygonSurface.addFace(box);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 3");
                        f.reverse();
                    }
                }
            }
            else {
                polygonSurface = [];
                for (const box of boxesNoGapExpanded) {
                    const poly = new core_1.Polygon();
                    const f = poly.addFace(box);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 4");
                        f.reverse();
                    }
                    polygonSurface.push(poly);
                }
            }
        }
        else {
            polygonSurface = boxesNoGapExpanded.reduce((previousPolygon, currentBox) => {
                const p = new core_1.Polygon();
                const f = p.addFace(currentBox);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 5");
                    f.reverse();
                }
                return unify(previousPolygon, p);
            }, new core_1.Polygon());
            Array.from(polygonSurface.faces).forEach((face) => {
                if (face.orientation() !== BASE_ORIENTATION) {
                    if (DEBUG_RECTS) {
                        console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (surface))");
                    }
                    polygonSurface.deleteFace(face);
                }
            });
            if (drawOutline || drawBackground || drawOpacityMask || drawOpacityMaskRuler) {
                if (DEBUG_RECTS) {
                    console.log("--==========--==========--==========--==========--==========--==========");
                    console.log("--POLY FACES BEFORE ...");
                }
                for (const f of polygonSurface.faces) {
                    const face = f;
                    if (DEBUG_RECTS) {
                        console.log("--................--................--................");
                        console.log("--POLY FACE: " + (face.orientation() === core_1.ORIENTATION.CCW ? "CCW" : face.orientation() === core_1.ORIENTATION.CW ? "CW" : "ORIENTATION.NOT_ORIENTABLE"));
                    }
                    for (const edge of face.edges) {
                        if (DEBUG_RECTS) {
                            console.log("--POLY EDGE");
                        }
                        if (edge.isSegment) {
                            if (DEBUG_RECTS) {
                                console.log("--POLY SEGMENT...");
                            }
                            const segment = edge.shape;
                            const pointStart = segment.start;
                            const pointEnd = segment.end;
                            if (DEBUG_RECTS) {
                                console.log("--POLY SEGMENT START x, y: " + pointStart.x + ", " + pointStart.y);
                                console.log("--POLY SEGMENT END x, y: " + pointEnd.x + ", " + pointEnd.y);
                            }
                        }
                        else if (edge.isArc) {
                            if (DEBUG_RECTS) {
                                console.log("--POLY ARC...");
                            }
                            const arc = edge.shape;
                            if (DEBUG_RECTS) {
                                console.log("--POLY ARC: " + arc.start.x + ", " + arc.start.y);
                                console.log("--POLY ARC: " + arc.end.x + ", " + arc.end.y);
                                console.log("--POLY ARC: " + arc.length + " / " + arc.sweep);
                            }
                        }
                    }
                }
                try {
                    polygonSurface = offset(polygonSurface, -(gap + gap / 2));
                }
                catch (e) {
                    console.log(e);
                }
                if (DEBUG_RECTS) {
                    console.log("--==========--==========--==========--==========--==========--==========");
                    console.log("--POLY FACES AFTER ...");
                }
                for (const f of polygonSurface.faces) {
                    const face = f;
                    if (DEBUG_RECTS) {
                        console.log("--................--................--................");
                        console.log("--POLY FACE: " + (face.orientation() === core_1.ORIENTATION.CCW ? "CCW" : face.orientation() === core_1.ORIENTATION.CW ? "CW" : "ORIENTATION.NOT_ORIENTABLE"));
                    }
                    for (const edge of face.edges) {
                        if (DEBUG_RECTS) {
                            console.log("--POLY EDGE");
                        }
                        if (edge.isSegment) {
                            if (DEBUG_RECTS) {
                                console.log("--POLY SEGMENT...");
                            }
                            const segment = edge.shape;
                            const pointStart = segment.start;
                            const pointEnd = segment.end;
                            if (DEBUG_RECTS) {
                                console.log("--POLY SEGMENT START x, y: " + pointStart.x + ", " + pointStart.y);
                                console.log("--POLY SEGMENT END x, y: " + pointEnd.x + ", " + pointEnd.y);
                            }
                        }
                        else if (edge.isArc) {
                            if (DEBUG_RECTS) {
                                console.log("--POLY ARC...");
                            }
                            const arc = edge.shape;
                            if (DEBUG_RECTS) {
                                console.log("--POLY ARC: " + arc.start.x + ", " + arc.start.y);
                                console.log("--POLY ARC: " + arc.end.x + ", " + arc.end.y);
                                console.log("--POLY ARC: " + arc.length + " / " + arc.sweep);
                            }
                        }
                    }
                }
            }
        }
        if (DEBUG_RECTS) {
            addEdgePoints(polygonCountourUnionPoly, 1);
            if (!polygonSurface) {
            }
            else if (Array.isArray(polygonSurface)) {
                for (const poly of polygonSurface) {
                    addEdgePoints(poly, 1);
                }
            }
            else {
                addEdgePoints(polygonSurface, 1);
            }
        }
        const highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightAreaSVG.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_COMMON} ${styles_1.CLASS_HIGHLIGHT_CONTOUR}`);
        highlightAreaSVG.polygon = polygonCountourUnionPoly;
        const outlineThickness = 2;
        highlightAreaSVG.innerHTML =
            (polygonSurface ?
                (Array.isArray(polygonSurface)
                    ?
                        polygonSurface.reduce((prevSVGPath, currentPolygon) => {
                            return prevSVGPath + currentPolygon.scale(inverseZoom, inverseZoom).svg({
                                fill: DEBUG_RECTS ? "pink" : (drawOutline || highlight.rangeCssHighlight) ? "transparent" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
                                fillRule: "evenodd",
                                stroke: DEBUG_RECTS ? "magenta" : drawOutline ? `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` : "transparent",
                                strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? outlineThickness : 0,
                                fillOpacity: 1,
                                className: undefined,
                            });
                        }, "")
                    :
                        polygonSurface.scale(inverseZoom, inverseZoom).svg({
                            fill: DEBUG_RECTS ? "yellow" : (drawOutline || highlight.rangeCssHighlight) ? "transparent" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
                            fillRule: "evenodd",
                            stroke: DEBUG_RECTS ? "green" : drawOutline ? `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` : "transparent",
                            strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? outlineThickness : 0,
                            fillOpacity: 1,
                            className: undefined,
                        })) : "")
                +
                    polygonCountourUnionPoly.scale(inverseZoom, inverseZoom).svg({
                        fill: "transparent",
                        fillRule: "evenodd",
                        stroke: DEBUG_RECTS ? "red" : "transparent",
                        strokeWidth: DEBUG_RECTS ? 1 : 1,
                        fillOpacity: 1,
                        className: undefined,
                    });
        highlightParent.append(highlightAreaSVG);
    }
    if (doDrawMargin && highlight.pointerInteraction) {
        const MARGIN_MARKER_THICKNESS = 14 * (win.READIUM2.isFixedLayout ? 1 : (1 / inverseZoom));
        const MARGIN_MARKER_OFFSET = 6 * (win.READIUM2.isFixedLayout ? 1 : (1 / inverseZoom));
        let boundingRectCountourMargin;
        const polygonCountourMarginRects = [];
        for (const f of polygonCountourUnionPoly.faces) {
            const face = f;
            const b = face.box;
            const left = isVWM
                ?
                    b.xmin
                :
                    paginated
                        ?
                            ((rtl
                                ?
                                    MARGIN_MARKER_OFFSET - paginatedOffset + paginatedWidth
                                :
                                    paginatedOffset - MARGIN_MARKER_OFFSET - MARGIN_MARKER_THICKNESS)
                                +
                                    Math.floor((b.xmin) / paginatedWidth) * paginatedWidth)
                        :
                            (rtl
                                ?
                                    MARGIN_MARKER_OFFSET + bodyRect.width - bodyPaddingRight
                                :
                                    win.READIUM2.isFixedLayout
                                        ?
                                            MARGIN_MARKER_OFFSET
                                        :
                                            bodyPaddingLeft - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET);
            const top = isVWM
                ?
                    parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                :
                    b.ymin;
            const width = isVWM ? b.width : MARGIN_MARKER_THICKNESS;
            const height = isVWM ? MARGIN_MARKER_THICKNESS : b.height;
            const extra = 0;
            const r = {
                left: left - (isVWM ? extra : 0),
                top: top - (isVWM ? 0 : extra),
                right: left + width + (isVWM ? extra : 0),
                bottom: top + height + (isVWM ? 0 : extra),
                width: width + extra * 2,
                height: height + extra * 2,
            };
            boundingRectCountourMargin = boundingRectCountourMargin ? (0, rect_utils_1.getBoundingRect)(boundingRectCountourMargin, r) : r;
            polygonCountourMarginRects.push(r);
        }
        let polygonMarginUnionPoly;
        if (paginated) {
            const tolerance = 1;
            const groups = [];
            for (const r of polygonCountourMarginRects) {
                const group = groups.find((g) => {
                    return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                });
                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                }
                else {
                    (_c = group.boxes) === null || _c === void 0 ? void 0 : _c.push(r);
                }
            }
            boundingRectCountourMargin = groups.map((g) => {
                return g.boxes.reduce((prev, cur) => {
                    if (prev === cur) {
                        return cur;
                    }
                    return (0, rect_utils_1.getBoundingRect)(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRectCountourMargin.length === 1) {
                boundingRectCountourMargin = boundingRectCountourMargin[0];
            }
        }
        if (useFastBoundingRect) {
            if (boundingRectCountourMargin) {
                polygonMarginUnionPoly = new core_1.Polygon();
                if (Array.isArray(boundingRectCountourMargin)) {
                    for (const b of boundingRectCountourMargin) {
                        const f = polygonMarginUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                            f.reverse();
                        }
                    }
                }
                else {
                    const f = polygonMarginUnionPoly.addFace(new core_1.Box(boundingRectCountourMargin.left, boundingRectCountourMargin.top, boundingRectCountourMargin.right, boundingRectCountourMargin.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                        f.reverse();
                    }
                }
            }
            else {
                const poly = new core_1.Polygon();
                for (const r of polygonCountourMarginRects) {
                    const f = poly.addFace(new core_1.Box(r.left, r.top, r.right, r.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                        f.reverse();
                    }
                }
                polygonMarginUnionPoly = new core_1.Polygon();
                const f = polygonMarginUnionPoly.addFace(poly.box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                    f.reverse();
                }
            }
        }
        else {
            polygonMarginUnionPoly = polygonCountourMarginRects.reduce((previousPolygon, r) => {
                const b = new core_1.Box(r.left, r.top, r.right, r.bottom);
                const p = new core_1.Polygon();
                const f = p.addFace(b);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                return unify(previousPolygon, p);
            }, new core_1.Polygon());
        }
        if (drawMarginBookmark) {
            const ratio = 3;
            const delta = MARGIN_MARKER_THICKNESS / ratio;
            const polygonMarginUnionPoly_ = polygonMarginUnionPoly.clone();
            try {
                const bbox = polygonMarginUnionPoly.box;
                const vec = new core_1.Vector(bbox.center, new core_1.Point(0, 0));
                polygonMarginUnionPoly = polygonMarginUnionPoly.translate(vec);
                polygonMarginUnionPoly = polygonMarginUnionPoly.scale(1 / ratio, 1 / ratio);
                polygonMarginUnionPoly = polygonMarginUnionPoly.translate(vec.invert());
                polygonMarginUnionPoly = offset(polygonMarginUnionPoly, delta, false);
                const p = new core_1.Polygon();
                const triangleInset = MARGIN_MARKER_THICKNESS / 2.5;
                const f = p.addFace([
                    new core_1.Segment(new core_1.Point(polygonMarginUnionPoly.box.xmin, polygonMarginUnionPoly.box.ymax), new core_1.Point(polygonMarginUnionPoly.box.xmax, polygonMarginUnionPoly.box.ymax)),
                    new core_1.Segment(new core_1.Point(polygonMarginUnionPoly.box.xmax, polygonMarginUnionPoly.box.ymax), new core_1.Point(polygonMarginUnionPoly.box.xmin + polygonMarginUnionPoly.box.width / 2, polygonMarginUnionPoly.box.ymax - triangleInset)),
                    new core_1.Segment(new core_1.Point(polygonMarginUnionPoly.box.xmin + polygonMarginUnionPoly.box.width / 2, polygonMarginUnionPoly.box.ymax - triangleInset), new core_1.Point(polygonMarginUnionPoly.box.xmin, polygonMarginUnionPoly.box.ymax)),
                ]);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--xPOLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                polygonMarginUnionPoly = subtract(polygonMarginUnionPoly, p);
            }
            catch (e) {
                console.log(e);
                polygonMarginUnionPoly = polygonMarginUnionPoly_;
            }
        }
        const highlightMarginSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightMarginSVG.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_COMMON} ${styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN}`);
        highlightMarginSVG.polygon = polygonMarginUnionPoly;
        const svgPath = polygonMarginUnionPoly.scale(inverseZoom, inverseZoom).svg({
            fillRule: "evenodd",
            fill: `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
            stroke: "transparent",
            strokeWidth: 0,
            fillOpacity: 1,
            className: undefined,
        });
        if (exports.ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT) {
            let svg = svgPath;
            highlight.marginText = "Long test 1.";
            if (highlight.marginText) {
                const m = svg.match(/d="\s*M([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)/);
                if (m && m[1] && m[2]) {
                    const r2SvgHighlightsTextFilterID = `r2SvgFilterR${highlight.color.red}G${highlight.color.green}B${highlight.color.blue}`;
                    const el = highlightParent.querySelector(`#${r2SvgHighlightsTextFilterID}`);
                    const filter = el ? "" : `<defs><filter x="0" y="0" width="1" height="1" id="${r2SvgHighlightsTextFilterID}"><feFlood flood-color="rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})" result="bg" /><feMerge><feMergeNode in="bg"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
                    svg = `${filter}${svgPath}<text x="${m[1]}" y="${m[2]}" class="${styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN}_" font-size="stroke:red; fill: magenta;" filter="url(#${r2SvgHighlightsTextFilterID})">${highlight.marginText}</text>`;
                }
            }
            highlightMarginSVG.innerHTML = svg;
        }
        else {
            highlightMarginSVG.innerHTML = svgPath;
        }
        highlightParent.append(highlightMarginSVG);
    }
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map