// @flow

const toId = require('toid');
const hashColor = require('./hashColor');

class Room {
  /* flow-include

  name: string;
  id: string;
  users: Array<string>;
  log: Array<Object>;

  */

  constructor(name/*: string */) {
    this.name = name;
    this.id = toId(name);
    this.users = [];
    this.log = [];
  }

  setName(name/*: string */) {
    this.name = name;
    this.id = toId(name);
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

  addMessage(message/*: Object */, htmlUser/*: bool */) {
    this.add({
      username: message.username,
      hashColor: hashColor(toId(message.username)),
      text: message.text,
      date: Date.now(),
      htmlUser: htmlUser
    });
  }

  data() {
    return {
      id: this.id,
      name: this.name,
      users: this.users.map(name => ({name, hashColor: hashColor(name)})),
      log: this.log
    };
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

  removeUser(userId/*: string */, socket/*: Object */) {
    for (let id in rooms) {
      rooms[id].removeUser(userId, socket);
    }
  }
};

Rooms.create('Lobby');
Rooms.create('Staff');

module.exports = Rooms;
