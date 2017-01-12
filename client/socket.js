// @flow weak

import io from 'socket.io-client';
import Vue from 'vue';
import state from './state';
import messageSchema from '../schemas/message';

/* flow-include
  declare var GLOBAL_ROUTER: any;
  declare var Notification: any;
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
  if (state.rooms[room.id]) return;
  Vue.set(state.rooms, room.id, room);
});

socket.on('load room userlist', (room) => {
  Vue.set(state.rooms[room.id], 'users', room.users);
});

socket.on('add room log', (data) => {
  const room = state.rooms[data.room];
  if (!room) return console.error('add room log: room does not exist');
  room.log.push(data);

  const hasNotif = window.Notification && Notification.permission !== 'denied';
  const isNotOnPage = document.hidden;
  if (hasNotif && isNotOnPage) {
      Notification.requestPermission(() => {
        let notif = new Notification(`New message in ${data.room} - zoa`, {
          body: `${data.username}: ${data.originalText}`
        });
        setTimeout(() => notif.close(), 5000);
      });
  }

  const route = GLOBAL_ROUTER.currentRoute;
  const currentRoom = route.params.id || route.name;
  if (currentRoom !== data.room) {
    Vue.set(state.highlights, data.room, true);
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
  const roomNames = Object.keys(state.rooms).filter(name => name !== roomName);
  if (!roomNames.length) {
    GLOBAL_ROUTER.push('/room/lobby');
  } else {
    GLOBAL_ROUTER.push(`/room/${roomNames[roomNames.length - 1]}`);
  }
});

module.exports = socket;
