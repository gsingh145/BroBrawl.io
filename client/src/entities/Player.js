import Phaser from 'phaser';
import { CHARACTERS } from '../characters/index.js';

export default class Player {
  constructor(scene, x, y, config = {}) {
    const { isRemote = false, character = 'brawn_boy', playerColor } = config;
    const ch = CHARACTERS[character] || CHARACTERS.brawn_boy;

    this.charConfig = ch;
    this.generateTextures(scene);

    this.scene = scene;
    this.isRemote = isRemote;
    this.playerColor = playerColor || ch.color;

    this.sprite = scene.add.sprite(x, y, this.texId('idle'));
    this.baseScaleX = 32 / this.sprite.frame.width;
    this.baseScaleY = 48 / this.sprite.frame.height;
    this.sprite.setScale(this.baseScaleX, this.baseScaleY);
    this.sprite.setTint(this.playerColor);

    this.facing = 'right';
    this.damage = 0;
    this.stocks = 3;
    this.shielding = false;
    this.specialMeter = 0;
    this.shieldHealth = 100;

    this.attacking = false;
    this.attackDir = 'neutral';
    this.attackTimer = 0;
    this.attackCooldown = 0;

    this.specialAttacking = false;
    this.specialAttackDir = 'neutral';
    this.specialAttackTimer = 0;
    this.specialAttackCooldown = 0;

    this.hitFlashTimer = 0;
    this.walkTimer = 0;
    this.walkFrame = 0;
    this.bobOffset = 0;
    this.squashStretch = { x: 1, y: 1 };
    this.lastVx = 0;
    this.onGround = true;
    this.landSquashTimer = 0;

    this.damageText = scene.add.text(x, y - 44, '0%', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.attackGfx = scene.add.graphics();
    this.attackGfx.setVisible(false);

    this.shieldGfx = scene.add.graphics();
    this.shieldGfx.setVisible(false);
  }

  texId(state) {
    return `${this.charConfig.id}_${state}`;
  }

  static defaultTex(id, scene) {
    const W = 32, H = 48;
    const make = (state, draw) => {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffffff);
      draw(gfx);
      gfx.generateTexture(`${id}_${state}`, W, H);
      gfx.destroy();
    };
    make('idle', (g) => { g.fillCircle(16, 10, 7); g.fillRect(10, 18, 12, 14); g.fillRect(6, 20, 4, 4); g.fillRect(22, 20, 4, 4); g.fillRect(12, 33, 3, 11); g.fillRect(17, 33, 3, 11); g.fillTriangle(24, 20, 32, 24, 24, 28); });
    make('walk1', (g) => { g.fillCircle(16, 10, 7); g.fillRect(10, 18, 12, 14); g.fillRect(5, 21, 4, 3); g.fillRect(23, 19, 4, 6); g.fillRect(10, 33, 3, 13); g.fillRect(18, 33, 3, 9); g.fillTriangle(25, 19, 33, 23, 25, 27); });
    make('walk2', (g) => { g.fillCircle(16, 10, 7); g.fillRect(10, 18, 12, 14); g.fillRect(5, 19, 4, 6); g.fillRect(23, 21, 4, 3); g.fillRect(11, 33, 3, 9); g.fillRect(19, 33, 3, 13); g.fillTriangle(25, 19, 33, 23, 25, 27); });
    make('jump', (g) => { g.fillCircle(16, 10, 7); g.fillRect(10, 18, 12, 12); g.fillRect(5, 13, 4, 6); g.fillRect(23, 13, 4, 6); g.fillRect(12, 31, 3, 7); g.fillRect(17, 31, 3, 7); g.fillTriangle(25, 19, 33, 23, 25, 27); });
    make('shield', (g) => { g.fillCircle(16, 10, 7); g.fillRect(10, 18, 12, 14); g.fillRect(6, 20, 4, 4); g.fillRect(22, 20, 4, 4); g.fillRect(12, 33, 3, 11); g.fillRect(17, 33, 3, 11); g.fillTriangle(24, 20, 32, 24, 24, 28); g.fillStyle(0xffffff, 0.3); g.fillEllipse(16, 24, 30, 40); });
  }

