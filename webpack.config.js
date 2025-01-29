const path = require('path');
const builtins = require('builtin-modules');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './main.ts',
    output: {
        filename: 'main.js',
        path: __dirname,
        libraryTarget: 'commonjs',
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
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@core': path.resolve(__dirname, 'src/core'),
            '@ui': path.resolve(__dirname, 'src/ui'),
            '@components': path.resolve(__dirname, 'src/ui/components'),
            '@views': path.resolve(__dirname, 'src/ui/views'),
            '@hooks': path.resolve(__dirname, 'src/ui/hooks'),
            '@styles': path.resolve(__dirname, 'src/ui/styles'),
            '@utils': path.resolve(__dirname, 'src/utils')
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { 
                    from: 'src/ui/styles/global.css',
                    to: 'styles.css'
                }
            ]
        })
    ],
    externals: {
        obsidian: 'commonjs obsidian',
        '@codemirror/state': 'commonjs @codemirror/state',
        '@codemirror/view': 'commonjs @codemirror/view',
        '@codemirror/language': 'commonjs @codemirror/language',
        '@codemirror/commands': 'commonjs @codemirror/commands',
        '@codemirror/search': 'commonjs @codemirror/search',
        '@codemirror/lang-markdown': 'commonjs @codemirror/lang-markdown',
        '@codemirror/lang-html': 'commonjs @codemirror/lang-html',
        '@lezer/common': 'commonjs @lezer/common',
        '@lezer/highlight': 'commonjs @lezer/highlight',
        '@lezer/lr': 'commonjs @lezer/lr',
        electron: 'commonjs electron',
        ...builtins.reduce((acc, mod) => ({...acc, [mod]: 'commonjs ' + mod}), {})
    }
};