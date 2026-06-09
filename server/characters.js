const CLASSES = {
  heavy: { moveSpeed: 3.0, jumpVelocity: -9, weight: 0.6, dmgDealtMult: 1.4, dmgTakenMult: 0.8, stocks: 4, jumpCount: 1 },
  zoner: { moveSpeed: 4.0, jumpVelocity: -10, weight: 1.0, dmgDealtMult: 0.9, dmgTakenMult: 1.0, stocks: 3, jumpCount: 2 },
  combo: { moveSpeed: 5.5, jumpVelocity: -12, weight: 1.2, dmgDealtMult: 0.8, dmgTakenMult: 1.1, stocks: 3, jumpCount: 2 },
  sword: { moveSpeed: 4.5, jumpVelocity: -11, weight: 0.9, dmgDealtMult: 1.1, dmgTakenMult: 0.9, stocks: 3, jumpCount: 2 },
};

const CHARACTERS = {
  brick:    { id: 'brick',    ...CLASSES.heavy },
  goliath:  { id: 'goliath',  ...CLASSES.heavy },
  sniper:   { id: 'sniper',   ...CLASSES.zoner },
  wizard:   { id: 'wizard',   ...CLASSES.zoner },
  swift:    { id: 'swift',    ...CLASSES.combo },
  shadow:   { id: 'shadow',   ...CLASSES.combo },
  blade:    { id: 'blade',    ...CLASSES.sword },
  valkyrie: { id: 'valkyrie', ...CLASSES.sword },
};

module.exports = CHARACTERS;
module.exports.CLASSES = CLASSES;
