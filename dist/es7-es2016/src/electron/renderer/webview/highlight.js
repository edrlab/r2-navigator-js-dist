"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlightsGroup = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.setDrawMargin = void 0;
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
const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
window.DEBUG_RECTS = IS_DEV && rect_utils_1.VERBOSE;
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
        if (edge.isSegment()) {
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
        else if (edge.isArc()) {
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
            if (edge.isSegment()) {
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
            else if (edge.isArc()) {
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
            if (edge.isSegment()) {
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
            else if (edge.isArc()) {
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
            if (edge.isSegment()) {
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
            if (edge.isSegment()) {
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
let _drawMargin = false;
const drawMargin = (h) => {
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
exports.getBoundingClientRectOfDocumentBody = getBoundingClientRectOfDocumentBody;
function processMouseEvent(win, ev) {
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
                hit = svg.polygon.contains(new core_1.Point((x - xOffset) * scale, (y - yOffset) * scale));
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
        documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        return;
    }
    if (foundElement && (foundHighlight === null || foundHighlight === void 0 ? void 0 : foundHighlight.pointerInteraction)) {
        if (isMouseMove) {
            foundElement.classList.add(styles_1.CLASS_HIGHLIGHT_HOVER);
            documant.documentElement.classList.add(styles_1.CLASS_HIGHLIGHT_CURSOR2);
        }
        else if (ev.type === "mouseup" || ev.type === "click") {
            documant.documentElement.classList.remove(styles_1.CLASS_HIGHLIGHT_CURSOR2);
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
}
let lastMouseDownX = -1;
let lastMouseDownY = -1;
let bodyEventListenersSet = false;
let _highlightsContainer;
function ensureHighlightsContainer(win) {
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
        _highlightsContainer = documant.createElement("div");
        _highlightsContainer.setAttribute("id", styles_1.ID_HIGHLIGHTS_CONTAINER);
        _highlightsContainer.setAttribute("class", styles_1.CLASS_HIGHLIGHT_COMMON);
        _highlightsContainer.setAttribute("style", "width: auto !important; " +
            "height: auto !important; ");
        documant.body.append(_highlightsContainer);
    }
    return _highlightsContainer;
}
function hideAllhighlights(_documant) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- hideAllhighlights: " + _highlights.length);
    }
    if (_highlightsContainer) {
        _highlightsContainer.remove();
        _highlightsContainer = null;
    }
}
exports.hideAllhighlights = hideAllhighlights;
function destroyAllhighlights(documant) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyAllhighlights: " + _highlights.length);
    }
    hideAllhighlights(documant);
    _highlights.splice(0, _highlights.length);
}
exports.destroyAllhighlights = destroyAllhighlights;
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
}
exports.destroyHighlight = destroyHighlight;
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
        }
        else {
            break;
        }
    }
}
exports.destroyHighlightsGroup = destroyHighlightsGroup;
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
    const bodyComputedStyle = win.getComputedStyle(documant.body);
    const docFrag = documant.createDocumentFragment();
    for (const highlight of _highlights) {
        const div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
        if (div) {
            docFrag.append(div);
        }
    }
    const highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
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
exports.recreateAllHighlights = recreateAllHighlights;
function createHighlights(win, highDefs, pointerInteraction) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlights: " + highDefs.length + " ... " + _highlights.length);
    }
    const documant = win.document;
    const highlights = [];
    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const bodyComputedStyle = win.getComputedStyle(documant.body);
    const docFrag = documant.createDocumentFragment();
    for (const highDef of highDefs) {
        if (!highDef.selectionInfo && !highDef.range) {
            highlights.push(null);
            continue;
        }
        const [high, div] = createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, highDef.group, bodyRect, bodyComputedStyle);
        highlights.push(high);
        if (div) {
            docFrag.append(div);
        }
    }
    const highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
    return highlights;
}
exports.createHighlights = createHighlights;
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
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, group, bodyRect, bodyComputedStyle) {
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
    };
    _highlights.push(highlight);
    const div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
