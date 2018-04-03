import turbine from "../main"

class component extends turbine.prototype._init {
    constructor(config) {
        let {data, props, vNode} = config;
        let usedData = {};

        if (typeof data === "function") {
            usedData = data();
        } else if (data != undefined) {
            return console.warn("data has required as a function, please change your component's data structure");
        }

        if (props != undefined && props instanceof Array) {
            props.forEach(propName => {
                let prop = vNode.attributes.find(attr => attr.key === propName);
                if (prop == null) {
                    return console.warn("cannot find prop name on element's attributes.\nprop name: " + propName);
                }
                usedData[propName] = prop.value;
            });
            delete config.prop;
        }

        let newProps = Object.assign({}, config, {
            data: usedData,
            _isComponent: true,
            $parent: vNode.context
        });

        super(newProps);

        vNode.component = this;
        vNode.el = this.$el;
        vNode.tagName = this.$el.tagName.toLowerCase();
    }
}

export default component;