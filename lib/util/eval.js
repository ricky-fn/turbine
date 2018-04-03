'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = evalWithContext;
function evalWithContext(content, context) {
    content = content.replace(/&amp;/g, '&');
    return new Function('with(this){return ' + content + '}').call(context);
}