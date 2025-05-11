import path from "path";
import { fileURLToPath } from "url";
import nodeExternals from "webpack-node-externals";
import Dotenv from "dotenv-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (argv) => {
  const isProduction = argv.mode === "production";
  const isWatching = argv.watch;

  return {
    target: "node",
    entry: "./src/index.ts",

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "index.[contenthash].js" : "index.js",
      libraryTarget: "commonjs2",
    },

    externals: [nodeExternals()],

    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: "esnext",
              },
            },
          },
        },
      ],
    },

    plugins: [
      new Dotenv({
        path: isProduction ? "./.env.production" : "./.env.development",
      }),
    ],

    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    optimization: {
      minimize: isProduction,
    },

    devtool: isProduction ? "source-map" : "eval-source-map",

    node: {
      __dirname: false,
      __filename: false,
      global: false,
    },
    watch: isWatching,
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    },
  };
};
