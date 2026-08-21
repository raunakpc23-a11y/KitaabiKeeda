document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. STATE & STORAGE INITIALIZATION
    // ==========================================
    let masterLibrary = [];
    let currentRoot = "CLASS 10"; 
    let currentSubject = "All";
    let completedBooks = JSON.parse(localStorage.getItem('library-completed')) || [];
    let starredBooks = JSON.parse(localStorage.getItem('library-starred')) || [];
    let searchTimeout;
    let isTreeExpanded = false; 
    let isSplitActive = false;

    // Study Analytics State
    let studyStats = JSON.parse(localStorage.getItem('study_stats')) || {}; 
    const todayStr = new Date().toISOString().split('T')[0];
    if (!studyStats[todayStr]) studyStats[todayStr] = 0;

    const ALL_MODULES = [
        { id: 'CLASS 10', label: '🎓 Class 10' },
        { id: 'IIT-JEE', label: '⚡ IIT-JEE' },
        { id: 'LECTURES', label: '📺 Lectures' },
        { id: 'SIMULATOR', label: '⏱️ Simulator' },
        { id: 'PAST PAPERS', label: '📄 Past Papers' },
        { id: 'FLASHCARDS', label: '📇 Flashcards' },
        { id: 'FAVORITES', label: '⭐ Favorites' }
    ];

    const defaultSettings = {
        enabled: 'yes', focusTime: 25, breakTime: 5, quoteRate: 30, sound: 'beep', vibrate: 'no', icon: '🍅', bubbles: 'yes', themeShade: 'theme-amoled', highlightTask: 'yes',
        aiEnabled: 'yes', activeModules: ['CLASS 10', 'IIT-JEE', 'LECTURES', 'SIMULATOR'],
        fontSize: 'font-medium', autoStart: 'no', volume: 0.5, zenMode: 'no'
    };

    let pomoSettings = { ...defaultSettings };
    try {
        const saved = JSON.parse(localStorage.getItem('pomo_settings'));
        if (saved && typeof saved === 'object') pomoSettings = { ...defaultSettings, ...saved };
    } catch(e) {}

    // Ensure valid active modules array
    if (!Array.isArray(pomoSettings.activeModules) || pomoSettings.activeModules.length === 0) {
        pomoSettings.activeModules = ['CLASS 10', 'IIT-JEE', 'LECTURES', 'SIMULATOR'];
    }

    let pomoTasks = JSON.parse(localStorage.getItem('pomo_tasks')) || [];
    let pomoSeconds = pomoSettings.focusTime * 60;
    let pomoInterval = null;
    let isPomoRunning = false;
    let isFocusMode = true;

    // Apply Initial Themes
    document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

    // ==========================================
    // 2. DOM CACHING
    // ==========================================
    const pomoTimeDisplay = document.getElementById('pomo-time');
    const pomoToggleBtn = document.getElementById('pomo-toggle');
    const pomoResetBtn = document.getElementById('pomo-reset');
    const pomoStatusText = document.getElementById('pomo-status-text');
    const pomoCard = document.getElementById('pomo-card');
    const pomoBubble = document.getElementById('pomo-bubble');
    const pomoContainer = document.getElementById('pomo-container');
    const pomoLogoIcon = document.getElementById('pomo-logo-icon');
    const pomoHighlightBox = document.getElementById('pomo-highlight-box');
    const pomoHighlightText = document.getElementById('pomo-highlight-text');

    const modalOverlay = document.getElementById('pomo-modal-overlay');
    const musicModalOverlay = document.getElementById('music-modal-overlay');
    const settingsSaveBtn = document.getElementById('pomo-save-settings');

    const bookListElement = document.getElementById('book-list');
    const searchBar = document.getElementById('search-bar');
    const themeToggle = document.getElementById('theme-toggle');
    const viewerWrapper = document.getElementById('viewer-wrapper');
    const viewerWrapperSplit = document.getElementById('viewer-wrapper-split');
    const bookFrame = document.getElementById('book-frame');
    const bookFrameSplit = document.getElementById('book-frame-split');
    
    // Header Actions
    const playlistDropdown = document.getElementById('playlist-dropdown');
    const downloadBtn = document.getElementById('download-btn');
    const startExamBtn = document.getElementById('start-exam-btn');
    const splitScreenBtn = document.getElementById('split-screen-btn');
    const analyticsBtn = document.getElementById('analytics-btn');
    const whiteboardBtn = document.getElementById('whiteboard-btn');
    const notesToggleBtn = document.getElementById('notes-toggle-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const selectorBox = document.getElementById('dynamic-mode-selector');

    const chatFab = document.getElementById('chat-fab-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close-btn');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send-btn');

    const desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    const notesPanel = document.getElementById('notes-panel');
    const notesArea = document.getElementById('notes-area');
    const closeNotesBtn = document.getElementById('close-notes-btn');
    const notesCopyBtn = document.getElementById('notes-copy-btn');
    const notesDlBtn = document.getElementById('notes-dl-btn');

    // ==========================================
    // 3. LOAD EXTERNAL LIBRARIES
    // ==========================================
    setTimeout(() => {
        if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
        if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
        if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
        renderDynamicTopNav();
    }, 150);

    // ==========================================
    // 4. WEB AUDIO SYNTHESIZER
    // ==========================================
    let audioCtx = null;
    let ambientNode = null;
    let isAmbientPlaying = false;

    function getAudioContext() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function createNoiseGenerator(type) {
        const ctx = getAudioContext();
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'ambient-white') {
                output[i] = white * 0.2;
            } else if (type === 'ambient-brown') {
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                output[i] = lastOut * 1.5;
            } else { // Synthesize Rain
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
                b6 = white * 0.115926;
            }
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(parseFloat(pomoSettings.volume) * 0.4, ctx.currentTime);
        whiteNoise.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start(0);
        return { source: whiteNoise, gain: gainNode };
    }

    function stopAmbientAudio() {
        if (ambientNode) {
            try { ambientNode.source.stop(); ambientNode.source.disconnect(); } catch(e) {}
            ambientNode = null;
        }
        isAmbientPlaying = false;
        const btn = document.getElementById('ambient-play-toggle');
        if (btn) btn.textContent = "▶ Start Ambient Sound";
    }

    document.getElementById('ambient-play-toggle').addEventListener('click', () => {
        const type = document.getElementById('music-preset-select').value;
        if (isAmbientPlaying) {
            stopAmbientAudio();
        } else {
            ambientNode = createNoiseGenerator(type);
            isAmbientPlaying = true;
            document.getElementById('ambient-play-toggle').textContent = "⏹ Stop Ambient Sound";
        }
    });

    const musicPresets = {
        'spotify-lofi': 'https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?utm_source=generator&theme=0',
        'spotify-focus': 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
        'spotify-classical': 'https://open.spotify.com/embed/playlist/37i9dQZF1DWV0gynK7Pt6v?utm_source=generator&theme=0',
        'yt-lofi': 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0'
    };

    document.getElementById('music-preset-select').addEventListener('change', (e) => {
        const val = e.target.value;
        const customGroup = document.getElementById('custom-music-group');
        const iframeWrapper = document.getElementById('music-iframe-container');
        const ambientBox = document.getElementById('ambient-controls-box');
        const musicFrame = document.getElementById('music-frame');

        stopAmbientAudio();

        if (val.startsWith('ambient-')) {
            customGroup.style.display = 'none';
            iframeWrapper.style.display = 'none';
            ambientBox.style.display = 'block';
            musicFrame.src = '';
        } else if (val === 'custom') {
            customGroup.style.display = 'flex';
            iframeWrapper.style.display = 'block';
            ambientBox.style.display = 'none';
        } else {
            customGroup.style.display = 'none';
            iframeWrapper.style.display = 'block';
            ambientBox.style.display = 'none';
            musicFrame.src = musicPresets[val] || '';
        }
    });

    document.getElementById('custom-music-apply-btn').addEventListener('click', () => {
        const url = document.getElementById('custom-music-url').value.trim();
        if (!url) return;
        const musicFrame = document.getElementById('music-frame');
        
        musicFrame.style.display = 'block';
        if (url.includes('open.spotify.com')) {
            musicFrame.src = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
            if (videoId) musicFrame.src = `https://www.youtube.com/embed/${videoId}`;
        } else {
            musicFrame.src = url;
        }
    });

    // ==========================================
    // 5. SETTINGS & MODALS LOGIC
    // ==========================================
    document.getElementById('pomo-open-settings').addEventListener('click', () => { 
        renderModuleCheckboxes(); 
        modalOverlay.classList.add('open'); 
    });
    
    document.getElementById('pomo-close-modal').addEventListener('click', () => {
        modalOverlay.classList.remove('open');
    });

    modalOverlay.addEventListener('click', (e) => { 
        if (e.target === modalOverlay) modalOverlay.classList.remove('open'); 
    });

    document.getElementById('music-open-btn').addEventListener('click', () => musicModalOverlay.classList.add('open'));
    document.getElementById('music-close-modal').addEventListener('click', () => musicModalOverlay.classList.remove('open'));
    musicModalOverlay.addEventListener('click', (e) => { if (e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); });

    // Modal Tabs
    document.querySelectorAll('.pomo-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pomo-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.pomo-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetTab = document.getElementById(btn.getAttribute('data-tab'));
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // Safety Wrappers for DOM Form Value Extraction
    function setSettingVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    
    function getSettingVal(id, defaultVal) {
        const el = document.getElementById(id);
        return el ? el.value : defaultVal;
    }

    function applyPomoSettingsUI() {
        pomoContainer.style.display = pomoSettings.enabled === 'yes' ? 'flex' : 'none';
        pomoBubble.style.display = pomoSettings.bubbles === 'yes' ? 'block' : 'none';
        if (pomoLogoIcon) pomoLogoIcon.textContent = pomoSettings.icon || '🍅';
        
        chatFab.style.display = pomoSettings.aiEnabled === 'no' ? 'none' : 'flex';
        if (pomoSettings.aiEnabled === 'no') chatWindow.classList.remove('open');

        document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

        // Safely prefill form fields
        setSettingVal('pomo-setting-theme-shade', pomoSettings.themeShade);
        setSettingVal('pomo-setting-enable', pomoSettings.enabled);
        setSettingVal('pomo-setting-focus', pomoSettings.focusTime);
        setSettingVal('pomo-setting-break', pomoSettings.breakTime);
        setSettingVal('pomo-setting-rate', pomoSettings.quoteRate);
        setSettingVal('pomo-setting-sound', pomoSettings.sound);
        setSettingVal('pomo-setting-vibrate', pomoSettings.vibrate);
        setSettingVal('pomo-setting-icon', pomoSettings.icon || '🍅');
        setSettingVal('pomo-setting-bubbles', pomoSettings.bubbles);
        setSettingVal('pomo-setting-highlight', pomoSettings.highlightTask);
        setSettingVal('pomo-setting-ai', pomoSettings.aiEnabled);
        setSettingVal('pomo-setting-fontsize', pomoSettings.fontSize);
        setSettingVal('pomo-setting-autostart', pomoSettings.autoStart);
        setSettingVal('pomo-setting-volume', pomoSettings.volume);
        setSettingVal('pomo-setting-zen', pomoSettings.zenMode);

        if (pomoSettings.highlightTask === 'yes' && pomoTasks.length > 0) {
            let firstIncomplete = pomoTasks.find(t => !t.done) || pomoTasks[0];
            if (pomoHighlightText) pomoHighlightText.textContent = firstIncomplete.text;
            if (pomoHighlightBox) pomoHighlightBox.style.display = 'flex';
        } else {
            if (pomoHighlightBox) pomoHighlightBox.style.display = 'none';
        }
    }

    // THE SAVE SETTINGS BUTTON (Fixed Scope)
    settingsSaveBtn.addEventListener('click', () => {
        pomoSettings.themeShade = getSettingVal('pomo-setting-theme-shade', pomoSettings.themeShade);
        pomoSettings.enabled = getSettingVal('pomo-setting-enable', pomoSettings.enabled);
        pomoSettings.focusTime = parseInt(getSettingVal('pomo-setting-focus', pomoSettings.focusTime));
        pomoSettings.breakTime = parseInt(getSettingVal('pomo-setting-break', pomoSettings.breakTime));
        pomoSettings.quoteRate = parseInt(getSettingVal('pomo-setting-rate', pomoSettings.quoteRate));
        pomoSettings.sound = getSettingVal('pomo-setting-sound', pomoSettings.sound);
        pomoSettings.vibrate = getSettingVal('pomo-setting-vibrate', pomoSettings.vibrate);
        pomoSettings.icon = getSettingVal('pomo-setting-icon', pomoSettings.icon);
        pomoSettings.bubbles = getSettingVal('pomo-setting-bubbles', pomoSettings.bubbles);
        pomoSettings.highlightTask = getSettingVal('pomo-setting-highlight', pomoSettings.highlightTask);
        pomoSettings.aiEnabled = getSettingVal('pomo-setting-ai', pomoSettings.aiEnabled);
        pomoSettings.fontSize = getSettingVal('pomo-setting-fontsize', pomoSettings.fontSize);
        pomoSettings.autoStart = getSettingVal('pomo-setting-autostart', pomoSettings.autoStart);
        pomoSettings.volume = getSettingVal('pomo-setting-volume', pomoSettings.volume);
        pomoSettings.zenMode = getSettingVal('pomo-setting-zen', pomoSettings.zenMode);

        const checkedBoxes = Array.from(document.querySelectorAll('#module-checkbox-grid .mod-checkbox:checked')).map(cb => cb.value);
        if (checkedBoxes.length > 0) pomoSettings.activeModules = checkedBoxes;

        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
        
        if (!isPomoRunning) {
            pomoSeconds = (isFocusMode ? pomoSettings.focusTime : pomoSettings.breakTime) * 60;
            updatePomoDisplay();
        }

        renderDynamicTopNav();
        applyPomoSettingsUI();
        modalOverlay.classList.remove('open');
    });

    // ==========================================
    // 6. MODULE CHECKBOX & DYNAMIC NAV
    // ==========================================
    function renderModuleCheckboxes() {
        const grid = document.getElementById('module-checkbox-grid');
        grid.innerHTML = '';
        ALL_MODULES.forEach(mod => {
            let isChecked = pomoSettings.activeModules.includes(mod.id) ? 'checked' : '';
            let label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${mod.id}" class="mod-checkbox" ${isChecked}> ${mod.label}`;
            grid.appendChild(label);
        });

        grid.querySelectorAll('.mod-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const checked = grid.querySelectorAll('.mod-checkbox:checked');
                if (checked.length > 4) {
                    e.target.checked = false;
                    alert("You can select up to 4 modules for top navigation.");
                }
            });
        });
    }

    function renderDynamicTopNav() {
        selectorBox.innerHTML = '';
        let selectedMods = ALL_MODULES.filter(m => pomoSettings.activeModules.includes(m.id));
        if (selectedMods.length === 0) selectedMods = [ALL_MODULES[0]];

        if (!pomoSettings.activeModules.includes(currentRoot)) {
            currentRoot = selectedMods[0].id;
        }

        selectedMods.forEach(mod => {
            let btn = document.createElement('button');
            btn.className = `mode-btn ${mod.id === currentRoot ? 'active' : ''}`;
            btn.textContent = mod.label.split(' ')[1] || mod.label; 
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRoot = mod.id;
                searchBar.value = ''; 
                filterAndRender();
            });
            selectorBox.appendChild(btn);
        });
        filterAndRender();
    }

    // ==========================================
    // 7. TASKS & POMODORO LOGIC
    // ==========================================
    function renderTasks() {
        const listEl = document.getElementById('pomo-task-list');
        listEl.innerHTML = '';
        pomoTasks.forEach((t, idx) => {
            let item = document.createElement('div');
            item.className = `pomo-task-item ${t.done ? 'completed' : ''}`;
            item.innerHTML = `
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex-grow:1;">
                    <input type="checkbox" ${t.done ? 'checked' : ''} onchange="window._toggleTask(${idx})">
                    <span>${t.text}</span>
                </label>
                <button onclick="window._deleteTask(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
            `;
            listEl.appendChild(item);
        });
        localStorage.setItem('pomo_tasks', JSON.stringify(pomoTasks));
        applyPomoSettingsUI();
    }

    window._toggleTask = (idx) => { pomoTasks[idx].done = !pomoTasks[idx].done; renderTasks(); };
    window._deleteTask = (idx) => { pomoTasks.splice(idx, 1); renderTasks(); };

    document.getElementById('pomo-add-task-btn').addEventListener('click', () => {
        let input = document.getElementById('pomo-new-task');
        if (input.value.trim() !== '') {
            pomoTasks.push({ text: input.value.trim(), done: false });
            input.value = '';
            renderTasks();
        }
    });

    function updatePomoDisplay() {
        let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
        let s = String(pomoSeconds % 60).padStart(2, '0');
        pomoTimeDisplay.textContent = `${m}:${s}`;
    }

    pomoToggleBtn.addEventListener('click', () => {
        if (isPomoRunning) {
            clearInterval(pomoInterval);
            isPomoRunning = false;
            pomoToggleBtn.textContent = '▶️';
            pomoCard.classList.remove('running');
        } else {
            isPomoRunning = true;
            pomoToggleBtn.textContent = '⏸️';
            pomoCard.classList.add('running');
            pomoInterval = setInterval(() => {
                if (pomoSeconds > 0) {
                    pomoSeconds--;
                    updatePomoDisplay();
                } else {
                    clearInterval(pomoInterval);
                    isPomoRunning = false;
                    pomoToggleBtn.textContent = '▶️';
                    pomoCard.classList.remove('running');
                    
                    // Add to analytics!
                    studyStats[todayStr]++;
                    localStorage.setItem('study_stats', JSON.stringify(studyStats));

                    alert("Timer completed!");
                }
            }, 1000);
        }
    });

    pomoResetBtn.addEventListener('click', () => {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        pomoSeconds = pomoSettings.focusTime * 60;
        pomoToggleBtn.textContent = '▶️';
        pomoCard.classList.remove('running');
        updatePomoDisplay();
    });

    // ==========================================
    // 8. FILE VIEWER & UTILITIES (OMR, Dashboard, Whiteboard)
    // ==========================================
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        document.getElementById('sidebar-overlay').classList.toggle('open');
    }
    document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
    document.getElementById('sidebar-overlay').addEventListener('click', toggleMobileMenu);

    desktopSidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        desktopSidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    });

    themeToggle.addEventListener('click', () => {
        pomoSettings.themeShade = pomoSettings.themeShade === 'theme-light' ? 'theme-amoled' : 'theme-light';
        themeToggle.textContent = pomoSettings.themeShade === 'theme-light' ? '🌙' : '☀️';
        applyPomoSettingsUI();
        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    });

    fullscreenBtn.addEventListener('click', () => {
        const container = document.getElementById('reader-container-main');
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
            else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    });

    splitScreenBtn.addEventListener('click', () => {
        isSplitActive = !isSplitActive;
        const mainContainer = document.getElementById('reader-container-main');
        if (isSplitActive) {
            mainContainer.classList.add('split-active');
            viewerWrapperSplit.style.display = 'block';
            bookFrameSplit.src = bookFrame.src;
            splitScreenBtn.style.backgroundColor = 'var(--success)';
            document.getElementById('omr-panel').style.display = 'none'; // hide OMR if standard split
        } else {
            mainContainer.classList.remove('split-active');
            viewerWrapperSplit.style.display = 'none';
            bookFrameSplit.src = '';
            splitScreenBtn.style.backgroundColor = '';
        }
    });

    // Notes Panel
    notesToggleBtn.addEventListener('click', () => notesPanel.classList.toggle('open'));
    closeNotesBtn.addEventListener('click', () => notesPanel.classList.remove('open'));
    notesArea.value = localStorage.getItem('quick_notes') || '';
    notesArea.addEventListener('input', () => localStorage.setItem('quick_notes', notesArea.value));
    notesCopyBtn.addEventListener('click', () => navigator.clipboard.writeText(notesArea.value));
    notesDlBtn.addEventListener('click', () => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([notesArea.value], { type: "text/plain" }));
        a.download = "Study_Notes.txt";
        a.click();
    });

    // --- ANALYTICS DASHBOARD ---
    const analyticsModal = document.getElementById('analytics-modal-overlay');
    analyticsBtn.addEventListener('click', () => {
        let total = 0;
        let streak = 0;
        let currDate = new Date();

        for (let date in studyStats) total += studyStats[date];
        document.getElementById('stat-total-pomos').innerText = total;
        document.getElementById('stat-hours').innerText = ((total * 25) / 60).toFixed(1);

        // Calculate Streak
        while(true) {
            let dStr = currDate.toISOString().split('T')[0];
            if (studyStats[dStr] && studyStats[dStr] > 0) {
                streak++;
                currDate.setDate(currDate.getDate() - 1);
            } else {
                break;
            }
        }
        document.getElementById('stat-streak').innerText = `${streak} 🔥`;

        // Render Heatmap
        const grid = document.getElementById('heatmap-container');
        grid.innerHTML = '';
        let heatDate = new Date();
        heatDate.setDate(heatDate.getDate() - 27); // Last 28 days
        for(let i=0; i<28; i++) {
            let box = document.createElement('div');
            box.className = 'heatmap-box';
            let str = heatDate.toISOString().split('T')[0];
            let count = studyStats[str] || 0;
            if (count > 0) box.classList.add('lvl-1');
            if (count > 2) box.classList.add('lvl-2');
            if (count > 4) box.classList.add('lvl-3');
            if (count > 6) box.classList.add('lvl-4');
            box.title = `${str}: ${count} sessions`;
            grid.appendChild(box);
            heatDate.setDate(heatDate.getDate() + 1);
        }
        analyticsModal.classList.add('open');
    });
    document.getElementById('analytics-close-modal').addEventListener('click', () => analyticsModal.classList.remove('open'));

    // --- NATIVE OMR SIMULATOR ---
    let examTimerInterval;
    let examSeconds = 10800; // 3 hours

    function renderOMRSheet() {
        const container = document.getElementById('omr-questions-container');
        container.innerHTML = '';
        for (let i = 1; i <= 75; i++) {
            let row = document.createElement('div');
            row.className = 'omr-row';
            row.innerHTML = `
                <div class="omr-num">${i}.</div>
                <div class="omr-options">
                    <div class="omr-circle" data-q="${i}" data-opt="A">A</div>
                    <div class="omr-circle" data-q="${i}" data-opt="B">B</div>
                    <div class="omr-circle" data-q="${i}" data-opt="C">C</div>
                    <div class="omr-circle" data-q="${i}" data-opt="D">D</div>
                </div>
            `;
            container.appendChild(row);
        }
        
        document.querySelectorAll('.omr-circle').forEach(circle => {
            circle.addEventListener('click', (e) => {
                let siblings = e.target.parentElement.querySelectorAll('.omr-circle');
                siblings.forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });
    }

    startExamBtn.addEventListener('click', () => {
        isSplitActive = true;
        document.getElementById('reader-container-main').classList.add('split-active');
        document.getElementById('omr-panel').style.display = 'flex';
        viewerWrapperSplit.style.display = 'none'; // Override standard split
        startExamBtn.style.display = 'none';
        
        renderOMRSheet();
        examSeconds = 10800;
        
        clearInterval(examTimerInterval);
        examTimerInterval = setInterval(() => {
            if(examSeconds <= 0) {
                clearInterval(examTimerInterval);
                document.getElementById('omr-submit-btn').click();
            } else {
                examSeconds--;
                let h = String(Math.floor(examSeconds / 3600)).padStart(2, '0');
                let m = String(Math.floor((examSeconds % 3600) / 60)).padStart(2, '0');
                let s = String(examSeconds % 60).padStart(2, '0');
                document.getElementById('omr-timer').innerText = `${h}:${m}:${s}`;
            }
        }, 1000);
    });

    document.getElementById('omr-submit-btn').addEventListener('click', () => {
        clearInterval(examTimerInterval);
        let answered = document.querySelectorAll('.omr-circle.selected').length;
        // Dummy Score Calculation (Assuming 4 marks per question)
        let simulatedScore = answered * 4 - Math.floor(answered * 0.2); // Random fake negative marking
        alert(`Exam Submitted!\nYou attempted ${answered}/75 questions.\nEstimated Simulated Score: ${simulatedScore}/300`);
        document.getElementById('reader-container-main').classList.remove('split-active');
        document.getElementById('omr-panel').style.display = 'none';
        isSplitActive = false;
        startExamBtn.style.display = 'flex';
    });

    // --- WHITEBOARD / SCRATCHPAD ---
    const wbOverlay = document.getElementById('whiteboard-overlay');
    const canvas = document.getElementById('wb-canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let currentColor = '#f8fafc';
    let currentSize = 3;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 60; // minus header
    }
    window.addEventListener('resize', resizeCanvas);

    whiteboardBtn.addEventListener('click', () => {
        wbOverlay.classList.add('open');
        resizeCanvas();
    });

    document.getElementById('wb-close').addEventListener('click', () => wbOverlay.classList.remove('open'));
    
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentColor = e.target.getAttribute('data-color');
        });
    });

    document.getElementById('wb-eraser').addEventListener('click', () => {
        currentColor = getComputedStyle(document.body).getPropertyValue('--primary-bg').trim(); // Erase matches background
    });

    document.getElementById('wb-clear').addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));
    
    document.getElementById('wb-size').addEventListener('input', (e) => currentSize = e.target.value);

    document.getElementById('wb-download').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'scratchpad.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // Drawing Events
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX || e.touches[0].clientX) - rect.left,
            y: (e.clientY || e.touches[0].clientY) - rect.top
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    });

    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Touch support
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; const pos = getMousePos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getMousePos(e); ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = currentColor; ctx.lineWidth = currentSize; ctx.lineCap = 'round'; ctx.stroke(); });
    canvas.addEventListener('touchend', () => isDrawing = false);


    // ==========================================
    // 9. LIBRARY FILTERING & RENDERING
    // ==========================================
    searchBar.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndRender, 200); 
    });

    document.getElementById('folder-toggle-btn').addEventListener('click', () => {
        isTreeExpanded = !isTreeExpanded;
        document.querySelectorAll('#book-list details').forEach(d => d.open = isTreeExpanded);
    });

    document.getElementById('local-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        loadBook({ title: file.name, folders: ["LOCAL FILES", file.name], url: URL.createObjectURL(file) }, {});
    });

    function filterAndRender() {
        if (masterLibrary.length === 0) return;
        const query = searchBar.value.toLowerCase().trim();
        let filteredBooks = [];

        if (currentRoot === "FAVORITES") {
            filteredBooks = masterLibrary.filter(book => starredBooks.includes(book.title));
        } else {
            filteredBooks = masterLibrary.filter(book => {
                const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
                const matchesSearch = meta.includes(query);
                const matchesSubj = currentSubject === "All" || meta.includes(currentSubject.toLowerCase());
                const matchesRoot = book.folders && book.folders[0].toUpperCase() === currentRoot.toUpperCase();
                return matchesSearch && matchesSubj && matchesRoot;
            });
        }
        renderTree(filteredBooks);
    }

    function renderTree(booksArray) {
        bookListElement.innerHTML = ''; 
        if (booksArray.length === 0) {
            bookListElement.innerHTML = `<div class="placeholder-text" style="font-size:0.85em; margin-top:20px; text-align:center;">${currentRoot === 'FAVORITES' ? 'No starred files yet.' : 'No files found.'}</div>`; 
            return;
        }

        if (currentRoot === "FAVORITES") {
            booksArray.forEach(b => bookListElement.appendChild(createBookElement(b)));
            return;
        }

        const fileTree = { _files: [], _isFolder: true };
        booksArray.forEach(book => {
            let currentLevel = fileTree;
            book.folders.slice(1).forEach(folder => {
                if (!currentLevel[folder]) currentLevel[folder] = { _files: [], _isFolder: true };
                currentLevel = currentLevel[folder];
            });
            currentLevel._files.push(book);
        });

        function countFiles(node) {
            let count = (node._files ? node._files.length : 0);
            Object.keys(node).filter(k => k !== '_files' && k !== '_isFolder').forEach(k => count += countFiles(node[k]));
            return count;
        }

        function buildNode(nodeObj, isOpen) {
            const container = document.createElement('div');
            Object.keys(nodeObj).filter(k => k !== '_files' && k !== '_isFolder').sort().forEach(folderName => {
                const details = document.createElement('details'); 
                if (isOpen || isTreeExpanded) details.open = true; 
                const summary = document.createElement('summary');
                summary.textContent = `${folderName} (${countFiles(nodeObj[folderName])})`;
                details.appendChild(summary);
                const contents = document.createElement('div'); 
                contents.className = 'folder-contents';
                contents.appendChild(buildNode(nodeObj[folderName], isOpen));
                details.appendChild(contents); 
                container.appendChild(details);
            });
            if (nodeObj._files) {
                nodeObj._files.sort((a,b) => a.title.localeCompare(b.title)).forEach(b => container.appendChild(createBookElement(b)));
            }
            return container;
        }
        bookListElement.appendChild(buildNode(fileTree, searchBar.value.length > 0));
    }

    function createBookElement(book) {
        const div = document.createElement('div'); 
        div.className = 'book-item';
        const content = document.createElement('div'); 
        content.className = 'book-item-content'; 
        content.textContent = book.title;
        if ((book.url && book.url.includes("youtube")) || book.playlist) content.classList.add('is-video');

        const actions = document.createElement('div'); 
        actions.className = 'book-actions';
        
        const starBtn = document.createElement('button');
        starBtn.className = `star-btn ${starredBooks.includes(book.title) ? 'starred' : ''}`;
        starBtn.innerHTML = starredBooks.includes(book.title) ? '⭐' : '☆';
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (starredBooks.includes(book.title)) {
                starredBooks = starredBooks.filter(t => t !== book.title);
                starBtn.innerHTML = '☆'; 
                starBtn.classList.remove('starred');
            } else {
                starredBooks.push(book.title);
                starBtn.innerHTML = '⭐'; 
                starBtn.classList.add('starred');
            }
            localStorage.setItem('library-starred', JSON.stringify(starredBooks));
            if (currentRoot === "FAVORITES") filterAndRender();
        });

        const check = document.createElement('input'); 
        check.type = 'checkbox'; 
        check.className = 'check-done';
        check.checked = completedBooks.includes(book.title);
        check.addEventListener('click', (e) => {
            e.stopPropagation();
            if (check.checked) completedBooks.push(book.title); 
            else completedBooks = completedBooks.filter(t => t !== book.title);
            localStorage.setItem('library-completed', JSON.stringify(completedBooks));
        });
        
        actions.appendChild(starBtn); 
        actions.appendChild(check);
        div.appendChild(content); 
        div.appendChild(actions);
        div.addEventListener('click', () => loadBook(book, div));
        return div;
    }

    function loadBook(book, clickedElement) {
        document.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
        if (clickedElement && clickedElement.classList) clickedElement.classList.add('active');
        
        document.getElementById('current-book-title').textContent = book.title;
        document.getElementById('current-book-breadcrumb').textContent = book.folders ? book.folders.join(" > ") : book.title;
        document.getElementById('placeholder-box').style.display = 'none';
        
        fullscreenBtn.style.display = 'flex';
        notesToggleBtn.style.display = 'flex';
        analyticsBtn.style.display = 'flex';
        whiteboardBtn.style.display = 'flex';
        
        // Hide/Show correct buttons based on SIMULATOR
        if (currentRoot === 'SIMULATOR') {
            startExamBtn.style.display = 'flex';
            splitScreenBtn.style.display = 'none';
        } else {
            startExamBtn.style.display = 'none';
            splitScreenBtn.style.display = 'flex';
            document.getElementById('omr-panel').style.display = 'none';
            document.getElementById('reader-container-main').classList.remove('split-active');
            isSplitActive = false;
        }

        let finalUrl = book.url || book.questionUrl || book.answerKeyUrl || '';

        if (book.playlist && book.playlist.length > 0) {
            playlistDropdown.innerHTML = '';
            book.playlist.forEach((vid, index) => {
                let opt = document.createElement('option');
                opt.value = vid.url; 
                opt.textContent = vid.title || `Lecture ${index + 1}`;
                playlistDropdown.appendChild(opt);
            });
            playlistDropdown.style.display = 'block';
            bookFrame.src = book.playlist[0].url;
            if (isSplitActive) bookFrameSplit.src = book.playlist[0].url;
            playlistDropdown.onchange = (e) => {
                bookFrame.src = e.target.value;
                if (isSplitActive) bookFrameSplit.src = e.target.value;
            };
        } else {
            playlistDropdown.style.display = 'none';
        }

        viewerWrapper.style.display = 'block';
        if (!book.playlist) {
            bookFrame.src = finalUrl;
            if (isSplitActive && currentRoot !== 'SIMULATOR') bookFrameSplit.src = finalUrl;
        }

        if (pomoSettings.zenMode === 'yes') {
            sidebar.classList.add('collapsed');
            desktopSidebarToggle.textContent = '▶';
        }

        if (window.innerWidth <= 800) toggleMobileMenu(); 
    }

    // ==========================================
    // 10. AI COPILOT CHAT
    // ==========================================
    chatFab.addEventListener('click', () => chatWindow.classList.add('open'));
    chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));

    let savedChat = localStorage.getItem('ai_chat_history');
    if (savedChat) { 
        chatBody.innerHTML = savedChat; 
        chatBody.scrollTop = chatBody.scrollHeight; 
    }

    function appendMsg(html, isUser) {
        const d = document.createElement('div');
        d.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
        d.innerHTML = html;
        chatBody.appendChild(d);
        chatBody.scrollTop = chatBody.scrollHeight;
        localStorage.setItem('ai_chat_history', chatBody.innerHTML);
    }

    async function handleChatSubmit() {
        const val = chatInput.value.trim();
        if (!val) return;
        appendMsg(val, true);
        chatInput.value = '';

        try {
            if (typeof processAIQuery !== 'undefined') {
                const res = await processAIQuery(val, masterLibrary);
                if (res.type === 'fact') {
                    appendMsg(res.reply, false);
                } else if (res.type === 'navigation') {
                    let cardHtml = `<p style="margin-bottom:6px;">${res.prefix || 'Matches found:'}</p>`;
                    res.matches.forEach(b => {
                        cardHtml += `<button class="primary-btn" style="width:100%; margin-bottom:4px; font-size:0.8em; text-align:left;" onclick="window._openAIBook('${b.title.replace(/'/g, "\\'")}')">📄 ${b.title}</button>`;
                    });
                    appendMsg(cardHtml, false);
                }
            } else {
                appendMsg("AI Engine is offline. Ensure ai.js is loaded.", false);
            }
        } catch(e) { 
            appendMsg("Error processing query.", false); 
        }
    }

    window._openAIBook = (title) => {
        const book = masterLibrary.find(b => b.title === title);
        if (book) { loadBook(book, {}); chatWindow.classList.remove('open'); }
    };

    chatSend.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChatSubmit(); });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            desktopSidebarToggle.click();
        }
        if (e.ctrlKey && e.key === ' ') {
            e.preventDefault();
            chatWindow.classList.contains('open') ? chatClose.click() : chatFab.click();
        }
        if (e.key === 'Escape') {
            modalOverlay.classList.remove('open');
            musicModalOverlay.classList.remove('open');
            analyticsModal.classList.remove('open');
            wbOverlay.classList.remove('open');
            chatWindow.classList.remove('open');
            notesPanel.classList.remove('open');
        }
    });

    // Boot routines
    renderTasks();
    applyPomoSettingsUI();
    updatePomoDisplay();
});
