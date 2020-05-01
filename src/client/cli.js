const child_process = require('child_process');
const io = require('socket.io-client');
const stun = require('stun');

const getExternalPort = async () => {
  const STUN_SERVER = 'stun.l.google.com:19302';
  const result = await stun.request(STUN_SERVER);
  const xorAddress = result.getXorAddress();
  console.log(result);
  xorAddress.address = '127.0.0.1';
  return { address: xorAddress.address, port: xorAddress.port };
};

const name = process.argv[2] || 'John Doe';
const socket = io(`http://localhost:3000`);

socket.on('connect', async () => {
  console.log('connected');
  const { address } = await getExternalPort();
  socket.emit('identify', { name, address }, () => {
    socket.emit('start streaming');
  });
});

socket.on('disconnect', () => {
  console.log('disconnected');
});

socket.on('chat message', (msg) => console.log('message:', msg));

socket.on('start receiving', async ({ id, address }, callback) => {
  const external = await getExternalPort();
  callback(external);
  console.log(
    `starting to recv from ${id} at ${address} on ${external.address}:${external.port}`
  );
  console.log('python3', [
    `${__dirname}/trx/rx.py`,
    external.address,
    external.port,
  ]);
  const child = child_process.spawn('python3', [
    `${__dirname}/trx/rx.py`,
    external.address,
    external.port,
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
