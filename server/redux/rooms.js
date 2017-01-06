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

function getRoom(rooms, name) {
  return rooms.get(toId(name));
}

function userList(users) {
  return users.map(name => Map({name, hashColor: hashColor(name)}));
}

function getRoomData(rooms, roomId) {
  const room = rooms.get(roomId);
  return room.update('users', userList);
}

function listActiveRooms(rooms, activeRooms) {
  return fromJS(activeRooms)
    .mapKeys(roomId => getRoomData(rooms, roomId))
    .toJS();
}

function listAllRooms(rooms) {
  return rooms.mapKeys(roomId => Map({
    id: rooms.getIn([roomId, 'id']),
    name: rooms.getIn([roomId, 'name']),
    userCount: rooms.getIn([roomId, 'users']).size
  })).toList().toJS();
}

function addUserToRoom(rooms, roomId, userName) {
  return rooms.updateIn([roomId, 'users'], users => users.push(userName));
}

function removeUserFromRoom(rooms, roomId, userId) {
  const filtered = users => users.filter(name => toId(name) !== userId);
  return rooms.updateIn([roomId, 'users'], filtered);
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

function getLastMessage(rooms, roomId) {
  return rooms.getIn([roomId, 'log']).last().toJS();
}

// actions
const CREATE_ROOM = 'CREATE_ROOM';
const ADD_USER_TO_ROOM = 'ADD_USER_TO_ROOM';
const REMOVE_USER_FROM_ROOM = 'REMOVE_USER_FROM_ROOM';
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
  ADD_RAW_MESSAGE,
  ADD_USER_MESSAGE,

  rooms: reducer
};
