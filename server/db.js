// @flow

const config = require('./config');
const nef = require('nef');
const nefFs = require('nef-fs');
const nefMongo = require('nef-mongo');

let db/*: Object */ = {};

if (config.dbName === 'fs') {
  db = nef(nefFs(config.dbLocation || 'db'));
} else if (config.dbName === 'mongo' ){
  db = nef(nefMongo(config.dbLocation || 'mongodb://localhost:27017/myproject'));
}

module.exports = db;
