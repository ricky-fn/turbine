import turbine from "../main";

let C;

export default function initComponent(config) {
    if (C) {
        return new C(config);
    }

    C = class component extends turbine.prototype._init {
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
                    let prop = ArrayFind(vNode.attributes, attr => attr.key === propName);
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
                $parent: vNode.context,
                slots: getSlots(vNode)
            });
            super(newProps);

            vNode.data.component = this;
            vNode.el = this.$el;
            vNode.tagName = this.$el.tagName.toLowerCase();
        }
    };

    return new C(config);
}



function getSlots(vNode) {
    let slots = {};
    vNode.children.forEach(child => {
        let isElement = child.type == "element";
        let slot = isElement && ArrayFind(child.attributes, el => el.key == "slot");
        if (slot) {
            slots[slot.value] = child;
        } else if (isElement) {
            slots["default"] = slots["default"] instanceof Array ? slots["default"].concat(child) : [child];
        }
    });
    return slots;
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

// export default component;