import Phaser from 'phaser';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(data) {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.connection = data.connection;

    this.createPlatforms();

    this.playerMap = {};
    this.localPlayer = new Player(this, 400, 300, {
      isRemote: false,
      color: 0x4488ff,
    });
    this.playerMap[this.connection.playerId] = this.localPlayer;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,J,K,SHIFT');

    this.prevShielding = false;

    this.winnerId = null;

    this.stockGfx = this.add.graphics();
    this.stockGfx.setDepth(50);
    this.hudTexts = {};

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

  createPlatforms() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x553c8b);
    gfx.fillRect(150, 474, 500, 40);
    gfx.fillRect(160, 328, 180, 24);
    gfx.fillRect(460, 268, 180, 24);
    gfx.fillRect(340, 188, 120, 24);

    gfx.lineStyle(2, 0x8866cc, 0.6);
    gfx.strokeRect(150, 474, 500, 40);
    gfx.strokeRect(160, 328, 180, 24);
    gfx.strokeRect(460, 268, 180, 24);
    gfx.strokeRect(340, 188, 120, 24);
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
      if (state.id === this.connection.playerId) {
        this.localPlayer.applyState(state);
      } else {
        let player = this.playerMap[state.id];
        if (!player) {
          player = new Player(this, state.x, state.y, {
            isRemote: true,
            color: 0xff4444,
          });
          this.playerMap[state.id] = player;
        }
        player.applyState(state);
      }
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
    const fastFallDown = Phaser.Input.Keyboard.JustDown(this.cursors.down) ||
                         Phaser.Input.Keyboard.JustDown(this.keys.S);

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

    if (fastFallDown) {
      this.connection.send('fastFall');
    }

    let attackDir = 'neutral';
    if (up && !down) attackDir = 'up';
    else if (down && !up) attackDir = 'down';
    else if (left || right) attackDir = 'side';

    if (attack) {
      this.connection.send('attack', { dir: attackDir });
    }

    if (specialAttack && this.localPlayer.specialMeter >= 100) {
      this.connection.send('specialAttack');
    }

    if (shield !== this.prevShielding) {
      this.connection.send(shield ? 'shieldStart' : 'shieldEnd');
      this.prevShielding = shield;
    }

    this.localPlayer.handleLocalInput({ attack, specialAttack, shield, attackDir });

    for (const player of Object.values(this.playerMap)) {
      player.update(delta);
    }

    this.drawStockHUD();
  }

  drawStockHUD() {
    this.stockGfx.clear();

    const entries = Object.entries(this.playerMap);
    if (entries.length === 0) return;

    for (const [id, player] of entries) {
      const isLocal = id === this.connection.playerId;
      const baseX = isLocal ? 60 : 740;
      const baseY = 24;
      const color = player.playerColor;

      this.stockGfx.fillStyle(0xffffff);
      this.stockGfx.fillRect(baseX - 10, baseY - 10, 110, 28);

      this.stockGfx.fillStyle(0x1a1a2e);
      this.stockGfx.fillRect(baseX - 9, baseY - 9, 108, 26);

      this.stockGfx.fillStyle(color);
      for (let i = 0; i < 3; i++) {
        const sx = isLocal ? baseX + i * 16 : baseX - (2 - i) * 16;
        if (i < player.stocks) {
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
      const textX = isLocal ? baseX + 54 : baseX - 54;
      if (!this.hudTexts[id]) {
        this.hudTexts[id] = this.add.text(textX, baseY, `${Math.floor(player.damage)}%`, {
          fontSize: '12px',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5);
      } else {
        this.hudTexts[id].setPosition(textX, baseY);
        this.hudTexts[id].setText(`${Math.floor(player.damage)}%`);
        this.hudTexts[id].setColor(textColor);
      }

      const metX = isLocal ? baseX + 52 : baseX - 62;
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
    Object.values(this.hudTexts).forEach(t => t?.destroy());
    this.hudTexts = {};
  }
}
