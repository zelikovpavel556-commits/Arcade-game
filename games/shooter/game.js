
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Звуковой движок Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }
}

// 10 Карты Лабиринтов
const MAPS = [
    [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,0,1],
        [1,0,1,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,0,1,0,1],
        [1,0,0,0,0,1,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
    ],
    [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,0,1,1,0,1],
        [1,0,1,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
    ]
];

// Автоматическая генерация сложного уровня если нет в массиве
function getMap(lvl) {
    if (MAPS[lvl]) return MAPS[lvl];
    let m = [];
    for(let r=0; r<8; r++) {
        let row = [];
        for(let c=0; c<10; c++) {
            if(r===0||r===7||c===0||c===9) row.push(1);
            else row.push((Math.random() > 0.75 && !(r===1 && c===1)) ? 1 : 0);
        }
        m.push(row);
    }
    return m;
}

let currentLvl = 0;
let map = getMap(currentLvl);
let player = { x: 1.5, y: 1.5, dir: 0, hp: 100, bobbing: 0 };
let keys = {};
let enemies = [];
let particles = [];

function spawnEnemies() {
    enemies = [];
    let count = 2 + currentLvl;
    for(let i=0; i<count; i++) {
        let ex, ey;
        do {
            ex = Math.floor(Math.random() * (map[0].length - 2)) + 1;
            ey = Math.floor(Math.random() * (map.length - 2)) + 1;
        } while(map[ey][ex] !== 0 || (ex < 3 && ey < 3));
        enemies.push({ x: ex + 0.5, y: ey + 0.5, hp: 50 + currentLvl*10, alive: true, hitAnim: 0 });
    }
}
spawnEnemies();

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);
document.addEventListener('click', shoot);

function shoot() {
    playSound('shoot');
    player.bobbing += 10;
    
    // Система попадания
    let hit = false;
    enemies.forEach(e => {
        if(!e.alive) return;
        let dx = e.x - player.x, dy = e.y - player.y;
        let angleToEnemy = Math.atan2(dy, dx) - player.dir;
        while (angleToEnemy < -Math.PI) angleToEnemy += Math.PI * 2;
        while (angleToEnemy > Math.PI) angleToEnemy -= Math.PI * 2;
        
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (Math.abs(angleToEnemy) < 0.3 && dist < 8) {
            e.hp -= 35;
            e.hitAnim = 5;
            playSound('hit');
            if(e.hp <= 0) e.alive = false;
            hit = true;
        }
    });

    // Анимация выстрела и частиц
    for(let i=0; i<15; i++) {
        particles.push({
            x: 400 + (Math.random()-0.5)*40,
            y: 350 + (Math.random()-0.5)*40,
            vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
            life: 10, color: '#ffcc00'
        });
    }
}

function update() {
    let moveSpeed = 0.04;
    let rotSpeed = 0.04;

    if (keys['KeyW'] || keys['ArrowUp']) {
        let nx = player.x + Math.cos(player.dir) * moveSpeed;
        let ny = player.y + Math.sin(player.dir) * moveSpeed;
        if(map[Math.floor(player.y)][Math.floor(nx)] === 0) player.x = nx;
        if(map[Math.floor(ny)][Math.floor(player.x)] === 0) player.y = ny;
        player.bobbing += 0.1;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        let nx = player.x - Math.cos(player.dir) * moveSpeed;
        let ny = player.y - Math.sin(player.dir) * moveSpeed;
        if(map[Math.floor(player.y)][Math.floor(nx)] === 0) player.x = nx;
        if(map[Math.floor(ny)][Math.floor(player.x)] === 0) player.y = ny;
    }
    if (keys['KeyA'] || keys['ArrowLeft']) player.dir -= rotSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) player.dir += rotSpeed;

    // ИИ Врагов
    let aliveEnemies = 0;
    enemies.forEach(e => {
        if(!e.alive) return;
        aliveEnemies++;
        let dx = player.x - e.x, dy = player.y - e.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > 0.8) {
            e.x += (dx / dist) * 0.01;
            e.y += (dy / dist) * 0.01;
        } else {
            player.hp -= 0.2; // Нанесение урона игроку
            if(player.hp <= 0) {
                alert("ВЫ ПОГИБЛИ! Уровень перезапускается.");
                player.hp = 100;
                spawnEnemies();
            }
        }
        if(e.hitAnim > 0) e.hitAnim--;
    });

    document.getElementById('hp').innerText = Math.max(0, Math.floor(player.hp));
    document.getElementById('lvl').innerText = currentLvl + 1;
    document.getElementById('enemies-count').innerText = aliveEnemies;

    if(aliveEnemies === 0) {
        if(currentLvl < 9) {
            currentLvl++;
            map = getMap(currentLvl);
            player.x = 1.5; player.y = 1.5;
            spawnEnemies();
            alert("УРОВЕНЬ ЗАЧИЩЕН! Переход на уровень " + (currentLvl + 1));
        } else {
            alert("ПОБЕДА! Вы прошли все 10 уровней!");
            currentLvl = 0; map = getMap(0); spawnEnemies();
        }
    }
}

