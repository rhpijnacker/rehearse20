import EventEmitter from 'events';
import { Socket } from 'socket.io';

import ClientConnection from './ClientConnection';
import Session from './Session';
import SessionManager from './SessionManager';

const console_log = console.log;
let socket;

beforeEach(() => {
  console.log = () => {};

  socket = new EventEmitter();
  socket.id = 'socket-id';
});

afterEach(() => {
  SessionManager.sessions = new Map<string, Session>();
  console.log = console_log;
});

it('should create a new session when the first client identifies itself', () => {
  const clientConnection = new ClientConnection(socket);

  socket.emit('identify', { name: 'Name', sessionId: 'Session' }, () => {});

  expect(clientConnection.session).toBeDefined();
  expect(clientConnection.session.size).toBe(1);
});

it('should create remember the client properties when a client identifies itself', () => {
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
  const socket1 = <Socket>new EventEmitter();
  socket1.id = 'socket-1';
  const clientConnection1 = new ClientConnection(socket1);
  socket1.emit('identify', { name: 'Name1', sessionId: 'Session' }, () => {});
  const clientConnection2 = new ClientConnection(socket);
  const callback = jest.fn();

  socket.emit('identify', { name: 'Name2', sessionId: 'Session' }, callback);

  expect(callback).toBeCalled();
  expect(callback.mock.calls[0][0]).toStrictEqual([
    { id: 'socket-1', name: 'Name1' },
  ]);
});

it('should announce a new client to the current clients', () => {
  const socket1 = <Socket>new EventEmitter();
  socket1.id = 'socket-1';
  const clientConnection1 = new ClientConnection(socket1);
  socket1.emit('identify', { name: 'Name1', sessionId: 'Session' }, () => {});
  const clientConnection2 = new ClientConnection(socket);
  const callback = jest.fn();
  socket1.on('user joined', callback);

  socket.emit('identify', { name: 'Name2', sessionId: 'Session' }, () => {});

  expect(callback).toBeCalled();
  expect(callback.mock.calls[0][0]).toStrictEqual({ id: 'socket-id', name: 'Name2'});
});
