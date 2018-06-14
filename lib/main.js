"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _jsonTree = require("./util/jsonTree");

var _jsonTree2 = _interopRequireDefault(_jsonTree);

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
            this.$jsonTree = (0, _jsonTree2.default)(template);
            this._continued = true;
        } else if (template != undefined) {
            this.$jsonTree = (0, _jsonTree2.default)(template);
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

        var timer = void 0;
        new _observe2.react(this.$data || function (vm) {
            Object.defineProperty(vm, "$data", {
                value: {},
                enumerable: false
            });
            return vm.$data;
        }(this), data, function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                timer = null;
                _this3._updateView();
            });
        });

        Object.keys(this.$data).forEach(function (prop) {
            Object.defineProperty(_this3, prop, {
                enumerable: true,
                configurable: true,
                get: function get() {
                    return _this3.$data[prop];
                },
                set: function set(newVal) {
                    _this3.$data[prop] = newVal;
                }
            });
        });
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

        (0, _compare2.default)(oldVN, newVN, { childNodes: [this.$el] });
        oldVN = null;
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

turbine.set = turbine._turbine.$set = function (target, key, value) {
    var length = arguments.length,
        vals = void 0,
        ob = void 0;

    if (length == 2 && typeof target == "string" && this instanceof turbine.prototype._init) {
        value = key;
        vals = target.split(".");
        target = this.$data;
        key = vals[vals.length - 1];

        vals.forEach(function (valName, index) {
            if (target.hasOwnProperty(valName) && index < vals.length - 1) {
                target = target[valName];
            } else {
                var separate = valName.match(/\[\w+\]/g);
                var prefix = valName.match(/^(\w+)/)[0];
                if (separate != null && separate.length > 1) {
                    separate.map(function (val, i) {
                        separate[i] = val.replace("[", "").replace("]", "");
                    });
                    separate.unshift(prefix);

                    separate.forEach(function (valName, i) {
                        if (i <= separate.length - 2 || index <= vals.length - 1) {
                            target = target[valName];
                        } else if (index == vals.length - 1) {
                            key = valName;
                        }
                    });
                } else if (index < vals.length - 1) {
                    throw "reference Error";
                }
            }
        });
    } else if (length !== 3 && !(target instanceof Object)) {
        throw "arguments Error";
    }

    ob = target.__ob__;
    ob.update(key, value, true);

    // Object.defineProperty(target, key, {
    //     enumerable: true,
    //     configurable: true,
    //     get: () => {
    //         return value;
    //     },
    //     set: (newVal) => {
    //         value = newVal;
    //     }
    // });
};

turbine.delete = turbine._turbine.$delete = function (target, key) {
    var ob = void 0;
    var refresh = true;

    if ((typeof target === "undefined" ? "undefined" : _typeof(target)) == "object" && target.hasOwnProperty("__ob__")) {
        ob = target.__ob__;
        ob.destroy(key, refresh);
    } else {
        throw "target must be an Object or Array and it should have been observed";
    }
};

turbine._turbine.$watch = function (exp, call, options) {
    var _this5 = this;

    var avoid = true;
    new _watcher2.default(this, exp, function (oldVal, newVal) {
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

function once(fn, context) {
    var result = void 0;

    return function () {
        if (fn) {
            result = fn.apply(context || this, arguments);
            fn = null;
        }

        return result;
    };
}

exports.default = turbine;