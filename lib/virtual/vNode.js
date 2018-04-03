"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var vNode = function () {
    function vNode(json) {
        _classCallCheck(this, vNode);

        this.type = null;
        this.content = null;
        this.attributes = null;
        this.el = null;
        this.oberver = [];
        this.children = [];
        this.key = null;
        this.isComponent = false;
        this.isReady = false;
        this.directives = [];
        this.component = null;
        this.reference = json;
        this.context = null;
    }

    _createClass(vNode, [{
        key: "inserted",
        value: function inserted(fn) {
            this.oberver.push(fn);
        }
    }, {
        key: "ready",
        value: function ready(el) {
            var _this = this;

            this.el = el;
            this.isReady = true;

            this.directives.forEach(function (dir) {

                if (dir.bind) {
                    dir.bind(_this.el, dir.binding, _this);
                } else if (dir.update) {
                    dir.update(_this.el, dir.binding, _this);
                }
            });

            this.oberver.forEach(function (fn) {
                return fn.call(_this, el);
            });
        }
    }, {
        key: "remove",
        value: function remove() {
            var _this2 = this;

            this.directives.forEach(function (obj) {
                return obj.unbind && obj.unbind(_this2.el, obj.binding, _this2);
            });

            if (this.isComponent) {
                this.component._destroy();
            } else {
                this.children.forEach(function (vNode) {
                    vNode.remove();
                });
                this.el.parentNode.removeChild(this.el);
            }
            this.oberver = [];
            this.el = null;
            this.reference = null;
            this.context = null;
            this.children = null;
        }
    }]);

    return vNode;
}();

exports.default = vNode;