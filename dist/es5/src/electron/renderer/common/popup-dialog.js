"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tabbable = require("tabbable");
var styles_1 = require("../../common/styles");
function isPopupDialogOpen(documant) {
    return documant.documentElement &&
        documant.documentElement.classList.contains(styles_1.POPUP_DIALOG_CLASS);
}
exports.isPopupDialogOpen = isPopupDialogOpen;
function closePopupDialogs(documant) {
    var dialogs = documant.querySelectorAll("dialog." + styles_1.POPUP_DIALOG_CLASS);
    dialogs.forEach(function (dialog) {
        var dia = dialog;
        if (dia.popDialog) {
            dia.popDialog.cancelRefocus();
        }
        if (dia.hasAttribute("open")) {
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
    var tabbables = tabbable(rootElement);
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
            ev.preventDefault();
            this.dialog.close();
            return;
        }
    }
}
function onKeyDown(ev) {
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
    function PopupDialog(documant, outerHTML, onDialogClosed, optionalCssClass) {
        this.documant = documant;
        this.onDialogClosed = onDialogClosed;
        closePopupDialogs(documant);
        var that = this;
        this._onKeyUp = onKeyUp.bind(this);
        this._onKeyDown = onKeyDown.bind(this);
        this.dialog = documant.createElement("dialog");
        this.dialog.popDialog = this;
        this.dialog.setAttribute("class", styles_1.POPUP_DIALOG_CLASS
            + (optionalCssClass ? " " + optionalCssClass : ""));
        this.dialog.setAttribute("id", styles_1.POPUP_DIALOG_CLASS);
        this.dialog.setAttribute("dir", "ltr");
        try {
            this.dialog.insertAdjacentHTML("beforeend", outerHTML);
        }
        catch (err) {
            console.log(err);
            console.log(outerHTML);
            try {
                this.dialog.innerHTML = outerHTML;
            }
            catch (err) {
                console.log(err);
                console.log(outerHTML);
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
                if (that.dialog.hasAttribute("open")) {
                    that.dialog.close();
                }
            }
        });
        this.dialog.addEventListener("close", function (_ev) {
            that.hide();
        });
        this.documant = this.dialog.ownerDocument;
        this.role = this.dialog.getAttribute("role") || "dialog";
    }
    PopupDialog.prototype.show = function (toRefocus) {
        var el = this.documant.documentElement;
        el.classList.add(styles_1.POPUP_DIALOG_CLASS);
        if (this.dialog.hasAttribute("open")) {
            return;
        }
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
        var el = this.documant.documentElement;
        el.classList.remove(styles_1.POPUP_DIALOG_CLASS);
        this.documant.body.removeEventListener("keyup", this._onKeyUp, true);
        this.documant.body.removeEventListener("keydown", this._onKeyDown, true);
        this.onDialogClosed(_focusedBeforeDialog);
        _focusedBeforeDialog = null;
        if (this.dialog.hasAttribute("open")) {
            this.dialog.close();
        }
    };
    return PopupDialog;
}());
exports.PopupDialog = PopupDialog;
//# sourceMappingURL=popup-dialog.js.map