// @flow weak

const config = require('../config');
const {fromErr} = require('../fp');
const toId = require('toid');
const {CREATE_ROOM, REMOVE_USER_FROM_ROOM} = require('../redux/rooms');
const {getRoom, getRoomData, listAllRooms} = require('../getters');

function isSysop(user) {
  return config.sysop !== user.get('id') || !user.get('authenticated');
}

const errPermission = {
  text: 'You don\'t have the permissions to execute this command.'
};

let commands = {
  hello(target, room, user) {
    if (!target) {
      return {text: `Hello ${user.get('name')}!`};
    } else {
      return {text: `Hello ${target}!`};
    }
  },

  create: 'createroom',
  createroom(target, room, user, store) {
    const normalized = target.trim();

    if (!normalized) return {text: '/createroom [name of room]'};
    if (normalized.length > 20) return {text: 'Room name cannot be greater than 20 characters.'};
    if (isSysop(user)) return errPermission;

    return {
      text: normalized + ' room is created!',
      sideEffect(io, socket) {
        store.dispatch({type: CREATE_ROOM, name: normalized});
        io.emit('load room', getRoomData(store, room.get('id')));
        io.emit('load all rooms', listAllRooms(store));
        socket.emit('user join room', toId(normalized));
      }
    };
  },

  join: 'joinroom',
  joinroom(target, room, user, store) {
    const joinRoom = getRoom(store, target);

    if (!joinRoom) {
      return {text: `${target} room does not exist.`};
    } else {
      return {
        sideEffect(io, socket) {
          socket.emit('user join room', joinRoom.get('id'));
        }
      };
    }
  },

  leave: 'leaveroom',
  leaveroom(target, room, user, store) {
    const userInRoom = room.get('users').toJS().map(toId).indexOf(user.get('id')) >= 0;
    if (!userInRoom) {
      return  {text: 'You are not in this room.'};
    } else {
      return {
        sideEffect(io, socket) {
          socket.emit('user leave room', room.get('id'));
        }
      };
    }
  }
};

module.exports = commands;
