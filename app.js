// DOM Elements
const screens = {
    onboarding: document.getElementById('screen-onboarding'),
    dashboard: document.getElementById('screen-dashboard'),
    test: document.getElementById('screen-test'),
    pvt: document.getElementById('screen-pvt'),
    aim: document.getElementById('screen-aim'),
    stroop: document.getElementById('screen-stroop'),
    result: document.getElementById('screen-result'),
    chart: document.getElementById('screen-chart'),
    leaderboard: document.getElementById('screen-leaderboard')
};

// Onboarding Elements
const sportSelect = document.getElementById('sport-level');
const gameSelect = document.getElementById('game-level');
const btnSaveProfile = document.getElementById('btn-save-profile');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const onboardingTitle = document.getElementById('onboarding-title');
const leaderboardCheckbox = document.getElementById('leaderboard-checkbox');
const usernameContainer = document.getElementById('username-container');
const usernameInput = document.getElementById('username-input');

// Dashboard Elements
const btnSettings = document.getElementById('btn-settings');
const btnChart = document.getElementById('btn-chart');
const btnLeaderboard = document.getElementById('btn-leaderboard');
const btnStartTest = document.getElementById('btn-start-test');
const statBaseline = document.getElementById('stat-baseline');
const statLast = document.getElementById('stat-last');
const historyList = document.getElementById('history-list');

// Test Selector
const btnSelectCps = document.getElementById('btn-select-cps');
const btnSelectPvt = document.getElementById('btn-select-pvt');
const btnSelectAim = document.getElementById('btn-select-aim');
const btnSelectStroop = document.getElementById('btn-select-stroop');
const dashboardTestTitle = document.getElementById('dashboard-test-title');
const dashboardInstruction = document.getElementById('dashboard-instruction');

// CPS Test Elements
const clickArea = document.getElementById('click-area');
const timeLeftDisplay = document.getElementById('time-left');
const clickCountDisplay = document.getElementById('click-count');
const clickInstruction = document.getElementById('click-instruction');

// PVT Test Elements
const pvtArea = document.getElementById('pvt-area');
const pvtTitle = document.getElementById('pvt-title');
const pvtAttempt = document.getElementById('pvt-attempt');
const pvtMaxAttempts = document.getElementById('pvt-max-attempts');
const pvtInstruction = document.getElementById('pvt-instruction');

// AIM Test Elements
const aimArena = document.getElementById('aim-arena');
const aimStartBtn = document.getElementById('aim-start-btn');
const aimRemaining = document.getElementById('aim-remaining');
const aimAccuracy = document.getElementById('aim-accuracy');
const aimProMode = document.getElementById('aim-pro-mode');

// Stroop Elements
const stroopStartBtn = document.getElementById('stroop-start-btn');
const stroopRemaining = document.getElementById('stroop-remaining');
const stroopAccuracy = document.getElementById('stroop-accuracy');
const stroopWordContainer = document.getElementById('stroop-word-container');
const stroopWord = document.getElementById('stroop-word');
const stroopButtons = document.getElementById('stroop-buttons');

// Result Elements
const resultScoreSection = document.getElementById('result-score-section');
const resultScoreValue = document.getElementById('result-score-value');
const resultScoreUnit = document.getElementById('result-score-unit');
const resultFatigueStatus = document.getElementById('result-fatigue-status');
const resultRecommendation = document.getElementById('result-recommendation');
const btnFinish = document.getElementById('btn-finish');

// Chart Elements
const btnCloseChart = document.getElementById('btn-close-chart');
const chartTypeFilter = document.getElementById('chart-type-filter');
const chartTimeFilter = document.getElementById('chart-time-filter');
const chartCanvas = document.getElementById('performanceChart');
let myChart = null;

// Leaderboard Elements
const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
const lbTabPvt = document.getElementById('lb-tab-pvt');
const lbTabCps = document.getElementById('lb-tab-cps');
const lbTabAim = document.getElementById('lb-tab-aim');
const lbTabStroop = document.getElementById('lb-tab-stroop');
const lbLoading = document.getElementById('lb-loading');
const leaderboardList = document.getElementById('leaderboard-list');
const btnAdminReset = document.getElementById('btn-admin-reset');

// Constants
const JSONBLOB_URL = 'https://api.restful-api.dev/objects/ff8081819d82fab6019e34be3fe44891';
let currentLbMode = 'pvt';

// State
let appState = {
    profile: null,
    history: [],   
    activeTestMode: 'pvt' 
};

let cpsState = { isActive: false, clicks: 0, timeLeft: 5.0, timer: null };
let pvtState = { isActive: false, attempt: 1, maxAttempts: 3, results: [], timerStart: 0, timeoutId: null, status: 'idle' };
let aimState = { isActive: false, targetsHit: 0, targetsMissed: 0, bombsHit: 0, proMode: false, totalTargets: 10, times: [], lastSpawnTime: 0 };
let stroopState = { isActive: false, currentRound: 0, totalRounds: 20, times: [], errors: 0, startTime: 0, targetColor: '' };

