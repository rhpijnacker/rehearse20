const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

let sockets = [];

io.on('connection', (socket) => {
  console.log('socket connected');

  socket.on('disconnect', () => {
    const disconnected = sockets.filter((s) => s.socket === socket)[0];
    sockets = sockets.filter((s) => s.socket !== socket);
    console.log(`disconnected ${disconnected.name}`);
    console.log(`#${sockets.length} left`);
    sockets.forEach((s) => {
      s.socket.emit('chat message', `${disconnected.name} left`);
      s.socket.emit('stop streaming', {
        name: disconnected.name,
        address: disconnected.address,
      });
    });
  });

  socket.on('identify', ({ name, address }, callback) => {
    console.log(`identified ${name} on ${address}`);
    sockets.forEach((s) => s.socket.emit('chat mesage', `${name} joined`));
    sockets.push({ name, address, socket });
    console.log(`#${sockets.length} connected`);
    callback();
  });

  socket.on('chat message', (msg) => {
    console.log('chat message', msg);
    io.emit('chat message', msg);
  });

  socket.on('start streaming', () => {
    const me = sockets.filter((s) => s.socket === socket)[0];
    sockets
      .filter((s) => s.socket !== socket) // not to myself
      .forEach((other) => {
        socket.emit('request connection', ({ address, port }) => {
          other.socket.emit('start streaming', {
            name: me.name,
            address,
            port,
          });
        });
        other.socket.emit('request connection', ({ address, port }) => {
          socket.emit('start streaming', { name: other.name, address, port });
        });
      });
  });
});
