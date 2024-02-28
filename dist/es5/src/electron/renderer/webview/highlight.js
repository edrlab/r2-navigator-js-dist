"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHighlight = exports.createHighlights = exports.recreateAllHighlights = exports.recreateAllHighlightsDebounced = exports.recreateAllHighlightsRaw = exports.destroyHighlightsGroup = exports.destroyHighlight = exports.destroyAllhighlights = exports.hideAllhighlights = exports.getBoundingClientRectOfDocumentBody = exports.setDrawMargin = void 0;
var tslib_1 = require("tslib");
var crypto = require("crypto");
var debounce = require("debounce");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var highlight_1 = require("../../common/highlight");
var readium_css_inject_1 = require("../../common/readium-css-inject");
var rect_utils_1 = require("../common/rect-utils");
var readium_css_1 = require("./readium-css");
var selection_1 = require("./selection");
var styles_1 = require("../../common/styles");
var readium_css_2 = require("./readium-css");
var core_1 = require("@flatten-js/core");
var unify = core_1.BooleanOperations.unify, subtract = core_1.BooleanOperations.subtract;
var IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
window.DEBUG_RECTS = IS_DEV && rect_utils_1.VERBOSE;
var cleanupPolygon = function (polygonAccumulator, off) {
    var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g;
    var DEBUG_RECTS = window.DEBUG_RECTS;
    var minLength = Math.abs(off) + 1;
    var nSegments = 0;
    var nArcs = 0;
    var total = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    try {
        for (var _h = tslib_1.__values(polygonAccumulator.edges), _j = _h.next(); !_j.done; _j = _h.next()) {
            var e = _j.value;
            var edge = e;
            if (edge.isSegment()) {
                nSegments++;
                var segment = edge.shape;
                var l = segment.length;
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
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_j && !_j.done && (_a = _h.return)) _a.call(_h);
        }
        finally { if (e_1) throw e_1.error; }
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
    try {
        for (var _k = tslib_1.__values(polygonAccumulator.faces), _l = _k.next(); !_l.done; _l = _k.next()) {
            var f = _l.value;
            var face = f;
            try {
                for (var _m = (e_3 = void 0, tslib_1.__values(face.edges)), _o = _m.next(); !_o.done; _o = _m.next()) {
                    var e = _o.value;
                    var edge = e;
                    if (edge.isSegment()) {
                        nSegments++;
                        var segment = edge.shape;
                        var l = segment.length;
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
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_o && !_o.done && (_c = _m.return)) _c.call(_m);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_l && !_l.done && (_b = _k.return)) _b.call(_k);
        }
        finally { if (e_2) throw e_2.error; }
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
    try {
        for (var _p = tslib_1.__values(polygonAccumulator.faces), _q = _p.next(); !_q.done; _q = _p.next()) {
            var f = _q.value;
            var face = f;
            var edge = face.first;
            while (edge) {
                if (edge.isSegment()) {
                    nSegments++;
                    var segment = edge.shape;
                    var l = segment.length;
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
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_q && !_q.done && (_d = _p.return)) _d.call(_p);
        }
        finally { if (e_4) throw e_4.error; }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 3: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 3: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 3: " + nArcs);
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    var faces = Array.from(polygonAccumulator.faces);
    try {
        for (var faces_1 = tslib_1.__values(faces), faces_1_1 = faces_1.next(); !faces_1_1.done; faces_1_1 = faces_1.next()) {
            var f = faces_1_1.value;
            var face = f;
            if (DEBUG_RECTS) {
                console.log("~~~~ POLY FACE");
            }
            var edges = Array.from(face.edges);
            var edgeShapes = edges.map(function (edge) { return edge.shape; });
            var chainedEdgeShapes = [];
            while (edgeShapes.length) {
                if (DEBUG_RECTS) {
                    console.log("~~~~ POLY EDGE SHAPE");
                }
                if (!chainedEdgeShapes.length) {
                    var last = edgeShapes.pop();
                    chainedEdgeShapes.push(last);
                    continue;
                }
                var lastInChain = chainedEdgeShapes[chainedEdgeShapes.length - 1];
                var lastInChainStartPoint = lastInChain.breakToFunctional ? lastInChain.start : lastInChain.start;
                var lastInChainEndPoint = lastInChain.breakToFunctional ? lastInChain.end : lastInChain.end;
                var shapesBefore = [];
                var shapesAfter = [];
                try {
                    for (var edgeShapes_1 = (e_6 = void 0, tslib_1.__values(edgeShapes)), edgeShapes_1_1 = edgeShapes_1.next(); !edgeShapes_1_1.done; edgeShapes_1_1 = edgeShapes_1.next()) {
                        var edgeShape = edgeShapes_1_1.value;
                        var edgeShapeStartPoint = edgeShape.breakToFunctional ? edgeShape.start : edgeShape.start;
                        var edgeShapeEndPoint = edgeShape.breakToFunctional ? edgeShape.end : edgeShape.end;
                        if (core_1.Utils.EQ(lastInChainStartPoint.x, edgeShapeEndPoint.x) && core_1.Utils.EQ(lastInChainStartPoint.y, edgeShapeEndPoint.y)) {
                            shapesBefore.push(edgeShape);
                        }
                        if (core_1.Utils.EQ(lastInChainEndPoint.x, edgeShapeStartPoint.x) && core_1.Utils.EQ(lastInChainEndPoint.y, edgeShapeStartPoint.y)) {
                            shapesAfter.push(edgeShape);
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (edgeShapes_1_1 && !edgeShapes_1_1.done && (_f = edgeShapes_1.return)) _f.call(edgeShapes_1);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
                if (shapesBefore.length > 1 || shapesAfter.length > 1 || shapesAfter.length === 0) {
                    if (DEBUG_RECTS) {
                        console.log("~~~~ POLY SHAPES BEFORE/AFTER ABORT: " + shapesBefore.length + " ... " + shapesAfter.length);
                    }
                    chainedEdgeShapes = [];
                    break;
                }
                var startPoint = shapesAfter[0].breakToFunctional ? shapesAfter[0].start : shapesAfter[0].start;
                var endPoint = shapesAfter[0].breakToFunctional ? shapesAfter[0].end : shapesAfter[0].end;
                if (DEBUG_RECTS) {
                    console.log("*** SEGMENT/ARC --- START: (" + startPoint.x + ", " + startPoint.y + ") END: (" + endPoint.x + ", " + endPoint.y + ")");
                }
                edgeShapes.splice(edgeShapes.indexOf(shapesAfter[0]), 1);
                chainedEdgeShapes.push(shapesAfter[0]);
                if (chainedEdgeShapes.length === edges.length) {
                    var edgeShapeEndPoint = shapesAfter[0].breakToFunctional ? shapesAfter[0].end : shapesAfter[0].end;
                    var firstInChainStartPoint = chainedEdgeShapes[0].breakToFunctional ? chainedEdgeShapes[0].start : chainedEdgeShapes[0].start;
                    if (!core_1.Utils.EQ(firstInChainStartPoint.x, edgeShapeEndPoint.x) || !core_1.Utils.EQ(firstInChainStartPoint.y, edgeShapeEndPoint.y)) {
                        if (DEBUG_RECTS) {
                            console.log("~~~~ POLY SHAPES TAIL/HEAD ABORT");
                        }
                        chainedEdgeShapes = [];
                        break;
                    }
                }
            }
            var previousSegment = void 0;
            var previousSmallSegment = void 0;
            var newEdgeShapes = [];
            var hasChanged = false;
            try {
                for (var chainedEdgeShapes_1 = (e_7 = void 0, tslib_1.__values(chainedEdgeShapes)), chainedEdgeShapes_1_1 = chainedEdgeShapes_1.next(); !chainedEdgeShapes_1_1.done; chainedEdgeShapes_1_1 = chainedEdgeShapes_1.next()) {
                    var edgeShape = chainedEdgeShapes_1_1.value;
                    if (!edgeShape.breakToFunctional) {
                        var segment = edgeShape;
                        var l = segment.length;
                        if (DEBUG_RECTS) {
                            console.log("--POLYGON SLOPES: " + (previousSegment === null || previousSegment === void 0 ? void 0 : previousSegment.slope) + " vs. " + segment.slope);
                        }
                        if (previousSegment && core_1.Utils.EQ(previousSegment.slope, segment.slope)) {
                            if (DEBUG_RECTS) {
                                console.log("--POLYGON SLOPE EQUAL ... merge :)");
                            }
                            hasChanged = true;
                            newEdgeShapes.pop();
                            var seg = new core_1.Segment(new core_1.Point(previousSegment.start.x, previousSegment.start.y), new core_1.Point(segment.end.x, segment.end.y));
                            newEdgeShapes.push(seg);
                            previousSmallSegment = undefined;
                            previousSegment = seg;
                            if (chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !newEdgeShapes[0].breakToFunctional && core_1.Utils.EQ(newEdgeShapes[0].slope, seg.slope)) {
                                if (DEBUG_RECTS) {
                                    console.log("--POLYGON SLOPE EQUAL (tail/head link) 1... merge :)");
                                }
                                hasChanged = true;
                                newEdgeShapes.splice(0, 1);
                                var seg2 = new core_1.Segment(new core_1.Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new core_1.Point(seg.end.x, seg.end.y));
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
                            var seg = new core_1.Segment(new core_1.Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new core_1.Point(segment.end.x, segment.end.y));
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
                                var seg = new core_1.Segment(new core_1.Point(previousSmallSegment.start.x, previousSmallSegment.start.y), new core_1.Point(segment.end.x, segment.end.y));
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
                                var seg = new core_1.Segment(new core_1.Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new core_1.Point(segment.end.x, segment.end.y));
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
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (chainedEdgeShapes_1_1 && !chainedEdgeShapes_1_1.done && (_g = chainedEdgeShapes_1.return)) _g.call(chainedEdgeShapes_1);
                }
                finally { if (e_7) throw e_7.error; }
            }
            if (hasChanged) {
                if (DEBUG_RECTS) {
                    console.log("-->>>> POLYGON face changed :)");
                }
                polygonAccumulator.deleteFace(face);
                polygonAccumulator.addFace(newEdgeShapes);
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (faces_1_1 && !faces_1_1.done && (_e = faces_1.return)) _e.call(faces_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
};
var addEdgePoints = function (polygon, offset) {
    var e_8, _a, e_9, _b, e_10, _c;
    var boxes = [];
    try {
        for (var _d = tslib_1.__values(polygon.faces), _e = _d.next(); !_e.done; _e = _d.next()) {
            var f = _e.value;
            var face = f;
            try {
                for (var _f = (e_9 = void 0, tslib_1.__values(face.edges)), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var edge = _g.value;
                    if (edge.isSegment()) {
                        var segment = edge.shape;
                        var bStart = new core_1.Box(segment.start.x - offset, segment.start.y - offset, segment.start.x + offset * 2, segment.start.y + offset * 2);
                        boxes.push(bStart);
                        var bEnd = new core_1.Box(segment.end.x - offset, segment.end.y - offset, segment.end.x + offset * 2, segment.end.y + offset * 2);
                        boxes.push(bEnd);
                    }
                    else {
                        var arc = edge.shape;
                        var bStart = new core_1.Box(arc.start.x - offset, arc.start.y - offset, arc.start.x + offset * 2, arc.start.y + offset * 2);
                        boxes.push(bStart);
                        var bEnd = new core_1.Box(arc.end.x - offset, arc.end.y - offset, arc.end.x + offset * 2, arc.end.y + offset * 2);
                        boxes.push(bEnd);
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_9) throw e_9.error; }
            }
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_8) throw e_8.error; }
    }
    try {
        for (var boxes_1 = tslib_1.__values(boxes), boxes_1_1 = boxes_1.next(); !boxes_1_1.done; boxes_1_1 = boxes_1.next()) {
            var box = boxes_1_1.value;
            polygon.addFace(box);
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (boxes_1_1 && !boxes_1_1.done && (_c = boxes_1.return)) _c.call(boxes_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
};
var BASE_ORIENTATION = core_1.ORIENTATION.CCW;
var USE_SEGMENT_JOINS_NOT_ARCS = false;
function arcSE(center, start, end, counterClockwise) {
    var DEBUG_RECTS = window.DEBUG_RECTS;
    var startAngle = Number((new core_1.Vector(center, start).slope).toPrecision(12));
    var endAngle = Number((new core_1.Vector(center, end).slope).toPrecision(12));
    if (core_1.Utils.EQ(startAngle, endAngle)) {
        if (DEBUG_RECTS) {
            console.log("--POLYGON ARC ORIENTATION CCW/CW inverse");
        }
        endAngle += 2 * Math.PI;
        counterClockwise = !counterClockwise;
    }
    var r = Number((new core_1.Vector(center, start).length).toPrecision(12));
    ;
    return new core_1.Arc(center, r, startAngle, endAngle, counterClockwise);
}
function offset_(polygon, off, useSegmentJoinsNotArcs) {
    var e_11, _a, e_12, _b, e_13, _c;
    var DEBUG_RECTS = window.DEBUG_RECTS;
    var postponeFinalUnify = off > 0;
    var polygonAccumulator = postponeFinalUnify ? undefined : polygon.clone();
    try {
        for (var _d = tslib_1.__values(polygon.faces), _e = _d.next(); !_e.done; _e = _d.next()) {
            var f = _e.value;
            var face = f;
            try {
                for (var _f = (e_12 = void 0, tslib_1.__values(face.edges)), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var edge = _g.value;
                    if (edge.isSegment()) {
                        var polygonEdge = new core_1.Polygon();
                        var segment = edge.shape;
                        var v_seg = new core_1.Vector(segment.end.x - segment.start.x, segment.end.y - segment.start.y);
                        var v_seg_unit = v_seg.normalize();
                        var absOffset = Math.abs(off);
                        var v_left = v_seg_unit.rotate90CCW().multiply(absOffset);
                        var v_right = v_seg_unit.rotate90CW().multiply(absOffset);
                        var seg_left = segment.translate(v_left).reverse();
                        var seg_right = segment.translate(v_right);
                        var seg_left_ = new core_1.Segment(new core_1.Point(Number((seg_left.start.x).toPrecision(12)), Number((seg_left.start.y).toPrecision(12))), new core_1.Point(Number((seg_left.end.x).toPrecision(12)), Number((seg_left.end.y).toPrecision(12))));
                        var seg_right_ = new core_1.Segment(new core_1.Point(Number((seg_right.start.x).toPrecision(12)), Number((seg_right.start.y).toPrecision(12))), new core_1.Point(Number((seg_right.end.x).toPrecision(12)), Number((seg_right.end.y).toPrecision(12))));
                        var orientation_1 = BASE_ORIENTATION === core_1.ORIENTATION.CCW ? core_1.CCW : core_1.CW;
                        var cap1 = arcSE(segment.start, seg_left_.end, seg_right_.start, orientation_1);
                        var cap2 = arcSE(segment.end, seg_right_.end, seg_left_.start, orientation_1);
                        var cap1_ = useSegmentJoinsNotArcs
                            ?
                                new core_1.Segment(seg_left_.end, seg_right_.start)
                            :
                                cap1;
                        var cap2_ = useSegmentJoinsNotArcs
                            ?
                                new core_1.Segment(seg_right_.end, seg_left_.start)
                            :
                                cap2;
                        var face_1 = polygonEdge.addFace([
                            seg_left_,
                            cap1_,
                            seg_right_,
                            cap2_,
                        ]);
                        if (face_1.orientation() !== BASE_ORIENTATION) {
                            if (DEBUG_RECTS) {
                                console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 1");
                            }
                            face_1.reverse();
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
                        try {
                            for (var _h = (e_13 = void 0, tslib_1.__values(polygonAccumulator.faces)), _j = _h.next(); !_j.done; _j = _h.next()) {
                                var f_1 = _j.value;
                                var face_2 = f_1;
                                if (face_2.edges.length < 4) {
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
                                if (face_2.orientation() !== BASE_ORIENTATION) {
                                    if (DEBUG_RECTS) {
                                        console.log("-------- POLYGON FACE ORIENTATION");
                                    }
                                }
                            }
                        }
                        catch (e_13_1) { e_13 = { error: e_13_1 }; }
                        finally {
                            try {
                                if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                            }
                            finally { if (e_13) throw e_13.error; }
                        }
                    }
                    else {
                        console.log("!!!!!!!! POLYGON ARC??!");
                        return polygon;
                    }
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_12) throw e_12.error; }
            }
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_11) throw e_11.error; }
    }
    Array.from((polygonAccumulator ? polygonAccumulator : polygon).faces).forEach(function (face) {
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
    Array.from((polygonAccumulator ? polygonAccumulator : polygon).faces).forEach(function (face) {
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
    var resPoly = polygonAccumulator ? polygonAccumulator : polygon;
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
function offset(originaPolygon, off, useSegmentJoinsNotArcs) {
    var e_14, _a, e_15, _b, e_16, _c;
    if (useSegmentJoinsNotArcs === void 0) { useSegmentJoinsNotArcs = USE_SEGMENT_JOINS_NOT_ARCS; }
    var DEBUG_RECTS = window.DEBUG_RECTS;
    off = Number((off).toPrecision(12));
    if (core_1.Utils.EQ_0(off)) {
        return originaPolygon;
    }
    var singleFacePolygons = [];
    try {
        for (var _d = tslib_1.__values(originaPolygon.faces), _e = _d.next(); !_e.done; _e = _d.next()) {
            var f = _e.value;
            var face = f;
            var poly = new core_1.Polygon();
            poly.addFace(face.edges.map(function (edge) { return edge.shape; }));
            singleFacePolygons.push(poly);
        }
    }
    catch (e_14_1) { e_14 = { error: e_14_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_14) throw e_14.error; }
    }
    var singlePolygon = new core_1.Polygon();
    try {
        for (var singleFacePolygons_1 = tslib_1.__values(singleFacePolygons), singleFacePolygons_1_1 = singleFacePolygons_1.next(); !singleFacePolygons_1_1.done; singleFacePolygons_1_1 = singleFacePolygons_1.next()) {
            var polygon = singleFacePolygons_1_1.value;
            var resPoly = offset_(polygon, off, useSegmentJoinsNotArcs);
            try {
                for (var _f = (e_16 = void 0, tslib_1.__values(resPoly.faces)), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var f = _g.value;
                    var face = f;
                    singlePolygon.addFace(face.edges.map((function (edge) { return edge.shape; })));
                }
            }
            catch (e_16_1) { e_16 = { error: e_16_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_c = _f.return)) _c.call(_f);
                }
                finally { if (e_16) throw e_16.error; }
            }
        }
    }
    catch (e_15_1) { e_15 = { error: e_15_1 }; }
    finally {
        try {
            if (singleFacePolygons_1_1 && !singleFacePolygons_1_1.done && (_b = singleFacePolygons_1.return)) _b.call(singleFacePolygons_1);
        }
        finally { if (e_15) throw e_15.error; }
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
var DEFAULT_BACKGROUND_COLOR = {
    blue: 0,
    green: 0,
    red: 255,
};
var _highlights = [];
var _drawMargin = false;
var drawMargin = function (h) {
    if (Array.isArray(_drawMargin)) {
        if (h.group) {
            return _drawMargin.includes(h.group);
        }
        return false;
    }
    return _drawMargin;
};
var setDrawMargin = function (win, drawMargin) {
    _drawMargin = drawMargin;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- _drawMargin: " + JSON.stringify(_drawMargin, null, 4));
    }
    recreateAllHighlightsRaw(win);
};
exports.setDrawMargin = setDrawMargin;
var SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
function getBoundingClientRectOfDocumentBody(win) {
    return win.document.body.getBoundingClientRect();
}
exports.getBoundingClientRectOfDocumentBody = getBoundingClientRectOfDocumentBody;
function processMouseEvent(win, ev) {
    if (!_highlightsContainer) {
        return;
    }
    var isMouseMove = ev.type === "mousemove";
    if (isMouseMove) {
        if (ev.buttons > 0) {
            return;
        }
        if (!_highlights.length) {
            return;
        }
    }
    var documant = win.document;
    var scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    var x = ev.clientX;
    var y = ev.clientY;
    var paginated = (0, readium_css_inject_1.isPaginated)(documant);
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var hit = false;
    var foundHighlight;
    var foundElement;
    for (var i = _highlights.length - 1; i >= 0; i--) {
        var highlight = _highlights[i];
        var highlightParent = documant.getElementById("".concat(highlight.id));
        if (!highlightParent) {
            highlightParent = _highlightsContainer.querySelector("#".concat(highlight.id));
        }
        if (!highlightParent) {
            continue;
        }
        var highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {
                var svg = highlightFragment;
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
    var highlightContainer = _highlightsContainer.firstElementChild;
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
            var payload = {
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
var lastMouseDownX = -1;
var lastMouseDownY = -1;
var bodyEventListenersSet = false;
var _highlightsContainer;
function ensureHighlightsContainer(win) {
    var documant = win.document;
    if (!_highlightsContainer) {
        if (!bodyEventListenersSet) {
            bodyEventListenersSet = true;
            documant.body.addEventListener("mousedown", function (ev) {
                lastMouseDownX = ev.clientX;
                lastMouseDownY = ev.clientY;
            }, false);
            documant.body.addEventListener("mouseup", function (ev) {
                if ((Math.abs(lastMouseDownX - ev.clientX) < 3) &&
                    (Math.abs(lastMouseDownY - ev.clientY) < 3)) {
                    processMouseEvent(win, ev);
                }
            }, false);
            documant.body.addEventListener("mousemove", function (ev) {
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
    var i = -1;
    var highlight = _highlights.find(function (h, j) {
        i = j;
        return h.id === id;
    });
    if (highlight && i >= 0 && i < _highlights.length) {
        _highlights.splice(i, 1);
    }
    var highlightContainer = documant.getElementById(id);
    if (highlightContainer) {
        highlightContainer.remove();
    }
}
exports.destroyHighlight = destroyHighlight;
function destroyHighlightsGroup(documant, group) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlightsGroup: " + group + " ... " + _highlights.length);
    }
    var _loop_1 = function () {
        var i = -1;
        var highlight = _highlights.find(function (h, j) {
            i = j;
            return h.group === group;
        });
        if (highlight) {
            if (i >= 0 && i < _highlights.length) {
                _highlights.splice(i, 1);
            }
            var highlightContainer = documant.getElementById(highlight.id);
            if (highlightContainer) {
                highlightContainer.remove();
            }
        }
        else {
            return "break";
        }
    };
    while (true) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
}
exports.destroyHighlightsGroup = destroyHighlightsGroup;
function recreateAllHighlightsRaw(win, highlights) {
    var e_17, _a;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw: " + _highlights.length + " ==> " + (highlights === null || highlights === void 0 ? void 0 : highlights.length));
    }
    var documant = win.document;
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
        _highlights.push.apply(_highlights, tslib_1.__spreadArray([], tslib_1.__read(highlights), false));
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
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var bodyComputedStyle = win.getComputedStyle(documant.body);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var _highlights_1 = tslib_1.__values(_highlights), _highlights_1_1 = _highlights_1.next(); !_highlights_1_1.done; _highlights_1_1 = _highlights_1.next()) {
            var highlight = _highlights_1_1.value;
            var div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
            if (div) {
                docFrag.append(div);
            }
        }
    }
    catch (e_17_1) { e_17 = { error: e_17_1 }; }
    finally {
        try {
            if (_highlights_1_1 && !_highlights_1_1.done && (_a = _highlights_1.return)) _a.call(_highlights_1);
        }
        finally { if (e_17) throw e_17.error; }
    }
    var highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
}
exports.recreateAllHighlightsRaw = recreateAllHighlightsRaw;
exports.recreateAllHighlightsDebounced = debounce(function (win) {
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
    var e_18, _a;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlights: " + highDefs.length + " ... " + _highlights.length);
    }
    var documant = win.document;
    var highlights = [];
    var bodyRect = getBoundingClientRectOfDocumentBody(win);
    var bodyComputedStyle = win.getComputedStyle(documant.body);
    var docFrag = documant.createDocumentFragment();
    try {
        for (var highDefs_1 = tslib_1.__values(highDefs), highDefs_1_1 = highDefs_1.next(); !highDefs_1_1.done; highDefs_1_1 = highDefs_1.next()) {
            var highDef = highDefs_1_1.value;
            if (!highDef.selectionInfo && !highDef.range) {
                highlights.push(null);
                continue;
            }
            var _b = tslib_1.__read(createHighlight(win, highDef.selectionInfo, highDef.range, highDef.color, pointerInteraction, highDef.drawType, highDef.expand, highDef.group, bodyRect, bodyComputedStyle), 2), high = _b[0], div = _b[1];
            highlights.push(high);
            if (div) {
                docFrag.append(div);
            }
        }
    }
    catch (e_18_1) { e_18 = { error: e_18_1 }; }
    finally {
        try {
            if (highDefs_1_1 && !highDefs_1_1.done && (_a = highDefs_1.return)) _a.call(highDefs_1);
        }
        finally { if (e_18) throw e_18.error; }
    }
    var highlightsContainer = ensureHighlightsContainer(win);
    highlightsContainer.append(docFrag);
    return highlights;
}
exports.createHighlights = createHighlights;
var computeCFI = function (node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        if (node.parentNode) {
            return computeCFI(node.parentNode);
        }
        return undefined;
    }
    var cfi = "";
    var currentElement = node;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        var currentElementParentChildren = currentElement.parentNode.children;
        var currentElementIndex = -1;
        for (var i = 0; i < currentElementParentChildren.length; i++) {
            if (currentElement === currentElementParentChildren[i]) {
                currentElementIndex = i;
                break;
            }
        }
        if (currentElementIndex >= 0) {
            var cfiIndex = (currentElementIndex + 1) * 2;
            cfi = cfiIndex +
                (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                (cfi.length ? ("/" + cfi) : "");
        }
        currentElement = currentElement.parentNode;
    }
    return "/" + cfi;
};
function createHighlight(win, selectionInfo, range, color, pointerInteraction, drawType, expand, group, bodyRect, bodyComputedStyle) {
    var uniqueStr = selectionInfo ? "".concat(selectionInfo.rangeInfo.startContainerElementCssSelector).concat(selectionInfo.rangeInfo.startContainerChildTextNodeIndex).concat(selectionInfo.rangeInfo.startOffset).concat(selectionInfo.rangeInfo.endContainerElementCssSelector).concat(selectionInfo.rangeInfo.endContainerChildTextNodeIndex).concat(selectionInfo.rangeInfo.endOffset) : range ? "".concat(range.startOffset, "-").concat(range.endOffset, "-").concat(computeCFI(range.startContainer), "-").concat(computeCFI(range.endContainer)) : "_RANGE_";
    var checkSum = crypto.createHash("sha1");
    checkSum.update(uniqueStr);
    var shaHex = checkSum.digest("hex");
    var idBase = "R2_HIGHLIGHT_" + shaHex;
    var id = idBase;
    var idIdx = 0;
    while (_highlights.find(function (h) { return h.id === id; }) ||
        win.document.getElementById(id)) {
        if (IS_DEV) {
            console.log("HIGHLIGHT ID already exists, increment: " + uniqueStr + " ==> " + id);
        }
        id = "".concat(idBase, "_").concat(idIdx++);
    }
    var highlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        drawType: drawType,
        expand: expand,
        id: id,
        pointerInteraction: pointerInteraction,
        selectionInfo: selectionInfo,
        range: range,
        group: group,
    };
    _highlights.push(highlight);
    var div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle);
    return [highlight, div];
}
exports.createHighlight = createHighlight;
var JAPANESE_RUBY_TO_SKIP = ["rt", "rp"];
function createHighlightDom(win, highlight, bodyRect, bodyComputedStyle) {
    var e_19, _a, e_20, _b, e_21, _c, e_22, _d, e_23, _e, e_24, _f, e_25, _g, e_26, _h, e_27, _j, e_28, _k, e_29, _l, e_30, _m;
    var _o;
    var DEBUG_RECTS = window.DEBUG_RECTS;
    var documant = win.document;
    var scrollElement = (0, readium_css_1.getScrollingElement)(documant);
    var range = highlight.selectionInfo ? (0, selection_1.convertRangeInfo)(documant, highlight.selectionInfo.rangeInfo) : highlight.range;
    if (!range) {
        return null;
    }
    var drawBackground = highlight.drawType === highlight_1.HighlightDrawTypeBackground;
    var drawUnderline = highlight.drawType === highlight_1.HighlightDrawTypeUnderline;
    var drawStrikeThrough = highlight.drawType === highlight_1.HighlightDrawTypeStrikethrough;
    var drawOutline = highlight.drawType === highlight_1.HighlightDrawTypeOutline;
    var paginated = (0, readium_css_inject_1.isPaginated)(documant);
    var rtl = (0, readium_css_2.isRTL)();
    var vertical = (0, readium_css_1.isVerticalWritingMode)();
    var doDrawMargin = drawMargin(highlight);
    var highlightParent = documant.createElement("div");
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", "".concat(styles_1.CLASS_HIGHLIGHT_CONTAINER, " ").concat(styles_1.CLASS_HIGHLIGHT_COMMON));
    highlightParent.setAttribute("data-type", "".concat(highlight.drawType));
    if (highlight.group) {
        highlightParent.setAttribute("data-group", highlight.group);
    }
    if (doDrawMargin) {
        highlightParent.classList.add(styles_1.CLASS_HIGHLIGHT_MARGIN);
    }
    var styleAttr = win.document.documentElement.getAttribute("style");
    var isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
    highlightParent.style.setProperty("mix-blend-mode", isNight ? "hard-light" : "multiply", "important");
    var xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    var yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;
    var scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    var doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;
    var clientRects;
    var rangeClientRects = (0, rect_utils_1.DOMRectListToArray)(range.getClientRects());
    if (doNotMergeHorizontallyAlignedRects) {
        var textClientRects = (0, rect_utils_1.getTextClientRects)(range, JAPANESE_RUBY_TO_SKIP);
        var textReducedClientRects = (0, rect_utils_1.getClientRectsNoOverlap)(textClientRects, true, vertical, highlight.expand ? highlight.expand : 0);
        clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRects;
    }
    else {
        clientRects = (0, rect_utils_1.getClientRectsNoOverlap)(rangeClientRects, false, vertical, highlight.expand ? highlight.expand : 0);
    }
    var underlineThickness = 3;
    var strikeThroughLineThickness = 4;
    var bodyWidth = parseInt(bodyComputedStyle.width, 10);
    var paginatedTwo = paginated && (0, readium_css_1.isTwoPageSpread)();
    var paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    var paginatedOffset = (paginatedWidth - bodyWidth) / 2 + parseInt(bodyComputedStyle.paddingLeft, 10);
    var gap = 2;
    var gapX = ((drawOutline || drawBackground) ? gap : 0);
    var boxesNoGapExpanded = [];
    var boxesGapExpanded = [];
    try {
        for (var clientRects_1 = tslib_1.__values(clientRects), clientRects_1_1 = clientRects_1.next(); !clientRects_1_1.done; clientRects_1_1 = clientRects_1.next()) {
            var clientRect = clientRects_1_1.value;
            var rect = {
                height: clientRect.height,
                left: clientRect.left - xOffset,
                top: clientRect.top - yOffset,
                width: clientRect.width,
            };
            var w = rect.width * scale;
            var h = rect.height * scale;
            var x = rect.left * scale;
            var y = rect.top * scale;
            boxesGapExpanded.push(new core_1.Box(Number((x - gap).toPrecision(12)), Number((y - gap).toPrecision(12)), Number((x + w + gap).toPrecision(12)), Number((y + h + gap).toPrecision(12))));
            if (drawStrikeThrough) {
                var thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : strikeThroughLineThickness;
                var ww = (vertical ? thickness : rect.width) * scale;
                var hh = (vertical ? rect.height : thickness) * scale;
                var xx = (vertical
                    ?
                        (DEBUG_RECTS
                            ?
                                rect.left
                            :
                                (rect.left + (rect.width / 2) - (thickness / 2)))
                    :
                        rect.left) * scale;
                var yy = (vertical
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
                var thickness = DEBUG_RECTS ? (vertical ? rect.width : rect.height) : underlineThickness;
                if (drawUnderline) {
                    var ww = (vertical ? thickness : rect.width) * scale;
                    var hh = (vertical ? rect.height : thickness) * scale;
                    var xx = (vertical
                        ?
                            (DEBUG_RECTS
                                ?
                                    rect.left
                                :
                                    (rect.left - (thickness / 2)))
                        :
                            rect.left) * scale;
                    var yy = (vertical
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
    }
    catch (e_19_1) { e_19 = { error: e_19_1 }; }
    finally {
        try {
            if (clientRects_1_1 && !clientRects_1_1.done && (_a = clientRects_1.return)) _a.call(clientRects_1);
        }
        finally { if (e_19) throw e_19.error; }
    }
    var polygonCountourUnionPoly = boxesGapExpanded.reduce(function (previousPolygon, currentBox) {
        var p = new core_1.Polygon();
        var f = p.addFace(currentBox);
        if (f.orientation() !== BASE_ORIENTATION) {
            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 2");
            f.reverse();
        }
        return unify(previousPolygon, p);
    }, new core_1.Polygon());
    Array.from(polygonCountourUnionPoly.faces).forEach(function (face) {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (contour))");
            }
            polygonCountourUnionPoly.deleteFace(face);
        }
    });
    cleanupPolygon(polygonCountourUnionPoly, gap);
    var polygonSurface;
    if (doNotMergeHorizontallyAlignedRects) {
        var singleSVGPath = !DEBUG_RECTS;
        if (singleSVGPath) {
            polygonSurface = new core_1.Polygon();
            try {
                for (var boxesNoGapExpanded_1 = tslib_1.__values(boxesNoGapExpanded), boxesNoGapExpanded_1_1 = boxesNoGapExpanded_1.next(); !boxesNoGapExpanded_1_1.done; boxesNoGapExpanded_1_1 = boxesNoGapExpanded_1.next()) {
                    var box = boxesNoGapExpanded_1_1.value;
                    var f = polygonSurface.addFace(box);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 3");
                        f.reverse();
                    }
                }
            }
            catch (e_20_1) { e_20 = { error: e_20_1 }; }
            finally {
                try {
                    if (boxesNoGapExpanded_1_1 && !boxesNoGapExpanded_1_1.done && (_b = boxesNoGapExpanded_1.return)) _b.call(boxesNoGapExpanded_1);
                }
                finally { if (e_20) throw e_20.error; }
            }
        }
        else {
            polygonSurface = [];
            try {
                for (var boxesNoGapExpanded_2 = tslib_1.__values(boxesNoGapExpanded), boxesNoGapExpanded_2_1 = boxesNoGapExpanded_2.next(); !boxesNoGapExpanded_2_1.done; boxesNoGapExpanded_2_1 = boxesNoGapExpanded_2.next()) {
                    var box = boxesNoGapExpanded_2_1.value;
                    var poly = new core_1.Polygon();
                    var f = poly.addFace(box);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 4");
                        f.reverse();
                    }
                    polygonSurface.push(poly);
                }
            }
            catch (e_21_1) { e_21 = { error: e_21_1 }; }
            finally {
                try {
                    if (boxesNoGapExpanded_2_1 && !boxesNoGapExpanded_2_1.done && (_c = boxesNoGapExpanded_2.return)) _c.call(boxesNoGapExpanded_2);
                }
                finally { if (e_21) throw e_21.error; }
            }
        }
    }
    else {
        polygonSurface = boxesNoGapExpanded.reduce(function (previousPolygon, currentBox) {
            var p = new core_1.Polygon();
            var f = p.addFace(currentBox);
            if (f.orientation() !== BASE_ORIENTATION) {
                console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 5");
                f.reverse();
            }
            return unify(previousPolygon, p);
        }, new core_1.Polygon());
        Array.from(polygonSurface.faces).forEach(function (face) {
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
            try {
                for (var _p = tslib_1.__values(polygonSurface.faces), _q = _p.next(); !_q.done; _q = _p.next()) {
                    var f = _q.value;
                    var face = f;
                    if (DEBUG_RECTS) {
                        console.log("--................--................--................");
                        console.log("--POLY FACE: " + (face.orientation() === core_1.ORIENTATION.CCW ? "CCW" : face.orientation() === core_1.ORIENTATION.CW ? "CW" : "ORIENTATION.NOT_ORIENTABLE"));
                    }
                    try {
                        for (var _r = (e_23 = void 0, tslib_1.__values(face.edges)), _s = _r.next(); !_s.done; _s = _r.next()) {
                            var edge = _s.value;
                            if (DEBUG_RECTS) {
                                console.log("--POLY EDGE");
                            }
                            if (edge.isSegment()) {
                                if (DEBUG_RECTS) {
                                    console.log("--POLY SEGMENT...");
                                }
                                var segment = edge.shape;
                                var pointStart = segment.start;
                                var pointEnd = segment.end;
                                if (DEBUG_RECTS) {
                                    console.log("--POLY SEGMENT START x, y: " + pointStart.x + ", " + pointStart.y);
                                    console.log("--POLY SEGMENT END x, y: " + pointEnd.x + ", " + pointEnd.y);
                                }
                            }
                            else if (edge.isArc()) {
                                if (DEBUG_RECTS) {
                                    console.log("--POLY ARC...");
                                }
                                var arc = edge.shape;
                                if (DEBUG_RECTS) {
                                    console.log("--POLY ARC: " + arc.start.x + ", " + arc.start.y);
                                    console.log("--POLY ARC: " + arc.end.x + ", " + arc.end.y);
                                    console.log("--POLY ARC: " + arc.length + " / " + arc.sweep);
                                }
                            }
                        }
                    }
                    catch (e_23_1) { e_23 = { error: e_23_1 }; }
                    finally {
                        try {
                            if (_s && !_s.done && (_e = _r.return)) _e.call(_r);
                        }
                        finally { if (e_23) throw e_23.error; }
                    }
                }
            }
            catch (e_22_1) { e_22 = { error: e_22_1 }; }
            finally {
                try {
                    if (_q && !_q.done && (_d = _p.return)) _d.call(_p);
                }
                finally { if (e_22) throw e_22.error; }
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
            try {
                for (var _t = tslib_1.__values(polygonSurface.faces), _u = _t.next(); !_u.done; _u = _t.next()) {
                    var f = _u.value;
                    var face = f;
                    if (DEBUG_RECTS) {
                        console.log("--................--................--................");
                        console.log("--POLY FACE: " + (face.orientation() === core_1.ORIENTATION.CCW ? "CCW" : face.orientation() === core_1.ORIENTATION.CW ? "CW" : "ORIENTATION.NOT_ORIENTABLE"));
                    }
                    try {
                        for (var _v = (e_25 = void 0, tslib_1.__values(face.edges)), _w = _v.next(); !_w.done; _w = _v.next()) {
                            var edge = _w.value;
                            if (DEBUG_RECTS) {
                                console.log("--POLY EDGE");
                            }
                            if (edge.isSegment()) {
                                if (DEBUG_RECTS) {
                                    console.log("--POLY SEGMENT...");
                                }
                                var segment = edge.shape;
                                var pointStart = segment.start;
                                var pointEnd = segment.end;
                                if (DEBUG_RECTS) {
                                    console.log("--POLY SEGMENT START x, y: " + pointStart.x + ", " + pointStart.y);
                                    console.log("--POLY SEGMENT END x, y: " + pointEnd.x + ", " + pointEnd.y);
                                }
                            }
                            else if (edge.isArc()) {
                                if (DEBUG_RECTS) {
                                    console.log("--POLY ARC...");
                                }
                                var arc = edge.shape;
                                if (DEBUG_RECTS) {
                                    console.log("--POLY ARC: " + arc.start.x + ", " + arc.start.y);
                                    console.log("--POLY ARC: " + arc.end.x + ", " + arc.end.y);
                                    console.log("--POLY ARC: " + arc.length + " / " + arc.sweep);
                                }
                            }
                        }
                    }
                    catch (e_25_1) { e_25 = { error: e_25_1 }; }
                    finally {
                        try {
                            if (_w && !_w.done && (_g = _v.return)) _g.call(_v);
                        }
                        finally { if (e_25) throw e_25.error; }
                    }
                }
            }
            catch (e_24_1) { e_24 = { error: e_24_1 }; }
            finally {
                try {
                    if (_u && !_u.done && (_f = _t.return)) _f.call(_t);
                }
                finally { if (e_24) throw e_24.error; }
            }
        }
    }
    if (DEBUG_RECTS) {
        addEdgePoints(polygonCountourUnionPoly, 1);
        if (Array.isArray(polygonSurface)) {
            try {
                for (var polygonSurface_1 = tslib_1.__values(polygonSurface), polygonSurface_1_1 = polygonSurface_1.next(); !polygonSurface_1_1.done; polygonSurface_1_1 = polygonSurface_1.next()) {
                    var poly = polygonSurface_1_1.value;
                    addEdgePoints(poly, 1);
                }
            }
            catch (e_26_1) { e_26 = { error: e_26_1 }; }
            finally {
                try {
                    if (polygonSurface_1_1 && !polygonSurface_1_1.done && (_h = polygonSurface_1.return)) _h.call(polygonSurface_1);
                }
                finally { if (e_26) throw e_26.error; }
            }
        }
        else {
            addEdgePoints(polygonSurface, 1);
        }
    }
    var highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
    highlightAreaSVG.setAttribute("class", "".concat(styles_1.CLASS_HIGHLIGHT_COMMON, " ").concat(styles_1.CLASS_HIGHLIGHT_CONTOUR));
    highlightAreaSVG.polygon = polygonCountourUnionPoly;
    highlightAreaSVG.innerHTML =
        (Array.isArray(polygonSurface)
            ?
                polygonSurface.reduce(function (prevSVGPath, currentPolygon) {
                    return prevSVGPath + currentPolygon.svg({
                        fill: DEBUG_RECTS ? "pink" : drawOutline ? "transparent" : "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"),
                        fillRule: "evenodd",
                        stroke: DEBUG_RECTS ? "magenta" : drawOutline ? "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") : "transparent",
                        strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? 2 : 0,
                        fillOpacity: 1,
                        className: undefined,
                    });
                }, "")
            :
                polygonSurface.svg({
                    fill: DEBUG_RECTS ? "yellow" : drawOutline ? "transparent" : "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"),
                    fillRule: "evenodd",
                    stroke: DEBUG_RECTS ? "green" : drawOutline ? "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")") : "transparent",
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
        var MARGIN_MARKER_THICKNESS = 14 * (win.READIUM2.isFixedLayout ? scale : 1);
        var MARGIN_MARKER_OFFSET = 6 * (win.READIUM2.isFixedLayout ? scale : 1);
        var paginatedOffset_ = paginatedOffset - MARGIN_MARKER_OFFSET - MARGIN_MARKER_THICKNESS;
        var boundingRect = void 0;
        var polygonCountourMarginRects = [];
        try {
            for (var _x = tslib_1.__values(polygonCountourUnionPoly.faces), _y = _x.next(); !_y.done; _y = _x.next()) {
                var f = _y.value;
                var face = f;
                var b = face.box;
                var left = vertical ?
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
                var top_1 = vertical
                    ?
                        parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                    :
                        b.ymin;
                var width = vertical ? b.width : MARGIN_MARKER_THICKNESS;
                var height = vertical ? MARGIN_MARKER_THICKNESS : b.height;
                var extra = 0;
                var r = {
                    left: left - (vertical ? extra : 0),
                    top: top_1 - (vertical ? 0 : extra),
                    right: left + width + (vertical ? extra : 0),
                    bottom: top_1 + height + (vertical ? 0 : extra),
                    width: width + extra * 2,
                    height: height + extra * 2,
                };
                boundingRect = boundingRect ? (0, rect_utils_1.getBoundingRect)(boundingRect, r) : r;
                polygonCountourMarginRects.push(r);
            }
        }
        catch (e_27_1) { e_27 = { error: e_27_1 }; }
        finally {
            try {
                if (_y && !_y.done && (_j = _x.return)) _j.call(_x);
            }
            finally { if (e_27) throw e_27.error; }
        }
        var useFastBoundingRect = true;
        var polygonMarginUnionPoly = void 0;
        if (paginated) {
            var tolerance_1 = 1;
            var groups = [];
            var _loop_2 = function (r) {
                var group = groups.find(function (g) {
                    return !(r.left < (g.x - tolerance_1) || r.left > (g.x + tolerance_1));
                });
                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                }
                else {
                    (_o = group.boxes) === null || _o === void 0 ? void 0 : _o.push(r);
                }
            };
            try {
                for (var polygonCountourMarginRects_1 = tslib_1.__values(polygonCountourMarginRects), polygonCountourMarginRects_1_1 = polygonCountourMarginRects_1.next(); !polygonCountourMarginRects_1_1.done; polygonCountourMarginRects_1_1 = polygonCountourMarginRects_1.next()) {
                    var r = polygonCountourMarginRects_1_1.value;
                    _loop_2(r);
                }
            }
            catch (e_28_1) { e_28 = { error: e_28_1 }; }
            finally {
                try {
                    if (polygonCountourMarginRects_1_1 && !polygonCountourMarginRects_1_1.done && (_k = polygonCountourMarginRects_1.return)) _k.call(polygonCountourMarginRects_1);
                }
                finally { if (e_28) throw e_28.error; }
            }
            boundingRect = groups.map(function (g) {
                return g.boxes.reduce(function (prev, cur) {
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
                    try {
                        for (var boundingRect_1 = tslib_1.__values(boundingRect), boundingRect_1_1 = boundingRect_1.next(); !boundingRect_1_1.done; boundingRect_1_1 = boundingRect_1.next()) {
                            var b = boundingRect_1_1.value;
                            var f = polygonMarginUnionPoly.addFace(new core_1.Box(b.left, b.top, b.right, b.bottom));
                            if (f.orientation() !== BASE_ORIENTATION) {
                                console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                                f.reverse();
                            }
                        }
                    }
                    catch (e_29_1) { e_29 = { error: e_29_1 }; }
                    finally {
                        try {
                            if (boundingRect_1_1 && !boundingRect_1_1.done && (_l = boundingRect_1.return)) _l.call(boundingRect_1);
                        }
                        finally { if (e_29) throw e_29.error; }
                    }
                }
                else {
                    var f = polygonMarginUnionPoly.addFace(new core_1.Box(boundingRect.left, boundingRect.top, boundingRect.right, boundingRect.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                        f.reverse();
                    }
                }
            }
            else {
                var poly = new core_1.Polygon();
                try {
                    for (var polygonCountourMarginRects_2 = tslib_1.__values(polygonCountourMarginRects), polygonCountourMarginRects_2_1 = polygonCountourMarginRects_2.next(); !polygonCountourMarginRects_2_1.done; polygonCountourMarginRects_2_1 = polygonCountourMarginRects_2.next()) {
                        var r = polygonCountourMarginRects_2_1.value;
                        var f_2 = poly.addFace(new core_1.Box(r.left, r.top, r.right, r.bottom));
                        if (f_2.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                            f_2.reverse();
                        }
                    }
                }
                catch (e_30_1) { e_30 = { error: e_30_1 }; }
                finally {
                    try {
                        if (polygonCountourMarginRects_2_1 && !polygonCountourMarginRects_2_1.done && (_m = polygonCountourMarginRects_2.return)) _m.call(polygonCountourMarginRects_2);
                    }
                    finally { if (e_30) throw e_30.error; }
                }
                polygonMarginUnionPoly = new core_1.Polygon();
                var f = polygonMarginUnionPoly.addFace(poly.box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                    f.reverse();
                }
            }
        }
        else {
            polygonMarginUnionPoly = polygonCountourMarginRects.reduce(function (previousPolygon, r) {
                var b = new core_1.Box(r.left, r.top, r.right, r.bottom);
                var p = new core_1.Polygon();
                var f = p.addFace(b);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                return unify(previousPolygon, p);
            }, new core_1.Polygon());
        }
        var highlightMarginSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg");
        highlightMarginSVG.setAttribute("class", "".concat(styles_1.CLASS_HIGHLIGHT_COMMON, " ").concat(styles_1.CLASS_HIGHLIGHT_CONTOUR_MARGIN));
        highlightMarginSVG.polygon = polygonMarginUnionPoly;
        highlightMarginSVG.innerHTML = polygonMarginUnionPoly.svg({
            fill: "rgb(".concat(highlight.color.red, ", ").concat(highlight.color.green, ", ").concat(highlight.color.blue, ")"),
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