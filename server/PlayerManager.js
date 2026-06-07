const crypto = require("crypto");

const DEFAULT_PLAYER_STATE = {
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    damage: 0,
    stocks: 3,
    facing: 1,
    shielding: false,
};

class PlayerManager {
    constructor() {
        this.players = new Map();
        this.wsToId = new Map();
        this.idToWs = new Map();
    }

    addPlayer(ws) {
        const id = crypto.randomUUID();
        const player = {
            id,
            ...DEFAULT_PLAYER_STATE,
        };
        this.players.set(id, player);
        this.wsToId.set(ws, id);
        this.idToWs.set(id, ws);
        return player;
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
}

module.exports = PlayerManager;
