"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.symbol = exports.directives = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _clone = require("../util/clone");

var _clone2 = _interopRequireDefault(_clone);

var _watcher = require("./watcher");

var _watcher2 = _interopRequireDefault(_watcher);

var _observe = require("./observe");

var _eval = require("../util/eval");

var _eval2 = _interopRequireDefault(_eval);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var directives = [{
    directive: 'if$',
    level: 0,
    use: function use(params, insertQueue, stop) {
        var domTree = params.domTree,
            index = params.index,
            binding = params.binding;


        var _index = 0;
        var nextSibling = void 0;

        do {
            _index += 1;
            nextSibling = domTree[index() + _index];

            if (nextSibling != undefined && nextSibling.type == "element" && (nextSibling.attributes.find(function (el) {
                return el.key == "v-else";
            }) || nextSibling.attributes.find(function (el) {
                return el.key == "v-else-if";
            }))) {
                nextSibling._if = binding.result;
            }
        } while (nextSibling != undefined && nextSibling.type != "tag");

        if (!binding.result) {
            editTree(domTree, index, 1);
            stop();
        }
    }
}, {
    directive: 'else$',
    level: 0,
    use: function use(params, insertQueue, stop) {
        var vNode = params.vNode,
            domTree = params.domTree,
            index = params.index;


        if (vNode.hasOwnProperty("_if")) {
            if (vNode._if === true) {
                editTree(domTree, index, 1);
                stop();
            }
        } else {
            throw "cannot find a flag 'v-if' in previous element";
        }
    }
}, {
    directive: 'else\-if$',
    level: 0,
    use: function use(params, insertQueue, stop) {
        var vNode = params.vNode,
            domTree = params.domTree,
            index = params.index,
            binding = params.binding;

        var result = binding.result;

        if (vNode.hasOwnProperty("_if")) {
            if (vNode._if === true) {
                editTree(domTree, index, 1);
                stop();
                result = true;
            } else if (vNode._if === false) {
                if (!result) {
                    editTree(domTree, index, 1);
                    stop();
                }
            }
        } else {
            throw "cannot find a flag 'v-if' or 'v-else-if' in previous element";
        }

        var _index = 0;
        var nextSibling = void 0;

        do {
            _index += 1;
            nextSibling = domTree[index() + _index];

            if (nextSibling != undefined && nextSibling.type == "element" && (nextSibling.attributes.find(function (el) {
                return el.key == "v-else";
            }) || nextSibling.attributes.find(function (el) {
                return el.key == "v-else-if";
            }))) {
                nextSibling._if = result;
            }
        } while (nextSibling != undefined && nextSibling.type != "tag");
    }
}, {
    directive: 'for$',
    level: 0,
    preventDefaultVal: true,
    use: function use(params, insertQueue, stop) {
        var vNode = params.vNode,
            domTree = params.domTree,
            index = params.index,
            properties = params.properties,
            binding = params.binding;

        var code = binding.value;
        var inner = void 0,
            counter = void 0,
            evalue = void 0,
            data = void 0,
            copy = void 0,
            key = void 0;
        var _index = 0;

        var args = code.split(" in ");
        var mulArg = args[0].match(/^\(.*\)/g);
        var content = trim(args[1]);

        evalue = (0, _eval2.default)(content, properties);

        if (mulArg != null && mulArg.length == 1) {
            var _params = mulArg[0].match(/[^(\(\)\,\s)][\w+]*/g);
            inner = _params[0];
            counter = _params[1];
        } else {
            inner = trim(args[0]);
        }

        if (typeof evalue == "number") {
            evalue = function (num) {
                var array = [];
                for (var i = 0; i < num; i++) {
                    array.push(i);
                }
                return array;
            }(evalue);
        }

        editTree(domTree, index, 1);

        var _loop = function _loop() {
            copy = (0, _clone2.default)(vNode);
            resetKey(copy, _index);
            (data = {}) && (data[inner] = Number(key) === NaN ? key : Number(key));
            var context = Object.create(properties);

            (function (index) {
                var ob = new _observe.react(context, data, null);
                var _w = new _watcher2.default(properties, copy, content, function (oldVal, value) {
                    var key = Object.keys(value)[index];

                    if (key === undefined) {
                        // return ob.__ob__.destroy();
                        return _w = ob = null;
                    }

                    context[inner] = value instanceof Array ? value[key] : key;
                });
            })(_index);

            if (mulArg != null && mulArg.length == 1) {
                context[counter] = _index;
            }

            _index += 1;
            domTree.splice(index() + _index, 0, copy); // inserting clone object into domTree
            insertQueue(copy, domTree, context);
        };

        for (key in evalue) {
            _loop();
        }

        resetIndex(index, _index); // set a new index of "for" statement, because domTree had been cloned

        if (_index == 0) {
            stop();
        }
    }
}, {
    directive: 'show$',
    level: 1,
    update: function update(el, binding, vNode) {
        if (binding.result) {
            el.style.display = "block";
        } else {
            el.style.display = "none";
        }
    }
}, {
    directive: 'on',
    level: 1,
    preventDefaultVal: true,
    bind: function bind(el, binding, vNode) {
        var context = Object.create(vNode.context);
        binding.eventCall = function (e) {
            if (/\((.*?)\)/.test(binding.value)) {
                context['$event'] = e;
            }
            return (0, _eval2.default)(binding.value, context);
        };

        el.addEventListener(binding.args, binding.eventCall);
    },
    unbind: function unbind(el, binding) {
        el.removeEventListener(binding.args, binding.eventCall);
    }
}, {
    directive: 'bind',
    level: 1,
    bind: function bind(el, binding, vNode) {
        if (vNode.isComponent === true) {
            return vNode.attributes.push({ key: binding.args, value: binding.result });
        }
        bindingUpdate(el, binding, vNode);
    },
    update: function update(el, binding, vNode) {
        if (vNode.isComponent === true && vNode.component.hasOwnProperty(binding.args)) {
            return vNode.component[binding.args] = binding.result;
        }

        bindingUpdate(el, binding, vNode);
    }
}, {
    directive: 'model$',
    level: 1,
    bind: function bind(el, binding, vNode) {
        var inputType = vNode.tagName == "textarea" ? "text" : ArrayFind(vNode.attributes, function (el) {
            return el.key == "type";
        }).value || "text";
        var content = binding.value;
        el.addEventListener('input', binding.inputEvent = function (e) {
            var data = (0, _eval2.default)(content, vNode.context);
            if (data != e.target.value) {
                (0, _eval2.default)(content + '= "' + e.target.value + '"', vNode.context);
            }
        });
        el.addEventListener('change', binding.changeEvent = function (e) {
            var data = (0, _eval2.default)(content, vNode.context);
            if (inputType == "checkbox" && data instanceof Array) {
                if (el.checked == true) {
                    data.push(el.value);
                } else {
                    var index = data.indexOf(el.value);
                    data.splice(index, 1);
                }
            } else if (data != e.target.value) {
                data = e.target.value;
            }
        });
    },
    update: function update(el, binding, vNode) {
        var inputType = vNode.tagName == "textarea" ? "text" : ArrayFind(vNode.attributes, function (el) {
            return el.key == "type";
        }).value || "text";

        if (inputType == "radio") {
            if (el.value == binding.result) {
                el.checked = true;
            } else {
                el.checked = false;
            }
        } else if (inputType == "checkbox") {
            if (binding.result.indexOf(el.value) >= 0) {
                el.checked = true;
            } else {
                el.checked = false;
            }
        } else {
            el.value = binding.result;
        }
    },
    unbind: function unbind(el, binding) {
        el.removeEventListener('input', binding.inputEvent);
        el.removeEventListener('change', binding.changeEvent);
    }
}, {
    directive: '^ref$',
    level: 3,
    display: true,
    preventDefaultVal: true,
    bind: function bind(el, binding, vNode) {
        var context = vNode.context;
        var _refs = context._refs,
            $refs = context.$refs;

        var _refObj = _refs[binding.value];
        var $refObj = $refs[binding.value];
        var key = vNode.key;

        if (_refObj == undefined) {
            _refs[binding.value] = [key];
            $refs[binding.value] = el;
        } else {
            _refObj.push(key);
            $refObj.push(el);
        }
    },
    unbind: function unbind(el, binding, vNode) {
        var key = vNode.key,
            name = binding.value,
            _vNode$context = vNode.context,
            _refs = _vNode$context._refs,
            $refs = _vNode$context.$refs,
            _refObj = _refs[name],
            $refObj = $refs[name];


        if ($refObj instanceof Array) {
            $refObj.splice($refObj.indexOf(vNode.el), 1);
            _refObj.splice(_refObj.indexOf(key), 1);
        } else {
            _refs[name] = undefined;
            $refs[name] = undefined;
        }
    }
}];

