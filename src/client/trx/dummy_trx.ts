#!/usr/bin/env node

// - bind to local port
// - send udp packets to peer with ssrc
// - recv udp packets and write them to stdout

import dgram from 'dgram';
import * as rtppacket from '../../lib/rtppacket';

const localPort = parseInt(process.argv[2], 10);
const remoteHost = process.argv[3];
const remotePort = parseInt(process.argv[4], 10);
const ssrc = parseInt(process.argv[5], 10);

const socket = dgram.createSocket('udp4');

socket.on('listening', () => {
  const props = socket.address();
  console.log(`Listening on ${props.address}:${props.port}`);
});

socket.on('message', (payload, remote) => {
  const packet = rtppacket.unpack(payload);
  console.log(
    `Message received from ${packet.header.ssrc} at ${remote.address}:${
      remote.port
    }: ${packet.payload.toString()}`
  );
});

socket.bind(localPort);

let counter = 0;
const timer = setInterval(() => {
  const payload = rtppacket.pack({
    header: { ssrc: ssrc },
    payload: Buffer.from(`Ping #${counter++}`),
  });
  
  socket.send(payload, remotePort, remoteHost);
}, 1000);

// socket.send(
//   Buffer.from(`udp://${remote.address}:${remote.port}`),
//   remote.port,
//   remote.address,
//   (error) => {
//     console.log(`UDP message sent to ${remote.address}:${remote.port}`);
//   }
// );
