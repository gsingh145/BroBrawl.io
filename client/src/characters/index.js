const ATK = (o) => ({ active: 3, cd: 5, dmg: 3, kb: 5, w: 20, h: 20, ...o });

function drawShielded(g, drawBody) {
  drawBody(g);
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(16, 24, 30, 40);
}

function rectIdle(g) { g.fillRect(12, 6, 8, 8); g.fillRect(7, 15, 18, 22); g.fillRect(12, 28, 3, 12); g.fillRect(17, 28, 3, 12); }
function rectWalk1(g) { g.fillRect(12, 6, 8, 8); g.fillRect(7, 15, 18, 22); g.fillRect(10, 28, 3, 14); g.fillRect(18, 28, 3, 10); }
function rectWalk2(g) { g.fillRect(12, 6, 8, 8); g.fillRect(7, 15, 18, 22); g.fillRect(11, 28, 3, 10); g.fillRect(19, 28, 3, 14); }
function rectJump(g) { g.fillRect(12, 6, 8, 8); g.fillRect(7, 15, 18, 20); g.fillRect(12, 26, 3, 8); g.fillRect(17, 26, 3, 8); }

export const CHARACTERS = {
  sensei_waisas: {
    id: 'sensei_waisas', name: 'Sensei Waisas',
    color: 0xff6600, tint: 0xff8833,
    description: 'Ancient master of the blade.',
    moveSpeed: 4.5, jumpVelocity: -11, weight: 0.9, dmgDealtMult: 1.1, dmgTakenMult: 0.9, stocks: 3, jumpCount: 2,
    dashSpeed: 14, dashDuration: 6,
    fastFallBoost: 5, maxFallSpeed: 15,
    specialMeter: { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 },
    attacks: {
      neutral: ATK({ active: 3, cd: 5,  dmg: 5,  kb: 6,  w: 28, h: 20 }),
      side:    ATK({ active: 4, cd: 7,  dmg: 8,  kb: 10, w: 46, h: 28 }),
      up:      ATK({ active: 4, cd: 7,  dmg: 6,  kb: 9,  w: 34, h: 36 }),
      down:    ATK({ active: 4, cd: 6,  dmg: 6,  kb: 7,  w: 40, h: 18 }),
    },
    specials: {
      neutral: ATK({ active: 5, cd: 12, dmg: 15, kb: 22, w: 68, h: 40 }),
      side:    ATK({ active: 5, cd: 12, dmg: 15, kb: 22, w: 68, h: 40 }),
      up:      ATK({ active: 5, cd: 12, dmg: 15, kb: 22, w: 68, h: 40 }),
      down:    ATK({ active: 5, cd: 12, dmg: 15, kb: 22, w: 68, h: 40 }),
    },
    images: {
      idle: '/images/characters/sensei_waisas_idle.png',
      walk1: '/images/characters/sensei_waisas_walk.png',
      walk2: '/images/characters/sensei_waisas_walk.png',
      jump: '/images/characters/sensei_waisas_jump.png',
      shield: '/images/characters/sensei_waisas_shield.png',
    },
    textures: {
      idle(g) { rectIdle(g); },
      walk1(g) { rectWalk1(g); },
      walk2(g) { rectWalk2(g); },
      jump(g) { rectJump(g); },
      shield(g) { drawShielded(g, rectIdle); },
    },
  },
  brawn_boy: {
    id: 'brawn_boy', name: 'Brawn Boy',
    color: 0xff4444, tint: 0xff6666,
    description: 'Brawny and solid.',
    moveSpeed: 3.0, jumpVelocity: -9, weight: 0.6, dmgDealtMult: 1.4, dmgTakenMult: 0.8, stocks: 4, jumpCount: 1,
    dashSpeed: 10, dashDuration: 8,
    fastFallBoost: 4, maxFallSpeed: 12,
    specialMeter: { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 },
    attacks: {
      neutral: ATK({ active: 5, cd: 10, dmg: 10, kb: 12, w: 26, h: 24, armor: true }),
      side:    ATK({ active: 6, cd: 14, dmg: 14, kb: 18, w: 38, h: 30, armor: true }),
      up:      ATK({ active: 7, cd: 12, dmg: 10, kb: 14, w: 32, h: 32, armor: true }),
      down:    ATK({ active: 5, cd: 10, dmg: 12, kb: 10, w: 36, h: 20, armor: true }),
    },
    specials: {
      neutral: ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48, armor: true }),
      side:    ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48, armor: true }),
      up:      ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48, armor: true }),
      down:    ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48, armor: true }),
    },
    images: {
      idle: '/images/characters/brawn_boy_idle.png',
      walk1: '/images/characters/brawn_boy_walk.png',
      walk2: '/images/characters/brawn_boy_walk.png',
      jump: '/images/characters/brawn_boy_jump.png',
      shield: '/images/characters/brawn_boy_shield.png',
    },
    textures: {
      idle(g) { rectIdle(g); },
      walk1(g) { rectWalk1(g); },
      walk2(g) { rectWalk2(g); },
      jump(g) { rectJump(g); },
      shield(g) { drawShielded(g, rectIdle); },
    },
  },
  the_damned: {
    id: 'the_damned', name: 'The Damned',
    color: 0x44ddff, tint: 0x66eeff,
    description: 'Cursed soul commanding dark energies.',
    moveSpeed: 4.0, jumpVelocity: -10, weight: 1.0, dmgDealtMult: 0.9, dmgTakenMult: 1.0, stocks: 3, jumpCount: 2,
    dashSpeed: 14, dashDuration: 6,
    fastFallBoost: 5, maxFallSpeed: 15,
    specialMeter: { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 },
    attacks: {
      neutral: ATK({ active: 4, cd: 8,  dmg: 4,  kb: 6,  w: 14, h: 18 }),
      side:    ATK({ active: 5, cd: 10, dmg: 0,  kb: 0,  w: 20, h: 20, spawnsProjectile: true }),
      up:      ATK({ active: 6, cd: 9,  dmg: 6,  kb: 8,  w: 30, h: 32 }),
      down:    ATK({ active: 4, cd: 8,  dmg: 5,  kb: 6,  w: 42, h: 16 }),
    },
    specials: {
      neutral: ATK({ active: 7, cd: 14, dmg: 12, kb: 18, w: 80, h: 36 }),
      side:    ATK({ active: 7, cd: 14, dmg: 0,  kb: 0,  w: 24, h: 24, spawnsProjectile: true }),
      up:      ATK({ active: 7, cd: 14, dmg: 12, kb: 18, w: 80, h: 36 }),
      down:    ATK({ active: 7, cd: 14, dmg: 12, kb: 18, w: 80, h: 36 }),
    },
    images: {
      idle: '/images/characters/the_damned_idle.png',
      walk1: '/images/characters/the_damned_walk.png',
      walk2: '/images/characters/the_damned_walk.png',
      jump: '/images/characters/the_damned_jump.png',
      shield: '/images/characters/the_damned_shield.png',
    },
    textures: {
      idle(g) { rectIdle(g); },
      walk1(g) { rectWalk1(g); },
      walk2(g) { rectWalk2(g); },
      jump(g) { rectJump(g); },
      shield(g) { drawShielded(g, rectIdle); },
    },
  },
  nam_saiyan: {
    id: 'nam_saiyan', name: 'Nam Saiyan',
    color: 0xffcc00, tint: 0xffdd44,
    description: 'Agile combo fighter with lightning fists.',
    moveSpeed: 5.0, jumpVelocity: -11, weight: 0.85, dmgDealtMult: 0.85, dmgTakenMult: 1.05, stocks: 3, jumpCount: 2,
    dashSpeed: 16, dashDuration: 5,
    fastFallBoost: 6, maxFallSpeed: 16,
    specialMeter: { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 },
    attacks: {
      neutral: ATK({ active: 2, cd: 4,  dmg: 2,  kb: 3,  w: 18, h: 16 }),
      side:    ATK({ active: 3, cd: 5,  dmg: 3,  kb: 5,  w: 30, h: 20, lunge: 4 }),
      up:      ATK({ active: 3, cd: 5,  dmg: 3,  kb: 5,  w: 24, h: 28 }),
      down:    ATK({ active: 3, cd: 4,  dmg: 3,  kb: 4,  w: 28, h: 14 }),
    },
    specials: {
      neutral: ATK({ active: 6, cd: 12, dmg: 10, kb: 14, w: 56, h: 36 }),
      side:    ATK({ active: 6, cd: 12, dmg: 10, kb: 14, w: 56, h: 36 }),
      up:      ATK({ active: 6, cd: 12, dmg: 10, kb: 14, w: 56, h: 36 }),
      down:    ATK({ active: 6, cd: 12, dmg: 10, kb: 14, w: 56, h: 36 }),
    },
    images: {
      idle: '/images/characters/nam_saiyan_idle.png',
      walk1: '/images/characters/nam_saiyan_walk.png',
      walk2: '/images/characters/nam_saiyan_walk.png',
      jump: '/images/characters/nam_saiyan_jump.png',
      shield: '/images/characters/nam_saiyan_shield.png',
    },
    textures: {
      idle(g) { rectIdle(g); },
      walk1(g) { rectWalk1(g); },
      walk2(g) { rectWalk2(g); },
      jump(g) { rectJump(g); },
      shield(g) { drawShielded(g, rectIdle); },
    },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
