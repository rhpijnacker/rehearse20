import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import http from 'http';
import { dirname, resolve } from 'path';
import socketio from 'socket.io';

import ClientConnection from './ClientConnection';
import * as constants from './constants';
import * as rtpPortIdentifier from './rtpPortIdentifier';

const app = express();
const server = new http.Server(app);
const io = socketio(server);

server.listen(constants.HTTP_PORT, () => {
  console.log(`listening on *:${constants.HTTP_PORT}`);
});

rtpPortIdentifier.bind(constants.IDENT_PORT);

app.use(bodyParser.raw());
app.post('/save/:filename', (req, res) => {
  const remoteAddress = req.connection.remoteAddress;
  const filename = req.params.filename;
  const path = resolve('.', 'saved', remoteAddress, filename);
  fs.mkdirSync(dirname(path), { recursive: true });
  fs.writeFile(path, req.body, (err) => {
    console.log({ path, err });
    if (err) {
      res.statusCode = 404;
    }
    res.end();
  });
});

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
