import path from "path";
import { fileURLToPath } from "url";
import nodeExternals from "webpack-node-externals";
import Dotenv from "dotenv-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === "production";
  
  return {
    target: "node",
    entry: "./src/index.ts",

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
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
                module: "commonjs",
                noEmitOnError: !argv.watch
              }
            }
          }
        }
      ]
    },

    plugins: [
      new Dotenv({
        path: isProduction ? "./.env.production" : "./.env.development",
        systemvars: true 
      })
    ],

    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src")
      },
      extensionAlias: {
        ".js": [".ts", ".js"]
      }
    },

    optimization: {
      minimize: isProduction,
      moduleIds: "deterministic"
    },

    devtool: isProduction ? "source-map" : "eval-cheap-module-source-map",

    node: {
      __dirname: false,
      __filename: false,
      global: false
    },

    watch: argv.watch,
    watchOptions: {
      ignored: ["**/node_modules", "**/dist"],
      aggregateTimeout: 600,
      poll: 1000,
      followSymlinks: false
    },

    stats: {
      warningsFilter: /export .* was not found in/ 
    }
  };
};
