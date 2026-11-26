/* Farhaad Shakil - Tic Tac Toe */

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve files from public folder
app.use(express.static("public"));

const PASSWORD = "1234";

// Store the game
let game = {
    board: Array(9).fill(""),
    currentPlayer: "X",
    winner: null
};

// Store the two players
let players = {
    X: null,
    O: null
};

// Send game updates to everyone
function broadcast() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "state",
                game: game
            }));
        }
    });
}

// Check for a winner
function checkWinner() {
    const wins = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let [a, b, c] of wins) {
        if (game.board[a] &&
            game.board[a] === game.board[b] &&
            game.board[b] === game.board[c]) {
            return game.board[a];
        }
    }

    return null;
}

// When a browser connects
wss.on("connection", ws => {

    ws.role = "spectator";
    ws.loggedIn = false;

    // Send current board
    ws.send(JSON.stringify({
        type: "state",
        game: game
    }));

    // Receive messages
    ws.on("message", message => {
        let data;

        try {
            data = JSON.parse(message);
        } catch {
            return;
        }

        // Player login
        if (data.type === "login") {
            if (ws.loggedIn) return;

            if (data.password !== PASSWORD) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Wrong password"
                }));
                return;
            }

            ws.loggedIn = true;
            ws.name = String(data.name || "Guest").slice(0, 30);

            // Assign X, O, or spectator
            if (players.X === null) {
                players.X = ws;
                ws.role = "X";
            }
            else if (players.O === null) {
                players.O = ws;
                ws.role = "O";
            }

            ws.send(JSON.stringify({
                type: "role",
                role: ws.role,
                name: ws.name
            }));
        }

        // Player makes a move
        if (data.type === "move") {
            if (!ws.loggedIn) return;
            if (ws.role !== game.currentPlayer) return;
            if (game.winner) return;

            const i = data.index;

            // Check valid square
            if (!Number.isInteger(i) || i < 0 || i > 8) {
                return;
            }

            // Check empty square
            if (game.board[i] !== "") return;

            game.board[i] = ws.role;

            // Check winner
            game.winner = checkWinner();

            if (!game.winner) {
                // Check draw
                if (game.board.every(cell => cell !== "")) {
                    game.winner = "Draw";
                }
                else {
                    // Switch players
                    game.currentPlayer =
                        game.currentPlayer === "X" ? "O" : "X";
                }
            }

            broadcast();
        }

        // Reset game
        if (data.type === "reset") {
            if (!ws.loggedIn ||
                (ws.role !== "X" && ws.role !== "O")) {
                return;
            }

            game = {
                board: Array(9).fill(""),
                currentPlayer: "X",
                winner: null
            };

            broadcast();
        }
    });

    // When a player disconnects
    ws.on("close", () => {
        if (players.X === ws) {
            players.X = null;
        }

        if (players.O === ws) {
            players.O = null;
        }
    });
});


// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
