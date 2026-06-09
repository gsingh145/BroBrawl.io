const crypto = require("crypto");
const { SPAWN_POSITIONS } = require("./config");
const CHARACTERS = require("./characters");
const DEFAULT_CHAR = CHARACTERS.blade || Object.values(CHARACTERS)[0];

const BASE_STATE = {
    vx: 0, vy: 0, damage: 0, stocks: 3,
    facing: 1, shielding: false, attacking: false,
    attackDir: 'neutral', specialAttacking: false,
    onGround: false, canDoubleJump: false,
    attackTimer: 0, specialAttackTimer: 0,
    dashing: false, dashTimer: 0,
    attackCooldown: 0, specialAttackCooldown: 0,
    specialMeter: 0, shieldHealth: 100,
    specialMeterUsed: 0,
    specialAttackDir: 'neutral', platformDropTimer: 0,
    character: null,
    characterReady: false,
};

function copyState(player) {
    return {
        id: player.id,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        damage: player.damage,
        stocks: player.stocks,
        facing: player.facing,
        shielding: player.shielding,
        attacking: player.attacking,
        attackDir: player.attackDir,
        specialAttacking: player.specialAttacking,
        onGround: player.onGround,
        canDoubleJump: player.canDoubleJump,
        dashing: player.dashing,
        dashTimer: player.dashTimer,
        specialMeter: player.specialMeter,
        shieldHealth: player.shieldHealth,
        specialMeterUsed: player.specialMeterUsed,
        specialAttackDir: player.specialAttackDir,
        character: player.character,
    };
}

class PlayerManager {
    constructor() {
        this.players = new Map();
        this.wsToId = new Map();
        this.idToWs = new Map();
    }

    addPlayer(ws) {
        const id = crypto.randomUUID();
        const spawn = SPAWN_POSITIONS[this.players.size] || { x: 400, y: 100 };
        const player = {
            id,
            ...BASE_STATE,
            x: spawn.x,
            y: spawn.y,
            stocks: 3,
        };
        this.players.set(id, player);
        this.wsToId.set(ws, id);
        this.idToWs.set(id, ws);
        return player;
    }

    setCharacter(id, characterId) {
        const player = this.players.get(id);
        if (!player) return false;
        const ch = CHARACTERS[characterId];
        if (!ch) return false;
        player.character = characterId;
        player.stocks = ch.stocks || 3;
        return true;
    }

    allPlayersReady() {
        const players = this.getAllPlayers();
        return players.length >= 2 && players.every(p => p.character);
    }

    removePlayer(ws) {
        const id = this.wsToId.get(ws);
        if (!id) return null;
        this.players.delete(id);
        this.wsToId.delete(ws);
        this.idToWs.delete(id);
        return id;
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    getPlayerByWs(ws) {
        const id = this.wsToId.get(ws);
        if (!id) return null;
        return this.players.get(id);
    }

    getWs(id) {
        return this.idToWs.get(id);
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getAllPlayerStates() {
        return Array.from(this.players.values()).map(copyState);
    }

    getPlayerState(id) {
        const player = this.players.get(id);
        return player ? copyState(player) : null;
    }
}

module.exports = { PlayerManager, copyState };
