import * as dgram from 'dgram';

import { unpack } from '../lib/rtppacket';

const udpSocket = dgram.createSocket('udp4');

const pendingIdentifications = new Map();

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
    console.log({ remote });
    pendingIdentifications.delete(ssrc);
    resolve(remote);
  } else {
    console.log(
      `Dropping message from ${ssrc} at ${remote.address}:${remote.port}`
    );
  }
});

export function registerIdentPromise(ssrc: number, resolve) {
  pendingIdentifications.set(ssrc, resolve);
}

export function waitForIdentPackage(ssrc: number): Promise<any> {
  return new Promise((resolve) => {
    registerIdentPromise(ssrc, resolve);
  });
}

export function bind(port) {
  udpSocket.bind(port);
}
