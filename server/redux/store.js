const {createStore, combineReducers} = require('redux');
const {users} = require('./users');
const {rooms} = require('./rooms');

const reducer = combineReducers({
  users,
  rooms
});

const store = createStore(reducer);

module.exports = store;
