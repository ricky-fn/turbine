"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var diff = function diff(array1, array2) {
    var moves = [];

    if (array1.length != 0 && array2.length != 0) {
        // if array1 or array2 is empty, that means in this dom tree was empty or going to set empty
        var matrix = [];
        var length = generateMatrix(array1, array2, matrix);

        var subArray = [];
        for (var i = 0; i <= array1.length; i++) {
            subArray.push(i);
        }
        for (var _i = 1; _i <= array2.length; _i++) {
            matrix[_i - 1].unshift(_i);
        }
        matrix.unshift(subArray);
        findMoves(array1, array2, moves, matrix, length);
    } else {
        var method = void 0,
            source = void 0,
            index = void 0;
        if (array1.length == 0) {
            // if old tree was empty that means it needs to copy elements from new tree
            method = "add";
            source = array2;
        } else {
            // else new tree was empty and it needs to delete all element from old tree
            method = "delete";
            source = array1;
        }
        source.forEach(function (key) {
            index = source.length - source.indexOf(key) - 1;
            if (method == "add") {
                index = source.indexOf(key);
            }
            moves.push({
                method: method,
                index: index,
                target: key
            });
        });
    }

    return moves;
};

var generateMatrix = function generateMatrix(cols, rows, matrix, rinx, cinx) {
    if (rinx == undefined && cinx == undefined) {
        rinx = cinx = 0;
    }
    var row = matrix[cinx];
    if (row == undefined) {
        row = matrix[cinx] = [];
    } else {
        row = matrix[cinx];
    }

    var rowVal = rows[cinx];
    var colVal = cols[rinx];
    var prevRow = matrix[cinx - 1];

    var prevVal = row !== undefined && row.length > 0 ? row[rinx - 1] : cinx + rinx + 1;
    var topVal = prevRow !== undefined ? prevRow[rinx] : rinx + 1;
    var upVal = prevRow !== undefined ? function () {
        return prevRow[rinx - 1] == undefined ? cinx : prevRow[rinx - 1];
    }() : rinx;

    if (rowVal == colVal) {
        row.push(upVal);
    } else {
        row.push(Math.min(topVal, prevVal, upVal) + 1);
    }

    if (rinx == cols.length - 1) {
        rinx = 0;
        cinx += 1;

        if (cinx == rows.length) {
            return row[cols.length - 1];
        }
    } else {
        rinx += 1;
    }

    return generateMatrix(cols, rows, matrix, rinx, cinx);
};

var findMoves = function findMoves(cols, rows, moves, matrix, length) {
    var coordinate = {
        row: rows.length,
        col: cols.length
    };

    while (moves.length < length) {
        var preVal = void 0,
            upVal = void 0,
            topVal = void 0,
            rowVal = void 0,
            colVal = void 0,
            minVal = void 0;

        if (coordinate.col == 0) {
            rowVal = rows[coordinate.row - 1];
            moves.push({
                method: "add",
                index: cols.indexOf(colVal),
                target: rowVal
            });
            coordinate.row -= 1;
            continue;
        } else if (coordinate.row == 0) {
            colVal = cols[coordinate.col - 1];
            moves.push({
                method: "delete",
                index: cols.indexOf(colVal),
                target: colVal
            });
            coordinate.col -= 1;
            continue;
        }

        preVal = matrix[coordinate.row][coordinate.col - 1];
        upVal = matrix[coordinate.row - 1][coordinate.col - 1];
        topVal = matrix[coordinate.row - 1][coordinate.col];
        rowVal = rows[coordinate.row - 1];
        colVal = cols[coordinate.col - 1];

        if (rowVal == colVal) {
            coordinate.row -= 1;
            coordinate.col -= 1;
        } else {
            minVal = Math.min(preVal, upVal, topVal);
            if (minVal == topVal) {
                moves.push({
                    method: "add",
                    index: cols.indexOf(colVal),
                    target: rowVal
                });
                coordinate.row -= 1;
            } else if (minVal == upVal) {
                moves.push({
                    method: "replace",
                    index: cols.indexOf(colVal),
                    target: rowVal
                });
                coordinate.row -= 1;
                coordinate.col -= 1;
            } else if (minVal == preVal) {
                moves.push({
                    method: "delete",
                    index: cols.indexOf(colVal),
                    target: colVal
                });
                coordinate.col -= 1;
            }
        }
    }
};

exports.default = diff;