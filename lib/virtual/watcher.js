"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _observe = require("./observe");

var _eval = require("../util/eval");

var _eval2 = _interopRequireDefault(_eval);

var _himalaya = require("himalaya");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var watch = function () {
    function watch(vm, name, recall) {
        _classCallCheck(this, watch);

        _observe.Dep.target = this;
        this.name = name;
        this.vm = vm;
        this.recall = recall;
        this.update();
        this.dep = null;
        _observe.Dep.target = null;
    }

    _createClass(watch, [{
        key: "update",
        value: function update() {
            var oldVal = this.value;
            var newVal = this.get();
            this.recall(oldVal, newVal);
        }
    }, {
        key: "get",
        value: function get() {
            this.value = (0, _eval2.default)(this.name, this.vm);

            return this.value;
        }
    }, {
        key: "unwatch",
        value: function unwatch() {
            var index = this.dep.subs.indexOf(this);
            this.dep.subs.splice(index, 1);
            this.vm = null;
            this.node = null;
            this.recall = null;
        }
    }]);

    return watch;
}();

exports.default = watch;