import Session, { Client } from './Session';
import SessionManager from './SessionManager';
import { Socket } from 'socket.io';

class ClientConnection {
  client: Client;
  // session this client is connected to
  session: Session;

  constructor(socket: Socket) {
    this.client = {
      id: socket.id,
      address: undefined,
      name: undefined,
      sessionId: undefined,
      socket,
    };
    this.subscribeToSocket();
  }

  subscribeToSocket() {
    const socket = this.client.socket;
    socket.on('identify', (props, callback) =>
      this.onIdentify(props, callback)
    );
    socket.on('start streaming', () => this.onStartStreaming());
  }

  onIdentify({ name, sessionId }, callback) {
    console.log(`identified ${name} for session ${sessionId}`);
    this.session = SessionManager.initializeSession(sessionId);
    this.session.forEach((c) =>
      c.socket.emit('user joined', { id: this.client.id, name })
    );
    const currentUsers = [...this.session.values()].map((c) => ({
      id: c.id,
      name: c.name,
    }));
    callback(currentUsers);
    this.client.name = name;
    this.client.sessionId = sessionId;
    this.session.add(this.client);
    console.log(`#${this.session.size} connected`);
  }

  onStartStreaming() {
    // session.forEach(async (other) => {
    //   if (other !== client) {
    //     const clientSsrc = session.getSsrc();
    //     client.socket.emit('start sending', {
    //       id: serverId,
    //       address: serverAddress,
    //       port: rtpIdentPort,
    //       ssrc: clientSsrc,
    //     });
    //     const otherSsrc = session.getSsrc();
    //     other.socket.emit('start sending', {
    //       id: serverId,
    //       address: serverAddress,
    //       port: rtpIdentPort,
    //       ssrc: otherSsrc,
    //     });
    //     const [clientHostPort, otherHostPort] = await Promise.all([
    //       waitForIdentPackage(clientSsrc).then((result) => {
    //         client.socket.emit('stop sending', { id: serverId });
    //         return result;
    //       }),
    //       waitForIdentPackage(otherSsrc).then((result) => {
    //         other.socket.emit('stop sending', { id: serverId });
    //         return result;
    //       }),
    //     ]);
    //     console.log('!!! Identified both parties');
    //     console.log('client start sending', {
    //       id: other.id,
    //       name: other.name,
    //       address: otherHostPort.address,
    //       port: otherHostPort.port,
    //       ssrc: clientSsrc,
    //     });
    //     client.socket.emit('start sending', {
    //       id: other.id,
    //       name: other.name,
    //       address: otherHostPort.address,
    //       port: otherHostPort.port,
    //       ssrc: clientSsrc,
    //     });
    //     other.socket.emit('start sending', {
    //       id: client.id,
    //       name: client.name,
    //       address: clientHostPort.address,
    //       port: clientHostPort.port,
    //       ssrc: otherSsrc,
    //     });
    //   }
    // });
  }
}

export default ClientConnection;
