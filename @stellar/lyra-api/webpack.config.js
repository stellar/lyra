const webpack = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const path = require("path");

const BUILD_PATH = path.resolve(__dirname, "./build");

const config = {
  mode: "production",
  entry: {
    index: path.resolve(__dirname, "./src/index.ts"),
  },
  output: {
    globalObject: "this",
    library: "lyra-api",
    libraryTarget: "umd",
    path: BUILD_PATH,
    filename: "[name].min.js",
  },
  resolve: {
    extensions: [".ts"],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, "./tsconfig.json"),
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: ["ts-loader"],
      },
    ],
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, "../../node_modules")],
  },
  plugins: [
    new webpack.DefinePlugin({
      DEVELOPMENT: false,
    }),
  ],
  // This module is super simple, so we don't need much information about what
  // build. Turn most of it off to keep output focused.
  stats: {
    // minimal
    // can use `preset: "minimal"` once webpack 5 lands
    all: false,
    modules: true,
    maxModules: 0,
    errors: true,
    warnings: true,
    // our additional options
    moduleTrace: true,
    errorDetails: true,
    hash: true,
    timings: true,
  },
};

module.exports = config;
