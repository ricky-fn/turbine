import {Dep} from "./observe";
import evalWithContext from "../util/eval";

class watch {
    constructor(vm, name, option) {
        let type = typeof option;
        let handler, immediate, deep;
        if (type === "function") {
            handler = option;
            deep = false;
        } else if (type === "object") {
            handler = option.handler;
            immediate = option.immediate;
            deep = option.deep || false;
        }

        Dep.target = this;
        this.deps = [];
        this.name = name;
        this.vm = vm;
        this.value = this.get();
        this.handler = handler;
        this.deep = deep;
        this.immediate = immediate;
        Dep.target = null;
        if (deep === true) {
            loopVal.call(this, this.value);
        }

        if (immediate) {
            this.update();
        }
    }
    update(newVals) {
        let oldVal = this.value;
        let newVal = this.get();
        this.value = newVal;

        if (this.immediate) {
            this.handler.call(this.vm, newVal, oldVal);
            return this.immediate = false;
        }

        if (this.deep && !this.immediate && newVals != undefined) {
            loopVal.call(this, newVals);
        }

        if (oldVal !== newVal || oldVal instanceof Object) {
            this.handler.call(this.vm, newVal, oldVal);
        }
    }
    get() {
        return evalWithContext(this.name, this.vm);
    }
    unwatch() {
        this.deps.forEach(dep => {
            let index = dep.subs.indexOf(this);
            dep.subs.splice(index, 1, undefined);
        });
        this.deps.length = 0;
        this.vm = null;
        this.node = null;
        this.recall = null;
        this.dep = null;
        this.value = null;
    }
}

function loopVal(val) {
    let resource;
    if (val instanceof Array) {
        resource = val;
    } else if (val instanceof Object) {
        resource = Object.keys(val);
    } else {
        Dep.target = this;
        val;
        Dep.target = null;
        return;
    }
    resource.forEach((sval, key) => {
        let isArray = val instanceof Array;
        Dep.target = this;
        isArray ? val[key] : val[sval];
        Dep.target = null;

        if (sval instanceof Object) {
            loopVal.call(this, sval);
        }
    });
}

export default watch;