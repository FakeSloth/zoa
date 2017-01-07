import test from 'ava';
import {Map, List, is, fromJS} from 'immutable';
import {
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
  rooms
} from '../server/redux/rooms';
import {createStore} from 'redux';

const expectedRoomState = Map({
  'lobby': Map({
    name: 'Lobby',
    id: 'lobby',
    users: List(),
    log: List()
  })
});

test('create room', t => {
  t.plan(2);

  const initialState = Map();
  const nextState = createRoom(initialState, 'Lobby');
  t.truthy(is(nextState, expectedRoomState));

  const action = {type: CREATE_ROOM, name: 'Lobby'};
  const nextState2 = rooms(initialState, action);
  t.truthy(is(nextState2, expectedRoomState));
});

test('get room', t => {
  t.plan(2);
  t.truthy(is(getRoom(expectedRoomState, 'lobby'), expectedRoomState.get('lobby')));
  t.falsy(getRoom(expectedRoomState, 'staff'));
});

test('add user to room', t => {
  t.plan(2);

  const nextState = addUserToRoom(expectedRoomState, 'lobby', 'Phil');
  const expectedState = Map({
    'lobby': Map({
      name: 'Lobby',
      id: 'lobby',
      users: List(['Phil']),
      log: List()
    })
  });
  t.truthy(is(nextState, expectedState));

  const action = {type: ADD_USER_TO_ROOM, roomId: 'lobby', userName: 'Phil'};
  const nextState2 = rooms(expectedRoomState, action);
  t.truthy(is(nextState2, expectedState));
});

test('remove user from room', t => {
  t.plan(2);

  const initialState = Map({
    'lobby': Map({
      name: 'Lobby',
      id: 'lobby',
      users: List(['Phil']),
      log: List()
    })
  });
  const nextState = removeUserFromRoom(initialState, 'lobby', 'phil');
  t.truthy(is(nextState, expectedRoomState));

  const action = {type: REMOVE_USER_FROM_ROOM, roomId: 'lobby', userId: 'phil'};
  const nextState2 = rooms(initialState, action);
  t.truthy(is(nextState2, expectedRoomState));
});

test('add raw message', t => {
  t.plan(2);

  const message = {
    raw: true,
    private: true,
    date: Date.now(),
    text: 'Hello World!',
    room: 'lobby'
  };
  const nextState = addRawMessage(expectedRoomState, 'lobby', message);
  t.truthy(is(fromJS(message), nextState.getIn(['lobby', 'log']).first()));

  const action = {type: ADD_RAW_MESSAGE, roomId: 'lobby', message};
  const nextState2 = rooms(expectedRoomState, action);
  t.truthy(is(fromJS(message), nextState2.getIn(['lobby', 'log']).first()));
});

test('add user message', t => {
  t.plan(2);

  const date = Date.now();
  const message = {
    username: 'Phil',
    date,
    text: 'Hello World!',
    originalText: 'Hello World!',
    room: 'lobby'
  };
  const nextState = addUserMessage(expectedRoomState, 'lobby', message);
  const expectedMessage = Map({
    username: 'Phil',
    date,
    text: 'Hello World!',
    originalText: 'Hello World!',
    room: 'lobby',
    hashColor: '#BE7823'
  });
  t.truthy(is(expectedMessage, nextState.getIn(['lobby', 'log']).first()));

  const action = {type: ADD_USER_MESSAGE, roomId: 'lobby', message};
  const nextState2 = rooms(expectedRoomState, action);
  t.truthy(is(fromJS(expectedMessage), nextState2.getIn(['lobby', 'log']).first()));
});

test('get all room data', t => {
  const date = Date.now();
  const defaultState = {
    rooms: Map({
      'lobby': Map({
        name: 'Lobby',
        id: 'lobby',
        users: List(['Phil', 'Jack', 'Sacha', 'Jared']),
        log: List([
          Map({
            raw: true,
            private: true,
            date,
            text: 'Hello World!',
            room: 'lobby'
          }),
          Map({
            username: 'Phil',
            date,
            text: 'Hello World!',
            originalText: 'Hello World!',
            room: 'lobby',
            hashColor: '#BE7823'
          })
        ])
      }),
      'staff': Map({
        name: 'Staff',
        id: 'staff',
        users: List(['Phil']),
        log: List()
      })
    })
  };

  function reducer(state = defaultState) {
    return state;
  }

  const store = createStore(reducer);

  listActiveRooms(store, {'lobby': 1, 'staff': 1});
  listAllRooms(store);
  getLastMessage(store, 'lobby');

  t.truthy(is(getRoomData(store, 'staff'), Map({
    name: 'Staff',
    id: 'staff',
    log: List(),
    users: List([Map({name: 'Phil', hashColor: '#BE7823'})])
  })));
});
