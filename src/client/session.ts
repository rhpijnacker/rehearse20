import * as io from 'socket.io-client';
import { TrxStreamer } from './TrxStreamer';
import { UdpEchoClient } from './UdpEchoClient';

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';
const SOCKET_SERVER = 'http://rehearse20.sijben.dev:3000';

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
const startPort = 51350;

const getExternalPort = async (localPort) => {
  const client = new UdpEchoClient();
  const { address, port } = await client.echo(localPort, ECHO_SERVER);
  // Assume straight port-maps for now
  return { address, localPort };
  // return { address, port };
};

let nextFreePort = startPort;
const getFreePort = async () => {
  const client = new UdpEchoClient();
  const port = nextFreePort;
  let externalPort = 0;
  while (!externalPort) {
    nextFreePort = nextFreePort + 2; // RPT uses the +1 port too
    try {
      const remote = await client.echo(port, ECHO_SERVER);
      return {
        local: { port },
        remote: remote,
      };
    } catch (error) {
      console.log(`Could not external port for :${port}`);
    }
  }
};

const socket = io(SOCKET_SERVER);
const streamer = new TrxStreamer();

socket.on('connect', async () => {
  console.log('connected');
  const randomPort = 54321;
  const { address } = await getExternalPort(randomPort);
  socket.emit('identify', { name, address }, () => {
    socket.emit('start streaming');
  });
});

socket.on('disconnect', () => {
  console.log('disconnected');
  streamer.stop();
});

socket.on('chat message', (msg) => console.log('message:', msg));

socket.on('start receiving', async ({ id, address }, callback) => {
  const info = await getFreePort();
  callback(info.remote);
  console.log(
    `starting to recv from ${id} at ${address} on ${info.remote.address}:${info.remote.port}/${info.local.port}`
  );
  streamer.startReceiving(id, 'localhost', info.local.port);
});

socket.on('stop receiving', ({ id, address }) => {
  console.log(`stop recving from ${id} at ${address}`);
  streamer.stopReceiving(id, address);
});

socket.on('start sending', ({ id, address, port }) => {
  console.log(`starting to send to ${id} on ${address}:${port}`);
  streamer.startSending(id, address, port);
});

socket.on('stop sending', ({ id, address }) => {
  console.log(`stop sending to ${id} on ${address}`);
  streamer.stopSending(id, address);
});