const JAPANESE_RUBY_TO_SKIP = ["rt", "rp"];
function createHighlightDom(win, highlight, bodyRect, bodyComputedStyle) {
    var _a;
    const DEBUG_RECTS = window.DEBUG_RECTS;
    const documant = win.document;
    const scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    const range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    const drawBackground = highlight.drawType === highlight_1.HighlightDrawTypeBackground;
    const drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    const drawOutline = highlight.drawType === highlight_1.HighlightDrawTypeOutline;
    const paginated = (0, readium_css_inject_1.isPaginated)(documant);
    const rtl = (0, readium_css_2.isRTL)();
    const vertical = (0, readium_css_1.isVerticalWritingMode)();
    const doDrawMargin = drawMargin(highlight);
    const highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_CONTAINER} ${styles_1.CLASS_HIGHLIGHT_COMMON}`);
    highlightParent.setAttribute("data-type", `${highlight.drawType}`);
    if (highlight.group) {
        highlightParent.setAttribute("data-group", highlight.group);
    }
    if (doDrawMargin) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_MARGIN);
    }
    const styleAttr = win.document.documentElement.getAttribute("style");
    const isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
    highlightParent.style.setProperty("mix-blend-mode", isNight ? "hard-light" : "multiply", "important");
    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    let clientRects;
    const rangeClientRects = (0, rect_utils_1.DOMRectListToArray)(range.getClientRects());
    if (doNotMergeHorizontallyAlignedRects) {
        const textClientRects = (0, rect_utils_1.getTextClientRects)(range, JAPANESE_RUBY_TO_SKIP);
        const textReducedClientRects = (0, rect_utils_1.getClientRectsNoOverlap)(textClientRects, true, vertical, highlight.expand ? highlight.expand : 0);
        clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRects;
    }
    else {
        clientRects = (0, rect_utils_1.getClientRectsNoOverlap)(rangeClientRects, false, vertical, highlight.expand ? highlight.expand : 0);
    }
    const underlineThickness = 3;
    const strikeThroughLineThickness = 4;
    const bodyWidth = parseInt(bodyComputedStyle.width, 10);
    const paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    const paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    const paginatedOffset = (paginatedWidth - bodyWidth) / 2 + parseInt(bodyComputedStyle.paddingLeft, 10);
    const gap = 2;
    const gapX = ((drawOutline || drawBackground) ? gap : 0);
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
            const thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : strikeThroughLineThickness;
            const ww = (vertical ? thickness : rect.width) * scale;
            const hh = (vertical ? rect.height : thickness) * scale;
            const xx = (vertical
                ?
                    (DEBUG_RECTS
                        ?
                            rect.left
                        :
                            (rect.left + (rect.width / 2) - (thickness / 2)))
                :
                    rect.left) * scale;
            const yy = (vertical
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
            const thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : underlineThickness;
            if (drawUnderline) {
                const ww = (vertical ? thickness : rect.width) * scale;
                const hh = (vertical ? rect.height : thickness) * scale;
                const xx = (vertical
                    ?
                        (DEBUG_RECTS
                            ?
                                rect.left
                            :
                                (rect.left - (thickness / 2)))
                    :
                        rect.left) * scale;
                const yy = (vertical
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
    let polygonSurface;
    if (doNotMergeHorizontallyAlignedRects) {
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
        if (drawOutline || drawBackground) {
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
                    if (edge.isSegment()) {
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
                    else if (edge.isArc()) {
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
                    if (edge.isSegment()) {
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
                    else if (edge.isArc()) {
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
        if (Array.isArray(polygonSurface)) {
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
    highlightAreaSVG.innerHTML =
        (Array.isArray(polygonSurface)
            ?
                polygonSurface.reduce((prevSVGPath, currentPolygon) => {
                    return prevSVGPath + currentPolygon.svg({
                        fill: DEBUG_RECTS ? "pink" : drawOutline ? "transparent" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
                        fillRule: "evenodd",
                        stroke: DEBUG_RECTS ? "magenta" : drawOutline ? `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` : "transparent",
                        strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? 2 : 0,
                        fillOpacity: 1,
                        className: undefined,
                    });
                }, "")
            :
                polygonSurface.svg({
                    fill: DEBUG_RECTS ? "yellow" : drawOutline ? "transparent" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
                    fillRule: "evenodd",
                    stroke: DEBUG_RECTS ? "green" : drawOutline ? `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` : "transparent",
                    strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? 2 : 0,
                    fillOpacity: 1,
                    className: undefined,
                }))
            +
                polygonCountourUnionPoly.svg({
                    fill: "transparent",
                    fillRule: "evenodd",
                    stroke: DEBUG_RECTS ? "red" : "transparent",
                    strokeWidth: DEBUG_RECTS ? 1 : 1,
                    fillOpacity: 1,
                    className: undefined,
                });
    highlightParent.append(highlightAreaSVG);
    if (doDrawMargin && highlight.pointerInteraction) {
        const MARGIN_MARKER_THICKNESS = 14 * (win.READIUM2.isFixedLayout ? scale : 1);
        const MARGIN_MARKER_OFFSET = 6 * (win.READIUM2.isFixedLayout ? scale : 1);
        const paginatedOffset_ = paginatedOffset - MARGIN_MARKER_OFFSET - MARGIN_MARKER_THICKNESS;
        let boundingRect;
        const polygonCountourMarginRects = [];
        for (const f of polygonCountourUnionPoly.faces) {
            const face = f;
            const b = face.box;
            const left = vertical ?
                b.xmin :
                paginated ?
                    ((rtl
                        ?
                            paginatedWidth - MARGIN_MARKER_THICKNESS
                        :
                            0)
                        +
                            (rtl
                                ?
                                    -1 * paginatedOffset_
                                :
                                    paginatedOffset_)
                        +
                            Math.floor((b.xmin) / paginatedWidth) * paginatedWidth)
                    :
                        (rtl
                            ?
                                MARGIN_MARKER_OFFSET + bodyRect.width - parseInt(bodyComputedStyle.paddingRight, 10)
                            :
                                win.READIUM2.isFixedLayout
                                    ?
                                        MARGIN_MARKER_OFFSET
                                    :
                                        parseInt(bodyComputedStyle.paddingLeft, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET);
            const top = vertical
                ?
                    parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                :
                    b.ymin;
            const width = vertical ? b.width : MARGIN_MARKER_THICKNESS;
            const height = vertical ? MARGIN_MARKER_THICKNESS : b.height;
            const extra = 0;
            const r = {
                left: left - (vertical ? extra : 0),
                top: top - (vertical ? 0 : extra),
                right: left + width + (vertical ? extra : 0),
                bottom: top + height + (vertical ? 0 : extra),
                width: width + extra * 2,
                height: height + extra * 2,
            };
            boundingRect = boundingRect ? (0, rect_utils_1.getBoundingRect)(boundingRect, r) : r;
            polygonCountourMarginRects.push(r);
        }
        const useFastBoundingRect = true;
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
                    (_a = group.boxes) === null || _a === void 0 ? void 0 : _a.push(r);
                }
            }
            boundingRect = groups.map((g) => {
                return g.boxes.reduce((prev, cur) => {
                    if (prev === cur) {
                        return cur;
                    }
                    return (0, rect_utils_1.getBoundingRect)(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRect.length === 1) {
                boundingRect = boundingRect[0];
            }
        }
        if (useFastBoundingRect) {
            if (boundingRect) {
                polygonMarginUnionPoly = new core_1.Polygon();
                if (Array.isArray(boundingRect)) {
                    for (const b of boundingRect) {
                        const f = polygonMarginUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                            f.reverse();
                        }
                    }
                }
                else {
                    const f = polygonMarginUnionPoly.addFace(new core_1.Box(boundingRect.left, boundingRect.top, boundingRect.right, boundingRect.bottom));
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
        const highlightMarginSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightMarginSVG.setAttribute("class", `${styles_1.CLASS_HIGHLIGHT_COMMON} ${styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN}`);
        highlightMarginSVG.polygon = polygonMarginUnionPoly;
        highlightMarginSVG.innerHTML = polygonMarginUnionPoly.svg({
            fill: `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
            fillRule: "evenodd",
            stroke: "transparent",
            strokeWidth: 0,
            fillOpacity: 1,
            className: undefined,
        });
        highlightParent.append(highlightMarginSVG);
    }
    return highlightParent;
}
//# sourceMappingURL=highlight.js.map