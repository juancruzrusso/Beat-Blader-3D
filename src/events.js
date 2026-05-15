// Mini event bus. Sin dependencias.
// on(evento, callback) → te suscribís
// emit(evento, payload) → notificás a los suscriptos

const listeners = new Map();

export function on(event, cb) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(cb);
}

export function emit(event, payload) {
  const arr = listeners.get(event);
  if (!arr) return;
  for (const cb of arr) {
    try { cb(payload); } catch (e) { console.error('event handler error', event, e); }
  }
}
