// @flow

const {Map} = require('immutable');
const hashColor = require('./hashColor');
const toId = require('toid');

function getUser(store/*: Object */, name/*: string */) {
  return store.getState().users.get(toId(name));
}

function getRoom(store/*: Object */, name/*: string */) {
  return store.getState().rooms.get(toId(name));
}

function userList(users) {
  return users.map(name => Map({name, hashColor: hashColor(name)}));
}

function getRoomData(store/*: Object */, roomId/*: string */) {
  const room = store.getState().rooms.get(roomId);
  return room.update('users', userList).toJS();
}

function listActiveRooms(store/*: Object */, activeRooms/*: Map */) {
  return activeRooms
    .map((_, roomId) => getRoomData(store, roomId))
    .toJS();
}

function listAllRooms(store/*: Object */) {
  const rooms = store.getState().rooms;
  return rooms.map((_, roomId) => Map({
    id: rooms.getIn([roomId, 'id']),
    name: rooms.getIn([roomId, 'name']),
    userCount: rooms.getIn([roomId, 'users']).size
  })).toList().toJS();
}

module.exports = {
  getUser,
  getRoom,
  getRoomData,
  listActiveRooms,
  listAllRooms
};
