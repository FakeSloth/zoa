// @flow

const _ = require('lodash');
const config = require('./config');
const db = require('./db');
const Users = require('./users');
const Rooms = require('./rooms');
const hashColor = require('./hashColor');
const messageSchema = require('../schemas/message');
const CommandParser = require('./command-parser');

function sockets(io/*: Object */) {
  io.on('connection', function(socket) {
    console.log('a user connected');

    socket.activeRooms = {'lobby': 1};

    socket.emit('load rooms', Rooms.list(socket.activeRooms));
    socket.emit('load all rooms', Rooms.listAll());

    socket.on('add choose name user', (username) => {
      if (!_.isString(username)) return socket.emit('err', 'Must be a string.');
      if (username.length > 21) return socket.emit('err', 'Username must be less than 21 characters.');
      if (Users.get(username)) return socket.emit('err', 'Someone is already using that username.');
      if (Users.isRegistered(username)) return socket.emit('err', 'This username is registered.');
      if (!socket.userId) {
        Users.create(username, socket, false);
      } else if (Users.get(socket.userId) && Users.get(socket.userId).authenticated) {
        return socket.emit('err', 'You must logout to change from an auth username to an unauth one.');
      } else {
        Users.remove(socket.userId);
        db.auths.remove(socket.userId);
        Users.create(username, socket, false);
      }
      socket.emit('hash color', hashColor(socket.userId));
      socket.emit('chooseName success', username);
    });

    socket.on('add auth user', (username) => {
      if (!_.isString(username)) return socket.emit('err', 'Must be a string.');
      if (toId(username).length > 21) return socket.emit('err', 'Username must be less than 21 characters.');
      if (Users.get(username)) return socket.emit('err', 'Someone is already using that username.');
      if (!db.auths.get(toId(username))) return socket.emit('err', 'This username has not been authenticated.');
      //if (Users.get(socket.userId) && Users.get(socket.userId).registered) return socket.emit('err', 'You cannot add yourself when already auth.');
      Users.create(username, socket, true);
      socket.emit('hash color', hashColor(socket.userId));
      socket.emit('chooseName success', username);
      socket.emit('finish add auth user');
    });

    socket.on('remove user', () => {
      if (socket.userId) {
        Users.remove(socket.userId);
        db.auths.remove(socket.userId);
        Rooms.removeUser(socket.userId, socket);
        io.emit('load rooms', Rooms.list());
        io.emit('load all rooms', Rooms.listAll());
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
