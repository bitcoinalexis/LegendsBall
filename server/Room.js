import {
  TICK_RATE, COURT, NET, PLAYER, BALL, HIT,
  WIN_SCORE, GROUND_Y, PHASE, POINT_PAUSE
} from '../shared/constants.js';

const DT = 1 / TICK_RATE;

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function sideBounds(slot) {
  const r = PLAYER.radius;
  if (slot === 'A') {
    return { minX: -COURT.halfWidth + r, maxX: -COURT.netClearance - r };
  }
  return { minX: COURT.netClearance + r, maxX: COURT.halfWidth - r };
}

function spawnX(slot) {
  return slot === 'A' ? -COURT.halfWidth * 0.55 : COURT.halfWidth * 0.55;
}

export default class Room {
  constructor(id, io, sockets) {
    this.id = id;
    this.io = io;
    this.sockets = { A: sockets[0], B: sockets[1] };
    this.rematch = { A: false, B: false };
    this.loop = null;

    sockets[0].data.slot = 'A';
    sockets[1].data.slot = 'B';
    sockets[0].data.roomId = id;
    sockets[1].data.roomId = id;
    sockets[0].join(id);
    sockets[1].join(id);

    this.resetGame('A');
  }

  resetGame(server) {
    this.score = { A: 0, B: 0 };
    this.phase = PHASE.POINT;
    this.server = server;
    this.winner = null;
    this.pointTimer = POINT_PAUSE;
    this.rematch = { A: false, B: false };
    this.players = {
      A: this.makePlayer('A'),
      B: this.makePlayer('B')
    };
    this.placeServe();
  }

  makePlayer(slot) {
    return {
      x: spawnX(slot),
      y: 0,
      z: 0,
      vy: 0,
      onGround: true,
      input: { forward: 0, strafe: 0, jump: false }
    };
  }

  placeServe() {
    this.players.A.x = spawnX('A');
    this.players.A.z = 0;
    this.players.A.y = 0;
    this.players.B.x = spawnX('B');
    this.players.B.z = 0;
    this.players.B.y = 0;
    this.ball = {
      x: spawnX(this.server),
      y: 5.5,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0
    };
  }

  start() {
    this.startTime = Date.now();
    this.io.to(this.id).emit('matchStart');
    this.loop = setInterval(() => this.tick(), 1000 / TICK_RATE);
  }

  stop() {
    if (this.loop) clearInterval(this.loop);
    this.loop = null;
  }

  setInput(slot, input) {
    const p = this.players[slot];
    if (!p) return;
    p.input.forward = clamp(Number(input.forward) || 0, -1, 1);
    p.input.strafe = clamp(Number(input.strafe) || 0, -1, 1);
    p.input.jump = !!input.jump;
  }

  tick() {
    if (this.phase === PHASE.POINT) {
      this.pointTimer -= DT;
      if (this.pointTimer <= 0) {
        this.phase = PHASE.PLAY;
      }
      this.broadcast();
      return;
    }

    if (this.phase === PHASE.PLAY) {
      this.updatePlayer('A');
      this.updatePlayer('B');
      this.updateBall();
    }

    this.broadcast();
  }

