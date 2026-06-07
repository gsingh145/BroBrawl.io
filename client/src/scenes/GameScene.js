import Phaser from 'phaser';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.connection = this.scene.settings.data.connection;

    this.createTextures();
    this.createPlatforms();

    this.localPlayer = new Player(this, 400, 300, {
      isRemote: false,
      color: 0x4488ff,
    });
    this.physics.add.collider(this.localPlayer, this.platforms);

    this.playerMap = {};
    this.playerMap[this.connection.playerId] = this.localPlayer;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,J,SHIFT');

    this.prevDir = 'none';
    this.prevShielding = false;

    this.unsubs = [];
    this.unsubs.push(
      this.connection.on('state', (msg) => this.handleState(msg))
    );
    this.unsubs.push(
      this.connection.on('playerDisconnected', (msg) => this.handleDisconnect(msg))
    );

    this.events.once('shutdown', this.cleanup, this);
  }

  createTextures() {
    if (!this.textures.exists('platform')) {
      const gfx = this.make.graphics({ add: false });
      gfx.fillStyle(0x553c8b);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture('platform', 1, 1);
      gfx.destroy();
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    const ground = this.platforms.create(400, 580, 'platform');
    ground.setDisplaySize(800, 40).refreshBody();

    const p1 = this.platforms.create(250, 430, 'platform');
    p1.setDisplaySize(180, 24).refreshBody();

    const p2 = this.platforms.create(550, 350, 'platform');
    p2.setDisplaySize(180, 24).refreshBody();

    const p3 = this.platforms.create(400, 220, 'platform');
    p3.setDisplaySize(120, 24).refreshBody();
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

  handleDisconnect(msg) {
    this.removePlayer(msg.playerId);
  }

  removePlayer(id) {
    const player = this.playerMap[id];
    if (player) {
      player.cleanup();
      player.destroy();
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

    if (shield !== this.prevShielding) {
      this.connection.send(shield ? 'shieldStart' : 'shieldEnd');
      this.prevShielding = shield;
    }

    this.localPlayer.handleLocalInput({ left, right, jump, attack, shield });
  }

  cleanup() {
    this.unsubs.forEach(fn => fn());
    Object.values(this.playerMap).forEach(p => p.cleanup?.());
  }
}
