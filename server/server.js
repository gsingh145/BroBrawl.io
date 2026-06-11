const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { PlayerManager } = require("./PlayerManager");
const C = require("./config");
const CHARACTERS = require("./characters");

const CONFIG_STATE_PATH = path.join(__dirname, "config-state.json");
const CHAR_STATE_PATH = path.join(__dirname, "characters-state.json");

function deepMerge(target, source) {
    for (const [key, value] of Object.entries(source)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value) && typeof target[key] === "object" && !Array.isArray(target[key])) {
            deepMerge(target[key], value);
        } else {
            target[key] = value;
        }
    }
}

try {
    if (fs.existsSync(CONFIG_STATE_PATH)) {
        const saved = JSON.parse(fs.readFileSync(CONFIG_STATE_PATH, "utf-8"));
        deepMerge(C, saved);
        console.log("Loaded saved config from config-state.json");
    }
} catch (e) {
    console.warn("Could not load config-state.json, using defaults:", e.message);
}

try {
    if (fs.existsSync(CHAR_STATE_PATH)) {
        const saved = JSON.parse(fs.readFileSync(CHAR_STATE_PATH, "utf-8"));
        deepMerge(CHARACTERS, saved);
        console.log("Loaded saved character config from characters-state.json");
    }
} catch (e) {
    console.warn("Could not load characters-state.json:", e.message);
}

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
                            for (const [k, v] of Object.entries(value)) {
                                if (C[key] && typeof C[key] === "object" && typeof v === "number" && !isNaN(v)) {
                                    C[key][k] = v;
                                }
                            }
                        } else if (typeof value === "number" && !isNaN(value)) {
                            C[key] = value;
                        }
                    }
                }
                try {
                    fs.writeFileSync(CONFIG_STATE_PATH, JSON.stringify(C, null, 2));
                } catch (e) {
                    console.warn("Could not save config-state.json:", e.message);
                }
                return json({ ok: true });
            } catch {
                return json({ error: "Bad request" }, 400);
            }
        });
        return;
    }

    /* ── Characters API ── */
    if (req.url === "/api/characters" && req.method === "GET") {
        return json(CHARACTERS);
    }
    if (req.url === "/api/characters" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                const updates = JSON.parse(body);
                deepMerge(CHARACTERS, updates);
                try {
                    fs.writeFileSync(CHAR_STATE_PATH, JSON.stringify(CHARACTERS, null, 2));
                } catch (e) {
                    console.warn("Could not save characters-state.json:", e.message);
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
        const headers = { "Content-Type": types[ext] || "text/plain" };
        if (ext === ".html") {
            headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        } else if (ext === ".js" || ext === ".css") {
            headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        }
        res.writeHead(200, headers);
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
            const ms = getCharStats(player).moveSpeed;
            if (msg.dir === "left") { player.vx = -ms; player.facing = -1; }
            else if (msg.dir === "right") { player.vx = ms; player.facing = 1; }
            else { player.vx = 0; }
            break;
        }
        case "jump": {
            const jv = Math.min(getCharStats(player).jumpVelocity, C.MIN_JUMP_VELOCITY);
            if (player.onGround) {
                player.vy = jv;
                player.onGround = false;
                player.canDoubleJump = true;
            } else if (player.canDoubleJump) {
                player.vy = jv;
                player.canDoubleJump = false;
            }
            break;
        }
        case "fastFall": {
            if (!player.onGround) {
                const s = getCharStats(player);
                player.vy = Math.min(s.maxFallSpeed, player.vy + s.fastFallBoost);
            }
            break;
        }
        case "platformDrop": {
            if (player.onGround) {
                player.platformDropTimer = 12;
                player.vy = 3;
            }
            break;
        }
        case "attack": {
            if (!player.attacking && player.attackCooldown <= 0 && !player.specialAttacking) {
                const dir = msg.dir || 'neutral';
                const stats = getCharStats(player);
                const cfg = stats.attacks[dir];
                if (!cfg) break;
                player.attacking = true;
                player.attackDir = dir;
                player.attackStartup = cfg.startup;
                player.attackActiveTimer = cfg.active;
                player.attackCooldown = cfg.cd;
                if (cfg.lunge) {
                    player.vx = player.facing * cfg.lunge;
                    player.attackLunge = player.facing * cfg.lunge;
                }
                if (cfg.spawnsProjectile) {
                    spawnProjectile(player, cfg);
                }
                // Up+attack in air gives extra jump (once per airtime)
                if (dir === 'up' && !player.onGround && !player.usedAirAttackJump) {
                    const jv = Math.min(getCharStats(player).jumpVelocity, C.MIN_JUMP_VELOCITY);
                    player.vy = jv;
                    player.canDoubleJump = true;
                    player.usedAirAttackJump = true;
                }
            }
            break;
        }
        case "specialAttack": {
            if (!player.specialAttacking && !player.attacking) {
                const dir = msg.dir || 'neutral';
                const stats = getCharStats(player);
                const scfg = stats.specials[dir];
                if (!scfg) break;
                const sm = getCharStats(player).specialMeter;
                const drain = Math.min(sm.meterDrain, player.specialMeter);
                player.specialMeterUsed = player.specialMeter;
                player.specialMeter -= drain;
                player.specialAttacking = true;
                player.specialAttackDir = dir;
                player.specialAttackStartup = scfg.startup;
                player.specialAttackActiveTimer = scfg.active;
                player.specialAttackCooldown = scfg.cd;
                if (scfg.spawnsProjectile) {
                    spawnProjectile(player, scfg);
                }
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
            if (!player.dashing) {
                const s = getCharStats(player);
                const dashDir = msg.dir;
                player.vx = dashDir * s.dashSpeed;
                player.facing = dashDir;
                player.dashing = true;
                player.dashTimer = s.dashDuration;
            }
            break;
        }
        case "selectCharacter": {
            if (!msg.character) break;
            const ok = pm.setCharacter(player.id, msg.character);
            if (ok) {
                console.log(`Player ${player.id} chose ${msg.character}`);
                broadcast({ type: "PLAYER_SELECTED", playerId: player.id, character: msg.character }, ws);
                if (pm.allPlayersReady()) {
                    const allPlayers = pm.getAllPlayers();
                    const info = allPlayers.map(p => ({ id: p.id, character: p.character, x: p.x, y: p.y }));
                    const battleTrack = Math.floor(Math.random() * 5); // 5 battle tracks
                    broadcast({ type: "GAME_START", players: info, battleTrack });
                    console.log("All players ready - game starting");
                }
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
        p.specialMeterUsed = 0;
        p.platformDropTimer = 0;
    }
}

function getCharStats(p) {
    return CHARACTERS[p.character] || CHARACTERS.sensei_waisas;
}

function updatePlayer(p) {
    if (p.attacking) {
        if (p.attackStartup > 0) {
            p.attackStartup--;
        } else if (p.attackActiveTimer > 0) {
            p.attackActiveTimer--;
            if (p.attackActiveTimer <= 0) p.attacking = false;
        }
    }
    if (p.specialAttacking) {
        if (p.specialAttackStartup > 0) {
            p.specialAttackStartup--;
        } else if (p.specialAttackActiveTimer > 0) {
            p.specialAttackActiveTimer--;
            if (p.specialAttackActiveTimer <= 0) p.specialAttacking = false;
        }
    }
    if (p.attackCooldown > 0) p.attackCooldown--;
    if (p.specialAttackCooldown > 0) p.specialAttackCooldown--;
    if (p.dashTimer > 0) {
        p.dashTimer--;
        if (p.dashTimer <= 0) p.dashing = false;
    }

    if (p.shielding) {
        p.shieldHealth = Math.max(0, p.shieldHealth - C.SHIELD.drainRate);
    }

    if (p.platformDropTimer > 0) p.platformDropTimer--;

    const stats = getCharStats(p);
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
        if (p.platformDropTimer > 0 && plat.surfaceY !== C.PLATFORMS[0].surfaceY) continue;
        if (p.vy >= 0 && prevBottom <= plat.surfaceY && playerBottom >= plat.surfaceY
            && playerRight > plat.left && playerLeft < plat.right) {
            p.y = plat.surfaceY - C.PLAYER_H / 2;
            p.vy = 0;
            p.onGround = true;
            p.canDoubleJump = true;
            p.usedAirAttackJump = false;
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

function getAttackHitbox(p, dir, cfg) {
    if (!cfg) return { x: 0, y: 0, w: 0, h: 0 };
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

function getBounds(p) {
    return { x: p.x - C.PLAYER_W / 2, y: p.y - C.PLAYER_H / 2, w: C.PLAYER_W, h: C.PLAYER_H };
}

function checkCombat() {
    const players = pm.getAllPlayers();
    for (const attacker of players) {
        const atkReady = attacker.attacking && attacker.attackStartup <= 0 && attacker.attackActiveTimer > 0;
        const spAtkReady = attacker.specialAttacking && attacker.specialAttackStartup <= 0 && attacker.specialAttackActiveTimer > 0;
        if (!atkReady && !spAtkReady) continue;

        const isSpecial = attacker.specialAttacking;
        const sDir = isSpecial ? attacker.specialAttackDir : attacker.attackDir;
        const atkStats = getCharStats(attacker);
        const cfg = isSpecial
            ? (atkStats.specials[sDir] || atkStats.specials.neutral)
            : (atkStats.attacks[sDir] || atkStats.attacks.neutral);
        const hitbox = getAttackHitbox(attacker, sDir, cfg);
        const atkSM = atkStats.specialMeter || { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 };
        const rawRatio = isSpecial ? (attacker.specialMeterUsed / atkSM.maxMeter) : 1;
        const tier = isSpecial ? Math.max(1, Math.ceil(rawRatio / 0.25)) : 4;
        const meterRatio = Math.min(1, tier * 0.25);
        const rawDmg = Math.max(1, Math.floor(cfg.dmg * meterRatio));
        const kbBase = Math.max(1, Math.floor(cfg.kb * meterRatio));

        for (const target of players) {
            if (target.id === attacker.id) continue;
            const bounds = getBounds(target);
            if (!rectsOverlap(hitbox, bounds)) continue;
            const defStats = getCharStats(target);

            const dmg = Math.max(1, Math.floor(rawDmg * atkStats.dmgDealtMult * defStats.dmgTakenMult));
            const dir = target.x < attacker.x ? -1 : 1;
            let kb = (kbBase + target.damage * 0.3) * defStats.weight;

            if ((target.attacking || target.specialAttacking)) {
                const defCfg = target.specialAttacking
                    ? (getCharStats(target).specials[target.specialAttackDir] || getCharStats(target).specials.neutral)
                    : (getCharStats(target).attacks[target.attackDir] || getCharStats(target).attacks.neutral);
                if (defCfg && defCfg.armor) {
                    kb *= 0.5;
                }
            }

            target.vx = dir * kb;
            target.vy = (-8 - target.damage * 0.2) * defStats.weight;
            if (target.shielding && target.shieldHealth > 0) {
                const absorbed = Math.min(dmg, target.shieldHealth);
                target.shieldHealth -= absorbed;
                // No damage goes through
            } else {
                target.damage += dmg;
            }
            target.attacking = false;
            target.specialAttacking = false;

            const defStatsForMeter = getCharStats(target);
            const defSM = defStatsForMeter.specialMeter || { maxMeter: 100, meterGainMult: 1.0, meterDamageTakenMult: 0.33, meterDrain: 25 };
            const meterGain = Math.floor(dmg * (isSpecial ? 0 : atkSM.meterGainMult));
            attacker.specialMeter = Math.min(atkSM.maxMeter, attacker.specialMeter + meterGain);
            const takenGain = Math.floor(dmg * defSM.meterDamageTakenMult);
            target.specialMeter = Math.min(defSM.maxMeter, target.specialMeter + takenGain);
        }
    }
}

/* ── Projectiles ── */

let projectileIdCounter = 0;
let projectiles = [];

function spawnProjectile(owner, cfg) {
    projectiles.push({
        id: ++projectileIdCounter,
        x: owner.x + owner.facing * 20,
        y: owner.y - 4,
        vx: (cfg.projectileVx || 5) * owner.facing,
        vy: 0,
        w: cfg.projectileW || 16,
        h: cfg.projectileH || 12,
        dmg: cfg.projectileDmg || 5,
        kb: cfg.projectileKb || 8,
        lifetime: cfg.projectileLifetime || 40,
        ownerId: owner.id,
    });
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.lifetime--;
        if (proj.lifetime <= 0) {
            projectiles.splice(i, 1);
            continue;
        }
        const players = pm.getAllPlayers();
        for (const target of players) {
            if (target.id === proj.ownerId) continue;
            const bounds = getBounds(target);
            const projBounds = { x: proj.x - proj.w / 2, y: proj.y - proj.h / 2, w: proj.w, h: proj.h };
            if (rectsOverlap(projBounds, bounds)) {
                target.damage += proj.dmg;
                const dir = target.x < proj.x ? -1 : 1;
                target.vx = dir * proj.kb;
                target.vy = -6;
                projectiles.splice(i, 1);
                break;
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
    updateProjectiles();

    const state = pm.getAllPlayerStates();
    broadcast({ type: "GAME_STATE", players: state, projectiles: projectiles.map(p => ({ id: p.id, x: p.x, y: p.y, w: p.w, h: p.h })), platforms: C.PLATFORMS });
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

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (${1000 / C.TICK_RATE}Hz)`);
});

setInterval(tick, C.TICK_RATE);
