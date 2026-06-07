import Phaser from 'phaser';
import ConnectionManager from '../network/ConnectionManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.3, 'BroBrawl.io', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, height * 0.5, 'Connecting...', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.playerCountText = this.add.text(width / 2, height * 0.6, '', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.connection = new ConnectionManager();

    this.connection.on('open', () => {
      this.statusText.setText('Connected! Waiting for players...');
    });

    this.connection.on('close', () => {
      this.statusText.setText('Disconnected. Refresh to retry.');
    });

    this.connection.on('state', (msg) => {
      const count = msg.players.length;
      this.playerCountText.setText(`Players in game: ${count}`);
      if (count >= 2) {
        this.scene.start('GameScene', { connection: this.connection });
      }
    });

    this.connection.connect();
  }
}
