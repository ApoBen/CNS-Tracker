// DOM Elements
const screens = {
    onboarding: document.getElementById('screen-onboarding'),
    dashboard: document.getElementById('screen-dashboard'),
    test: document.getElementById('screen-test'),
    pvt: document.getElementById('screen-pvt'),
    result: document.getElementById('screen-result'),
    chart: document.getElementById('screen-chart')
};

// Onboarding Elements
const sportSelect = document.getElementById('sport-level');
const gameSelect = document.getElementById('game-level');
const btnSaveProfile = document.getElementById('btn-save-profile');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const onboardingTitle = document.getElementById('onboarding-title');

// Dashboard Elements
const btnSettings = document.getElementById('btn-settings');
const btnChart = document.getElementById('btn-chart');
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

// State
let appState = {
    profile: null, // { sport: 'low'|'mid'|'high', game: 'low'|'mid'|'high' }
    history: [],   // [{ date: string, type: 'cps'|'pvt', score: number, status: string }]
    activeTestMode: 'pvt' // 'cps' | 'pvt'
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
    status: 'idle' // 'idle', 'waiting', 'ready'
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

// Navigation
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

// State Management
function loadState() {
    const saved = localStorage.getItem('cns_tracker_data');
    if (saved) {
        appState = JSON.parse(saved);
        // Legacy data check
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
    // Profil Kaydet
    btnSaveProfile.addEventListener('click', () => {
        appState.profile = { sport: sportSelect.value, game: gameSelect.value };
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

    // CPS Tıklama Alanı
    clickArea.addEventListener('mousedown', handleCpsClick);
    clickArea.addEventListener('touchstart', (e) => { e.preventDefault(); handleCpsClick(e); }, { passive: false });

    // PVT Tıklama Alanı
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
}

// Dashboard Mode Switching
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
    
    clickArea.style.borderColor = '';
    clickArea.style.color = '';
    clickArea.style.boxShadow = '';
    clickArea.style.backgroundColor = '';
}

function handleCpsClick(e) {
    if (!cpsState.isActive && cpsState.timeLeft === CPS_DURATION) {
        startCpsTest();
    }
    
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
    
    const cps = cpsState.clicks / CPS_DURATION;
    processResult(cps, 'cps');
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
    
    clickArea.style.borderColor = colorStr;
    clickArea.style.color = colorStr;
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

    const delay = Math.random() * 8000 + 2000; // 2s - 10s
    
    clearTimeout(pvtState.timeoutId);
    pvtState.timeoutId = setTimeout(() => {
        // GO!
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
        // False start
        clearTimeout(pvtState.timeoutId);
        pvtArea.className = 'click-area pvt-false-start';
        pvtInstruction.textContent = "ERKEN TIKLADIN!";
        pvtState.status = 'idle';
        
        setTimeout(() => {
            nextPvtAttempt(); // Restart current attempt
        }, 1500);
    } 
    else if (pvtState.status === 'ready') {
        // Valid reaction
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
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
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
        const recent = cpsHistory.slice(0, 5);
        return recent.reduce((a, c) => a + c.score, 0) / recent.length;
    }
    let base = 5.5;
    if (appState.profile.sport === 'mid') base += 0.5;
    if (appState.profile.sport === 'high') base += 1.0;
    if (appState.profile.game === 'mid') base += 1.0;
    if (appState.profile.game === 'high') base += 2.0;
    return base;
}

function processResult(score, type) {
    let statusClass = '';
    let statusText = '';
    let recText = '';

    if (type === 'cps') {
        const baseline = calculateCpsBaseline();
        const ratio = score / baseline;
        if (ratio >= 0.95) {
            statusClass = 'good'; statusText = 'Harika Durumda! 🟢';
            recText = 'Merkezi sinir sistemin tamamen dinlenmiş durumda. Bugün ağır antrenman yapabilir, PR deneyebilirsin.';
        } else if (ratio >= 0.85) {
            statusClass = 'normal'; statusText = 'Normal Seviyede 🟡';
            recText = 'Sistemin standart çalışıyor. Normal hipertrofi/güç antrenman programını eksiksiz uygulayabilirsin.';
        } else {
            statusClass = 'fatigued'; statusText = 'Yorgun Tespit Edildi 🔴';
            recText = 'Sinir sistemin henüz toparlanmamış. Ağırlıkları %15-20 düşürmeli veya bugün aktif dinlenme yapmalısın.';
        }
        resultScoreValue.textContent = score.toFixed(1);
        resultScoreUnit.textContent = 'CPS';
    } else {
        // PVT
        if (score <= 250) {
            statusClass = 'good'; statusText = 'Kusursuz Reaksiyon! 🟢';
            recText = 'Motor nöron ateşlemelerin zirvede. Bugün maksimum ağırlıklara (1RM) girmek için mükemmel bir gün.';
        } else if (score <= 350) {
            statusClass = 'normal'; statusText = 'Normal Reaksiyon 🟡';
            recText = 'Sistemin uyanık ve sağlıklı. Planladığın standart antrenmanı yapabilirsin.';
        } else {
            statusClass = 'fatigued'; statusText = 'CNS BİTKİN! 🔴';
            recText = 'Motor nöron ateşlemesi gecikiyor (Lapse). Kesinlikle ağır kiloya girme! Sadece çok hafif kan pompalama veya tam dinlenme.';
        }
        resultScoreValue.textContent = Math.round(score);
        resultScoreUnit.textContent = 'MS';
    }

    resultFatigueStatus.className = `status-title ${statusClass}`;
    resultFatigueStatus.textContent = statusText;
    resultRecommendation.textContent = recText;

    appState.history.unshift({
        date: new Date().toISOString(),
        type: type,
        score: score,
        status: statusClass
    });
    saveState();

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
    const type = chartTypeFilter.value;
    const limit = chartTimeFilter.value;
    
    let dataList = appState.history.filter(h => h.type === type);
    
    // Reverse because history is newest first, but chart should read left-to-right (oldest to newest)
    dataList.reverse();
    
    if (limit !== 'all') {
        dataList = dataList.slice(-parseInt(limit));
    }

    const labels = dataList.map(item => {
        const d = new Date(item.date);
        return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`;
    });

    const dataPoints = dataList.map(item => item.score);

    const ctx = chartCanvas.getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }

    // Colors
    const isPVT = type === 'pvt';
    // For PVT, lower is better. For CPS, higher is better.
    const lineColor = isPVT ? '#ef4444' : '#3b82f6';
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, isPVT ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: isPVT ? 'Reaksiyon Süresi (ms)' : 'Tıklama Hızı (CPS)',
                data: dataPoints,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.3, // smooth curves
                pointBackgroundColor: '#1e293b',
                pointBorderColor: lineColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    theme: 'dark',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#94a3b8',
                    bodyFont: { size: 14, weight: 'bold' },
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + (isPVT ? ' ms' : ' CPS');
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' },
                    reverse: isPVT // In PVT, lower time is better, so reversing the scale visually makes sense, but standard charts don't always do this. Let's not reverse it so standard expectations apply.
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Initial setup call
document.addEventListener('DOMContentLoaded', init);