function bindingUpdate(el, binding, vNode) {
    var value = binding.result;

    if (value !== null && (typeof value === "undefined" ? "undefined" : _typeof(value)) == 'object' && value.toString() == '[object Object]') {
        if (binding.args != undefined) {
            var str = "",
                val = void 0;
            Object.keys(value).forEach(function (el) {
                val = value[el];

                if (typeof val == "boolean") {
                    str += val ? el + " " : "";
                } else {
                    str += el + ": " + value[el] + ";";
                }
            });
            setAttribute(vNode, el, binding.args, str);
        } else {
            Object.keys(value).forEach(function (key) {
                setAttribute(vNode, el, key, value[key]);
            });
        }
    } else if (value instanceof Array) {
        setAttribute(vNode, el, binding.args, value[0]);
    } else {
        setAttribute(vNode, el, binding.args, value);
    }
}

function symbol(vNode, domTree, index, context) {
    var reg = vNode.content.match(/{{([^}}]*?)}}/g);

    if (reg != null || reg != undefined) {
        reg.forEach(function (match) {
            var content = match.match(/[^{{}}]*/g)[2];
            vNode.inserted(function (node) {
                new _watcher2.default(context, vNode, content, function (oldVal, newVal) {
                    var text = vNode.content;
                    var start = text.indexOf(match);
                    text = text.slice(0, start) + newVal + text.slice(start + match.length);
                    node.nodeValue = text;
                });
            });
        });

        domTree[index] = vNode;
    }
}

function editTree(domTree, index, count) {
    domTree.splice(index(), count);
    index(index() - count);
}

function resetKey(vNode, index) {
    var key = vNode.key;
    key = parseInt(key, 16);
    key += index;
    key = key.toString(16);

    vNode.key = key;
    return key;
}

function resetIndex(index, math) {
    return index(index() + math);
}

function setAttribute(vNode, node, key, value) {
    var original = ArrayFind(vNode.attributes, function (el) {
        return el.key == key;
    });
    var copy = node.attributes[key];

    if (!copy) {
        node.setAttribute(key, value);
    } else {
        copy.nodeValue = (original ? original.value + " " : "") + value;
    }
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

function trim(str) {
    return str.replace(/\s/g, "");
}

exports.directives = directives;
exports.symbol = symbol;