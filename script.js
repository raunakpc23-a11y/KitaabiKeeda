document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. STATE & STORAGE INITIALIZATION
    // ==========================================
    let masterLibrary = [];
    let currentRoot = "IIT-JEE"; 
    let currentSubject = "All";
    window.currentActiveBook = null; // Exposed globally for AI context

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
        { id: 'UTILITIES', label: '🛠️ Utilities' },
        { id: 'PAST PAPERS', label: '📄 Past Papers' },
        { id: 'FLASHCARDS', label: '📇 Flashcards' },
        { id: 'FAVORITES', label: '⭐ Favorites' }
    ];

    const defaultSettings = {
        enabled: 'yes', focusTime: 25, breakTime: 5, quoteRate: 30, sound: 'beep', vibrate: 'no', icon: '🍅', bubbles: 'yes', themeShade: 'theme-amoled', highlightTask: 'yes',
        aiEnabled: 'yes', activeModules: ['IIT-JEE', 'LECTURES', 'SIMULATOR', 'UTILITIES'],
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

    // Split Screen State
    let isSplitLocked = false;
    let isResizing = false;

    // Apply Initial Themes
    document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

    // ==========================================
    // 2. DOM CACHING (SAFE MODE)
    // ==========================================
    const D = {
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('sidebar-overlay'),
        themeToggle: document.getElementById('theme-toggle'),
        lvlBadge: document.getElementById('user-level-badge'),
        
        libView: document.getElementById('library-sidebar-view'),
        utilView: document.getElementById('utilities-sidebar-view'),
        modeSelector: document.getElementById('dynamic-mode-selector'),
        bookList: document.getElementById('book-list'),
        searchBar: document.getElementById('search-bar'),
        
        mainContainer: document.getElementById('reader-container-main'),
        view1: document.getElementById('viewer-wrapper'),
        view2: document.getElementById('viewer-wrapper-split'),
        resizer: document.getElementById('split-resizer'),
        phBox: document.getElementById('placeholder-box'),
        utilWorkspace: document.getElementById('utilities-workspace'),
        
        bookFrame: document.getElementById('book-frame'),
        bookFrameSplit: document.getElementById('book-frame-split'),
        
        btnSplit: document.getElementById('split-screen-btn'),
        btnLock: document.getElementById('split-lock-btn'),
        btnExam: document.getElementById('start-exam-btn'),
        btnFull: document.getElementById('fullscreen-btn'),
        btnNotes: document.getElementById('notes-toggle-btn'),
        
        notesPanel: document.getElementById('notes-panel'),
        notesArea: document.getElementById('notes-area'),
        notesLabel: document.getElementById('notes-title-label'),
        closeNotesBtn: document.getElementById('close-notes-btn'),
        notesCopyBtn: document.getElementById('notes-copy-btn'),
        notesDlBtn: document.getElementById('notes-dl-btn'),
        
        omrPanel: document.getElementById('omr-panel'),
        omrContainer: document.getElementById('omr-questions-container'),
        omrGrid: document.getElementById('omr-jump-grid'),
        
        chatWindow: document.getElementById('chat-window'),
        chatBody: document.getElementById('chat-body'),
        chatInput: document.getElementById('chat-input'),
        chatSend: document.getElementById('chat-send-btn'),
        chatFab: document.getElementById('chat-fab-btn'),
        chatClose: document.getElementById('chat-close-btn')
    };

    const pomoTimeDisplay = document.getElementById('pomo-time');
    const pomoToggleBtn = document.getElementById('pomo-toggle');
    const pomoResetBtn = document.getElementById('pomo-reset');
    const pomoCard = document.getElementById('pomo-card');
    const pomoBubble = document.getElementById('pomo-bubble');
    const pomoContainer = document.getElementById('pomo-container');
    const pomoLogoIcon = document.getElementById('pomo-logo-icon');
    const pomoHighlightBox = document.getElementById('pomo-highlight-box');
    const pomoHighlightText = document.getElementById('pomo-highlight-text');

    const modalOverlay = document.getElementById('pomo-modal-overlay');
    const musicModalOverlay = document.getElementById('music-modal-overlay');
    const settingsSaveBtn = document.getElementById('pomo-save-settings');

    const playlistDropdown = document.getElementById('playlist-dropdown');
    const desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');

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
        if(!musicFrame) return;

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
    // 6. SETTINGS & MODALS LOGIC
    // ==========================================
    const openSettingsBtn = document.getElementById('pomo-open-settings');
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => { 
            renderModuleCheckboxes(); 
            if (modalOverlay) modalOverlay.classList.add('open'); 
        });
    }

    const closeSettingsBtn = document.getElementById('pomo-close-modal');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => { if (modalOverlay) modalOverlay.classList.remove('open'); });

    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); });

    document.getElementById('music-open-btn')?.addEventListener('click', () => musicModalOverlay?.classList.add('open'));
    document.getElementById('music-close-modal')?.addEventListener('click', () => musicModalOverlay?.classList.remove('open'));
    if(musicModalOverlay) musicModalOverlay.addEventListener('click', (e) => { if (e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); });

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
        if (pomoContainer) pomoContainer.style.display = pomoSettings.enabled === 'yes' ? 'flex' : 'none';
        if (pomoBubble) pomoBubble.style.display = pomoSettings.bubbles === 'yes' ? 'block' : 'none';
        if (pomoLogoIcon) pomoLogoIcon.textContent = pomoSettings.icon || '🍅';
        
        if (D.chatFab) D.chatFab.style.display = pomoSettings.aiEnabled === 'no' ? 'none' : 'flex';
        if (pomoSettings.aiEnabled === 'no' && D.chatWindow) D.chatWindow.classList.remove('open');

        document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

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

    if (settingsSaveBtn) {
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
                if (pomoTimeDisplay) {
                    let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
                    let s = String(pomoSeconds % 60).padStart(2, '0');
                    pomoTimeDisplay.textContent = `${m}:${s}`;
                }
            }

            renderDynamicTopNav();
            applyPomoSettingsUI();
            if (modalOverlay) modalOverlay.classList.remove('open');
        });
    }

    // ==========================================
    // 7. MODULE CHECKBOX & DYNAMIC NAV (QoL Top Nav)
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
        if (!D.modeSelector) return;
        D.modeSelector.innerHTML = '';
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
                handleRootChange();
            });
            D.modeSelector.appendChild(btn);
        });
        handleRootChange();
    }

    function handleRootChange() {
        if (D.utilWorkspace) D.utilWorkspace.style.display = 'none';
        if (D.phBox) D.phBox.style.display = 'block';
        if (D.view1) D.view1.style.display = 'none';
        if (D.view2) D.view2.style.display = 'none';
        if (D.omrPanel) D.omrPanel.style.display = 'none';
        if (D.resizer) D.resizer.style.display = 'none';
        if (D.btnExam) D.btnExam.style.display = 'none';
        if (D.btnSplit) D.btnSplit.style.display = 'none';
        if (D.btnLock) D.btnLock.style.display = 'none';
        if (D.btnNotes) D.btnNotes.style.display = 'none';
        
        window.currentActiveBook = null; 
        isSplitActive = false;
        if (D.mainContainer) D.mainContainer.classList.remove('split-active');

        if (currentRoot === 'UTILITIES') {
            if (D.libView) D.libView.style.display = 'none';
            if (D.utilView) D.utilView.style.display = 'flex';
            if (D.phBox) {
                D.phBox.querySelector('h2').innerText = "UTILITIES HUB";
                D.phBox.querySelector('p').innerText = "Select a tool from the sidebar to launch the workspace.";
            }
        } else {
            if (D.utilView) D.utilView.style.display = 'none';
            if (D.libView) D.libView.style.display = 'block';
            if (D.searchBar) D.searchBar.value = ''; 
            if (D.phBox) {
                D.phBox.querySelector('h2').innerText = "COMING NEVER";
                D.phBox.querySelector('p').innerText = "This was made with AI and the person who gave the command is busy with other shit.";
            }
            filterAndRender();
        }
    }

    // ==========================================
    // 8. UTILITIES WORKSPACE (Analytics & Whiteboard)
    // ==========================================
    document.getElementById('util-btn-analytics')?.addEventListener('click', () => openUtilityWorkspace('analytics'));
    document.getElementById('util-btn-whiteboard')?.addEventListener('click', () => openUtilityWorkspace('whiteboard'));
    document.getElementById('util-btn-settings')?.addEventListener('click', () => document.getElementById('pomo-modal-overlay')?.classList.add('open'));

    function openUtilityWorkspace(type) {
        if (!D.utilWorkspace) return;
        if (D.phBox) D.phBox.style.display = 'none';
        D.utilWorkspace.style.display = 'flex';
        
        if (type === 'analytics') {
            let total = 0; let streak = 0; let currDate = new Date();
            for (let date in studyStats) total += studyStats[date];
            while(true) {
                let dStr = currDate.toISOString().split('T')[0];
                if (studyStats[dStr] > 0) { streak++; currDate.setDate(currDate.getDate() - 1); } 
                else break;
            }

            let heatHTML = '';
            let heatDate = new Date(); heatDate.setDate(heatDate.getDate() - 41); 
            for(let i=0; i<42; i++) {
                let str = heatDate.toISOString().split('T')[0];
                let count = studyStats[str] || 0;
                let lvl = count > 6 ? 'lvl-4' : count > 4 ? 'lvl-3' : count > 2 ? 'lvl-2' : count > 0 ? 'lvl-1' : '';
                heatHTML += `<div class="heatmap-box ${lvl}" title="${str}: ${count} sessions"></div>`;
                heatDate.setDate(heatDate.getDate() + 1);
            }

            D.utilWorkspace.innerHTML = `
                <div class="util-workspace-inner">
                    <h2 style="font-size:2em; margin-bottom:30px;">📊 Study Analytics</h2>
                    <div class="util-dashboard-grid">
                        <div class="stat-card">
                            <div class="stat-value">${total}</div>
                            <div class="stat-label">Total Focus Sessions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" style="color:var(--danger);">${streak} 🔥</div>
                            <div class="stat-label">Current Streak</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${((total * pomoSettings.focusTime) / 60).toFixed(1)}</div>
                            <div class="stat-label">Hours Studied</div>
                        </div>
                    </div>
                    <div class="heatmap-container">
                        <label style="font-weight:bold; opacity:0.8;">Focus History (Last 6 Weeks)</label>
                        <div class="heatmap-grid" style="grid-template-columns: repeat(14, 1fr);">${heatHTML}</div>
                    </div>
                </div>
            `;
        } 
        else if (type === 'whiteboard') {
            D.utilWorkspace.innerHTML = `
                <div style="display:flex; flex-direction:column; height:100%; width:100%;">
                    <div style="padding:10px 20px; display:flex; justify-content:space-between; background:var(--folder-bg); border-bottom:1px solid var(--border-color);">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="font-weight:bold;">🖌️ Scratchpad</span>
                            <button class="color-btn active" data-color="#f8fafc" style="background:#f8fafc;"></button>
                            <button class="color-btn" data-color="#ef4444" style="background:#ef4444;"></button>
                            <button class="color-btn" data-color="#3b82f6" style="background:#3b82f6;"></button>
                            <button class="color-btn" data-color="#22c55e" style="background:#22c55e;"></button>
                            <button class="icon-btn" id="wb-eraser">🧹</button>
                            <input type="range" id="wb-size" min="1" max="15" value="3" style="width: 80px;">
                        </div>
                        <button class="icon-btn" id="wb-clear">🗑️ Clear</button>
                    </div>
                    <canvas id="main-canvas" style="flex-grow:1; cursor:crosshair;"></canvas>
                </div>
            `;
            initWhiteboard(document.getElementById('main-canvas'));
        }
        if (window.innerWidth <= 800 && sidebar) sidebar.classList.add('collapsed');
    }

    function initWhiteboard(canvas) {
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        let drawing = false, color = '#f8fafc', size = 3;

        function resize() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight - 50;
        }
        window.addEventListener('resize', resize);
        resize();

        document.querySelectorAll('.color-btn').forEach(b => b.addEventListener('click', e => {
            document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            color = e.target.getAttribute('data-color');
        }));
        document.getElementById('wb-eraser')?.addEventListener('click', () => color = getComputedStyle(document.body).getPropertyValue('--reader-bg').trim());
        document.getElementById('wb-clear')?.addEventListener('click', () => ctx.clearRect(0,0, canvas.width, canvas.height));
        document.getElementById('wb-size')?.addEventListener('input', e => size = e.target.value);

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            return { x: (e.clientX || e.touches[0].clientX) - rect.left, y: (e.clientY || e.touches[0].clientY) - rect.top };
        }
        canvas.addEventListener('mousedown', e => { drawing = true; const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
        canvas.addEventListener('mousemove', e => { if(!drawing) return; const p=getPos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle=color; ctx.lineWidth=size; ctx.lineCap='round'; ctx.stroke(); });
        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('mouseout', () => drawing = false);
    }

    // ==========================================
    // 9. TASKS & POMODORO LOGIC
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
        if (!pomoTimeDisplay) return;
        let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
        let s = String(pomoSeconds % 60).padStart(2, '0');
        pomoTimeDisplay.textContent = `${m}:${s}`;
    }

    pomoToggleBtn?.addEventListener('click', () => {
        if (isPomoRunning) {
            clearInterval(pomoInterval);
            isPomoRunning = false;
            pomoToggleBtn.textContent = '▶️';
            if (pomoCard) pomoCard.classList.remove('running');
        } else {
            isPomoRunning = true;
            pomoToggleBtn.textContent = '⏸️';
            if (pomoCard) pomoCard.classList.add('running');
            pomoInterval = setInterval(() => {
                if (pomoSeconds > 0) {
                    pomoSeconds--;
                    updatePomoDisplay();
                } else {
                    clearInterval(pomoInterval);
                    isPomoRunning = false;
                    pomoToggleBtn.textContent = '▶️';
                    if (pomoCard) pomoCard.classList.remove('running');
                    
                    // Add to analytics & Level Up!
                    studyStats[todayStr]++;
                    localStorage.setItem('study_stats', JSON.stringify(studyStats));
                    updateGamification();

                    alert("Timer completed!");
                }
            }, 1000);
        }
    });

    pomoResetBtn?.addEventListener('click', () => {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        pomoSeconds = pomoSettings.focusTime * 60;
        if (pomoToggleBtn) pomoToggleBtn.textContent = '▶️';
        if (pomoCard) pomoCard.classList.remove('running');
        updatePomoDisplay();
    });

    // ==========================================
    // 10. HOTKEYS, SPLIT SCREEN & CONTEXT NOTES
    // ==========================================
    if (D.themeToggle) {
        D.themeToggle.addEventListener('click', () => {
            pomoSettings.themeShade = pomoSettings.themeShade === 'theme-light' ? 'theme-amoled' : 'theme-light';
            D.themeToggle.textContent = pomoSettings.themeShade === 'theme-light' ? '🌙' : '☀️';
            applyPomoSettingsUI();
            localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
        });
    }

    if (D.desktopSidebarToggle && D.sidebar) {
        D.desktopSidebarToggle.addEventListener('click', () => {
            D.sidebar.classList.toggle('collapsed');
            D.desktopSidebarToggle.textContent = D.sidebar.classList.contains('collapsed') ? '▶' : '◀';
        });
    }

    if (D.fullscreenBtn) {
        D.fullscreenBtn.addEventListener('click', () => {
            if (!D.mainContainer) return;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (D.mainContainer.requestFullscreen) D.mainContainer.requestFullscreen();
                else if (D.mainContainer.webkitRequestFullscreen) D.mainContainer.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        });
    }

    // Split Screen Draggable Logic (QoL 3)
    if (D.btnSplit && D.resizer && D.mainContainer) {
        D.btnSplit.addEventListener('click', () => {
            isSplitActive = !isSplitActive;
            if (isSplitActive) {
                D.mainContainer.classList.add('split-active');
                if (D.view2) D.view2.style.display = 'block';
                if (D.resizer) D.resizer.style.display = 'block';
                if (D.btnLock) D.btnLock.style.display = 'flex';
                if (D.bookFrameSplit && D.bookFrame) D.bookFrameSplit.src = D.bookFrame.src;
                
                if (D.view1) D.view1.style.width = '50%';
                if (D.view2) D.view2.style.width = '50%';
                D.btnSplit.style.backgroundColor = 'var(--success)';
                if (D.omrPanel) D.omrPanel.style.display = 'none';
            } else {
                D.mainContainer.classList.remove('split-active');
                if (D.view2) D.view2.style.display = 'none';
                if (D.resizer) D.resizer.style.display = 'none';
                if (D.btnLock) D.btnLock.style.display = 'none';
                if (D.bookFrameSplit) D.bookFrameSplit.src = '';
                
                if (D.view1) D.view1.style.width = '100%';
                D.btnSplit.style.backgroundColor = '';
            }
        });

        // Toggle Lock
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
            if(D.view1) D.view1.style.pointerEvents = 'none';
            if(D.view2) D.view2.style.pointerEvents = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const containerRect = D.mainContainer.getBoundingClientRect();
            let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
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
                if(D.view1) D.view1.style.pointerEvents = 'auto';
                if(D.view2) D.view2.style.pointerEvents = 'auto';
            }
        });
    }

    // Context Aware Notes (QoL 2)
    let currentNoteKey = 'quick_notes_general';
    if (D.notesArea) D.notesArea.addEventListener('input', () => localStorage.setItem(currentNoteKey, D.notesArea.value));
    
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

    if (D.btnNotes && D.notesPanel) D.btnNotes.addEventListener('click', () => D.notesPanel.classList.toggle('open'));
    if (D.closeNotesBtn && D.notesPanel) D.closeNotesBtn.addEventListener('click', () => D.notesPanel.classList.remove('open'));

    if (D.notesCopyBtn && D.notesArea) {
        D.notesCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(D.notesArea.value).then(() => {
                D.notesCopyBtn.textContent = '✅';
                setTimeout(() => D.notesCopyBtn.textContent = '📋', 1500);
            });
        });
    }

    if (D.notesDlBtn && D.notesArea) {
        D.notesDlBtn.addEventListener('click', () => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([D.notesArea.value], { type: "text/plain" }));
            a.download = "Study_Notes.txt";
            a.click();
        });
    }

    // ==========================================
    // 11. EXAM SIMULATOR PRO (With Grid - QoL 5)
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
                        document.getElementById(`rev-${i}`).classList.remove('active');
                    } else { box.classList.remove('ans'); }
                });
            });

            document.getElementById(`rev-${i}`).addEventListener('click', (e) => {
                e.target.classList.toggle('active');
                if (e.target.classList.contains('active')) box.classList.add('rev');
                else box.classList.remove('rev');
            });
        }
    }

    if (D.btnExam && D.omrPanel) {
        D.btnExam.addEventListener('click', () => {
            isSplitActive = true;
            if (D.mainContainer) D.mainContainer.classList.add('split-active');
            D.omrPanel.style.display = 'flex';
            if (D.view2) D.view2.style.display = 'none'; 
            D.btnExam.style.display = 'none';
            if (D.btnLock) D.btnLock.style.display = 'flex'; 
            
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
    }

    document.getElementById('omr-submit-btn')?.addEventListener('click', () => {
        clearInterval(examTimerInterval);
        let answered = document.querySelectorAll('.grid-box.ans').length;
        let simulatedScore = answered * 4 - Math.floor(answered * 0.2); 
        alert(`Exam Submitted!\nYou attempted ${answered}/75 questions.\nEstimated Score: ${simulatedScore}/300`);
        
        if (D.mainContainer) D.mainContainer.classList.remove('split-active');
        if (D.omrPanel) D.omrPanel.style.display = 'none';
        isSplitActive = false;
        if (D.btnExam) D.btnExam.style.display = 'flex';
        if (D.btnLock) D.btnLock.style.display = 'none';
    });

    // ==========================================
    // 12. LIBRARY FILTERING & RENDERING
    // ==========================================
    if (D.searchBar) {
        D.searchBar.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterAndRender, 200); 
        });
    }

    const folderToggleBtn = document.getElementById('folder-toggle-btn');
    if (folderToggleBtn) folderToggleBtn.addEventListener('click', () => { isTreeExpanded = !isTreeExpanded; document.querySelectorAll('#book-list details').forEach(d => d.open = isTreeExpanded); });

    const localFileInput = document.getElementById('local-file-input');
    if (localFileInput) localFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        loadBook({ title: file.name, folders: ["LOCAL FILES", file.name], url: URL.createObjectURL(file) }, {});
    });

    function filterAndRender() {
        if (!D.bookList || masterLibrary.length === 0) return;
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
        if (!D.bookList) return;
        D.bookList.innerHTML = ''; 
        if (booksArray.length === 0) {
            D.bookList.innerHTML = `<div class="placeholder-text" style="font-size:0.85em; margin-top:20px; text-align:center;">${currentRoot === 'FAVORITES' ? 'No starred files yet.' : 'No files found.'}</div>`; 
            return;
        }

        if (currentRoot === "FAVORITES") {
            booksArray.forEach(b => D.bookList.appendChild(createBookElement(b)));
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
        D.bookList.appendChild(buildNode(fileTree, D.searchBar && D.searchBar.value.length > 0));
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
            if (playlistDropdown) {
                playlistDropdown.innerHTML = '';
                book.playlist.forEach((vid, index) => {
                    let opt = document.createElement('option');
                    opt.value = vid.url; 
                    opt.textContent = vid.title || `Lecture ${index + 1}`;
                    playlistDropdown.appendChild(opt);
                });
                playlistDropdown.style.display = 'block';
                playlistDropdown.onchange = (e) => {
                    if (D.bookFrame) D.bookFrame.src = e.target.value;
                    if (isSplitActive && D.bookFrameSplit) D.bookFrameSplit.src = e.target.value;
                };
            }
            if (D.bookFrame) D.bookFrame.src = book.playlist[0].url;
            if (isSplitActive && D.bookFrameSplit) D.bookFrameSplit.src = book.playlist[0].url;
        } else {
            if (playlistDropdown) playlistDropdown.style.display = 'none';
            if (D.bookFrame) D.bookFrame.src = finalUrl;
            if (isSplitActive && currentRoot !== 'SIMULATOR' && D.bookFrameSplit) D.bookFrameSplit.src = finalUrl;
        }

        if (D.view1) D.view1.style.display = 'block';

        if (pomoSettings.zenMode === 'yes' && D.sidebar && D.desktopSidebarToggle) {
            D.sidebar.classList.add('collapsed');
            D.desktopSidebarToggle.textContent = '▶';
        }

        if (window.innerWidth <= 800) toggleMobileMenu(); 
    }

    // ==========================================
    // 13. AI COPILOT CHAT
    // ==========================================
    if (D.chatFab && D.chatWindow) D.chatFab.addEventListener('click', () => D.chatWindow.classList.add('open'));
    if (D.chatClose && D.chatWindow) D.chatClose.addEventListener('click', () => D.chatWindow.classList.remove('open'));

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
                
                // QoL 4: Passing currentActiveBook to AI
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

    if (D.chatSend) D.chatSend.addEventListener('click', handleChatSubmit);
    if (D.chatInput) {
        D.chatInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') handleChatSubmit(); 
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'b' && D.desktopSidebarToggle) {
            e.preventDefault();
            D.desktopSidebarToggle.click();
        }
        if (e.ctrlKey && e.key === ' ' && D.chatFab && D.chatWindow) {
            e.preventDefault();
            D.chatWindow.classList.contains('open') ? D.chatClose.click() : D.chatFab.click();
        }
        if (e.key === 'Escape') {
            if (modalOverlay) modalOverlay.classList.remove('open');
            if (musicModalOverlay) musicModalOverlay.classList.remove('open');
            
            const analyticsModal = document.getElementById('analytics-modal-overlay');
            if (analyticsModal) analyticsModal.classList.remove('open');
            
            const wbOverlay = document.getElementById('whiteboard-overlay');
            if (wbOverlay) wbOverlay.classList.remove('open');
            
            if (D.chatWindow) D.chatWindow.classList.remove('open');
            if (D.notesPanel) D.notesPanel.classList.remove('open');
        }
    });

    applyPomoSettingsUI();
});
