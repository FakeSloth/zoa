// @flow

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const demFeels = require('dem-feels');
const {SET_LAST_MESSAGE, SET_LAST_MESSAGE_TIME} = require('./redux/users');

const MAX_MESSAGE_LENGTH = 300;
const MESSAGE_COOLDOWN = 400;
const SAME_MESSAGE_COOLDOWN = 5 * 60 * 1000;
const VALID_COMMAND_TOKENS = '/';

function loadCommands() {
  let cmds = {};
  for (let file of fs.readdirSync(path.resolve(__dirname, 'commands'))) {
    if (file.substr(-3) !== '.js') continue;
    Object.assign(cmds, require('./commands/' + file));
  }
  return cmds;
}

const commands = loadCommands();

function parseSchema(object/*: Object */) {
  return {
    username: object.username,
    room: object.room,
    text: object.text,
    raw: object.raw,
    private: object.private,
    date: object.date,
    sideEffect: object.sideEffect
  };
}

function parse(messageObject/*: Object */, room/*: Object */, user/*: Object */, store/*: Object */) /*: Object */ {
  function sendReply(text) {
    return {raw: true, private: true, date: Date.now(), text, room: room.get('id')};
  }

  const diff = Date.now() - user.get('lastMessageTime');
  if (diff < MESSAGE_COOLDOWN) {
    return sendReply('Your message was not sent because you have sented too many messages.');
  }
  store.dispatch({type: SET_LAST_MESSAGE_TIME, userId: user.get('id'), date: Date.now()});

  let message = messageObject.text.trim();

  if (!message || !message.length) {
    return sendReply('Your message cannot be blank.');
  }

  let cmd = '', target = '', cmdToken = '';

  const isValidCmdToken = VALID_COMMAND_TOKENS.includes(message.charAt(0));
  const isEscapedCmd = message.charAt(1) === message.charAt(0);

  if (isValidCmdToken && !isEscapedCmd) {
    cmdToken = message.charAt(0);
    let spaceIndex = message.indexOf(' ');
    if (spaceIndex > 0) {
      cmd = message.substr(1, spaceIndex - 1).toLowerCase();
      target = message.substr(spaceIndex + 1);
    } else {
      cmd = message.substr(1).toLowerCase();
      target = '';
    }
  }

  let commandHandler = commands[cmd];
  if (commandHandler) {
    if (typeof commandHandler === 'string') {
      commandHandler = commands[commandHandler];
    }
    return commandHandler(target, room, user,  store);
  } else if (cmdToken) {
    return sendReply('The command \'' + cmdToken + cmd + '\' was unrecognized. To send a message starting with \'' + cmdToken + cmd + '\', type \'' + cmdToken.repeat(2) + cmd + '\'.');
  } else if (isValidCmdToken && isEscapedCmd) {
    message = message.substr(1);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return sendReply('Your message cannot be greater than ' + MAX_MESSAGE_LENGTH + 'characters.');
  }

  if (/[\u239b-\u23b9]/.test(message)) {
    return sendReply('Your message contains banned characters.');
  }

  const normalized = message.trim();
  if ((normalized === user.get('lastMessage')) && diff < SAME_MESSAGE_COOLDOWN) {
    return sendReply('You can\'t send the same message again so soon.');
  }
  store.dispatch({type: SET_LAST_MESSAGE, userId: user.get('id'), message: normalized});

  return {userMessage: markup(normalized), originalText: normalized};
};

function markup(message) {
  const chained =
    // escape html
    _.escape(message)

    // remove zalgo
    .replace(/[\u0300-\u036f\u0483-\u0489\u0610-\u0615\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{3,}/g, '')
    .replace(/[\u239b-\u23b9]/g, '')

    // ``code``
    .replace(/\`\`([^< ](?:[^<`]*?[^< ])??)\`\`/g, '<code>$1</code>')

    // __italics__
    .replace(/\_\_([^< ](?:[^<]*?[^< ])??)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>')

    // **bold**
    .replace(/\*\*([^< ](?:[^<]*?[^< ])??)\*\*/g, '<b>$1</b>')

    // linking of URIs
    .replace(/(https?\:\/\/[a-z0-9-.]+(\/([^\s]*[^\s?.,])?)?|[a-z0-9]([a-z0-9-\.]*[a-z0-9])?\.(com|org|net|edu|tk|us|io|me)((\/([^\s]*[^\s?.,])?)?|\b))/ig, '<a href="$1" target="_blank">$1</a>')
    .replace(/<a href="([a-z]*[^a-z:])/g, '<a href="http://$1').replace(/(\bgoogle ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&q=$2" target="_blank">$1</a>')
    .replace(/(\bgl ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$2" target="_blank">$1</a>')
    .replace(/(\bwiki ?\[([^\]<]+)\])/ig, '<a href="http://en.wikipedia.org/w/index.php?title=Special:Search&search=$2" target="_blank">$1</a>')
    .replace(/\[\[([^< ]([^<`]*?[^< ])?)\]\]/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$1" target="_blank">$1</a>');

  return demFeels(chained);
}


const CommandParser = {parse};

module.exports = CommandParser;
