import renderJsonTree from "./util/jsonTree";
import render from "./virtual/render";
import {react} from "./virtual/observe";
import watcher from "./virtual/watcher";
import {directives} from "./virtual/analyse";
import clone from "./util/clone";
import parser from "./virtual/parse";

const publicDirectives = [];
const publicComponents = {};

function checkExistence(target, props, recall) {
    let keys = Object.keys(props);

    keys.forEach(prop => {
        if (target.hasOwnProperty(prop)) {
            recall(prop);
        }
    });
}

let turbine = function(props) {
    if (props instanceof turbine.prototype._init) {
        return props;
    } else {
        return new turbine.prototype._init(props);
    }
};

turbine.prototype = {
    _init(props) {
        let {el, template, components, directives, methods, data, watch, slots} = props;

        this._refs = {};
        this.$refs = {};
        this._components = [];
        // this._isComponent = props._isComponent || false;
        // this.$parent = props.$parent || null;
        // this.slots = slots || null;
        this._dir = [];
        this._vnode = [];
        this.$el = null;
        this._continued = false;

        Object.keys(props).forEach(prop => {
            if (this.hasOwnProperty(prop)) {
                console.warn("this prototype name has been used already, please rename it:\n" + prop);
            } else if (["components", "directives", "methods", "data", "watch", "el"].indexOf(prop) < 0) {
                this[prop] = props[prop];
            }
        });

        if (el != undefined) {
            if (typeof el == "string") {
                el = document.body.querySelector(el);
            }
            template = template || el.outerHTML;

            this.$jsonTree = renderJsonTree(template);
            this._continued = true;
        } else if (template != undefined) {
            this.$jsonTree = renderJsonTree(template);
            this._continued = false;
        }

        {
            publicDirectives.forEach(directives => {
                this._dir.push(directives);
            });
            if (directives instanceof Object) {
                for (let key in directives) {
                    turbine.directive(this, key, directives[key]);
                }
            }
        }

        {
            this._c = Object.assign({}, publicComponents);
            if (components && typeof components == "object") {
                Object.keys(components).forEach(_c => {
                    turbine.component(this, _c, components[_c]);
                });
            }
        }

        this._setMethods(methods);

        if (this.beforeCreate) {
            this.beforeCreate();
        }


        {
            if (data != undefined && typeof data == "object") {
                this._observe(data);
            }
        }

        {
            if (typeof watch == "object") {
                let keys = Object.keys(watch);

                keys.forEach(key => {
                    this.$watch(key, watch[key]);
                });
            }
        }

        if (this.created) {
            this.created();
        }

        {
            if (el != undefined && el != null) {
                this._render(el);
            }
        }

        return this;
    },
    _render(el) {
        let parentNode = el.parentNode;
        this._vnode = new parser(clone(this.$jsonTree), this);

        let domFragment = render(this._vnode);
        this._vnode.forEach(vNode => {
            if (vNode.tagName == "turbine") {
                this.$el = vNode.el;
            }
        });
        if (this.$el === null) {
            throw("couldn't find turbine as a root html tag");
        }

        parentNode.replaceChild(domFragment, el);

        this._continued = true;
        if (this.mounted) {
            this.mounted();
        }
    },
    _observe(key, value) {
        let type = typeof key,
            length = arguments.length,
            data;

        if (length == 1 && type == "object") {
            data = key;
        } else if (length == 2 && type == "string") {
            data = {};
            data[key] = value;
        } else {
            return console.error("arguments error");
        }

        checkExistence(this, data, (prop) => {
            console.error(prop + " has been used as a basic prototype");
            delete data[prop];
        });

        let timer;
        new react(
            this.$data || (function (vm) {
                Object.defineProperty(vm, "$data", {
                    value: {},
                    enumerable: false
                });
                return vm.$data;
            })(this), data, () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    timer = null;
                    this._updateView();
                });
            });

        Object.keys(this.$data).forEach(prop => {
            Object.defineProperty(this, prop, {
                enumerable: true,
                configurable: true,
                get: () => {
                    return this.$data[prop];
                },
                set: (newVal) => {
                    this.$data[prop] = newVal;
                }
            });
        });
    },
    _setMethods(methods) {
        if (typeof methods != "object") {
            return;
        }
        let keys = Object.keys(methods);

        keys.forEach(key => {
            if (this.hasOwnProperty(key)) {
                return console.error(key + "has been used as a data prototype");
            }
            this[key] = methods[key];
        });
    },
    _updateView() {
        if (!this._continued) {
            return;
        }

        new parser(this._vnode, this);
        render(this._vnode, [this.$el]);
    },
    _destroy() {
        if (this._components.length > 0) {
            this._components.forEach(component => component._destroy());
        }

        if (this._isComponent) {
            let index = this.$parent._components.indexOf(this);
            this.$parent._components.splice(index, 1);
        }

        let observe = this.$data ? this.$data.__ob__ : false;

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
        this.vNode = null;
    }
};

