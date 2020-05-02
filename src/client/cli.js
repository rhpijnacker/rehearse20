const child_process = require('child_process');
const io = require('socket.io-client');
const UdpEchoClient = require('./UdpEchoClient');

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';

const name = process.argv[2] || 'John Doe';
const startPort = parseInt(process.argv[3] || 51350, 10);

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

const socket = io(`http://rehearse20.sijben.dev:3000`);

// { <id>: { rx: <ChildProcess>, tx: <ChildProcess> }, ... }
let streamers = {};

const cleanup = () => {
  const ids = Object.keys(streamers).filter((id) => {
    const streams = streamers[id];
    return streams.rx || streams.tx;
  });
  streamers = ids.reduce((accum, id) => {
    accum[id] = streamers[id];
    return accum;
  }, {});
};

let rx, tx;
const streamingTech = 'trx';
if (streamingTech === 'trx') {
  rx = (address, port) => {
    console.log(`${__dirname}/trx/rx`, ['-m', 2, '-j', 4, '-p', port]);
    return child_process.spawn(`${__dirname}/trx/rx`, [
      '-m',
      2,
      '-j',
      4,
      '-p',
      port,
    ]);
  };
  tx = (address, port) => {
    console.log(`${__dirname}/trx/tx`, ['-m', 2, '-j', 4, '-p', port]);
    return child_process.spawn(`${__dirname}/trx/tx`, [
      '-c',
      1,
      '-m',
      2,
      '-h',
      address,
      '-p',
      port,
    ]);
  };
} else if (streamingTech === 'gst-python') {
  rx = (address, port) => {
    console.log('python3', [`${__dirname}/trx/rx.py`, address, port]);
    return child_process.spawn('python3', [
      `${__dirname}/trx/rx.py`,
      address,
      port,
    ]);
  };
  tx = (address, port) => {
    console.log('python3', [`${__dirname}/trx/tx.py`, address, port]);
    return child_process.spawn('python3', [
      `${__dirname}/trx/tx.py`,
      address,
      port,
    ]);
  };
}

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
  const child = rx('localhost', info.local.port);
  streamers[id] = { rx: child, ...streamers[id] };
  console.log(streamers);
  child.on('close', (code) => {
    console.log(`rx exited with code ${code}`);
    streamers[id].rx = undefined;
    cleanup();
    console.log(streamers);
  });
});

socket.on('stop receiving', ({ id, address }) => {
  console.log(`stop recving from ${id} at ${address}`);
  const child = streamers[id].rx;
  if (child) {
    child.kill();
  } else {
    console.log('??? No rx child?');
  }
});

socket.on('start sending', ({ id, address, port }) => {
  console.log(`starting to send to ${id} on ${address}:${port}`);
  const child = tx(address, port);
  streamers[id] = { tx: child, ...streamers[id] };
  console.log(streamers);
  child.on('close', (code) => {
    console.log(`tx exited with code ${code}`);
    streamers[id].tx = undefined;
    cleanup();
    console.log(streamers);
  });
});

socket.on('stop sending', ({ id, address }) => {
  console.log(`stop sending to ${id} on ${address}`);
  const child = streamers[id].tx;
  if (child) {
    child.kill();
  } else {
    console.log('??? No tx child?');
  }
});
