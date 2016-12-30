// @flow

import Vue from 'vue';
import state from './state';
import axios from 'axios';
import socket from './socket';
import router from './router';

const token = localStorage.getItem('zoa-token');
if (token) {
  axios.post('/auth', {token})
    .then(function (response) {
      if (response.data.username) {
        state.username = response.data.username;
        socket.emit('add auth user', response.data.username);
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

new Vue({
  data: state,
  router,
  template: `
  <div>
    <nav class="navbar navbar-light bg-faded">
      <router-link to="/" class="navbar-brand">zoa</router-link>
      <ul class="nav navbar-nav">
        <li class="nav-item" v-for="room in rooms">
          <router-link class="nav-link" v-bind:to="'/room/' + room.id">
            <span v-if="$route.params.id == room.id || $route.name == room.id" class="font-weight-bold">{{room.name}}</span>
            <span v-else-if="highlights[room.id]" class="text-warning">{{room.name}}</span>
            <span v-else>{{room.name}}</span>
          </router-link>
        </li>
      </ul>
      <ul class="nav navbar-nav float-xs-right" v-if="!username">
        <li class="nav-item" title="View all rooms">
          <router-link to="/rooms" class="nav-link">+</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/choose-name" class="nav-link">Choose name</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/login" class="nav-link">Login</router-link>
        </li>
      </ul>
      <ul class="nav navbar-nav float-xs-right" v-else>
        <li class="nav-item" title="View all rooms">
          <router-link to="/rooms" class="nav-link">+</router-link>
        </li>
        <li class="nav-item">
          <div class="dropdown">
            <span class="nav-link font-weight-bold" v-bind:style="'color: ' + hashColor">{{username}}</span>
            <ul class="dropdown-menu">
              <li v-on:click="handleLogout('/choose-name')">Change Name</li>
              <li><router-link to="/settings">Settings</router-link></li>
              <li v-on:click="handleLogout('/login')">Logout</li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
    <router-view v-bind:rooms="rooms" v-bind:allRooms="allRooms"></router-view>
  </div>
  `,
  methods: {
    handleLogout(route) {
      router.push(route);
      localStorage.removeItem('zoa-token');
      socket.emit('remove user');
      state.username = '';
    }
  }
}).$mount('#app');
