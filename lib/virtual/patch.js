"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _diff = require("./diff");

var _diff2 = _interopRequireDefault(_diff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function patch(oldGroup, newGroup) {
    // let oldKeys = {};
    // let newKeys = {};
    var oldKeys = [];
    var newKeys = [];
    var okeyMap = {};
    var nkeyMap = {};

    oldGroup.forEach(function (el) {
        var key = el.key;
        if (key !== undefined) {
            okeyMap[key] = el;
            oldKeys.push(key);
        }
    });
    newGroup.forEach(function (el) {
        var key = el.key;
        if (key !== undefined) {
            nkeyMap[key] = el;
            newKeys.push(key);
        }
    });

    var patches = (0, _diff2.default)(oldKeys, newKeys); //两个object的顺序不一定是按照真实的顺序排列

    var restKeys = newKeys.concat();

    if (patches.length > 0) {
        patches.forEach(function (cp) {
            var index = restKeys.indexOf(cp.target),
                oldNode = okeyMap[cp.target],
                newNode = nkeyMap[cp.target];

            if (index >= 0) {
                restKeys.splice(index, 1);
            }

            cp.target = { oldNode: oldNode, newNode: newNode };
        });
    }

    // restKeys.forEach(key => {
    //     let oldNode = okeyMap[key];
    //     let newNode = nkeyMap[key];
    //
    //     newNode.el = oldNode.el;
    // });

    return {
        getPatches: function getPatches() {
            return patches;
        },
        getRestEl: function getRestEl() {
            var array = [];
            restKeys.forEach(function (key) {
                array.push({
                    oldNode: okeyMap[key],
                    newNode: nkeyMap[key]
                });
            });
            return array;
        }
    };
}

exports.default = patch;