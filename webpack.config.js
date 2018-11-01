const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const IS_DEV = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: IS_DEV ? 'development' : 'production',
  target: 'node',
  entry: './src/main.js',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'main.js'
  },
  devtool: 'source-map',
  externals: [nodeExternals({})],
  module: {
    rules: [
      {
        test: /\.(gql|graphql)/,
        use: 'graphql-tag/loader'
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: true,
              cacheDirectory: true
            }
          }
        ]
      }
    ]
  },
  node: {
    __filename: true,
    __dirname: true
  },
  optimization: {
    noEmitOnErrors: true
  },
  performance: {
    hints: false
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    new webpack.EnvironmentPlugin({
      DEBUG: true,
      NODE_ENV: 'development'
    }),
    new FriendlyErrorsWebpackPlugin({ clearConsole: IS_DEV })
  ],
  resolve: {
    extensions: ['.js']
  },
  stats: 'minimal',
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    port: 4000
  }
};
