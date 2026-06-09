export const CFG = {
  GRAVITY: 0.55,
  MOVE_SPEED: 4.5,
  JUMP_VELOCITY: -11,
  PLAYER_W: 32,
  PLAYER_H: 48,

  SPECIAL: {
    maxMeter: 100,
    meterGainMult: 1.0,
    meterDamageTakenMult: 0.33,
    meterDrain: 25,
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
