// @flow

/* flow-include
type Config = {
  dbName: string;
  dbLocation: string;
  isDev: bool;
  jwtSecret: string;
  port: number | string;
  sysop: string;
};
*/

let config/*: Config */ = {
  dbName: process.env.DATABASE || 'fs' || 'mongo',

  dbLocation: process.env.DATABASE_LOCATION || 'db',

  isDev: process.env.NODE_ENV !== 'production',

  jwtSecret: process.env.JWT_SECRET || 'super secret',

  port: process.env.PORT || 3000,

  sysop: process.env.SYSOP || 'admin'
};

module.exports = config;