  generateTextures(scene) {
    const id = this.charConfig.id;
    if (scene.textures.exists(this.texId('idle'))) return;
    const tex = this.charConfig.textures;
    if (tex) {
      const W = 32, H = 48;
      for (const [state, drawFn] of Object.entries(tex)) {
        const gfx = scene.make.graphics({ add: false });
        gfx.fillStyle(0xffffff);
        drawFn(gfx);
        gfx.generateTexture(`${id}_${state}`, W, H);
        gfx.destroy();
      }
    } else {
      Player.defaultTex(id, scene);
    }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  applyState(state) {
    const dmgIncrease = (state.damage || 0) - this.damage;

    this.sprite.setPosition(state.x, state.y);
    this.damage = state.damage || 0;
    this.stocks = state.stocks ?? 3;
    this.facing = state.facing === -1 ? 'left' : 'right';
    this.shielding = state.shielding || false;
    this.specialMeter = state.specialMeter || 0;
    this.shieldHealth = state.shieldHealth ?? 100;
    this.lastVx = state.vx || 0;
    this.lastVy = state.vy || 0;
    this.onGround = state.onGround || false;
    if (state.playerColor) {
      this.playerColor = state.playerColor;
    }

    if (dmgIncrease > 0) {
      this.hitFlashTimer = 100;
    }

    if (state.attacking && !this.attacking) {
      this.startAttack(state.attackDir || 'neutral');
    }
    if (state.specialAttacking && !this.specialAttacking) {
      this.startSpecialAttack(state.specialAttackDir || 'neutral');
    }
    this.specialAttackDir = state.specialAttackDir || 'neutral';
  }

  handleLocalInput(input) {
    const { attack, specialAttack, shield, attackDir, specialDir, vx } = input;
    if (vx !== undefined) this.lastVx = vx;
    if (attack && !this.attacking && !this.specialAttacking && this.attackCooldown <= 0) {
      this.startAttack(attackDir || 'neutral');
    }
    if (specialAttack && !this.specialAttacking && !this.attacking && this.specialAttackCooldown <= 0) {
      this.startSpecialAttack(specialDir || 'neutral');
    }
    this.shielding = shield;
  }

  startAttack(dir) {
    this.attacking = true;
    this.attackDir = dir || 'neutral';
    const cfg = this.charConfig.attacks[this.attackDir] || this.charConfig.attacks.neutral;
    this.attackTimer = cfg.active * 50;
    this.attackCooldown = cfg.cd * 50;
  }

  startSpecialAttack(dir) {
    this.specialAttacking = true;
    this.specialAttackDir = dir || 'neutral';
    const cfg = this.charConfig.specials[this.specialAttackDir] || this.charConfig.specials.neutral;
    this.specialAttackTimer = cfg.active * 50;
    this.specialAttackCooldown = cfg.cd * 50;
  }

  update(delta) {
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.attackTimer = 0;
      }
    }
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.specialAttackTimer > 0) {
      this.specialAttackTimer -= delta;
      if (this.specialAttackTimer <= 0) {
        this.specialAttacking = false;
        this.specialAttackTimer = 0;
      }
    }
    if (this.specialAttackCooldown > 0) this.specialAttackCooldown -= delta;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= delta;
    if (this.landSquashTimer > 0) this.landSquashTimer -= delta;

    this.updateWalk(delta);
    this.updateAnimFrame();
    this.updateVisuals();
  }

  updateWalk(delta) {
    const moving = Math.abs(this.lastVx) > 0.5;
    if (moving) {
      this.walkTimer += delta * 0.01 * Math.min(Math.abs(this.lastVx), 6);
      this.walkFrame = Math.floor(this.walkTimer) % 2;
      this.bobOffset = Math.sin(this.walkTimer * Math.PI * 2) * 2.5;
    } else {
      this.walkTimer = 0;
      this.walkFrame = 0;
      this.bobOffset = 0;
    }
  }

  updateAnimFrame() {
    const { x, y } = this.sprite;

    if (this.hitFlashTimer > 0) {
      this.sprite.setTint(0xffffff);
    } else if (this.shielding) {
      this.sprite.setTint(0x88aaff);
    } else {
      this.sprite.setTint(this.playerColor);
    }

    this.sprite.setFlipX(this.facing === 'left');

    const sc = (sx, sy) => this.sprite.setScale(this.baseScaleX * sx, this.baseScaleY * sy);
    const tid = (s) => this.texId(s);
    if (this.attacking || this.specialAttacking) {
      this.sprite.setTexture(tid('idle'));
      this.sprite.y = y;
      sc(1, 1);
      return;
    }

    if (this.shielding) {
      this.sprite.setTexture(tid('shield'));
      this.sprite.y = y;
      sc(1, 1);
      return;
    }

    const moving = Math.abs(this.lastVx) > 0.5;
    if (this.onGround) {
      this.sprite.setTexture(moving ? (this.walkFrame === 0 ? tid('walk1') : tid('walk2')) : tid('idle'));
      this.sprite.y = y + this.bobOffset;
      sc(1, 1);
    } else {
      this.sprite.setTexture(tid('jump'));
      if (this.lastVy >= 0) sc(1.05, 0.95);
      else sc(1, 1);
      this.sprite.y = y;
    }
  }

  updateVisuals() {
    const { x, y } = this.sprite;

    this.damageText.setPosition(x, y - 48);
    this.damageText.setText(`${Math.floor(this.damage)}%`);
    const dmgPct = Math.min(1, this.damage / 150);
    const gb = Math.floor(255 * (1 - dmgPct));
    this.damageText.setColor(`rgb(255, ${gb}, ${gb})`);

    if (this.shielding) {
      const ratio = this.shieldHealth / 100;
      const sw = 48 * ratio;
      const sh = 60 * ratio;
      this.shieldGfx.clear();
      this.shieldGfx.fillStyle(0x88aaff, 0.15);
      this.shieldGfx.fillEllipse(x, y, sw, sh);
      this.shieldGfx.lineStyle(2, 0x88aaff, 0.35);
      this.shieldGfx.strokeEllipse(x, y, sw, sh);
      this.shieldGfx.setVisible(true);
    } else {
      this.shieldGfx.setVisible(false);
    }

    const col = this.playerColor || 0xffffff;
    const bright = Phaser.Display.Color.IntegerToColor(col);
    const color = { red: bright.red, green: bright.green, blue: bright.blue };
    const facing = this.facing === 'right' ? 1 : -1;
    const cls = this.charConfig.class || 'sword';

    if (this.specialAttacking) {
      const dir = this.specialAttackDir || 'neutral';
      const cfg = this.charConfig.specials[dir] || this.charConfig.specials.neutral;
      this.attackGfx.clear();
      const fn = SPECIAL_FX[cls] || SPECIAL_FX.sword;
      fn(this.attackGfx, x, y, cfg, facing, color);
      this.attackGfx.setVisible(true);
    } else if (this.attacking) {
      const dir = this.attackDir || 'neutral';
      const cfg = this.charConfig.attacks[dir] || this.charConfig.attacks.neutral;
      this.attackGfx.clear();
      const dirFx = ATK_FX[cls];
      const fn = dirFx?.[dir] || ATK_FX.sword.side;
      fn(this.attackGfx, x, y, cfg, facing, color);
      this.attackGfx.setVisible(true);
    } else {
      this.attackGfx.setVisible(false);
    }
  }

  cleanup() {
    this.sprite?.destroy();
    this.damageText?.destroy();
    this.attackGfx?.destroy();
    this.shieldGfx?.destroy();
  }
}

