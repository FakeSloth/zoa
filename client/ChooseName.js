// @flow

import socket from './socket';
import state from './state';

const ChooseName = {
  data() {
    return {
      name: ''
    };
  },
  template: `
    <div class="container">
      <label for="name" class="font-weight-bold">Username:</label>
      <input
        type="text"
        class="form-control"
        placeholder="Username"
        v-model="name"
        v-on:keyup.enter="chooseName"
      />
      <div class="center-block">
        <button
          class="btn btn-outline-primary btn-lg mt-1"
          v-on:click="chooseName"
        >
          Choose name
        </button>
      </div>
    </div>
  `,
  methods: {
    chooseName() {
      const username = this.name.trim();
      // add more client side error handlers here with alerts
      if (!username) return;
      socket.emit('add choose name user', username);
      this.name = '';
      this.$router.push('/room/lobby');
    }
  }
};

module.exports = ChooseName;
