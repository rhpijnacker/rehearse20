import { Socket } from 'socket.io';

import SessionManager from './SessionManager';

export interface Client {
  id: string;
  address: string;
  name: string;
  sessionId: string;
  socket: Socket;
}

export default class Session extends Set<Client> {
  ssrcs: Set<number>; // ssrcs used in this session

  constructor() { 
    super();
    this.ssrcs = new Set();
  }

  getSsrc() {
    const ssrc = SessionManager.getSsrc();
    this.ssrcs.add(ssrc);
    return ssrc;
  }
}
