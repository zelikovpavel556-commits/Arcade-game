
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const TRACK_LENGTH = 1000; // Дистанция 1000м
let gameActive = false;
let winner = null;

// Игрок и 3 бота
let runners = [
    { id: 0, name: 'Вы (Игрок)', pos: 0, speed: 0, color: '#38bdf8', lane: 1, isPlayer: true },
    { id: 1, name: 'Бот Альфа', pos: 0, speed: 0, color: '#ef4444', lane: 2, baseSpeed: 0.18 },
    { id: 2, name: 'Бот Бета', pos: 0, speed: 0, color: '#eab308', lane: 3, baseSpeed: 0.20 },
    { id: 3, name: 'Бот Гамма', pos: 0, speed: 0, color: '#a855f7', lane: 4, baseSpeed: 0.19 }
];

let turboCharge = 0;
const runBtn = document.getElementById('run-trigger');
const turboBtn = document.getElementById('turbo-trigger');

// МУЛЬТИТАЧ ОБРАБОТКА (Pointer Events поддерживает одновременно несколько пальцев)
function registerTap(e) {
    e.preventDefault();
    if (!gameActive && !winner) gameActive = true;
    if (winner) return;

    let player = runners[0];
    player.speed += 0.08; // Добавка к скорости за каждый клик/тач
    if (player.speed > 0.45) player.speed = 0.45; // Макс скорость от кликов

    turboCharge = Math.min(100, turboCharge + 3);
    if (turboCharge >= 100) turboBtn.disabled = false;
}

runBtn.addEventListener('pointerdown', registerTap);

// Для клавиатуры (Пробел)
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        registerTap(e);
    }
});

turboBtn.addEventListener('click', () => {
    if (turboCharge >= 100) {
        runners[0].speed += 0.35;
        turboCharge = 0;
        turboBtn.disabled = true;
    }
});

function update() {
    if (!gameActive || winner) return;

    runners.forEach(r => {
        if (!r.isPlayer) {
            // ИИ ботов с небольшим флуктуатором скорости
            r.speed += (r.baseSpeed + (Math.random() - 0.5) * 0.04 - r.speed) * 0.1;
        } else {
            // Трение для игрока (скорость падает, если не кликать)
            r.speed *= 0.94;
        }

        r.pos += r.speed;

        if (r.pos >= TRACK_LENGTH && !winner) {
            winner = r;
            setTimeout(() => {
                alert(winner.isPlayer ? "🎉 ВЫ ПОБЕДИЛИ В ЗАБЕГЕ!" : `❌ Победил ${winner.name}! Прокачай клики!`);
                resetGame();
            }, 100);
        }
    });
}

function resetGame() {
    gameActive = false;
    winner = null;
    turboCharge = 0;
    turboBtn.disabled = true;
    runners.forEach(r => { r.pos = 0; r.speed = 0; });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let pPos = runners[0].pos;

    // Псевдо-3D Небо и Горизонт
    let skyGradient = ctx.createLinearGradient(0, 0, 0, 200);
    skyGradient.addColorStop(0, '#020617');
    skyGradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, 200);

    // Псевдо-3D Дорожка с перспективой
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(350, 150); // Левый верх
    ctx.lineTo(450, 150); // Правый верх
    ctx.lineTo(800, 400); // Правый низ
    ctx.lineTo(0, 400);   // Левый низ
    ctx.fill();

    // Отрисовка полос перспективы (4 полосы)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
        let topX = 350 + (i * 25);
        let botX = 0 + (i * 200);
        ctx.beginPath();
        ctx.moveTo(topX, 150);
        ctx.lineTo(botX, 400);
        ctx.stroke();
    }

    // Движущиеся разделительные черты (Эффект движения вперед)
    ctx.fillStyle = '#fde047';
    let speedOffset = (pPos * 20) % 50;
    for (let z = 0; z < 10; z++) {
        let y = 150 + Math.pow(z / 10, 2) * 250 + speedOffset * (z/10);
        if (y > 150 && y < 400) {
            let scale = (y - 150) / 250;
            ctx.fillRect(400 - 100 * scale, y, 200 * scale, 3 * scale);
        }
    }

    // Отрисовка бегунов
    // Сортируем чтобы дальние бегуны рисовались раньше
    let sortedRunners = [...runners].sort((a,b) => a.pos - b.pos);

    sortedRunners.forEach(r => {
        let relPos = r.pos - pPos; // Позиция относительно игрока
        let zScale = 1 + (relPos * 0.003); // Масштаб 3D
        if (zScale < 0.2) zScale = 0.2;

        let screenY = 320 - (relPos * 1.2);
        if (screenY < 150 || screenY > 390) return;

        let laneWidth = 160;
        let screenX = 100 + (r.lane * 140) + (relPos * 0.2);

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, 15 * zScale, 5 * zScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело бегуна
        ctx.fillStyle = r.color;
        ctx.fillRect(screenX - (10 * zScale), screenY - (30 * zScale), 20 * zScale, 30 * zScale);

        // Голова
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(screenX, screenY - (35 * zScale), 7 * zScale, 0, Math.PI * 2);
        ctx.fill();

        // Имя
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(r.name, screenX - 25, screenY - (45 * zScale));
    });

    // HUD Интерфейс
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 10, 220, 90);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(10, 10, 220, 90);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`ДИСТАНЦИЯ: ${Math.floor(pPos)} / ${TRACK_LENGTH}m`, 20, 35);
    ctx.fillText(`СКОРОСТЬ: ${Math.floor(runners[0].speed * 200)} км/ч`, 20, 60);

    // Шкала Турбо
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, 70, 200, 15);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(20, 70, (turboCharge / 100) * 200, 15);

    requestAnimationFrame(render);
}

setInterval(update, 1000 / 60);
render();
