const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const globby = require('globby');
const path = require('path');

const entry = globby
  .sync('*/main.ts', {cwd: 'src/dashboard'})
  .reduce((prev, curr) => {
    prev[path.basename(path.dirname(curr))] = `./${curr}`;
    return prev;
  }, {});

module.exports = {
  context: path.resolve(__dirname, 'src/dashboard'),
  mode: 'development',
  target: 'web',
  // devtool: isProd ? undefined : 'cheap-source-map',
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
          'vue-style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.s(c|a)ss$/,
        use: [
          'vue-style-loader',
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
          transpileOnly: true,
          appendTsSuffixTo: [/\.vue$/],
        },
      },
    ],
  },
  plugins: [
    new LiveReloadPlugin({
      appendScriptTag: true,
    }),
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
  ],
};
