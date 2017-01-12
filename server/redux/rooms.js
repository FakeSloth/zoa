// @flow

const {Map, List, fromJS} = require('immutable');
const hashColor = require('../hashColor');
const toId = require('toid');

function createRoom(rooms, name/*: string */) {
  const roomId = toId(name);
  const Room = Map({
    name,
    id: roomId,
    users: List(),
    log: List()
  });
  return rooms.set(roomId, Room);
}

function addUserToRoom(rooms, roomId/*: string */, userName/*: string */) {
  return rooms.updateIn([roomId, 'users'], users => users.push(userName));
}

const filtered = userId => users => users.filter(name => toId(name) !== userId);

function removeUserFromRoom(rooms, roomId/*: string */, userId/*: string */) {
  return rooms.updateIn([roomId, 'users'], filtered(userId));
}

function removeUserFromAllRooms(rooms, userId/*: string */) {
  return rooms.map(room => room.update('users', filtered(userId)));
}

function addMessage(rooms, roomId/*: string */, message/*: Object */) {
  let addMessage;
  if (rooms.getIn([roomId, 'log']).size >= 100) {
    addMessage = log => log.shift().push(fromJS(message));
  } else {
    addMessage = log => log.push(fromJS(message));
  }
  return rooms.updateIn([roomId, 'log'], addMessage);
}

// actions
const CREATE_ROOM = 'CREATE_ROOM';
const ADD_USER_TO_ROOM = 'ADD_USER_TO_ROOM';
const REMOVE_USER_FROM_ROOM = 'REMOVE_USER_FROM_ROOM';
const REMOVE_USER_FROM_ALL_ROOMS = 'REMOVE_USER_FROM_ALL_ROOMS';
const ADD_MESSAGE = 'ADD_MESSAGE';

const defaultState = Map();

function reducer(state = defaultState, action/*: Object */) {
  switch (action.type) {
  case CREATE_ROOM:
    return createRoom(state, action.name);
  case ADD_USER_TO_ROOM:
    return addUserToRoom(state, action.roomId, action.userName);
  case REMOVE_USER_FROM_ROOM:
    return removeUserFromRoom(state, action.roomId, action.userId);
  case REMOVE_USER_FROM_ALL_ROOMS:
    return removeUserFromAllRooms(state, action.userId);
  case ADD_MESSAGE:
    return addMessage(state, action.roomId, action.message);
  default:
    return state;
  }
}

module.exports = {
  createRoom,
  addUserToRoom,
  removeUserFromRoom,
  addMessage,

  CREATE_ROOM,
  ADD_USER_TO_ROOM,
  REMOVE_USER_FROM_ROOM,
  REMOVE_USER_FROM_ALL_ROOMS,
  ADD_MESSAGE,

  rooms: reducer
};
