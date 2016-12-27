// @flow weak

const Rooms = require('../rooms');
const config = require('../config');
const {fromErr} = require('../fp');

let commands = {
  hello(target) {
    return {
      text: `Hello ${target}!`
    }
  },

  create: 'createroom',
  createroom(target, room, user) {
    const normalized = target.trim();

    const errTarget = {text: 'No target or target cannot be greater than 20 characters.'};
    const errPermission = {text: 'You don\'t have the permissions to execute this command.'};
    const successRoom = {
      text: normalized + ' room is created!',
      sideEffect: (io, socket) => {
        Rooms.create(normalized);
        io.emit('load room', Rooms.get(normalized).data());
      }
    };

    const checkTarget = fromErr(normalized && normalized.length <= 20, errTarget);
    const checkPermissions = fromErr(config.sysop === user.id && user.authenticated, errPermission);

    return checkTarget
      .chain(() => checkPermissions)
      .fold(e => e,
            () => successRoom);
  }
};

module.exports = commands;
