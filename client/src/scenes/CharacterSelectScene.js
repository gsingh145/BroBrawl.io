import Phaser from 'phaser';
import { CHARACTER_LIST } from '../characters/index.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelectScene');
  }

  create(data) {
    this.connection = data.connection;
    this.selected = null;

    const { width, height } = this.scale;

    const showChars = CHARACTER_LIST.filter(ch => ch.id === 'brawn_boy' || ch.id === 'wizard' || ch.id === 'shadow' || ch.id === 'samurai');

    this.add.rectangle(width / 2, 30, width, 60, 0x1a1a3e).setDepth(5);
    this.add.text(width / 2, 30, 'SELECT YOUR CHARACTER', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(6);

    const cols = Math.min(showChars.length, 4);
    const cardW = 150;
    const cardH = 170;
    const gapX = 20;
    const totalW = cols * (cardW + gapX) - gapX;
    const startX = (width - totalW) / 2 + cardW / 2;
    const startY = height / 2 - 20;

    this.cards = [];
    showChars.forEach((ch, i) => {
      const col = i % cols;
      const cx = startX + col * (cardW + gapX);
      const cy = startY;

      const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x222244)
        .setStrokeStyle(2, 0x444466)
        .setInteractive({ useHandCursor: true });

      const texKey = `${ch.id}_idle`;
      const charSprite = this.textures.exists(texKey)
        ? this.add.sprite(cx, cy - 42, texKey).setDepth(2).setDisplaySize(50, 50)
        : this.add.rectangle(cx, cy - 42, 50, 50, ch.color).setDepth(2);

      this.add.text(cx, cy + 16, ch.name, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);

      this.add.text(cx, cy + 38, ch.class.toUpperCase(), {
        fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(2);

      const readyText = this.add.text(cx, cy + 65, '', {
        fontSize: '13px', color: '#44ff44', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(2);

      bg.on('pointerover', () => {
        if (!this.selected) bg.setFillStyle(0x333366);
      });
      bg.on('pointerout', () => {
        if (!this.selected || this.selected !== ch.id) bg.setFillStyle(0x222244);
      });
      bg.on('pointerdown', () => {
        if (this.selected) return;
        this.selected = ch.id;
        bg.setFillStyle(0x446644);
        bg.setStrokeStyle(3, 0x44ff44);
        readyText.setText('YOU');
        this.connection.send('selectCharacter', { character: ch.id });
        this.statusText.setText(`Selected ${ch.name}. Waiting for opponent...`);
      });

      this.cards.push({ ch, bg, charSprite, readyText });
    });

    this.statusText = this.add.text(width / 2, height - 50, 'Click a character to select', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(6);

    this.otherPlayerId = null;

    this.unsubs = [];
    this.unsubs.push(
      this.connection.on('PLAYER_SELECTED', (msg) => {
        if (msg.playerId === this.connection.playerId) return;
        this.otherPlayerId = msg.playerId;
        const card = this.cards.find(c => c.ch.id === msg.character);
        if (card) {
          card.bg.setStrokeStyle(3, 0xffaa00);
          card.readyText.setText('OPPONENT');
        }
        this.statusText.setText('Both selected! Starting game...');
      })
    );

    this.unsubs.push(
      this.connection.on('GAME_START', (msg) => {
        const myChar = msg.players.find(p => p.id === this.connection.playerId)?.character || 'brawn_boy';
        this.scene.start('GameScene', { connection: this.connection, character: myChar });
      })
    );

    this.unsubs.push(
      this.connection.on('close', () => {
        this.statusText.setText('Connection lost. Refresh to retry.');
        this.statusText.setColor('#ff4444');
      })
    );

    this.events.once('shutdown', this.cleanup, this);
  }

  cleanup() {
    this.unsubs.forEach(fn => fn());
  }
}