const CPS_DURATION = 5.0;

// Init
function init() {
    loadState();
    if (!appState.profile) {
        showScreen('onboarding');
    } else {
        updateDashboard();
        showScreen('dashboard');
    }
    setupEventListeners();
}

function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        if(s) s.classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
}

function loadState() {
    const saved = localStorage.getItem('cns_tracker_data');
    if (saved) {
        appState = JSON.parse(saved);
        if (!appState.activeTestMode) appState.activeTestMode = 'pvt';
    }
}

function saveState() {
    localStorage.setItem('cns_tracker_data', JSON.stringify(appState));
}

// Event Listeners
function setupEventListeners() {
    leaderboardCheckbox.addEventListener('change', (e) => {
        if(e.target.checked) usernameContainer.classList.remove('hidden');
        else usernameContainer.classList.add('hidden');
    });

    btnSaveProfile.addEventListener('click', () => {
        appState.profile = { 
            sport: sportSelect.value, 
            game: gameSelect.value,
            leaderboardOptIn: leaderboardCheckbox.checked,
            username: leaderboardCheckbox.checked ? usernameInput.value.trim() || 'Sporcu_' + Math.floor(Math.random()*1000) : ''
        };
        saveState();
        updateDashboard();
        showScreen('dashboard');
    });

    btnCancelSettings.addEventListener('click', () => showScreen('dashboard'));

    btnSettings.addEventListener('click', () => {
        onboardingTitle.textContent = "Ayarlar";
        sportSelect.value = appState.profile.sport;
        gameSelect.value = appState.profile.game;
        leaderboardCheckbox.checked = appState.profile.leaderboardOptIn;
        if(leaderboardCheckbox.checked) {
            usernameContainer.classList.remove('hidden');
            usernameInput.value = appState.profile.username;
        } else {
            usernameContainer.classList.add('hidden');
        }
        btnCancelSettings.classList.remove('hidden');
        showScreen('onboarding');
    });

    btnSelectCps.addEventListener('click', () => setTestMode('cps'));
    btnSelectPvt.addEventListener('click', () => setTestMode('pvt'));
    btnSelectAim.addEventListener('click', () => setTestMode('aim'));
    btnSelectStroop.addEventListener('click', () => setTestMode('stroop'));

    btnStartTest.addEventListener('click', () => {
        if (appState.activeTestMode === 'cps') {
            prepareCpsTest();
            showScreen('test');
        } else if (appState.activeTestMode === 'aim') {
            prepareAimTest();
            showScreen('aim');
        } else if (appState.activeTestMode === 'stroop') {
            prepareStroopTest();
            showScreen('stroop');
        } else {
            preparePvtTest();
            showScreen('pvt');
        }
    });

    clickArea.addEventListener('mousedown', handleCpsClick);
    clickArea.addEventListener('touchstart', (e) => { e.preventDefault(); handleCpsClick(e); }, { passive: false });
    
    pvtArea.addEventListener('mousedown', handlePvtClick);
    pvtArea.addEventListener('touchstart', (e) => { e.preventDefault(); handlePvtClick(e); }, { passive: false });

    aimArena.addEventListener('mousedown', handleAimMiss);
    aimArena.addEventListener('touchstart', (e) => { e.preventDefault(); handleAimMiss(e); }, { passive: false });
    
    aimStartBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); startAimTest(e); });
    aimStartBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); startAimTest(e); }, { passive: false });
    aimStartBtn.addEventListener('click', (e) => { e.stopPropagation(); startAimTest(e); });
    
    stroopStartBtn.addEventListener('click', startStroopTest);
    document.querySelectorAll('.stroop-btn').forEach(btn => {
        btn.addEventListener('click', handleStroopChoice);
    });

    btnFinish.addEventListener('click', () => {
        updateDashboard();
        showScreen('dashboard');
    });

    btnChart.addEventListener('click', () => {
        showScreen('chart');
        renderChart();
    });
    btnCloseChart.addEventListener('click', () => showScreen('dashboard'));
    chartTypeFilter.addEventListener('change', renderChart);
    chartTimeFilter.addEventListener('change', renderChart);

    btnLeaderboard.addEventListener('click', () => {
        showScreen('leaderboard');
        fetchAndRenderLeaderboard(currentLbMode);
    });
    btnCloseLeaderboard.addEventListener('click', () => showScreen('dashboard'));
    
    lbTabPvt.addEventListener('click', () => setLbTab('pvt'));
    lbTabCps.addEventListener('click', () => setLbTab('cps'));
    lbTabAim.addEventListener('click', () => setLbTab('aim'));
    lbTabStroop.addEventListener('click', () => setLbTab('stroop'));

    btnAdminReset.addEventListener('click', async () => {
        const pass = prompt("Yönetici Şifresi:");
        if (pass === "7355608") {
            if(confirm('Tüm dünya liderlik tablosunu SIFIRLAMAK istediğine emin misin?')) {
                try {
                    btnAdminReset.textContent = "Sıfırlanıyor...";
                    await fetch(JSONBLOB_URL, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({"name": "cns_tracker", "data": {cps:[], pvt:[], aim:[], stroop:[]}})
                    });
                    alert("Başarıyla Sıfırlandı!");
                    btnAdminReset.textContent = "Tüm Tabloyu Sıfırla (Admin)";
                    fetchAndRenderLeaderboard(currentLbMode);
                } catch (e) {
                    alert("Sunucuya ulaşılamadı.");
                    btnAdminReset.textContent = "Tüm Tabloyu Sıfırla (Admin)";
                }
            }
        } else if (pass !== null) {
            alert("Hatalı şifre!");
        }
    });
}

