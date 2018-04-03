class vNode {
    constructor(json) {
        this.type = null;
        this.content = null;
        this.attributes = null;
        this.el = null;
        this.oberver = [];
        this.children = [];
        this.key = null;
        this.isComponent = false;
        this.isReady = false;
        this.directives = [];
        this.component = null;
        this.reference = json;
        this.context = null;
    }
    inserted(fn) {
        this.oberver.push(fn);
    }
    ready(el) {
        this.el = el;
        this.isReady = true;

        this.directives.forEach(dir => {

            if (dir.bind) {
                dir.bind(this.el, dir.binding, this);
            } else if (dir.update) {
                dir.update(this.el, dir.binding, this);
            }
        });

        this.oberver.forEach(fn => fn.call(this, el));
    }
    remove() {
        this.directives.forEach(obj => obj.unbind && obj.unbind(this.el, obj.binding, this));

        if (this.isComponent) {
            this.component._destroy();
        } else {
            this.children.forEach(vNode => {
                vNode.remove();
            });
            this.el.parentNode.removeChild(this.el);
        }
        this.oberver = [];
        this.el = null;
        this.reference = null;
        this.context = null;
        this.children = null;
    }
}

export default vNode;