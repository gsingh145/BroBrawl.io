import Phaser from 'phaser';
import ConnectionManager from '../network/ConnectionManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.2, 'BroBrawl.io', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, height * 0.35, 'Connecting...', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.playerCountText = this.add.text(width / 2, height * 0.65, '', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.connection = new ConnectionManager();
    this.transitioned = false;
    this.playerCount = 0;

    const btnBg = this.add.rectangle(width / 2, height * 0.48, 200, 50, 0x4488ff)
      .setInteractive({ useHandCursor: true });

    this.btnText = this.add.text(width / 2, height * 0.48, 'Join Game', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const startGame = () => {
      if (this.transitioned) return;
      this.transitioned = true;
      this.statusText.setText('Starting game...');
      this.scene.start('CharacterSelectScene', { connection: this.connection });
    };

    const checkStart = () => {
      if (this.playerCount >= 2) startGame();
    };

    btnBg.on('pointerover', () => {
      if (!this.transitioned) btnBg.setFillStyle(0x5599ff);
    });
    btnBg.on('pointerout', () => {
      if (!this.transitioned) btnBg.setFillStyle(0x4488ff);
    });
    btnBg.on('pointerdown', () => {
      if (this.transitioned) return;
      btnBg.setFillStyle(0x3366cc);
      this.btnText.setText('Joined');
      this.statusText.setText('Waiting for opponent...');
      checkStart();
    });

    this.connection.on('open', () => {
      this.statusText.setText('Connected!');
    });

    this.connection.on('close', () => {
      this.statusText.setText('Disconnected. Refresh to retry.');
      this.btnText.setText('Disconnected');
      btnBg.disableInteractive();
    });

    this.connection.on('PLAYER_LIST', (msg) => {
      this.playerCount = msg.players.length + 1;
      this.playerCountText.setText(`Players in lobby: ${this.playerCount}`);
      checkStart();
    });

    this.connection.on('PLAYER_JOINED', () => {
      this.playerCount++;
      this.playerCountText.setText(`Players in lobby: ${this.playerCount}`);
      checkStart();
    });

    this.connection.on('PLAYER_LEFT', () => {
      this.playerCount--;
      this.playerCountText.setText(`Players in lobby: ${this.playerCount}`);
    });

    this.connection.on('GAME_STATE', (msg) => {
      if (msg.players.length >= 2) startGame();
    });

    this.connection.connect();
  }
}
