import { PHASE } from '/shared/constants.js';

export default class UI {
  constructor() {
    this.el = {
      overlay: document.getElementById('overlay'),
      menu: document.getElementById('menu'),
      searching: document.getElementById('searching'),
      gameover: document.getElementById('gameover'),
      hud: document.getElementById('hud'),
      scoreA: document.getElementById('score-a'),
      scoreB: document.getElementById('score-b'),
      banner: document.getElementById('phase-banner'),
      menuMsg: document.getElementById('menu-msg'),
      gameoverTitle: document.getElementById('gameover-title'),
      gameoverScore: document.getElementById('gameover-score'),
      rematchMsg: document.getElementById('rematch-msg'),
      tagA: document.querySelector('.tag-a'),
      tagB: document.querySelector('.tag-b')
    };
    this.slot = 'A';
  }

  showMenu(msg) {
    this.el.overlay.classList.remove('hidden');
    this.el.menu.classList.remove('hidden');
    this.el.searching.classList.add('hidden');
    this.el.gameover.classList.add('hidden');
    this.el.hud.classList.add('hidden');
    this.el.menuMsg.textContent = msg || '';
  }

  showSearching() {
    this.el.overlay.classList.remove('hidden');
    this.el.menu.classList.add('hidden');
    this.el.searching.classList.remove('hidden');
    this.el.gameover.classList.add('hidden');
  }

  showGame(slot) {
    this.slot = slot;
    this.el.overlay.classList.add('hidden');
    this.el.gameover.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
    if (slot === 'A') {
      this.el.tagA.style.background = 'var(--a)';
      this.el.tagB.style.background = 'var(--b)';
    } else {
      this.el.tagA.style.background = 'var(--b)';
      this.el.tagB.style.background = 'var(--a)';
    }
  }

  showGameOver(state) {
    this.el.overlay.classList.remove('hidden');
    this.el.gameover.classList.remove('hidden');
    this.el.rematchMsg.textContent = '';
    const win = state.winner === this.slot;
    this.el.gameoverTitle.textContent = win ? 'GANASTE' : 'PERDISTE';
    this.el.gameoverTitle.style.color = win ? 'var(--a)' : '#ff5d73';
    const me = state.score[this.slot];
    const rival = state.score[this.slot === 'A' ? 'B' : 'A'];
    this.el.gameoverScore.textContent = `${me} - ${rival}`;
  }

  rematchWaiting() {
    this.el.rematchMsg.textContent = 'Esperando al rival...';
  }

  updateState(state) {
    const me = this.slot;
    const rival = me === 'A' ? 'B' : 'A';
    this.el.scoreA.textContent = state.score[me];
    this.el.scoreB.textContent = state.score[rival];

    if (state.phase === PHASE.POINT) {
      const serving = state.server === me ? 'TU SAQUE' : 'SAQUE RIVAL';
      this.el.banner.textContent = serving;
      this.el.banner.classList.remove('hidden');
    } else {
      this.el.banner.classList.add('hidden');
    }
  }
}
