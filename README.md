# zoa

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).

# security

when verifying jwt, i check for username on server side
so need to be login so need to have password and if the hacer
already have a password the account is already compromised.

we technically expose a JWT
where gryph expose the JWT and the USERNAME
We can get the USERNAME by the JWT but we need to decode
so the hacker would need the secret code
so gryph WEAKNESS is that it exposes the
username without the hacker needing to figure out how to decode the JSONWEBTOKEN


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
