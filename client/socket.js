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
  console.log(1)
  state.rooms = rooms;
});

socket.on('finish add auth user', () => {
  socket.emit('user join room', 'lobby');
});

module.exports = socket;
