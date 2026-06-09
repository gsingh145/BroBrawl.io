const ATK = (o) => ({ active: 3, cd: 5, dmg: 3, kb: 5, w: 20, h: 20, ...o });

const CLASSES = {
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

const CHARACTERS = {
  brawn_boy: { id: 'brawn_boy', ...CLASSES.heavy },
  wizard:    { id: 'wizard',    ...CLASSES.zoner },
  shadow:    { id: 'shadow',    ...CLASSES.combo },
  samurai:   { id: 'samurai',   ...CLASSES.sword },
};

module.exports = CHARACTERS;
module.exports.CLASSES = CLASSES;
