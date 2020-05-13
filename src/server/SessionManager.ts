import Session from './Session';

export default class SessionManager {
  // sessionId -> Session
  static sessions = new Map<string, Session>();

  static initializeSession(sessionId: string) {
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
    }
  }
}
