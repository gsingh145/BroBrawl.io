export const CFG = {
  GRAVITY: 0.6,
  MOVE_SPEED: 4,
  JUMP_VELOCITY: -10,
  PLAYER_W: 32,
  PLAYER_H: 48,

  ATTACK_DIRS: {
    neutral: { active: 3, cd: 4, dmg: 3, kb: 5, w: 20, h: 20 },
    side:    { active: 4, cd: 6, dmg: 8, kb: 10, w: 40, h: 28 },
    up:      { active: 5, cd: 7, dmg: 7, kb: 9, w: 32, h: 36 },
    down:    { active: 4, cd: 6, dmg: 6, kb: 8, w: 36, h: 18 },
  },

  SPECIAL: {
    active: 6,
    cd: 12,
    dmg: 15,
    kb: 22,
    w: 64,
    h: 40,
    maxMeter: 100,
    meterGainMult: 1.0,
  },

  DASH_SPEED: 14,
  DASH_DURATION: 6,

  FAST_FALL_BOOST: 5,
  MAX_FALL_SPEED: 15,

  PLATFORMS: [
    { left: 150, right: 650, surfaceY: 474 },
    { left: 160, right: 340, surfaceY: 328 },
    { left: 460, right: 640, surfaceY: 268 },
    { left: 340, right: 460, surfaceY: 188 },
  ],

  SPAWN_POSITIONS: [
    { x: 250, y: 100 },
    { x: 550, y: 100 },
  ],
};
