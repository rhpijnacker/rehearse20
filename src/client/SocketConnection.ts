import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './reducer';
import io from 'socket.io-client';

import TrxStreamer from './TrxStreamer';
import UdpEchoClient from './UdpEchoClient';
import * as actions from './actions';

const ECHO_SERVER = 'udp://rehearse20.sijben.dev:50051';
const SOCKET_SERVER = 'http://localhost:3000';

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

const SocketConnection = (props) => {
  const dispatch = useDispatch();
  const members = useSelector((state: RootState) => state.members);
  const volume = useSelector((state: RootState) => state.volume);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socket = subscribeToSocket();
    setSocket(socket);
    return () => unSubscribeFromSocket(socket);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit('mute microphone', { isMuted: volume.isMuted });
    }
  }, [volume.isMuted]);

  const subscribeToSocket = () => {
    const socket = io(SOCKET_SERVER, { transports: ['websocket'] });
    const streamer = new TrxStreamer();

    socket.on('connect', async () => {
      console.log('connected');
      const randomPort = 54321;
      const { address } = await getExternalPort(randomPort);
      socket.emit(
        'identify',
        { name, address, sessionId },
        (currentMembers) => {
          console.log('currentMembers', currentMembers);
          dispatch(actions.clearMembers());
          currentMembers.forEach((member) =>
            dispatch(actions.addMember(member))
          );
          socket.emit('start streaming');
        }
      );
    });

    socket.on('disconnect', () => {
      console.log('disconnected');
      streamer.stop();
    });

    socket.on('chat message', (msg) => console.log('message:', msg));
    socket.on('user joined', ({ id, name }) => {
      console.log('user joined:', name, id);
      dispatch(actions.addMember({ id, name }));
    });
    socket.on('user left', ({ id, name }) => {
      console.log('user left:', name, id);
      dispatch(actions.removeMember({ id, name }));
    });

    socket.on('start receiving', async ({ id, address }, callback) => {
      const info = await getFreePort();
      callback(info.remote);
      console.log(
        `starting to recv from ${id} at ${address} on ${info.remote.address}:${info.remote.port}/${info.local.port}`
      );
      streamer.startReceiving(id, 'localhost', info.local.port);
      dispatch(actions.startRecving(id, info.local.port));
    });

    socket.on('stop receiving', ({ id, address }) => {
      console.log(`stop recving from ${id} at ${address}`);
      streamer.stopReceiving(id, address);
      dispatch(actions.stopRecving(id));
    });

    socket.on('start sending', ({ id, address, port }) => {
      console.log(`starting to send to ${id} on ${address}:${port}`);
      streamer.startSending(id, address, port);
      dispatch(actions.startSending(id, address, port));
    });

    socket.on('stop sending', ({ id, address }) => {
      console.log(`stop sending to ${id} on ${address}`);
      streamer.stopSending(id, address);
      dispatch(actions.stopSending(id));
    });

    return socket;
  };

  const unSubscribeFromSocket = (socket) => {
    socket.disconnect();
  };

  return null; // no UI to render here
};

export default SocketConnection;
