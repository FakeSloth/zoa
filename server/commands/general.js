// @flow weak

const Rooms = require('../rooms');
const config = require('../config');

const Right = x =>
({
  // We introduce the chain function to deal with nested Eithers resulting from
  // two try/catch calls.
  chain: f => f(x), // for nested either like Right(Left(e))
  map: f => Right(f(x)),
  fold: (f, g) => g(x), // runs right where right is g
  inspect: () => `Right(${x})`
});

const Left = x =>
({
  chain: f => Left(x),
  map: f => Left(x), // ignores f
  fold: (f, g) => f(x), // runs left where left is f
  inspect: () => `Left(${x})`
});

const Either = (boolExpr, val) =>
  boolExpr ? Right(val) : Left(false);

// TODO: move to another file and merge a bunch of commands
let commands = {
  hello(target) {
    return {
      text: `Hello ${target}!`
    }
  },
  create: 'createchatroom',
  createchatroom(target, room, user) {
    const normalized = target.trim();
    return Either(normalized && normalized.length <= 20, user)
      .fold(() => ({text: 'No target or target cannot be greater than 20 characters.'}),
            user => Either(config.sysop === user.id && user.authenticated, null)
                      .fold(() => ({text: 'You don\'t have the permissions to execute this command.'}),
                            () => ({
                              text: normalized + ' room is created!',
                              sideEffect() {
                                console.log('room created!')
                                Rooms.create(normalized);
                                console.log(Rooms.list())
                              }
                            }))
           );
  }
};

module.exports = commands;
