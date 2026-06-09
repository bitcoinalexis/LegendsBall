export default class Network {
  constructor() {
    this.socket = window.io();
    this.handlers = {};
    const events = ['searching', 'matchFound', 'matchStart', 'state', 'opponentLeft'];
    for (const ev of events) {
      this.socket.on(ev, (data) => this.emit(ev, data));
    }
  }

  on(event, cb) {
    this.handlers[event] = cb;
  }

  emit(event, data) {
    if (this.handlers[event]) this.handlers[event](data);
  }

  findMatch() {
    this.socket.emit('findMatch');
  }

  cancelMatch() {
    this.socket.emit('cancelMatch');
  }

  sendInput(input) {
    this.socket.emit('input', input);
  }

  rematch() {
    this.socket.emit('rematch');
  }
}
