const path = require('path');
const { once } = require('ramda');
const webpack = require('webpack');
const nodemon = require('nodemon');

const config = require('../webpack.config.js');
const compiler = webpack(config);

// integrate nodemon with Webpack watch
compiler.watch(
  config.watchOptions,
  once((error, stats) => {
    if (error || stats.hasErrors()) {
      throw Error(error || stats.toJson().errors);
    }

    nodemon({
      script: path.join(__dirname, '../build/main.js'),
      watch: '.',
      ext: 'js,graphql'
    }).on(
      'quit',
      process.exit,
    );
  })
);
