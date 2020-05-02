const dgram = require('dgram');
const url = require('url');

// TODO: this does not have to be a class

class UdpEchoClient {
  echo(localPort, echoServer) {
    const socket = dgram.createSocket('udp4');

    socket.on('listening', () => {
      const props = socket.address();
      console.log(`Listening on ${props.address}:${props.port}`);
    });

    return new Promise((resolve, reject) => {
      socket.on('message', (message) => {
        // message should be: url://<hostname>:<port>
        const externalProps = url.parse(message.toString());
        resolve({ address: externalProps.hostname, port: externalProps.port });
        console.log(
          `Punched hole from to ${externalProps.hostname}:${externalProps.port}`
        );
        socket.close();
      });

      socket.bind({ port: localPort, exclusive: true }, (error) => {
        if (error) {
          console.log('bind', error);
          socket.close();
          reject(error);
        } else {
          const serverProps = url.parse(echoServer);

          socket.send(
            'Echo...!',
            serverProps.port,
            serverProps.hostname,
            (error) => {
              if (error) {
                console.log('send', error);
                socket.close();
                reject(error);
              }
            }
          );
        }
      });
    });
  }
}

module.exports = UdpEchoClient;
