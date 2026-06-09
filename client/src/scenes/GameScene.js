import Phaser from 'phaser';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(data) {
    this.connection = data.connection;
    this.myCharacter = data.character || 'brawn_boy';

    this.createBackground();
    this.createPlatforms();

    this.playerMap = {};
    this.localPlayer = new Player(this, 400, 300, {
      isRemote: false,
      character: this.myCharacter,
    });
    this.localPlayerApplied = false;
    this.playerMap[this.connection.playerId] = this.localPlayer;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,J,K,SHIFT');

    this.prevShielding = false;

    this.winnerId = null;

    this.stockGfx = this.add.graphics();
    this.stockGfx.setDepth(50);
    this.hudTexts = {};

    this.projectileGfx = this.add.graphics();
    this.projectileGfx.setDepth(30);

    this.unsubs = [];
    this.unsubs.push(
      this.connection.on('GAME_STATE', (msg) => this.handleState(msg))
    );
    this.unsubs.push(
      this.connection.on('PLAYER_LEFT', (msg) => this.handlePlayerLeft(msg))
    );

    this.events.once('shutdown', this.cleanup, this);

    this.lastTapKey = null;
    this.lastTapTime = 0;
    this.dashWindow = 300;
  }

  createBackground() {
    this.cameras.main.setBackgroundColor('#0f0f23');

    const gfx = this.add.graphics();
    gfx.fillStyle(0x151530, 0.5);
    for (let i = 0; i < 12; i++) {
      const x = (i * 73 + 20) % 800;
      const y = (i * 47 + 30) % 500;
      gfx.fillCircle(x, y, 1.5);
    }

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.6);
    bg.fillRect(0, 0, 800, 100);
    bg.fillRect(0, 500, 800, 100);
  }

  createPlatforms() {
    const gfx = this.add.graphics();
    gfx.setDepth(10);

    const surf = this.add.graphics();
    surf.setDepth(11);

    this.platformRects = [
      { x: 250, y: 390, w: 160, h: 16, color: 0x00d2ff },
      { x: 550, y: 320, w: 160, h: 16, color: 0x00d2ff },
      { x: 400, y: 250, w: 130, h: 16, color: 0xff6b6b },
      { x: 250, y: 190, w: 110, h: 16, color: 0xffd93d },
      { x: 550, y: 140, w: 90, h: 16, color: 0xffd93d },
    ];

    const groundTop = 474;
    gfx.fillStyle(0x000000, 0.4);
    gfx.fillRect(0, groundTop + 4, 800, 40);
    gfx.fillStyle(0x2a1a4a);
    gfx.fillRect(0, groundTop, 800, 40);
    surf.fillStyle(0x8866ff, 0.8);
    surf.fillRect(0, groundTop, 800, 4);
    surf.fillStyle(0xaa88ff, 0.3);
    surf.fillRect(0, groundTop + 4, 800, 2);

    for (const p of this.platformRects) {
      const left = p.x - p.w / 2;
      const top = p.y - p.h / 2;
      gfx.fillStyle(0x000000, 0.3);
      gfx.fillRoundedRect(left + 3, top + 3, p.w, p.h, 4);
      gfx.fillStyle(p.color, 0.15);
      gfx.fillRoundedRect(left - 6, top - 6, p.w + 12, p.h + 12, 8);
      gfx.fillStyle(p.color);
      gfx.fillRoundedRect(left, top, p.w, p.h, 4);
      surf.fillStyle(0xffffff, 0.25);
      surf.fillRoundedRect(left + 3, top + 2, p.w - 6, p.h / 2 - 2, 3);
    }
  }

  handleState(msg) {
    const activeIds = new Set(msg.players.map(s => s.id));

    for (const id of Object.keys(this.playerMap)) {
      if (id === this.connection.playerId) continue;
      if (!activeIds.has(id)) {
        this.removePlayer(id);
      }
    }

    for (const state of msg.players) {
      let player;
      if (state.id === this.connection.playerId) {
        player = this.localPlayer;
      } else {
        player = this.playerMap[state.id];
        if (!player) {
          const charId = state.character || 'brawn_boy';
          player = new Player(this, state.x, state.y, {
            isRemote: true,
            character: charId,
            playerColor: state.playerColor,
          });
          this.playerMap[state.id] = player;
        }
      }
      player.applyState(state);
    }

    if (msg.projectiles) {
      this.renderProjectiles(msg.projectiles);
    }

    if (!this.winnerId) {
      this.checkWinner(msg.players);
    }
  }

  checkWinner(players) {
    if (players.length < 2) return;

    const zeroStocks = players.filter(p => p.stocks <= 0);
    const hasStocks = players.filter(p => p.stocks > 0);

    if (zeroStocks.length > 0 && hasStocks.length > 0) {
      this.showWinner(hasStocks[0]);
    }
  }

  showWinner(winner) {
    this.winnerId = winner.id;
    const { width, height } = this.scale;
    const isLocal = winner.id === this.connection.playerId;

    this.cameras.main.shake(300, 0.02);

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(100);

    this.add.text(width / 2, height / 2 - 30, isLocal ? 'YOU WIN!' : 'YOU LOSE!', {
      fontSize: '48px',
      color: isLocal ? '#4488ff' : '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(101);

    this.add.text(width / 2, height / 2 + 30, 'Press R to return to menu', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(101);

    this.input.keyboard.once('keydown-R', () => {
      this.cleanup();
      this.connection.disconnect();
      this.scene.start('MenuScene');
    });
  }

  renderProjectiles(projList) {
    this.projectileGfx.clear();
    for (const p of projList) {
      this.projectileGfx.fillStyle(0xff4444, 0.8);
      this.projectileGfx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      this.projectileGfx.fillStyle(0xffffff, 0.4);
      this.projectileGfx.fillRect(p.x - p.w / 4, p.y - p.h / 4, p.w / 2, p.h / 2);
    }
  }

  handlePlayerLeft(msg) {
    this.removePlayer(msg.playerId);
  }

  removePlayer(id) {
    const player = this.playerMap[id];
    if (player) {
      player.cleanup();
      delete this.playerMap[id];
    }
  }

  update(time, delta) {
    if (!this.localPlayer) return;

    if (this.winnerId) return;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const dir = left ? 'left' : right ? 'right' : 'none';
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.keys.W);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.J);
    const specialAttack = Phaser.Input.Keyboard.JustDown(this.keys.K);
    const shield = this.keys.SHIFT.isDown;
    this.connection.send('move', { dir });

    if (Phaser.Input.Keyboard.JustDown(this.keys.A) || Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      if (this.lastTapKey === 'left' && time - this.lastTapTime < this.dashWindow) {
        this.connection.send('dash', { dir: -1 });
      }
      this.lastTapKey = 'left';
      this.lastTapTime = time;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.D) || Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      if (this.lastTapKey === 'right' && time - this.lastTapTime < this.dashWindow) {
        this.connection.send('dash', { dir: 1 });
      }
      this.lastTapKey = 'right';
      this.lastTapTime = time;
    }

    if (jump) {
      this.connection.send('jump');
    }

    const sDown = Phaser.Input.Keyboard.JustDown(this.keys.S) || Phaser.Input.Keyboard.JustDown(this.cursors.down);
    if (sDown) {
      if (this.localPlayer?.onGround) {
        if (this.lastTapKey === 'down' && time - this.lastTapTime < this.dashWindow) {
          this.connection.send('platformDrop');
        }
        this.lastTapKey = 'down';
        this.lastTapTime = time;
      } else {
        this.connection.send('fastFall');
      }
    }

    let attackDir = 'neutral';
    if (up && !down) attackDir = 'up';
    else if (down && !up) attackDir = 'down';
    else if (left || right) attackDir = 'side';

    if (attack) {
      this.connection.send('attack', { dir: attackDir });
    }

    if (specialAttack) {
      let specialDir = 'neutral';
      if (up && !down) specialDir = 'up';
      else if (down && !up) specialDir = 'down';
      else if (left || right) specialDir = 'side';
      this.connection.send('specialAttack', { dir: specialDir });
    }

    if (shield !== this.prevShielding) {
      this.connection.send(shield ? 'shieldStart' : 'shieldEnd');
      this.prevShielding = shield;
    }

    let specialDir = 'neutral';
    if (up && !down) specialDir = 'up';
    else if (down && !up) specialDir = 'down';
    else if (left || right) specialDir = 'side';
    const speed = dir === 'left' ? -4.5 : dir === 'right' ? 4.5 : 0;
    this.localPlayer.handleLocalInput({ attack, specialAttack, shield, attackDir, specialDir, vx: speed });

    for (const player of Object.values(this.playerMap)) {
      player.update(delta);
    }

    this.drawStockHUD();
  }

  drawStockHUD() {
    this.stockGfx.clear();

    const entries = Object.entries(this.playerMap);
    if (entries.length === 0) return;

    const w = this.scale.width;
    const count = entries.length;
    const panelW = 130;
    const spacing = Math.min(panelW + 40, (w - 20) / count);
    const startX = (w - spacing * (count - 1)) / 2;

    for (let i = 0; i < count; i++) {
      const [id, player] = entries[i];
      const baseX = startX + i * spacing;
      const baseY = 24;
      const color = player.playerColor;

      const panelLeft = baseX - panelW / 2;
      this.stockGfx.fillStyle(0xffffff);
      this.stockGfx.fillRect(panelLeft, baseY - 10, panelW, 28);

      this.stockGfx.fillStyle(0x1a1a2e);
      this.stockGfx.fillRect(panelLeft + 1, baseY - 9, panelW - 2, 26);

      this.stockGfx.fillStyle(color);
      for (let s = 0; s < 3; s++) {
        const sx = baseX - 20 + s * 16;
        if (s < player.stocks) {
          this.stockGfx.fillCircle(sx, baseY, 5);
        } else {
          this.stockGfx.fillStyle(0x444444);
          this.stockGfx.fillCircle(sx, baseY, 5);
          this.stockGfx.fillStyle(0x1a1a2e);
          this.stockGfx.fillCircle(sx, baseY, 2);
          this.stockGfx.fillStyle(color);
        }
      }

      const dmgPct = Math.min(1, player.damage / 150);
      const gb = Math.floor(255 * (1 - dmgPct));
      const textColor = `rgb(255, ${gb}, ${gb})`;
      const textX = baseX + 30;
      if (!this.hudTexts[id]) {
        this.hudTexts[id] = this.add.text(textX, baseY, `${Math.floor(player.damage)}%`, {
          fontSize: '12px',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(51);
      } else {
        this.hudTexts[id].setPosition(textX, baseY);
        this.hudTexts[id].setText(`${Math.floor(player.damage)}%`);
        this.hudTexts[id].setColor(textColor);
      }

      const metX = baseX + 26;
      const metPct = Math.min(1, player.specialMeter / 100);
      this.stockGfx.fillStyle(0x333333);
      this.stockGfx.fillRect(metX, baseY + 10, 56, 4);
      this.stockGfx.fillStyle(0x44ccff);
      this.stockGfx.fillRect(metX, baseY + 10, 56 * metPct, 4);
    }

    for (const id of Object.keys(this.hudTexts)) {
      if (!this.playerMap[id]) {
        this.hudTexts[id]?.destroy();
        delete this.hudTexts[id];
      }
    }
  }

  cleanup() {
    this.unsubs.forEach(fn => fn());
    Object.values(this.playerMap).forEach(p => p.cleanup?.());
    this.stockGfx?.destroy();
    this.projectileGfx?.destroy();
    Object.values(this.hudTexts).forEach(t => t?.destroy());
    this.hudTexts = {};
  }
}
