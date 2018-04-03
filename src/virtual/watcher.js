import {Dep} from "./observe"
import evalWithContext from "../util/eval"
import {stringify} from "himalaya"

class watch {
    constructor(vm, vNode, name, recall) {
        Dep.target = this;
        this.name = name;
        this.vm = vm;
        this.node = vNode;
        this.recall = recall;
        this.update();
        this.dep = null;
        Dep.target = null;
    }
    update() {
        let oldVal = this.value;
        let newVal = this.get();
        this.recall(oldVal, newVal);
    }
    get() {
        try {
            this.value = evalWithContext(this.name, this.vm);
        } catch(err) {
            let str = stringify([this.node.reference]);
            console.error(err + '\n\n', 'please check your template: \n' + str);
        }
        return this.value;
    }
    unwatch() {
        let index = this.dep.subs.indexOf(this);
        this.dep.subs.splice(index, 1);
        this.vm = null;
        this.node = null;
        this.recall = null;
    }
}

export default watch;