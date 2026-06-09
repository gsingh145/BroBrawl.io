const ATK = (o) => ({ active: 3, cd: 5, dmg: 3, kb: 5, w: 20, h: 20, ...o });

function stickIdle(g) {
  g.fillCircle(16, 10, 7);
  g.fillRect(10, 18, 12, 14);
  g.fillRect(6, 20, 4, 4);
  g.fillRect(22, 20, 4, 4);
  g.fillRect(12, 33, 3, 11);
  g.fillRect(17, 33, 3, 11);
  g.fillTriangle(24, 20, 32, 24, 24, 28);
}
function stickWalk1(g) {
  g.fillCircle(16, 10, 7);
  g.fillRect(10, 18, 12, 14);
  g.fillRect(5, 21, 4, 3);
  g.fillRect(23, 19, 4, 6);
  g.fillRect(10, 33, 3, 13);
  g.fillRect(18, 33, 3, 9);
  g.fillTriangle(25, 19, 33, 23, 25, 27);
}
function stickWalk2(g) {
  g.fillCircle(16, 10, 7);
  g.fillRect(10, 18, 12, 14);
  g.fillRect(5, 19, 4, 6);
  g.fillRect(23, 21, 4, 3);
  g.fillRect(11, 33, 3, 9);
  g.fillRect(19, 33, 3, 13);
  g.fillTriangle(25, 19, 33, 23, 25, 27);
}
function stickJump(g) {
  g.fillCircle(16, 10, 7);
  g.fillRect(10, 18, 12, 12);
  g.fillRect(5, 13, 4, 6);
  g.fillRect(23, 13, 4, 6);
  g.fillRect(12, 31, 3, 7);
  g.fillRect(17, 31, 3, 7);
  g.fillTriangle(25, 19, 33, 23, 25, 27);
}
function stickShield(g) {
  stickIdle(g);
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(16, 24, 30, 40);
}

const DEFAULTS = { idle: stickIdle, walk1: stickWalk1, walk2: stickWalk2, jump: stickJump, shield: stickShield };

function drawShielded(g, drawBody) {
  drawBody(g);
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(16, 24, 30, 40);
}

export const CLASSES = {
  heavy: {
    moveSpeed: 3.0, jumpVelocity: -9, weight: 0.6,
    dmgDealtMult: 1.4, dmgTakenMult: 0.8, stocks: 4, jumpCount: 1,
    attacks: {
      neutral: ATK({ active: 5, cd: 10, dmg: 10, kb: 12, w: 26, h: 24 }),
      side:    ATK({ active: 6, cd: 14, dmg: 14, kb: 18, w: 38, h: 30 }),
      up:      ATK({ active: 7, cd: 12, dmg: 10, kb: 14, w: 32, h: 32 }),
      down:    ATK({ active: 5, cd: 10, dmg: 12, kb: 10, w: 36, h: 20 }),
    },
    specials: {
      neutral: ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48 }),
      side:    ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48 }),
      up:      ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48 }),
      down:    ATK({ active: 8, cd: 18, dmg: 20, kb: 26, w: 72, h: 48 }),
    },
  },
  zoner: {
    moveSpeed: 4.0, jumpVelocity: -10, weight: 1.0,
    dmgDealtMult: 0.9, dmgTakenMult: 1.0, stocks: 3, jumpCount: 2,
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
  },
  combo: {
    moveSpeed: 5.5, jumpVelocity: -12, weight: 1.2,
    dmgDealtMult: 0.8, dmgTakenMult: 1.1, stocks: 3, jumpCount: 2,
    attacks: {
      neutral: ATK({ active: 2, cd: 3,  dmg: 2,  kb: 3,  w: 18, h: 18 }),
      side:    ATK({ active: 3, cd: 5,  dmg: 5,  kb: 6,  w: 36, h: 24, lunge: 4 }),
      up:      ATK({ active: 3, cd: 5,  dmg: 4,  kb: 7,  w: 28, h: 32 }),
      down:    ATK({ active: 3, cd: 5,  dmg: 4,  kb: 5,  w: 32, h: 16 }),
    },
    specials: {
      neutral: ATK({ active: 4, cd: 10, dmg: 10, kb: 16, w: 56, h: 36 }),
      side:    ATK({ active: 4, cd: 10, dmg: 10, kb: 16, w: 56, h: 36 }),
      up:      ATK({ active: 4, cd: 10, dmg: 10, kb: 16, w: 56, h: 36 }),
      down:    ATK({ active: 4, cd: 10, dmg: 10, kb: 16, w: 56, h: 36 }),
    },
  },
  sword: {
    moveSpeed: 4.5, jumpVelocity: -11, weight: 0.9,
    dmgDealtMult: 1.1, dmgTakenMult: 0.9, stocks: 3, jumpCount: 2,
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
  },
};

