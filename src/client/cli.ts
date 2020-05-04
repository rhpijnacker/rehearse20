import io from 'socket.io-client';
import TrxStreamer from './TrxStreamer';
import UdpEchoClient from './UdpEchoClient';
import { Socket } from 'socket.io';

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';
const SOCKET_SERVER = 'http://rehearse20.sijben.dev:3000';

const name = process.argv[2] || 'John Doe';
const sessionId = process.argv[3] || 'default';
const startPort = parseInt(process.argv[4] || '51350', 10);

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
let session: Socket;
const streamer = new TrxStreamer();

socket.on('connect', () => {
  console.log('joining session', sessionId);
  socket.emit('join session', sessionId, () => {
    console.log('joined session', sessionId);
    session = io(`${SOCKET_SERVER}/${sessionId}`);

    session.on('connect', async () => {
      console.log('connected');
      const randomPort = 54321;
      const { address } = await getExternalPort(randomPort);
      session.emit('identify', { name, address }, () => {
        session.emit('start streaming');
      });
    });

    session.on('disconnect', () => {
      console.log('disconnected');
      streamer.stop();
    });

    session.on('chat message', (msg) => console.log('message:', msg));

    session.on('start receiving', async ({ id, address }, callback) => {
      const info = await getFreePort();
      callback(info.remote);
      console.log(
        `starting to recv from ${id} at ${address} on ${info.remote.address}:${info.remote.port}/${info.local.port}`
      );
      streamer.startReceiving(id, 'localhost', info.local.port);
    });

    session.on('stop receiving', ({ id, address }) => {
      console.log(`stop recving from ${id} at ${address}`);
      streamer.stopReceiving(id, address);
    });

    session.on('start sending', ({ id, address, port }) => {
      console.log(`starting to send to ${id} on ${address}:${port}`);
      streamer.startSending(id, address, port);
    });

    session.on('stop sending', ({ id, address }) => {
      console.log(`stop sending to ${id} on ${address}`);
      streamer.stopSending(id, address);
    });
  });
});
