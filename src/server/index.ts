import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import Session from './Session';
import UdpEchoServer from './UdpEchoServer';

const echoServer = new UdpEchoServer();
echoServer.listen(50051);

const app = express();
const server = http.createServer();
const io = socketio(server);

server.listen(3000, () => {
  console.log('listening on *:3000');
});

const sessions = new Map();

io.on('connect', (socket) => {
  console.log('socket connected');

  socket.on('join session', (sessionId, callback) => {
    let session = sessions.get(sessionId);
    if (!session) {
      session = new Session(sessionId, io);
      sessions.set(sessionId, session);
    }
    callback();
  });

  socket.on('disconnect', () => {
    console.log(`socket disconnected`);
    setTimeout(cleanup, 0);
  });
});

const cleanup = () => {
  sessions.forEach((session, sessionId) => {
    if (session.isIdle()) {
      sessions.delete(sessionId);
    }
  });
  console.log(`#${sessions.size} sessions left`);
};
