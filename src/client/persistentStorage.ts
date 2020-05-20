export function getName() {
  return localStorage.getItem('name') || '';
}

export function setName(name) {
  localStorage.setItem('name', name);
}

export function getSessions() {
  const json = localStorage.getItem('sessions') || '[]';
  const sessions = JSON.parse(json);
  return sessions;
}

export function getSession() {
  const sessions = getSessions();
  return sessions[0] || '';
}

export function addSession(sessionId) {
  let sessions = getSessions();
  sessions = [sessionId, ...sessions.filter(s => s !== sessionId)];
  localStorage.setItem('sessions', JSON.stringify(sessions));
}