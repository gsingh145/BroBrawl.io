export default class ConnectionManager {
  constructor(url = 'ws://localhost:8080') {
    this.url = url;
    this.ws = null;
    this.playerId = null;
    this.connected = false;
    this.listeners = {};
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.emit('open');
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.emit('close');
    };

    this.ws.onerror = () => {
      this.emit('error');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CONNECTED') {
          this.playerId = msg.playerId;
        }
        this.emit(msg.type, msg);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }

  send(type, data = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  disconnect() {
    this.ws?.close();
  }
}
