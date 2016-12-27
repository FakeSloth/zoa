// @flow

import socket from './socket';
import messageSchema from '../schemas/message';
import state from './state';

const Message = {
  props: ['message'],
  template: `
    <div>
      <div v-if="message.raw">
        <span>{{message.text}}</span>
      </div>
      <div v-else-if="message.html">
        <span v-html="message.text"></span>
      </div>
      <div v-else>
        <span class="nav-link font-weight-bold" v-bind:style="'color: ' + message.hashColor">{{message.username}}: </span>
        <span v-html="message.text"></span>
      </div>
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
      if (!state.username) {
        state.rooms.lobby.log.push({raw: true, text: 'Choose a username to chat.'});
        this.message = '';
        return console.error('Must have username to chat.');
      }
      if (!message) return console.error('Message cannot be blank.');
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
