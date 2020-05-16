import EventEmitter from 'events';
import { Socket } from 'socket.io';
import sinon from 'sinon';

import ClientConnection from './ClientConnection';
import * as constants from './constants';
import * as rtpPortIdentifier from './rtpPortIdentifier';
import Session from './Session';
import SessionManager from './SessionManager';

let socket;

function identifyNewClient(id, name, sessionId, callback = () => {}) {
  const socket = <Socket>new EventEmitter();
  socket.id = id;
  const clientConnection = new ClientConnection(socket);
  socket.emit('identify', { name, sessionId }, callback);
  return socket;
}

async function oneCycle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  sinon.stub(console, 'log');

  socket = new EventEmitter();
  socket.id = 'socket-id';
});

afterEach(() => {
  SessionManager.sessions = new Map<string, Session>();
  sinon.restore();
});

it('should create a new session when the first client identifies itself', () => {
  const clientConnection = new ClientConnection(socket);

  socket.emit('identify', { name: 'Name', sessionId: 'Session' }, () => {});

  expect(clientConnection.session).toBeDefined();
  expect(clientConnection.session.size).toBe(1);
});

it('should remember the client properties when a client identifies itself', () => {
  const clientConnection = new ClientConnection(socket);

  socket.emit('identify', { name: 'Name', sessionId: 'Session' }, () => {});

  expect(clientConnection.client).toEqual({
    id: 'socket-id',
    address: undefined,
    name: 'Name',
    sessionId: 'Session',
    socket,
  });
});

it('should callback with the current clients when a client identifies itself', () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const clientConnection2 = new ClientConnection(socket);
  const callback = jest.fn();

  socket.emit('identify', { name: 'Name2', sessionId: 'Session' }, callback);

  expect(callback).toBeCalled();
  expect(callback.mock.calls[0][0]).toStrictEqual([
    { id: 'socket-1', name: 'Name1' },
  ]);
});

it('should announce a new client to the current clients', () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const clientConnection2 = new ClientConnection(socket);
  const callback = jest.fn();
  socket1.on('user joined', callback);

  socket.emit('identify', { name: 'Name2', sessionId: 'Session' }, () => {});

  expect(callback).toBeCalled();
  expect(callback.mock.calls[0][0]).toStrictEqual({
    id: 'socket-id',
    name: 'Name2',
  });
});

it('should announce leaving clients to the other clients', () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const socket2 = identifyNewClient('socket-2', 'Name2', 'Session');
  const userLeft = sinon.stub();
  socket2.on('user left', userLeft);
  const stopSending = sinon.stub();
  socket2.on('stop sending', stopSending);

  socket1.emit('disconnect');

  sinon.assert.calledWith(userLeft, { id: 'socket-1', name: 'Name1' });
  sinon.assert.calledWith(stopSending, { id: 'socket-1' });
});

it('should remove a leaving client from the session', () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const socket2 = identifyNewClient('socket-2', 'Name2', 'Session');
  const session = SessionManager.initializeSession('Session');

  socket1.emit('disconnect');

  expect(session.size).toBe(1);
  const ids = [...session.keys()].map((s) => s.id);
  expect(ids).toStrictEqual(['socket-2']);
});

it('should cleanup the session after the last client leaves', () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const socket2 = identifyNewClient('socket-2', 'Name2', 'Session');

  socket1.emit('disconnect');
  socket2.emit('disconnect');

  expect(SessionManager.sessions.size).toBe(0);
});

