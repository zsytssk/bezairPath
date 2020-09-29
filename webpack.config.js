"use strict";
const path = require("path");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const findParam = require("./script/findEnv");

const ENV = findParam("ENV");
const CheckError = findParam("CheckError");
const common_config = (mode) => ({
  mode,
  entry: ["./src/main.tsx"],
  output: {
    filename: "js/bundle.js",
    path: path.join(__dirname, "bin"),
  },
  resolve: {
    modules: [
      path.resolve("./node_modules"),
      path.resolve("./library"),
      path.resolve("./libs"),
      path.resolve("./src"),
    ],
    extensions: [".tsx", ".ts", ".js", ".json"],
  },
  module: {
    rules: [
      {
        test: /(.tsx|.ts|.jsx|.js)$/,
        use: [
          {
            loader: "thread-loader",
          },
          {
            loader: "ts-loader",
            options: {
              happyPackMode: true,
            },
          },
        ],
      },
      {
        test: /(\.glsl|.fs|.vs)$/,
        loader: "webpack-glsl-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      ENV: JSON.stringify(ENV),
      CDN_VERSION: JSON.stringify(Date.now()),
    }),
    new WebpackBar({ color: "green" }),
    new HtmlWebpackPlugin({
      inject: mode === "development",
      title: "HonorMe",
      template: "public/index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: __dirname + "/public",
          to: __dirname + "/bin",
          globOptions: {
            ignore: ["/public/index.html"],
          },
        },
      ],
    }),
  ],
});

if (CheckError) {
  common_config.module.rules[0].use = {
    loader: "ts-loader",
  };
}

const dev_config = {
  devtool: "source-map",
  stats: {
    warnings: false,
  },
  watch: ENV === "DEV" ? true : false,
  devServer: {
    clientLogLevel: "silent",
    host: "0.0.0.0",
    contentBase: path.join(__dirname, "bin"),
    disableHostCheck: true,
    port: 3000,
    open: true,
    openPage: "http://localhost:3000",
  },
};

const prod_config = {
  entry: ["./src/main.tsx"],
};

module.exports = (env, argv) => {
  let result;
  let common = common_config(argv.mode);

  if (argv.mode === "development") {
    result = { ...common, ...dev_config };
  } else {
    common.module.rules[0].use.splice(1, 0, {
      loader: "babel-loader",
    });
    result = { ...common, ...prod_config };
  }
  return result;
};
