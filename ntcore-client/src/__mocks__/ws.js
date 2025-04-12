// Mock implementation of ws
import { EventEmitter } from 'events';

class WebSocket extends EventEmitter {
  constructor(url, protocols) {
    super();
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] : protocols;
    this.readyState = WebSocket.CONNECTING;

    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.emit('open');
    }, 0);
  }

  send(data) {
    // Mock implementation
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.emit('close', 1000, 'Normal closure');
  }

  // WebSocket constants
  static get CONNECTING() { return 0; }
  static get OPEN() { return 1; }
  static get CLOSING() { return 2; }
  static get CLOSED() { return 3; }
}

export default WebSocket;
