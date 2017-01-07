import test from 'ava';
import {Map, is} from 'immutable';
import {
  getIP,
  createUser,
  getUser,
  removeUser,
  CREATE_USER,
  REMOVE_USER,
  users
} from '../server/redux/users';
import store from '../server/redux/store';
import {createStore} from 'redux';

const socket = {request: {headers: {'x-forwarded-for': '23.3434.454.65'}}};

test('create user', t => {
  const initialState = Map();
  const nextState = createUser(initialState, 'Phil', socket, true);
  const expectedUser = Map({
    name: 'Phil',
    socket,
    authenticated: true,
    id: 'phil',
    ip: getIP(socket),
    lastMessage: '',
    lastMessageTime: 0
  });
  const expectedState = Map({
    'phil': expectedUser
  });
  t.truthy(is(nextState, expectedState));
});

test('get User', t => {
  t.plan(2);

  const initialState = Map();
  const nextState = createUser(initialState, 'Phil', socket, true);
  const expectedUser = Map({
    name: 'Phil',
    socket,
    authenticated: true,
    id: 'phil',
    ip: getIP(socket),
    lastMessage: '',
    lastMessageTime: 0
  });
  const expectedState = Map({
    'phil': expectedUser
  });

  const defaultState = {
    users: expectedState
  };

  function reducer(state = defaultState) {
    return state;
  }

  const userStore = createStore(reducer);

  const user = getUser(userStore, 'Phil');
  t.truthy(is(user, expectedUser));

  const unknownUser = getUser(userStore, 'asdas');
  t.falsy(unknownUser);
});

test('remove user', t => {
  const initialState = Map({
    'phil': Map({
      name: 'Phil',
      socket,
      authenticated: true,
      id: 'phil',
      ip: getIP(socket),
      lastMessage: '',
      lastMessageTime: 0
    })
  });
  const nextState = removeUser(initialState, 'Phil');
  const expectedState = Map();
  t.truthy(is(nextState, expectedState));
});

test('CREATE_USER', t => {
  const initialState = Map();
  const action = {type: CREATE_USER, name: 'Phil', socket, authenticated: true};
  const nextState = users(initialState, action);
  const expectedState = Map({
    'phil': Map({
      name: 'Phil',
      socket,
      authenticated: true,
      id: 'phil',
      ip: getIP(socket),
      lastMessage: '',
      lastMessageTime: 0
    })
  });
  t.truthy(is(nextState, expectedState));
});

test('REMOVE_USER', t => {
  const initialState = Map({
    'phil': Map({
      name: 'Phil',
      socket,
      authenticated: true,
      id: 'phil',
      ip: getIP(socket),
      lastMessage: '',
      lastMessageTime: 0
    })
  });
  const action = {type: REMOVE_USER, name: 'Phil'};
  const nextState = users(initialState, action);
  const expectedState = Map();
  t.truthy(is(nextState, expectedState));
});

test('initial state', t => {
  const action = {type: REMOVE_USER, name: 'Jack'};
  const nextState = users(undefined, action);
  const expectedState = Map();
  t.truthy(is(nextState, expectedState));
});

test('CREATE_USER with store', t => {
  t.plan(2);

  const initialState = {
    users: Map()
  };
  t.truthy(is(store.getState().users, initialState.users));

  const action = {type: CREATE_USER, name: 'Phil', socket, authenticated: true};
  store.dispatch(action);
  const expectedState = {
    users: Map({
      'phil': Map({
        name: 'Phil',
        socket,
        authenticated: true,
        id: 'phil',
        ip: getIP(socket),
        lastMessage: '',
        lastMessageTime: 0
      })
    })
  };
  t.truthy(is(store.getState().users, expectedState.users));
});
