function drawShielded(g, drawBody) {
  drawBody(g);
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(16, 24, 30, 40);
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
  brawn_boy: {
    id: 'brawn_boy', name: 'Brawn Boy', class: 'heavy',
    color: 0xff4444, tint: 0xff6666,
    description: 'Brawny and solid.',
    images: {
      idle: '/images/characters/brawn_boy_idle.png',
      walk1: '/images/characters/brawn_boy_walk.png',
      walk2: '/images/characters/brawn_boy_walk.png',
      jump: '/images/characters/brawn_boy_jump.png',
      shield: '/images/characters/brawn_boy_shield.png',
    },
    textures: {
      idle(g) { rectIdle(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      walk1(g) { rectWalk1(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      walk2(g) { rectWalk2(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      jump(g) { rectJump(g, 18, 22); g.fillRect(12, 6, 8, 8); },
      shield(g) { drawShielded(g, (g) => { rectIdle(g, 18, 22); g.fillRect(12, 6, 8, 8); }); },
    },
  },
  wizard: {
    id: 'wizard', name: 'Wizard', class: 'zoner',
    color: 0x44ddff, tint: 0x66eeff,
    description: 'Arcane projectiles control the battlefield.',
    images: {
      idle: '/images/characters/wizard_idle.png',
      walk1: '/images/characters/wizard_right.png',
      walk2: '/images/characters/wizard_left.png',
      jump: '/images/characters/wizard_jump.png',
      shield: '/images/characters/wizard_shield.png',
    },
    textures: {
      idle(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(7, 19, 4, 5); g.fillRect(21, 19, 4, 5); g.fillRect(12, 31, 3, 10); g.fillRect(17, 31, 3, 10); },
      walk1(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(6, 20, 4, 4); g.fillRect(22, 18, 4, 6); g.fillRect(10, 31, 3, 12); g.fillRect(18, 31, 3, 8); },
      walk2(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(6, 18, 4, 6); g.fillRect(22, 20, 4, 4); g.fillRect(11, 31, 3, 8); g.fillRect(19, 31, 3, 12); },
      jump(g) { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 12); g.fillRect(6, 13, 4, 6); g.fillRect(22, 13, 4, 6); g.fillRect(12, 29, 3, 6); g.fillRect(17, 29, 3, 6); },
      shield(g) { drawShielded(g, (g) => { g.fillTriangle(8, 12, 24, 12, 16, 0); g.fillCircle(16, 12, 5); g.fillRect(11, 17, 10, 14); g.fillRect(7, 19, 4, 5); g.fillRect(21, 19, 4, 5); g.fillRect(12, 31, 3, 10); g.fillRect(17, 31, 3, 10); }); },
    },
  },
  shadow: {
    id: 'shadow', name: 'Shadow', class: 'combo',
    color: 0x8844ff, tint: 0xaa66ff,
    description: 'Elusive assassin with deadly combos.',
    images: {
      idle: '/images/characters/shadow_idle.png',
      walk1: '/images/characters/shadow_right.png',
      walk2: '/images/characters/shadow_left.png',
      jump: '/images/characters/shadow_jump.png',
      shield: '/images/characters/shadow_shield.png',
    },
    textures: {
      idle(g) { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(7, 18, 4, 4); g.fillRect(21, 18, 4, 4); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); },
      walk1(g) { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(6, 19, 4, 3); g.fillRect(22, 17, 4, 6); g.fillRect(10, 28, 3, 14); g.fillRect(19, 28, 3, 10); },
      walk2(g) { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(6, 17, 4, 6); g.fillRect(22, 19, 4, 3); g.fillRect(11, 28, 3, 10); g.fillRect(18, 28, 3, 14); },
      jump(g) { g.fillTriangle(8, 14, 24, 14, 16, 0); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 10); g.fillRect(6, 12, 4, 5); g.fillRect(22, 12, 4, 5); g.fillRect(12, 27, 3, 7); g.fillRect(17, 27, 3, 7); },
      shield(g) { drawShielded(g, (g) => { g.fillTriangle(8, 16, 24, 16, 16, 2); g.fillCircle(16, 10, 5); g.fillRect(11, 16, 10, 12); g.fillRect(7, 18, 4, 4); g.fillRect(21, 18, 4, 4); g.fillRect(12, 28, 3, 14); g.fillRect(17, 28, 3, 14); }); },
    },
  },
  samurai: {
    id: 'samurai', name: 'Samurai', class: 'sword',
    color: 0xcc2222, tint: 0xff4444,
    description: 'Honorable blade with decisive strikes.',
    images: {
      idle: '/images/characters/samurai_idle.png',
      walk1: '/images/characters/samurai_right.png',
      walk2: '/images/characters/samurai_left.png',
      jump: '/images/characters/samurai_jump.png',
      shield: '/images/characters/samurai_shield.png',
    },
    textures: {
      idle(g) { g.fillRect(14, 2, 6, 8); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(7, 17, 4, 5); g.fillRect(21, 17, 4, 5); g.fillRect(12, 29, 3, 12); g.fillRect(17, 29, 3, 12); g.fillTriangle(24, 10, 32, 14, 24, 16); },
      walk1(g) { g.fillRect(14, 2, 6, 8); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(6, 18, 4, 4); g.fillRect(22, 16, 4, 6); g.fillRect(10, 29, 3, 14); g.fillRect(18, 29, 3, 10); g.fillTriangle(24, 10, 32, 14, 24, 16); },
      walk2(g) { g.fillRect(14, 2, 6, 8); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(6, 16, 4, 6); g.fillRect(22, 18, 4, 4); g.fillRect(11, 29, 3, 10); g.fillRect(19, 29, 3, 14); g.fillTriangle(24, 10, 32, 14, 24, 16); },
      jump(g) { g.fillRect(14, 2, 6, 8); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 12); g.fillRect(6, 11, 4, 5); g.fillRect(22, 11, 4, 5); g.fillRect(12, 27, 3, 8); g.fillRect(17, 27, 3, 8); g.fillTriangle(24, 10, 32, 14, 24, 16); },
      shield(g) { drawShielded(g, (g) => { g.fillRect(14, 2, 6, 8); g.fillCircle(16, 8, 5); g.fillRect(11, 15, 10, 14); g.fillRect(7, 17, 4, 5); g.fillRect(21, 17, 4, 5); g.fillRect(12, 29, 3, 12); g.fillRect(17, 29, 3, 12); g.fillTriangle(24, 10, 32, 14, 24, 16); }); },
    },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
