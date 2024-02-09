"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopupDialog = exports.isElementInsidePopupDialog = exports.closePopupDialogs = exports.isPopupDialogOpen = void 0;
var tabbable = require("tabbable");
var electron_1 = require("electron");
var events_1 = require("../../common/events");
var styles_1 = require("../../common/styles");
function isPopupDialogOpen(documant) {
    return documant.documentElement &&
        documant.documentElement.classList.contains(styles_1.POPUP_DIALOG_CLASS);
}
exports.isPopupDialogOpen = isPopupDialogOpen;
function closePopupDialogs(documant) {
    console.log("...DIALOG close all");
    var dialogs = documant.querySelectorAll("dialog.".concat(styles_1.POPUP_DIALOG_CLASS));
    dialogs.forEach(function (dialog) {
        var dia = dialog;
        if (dia.popDialog) {
            dia.popDialog.cancelRefocus();
        }
        if (dia.hasAttribute("open") || dia.open) {
            dia.close();
        }
        setTimeout(function () {
            dia.remove();
        }, 50);
    });
}
exports.closePopupDialogs = closePopupDialogs;
function isElementInsidePopupDialog(el) {
    var currentElement = el;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        if (currentElement.tagName && currentElement.classList &&
            currentElement.tagName.toLowerCase() === "dialog" &&
            currentElement.classList.contains(styles_1.POPUP_DIALOG_CLASS)) {
            return true;
        }
        currentElement = currentElement.parentNode;
    }
    return false;
}
exports.isElementInsidePopupDialog = isElementInsidePopupDialog;
function getFocusables(rootElement) {
    var tabbables = tabbable.tabbable(rootElement);
    return tabbables;
}
function focusInside(rootElement) {
    var toFocus = rootElement.querySelector("[autofocus]") || getFocusables(rootElement)[0];
    if (toFocus) {
        toFocus.focus();
    }
}
var _focusedBeforeDialog;
function onKeyUp(ev) {
    var ESCAPE_KEY = 27;
    if (ev.which === ESCAPE_KEY) {
        if (this.role !== "alertdialog") {
            console.log("...DIALOG ESCAPE ...");
            ev.preventDefault();
            if (this.dialog.hasAttribute("open") || this.dialog.open) {
                this.dialog.close();
            }
            return;
        }
    }
}
function onKeyDown(ev) {
    if (this.doNotTrapKeyboardFocusTabIndexCycling) {
        return;
    }
    var TAB_KEY = 9;
    if (ev.which === TAB_KEY) {
        var focusables = getFocusables(this.dialog);
        var focusedItemIndex = this.documant.activeElement ?
            focusables.indexOf(this.documant.activeElement) :
            -1;
        var isLast = focusedItemIndex === focusables.length - 1;
        var isFirst = focusedItemIndex === 0;
        var toFocus = void 0;
        if (ev.shiftKey && isFirst) {
            toFocus = focusables[focusables.length - 1];
        }
        else if (!ev.shiftKey && isLast) {
            toFocus = focusables[0];
        }
        if (toFocus) {
            ev.preventDefault();
            toFocus.focus();
        }
    }
}
var PopupDialog = (function () {
    function PopupDialog(documant, outerHTML, onDialogClosed, optionalCssClass, doNotTrapKeyboardFocusTabIndexCycling) {
        var _this = this;
        this.documant = documant;
        this.onDialogClosed = onDialogClosed;
        this.clickCloseXY = {
            clickX: -1,
            clickY: -1,
        };
        closePopupDialogs(documant);
        var that = this;
        this._onKeyUp = onKeyUp.bind(this);
        this._onKeyDown = onKeyDown.bind(this);
        this.doNotTrapKeyboardFocusTabIndexCycling = doNotTrapKeyboardFocusTabIndexCycling ? true : false;
        this.dialog = documant.createElement("dialog");
        this.dialog.popDialog = this;
        this.dialog.setAttribute("class", styles_1.POPUP_DIALOG_CLASS
            + (optionalCssClass ? " ".concat(optionalCssClass) : ""));
        this.dialog.setAttribute("id", styles_1.POPUP_DIALOG_CLASS);
        this.dialog.setAttribute("dir", "ltr");
        var namespaces = Array.from(documant.documentElement.attributes).reduce(function (pv, cv) {
            if (cv.name.startsWith("xmlns:")) {
                return "".concat(pv, " ").concat(cv.name, "=\"").concat(cv.value, "\"");
            }
            else {
                return "".concat(pv);
            }
        }, "");
        var toInsert = outerHTML.replace(/>/, " ".concat(namespaces, " >"));
        try {
            this.dialog.insertAdjacentHTML("beforeend", toInsert);
        }
        catch (err) {
            console.log(err);
            console.log("outerHTML", outerHTML);
            console.log("toInsert", toInsert);
            Array.from(documant.getElementsByTagName("parsererror")).forEach(function (pe) {
                if (pe.parentNode) {
                    pe.parentNode.removeChild(pe);
                }
            });
            var parseFullHTML = false;
            try {
                if (parseFullHTML) {
                    toInsert = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\" ".concat(namespaces, " ><body>").concat(outerHTML, "</body></html>");
                }
                else {
                }
                var domparser = new DOMParser();
                var xmlDoc = domparser.parseFromString(toInsert, "application/xhtml+xml");
                var xmlSerializer = new XMLSerializer();
                var xmlStr = xmlSerializer.serializeToString(xmlDoc);
                if (xmlStr.indexOf("parsererror") > 0) {
                    console.log("parsererror", xmlStr);
                    this.dialog.insertAdjacentHTML("beforeend", "<pre class=\"".concat(styles_1.FOOTNOTES_CONTAINER_CLASS, "\" stylexx=\"overflow-y: scroll; position: absolute; top: 0px; right: 0px; left: 0px; bottom: 0px; margin: 0px; padding: 0px;\">").concat(outerHTML.replace(/>/g, "&gt;").replace(/</g, "&lt;"), "</pre>"));
                }
                else {
                    var el = parseFullHTML ?
                        xmlDoc.documentElement.firstElementChild.firstElementChild :
                        xmlDoc.documentElement;
                    toInsert = xmlSerializer.serializeToString(el);
                    console.log("toInsert", toInsert);
                    this.dialog.insertAdjacentHTML("beforeend", toInsert);
                }
            }
            catch (err) {
                console.log(err);
                console.log("outerHTML", outerHTML);
                console.log("toInsert", toInsert);
                Array.from(documant.getElementsByTagName("parsererror")).forEach(function (pe) {
                    if (pe.parentNode) {
                        pe.parentNode.removeChild(pe);
                    }
                });
                try {
                    this.dialog.innerHTML = toInsert;
                }
                catch (err) {
                    console.log(err);
                    console.log("outerHTML", outerHTML);
                    console.log("toInsert", toInsert);
                    Array.from(documant.getElementsByTagName("parsererror")).forEach(function (pe) {
                        if (pe.parentNode) {
                            pe.parentNode.removeChild(pe);
                        }
                    });
                    try {
                        this.dialog.insertAdjacentHTML("beforeend", "<pre>".concat(outerHTML, "</pre>"));
                    }
                    catch (err) {
                        console.log(err);
                        console.log("outerHTML", outerHTML);
                        console.log("toInsert", toInsert);
                    }
                }
            }
        }
        documant.body.appendChild(this.dialog);
        this.dialog.addEventListener("click", function (ev) {
            if (ev.target !== that.dialog) {
                return;
            }
            var rect = that.dialog.getBoundingClientRect();
            var inside = rect.top <= ev.clientY &&
                ev.clientY <= rect.top + rect.height &&
                rect.left <= ev.clientX &&
                ev.clientX <= rect.left + rect.width;
            if (!inside) {
                if (that.dialog.hasAttribute("open") || that.dialog.open) {
                    console.log("...DIALOG CLICK event => close()");
                    that.clickCloseXY.clickX = ev.clientX;
                    that.clickCloseXY.clickY = ev.clientY;
                    that.dialog.close();
                }
            }
        });
        this.dialog.addEventListener("close", function (_ev) {
            console.log("...DIALOG CLOSE event => hide()");
            that.hide();
        });
        this.dialog.addEventListener("open", function (_ev) {
            _this.clickCloseXY.clickX = -1;
            _this.clickCloseXY.clickY = -1;
        });
        this.documant = this.dialog.ownerDocument;
        this.role = this.dialog.getAttribute("role") || "dialog";
    }
    PopupDialog.prototype.show = function (toRefocus) {
        console.log("...DIALOG show()");
        this.clickCloseXY.clickX = -1;
        this.clickCloseXY.clickY = -1;
        electron_1.ipcRenderer.sendToHost(events_1.R2_EVENT_MEDIA_OVERLAY_INTERRUPT);
        var el = this.documant.documentElement;
        el.classList.add(styles_1.POPUP_DIALOG_CLASS);
        if (this.dialog.hasAttribute("open")) {
            return;
        }
        console.log("...DIALOG show() 2");
        _focusedBeforeDialog = toRefocus ?
            toRefocus :
            this.documant.activeElement;
        this.dialog.showModal();
        focusInside(this.dialog);
        this.documant.body.addEventListener("keyup", this._onKeyUp, true);
        this.documant.body.addEventListener("keydown", this._onKeyDown, true);
    };
    PopupDialog.prototype.cancelRefocus = function () {
        _focusedBeforeDialog = null;
    };
    PopupDialog.prototype.hide = function () {
        console.log("...DIALOG hide()");
        var el = this.documant.documentElement;
        el.classList.remove(styles_1.POPUP_DIALOG_CLASS);
        this.documant.body.removeEventListener("keyup", this._onKeyUp, true);
        this.documant.body.removeEventListener("keydown", this._onKeyDown, true);
        this.onDialogClosed(this, _focusedBeforeDialog);
        _focusedBeforeDialog = null;
        if (this.dialog.hasAttribute("open") || this.dialog.open) {
            console.log("...DIALOG hide().close()");
            this.dialog.close();
        }
    };
    return PopupDialog;
}());
exports.PopupDialog = PopupDialog;
//# sourceMappingURL=popup-dialog.js.map