// SessionManager.js
// Manages saving/loading edit sessions to IndexedDB
import { set, get } from 'idb-keyval';

export async function saveSession(session, key = 'raweditor-session') {
  await set(key, session);
}

export async function loadSession(key = 'raweditor-session') {
  return await get(key);
}
