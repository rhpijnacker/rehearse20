import { Socket } from 'socket.io';

import * as constants from './constants';
import * as rtpPortIdentifier from './rtpPortIdentifier';
import Session, { Client } from './Session';
import SessionManager from './SessionManager';

class ClientConnection {
  static serverId: string = 'server';

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
    socket.on('disconnect', () => this.onDisconnected());
    socket.on('identify', (props, callback) =>
      this.onIdentify(props, callback)
    );
    socket.on('start streaming', () => this.onStartStreaming());
  }

  onDisconnected() {
    if (this.client.name) {
      console.log(`disconnected ${this.client.name}`);
      this.session.delete(this.client);
      this.session.forEach((c) => {
        c.socket.emit('user left', {
          id: this.client.id,
          name: this.client.name,
        });
        c.socket.emit('stop sending', {
          id: this.client.id,
        });
      });
      console.log(`#${this.session.size} left`);
      SessionManager.cleanupSession(this.client.sessionId);
    }
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
    this.session.forEach(async (other) => {
      if (other !== this.client) {
        const clientSsrc = this.session.getSsrc();
        this.client.socket.emit('start sending', {
          id: ClientConnection.serverId,
          address: constants.SERVER_ADDRESS,
          port: constants.IDENT_PORT,
          ssrc: clientSsrc,
        });
        const otherSsrc = this.session.getSsrc();
        other.socket.emit('start sending', {
          id: ClientConnection.serverId,
          address: constants.SERVER_ADDRESS,
          port: constants.IDENT_PORT,
          ssrc: otherSsrc,
        });
        const [clientHostPort, otherHostPort] = await Promise.all([
          rtpPortIdentifier.waitForIdentPackage(clientSsrc).then((result) => {
            this.client.socket.emit('stop sending', {
              id: ClientConnection.serverId,
            });
            return result;
          }),
          rtpPortIdentifier.waitForIdentPackage(otherSsrc).then((result) => {
            other.socket.emit('stop sending', {
              id: ClientConnection.serverId,
            });
            return result;
          }),
        ]);
        console.log('!!! Identified both parties');
        //     console.log('client start sending', {
        //       id: other.id,
        //       name: other.name,
        //       address: otherHostPort.address,
        //       port: otherHostPort.port,
        //       ssrc: clientSsrc,
        //     });
        this.client.socket.emit('start sending', {
          id: other.id,
          name: other.name,
          address: otherHostPort.address,
          port: otherHostPort.port,
          ssrc: clientSsrc,
        });
        other.socket.emit('start sending', {
          id: this.client.id,
          name: this.client.name,
          address: clientHostPort.address,
          port: clientHostPort.port,
          ssrc: otherSsrc,
        });
      }
    });
  }
}

export default ClientConnection;
