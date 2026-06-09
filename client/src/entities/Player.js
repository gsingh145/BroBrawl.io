import Phaser from 'phaser';
import { CHARACTERS } from '../characters/index.js';

export default class Player {
  constructor(scene, x, y, config = {}) {
    const { isRemote = false, character = 'blade', playerColor } = config;
    const ch = CHARACTERS[character] || CHARACTERS.blade;

    this.charConfig = ch;
    this.generateTextures(scene);

    this.scene = scene;
    this.isRemote = isRemote;
    this.playerColor = playerColor || ch.color;

    this.sprite = scene.add.sprite(x, y, this.texId('idle'));
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

    const tid = (s) => this.texId(s);
    if (this.attacking || this.specialAttacking) {
      this.sprite.setTexture(tid('idle'));
      this.sprite.y = y;
      this.sprite.setScale(1, 1);
      return;
    }

    if (this.shielding) {
      this.sprite.setTexture(tid('shield'));
      this.sprite.y = y;
      this.sprite.setScale(1, 1);
      return;
    }

    const moving = Math.abs(this.lastVx) > 0.5;
    if (this.onGround) {
      this.sprite.setTexture(moving ? (this.walkFrame === 0 ? tid('walk1') : tid('walk2')) : tid('idle'));
      this.sprite.y = y + this.bobOffset;
      this.sprite.setScale(1, 1);
    } else {
      this.sprite.setTexture(tid('jump'));
      if (this.lastVy >= 0) this.sprite.setScale(1.05, 0.95);
      else this.sprite.setScale(1, 1);
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
    const r = bright.red, g = bright.green, b = bright.blue;

    if (this.specialAttacking) {
      const dir = this.specialAttackDir || 'neutral';
      const cfg = this.charConfig.specials[dir] || this.charConfig.specials.neutral;
      this.attackGfx.clear();
      this.attackGfx.fillStyle(0xff4400, 0.7);
      if (dir === 'up') {
        this.attackGfx.fillRect(x - cfg.w / 2, y - 42, cfg.w, cfg.h);
      } else if (dir === 'down') {
        this.attackGfx.fillRect(x - cfg.w / 2, y + 10, cfg.w, cfg.h);
      } else if (dir === 'neutral') {
        const cx = this.facing === 'right' ? x + 24 : x - 24 - cfg.w;
        this.attackGfx.fillRect(cx, y - cfg.h / 2, cfg.w, cfg.h);
      } else {
        const sx = this.facing === 'right' ? x + 16 : x - 16 - cfg.w;
        this.attackGfx.fillRect(sx, y - cfg.h / 2, cfg.w, cfg.h);
      }
      this.attackGfx.setVisible(true);
    } else if (this.attacking) {
      const dir = this.attackDir || 'neutral';
      const cfg = this.charConfig.attacks[dir] || this.charConfig.attacks.neutral;
      this.attackGfx.clear();

      if (dir === 'up') {
        this.attackGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.6);
        this.attackGfx.fillEllipse(x, y - 36, cfg.w * 1.5, cfg.h);
      } else if (dir === 'down') {
        this.attackGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.6);
        const sx = this.facing === 'right' ? x + 12 : x - 12 - cfg.w;
        this.attackGfx.fillTriangle(sx, y + 10, sx + cfg.w, y + 10, sx + cfg.w / 2, y + 10 + cfg.h);
      } else if (dir === 'neutral') {
        const cx = this.facing === 'right' ? x + 24 : x - 24;
        this.attackGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.6);
        this.attackGfx.fillCircle(cx, y, cfg.w / 2);
      } else {
        const hx = this.facing === 'right' ? x + 16 : x - 16 - cfg.w;
        this.attackGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.6);
        this.attackGfx.fillRect(hx, y - cfg.h / 2, cfg.w, cfg.h);
      }

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
