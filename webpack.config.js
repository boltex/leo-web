const path = require('path');
const webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProd = argv?.mode === 'production' || process.env.NODE_ENV === 'production';
    console.log('isProd', isProd);

    const webConfig = /** @type WebpackConfig */ {
        context: __dirname,
        mode: isProd ? 'production' : 'development',
        target: "web", // "webworker" removes access to window, document, DOM APIs but "web" enables correct chunk loading, globals, etc.
        entry: './src/index.ts',
        output: {
            filename: isProd ? 'bundle.[contenthash].js' : 'bundle.js',
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
            extensions: [".ts", ".js", ".json"], // support ts-files and js-files
            alias: {
                // Point explicitly to TypeScript's library file; services variant not present in TS 5.x
                typescript: require.resolve('typescript/lib/typescript.js'),
            },
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
                fs: false, // Explicitly disable fs in browser builds
                // opn: false, // false: so compilation passes: WILL NOT BE USED IN WEB VERSION
                vm: false, // These code paths will never execute in the browser anyway.
                perf_hooks: false, // These code paths will never execute in the browser anyway.
            },
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
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
            new WebpackShellPluginNext({
                onBuildStart: {
                    scripts: ['echo "Webpack onBuildStart"', 'node ./prepare.js'],
                    blocking: true,
                    parallel: false
                },
                onWatchRun: {
                    scripts: ['echo "Webpack onWatchRun"', 'node ./prepare.js'],
                    blocking: true,
                    parallel: false
                }
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
        ignoreWarnings: [/request of a dependency is an expression/],
        performance: {
            hints: false,
        },

        /**
         * Source map strategy:
         * - Development: "eval-cheap-module-source-map"
         *   Fast rebuilds, eval-wrapped modules, line-only mappings; good DX with TS.
         *
         * - Production options:
         *   - "hidden-source-map": emits external .map but no sourceMappingURL in the bundle.
         *     Browsers won’t auto-fetch, maps stay in dist for tooling (e.g., Sentry uploads).
         *   - "nosources-source-map": external maps with filenames/lines only (no source content).
         *     Safer to ship, still useful for stack traces.
         *   - "source-map": full external maps including sources; best debugging, largest files,
         *     exposes source if deployed.
         *   - false: no source maps at all; smallest output, no debugging mapping.
         *
         * Notes:
         * - Webpack controls map emission regardless of tsconfig "sourceMap".
         * - If you don’t want to publish maps, place them in a subfolder via output.sourceMapFilename
         *   and exclude that folder from deployment.
         */
        devtool: isProd ? "hidden-source-map" : "eval-cheap-module-source-map",

        infrastructureLogging: {
            level: "log", // enables logging required for problem matchers
        },
        devServer: {
            static: './dist',
            hot: true,
        },
    };
    return [webConfig];
};