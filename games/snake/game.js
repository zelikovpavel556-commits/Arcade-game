
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const grid = 20;
const count = 20;

let score = 0;
let highScore = localStorage.getItem('snake_high') || 0;
document.getElementById('high-score').innerText = highScore;

let snake = [{x: 10, y: 10}, {x: 10, y: 11}];
let food = {x: 5, y: 5};
let dx = 0, dy = -1;
let gameInterval;

let state = {
    coins: parseInt(localStorage.getItem('snake_coins')) || 0,
    snakeColor: 'green',
    foodColor: 'red',
    unlockedSnake: ['green'],
    unlockedFood: ['red']
};

const snakeSkins = [
    { id: 'green', name: 'Зеленый', color: '#22c55e', cost: 0 },
    { id: 'blue', name: 'Неоновый Синий', color: '#38bdf8', cost: 10 },
    { id: 'gold', name: 'Золотой', color: '#eab308', cost: 25 },
    { id: 'purple', name: 'Пурпурный', color: '#a855f7', cost: 50 },
    { id: 'red', name: 'Кибер-Красный', color: '#ef4444', cost: 100 }
];

const foodSkins = [
    { id: 'red', name: 'Яблоко', color: '#ef4444', cost: 0 },
    { id: 'gold', name: 'Золотое Яблоко', color: '#eab308', cost: 15 },
    { id: 'emerald', name: 'Изумруд', color: '#10b981', cost: 30 },
    { id: 'violet', name: 'Аметист', color: '#8b5cf6', cost: 60 },
    { id: 'diamond', name: 'Алмаз', color: '#06b6d4', cost: 120 }
];

document.addEventListener('keydown', e => {
    if ((e.key === 'ArrowUp' || e.key === 'w') && dy === 0) { dx = 0; dy = -1; }
    if ((e.key === 'ArrowDown' || e.key === 's') && dy === 0) { dx = 0; dy = 1; }
    if ((e.key === 'ArrowLeft' || e.key === 'a') && dx === 0) { dx = -1; dy = 0; }
    if ((e.key === 'ArrowRight' || e.key === 'd') && dx === 0) { dx = 1; dy = 0; }
});

function gameLoop() {
    let head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // Столкновение со стеной
    if (head.x < 0 || head.x >= count || head.y < 0 || head.y >= count) {
        return resetGame();
    }

    // Столкновение с хвостом
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return resetGame();
        }
    }

    snake.unshift(head);

    // Съели яблоко
    if (head.x === food.x && head.y === food.y) {
        score++;
        state.coins++;
        localStorage.setItem('snake_coins', state.coins);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake_high', highScore);
            document.getElementById('high-score').innerText = highScore;
        }
        spawnFood();
    } else {
        snake.pop();
    }

    render();
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * count),
        y: Math.floor(Math.random() * count)
    };
}

function resetGame() {
    score = 0;
    snake = [{x: 10, y: 10}, {x: 10, y: 11}];
    dx = 0; dy = -1;
    spawnFood();
}

function render() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем Еду
    let fColor = (foodSkins.find(s => s.id === state.foodColor) || foodSkins[0]).color;
    ctx.fillStyle = fColor;
    ctx.beginPath();
    ctx.arc(food.x * grid + grid/2, food.y * grid + grid/2, grid/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Рисуем Змейку
    let sColor = (snakeSkins.find(s => s.id === state.snakeColor) || snakeSkins[0]).color;
    ctx.fillStyle = sColor;
    snake.forEach((segment, index) => {
        ctx.fillRect(segment.x * grid + 1, segment.y * grid + 1, grid - 2, grid - 2);
    });

    document.getElementById('score').innerText = score;
    renderShop();
}

function renderShop() {
    const sContainer = document.getElementById('snake-skins');
    sContainer.innerHTML = '';
    snakeSkins.forEach(s => {
        let bought = state.unlockedSnake.includes(s.id);
        let active = state.snakeColor === s.id;
        sContainer.innerHTML += `
            <div class="shop-item">
                <span style="color:${s.color}">${s.name}</span>
                <button class="btn-buy" ${!bought && state.coins < s.cost ? 'disabled' : ''} onclick="buySnake('${s.id}')">
                    ${active ? 'ВЫБРАНО' : (bought ? 'НАДЕТЬ' : s.cost + ' 🪙')}
                </button>
            </div>
        `;
    });

    const fContainer = document.getElementById('food-skins');
    fContainer.innerHTML = '';
    foodSkins.forEach(f => {
        let bought = state.unlockedFood.includes(f.id);
        let active = state.foodColor === f.id;
        fContainer.innerHTML += `
            <div class="shop-item">
                <span style="color:${f.color}">${f.name}</span>
                <button class="btn-buy" ${!bought && state.coins < f.cost ? 'disabled' : ''} onclick="buyFood('${f.id}')">
                    ${active ? 'ВЫБРАНО' : (bought ? 'НАДЕТЬ' : f.cost + ' 🪙')}
                </button>
            </div>
        `;
    });
}

window.buySnake = function(id) {
    let item = snakeSkins.find(s => s.id === id);
    if (!state.unlockedSnake.includes(id) && state.coins >= item.cost) {
        state.coins -= item.cost;
        state.unlockedSnake.push(id);
    }
    if (state.unlockedSnake.includes(id)) {
        state.snakeColor = id;
    }
    renderShop();
};

window.buyFood = function(id) {
    let item = foodSkins.find(f => f.id === id);
    if (!state.unlockedFood.includes(id) && state.coins >= item.cost) {
        state.coins -= item.cost;
        state.unlockedFood.push(id);
    }
    if (state.unlockedFood.includes(id)) {
        state.foodColor = id;
    }
    renderShop();
};

gameInterval = setInterval(gameLoop, 100);
