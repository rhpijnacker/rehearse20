// import express from 'express';
import http from 'http';
import socketio, { Socket } from 'socket.io';
import UdpEchoServer from './UdpEchoServer';

const echoServer = new UdpEchoServer();
echoServer.listen(50051);

// const app = express();
const server = http.createServer();
const io = socketio(server);

server.listen(3000, () => {
  console.log('listening on *:3000');
});

interface Client {
  id: string;
  address: string;
  name: string;
  socket: Socket;
}

const clients = new Set<Client>();

io.on('connect', (socket) => {
  console.log('socket connected');

  const client: Client = {
    id: socket.id,
    address: undefined,
    name: undefined,
    socket,
  };

  socket.on('disconnect', () => {
    clients.delete(client);
    console.log(`disconnected ${client.name}`);
    console.log(`#${clients.size} left`);
    clients.forEach((c) => {
      c.socket.emit('user left', { id: client.id, name: client.name });
      c.socket.emit('stop sending', {
        id: client.id,
        name: client.name,
        address: client.address,
      });
      c.socket.emit('stop receiving', {
        id: client.id,
        address: client.address,
      });
    });
  });

  socket.on('identify', ({ name, address }, callback) => {
    console.log(`identified ${name} on ${address}`);
    clients.forEach((c) =>
      c.socket.emit('user joined', { id: client.id, name })
    );
    client.address = address;
    client.name = name;
    clients.add(client);
    console.log(`#${clients.size} connected`);
    callback();
  });

  socket.on('chat message', (msg) => {
    console.log('chat message', msg);
    io.emit('chat message', msg);
  });

  socket.on('start streaming', () => {
    clients.forEach((other) => {
      if (other !== client) {
        client.socket.emit(
          'start receiving',
          { id: other.id, address: other.address },
          ({ address, port }) => {
            other.socket.emit('start sending', {
              id: client.id,
              name: client.name,
              address,
              port,
            });
          }
        );
        other.socket.emit(
          'start receiving',
          { id: client.id, address: client.address },
          ({ address, port }) => {
            client.socket.emit('start sending', {
              id: other.id,
              name: other.name,
              address,
              port,
            });
          }
        );
      }
    });
  });
});