function setLbTab(mode) {
    currentLbMode = mode;
    lbTabPvt.classList.toggle('active', mode === 'pvt');
    lbTabCps.classList.toggle('active', mode === 'cps');
    lbTabAim.classList.toggle('active', mode === 'aim');
    lbTabStroop.classList.toggle('active', mode === 'stroop');
    fetchAndRenderLeaderboard(mode);
}

function setTestMode(mode) {
    appState.activeTestMode = mode;
    saveState();
    
    btnSelectCps.classList.toggle('active', mode === 'cps');
    btnSelectPvt.classList.toggle('active', mode === 'pvt');
    btnSelectAim.classList.toggle('active', mode === 'aim');
    btnSelectStroop.classList.toggle('active', mode === 'stroop');
    
    if (mode === 'cps') {
        dashboardTestTitle.textContent = "CPS Testi";
        dashboardInstruction.textContent = "5 saniyelik tıklama testi ile sinir sistemi yorgunluğunu ölç.";
    } else if (mode === 'aim') {
        dashboardTestTitle.textContent = "AIM Testi";
        dashboardInstruction.textContent = "Rastgele çıkan hedefleri isabetle ve en hızlı şekilde vur.";
    } else if (mode === 'stroop') {
        dashboardTestTitle.textContent = "Stroop Testi";
        dashboardInstruction.textContent = "Ekranda yazan kelimeyi DEĞİL, kelimenin RENGİNİ hızlıca seç.";
    } else {
        dashboardTestTitle.textContent = "PVT Testi";
        dashboardInstruction.textContent = "Rastgele yanan ışığa en hızlı şekilde tepki ver. (Altın Standart)";
    }
    updateDashboard();
}

