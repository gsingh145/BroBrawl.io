const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { PlayerManager } = require("./PlayerManager");
const C = require("./config");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    function json(data, code = 200) {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
    }

    /* ── Config API ── */
    if (req.url === "/api/config" && req.method === "GET") {
        return json(C);
    }
    if (req.url === "/api/config" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                const updates = JSON.parse(body);
                for (const [key, value] of Object.entries(updates)) {
                    if (key in C) {
                        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                            Object.assign(C[key], value);
                        } else {
                            C[key] = value;
                        }
                    }
                }
                return json({ ok: true });
            } catch {
                return json({ error: "Bad request" }, 400);
            }
        });
        return;
    }

    /* ── Static files ── */
    const filePath = req.url === "/" ? "/index.html" : req.url;
    const fullPath = path.join(__dirname, "public", filePath);
    if (!fullPath.startsWith(path.join(__dirname, "public"))) {
        res.writeHead(403);
        res.end();
        return;
    }
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found");
            return;
        }
        const ext = path.extname(fullPath);
        const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
        res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });
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
            if (player.dashing) break;
            if (msg.dir === "left") { player.vx = -C.MOVE_SPEED; player.facing = -1; }
            else if (msg.dir === "right") { player.vx = C.MOVE_SPEED; player.facing = 1; }
            else { player.vx = 0; }
            break;
        }
        case "jump": {
            if (player.onGround) {
                player.vy = C.JUMP_VELOCITY;
                player.onGround = false;
                player.canDoubleJump = true;
            } else if (player.canDoubleJump) {
                player.vy = C.JUMP_VELOCITY;
                player.canDoubleJump = false;
            }
            break;
        }
        case "fastFall": {
            if (!player.onGround) {
                player.vy = Math.min(C.MAX_FALL_SPEED, player.vy + C.FAST_FALL_BOOST);
            }
            break;
        }
        case "attack": {
            if (!player.attacking && player.attackCooldown <= 0 && !player.specialAttacking) {
                const dir = msg.dir || 'neutral';
                const cfg = C.ATTACK_DIRS[dir];
                if (!cfg) break;
                player.attacking = true;
                player.attackDir = dir;
                player.attackTimer = cfg.active;
                player.attackCooldown = cfg.cd;
            }
            break;
        }
        case "specialAttack": {
            if (player.specialMeter >= C.SPECIAL.maxMeter && !player.specialAttacking && !player.attacking) {
                player.specialMeter = 0;
                player.specialAttacking = true;
                player.specialAttackTimer = C.SPECIAL.active;
                player.specialAttackCooldown = C.SPECIAL.cd;
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
        case "dash": {
            if (!player.dashing && player.onGround) {
                const dashDir = msg.dir;
                player.vx = dashDir * C.DASH_SPEED;
                player.facing = dashDir;
                player.dashing = true;
                player.dashTimer = C.DASH_DURATION;
            }
            break;
        }
    }
}

/* ── Physics ── */

function die(p) {
    p.stocks--;
    if (p.stocks > 0) {
        p.x = 300 + Math.random() * 200;
        p.y = 100;
        p.vy = 0;
        p.vx = 0;
        p.damage = 0;
        p.shielding = false;
        p.attacking = false;
        p.specialAttacking = false;
        p.dashing = false;
        p.dashTimer = 0;
        p.specialMeter = 0;
        p.shieldHealth = C.SHIELD.maxHealth;
    }
}