turbine._turbine = turbine.prototype;

turbine._turbine._init.prototype = turbine.prototype;

turbine.use = (obj, options) => {
    if (obj instanceof Object) {
        obj.install(turbine, options);
    }
};

turbine.set = turbine._turbine.$set = function(target, key, value) {
    let length = arguments.length,
        vals, ob;

    if (length == 2 && typeof target == "string" && this instanceof turbine.prototype._init) {
        value = key;
        vals = target.split(".");
        target = this.$data;
        key = vals[vals.length - 1];

        vals.forEach((valName, index) => {
            if (target.hasOwnProperty(valName) && index < vals.length - 1) {
                target = target[valName];
            } else {
                let separate = valName.match(/\[\w+\]/g);
                let prefix = valName.match(/^(\w+)/)[0];
                if (separate != null && separate.length > 1) {
                    separate.map((val, i) => {
                        separate[i] = val.replace("[", "").replace("]", "");
                    });
                    separate.unshift(prefix);

                    separate.forEach((valName, i) => {
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
};

turbine.delete = turbine._turbine.$delete = function (target, key) {
    let ob;
    let refresh = true;

    if (typeof target == "object" && target.hasOwnProperty("__ob__")) {
        ob = target.__ob__;
        ob.destroy(key, refresh);
    } else {
        throw("target must be an Object or Array and it should have been observed");
    }
};

turbine._turbine.$emit = function (eventName) {
    let found = false;
    let args = Array.prototype.slice.call(arguments, 1);
    if (this.vNode != undefined && this.vNode.data.events) {
        this.vNode.data.events.forEach(event => {
            if (event.event == eventName) {
                found = true;
                event.fn.apply(this.vNode.context, args);
            }
        });
    }
    if (!found && this.$parent) {
        this.$parent.$emit(eventName, args);
    }
};

turbine._turbine.$watch = function(exp, options) {
    new watcher(this, exp, options);
};

turbine.hangup = turbine._turbine.$hangup = function(vm) {
    if (this instanceof turbine._turbine._init) {
        this.beforeHangup && this.beforeHangup();

        this._continued = false;
        this._vnode[0].remove();
        this._vnode = null;
    } else if (vm instanceof turbine._turbine._init) {
        vm.$hangup();
    }
};

turbine.restart = turbine._turbine.$restart = function(vm) {
    if (this instanceof turbine._turbine._init) {
        this._render(this.$el);
    } else if (vm instanceof turbine._turbine._init) {
        vm.$restart(vm);
    }
};

turbine._turbine.$mount = function (el) {
    let element = el;

    if (el instanceof HTMLElement) {
        element = el;
    } else if (typeof el == "string") {
        element = document.body.querySelector(el);
    } else {
        throw "arguments error";
    }

    this._render(this.$el = element);

    return this;
};

turbine.component = function (tagName, props) {
    turbine._components = turbine._components || {};

    turbine._components[tagName] = props;
};

turbine.directive = function (_t, name, fn) {
    let config = {};

    if (arguments.length == 2) {
        fn = name;
        name = _t;
        _t = null;
    }

    if (typeof fn == "function") {
        config.bind = config.update = fn;
    } else if (typeof fn === "object") {
        config = fn;
    } else {
        throw("arguments error\n" + fn);
    }

    config.directive = name;

    let _conf = Object.assign({
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

directives.forEach(obj => {
    turbine.directive(obj.directive, obj);
});

turbine.component = function (childName, props) {
    let _this;
    if (arguments.length == 3) {
        _this = arguments[0]._c;
        childName = arguments[1];
        props = arguments[2];
    } else {
        _this = publicComponents;
    }

    let isCamel = /([A-Z])/g.exec(childName);
    let cName;

    if (isCamel) {
        isCamel.forEach(letter => {
            cName = childName.replace(letter, "-" + letter.toLowerCase());
        });
    } else {
        cName = childName;
    }

    if (_this.hasOwnProperty(cName)) {
        return console.warn("this component name has been used, please rename your component.\nName: " + cName);
    }

    _this[cName] = props;
};

export default turbine;