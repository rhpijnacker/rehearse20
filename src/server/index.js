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

  const self = { id: socket.id, socket };

  socket.on('disconnect', () => {
    sockets = sockets.filter((s) => s.socket !== self.socket);
    console.log(`disconnected ${self.name}`);
    console.log(`#${sockets.length} left`);
    sockets.forEach((s) => {
      s.socket.emit('chat message', `${self.name} left`);
      s.socket.emit('stop sending', {
        id: self.id,
        name: self.name,
        address: self.address,
      });
      s.socket.emit('stop receiving', {
        id: self.id,
        address: self.address,
      });
    });
  });

  socket.on('identify', ({ name, address }, callback) => {
    console.log(`identified ${name} on ${address}`);
    sockets.forEach((s) => s.socket.emit('chat mesage', `${name} joined`));
    self.address = address;
    self.name = name;
    sockets.push(self);
    console.log(`#${sockets.length} connected`);
    callback();
  });

  socket.on('chat message', (msg) => {
    console.log('chat message', msg);
    io.emit('chat message', msg);
  });

  socket.on('start streaming', () => {
    sockets
      .filter((s) => s.socket !== self.socket) // not to myself
      .forEach((other) => {
        self.socket.emit(
          'start receiving',
          { id: other.id, address: other.address },
          ({ address, port }) => {
            other.socket.emit('start sending', {
              id: self.id,
              name: self.name,
              address,
              port,
            });
          }
        );
        other.socket.emit(
          'start receiving',
          { id: self.id, address: self.address },
          ({ address, port }) => {
            self.socket.emit('start sending', {
              id: other.id,
              name: other.name,
              address,
              port,
            });
          }
        );
      });
  });
});
