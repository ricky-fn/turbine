"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _vNode2 = require("../virtual/vNode");

var _vNode3 = _interopRequireDefault(_vNode2);

var _himalaya = require("himalaya");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function renderJsonTree(template) {
    var json = (0, _himalaya.parse)(template);

    return loopDomTree(json);
}

function loopDomTree(tree) {
    var keys = [];
    tree.forEach(function (el, index) {
        var key = void 0,
            _vNode = void 0;
        if (isNode(el)) {
            _vNode = new _vNode3.default(el);
            _vNode.children = el.children;
            tree.splice(index, 1, _vNode);

            if (_vNode.type === "element" && _vNode.children.length > 0) {
                loopDomTree(_vNode.children);
            }
        }

        do {
            key = createHexRandom();
        } while (keys.indexOf(key) >= 0);

        keys.push(key);
        (_vNode || el).key = key;
    });
    return tree;
}

function isNode(obj) {
    var has = Object.prototype.hasOwnProperty;
    return has.call(obj, "content") && obj.content.match(/[^\s]/g) || has.call(obj, "children");
}

function createHexRandom() {
    var num = Math.floor(Math.random() * 1000000);
    num = num.toString(16);
    return num;
}

exports.default = renderJsonTree;