  updatePlayer(slot) {
    const p = this.players[slot];
    const b = sideBounds(slot);
    const dir = slot === 'A' ? 1 : -1;

    const movX = p.input.forward * dir;
    const movZ = slot === 'A' ? -p.input.strafe : p.input.strafe;

    p.x = clamp(p.x + movX * PLAYER.speed * DT, b.minX, b.maxX);
    p.z = clamp(p.z + movZ * PLAYER.speed * DT, -COURT.halfDepth + PLAYER.radius, COURT.halfDepth - PLAYER.radius);

    if (p.input.jump && p.onGround) {
      p.vy = PLAYER.jumpV;
      p.onGround = false;
    }
    p.vy -= PLAYER.gravity * DT;
    p.y += p.vy * DT;
    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      p.onGround = true;
    }
  }

  updateBall() {
    const ball = this.ball;
    ball.vy -= BALL.gravity * DT;

    ball.x += ball.vx * DT;
    ball.y += ball.vy * DT;
    ball.z += ball.vz * DT;

    const r = BALL.radius;

    if (ball.z < -COURT.halfDepth + r) {
      ball.z = -COURT.halfDepth + r;
      ball.vz = -ball.vz * BALL.restitution;
    } else if (ball.z > COURT.halfDepth - r) {
      ball.z = COURT.halfDepth - r;
      ball.vz = -ball.vz * BALL.restitution;
    }

    if (ball.x < -COURT.halfWidth + r) {
      ball.x = -COURT.halfWidth + r;
      ball.vx = -ball.vx * BALL.restitution;
    } else if (ball.x > COURT.halfWidth - r) {
      ball.x = COURT.halfWidth - r;
      ball.vx = -ball.vx * BALL.restitution;
    }

    const netHalf = NET.thickness + r;
    if (Math.abs(ball.x) <= netHalf && ball.y < NET.height + r) {
      const side = ball.vx > 0 ? -1 : 1;
      ball.x = side * netHalf;
      ball.vx = -ball.vx * 0.5;
    }

    this.resolvePlayerHit('A');
    this.resolvePlayerHit('B');

    if (ball.y - r <= GROUND_Y) {
      ball.y = GROUND_Y + r;
      const scorer = ball.x < 0 ? 'B' : 'A';
      this.scorePoint(scorer);
    }
  }

  resolvePlayerHit(slot) {
    const p = this.players[slot];
    const ball = this.ball;
    const cx = p.x;
    const cy = p.y + PLAYER.radius;
    const cz = p.z;

    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dz = ball.z - cz;
    const sumR = PLAYER.radius + BALL.radius;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq >= sumR * sumR) return;

    const dist = Math.sqrt(distSq) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;

    ball.x = cx + nx * (sumR + 0.01);
    ball.y = cy + ny * (sumR + 0.01);
    ball.z = cz + nz * (sumR + 0.01);

    const toOpponent = slot === 'A' ? 1 : -1;

    ball.vx = nx * HIT.power + toOpponent * HIT.bias;
    ball.vy = Math.max(ny * HIT.power, 0) + HIT.up;
    ball.vz = nz * HIT.power;

    const speed = Math.hypot(ball.vx, ball.vy, ball.vz);
    if (speed > BALL.maxSpeed) {
      const k = BALL.maxSpeed / speed;
      ball.vx *= k;
      ball.vy *= k;
      ball.vz *= k;
    }
  }

  scorePoint(scorer) {
    this.score[scorer] += 1;
    if (this.score[scorer] >= WIN_SCORE) {
      this.phase = PHASE.GAMEOVER;
      this.winner = scorer;
      return;
    }
    this.server = scorer;
    this.phase = PHASE.POINT;
    this.pointTimer = POINT_PAUSE;
    this.placeServe();
  }

  requestRematch(slot) {
    if (this.phase !== PHASE.GAMEOVER) return;
    this.rematch[slot] = true;
    if (this.rematch.A && this.rematch.B) {
      this.resetGame('A');
    }
  }

  handleLeave(slot) {
    const other = slot === 'A' ? 'B' : 'A';
    const sock = this.sockets[other];
    if (sock) sock.emit('opponentLeft');
    this.stop();
  }

  snapshot() {
    return {
      phase: this.phase,
      score: this.score,
      server: this.server,
      winner: this.winner,
      players: {
        A: { x: this.players.A.x, y: this.players.A.y, z: this.players.A.z },
        B: { x: this.players.B.x, y: this.players.B.y, z: this.players.B.z }
      },
      ball: { x: this.ball.x, y: this.ball.y, z: this.ball.z }
    };
  }

  broadcast() {
    this.io.to(this.id).emit('state', this.snapshot());
  }
}
