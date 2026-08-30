
const canvas = document.getElementById('click-canvas');
const ctx = canvas.getContext('2d');

// Состояние игры
let state = {
    score: 0,
    clickPower: 1,
    cps: 0,
    critChance: 0.05,
    critMult: 2,
    activeSkin: 'default',
    activeVfx: 'sparks'
};

// Загрузка сохранения
const saved = localStorage.getItem('cyber_clicker_save');
if (saved) {
    try { state = { ...state, ...JSON.parse(saved) }; } catch(e){}
}

function saveGame() {
    localStorage.setItem('cyber_clicker_save', JSON.stringify(state));
}

// База улучшений
const upgrades = [
    { id: 'c1', name: 'Усиленный клик', cost: 15, power: 1, type: 'click', count: 0, costMult: 1.5 },
    { id: 'c2', name: 'Двойной клик', cost: 100, power: 5, type: 'click', count: 0, costMult: 1.6 },
    { id: 'c3', name: 'Критический клик (+5% шанс)', cost: 250, power: 0.05, type: 'crit', count: 0, costMult: 2.0 },
    { id: 'a1', name: 'Авто-кликер', cost: 50, power: 1, type: 'auto', count: 0, costMult: 1.4 },
    { id: 'a2', name: 'Клик-ферма', cost: 500, power: 10, type: 'auto', count: 0, costMult: 1.45 },
    { id: 'a3', name: 'Квантовый сервер', cost: 3000, power: 80, type: 'auto', count: 0, costMult: 1.5 },
    { id: 'a4', name: 'Нейросеть-майнер', cost: 20000, power: 500, type: 'auto', count: 0, costMult: 1.6 }
];

// Скины
const skins = [
    { id: 'default', name: 'Неоновый Синий', cost: 0, color: '#38bdf8', unlocked: true },
    { id: 'gold', name: 'Золото Изобилия', cost: 1000, color: '#eab308', unlocked: false },
    { id: 'plasma', name: 'Плазменный Взрыв', cost: 5000, color: '#a855f7', unlocked: false },
    { id: 'cyber', name: 'Киберпанк Красный', cost: 25000, color: '#ef4444', unlocked: false }
];

// VFX
const vfxList = [
    { id: 'sparks', name: 'Искры', cost: 0, unlocked: true },
    { id: 'stars', name: 'Звезды', cost: 500, unlocked: false },
    { id: 'rings', name: 'Волновой импульс', cost: 3000, unlocked: false }
];

let particles = [];
let floatingTexts = [];
let currentTab = 'upgrades';
let ballRadius = 90;
let targetRadius = 90;

// Отрисовка интерактивной сферы
function renderSphere() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Плавное сжатие/расширение при клике
    ballRadius += (targetRadius - ballRadius) * 0.2;

    let currentSkin = skins.find(s => s.id === state.activeSkin) || skins[0];

    // Свечение сферы
    let gradient = ctx.createRadialGradient(160, 160, 10, 160, 160, ballRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, currentSkin.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');

    ctx.shadowBlur = 25;
    ctx.shadowColor = currentSkin.color;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(160, 160, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Отрисовка частиц
    particles.forEach((p, idx) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if(p.life <= 0) particles.splice(idx, 1);
    });

    // Летающий текст очков
    ctx.font = 'bold 20px sans-serif';
    floatingTexts.forEach((ft, idx) => {
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 1.5; ft.life -= 0.02;
        if(ft.life <= 0) floatingTexts.splice(idx, 1);
    });

    requestAnimationFrame(renderSphere);
}
renderSphere();

// Обработка клика
canvas.addEventListener('click', (e) => {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let dist = Math.sqrt((x - 160)**2 + (y - 160)**2);
    if (dist <= ballRadius) {
        // Клик сработал
        targetRadius = 75;
        setTimeout(() => targetRadius = 90, 100);

        let isCrit = Math.random() < state.critChance;
        let gained = state.clickPower * (isCrit ? state.critMult : 1);
        state.score += gained;

        // Создание VFX
        spawnVFX(x, y, isCrit);

        // Текст очков
        floatingTexts.push({
            x: x + (Math.random()-0.5)*20,
            y: y,
            text: '+' + Math.floor(gained) + (isCrit ? ' КРИТ!' : ''),
            color: isCrit ? '#ef4444' : '#38bdf8',
            life: 1.0
        });

        updateUI();
        saveGame();
    }
});

