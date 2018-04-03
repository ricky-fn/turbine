"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _main = require("../main");

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var component = function (_turbine$prototype$_i) {
    _inherits(component, _turbine$prototype$_i);

    function component(config) {
        _classCallCheck(this, component);

        var data = config.data,
            props = config.props,
            vNode = config.vNode;

        var usedData = {};

        if (typeof data === "function") {
            usedData = data();
        } else if (data != undefined) {
            var _ret;

            return _ret = console.warn("data has required as a function, please change your component's data structure"), _possibleConstructorReturn(_this, _ret);
        }

        if (props != undefined && props instanceof Array) {
            props.forEach(function (propName) {
                var prop = vNode.attributes.find(function (attr) {
                    return attr.key === propName;
                });
                if (prop == null) {
                    return console.warn("cannot find prop name on element's attributes.\nprop name: " + propName);
                }
                usedData[propName] = prop.value;
            });
            delete config.prop;
        }

        var newProps = Object.assign({}, config, {
            data: usedData,
            _isComponent: true,
            $parent: vNode.context,
            slots: getSlots(vNode)
        });

        var _this = _possibleConstructorReturn(this, (component.__proto__ || Object.getPrototypeOf(component)).call(this, newProps));

        vNode.component = _this;
        vNode.el = _this.$el;
        vNode.tagName = _this.$el.tagName.toLowerCase();
        return _this;
    }

    return component;
}(_main2.default.prototype._init);

function getSlots(vNode) {
    var slots = {};
    vNode.children.forEach(function (child) {
        var isElement = child.type == "element";
        var slot = isElement && ArrayFind(child.attributes, function (el) {
            return el.key == "slot";
        });
        if (slot) {
            slots[slot.value] = child;
        } else if (isElement) {
            slots["default"] = slots["default"] instanceof Array ? slots["default"].concat(child) : [child];
        }
    });
    return slots;
}

function ArrayFind(array, callback) {
    var i = void 0,
        data = void 0;
    for (i = 0; i < array.length; i++) {
        data = array[i];
        if (callback(data)) {
            return data;
        }
    }
}

exports.default = component;