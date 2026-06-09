const JOY_RADIUS = 70;

export default class Input {
  constructor() {
    this.keys = new Set();
    this.enabled = false;

    this.touch = { forward: 0, strafe: 0, jump: false };
    this.moveId = null;
    this.jumpId = null;
    this.origin = { x: 0, y: 0 };

    this.el = {
      controls: document.getElementById('touch-controls'),
      joystick: document.getElementById('joystick'),
      knob: document.getElementById('joystick-knob'),
      jumpBtn: document.getElementById('jump-btn')
    };

    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this.tracked(e.code)) {
        this.keys.add(e.code);
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  bindTouch() {
    const opts = { passive: false };

    this.el.jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.jumpId = e.changedTouches[0].identifier;
      this.touch.jump = true;
      this.el.jumpBtn.classList.add('active');
    }, opts);

    window.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      for (const t of e.changedTouches) {
        if (t.target === this.el.jumpBtn) continue;
        if (this.moveId !== null) continue;
        this.moveId = t.identifier;
        this.origin.x = t.clientX;
        this.origin.y = t.clientY;
        this.el.joystick.style.left = `${t.clientX}px`;
        this.el.joystick.style.top = `${t.clientY}px`;
        this.el.joystick.classList.remove('hidden');
        this.updateKnob(0, 0);
      }
    }, opts);

    window.addEventListener('touchmove', (e) => {
      if (!this.enabled) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== this.moveId) continue;
        e.preventDefault();
        let dx = t.clientX - this.origin.x;
        let dy = t.clientY - this.origin.y;
        const len = Math.hypot(dx, dy) || 1;
        if (len > JOY_RADIUS) {
          dx = (dx / len) * JOY_RADIUS;
          dy = (dy / len) * JOY_RADIUS;
        }
        this.touch.strafe = dx / JOY_RADIUS;
        this.touch.forward = -dy / JOY_RADIUS;
        this.updateKnob(dx, dy);
      }
    }, opts);

    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.moveId) {
          this.moveId = null;
          this.touch.forward = 0;
          this.touch.strafe = 0;
          this.el.joystick.classList.add('hidden');
        }
        if (t.identifier === this.jumpId) {
          this.jumpId = null;
          this.touch.jump = false;
          this.el.jumpBtn.classList.remove('active');
        }
      }
    };
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
  }

  updateKnob(dx, dy) {
    this.el.knob.style.transform = `translate(${dx}px, ${dy}px)`;
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
    if (v) {
      this.el.controls.classList.remove('hidden');
    } else {
      this.el.controls.classList.add('hidden');
      this.el.joystick.classList.add('hidden');
      this.keys.clear();
      this.moveId = null;
      this.jumpId = null;
      this.touch = { forward: 0, strafe: 0, jump: false };
    }
  }

  sample() {
    if (!this.enabled) return { forward: 0, strafe: 0, jump: false };

    let forward = this.touch.forward;
    let strafe = this.touch.strafe;
    let jump = this.touch.jump;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    if (this.keys.has('Space')) jump = true;

    forward = Math.max(-1, Math.min(1, forward));
    strafe = Math.max(-1, Math.min(1, strafe));

    return { forward, strafe, jump };
  }
}
