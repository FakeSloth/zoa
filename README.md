# zoa [![Build Status](https://travis-ci.org/FakeSloth/zoa.svg?branch=master)](https://travis-ci.org/FakeSloth/zoa) [![Dependency Status](https://david-dm.org/FakeSloth/zoa.svg)](https://david-dm.org/FakeSloth/zoa) [![devDependency Status](https://david-dm.org/FakeSloth/zoa/dev-status.svg)](https://david-dm.org/FakeSloth/zoa#info=devDependencies)

A chat app with room and authentication support.

## Build Setup

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:3000
node server/server.js

# build for production with minification
npm run build

# check for errors
flow check
```

# How Authentication Works

User sends an HTTPS POST request to the server with their username and password.
This can be on the /register or /login route. The server generates a token
(json web token) and sends it back to the client for them to save in
localStorage. In addition, the server saves a token cache called auths which
confirms this user has been authenticated by logging in, registering, or having
a token. Auths is a cache and therefore reset after a server restart. When
the user wants to be added by a websocket, they send a websocket request with
their username and the server checks the database if they are in auths.

If a user already has a token from their previous session, then the user sends a
HTTPS POST request to /auth route with that token. The server verifies that
the token is valid and saves it to auths.

When a user logouts or changes names, they are deleted from auths.

If a malicious user checks/tries to send a username via sockets to the server,
it will not succeed because the server checks the database and if no one has logged in
yet then the attempt is denied. In addition, if the authed user logs out or switches names,
they will be remove from auths. If the authed user is currently on the server, the
server will deny anyone else trying to authenticate themselves as the authed user.

# License

[MIT](LICENSE)
