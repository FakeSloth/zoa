// @flow

const {Map} = require('immutable');
const toId = require('toid');

function getIP(socket /*: Socket */) /*: string */ {
  const forwarded = socket.request.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded;
  } else {
    return socket.request.connection.remoteAddress;
  }
}

function createUser(users, name/*: string */, socket/*: Object */, authenticated/*: bool */) {
  const userId = toId(name);
  const User = Map({
    name,
    socket,
    authenticated,
    id: userId,
    ip: getIP(socket),
    lastMessage: '',
    lastMessageTime: 0
  });
  return users.set(userId, User);
}

function removeUser(users, name/*: string */) {
  return users.delete(toId(name));
}

// actions
const CREATE_USER = 'CREATE_USER';
const REMOVE_USER = 'REMOVE_USER';
const SET_LAST_MESSAGE = 'SET_LAST_MESSAGE';
const SET_LAST_MESSAGE_TIME = 'SET_LAST_MESSAGE_TIME';

const defaultState = Map();

function reducer(state = defaultState, action/*: Object */) {
  switch (action.type) {
  case CREATE_USER:
    return createUser(state, action.name, action.socket, action.authenticated);
  case REMOVE_USER:
    return removeUser(state, action.name);
  case SET_LAST_MESSAGE:
    return state.setIn([action.userId, 'lastMessage'], action.message);
  case SET_LAST_MESSAGE_TIME:
    return state.setIn([action.userId, 'lastMessageTime'], action.date);
  default:
    return state;
  }
}

module.exports = {
  getIP,
  createUser,
  removeUser,

  CREATE_USER,
  REMOVE_USER,
  SET_LAST_MESSAGE,
  SET_LAST_MESSAGE_TIME,

  users: reducer
};
