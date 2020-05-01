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

socket.on('start receiving', async (callback) => {
  const result = await stun.request('stun.l.google.com:19302');
  const xorAddress = result.getXorAddress();
  callback({ address: xorAddress.address, port: xorAddress.port });
  console.log(`starting to receive on ${xorAddress.address}:${xorAddress.port}`);
});
socket.on('stop receiving', ({ address }) => {
  console.log(`stop receiving from ${address}`);
});

socket.on('start sending', ({ name, address, port }) => {
  console.log(`starting stream to ${name} on ${address}:${port}`);
});
socket.on('stop sending', ({ name, address }) => {
  console.log(`stop streaming to ${name} on ${address}`);
});
