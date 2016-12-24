// @flow

const _ = require('lodash');
const config = require('./config');
const db = require('./db');
const toId = require('toid');
const Users = require('./users');
const Rooms = require('./rooms');
const hashColor = require('./hashColor');
const messageSchema = require('../schemas/message');

function sockets(io/*: Object */) {
  io.on('connection', function(socket) {
    console.log('a user connected');

    socket.emit('load rooms', Rooms.list());

    socket.on('add choose name user', (username) => {
      if (!_.isString(username)) return socket.emit('err', 'Must be a string.');
      if (username.length > 21) return socket.emit('err', 'Username must be less than 21 characters.');
      if (Users.get(username)) return socket.emit('err', 'Someone is already using that username.');
      if (Users.isRegistered(username)) return socket.emit('err', 'This username is registered.');
      if (!socket.userId) {
        Users.create(username, socket, false);
      } else if (Users.get(socket.userId) && Users.get(socket.userId).autheticated) {
        return socket.emit('err', 'You must logout to change from an auth username to an unauth one.');
      } else {
        Users.remove(socket.userId);
        db.auths.remove(socket.userId);
        Users.create(username, socket, false);
      }
      socket.emit('hash color', hashColor(socket.userId));
      socket.emit('chooseName success', username);
      console.log('DONE choose name!', Users.list());
      // update userlist and do other shit
    });

    socket.on('add auth user', (username) => {
      if (!_.isString(username)) return socket.emit('err', 'Must be a string.');
      if (username.length > 21) return socket.emit('err', 'Username must be less than 21 characters.');
      if (Users.get(username)) return socket.emit('err', 'Someone is already using that username.');
      if (!db.auths.get(username)) return socket.emit('err', 'This username has not been authenticated.');
      //if (Users.get(socket.userId) && Users.get(socket.userId).registered) return socket.emit('err', 'You cannot add yourself when already auth.');
      Users.create(username, socket, true);
      socket.emit('hash color', hashColor(socket.userId));
      socket.emit('chooseName success', username);
      socket.emit('finish add auth user');
      console.log('DONE auth name!', Users.list());
      // update userlist and do other shit
    });

    socket.on('remove user', () => {
      if (socket.userId) {
        Users.remove(socket.userId);
        db.auths.remove(socket.userId);
        Rooms.removeUser(socket.userId, socket);
        console.log('list:', Rooms.list())
        io.emit('load rooms', Rooms.list());
      }
    });

    socket.on('user join room', (roomName) => {
      const room = Rooms.get(toId(roomName));
      if (!room || !socket.userId) return;
      room.addUser(socket.userId, socket);
      io.to(roomName).emit('load rooms', Rooms.list());
    });

    socket.on('user leave room', (roomName) => {
      const room = Rooms.get(toId(roomName));
      if (!room || !socket.userId) return;
      room.removeUser(socket.userId, socket);
      io.to(roomName).emit('load rooms', Rooms.list());
    });

    socket.on('chat message', (buffer) => {
      const messageObject = messageSchema.decode(buffer);
      const text = messageObject.text;
      if (text.substr(0, 5) === '/join') {
        const parts = text.split(' ');
        console.log(parts);
        socket.join(parts[1]);
        socket.emit('join room', parts[1]);
      } else {
        Rooms.get(messageObject.room).log.push({
          username: messageObject.username,
          hashColor: hashColor(toId(messageObject.username)),
          text: messageObject.text
        });
        io.to(messageObject.room).emit('load rooms', Rooms.list());
        //io.to(messageObject.room).emit('chat message', buffer);
      }
    });

    socket.on('disconnect', function(){
      console.log('user disconnected');
      if (socket.userId) {
        // remove this user from all his rooms that he join
        Rooms.removeUser(socket.userId, socket);
        Users.remove(socket.userId);
        db.auths.remove(socket.userId);
        io.emit('load rooms', Rooms.list());
      }
    });
  });
}

module.exports = sockets;
