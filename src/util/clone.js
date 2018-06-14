import vNode from "../virtual/vNode";

let types = [ Number, String, Boolean ];

function clone(item, isDeep) {
    if (!item) { return item; } // null, undefined values check
    isDeep = arguments.length == 1 ? true : isDeep;
    let result;
    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function(type) {
        if (item instanceof type) {
            result = type( item );
        }
    });
    if (typeof result == "undefined") {
        if (Object.prototype.toString.call( item ) === "[object Array]") {
            result = [];
            let isRoot = false;
            item.forEach(function(child) {
                if (!isRoot) {
                    if (child.tagName === "turbine") {
                        isRoot = true;
                        result.length = 0;
                    }
                    if (child.type === "comment") {
                        return;
                    }
                    result.push(clone(child, isDeep));
                }
            });
        } else if (typeof item == "object") {
            result = isNode(item) ? (new vNode(item)): {};

            for (var i in item) {
                result[i] = !isDeep && i === "children" ? [] : clone(item[i], isDeep);
            }
        } else {
            result = item;
        }
    }

    return result;
}

function isNode(obj) {
    return obj.type == "element" || obj.type == "text";
}

export default clone;