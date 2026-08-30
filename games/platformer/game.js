
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let level = 1;
let coins = 0;
let record = localStorage.getItem('plat_record') || 1;
document.getElementById('record-val').innerText = record;

// Игрок
let p = {
    x: 100, y: 200, w: 32, h: 42,
    vx: 0, vy: 0,
    grounded: false,
    color: '#38bdf8'
};

let cameraX = 0;
let keys = {};
let platforms = [];
let enemies = [];
let coinItems = [];
let lastGeneratedX = 0;

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// Генератор блоков уровней (Chunk System)
function generateChunk(startX) {
    let x = startX;
    // Базовая длина блока
    for (let i = 0; i < 5; i++) {
        let pWidth = 150 + Math.random() * 200;
        let pY = 280 + (Math.random() - 0.5) * 120;
        let type = 'normal';

        let rand = Math.random();
        if (rand < 0.2) type = 'moving';
        else if (rand < 0.4) type = 'conveyor';

        platforms.push({
            x: x, y: pY, w: pWidth, h: 40,
            type: type,
            vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
            dir: type === 'conveyor' ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
            minX: x - 50, maxX: x + pWidth + 50
        });

        // Генерация врага на платформе (Mario style)
        if (Math.random() < 0.6 && type !== 'moving') {
            enemies.push({
                x: x + pWidth / 2, y: pY - 30, w: 30, h: 30,
                vx: 1 + level * 0.2, minX: x, maxX: x + pWidth - 30, alive: true
            });
        }

        // Монетки
        if (Math.random() < 0.8) {
            for(let c = 0; c < 3; c++) {
                coinItems.push({ x: x + 40 + c * 30, y: pY - 40, collected: false });
            }
        }

        // Пропасти увеличиваются с каждым уровнем
        let gap = 80 + Math.min(level * 10, 150);
        x += pWidth + gap;
    }
    lastGeneratedX = x;
}

function initGame() {
    p.x = 100; p.y = 200; p.vx = 0; p.vy = 0;
    cameraX = 0; level = 1; coins = 0;
    platforms = []; enemies = []; coinItems = [];
    
    // Стартовая ровная платформа
    platforms.push({ x: 0, y: 350, w: 400, h: 40, type: 'normal', vx: 0, dir: 0 });
    lastGeneratedX = 400;
    generateChunk(lastGeneratedX);
}
initGame();

function update() {
    // Управление
    if (keys['KeyD'] || keys['ArrowRight']) p.vx = 5;
    else if (keys['KeyA'] || keys['ArrowLeft']) p.vx = -5;
    else p.vx = 0;

    if ((keys['KeyW'] || keys['Space'] || keys['ArrowUp']) && p.grounded) {
        p.vy = -12;
        p.grounded = false;
    }

    p.vy += 0.5; // Гравитация
    p.x += p.vx;
    p.y += p.vy;

    // Плавная камера
    cameraX += (p.x - 200 - cameraX) * 0.1;

    // Генерация новых кусков мира по мере продвижения
    if (p.x + 800 > lastGeneratedX) {
        generateChunk(lastGeneratedX);
    }

    // Подсчет уровня (каждые 1500px длины)
    let currentLvlCalc = Math.floor(p.x / 1200) + 1;
    if (currentLvlCalc > level) {
        level = currentLvlCalc;
        if (level > record) {
            record = level;
            localStorage.setItem('plat_record', record);
            document.getElementById('record-val').innerText = record;
        }
    }

    p.grounded = false;

    // Коллизии с платформами
    platforms.forEach(plat => {
        // Движение платформ
        if (plat.type === 'moving') {
            plat.x += plat.vx;
            if (plat.x < plat.minX || plat.x > plat.maxX) plat.vx *= -1;
        }

        // Пересечение
        if (p.x < plat.x + plat.w && p.x + p.w > plat.x &&
            p.y + p.h >= plat.y && p.y + p.h <= plat.y + 15 && p.vy >= 0) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.grounded = true;

            // Эффект конвейера
            if (plat.type === 'conveyor') {
                p.x += plat.dir;
            }
            if (plat.type === 'moving') {
                p.x += plat.vx;
            }
        }
    });

    // Обработка врагов (Марио механика)
    enemies.forEach(e => {
        if (!e.alive) return;

        // Патрулирование врага
        e.x += e.vx;
        if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;

        // Коллизия с игроком
        if (p.x < e.x + e.w && p.x + p.w > e.x &&
            p.y < e.y + e.h && p.y + p.h > e.y) {
            
            // Прыжок сверху — уничтожаем врага!
            if (p.vy > 0 && p.y + p.h - p.vy <= e.y + 10) {
                e.alive = false;
                p.vy = -8; // Отскок
                coins += 5;
            } else {
                // Смерть при столкновении сбоку
                alert("ИГРА ОКОНЧЕНА! Вы достигли уровня " + level);
                initGame();
            }
        }
    });

    // Сбор монет
    coinItems.forEach(c => {
        if (!c.collected && Math.abs(p.x - c.x) < 25 && Math.abs(p.y - c.y) < 25) {
            c.collected = true;
            coins++;
        }
    });

    // Смерть от падения в бездну
    if (p.y > 600) {
        initGame();
    }

    document.getElementById('lvl-val').innerText = level;
    document.getElementById('coins-val').innerText = coins;
}

// 2.5D Рендер
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Параллакс-фон (2.5D эффект)
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 300 + cameraX * 0.5, 100, 150, 300);
    }

    // Отрисовка платформ в 2.5D (С объёмными гранями)
    platforms.forEach(plat => {
        if (plat.x + plat.w < cameraX - 100 || plat.x > cameraX + 900) return;

        // Верхняя грань
        if (plat.type === 'normal') ctx.fillStyle = '#22c55e';
        if (plat.type === 'moving') ctx.fillStyle = '#38bdf8';
        if (plat.type === 'conveyor') ctx.fillStyle = '#eab308';
        ctx.fillRect(plat.x, plat.y, plat.w, 12);

        // Объёмная лицевая грань (3D толщина)
        ctx.fillStyle = '#15803d';
        if (plat.type === 'moving') ctx.fillStyle = '#0284c7';
        if (plat.type === 'conveyor') ctx.fillStyle = '#ca8a04';
        ctx.fillRect(plat.x, plat.y + 12, plat.w, plat.h - 12);

        // Боковая 2.5D скошенная тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(plat.x + plat.w, plat.y);
        ctx.lineTo(plat.x + plat.w + 10, plat.y + 10);
        ctx.lineTo(plat.x + plat.w + 10, plat.y + plat.h + 10);
        ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
        ctx.fill();
    });

    // Монетки
    coinItems.forEach(c => {
        if (c.collected) return;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    // Враги
    enemies.forEach(e => {
        if (!e.alive) return;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        // Глаза врага
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x + 4, e.y + 6, 6, 6);
        ctx.fillRect(e.x + 18, e.y + 6, 6, 6);
    });

    // Игрок с 2.5D тенью
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h + 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тело игрока
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.restore();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}
gameLoop();
