/**
 * Created by Ricky on 2017/9/22.
 */

class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(watcher) {
        if (this.subs.indexOf(watcher) < 0) {
            this.subs.push(watcher);
            watcher.deps.push(this);
        }
    }
    notify(val, oldVal) {
        this.subs.forEach(sub => {
            if (sub != undefined) {
                sub.update(val, oldVal);
            }
        });
    }
}

class react {
    constructor(target, resource, call) {
        let length = arguments.length;
        if (length == 2 || length == 3) {
            this.recall = call;
            this.observe(target, resource);
        } else if (length == 1) {
            this.recall = resource;
        }
    }
    observe(_obj, _res) {
        let type = Object.prototype.toString.call(_res);
        let ob;
        if (type == "[object Object]" || type == "[object Array]") {
            if (_res.__ob__) {
                ob = _res.__ob__;
            } else if (_obj.__ob__) {
                ob = _obj.__ob__;
            } else {
                ob = type == "[object Array]" ? new observerArray(_obj, this) : new observer(_obj, this);
            }

            this.loopObj(_obj, _res, ob);
            if (type == "[object Array]") {
                this.replaceArrayProperty(_obj, ob);
            }
        }
    }
    loopObj(obj, res, observer) {
        Object.keys(res).forEach((prop) => {
            this.observeObj(obj, res, prop, observer); // observe and set value to reactive data
        });
    }
    observeObj(obj, res, prop, observer) {
        let dep = observer.dep;
        let val = res[prop], oldVal;

        if (!(res instanceof Array)) { // define value's subValue which value is an Object
            Object.defineProperty(obj, prop, {
                get: () => {
                    let watcher = Dep.target;

                    if (isObservered(val)) {
                        dep = val.__ob__.dep;
                    }

                    if (watcher != null || watcher != undefined) { // Dep target would be triggered by watcher module
                        dep.addSub(watcher); // push watcher Object into the dep
                    }

                    return val;
                },
                set: (newVal) => {
                    if (newVal === val) {
                        return;
                    } else {
                        oldVal = val;
                        val = newVal;
                    }

                    if (oldVal instanceof Object) {
                        injectWathcers(oldVal, val);
                    } else {
                        dep.notify();
                    }

                    this.recall && this.recall(val); // call the public recall
                },
                enumerable: true,
                configurable: true
            });
        } else {
            obj[prop] = val;
        }

        // observer.value = obj; // update the observer's value this will impact the real data structure
        this.observe(obj[prop], res[prop]); // loop subValues
    }
    replaceArrayProperty(array, observer) {
        let ORP = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
        let arrayProto = Array.prototype;
        let newProto = Object.create(arrayProto);
        let dep = observer.dep;
        let self = this;
        ORP.forEach(prop => {
            Object.defineProperty(newProto, prop, {
                value: function() {
                    let oldVal = array.concat();
                    arrayProto[prop].apply(array, arguments);
                    array.forEach((val, index) => {
                        if (!isObservered(val) && val instanceof Object) {
                            self.observe(val, val);
                            if (index < oldVal.length - 1) {
                                injectWathcers(oldVal[index], array[index]);
                            }
                        }
                    });

                    dep.notify();
                    self.recall && self.recall();
                },
                enumerable: false,
                configurable: true,
                writable: true
            });
        });
        setPrototypeOf(array, newProto);
        // array.__proto__ = newProto;
        observer.value = array;
    }
}

class observer {
    constructor(target, react) {
        this.dep = new Dep();
        this.react = react;
        this.value = target;

        Object.defineProperty(target, "__ob__", {
            enumerable: false,
            value: this
        });
    }
    update(key, newVal) {
        let existed = hasKey(this.value, key);
        let referred = {};

        if (existed) {
            if (newVal instanceof Object) {
                referred = newVal instanceof Array ? [] : {};
                this.react.observe(referred, newVal);
                this.value[key] = referred;
            } else {
                this.value[key] = newVal;
            }
        } else {
            referred[key] = newVal;
            this.react.observeObj(this.value, referred, key, this);
            this.dep.notify();
            this.react.recall && this.react.recall();
        }
    }
    destroy(prop, refresh) {
        let ob, dep;

        if (arguments.length > 0) { // if prop argument has been settled, destroy sub values which is belong to prop
            ob = isObservered(this.value[prop]) && this.value[prop].__ob__;
            dep = ob ? ob.dep : false;
            delete this.value[prop];
            if (this.value instanceof Array) {
                this.value.length -= 1;
            }
        } else {
            ob = this;
            dep = ob.dep;
        }

        if (ob) {
            // loop value's sub values to delete them and lunch destroy command discretely.
            Object.keys(ob.value).forEach(val => {
                let ob = val.__ob__;
                if (isObservered(val)) {
                    ob.destroy();
                    ob.value[prop] = null;
                }
            });

            // erase all watchers
            dep.subs.forEach(watcher => watcher.unwatch());
        }

        if (refresh === true) {
            this.react.recall && this.react.recall();
        }
    }
}

class observerArray extends observer {
    constructor(target, rawVal, react) {
        super(target, rawVal, react);
    }
    update(key, newVal) {
        let existed = hasKey(this.value, key);
        let referred = [];
        let oldVal = this.value[key];
        referred[key] = newVal;

        if (!isObservered(newVal)) {
            this.react.observeObj(this.value, referred, key, this);
        } else {
            this.value[key] = newVal;
        }

        if (existed) {
            injectWathcers(oldVal, newVal);
        }

        this.dep.notify();

        // if (existed && oldVal instanceof Object) {
        //
        // }

        this.react.recall && this.react.recall();
    }
}

function setPrototypeOf(obj, defaults) {
    let keys = Object.getOwnPropertyNames(defaults);

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = Object.getOwnPropertyDescriptor(defaults, key);

        if (value && value.configurable) {
            Object.defineProperty(obj, key, value);
        }
    }

    return obj;
}

function isObservered(val) {
    return (val instanceof Object || val instanceof Array) && val.__ob__ != undefined ? true : false;
}

function getobserve(val) {
    return isObservered(val) ? val.__ob__ : null;
}

function hasKey(val, key) {
    return Object.getOwnPropertyDescriptor(val, key);
}

function injectWathcers(oldVal, newVal) {
    let preOB = getobserve(oldVal);
    let nextOB = getobserve(newVal);
    if (nextOB && preOB) {
        updateWatchers(preOB.dep, nextOB.dep);
        preOB.dep.notify();
        eliminateWatchers(preOB.dep);
        let newValKeys = Object.keys(newVal);
        Object.keys(oldVal).forEach((val, key) => {
            if (isObservered(oldVal[val]) && newValKeys[key]) {
                injectWathcers(oldVal[val], newVal[newValKeys[key]]);
            }
        });
    }
}

function updateWatchers(oldDep, newDep) {
    let watchers = oldDep.subs;
    newDep.subs = newDep.subs.concat(watchers);

    watchers.forEach(watcher => {
        if (watcher != undefined) {
            // let index = watcher.deps.indexOf(oldDep);
            // watcher.deps.splice(index, 1, newDep);
            watcher.deps.push(newDep);
        }
    });
}

function eliminateWatchers(dep) {
    dep.subs.length = 0;
}

export {react, Dep};