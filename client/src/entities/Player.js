import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
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

    super(scene, x, y, 'player');
    scene.add.existing(this);

    this.isRemote = isRemote;
    this.playerColor = color;
    this.setTint(color);

    if (!isRemote) {
      scene.physics.add.existing(this);
      this.speed = 220;
      this.jumpVelocity = -480;
      this.maxJumps = 2;
      this.jumpsRemaining = 0;
    } else {
      this.body.enable = false;
    }

    this.facing = 'right';
    this.damage = 0;
    this.stocks = 3;
    this.shielding = false;
    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;

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

  handleLocalInput(input) {
    const { left, right, jump, attack, shield } = input;

    if (this.body.blocked.down) {
      this.jumpsRemaining = this.maxJumps;
    }

    if (left) {
      this.setVelocityX(-this.speed);
      this.facing = 'left';
    } else if (right) {
      this.setVelocityX(this.speed);
      this.facing = 'right';
    } else {
      this.setVelocityX(0);
    }

    if (jump && this.jumpsRemaining > 0) {
      this.setVelocityY(this.jumpVelocity);
      this.jumpsRemaining--;
    }

    if (attack && !this.attacking && this.attackCooldown <= 0) {
      this.startAttack();
    }

    this.shielding = shield;
  }

  startAttack() {
    this.attacking = true;
    this.attackTimer = 200;
    this.attackCooldown = 300;
  }

  applyState(state) {
    this.setPosition(state.x, state.y);
    if (!this.isRemote) {
      this.setVelocity(state.vx || 0, state.vy || 0);
    }
    this.damage = state.damage || 0;
    this.stocks = state.stocks ?? 3;
    this.facing = state.facing === -1 ? 'left' : 'right';
    this.shielding = state.shielding || false;

    if (state.attacking && !this.attacking) {
      this.startAttack();
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

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

    this.updateVisuals();
  }

  updateVisuals() {
    this.setFlipX(this.facing === 'left');

    if (this.shielding) {
      this.setTint(0x88aaff);
    } else {
      this.setTint(this.playerColor);
    }

    this.damageText.setPosition(this.x, this.y - 40);
    this.damageText.setText(`${Math.floor(this.damage)}%`);

    if (this.attacking) {
      const hx = this.facing === 'right' ? this.x + 16 : this.x - 56;
      this.attackGfx.clear();
      this.attackGfx.fillStyle(0xffff00, 0.7);
      this.attackGfx.fillRect(hx, this.y - 14, 40, 28);
      this.attackGfx.setVisible(true);
    } else {
      this.attackGfx.setVisible(false);
    }
  }

  cleanup() {
    this.damageText?.destroy();
    this.attackGfx?.destroy();
  }
}
