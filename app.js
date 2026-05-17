// DOM Elements
const screens = {
    onboarding: document.getElementById('screen-onboarding'),
    dashboard: document.getElementById('screen-dashboard'),
    test: document.getElementById('screen-test'),
    pvt: document.getElementById('screen-pvt'),
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

// Result Elements
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
const lbLoading = document.getElementById('lb-loading');
const leaderboardList = document.getElementById('leaderboard-list');
const btnAdminReset = document.getElementById('btn-admin-reset');

// Constants
const JSONBLOB_URL = 'https://jsonblob.com/api/jsonBlob/019e34b7-3973-7b26-9d49-50d4e92b84ca';
let currentLbMode = 'pvt';

// State
let appState = {
    profile: null, // { sport, game, username, leaderboardOptIn }
    history: [],   
    activeTestMode: 'pvt' 
};

let cpsState = {
    isActive: false,
    clicks: 0,
    timeLeft: 5.0,
    timer: null
};

let pvtState = {
    isActive: false,
    attempt: 1,
    maxAttempts: 3,
    results: [],
    timerStart: 0,
    timeoutId: null,
    status: 'idle' 
};

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
        if(s) s.classList.add('hidden')
    });
    screens[screenName].classList.remove('hidden');
}

function loadState() {
    const saved = localStorage.getItem('cns_tracker_data');
    if (saved) {
        appState = JSON.parse(saved);
        appState.history.forEach(item => {
            if (!item.type) item.type = 'cps';
            if (item.cps !== undefined) {
                item.score = item.cps;
                delete item.cps;
            }
        });
        if (!appState.activeTestMode) appState.activeTestMode = 'pvt';
    }
}

function saveState() {
    localStorage.setItem('cns_tracker_data', JSON.stringify(appState));
}

// Event Listeners
function setupEventListeners() {
    // Onboarding Checkbox
    leaderboardCheckbox.addEventListener('change', (e) => {
        if(e.target.checked) usernameContainer.classList.remove('hidden');
        else usernameContainer.classList.add('hidden');
    });

    // Profil Kaydet
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

    // Ayarları İptal Et
    btnCancelSettings.addEventListener('click', () => showScreen('dashboard'));

    // Ayarları Aç
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

    // Test Seçiciler
    btnSelectCps.addEventListener('click', () => setTestMode('cps'));
    btnSelectPvt.addEventListener('click', () => setTestMode('pvt'));

    // Testi Başlat
    btnStartTest.addEventListener('click', () => {
        if (appState.activeTestMode === 'cps') {
            prepareCpsTest();
            showScreen('test');
        } else {
            preparePvtTest();
            showScreen('pvt');
        }
    });

    // Tıklama Alanları
    clickArea.addEventListener('mousedown', handleCpsClick);
    clickArea.addEventListener('touchstart', (e) => { e.preventDefault(); handleCpsClick(e); }, { passive: false });
    pvtArea.addEventListener('mousedown', handlePvtClick);
    pvtArea.addEventListener('touchstart', (e) => { e.preventDefault(); handlePvtClick(e); }, { passive: false });

    // Sonucu Kapat
    btnFinish.addEventListener('click', () => {
        updateDashboard();
        showScreen('dashboard');
    });

    // Grafik
    btnChart.addEventListener('click', () => {
        showScreen('chart');
        renderChart();
    });
    btnCloseChart.addEventListener('click', () => showScreen('dashboard'));
    chartTypeFilter.addEventListener('change', renderChart);
    chartTimeFilter.addEventListener('change', renderChart);

    // Liderlik Tablosu
    btnLeaderboard.addEventListener('click', () => {
        showScreen('leaderboard');
        fetchAndRenderLeaderboard(currentLbMode);
    });
    btnCloseLeaderboard.addEventListener('click', () => showScreen('dashboard'));
    lbTabPvt.addEventListener('click', () => {
        currentLbMode = 'pvt';
        lbTabPvt.classList.add('active');
        lbTabCps.classList.remove('active');
        fetchAndRenderLeaderboard('pvt');
    });
    lbTabCps.addEventListener('click', () => {
        currentLbMode = 'cps';
        lbTabCps.classList.add('active');
        lbTabPvt.classList.remove('active');
        fetchAndRenderLeaderboard('cps');
    });

    btnAdminReset.addEventListener('click', async () => {
        if(confirm('Tüm dünya liderlik tablosunu SIFIRLAMAK istediğine emin misin?')) {
            try {
                await fetch(JSONBLOB_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({cps:[], pvt:[]})
                });
                alert("Sıfırlandı.");
                fetchAndRenderLeaderboard(currentLbMode);
            } catch (e) {
                alert("Hata oluştu.");
            }
        }
    });
}

