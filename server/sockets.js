
const _ = require('lodash');
const config = require('./config');
const db = require('./db');
const toId = require('toid');
const hashColor = require('./hashColor');
const messageSchema = require('../schemas/message');
const CommandParser = require('./command-parser');
const {Map} = require('immutable');
const {
  getRoom,
  getRoomData,
  listActiveRooms,
  listAllRooms,
  getLastMessage,
  CREATE_ROOM,
  ADD_USER_TO_ROOM,
  REMOVE_USER_FROM_ROOM,
  REMOVE_USER_FROM_ALL_ROOMS,
  ADD_RAW_MESSAGE,
  ADD_USER_MESSAGE
} = require('./redux/rooms');
const {
  getIP,
  getUser,
  CREATE_USER,
  REMOVE_USER
} = require('./redux/users');
const store = require('./redux/store');

const log = require('winston').info;

class Sockets {
  constructor(io) {
    this.io = io;

    store.dispatch({type: CREATE_ROOM, name: 'Lobby'});

    this.addChooseNameUser = this.addChooseNameUser.bind(this);
    this.addAuthUser = this.addAuthUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.userJoinRoom = this.userJoinRoom.bind(this);
    this.userLeaveRoom = this.userLeaveRoom.bind(this);

    io.on('connection', (socket) => {
      this.socket = socket;
      this.initEvents(socket);
      this.handleEvents(socket);
    });
  }

  initEvents(socket) {
    log(`User ${getIP(socket)} connected`);

    socket.activeRooms = Map({'lobby': true});

    socket.emit('load rooms', listActiveRooms(store, socket.activeRooms));
    socket.emit('load all rooms', listAllRooms(store));
  }

  handleEvents(socket) {
    socket.on('add choose name user', this.addChooseNameUser);
    socket.on('add auth user', this.addAuthUser);
    socket.on('remove user', this.removeUser);
    socket.on('user join room', this.userJoinRoom);
    socket.on('user leave room', this.userLeaveRoom);
  }

  handleUsernameError(username) {
    if (!_.isString(username)) return this.err('Must be a string.');
    if (username.length > 21) return this.err('Username must be less than 21 characters.');
    if (getUser(store, username)) return this.err('Someone is already using that username.');

    return false;
  }

  handleRoomError(roomName) {
    if (!getRoom(store, roomName)) return this.err('Room does not exists.');
    if (!this.socket.userId) return this.err('User has not choosen a name.');

    return false;
  }

  err(message) {
    this.socket.emit('err', message);

    return true;
  }

  addChooseNameUser(username) {
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

    this.socket.emit('hash color', hashColor(userId));
    this.socket.emit('chooseName success', username);
  }

  addAuthUser(username) {
    if (this.handleUsernameError(username)) return;
    if (!db.auths.get(toId(username))) return this.err('This username has not been authenticated.');

    const userId = this.socket.userId;

    if (userId) {
      store.dispatch({type: REMOVE_USER, name: userId});
    }

    this.socket.userId = toId(username);
    store.dispatch({type: CREATE_USER, name: username, socket: this.socket, authenticated: true});

    this.socket.emit('hash color', hashColor(userId));
    this.socket.emit('chooseName success', username);
    this.socket.emit('finish add auth user');
  }

  removeUser() {
    const userId = this.socket.userId;

    if (!userId) return;

    store.dispatch({type: REMOVE_USER, name: userId});
    db.auths.remove(userId);
    store.dispatch({type: REMOVE_USER_FROM_ALL_ROOMS, userId});

    this.io.emit('load rooms', listActiveRooms(store, this.socket.activeRooms));
    this.io.emit('load all rooms', listAllRooms(store));
  }

  userJoinRoom(roomName) {
    if (this.handleRoomError(roomName)) return;
    if (!this.socket.activeRooms.has(roomId)) {
      this.socket.activeRooms = this.socket.activeRooms.set(roomId, true);
    }

    const roomId = toId(roomName);
    const userId = this.socket.userId;
    const userName = getUser(store, userId).get('name');

    this.socket.join(roomId);
    store.dispatch({type: ADD_USER_TO_ROOM, roomId, userName});

    const roomData = getRoomData(store, roomId);

    this.socket.emit('load room', roomData);
    this.io.to(roomId).emit('load room userlist', {id: roomId, users: roomData.users});
    this.io.emit('load all rooms', listAllRooms(store));
  }

  userLeaveRoom(roomName) {
    if (this.handleRoomError(roomName)) return;
    if (!this.socket.activeRooms.has(roomId)) {
      this.socket.activeRooms = this.socket.activeRooms.remove(roomId);
    }

    const roomId = toId(roomName);
    const userId = this.socket.userId;

    this.socket.leave(roomId);
    store.dispatch({type: REMOVE_USER_FROM_ROOM, roomId, userId});

    const roomData = getRoomData(store, roomId);

    this.socket.emit('load room', roomData);
    this.io.to(roomId).emit('load room userlist', {id: roomId, users: roomData.users});
    this.io.emit('load all rooms', listAllRooms(store));
  }
}

module.exports = Sockets;
/*


    socket.on('chat message', (buffer) => {
      if (!_.isObject(buffer)) return;
      try {
        const messageObject = messageSchema.decode(buffer);
        const text = messageObject.text.trim();
        const room = Rooms.get(messageObject.room);
        if (!text || !messageObject.username || !room) return socket.emit('err', 'No text, username, or room.');
        if (!socket.userId) return socket.emit('err', 'Must have name to chat.');

        const result = CommandParser.parse(text, room, Users.get(socket.userId));

        if (result.sideEffect) {
          result.sideEffect(io, socket);
        }
        if (result.raw && result.private) {
          return socket.emit('add room log', result);
        }
        if (result.raw) {
          room.add(result);
          io.to(room.id).emit('add room log', Object.assign(room.peek(), {room: room.id}));
        } else if (result.text) {
          Object.assign(messageObject, result);
          room.addMessage(messageObject);
          io.to(room.id).emit('add room log', Object.assign(room.peek(), {room: room.id}));
        }
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('disconnect', function(){
      console.log('user disconnected');
      if (socket.userId) {
        // remove this user from all his rooms that he join
        Rooms.removeUser(socket.userId, socket);
        Users.remove(socket.userId);
        db.auths.remove(socket.userId);
        for (let roomId in socket.activeRooms) {
          io.emit('load room userlist', {id: roomId, users: Rooms.get(roomId).data().users});
        }
      }
    });
  });
}

module.exports = sockets;*/
