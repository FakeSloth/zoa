// @flow

const db = require('./db');
const toId = require('toid');

/* flow-include

type Request = {
  headers: Object,
  connection: Object
};
type Socket = {
  request: Request,
  userId: string
};

*/

class User {
  /* flow-include

  name: string;
  id: string;
  socket: Socket;
  ip: string;
  authenticated: bool;
  lastMessage: string;
  lastMessageTime: number;

  activeRooms: Array<string>;

  */

  constructor(name/*: string */, socket/*: Socket */, authenticated/*: bool */) {
    this.name = name;
    this.id = toId(name);
    this.socket = socket;
    this.ip = this.getIP(socket);
    this.authenticated = authenticated;
    this.lastMessage = '';
    this.lastMessageTime = Date.now();
  }

  getIP(socket/*: Socket */) /*: string */ {
    const forwarded = socket.request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded;
    } else {
      return socket.request.connection.remoteAddress;
    }
  }

  setName(name/*: string */) {
    this.name = name;
    this.id = toId(name);
  }
}

let users/*: { [key: string]: User } */ = {};

const Users = {
  create(name/*: string */, socket/*: Socket */, autheticated/*: bool */) /*: string */ {
    const user = new User(name, socket, autheticated);
    users[user.id] = user;
    socket.userId = user.id;
    return user.id;
  },

  get(name/*: string*/) /*: User */ {
    return users[toId(name)];
  },

  remove(name/*: string */) {
    delete users[toId(name)];
  },

  list() /*: Array<string> */ {
    return Object.keys(users).map(id => Users.get(id).name);
  },

  isRegistered(name/*: string */) /*: bool */ {
    if (db.users.get(toId(name))) {
      return true;
    }
    return false;
  },

  register(username/*: string */, hash/*: string */) {
    const userId = toId(username);
    db.users.set(userId, {
      username,
      userId,
      hash
    });
  },

  getHash(name/*: string */) /*: string */ {
    return db.users.get(toId(name)).hash;
  }
};

module.exports = Users;