function setTestMode(mode) {
    appState.activeTestMode = mode;
    saveState();
    if (mode === 'cps') {
        btnSelectCps.classList.add('active');
        btnSelectPvt.classList.remove('active');
        dashboardTestTitle.textContent = "CPS Testi";
        dashboardInstruction.textContent = "5 saniyelik tıklama testi ile sinir sistemi yorgunluğunu ölç.";
    } else {
        btnSelectPvt.classList.add('active');
        btnSelectCps.classList.remove('active');
        dashboardTestTitle.textContent = "PVT Testi";
        dashboardInstruction.textContent = "Rastgele yanan ışığa en hızlı şekilde tepki ver. (Altın Standart)";
    }
    updateDashboard();
}

// ---------------- CPS TEST LOGIC ----------------
function prepareCpsTest() {
    cpsState.isActive = false;
    cpsState.clicks = 0;
    cpsState.timeLeft = CPS_DURATION;
    timeLeftDisplay.textContent = cpsState.timeLeft.toFixed(1);
    clickCountDisplay.textContent = cpsState.clicks;
    clickInstruction.textContent = "BAŞLAMAK İÇİN TIKLA";
    clickArea.classList.remove('active-test');
    clickArea.style.borderColor = clickArea.style.color = clickArea.style.boxShadow = clickArea.style.backgroundColor = '';
}

function handleCpsClick(e) {
    if (!cpsState.isActive && cpsState.timeLeft === CPS_DURATION) startCpsTest();
    if (cpsState.isActive) {
        cpsState.clicks++;
        clickCountDisplay.textContent = cpsState.clicks;
    }
    if (e) createRipple(e, clickArea, cpsState.isActive ? getCpsHue() : 220);
}

function startCpsTest() {
    cpsState.isActive = true;
    clickInstruction.textContent = "";
    clickArea.classList.add('active-test');
    cpsState.timer = setInterval(() => {
        cpsState.timeLeft -= 0.1;
        if (cpsState.timeLeft <= 0) {
            endCpsTest();
        } else {
            timeLeftDisplay.textContent = cpsState.timeLeft.toFixed(1);
            updateCpsVisuals();
        }
    }, 100);
}

function endCpsTest() {
    clearInterval(cpsState.timer);
    cpsState.isActive = false;
    timeLeftDisplay.textContent = "0.0";
    clickArea.classList.remove('active-test');
    processResult(cpsState.clicks / CPS_DURATION, 'cps');
}

function getCpsHue() {
    const elapsed = CPS_DURATION - cpsState.timeLeft;
    let currentCPS = elapsed > 0.1 ? cpsState.clicks / elapsed : 0;
    let hue = 220 - (currentCPS * 15);
    if (hue < 0) hue = 0;
    return hue;
}

