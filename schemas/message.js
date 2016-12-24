const schemapack = require('schemapack');

const messageSchema = schemapack.build({
  username: 'string',
  text: 'string',
  room: 'string'
});

module.exports = messageSchema;
