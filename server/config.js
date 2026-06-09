module.exports = {
  TICK_RATE: 50,
  GRAVITY: 0.55,
  FRICTION: 0.85,
  MOVE_SPEED: 4.5,
  JUMP_VELOCITY: -13,
  MIN_JUMP_VELOCITY: -13,
  PLAYER_W: 40,
  PLAYER_H: 60,

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
    { left: 260, right: 440, surfaceY: 422 },
    { left: 490, right: 610, surfaceY: 362 },
    { left: 180, right: 320, surfaceY: 302 },
    { left: 350, right: 450, surfaceY: 232 },
    { left: 495, right: 605, surfaceY: 162 },
    { left: 160, right: 240, surfaceY: 142 },
  ],

  SHIELD: { maxHealth: 100, baseReduction: 0.2, drainRate: 1 },

  SPAWN_POSITIONS: [
    { x: 200, y: 200 },
    { x: 600, y: 200 },
  ],
};
