import deepClone from "../util/clone";
import watcher from "./watcher";
import {Dep} from "./observe";
import evalWithContext from "../util/eval";
import Component from "../component/main";

const directives = [
    {
        directive: "if$",
        level: 0,
        use: (params) => {
            let {binding, vNode} = params;
            // let _index = 0;
            // let nextSibling;

            // do {
            //     _index += 1;
            //     nextSibling = domTree[vNode.index + _index];
            //
            //     if (
            //         nextSibling != undefined &&
            //         nextSibling.type == "element" &&
            //         (
            //             nextSibling.attributes.find(el => el.key == "v-else") ||
            //             nextSibling.attributes.find(el => el.key == "v-else-if")
            //         )
            //     ) {
            //         nextSibling._if = binding.result;
            //     }
            // } while (nextSibling != undefined && nextSibling.type != "tag");
            // vNode.reference.attributes = vNode.reference.attributes.filter(attr => attr.key != "v-if");

            vNode._if = Boolean(binding.result);

            if (!binding.result) {
                vNode.type = "comment";
                vNode.content = "";
                vNode.children.length = 0;
            }

            binding.lastResult = binding.result;
        },
        update: (el, binding, vNode)=> {
            if (binding.lastResult === binding.result) {
                return vNode.isDirty = false;
            }
            if (binding.result === true) {
                vNode.type = "element";
                vNode.children = deepClone(vNode.reference.children);

                if (vNode.isComponent && vNode.data.component === null) {
                    vNode.inserted(function (el) {
                        let tagName = vNode.reference.tagName;
                        let config = vNode.context._c[tagName];
                        vNode.context._components.push(
                            new Component(
                                Object.assign({el, vNode}, config)
                            )
                        );
                    });
                }
            } else {
                vNode.type = "comment";
                vNode.content = "";
                vNode.children.forEach(child => child.remove());
                vNode.children.length = 0;

                if (vNode.isComponent && vNode.data.component) {
                    vNode.inserted(function () {
                        vNode.data.component._destroy();
                        vNode.data.component = null;
                    });
                    // let parentNode = el.parentNode;
                    // parentNode.insertBefore(document.createComment(""), parentNode.childNodes[vNode.index]);
                }
            }
            vNode.isDirty = true;
            vNode._if = Boolean(binding.result);
            binding.lastResult = binding.result;
        }
    },
    {
        directive: "else$",
        level: 0,
        preventDefaultVal: true,
        use: (params) => {
            let {vNode, domTree} = params;

            let index = vNode.index;
            let prevNode;

            do {
                prevNode = domTree[index -= 1];
            } while (prevNode._if === null);

            if (prevNode !== undefined && prevNode._if !== null) {
                if (prevNode._if) {
                    vNode.type = "comment";
                    vNode.content = "";
                    vNode.children.length = 0;
                }

                vNode.data.originNode = prevNode;
                vNode._else = !prevNode._if;
            } else {
                throw("Turbine couldn't \"t-if\" attribute on previous nodes ");
            }
        },
        update: (el, binding, vNode) => {
            let {originNode} = vNode.data;
            if (!originNode._if === vNode._else) {
                return vNode.isDirty = false;
            } else {
                vNode.isDirty = true;
                vNode._else = !originNode._if;
                if (originNode._if) {
                    vNode.type = "comment";
                    vNode.content = "";
                    vNode.children.forEach(child => child.remove());
                    vNode.children.length = 0;
                } else {
                    vNode.type = "element";
                    vNode.children = deepClone(vNode.reference.children);
                }
            }
        }
    },
    // {
    //     directive: 'else\-if$',
    //     level: 0,
    //     use: (params, insertQueue, stop) => {
    //         let {vNode, domTree, index, binding} = params;
    //         let result = binding.result;
    //
    //         if (vNode.hasOwnProperty("_if")) {
    //             if (vNode._if === true) {
    //                 // editTree(domTree, index, 1);
    //                 stop();
    //                 result = true;
    //             } else if (vNode._if === false) {
    //                 if (!result) {
    //                     // editTree(domTree, index, 1);
    //                     stop();
    //                 }
    //             }
    //         } else {
    //             throw "cannot find a flag 'v-if' or 'v-else-if' in previous element";
    //         }
    //
    //         let _index = 0;
    //         let nextSibling;
    //
    //         do {
    //             _index += 1;
    //             nextSibling = domTree[vNode.index + _index];
    //
    //             if (
    //                 nextSibling != undefined &&
    //                 nextSibling.type == "element" &&
    //                 (
    //                     nextSibling.attributes.find(el => el.key == "v-else") ||
    //                     nextSibling.attributes.find(el => el.key == "v-else-if")
    //                 )
    //             ) {
    //                 nextSibling._if = result;
    //             }
    //         } while (nextSibling != undefined && nextSibling.type != "tag");
    //     }
    // },
    {
        directive: "for$",
        level: 0,
        preventDefaultVal: true,
        use: (params, insertQueue, stop) => {
            let {vNode, domTree, properties, binding} = params;
            let code = binding.value;
            let inner, counter, length;

            let args = code.split(" in ");
            let mulArg = args[0].match(/^\(.*\)/g);
            let content = trim(args[1]);

            if (mulArg != null && mulArg.length == 1) {
                let params = mulArg[0].match(/\w+/g);
                inner = params[0];
                counter = params[1];
            } else {
                inner = trim(args[0]);
            }
            vNode.watchers.push(new watcher(properties, content, {
                handler: (newVal) => {
                    vNode.data.reference = isNaN(newVal) ? newVal : (function() {
                        let array = [];
                        let max = Number(newVal);
                        while (array.length < max) {
                            array.push(array.length);
                        }
                        return array;
                    }());
                    if (length === undefined) {
                        insertNodes({
                            inner,
                            counter,
                            domTree,
                            properties,
                            vNode,
                        });
                        length = Object.keys(newVal).length;
                    } else {
                        let nLength = Object.keys(newVal).length;
                        if (nLength > length) {
                            insertNodes({
                                inner,
                                counter,
                                domTree,
                                properties,
                                vNode,
                                startAt: length - 1
                            });
                        } else if (nLength < length) {
                            domTree.slice(vNode.index + 1 + nLength, vNode.index + 1 +length).forEach(node => {
                                domTree.splice(domTree.indexOf(node), 1);
                                node.remove();
                            });
                            domTree.forEach((_node, index) => {
                                _node.index = index;
                            });

                        }
                        length = nLength;
                    }
                },
                immediate: true
            }));

            vNode.type = "comment";
            vNode.content = "";
            vNode.attributes = [];
            stop();
        }
    },
    {
        directive: "show",
        level: 1,
        update: function(el, binding, vNode) {
            if (vNode.isDirty) {
                return vNode.inserted(el => this.update(el, binding, vNode));
            }
            if (binding.result) {
                el.style.display = binding.args || "block";
            } else {
                el.style.display = "none";
            }
        }
    },
    {
        directive: "on",
        level: 1,
        preventDefaultVal: true,
        bind: function(el, binding, vNode) {
            if (vNode._if === false) {
                return;
            }
            let context = Object.create(vNode.context);
            let events = [], event, fn;
            if (binding.args.length > 0) {
                event = binding.args;
                fn = function(e) {
                    let args = Array.prototype.slice.call(arguments);
                    if (/\((.*?)\)/.test(binding.value)) {
                        if (e instanceof Event) {
                            context["$event"] = e;
                        }
                        return evalWithContext(binding.value, context);
                    } else {
                        let result = evalWithContext(binding.value, context);
                        if (result instanceof Function) {
                            result.apply(context, args);
                        }
                    }
                };
                events.push({event, fn});
            } else {
                let evalue = evalWithContext(binding.value, context);
                if (evalue instanceof Object) {
                    Object.keys(evalue).forEach(key => {
                        event = key;
                        fn = evalue[key];
                        if (fn instanceof Function) {
                            events.push({event, fn});
                        }
                    });
                }
            }

            vNode.data.events = events;

            if (vNode.isComponent === false) {
                events.forEach(event => {
                    el.addEventListener(event.event, event.fn);
                });
            }
        },
        update: function(el, binding, vNode) {
            if (vNode.isDirty) {
                vNode.inserted((newEl) => {
                    if (vNode._if === true) {
                        this.bind(newEl, binding, vNode);
                    }
                });
            }
        },
        unbind: (el, binding, vNode) => {
            if (vNode.isComponent === false && vNode._if === true) {
                vNode.data.events.forEach(event => {
                    el.removeEventListener(event.event, event.fn);
                });
                vNode.data.events.length = 0;
            }
        }
    },
    {
        directive: "bind",
        level: 1,
        bind: (el, binding, vNode) => {
            if (vNode._if === false) {
                return;
            }
            bindingUpdate(el, binding, vNode);
        },
        update: function(el, binding, vNode) {
            if (vNode.isDirty) {
                vNode.inserted(newEl => {
                    if (vNode._if === true) {
                        this.update(newEl, binding, vNode);
                    }
                });
                return;
            }
            bindingUpdate(el, binding, vNode);
        }
    },
    {
        //需要针对v-if做特殊处理
        directive: "model$",
        level: 1,
        bind: (el, binding, vNode) => {
            if (vNode._if === false) {
                return;
            }
            let inputType = vNode.tagName == "textarea" ? "text" : ArrayFind(vNode.attributes, el => el.key == "type").value || "text";
            let content = binding.value;
            el.addEventListener("input", (binding.inputEvent = (e) => {
                let data = evalWithContext(content, vNode.context);
                if (data != e.target.value) {
                    evalWithContext(content + "= '" + e.target.value + "'", vNode.context);
                }
            }));
            el.addEventListener("change", (binding.changeEvent = (e) => {
                let data = evalWithContext(content, vNode.context);
                if (inputType == "checkbox" && data instanceof Array) {
                    if (el.checked == true) {
                        data.push(el.value);
                    } else {
                        let index = data.indexOf(el.value);
                        data.splice(index, 1);
                    }
                } else if (data != e.target.value) {
                    data = e.target.value;
                }
            }));
        },
        update: (el, binding, vNode) => {
            if (vNode.isDirty) {
                return vNode.inserted((newEl) => {
                    if (vNode._if === true) {
                        this.bind(newEl, binding, vNode);
                    }
                });
            }
            let inputType = vNode.tagName == "textarea" ? "text" : ArrayFind(vNode.attributes, el => el.key == "type").value || "text";

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
        unbind: (el, binding) => {
            el.removeEventListener("input", binding.inputEvent);
            el.removeEventListener("change", binding.changeEvent);
        }
    },
    {
        directive: "^ref$",
        level: 3,
        display: true,
        preventDefaultVal: true,
        bind: (el, binding, vNode) => {
            if (vNode._if === false) {
                return;
            }
            let context = vNode.context;
            let {_refs, $refs} = context;
            let _refObj = _refs[binding.value];
            let $refObj = $refs[binding.value];
            let key = vNode.key;

            if (_refObj == undefined) {
                _refs[binding.value] = [key];
                $refs[binding.value] = el;
            } else {
                _refObj.push(key);
                $refs[binding.value] = $refObj instanceof Array ? $refObj.concat(el) : [$refObj, el];
            }
        },
        update: function(el, binding, vNode) {
            if (vNode.isDirty) {
                if (vNode._if === false) {
                    this.unbind(el, binding, vNode);
                }
                return vNode.inserted((newEl) => {
                    if (vNode._if === true) {
                        this.bind(newEl, binding, vNode);
                    }
                });
            }
        },
        unbind: (el, binding, vNode) => {
            let key = vNode.key,
                name = binding.value,
                {_refs, $refs} = vNode.context,
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
    }
];

function bindingUpdate(el, binding, vNode) {
    let value = binding.result;
    let component = vNode.data.component;

    if (value.toString() == "[object Object]") {
        if (vNode.isComponent === false) {
            let str = "", val;
            if (binding.args !== "") {
                Object.keys(value).forEach(key => {
                    val = value[key];

                    if (typeof val == "boolean") {
                        str += val ? key + " " : "";
                    } else {
                        str += `${key}: ${value[key]};`;
                    }
                });
                setAttribute(vNode, el, binding.args, str);
            } else {
                Object.keys(value).forEach(key => {
                    val = value[key];

                    setAttribute(vNode, el, key, val);
                });
            }
        } else {
            Object.keys(value).forEach(key => {
                if (vNode.isComponent) {
                    if (component === undefined) {
                        vNode.attributes.push({key, value: value[key]});
                    } else {
                        component.$data.__ob__.update(key, value[key]);
                    }
                } else {
                    setAttribute(vNode, el, key, value[key]);
                }
            });
        }
    } else if (value instanceof Array) {
        if (vNode.isComponent) {
            if (component === undefined) {
                vNode.attributes.push({key: binding.args, value: value[0]});
            } else {
                component.$data.__ob__.update(binding.args, value[0]);
            }
        } else {
            setAttribute(vNode, el, binding.args, value[0]);
        }
    } else {
        if (vNode.isComponent) {
            if (component === undefined) {
                vNode.attributes.push({key: binding.args, value});
            } else {
                component.$data.__ob__.update(binding.args, value);
            }
        } else {
            setAttribute(vNode, el, binding.args, value);
        }
    }
}

function symbol(vNode, domTree, index, context) {
    let reg = vNode.content.match(/{{([^}}]*?)}}/g);

    if (reg != null || reg != undefined) {
        reg.forEach(function(match) {
            let content = match.match(/[^{{}}]*/g)[2];
            vNode.inserted(node => {
                vNode.watchers.push(new watcher(context, content, {
                    handler: (newVal) => {
                        let text = vNode.content;
                        let start = text.indexOf(match);
                        text = text.slice(0, start) + newVal + text.slice(start + match.length);
                        node.nodeValue = text;
                    },
                    immediate: true
                }));
            });
        });

        domTree[index] = vNode;
    }
}

