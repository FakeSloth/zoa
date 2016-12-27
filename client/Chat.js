// @flow

import ms from 'ms';
import socket from './socket';
import messageSchema from '../schemas/message';
import state from './state';

const Message = {
  props: ['message'],
  data() {
    return {title: ''};
  },
  template: `
    <div v-on:mouseover="fromNow" v-bind:title="title">
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
  `,
  methods: {
    fromNow() {
      this.title = ms(Date.now() - this.message.date, { long: true }) + ' ago';
    }
  }
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
      message: '',
      negativeIndex: 1,
      isShifting: false
    };
  },
  components: {
    MessageList
  },
  template: `
    <div class="col-sm-10">
      <MessageList v-bind:messages="messageList" />
      <textarea
        rows="1"
        autocomplete="off"
        class="form-control textbox"
        v-model="message"
        v-on:keyup.shift.enter="shifting"
        v-on:keyup.enter="createMessage"
        v-on:keyup.up="pastMessage(1)"
        v-on:keyup.down="pastMessage(-1)"
      />
    </div>
  `,
  methods: {
    shifting() {
      this.isShifting = true;
      setTimeout(() => this.isShifting = false, 150);
    },
    createMessage() {
      if (this.isShifting) return;
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
      this.negativeIndex = 1;
    },
    pastMessage(num /*: number */) {
      const filtered = this.messageList.filter(m => m.username === state.username);
      const index = filtered.length - this.negativeIndex;
      const message = filtered[index];
      if (!message) return;
      this.message = message.originalText;
      this.negativeIndex += num;
    }
  }
};

module.exports = Chat;
