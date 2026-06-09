import Scene from './Scene.js';

export default class Game {
  constructor(canvas, network, input) {
    this.scene = new Scene(canvas);
    this.network = network;
    this.input = input;
    this.slot = null;
    this.running = false;
    this.state = null;
    this.rendered = {
      A: { x: 0, y: 0, z: 0 },
      B: { x: 0, y: 0, z: 0 },
      ball: { x: 0, y: 0, z: 0 }
    };
    this.lastSend = 0;
    this.onPhase = null;

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  start(slot) {
    this.slot = slot;
    this.scene.setSide(slot);
    this.running = true;
    this.input.setEnabled(true);
  }

  stop() {
    this.running = false;
    this.input.setEnabled(false);
    this.state = null;
  }

  applyState(state) {
    this.state = state;
  }

  loop(now) {
    requestAnimationFrame(this.loop);

    if (this.running && now - this.lastSend > 33) {
      this.network.sendInput(this.input.sample());
      this.lastSend = now;
    }

    if (this.state) {
      this.interpolate('A', this.state.players.A);
      this.interpolate('B', this.state.players.B);
      this.interpolateBall(this.state.ball);

      this.scene.updatePlayer('A', this.rendered.A.x, this.rendered.A.y, this.rendered.A.z);
      this.scene.updatePlayer('B', this.rendered.B.x, this.rendered.B.y, this.rendered.B.z);
      this.scene.updateBall(this.rendered.ball.x, this.rendered.ball.y, this.rendered.ball.z);
    }

    this.scene.render();
  }

  interpolate(slot, target) {
    const r = this.rendered[slot];
    r.x += (target.x - r.x) * 0.35;
    r.y += (target.y - r.y) * 0.35;
    r.z += (target.z - r.z) * 0.35;
  }

  interpolateBall(target) {
    const r = this.rendered.ball;
    r.x += (target.x - r.x) * 0.5;
    r.y += (target.y - r.y) * 0.5;
    r.z += (target.z - r.z) * 0.5;
  }
}
