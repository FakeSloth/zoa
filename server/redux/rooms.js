const {Map, List, fromJS} = require('immutable');
const hashColor = require('../hashColor');
const toId = require('toid');

function createRoom(rooms, name) {
  const roomId = toId(name);
  const Room = Map({
    name,
    id: roomId,
    users: List(),
    log: List()
  });
  return rooms.set(roomId, Room);
}

function getRoom(store, name) {
  return store.getState().rooms.get(toId(name));
}

function userList(users) {
  return users.map(name => Map({name, hashColor: hashColor(name)}));
}

function getRoomData(store, roomId) {
  const room = store.getState().rooms.get(roomId);
  return room.update('users', userList).toJS();
}

function listActiveRooms(store, activeRooms) {
  return activeRooms
    .map((_, roomId) => getRoomData(store, roomId))
    .toJS();
}

function listAllRooms(store) {
  const rooms = store.getState().rooms;
  return rooms.map((_, roomId) => Map({
    id: rooms.getIn([roomId, 'id']),
    name: rooms.getIn([roomId, 'name']),
    userCount: rooms.getIn([roomId, 'users']).size
  })).toList().toJS();
}

function addUserToRoom(rooms, roomId, userName) {
  return rooms.updateIn([roomId, 'users'], users => users.push(userName));
}

const filtered = userId => users => users.filter(name => toId(name) !== userId);

function removeUserFromRoom(rooms, roomId, userId) {
  return rooms.updateIn([roomId, 'users'], filtered(userId));
}

function removeUserFromAllRooms(rooms, userId) {
  return rooms.map(room => room.update('users', filtered(userId)));
}

function addRawMessage(rooms, roomId, message) {
  let addMessage;
  if (rooms.getIn([roomId, 'log']).size >= 100) {
    addMessage = log => log.shift().push(fromJS(message));
  } else {
    addMessage = log => log.push(fromJS(message));
  }
  return rooms.updateIn([roomId, 'log'], addMessage);
}

function addUserMessage(rooms, roomId, userMessage) {
  const message = fromJS(userMessage)
    .set('hashColor', hashColor(toId(userMessage.username)))
    .toJS();
  return addRawMessage(rooms, roomId, message);
}

function getLastMessage(store, roomId) {
  return store.getState().rooms.getIn([roomId, 'log']).last().toJS();
}

// actions
const CREATE_ROOM = 'CREATE_ROOM';
const ADD_USER_TO_ROOM = 'ADD_USER_TO_ROOM';
const REMOVE_USER_FROM_ROOM = 'REMOVE_USER_FROM_ROOM';
const REMOVE_USER_FROM_ALL_ROOMS = 'REMOVE_USER_FROM_ALL_ROOMS';
const ADD_RAW_MESSAGE = 'ADD_RAW_MESSAGE';
const ADD_USER_MESSAGE = 'ADD_USER_MESSAGE';

const defaultState = Map();

function reducer(state = defaultState, action) {
  switch (action.type) {
  case CREATE_ROOM:
    return createRoom(state, action.name);
  case ADD_USER_TO_ROOM:
    return addUserToRoom(state, action.roomId, action.userName);
  case REMOVE_USER_FROM_ROOM:
    return removeUserFromRoom(state, action.roomId, action.userId);
  case REMOVE_USER_FROM_ALL_ROOMS:
    return removeUserFromAllRooms(state, action.userId);
  case ADD_RAW_MESSAGE:
    return addRawMessage(state, action.roomId, action.message);
  case ADD_USER_MESSAGE:
    return addUserMessage(state, action.roomId, action.message);
  default:
    return state;
  }
}

module.exports = {
  createRoom,
  getRoom,
  getRoomData,
  listActiveRooms,
  listAllRooms,
  addUserToRoom,
  removeUserFromRoom,
  addRawMessage,
  addUserMessage,
  getLastMessage,

  CREATE_ROOM,
  ADD_USER_TO_ROOM,
  REMOVE_USER_FROM_ROOM,
  REMOVE_USER_FROM_ALL_ROOMS,
  ADD_RAW_MESSAGE,
  ADD_USER_MESSAGE,

  rooms: reducer
};
