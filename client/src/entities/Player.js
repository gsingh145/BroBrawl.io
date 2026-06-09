import Phaser from 'phaser';
import { CFG } from '../config.js';
import { CHARACTERS } from '../characters/index.js';

export default class Player {
  constructor(scene, x, y, config = {}) {
    const { isRemote = false, character = 'blade' } = config;
    const ch = CHARACTERS[character] || CHARACTERS.blade;

    this.charConfig = ch;
    this.generateTextures(scene);

    this.scene = scene;
    this.isRemote = isRemote;
    this.playerColor = ch.color;

    this.sprite = scene.add.sprite(x, y, 'player_idle');
    this.sprite.setTint(ch.tint);

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

  generateTextures(scene) {
    if (scene.textures.exists('player_idle')) return;
    const W = 32, H = 48;

    const make = (key, draw) => {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffffff);
      draw(gfx);
      gfx.generateTexture(key, W, H);
      gfx.destroy();
    };

    make('player_idle', (g) => {
      g.fillCircle(16, 10, 7);
      g.fillRect(10, 18, 12, 14);
      g.fillRect(6, 20, 4, 4);
      g.fillRect(22, 20, 4, 4);
      g.fillRect(12, 33, 3, 11);
      g.fillRect(17, 33, 3, 11);
      g.fillTriangle(24, 20, 32, 24, 24, 28);
    });

    make('player_walk1', (g) => {
      g.fillCircle(16, 10, 7);
      g.fillRect(10, 18, 12, 14);
      g.fillRect(5, 21, 4, 3);
      g.fillRect(23, 19, 4, 6);
      g.fillRect(10, 33, 3, 13);
      g.fillRect(18, 33, 3, 9);
      g.fillTriangle(25, 19, 33, 23, 25, 27);
    });

    make('player_walk2', (g) => {
      g.fillCircle(16, 10, 7);
      g.fillRect(10, 18, 12, 14);
      g.fillRect(5, 19, 4, 6);
      g.fillRect(23, 21, 4, 3);
      g.fillRect(11, 33, 3, 9);
      g.fillRect(19, 33, 3, 13);
      g.fillTriangle(25, 19, 33, 23, 25, 27);
    });

    make('player_jump', (g) => {
      g.fillCircle(16, 10, 7);
      g.fillRect(10, 18, 12, 12);
      g.fillRect(5, 13, 4, 6);
      g.fillRect(23, 13, 4, 6);
      g.fillRect(12, 31, 3, 7);
      g.fillRect(17, 31, 3, 7);
      g.fillTriangle(25, 19, 33, 23, 25, 27);
    });

    make('player_shield', (g) => {
      g.fillCircle(16, 10, 7);
      g.fillRect(10, 18, 12, 14);
      g.fillRect(6, 20, 4, 4);
      g.fillRect(22, 20, 4, 4);
      g.fillRect(12, 33, 3, 11);
      g.fillRect(17, 33, 3, 11);
      g.fillTriangle(24, 20, 32, 24, 24, 28);
      g.fillStyle(0xffffff, 0.3);
      g.fillEllipse(16, 24, 30, 40);
    });
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
    const cfg = CFG.ATTACK_DIRS[this.attackDir] || CFG.ATTACK_DIRS.neutral;
    this.attackTimer = cfg.active * 50;
    this.attackCooldown = cfg.cd * 50;
  }

  startSpecialAttack(dir) {
    this.specialAttacking = true;
    this.specialAttackDir = dir || 'neutral';
    const cfg = CFG.SPECIAL_DIRS[this.specialAttackDir] || CFG.SPECIAL_DIRS.neutral;
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

    if (this.attacking || this.specialAttacking) {
      this.sprite.setTexture('player_idle');
      this.sprite.y = y;
      this.sprite.setScale(1, 1);
      return;
    }

    if (this.shielding) {
      this.sprite.setTexture('player_shield');
      this.sprite.y = y;
      this.sprite.setScale(1, 1);
      return;
    }

    const moving = Math.abs(this.lastVx) > 0.5;
    if (this.onGround) {
      this.sprite.setTexture(moving ? (this.walkFrame === 0 ? 'player_walk1' : 'player_walk2') : 'player_idle');
      this.sprite.y = y + this.bobOffset;
      this.sprite.setScale(1, 1);
    } else {
      this.sprite.setTexture('player_jump');
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

    if (this.specialAttacking) {
      const dir = this.specialAttackDir || 'neutral';
      const cfg = CFG.SPECIAL_DIRS[dir] || CFG.SPECIAL_DIRS.neutral;
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
      this.attackGfx.clear();

      if (dir === 'up') {
        this.attackGfx.fillStyle(0xff8800, 0.7);
        this.attackGfx.fillEllipse(x, y - 36, 40, 28);
      } else if (dir === 'down') {
        this.attackGfx.fillStyle(0xff6600, 0.7);
        const sx = this.facing === 'right' ? x + 12 : x - 48;
        this.attackGfx.fillTriangle(sx, y + 10, sx + 36, y + 10, sx + 18, y + 36);
      } else if (dir === 'neutral') {
        const cx = this.facing === 'right' ? x + 24 : x - 24;
        this.attackGfx.fillStyle(0xffffcc, 0.8);
        this.attackGfx.fillCircle(cx, y, 12);
      } else {
        const hx = this.facing === 'right' ? x + 16 : x - 56;
        this.attackGfx.fillStyle(0xffff00, 0.7);
        this.attackGfx.fillRect(hx, y - 14, 40, 28);
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
