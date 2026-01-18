type AuthRequiredPayload = {
  reason?: string;
};

type Listener = (payload: AuthRequiredPayload) => void;

let listeners: Listener[] = [];
let locked = false;

export const authEvents = {
  onAuthRequired(cb: Listener) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((x) => x !== cb);
    };
  },

  emitAuthRequired(payload: AuthRequiredPayload = {}) {
    if (locked) return;
    locked = true;
    listeners.forEach((cb) => cb(payload));
  },

  unlock() {
    locked = false;
  },

  forceReset() {
    locked = false;
    listeners = [];
  },
};
