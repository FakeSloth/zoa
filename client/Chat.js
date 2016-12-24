// @flow

import socket from './socket';
import messageSchema from '../schemas/message';
import state from './state';

const Message = {
  props: ['message'],
  template: `
    <div>
      <span class="nav-link font-weight-bold" v-bind:style="'color: ' + message.hashColor">{{message.username}}: </span>
      {{message.text}}
    </div>
  `
};

const MessageList = {
  props: ['messages'],
  components: {
    Message
  },
  template: `
    <div class="message-list">
      <div v-for="message in messages">
        <Message v-bind:message="message" />
      </div>
    </div>
  `,
  updated() {
    this.$el.scrollTop = this.$el.scrollHeight;
  }
};

const Chat = {
  props: ['messageList'],
  data() {
    return {
      message: ''
    };
  },
  components: {
    MessageList
  },
  template: `
    <div class="col-sm-10">
      <MessageList v-bind:messages="messageList" />
      <input
        type="text"
        class="form-control"
        v-model="message"
        v-on:keyup.enter="createMessage"
      />
    </div>
  `,
  methods: {
    createMessage() {
      const message = this.message.trim();
      const roomName = this.$route.params.id || this.$route.name;
      if (!state.username || !message) return;
      if (message.length > 300) return;
      socket.emit('chat message', messageSchema.encode({
        username: state.username,
        room: roomName,
        text: message
      }));
      this.message = '';
    }
  }
};

module.exports = Chat;
