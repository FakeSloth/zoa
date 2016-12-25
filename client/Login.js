// @flow

import axios from 'axios';
import socket from './socket';

const Login = {
  data() {
    return {
      username: '',
      password: ''
    };
  },
  template: `
    <div class="container">
      <input
        type="text"
        class="form-control mt-1"
        placeholder="Username"
        v-model="username"
      />
      <input
        type="password"
        class="form-control mt-1"
        placeholder="Password"
        v-model="password"
      />
      <div class="center-block">
        <button
          class="btn btn-outline-info btn-lg mt-1"
          v-on:click="auth('/register')"
        >
          Register
        </button>
        <button
          class="btn btn-outline-primary btn-lg mt-1"
          v-on:click="auth('/login')"
        >
          Login
        </button>
      </div>
    </div>
  `,
  methods: {
    auth(route/*: string */) {
      if (!this.username && !this.password) return;
      const self = this;
      axios.post(route, {
        username: this.username,
        password: this.password
      }).then(function (response) {
        if (response.data.token) {
          localStorage.setItem('zoa-token', response.data.token);
          socket.emit('add auth user', self.username);
          self.username = '';
          self.password = '';
          self.$router.push('/room/lobby');
        } else {
          console.error(response.data.error);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    }
  }
};

module.exports = Login;
