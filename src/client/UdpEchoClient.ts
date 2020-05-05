import dgram from 'dgram';
import url from 'url';

// TODO: this does not have to be a class

class UdpEchoClient {
  echo(localPort, echoServer): Promise<{ address: string; port: string }> {
    const socket = dgram.createSocket('udp4');

    socket.on('listening', () => {
      const props = socket.address();
      console.log(`Listening on ${props.address}:${props.port}`);
    });

    return new Promise((resolve, reject) => {
      socket.on('message', (message) => {
        // message should be: url://<hostname>:<port>
        console.log('Echo reply:', message.toString());
        const externalProps = url.parse(message.toString());
        resolve({ address: externalProps.hostname, port: externalProps.port });
        console.log(
          `Punched hole from to ${externalProps.hostname}:${externalProps.port}`
        );
        socket.close();
      });

      socket.bind({ port: localPort, exclusive: true }, () => {
        const serverProps = url.parse(echoServer);

        socket.send(
          'Echo...!',
          parseInt(serverProps.port, 10),
          serverProps.hostname,
          (error) => {
            if (error) {
              console.log('send', error);
              socket.close();
              reject(error);
            }
          }
        );
      });
    });
  }
}

export default UdpEchoClient;
