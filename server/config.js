// @flow

/* flow-include
type Config = {
  port: number | string;
  jwtSecret: string;
  isDev: bool;
  dbName: string;
  dbLocation: string;
};
*/

let config/*: Config */ = {
  port: process.env.PORT || 3000,

  jwtSecret: process.env.JWT_SECRET || 'super secret',

  dbName: process.env.DATABASE || 'fs' || 'mongo',

  dbLocation: process.env.DATABASE_LOCATION || 'db',

  isDev: process.env.NODE_ENV !== 'production'
};

module.exports = config;
