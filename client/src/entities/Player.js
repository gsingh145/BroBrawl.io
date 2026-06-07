import Phaser from 'phaser';

export default class Player {
  constructor(scene, x, y, config = {}) {
    const { isRemote = false, color = 0x4488ff } = config;

    if (!scene.textures.exists('player')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffffff);
      gfx.fillRect(0, 0, 32, 48);
      gfx.fillTriangle(24, 16, 32, 22, 24, 28);
      gfx.generateTexture('player', 32, 48);
      gfx.destroy();
    }

    this.scene = scene;
    this.isRemote = isRemote;
    this.playerColor = color;

    this.sprite = scene.add.sprite(x, y, 'player');
    this.sprite.setTint(color);

    this.facing = 'right';
    this.damage = 0;
    this.stocks = 3;
    this.shielding = false;

    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;

    this.specialAttacking = false;
    this.specialAttackTimer = 0;
    this.specialAttackCooldown = 0;

    this.damageText = scene.add.text(x, y - 40, '0%', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.attackGfx = scene.add.graphics();
    this.attackGfx.setVisible(false);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  applyState(state) {
    this.sprite.setPosition(state.x, state.y);
    this.damage = state.damage || 0;
    this.stocks = state.stocks ?? 3;
    this.facing = state.facing === -1 ? 'left' : 'right';
    this.shielding = state.shielding || false;

    if (state.attacking && !this.attacking) {
      this.startAttack();
    }
    if (state.specialAttacking && !this.specialAttacking) {
      this.startSpecialAttack();
    }
  }

  handleLocalInput(input) {
    const { attack, specialAttack, shield } = input;

    if (attack && !this.attacking && !this.specialAttacking && this.attackCooldown <= 0) {
      this.startAttack();
    }
    if (specialAttack && !this.specialAttacking && !this.attacking && this.specialAttackCooldown <= 0) {
      this.startSpecialAttack();
    }
    this.shielding = shield;
  }

  startAttack() {
    this.attacking = true;
    this.attackTimer = 200;
    this.attackCooldown = 300;
  }

  startSpecialAttack() {
    this.specialAttacking = true;
    this.specialAttackTimer = 300;
    this.specialAttackCooldown = 600;
  }

  update(delta) {
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.attackTimer = 0;
      }
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    if (this.specialAttackTimer > 0) {
      this.specialAttackTimer -= delta;
      if (this.specialAttackTimer <= 0) {
        this.specialAttacking = false;
        this.specialAttackTimer = 0;
      }
    }
    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown -= delta;
    }

    this.updateVisuals();
  }

  updateVisuals() {
    const { x, y } = this.sprite;

    this.sprite.setFlipX(this.facing === 'left');

    if (this.shielding) {
      this.sprite.setTint(0x88aaff);
    } else {
      this.sprite.setTint(this.playerColor);
    }

    this.damageText.setPosition(x, y - 40);
    this.damageText.setText(`${Math.floor(this.damage)}%`);

    if (this.specialAttacking) {
      const hx = this.facing === 'right' ? x + 12 : x - 68;
      this.attackGfx.clear();
      this.attackGfx.fillStyle(0xff6600, 0.8);
      this.attackGfx.fillRect(hx, y - 18, 56, 36);
      this.attackGfx.setVisible(true);
    } else if (this.attacking) {
      const hx = this.facing === 'right' ? x + 16 : x - 56;
      this.attackGfx.clear();
      this.attackGfx.fillStyle(0xffff00, 0.7);
      this.attackGfx.fillRect(hx, y - 14, 40, 28);
      this.attackGfx.setVisible(true);
    } else {
      this.attackGfx.setVisible(false);
    }
  }

  cleanup() {
    this.sprite?.destroy();
    this.damageText?.destroy();
    this.attackGfx?.destroy();
  }
}
