"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _patch = require("./patch");

var _patch2 = _interopRequireDefault(_patch);

var _render = require("./render");

var _render2 = _interopRequireDefault(_render);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function compare(oldVM, newVM, parent) {
    var patches = (0, _patch2.default)(oldVM, newVM);
    patches.getPatches().forEach(function (patch) {
        applyPatch(patch, parent);
    });
    patches.getRestEl().forEach(function (nodes) {
        var oldNode = nodes.oldNode,
            newNode = nodes.newNode;

        var oldChild = oldNode.children;
        var newChild = newNode.children;
        var index = newVM.indexOf(newNode);
        var nextDom = parent.childNodes[index];

        newNode.el = oldNode.el;
        oldNode.el = null;
        newNode.isReady = oldNode.isReady;

        if (oldNode.type === "element") {

            newNode.directives.forEach(function (obj) {
                obj.update && obj.update(newNode.el, obj.binding, newNode, oldNode);
            });
        }

        if (oldChild && !oldNode.isComponent && oldNode.type == "element") {
            compare(oldChild, newChild, nextDom);
        }
    });

    patches = null;
}

function applyPatch(patch, parent) {
    var target = void 0,
        child = void 0;
    var _patch$target = patch.target,
        oldNode = _patch$target.oldNode,
        newNode = _patch$target.newNode;

    switch (patch.method) {
        case "add":
            child = (0, _render2.default)(newNode);
            parent.insertBefore(child, parent.childNodes[patch.index + 1]);

            break;
        case "delete":

            oldNode.remove();
            break;
        case "replace":
            console.warn("need to test");
            target = parent.childNodes[patch.index];
            child = (0, _render2.default)(patch.target.newNode);
            target.remove();

            parent.insertBefore(child, parent.childNodes[patch.index]);
            break;
    }
}

exports.default = compare;