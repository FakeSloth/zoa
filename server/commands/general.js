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
      sideEffect(io, socket) {
        Rooms.create(normalized);
        io.emit('load room', Rooms.get(normalized).data());
        io.emit('load all rooms', Rooms.listAll());
        socket.emit('user join room', toId(normalized));
      }
    };

    const checkTarget = fromErr(normalized && normalized.length <= 20, errTarget);
    const checkPermissions = fromErr(config.sysop === user.id && user.authenticated, errPermission);

    return checkTarget
      .chain(() => checkPermissions)
      .fold(e => e,
            () => successRoom);
  },

  join: 'joinroom',
  joinroom(target, room, user) {
    const joinRoom = Rooms.get(target);

    const successJoin = {
      sideEffect(io, socket) {
        socket.emit('user join room', joinRoom.id);
      }
    };

    return fromErr(joinRoom, {text: `${target} room does not exist.`})
      .fold(e => e,
            () => successJoin);
  },

  leave: 'leaveroom',
  leaveroom(target, room, user) {
    const successLeave = {
      sideEffect(io, socket) {
        socket.emit('user leave room', room.id);
      }
    };

    return fromErr(room.hasUser(user.id), {text: 'You are not in this room.'})
      .fold(e => e,
            () => successLeave);
  },
};

module.exports = commands;
