# zoa

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

User sends a HTTPS POST request to the server with there username and password.
This can be on the /register or /login route. The server generates a token
(json web token) and sends it back to the client for them to save it in
localStorage. In addition, the server saves a token cache called auths which
means this user has been autheticated by logging in, registering, or having
a token. Auths is a cache and therefore reset after a server restart. When
the user wants to be added by a websocket, they send a websocket request with
their username and the server checks the database if they are in auths.

If a user already has a token from their last session, then the user sends a
HTTPS POST request to /auth route with there token. The server verifies that
the token is valid and saves it to auths.

When a user logouts or changes names, they are deleted from auths.

If a malicious user checks tries to send a username via sockets to the server,
it won't work because the server checks the database and if no one has login
yet then it would fail. In addition, if the auth user logouts or switch names,
they will be remove from auths. If the auth user is currently on the server, the
server will deny anyone else trying to autheticate themselves as the auth user.

# License

[MIT](LICENSE)
