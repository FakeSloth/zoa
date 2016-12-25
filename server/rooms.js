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
    if (this.users.indexOf(username) >= 0) return;
    this.users.push(username);
    socket.join(this.id);
  }

  removeUser(username/*: string */, socket/*: Object */) {
    if (this.users.map(toId).indexOf(toId(username)) < 0) return;
    this.users.splice(this.users.map(toId).indexOf(toId(username)), 1);
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
      date: Date.now()
    });
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

  list() /*: Object */ {
    let r = {};
    for (let id in rooms) {
      const room = Rooms.get(id);
      r[id] = {
        id: room.id,
        name: room.name,
        users: room.users.map(name => ({name, hashColor: hashColor(name)})),
        log: room.log
      };
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
