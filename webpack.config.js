const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

// Need to try and make this programatically.
const entry = {
  'add-remove-runs-dash': './files/add-remove-runs-dash/main.ts',
  'alert-dialog': './files/alert-dialog/main.ts',
  'horaro-schedule-import': './files/horaro-schedule-import/main.ts',
  'player-layout': './files/player-layout/main.ts',
  'run-editor-dash': './files/run-editor-dash/main.ts',
  'run-modification-dialog': './files/run-modification-dialog/main.ts',
  'run-player': './files/run-player/main.ts',
  timer: './files/timer/main.ts',
  'twitch-control': './files/twitch-control/main.ts',
};

module.exports = {
  context: path.resolve(__dirname, 'src/dashboard'),
  mode: isProd ? 'production' : 'development',
  target: 'web',
  devtool: isProd ? undefined : 'cheap-source-map',
  entry,
  output: {
    path: path.resolve(__dirname, 'dashboard'),
    filename: 'js/[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
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
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: !isProd,
              publicPath: '../',
            },
          },
          // 'vue-style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.s(c|a)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: !isProd,
              publicPath: '../',
            },
          },
          // 'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sassOptions: {
                fiber: require('fibers'),
              },
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot)$/,
        loader: 'file-loader',
        options: {
          name: 'font/[name].[ext]',
        },
      },
      {
        test: /\.(png|svg)?$/,
        loader: 'file-loader',
        options: {
          name: 'img/[name].[ext]',
        },
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true, // ForkTsCheckerWebpackPlugin will do type checking
          appendTsSuffixTo: [/\.vue$/],
        },
      },
    ],
  },
  plugins: [
    new HardSourceWebpackPlugin(),
    new VueLoaderPlugin(),
    new VuetifyLoaderPlugin(),
    ...Object.keys(entry).map(
      (entryName) =>
        new HtmlWebpackPlugin({
          filename: `${entryName}.html`,
          chunks: [entryName],
          title: entryName,
          template: './template.html',
        }),
    ),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    /* new ForkTsCheckerWebpackPlugin({
      vue: true,
    }), */
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        common: {
          minChunks: 2,
        },
        vendors: false,
        default: false,
      },
    },
  },
};
