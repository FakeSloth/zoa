// @flow

const _ = require('lodash');
const config = require('./config');
const db = require('./db');
const toId = require('toid');
const hashColor = require('./hashColor');
const messageSchema = require('../schemas/message');
const CommandParser = require('./command-parser');
const {Map} = require('immutable');
const {
  CREATE_ROOM,
  ADD_USER_TO_ROOM,
  REMOVE_USER_FROM_ROOM,
  REMOVE_USER_FROM_ALL_ROOMS,
  ADD_MESSAGE
} = require('./redux/rooms');
const {
  getIP,
  CREATE_USER,
  REMOVE_USER
} = require('./redux/users');
const store = require('./redux/store');
const {
  getUser,
  getRoom,
  getRoomData,
  listActiveRooms,
  listAllRooms
} = require('./getters');

const log = require('winston').info;

function sockets(io/*: Object */) {
  store.dispatch({type: CREATE_ROOM, name: 'Lobby'});

  io.on('connection', function(socket) {
    new Socket(io, socket);
  });
}

class Socket {
  /* flow-include
  io: Object;
  socket: Object;
  disconnect: any;
  addChooseNameUser: any;
  addAuthUser: any;
  removeUser: any;
  userJoinRoom: any;
  userLeaveRoom: any;
  chatMessage: any;
  */
  constructor(io/*: Object */, socket/*: Object */) {
    this.io = io;
    this.socket = socket;

    this.disconnect = this.disconnect.bind(this);
    this.addChooseNameUser = this.addChooseNameUser.bind(this);
    this.addAuthUser = this.addAuthUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.userJoinRoom = this.userJoinRoom.bind(this);
    this.userLeaveRoom = this.userLeaveRoom.bind(this);
    this.chatMessage = this.chatMessage.bind(this);

    this.initEvents(this.socket);
    this.handleEvents(this.socket);
  }

  initEvents(socket/*: Object */) {
    log(`User ${getIP(socket)} connected`);

    socket.activeRooms = Map({'lobby': true});

    socket.emit('load active rooms', listActiveRooms(store, socket.activeRooms));
    socket.emit('load all rooms', listAllRooms(store));
  }

  handleEvents(socket/*: Object */) {
    socket.on('disconnect', this.disconnect);
    socket.on('add choose name user', this.addChooseNameUser);
    socket.on('add auth user', this.addAuthUser);
    socket.on('remove user', this.removeUser);
    socket.on('user join room', this.userJoinRoom);
    socket.on('user leave room', this.userLeaveRoom);
    socket.on('chat message', this.chatMessage);
  }

  disconnect() {
    log(`User ${getIP(this.socket)} disconnected`);

    const userId = this.socket.userId;
    if (!userId) return;

    store.dispatch({type: REMOVE_USER, name: userId});
    db.auths.remove(userId);
    store.dispatch({type: REMOVE_USER_FROM_ALL_ROOMS, userId});

    this.socket.activeRooms.mapKeys(roomId => {
      this.io.emit('load room userlist', {
        id: roomId,
        users: getRoomData(store, roomId).users
      });
    });
  }

  handleUsernameError(username/*: string */) {
    if (!_.isString(username)) return this.err('Must be a string.');
    if (username.length > 21) return this.err('Username must be less than 21 characters.');
    if (getUser(store, username)) return this.err('Someone is already using that username.');

    return false;
  }

  handleRoomError(roomName/*: string */) {
    if (!getRoom(store, roomName)) return this.err('Room does not exists.');
    if (!this.socket.userId) return this.err('User has not choosen a name.');

    return false;
  }

  err(message/*: string */) {
    this.socket.emit('err', message);

    return true;
  }

  addChooseNameUser(username/*: string */) {
    if (this.handleUsernameError(username)) return;
    if (db.users.get(toId(username))) return this.err('This username is registered.');

    const userId = this.socket.userId;
    const user = getUser(store, userId);
    const createUserAction = {
      type: CREATE_USER,
      name: username,
      socket: this.socket,
      authenticated: false
    };

    if (!userId) {
      this.socket.userId = toId(username);
      store.dispatch(createUserAction);
    } else if (user && user.get('authenticated')) {
      return this.err('You must logout to change from an auth username to an unauth one.');
    } else {
      this.socket.userId = toId(username);
      store.dispatch({type: REMOVE_USER, name: userId});
      db.auths.remove(userId);
      store.dispatch(createUserAction);
    }

    this.socket.emit('hash color', hashColor(this.socket.userId));
    this.socket.emit('chooseName success', username);
  }

