/* ============================================================
   MEME CLICKER TYCOON — Full Game Logic
   ============================================================ */

// ============================================================
//  GAME STATE
// ============================================================
const state = {
    coins: 0,
    clickPower: 1,
    coinsPerSecond: 0,
    totalClicks: 0,
    upgrades: [
        {
            id: 'better_meme',
            name: '🐱 Better Meme',
            desc: '+1 per click',
            baseCost: 10,
            costMultiplier: 1.5,
            clickBonus: 1,
            cpsBonus: 0,
            level: 0,
            maxLevel: 50,
        },
        {
            id: 'social_media',
            name: '📱 Social Media',
            desc: '+2 per second',
            baseCost: 50,
            costMultiplier: 1.6,
            clickBonus: 0,
            cpsBonus: 2,
            level: 0,
            maxLevel: 40,
        },
        {
            id: 'meme_factory',
            name: '🏭 Meme Factory',
            desc: '+10 per second',
            baseCost: 200,
            costMultiplier: 1.8,
            clickBonus: 0,
            cpsBonus: 10,
            level: 0,
            maxLevel: 30,
        },
        {
            id: 'viral_boost',
            name: '🚀 Viral Boost',
            desc: 'x2 all production',
            baseCost: 1000,
            costMultiplier: 2.2,
            clickBonus: 0,
            cpsBonus: 0,
            level: 0,
            maxLevel: 10,
            isMultiplier: true,
        },
        {
            id: 'influencer',
            name: '⭐ Influencer',
            desc: '+50 per second',
            baseCost: 5000,
            costMultiplier: 2.0,
            clickBonus: 0,
            cpsBonus: 50,
            level: 0,
            maxLevel: 20,
        },
    ],
    lastSaved: Date.now(),
    version: '1.0',
};

// ============================================================
//  DOM REFS
// ============================================================
const $ = (id) => document.getElementById(id);
const coinDisplay = $('coinDisplay');
const cpsDisplay = $('cpsDisplay');
const clickDisplay = $('clickDisplay');
const levelDisplay = $('levelDisplay');
const clickBtn = $('clickBtn');
const toast = $('toast');
const upgradesContainer = $('upgradesContainer');
const particlesContainer = $('particles');

// ============================================================
//  HELPERS
// ============================================================
function formatNumber(n) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    n = Math.floor(n);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
}

function getUpgradeCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

function getTotalClickPower() {
    let base = state.clickPower;
    state.upgrades.forEach(u => {
        if (!u.isMultiplier) {
            base += u.clickBonus * u.level;
        }
    });
    state.upgrades.forEach(u => {
        if (u.isMultiplier && u.level > 0) {
            base *= Math.pow(2, u.level);
        }
    });
    return base;
}

function getTotalCPS() {
    let base = state.coinsPerSecond;
    state.upgrades.forEach(u => {
        if (!u.isMultiplier) {
            base += u.cpsBonus * u.level;
        }
    });
    state.upgrades.forEach(u => {
        if (u.isMultiplier && u.level > 0) {
            base *= Math.pow(2, u.level);
        }
    });
    return base;
}

function getPlayerLevel() {
    const totalUpgrades = state.upgrades.reduce((sum, u) => sum + u.level, 0);
    return Math.floor(totalUpgrades / 3) + 1;
}

// ============================================================
//  PARTICLES (floating coins on click)
// ============================================================
function spawnParticle(x, y) {
    const emojis = ['🪙', '✨', '⭐', '💰', '🎉'];
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
    el.style.top = (y + (Math.random() - 0.5) * 20) + 'px';
    el.style.fontSize = (1 + Math.random() * 0.8) + 'rem';
    el.style.animationDuration = (0.8 + Math.random() * 0.4) + 's';
    particlesContainer.appendChild(el);
    setTimeout(() => el.remove(), 1400);
}

// ============================================================
//  RENDER
// ============================================================
function render() {
    const totalCPS = getTotalCPS();
    const clickPower = getTotalClickPower();
    const level = getPlayerLevel();

    coinDisplay.textContent = formatNumber(state.coins);
    cpsDisplay.textContent = formatNumber(totalCPS);
    clickDisplay.textContent = formatNumber(state.totalClicks);
    levelDisplay.textContent = level;

    // Render upgrades
    upgradesContainer.innerHTML = '';
    state.upgrades.forEach((u, index) => {
        const cost = getUpgradeCost(u);
        const canAfford = state.coins >= cost;
        const isMaxed = u.level >= u.maxLevel;

        const div = document.createElement('div');
        div.className = 'upgrade-item';

        const info = document.createElement('div');
        info.className = 'info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.textContent = `${u.name} (${u.level}/${u.maxLevel})`;

        const descSpan = document.createElement('span');
        descSpan.className = 'desc';
        descSpan.textContent = u.desc;

        info.appendChild(nameSpan);
        info.appendChild(descSpan);

        const btn = document.createElement('button');
        if (isMaxed) {
            btn.textContent = '✅ MAX';
            btn.disabled = true;
        } else {
            btn.textContent = `Buy ${formatNumber(cost)}`;
            btn.disabled = !canAfford;
        }
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            buyUpgrade(index);
        });

        div.appendChild(info);
        div.appendChild(btn);
        upgradesContainer.appendChild(div);
    });
}