// ---------------- CPS TEST LOGIC ----------------
function prepareCpsTest() {
    cpsState.isActive = false; cpsState.clicks = 0; cpsState.timeLeft = CPS_DURATION;
    timeLeftDisplay.textContent = cpsState.timeLeft.toFixed(1);
    clickCountDisplay.textContent = cpsState.clicks;
    clickInstruction.textContent = "BAŞLAMAK İÇİN TIKLA";
    clickArea.classList.remove('active-test');
    clickArea.style.borderColor = clickArea.style.color = clickArea.style.boxShadow = clickArea.style.backgroundColor = '';
}
function handleCpsClick(e) {
    if (!cpsState.isActive && cpsState.timeLeft === CPS_DURATION) startCpsTest();
    if (cpsState.isActive) { cpsState.clicks++; clickCountDisplay.textContent = cpsState.clicks; }
    if (e) createRipple(e, clickArea, cpsState.isActive ? getCpsHue() : 220);
}
function startCpsTest() {
    cpsState.isActive = true; clickInstruction.textContent = ""; clickArea.classList.add('active-test');
    cpsState.timer = setInterval(() => {
        cpsState.timeLeft -= 0.1;
        if (cpsState.timeLeft <= 0) endCpsTest();
        else { timeLeftDisplay.textContent = cpsState.timeLeft.toFixed(1); updateCpsVisuals(); }
    }, 100);
}
function endCpsTest() {
    clearInterval(cpsState.timer); cpsState.isActive = false;
    timeLeftDisplay.textContent = "0.0"; clickArea.classList.remove('active-test');
    processResult(cpsState.clicks / CPS_DURATION, 'cps');
}
function getCpsHue() {
    const elapsed = CPS_DURATION - cpsState.timeLeft;
    let currentCPS = elapsed > 0.1 ? cpsState.clicks / elapsed : 0;
    let hue = 220 - (currentCPS * 15);
    return hue < 0 ? 0 : hue;
}
function updateCpsVisuals() {
    if (!cpsState.isActive) return;
    const hue = getCpsHue();
    clickArea.style.borderColor = clickArea.style.color = `hsl(${hue}, 100%, 50%)`;
    clickArea.style.boxShadow = `0 0 30px hsla(${hue}, 100%, 50%, 0.3), inset 0 0 20px hsla(${hue}, 100%, 50%, 0.3)`;
    clickArea.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.05)`;
}

// ---------------- PVT TEST LOGIC ----------------
function preparePvtTest() {
    const randomAttempts = Math.floor(Math.random() * 3) + 3;
    pvtState = { isActive: true, attempt: 1, maxAttempts: randomAttempts, results: [], timerStart: 0, timeoutId: null, status: 'idle' };
    pvtMaxAttempts.textContent = randomAttempts;
    nextPvtAttempt();
}
function nextPvtAttempt() {
    pvtTitle.textContent = "Hazırlan..."; pvtAttempt.textContent = pvtState.attempt;
    pvtArea.className = 'click-area pvt-waiting'; pvtInstruction.textContent = "BEKLE";
    pvtState.status = 'waiting';
    clearTimeout(pvtState.timeoutId);
    pvtState.timeoutId = setTimeout(() => {
        pvtState.status = 'ready'; pvtArea.className = 'click-area pvt-ready';
        pvtInstruction.textContent = "DOKUN!"; pvtState.timerStart = performance.now();
    }, Math.random() * 8000 + 2000);
}
function handlePvtClick(e) {
    if (!pvtState.isActive) return;
    if (e) createRipple(e, pvtArea, pvtState.status === 'ready' ? 120 : 0);
    if (pvtState.status === 'waiting') {
        clearTimeout(pvtState.timeoutId); pvtArea.className = 'click-area pvt-false-start';
        pvtInstruction.textContent = "ERKEN TIKLADIN!"; pvtState.status = 'idle';
        setTimeout(() => nextPvtAttempt(), 1500);
    } else if (pvtState.status === 'ready') {
        const rt = performance.now() - pvtState.timerStart;
        pvtState.results.push(rt); pvtState.status = 'idle';
        pvtArea.className = 'click-area'; pvtInstruction.textContent = `${Math.round(rt)} ms`;
        setTimeout(() => {
            if (pvtState.attempt < pvtState.maxAttempts) { pvtState.attempt++; nextPvtAttempt(); }
            else endPvtTest();
        }, 1000);
    }
}
function endPvtTest() {
    pvtState.isActive = false;
    processResult(pvtState.results.reduce((a, b) => a + b, 0) / pvtState.results.length, 'pvt');
}

// ---------------- AIM TEST LOGIC ----------------
function prepareAimTest() {
    aimState = { isActive: false, targetsHit: 0, targetsMissed: 0, bombsHit: 0, proMode: aimProMode.checked, totalTargets: 10, times: [], lastSpawnTime: 0 };
    aimRemaining.textContent = "10";
    aimAccuracy.textContent = "100";
    aimArena.innerHTML = '';
    aimArena.appendChild(aimStartBtn);
    aimStartBtn.style.display = 'block';
}

function startAimTest(e) {
    if(e) e.stopPropagation();
    aimState.isActive = true;
    aimStartBtn.style.display = 'none';
    spawnAimTarget();
}

function spawnAimTarget() {
    aimArena.innerHTML = ''; 
    const total = aimState.targetsHit + aimState.targetsMissed;
    if (total >= aimState.totalTargets) return endAimTest();
    
    const target = document.createElement('div');
    target.className = 'aim-target';
    
    const padding = 35; 
    const rect = aimArena.getBoundingClientRect();
    const maxX = rect.width - padding * 2;
    const maxY = rect.height - padding * 2;
    
    const x = Math.max(padding, Math.floor(Math.random() * maxX) + padding);
    const y = Math.max(padding, Math.floor(Math.random() * maxY) + padding);
    
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    
    target.addEventListener('mousedown', handleAimHit);
    target.addEventListener('touchstart', (e) => { e.preventDefault(); handleAimHit(e); }, {passive: false});
    
    aimArena.appendChild(target);
    
    if (aimState.proMode && Math.random() < 0.3) {
        spawnAimBomb(x, y, maxX, maxY, padding);
    }
    
    aimState.lastSpawnTime = performance.now();
}

function spawnAimBomb(tx, ty, maxX, maxY, padding) {
    const bomb = document.createElement('div');
    bomb.className = 'aim-bomb';
    
    let bx, by, distance, attempts = 0;
    do {
        bx = Math.max(padding, Math.floor(Math.random() * maxX) + padding);
        by = Math.max(padding, Math.floor(Math.random() * maxY) + padding);
        distance = Math.sqrt(Math.pow(bx - tx, 2) + Math.pow(by - ty, 2));
        attempts++;
    } while(distance < 80 && attempts < 10);
    
    bomb.style.left = `${bx}px`;
    bomb.style.top = `${by}px`;
    
    bomb.addEventListener('mousedown', handleAimBombHit);
    bomb.addEventListener('touchstart', (e) => { e.preventDefault(); handleAimBombHit(e); }, {passive: false});
    
    aimArena.appendChild(bomb);
}

function handleAimBombHit(e) {
    if (!aimState.isActive) return;
    e.stopPropagation();
    aimState.bombsHit++;
    createRipple(e, aimArena, 0); 
    e.target.remove(); 
}

function handleAimHit(e) {
    if (!aimState.isActive) return;
    e.stopPropagation();
    const rt = performance.now() - aimState.lastSpawnTime;
    aimState.times.push(rt);
    aimState.targetsHit++;
    updateAimUI();
    createRipple(e, aimArena, 120); 
    spawnAimTarget();
}

function handleAimMiss(e) {
    if (!aimState.isActive || e.target === aimStartBtn) return;
    aimState.targetsMissed++;
    updateAimUI();
    createRipple(e, aimArena, 0);
    spawnAimTarget();
}

function updateAimUI() {
    const total = aimState.targetsHit + aimState.targetsMissed;
    const acc = Math.round((aimState.targetsHit / total) * 100);
    aimRemaining.textContent = aimState.totalTargets - total;
    aimAccuracy.textContent = isNaN(acc) ? 100 : acc;
}

function endAimTest() {
    aimState.isActive = false;
    const avgTime = aimState.times.reduce((a,b) => a+b, 0) / aimState.times.length || 1;
    const accuracy = aimState.targetsHit / aimState.totalTargets;
    
    // Yüksek skor daha iyi: 
    // Hız puanı: (10000 / Ortalama Süre) * 100
    // İsabetle çarpılır, bombalar eksi puan getirir (-500)
    let rawScore = (10000 / Math.max(avgTime, 50)) * 100 * accuracy;
    const finalScore = Math.max(0, Math.round(rawScore - (aimState.bombsHit * 500)));
    
    processResult(finalScore, 'aim');
}

// ---------------- STROOP TEST LOGIC ----------------
const STROOP_COLORS = [
    { name: 'KIRMIZI', hex: '#ef4444' },
    { name: 'MAVİ', hex: '#3b82f6' },
    { name: 'YEŞİL', hex: '#22c55e' },
    { name: 'SARI', hex: '#eab308' }
];

function prepareStroopTest() {
    stroopState = { isActive: false, currentRound: 0, totalRounds: 20, times: [], errors: 0, startTime: 0, targetColor: '' };
    stroopRemaining.textContent = "20";
    stroopAccuracy.textContent = "100";
    stroopWordContainer.style.display = 'none';
    stroopButtons.style.display = 'none';
    stroopStartBtn.style.display = 'block';
}

function startStroopTest(e) {
    if(e) e.stopPropagation();
    stroopState.isActive = true;
    stroopStartBtn.style.display = 'none';
    stroopWordContainer.style.display = 'block';
    stroopButtons.style.display = 'grid';
    nextStroopRound();
}

function nextStroopRound() {
    if (stroopState.currentRound >= stroopState.totalRounds) {
        return endStroopTest();
    }
    
    let textObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    let colorObj;
    
    if (Math.random() > 0.4) {
        let others = STROOP_COLORS.filter(c => c.hex !== textObj.hex);
        colorObj = others[Math.floor(Math.random() * others.length)];
    } else {
        colorObj = textObj;
    }
    
    stroopState.targetColor = colorObj.hex;
    stroopWord.textContent = textObj.name;
    stroopWord.style.color = colorObj.hex;
    
    // Animation trigger
    stroopWord.style.animation = 'none';
    stroopWord.offsetHeight; /* reflow */
    stroopWord.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    stroopState.startTime = performance.now();
}

function handleStroopChoice(e) {
    if (!stroopState.isActive) return;
    const clickedColor = e.target.getAttribute('data-color');
    const rxTime = performance.now() - stroopState.startTime;
    
    stroopState.times.push(rxTime);
    stroopState.currentRound++;
    
    if (clickedColor !== stroopState.targetColor) {
        stroopState.errors++;
        createRipple(e, document.getElementById('stroop-arena'), 0); 
    }
    
    const acc = Math.round(((stroopState.currentRound - stroopState.errors) / stroopState.currentRound) * 100);
    stroopRemaining.textContent = stroopState.totalRounds - stroopState.currentRound;
    stroopAccuracy.textContent = acc;
    
    nextStroopRound();
}

function endStroopTest() {
    stroopState.isActive = false;
    stroopWordContainer.style.display = 'none';
    stroopButtons.style.display = 'none';
    
    const avgTime = stroopState.times.reduce((a,b) => a+b, 0) / stroopState.times.length || 1;
    const accuracy = (stroopState.totalRounds - stroopState.errors) / stroopState.totalRounds;
    
    let rawScore = (20000 / Math.max(avgTime, 200)) * 100 * accuracy;
    let finalScore = Math.max(0, Math.round(rawScore - (stroopState.errors * 500)));
    
    processResult(finalScore, 'stroop');
}

// ---------------- COMMON LOGIC ----------------
function createRipple(e, container, hue) {
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches.length > 0 ? e.touches[0].clientX : rect.left + rect.width / 2);
    const clientY = e.clientY || (e.touches && e.touches.length > 0 ? e.touches[0].clientY : rect.top + rect.height / 2);
    const x = clientX - rect.left, y = clientY - rect.top;
    
    const circle = document.createElement('span');
    circle.classList.add('ripple');
    const diameter = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x - diameter/2}px`;
    circle.style.top = `${y - diameter/2}px`;
    circle.style.backgroundColor = `hsla(${hue}, 100%, 70%, 0.4)`;
    
    container.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

