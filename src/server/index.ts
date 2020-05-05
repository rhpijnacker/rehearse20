import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import UdpEchoServer from './UdpEchoServer';

const echoServer = new UdpEchoServer();
echoServer.listen(50051);

const app = express();
const server = http.createServer();
const io = socketio(server);

server.listen(3000, () => {
  console.log('listening on *:3000');
});

let sockets = [];

io.on('connect', (socket) => {
  console.log('socket connected');

  const self = { id: socket.id, address: undefined, name: undefined, socket };

  socket.on('disconnect', () => {
    sockets = sockets.filter((s) => s.socket !== self.socket);
    console.log(`disconnected ${self.name}`);
    console.log(`#${sockets.length} left`);
    sockets.forEach((s) => {
      s.socket.emit('user left', { id: self.id, name: self.name });
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
    sockets.forEach((s) => s.socket.emit('user joined', { id: self.id, name }));
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