/* ── Color helper ── */
function hexCol(c) {
  return Phaser.Display.Color.GetColor(c.red, c.green, c.blue);
}

/* ── Attack visuals ── */
const ATK_FX = {};

/* Heavy */
ATK_FX.heavy = {
  neutral(g, x, y, cfg, f, c) {
    const cx = x + f * 20;
    const r = Math.max(4, cfg.w / 2);
    g.fillStyle(hexCol(c), 0.5);
    g.fillCircle(cx, y, r);
    g.lineStyle(3, hexCol(c), 0.8);
    g.strokeCircle(cx, y, r + 4);
    g.lineStyle(1.5, hexCol(c), 0.4);
    for (let i = -1; i <= 1; i++) {
      const ly = y + i * r * 0.6;
      g.lineBetween(cx - r - 8, ly, cx - r, ly);
      g.lineBetween(cx + r, ly, cx + r + 8, ly);
    }
  },
  side(g, x, y, cfg, f, c) {
    const sx = x + f * 16;
    const rx = f === 1 ? sx : sx - cfg.w;
    g.fillStyle(hexCol(c), 0.6);
    g.fillRect(rx, y - cfg.h / 2, cfg.w, cfg.h);
    g.lineStyle(2, hexCol(c), 0.4);
    for (let i = -1; i <= 1; i++) {
      const ly = y + i * 8;
      const len = 16 + Math.abs(i) * 8;
      const lx = f === 1 ? rx + cfg.w + 4 : rx - 4;
      g.lineBetween(lx, ly, lx + f * len, ly);
    }
  },
  up(g, x, y, cfg, f, c) {
    const top = y - 42;
    g.fillStyle(hexCol(c), 0.6);
    g.fillRect(x - cfg.w / 2, top, cfg.w, cfg.h);
    g.fillStyle(hexCol(c), 0.4);
    g.fillTriangle(x - cfg.w / 2 - 6, top + cfg.h, x + cfg.w / 2 + 6, top + cfg.h, x, top + cfg.h + 10);
  },
  down(g, x, y, cfg, f, c) {
    const top = y + 10;
    g.fillStyle(hexCol(c), 0.6);
    g.fillTriangle(x - cfg.w / 2, top, x + cfg.w / 2, top, x, top + cfg.h);
    g.lineStyle(2, hexCol(c), 0.5);
    const bot = top + cfg.h;
    g.lineBetween(x - 10, bot, x - 6, bot + 8);
    g.lineBetween(x + 10, bot, x + 6, bot + 8);
    g.lineBetween(x, bot, x, bot + 10);
  },
};