function calculateCpsBaseline() {
    if (!appState.profile) return 5.5;
    const cpsHistory = appState.history.filter(h => h.type === 'cps');
    if (cpsHistory.length >= 3) {
        return cpsHistory.slice(0, 5).reduce((a, c) => a + c.score, 0) / cpsHistory.slice(0,5).length;
    }
    let base = 5.5;
    if (appState.profile.sport === 'mid') base += 0.5;
    if (appState.profile.sport === 'high') base += 1.0;
    if (appState.profile.game === 'mid') base += 1.0;
    if (appState.profile.game === 'high') base += 2.0;
    return base;
}

function processResult(score, type) {
    let statusClass = '', statusText = '', recText = '';

    if (type === 'cps') {
        const ratio = score / calculateCpsBaseline();
        if (ratio >= 0.95) {
            statusClass = 'good'; statusText = 'Harika Durumda! 🟢';
            recText = 'Merkezi sinir sistemin tamamen dinlenmiş ve tepki sürelerin çok yüksek. Maksimum sinirsel aktivasyon sağlanıyor.';
        } else if (ratio >= 0.85) {
            statusClass = 'normal'; statusText = 'Normal Seviyede 🟡';
            recText = 'Merkezi sinir sistemin olağan durumunda. Herhangi bir yorgunluk veya belirgin yavaşlama belirtisi yok.';
        } else {
            statusClass = 'fatigued'; statusText = 'Yorgun Tespit Edildi 🔴';
            recText = 'Merkezi sinir sisteminde yavaşlama tespit edildi. Motor nöron uyarımında gecikmeler yaşanıyor, CNS yorgun.';
        }
        resultScoreValue.textContent = score.toFixed(1);
        resultScoreUnit.textContent = 'CPS';
    } else if (type === 'pvt') {
        if (score <= 300) {
            statusClass = 'good'; statusText = 'Kusursuz Reaksiyon! 🟢';
            recText = 'Motor nöron ateşlemelerin zirvede. Uyaranlara verdiğin tepki süresi kusursuz ve çok hızlı.';
        } else if (score <= 400) {
            statusClass = 'normal'; statusText = 'Normal Reaksiyon 🟡';
            recText = 'Sistemin uyanık ve sağlıklı. Reaksiyon sürelerin standart sınırlar içerisinde.';
        } else {
            statusClass = 'fatigued'; statusText = 'CNS BİTKİN! 🔴';
            recText = 'Motor nöron ateşlemesi gecikiyor (Lapse). Merkezi sinir sistemin bitkin durumda ve tepki sürelerin çok uzamış.';
        }
        resultScoreValue.textContent = Math.round(score);
        resultScoreUnit.textContent = 'MS';
    } else if (type === 'aim') {
        const avgTime = aimState.times.reduce((a,b) => a+b, 0) / aimState.times.length || 1;
        const accuracy = aimState.totalTargets > 0 ? (aimState.targetsHit / aimState.totalTargets) : 1;
        const speedScore = (10000 / Math.max(avgTime, 50)) * 100;
        
        const lossSpeed = Math.max(0, 3500 - speedScore);
        const lossAcc = speedScore * (1 - accuracy);
        const lossBombs = aimState.bombsHit * 500;
        const totalLoss = lossSpeed + lossAcc + lossBombs;

        let causeText = "";
        if (totalLoss > 0 && score < 2500) {
            let pSpeed = Math.round((lossSpeed / totalLoss) * 100);
            let pAcc = Math.round((lossAcc / totalLoss) * 100);
            let pBomb = Math.round((lossBombs / totalLoss) * 100);
            
            causeText = `<br><br><strong style="color:var(--danger)">Performans Düşüş Nedeni:</strong><br>`;
            if (pSpeed > 0) causeText += `• %${pSpeed} Reaksiyon Yavaşlığı (CNS Gecikmesi)<br>`;
            if (pAcc > 0) causeText += `• %${pAcc} İsabet Düşüklüğü (Tremor/Odak Kaybı)<br>`;
            if (pBomb > 0) causeText += `• %${pBomb} Dürtü Kontrolü Hatası (Bombalar)`;
        }

        if (score >= 2500) {
            statusClass = 'good'; statusText = 'El-Göz Koordinasyonu Zirvede 🟢';
            recText = 'Motor becerilerin kusursuz işliyor. Hem çok hızlı hem de isabetlisin. Merkezi sinir sistemi ateşlemesi ve koordinasyonu en üst düzeyde.';
        } else if (score >= 1500) {
            statusClass = 'normal'; statusText = 'Normal Koordinasyon 🟡';
            recText = 'İsabet ve hız dengen standart sınırlar içerisinde. İnce motor becerilerin ve sinir iletimi normal seviyede çalışıyor.' + causeText;
        } else {
            statusClass = 'fatigued'; statusText = 'Odak Kaybı / Titreme 🔴';
            recText = 'Sistemde belirgin bir yavaşlama veya isabet sorunu var. Sinir sistemin bitkin, motor becerilerin ve nöral iletim zayıflamış.' + causeText;
        }
        resultScoreValue.textContent = Math.round(score);
        resultScoreUnit.textContent = 'Puan';
    } else if (type === 'stroop') {
        const avgTime = stroopState.times.reduce((a,b) => a+b, 0) / stroopState.times.length || 1;
        const accuracy = (stroopState.totalRounds - stroopState.errors) / stroopState.totalRounds;
        
        let causeText = "";
        if (score < 2500 && stroopState.errors > 0) {
            causeText = `<br><br><strong style="color:var(--danger)">Hata Analizi:</strong><br>Toplam ${stroopState.errors} renk çelişkisi hatası yapıldı. Frontal lob kararlarında bozulma var.`;
        }

        if (score >= 3000) {
            statusClass = 'good'; statusText = 'Mükemmel Bilişsel Hız 🟢';
            recText = 'Ön lob ateşlemesi muazzam. Herhangi bir beyin sisi (brain fog) yok, bilişsel işlem süreci tamamen kusursuz.';
        } else if (score >= 2000) {
            statusClass = 'normal'; statusText = 'Normal Bilişsel Hız 🟡';
            recText = 'Bilişsel karar alma mekanizması standart seviyede. Frontal lob kararlı çalışıyor.' + causeText;
        } else {
            statusClass = 'fatigued'; statusText = 'Ağır Beyin Sisi 🔴';
            recText = 'Ağır BEYİN SİSİ tespit edildi. Frontal lob kelime/renk çelişkisini çözmekte çok yavaş kalıyor veya çok fazla hata yapıyor. CNS çok yorgun.' + causeText;
        }
        resultScoreValue.textContent = Math.round(score);
        resultScoreUnit.textContent = 'Puan';
    }

    resultScoreSection.className = `result-score score-${statusClass}`;
    resultFatigueStatus.textContent = statusText;
    resultRecommendation.innerHTML = recText;

    appState.history.unshift({ date: new Date().toISOString(), type, score, status: statusClass, proMode: type === 'aim' ? aimState.proMode : false });
    saveState();

    if (appState.profile && appState.profile.leaderboardOptIn) {
        if (!(type === 'aim' && aimState.proMode)) {
            syncLeaderboard(score, type, appState.profile.username);
        }
    }

    showScreen('result');
}

