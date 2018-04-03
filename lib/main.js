"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
// import _parser from "./virtual/parse"


var _himalaya = require("himalaya");

var _addKey = require("./util/addKey");

var _addKey2 = _interopRequireDefault(_addKey);

var _render2 = require("./virtual/render");

var _render3 = _interopRequireDefault(_render2);

var _observe2 = require("./virtual/observe");

var _watcher = require("./virtual/watcher");

var _watcher2 = _interopRequireDefault(_watcher);

var _compare = require("./virtual/compare");

var _compare2 = _interopRequireDefault(_compare);

var _analyse = require("./virtual/analyse");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var publicDirectives = [];
var publicComponents = {};

function checkExistence(target, props, recall) {
    var keys = Object.keys(props);

    keys.forEach(function (prop) {
        if (target.hasOwnProperty(prop)) {
            recall(prop);
        }
    });
}

function parseHTML(str) {
    var json = (0, _himalaya.parse)(str);
    (0, _addKey2.default)(json);

    return json;
}

function parser(json, vm) {
    var _parse = require("./virtual/parse").default;
    return new _parse(json, vm);
}

var turbine = function turbine(props) {
    if (props instanceof turbine.prototype._init) {
        return props;
    } else {
        return new turbine.prototype._init(props);
    }
};

turbine.prototype = {
    _init: function _init(props) {
        var _this2 = this;

        var el = props.el,
            template = props.template,
            components = props.components,
            directives = props.directives,
            methods = props.methods,
            data = props.data,
            watch = props.watch,
            slots = props.slots;


        this._refs = {};
        this.$refs = {};
        this._components = [];
        this._isComponent = props._isComponent || false;
        this.$parent = props.$parent || null;
        this.slots = slots || null;

        if (el != undefined) {
            if (typeof el == "string") {
                el = document.body.querySelector(el);
            }
            template = template || el.outerHTML;

            this.$el = el;
            this.$jsonTree = parseHTML(template);
            this._continued = true;
        } else if (template != undefined) {
            this.$jsonTree = parseHTML(template);
            this._continued = false;
        }

        {
            this._dir = [];
            publicDirectives.forEach(function (directives) {
                _this2._dir.push(directives);
            });
            if (directives instanceof Object) {
                for (var key in directives) {
                    turbine.directive(this, key, directives[key]);
                }
            }
        }

        {
            this._c = Object.assign({}, publicComponents);
            if (components && (typeof components === "undefined" ? "undefined" : _typeof(components)) == "object") {
                Object.keys(components).forEach(function (_c) {
                    turbine.component(_this2, _c, components[_c]);
                });
            }
        }

        {
            if (data != undefined && (typeof data === "undefined" ? "undefined" : _typeof(data)) == "object") {
                this._observe(data);
            }
        }

        this._setMethods(methods);

        {
            if ((typeof watch === "undefined" ? "undefined" : _typeof(watch)) == "object") {
                var keys = Object.keys(watch);

                keys.forEach(function (key) {
                    _this2.$watch(key, watch[key]);
                });
            }
        }

        {
            if (this.$el != undefined && this.$el != null) {
                this._render(this.$el);
            }
        }

        return this;
    },
    _render: function _render(el) {
        var parentNode = el.parentNode;

        this._vnode = parser(this.$jsonTree, this);

        var domFragment = (0, _render3.default)(this._vnode);
        this.$el = domFragment.firstChild;

        parentNode.replaceChild(domFragment, el);

        if (typeof this.ready == "function") {
            this.ready();
        }
    },
    _observe: function _observe(key, value) {
        var _this3 = this;

        var type = typeof key === "undefined" ? "undefined" : _typeof(key),
            length = arguments.length,
            data = void 0;

        if (length == 1 && type == "object") {
            data = key;
        } else if (length == 2 && type == "string") {
            data = {};
            data[key] = value;
        } else {
            return console.error("arguments error");
        }

        checkExistence(this, data, function (prop) {
            console.error(prop + " has been used as a basic prototype");
            delete data[prop];
        });

        new _observe2.react(this.$data || function (vm) {
            Object.defineProperty(vm, "$data", {
                value: {},
                enumerable: false
            });
            return vm.$data;
        }(this), data, function () {
            _this3._updateView();
        });

        new _observe2.react(this, this.$data, function () {
            _this3._updateView();
        });
        console.log(data);
    },
    _setMethods: function _setMethods(methods) {
        var _this4 = this;

        if ((typeof methods === "undefined" ? "undefined" : _typeof(methods)) != "object") {
            return;
        }
        var keys = Object.keys(methods);

        keys.forEach(function (key) {
            if (_this4.hasOwnProperty(key)) {
                return console.error(key + "has been used as a data prototype");
            }
            _this4[key] = methods[key];
        });
    },
    _updateView: function _updateView() {
        if (!this._continued) {
            return;
        }

        var oldVN = this._vnode;
        var newVN = this._vnode = parser(this.$jsonTree, this);

        (0, _compare2.default)(oldVN, newVN, { childNodes: [this.$el] }, this);
    },
    _destroy: function _destroy() {
        if (this._components.length > 0) {
            this._components.forEach(function (component) {
                return component._destroy();
            });
        }

        if (this._isComponent) {
            var index = this.$parent._components.indexOf(this);
            this.$parent._components.splice(index, 1);
        }

        var observe = this.$data ? this.$data.__ob__ : false;

        if (observe) {
            observe.destroy();
        }

        this._vnode[0].remove();
        this._vnode = null;
        this.$jsonTree = null;
        this.$el = null;
        this.$refs = null;
        this._refs = null;
        this._dir = null;
        this._components = null;
        this._c = null;
        this.$parent = null;
    }
};