/* Zoner */
ATK_FX.zoner = {
  neutral(g, x, y, cfg, f, c) {
    const cx = x + f * 20;
    const hw = Math.max(4, cfg.w / 2);
    const hh = Math.max(4, cfg.h / 2);
    g.fillStyle(hexCol(c), 0.6);
    g.fillTriangle(cx, y - hh, cx - hw, y, cx, y + hh);
    g.fillTriangle(cx, y - hh, cx + hw, y, cx, y + hh);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx, y, 3);
  },
  side(g, x, y, cfg, f, c) {
    const sx = x + f * 16;
    const len = Math.max(8, cfg.w);
    const rx = f === 1 ? sx : sx - len;
    g.fillStyle(hexCol(c), 0.6);
    g.fillRect(rx, y - 3, len, 6);
    g.fillTriangle(
      f === 1 ? rx + len : rx, y - 6,
      f === 1 ? rx + len : rx, y + 6,
      f === 1 ? rx + len + f * 8 : rx + f * 8, y
    );
    g.fillStyle(hexCol(c), 0.3);
    for (let i = 1; i <= 2; i++) {
      const dx = f === 1 ? rx - i * 12 : rx + len + i * 12;
      g.fillCircle(dx, y, 2);
    }
  },
  up(g, x, y, cfg, f, c) {
    const top = y - 36;
    g.fillStyle(hexCol(c), 0.6);
    g.fillTriangle(x - cfg.w / 2, top + cfg.h, x + cfg.w / 2, top + cfg.h, x, top);
    g.fillStyle(hexCol(c), 0.4);
    for (let i = 0; i < 3; i++) {
      g.fillCircle(x + (i - 1) * 8, top - 6 - i * 4, 2 + i);
    }
  },
  down(g, x, y, cfg, f, c) {
    const cy = y + 20;
    g.fillStyle(hexCol(c), 0.6);
    g.fillCircle(x, cy, Math.max(3, cfg.w / 4));
    g.lineStyle(2, hexCol(c), 0.4);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const r1 = Math.max(4, cfg.w / 4);
      const r2 = Math.max(8, cfg.w / 2 + 4);
      g.lineBetween(x + Math.cos(a) * r1, cy + Math.sin(a) * r1, x + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    }
  },
};

/* Combo */
ATK_FX.combo = {
  neutral(g, x, y, cfg, f, c) {
    const cx = x + f * 20;
    const r = Math.max(3, cfg.w / 3);
    g.fillStyle(hexCol(c), 0.5);
    g.fillCircle(cx - 4, y, r);
    g.fillCircle(cx + 4, y, r);
    g.fillStyle(hexCol(c), 0.3);
    g.fillCircle(cx - 8, y, r * 0.7);
    g.fillCircle(cx + 8, y, r * 0.7);
  },
  side(g, x, y, cfg, f, c) {
    const cx = x + f * 24;
    const r = Math.max(4, cfg.w / 2);
    g.lineStyle(3, hexCol(c), 0.7);
    g.beginPath();
    g.arc(cx, y, r, f > 0 ? -2.0 : 2.0, f > 0 ? 2.0 : -2.0, f < 0);
    g.strokePath();
    g.lineStyle(1.5, hexCol(c), 0.3);
    g.beginPath();
    g.arc(cx, y, r + 4, f > 0 ? -1.8 : 1.8, f > 0 ? 1.8 : -1.8, f < 0);
    g.strokePath();
  },
  up(g, x, y, cfg, f, c) {
    const top = y - 36;
    g.lineStyle(3, hexCol(c), 0.7);
    g.beginPath();
    g.arc(x - 8, top + cfg.h, Math.max(4, cfg.w / 2), -2.8, 0.3);
    g.strokePath();
    g.fillStyle(hexCol(c), 0.4);
    g.fillTriangle(x - 4, top, x + 4, top, x, top - 8);
  },
  down(g, x, y, cfg, f, c) {
    const top = y + 10;
    g.lineStyle(3, hexCol(c), 0.6);
    g.beginPath();
    g.arc(x + f * 4, top + 6, Math.max(4, cfg.w / 2), 2.5, 4.5);
    g.strokePath();
    g.fillStyle(hexCol(c), 0.4);
    g.fillTriangle(x - 5, top + cfg.h - 4, x + 5, top + cfg.h - 4, x, top + cfg.h + 6);
  },
};

