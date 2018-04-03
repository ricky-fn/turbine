"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function addKey(tree) {
    var keys = [];
    tree.forEach(function (vNode) {
        var key = void 0,
            obj = void 0;
        do {
            key = createHexRandom();
        } while (keys.indexOf(key) >= 0);

        keys.push(key);
        // if (vNode.type == "element" || vNode.type == "text") {
        //     if (vNode.attributes) {
        //         vNode.attributes.push(obj);
        //     } else {
        //         vNode.attributes = [obj];
        //     }
        // } else if (el.type == "comment") {
        //     vNode.attributes = [obj];
        // }
        vNode.key = key;

        if (vNode.children) {
            addKey(vNode.children);
        }
    });

    return tree;
}

function createHexRandom() {
    var num = Math.floor(Math.random() * 1000000);
    num = num.toString(16);
    return num;
}

exports.default = addKey;