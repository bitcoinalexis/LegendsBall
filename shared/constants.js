export const TICK_RATE = 60;

export const COURT = {
  halfWidth: 8,
  halfDepth: 5,
  netClearance: 0.5
};

export const NET = {
  height: 2,
  thickness: 0.12
};

export const PLAYER = {
  radius: 0.7,
  speed: 8,
  jumpV: 8.5,
  gravity: 22
};

export const BALL = {
  radius: 0.35,
  gravity: 18,
  restitution: 0.7,
  maxSpeed: 24
};

export const HIT = {
  forward: 10,
  up: 9.5,
  lateral: 7,
  reach: 0.35,
  spikeBonus: 2.5,
  moveInfluence: 2
};

export const BALL_SUBSTEPS = 4;

export const WIN_SCORE = 7;
export const GROUND_Y = 0;

export const PHASE = {
  POINT: 'point',
  PLAY: 'play',
  GAMEOVER: 'gameover'
};

export const POINT_PAUSE = 1.4;
