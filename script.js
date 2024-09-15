
const gridSize = 10;
let playerPosition = { x: 0, y: 0 };
let energy = 50;
let level = 1;
let currentScore = 0;
let highestScore = 0;
let grid = [];
let destination = { x: 0, y: 0 };
let currentUser = null;
let messageQueue = [];
let isDisplayingMessage = false;

const db = {
    getUser: (username) => {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return users[username];
    },
    saveUser: (username, data) => {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        users[username] = data;
        localStorage.setItem('users', JSON.stringify(users));
    }
};

function login() {
    const username = document.getElementById('username').value.trim();
    if (username) {
        currentUser = username;
        const userData = db.getUser(username) || { highestScore: 0 };
        highestScore = userData.highestScore;
        document.getElementById('highest-score').textContent = highestScore;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        initializeGame();
    }
}

function logout() {
    currentUser = null;
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('username').value = '';
}

function initializeGame() {
    grid = [];
    playerPosition = { x: 0, y: 0 };
    energy = Math.max(50 - (level - 1) * 5, 20);
    currentScore = level === 1 ? 0 : currentScore;

    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = 'empty';
        }
    }

    grid[playerPosition.y][playerPosition.x] = 'player';

    
    const minDistance = Math.min(5 + level, gridSize - 1);
    do {
        destination.x = Math.floor(Math.random() * gridSize);
        destination.y = Math.floor(Math.random() * gridSize);
    } while (
        destination.x === 0 && destination.y === 0 ||
        Math.abs(destination.x - playerPosition.x) + Math.abs(destination.y - playerPosition.y) < minDistance
    );
    grid[destination.y][destination.x] = 'destination';

    const numEnergyPacks = 5 + Math.floor(level * 1.5);
    const numTraps = 3 + Math.floor(level / 2);

    for (let i = 0; i < numEnergyPacks; i++) {
        placeItem('energy-pack');
    }

    for (let i = 0; i < numTraps; i++) {
        placeItem('trap');
    }

    updateDisplay();
}

function placeItem(item) {
    let x, y;
    do {
        x = Math.floor(Math.random() * gridSize);
        y = Math.floor(Math.random() * gridSize);
    } while (grid[y][x] !== 'empty');
    grid[y][x] = item;
}

function updateDisplay() {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (grid[i][j] === 'player') {
                cell.classList.add('player');
            } else if (grid[i][j] === 'destination') {
                cell.classList.add('destination');
            }
            gameGrid.appendChild(cell);
        }
    }

    document.getElementById('energy').textContent = energy;
    document.getElementById('level').textContent = level;
    document.getElementById('current-score').textContent = currentScore;
    document.getElementById('highest-score').textContent = highestScore;
}

function showMessage(message, duration = 2000) {
    messageQueue.push({ message, duration });
    if (!isDisplayingMessage) {
        displayNextMessage();
    }
}

function displayNextMessage() {
    if (messageQueue.length === 0) {
        isDisplayingMessage = false;
        return;
    }

    isDisplayingMessage = true;
    const { message, duration } = messageQueue.shift();
    
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translateX(-50%)';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    messageElement.style.color = 'white';
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.zIndex = '1000';
    document.body.appendChild(messageElement);

    setTimeout(() => {
        document.body.removeChild(messageElement);
        setTimeout(() => {
            displayNextMessage();
        }, 100); 
    }, duration);
}

function movePlayer(dx, dy) {
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;

    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        grid[playerPosition.y][playerPosition.x] = 'empty';
        playerPosition.x = newX;
        playerPosition.y = newY;

        switch (grid[newY][newX]) {
            case 'energy-pack':
                const energyGain = 10 + Math.floor(level / 2);
                energy += energyGain;
                currentScore += 10;
                showMessage(`Energy pack found! +${energyGain} energy`);
                showMessage(`+10 points`);
                break;
            case 'trap':
                const energyLoss = 20 + Math.floor(level / 2);
                energy -= energyLoss;
                currentScore = Math.max(0, currentScore - 5);
                showMessage(`Trap encountered! -${energyLoss} energy`);
                showMessage(`-5 points`);
                break;
            case 'destination':
                currentScore += 50 + (level * 10);
                showMessage(`Level ${level} completed!`);
                showMessage(`+${50 + (level * 10)} points`);
                level++;
                setTimeout(() => {
                    initializeGame();
                }, 2000);
                return;
        }

        grid[newY][newX] = 'player';
        energy -= 1;
        currentScore += 1;

        if (energy <= 0) {
            showMessage(`Game Over!`);
            showMessage(`Final Score: ${currentScore}`);
            if (currentScore > highestScore) {
                highestScore = currentScore;
                db.saveUser(currentUser, { highestScore });
                showMessage(`New Highest Score: ${highestScore}!`);
            }
            setTimeout(() => {
                level = 1;
                currentScore = 0;
                initializeGame();
            }, 2000);
            return;
        }

        updateDisplay();
    }
}

function restartGame() {
    level = 1;
    currentScore = 0;
    initializeGame();
}

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('logout').addEventListener('click', logout);
document.getElementById('up').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('down').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('left').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('right').addEventListener('click', () => movePlayer(1, 0));
document.getElementById('restart').addEventListener('click', restartGame);


window.onload = () => {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
};