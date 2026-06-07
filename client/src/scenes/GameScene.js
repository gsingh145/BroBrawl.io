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
    gfx.fillRect(250 - 90, 340 - 12, 180, 24);
    gfx.fillRect(550 - 90, 280 - 12, 180, 24);
    gfx.fillRect(400 - 60, 200 - 12, 120, 24);

    gfx.lineStyle(2, 0x8866cc, 0.6);
    gfx.strokeRect(150, 474, 500, 40);
    gfx.strokeRect(250 - 90, 340 - 12, 180, 24);
    gfx.strokeRect(550 - 90, 280 - 12, 180, 24);
    gfx.strokeRect(400 - 60, 200 - 12, 120, 24);
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
    if (attack) {
      this.connection.send('attack');
    }
    if (specialAttack) {
      this.connection.send('specialAttack');
    }
    if (shield !== this.prevShielding) {
      this.connection.send(shield ? 'shieldStart' : 'shieldEnd');
      this.prevShielding = shield;
    }

    this.localPlayer.handleLocalInput({ attack, specialAttack, shield });

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
      const y = 24;
      const color = player.playerColor;

      this.stockGfx.fillStyle(0xffffff);
      this.stockGfx.fillRect(baseX - 10, y - 10, 60, 20);

      this.stockGfx.fillStyle(0x1a1a2e);
      this.stockGfx.fillRect(baseX - 9, y - 9, 58, 18);

      this.stockGfx.fillStyle(color);
      for (let i = 0; i < 3; i++) {
        const sx = isLocal ? baseX + i * 16 : baseX - (2 - i) * 16;
        if (i < player.stocks) {
          this.stockGfx.fillCircle(sx, y, 5);
        } else {
          this.stockGfx.fillStyle(0x444444);
          this.stockGfx.fillCircle(sx, y, 5);
          this.stockGfx.fillStyle(0x1a1a2e);
          this.stockGfx.fillCircle(sx, y, 2);
        }
      }
    }
  }

  cleanup() {
    this.unsubs.forEach(fn => fn());
    Object.values(this.playerMap).forEach(p => p.cleanup?.());
    this.stockGfx?.destroy();
  }
}
