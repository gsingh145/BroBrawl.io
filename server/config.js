module.exports = {
  TICK_RATE: 50,
  GRAVITY: 0.55,
  FRICTION: 0.85,
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

  SPAWN_POSITIONS: [
    { x: 200, y: 200 },
    { x: 600, y: 200 },
  ],
};
