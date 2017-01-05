const {Map} = require('immutable');
const {compose} = require('ramda');
const {lens, view, set} = require('ramda-lens');
const toId = require('toid');

const immLens = key => lens((x) => x.get(key), (val, x) => x.set(key, val));

// lense
const user = id => immLens(id);

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
  return set(user(userId), User, users);
}

function getUser(users, name) {
  return view(compose(user, toId)(name), users);
}

function removeUser(users, name) {
  const userId = toId(name);
  return users.delete(userId);
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