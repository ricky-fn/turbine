class vNode {
    constructor(json) {
        this.type = json.type;
        this.el = null;
        this.oberver = [];
        this.watchers = [];
        this.directives = [];
        this.key = json.key;
        this.isReady = false;
        this.display = true;
        this.parse = false;
        this.index = null;
        this.data = {};
        this._if = null;

        if (json.type === "element") {
            this.children = json.children;
            this.isComponent = false;
            this.attributes = json.attributes;
            this.context = null;
            this.tagName = json.tagName;
            this.reference = json;
        } else {
            this.content = json.content;
        }
    }
    inserted(fn) {
        this.oberver.push(fn);
    }
    ready(el) {
        this.el = el;
        this.isDirty = false;

        if (this.directives.length > 0 && !this.isReady) {
            this.directives.forEach(dir => {
                if (dir.bind) {
                    dir.bind(this.el, dir.binding, this);
                } else if (dir.update) {
                    dir.update(this.el, dir.binding, this);
                }
            });
        }

        this.isReady = true;
        this.oberver.forEach(fn => fn.call(this, el));
        this.oberver.length = 0;

    }
    remove() {
        if (this.isReady === false) {
            return;
        }

        if (this.directives) {

            this.directives.forEach(obj => {
                obj.unbind && obj.unbind(this.el, obj.binding, this);
            });
            this.directives.length = 0;
        }

        this.watchers.forEach(watcher => watcher.unwatch());

        if (this.isComponent) {
            this.data.component._destroy();
        } else {
            if (this.type == "element") {
                this.children.forEach(node => {
                    if (node instanceof vNode) {
                        node.remove();
                    }
                });
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

        this.oberver = null;
        this.el = null;
        this.context = null;
        this.children = null;
        this.attributes = null;
        this.directives = null;
        this.component = null;
        this.reference = null;
        this.data = null;
        this.watchers = null;
    }
}

export default vNode;