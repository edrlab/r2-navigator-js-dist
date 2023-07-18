"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popoutImage = void 0;
const styles_1 = require("../../common/styles");
const popup_dialog_1 = require("../common/popup-dialog");
function popoutImage(win, element, focusScrollRaw, ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable, ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable) {
    win.wheelzoom = (img) => {
        const zoomStep = 0.10;
        const panStep = 20;
        let viewportWidth = 0;
        let viewportHeight = 0;
        let naturalWidth = 0;
        let naturalHeight = 0;
        let containedWidth = 0;
        let containedHeight = 0;
        let bgWidth = 0;
        let bgHeight = 0;
        let bgPosX = 0;
        let bgPosY = 0;
        let touchHypot = 0;
        let previousEvent;
        let previousEventTouch;
        function updateBgStyle() {
            img.style.backgroundSize = bgWidth + "px " + bgHeight + "px";
            img.style.backgroundPosition = bgPosX + "px " + bgPosY + "px";
        }
        function ontouch(e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.targetTouches.length !== 2) {
                return;
            }
            const pageX1 = e.targetTouches[0].pageX;
            const pageY1 = e.targetTouches[0].pageY;
            const pageX2 = e.targetTouches[1].pageX;
            const pageY2 = e.targetTouches[1].pageY;
            const touchHypot_ = Math.round(Math.sqrt(Math.pow(Math.abs(pageX1 - pageX2), 2) + Math.pow(Math.abs(pageY1 - pageY2), 2)));
            let direction = 0;
            if (touchHypot_ > touchHypot + 5)
                direction = -1;
            if (touchHypot_ < touchHypot - 5)
                direction = 1;
            if (direction !== 0) {
                if (touchHypot || direction === 1) {
                    const pageX = Math.min(pageX1, pageX2) + (Math.abs(pageX1 - pageX2) / 2);
                    const pageY = Math.min(pageY1, pageY2) + (Math.abs(pageY1 - pageY2) / 2);
                    const rect = img.getBoundingClientRect();
                    const offsetX = pageX - rect.left - win.pageXOffset;
                    const offsetY = pageY - rect.top - win.pageYOffset;
                    const bgCursorX = offsetX - bgPosX;
                    const bgCursorY = offsetY - bgPosY;
                    const bgRatioX = bgCursorX / bgWidth;
                    const bgRatioY = bgCursorY / bgHeight;
                    if (direction < 0) {
                        bgWidth += bgWidth * zoomStep;
                        bgHeight += bgHeight * zoomStep;
                    }
                    else {
                        bgWidth -= bgWidth * zoomStep;
                        bgHeight -= bgHeight * zoomStep;
                    }
                    bgPosX = offsetX - (bgWidth * bgRatioX);
                    bgPosY = offsetY - (bgHeight * bgRatioY);
                    updateBgStyle();
                }
                touchHypot = touchHypot_;
            }
        }
        function onwheel(e) {
            e.preventDefault();
            e.stopPropagation();
            const rect = img.getBoundingClientRect();
            const offsetX = e.pageX - rect.left - win.pageXOffset;
            const offsetY = e.pageY - rect.top - win.pageYOffset;
            const bgCursorX = offsetX - bgPosX;
            const bgCursorY = offsetY - bgPosY;
            const bgRatioX = bgCursorX / bgWidth;
            const bgRatioY = bgCursorY / bgHeight;
            if (e.deltaY < 0) {
                bgWidth += bgWidth * zoomStep;
                bgHeight += bgHeight * zoomStep;
            }
            else {
                bgWidth -= bgWidth * zoomStep;
                bgHeight -= bgHeight * zoomStep;
            }
            bgPosX = offsetX - (bgWidth * bgRatioX);
            bgPosY = offsetY - (bgHeight * bgRatioY);
            updateBgStyle();
        }
        function dragtouch(e) {
            if (e.targetTouches.length !== 1) {
                return;
            }
            e.preventDefault();
            const pageX = e.targetTouches[0].clientX;
            const pageY = e.targetTouches[0].clientY;
            bgPosX += (pageX - ((previousEventTouch === null || previousEventTouch === void 0 ? void 0 : previousEventTouch.targetTouches[0].clientX) || 0));
            bgPosY += (pageY - ((previousEventTouch === null || previousEventTouch === void 0 ? void 0 : previousEventTouch.targetTouches[0].clientY) || 0));
            previousEventTouch = e;
            updateBgStyle();
        }
        function removeDragtouch(e) {
            if (e.targetTouches.length !== 1) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            previousEventTouch = undefined;
            img.removeEventListener("touchend", removeDragtouch);
            img.removeEventListener("touchmove", dragtouch);
        }
        function draggabletouch(e) {
            if (e.targetTouches.length !== 1) {
                return;
            }
            e.preventDefault();
            previousEventTouch = e;
            img.addEventListener("touchmove", dragtouch);
            img.addEventListener("touchend", removeDragtouch);
        }
        let clickDownUpHasMoved = false;
        function drag(e) {
            clickDownUpHasMoved = true;
            e.preventDefault();
            bgPosX += (e.pageX - ((previousEvent === null || previousEvent === void 0 ? void 0 : previousEvent.pageX) || 0));
            bgPosY += (e.pageY - ((previousEvent === null || previousEvent === void 0 ? void 0 : previousEvent.pageY) || 0));
            previousEvent = e;
            updateBgStyle();
        }
        function removeDrag(e) {
            e.preventDefault();
            e.stopPropagation();
            previousEvent = undefined;
            document.removeEventListener("mouseup", removeDrag);
            document.removeEventListener("mouseleave", removeDrag);
            document.removeEventListener("mousemove", drag);
        }
        function draggable(e) {
            clickDownUpHasMoved = false;
            e.preventDefault();
            previousEvent = e;
            document.addEventListener("mousemove", drag);
            document.addEventListener("mouseup", removeDrag);
            document.addEventListener("mouseleave", removeDrag);
        }
        function onclick(e, force) {
            if (!force && (previousEvent || clickDownUpHasMoved)) {
                return;
            }
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const initialZoom = 1;
            bgWidth = containedWidth * initialZoom;
            bgHeight = containedHeight * initialZoom;
            bgPosX = -(bgWidth - viewportWidth) * 0.5;
            bgPosY = -(bgHeight - viewportHeight) * 0.5;
            updateBgStyle();
        }
        function reset() {
            const computedStyle = win.getComputedStyle(img, null);
            viewportWidth = parseInt(computedStyle.width, 10);
            viewportHeight = parseInt(computedStyle.height, 10);
            const hRatio = naturalHeight / viewportHeight;
            const wRatio = naturalWidth / viewportWidth;
            containedWidth = viewportWidth;
            containedHeight = viewportHeight;
            if (hRatio > wRatio) {
                containedWidth = naturalWidth / hRatio;
            }
            else if (hRatio < wRatio) {
                containedHeight = naturalHeight / wRatio;
            }
        }
        function init() {
            if (img.__INITED) {
                return;
            }
            win.READIUM2.ignorekeyDownUpEvents = true;
            naturalHeight = img.naturalHeight;
            naturalWidth = img.naturalWidth;
            reset();
            img.style.backgroundRepeat = "no-repeat";
            img.style.backgroundImage = "url(\"" + img.src + "\")";
            img.__INITED = true;
            img.src = "data:image/svg+xml;base64," + win.btoa("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + naturalWidth + "\" height=\"" + naturalHeight + "\"></svg>");
            onclick(undefined, true);
            img.addEventListener("wheel", onwheel);
            img.addEventListener("touchmove", ontouch);
            img.addEventListener("touchstart", draggabletouch);
            img.addEventListener("mousedown", draggable);
            img.addEventListener("click", onclick);
            const resizeObserver = new win.ResizeObserver((_entries) => {
                reset();
                onclick(undefined, true);
            });
            resizeObserver.observe(img);
            win.document.getElementById(styles_1.POPOUTIMAGE_CLOSE_ID).focus();
            win.document.getElementById(styles_1.POPOUTIMAGE_CLOSE_ID).addEventListener("click", () => {
                (0, popup_dialog_1.closePopupDialogs)(win.document);
            });
            win.document.getElementById(styles_1.POPOUTIMAGE_RESET_ID).addEventListener("click", () => {
                onclick(undefined, true);
            });
            const panLeft = (fast) => {
                bgPosX -= panStep * (fast ? 2 : 1);
                updateBgStyle();
            };
            const panRight = (fast) => {
                bgPosX += panStep * (fast ? 2 : 1);
                updateBgStyle();
            };
            const panUp = (fast) => {
                bgPosY -= panStep * (fast ? 2 : 1);
                updateBgStyle();
            };
            const panDown = (fast) => {
                bgPosY += panStep * (fast ? 2 : 1);
                updateBgStyle();
            };
            const minus = () => {
                const offsetX = viewportWidth / 2;
                const offsetY = viewportHeight / 2;
                const bgCursorX = offsetX - bgPosX;
                const bgCursorY = offsetY - bgPosY;
                const bgRatioX = bgCursorX / bgWidth;
                const bgRatioY = bgCursorY / bgHeight;
                bgWidth -= bgWidth * zoomStep;
                bgHeight -= bgHeight * zoomStep;
                bgPosX = offsetX - (bgWidth * bgRatioX);
                bgPosY = offsetY - (bgHeight * bgRatioY);
                updateBgStyle();
            };
            win.document.getElementById(styles_1.POPOUTIMAGE_MINUS_ID).addEventListener("click", minus);
            const plus = () => {
                const offsetX = viewportWidth / 2;
                const offsetY = viewportHeight / 2;
                const bgCursorX = offsetX - bgPosX;
                const bgCursorY = offsetY - bgPosY;
                const bgRatioX = bgCursorX / bgWidth;
                const bgRatioY = bgCursorY / bgHeight;
                bgWidth += bgWidth * zoomStep;
                bgHeight += bgHeight * zoomStep;
                bgPosX = offsetX - (bgWidth * bgRatioX);
                bgPosY = offsetY - (bgHeight * bgRatioY);
                updateBgStyle();
            };
            win.document.getElementById(styles_1.POPOUTIMAGE_PLUS_ID).addEventListener("click", plus);
            function keyDownUpEventHandler(ev, _keyDown) {
                let handled = false;
                if (ev.keyCode === 37) {
                    handled = true;
                    panLeft(ev.ctrlKey);
                }
                else if (ev.keyCode === 39) {
                    handled = true;
                    panRight(ev.ctrlKey);
                }
                else if (ev.keyCode === 38) {
                    handled = true;
                    panUp(ev.ctrlKey);
                }
                else if (ev.keyCode === 40) {
                    handled = true;
                    panDown(ev.ctrlKey);
                }
                else if (ev.ctrlKey && ev.code === "Minus") {
                    handled = true;
                    minus();
                }
                else if (ev.ctrlKey && ev.code === "Plus") {
                    handled = true;
                    plus();
                }
                else if (ev.ctrlKey && (ev.code === "Digit0" || ev.code === "Digit1" || ev.code === "Backspace" || ev.code === "Equal")) {
                    handled = true;
                    reset();
                }
                if (handled) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }
            win.document.getElementById(styles_1.POPOUTIMAGE_CONTAINER_ID).addEventListener("keydown", (ev) => {
                keyDownUpEventHandler(ev, true);
            }, {
                capture: true,
                once: false,
                passive: false,
            });
        }
        init();
    };
    const imgHref = element.src;
    if (!imgHref) {
        return;
    }
    const onloadhandler = "onload=\"javascript: " +
        "window.wheelzoom(this);" +
        "return; \"";
    const htmltxt = `
<div
    class="${styles_1.CSS_CLASS_NO_FOCUS_OUTLINE}"
    tabindex="0"
    autofocus="autofocus"
    id="${styles_1.POPOUTIMAGE_CONTAINER_ID}"
    >
    <img
        class="${styles_1.POPOUTIMAGE_CONTAINER_ID}"
        ${onloadhandler}
        src="${imgHref}"
    />
    <div id="${styles_1.POPOUTIMAGE_CONTROLS_ID}">
    <button id="${styles_1.POPOUTIMAGE_MINUS_ID}">-</button>
    <button id="${styles_1.POPOUTIMAGE_RESET_ID}">0</button>
    <button id="${styles_1.POPOUTIMAGE_PLUS_ID}">+</button>
    </div>
    <button id="${styles_1.POPOUTIMAGE_CLOSE_ID}">X</button>
</div>`;
    const val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();
    function onDialogClosed(el) {
        win.READIUM2.ignorekeyDownUpEvents = false;
        if (el) {
            focusScrollRaw(el, true, true, undefined);
        }
        else {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }
        setTimeout(() => {
            pop.dialog.remove();
        }, 50);
    }
    const pop = new popup_dialog_1.PopupDialog(element.ownerDocument, htmltxt, onDialogClosed, styles_1.TTS_POPUP_DIALOG_CLASS, false);
    pop.show(element);
}
exports.popoutImage = popoutImage;
//# sourceMappingURL=popoutImages.js.map