import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { playSound, initSounds, startMusic, stopMusic } from '../audio/SoundManager.js';

const LOCAL_MOVE_SPEED = 4.5;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(data) {
    try {
      this.errorText = null;
      this.connection = data.connection;
      this.myCharacter = data.character || 'sensei_waisas';
      this.battleTrack = data.battleTrack;

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

  createBackground() {
    const w = 800, h = 600;

    // Sky gradient (depth 0)
    const skyGfx = this.add.graphics();
    skyGfx.setDepth(0);

    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const r = Phaser.Math.Linear(0x08, 0x1a, t);
      const g = Phaser.Math.Linear(0x08, 0x18, t);
      const b = Phaser.Math.Linear(0x20, 0x40, t);
      skyGfx.fillStyle((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b));
      skyGfx.fillRect(0, i * 50, w, 50);
    }

    // Moon
    skyGfx.fillStyle(0xccddee, 0.6);
    skyGfx.fillCircle(650, 60, 25);
    skyGfx.fillStyle(0xccddee, 0.2);
    skyGfx.fillCircle(650, 60, 35);

    // Thin clouds
    skyGfx.fillStyle(0x334466, 0.15);
    for (let i = 0; i < 4; i++) {
      const cx = 100 + i * 200 + Math.random() * 50;
      const cy = 40 + Math.random() * 60;
      skyGfx.fillEllipse(cx, cy, 120 + Math.random() * 80, 14 + Math.random() * 8);
    }

    // Stars (depth 1)
    const starGfx = this.add.graphics();
    starGfx.setDepth(1);
    this.stars = starGfx;
    const starPositions = [];
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h * 0.3;
      starGfx.fillStyle(0xffffff, 0.2 + Math.random() * 0.4);
      starGfx.fillCircle(sx, sy, 0.5 + Math.random());
      starPositions.push({ x: sx, y: sy, r: 0.5 + Math.random(), speed: 0.2 + Math.random() * 0.3 });
    }
    this.starPositions = starPositions;

    // Palace wall (depth 2)
    const wallGfx = this.add.graphics();
    wallGfx.setDepth(2);

    const wallBase = 474;
    const wallTop = wallBase - 310;
    const wallH = 310;

    // Main wall fill
    wallGfx.fillStyle(0x6a5a48);
    wallGfx.fillRect(0, wallTop, w, wallH);

    // Stone block grid
    wallGfx.lineStyle(1, 0x3a2e20, 0.4);
    for (let row = 0; row < 12; row++) {
      const ry = wallTop + row * 26;
      wallGfx.lineBetween(0, ry, w, ry);
    }
    for (let col = 0; col < 16; col++) {
      const cx = col * 52;
      for (let row = 0; row < 12; row++) {
        const ry = wallTop + row * 26;
        const off = row % 2 === 0 ? 0 : 26;
        wallGfx.lineBetween(cx + off, ry, cx + off, ry + 26);
      }
    }

    // Decorative horizontal stone band at 2/3 height
    wallGfx.fillStyle(0x7a6e58, 0.6);
    wallGfx.fillRect(0, wallTop + 156, w, 4);
    wallGfx.fillStyle(0x3a2e20, 0.4);
    wallGfx.fillRect(0, wallTop + 160, w, 2);

    // ─── Roof / Battlements ───
    const roofGfx = this.add.graphics();
    roofGfx.setDepth(2);

    // Main roof profile — stepped battlements with pointed spires
    const roofTop = wallTop - 30;
    const roofFill = 0x5a4a38;
    const roofEdge = 0x7a6a54;

    // Large central triangular roof peak above arch
    const peakCX = 400;
    const peakW = 160;
    const peakH = 50;
    roofGfx.fillStyle(roofFill);
    roofGfx.fillTriangle(peakCX - peakW / 2, wallTop, peakCX + peakW / 2, wallTop, peakCX, wallTop - peakH);
    roofGfx.fillStyle(roofEdge, 0.5);
    roofGfx.fillTriangle(peakCX - peakW / 2, wallTop, peakCX - peakW / 2 + 8, wallTop, peakCX, wallTop - peakH + 4);
    roofGfx.fillTriangle(peakCX + peakW / 2, wallTop, peakCX + peakW / 2 - 8, wallTop, peakCX, wallTop - peakH + 4);
    // Roof tile lines
    roofGfx.lineStyle(1, 0x1a1008, 0.35);
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const lx = Phaser.Math.Linear(peakCX - peakW / 2, peakCX, t);
      const rx = Phaser.Math.Linear(peakCX + peakW / 2, peakCX, t);
      const ry = Phaser.Math.Linear(wallTop, wallTop - peakH, t);
      roofGfx.lineBetween(lx, ry, rx, ry);
    }
    // Spire ball at top
    roofGfx.fillStyle(0x8a7e6c);
    roofGfx.fillCircle(peakCX, wallTop - peakH, 4);
    roofGfx.fillStyle(0xaa9e8c, 0.4);
    roofGfx.fillCircle(peakCX, wallTop - peakH, 2);

    // Side roof peaks (smaller)
    for (const sx of [180, 620]) {
      const spW = 80;
      const spH = 28;
      roofGfx.fillStyle(roofFill);
      roofGfx.fillTriangle(sx - spW / 2, wallTop, sx + spW / 2, wallTop, sx, wallTop - spH);
      roofGfx.fillStyle(roofEdge, 0.4);
      roofGfx.fillTriangle(sx - spW / 2, wallTop, sx - spW / 2 + 6, wallTop, sx, wallTop - spH + 3);
      roofGfx.lineStyle(1, 0x1a1008, 0.3);
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        const lx = Phaser.Math.Linear(sx - spW / 2, sx, t);
        const rx = Phaser.Math.Linear(sx + spW / 2, sx, t);
        const ry = Phaser.Math.Linear(wallTop, wallTop - spH, t);
        roofGfx.lineBetween(lx, ry, rx, ry);
      }
    }

    // Battlements between peaks
    const battStyle = 0x6a5a48;
    const battH = 20;
    const battGap = 12;
    // Left section battlements
    for (let x = 10; x < 320; x += 36) {
      roofGfx.fillStyle(battStyle);
      roofGfx.fillRect(x, wallTop - battH, 24, battH);
      roofGfx.fillStyle(roofEdge, 0.4);
      roofGfx.fillRect(x, wallTop - battH, 24, 3);
    }
    // Right section battlements
    for (let x = 480; x < 790; x += 36) {
      roofGfx.fillStyle(battStyle);
      roofGfx.fillRect(x, wallTop - battH, 24, battH);
      roofGfx.fillStyle(roofEdge, 0.4);
      roofGfx.fillRect(x, wallTop - battH, 24, 3);
    }
    // On the side peaks
    for (const bx of [140, 500]) {
      for (let x = bx; x < bx + 80; x += 36) {
        roofGfx.fillStyle(battStyle);
        roofGfx.fillRect(x, wallTop - battH, 20, battH);
        roofGfx.fillStyle(roofEdge, 0.4);
        roofGfx.fillRect(x, wallTop - battH, 20, 3);
      }
    }
    // Distant left/right small spires
    for (const sx of [40, 760]) {
      const spW = 40;
      const spH = 22;
      roofGfx.fillStyle(roofFill);
      roofGfx.fillTriangle(sx - spW / 2, wallTop, sx + spW / 2, wallTop, sx, wallTop - spH);
      roofGfx.fillStyle(0x8a7e6c);
      roofGfx.fillCircle(sx, wallTop - spH, 2);
    }

    // ─── Central grand arch ───
    const archCX = 400;
    const archW = 140;
    const archH = 200;

    // Arch opening
    wallGfx.fillStyle(0x4a3a30);
    wallGfx.fillRect(archCX - archW / 2, wallBase - archH, archW, archH);

    wallGfx.fillStyle(0x222244);
    wallGfx.fillRect(archCX - archW / 2 + 6, wallBase - archH + 6, archW - 12, archH - 12);

    // Arch top curve
    wallGfx.fillStyle(0x4a3a30);
    wallGfx.fillEllipse(archCX, wallBase - archH, archW, 60);

    wallGfx.fillStyle(0x222244);
    wallGfx.fillEllipse(archCX, wallBase - archH, archW - 12, 48);

    // Arch stone ring detail (concentric)
    wallGfx.lineStyle(2, 0x8a7a64, 0.6);
    wallGfx.strokeEllipse(archCX, wallBase - archH, archW + 16, 66);
    wallGfx.lineStyle(1, 0x9a8e78, 0.4);
    wallGfx.strokeEllipse(archCX, wallBase - archH, archW + 26, 74);

    // Arch columns (engaged)
    const colW = 14;
    wallGfx.fillStyle(0x7a6a58);
    wallGfx.fillRect(archCX - archW / 2 - colW, wallBase - archH, colW, archH);
    wallGfx.fillRect(archCX + archW / 2, wallBase - archH, colW, archH);
    // Column fluting
    wallGfx.fillStyle(0x4a3e30);
    wallGfx.fillRect(archCX - archW / 2 - colW + 3, wallBase - archH + 8, 2, archH - 16);
    wallGfx.fillRect(archCX - archW / 2 - colW + 9, wallBase - archH + 8, 2, archH - 16);
    wallGfx.fillRect(archCX + archW / 2 + 3, wallBase - archH + 8, 2, archH - 16);
    wallGfx.fillRect(archCX + archW / 2 + 9, wallBase - archH + 8, 2, archH - 16);
    // Column capitals
    wallGfx.fillStyle(0x8a7e68);
    wallGfx.fillRect(archCX - archW / 2 - colW - 2, wallBase - archH - 4, colW + 4, 6);
    wallGfx.fillRect(archCX + archW / 2 - 2, wallBase - archH - 4, colW + 4, 6);

    // Corbels under arch spring points
    const corbelY = wallBase - archH + 60;
    for (const corbX of [archCX - archW / 2 - 2, archCX + archW / 2 - 6]) {
      wallGfx.fillStyle(0x7a6a58);
      wallGfx.fillRect(corbX, corbelY, 10, 14);
      wallGfx.fillStyle(0x8a7e68);
      wallGfx.fillRect(corbX - 2, corbelY - 2, 14, 4);
      wallGfx.fillStyle(0x4a3e30, 0.5);
      wallGfx.fillRect(corbX + 1, corbelY + 4, 8, 2);
      wallGfx.fillRect(corbX + 1, corbelY + 9, 8, 2);
    }

    // ─── Decorative crest above arch ───
    const crestCX = archCX;
    const crestY = wallBase - archH - 30;

    // Shield shape
    wallGfx.fillStyle(0x7a6a58);
    wallGfx.fillTriangle(crestCX - 14, crestY + 10, crestCX + 14, crestY + 10, crestCX, crestY - 18);
    wallGfx.fillRect(crestCX - 14, crestY - 2, 28, 12);
    // Shield border
    wallGfx.lineStyle(2, 0xaa9e88, 0.8);
    wallGfx.beginPath();
    wallGfx.moveTo(crestCX - 14, crestY + 10);
    wallGfx.lineTo(crestCX - 14, crestY - 2);
    wallGfx.lineTo(crestCX, crestY - 18);
    wallGfx.lineTo(crestCX + 14, crestY - 2);
    wallGfx.lineTo(crestCX + 14, crestY + 10);
    wallGfx.closePath();
    wallGfx.strokePath();
    // Inner emblem — small diamond
    wallGfx.fillStyle(0xaa9e88, 0.7);
    wallGfx.fillTriangle(crestCX, crestY - 10, crestCX - 5, crestY, crestCX + 5, crestY);
    wallGfx.fillTriangle(crestCX - 5, crestY, crestCX + 5, crestY, crestCX, crestY + 6);
    wallGfx.fillStyle(0xcc88ff, 0.8);
    wallGfx.fillCircle(crestCX, crestY - 2, 4);

    // ─── Side windows (detailed) ───
    const winW = 60, winH = 90;
    for (const wx of [120, 680]) {
      const winY = wallBase - winH - 40;

      // Window opening
      wallGfx.fillStyle(0x4a3a30);
      wallGfx.fillRect(wx, winY, winW, winH);
      wallGfx.fillStyle(0x222244);
      wallGfx.fillRect(wx + 4, winY + 4, winW - 8, winH - 8);

      // Window pointed arch top
      wallGfx.fillStyle(0x4a3a30);
      wallGfx.fillTriangle(wx, winY, wx + winW, winY, wx + winW / 2, winY - 16);
      wallGfx.fillStyle(0x222244);
      wallGfx.fillTriangle(wx + 4, winY + 2, wx + winW - 4, winY + 2, wx + winW / 2, winY - 12);

      // Window frame
      wallGfx.lineStyle(2, 0x8a7a64, 0.8);
      wallGfx.strokeRect(wx, winY, winW, winH);
      wallGfx.lineBetween(wx + winW / 2, winY, wx + winW / 2, winY + winH); // mullion
      wallGfx.lineBetween(wx, winY + winH / 2, wx + winW, winY + winH / 2); // transom

      // Window sill
      wallGfx.fillStyle(0x7a6a58);
      wallGfx.fillRect(wx - 4, winY + winH, winW + 8, 4);
      wallGfx.fillStyle(0x8a7e68, 0.7);
      wallGfx.fillRect(wx - 2, winY + winH, winW + 4, 2);

      // Window hood molding (top)
      wallGfx.fillStyle(0x7a6a58);
      wallGfx.fillRect(wx - 6, winY - 18, winW + 12, 6);
      wallGfx.fillStyle(0x8a7e68, 0.5);
      wallGfx.fillRect(wx - 4, winY - 16, winW + 8, 3);

      // Inner glow tint
      wallGfx.fillStyle(0xaa88ee, 0.18);
      wallGfx.fillRect(wx + 6, winY + 6, winW - 12, winH - 12);
    }

    // ─── Flanking pillars ───
    for (const px of [60, 740]) {
      const pw = 28;
      wallGfx.fillStyle(0x7a6a58);
      wallGfx.fillRect(px, wallBase - 280, pw, 280);
      wallGfx.fillStyle(0x8a7e68);
      wallGfx.fillRect(px, wallBase - 280, pw, 4);
      wallGfx.fillStyle(0x4a3e30);
      wallGfx.fillRect(px + 4, wallBase - 280 + 10, 2, 260);
      wallGfx.fillRect(px + pw - 6, wallBase - 280 + 10, 2, 260);
      // Base
      wallGfx.fillStyle(0x8a7e68);
      wallGfx.fillRect(px - 4, wallBase - 4, pw + 8, 6);
      // Capital
      wallGfx.fillStyle(0x8a7e68);
      wallGfx.fillRect(px - 4, wallBase - 286, pw + 8, 8);
      wallGfx.fillStyle(0xaa9e88, 0.7);
      wallGfx.fillRect(px - 2, wallBase - 284, pw + 4, 4);
      // Horizontal groove
      wallGfx.lineStyle(1, 0x3a2e20, 0.5);
      wallGfx.lineBetween(px + 2, wallBase - 140, px + pw - 2, wallBase - 140);
      wallGfx.lineBetween(px + 2, wallBase - 70, px + pw - 2, wallBase - 70);
    }

    // ─── Torches ───
    for (const tx of [330, 470]) {
      // Pole
      wallGfx.fillStyle(0x3a2e24);
      wallGfx.fillRect(tx - 1, wallBase - 80, 3, 80);
      // Bracket
      wallGfx.fillStyle(0x5a4e40);
      wallGfx.fillRect(tx - 3, wallBase - 82, 7, 4);
      wallGfx.fillRect(tx - 3, wallBase - 78, 7, 2);
      // Fire bowl
      wallGfx.fillStyle(0x5a4e40);
      wallGfx.fillRect(tx - 3, wallBase - 88, 7, 6);
      // Flame
      wallGfx.fillStyle(0xffbb22, 0.9);
      wallGfx.fillTriangle(tx, wallBase - 96, tx - 3, wallBase - 88, tx + 3, wallBase - 88);
      wallGfx.fillStyle(0xffee66, 0.7);
      wallGfx.fillTriangle(tx, wallBase - 94, tx - 2, wallBase - 88, tx + 2, wallBase - 88);
      wallGfx.fillStyle(0xffffff, 0.5);
      wallGfx.fillCircle(tx, wallBase - 96, 2);
    }

    // ─── Hanging banners between central columns ───
    for (const bx of [300, 500]) {
      const bw = 18;
      const bh = 60;
      const by = wallBase - 260;
      // Banner cloth
      wallGfx.fillStyle(0x5a2a2a);
      wallGfx.fillRect(bx - bw / 2, by, bw, bh);
      wallGfx.fillStyle(0x7a3a3a, 0.5);
      wallGfx.fillRect(bx - bw / 2 + 2, by + 4, bw - 4, bh - 8);
      // Banner pole
      wallGfx.fillStyle(0x3a2e24);
      wallGfx.fillRect(bx - 1, by - 4, 3, bh + 8);
      // Finial
      wallGfx.fillStyle(0x8a7e6c);
      wallGfx.fillCircle(bx, by - 6, 3);
      // Bottom fringe
      wallGfx.fillStyle(0x5a2a2a, 0.7);
      wallGfx.fillTriangle(bx - bw / 2, by + bh, bx, by + bh + 8, bx + bw / 2, by + bh);
    }

    // ─── Glows (depth 3) ───
    const glowGfx = this.add.graphics();
    glowGfx.setDepth(3);

    // Arch glow
    for (let i = 0; i < 15; i++) {
      const a = 0.08 - i * 0.005;
      if (a <= 0) break;
      glowGfx.fillStyle(0xcc88ff, a);
      glowGfx.fillRect(archCX - archW / 2 - 20 - i * 2, wallBase - archH - 20 - i * 2, archW + 40 + i * 4, archH + 40 + i * 4);
    }

    // Window glows
    for (const wx of [120, 680]) {
      for (let i = 0; i < 8; i++) {
        const a = 0.06 - i * 0.007;
        if (a <= 0) break;
        glowGfx.fillStyle(0xaa88ee, a);
        glowGfx.fillRect(wx - 8 - i * 2, wallBase - winH - 44 - i * 2, winW + 16 + i * 4, winH + 8 + i * 4);
      }
    }

    // Torch flame glows
    for (const tx of [330, 470]) {
      for (let i = 0; i < 6; i++) {
        const a = 0.06 - i * 0.01;
        if (a <= 0) break;
        glowGfx.fillStyle(0xffaa44, a);
        glowGfx.fillEllipse(tx, wallBase - 92, 18 + i * 10, 24 + i * 10);
      }
    }

    // Crest glow
    for (let i = 0; i < 6; i++) {
      const a = 0.04 - i * 0.006;
      if (a <= 0) break;
      glowGfx.fillStyle(0xcc88ff, a);
      glowGfx.fillCircle(crestCX, crestY - 2, 18 + i * 10);
    }
  }

  createPlatforms() {
    const gfx = this.add.graphics();
    gfx.setDepth(10);
    const surf = this.add.graphics();
    surf.setDepth(11);
    const decor = this.add.graphics();
    decor.setDepth(9);

    const groundTop = 474;
    gfx.fillStyle(0x1a1410);
    gfx.fillRect(0, groundTop, 800, 40);
    gfx.fillStyle(0x2a2218);
    gfx.fillRect(0, groundTop, 800, 3);
    gfx.fillStyle(0x1a1410);
    gfx.fillRect(0, groundTop + 3, 800, 37);
    surf.fillStyle(0x7a6a58, 0.9);
    surf.fillRect(0, groundTop, 800, 3);
    surf.fillStyle(0x9a8a78, 0.4);
    surf.fillRect(0, groundTop + 3, 800, 2);

    decor.fillStyle(0x2a2218, 0.6);
    for (let i = 0; i < 30; i++) {
      const dx = Math.random() * 800;
      const dy = groundTop + 4 + Math.random() * 34;
      decor.fillCircle(dx, dy, 1 + Math.random() * 2);
    }

    // Left tower
    const twL = 30;
    const twH = 240;
    const twX = 40;
    gfx.fillStyle(0x4a3a28);
    gfx.fillRect(twX, groundTop - twH, twL, twH);
    gfx.fillStyle(0x6a5a48);
    gfx.fillRect(twX, groundTop - twH, twL, 3);
    for (let i = 0; i < 6; i++) {
      const sy = groundTop - twH + 20 + i * 36;
      gfx.fillStyle(0x2a1c10, 0.5);
      gfx.fillRect(twX + 3, sy, twL - 6, 2);
    }
    gfx.fillStyle(0x6a5a48);
    gfx.fillRect(twX - 4, groundTop - twH - 6, twL + 8, 6);
    surf.fillStyle(0x8a7a68, 0.8);
    surf.fillRect(twX - 3, groundTop - twH - 6, twL + 6, 3);

    // Right tower
    const twR = 30;
    const twRH = 280;
    const twRX = 730;
    gfx.fillStyle(0x4a3a28);
    gfx.fillRect(twRX, groundTop - twRH, twR, twRH);
    gfx.fillStyle(0x6a5a48);
    gfx.fillRect(twRX, groundTop - twRH, twR, 3);
    for (let i = 0; i < 7; i++) {
      const sy = groundTop - twRH + 20 + i * 36;
      gfx.fillStyle(0x2a1c10, 0.5);
      gfx.fillRect(twRX + 3, sy, twR - 6, 2);
    }
    gfx.fillStyle(0x6a5a48);
    gfx.fillRect(twRX - 4, groundTop - twRH - 6, twR + 8, 6);
    surf.fillStyle(0x8a7a68, 0.8);
    surf.fillRect(twRX - 3, groundTop - twRH - 6, twR + 6, 3);

    // Ruin arch left
    decor.fillStyle(0x3a2a1c, 0.4);
    decor.fillRect(100, groundTop - 80, 8, 80);
    decor.fillRect(130, groundTop - 80, 8, 80);
    decor.fillRect(100, groundTop - 90, 38, 10);

    // Ruin arch right
    decor.fillStyle(0x3a2a1c, 0.4);
    decor.fillRect(660, groundTop - 60, 6, 60);
    decor.fillRect(690, groundTop - 60, 6, 60);
    decor.fillRect(660, groundTop - 68, 36, 8);

    // Ground detail: grass edge shadow
    decor.fillStyle(0x3a5a2a, 0.2);
    for (let i = 0; i < 40; i++) {
      const gx = Math.random() * 800;
      decor.fillEllipse(gx, groundTop, 4 + Math.random() * 6, 2);
    }
  }

  renderFloatingPlatforms(platforms) {
    this.platformGfx.clear();
    this.platformSurf.clear();
    this.platformDecor.clear();

    const styles = [
      { edge: 0x8a7a68, base: 0x6b5a48, mid: 0x5a4a3a, dark: 0x3a2e24, crack: 0x4a3a2a },
      { edge: 0x7a8a78, base: 0x5a6a58, mid: 0x4a5a48, dark: 0x2a3a28, crack: 0x3a4a38 },
      { edge: 0x8a7a58, base: 0x6b5a38, mid: 0x5a4a28, dark: 0x3a2e18, crack: 0x4a3a20 },
      { edge: 0x7a6a68, base: 0x5a4a48, mid: 0x4a3a38, dark: 0x2a1e1c, crack: 0x3a2a28 },
      { edge: 0x8a7a68, base: 0x6b5a48, mid: 0x5a4a3a, dark: 0x3a2e24, crack: 0x4a3a2a },
      { edge: 0x7a7a68, base: 0x5a5a48, mid: 0x4a4a38, dark: 0x2a2a1c, crack: 0x3a3a28 },
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

      this.platformGfx.fillStyle(s.crack, 0.4);
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
        if (state.attacking && !prev.attacking) playSound('attack');
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

    if (this.stars && Math.random() < 0.05) {
      this.stars.clear();
      for (const s of this.starPositions) {
        const flicker = 0.3 + Math.sin(time * 0.002 * s.speed + s.x) * 0.3;
        this.stars.fillStyle(0xffffff, Math.max(0, flicker));
        this.stars.fillCircle(s.x, s.y, s.r);
      }
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
