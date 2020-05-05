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
  let externalAddress;

  const getExternalPort = async (localPort) => {
    const client = new UdpEchoClient();
    const { address, port } = await client.echo(localPort, ECHO_SERVER);
    externalAddress = address;
    // Assume straight port-maps for now
    return { address, localPort };
    // return { address, port };
  };

  let nextFreePort = startPort;
  const getFreePort = async () => {
    const port = nextFreePort;
    nextFreePort = nextFreePort + 2;
    return {
      local: { port },
      remote: { address: externalAddress, port },
    };
    const client = new UdpEchoClient();
    let externalPort = 0;
    while (!externalPort) {
      nextFreePort = nextFreePort + 2; // RPT uses the +1 port too
      try {
        const remote = await client.echo(port, ECHO_SERVER);
        return {
          local: { port },
          // Assume straight port-maps for now
          remote: { address: remote.address, port: port },
        };
      } catch (error) {
        console.log(`Could not external port for :${port}`);
      }
    }
  };

  const { members, addMember, removeMember } = useContext(membersContext);
  console.log(members.map((m) => m.name));

  useEffect(() => {
    const socket = subscribeToSocket();
    return () => unSubscribeFromSocket(socket);
  }, []);

  const subscribeToSocket = () => {
    const socket = io(SOCKET_SERVER, { transports: ['websocket'] });
    const streamer = new TrxStreamer();

    socket.on('connect', async () => {
      console.log('connected');
      const randomPort = 54321;
      const { address } = await getExternalPort(randomPort);
      socket.emit('identify', { name, address, sessionId }, (currentMembers) => {
        console.log('<identify>', members.map((m) => m.name));
        currentMembers.forEach((m) => {
          addMember({ id: m.id, name: m.name });
        });
        currentMembers.forEach((m) => {
          addMember({ id: m.id, name: m.name });
        });
        currentMembers.forEach((m) => {
          addMember({ id: m.id, name: m.name });
        });
        console.log('</identify>', members.map((m) => m.name));
        socket.emit('start streaming');
      });
    });

    socket.on('disconnect', () => {
      console.log('disconnected');
      streamer.stop();
    });

    socket.on('chat message', (msg) => console.log('message:', msg));
    socket.on('user joined', ({ id, name }) => {
      console.log('user joined:', name, id);
      addMember({ id, name });
    });
    socket.on('user left', ({ id, name }) => {
      console.log('user left:', name, id);
      removeMember({ id, name });
    });

    socket.on('start receiving', async ({ id, address }, callback) => {
      const info = await getFreePort();
      callback(info.remote);
      console.log(
        `starting to recv from ${id} at ${address} on ${info.remote.address}:${info.remote.port}/${info.local.port}`
      );
      streamer.startReceiving(id, 'localhost', info.local.port);
    });

    socket.on('stop receiving', ({ id, address }) => {
      console.log(`stop recving from ${id} at ${address}`);
      streamer.stopReceiving(id, address);
    });

    socket.on('start sending', ({ id, address, port }) => {
      console.log(`starting to send to ${id} on ${address}:${port}`);
      streamer.startSending(id, address, port);
    });

    socket.on('stop sending', ({ id, address }) => {
      console.log(`stop sending to ${id} on ${address}`);
      streamer.stopSending(id, address);
    });

    return socket;
  };

  const unSubscribeFromSocket = (socket) => {
    socket.disconnect();
  };

  return null; // no UI to render here
};

export default SocketConnection;
