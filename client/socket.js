// @flow

import io from 'socket.io-client';
import Vue from 'vue';
import state from './state';
import messageSchema from '../schemas/message';
import {forEach, isEqual, unionWith} from 'lodash';

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
  forEach(rooms, (room, roomName) => {
    const localRoom = state.rooms[roomName];
    if (localRoom) {
      rooms[roomName].log = unionWith(state.rooms[roomName].log, room.log, isEqual);
    }
  });
  state.rooms = rooms;
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