it('should allocate SSRCs when clients start streaming (to the server)', () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const socket2 = identifyNewClient('socket-2', 'Name2', 'Session');
  const session = SessionManager.initializeSession('Session');
  const getSSrcsStub = sinon
    .stub(session, 'getSsrc')
    .onFirstCall()
    .returns(1234)
    .onSecondCall()
    .returns(5678);
  const callback1 = sinon.stub();
  socket1.on('start sending', callback1);
  const callback2 = sinon.stub();
  socket2.on('start sending', callback2);

  socket1.emit('start streaming');

  sinon.assert.calledTwice(getSSrcsStub);
  sinon.assert.calledOnce(callback1);
  sinon.assert.calledWith(callback1, {
    id: ClientConnection.serverId,
    address: constants.IDENT_HOST,
    port: constants.IDENT_PORT,
    ssrc: 1234,
  });
  sinon.assert.calledOnce(callback2);
  sinon.assert.calledWith(callback2, {
    id: ClientConnection.serverId,
    address: constants.IDENT_HOST,
    port: constants.IDENT_PORT,
    ssrc: 5678,
  });
});

it('should obtain the external adress and port from clients streaming to the server', async () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const socket2 = identifyNewClient('socket-2', 'Name2', 'Session');
  const session = SessionManager.initializeSession('Session');
  const getSSrcsStub = sinon
    .stub(session, 'getSsrc')
    .onFirstCall()
    .returns(1234)
    .onSecondCall()
    .returns(5678);
  const waitForIdentPackageStub = sinon
    .stub(rtpPortIdentifier, 'waitForIdentPackage')
    .withArgs(1234)
    .resolves({ address: '1.2.3.4', port: 1234 })
    .withArgs(5678)
    .resolves({ address: '5.6.7.8', port: 5678 });
  const callback1 = sinon.stub();
  socket1.on('stop sending', callback1);
  const callback2 = sinon.stub();
  socket2.on('stop sending', callback2);

  socket1.emit('start streaming');

  await oneCycle();
  sinon.assert.calledOnce(callback1);
  sinon.assert.calledWith(callback1, { id: ClientConnection.serverId });
  sinon.assert.calledOnce(callback2);
  sinon.assert.calledWith(callback2, { id: ClientConnection.serverId });
});

it('should streaming to all peers when the ports are known', async () => {
  const socket1 = identifyNewClient('socket-1', 'Name1', 'Session');
  const socket2 = identifyNewClient('socket-2', 'Name2', 'Session');
  const socket3 = identifyNewClient('socket-3', 'Name3', 'Session');
  const socket4 = identifyNewClient('socket-4', 'Name4', 'Session');
  const session = SessionManager.initializeSession('Session');
  let ssrc = 1;
  const getSSrcsStub = sinon.stub(session, 'getSsrc').callsFake(() => ssrc++);
  const waitForIdentPackageStub = sinon
    .stub(rtpPortIdentifier, 'waitForIdentPackage')
    .callsFake((i) =>
      Promise.resolve({ address: `1.1.1.${i}`, port: 1110 + i })
    );
  const callback1 = sinon.stub();
  socket1.on('start sending', callback1);
  const callback2 = sinon.stub();
  socket2.on('start sending', callback2);
  const callback3 = sinon.stub();
  socket3.on('start sending', callback3);
  const callback4 = sinon.stub();
  socket4.on('start sending', callback4);

  socket1.emit('start streaming');

  await oneCycle();

  sinon.assert.calledWith(callback1, {
    id: socket2.id,
    name: 'Name2',
    address: '1.1.1.2',
    port: 1112,
    ssrc: 1,
  });
  sinon.assert.calledWith(callback2, {
    id: socket1.id,
    name: 'Name1',
    address: '1.1.1.1',
    port: 1111,
    ssrc: 2,
  });
  sinon.assert.calledWith(callback1, {
    id: socket3.id,
    name: 'Name3',
    address: '1.1.1.4',
    port: 1114,
    ssrc: 3,
  });
  sinon.assert.calledWith(callback3, {
    id: socket1.id,
    name: 'Name1',
    address: '1.1.1.3',
    port: 1113,
    ssrc: 4,
  });
  sinon.assert.calledWith(callback1, {
    id: socket4.id,
    name: 'Name4',
    address: '1.1.1.6',
    port: 1116,
    ssrc: 5,
  });
  sinon.assert.calledWith(callback4, {
    id: socket1.id,
    name: 'Name1',
    address: '1.1.1.5',
    port: 1115,
    ssrc: 6,
  });
});
