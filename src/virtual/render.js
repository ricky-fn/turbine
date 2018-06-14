function render(domTree, parentNode) {
    let fragment = parentNode || document.createDocumentFragment();

    if (!isArray(domTree)) {
        domTree = [domTree];
    }

    combine(domTree, fragment);

    return fragment;
}

function combine(domTree, fragment) {
    domTree.forEach((vNode, index) => {
        let el;
        if (!vNode.isReady || vNode.isDirty) {
            if (vNode.type == "element") {
                el = creatByTag(fragment, vNode, vNode.isDirty);

                vNode.ready(el);

                combine(vNode.children, el);
            } else {
                if (vNode.type == "text") {
                    el = creatByText(fragment, vNode, vNode.isDirty);
                } else if (vNode.type == "comment") {
                    el = creatByCommon(fragment, vNode, vNode.isDirty);
                }
                vNode.ready(el);
            }
        } else if (vNode.type === "element" && vNode.children.length > 0 && vNode.el.type != "text") {
            combine(vNode.children, (() => {
                let isForm = fragment.nodeName === "FORM";
                if (!isForm && fragment[index]) {
                    return fragment[index];
                } else {
                    return fragment.childNodes[index];
                }
            })());
        }
    });
}

function creatByCommon(fragment, vNode, replace) {
    let common = document.createComment(vNode.content);
    if (replace === true) {
        fragment.replaceChild(common, fragment.childNodes[vNode.index]);
    } else {
        insertNode(common, vNode, fragment);
    }

    return common;
}

function creatByText(fragment, vNode, replace) {
    let text = document.createTextNode(vNode.content);
    if (replace === true) {
        fragment.replaceChild(text, fragment.childNodes[vNode.index]);
    } else {
        insertNode(text, vNode, fragment);
    }

    return text;
}

function creatByTag(fragment, vNode, replace) {
    let tagName = vNode.tagName == "turbine" ? "div" : vNode.tagName;
    let dom = document.createElement(tagName);

    if (replace === true) {
        fragment.replaceChild(setAttribs(dom, vNode.attributes), fragment.childNodes[vNode.index]);
    } else {
        insertNode(setAttribs(dom, vNode.attributes), vNode, fragment);
    }

    return dom;
}

function setAttribs(dom, attribs) {
    attribs.forEach(attr => {
        dom.setAttribute(attr.key, attr.value);
    });

    return dom;
}

function insertNode(node, vNode, fragment) {

    if (fragment.childNodes.hasOwnProperty(vNode.index)) {
        fragment.insertBefore(node, fragment.childNodes[vNode.index]);
    } else {
        fragment.appendChild(node);
    }
}

function isArray(o){
    return Object.prototype.toString.call(o) == "[object Array]";
}

export default render;