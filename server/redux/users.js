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

function createUser(users, name, socket, authenticated) {
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

function getUser(store, name) {
  return store.getState().users.get(toId(name));
}

function removeUser(users, name) {
  return users.delete(toId(name));
}

// actions
const CREATE_USER = 'CREATE_USER';
const REMOVE_USER = 'REMOVE_USER';

const defaultState = Map();

function reducer(state = defaultState, action) {
  switch (action.type) {
  case CREATE_USER:
    return createUser(state, action.name, action.socket, action.authenticated);
  case REMOVE_USER:
    return removeUser(state, action.name);
  default:
    return state;
  }
}

module.exports = {
  getIP,
  createUser,
  getUser,
  removeUser,

  CREATE_USER,
  REMOVE_USER,

  users: reducer
};