function updatePlayer(p) {
    if (p.attackTimer > 0) p.attackTimer--;
    else p.attacking = false;
    if (p.specialAttackTimer > 0) p.specialAttackTimer--;
    else p.specialAttacking = false;
    if (p.attackCooldown > 0) p.attackCooldown--;
    if (p.specialAttackCooldown > 0) p.specialAttackCooldown--;
    if (p.dashTimer > 0) {
        p.dashTimer--;
        if (p.dashTimer <= 0) p.dashing = false;
    }

    if (p.shielding) {
        p.shieldHealth = Math.max(0, p.shieldHealth - C.SHIELD.drainRate);
    }

    const prevY = p.y;
    p.vy += C.GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= C.FRICTION;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;

    p.onGround = false;
    const playerBottom = p.y + C.PLAYER_H / 2;
    const playerLeft = p.x - C.PLAYER_W / 2;
    const playerRight = p.x + C.PLAYER_W / 2;
    const prevBottom = prevY + C.PLAYER_H / 2;

    for (const plat of C.PLATFORMS) {
        if (p.vy >= 0 && prevBottom <= plat.surfaceY && playerBottom >= plat.surfaceY
            && playerRight > plat.left && playerLeft < plat.right) {
            p.y = plat.surfaceY - C.PLAYER_H / 2;
            p.vy = 0;
            p.onGround = true;
            p.canDoubleJump = true;
            break;
        }
    }

    if (p.x < C.BLAST_ZONE_LEFT || p.x > C.BLAST_ZONE_RIGHT) {
        die(p);
    } else if (p.y > C.BLAST_ZONE_BOTTOM) {
        die(p);
    } else if (p.y < C.BLAST_ZONE_TOP) {
        die(p);
    }
}

/* ── Combat ── */

function getAttackHitbox(p, dir) {
    const cfg = C.ATTACK_DIRS[dir] || C.ATTACK_DIRS.neutral;
    const f = p.facing;
    switch (dir) {
        case 'up': {
            return { x: p.x - cfg.w / 2, y: p.y - 42, w: cfg.w, h: cfg.h };
        }
        case 'down': {
            const x = f === 1 ? p.x + 16 : p.x - 16 - cfg.w;
            return { x, y: p.y + 12, w: cfg.w, h: cfg.h };
        }
        default: {
            const x = f === 1 ? p.x + 16 : p.x - 16 - cfg.w;
            return { x, y: p.y - cfg.h / 2, w: cfg.w, h: cfg.h };
        }
    }
}

function getSpecialHitbox(p) {
    const w = C.SPECIAL.w;
    const h = C.SPECIAL.h;
    const x = p.facing === 1 ? p.x + 16 : p.x - 16 - w;
    return { x, y: p.y - h / 2, w, h };
}

function getBounds(p) {
    return { x: p.x - C.PLAYER_W / 2, y: p.y - C.PLAYER_H / 2, w: C.PLAYER_W, h: C.PLAYER_H };
}

function checkCombat() {
    const players = pm.getAllPlayers();
    for (const attacker of players) {
        if (!attacker.attacking && !attacker.specialAttacking) continue;

        const isSpecial = attacker.specialAttacking;
        const hitbox = isSpecial ? getSpecialHitbox(attacker) : getAttackHitbox(attacker, attacker.attackDir);
        const cfg = isSpecial ? C.SPECIAL : (C.ATTACK_DIRS[attacker.attackDir] || C.ATTACK_DIRS.neutral);
        const dmg = cfg.dmg;
        const kbBase = cfg.kb;

        for (const target of players) {
            if (target.id === attacker.id) continue;
            const bounds = getBounds(target);
            if (!rectsOverlap(hitbox, bounds)) continue;

            const dir = target.x < attacker.x ? -1 : 1;
            const kb = kbBase + target.damage * 0.3;
            target.vx = dir * kb;
            target.vy = -8 - target.damage * 0.2;
            if (target.shielding && target.shieldHealth > 0) {
                const ratio = target.shieldHealth / C.SHIELD.maxHealth;
                const mult = C.SHIELD.baseReduction + (1 - C.SHIELD.baseReduction) * (1 - ratio);
                const absorbed = Math.floor(dmg * (1 - mult));
                target.shieldHealth = Math.max(0, target.shieldHealth - absorbed);
                target.damage += Math.floor(dmg * mult);
            } else {
                target.damage += dmg;
            }
            target.attacking = false;
            target.specialAttacking = false;

            if (!isSpecial) {
                attacker.specialMeter = Math.min(C.SPECIAL.maxMeter, attacker.specialMeter + Math.floor(dmg * C.SPECIAL.meterGainMult));
            }
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

server.listen(PORT, () => {
    console.log(`BroBrawl server running on http://0.0.0.0:${PORT} (${1000 / C.TICK_RATE}Hz)`);
    console.log(`Connect from another device: http://<YOUR_IP>:${PORT}`);
});

setInterval(tick, C.TICK_RATE);
