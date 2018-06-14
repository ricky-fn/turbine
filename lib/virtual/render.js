"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function render(domTree) {
    var fragment = document.createDocumentFragment();

    if (!isArray(domTree)) {
        domTree = [domTree];
    }

    combine(domTree, fragment);

    return fragment;
}

function combine(domTree, fragment) {
    domTree.forEach(function (vNode) {
        var el = void 0;
        if (vNode.type == "element") {
            // if (vNode.tagName === "span") {
            //     debugger;
            // }
            el = creatByTag(fragment, vNode);
            vNode.ready(el);

            combine(vNode.children, el);
        } else {
            if (vNode.type == "text") {
                el = creatByText(fragment, vNode);
            } else if (vNode.type == "comment") {
                el = creatByCommon(fragment, vNode);
            }
            vNode.ready && vNode.ready(el);
        }
    });
}

function creatByCommon(fragment, vNode) {
    var common = document.createComment(vNode.content);
    fragment.appendChild(common);

    return common;
}

function creatByText(fragment, vNode) {
    var text = document.createTextNode(vNode.content);
    fragment.appendChild(text);

    return text;
}

function creatByTag(fragment, vNode) {
    var dom = document.createElement(vNode.tagName);

    fragment.appendChild(setAttribs(dom, vNode.attributes.concat({ key: "data-key", value: vNode.key })));

    return dom;
}

function setAttribs(dom, attribs) {
    attribs.forEach(function (attr) {
        dom.setAttribute(attr.key, attr.value);
    });

    return dom;
}

function isArray(o) {
    return Object.prototype.toString.call(o) == '[object Array]';
}

exports.default = render;