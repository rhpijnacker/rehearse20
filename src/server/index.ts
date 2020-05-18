// import express from 'express';
import http from 'http';
import socketio, { Socket } from 'socket.io';

import ClientConnection from './ClientConnection';
import * as constants from './constants';
import * as rtpPortIdentifier from './rtpPortIdentifier';

// const app = express();
const server = http.createServer();
const io = socketio(server);

server.listen(constants.HTTP_PORT, () => {
  console.log(`listening on *:${constants.HTTP_PORT}`);
});

rtpPortIdentifier.bind(constants.IDENT_PORT);

io.on('connect', (socket) => {
  console.log('socket connected');

  new ClientConnection(socket);

  // socket.on('chat message', (msg) => {
  //   console.log('chat message', msg);
  //   io.emit('chat message', msg);
  // });

  // socket.on('mute microphone', ({ isMuted }) => {
  //   session.forEach((other) => {
  //     if (other !== client) {
  //       if (isMuted) {
  //         client.socket.emit('stop sending', {
  //           id: other.id,
  //           address: other.address,
  //         });
  //         other.socket.emit('stop receiving', {
  //           id: client.id,
  //           address: client.address,
  //         });
  //       } else {
  //         other.socket.emit(
  //           'start receiving',
  //           { id: client.id, address: client.address },
  //           ({ address, port }) => {
  //             client.socket.emit('start sending', {
  //               id: other.id,
  //               name: other.name,
  //               address,
  //               port,
  //             });
  //           }
  //         );
  //       }
  //     }
  //   });
  // });
});
