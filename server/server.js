const WebSocket = require("ws");
const PlayerManager = require("./PlayerManager");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });
const playerManager = new PlayerManager();

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

wss.on("connection", (ws) => {
    const player = playerManager.addPlayer(ws);

    console.log(`Player connected: ${player.id}`);

    send(ws, { type: "CONNECTED", playerId: player.id });

    const existingPlayers = playerManager.getAllPlayers().filter(
        (p) => p.id !== player.id
    );
    if (existingPlayers.length > 0) {
        send(ws, {
            type: "PLAYER_LIST",
            players: existingPlayers.map((p) => ({
                id: p.id,
                x: p.x,
                y: p.y,
                damage: p.damage,
                stocks: p.stocks,
                facing: p.facing,
                shielding: p.shielding,
            })),
        });
    }

    broadcast(
        {
            type: "PLAYER_JOINED",
            player: {
                id: player.id,
                x: player.x,
                y: player.y,
                damage: player.damage,
                stocks: player.stocks,
                facing: player.facing,
                shielding: player.shielding,
            },
        },
        ws
    );

    ws.on("close", () => {
        const removedId = playerManager.removePlayer(ws);
        if (removedId) {
            console.log(`Player disconnected: ${removedId}`);
            broadcast({ type: "PLAYER_LEFT", playerId: removedId });
        }
    });

    ws.on("error", (err) => {
        console.error(`WebSocket error for player ${player.id}:`, err.message);
    });
});

console.log(`BroBrawl server running on port ${PORT}`);
