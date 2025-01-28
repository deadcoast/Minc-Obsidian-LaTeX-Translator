const path = require('path');
const builtins = require('builtin-modules');

module.exports = {
    entry: './main.ts',
    output: {
        filename: 'main.js',
        path: __dirname,
        libraryTarget: 'commonjs'
    },
    target: 'node',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    externals: {
        obsidian: 'commonjs2 obsidian',
        electron: 'commonjs2 electron',
        '@codemirror/autocomplete': 'commonjs2 @codemirror/autocomplete',
        '@codemirror/collab': 'commonjs2 @codemirror/collab',
        '@codemirror/commands': 'commonjs2 @codemirror/commands',
        '@codemirror/language': 'commonjs2 @codemirror/language',
        '@codemirror/lint': 'commonjs2 @codemirror/lint',
        '@codemirror/search': 'commonjs2 @codemirror/search',
        '@codemirror/state': 'commonjs2 @codemirror/state',
        '@codemirror/view': 'commonjs2 @codemirror/view',
        '@lezer/common': 'commonjs2 @lezer/common',
        '@lezer/highlight': 'commonjs2 @lezer/highlight',
        '@lezer/lr': 'commonjs2 @lezer/lr',
        ...builtins.reduce((acc, mod) => ({...acc, [mod]: 'commonjs2 ' + mod}), {})
    }
};