// ===== Global variables for the current window =====
let socket = new WebSocket("ws://localhost:8080"); // create a websocket instance
let mySymbol = null; // holds user symbol
let gameActive = true; // holds game status
let currentPlayer = 'X'; // Currently active player (X or O)
let board = Array(9).fill(null); // Stores the current state of the game board

// Multiplayer code
const multiplayer = (status, boxes) => {
    socket.onopen = () => {
        status.textContent = 'Waiting for opponent...';
    };

    socket.onmessage = function (event) {
        let data = event.data;

        if (data === 'start:X') {
            mySymbol = 'X';
            currentPlayer = 'X';
            status.textContent = 'You are X. Your turn.';
            gameActive = true;
        } else if (data === 'start:O') {
            mySymbol = 'O';
            currentPlayer = 'X';
            status.textContent = 'You are O. Waiting for opponent\'s move.';
            gameActive = false;
        } else if (data === 'reset') { //zpracování zprávy o resetu hry
            for (const box of boxes) {
                box.classList.remove('circle', 'cross'); // Vymaže značky z políček
            }

            board = Array(9).fill(null); // Vyčistí herní pole
            currentPlayer = 'X'; // Vždy začíná X
            gameActive = (mySymbol === 'X'); // Pokud jsem X, můžu hrát

            // Nastaví zprávu podle hráče
            if (mySymbol === 'X') {
                status.textContent = 'New game started. You are X. Your turn.';
            } else {
                status.textContent = 'New game started. You are O. Waiting for opponent\'s move.';
            }
        } else if (!isNaN(data)) {
            const i = Number(data);
            if (!board[i]) {
                board[i] = (mySymbol === 'X') ? 'O' : 'X';
                boxes[i].classList.add(board[i] === 'X' ? 'cross' : 'circle');

                const winner = checkWinner();
                if (winner) {
                    status.textContent = `Winner: ${winner}`;
                    gameActive = false;
                    return;
                }
                if (checkDraw()) {
                    status.textContent = 'Draw!';
                    gameActive = false;
                    return;
                }

                currentPlayer = mySymbol;
                gameActive = true;
                status.textContent = `Your turn! ${mySymbol}`;
            }
        }
    };
};

// Check if someone has won
const checkWinner = () => {
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const combo of winCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
};

// Check if it is a draw
const checkDraw = () => {
    return board.every(cell => cell !== null);
};

// Main logic
document.addEventListener('DOMContentLoaded', () => {
    const status = document.querySelector('.status');
    const reset = document.querySelector('.reset');
    const boxes = document.getElementsByClassName('box');

    multiplayer(status, boxes);

    for (let i = 0; i < boxes.length; i++) {
        boxes[i].addEventListener('click', () => {
            if (!gameActive || board[i] || mySymbol !== currentPlayer) return;

            board[i] = currentPlayer;
            boxes[i].classList.add(currentPlayer === 'X' ? 'cross' : 'circle');
            socket.send(i);

            const winner = checkWinner();
            if (winner) {
                status.textContent = `Winner: ${winner}`;
                gameActive = false;
                return;
            }

            if (checkDraw()) {
                status.textContent = 'Draw!';
                gameActive = false;
                return;
            }

            status.textContent = `Waiting for opponent's move...`;
            gameActive = false;
        });
    }

    reset.addEventListener('click', () => {
        socket.send('reset'); //pošle na server zprávu o resetu hry
    });
});
