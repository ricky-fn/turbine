import {parse} from "himalaya";

function renderJsonTree(template) {
    let json = parse(template);

    return loopDomTree(json);
}

function loopDomTree(tree) {
    let keys = [];
    tree.forEach(el => {
        let key;

        do {
            key = createHexRandom();
        } while (keys.indexOf(key) >= 0);

        keys.push(key);
        el.key = key;

        if (el.type === "element" && el.children.length > 0) {
            loopDomTree(el.children);
        }
    });
    return tree;
}

function createHexRandom(){
    let num = Math.floor(Math.random() * 1000000);
    num = num.toString(16);
    return num;
}

export default renderJsonTree;