function updateDashboard() {
    const type = appState.activeTestMode;
    const history = appState.history.filter(h => h.type === type);
    
    if (type === 'cps') {
        statBaseline.textContent = calculateCpsBaseline().toFixed(1);
        statLast.textContent = history.length > 0 ? history[0].score.toFixed(1) : '--';
    } else if (type === 'pvt') {
        statBaseline.textContent = '< 300';
        statLast.textContent = history.length > 0 ? Math.round(history[0].score) : '--';
    } else if (type === 'aim') {
        statBaseline.textContent = '> 2500';
        statLast.textContent = history.length > 0 ? Math.round(history[0].score) : '--';
    } else if (type === 'stroop') {
        statBaseline.textContent = '> 3000';
        statLast.textContent = history.length > 0 ? Math.round(history[0].score) : '--';
    }

    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<li class="history-item"><span class="history-date">Henüz test yapılmadı.</span></li>';
        return;
    }

    history.forEach(item => {
        const d = new Date(item.date);
        const dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        let valStr = `${Math.round(item.score)} Puan`;
        if (type === 'cps') valStr = `${item.score.toFixed(1)} CPS`;
        else if (type === 'pvt') valStr = `${Math.round(item.score)} ms`;
        
        let labelAdd = '';
        if (type === 'aim' && item.proMode) labelAdd = ' <span style="font-size:0.6rem; color:var(--danger); border:1px solid var(--danger); border-radius:4px; padding:1px 3px; vertical-align:middle; margin-left:4px;">PRO</span>';

        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<span class="history-date">${dateStr}${labelAdd}</span><span class="history-score score-${item.status}">${valStr}</span>`;
        historyList.appendChild(li);
    });
}

// ---------------- CHART LOGIC ----------------
function renderChart() {
    const type = chartTypeFilter.value, limit = chartTimeFilter.value;
    let dataList = appState.history.filter(h => h.type === type).reverse();
    if (limit !== 'all') dataList = dataList.slice(-parseInt(limit));

    const labels = dataList.map(i => { const d=new Date(i.date); return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}` });
    const dataPoints = dataList.map(i => i.score);
    const ctx = chartCanvas.getContext('2d');
    
    if (myChart) myChart.destroy();
    
    let lineColor = '#3b82f6';
    let gradientStart = 'rgba(59, 130, 246, 0.5)';
    let chartLabel = 'Hız (CPS)';
    let unit = ' CPS';
    
    if (type === 'pvt') {
        lineColor = '#ef4444';
        gradientStart = 'rgba(239, 68, 68, 0.5)';
        chartLabel = 'Reaksiyon (ms)';
        unit = ' ms';
    } else if (type === 'aim') {
        lineColor = '#10b981';
        gradientStart = 'rgba(16, 185, 129, 0.5)';
        chartLabel = 'AIM Puanı';
        unit = ' Puan';
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, gradientStart);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: chartLabel,
                data: dataPoints,
                borderColor: lineColor, backgroundColor: gradient,
                borderWidth: 3, fill: true, tension: 0.3,
                pointBackgroundColor: '#1e293b', pointBorderColor: lineColor,
                pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { theme: 'dark', backgroundColor: 'rgba(15, 23, 42, 0.9)', bodyFont: { weight: 'bold' }, callbacks: { label: c => c.parsed.y + unit } } },
            scales: { y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } } }
        }
    });
}

