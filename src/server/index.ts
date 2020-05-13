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
  sessionId: string;
  socket: Socket;
}

class Session extends Set<Client> {
  
}

// sessionId -> Session
const sessions = new Map<string, Session>();

function initializeSession(sessionId: string) {
  let session = sessions.get(sessionId);
  if (!session) {
    session = new Session();
    sessions.set(sessionId, session);
  }
  return session;
}

function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (session && session.size === 0) {
    sessions.delete(sessionId);
  }
}

io.on('connect', (socket) => {
  console.log('socket connected');

  const client: Client = {
    id: socket.id,
    address: undefined,
    name: undefined,
    sessionId: undefined,
    socket,
  };
  // clients connected to the same session
  let otherClients: Set<Client>;

  socket.on('disconnect', () => {
    if (client.name) {
      console.log(`disconnected ${client.name}`);
      otherClients.delete(client);
      otherClients.forEach((c) => {
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
      console.log(`#${otherClients.size} left`);
      cleanupSession(client.sessionId);
    }
  });

  socket.on('identify', ({ name, address, sessionId }, callback) => {
    console.log(`identified ${name} on ${address} for session ${sessionId}`);
    otherClients = initializeSession(sessionId);
    otherClients.forEach((c) =>
      c.socket.emit('user joined', { id: client.id, name })
    );
    const currentUsers = [...otherClients.values()].map((c) => ({
      id: c.id,
      name: c.name,
    }));
    callback(currentUsers);
    client.address = address;
    client.name = name;
    client.sessionId = sessionId;
    otherClients.add(client);
    console.log(`#${otherClients.size} connected`);
  });

  socket.on('chat message', (msg) => {
    console.log('chat message', msg);
    io.emit('chat message', msg);
  });

  socket.on('start streaming', () => {
    otherClients.forEach((other) => {
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

  socket.on('mute microphone', ({ isMuted }) => {
    otherClients.forEach((other) => {
      if (other !== client) {
        if (isMuted) {
          client.socket.emit('stop sending', {
            id: other.id,
            address: other.address,
          });
          other.socket.emit('stop receiving', {
            id: client.id,
            address: client.address,
          });
        } else {
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
      }
    });
  });
});
