const ATK = (o) => ({ active: 3, cd: 5, dmg: 3, kb: 5, w: 20, h: 20, ...o });

const CHARACTERS = {
  sensei_waisas: {
    id: 'sensei_waisas',
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
  },
  brawn_boy: {
    id: 'brawn_boy',
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
  },
  the_damned: {
    id: 'the_damned',
    moveSpeed: 4.0, jumpVelocity: -10, weight: 1.0, dmgDealtMult: 0.9, dmgTakenMult: 1.0, stocks: 3, jumpCount: 2,
    dashSpeed: 14, dashDuration: 6,
    fastFallBoost: 5, maxFallSpeed: 15,
    specialMeter: { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 },
    attacks: {
      neutral: ATK({ active: 4, cd: 8,  dmg: 4,  kb: 6,  w: 14, h: 18 }),
      side:    ATK({ active: 5, cd: 10, dmg: 0,  kb: 0,  w: 20, h: 20, spawnsProjectile: true, projectileVx: 5, projectileW: 16, projectileH: 12, projectileDmg: 6, projectileKb: 8, projectileLifetime: 40 }),
      up:      ATK({ active: 6, cd: 9,  dmg: 6,  kb: 8,  w: 30, h: 32 }),
      down:    ATK({ active: 4, cd: 8,  dmg: 5,  kb: 6,  w: 42, h: 16 }),
    },
    specials: {
      neutral: ATK({ active: 7, cd: 14, dmg: 12, kb: 18, w: 80, h: 36 }),
      side:    ATK({ active: 7, cd: 14, dmg: 0,  kb: 0,  w: 24, h: 24, spawnsProjectile: true, projectileVx: 6, projectileW: 20, projectileH: 16, projectileDmg: 10, projectileKb: 14, projectileLifetime: 50 }),
      up:      ATK({ active: 7, cd: 14, dmg: 12, kb: 18, w: 80, h: 36 }),
      down:    ATK({ active: 7, cd: 14, dmg: 12, kb: 18, w: 80, h: 36 }),
    },
  },
  nam_saiyan: {
    id: 'nam_saiyan',
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
  },
};

module.exports = CHARACTERS;
