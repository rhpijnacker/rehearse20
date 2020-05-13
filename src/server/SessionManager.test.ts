import SessionManager from './SessionManager';
import Session from './Session';

const origGetRandomRumber = SessionManager.getRandomNumber;

afterEach(() => {
  SessionManager.ssrcs.clear();
  SessionManager.getRandomNumber = origGetRandomRumber;
});

it('should create unique SSRCS', () => {
  SessionManager.getRandomNumber = jest
    .fn()
    .mockReturnValueOnce(1234)
    .mockReturnValueOnce(1234)
    .mockReturnValue(4321);

  const ssrc1 = SessionManager.getSsrc();
  expect(ssrc1).toBe(1234);
  expect(SessionManager.getRandomNumber).toBeCalledTimes(1);

  const ssrc2 = SessionManager.getSsrc();
  expect(ssrc2).toBe(4321);
  expect(SessionManager.getRandomNumber).toBeCalledTimes(3);
});

it('should clean up SSRC from finished sessions', () => {
  SessionManager.getRandomNumber = jest
    .fn()
    .mockReturnValueOnce(1234)
    .mockReturnValueOnce(1234)
    .mockReturnValueOnce(2345)
    .mockReturnValueOnce(3456);

  const session = SessionManager.initializeSession('session1');
  const ssrc1 = session.getSsrc();
  expect(ssrc1).toBe(1234);
  const ssrc2 = session.getSsrc();
  expect(ssrc2).toBe(2345);
  const ssrc3 = session.getSsrc();
  expect(ssrc3).toBe(3456);

  expect(session.ssrcs.size).toBe(3);
  expect(SessionManager.ssrcs.size).toBe(3);

  SessionManager.cleanupSession('session1');
  expect(SessionManager.ssrcs.size).toBe(0);
});
