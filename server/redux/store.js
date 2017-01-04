const {createStore, combineReducers} = require('redux');
const {users} = require('./users');

const reducer = combineReducers({
  users
});

const store = createStore(reducer);

module.exports = store;
