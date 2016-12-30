// @flow

const state = {
  allRooms: [{name: 'Lobby', id: 'lobby', userCount: 0}],
  hashColor: '#111',
  // alias for room notifications
  highlights: {},
  // rooms are the rooms that the user are currently in hence active rooms
  rooms: {
    lobby: {name: 'Lobby', id: 'lobby', users: [], log: []}
  },
  onInitialLoad: true,
  username: ''
};

module.exports = state;
