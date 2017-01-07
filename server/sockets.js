
const _ = require('lodash');
const config = require('./config');
const db = require('./db');
const toId = require('toid');
const hashColor = require('./hashColor');
const messageSchema = require('../schemas/message');
const CommandParser = require('./command-parser');
const {
  getRoom,
  getRoomData,
  listActiveRooms,
  listAllRooms,
  getLastMessage,
  CREATE_ROOM,
  ADD_USER_TO_ROOM,
  REMOVE_USER_FROM_ROOM,
  ADD_RAW_MESSAGE,
  ADD_USER_MESSAGE
} = require('./redux/rooms');
const {
  getUser,
  CREATE_USER,
  REMOVE_USER
} = require('./redux/users');
const store = require('./redux/store');

function sockets(io/*: Object */) {
  io.on('connection', function(socket) {
    console.log('a user connected');

    socket.activeRooms = {'lobby': 1};

    socket.emit('load rooms', listActiveRooms(store, socket.activeRooms));
    socket.emit('load all rooms', listAllRooms(store));

    socket.on('add choose name user', (username) => {
      if (!_.isString(username)) return socket.emit('err', 'Must be a string.');
      if (username.length > 21) return socket.emit('err', 'Username must be less than 21 characters.');
      if (getUser(store, username)) return socket.emit('err', 'Someone is already using that username.');
      if (db.users.get(toId(username))) return socket.emit('err', 'This username is registered.');
      if (!socket.userId) {
        store.dispatch({type: CREATE_USER, name: username, socket, authenticated: false});
      } else if (Users.get(socket.userId) && Users.get(socket.userId).authenticated) {
        return socket.emit('err', 'You must logout to change from an auth username to an unauth one.');
      } else {
        store.dispatch({type: REMOVE_USER, name: socket.userId});
        db.auths.remove(socket.userId);
        store.dispatch({type: CREATE_USER, name: username, socket, authenticated: false});
      }
      socket.emit('hash color', hashColor(socket.userId));
      socket.emit('chooseName success', username);
    });

    socket.on('add auth user', (username) => {
      if (!_.isString(username)) return socket.emit('err', 'Must be a string.');
      if (toId(username).length > 21) return socket.emit('err', 'Username must be less than 21 characters.');
      if (getUser(store, username)) return socket.emit('err', 'Someone is already using that username.');
      if (!db.auths.get(toId(username))) return socket.emit('err', 'This username has not been authenticated.');
      //if (Users.get(socket.userId) && Users.get(socket.userId).registered) return socket.emit('err', 'You cannot add yourself when already auth.');
      store.dispatch({type: CREATE_USER, name: username, socket, authenticated: true});
      socket.emit('hash color', hashColor(socket.userId));
      socket.emit('chooseName success', username);
      socket.emit('finish add auth user');
    });

    socket.on('remove user', () => {
      if (socket.userId) {
        store.dispatch({type: REMOVE_USER, name: socket.userId});
        db.auths.remove(socket.userId);
        // this below is temp
        store.getState().rooms.mapKeys(roomId => {
          store.dispatch({type: REMOVE_USER_FROM_ROOM, userId: socket.userId, roomId});
        });
        io.emit('load rooms', store.getState().rooms.toJS());
        io.emit('load all rooms', listAllRooms(store));
      }
    });

    socket.on('user join room', (roomName) => {
      const room = Rooms.get(roomName);
      if (!room || !socket.userId) return socket.emit('err', 'No room or not login.');
      if (!Users.get(socket.userId)) return socket.emit('err', 'socket.userId could not get user.');
      if (!socket.activeRooms[toId(roomName)]) {
        socket.activeRooms[toId(roomName)] = 1;
      }
      room.addUser(Users.get(socket.userId).name, socket);
      const roomData = room.data();
      socket.emit('load room', roomData);
      io.to(roomData.id).emit('load room userlist', {id: room.id, users: roomData.users});
      io.emit('load all rooms', Rooms.listAll());
    });

    socket.on('user leave room', (roomName) => {
      const room = Rooms.get(toId(roomName));
      if (!room || !socket.userId) return socket.emit('err', 'No room or not login.');
      if (socket.activeRooms[toId(roomName)]) {
        delete socket.activeRooms[toId(roomName)];
      }
      room.removeUser(Users.get(socket.userId).name, socket);
      const roomData = room.data();
      io.to(roomData.id).emit('load room userlist', {id: room.id, users: roomData.users});
      io.emit('load all rooms', Rooms.listAll());
    });

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

module.exports = sockets;
