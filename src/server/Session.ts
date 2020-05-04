import { Namespace, Server, Socket } from 'socket.io';

interface Client {
  id: string;
  address: string;
  name: string;
  session: Socket;
}

class Session {
  namespace: Namespace;
  clients: Client[];

  constructor(sessionId: string, io: Server) {
    this.clients = [];
    this.namespace = io.of(sessionId);
    this.namespace.on('connect', (session) => this.subscribeToSession(session));
  }

  isIdle() {
    return this.clients.length === 0;
  }

  subscribeToSession(session) {
    console.log('session connected');

    const client: Client = {
      id: session.id,
      address: undefined,
      name: undefined,
      session,
    };

    session.on('disconnect', () => {
      this.clients = this.clients.filter((c) => c.session !== client.session);
      console.log(`session disconnected ${client.name}`);
      console.log(`#${this.clients.length} left`);
      this.clients.forEach((c) => {
        c.session.emit('user left', { id: client.id, name: client.name });
        c.session.emit('stop sending', {
          id: client.id,
          name: client.name,
          address: client.address,
        });
        c.session.emit('stop receiving', {
          id: client.id,
          address: client.address,
        });
      });
    });

    session.on('identify', ({ name, address }, callback) => {
      console.log(`identified ${name} on ${address}`);
      this.clients.forEach((c) =>
        c.session.emit('user joined', { id: client.id, name })
      );
      client.address = address;
      client.name = name;
      this.clients.push(client);
      console.log(`#${this.clients.length} connected`);
      callback();
    });

    session.on('chat message', (msg) => {
      console.log('chat message', msg);
      this.namespace.emit('chat message', msg);
    });

    session.on('start streaming', () => {
      this.clients
        .filter((c) => c.session !== client.session) // not to myself
        .forEach((other) => {
          client.session.emit(
            'start receiving',
            { id: other.id, address: other.address },
            ({ address, port }) => {
              other.session.emit('start sending', {
                id: client.id,
                name: client.name,
                address,
                port,
              });
            }
          );
          other.session.emit(
            'start receiving',
            { id: client.id, address: client.address },
            ({ address, port }) => {
              client.session.emit('start sending', {
                id: other.id,
                name: other.name,
                address,
                port,
              });
            }
          );
        });
    });
  }
}

export default Session;