turbine._turbine = turbine.prototype;

turbine._turbine._init.prototype = turbine.prototype;

turbine.use = function (obj, options) {
    if (obj instanceof Object) {
        obj.install(turbine, options);
    }
};

turbine.set = turbine._turbine.$set = function () {
    var length = arguments.length,
        i = 3,
        target = void 0,
        key = void 0,
        value = void 0;

    if (length == i) {
        target = arguments[0];
        key = arguments[1];
        value = arguments[2];
    } else {
        target = this;
        key = arguments[0];
        value = arguments[1];
    }

    if (target instanceof Array) {
        return target.forEach(function (el) {
            if (el instanceof turbine._turbine._init) {
                set(el, key, value);
            } else {
                throw "target must be a instance of turbine";
            }
        });
    } else if (target instanceof turbine.prototype._init) {
        set(target, key, value);
    } else {
        throw "target must be a instance of turbine";
    }

    function set(target, key, value) {
        target._observe(target, key, value);
    }
};

turbine._turbine.$watch = function (exp, call, options) {
    var _this5 = this;

    var avoid = true;
    new _watcher2.default(this, null, exp, function (oldVal, newVal) {
        if (!avoid) {
            call.call(_this5, oldVal, newVal);
        }
        avoid = false;
    });
};

turbine.hangup = turbine._turbine.$hangup = function (vm) {
    if (this instanceof turbine._turbine._init) {
        this.beforeHangup && this.beforeHangup();

        this._continued = false;
        this._vnode[0].remove();
        this._vnode = null;
    } else if (vm instanceof turbine._turbine._init) {
        vm.$hangup();
    }
};

turbine.restart = turbine._turbine.$restart = function (vm) {
    if (this instanceof turbine._turbine._init) {
        this._continued = true;
        this._render(vm.$el, vm);
    } else if (vm instanceof turbine._turbine._init) {
        vm.$restart(vm);
    }
};

turbine._turbine.$mount = function (el) {
    var element = el;

    if (el instanceof HTMLElement) {
        element = el;
    } else if (typeof el == "string") {
        element = document.body.querySelector(el);
    } else {
        throw "arguments error";
    }

    this._continued = true;
    this._render(this.$el = element, this);

    return this;
};

turbine.component = function (tagName, props) {
    turbine._components = turbine._components || {};

    turbine._components[tagName] = props;
};

turbine.directive = function (_t, name, fn) {
    var config = {};

    if (arguments.length == 2) {
        fn = name;
        name = _t;
        _t = null;
    }

    if (typeof fn == "function") {
        config.bind = config.update = fn;
    } else if ((typeof fn === "undefined" ? "undefined" : _typeof(fn)) === "object") {
        config = fn;
    } else {
        throw "arguments error\n" + fn;
    }

    config.directive = name;

    var _conf = Object.assign({
        level: 4,
        display: false,
        preventDefaultVal: false
    }, config);

    if (_t === null) {
        publicDirectives.push(_conf);
    } else {
        _t._dir.push(_conf);
    }
};

_analyse.directives.forEach(function (obj) {
    turbine.directive(obj.directive, obj);
});

turbine.component = function (childName, props) {
    var _this = void 0;
    if (arguments.length == 3) {
        _this = arguments[0]._c;
        childName = arguments[1];
        props = arguments[2];
    } else {
        _this = publicComponents;
    }

    var isCamel = /([A-Z])/g.exec(childName);
    var cName = void 0;

    if (isCamel) {
        isCamel.forEach(function (letter) {
            cName = childName.replace(letter, '-' + letter.toLowerCase());
        });
    } else {
        cName = childName;
    }

    if (_this.hasOwnProperty(cName)) {
        return console.warn("this component name has been used, please rename your component.\nName: " + cName);
    }

    _this[cName] = props;
};

exports.default = turbine;