function insertNodes(params) {
    let {properties, vNode, inner, counter, domTree, startAt} = params;
    let newNode;
    let index = 0;
    let data = isNaN(vNode.data.reference) ? vNode.data.reference : (function() {
        let array = [];
        let max = Number(vNode.data.reference);
        while (array.length < max) {
            array.push(array.length);
        }
        return array;
    }());
    for (let key in data) {
        if (startAt != undefined && index <= startAt) {
            index += 1;
            continue;
        }
        let refer = {};
        let context = Object.create(properties);
        newNode = deepClone(vNode.reference);
        newNode.attributes = newNode.attributes.filter(attr => attr.key != "t-for");
        newNode.directives.push(vNode.directives[0]);
        newNode.index = vNode.index + (index += 1);
        newNode.context = context;

        if (data instanceof Array) {
            Object.defineProperty(context, inner, {
                get: function(newNode) {
                    let data = vNode.data.reference;
                    if (Dep.target) {
                        data.__ob__.dep.addSub(Dep.target);
                        newNode.watchers.push(Dep.target);
                    }
                    return data[key];
                }.bind(null, newNode),
                enumerable: true,
                configurable: true
            });
            if (counter) {
                refer[counter] = key;
            }
        } else if (data instanceof Object) {
            Object.defineProperty(context, inner, {
                get: function(index, newNode) {
                    let data = vNode.data.reference;
                    if (Dep.target) {
                        data.__ob__.dep.addSub(Dep.target);
                        newNode.watchers.push(Dep.target);
                    }
                    let key = Object.keys(data)[index - 1];

                    return key;
                }.bind(null, index, newNode),
                enumerable: true,
                configurable: true
            });
            if (counter) {
                refer[counter] = index - 1;
            }
        }

        context.$data.__ob__.react.observe(context, refer);

        domTree.splice(newNode.index, 0, newNode); // inserting clone object into domTree
    }
    if (index > 0) {
        for (let i = vNode.index + index + 1; i < domTree.length; i++) {
            domTree[i].index = i;
        }
    }
}

function setAttribute(vNode, node, key, value) {
    if (node.nodeType !== 1) {
        return;
    }

    let original = ArrayFind(vNode.attributes, el => el.key == key);

    if (typeof value === "boolean" && !value) {
        if (original) {
            value = false;
        } else {
            return node.removeAttribute(key);
        }
    }

    let copy = node.attributes[key];

    if (!copy) {
        node.setAttribute(key, value);
    } else {
        copy.nodeValue = (original ? original.value + " " : "") + value || "";
    }
}

function ArrayFind(array, callback) {
    let i, data;
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


export {directives, symbol};
