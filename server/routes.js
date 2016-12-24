// @flow weak

const bcrypt = require('bcrypt-nodejs');
const config = require('./config');
const db = require('./db');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const toId = require('toid');
const Users = require('./users');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

router.post('/register', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.json({error: 'No username or password.'});
  }
  const username = req.body.username.trim();
  if (username.length > 19 || req.body.password.length > 150) {
    return res.json({error: 'Username or password is too long.'});
  }
  if (Users.isRegistered(username)) {
    return res.json({error: 'Someone has already registered this username.'});
  }
  bcrypt.genSalt(13, (err, salt) => {
    if (err) return res.json({error: 'Salt failed.'});
    bcrypt.hash(req.body.password, salt, null, (err, hash) => {
      if (err) return res.json({error: 'Hash failed.'});
      console.log('yo')
      Users.register(username, hash);
      const token = jwt.sign({username}, config.jwtSecret, {expiresIn: '1d'});
      console.log(token);
      db.auths.set(toId(username), true);
      res.json({token});
    });
  });
});

router.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.json({error: 'No username or password.'});
  }
  const username = req.body.username.trim();
  const userId = toId(username);
  if (username.length > 19 || req.body.password.length > 150) {
    return res.json({error: 'Username or password is too long.'});
  }
  if (!Users.isRegistered(username)) {
    return res.json({error: 'Username is not registered.'});
  }
  const hash = Users.getHash(username);
  bcrypt.compare(req.body.password, hash, (err, isMatch) => {
    if (err) return res.json({error: 'Compare failed.'});
    if (!isMatch) return res.json({error: 'Invalid password.'});
    const token = jwt.sign({username}, config.jwtSecret, {expiresIn: '1d'});
    db.auths.set(toId(username), true);
    res.json({token});
  });
});

router.post('/auth', (req, res) => {
  if (!req.body.token) return res.json({error: 'No token.'});
  jwt.verify(req.body.token, config.jwtSecret, (err, decoded) => {
    if (err || !decoded.username) return res.json({error: 'Invalid token.'});
    db.auths.set(toId(decoded.username), true);
    res.json({username: decoded.username});
  });
});

module.exports = router;
