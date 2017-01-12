// @flow weak

const bodyParser = require('body-parser');
const compress = require('compression');
const config = require('./config');
const db = require('./db');
const express = require('express');
const http/*: any*/ = require('http');
const path = require('path');
const socketio = require('socket.io');
const sockets = require('./sockets');
const toId = require('toid');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config');
const webpackDev = require('webpack-dev-middleware');
const webpackHot = require('webpack-hot-middleware');
const routes = require('./routes');

/**
 * Create Express server.
 */

const app/*: any */ = express();
const server = http.Server(app);

/**
 * Create sockets.
 */

const io = socketio(server);

/**
 * App configuration.
 */


app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(compress());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

if (config.isDev) {
  const compiler = webpack(webpackConfig);

  app.use(webpackDev(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }));

  app.use(webpackHot(compiler));
}


app.use('/', routes);

db.auths.keys().forEach(name => db.auths.remove(name));

sockets(io);

server.listen(config.port, (err) => {
  if (err) console.log(err);
  console.log('==> Listening on port %s in %s mode.', config.port, app.get('env'));
});
