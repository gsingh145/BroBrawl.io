module.exports = {
  TICK_RATE: 50,
  GRAVITY: 0.55,
  FRICTION: 0.85,
  MOVE_SPEED: 4.5,
  JUMP_VELOCITY: -13,
  MIN_JUMP_VELOCITY: -13,
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

  BLAST_ZONE_LEFT: -120,
  BLAST_ZONE_RIGHT: 920,
  BLAST_ZONE_TOP: -120,
  BLAST_ZONE_BOTTOM: 620,

  PLATFORMS: [
    { left: 0, right: 800, surfaceY: 474 },
    { left: 170, right: 330, surfaceY: 390 },
    { left: 470, right: 630, surfaceY: 320 },
    { left: 335, right: 465, surfaceY: 250 },
    { left: 195, right: 305, surfaceY: 190 },
    { left: 505, right: 595, surfaceY: 140 },
  ],

  SHIELD: { maxHealth: 100, baseReduction: 0.2, drainRate: 1 },

  SPAWN_POSITIONS: [
    { x: 200, y: 200 },
    { x: 600, y: 200 },
  ],
};
