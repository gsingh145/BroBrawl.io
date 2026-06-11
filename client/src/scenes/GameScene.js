import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { playSound, initSounds, startMusic, stopMusic } from '../audio/SoundManager.js';

const LOCAL_MOVE_SPEED = 4.5;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('bg', '/images/background.png');
  }

  create(data) {
    try {
      this.errorText = null;
      this.connection = data.connection;
      this.myCharacter = data.character || 'sensei_waisas';
      this.battleTrack = data.battleTrack;

    this.add.image(400, 300, 'bg').setDisplaySize(800, 600).setDepth(0);
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

    this.platformGfx = this.add.graphics();
    this.platformGfx.setDepth(10);
    this.platformSurf = this.add.graphics();
    this.platformSurf.setDepth(11);
    this.platformDecor = this.add.graphics();
    this.platformDecor.setDepth(9);

    this.prevStates = {};
    this.serverPlatforms = null;
    initSounds();
    startMusic('battle', this.battleTrack);

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
    } catch (e) {
      console.error('GameScene.create() error:', e);
      this.cameras.main.setBackgroundColor('#ff0000');
      this.errorText = this.add.text(400, 300, `Error: ${e.message}\nCheck console`, {
        fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5).setDepth(200);
    }
  }

  createPlatforms() {
    const gfx = this.add.graphics();
    gfx.setDepth(10);

    const groundTop = 380;
    const left = 120;
    const right = 700;
    // Subtle neon edge line on the stage surface
    gfx.fillStyle(0x44ccff, 0.25);
    gfx.fillRect(left, groundTop - 1, right - left, 2);
    gfx.fillStyle(0x88eeff, 0.1);
    gfx.fillRect(left, groundTop - 2, right - left, 4);
  }

  renderFloatingPlatforms(platforms) {
    this.platformGfx.clear();
    this.platformSurf.clear();
    this.platformDecor.clear();

    const styles = [
      { edge: 0x44ccff, base: 0x1a2a3a, mid: 0x0e1a28, dark: 0x080e18, accent: 0x88eeff },
      { edge: 0xcc44ff, base: 0x2a1a3a, mid: 0x1a0e28, dark: 0x0e0818, accent: 0xee88ff },
      { edge: 0x44ff88, base: 0x1a3a2a, mid: 0x0e281a, dark: 0x08180e, accent: 0x88ffbb },
      { edge: 0xffaa44, base: 0x3a2a1a, mid: 0x281a0e, dark: 0x180e08, accent: 0xffcc88 },
      { edge: 0x44ccff, base: 0x1a2a3a, mid: 0x0e1a28, dark: 0x080e18, accent: 0x88eeff },
      { edge: 0xcc44ff, base: 0x2a1a3a, mid: 0x1a0e28, dark: 0x0e0818, accent: 0xee88ff },
    ];

    for (let pi = 1; pi < platforms.length; pi++) {
      const plat = platforms[pi];
      const s = styles[(pi - 1) % styles.length];
      const left = plat.left;
      const top = plat.surfaceY;
      const pw = plat.right - plat.left;
      const ph = 16;

      this.platformGfx.fillStyle(0x000000, 0.2);
      this.platformGfx.fillRoundedRect(left + 3, top + 3, pw, ph, 4);

      this.platformGfx.fillStyle(s.dark);
      this.platformGfx.fillRoundedRect(left, top, pw, ph, 4);

      this.platformGfx.fillStyle(s.mid);
      this.platformGfx.fillRoundedRect(left + 1, top + 1, pw - 2, ph - 2, 3);

      this.platformGfx.fillStyle(s.base);
      this.platformGfx.fillRoundedRect(left + 1, top + 1, pw - 2, ph / 2, { tl: 3, tr: 3, bl: 0, br: 0 });

      this.platformGfx.fillStyle(s.accent, 0.4);
      this.platformGfx.fillRect(left + 1, top + ph / 2, pw - 2, 1);

      const grainCount = 2 + Math.floor(pw / 30);
      for (let i = 0; i < grainCount; i++) {
        const gx = left + 6 + Math.random() * (pw - 12);
        const gy = top + 4 + Math.random() * (ph - 8);
        this.platformGfx.fillStyle(s.edge, 0.15);
        this.platformGfx.fillCircle(gx, gy, 1.5 + Math.random() * 2);
      }

      if (pi % 2 === 0) {
        this.platformGfx.lineStyle(1, s.dark, 0.3);
        const cx = left + pw * 0.3 + Math.random() * pw * 0.4;
        this.platformGfx.lineBetween(cx, top + 3, cx + 4, top + ph - 3);
      }

      this.platformSurf.fillStyle(s.edge, 0.45);
      this.platformSurf.fillRoundedRect(left + 3, top + 1, pw - 6, 3, 2);

      if (top > 300) {
        this.platformDecor.fillStyle(0x3a5a2a, 0.25);
        for (let i = 0; i < 3; i++) {
          const mx = left + 8 + Math.random() * (pw - 16);
          this.platformDecor.fillEllipse(mx, top + ph - 2, 6 + Math.random() * 4, 3);
        }
      }
    }
  }

  handleState(msg) {
    if (msg.platforms && msg.platforms !== this.serverPlatforms) {
      this.serverPlatforms = msg.platforms;
      this.renderFloatingPlatforms(msg.platforms);
    }
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
          const charId = state.character || 'sensei_waisas';
          player = new Player(this, state.x, state.y, {
            isRemote: true,
            character: charId,
            playerColor: state.playerColor,
          });
          this.playerMap[state.id] = player;
        }
      }

      const prev = this.prevStates[state.id];
      if (prev && !this.winnerId) {
        if ((state.damage || 0) > (prev.damage || 0)) playSound('hit');
        if (state.attackStartup != null && state.attackStartup <= 0 && (prev.attackStartup || 0) > 0) playSound('attack');
        if (state.specialAttackStartup != null && state.specialAttackStartup <= 0 && (prev.specialAttackStartup || 0) > 0) playSound('attack');
        if (state.shielding && !prev.shielding) playSound('shield');
        if ((state.stocks ?? 3) < (prev.stocks ?? 3) && (state.stocks ?? 3) <= 0) playSound('ko');
        if ((state.stocks ?? 3) < (prev.stocks ?? 3) && (state.stocks ?? 3) > 0) playSound('die');
        if (state.onGround && !prev.onGround && state.vy < 0) playSound('jump');
        if (state.dashing && !prev.dashing) playSound('dash');
      }

      this.prevStates[state.id] = { ...state };
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

    stopMusic();

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
        if (this.localPlayer) this.localPlayer.dashing = true;
      }
      this.lastTapKey = 'left';
      this.lastTapTime = time;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.D) || Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      if (this.lastTapKey === 'right' && time - this.lastTapTime < this.dashWindow) {
        this.connection.send('dash', { dir: 1 });
        if (this.localPlayer) this.localPlayer.dashing = true;
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
    const speed = dir === 'left' ? -LOCAL_MOVE_SPEED : dir === 'right' ? LOCAL_MOVE_SPEED : 0;
    this.localPlayer.handleLocalInput({ attack, specialAttack, shield, attackDir, specialDir, vx: speed, dashing: this.localPlayer.dashing, canDoubleJump: this.localPlayer.canDoubleJump });

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
      this.stockGfx.fillRect(panelLeft, baseY - 10, panelW, 36);

      this.stockGfx.fillStyle(0x1a1a2e);
      this.stockGfx.fillRect(panelLeft + 1, baseY - 9, panelW - 2, 34);

      // Stock icons
      this.stockGfx.fillStyle(color);
      for (let s = 0; s < 3; s++) {
        const sx = baseX - 20 + s * 16;
        if (s < player.stocks) {
          this.stockGfx.fillCircle(sx, baseY, 4);
        } else {
          this.stockGfx.fillStyle(0x444444);
          this.stockGfx.fillCircle(sx, baseY, 4);
          this.stockGfx.fillStyle(0x1a1a2e);
          this.stockGfx.fillCircle(sx, baseY, 2);
          this.stockGfx.fillStyle(color);
        }
      }

      // Damage text below stocks
      const dmgPct = Math.min(1, player.damage / 150);
      const gb = Math.floor(255 * (1 - dmgPct));
      const textColor = `rgb(255, ${gb}, ${gb})`;
      const textX = baseX;
      const textY = baseY + 14;
      if (!this.hudTexts[id]) {
        this.hudTexts[id] = this.add.text(textX, textY, `${Math.floor(player.damage)}%`, {
          fontSize: '12px',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(51);
      } else {
        this.hudTexts[id].setPosition(textX, textY);
        this.hudTexts[id].setText(`${Math.floor(player.damage)}%`);
        this.hudTexts[id].setColor(textColor);
      }

      // Special meter below damage text
      const metX = baseX;
      const metPct = Math.min(1, player.specialMeter / 100);
      this.stockGfx.fillStyle(0x333333);
      this.stockGfx.fillRect(metX - 28, textY + 12, 56, 4);
      this.stockGfx.fillStyle(0x44ccff);
      this.stockGfx.fillRect(metX - 28, textY + 12, 56 * metPct, 4);
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
    stopMusic();
    this.stockGfx?.destroy();
    this.projectileGfx?.destroy();
    this.platformGfx?.destroy();
    this.platformSurf?.destroy();
    this.platformDecor?.destroy();
    Object.values(this.hudTexts).forEach(t => t?.destroy());
    this.hudTexts = {};
  }
}
