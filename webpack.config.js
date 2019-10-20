const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

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
  context: path.resolve(__dirname, "src/dashboard"),
  mode: 'production',
  target: 'web',
  entry,
  output: {
    path: path.resolve(__dirname, "dashboard"),
  },
  resolve: {
    extensions: ['.ts', '.js'],
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
              publicPath: (resourcePath, context) => {
                return '../'
              },
            },
          },
          // 'vue-style-loader',
          'css-loader',
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
        test: /\.png?$/,
        loader: 'file-loader',
        options: {
          name: 'img/[name].[ext]',
        },
      },
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        options: {
          // transpileOnly: false,
          transpileOnly: true,
          appendTsSuffixTo: [/\.vue$/],
        },
      },
    ],
  },
  plugins: [
    ...Object.keys(entry).map(
      (entryName) =>
        new HtmlWebpackPlugin({
          filename: `${entryName}.html`,
          chunks: [entryName],
          title: entryName,
          template: './template.html',
        }),
    ),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    /* new ForkTsCheckerWebpackPlugin({
      vue: true,
    }), */
  ],
  /* optimization: {
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
  }, */
};
