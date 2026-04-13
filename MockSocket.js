const FAKE_MESSAGES = [
  "Hey, how's it going?",
  "Let's do a quick sync at 3",
  'Has anyone tried the new update?',
  'Great work on the demo! ☀️',
  "I'll be late to the standup today",
];

class MockSocket {
  constructor(config = {}) {
    this.listeners = {};
    this.connected = false;
    this.timeouts = [];
    this.typingDuration = config.typingDuration || 2000;
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this;
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  connect(groups = []) {
    this.connected = true;
    this._emit('connect', { status: 'connected' });
    groups.forEach(group => {
      const interval = setInterval(() => {
        if (this.connected) this._simulateIncoming(group.id);
      }, 8000 + Math.random() * 5000);
      this.timeouts.push(interval);
    });
  }

  send(message) {
    const sentMsg = {
      ...message,
      id: Date.now().toString(),
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
    this._emit('message', sentMsg);
    setTimeout(() => this._emit('read', { messageId: sentMsg.id }), 2000);
  }

  _simulateIncoming(groupId) {
    this._emit('typing', { groupId, isTyping: true });
    setTimeout(() => {
      this._emit('typing', { groupId, isTyping: false });
      this._emit('message', {
        id: Date.now().toString(),
        groupId,
        text: FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)],
        status: 'received',
        timestamp: new Date().toISOString(),
      });
    }, this.typingDuration);
  }

  disconnect() {
    this.connected = false;
    this.timeouts.forEach(clearInterval);
  }
}

export default MockSocket;
