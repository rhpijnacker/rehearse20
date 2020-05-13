import { Socket } from 'socket.io';

export interface Client {
  id: string;
  address: string;
  name: string;
  sessionId: string;
  socket: Socket;
}

export default class Session extends Set<Client> {
  clients: Client[]
}
