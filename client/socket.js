// @flow weak

import io from 'socket.io-client';
import Vue from 'vue';
import state from './state';
import messageSchema from '../schemas/message';

/* flow-include
  declare var GLOBAL_ROUTER: any;
*/

const socket = io();

socket.on('err', (message) => {
  console.error(message);
});

socket.on('chooseName success', (username) => {
  state.username = username;
});

socket.on('hash color', (color) => {
  state.hashColor = color;
});

socket.on('load all rooms', (allRooms) => {
  state.allRooms = allRooms;
});

socket.on('load rooms', (rooms) => {
  state.rooms = rooms;
});

socket.on('load room', (room) => {
  Vue.set(state.rooms, room.id, room);
});

socket.on('load room userlist', (room) => {
  Vue.set(state.rooms[room.id], 'users', room.users);
});

socket.on('add room log', (data) => {
  const room = state.rooms[data.room];
  if (!room) return console.error('add room log: room does not exist');
  room.log.push(data);
  if (window.Notification && Notification.permission !== "denied") {
    Notification.requestPermission(function(status) {
      alert('ran');
      let notif = new Notification('ZOA Alert', {
        body: 'New message in ' + room.name + '!',
      });
    });
  }
});

socket.on('finish add auth user', () => {
  socket.emit('user join room', 'lobby');
});

socket.on('user join room', (roomName) => {
  socket.emit('user join room', roomName);
  GLOBAL_ROUTER.push(`/room/${roomName}`);
});

socket.on('user leave room', (roomName) => {
  socket.emit('user leave room', roomName);
  const rooms = state.rooms;
  delete rooms[roomName];
  Vue.set(state, 'rooms', rooms);
  const roomNames = Object.keys(state.rooms);
  if (!roomNames.length) {
    GLOBAL_ROUTER.push('/room/lobby');
  } else {
    GLOBAL_ROUTER.push(`/room/${roomNames[roomNames.length - 1]}`);
  }
});

module.exports = socket;
