import Network from './Network.js';
import Input from './Input.js';
import Game from './Game.js';
import UI from './UI.js';
import { PHASE } from '/shared/constants.js';

const canvas = document.getElementById('game-canvas');
const network = new Network();
const input = new Input();
const ui = new UI();
const game = new Game(canvas, network, input);

let slot = null;
let gameOverShown = false;

document.getElementById('play-btn').addEventListener('click', () => {
  network.findMatch();
});

document.getElementById('cancel-btn').addEventListener('click', () => {
  network.cancelMatch();
  ui.showMenu();
});

document.getElementById('rematch-btn').addEventListener('click', () => {
  network.rematch();
  ui.rematchWaiting();
});

network.on('searching', () => ui.showSearching());

network.on('matchFound', (data) => {
  slot = data.slot;
  gameOverShown = false;
  ui.showGame(slot);
  game.start(slot);
});

network.on('state', (state) => {
  game.applyState(state);
  ui.updateState(state);

  if (state.phase === PHASE.GAMEOVER && !gameOverShown) {
    gameOverShown = true;
    input.setEnabled(false);
    ui.showGameOver(state);
  } else if (state.phase !== PHASE.GAMEOVER && gameOverShown) {
    gameOverShown = false;
    ui.showGame(slot);
    input.setEnabled(true);
  }
});

network.on('opponentLeft', () => {
  game.stop();
  ui.showMenu('Tu rival se desconectó.');
});

ui.showMenu();
