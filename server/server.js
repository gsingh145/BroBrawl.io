const WebSocket = require("ws");
const PlayerManager = require("./PlayerManager");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });
const playerManager = new PlayerManager();

wss.on("connection", (ws) => {
    const player = playerManager.addPlayer(ws);

    console.log(`Player connected: ${player.id}`);

    ws.send(JSON.stringify({
        type: "CONNECTED",
        playerId: player.id,
    }));

    ws.on("close", () => {
        const removedId = playerManager.removePlayer(ws);
        if (removedId) {
            console.log(`Player disconnected: ${removedId}`);
        }
    });

    ws.on("error", (err) => {
        console.error(`WebSocket error for player ${player.id}:`, err.message);
    });
});

console.log(`BroBrawl server running on port ${PORT}`);
