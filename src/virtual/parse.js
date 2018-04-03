import deepClone from "../util/clone"
import {symbol} from "./analyse"
import {stringify} from "himalaya"
import evalWithContext from "../util/eval"
import component from "../component/main"

class parseTemplate {
    constructor(domTree, context) {
        this.directives = context._dir;
        this.components = context._c;

        return this.parse(deepClone(domTree), context);
    }
    parse(domTree, context) {
        for (let index = 0; index < domTree.length; index++) {
            let vNode = domTree[index];
            if (vNode.type == "text") {
                symbol(vNode, domTree, index, context);
            } else if (vNode.type == "element") {
                if (this.components.hasOwnProperty(vNode.tagName)) {
                    vNode.isComponent = true;
                } else if (vNode.tagName == "slot") {
                    let slotName = "default";
                    vNode.attributes.forEach(attr => {
                        if (attr.key == "name") {
                            slotName = attr.value;
                        }
                    });
                    let slot = context.slots ? context.slots[slotName] : false;
                    let applyArgs = [index, 1];
                    if (slot) {
                        (slot instanceof Array ? slot : [slot]).forEach(node => applyArgs.push(node));
                    }
                    [].splice.apply(domTree, applyArgs) && (index -= 1);
                }

                try {
                    this.analyseHook(
                        (add) => {
                            index = add != undefined ? add : index;
                            return index;
                        },
                        vNode,
                        domTree,
                        context
                    );
                } catch(e) {
                    console.error(e + '\n\n', 'please check your template: \n' + stringify([vNode.reference]));
                }
            }
        }

        return domTree;
    }
    analyseHook(index, vNode, domTree, properties) {
        let recall = (newNode, domTree, prop) => {
            if (vNode.isComponent != true) {
                this.parse(domTree || vNode.children, prop || properties);
            } else {
                let node = newNode || vNode;
                let tagName = node.tagName;
                let config = this.components[tagName];
                node.tagName = "div";
                node.inserted(function (el) {
                    properties._components.push(
                        new component(
                            Object.assign({el, vNode: this}, config)
                        )
                    );
                });
            }
        };

        let queue = new makeSequence(recall);
        let attrs = vNode.attributes.concat();

        attrs.forEach(binding => {
            this.matchHook(binding, function(match) {
                let key = binding.key,
                    argIndex = key.indexOf(":");

                if (match.display === false) {
                    removeHook(vNode.attributes, key);
                }

                if (argIndex >= 0) {
                    binding.args = key.slice(argIndex + 1);
                }

                queue.push(match, {
                    vNode,
                    domTree,
                    index,
                    properties,
                    binding
                });
            })
        });

        queue.process();
    }
    matchHook(attr, call) {
        this.directives.forEach(match => {
            let directive = match.directive;
            let prefix = directive.indexOf("^") < 0 ? '^v-' : '';
            let reg = eval(`/${prefix + directive}/`);
            if (reg.test(attr.key)) {
                call(match);
            }
        });
    }
}

class makeSequence {
    constructor(recall) {
        this.queue = [];
        this.presentQueue = [];
        this._flag = true;
        this._rinx = 0;
        this._cinx = 0;
        this.copy = [];
        this.recall = recall;
    }
    push(hook, args) {
        let level = hook.level;
        if (this.queue[level] == undefined) {
            this.queue[level] = [{hook, args}];
        } else {
            this.queue[level].push({hook, args});
        }
    }
    process() {
        let redirect = [null];
        let length = this.queue.length;

        if (length === 0) {
            return this.recall();
        }
        this.queue.forEach((group, cinx) => {
            this._cinx = cinx;
            this.presentQueue = group;
            this._rinx = 0;

            if (group === undefined) {
                return;
            }

            this.presentQueue.forEach((target, rinx) => {
                if (this._flag != true) {
                    return;
                }
                this._rinx = rinx;

                redirect.forEach((args) => {
                    let binding = target.args.binding = Object.assign({}, target.args.binding);

                    let preventDefaultVal = target.hook.preventDefaultVal;

                    if (preventDefaultVal !== true && binding.value != null) {
                        let context = args ? args.properties : target.args.properties;
                        let content = binding.value;
                        binding.result = evalWithContext(content, context);
                    }
                    let params = Object.assign(target.args, args);
                    let vNode = params.vNode;

                    this.callHandler(target, params);

                    let hook = Object.create(target.hook);
                    hook.binding = binding;
                    vNode.directives.push(hook);
                    vNode.context = params.properties;
                });

                redirect = this.copy.length === 0 ? redirect : this.copy;
                this.copy = [];
            });
        });
    }
    callHandler(target, params) {
        target.hook.use && target.hook.use(
            params,
            this.insertQueue.bind(this),
            this.stop.bind(this)
        );

        if (
            this._flag === true &&
            this._cinx == this.queue.length - 1 &&
            this._rinx == this.presentQueue.length - 1
        ) {
            if (this.copy.length > 0) {
                this.copy.forEach(item => {
                    this.recall(item.vNode, item.vNode.children, item.properties);
                });
            } else {
                this.recall(params.vNode, params.vNode.children, params.properties);
            }
        }
    }
    insertQueue(vNode, domTree, properties) {
        this._flag = true;
        this.copy.push({
            vNode, domTree, properties
        });
    }
    stop() {
        this._flag = false;
    }
}

function removeHook(group, name) {
    let index;
    group.forEach((el, _index) => {
        if (el.key == name) {
            index = _index;
        }
    });

    group.splice(index, 1);
}

export default parseTemplate