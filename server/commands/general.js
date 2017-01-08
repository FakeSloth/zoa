// @flow weak

const config = require('../config');
const {fromErr} = require('../fp');
const toId = require('toid');

let commands = {
  hello(target) {
    return {
      text: `Hello ${target}!`
    }
  },

  create: 'createroom',
  createroom(target, room, user) {
  },

  join: 'joinroom',
  joinroom(target, room, user) {
  },

  leave: 'leaveroom',
  leaveroom(target, room, user) {
  },
};

module.exports = commands;