function updateCpsVisuals() {
    if (!cpsState.isActive) return;
    const hue = getCpsHue();
    const colorStr = `hsl(${hue}, 100%, 50%)`;
    const glowStr = `hsla(${hue}, 100%, 50%, 0.3)`;
    clickArea.style.borderColor = clickArea.style.color = colorStr;
    clickArea.style.boxShadow = `0 0 30px ${glowStr}, inset 0 0 20px ${glowStr}`;
    clickArea.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.05)`;
}

// ---------------- PVT TEST LOGIC ----------------
function preparePvtTest() {
    const randomAttempts = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    pvtState = {
        isActive: true,
        attempt: 1,
        maxAttempts: randomAttempts,
        results: [],
        timerStart: 0,
        timeoutId: null,
        status: 'idle'
    };
    pvtMaxAttempts.textContent = randomAttempts;
    nextPvtAttempt();
}

function nextPvtAttempt() {
    pvtTitle.textContent = "Hazırlan...";
    pvtAttempt.textContent = pvtState.attempt;
    pvtArea.className = 'click-area pvt-waiting';
    pvtInstruction.textContent = "BEKLE";
    pvtState.status = 'waiting';

    const delay = Math.random() * 8000 + 2000; 
    clearTimeout(pvtState.timeoutId);
    pvtState.timeoutId = setTimeout(() => {
        pvtState.status = 'ready';
        pvtArea.className = 'click-area pvt-ready';
        pvtInstruction.textContent = "DOKUN!";
        pvtState.timerStart = performance.now();
    }, delay);
}

function handlePvtClick(e) {
    if (!pvtState.isActive) return;
    if (e) createRipple(e, pvtArea, pvtState.status === 'ready' ? 120 : 0);

    if (pvtState.status === 'waiting') {
        clearTimeout(pvtState.timeoutId);
        pvtArea.className = 'click-area pvt-false-start';
        pvtInstruction.textContent = "ERKEN TIKLADIN!";
        pvtState.status = 'idle';
        setTimeout(() => nextPvtAttempt(), 1500);
    } 
    else if (pvtState.status === 'ready') {
        const rt = performance.now() - pvtState.timerStart;
        pvtState.results.push(rt);
        pvtState.status = 'idle';
        pvtArea.className = 'click-area';
        pvtInstruction.textContent = `${Math.round(rt)} ms`;
        
        setTimeout(() => {
            if (pvtState.attempt < pvtState.maxAttempts) {
                pvtState.attempt++;
                nextPvtAttempt();
            } else {
                endPvtTest();
            }
        }, 1000);
    }
}

function endPvtTest() {
    pvtState.isActive = false;
    const avgRt = pvtState.results.reduce((a, b) => a + b, 0) / pvtState.results.length;
    processResult(avgRt, 'pvt');
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
    } else {
        if (score <= 250) {
            statusClass = 'good'; statusText = 'Kusursuz Reaksiyon! 🟢';
            recText = 'Motor nöron ateşlemelerin zirvede. Uyaranlara verdiğin tepki süresi kusursuz ve çok hızlı.';
        } else if (score <= 350) {
            statusClass = 'normal'; statusText = 'Normal Reaksiyon 🟡';
            recText = 'Sistemin uyanık ve sağlıklı. Reaksiyon sürelerin standart sınırlar içerisinde.';
        } else {
            statusClass = 'fatigued'; statusText = 'CNS BİTKİN! 🔴';
            recText = 'Motor nöron ateşlemesi gecikiyor (Lapse). Merkezi sinir sistemin bitkin durumda ve tepki sürelerin çok uzamış.';
        }
        resultScoreValue.textContent = Math.round(score);
        resultScoreUnit.textContent = 'MS';
    }

    resultFatigueStatus.className = `status-title ${statusClass}`;
    resultFatigueStatus.textContent = statusText;
    resultRecommendation.textContent = recText;

    appState.history.unshift({ date: new Date().toISOString(), type, score, status: statusClass });
    saveState();

    if (appState.profile && appState.profile.leaderboardOptIn) {
        syncLeaderboard(score, type, appState.profile.username);
    }

    showScreen('result');
}

function updateDashboard() {
    const type = appState.activeTestMode;
    const history = appState.history.filter(h => h.type === type);
    
    if (type === 'cps') {
        statBaseline.textContent = calculateCpsBaseline().toFixed(1);
        statLast.textContent = history.length > 0 ? history[0].score.toFixed(1) : '--';
    } else {
        statBaseline.textContent = '< 250';
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
        const valStr = type === 'cps' ? `${item.score.toFixed(1)} CPS` : `${Math.round(item.score)} ms`;
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<span class="history-date">${dateStr}</span><span class="history-score score-${item.status}">${valStr}</span>`;
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
    const isPVT = type === 'pvt';
    const lineColor = isPVT ? '#ef4444' : '#3b82f6';
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, isPVT ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: isPVT ? 'Reaksiyon (ms)' : 'Hız (CPS)',
                data: dataPoints,
                borderColor: lineColor, backgroundColor: gradient,
                borderWidth: 3, fill: true, tension: 0.3,
                pointBackgroundColor: '#1e293b', pointBorderColor: lineColor,
                pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { theme: 'dark', backgroundColor: 'rgba(15, 23, 42, 0.9)', bodyFont: { weight: 'bold' }, callbacks: { label: c => c.parsed.y + (isPVT?' ms':' CPS') } } },
            scales: { y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } } }
        }
    });
}

// ---------------- LEADERBOARD LOGIC ----------------
async function syncLeaderboard(score, type, username) {
    try {
        const res = await fetch(JSONBLOB_URL);
        const data = await res.json();
        
        const i = data[type].findIndex(u => u.username === username);
        let updated = false;
        
        if (i > -1) {
            const old = data[type][i].score;
            if ((type === 'pvt' && score < old) || (type === 'cps' && score > old)) {
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
                body: JSON.stringify(data)
            });
        }
    } catch (e) {
        console.error("Leaderboard Sync Error:", e);
    }
}

async function fetchAndRenderLeaderboard(type) {
    leaderboardList.innerHTML = '';
    lbLoading.classList.remove('hidden');
    
    if (appState.profile && appState.profile.username === 'ApoBen') {
        btnAdminReset.classList.remove('hidden');
    } else {
        btnAdminReset.classList.add('hidden');
    }

    try {
        const res = await fetch(JSONBLOB_URL);
        const data = await res.json();
        let list = data[type] || [];
        
        if (type === 'pvt') list.sort((a, b) => a.score - b.score);
        else list.sort((a, b) => b.score - a.score);
        
        list = list.slice(0, 20); // İlk 20 kişi
        
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
            
            const valStr = type === 'cps' ? `${item.score.toFixed(1)} CPS` : `${Math.round(item.score)} ms`;
            
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap: 10px;">
                    <span style="font-size: 1.5rem; width:35px; text-align:center;">${rankMedal}</span>
                    <span class="lb-item-name">${item.username}</span>
                </div>
                <span class="lb-item-score ${type==='pvt'&&item.score>350?'score-fatigued':type==='pvt'&&item.score<=250?'score-good':''}">${valStr}</span>
            `;
            leaderboardList.appendChild(li);
        });
    } catch (e) {
        lbLoading.classList.add('hidden');
        leaderboardList.innerHTML = '<li class="history-item"><span class="history-date" style="color:var(--danger)">Sunucuya bağlanılamadı!</span></li>';
    }
}

document.addEventListener('DOMContentLoaded', init);
