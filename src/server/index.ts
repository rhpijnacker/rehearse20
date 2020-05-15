// import express from 'express';
import http from 'http';
import socketio, { Socket } from 'socket.io';
import * as dgram from 'dgram';

import Session, { Client } from './Session';
import SessionManager from './SessionManager';
import { unpack } from '../lib/rtppacket';

const rtpIdentPort = 50051;
const serverId = 'server';
const serverAddress = 'rehearse20.sijben.dev';
// const serverAddress = '192.168.2.6';

// const app = express();
const server = http.createServer();
const io = socketio(server);

server.listen(3000, () => {
  console.log('listening on *:3000');
});

const pendingIdentifications = new Map();

const udpSocket = dgram.createSocket('udp4');

udpSocket.on('listening', () => {
  const props = udpSocket.address();
  console.log(`Listening on ${props.address}:${props.port}`);
});

udpSocket.on('message', (payload, remote) => {
  const packet = unpack(payload);
  const ssrc = packet.header.ssrc;
  console.log(
    `Message received from ${ssrc} at ${remote.address}:${
      remote.port
    }: ${packet.payload.toString()}`
  );
  const resolve = pendingIdentifications.get(ssrc);
  if (resolve) {
    console.log(`Identified ${ssrc} at ${remote.address}:${remote.port}`);
    pendingIdentifications.delete(ssrc);
    resolve(remote);
  } else {
    console.log(
      `Dropping message from ${ssrc} at ${remote.address}:${remote.port}`
    );
  }
});

udpSocket.bind(rtpIdentPort);

function registerIdentPromise(ssrc: number, resolve) {
  pendingIdentifications.set(ssrc, resolve);
}

function waitForIdentPackage(ssrc: number): Promise<any> {
  return new Promise((resolve) => {
    registerIdentPromise(ssrc, resolve);
  });
}

io.on('connect', (socket) => {
  console.log('socket connected');

  // session this client is connected to
  let session: Session;
  const client: Client = {
    id: socket.id,
    address: undefined,
    name: undefined,
    sessionId: undefined,
    socket,
  };

  socket.on('disconnect', () => {
    if (client.name) {
      console.log(`disconnected ${client.name}`);
      session.delete(client);
      session.forEach((c) => {
        c.socket.emit('user left', { id: client.id, name: client.name });
        c.socket.emit('stop sending', {
          id: client.id,
        });
      });
      console.log(`#${session.size} left`);
      SessionManager.cleanupSession(client.sessionId);
    }
  });

  socket.on('identify', ({ name, sessionId }, callback) => {
    console.log(`identified ${name} for session ${sessionId}`);
    session = SessionManager.initializeSession(sessionId);
    session.forEach((c) =>
      c.socket.emit('user joined', { id: client.id, name })
    );
    const currentUsers = [...session.values()].map((c) => ({
      id: c.id,
      name: c.name,
    }));
    callback(currentUsers);
    client.name = name;
    client.sessionId = sessionId;
    session.add(client);
    console.log(`#${session.size} connected`);
  });

  socket.on('chat message', (msg) => {
    console.log('chat message', msg);
    io.emit('chat message', msg);
  });

  socket.on('start streaming', () => {
    session.forEach(async (other) => {
      if (other !== client) {
        const clientSsrc = session.getSsrc();
        client.socket.emit('start sending', {
          id: serverId,
          address: serverAddress,
          port: rtpIdentPort,
          ssrc: clientSsrc,
        });
        const otherSsrc = session.getSsrc();
        other.socket.emit('start sending', {
          id: serverId,
          address: serverAddress,
          port: rtpIdentPort,
          ssrc: otherSsrc,
        });
        const [clientHostPort, otherHostPort] = await Promise.all([
          waitForIdentPackage(clientSsrc).then((result) => {
            client.socket.emit('stop sending', { id: serverId });
            return result;
          }),
          waitForIdentPackage(otherSsrc).then((result) => {
            other.socket.emit('stop sending', { id: serverId });
            return result;
          }),
        ]);
        console.log('!!! Identified both parties');

        console.log('client start sending', {
          id: other.id,
          name: other.name,
          address: otherHostPort.address,
          port: otherHostPort.port,
          ssrc: clientSsrc,
        });
        client.socket.emit('start sending', {
          id: other.id,
          name: other.name,
          address: otherHostPort.address,
          port: otherHostPort.port,
          ssrc: clientSsrc,
        });
        other.socket.emit('start sending', {
          id: client.id,
          name: client.name,
          address: clientHostPort.address,
          port: clientHostPort.port,
          ssrc: otherSsrc,
        });
      }
    });
  });

  socket.on('mute microphone', ({ isMuted }) => {
    session.forEach((other) => {
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
