// @flow

import io from 'socket.io-client';
import Vue from 'vue';
import state from './state';
import messageSchema from '../schemas/message';

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

socket.on('load rooms', (rooms) => {
  state.rooms = rooms;
});

socket.on('load room', (room) => {
  Vue.set(state.rooms, room.id, room)
});

socket.on('load room userlist', (room) => {
  Vue.set(state.rooms[room.id], 'users', room.users);
});

socket.on('finish add auth user', () => {
  socket.emit('user join room', 'lobby');
});

socket.on('add log', (message) => {
  const room = state.rooms[message.room];
  if (!room) return console.error('add log: room does not exist');
  room.log.push(message);
});

module.exports = socket;
