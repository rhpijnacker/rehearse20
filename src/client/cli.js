const child_process = require('child_process');
const io = require('socket.io-client');
const UdpEchoClient = require('./UdpEchoClient');

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';

const name = process.argv[2] || 'John Doe';
const startPort = parseInt(process.argv[3] || 51350, 10);

const getExternalPort = async (localPort) => {
  const client = new UdpEchoClient();
  const { address, port } = await client.echo(localPort, ECHO_SERVER);
  return { address, port };
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

const socket = io(`http://rehearse20.sijben.dev:3000`);

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
});

socket.on('chat message', (msg) => console.log('message:', msg));

socket.on('start receiving', async ({ id, address }, callback) => {
  const info = await getFreePort();
  callback(info.remote);
  console.log(
    `starting to recv from ${id} at ${address} on ${info.remote.address}:${info.remote.port}/${info.local.port}`
  );
  console.log('python3', [
    `${__dirname}/trx/rx.py`,
    'localhost',
    info.local.port,
  ]);
  const child = child_process.spawn('python3', [
    `${__dirname}/trx/rx.py`,
    'localhost',
    info.local.port,
  ]);
  child.on('close', (code) => {
    console.log(`rx.py exited with code ${code}`);
  });
});

socket.on('stop receiving', ({ id, address }) => {
  console.log(`stop recving from ${id} at ${address}`);
});

socket.on('start sending', ({ id, address, port }) => {
  console.log(`starting to send to ${id} on ${address}:${port}`);
  console.log('python3', [`${__dirname}/trx/tx.py`, address, port]);
  const child = child_process.spawn('python3', [
    `${__dirname}/trx/tx.py`,
    address,
    port,
  ]);
  child.on('close', (code) => {
    console.log(`tx.py exited with code ${code}`);
  });
});

socket.on('stop sending', ({ id, address }) => {
  console.log(`stop sending to ${id} on ${address}`);
});
