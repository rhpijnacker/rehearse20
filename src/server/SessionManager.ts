import Session from './Session';

export default class SessionManager {
  // sessionId -> Session
  static sessions = new Map<string, Session>();
  static ssrcs = new Set<number>();

  static initializeSession(sessionId: string): Session {
    let session = SessionManager.sessions.get(sessionId);
    if (!session) {
      session = new Session();
      SessionManager.sessions.set(sessionId, session);
    }
    return session;
  }

  static cleanupSession(sessionId: string) {
    const session = SessionManager.sessions.get(sessionId);
    if (session && session.size === 0) {
      SessionManager.sessions.delete(sessionId);
      // free session's ssrcs
      session.ssrcs.forEach((ssrc) => this.ssrcs.delete(ssrc));
    }
  }

  static getSsrc(): number {
    let ssrc;
    do {
      ssrc = SessionManager.getRandomNumber();
    } while (this.ssrcs.has(ssrc));
    // Post: !this.ssrcs.has(ssrc)
    this.ssrcs.add(ssrc);
    return ssrc;
  }

  // Random 32 bit number (not 0)
  static getRandomNumber(): number {
    return Math.floor(Math.random() * (2 ** 32 - 1)) + 1;
  }
}