  addAuthUser(username/*: string */) {
    if (this.handleUsernameError(username)) return;
    if (!db.auths.get(toId(username))) return this.err('This username has not been authenticated.');

    const userId = this.socket.userId;

    if (userId) {
      store.dispatch({type: REMOVE_USER, name: userId});
    }

    this.socket.userId = toId(username);
    store.dispatch({type: CREATE_USER, name: username, socket: this.socket, authenticated: true});

    this.socket.emit('hash color', hashColor(this.socket.userId));
    this.socket.emit('chooseName success', username);
    this.socket.emit('finish add auth user');
  }

  removeUser() {
    const userId = this.socket.userId;

    if (!userId) return;

    store.dispatch({type: REMOVE_USER, name: userId});
    db.auths.remove(userId);
    store.dispatch({type: REMOVE_USER_FROM_ALL_ROOMS, userId});

    this.io.emit('load active rooms', listActiveRooms(store, this.socket.activeRooms));
    this.io.emit('load all rooms', listAllRooms(store));
  }

  userJoinRoom(roomName/*: string */) {
    const roomId = toId(roomName);
    const userId = this.socket.userId;
    const room = getRoom(store, roomId);

    if (!room) return this.err(`Room ${roomId} does not exist.`);

    const users = room.get('users').filter(toId);

    if (this.handleRoomError(roomName)) return;
    if (users.includes(userId)) return this.err('Already in this room.');
    if (!this.socket.activeRooms.has(roomId)) {
      this.socket.activeRooms = this.socket.activeRooms.set(roomId, true);
    }

    const userName = getUser(store, userId).get('name');

    this.socket.join(roomId);
    store.dispatch({type: ADD_USER_TO_ROOM, roomId, userName});

    const roomData = getRoomData(store, roomId);

    this.socket.emit('load room', roomData);
    this.io.to(roomId).emit('load room userlist', {id: roomId, users: roomData.users});
    this.io.emit('load all rooms', listAllRooms(store));
  }

  userLeaveRoom(roomName/*: string */) {
    const roomId = toId(roomName);
    const userId = this.socket.userId;
    const room = getRoom(store, roomId);

    if (!room) return this.err(`Room ${roomId} does not exist.`);

    const users = room.get('users').filter(toId);

    if (this.handleRoomError(roomName)) return;
    if (!users.includes(userId)) return this.err('Not in this room.');
    if (this.socket.activeRooms.has(roomId)) {
      this.socket.activeRooms = this.socket.activeRooms.remove(roomId);
    }

    this.socket.leave(roomId);
    store.dispatch({type: REMOVE_USER_FROM_ROOM, roomId, userId});

    const roomData = getRoomData(store, roomId);

    this.socket.emit('load active rooms', listActiveRooms(store, this.socket.activeRooms));
    this.io.to(roomId).emit('load room userlist', {id: roomId, users: roomData.users});
    this.io.emit('load all rooms', listAllRooms(store));
  }

  chatMessage(message/*: Object */) {
    if (!_.isObject(message)) return this.err('Message must be an object.');

    const text = message.text.trim();
    const room = getRoom(store, message.room);
    const userId = this.socket.userId;

    if (!text) return this.err('Text cannot be empty.');
    if (!room) return this.err('Room does not exist.');
    if (!message.username || !userId) return this.err('Username required.');
    if (toId(message.username) !== userId) return this.err('Cannot pretend to be another user.');

    const result = CommandParser.parse(message, room, getUser(store, userId), store);

    if (result.sideEffect) {
      result.sideEffect(this.io, this.socket);
    }
    if (result.text) {
      const rawMessage = {
        raw: true,
        text: result.text,
        room: room.get('id'),
        date: Date.now()
      };
      return this.socket.emit('add room log', rawMessage);
    }
    if (result.userMessage) {
      const userMessage = {
        username: message.username,
        text: result.userMessage,
        originalText: result.originalText,
        room: room.get('id'),
        date: Date.now(),
        hashColor: hashColor(toId(message.username))
      };
      store.dispatch({type: ADD_MESSAGE, roomId: room.get('id'), message: userMessage});
      this.io.to(room.get('id')).emit('add room log', userMessage);
    }
  }
}

module.exports = sockets;
