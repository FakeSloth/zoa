// @flow

const toId = require('toid');
const hashColor = require('./hashColor');

class Room {
  /* flow-include

  name: string;
  id: string;
  users: Array<string>;
  log: Array<Object>;
  hasSticky: bool;
  sticky: Object;

  */

  constructor(name/*: string */) {
    this.name = name;
    this.id = toId(name);
    this.users = [];
    this.log = [];
    this.hasSticky = false;
    this.sticky = {};
  }

  setName(name/*: string */) {
    this.name = name;
    this.id = toId(name);
  }

  hasUser(username/*: string */) {
    return this.users.map(toId).indexOf(toId(username)) >= 0;
  }

  addUser(username/*: string */, socket/*: Object */) {
    const index = this.users.map(toId).indexOf(toId(username));
    if (index >= 0) return;
    this.users.push(username);
    socket.join(this.id);
  }

  removeUser(username/*: string */, socket/*: Object */) {
    const index = this.users.map(toId).indexOf(toId(username));
    if (index < 0) return;
    this.users.splice(index, 1);
    socket.leave(this.id);
  }

  add(message/*: Object */) {
    if (this.log.length === 100) {
      this.log.shift();
    }
    this.log.push(message);
  }

  addMessage(message/*: Object */) {
    this.add({
      username: message.username,
      hashColor: hashColor(toId(message.username)),
      text: message.text,
      originalText: message.originalText,
      date: Date.now()
    });
  }

  data() {
    return {
      id: this.id,
      name: this.name,
      users: this.users.map(name => ({name, hashColor: hashColor(name)})),
      log: this.log,
      hasSticky: this.hasSticky,
      sticky: this.sticky
    };
  }

  peek() {
    return this.log[this.log.length - 1];
  }
}

let rooms/*: { [key: string]: Room } */ = {};

const Rooms = {
  create(name/*: string */) {
    const room = new Room(name);
    rooms[room.id] = room;
  },

  get(name/*: string*/) /*: Room */ {
    return rooms[toId(name)];
  },

  remove(name/*: string */) {
    delete rooms[toId(name)];
  },

  list(activeRooms/*:? Object */) /*: Object */ {
    const choosenRooms = activeRooms ? activeRooms: rooms;
    let r = {};
    for (let id in choosenRooms) {
      const room = Rooms.get(id);
      r[id] = room.data();
    }
    return r;
  },

  listAll() {
    let r = [];
    for (let id in rooms) {
      const room = rooms[id];
      r.push({id: room.id, name: room.name, userCount: room.users.length});
    }
    return r;
  },

  removeUser(userId/*: string */, socket/*: Object */) {
    for (let id in rooms) {
      rooms[id].removeUser(userId, socket);
    }
  }
};

Rooms.create('Lobby');
Rooms.create('Staff');

module.exports = Rooms;
