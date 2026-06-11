module.exports = {
  TICK_RATE: 50,
  GRAVITY: 0.55,
  FRICTION: 0.85,
  MIN_JUMP_VELOCITY: -13,
  PLAYER_W: 40,
  PLAYER_H: 60,

  BLAST_ZONE_LEFT: -120,
  BLAST_ZONE_RIGHT: 920,
  BLAST_ZONE_TOP: -120,
  BLAST_ZONE_BOTTOM: 620,

  PLATFORMS: [
    { left: 120, right: 700, surfaceY: 380 },
    { left: 180, right: 320, surfaceY: 296 },
    { left: 490, right: 610, surfaceY: 280 },
    { left: 350, right: 450, surfaceY: 226 },
    { left: 160, right: 280, surfaceY: 180 },
    { left: 495, right: 605, surfaceY: 156 },
  ],

  SHIELD: { maxHealth: 100, baseReduction: 0.2, drainRate: 1 },

  SPAWN_POSITIONS: [
    { x: 200, y: 200 },
    { x: 600, y: 200 },
  ],
};
