import Room from './Room.js';

export default class MatchMaker {
  constructor(io) {
    this.io = io;
    this.queue = [];
    this.rooms = new Map();
    this.nextId = 1;
  }

  findMatch(socket) {
    if (socket.data.roomId) return;
    if (this.queue.includes(socket)) return;

    this.queue.push(socket);
    socket.emit('searching');

    this.tryPair();
  }

  tryPair() {
    while (this.queue.length >= 2) {
      const a = this.queue.shift();
      const b = this.queue.shift();
      if (!a.connected) {
        if (b.connected) this.queue.unshift(b);
        continue;
      }
      if (!b.connected) {
        if (a.connected) this.queue.unshift(a);
        continue;
      }
      this.createRoom(a, b);
    }
  }

  createRoom(a, b) {
    const id = `room-${this.nextId++}`;
    const room = new Room(id, this.io, [a, b]);
    this.rooms.set(id, room);

    a.emit('matchFound', { slot: 'A' });
    b.emit('matchFound', { slot: 'B' });

    room.start();
  }

  handleInput(socket, input) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room) return;
    room.setInput(socket.data.slot, input);
  }

  handleRematch(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room) return;
    room.requestRematch(socket.data.slot);
  }

  cancel(socket) {
    const i = this.queue.indexOf(socket);
    if (i !== -1) this.queue.splice(i, 1);
  }

  handleDisconnect(socket) {
    this.cancel(socket);
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.handleLeave(socket.data.slot);
    this.rooms.delete(roomId);

    const other = room.sockets[socket.data.slot === 'A' ? 'B' : 'A'];
    if (other) {
      other.data.roomId = null;
      other.data.slot = null;
      other.leave(roomId);
    }
  }
}
