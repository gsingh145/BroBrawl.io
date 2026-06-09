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
    id: 'sensei_waisas', name: 'Sensei Waisas', class: 'sword',
    color: 0xff6600, tint: 0xff8833,
    description: 'Ancient master of the blade.',
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
      idle(g) { rectIdle(g); },
      walk1(g) { rectWalk1(g); },
      walk2(g) { rectWalk2(g); },
      jump(g) { rectJump(g); },
      shield(g) { drawShielded(g, rectIdle); },
    },
  },
  the_damned: {
    id: 'the_damned', name: 'The Damned', class: 'zoner',
    color: 0x44ddff, tint: 0x66eeff,
    description: 'Cursed soul commanding dark energies.',
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
    id: 'nam_saiyan', name: 'Nam Saiyan', class: 'combo',
    color: 0xffcc00, tint: 0xffdd44,
    description: 'Agile combo fighter with lightning fists.',
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