/* Sword */
ATK_FX.sword = {
  neutral(g, x, y, cfg, f, c) {
    const cx = x + f * 20;
    const r = Math.max(4, cfg.w / 2);
    g.lineStyle(3, hexCol(c), 0.7);
    g.beginPath();
    g.arc(cx, y, r, 0, 5.6);
    g.strokePath();
    g.lineStyle(1, hexCol(c), 0.3);
    g.beginPath();
    g.arc(cx, y, r + 4, 0, 5.6);
    g.strokePath();
  },
  side(g, x, y, cfg, f, c) {
    const cx = x + f * 20;
    const r = Math.max(4, cfg.w / 2);
    g.lineStyle(3, hexCol(c), 0.7);
    g.beginPath();
    g.arc(cx, y, r, f > 0 ? -2.2 : 2.2, f > 0 ? 2.2 : -2.2, f < 0);
    g.strokePath();
    g.fillStyle(hexCol(c), 0.25);
    g.beginPath();
    g.arc(cx, y, r - 3, f > 0 ? -2.0 : 2.0, f > 0 ? 2.0 : -2.0, f < 0);
    g.lineTo(cx, y);
    g.closePath();
    g.fillPath();
  },
  up(g, x, y, cfg, f, c) {
    const top = y - 36;
    g.lineStyle(3, hexCol(c), 0.7);
    g.beginPath();
    g.arc(x, top + cfg.h, Math.max(4, cfg.w / 2), -2.7, 0.3);
    g.strokePath();
    g.fillStyle(hexCol(c), 0.3);
    g.fillCircle(x, top + 4, 4);
  },
  down(g, x, y, cfg, f, c) {
    const top = y + 10;
    g.lineStyle(3, hexCol(c), 0.7);
    g.beginPath();
    g.arc(x, top, Math.max(4, cfg.w / 2), 2.8, 5.0);
    g.strokePath();
    g.fillStyle(hexCol(c), 0.3);
    g.fillCircle(x, top + cfg.h - 4, 4);
  },
};

/* ── Special visuals ── */
const SPECIAL_FX = {
  heavy(g, x, y, cfg, f, c) {
    const r = Math.max(4, cfg.w / 2);
    g.fillStyle(hexCol(c), 0.35);
    g.fillCircle(x, y, r);
    g.lineStyle(4, hexCol(c), 0.6);
    g.strokeCircle(x, y, r + 4);
    g.lineStyle(2, hexCol(c), 0.25);
    g.strokeCircle(x, y, r + 10);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const r1 = r + 12;
      const r2 = r + 20;
      g.lineBetween(x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2);
    }
  },
  zoner(g, x, y, cfg, f, c) {
    const len = Math.max(8, cfg.w);
    const sx = f === 1 ? x + 16 : x - 16 - len;
    g.fillStyle(hexCol(c), 0.6);
    g.fillRect(sx, y - 4, len, 8);
    g.fillTriangle(
      f === 1 ? sx + len : sx, y - 8,
      f === 1 ? sx + len : sx, y + 8,
      f === 1 ? sx + len + f * 12 : sx + f * 12, y
    );
    g.fillStyle(hexCol(c), 0.3);
    for (let i = 1; i <= 3; i++) {
      const dx = f === 1 ? sx - i * 14 : sx + len + i * 14;
      g.fillCircle(dx, y, 3 - i * 0.5);
    }
  },
  combo(g, x, y, cfg, f, c) {
    const r = Math.max(4, cfg.w / 2);
    g.lineStyle(3, hexCol(c), 0.6);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.lineBetween(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.fillStyle(hexCol(c), 0.4);
    g.fillCircle(x, y, r / 3);
  },
  sword(g, x, y, cfg, f, c) {
    const r = Math.max(4, cfg.w / 2);
    g.lineStyle(4, hexCol(c), 0.6);
    g.beginPath();
    g.arc(x, y, r, -1.8, 1.8);
    g.strokePath();
    g.lineStyle(2, hexCol(c), 0.3);
    g.beginPath();
    g.arc(x, y, r + 6, -1.6, 1.6);
    g.strokePath();
    g.fillStyle(hexCol(c), 0.3);
    g.fillCircle(x + r, y, 5);
  },
};
