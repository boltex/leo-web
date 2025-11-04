const path = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
            assert: require.resolve("assert"),
            buffer: require.resolve('buffer'),
            console: require.resolve('console-browserify'),
            crypto: require.resolve('crypto-browserify'),
            os: require.resolve('os-browserify/browser'),
            path: require.resolve('path-browserify'),
            process: require.resolve('process/browser'),
            url: require.resolve('url'),
            fs: false, // false: so compilation passes: WILL NOT BE USED IN WEB VERSION
            opn: false, // false: so compilation passes: WILL NOT BE USED IN WEB VERSION
        },
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: "process/browser", // provide a shim for the global `process` variable
            Buffer: ['buffer', 'Buffer'],
            // "process.hrtime": "browser-process-hrtime" // * 'hrtime' part of process only overriden in extension.ts
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            favicon: './public/favicon.ico',
            title: 'Leo Web Editor',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'public',
                    to: '',
                    globOptions: {
                        ignore: ['**/favicon.ico'] // Skip favicon.ico since HtmlWebpackPlugin handles it
                    }
                }
            ]
        })
    ],
    devServer: {
        static: './dist',
        hot: true,
        open: true,
    },
};