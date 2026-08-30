
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const FINISH_LINE = 2000;
let gameStarted = false;

let player = { name: 'Вы', x: 50, y: 80, speed: 0, color: '#38bdf8' };
let bots = [
    { name: 'Бот 1', x: 50, y: 150, speed: 3.2, color: '#ef4444' },
    { name: 'Бот 2', x: 50, y: 220, speed: 3.5, color: '#eab308' },
    { name: 'Бот 3', x: 50, y: 290, speed: 3.0, color: '#a855f7' }
];

const tapBtn = document.getElementById('tap-btn');

tapBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    gameStarted = true;
    player.speed += 1.8; // Каждый тач двигает персонажа!
});

function update() {
    if (!gameStarted) return;

    // Игрок движется вперед и испытывает трение
    player.x += player.speed;
    player.speed *= 0.88;

    // Боты бегут со своей скоростью
    bots.forEach(b => {
        b.x += b.speed + (Math.random() - 0.5) * 0.3;
    });

    // Проверка финиша
    if (player.x >= FINISH_LINE || bots.some(b => b.x >= FINISH_LINE)) {
        gameStarted = false;
        let winner = player.x >= FINISH_LINE ? 'ВЫ ПОБЕДИЛИ!' : 'Победил Бот!';
        setTimeout(() => {
            alert(winner);
            player.x = 50;
            bots.forEach(b => b.x = 50);
        }, 100);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Камера следит за игроком
    let camX = player.x - 100;
    ctx.save();
    ctx.translate(-camX, 0);

    // Дорожка и полосы
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(camX, 40, 1000, 280);

    for (let y = 115; y <= 255; y += 70) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(camX, y);
        ctx.lineTo(camX + 1000, y);
        ctx.stroke();
    }

    // Финишная черта
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(FINISH_LINE, 40, 15, 280);

    // Отрисовка Игрока
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, 25, 25);
    ctx.fillStyle = '#fff';
    ctx.fillText(player.name, player.x - 5, player.y - 8);

    // Отрисовка Ботов
    bots.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, 25, 25);
        ctx.fillStyle = '#fff';
        ctx.fillText(b.name, b.x - 5, b.y - 8);
    });

    ctx.restore();

    // Спидометр
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Прогресс: ${Math.min(100, Math.floor((player.x / FINISH_LINE) * 100))}%`, 20, 30);
}

setInterval(() => {
    update();
    render();
}, 1000 / 60);