// ---------------- LEADERBOARD LOGIC ----------------
async function syncLeaderboard(score, type, username) {
    try {
        const res = await fetch(JSONBLOB_URL);
        const json = await res.json();
        const data = json.data;
        
        if (!data.aim) data.aim = [];
        if (!data.stroop) data.stroop = [];
        
        const i = data[type].findIndex(u => u.username === username);
        let updated = false;
        
        if (i > -1) {
            const old = data[type][i].score;
            if ((type === 'pvt' && score < old) || (type === 'aim' && score > old) || (type === 'cps' && score > old) || (type === 'stroop' && score > old)) {
                data[type][i].score = score;
                data[type][i].date = new Date().toISOString();
                updated = true;
            }
        } else {
            data[type].push({ username, score, date: new Date().toISOString() });
            updated = true;
        }

        if (updated) {
            await fetch(JSONBLOB_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({"name": "cns_tracker", "data": data})
            });
        }
    } catch (e) {
        console.error("Leaderboard Sync Error:", e);
    }
}

async function fetchAndRenderLeaderboard(type) {
    leaderboardList.innerHTML = '';
    lbLoading.classList.remove('hidden');
    
    const uname = appState.profile ? appState.profile.username.toLowerCase() : '';
    if (uname === 'apoben' || uname === 'apobenn') {
        btnAdminReset.classList.remove('hidden');
    } else {
        btnAdminReset.classList.add('hidden');
    }

    try {
        const res = await fetch(JSONBLOB_URL);
        const json = await res.json();
        let list = json.data[type] || [];
        
        if (type === 'pvt') list.sort((a, b) => a.score - b.score);
        else list.sort((a, b) => b.score - a.score); // cps and aim
        
        list = list.slice(0, 20);
        
        lbLoading.classList.add('hidden');
        if (list.length === 0) {
            leaderboardList.innerHTML = '<li class="history-item"><span class="history-date">Henüz kayıt yok. İlk sen ol!</span></li>';
            return;
        }
        
        list.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `history-item ${index < 3 ? 'lb-rank-'+(index+1) : ''}`;
            
            let rankMedal = `#${index+1}`;
            if (index === 0) rankMedal = '🥇';
            if (index === 1) rankMedal = '🥈';
            if (index === 2) rankMedal = '🥉';
            
            let valStr = `${Math.round(item.score)} Puan`;
            if (type === 'cps') valStr = `${item.score.toFixed(1)} CPS`;
            else if (type === 'pvt') valStr = `${Math.round(item.score)} ms`;
            
            // Aim colors: >=2500 good, <1500 bad
            let scoreClass = '';
            if (type === 'pvt') scoreClass = item.score > 400 ? 'score-fatigued' : (item.score <= 300 ? 'score-good' : '');
            else if (type === 'aim') scoreClass = item.score < 1500 ? 'score-fatigued' : (item.score >= 2500 ? 'score-good' : '');
            else if (type === 'stroop') scoreClass = item.score < 2000 ? 'score-fatigued' : (item.score >= 3000 ? 'score-good' : '');
            
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap: 10px;">
                    <span style="font-size: 1.5rem; width:35px; text-align:center;">${rankMedal}</span>
                    <span class="lb-item-name">${item.username}</span>
                </div>
                <span class="lb-item-score ${scoreClass}">${valStr}</span>
            `;
            leaderboardList.appendChild(li);
        });
    } catch (e) {
        lbLoading.classList.add('hidden');
        leaderboardList.innerHTML = '<li class="history-item"><span class="history-date" style="color:var(--danger)">Sunucuya bağlanılamadı!</span></li>';
    }
}

document.addEventListener('DOMContentLoaded', init);
