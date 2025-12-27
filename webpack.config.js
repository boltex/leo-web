const path = require('path');
const webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');

// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const WebpackShellPluginNext = require('webpack-shell-plugin-next');

// module.exports = {
//     entry: './src/index.ts',
//     mode: 'development',
//     module: {
//         rules: [
//             {
//                 test: /\.tsx?$/,
//                 use: 'ts-loader',
//                 exclude: /node_modules/,
//             },
//             {
//                 test: /\.css$/i,
//                 use: ['style-loader', 'css-loader'],
//             },
//         ],
//     },
//     resolve: {
//         extensions: ['.tsx', '.ts', '.js'],
//         fallback: {
//             // Webpack 5 no longer polyfills Node.js core modules automatically.
//             // see https://webpack.js.org/configuration/resolve/#resolvefallback
//             // for the list of Node.js core module polyfills.
//             // ---------------------------------------------
//             buffer: require.resolve('buffer'),
//             crypto: require.resolve('crypto-browserify'),
//             os: require.resolve('os-browserify/browser'),
//             path: require.resolve('path-browserify'),
//             process: require.resolve('process/browser'),
//         },
//     },
//     output: {
//         filename: 'bundle.js',
//         path: path.resolve(__dirname, 'dist'),
//         clean: true,
//     },
//     plugins: [
//         new webpack.ProvidePlugin({
//             process: "process/browser", // provide a shim for the global `process` variable
//             Buffer: ['buffer', 'Buffer'],
//             // "process.hrtime": "browser-process-hrtime" // * 'hrtime' part of process only overriden in extension.ts
//         }),
//         new HtmlWebpackPlugin({
//             template: './src/index.html',
//             favicon: './public/favicon.ico',
//             title: 'Leo Web Editor',
//         }),
//         new CopyWebpackPlugin({
//             patterns: [
//                 {
//                     from: 'public',
//                     to: '',
//                     globOptions: {
//                         ignore: ['**/favicon.ico'] // Skip favicon.ico since HtmlWebpackPlugin handles it
//                     }
//                 }
//             ]
//         })
//     ],
//     devServer: {
//         static: './dist',
//         hot: true,
//         open: true,
//     },
// };


const webConfig = /** @type WebpackConfig */ {
    context: __dirname,
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: "web", // "webworker" removes access to window, document, DOM APIs but "web" enables correct chunk loading, globals, etc.
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, "./dist"),
        // libraryTarget: "commonjs",
    },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    // https://github.com/webpack-contrib/terser-webpack-plugin
                    mangle: false,
                    keep_classnames: true,
                    keep_fnames: true,
                },
            }),
        ],
    },
    resolve: {
        mainFields: ["browser", "module", "main"], // look for `browser` entry point in imported node modules
        extensions: [".ts", ".js"], // support ts-files and js-files
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
            assert: require.resolve("assert"),
            buffer: require.resolve('buffer'),
            // console: require.resolve('console-browserify'),
            crypto: require.resolve('crypto-browserify'),
            os: require.resolve('os-browserify/browser'),
            path: require.resolve('path-browserify'),
            process: require.resolve('process/browser'),
            url: require.resolve('url'),
            // fs: false, // false: so compilation passes: WILL NOT BE USED IN WEB VERSION
            // opn: false, // false: so compilation passes: WILL NOT BE USED IN WEB VERSION
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: "process/browser", // provide a shim for the global `process` variable
            Buffer: ['buffer', 'Buffer'],
            // "process.hrtime": "browser-process-hrtime" // * 'hrtime' part of process only overriden in extension.ts
        }),
    ],
    // externals: {
    //     vscode: "commonjs vscode", // ignored because it doesn't exist
    // },
    performance: {
        hints: false,
    },
    devtool: "nosources-source-map", // create a source map that points to the original source file
    infrastructureLogging: {
        level: "log", // enables logging required for problem matchers
    },
};

module.exports = [webConfig];
