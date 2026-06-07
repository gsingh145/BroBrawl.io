const WebSocket = require("ws");
const { PlayerManager } = require("./PlayerManager");

const PORT = process.env.PORT || 8080;
const TICK_RATE = 50;
const GRAVITY = 0.6;
const FRICTION = 0.85;
const MOVE_SPEED = 4;
const JUMP_VELOCITY = -10;
const GROUND_Y = 450;
const BLAST_ZONE_Y = 600;
const PLAYER_W = 32;
const PLAYER_H = 48;

const ATTACK_ACTIVE = 4;
const SPECIAL_ACTIVE = 6;
const ATTACK_CD = 6;
const SPECIAL_CD = 12;
const ATTACK_DMG = 8;
const SPECIAL_DMG = 15;
const ATTACK_KNOCKBACK = 10;
const SPECIAL_KNOCKBACK = 18;

const wss = new WebSocket.Server({ port: PORT });
const pm = new PlayerManager();

function send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

function broadcast(data, excludeWs = null) {
    wss.clients.forEach((ws) => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
}

function rectsOverlap(a, b) {
    return (
        a.x < b.x + b.w && a.x + a.w > b.x &&
        a.y < b.y + b.h && a.y + a.h > b.y
    );
}

function playerInfo(p) {
    return { id: p.id, x: p.x, y: p.y, damage: p.damage, stocks: p.stocks, facing: p.facing, shielding: p.shielding };
}

/* ── Input handling ── */

function handleMessage(ws, raw) {
    const player = pm.getPlayerByWs(ws);
    if (!player) return;

    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
        case "move": {
            if (msg.dir === "left") { player.vx = -MOVE_SPEED; player.facing = -1; }
            else if (msg.dir === "right") { player.vx = MOVE_SPEED; player.facing = 1; }
            else { player.vx = 0; }
            break;
        }
        case "jump": {
            if (player.onGround) {
                player.vy = JUMP_VELOCITY;
                player.onGround = false;
            }
            break;
        }
        case "attack": {
            if (!player.attacking && player.attackCooldown <= 0 && !player.specialAttacking) {
                player.attacking = true;
                player.attackTimer = ATTACK_ACTIVE;
                player.attackCooldown = ATTACK_CD;
            }
            break;
        }
        case "specialAttack": {
            if (!player.specialAttacking && player.specialAttackCooldown <= 0 && !player.attacking) {
                player.specialAttacking = true;
                player.specialAttackTimer = SPECIAL_ACTIVE;
                player.specialAttackCooldown = SPECIAL_CD;
            }
            break;
        }
        case "shieldStart": {
            player.shielding = true;
            break;
        }
        case "shieldEnd": {
            player.shielding = false;
            break;
        }
    }
}

/* ── Physics ── */

function updatePlayer(p) {
    if (p.attackTimer > 0) p.attackTimer--;
    else p.attacking = false;
    if (p.specialAttackTimer > 0) p.specialAttackTimer--;
    else p.specialAttacking = false;
    if (p.attackCooldown > 0) p.attackCooldown--;
    if (p.specialAttackCooldown > 0) p.specialAttackCooldown--;

    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= FRICTION;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;

    if (p.y >= GROUND_Y) {
        p.y = GROUND_Y;
        p.vy = 0;
        p.onGround = true;
    } else {
        p.onGround = false;
    }

    if (p.y > BLAST_ZONE_Y) {
        p.stocks--;
        if (p.stocks > 0) {
            p.y = 100;
            p.x = 100 + Math.random() * 200;
            p.vy = 0;
            p.vx = 0;
            p.damage = 0;
            p.shielding = false;
            p.attacking = false;
            p.specialAttacking = false;
        }
    }
}

/* ── Combat ── */

function getHitbox(p) {
    const w = p.attacking ? 40 : 56;
    const h = p.attacking ? 28 : 36;
    const offsetX = p.facing === 1 ? PLAYER_W / 2 : -(w + PLAYER_W / 2);
    return { x: p.x + offsetX, y: p.y - h / 2, w, h };
}

function getBounds(p) {
    return { x: p.x - PLAYER_W / 2, y: p.y - PLAYER_H / 2, w: PLAYER_W, h: PLAYER_H };
}

function checkCombat() {
    const players = pm.getAllPlayers();
    for (const attacker of players) {
        if (!attacker.attacking && !attacker.specialAttacking) continue;
        const hitbox = getHitbox(attacker);
        const dmg = attacker.specialAttacking ? SPECIAL_DMG : ATTACK_DMG;
        const kbBase = attacker.specialAttacking ? SPECIAL_KNOCKBACK : ATTACK_KNOCKBACK;

        for (const target of players) {
            if (target.id === attacker.id) continue;
            const bounds = getBounds(target);
            if (!rectsOverlap(hitbox, bounds)) continue;

            const dir = target.x < attacker.x ? -1 : 1;
            const kb = kbBase + target.damage * 0.3;
            target.vx = dir * kb;
            target.vy = -8 - target.damage * 0.2;
            target.damage += dmg;
            target.attacking = false;
            target.specialAttacking = false;
        }
    }
}

/* ── Game loop ── */

function tick() {
    const players = pm.getAllPlayers();
    for (const p of players) {
        updatePlayer(p);
    }
    checkCombat();

    const state = pm.getAllPlayerStates();
    broadcast({ type: "GAME_STATE", players: state });
}

/* ── WebSocket ── */

wss.on("connection", (ws) => {
    const player = pm.addPlayer(ws);
    console.log(`Player connected: ${player.id}`);

    send(ws, { type: "CONNECTED", playerId: player.id });

    const existing = pm.getAllPlayers().filter((p) => p.id !== player.id);
    if (existing.length > 0) {
        send(ws, { type: "PLAYER_LIST", players: existing.map(playerInfo) });
    }

    broadcast({ type: "PLAYER_JOINED", player: playerInfo(player) }, ws);

    ws.on("message", (raw) => handleMessage(ws, raw));

    ws.on("close", () => {
        const rid = pm.removePlayer(ws);
        if (rid) {
            console.log(`Player disconnected: ${rid}`);
            broadcast({ type: "PLAYER_LEFT", playerId: rid });
        }
    });

    ws.on("error", (err) => {
        console.error(`WebSocket error: ${err.message}`);
    });
});

setInterval(tick, TICK_RATE);
console.log(`BroBrawl server running on port ${PORT} (${1000 / TICK_RATE}Hz)`);
