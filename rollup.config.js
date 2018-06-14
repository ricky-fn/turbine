import babel from "rollup-plugin-babel";
import eslint from "rollup-plugin-eslint";
import uglify from "rollup-plugin-uglify";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from 'rollup-plugin-commonjs';
import strip from "rollup-plugin-strip";

export default [
    {
        input: './src/main.js',
        output: {
            name: "turbine",
            file: "./dist/turbine.js",
            format: 'iife',
            sourceMap: 'inline',
        },
        plugins: [
            eslint(),
            babel({
                exclude: "node_modules/**"
            }),
            nodeResolve({
                jsnext: true,
                main: true
            }),
            commonjs({
                include: 'node_modules/**',
            })
        ]
    },
    {
        input: './src/main.js',
        output: {
            name: "turbine",
            file: "./dist/turbine.min.js",
            format: 'iife',
            sourceMap: 'inline',
        },
        plugins: [
            eslint(),
            uglify(),
            strip({
                debugger: false
            }),
            babel({
                exclude: "node_modules/**"
            }),
            nodeResolve({
                jsnext: true,
                main: true
            }),
            commonjs({
                include: 'node_modules/**',
            })
        ]
    },
];