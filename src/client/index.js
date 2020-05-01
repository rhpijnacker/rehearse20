const io = require('socket.io-client');
const stun = require('stun');

const name = process.argv[2] || 'John Doe';

const socket = io(`http://localhost:3000`);

socket.on('chat message', (msg) => console.log('message:', msg));

(async () => {
  const result = await stun.request('stun.l.google.com:19302');
  const xorAddress = result.getXorAddress();
  socket.emit('identify', { name, address: xorAddress.address }, () => {
    socket.emit('start streaming');
  });
})();

socket.on('start receiving', async ({ id, address }, callback) => {
  const result = await stun.request('stun.l.google.com:19302');
  const xorAddress = result.getXorAddress();
  callback({ address: xorAddress.address, port: xorAddress.port });
  console.log(
    `starting to recv from ${id} at ${address} on ${xorAddress.address}:${xorAddress.port}`
  );
});
socket.on('stop receiving', ({ id, address }) => {
  console.log(`stop recving from ${id} at ${address}`);
});

socket.on('start sending', ({ id, address, port }) => {
  console.log(`starting to send to ${id} on ${address}:${port}`);
});
socket.on('stop sending', ({ id, address }) => {
  console.log(`stop sending to ${id} on ${address}`);
});
