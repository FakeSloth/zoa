// @flow

import Vue from 'vue';
import VueRouter from 'vue-router'
import Room from './Room';
import ChooseName from './ChooseName';
import Login from './Login';
import RoomList from './RoomList';

Vue.use(VueRouter);

const routes = [
  { path: '/room/lobby', component: Room, alias: '/', name: 'lobby' },
  { path: '/choose-name', component: ChooseName },
  { path: '/login', component: Login },
  { path: '/room/:id', component: Room },
  { path: '/rooms', component: RoomList }
];

const router = new VueRouter({
  routes
});
global.GLOBAL_ROUTER = router;

module.exports = router;
