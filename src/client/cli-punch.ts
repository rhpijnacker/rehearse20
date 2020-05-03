import { UdpEchoClient } from './UdpEchoClient';

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';

const localPort = parseInt(process.argv[2] || '51350', 10);

const client = new UdpEchoClient();
(async () => {
  console.log('punching ...');
  try {
    const { address, port } = await client.echo(localPort, ECHO_SERVER);
    console.log(`Punched hole from ${address}:${port} to :${localPort}`);
  } catch (error) {
    console.log(error);
  }
})();
