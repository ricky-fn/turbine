/**
 * Created by Ricky on 2017/9/22.
 */

class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub);
    }
    notify() {
        let args = Array.prototype.slice.call(arguments, 1);
        this.subs.forEach(sub => {
            if (sub != undefined) {
                sub.update(args[0], args[1]);
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
        if (type == '[object Object]' || type == '[object Array]') {
            if (_res.__ob__) {
               ob =  _res.__ob__;
            } else if (_obj.__ob__) {
                ob = _obj.__ob__;
            } else {
                ob = new observer(_obj, this);
            }

            this.loopObj(_obj, _res, ob);
            if (type == '[object Array]') {
                this.cloneArray(_obj, ob);
            }
        }
    }
    loopObj(obj, res, observer) {
        Object.keys(res).forEach((prop) => {
            this.observeObj(obj, res, prop, observer); // observe and set value to reactive data
        });
        // if (isObservered(obj)) {
        //     let keys = Object.keys(obj);
        //     keys.forEach((prop, index) => { // loop the reactive data to find deleted subValues
        //         prop = keys[keys.length - index - 1]; // loop props and start it at the end, avoid error happen after deleting Array sub value
        //         if (!res.hasOwnProperty(prop)) {
        //             observer.destroy(prop); // destroy the observer of discarded subValue
        //         }
        //     })
        // }
    }
    observeObj(obj, res, prop, observer) {
        let dep = res instanceof Array ? observer.dep : new Dep();
        let rawVal = res[prop];
        let _des = Object.getOwnPropertyDescriptor(obj, prop);

        // if resource is an Array and reactive Object has not such prop exist it will be initialized as resource's data type
        if (res instanceof Array && !obj.hasOwnProperty(prop)) {
            obj[prop] = new rawVal.__proto__.constructor();
        }

        if ((_des == undefined || _des.hasOwnProperty("value"))) {
            if (!(res instanceof Array)) { // define value's subValue which value is an Object
                Object.defineProperty(obj, prop, {
                    get: () => {
                        let watcher = Dep.target;
                        if (watcher) { // Dep target would be triggered by watcher module
                            dep.addSub(watcher); // push watcher Object into the dep
                            watcher.dep = dep;
                        }

                        return rawVal;
                    },
                    set: (newVal) => {
                        if (newVal === rawVal) {
                            return;
                        }

                        rawVal = observer.update(prop, newVal, this); // update values

                        dep.notify(rawVal, newVal); // notify watchers that value has been updated

                        this.recall && this.recall(rawVal); // call the public recall
                    },
                    enumerable: true,
                    configurable: true
                });
            } else if (obj[prop] != rawVal && typeof obj[prop] != "object") { // update value when present is unequal to newVal and present val is not an Object or Array, if it is an Object and Array let program to compare these two value's subValues;
                obj[prop] = rawVal;
            }
        } else if (obj[prop] != rawVal) { // if the reactive Object's subValue is unequal to resource's subValue,
            obj[prop] = observer.update(prop, rawVal, this);
        }

        observer.value = obj; // update the observer's value this will impact the real data structure
        this.observe(obj[prop], res[prop]); // loop subValues
    }
    cloneArray(array, observer) {
        let ORP = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
        let arrayProto = Array.prototype;
        let newProto = Object.create(arrayProto);
        let self = this;

        ORP.forEach(function (prop) {
            Object.defineProperty(newProto, prop, {
                value: function (newVal) {
                    arrayProto[prop].apply(observer.value, arguments);
                    observer.update(self);
                    self.recall && self.recall(newVal);
                },
                enumerable: false,
                configurable: true,
                writable: true
            });
        });
        array.__proto__ = newProto;
    }
}

class observer {
    constructor(target, react) {
        this.dep = new Dep();
        this.value = new target.__proto__.constructor();
        this.react = react;

        Object.defineProperty(target, "__ob__", {
            enumerable: false,
            value: this
        });
    }
    update(key, newVal, refresh) {
        let val = this.value[key];
        let ob, subs;

        if (val != undefined && isObservered(val)) {
            ob = val.__ob__;
            subs = ob.dep.subs;
            if (isObservered(newVal)) { // if the new value has been observed
                let newOb_dep = newVal.__ob__.dep;
                subs.forEach(watcher => newOb_dep.addSub(watcher)); // update new value's watchers
                val = newVal;
            } else {
                this.react.observe(val, newVal); // if new value has not observed yet set it into next loop
            }
        } else {
            if (val == undefined) {
                let data = new this.value.__proto__.constructor();
                data[key] = newVal;
                this.react.observe(this.value, data);
                if (refresh === true) {
                    this.react.recall && this.react.recall();
                }
            }
            val = newVal; // if reactive data is not observed and newVal is observed, update new value directly
        }

        return val;
    }
    destroy(prop) {
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
                delete ob.value[prop];
                if (isObservered(val)) {
                    ob.destroy();
                }
            });

            // erase all watchers
            dep.subs.forEach(watcher => watcher.unwatch());
        }
    }
}

function isObservered(val) {
    return (val instanceof Object || val instanceof Array) && val.__ob__ != undefined ? true : false;
}

export {react, Dep};