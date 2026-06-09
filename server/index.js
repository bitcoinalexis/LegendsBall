import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import MatchMaker from './MatchMaker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.static(join(root, 'public')));
app.use('/shared', express.static(join(root, 'shared')));

app.get('/health', (req, res) => res.json({ ok: true }));

const matchMaker = new MatchMaker(io);

io.on('connection', (socket) => {
  socket.data.roomId = null;
  socket.data.slot = null;

  socket.on('findMatch', () => matchMaker.findMatch(socket));
  socket.on('cancelMatch', () => matchMaker.cancel(socket));
  socket.on('input', (data) => matchMaker.handleInput(socket, data));
  socket.on('rematch', () => matchMaker.handleRematch(socket));
  socket.on('disconnect', () => matchMaker.handleDisconnect(socket));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`PROSTIBOL escuchando en puerto ${PORT}`);
});
