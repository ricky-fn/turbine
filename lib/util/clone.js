"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _vNode = require("../virtual/vNode");

var _vNode2 = _interopRequireDefault(_vNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clone(item) {
    if (!item) {
        return item;
    } // null, undefined values check

    var types = [Number, String, Boolean],
        result;
    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function (type) {
        if (item instanceof type) {
            result = type(item);
        }
    });
    if (typeof result == "undefined") {
        if (Object.prototype.toString.call(item) === "[object Array]") {
            result = [];
            item.forEach(function (child, index) {
                result[index] = clone(child);
            });
        } else if ((typeof item === "undefined" ? "undefined" : _typeof(item)) == "object") {
            result = isNode(item) ? new _vNode2.default(item) : {};
            for (var i in item) {
                result[i] = clone(item[i]);
            }
        } else {
            result = item;
        }
    }

    return result;
}

function isNode(obj) {
    var has = Object.prototype.hasOwnProperty;
    return has.call(obj, "content") || has.call(obj, "children");
}

exports.default = clone;