function render() {
    ctx.fillStyle = '#111'; ctx.fillRect(0,0,800,225); // Потолок
    ctx.fillStyle = '#222'; ctx.fillRect(0,225,800,225); // Пол

    // Рейкастинг рендер
    const fov = 1.0;
    const numRays = 160;
    const rayWidth = 800 / numRays;

    for (let i = 0; i < numRays; i++) {
        let rayAngle = (player.dir - fov/2) + (i / numRays) * fov;
        let distance = 0;
        let hitWall = false;
        let cos = Math.cos(rayAngle), sin = Math.sin(rayAngle);

        while (!hitWall && distance < 16) {
            distance += 0.05;
            let checkX = Math.floor(player.x + cos * distance);
            let checkY = Math.floor(player.y + sin * distance);
            if (checkX < 0 || checkX >= map[0].length || checkY < 0 || checkY >= map.length) {
                hitWall = true; distance = 16;
            } else if (map[checkY][checkX] > 0) {
                hitWall = true;
            }
        }

        // Коррекция эффекта "Fish-eye"
        let correctedDist = distance * Math.cos(rayAngle - player.dir);
        let wallHeight = Math.min(450, (450 / correctedDist));

        let shade = Math.max(0, 255 - correctedDist * 18);
        ctx.fillStyle = `rgb(${shade}, ${shade*0.2}, ${shade*0.2})`;
        ctx.fillRect(i * rayWidth, (450 - wallHeight)/2, rayWidth + 1, wallHeight);
    }

    // Рендер Врагов (Спрайты)
    enemies.forEach(e => {
        if(!e.alive) return;
        let dx = e.x - player.x, dy = e.y - player.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy, dx) - player.dir;
        while (angle < -Math.PI) angle += Math.PI * 2;
        while (angle > Math.PI) angle -= Math.PI * 2;

        if (Math.abs(angle) < fov) {
            let screenX = (800/2) + Math.tan(angle) * (800/2);
            let size = Math.min(300, 300 / dist);
            ctx.fillStyle = e.hitAnim > 0 ? '#ffffff' : '#ff2222';
            ctx.beginPath();
            ctx.arc(screenX, 225, size/2, 0, Math.PI*2);
            ctx.fill();
            // Глаза врага
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX - size/6, 225 - size/6, size/8, size/8);
            ctx.fillRect(screenX + size/16, 225 - size/6, size/8, size/8);
        }
    });

    // Оружие и покачивание
    let bob = Math.sin(player.bobbing) * 8;
    ctx.fillStyle = '#444';
    ctx.fillRect(370, 320 + bob, 60, 130);
    ctx.fillStyle = '#222';
    ctx.fillRect(385, 290 + bob, 30, 40);

    // Прицел
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(400, 225, 6, 0, Math.PI*2);
    ctx.stroke();

    // Частицы
    particles.forEach((p, index) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        p.x += p.vx; p.y += p.vy; p.life--;
        if(p.life <= 0) particles.splice(index, 1);
    });

    // Мини-карта
    let mmSize = 8;
    for(let r=0; r<map.length; r++) {
        for(let c=0; c<map[0].length; c++) {
            ctx.fillStyle = map[r][c] === 1 ? '#888' : '#111';
            ctx.fillRect(10 + c*mmSize, 10 + r*mmSize, mmSize-1, mmSize-1);
        }
    }
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10 + player.x*mmSize - 2, 10 + player.y*mmSize - 2, 4, 4);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}
gameLoop();
