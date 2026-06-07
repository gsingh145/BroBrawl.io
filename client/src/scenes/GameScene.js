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

    this.prevDir = 'none';
    this.prevShielding = false;

    this.unsubs = [];
    this.unsubs.push(
      this.connection.on('GAME_STATE', (msg) => this.handleState(msg))
    );
    this.unsubs.push(
      this.connection.on('PLAYER_LEFT', (msg) => this.handlePlayerLeft(msg))
    );

    this.events.once('shutdown', this.cleanup, this);
  }

  createPlatforms() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x553c8b);
    gfx.fillRect(0, 430, 800, 40);
    gfx.fillRect(250 - 90, 340 - 12, 180, 24);
    gfx.fillRect(550 - 90, 280 - 12, 180, 24);
    gfx.fillRect(400 - 60, 200 - 12, 120, 24);
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

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const dir = left ? 'left' : right ? 'right' : 'none';
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.keys.W);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.J);
    const specialAttack = Phaser.Input.Keyboard.JustDown(this.keys.K);
    const shield = this.keys.SHIFT.isDown;

    if (dir !== this.prevDir) {
      this.connection.send('move', { dir });
      this.prevDir = dir;
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
  }

  cleanup() {
    this.unsubs.forEach(fn => fn());
    Object.values(this.playerMap).forEach(p => p.cleanup?.());
  }
}
