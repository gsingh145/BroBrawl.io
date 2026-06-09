export const CFG = {
  GRAVITY: 0.55,
  MOVE_SPEED: 4.5,
  JUMP_VELOCITY: -11,
  PLAYER_W: 32,
  PLAYER_H: 48,

  ATTACK_DIRS: {
    neutral: { active: 3, cd: 4, dmg: 3, kb: 5, w: 20, h: 20 },
    side:    { active: 4, cd: 6, dmg: 8, kb: 10, w: 40, h: 28 },
    up:      { active: 5, cd: 7, dmg: 7, kb: 9, w: 32, h: 36 },
    down:    { active: 4, cd: 6, dmg: 6, kb: 8, w: 36, h: 18 },
  },

  SPECIAL: {
    maxMeter: 100,
    meterGainMult: 1.0,
    meterDamageTakenMult: 0.33,
    meterDrain: 25,
  },

  SPECIAL_DIRS: {
    neutral: { active: 6, cd: 12, dmg: 15, kb: 22, w: 64, h: 40 },
    side:    { active: 6, cd: 12, dmg: 15, kb: 22, w: 64, h: 40 },
    up:      { active: 6, cd: 12, dmg: 15, kb: 22, w: 64, h: 40 },
    down:    { active: 6, cd: 12, dmg: 15, kb: 22, w: 64, h: 40 },
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

  SHIELD: { maxHealth: 100, baseReduction: 0.2, drainRate: 1 },

  SPAWN_POSITIONS: [
    { x: 250, y: 100 },
    { x: 550, y: 100 },
  ],
};
