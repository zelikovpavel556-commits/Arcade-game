
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const grid = 18;
const count = 20;

let score = 0;
let highScore = localStorage.getItem('snake_high') || 0;
document.getElementById('high-score').innerText = highScore;

let snake = [{x: 10, y: 10}, {x: 10, y: 11}];
let food = {x: 5, y: 5};
let dx = 0, dy = -1;
let nextDx = 0, nextDy = -1;

document.addEventListener('keydown', e => {
    if ((e.key === 'ArrowUp' || e.key === 'w')) setDir(0, -1);
    if ((e.key === 'ArrowDown' || e.key === 's')) setDir(0, 1);
    if ((e.key === 'ArrowLeft' || e.key === 'a')) setDir(-1, 0);
    if ((e.key === 'ArrowRight' || e.key === 'd')) setDir(1, 0);
});

window.setDir = function(nx, ny) {
    if (nx !== 0 && dx === -nx) return;
    if (ny !== 0 && dy === -ny) return;
    nextDx = nx; nextDy = ny;
};

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * count),
        y: Math.floor(Math.random() * count)
    };
}

function gameLoop() {
    dx = nextDx; dy = nextDy;
    let head = {x: snake[0].x + dx, y: snake[0].y + dy};

    if (head.x < 0 || head.x >= count || head.y < 0 || head.y >= count) return resetGame();
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) return resetGame();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake_high', highScore);
            document.getElementById('high-score').innerText = highScore;
        }
        spawnFood(); // Спавнится ТОЛЬКО при съедении!
    } else {
        snake.pop();
    }

    render();
}

function resetGame() {
    score = 0;
    snake = [{x: 10, y: 10}, {x: 10, y: 11}];
    nextDx = 0; nextDy = -1;
    spawnFood();
}

function render() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * grid + grid/2, food.y * grid + grid/2, grid/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * grid + 1, segment.y * grid + 1, grid - 2, grid - 2);
    });

    document.getElementById('score').innerText = score;
}

setInterval(gameLoop, 120);
