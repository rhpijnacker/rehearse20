#!/usr/bin/env node

// - bind to local port
// - send udp packets to peer with ssrc
// - recv udp packets and write them to stdout

import dgram from 'dgram';
import fs from 'fs';
import * as rtppacket from '../../lib/rtppacket';

const localPort = parseInt(process.argv[2], 10);
const remoteHost = process.argv[3];
const remotePort = parseInt(process.argv[4], 10);
const ssrc = parseInt(process.argv[5], 10);

// const file = fs.createWriteStream(`dummy_trx-${localPort}.log`);

const socket = dgram.createSocket('udp4');

socket.on('listening', () => {
  const props = socket.address();
  console.log(`Listening on ${props.address}:${props.port}`);
  // file.write(`Listening on ${props.address}:${props.port}\n`);
});

socket.on('message', (payload, remote) => {
  const packet = rtppacket.unpack(payload);
  console.log(
    `Message received from ${packet.header.ssrc} at ${remote.address}:${
      remote.port
    }: ${packet.payload.toString()}`
  );
  // file.write(
  //   `Message received from ${packet.header.ssrc} at ${remote.address}:${
  //     remote.port
  //   }: ${packet.payload.toString()}
  // \n`
  // );
});

socket.bind(localPort);

let counter = 0;
const timer = setInterval(() => {
  const payload = rtppacket.pack({
    header: { ssrc: ssrc },
    payload: Buffer.from(`Ping #${counter++}`),
  });

  // file.write(`Sending message to ${ssrc} at ${remoteHost}:${remotePort}\n`);
  socket.send(payload, remotePort, remoteHost);
}, 1000);
