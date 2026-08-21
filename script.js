document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. STATE & STORAGE INITIALIZATION
    // ==========================================
    let masterLibrary = [];
    let currentRoot = "IIT-JEE"; // DEFAULT TABS UPDATE
    let currentSubject = "All";
    window.currentActiveBook = null; // QoL 4 Context Variable

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
        { id: 'CLASS 10', label: '🎓 Class 10' }, // PROPER NAMING
        { id: 'IIT-JEE', label: '⚡ IIT-JEE' },
        { id: 'LECTURES', label: '📺 Lectures' },
        { id: 'SIMULATOR', label: '⏱️ Simulator' },
        { id: 'UTILITIES', label: '🛠️ Utilities' }, // ADDED UTILITIES
        { id: 'PAST PAPERS', label: '📄 Past Papers' },
        { id: 'FLASHCARDS', label: '📇 Flashcards' },
        { id: 'FAVORITES', label: '⭐ Favorites' }
    ];

    const defaultSettings = {
        enabled: 'yes', focusTime: 25, breakTime: 5, quoteRate: 30, sound: 'beep', vibrate: 'no', icon: '🍅', bubbles: 'yes', themeShade: 'theme-amoled', highlightTask: 'yes',
        aiEnabled: 'yes', activeModules: ['IIT-JEE', 'LECTURES', 'SIMULATOR', 'UTILITIES'], // DEFAULT TABS
        fontSize: 'font-medium', autoStart: 'no', volume: 0.5, zenMode: 'no'
    };

    let pomoSettings = { ...defaultSettings };
    try {
        const saved = JSON.parse(localStorage.getItem('pomo_settings'));
        if (saved && typeof saved === 'object') pomoSettings = { ...defaultSettings, ...saved };
    } catch(e) {}

    // Ensure valid active modules array
    if (!Array.isArray(pomoSettings.activeModules) || pomoSettings.activeModules.length === 0) {
        pomoSettings.activeModules = ['IIT-JEE', 'LECTURES', 'SIMULATOR', 'UTILITIES'];
    }

    let pomoTasks = JSON.parse(localStorage.getItem('pomo_tasks')) || [];
    let pomoSeconds = pomoSettings.focusTime * 60;
    let pomoInterval = null;
    let isPomoRunning = false;
    let isFocusMode = true;

    // Split Screen Resizer State
    let isSplitLocked = false;
    let isResizing = false;

    // Apply Initial Themes
    document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

    // ==========================================
    // 2. DOM CACHING
    // ==========================================
    const D = {
        pomoTimeDisplay: document.getElementById('pomo-time'),
        pomoToggleBtn: document.getElementById('pomo-toggle'),
        pomoResetBtn: document.getElementById('pomo-reset'),
        pomoStatusText: document.getElementById('pomo-status-text'),
        pomoCard: document.getElementById('pomo-card'),
        pomoBubble: document.getElementById('pomo-bubble'),
        pomoContainer: document.getElementById('pomo-container'),
        pomoLogoIcon: document.getElementById('pomo-logo-icon'),
        pomoHighlightBox: document.getElementById('pomo-highlight-box'),
        pomoHighlightText: document.getElementById('pomo-highlight-text'),

        modalOverlay: document.getElementById('pomo-modal-overlay'),
        musicModalOverlay: document.getElementById('music-modal-overlay'),
        settingsSaveBtn: document.getElementById('pomo-save-settings'),

        bookListElement: document.getElementById('book-list'),
        searchBar: document.getElementById('search-bar'),
        themeToggle: document.getElementById('theme-toggle'),
        viewerWrapper: document.getElementById('viewer-wrapper'),
        viewerWrapperSplit: document.getElementById('viewer-wrapper-split'),
        bookFrame: document.getElementById('book-frame'),
        bookFrameSplit: document.getElementById('book-frame-split'),
        
        // Header Actions
        playlistDropdown: document.getElementById('playlist-dropdown'),
        downloadBtn: document.getElementById('download-btn'),
        startExamBtn: document.getElementById('start-exam-btn'),
        splitScreenBtn: document.getElementById('split-screen-btn'),
        splitLockBtn: document.getElementById('split-lock-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        selectorBox: document.getElementById('dynamic-mode-selector'),

        chatFab: document.getElementById('chat-fab-btn'),
        chatWindow: document.getElementById('chat-window'),
        chatClose: document.getElementById('chat-close-btn'),
        chatBody: document.getElementById('chat-body'),
        chatInput: document.getElementById('chat-input'),
        chatSend: document.getElementById('chat-send-btn'),

        desktopSidebarToggle: document.getElementById('desktop-sidebar-toggle'),
        sidebar: document.getElementById('sidebar'),

        notesPanel: document.getElementById('notes-panel'),
        notesArea: document.getElementById('notes-area'),
        notesToggleBtn: document.getElementById('notes-toggle-btn'),
        closeNotesBtn: document.getElementById('close-notes-btn'),
        notesCopyBtn: document.getElementById('notes-copy-btn'),
        notesDlBtn: document.getElementById('notes-dl-btn'),
        notesLabel: document.getElementById('notes-title-label'),

        libView: document.getElementById('library-sidebar-view'),
        utilView: document.getElementById('utilities-sidebar-view'),
        phBox: document.getElementById('placeholder-box'),
        resizer: document.getElementById('split-resizer'),
        lvlBadge: document.getElementById('user-level-badge'),

        omrPanel: document.getElementById('omr-panel'),
        omrContainer: document.getElementById('omr-questions-container'),
        omrGrid: document.getElementById('omr-jump-grid')
    };

    // ==========================================
    // 3. GAMIFICATION (Level Engine)
    // ==========================================
    function updateGamification() {
        if (!D.lvlBadge) return;
        let totalMins = 0;
        for (let date in studyStats) {
            totalMins += (studyStats[date] * pomoSettings.focusTime);
        }
        let lvl = Math.floor(Math.sqrt(totalMins / 30)) + 1;
        
        let title = "Novice";
        if (lvl > 3) title = "Scholar";
        if (lvl > 10) title = "Capybara Sage";
        if (lvl > 25) title = "Ascended Master";

        D.lvlBadge.innerText = `Lvl ${lvl}: ${title}`;
    }

    // ==========================================
    // 4. LOAD EXTERNAL LIBRARIES
    // ==========================================
    setTimeout(() => {
        if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
        if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
        if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
        renderDynamicTopNav();
        updateGamification();
    }, 150);

    // ==========================================
    // 5. WEB AUDIO SYNTHESIZER
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

    document.getElementById('ambient-play-toggle')?.addEventListener('click', () => {
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

    document.getElementById('music-preset-select')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const customGroup = document.getElementById('custom-music-group');
        const iframeWrapper = document.getElementById('music-iframe-container');
        const ambientBox = document.getElementById('ambient-controls-box');
        const musicFrame = document.getElementById('music-frame');

        stopAmbientAudio();

        if (val.startsWith('ambient-')) {
            if(customGroup) customGroup.style.display = 'none';
            if(iframeWrapper) iframeWrapper.style.display = 'none';
            if(ambientBox) ambientBox.style.display = 'block';
            if(musicFrame) musicFrame.src = '';
        } else if (val === 'custom') {
            if(customGroup) customGroup.style.display = 'flex';
            if(iframeWrapper) iframeWrapper.style.display = 'block';
            if(ambientBox) ambientBox.style.display = 'none';
        } else {
            if(customGroup) customGroup.style.display = 'none';
            if(iframeWrapper) iframeWrapper.style.display = 'block';
            if(ambientBox) ambientBox.style.display = 'none';
            if(musicFrame) musicFrame.src = musicPresets[val] || '';
        }
    });

    document.getElementById('custom-music-apply-btn')?.addEventListener('click', () => {
        const url = document.getElementById('custom-music-url').value.trim();
        if (!url) return;
        const musicFrame = document.getElementById('music-frame');
        
        if (musicFrame) {
            musicFrame.style.display = 'block';
            if (url.includes('open.spotify.com')) {
                musicFrame.src = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
            } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                let videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
                if (videoId) musicFrame.src = `https://www.youtube.com/embed/${videoId}`;
            } else {
                musicFrame.src = url;
            }
        }
    });

    // ==========================================
    // 6. SETTINGS & MODALS LOGIC
    // ==========================================
    document.getElementById('pomo-open-settings')?.addEventListener('click', () => { 
        renderModuleCheckboxes(); 
        if (D.modalOverlay) D.modalOverlay.classList.add('open'); 
    });
    
    document.getElementById('pomo-close-modal')?.addEventListener('click', () => {
        if (D.modalOverlay) D.modalOverlay.classList.remove('open');
    });

    if (D.modalOverlay) {
        D.modalOverlay.addEventListener('click', (e) => { 
            if (e.target === D.modalOverlay) D.modalOverlay.classList.remove('open'); 
        });
    }

    document.getElementById('music-open-btn')?.addEventListener('click', () => D.musicModalOverlay?.classList.add('open'));
    document.getElementById('music-close-modal')?.addEventListener('click', () => D.musicModalOverlay?.classList.remove('open'));
    if (D.musicModalOverlay) D.musicModalOverlay.addEventListener('click', (e) => { if (e.target === D.musicModalOverlay) D.musicModalOverlay.classList.remove('open'); });

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

    function setSettingVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    
    function getSettingVal(id, defaultVal) {
        const el = document.getElementById(id);
        return el ? el.value : defaultVal;
    }

    function applyPomoSettingsUI() {
        if (D.pomoContainer) D.pomoContainer.style.display = pomoSettings.enabled === 'yes' ? 'flex' : 'none';
        if (D.pomoBubble) D.pomoBubble.style.display = pomoSettings.bubbles === 'yes' ? 'block' : 'none';
        if (D.pomoLogoIcon) D.pomoLogoIcon.textContent = pomoSettings.icon || '🍅';
        
        if (D.chatFab) D.chatFab.style.display = pomoSettings.aiEnabled === 'no' ? 'none' : 'flex';
        if (pomoSettings.aiEnabled === 'no' && D.chatWindow) D.chatWindow.classList.remove('open');

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
            if (D.pomoHighlightText) D.pomoHighlightText.textContent = firstIncomplete.text;
            if (D.pomoHighlightBox) D.pomoHighlightBox.style.display = 'flex';
        } else {
            if (D.pomoHighlightBox) D.pomoHighlightBox.style.display = 'none';
        }
    }

    if (D.settingsSaveBtn) {
        D.settingsSaveBtn.addEventListener('click', () => {
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
                if (D.pomoTimeDisplay) {
                    let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
                    let s = String(pomoSeconds % 60).padStart(2, '0');
                    D.pomoTimeDisplay.textContent = `${m}:${s}`;
                }
            }

            renderDynamicTopNav();
            applyPomoSettingsUI();
            if (D.modalOverlay) D.modalOverlay.classList.remove('open');
        });
    }

    // ==========================================
    // 7. MODULE CHECKBOX & DYNAMIC NAV
    // ==========================================
    function renderModuleCheckboxes() {
        const grid = document.getElementById('module-checkbox-grid');
        if (!grid) return;
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
        if (!D.selectorBox) return;
        D.selectorBox.innerHTML = '';
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
                
                // ROUTING: Utilities vs Library
                if (currentRoot === 'UTILITIES') {
                    if (D.libView) D.libView.style.display = 'none';
                    if (D.utilView) D.utilView.style.display = 'flex';
                    if (D.phBox) {
                        D.phBox.querySelector('h2').innerText = "UTILITIES HUB";
                        D.phBox.querySelector('p').innerText = "Select a tool from the sidebar to launch it.";
                        D.phBox.style.display = 'block';
                    }
                    if (D.view1) D.view1.style.display = 'none';
                    if (D.view2) D.view2.style.display = 'none';
                    if (D.omrPanel) D.omrPanel.style.display = 'none';
                    if (D.resizer) D.resizer.style.display = 'none';
                    if (D.btnSplit) D.btnSplit.style.display = 'none';
                    if (D.btnLock) D.btnLock.style.display = 'none';
                    if (D.btnExam) D.btnExam.style.display = 'none';
                } else {
                    if (D.utilView) D.utilView.style.display = 'none';
                    if (D.libView) D.libView.style.display = 'flex';
                    if (D.searchBar) D.searchBar.value = ''; 
                    if (D.phBox) {
                        D.phBox.querySelector('h2').innerText = "COMING NEVER";
                        D.phBox.querySelector('p').innerText = "This was made with AI and the person who gave the command is busy with other shit.";
                        D.phBox.style.display = 'block';
                    }
                    if (D.view1) D.view1.style.display = 'none';
                    if (D.view2) D.view2.style.display = 'none';
                    if (D.omrPanel) D.omrPanel.style.display = 'none';
                    filterAndRender();
                }
            });
            D.selectorBox.appendChild(btn);
        });
        filterAndRender();
    }

    // ==========================================
    // 8. TASKS & POMODORO LOGIC
    // ==========================================
    function renderTasks() {
        const listEl = document.getElementById('pomo-task-list');
        if (!listEl) return;
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

    document.getElementById('pomo-add-task-btn')?.addEventListener('click', () => {
        let input = document.getElementById('pomo-new-task');
        if (input && input.value.trim() !== '') {
            pomoTasks.push({ text: input.value.trim(), done: false });
            input.value = '';
            renderTasks();
        }
    });

    function updatePomoDisplay() {
        if (!D.pomoTimeDisplay) return;
        let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
        let s = String(pomoSeconds % 60).padStart(2, '0');
        D.pomoTimeDisplay.textContent = `${m}:${s}`;
    }

    D.pomoToggleBtn?.addEventListener('click', () => {
        if (isPomoRunning) {
            clearInterval(pomoInterval);
            isPomoRunning = false;
            D.pomoToggleBtn.textContent = '▶️';
            if (D.pomoCard) D.pomoCard.classList.remove('running');
        } else {
            isPomoRunning = true;
            D.pomoToggleBtn.textContent = '⏸️';
            if (D.pomoCard) D.pomoCard.classList.add('running');
            pomoInterval = setInterval(() => {
                if (pomoSeconds > 0) {
                    pomoSeconds--;
                    updatePomoDisplay();
                } else {
                    clearInterval(pomoInterval);
                    isPomoRunning = false;
                    D.pomoToggleBtn.textContent = '▶️';
                    if (D.pomoCard) D.pomoCard.classList.remove('running');
                    
                    // Analytics & Level Up
                    studyStats[todayStr]++;
                    localStorage.setItem('study_stats', JSON.stringify(studyStats));
                    updateGamification();

                    alert("Timer completed!");
                }
            }, 1000);
        }
    });

    D.pomoResetBtn?.addEventListener('click', () => {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        pomoSeconds = pomoSettings.focusTime * 60;
        if (D.pomoToggleBtn) D.pomoToggleBtn.textContent = '▶️';
        if (D.pomoCard) D.pomoCard.classList.remove('running');
        updatePomoDisplay();
    });

    // ==========================================
    // 9. FILE VIEWER, SPLIT SCREEN & UTILITIES
    // ==========================================
    function toggleMobileMenu() {
        if (D.sidebar) D.sidebar.classList.toggle('open');
        if (D.overlay) D.overlay.classList.toggle('open');
    }
    document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);
    D.overlay?.addEventListener('click', toggleMobileMenu);

    D.desktopSidebarToggle?.addEventListener('click', () => {
        if (D.sidebar) D.sidebar.classList.toggle('collapsed');
        D.desktopSidebarToggle.textContent = D.sidebar.classList.contains('collapsed') ? '▶' : '◀';
    });

    D.themeToggle?.addEventListener('click', () => {
        pomoSettings.themeShade = pomoSettings.themeShade === 'theme-light' ? 'theme-amoled' : 'theme-light';
        D.themeToggle.textContent = pomoSettings.themeShade === 'theme-light' ? '🌙' : '☀️';
        applyPomoSettingsUI();
        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    });

    D.fullscreenBtn?.addEventListener('click', () => {
        const container = document.getElementById('reader-container-main');
        if (!container) return;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
            else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    });

    // QoL 3: Split Screen & Draggable Resizer Logic
    if (D.btnSplit) {
        D.btnSplit.addEventListener('click', () => {
            isSplitActive = !isSplitActive;
            const mainContainer = document.getElementById('reader-container-main');
            
            if (!mainContainer || !D.viewerWrapperSplit || !D.bookFrameSplit) return;

            if (isSplitActive) {
                mainContainer.classList.add('split-active');
                D.viewerWrapperSplit.style.display = 'block';
                if (D.bookFrame) D.bookFrameSplit.src = D.bookFrame.src;
                D.btnSplit.style.backgroundColor = 'var(--success)';
                if (D.omrPanel) D.omrPanel.style.display = 'none';
                
                // Show resizer and lock
                if (D.resizer) D.resizer.style.display = 'block';
                if (D.btnLock) D.btnLock.style.display = 'flex';
                if (D.view1) D.view1.style.width = '50%';
                if (D.view2) D.view2.style.width = '50%';
            } else {
                mainContainer.classList.remove('split-active');
                D.viewerWrapperSplit.style.display = 'none';
                D.bookFrameSplit.src = '';
                D.btnSplit.style.backgroundColor = '';
                
                // Hide resizer and lock
                if (D.resizer) D.resizer.style.display = 'none';
                if (D.btnLock) D.btnLock.style.display = 'none';
                if (D.view1) D.view1.style.width = '100%';
            }
        });
    }

    if (D.btnLock && D.resizer) {
        D.btnLock.addEventListener('click', () => {
            isSplitLocked = !isSplitLocked;
            D.btnLock.textContent = isSplitLocked ? '🔒' : '🔓';
            if (isSplitLocked) D.resizer.classList.add('locked');
            else D.resizer.classList.remove('locked');
        });

        D.resizer.addEventListener('mousedown', (e) => {
            if (isSplitLocked) return;
            isResizing = true;
            D.resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            if (D.view1) D.view1.style.pointerEvents = 'none';
            if (D.view2) D.view2.style.pointerEvents = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !D.mainContainer) return;
            const containerRect = D.mainContainer.getBoundingClientRect();
            let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            // Limit boundary 20% to 80%
            if (newWidth < 20) newWidth = 20;
            if (newWidth > 80) newWidth = 80;
            if (D.view1) D.view1.style.width = `${newWidth}%`;
            if (D.view2) D.view2.style.width = `${100 - newWidth}%`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                D.resizer.classList.remove('dragging');
                document.body.style.cursor = 'default';
                if (D.view1) D.view1.style.pointerEvents = 'auto';
                if (D.view2) D.view2.style.pointerEvents = 'auto';
            }
        });
    }

    // QoL 2: Context Aware Notes
    let currentNoteKey = 'quick_notes_general';
    D.notesToggleBtn?.addEventListener('click', () => D.notesPanel?.classList.toggle('open'));
    D.closeNotesBtn?.addEventListener('click', () => D.notesPanel?.classList.remove('open'));
    
    if (D.notesArea) {
        D.notesArea.addEventListener('input', () => localStorage.setItem(currentNoteKey, D.notesArea.value));
    }

    function loadContextNotes(bookTitle) {
        if (!D.notesArea || !D.notesLabel) return;
        if (bookTitle) {
            currentNoteKey = 'notes_' + bookTitle.replace(/[^a-z0-9]/gi, '_');
            D.notesLabel.innerHTML = `📝 Notes: <span style="opacity:0.7; font-size:0.85em; font-weight:normal;">${bookTitle}</span>`;
        } else {
            currentNoteKey = 'quick_notes_general';
            D.notesLabel.innerHTML = `📝 General Scratchpad`;
        }
        D.notesArea.value = localStorage.getItem(currentNoteKey) || '';
    }

    D.notesCopyBtn?.addEventListener('click', () => {
        if (!D.notesArea) return;
        navigator.clipboard.writeText(D.notesArea.value).then(() => {
            D.notesCopyBtn.textContent = '✅';
            setTimeout(() => D.notesCopyBtn.textContent = '📋', 1500);
        });
    });

    D.notesDlBtn?.addEventListener('click', () => {
        if (!D.notesArea) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([D.notesArea.value], { type: "text/plain" }));
        a.download = "Study_Notes.txt";
        a.click();
    });

    // UTILITIES TRIGGERS
    document.getElementById('util-btn-analytics')?.addEventListener('click', () => {
        const analyticsModal = document.getElementById('analytics-modal-overlay');
        if (!analyticsModal) return;
        
        let total = 0; let streak = 0; let currDate = new Date();
        for (let date in studyStats) total += studyStats[date];
        
        const totalEl = document.getElementById('stat-total-pomos');
        const hoursEl = document.getElementById('stat-hours');
        const streakEl = document.getElementById('stat-streak');
        if (totalEl) totalEl.innerText = total;
        if (hoursEl) hoursEl.innerText = ((total * pomoSettings.focusTime) / 60).toFixed(1);

        while(true) {
            let dStr = currDate.toISOString().split('T')[0];
            if (studyStats[dStr] && studyStats[dStr] > 0) {
                streak++; currDate.setDate(currDate.getDate() - 1);
            } else break;
        }
        if (streakEl) streakEl.innerText = `${streak} 🔥`;

        const grid = document.getElementById('heatmap-container');
        if (grid) {
            grid.innerHTML = '';
            let heatDate = new Date(); heatDate.setDate(heatDate.getDate() - 27); 
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
        }
        analyticsModal.classList.add('open');
    });

    document.getElementById('analytics-close-modal')?.addEventListener('click', () => {
        document.getElementById('analytics-modal-overlay')?.classList.remove('open');
    });

    document.getElementById('util-btn-whiteboard')?.addEventListener('click', () => {
        const wbOverlay = document.getElementById('whiteboard-overlay');
        const canvas = document.getElementById('wb-canvas');
        if (!wbOverlay || !canvas) return;
        
        wbOverlay.classList.add('open');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 60;
    });

    document.getElementById('util-btn-settings')?.addEventListener('click', () => {
        document.getElementById('pomo-open-settings')?.click();
    });

    // WHITEBOARD DRAWING
    const wbCanvas = document.getElementById('wb-canvas');
    if (wbCanvas) {
        const ctx = wbCanvas.getContext('2d');
        let isDrawing = false, currentColor = '#f8fafc', currentSize = 3;

        document.getElementById('wb-close')?.addEventListener('click', () => document.getElementById('whiteboard-overlay')?.classList.remove('open'));
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentColor = e.target.getAttribute('data-color');
            });
        });

        document.getElementById('wb-eraser')?.addEventListener('click', () => currentColor = getComputedStyle(document.body).getPropertyValue('--primary-bg').trim());
        document.getElementById('wb-clear')?.addEventListener('click', () => ctx.clearRect(0, 0, wbCanvas.width, wbCanvas.height));
        document.getElementById('wb-size')?.addEventListener('input', (e) => currentSize = e.target.value);
        document.getElementById('wb-download')?.addEventListener('click', () => {
            const link = document.createElement('a'); link.download = 'scratchpad.png'; link.href = wbCanvas.toDataURL(); link.click();
        });

        function getMousePos(e) {
            const rect = wbCanvas.getBoundingClientRect();
            return { x: (e.clientX || e.touches[0].clientX) - rect.left, y: (e.clientY || e.touches[0].clientY) - rect.top };
        }

        wbCanvas.addEventListener('mousedown', (e) => { isDrawing = true; const pos = getMousePos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); });
        wbCanvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; const pos = getMousePos(e); ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = currentColor; ctx.lineWidth = currentSize; ctx.lineCap = 'round'; ctx.stroke(); });
        wbCanvas.addEventListener('mouseup', () => isDrawing = false);
        wbCanvas.addEventListener('mouseout', () => isDrawing = false);
    }

    // ==========================================
    // 10. NATIVE OMR SIMULATOR (QoL 5)
    // ==========================================
    let examTimerInterval;
    let examSeconds = 10800; 

    document.getElementById('omr-grid-toggle')?.addEventListener('click', () => {
        if (D.omrGrid) D.omrGrid.style.display = D.omrGrid.style.display === 'none' ? 'grid' : 'none';
    });

    function renderOMRSheet() {
        if (!D.omrContainer || !D.omrGrid) return;
        D.omrContainer.innerHTML = '';
        D.omrGrid.innerHTML = '';

        for (let i = 1; i <= 75; i++) {
            let box = document.createElement('div');
            box.className = 'grid-box';
            box.id = `grid-box-${i}`;
            box.innerText = i;
            box.addEventListener('click', () => document.getElementById(`q-row-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            D.omrGrid.appendChild(box);

            let row = document.createElement('div');
            row.className = 'omr-row';
            row.id = `q-row-${i}`;
            row.innerHTML = `
                <div class="omr-num">${i}.</div>
                <div class="omr-options">
                    <div class="omr-circle" data-opt="A">A</div>
                    <div class="omr-circle" data-opt="B">B</div>
                    <div class="omr-circle" data-opt="C">C</div>
                    <div class="omr-circle" data-opt="D">D</div>
                </div>
                <button class="btn-review" id="rev-${i}">Mark</button>
            `;
            D.omrContainer.appendChild(row);
            
            row.querySelectorAll('.omr-circle').forEach(circle => {
                circle.addEventListener('click', (e) => {
                    let isSelected = e.target.classList.contains('selected');
                    row.querySelectorAll('.omr-circle').forEach(s => s.classList.remove('selected'));
                    if (!isSelected) {
                        e.target.classList.add('selected');
                        box.classList.add('ans'); box.classList.remove('rev');
                        document.getElementById(`rev-${i}`)?.classList.remove('active');
                    } else { box.classList.remove('ans'); }
                });
            });

            document.getElementById(`rev-${i}`)?.addEventListener('click', (e) => {
                e.target.classList.toggle('active');
                if (e.target.classList.contains('active')) box.classList.add('rev');
                else box.classList.remove('rev');
            });
        }
    }

    D.btnExam?.addEventListener('click', () => {
        isSplitActive = true;
        if (D.mainContainer) D.mainContainer.classList.add('split-active');
        if (D.omrPanel) D.omrPanel.style.display = 'flex';
        if (D.view2) D.view2.style.display = 'none'; 
        if (D.resizer) D.resizer.style.display = 'block'; // Allow resizer for OMR
        if (D.btnLock) D.btnLock.style.display = 'flex';
        
        D.btnExam.style.display = 'none';
        
        renderOMRSheet();
        examSeconds = 10800;
        clearInterval(examTimerInterval);
        examTimerInterval = setInterval(() => {
            if(examSeconds <= 0) {
                clearInterval(examTimerInterval);
                document.getElementById('omr-submit-btn')?.click();
            } else {
                examSeconds--;
                let h = String(Math.floor(examSeconds / 3600)).padStart(2, '0');
                let m = String(Math.floor((examSeconds % 3600) / 60)).padStart(2, '0');
                let s = String(examSeconds % 60).padStart(2, '0');
                const timerEl = document.getElementById('omr-timer');
                if (timerEl) timerEl.innerText = `${h}:${m}:${s}`;
            }
        }, 1000);
    });

    document.getElementById('omr-submit-btn')?.addEventListener('click', () => {
        clearInterval(examTimerInterval);
        let answered = document.querySelectorAll('.grid-box.ans').length;
        let simulatedScore = answered * 4 - Math.floor(answered * 0.2); 
        alert(`Exam Submitted!\nYou attempted ${answered}/75 questions.\nEstimated Score: ${simulatedScore}/300`);
        
        if (D.mainContainer) D.mainContainer.classList.remove('split-active');
        if (D.omrPanel) D.omrPanel.style.display = 'none';
        if (D.resizer) D.resizer.style.display = 'none';
        if (D.btnLock) D.btnLock.style.display = 'none';
        isSplitActive = false;
        if (D.btnExam) D.btnExam.style.display = 'flex';
    });

    // ==========================================
    // 11. LIBRARY FILTERING & RENDERING
    // ==========================================
    D.searchBar?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndRender, 200); 
    });

    document.querySelectorAll('.subj-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.subj-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentSubject = chip.getAttribute('data-subj');
            filterAndRender();
        });
    });

    function filterAndRender() {
        if (!D.bookListElement || masterLibrary.length === 0) return;
        const query = D.searchBar ? D.searchBar.value.toLowerCase().trim() : "";
        let filteredBooks = [];

        if (currentRoot === "FAVORITES") {
            filteredBooks = masterLibrary.filter(book => book && book.title && starredBooks.includes(book.title));
        } else {
            filteredBooks = masterLibrary.filter(book => {
                if (!book || !book.title) return false;
                const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
                const matchesSearch = meta.includes(query);
                const matchesSubj = currentSubject === "All" || meta.includes(currentSubject.toLowerCase());
                const matchesRoot = book.folders && book.folders[0] && book.folders[0].toUpperCase() === currentRoot.toUpperCase();
                return matchesSearch && matchesSubj && matchesRoot;
            });
        }
        renderTree(filteredBooks);
    }

    function renderTree(booksArray) {
        if (!D.bookListElement) return;
        D.bookListElement.innerHTML = ''; 
        if (booksArray.length === 0) {
            D.bookListElement.innerHTML = `<div class="placeholder-text" style="font-size:0.85em; margin-top:20px; text-align:center;">${currentRoot === 'FAVORITES' ? 'No starred files yet.' : 'No files found.'}</div>`; 
            return;
        }

        if (currentRoot === "FAVORITES") {
            booksArray.forEach(b => D.bookListElement.appendChild(createBookElement(b)));
            return;
        }

        const fileTree = { _files: [], _isFolder: true };
        booksArray.forEach(book => {
            if (!book || !book.folders) return;
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
                nodeObj._files.sort((a,b) => (a.title || "").localeCompare(b.title || "")).forEach(b => container.appendChild(createBookElement(b)));
            }
            return container;
        }
        D.bookListElement.appendChild(buildNode(fileTree, D.searchBar && D.searchBar.value.length > 0));
    }

    function createBookElement(book) {
        const div = document.createElement('div'); 
        div.className = 'book-item';
        const content = document.createElement('div'); 
        content.className = 'book-item-content'; 
        content.textContent = book.title || "Unknown File";
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
        
        window.currentActiveBook = book; 
        loadContextNotes(book.title); 

        const titleText = document.getElementById('current-book-title');
        const breadcrumbText = document.getElementById('current-book-breadcrumb');

        if (titleText) titleText.textContent = book.title || "File";
        if (breadcrumbText) breadcrumbText.textContent = book.folders ? book.folders.join(" > ") : (book.title || "");
        if (D.phBox) D.phBox.style.display = 'none';
        
        if (D.btnFull) D.btnFull.style.display = 'flex';
        if (D.btnNotes) D.btnNotes.style.display = 'flex';
        
        // Handle Action Buttons Visibility
        if (currentRoot === 'SIMULATOR') {
            if (D.btnExam) D.btnExam.style.display = 'flex';
            if (D.btnSplit) D.btnSplit.style.display = 'none';
            if (D.btnLock) D.btnLock.style.display = 'none';
        } else {
            if (D.btnExam) D.btnExam.style.display = 'none';
            if (D.btnSplit) D.btnSplit.style.display = 'flex';
            if (D.btnLock) D.btnLock.style.display = isSplitActive ? 'flex' : 'none';
            if (D.omrPanel) D.omrPanel.style.display = 'none';
        }

        let finalUrl = book.url || book.questionUrl || book.answerKeyUrl || '';

        if (book.playlist && book.playlist.length > 0) {
            if (D.playlistDropdown) {
                D.playlistDropdown.innerHTML = '';
                book.playlist.forEach((vid, index) => {
                    let opt = document.createElement('option');
                    opt.value = vid.url; 
                    opt.textContent = vid.title || `Lecture ${index + 1}`;
                    D.playlistDropdown.appendChild(opt);
                });
                D.playlistDropdown.style.display = 'block';
                D.playlistDropdown.onchange = (e) => {
                    if (D.bookFrame) D.bookFrame.src = e.target.value;
                    if (isSplitActive && D.bookFrameSplit) D.bookFrameSplit.src = e.target.value;
                };
            }
            if (D.bookFrame) D.bookFrame.src = book.playlist[0].url;
            if (isSplitActive && D.bookFrameSplit) D.bookFrameSplit.src = book.playlist[0].url;
        } else {
            if (D.playlistDropdown) D.playlistDropdown.style.display = 'none';
            if (D.bookFrame) D.bookFrame.src = finalUrl;
            if (isSplitActive && currentRoot !== 'SIMULATOR' && D.bookFrameSplit) D.bookFrameSplit.src = finalUrl;
        }

        if (D.view1) D.view1.style.display = 'block';

        if (pomoSettings.zenMode === 'yes' && D.sidebar && D.desktopSidebarToggle) {
            D.sidebar.classList.add('collapsed');
            D.desktopSidebarToggle.textContent = '▶';
        }

        if (window.innerWidth <= 800) {
            D.sidebar?.classList.remove('open');
            D.overlay?.classList.remove('open');
        }
    }

    // ==========================================
    // 12. AI COPILOT CHAT & DECONTAMINATION
    // ==========================================
    D.chatFab?.addEventListener('click', () => D.chatWindow?.classList.add('open'));
    D.chatClose?.addEventListener('click', () => D.chatWindow?.classList.remove('open'));

    if (D.chatBody) {
        let savedChat = localStorage.getItem('ai_chat_history');
        if (savedChat) { 
            D.chatBody.innerHTML = savedChat; 
            D.chatBody.scrollTop = D.chatBody.scrollHeight; 
        }
    }

    function appendMsg(html, isUser) {
        if (!D.chatBody) return;
        const d = document.createElement('div');
        d.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
        d.innerHTML = html;
        D.chatBody.appendChild(d);
        D.chatBody.scrollTop = D.chatBody.scrollHeight;
        localStorage.setItem('ai_chat_history', D.chatBody.innerHTML);
    }

    async function handleChatSubmit() {
        if (!D.chatInput) return;
        const val = D.chatInput.value.trim();
        if (!val) return;
        appendMsg(val, true);
        D.chatInput.value = '';

        try {
            if (typeof processAIQuery !== 'undefined') {
                const safeLibrary = masterLibrary.filter(b => b && typeof b === 'object' && b.title);
                const res = await processAIQuery(val, safeLibrary, window.currentActiveBook);
                
                if (res && res.type === 'fact') {
                    appendMsg(res.reply, false);
                } else if (res && res.type === 'navigation') {
                    let cardHtml = `<p style="margin-bottom:6px;">${res.prefix || 'Matches found:'}</p>`;
                    res.matches.forEach(b => {
                        const bIndex = masterLibrary.indexOf(b);
                        const cleanTitle = (b.title || 'Document').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        cardHtml += `<button class="primary-btn" style="width:100%; margin-bottom:4px; font-size:0.8em; text-align:left;" onclick="window._openAIBookByIndex(${bIndex})">📄 ${cleanTitle}</button>`;
                    });
                    appendMsg(cardHtml, false);
                } else {
                    appendMsg("I'm not sure what you mean. 🦦", false);
                }
            } else {
                appendMsg("AI Engine is offline. Ensure ai.js is loaded.", false);
            }
        } catch(e) { 
            console.error("AI Crash:", e); 
            appendMsg("My circuits shorted out! Error processing query. 🤖⚡", false); 
        }
    }

    window._openAIBookByIndex = (index) => {
        const book = masterLibrary[index];
        if (book) { 
            loadBook(book, null); 
            if (D.chatWindow) D.chatWindow.classList.remove('open'); 
        }
    };

    D.chatSend?.addEventListener('click', handleChatSubmit);
    D.chatInput?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') handleChatSubmit(); 
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'b' && D.desktopSidebarToggle) {
            e.preventDefault(); D.desktopSidebarToggle.click();
        }
        if (e.ctrlKey && e.key === ' ' && D.chatFab && D.chatWindow) {
            e.preventDefault();
            D.chatWindow.classList.contains('open') ? D.chatClose.click() : D.chatFab.click();
        }
        if (e.key === 'Escape') {
            D.modalOverlay?.classList.remove('open');
            D.musicModalOverlay?.classList.remove('open');
            document.getElementById('analytics-modal-overlay')?.classList.remove('open');
            document.getElementById('whiteboard-overlay')?.classList.remove('open');
            D.chatWindow?.classList.remove('open');
            D.notesPanel?.classList.remove('open');
        }
    });

});
