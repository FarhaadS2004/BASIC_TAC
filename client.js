/* Farhaad Shakil - Tic Tac Toe */

// Get HTML elements
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");
const roleText = document.getElementById("role");

const joinBtn = document.getElementById("joinBtn");
const resetBtn = document.getElementById("resetBtn");

const nameInput = document.getElementById("nameInput");
const passwordInput = document.getElementById("passwordInput");

// Connect to the server
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(protocol + "//" + location.host);

// Game information
let game = {
    board: Array(9).fill(""),
    currentPlayer: "X",
    winner: null
};

let role = "spectator";

// Draw the board
function drawBoard() {

    // Clear canvas
    ctx.clearRect(0, 0, 600, 600);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    // Draw grid
    ctx.beginPath();

    // Vertical lines
    ctx.moveTo(200, 0);
    ctx.lineTo(200, 600);

    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);

    // Horizontal lines
    ctx.moveTo(0, 200);
    ctx.lineTo(600, 200);

    ctx.moveTo(0, 400);
    ctx.lineTo(600, 400);

    ctx.stroke();

    // Draw X and O
    for (let i = 0; i < 9; i++) {

        let value = game.board[i];

        let x = (i % 3) * 200;
        let y = Math.floor(i / 3) * 200;

        // Draw X
        if (value === "X") {
            ctx.beginPath();

            ctx.moveTo(x + 30, y + 30);
            ctx.lineTo(x + 170, y + 170);

            ctx.moveTo(x + 170, y + 30);
            ctx.lineTo(x + 30, y + 170);

            ctx.stroke();
        }

        // Draw O
        if (value === "O") {
            ctx.beginPath();

            ctx.arc(
                x + 100,
                y + 100,
                70,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }

    // Display winner or current turn
    if (game.winner === "Draw") {
        statusText.textContent = "Draw!";
    }
    else if (game.winner) {
        statusText.textContent = "Winner: " + game.winner;
    }
    else {
        statusText.textContent = "Turn: " + game.currentPlayer;
    }
}

// Player clicks a square
canvas.addEventListener("click", function(event) {

    // Only current player can move
    if (role !== game.currentPlayer || game.winner) {
        return;
    }

    // Find mouse position
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) *
              (canvas.width / rect.width);

    const y = (event.clientY - rect.top) *
              (canvas.height / rect.height);

    // Find row and column
    const col = Math.floor(x / 200);
    const row = Math.floor(y / 200);

    const index = row * 3 + col;

    // Check that square is valid and empty
    if (index < 0 || index > 8) return;
    if (game.board[index] !== "") return;

    // Send move to server
    ws.send(JSON.stringify({
        type: "move",
        index: index
    }));
});

// Receive messages from server
ws.onmessage = function(event) {

    const data = JSON.parse(event.data);

    // Update game board
    if (data.type === "state") {
        game = data.game;
        drawBoard();
    }

    // Show player role
    if (data.type === "role") {
        role = data.role;

        roleText.textContent =
            "Logged in as " + data.name + " (" + role + ")";
    }

    // Display errors
    if (data.type === "error") {
        alert(data.message);
    }
};

// Join game button
joinBtn.onclick = function() {

    ws.send(JSON.stringify({
        type: "login",
        name: nameInput.value,
        password: passwordInput.value
    }));
};

// Reset game button
resetBtn.onclick = function() {

    ws.send(JSON.stringify({
        type: "reset"
    }));
};

// Draw empty board when page loads
drawBoard();
