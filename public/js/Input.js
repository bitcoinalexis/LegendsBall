export default class Input {
  constructor() {
    this.keys = new Set();
    this.enabled = false;

    window.addEventListener('keydown', (e) => {
      if (this.tracked(e.code)) {
        this.keys.add(e.code);
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  tracked(code) {
    return [
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Space'
    ].includes(code);
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.keys.clear();
  }

  sample() {
    if (!this.enabled) return { forward: 0, strafe: 0, jump: false };

    let forward = 0;
    let strafe = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;

    const jump = this.keys.has('Space');

    return { forward, strafe, jump };
  }
}