// ============================================================
//  GAME LOGIC
// ============================================================
function clickMeme(e) {
    const power = getTotalClickPower();
    state.coins += power;
    state.totalClicks += 1;

    // Visual feedback
    clickBtn.style.transform = 'scale(0.90)';
    setTimeout(() => clickBtn.style.transform = '', 100);

    // Particles
    const rect = clickBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 4; i++) {
        spawnParticle(cx, cy);
    }

    render();

    // Random event (5% chance)
    if (Math.random() < 0.05) {
        triggerRandomEvent();
    }
}

function buyUpgrade(index) {
    const u = state.upgrades[index];
    if (!u) return;
    if (u.level >= u.maxLevel) return;

    const cost = getUpgradeCost(u);
    if (state.coins < cost) return;

    state.coins -= cost;
    u.level += 1;

    // Show feedback
    showToast(`⬆️ ${u.name} upgraded to lvl ${u.level}!`, 'good');

    // 10% chance event after upgrade
    if (Math.random() < 0.10) {
        setTimeout(() => triggerRandomEvent(), 300);
    }

    render();
}

// ============================================================
//  EVENTS
// ============================================================
const eventPool = [
    { msg: '🔥 Meme goes viral! +50 coins', effect: () => { state.coins += 50; }, type: 'good' },
    { msg: '😱 Canceled! -20 coins', effect: () => { state.coins = Math.max(0, state.coins - 20); }, type: 'bad' },
    { msg: '🐦 Elon tweeted it! +100 coins', effect: () => { state.coins += 100; }, type: 'good' },
    { msg: '📉 Algorithm changed! -10% coins', effect: () => { state.coins = Math.floor(state.coins * 0.9); }, type: 'bad' },
    { msg: '🎮 Streamer played your meme! +80 coins', effect: () => { state.coins += 80; }, type: 'good' },
    { msg: '💀 NFT crash! -30 coins', effect: () => { state.coins = Math.max(0, state.coins - 30); }, type: 'bad' },
    { msg: '🌟 Featured on Reddit! +60 coins', effect: () => { state.coins += 60; }, type: 'good' },
    { msg: '🤖 AI made a meme about you! +150 coins', effect: () => { state.coins += 150; }, type: 'good' },
    { msg: '📰 Fake news! -40 coins', effect: () => { state.coins = Math.max(0, state.coins - 40); }, type: 'bad' },
];

function triggerRandomEvent() {
    const ev = eventPool[Math.floor(Math.random() * eventPool.length)];
    ev.effect();
    showToast(ev.msg, ev.type);
    render();
}

let toastTimeout = null;

function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className = 'toast ' + type;

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.textContent = '💡 Keep clicking!';
        toast.className = 'toast';
    }, 3800);
}

// ============================================================
//  SAVE / LOAD / RESET
// ============================================================
function saveGame() {
    try {
        const data = {
            coins: state.coins,
            clickPower: state.clickPower,
            coinsPerSecond: state.coinsPerSecond,
            upgrades: state.upgrades.map(u => ({ id: u.id, level: u.level })),
            totalClicks: state.totalClicks,
            timestamp: Date.now(),
            version: state.version,
        };
        localStorage.setItem('memeTycoonSave', JSON.stringify(data));
        showToast('💾 Game saved!', 'good');
        return true;
    } catch (e) {
        showToast('❌ Save failed', 'bad');
        return false;
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem('memeTycoonSave');
        if (!raw) return false;

        const data = JSON.parse(raw);

        // Restore state
        state.coins = data.coins || 0;
        state.clickPower = data.clickPower || 1;
        state.coinsPerSecond = data.coinsPerSecond || 0;
        state.totalClicks = data.totalClicks || 0;

        // Restore upgrade levels
        if (data.upgrades) {
            data.upgrades.forEach(saved => {
                const target = state.upgrades.find(u => u.id === saved.id);
                if (target) {
                    target.level = saved.level || 0;
                    // Clamp to maxLevel
                    if (target.level > target.maxLevel) target.level = target.maxLevel;
                }
            });
        }

        render();
        showToast('📂 Game loaded!', 'good');
        return true;
    } catch (e) {
        console.warn('Load failed:', e);
        return false;
    }
}

function resetGame() {
    if (!confirm('Reset all progress? This cannot be undone.')) return;

    localStorage.removeItem('memeTycoonSave');
    state.coins = 0;
    state.clickPower = 1;
    state.coinsPerSecond = 0;
    state.totalClicks = 0;
    state.upgrades.forEach(u => u.level = 0);

    render();
    showToast('🗑️ Game reset', 'bad');
}

// ============================================================
//  AUTO-SAVE & CPS TICK
// ============================================================
function gameTick() {
    const cps = getTotalCPS();
    if (cps > 0) {
        state.coins += cps;
        render();
    }
}

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        clickBtn.click();
    }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveGame();
    }
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetGame();
    }
});

// ============================================================
//  INIT
// ============================================================
function init() {
    // Load saved game
    const loaded = loadGame();
    if (!loaded) {
        showToast('🐸 New game! Click the frog.', '');
    }

    // Event listeners
    clickBtn.addEventListener('click', clickMeme);
    clickBtn.addEventListener('touchstart', (e) => {
        // Prevent double-tap zoom on mobile
        e.preventDefault();
        clickMeme(e);
    });

    document.getElementById('saveBtn').addEventListener('click', saveGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);

    // Auto-save every 15 seconds
    setInterval(saveGame, 15000);

    // Game tick every second
    setInterval(gameTick, 1000);

    // Save on page close
    window.addEventListener('beforeunload', () => {
        saveGame();
    });

    render();
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}