function spawnVFX(x, y, isCrit) {
    let skinColor = (skins.find(s => s.id === state.activeSkin) || skins[0]).color;
    let count = isCrit ? 25 : 12;

    for(let i=0; i<count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 4 + 1;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: isCrit ? '#ef4444' : skinColor,
            life: 1.0
        });
    }
}

// Авто-клики каждую секунду
setInterval(() => {
    if (state.cps > 0) {
        state.score += state.cps;
        updateUI();
        saveGame();
    }
}, 1000);

// Переключение табов магазина
window.switchTab = function(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderShop();
};

function renderShop() {
    const container = document.getElementById('shop-content');
    container.innerHTML = '';

    if (currentTab === 'upgrades') {
        upgrades.forEach(u => {
            let currentCost = Math.floor(u.cost * Math.pow(u.costMult, u.count));
            container.innerHTML += `
                <div class="upg-card">
                    <div>
                        <strong>${u.name} (${u.count})</strong><br>
                        <small style="color:#9ca3af;">${u.type==='auto' ? '+'+u.power+'/сек' : '+'+u.power+' к клику'}</small>
                    </div>
                    <button class="upg-btn" ${state.score < currentCost ? 'disabled' : ''} onclick="buyUpg('${u.id}')">
                        ${currentCost} 💎
                    </button>
                </div>
            `;
        });
    } else if (currentTab === 'skins') {
        skins.forEach(s => {
            let isEquipped = state.activeSkin === s.id;
            container.innerHTML += `
                <div class="upg-card">
                    <div>
                        <strong style="color:${s.color};">${s.name}</strong><br>
                        <small style="color:#9ca3af;">${s.unlocked ? (isEquipped ? 'Надето' : 'Разблокировано') : 'Цена: ' + s.cost}</small>
                    </div>
                    <button class="upg-btn" ${!s.unlocked && state.score < s.cost ? 'disabled' : ''} onclick="selectSkin('${s.id}')">
                        ${s.unlocked ? (isEquipped ? 'ВЫБРАНО' : 'НАДЕТЬ') : s.cost + ' 💎'}
                    </button>
                </div>
            `;
        });
    } else if (currentTab === 'vfx') {
        vfxList.forEach(v => {
            let isEquipped = state.activeVfx === v.id;
            container.innerHTML += `
                <div class="upg-card">
                    <div>
                        <strong>${v.name}</strong><br>
                        <small style="color:#9ca3af;">${v.unlocked ? 'Доступно' : 'Цена: ' + v.cost}</small>
                    </div>
                    <button class="upg-btn" ${!v.unlocked && state.score < v.cost ? 'disabled' : ''} onclick="selectVfx('${v.id}')">
                        ${v.unlocked ? (isEquipped ? 'ВЫБРАНО' : 'ВЫБРАТЬ') : v.cost + ' 💎'}
                    </button>
                </div>
            `;
        });
    }
}

window.buyUpg = function(id) {
    let u = upgrades.find(item => item.id === id);
    let cost = Math.floor(u.cost * Math.pow(u.costMult, u.count));
    if (state.score >= cost) {
        state.score -= cost;
        u.count++;
        if (u.type === 'click') state.clickPower += u.power;
        if (u.type === 'auto') state.cps += u.power;
        if (u.type === 'crit') state.critChance += u.power;
        updateUI();
        renderShop();
        saveGame();
    }
};

window.selectSkin = function(id) {
    let s = skins.find(item => item.id === id);
    if (!s.unlocked && state.score >= s.cost) {
        state.score -= s.cost;
        s.unlocked = true;
    }
    if (s.unlocked) {
        state.activeSkin = id;
        renderShop();
        saveGame();
    }
};

window.selectVfx = function(id) {
    let v = vfxList.find(item => item.id === id);
    if (!v.unlocked && state.score >= v.cost) {
        state.score -= v.cost;
        v.unlocked = true;
    }
    if (v.unlocked) {
        state.activeVfx = id;
        renderShop();
        saveGame();
    }
};

function updateUI() {
    document.getElementById('score-display').innerText = Math.floor(state.score);
    document.getElementById('cps-display').innerText = 'Очков в секунду: ' + state.cps;
    renderShop();
}

updateUI();
