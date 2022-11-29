import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { globbySync } from 'globby';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import sass from 'sass';
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import VueLoaderPlugin from 'vue-loader/lib/plugin.js';
import VuetifyLoaderPlugin from 'vuetify-loader/lib/plugin.js';
import LiveReloadPlugin from 'webpack-livereload-plugin';

const isProd = process.env.NODE_ENV === 'production';
const __dirname = path.resolve();

const config = (name) => {
  const entry = globbySync('*/main.ts', {cwd: `src/${name}`})
    .reduce((prev, curr) => {
      prev[path.basename(path.dirname(curr))] = `./${curr}`;
      return prev;
    }, {});

  let plugins = [];
  if (!isProd) {
    plugins.push(
      new LiveReloadPlugin({
        port: 0,
        appendScriptTag: true,
      })
    );
  }
  plugins = plugins.concat(
    [
      new VueLoaderPlugin(),
      ...Object.keys(entry).map(
        (entryName) =>
          new HtmlWebpackPlugin({
            filename: `${entryName}.html`,
            chunks: [entryName],
            title: entryName,
            template: 'template.html',
          }),
      ),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          extensions: {
            vue: true,
          },
        },
      }),
    ]
  );
  if (isProd) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: 'css/[name].css',
        ignoreOrder: name === 'dashboard', // To ignore Vuetify issues, good idea or not?
      })
    );
  }
  if (name === 'dashboard') {
    plugins.push(
      new VuetifyLoaderPlugin(),
    );
  }

  return {
    context: path.resolve(__dirname, `src/${name}`),
    mode: isProd ? 'production' : 'development',
    target: 'web',
    // devtool: isProd ? undefined : 'cheap-source-map',
    entry,
    output: {
      path: path.resolve(__dirname, name),
      filename: 'js/[name].js',
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json'],
      alias: {
        vue: 'vue/dist/vue.esm.js',
        // vue: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js'),
      },
      plugins: [
        new TsConfigPathsPlugin({
          configFile: 'tsconfig.browser.json',
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.css$/,
          use: [
            (isProd) ? MiniCssExtractPlugin.loader : 'vue-style-loader',
            {
              loader: 'css-loader',
              options: {
                esModule: false,
              },
            },
          ],
        },
        {
          test: /\.s(c|a)ss$/,
          use: [
            (isProd) ? MiniCssExtractPlugin.loader : 'vue-style-loader',
            {
              loader: 'css-loader',
              options: {
                esModule: false,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                implementation: sass,
              },
            },
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot)$/,
          type: 'asset/resource',
          generator: {
            filename: 'font/[name][ext]',
          },
        },
        {
          test: /\.svg?$/,
          type: 'asset/resource',
          generator: {
            filename: 'font/[name][ext]',
          },
          include: [
            path.resolve(__dirname, `src/${name}/_misc/fonts`),
          ],
        },
        {
          test: /\.(png|svg)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'img/[name]-[contenthash][ext]',
          },
          exclude: [
            path.resolve(__dirname, `src/${name}/_misc/fonts`),
          ],
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: false, // ForkTsCheckerWebpackPlugin will do type checking
            appendTsSuffixTo: [/\.vue$/],
          },
        },
        {
          resourceQuery: /blockType=i18n/,
          type: 'javascript/auto',
          loader: '@intlify/vue-i18n-loader',
        },
      ],
    },
    plugins,
    optimization: (isProd) ? {
      // v5 migration guide says to reconsider this, so maybe change in the future?
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          common: {
            minChunks: 2,
          },
          defaultVendors: false,
          default: false,
        },
      },
    } : undefined,
  };
}

export default [
  config('dashboard'),
  // config('graphics'),
];
