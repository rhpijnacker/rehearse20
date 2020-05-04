import React, { useContext, useEffect } from 'react';
import io from 'socket.io-client';
import { Socket } from 'socket.io';

import TrxStreamer from './TrxStreamer';
import UdpEchoClient from './UdpEchoClient';
import membersContext from './membersContext';

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';
const SOCKET_SERVER = 'http://localhost:3000';

const SocketConnection = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get('name');
  const sessionId = urlParams.get('sessionId') || 'default';
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

  const members = useContext(membersContext);

  console.log(members);

  useEffect(() => {
    const socket = subscribeToSocket();
    return () => unSubscribeFromSocket(socket);
  }, []);

  const subscribeToSocket = () => {
    const socket = io(SOCKET_SERVER, { transports: ['websocket'] });
    let session: Socket;

    socket.on('connect', () => {
      console.log('joining session', sessionId);
      socket.emit('join session', sessionId, () => {
        console.log('joined session', sessionId);
        session = io(`${SOCKET_SERVER}/${sessionId}`);
        const streamer = new TrxStreamer();

        session.on('connect', async () => {
          console.log('session connected');
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
        session.on('user joined', ({ id, name }) => {
          console.log('user joined:', name, id);
          members.addMember({ id, name });
        });
        session.on('user left', ({ id, name }) => {
          console.log('user left:', name, id);
          members.removeMember({ id, name });
        });

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
    return socket;
  };

  const unSubscribeFromSocket = (socket) => {
    socket.disconnect();
  };

  return null; // no UI to render here
};

export default SocketConnection;