function classStats(cls) {
  const c = CLASSES[cls];
  return {
    moveSpeed: c.moveSpeed, jumpVelocity: c.jumpVelocity,
    weight: c.weight, dmgDealtMult: c.dmgDealtMult,
    dmgTakenMult: c.dmgTakenMult, stocks: c.stocks, jumpCount: c.jumpCount,
    attacks: c.attacks, specials: c.specials,
  };
}

function rectIdle(g, w, h) {
  const l = 16 - w / 2, t = 16 - h / 2;
  g.fillRect(l, t, w, h);
}
function rectWalk1(g, w, h) {
  const l = 16 - w / 2, t = 16 - h / 2;
  g.fillRect(l - 2, t + 2, w, h);
  g.fillRect(l + 2, t - 2, w, h);
}
function rectWalk2(g, w, h) {
  const l = 16 - w / 2, t = 16 - h / 2;
  g.fillRect(l + 2, t + 2, w, h);
  g.fillRect(l - 2, t - 2, w, h);
}
function rectJump(g, w, h) {
  const l = 16 - w / 2, t = 14 - h / 2;
  g.fillRect(l, t, w, h);
}

export const CHARACTERS = {
  brick: {
    id: 'brick', name: 'Brick', class: 'heavy',
    color: 0xff4444, tint: 0xff6666,
    description: 'A slow-moving wall of muscle.',
    ...classStats('heavy'),
    images: {
      idle: '/images/characters/brick_idle.svg',
      walk1: '/images/characters/brick_walk1.svg',
      walk2: '/images/characters/brick_walk2.svg',
      jump: '/images/characters/brick_jump.svg',
      shield: '/images/characters/brick_shield.svg',
    },
    textures: {
      idle(g) { rectIdle(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      walk1(g) { rectWalk1(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      walk2(g) { rectWalk2(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      jump(g) { rectJump(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      shield(g) { drawShielded(g, (g) => { rectIdle(g, 18, 22); g.fillRect(12, 6, 8, 8); }); },
    },
  },
  goliath: {
    id: 'goliath', name: 'Goliath', class: 'heavy',
    color: 0xcc44ff, tint: 0xdd66ff,
    description: 'Crushing force, unbreakable defense.',
    ...classStats('heavy'),
    images: {
      idle: '/images/characters/goliath_idle.svg',
      walk1: '/images/characters/goliath_walk1.svg',
      walk2: '/images/characters/goliath_walk2.svg',
      jump: '/images/characters/goliath_jump.svg',
      shield: '/images/characters/goliath_shield.svg',
    },
    textures: {
      idle(g) { g.fillCircle(16, 10, 9); g.fillRect(8, 18, 16, 18); g.fillRect(10, 36, 4, 10); g.fillRect(18, 36, 4, 10); g.fillRect(4, 20, 4, 8); g.fillRect(24, 20, 4, 8); },
      walk1(g) { g.fillCircle(16, 10, 9); g.fillRect(8, 18, 16, 18); g.fillRect(8, 36, 4, 10); g.fillRect(20, 36, 4, 10); g.fillRect(4, 22, 4, 6); g.fillRect(24, 20, 4, 8); },
      walk2(g) { g.fillCircle(16, 10, 9); g.fillRect(8, 18, 16, 18); g.fillRect(10, 36, 4, 10); g.fillRect(18, 36, 4, 10); g.fillRect(4, 20, 4, 8); g.fillRect(24, 22, 4, 6); },
      jump(g) { g.fillCircle(16, 10, 9); g.fillRect(8, 18, 16, 16); g.fillRect(4, 12, 4, 8); g.fillRect(24, 12, 4, 8); g.fillRect(10, 34, 4, 6); g.fillRect(18, 34, 4, 6); },
      shield(g) { drawShielded(g, (g) => { g.fillCircle(16, 10, 9); g.fillRect(8, 18, 16, 18); g.fillRect(10, 36, 4, 10); g.fillRect(18, 36, 4, 10); g.fillRect(4, 20, 4, 8); g.fillRect(24, 20, 4, 8); }); },
    },
  },
  sniper: {
    id: 'sniper', name: 'Sniper', class: 'zoner',
    color: 0x44ff44, tint: 0x66ff66,
    description: 'Picks apart foes from a distance.',
    ...classStats('zoner'),
    images: {
      idle: '/images/characters/sniper_idle.svg',
      walk1: '/images/characters/sniper_walk1.svg',
      walk2: '/images/characters/sniper_walk2.svg',
      jump: '/images/characters/sniper_jump.svg',
      shield: '/images/characters/sniper_shield.svg',
    },
    textures: {
      idle(g) { g.fillCircle(16, 9, 6); g.fillRect(11, 15, 10, 12); g.fillRect(7, 17, 4, 3); g.fillRect(21, 17, 4, 3); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); g.fillRect(23, 15, 6, 4); },
      walk1(g) { g.fillCircle(16, 9, 6); g.fillRect(11, 15, 10, 12); g.fillRect(6, 18, 4, 2); g.fillRect(22, 16, 4, 5); g.fillRect(10, 28, 3, 14); g.fillRect(18, 28, 3, 10); g.fillRect(23, 15, 6, 4); },
      walk2(g) { g.fillCircle(16, 9, 6); g.fillRect(11, 15, 10, 12); g.fillRect(6, 16, 4, 5); g.fillRect(22, 18, 4, 2); g.fillRect(11, 28, 3, 10); g.fillRect(19, 28, 3, 14); g.fillRect(23, 15, 6, 4); },
      jump(g) { g.fillCircle(16, 9, 6); g.fillRect(11, 15, 10, 10); g.fillRect(6, 11, 4, 5); g.fillRect(22, 11, 4, 5); g.fillRect(12, 26, 3, 8); g.fillRect(17, 26, 3, 8); g.fillRect(23, 15, 6, 4); },
      shield(g) { drawShielded(g, (g) => { g.fillCircle(16, 9, 6); g.fillRect(11, 15, 10, 12); g.fillRect(7, 17, 4, 3); g.fillRect(21, 17, 4, 3); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); g.fillRect(23, 15, 6, 4); }); },
    },
  },
  wizard: {
    id: 'wizard', name: 'Wizard', class: 'zoner',
    color: 0x44ddff, tint: 0x66eeff,
    description: 'Arcane projectiles control the battlefield.',
    ...classStats('zoner'),
    images: {
      idle: '/images/characters/wizard_idle.svg',
      walk1: '/images/characters/wizard_walk1.svg',
      walk2: '/images/characters/wizard_walk2.svg',
      jump: '/images/characters/wizard_jump.svg',
      shield: '/images/characters/wizard_shield.svg',
    },
    textures: {
      idle(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(7, 19, 4, 5); g.fillRect(21, 19, 4, 5); g.fillRect(12, 31, 3, 10); g.fillRect(17, 31, 3, 10); },
      walk1(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(6, 20, 4, 4); g.fillRect(22, 18, 4, 6); g.fillRect(10, 31, 3, 12); g.fillRect(18, 31, 3, 8); },
      walk2(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(6, 18, 4, 6); g.fillRect(22, 20, 4, 4); g.fillRect(11, 31, 3, 8); g.fillRect(19, 31, 3, 12); },
      jump(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 12); g.fillRect(6, 13, 4, 6); g.fillRect(22, 13, 4, 6); g.fillRect(12, 29, 3, 6); g.fillRect(17, 29, 3, 6); },
      shield(g) { drawShielded(g, (g) => { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(7, 19, 4, 5); g.fillRect(21, 19, 4, 5); g.fillRect(12, 31, 3, 10); g.fillRect(17, 31, 3, 10); }); },
    },
  },
  swift: {
    id: 'swift', name: 'Swift', class: 'combo',
    color: 0xffff44, tint: 0xffff66,
    description: 'Lightning-fast strikes and movement.',
    ...classStats('combo'),
    images: {
      idle: '/images/characters/swift_idle.svg',
      walk1: '/images/characters/swift_walk1.svg',
      walk2: '/images/characters/swift_walk2.svg',
      jump: '/images/characters/swift_jump.svg',
      shield: '/images/characters/swift_shield.svg',
    },
    textures: {
      idle(g) { g.fillCircle(16, 10, 6); g.fillRect(11, 16, 10, 12); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); g.fillRect(6, 18, 5, 3); g.fillRect(21, 18, 5, 3); },
      walk1(g) { g.fillCircle(16, 10, 6); g.fillRect(11, 16, 10, 12); g.fillRect(10, 28, 3, 14); g.fillRect(19, 28, 3, 10); g.fillRect(5, 20, 5, 2); g.fillRect(22, 18, 5, 5); },
      walk2(g) { g.fillCircle(16, 10, 6); g.fillRect(11, 16, 10, 12); g.fillRect(12, 28, 3, 10); g.fillRect(17, 28, 3, 14); g.fillRect(5, 18, 5, 5); g.fillRect(22, 20, 5, 2); },
      jump(g) { g.fillCircle(16, 10, 6); g.fillRect(11, 16, 10, 10); g.fillRect(6, 12, 5, 5); g.fillRect(21, 12, 5, 5); g.fillRect(12, 27, 3, 7); g.fillRect(17, 27, 3, 7); },
      shield(g) { drawShielded(g, (g) => { g.fillCircle(16, 10, 6); g.fillRect(11, 16, 10, 12); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); g.fillRect(6, 18, 5, 3); g.fillRect(21, 18, 5, 3); }); },
    },
  },
  shadow: {
    id: 'shadow', name: 'Shadow', class: 'combo',
    color: 0x8844ff, tint: 0xaa66ff,
    description: 'Elusive assassin with deadly combos.',
    ...classStats('combo'),
    images: {
      idle: '/images/characters/shadow_idle.svg',
      walk1: '/images/characters/shadow_walk1.svg',
      walk2: '/images/characters/shadow_walk2.svg',
      jump: '/images/characters/shadow_jump.svg',
      shield: '/images/characters/shadow_shield.svg',
    },
    textures: {
      idle(g) { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(7, 18, 4, 4); g.fillRect(21, 18, 4, 4); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); },
      walk1(g) { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(6, 19, 4, 3); g.fillRect(22, 17, 4, 6); g.fillRect(10, 28, 3, 14); g.fillRect(19, 28, 3, 10); },
      walk2(g) { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(6, 17, 4, 6); g.fillRect(22, 19, 4, 3); g.fillRect(11, 28, 3, 10); g.fillRect(18, 28, 3, 14); },
      jump(g) { g.fillTriangle(8, 14, 24, 14, 16, 0); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 10); g.fillRect(6, 12, 4, 5); g.fillRect(22, 12, 4, 5); g.fillRect(12, 27, 3, 7); g.fillRect(17, 27, 3, 7); },
      shield(g) { drawShielded(g, (g) => { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(7, 18, 4, 4); g.fillRect(21, 18, 4, 4); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); }); },
    },
  },
  blade: {
    id: 'blade', name: 'Blade', class: 'sword',
    color: 0x4488ff, tint: 0x66aaff,
    description: 'Precise swordplay with perfect spacing.',
    ...classStats('sword'),
    images: {
      idle: '/images/characters/blade_idle.svg',
      walk1: '/images/characters/blade_walk1.svg',
      walk2: '/images/characters/blade_walk2.svg',
      jump: '/images/characters/blade_jump.svg',
      shield: '/images/characters/blade_shield.svg',
    },
    textures: {
      idle(g) { g.fillRect(12, 2, 8, 10); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(7, 17, 4, 5); g.fillRect(21, 17, 4, 5); g.fillRect(12, 29, 3, 12); g.fillRect(17, 29, 3, 12); g.fillRect(24, 12, 4, 18); },
      walk1(g) { g.fillRect(12, 2, 8, 10); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(6, 18, 4, 4); g.fillRect(22, 16, 4, 6); g.fillRect(10, 29, 3, 14); g.fillRect(18, 29, 3, 10); g.fillRect(24, 12, 4, 18); },
      walk2(g) { g.fillRect(12, 2, 8, 10); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(6, 16, 4, 6); g.fillRect(22, 18, 4, 4); g.fillRect(11, 29, 3, 10); g.fillRect(19, 29, 3, 14); g.fillRect(24, 12, 4, 18); },
      jump(g) { g.fillRect(12, 2, 8, 10); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 12); g.fillRect(6, 11, 4, 5); g.fillRect(22, 11, 4, 5); g.fillRect(12, 27, 3, 8); g.fillRect(17, 27, 3, 8); g.fillRect(24, 12, 4, 18); },
      shield(g) { drawShielded(g, (g) => { g.fillRect(12, 2, 8, 10); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(7, 17, 4, 5); g.fillRect(21, 17, 4, 5); g.fillRect(12, 29, 3, 12); g.fillRect(17, 29, 3, 12); g.fillRect(24, 12, 4, 18); }); },
    },
  },
  valkyrie: {
    id: 'valkyrie', name: 'Valkyrie', class: 'sword',
    color: 0xff8800, tint: 0xffaa44,
    description: 'Balanced offense with righteous reach.',
    ...classStats('sword'),
    images: {
      idle: '/images/characters/valkyrie_idle.svg',
      walk1: '/images/characters/valkyrie_walk1.svg',
      walk2: '/images/characters/valkyrie_walk2.svg',
      jump: '/images/characters/valkyrie_jump.svg',
      shield: '/images/characters/valkyrie_shield.svg',
    },
    textures: {
      idle(g) { g.fillCircle(16, 8, 6); g.fillRect(11, 14, 10, 16); g.fillRect(8, 16, 3, 6); g.fillRect(21, 16, 3, 6); g.fillRect(12, 30, 3, 12); g.fillRect(17, 30, 3, 12); g.fillTriangle(6, 8, 10, 4, 10, 12); g.fillTriangle(26, 8, 22, 4, 22, 12); g.fillRect(24, 12, 5, 18); },
      walk1(g) { g.fillCircle(16, 8, 6); g.fillRect(11, 14, 10, 16); g.fillRect(7, 18, 3, 4); g.fillRect(22, 16, 3, 6); g.fillRect(10, 30, 3, 14); g.fillRect(18, 30, 3, 10); g.fillTriangle(6, 8, 10, 4, 10, 12); g.fillTriangle(26, 8, 22, 4, 22, 12); g.fillRect(24, 12, 5, 18); },
      walk2(g) { g.fillCircle(16, 8, 6); g.fillRect(11, 14, 10, 16); g.fillRect(7, 16, 3, 6); g.fillRect(22, 18, 3, 4); g.fillRect(11, 30, 3, 10); g.fillRect(19, 30, 3, 14); g.fillTriangle(6, 8, 10, 4, 10, 12); g.fillTriangle(26, 8, 22, 4, 22, 12); g.fillRect(24, 12, 5, 18); },
      jump(g) { g.fillCircle(16, 8, 6); g.fillRect(11, 14, 10, 14); g.fillRect(7, 10, 3, 6); g.fillRect(22, 10, 3, 6); g.fillRect(12, 28, 3, 8); g.fillRect(17, 28, 3, 8); g.fillTriangle(6, 6, 10, 2, 10, 10); g.fillTriangle(26, 6, 22, 2, 22, 10); g.fillRect(24, 12, 5, 18); },
      shield(g) { drawShielded(g, (g) => { g.fillCircle(16, 8, 6); g.fillRect(11, 14, 10, 16); g.fillRect(8, 16, 3, 6); g.fillRect(21, 16, 3, 6); g.fillRect(12, 30, 3, 12); g.fillRect(17, 30, 3, 12); g.fillTriangle(6, 8, 10, 4, 10, 12); g.fillTriangle(26, 8, 22, 4, 22, 12); g.fillRect(24, 12, 5, 18); }); },
    },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
