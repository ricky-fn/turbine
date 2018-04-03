"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clone = require("../util/clone");

var _clone2 = _interopRequireDefault(_clone);

var _analyse = require("./analyse");

var _himalaya = require("himalaya");

var _eval = require("../util/eval");

var _eval2 = _interopRequireDefault(_eval);

var _main = require("../component/main");

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var parseTemplate = function () {
    function parseTemplate(domTree, context) {
        _classCallCheck(this, parseTemplate);

        this.directives = context._dir;
        this.components = context._c;

        return this.parse((0, _clone2.default)(domTree), context);
    }

    _createClass(parseTemplate, [{
        key: "parse",
        value: function parse(domTree, context) {
            var _this = this;

            var _loop = function _loop(_index2) {
                var vNode = domTree[_index2];
                if (vNode.type == "text") {
                    (0, _analyse.symbol)(vNode, domTree, _index2, context);
                } else if (vNode.type == "element") {
                    if (_this.components.hasOwnProperty(vNode.tagName)) {
                        vNode.isComponent = true;
                    } else if (vNode.tagName == "slot") {
                        var slotName = "default";
                        vNode.attributes.forEach(function (attr) {
                            if (attr.key == "name") {
                                slotName = attr.value;
                            }
                        });
                        var slot = context.slots ? context.slots[slotName] : false;
                        var applyArgs = [_index2, 1];
                        if (slot) {
                            (slot instanceof Array ? slot : [slot]).forEach(function (node) {
                                return applyArgs.push(node);
                            });
                        }
                        [].splice.apply(domTree, applyArgs) && (_index2 -= 1);
                    }

                    try {
                        _this.analyseHook(function (add) {
                            _index2 = add != undefined ? add : _index2;
                            return _index2;
                        }, vNode, domTree, context);
                    } catch (e) {
                        console.error(e + '\n\n', 'please check your template: \n' + (0, _himalaya.stringify)([vNode.reference]));
                    }
                }
                index = _index2;
            };

            for (var index = 0; index < domTree.length; index++) {
                _loop(index);
            }

            return domTree;
        }
    }, {
        key: "analyseHook",
        value: function analyseHook(index, vNode, domTree, properties) {
            var _this2 = this;

            var recall = function recall(newNode, domTree, prop) {
                if (vNode.isComponent != true) {
                    _this2.parse(domTree || vNode.children, prop || properties);
                } else {
                    var node = newNode || vNode;
                    var tagName = node.tagName;
                    var config = _this2.components[tagName];
                    node.tagName = "div";
                    node.inserted(function (el) {
                        properties._components.push(new _main2.default(Object.assign({ el: el, vNode: this }, config)));
                    });
                }
            };

            var queue = new makeSequence(recall);
            var attrs = vNode.attributes.concat();

            attrs.forEach(function (binding) {
                _this2.matchHook(binding, function (match) {
                    var key = binding.key,
                        argIndex = key.indexOf(":");

                    if (match.display === false) {
                        removeHook(vNode.attributes, key);
                    }

                    if (argIndex >= 0) {
                        binding.args = key.slice(argIndex + 1);
                    }

                    queue.push(match, {
                        vNode: vNode,
                        domTree: domTree,
                        index: index,
                        properties: properties,
                        binding: binding
                    });
                });
            });

            queue.process();
        }
    }, {
        key: "matchHook",
        value: function matchHook(attr, call) {
            this.directives.forEach(function (match) {
                var directive = match.directive;
                var prefix = directive.indexOf("^") < 0 ? '^v-' : '';
                var reg = eval("/" + (prefix + directive) + "/");
                if (reg.test(attr.key)) {
                    call(match);
                }
            });
        }
    }]);

    return parseTemplate;
}();

var makeSequence = function () {
    function makeSequence(recall) {
        _classCallCheck(this, makeSequence);

        this.queue = [];
        this.presentQueue = [];
        this._flag = true;
        this._rinx = 0;
        this._cinx = 0;
        this.copy = [];
        this.recall = recall;
    }

    _createClass(makeSequence, [{
        key: "push",
        value: function push(hook, args) {
            var level = hook.level;
            if (this.queue[level] == undefined) {
                this.queue[level] = [{ hook: hook, args: args }];
            } else {
                this.queue[level].push({ hook: hook, args: args });
            }
        }
    }, {
        key: "process",
        value: function process() {
            var _this3 = this;

            var redirect = [null];
            var length = this.queue.length;

            if (length === 0) {
                return this.recall();
            }
            this.queue.forEach(function (group, cinx) {
                _this3._cinx = cinx;
                _this3.presentQueue = group;
                _this3._rinx = 0;

                if (group === undefined) {
                    return;
                }

                _this3.presentQueue.forEach(function (target, rinx) {
                    if (_this3._flag != true) {
                        return;
                    }
                    _this3._rinx = rinx;

                    redirect.forEach(function (args) {
                        var binding = target.args.binding = Object.assign({}, target.args.binding);

                        var preventDefaultVal = target.hook.preventDefaultVal;

                        if (preventDefaultVal !== true && binding.value != null) {
                            var context = args ? args.properties : target.args.properties;
                            var content = binding.value;
                            binding.result = (0, _eval2.default)(content, context);
                        }
                        var params = Object.assign(target.args, args);
                        var vNode = params.vNode;

                        _this3.callHandler(target, params);

                        var hook = Object.create(target.hook);
                        hook.binding = binding;
                        vNode.directives.push(hook);
                        vNode.context = params.properties;
                    });

                    redirect = _this3.copy.length === 0 ? redirect : _this3.copy;
                    _this3.copy = [];
                });
            });
        }
    }, {
        key: "callHandler",
        value: function callHandler(target, params) {
            var _this4 = this;

            target.hook.use && target.hook.use(params, this.insertQueue.bind(this), this.stop.bind(this));

            if (this._flag === true && this._cinx == this.queue.length - 1 && this._rinx == this.presentQueue.length - 1) {
                if (this.copy.length > 0) {
                    this.copy.forEach(function (item) {
                        _this4.recall(item.vNode, item.vNode.children, item.properties);
                    });
                } else {
                    this.recall(params.vNode, params.vNode.children, params.properties);
                }
            }
        }
    }, {
        key: "insertQueue",
        value: function insertQueue(vNode, domTree, properties) {
            this._flag = true;
            this.copy.push({
                vNode: vNode, domTree: domTree, properties: properties
            });
        }
    }, {
        key: "stop",
        value: function stop() {
            this._flag = false;
        }
    }]);

    return makeSequence;
}();

function removeHook(group, name) {
    var index = void 0;
    group.forEach(function (el, _index) {
        if (el.key == name) {
            index = _index;
        }
    });

    group.splice(index, 1);
}

exports.default = parseTemplate;