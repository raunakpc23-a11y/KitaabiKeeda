document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. STATE & STORAGE INITIALIZATION
    // ==========================================
    let masterLibrary = [];
    let currentRoot = "IIT-JEE"; 
    let currentSubject = "All";
    window.currentActiveBook = null; 

    let completedBooks = JSON.parse(localStorage.getItem('library-completed')) || [];
    let starredBooks = JSON.parse(localStorage.getItem('library-starred')) || [];
    let customLibrary = JSON.parse(localStorage.getItem('custom_library')) || [];
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
        fontSize: 'font-medium', autoStart: 'no', volume: 0.5, zenMode: 'no', scratchpad: 'no'
    };

    let pomoSettings = { ...defaultSettings };
    try {
        const saved = JSON.parse(localStorage.getItem('pomo_settings'));
        if (saved && typeof saved === 'object') pomoSettings = { ...defaultSettings, ...saved };
    } catch(e) {}

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
    const splitLockBtn = document.getElementById('split-lock-btn');
    const resizer = document.getElementById('split-resizer');
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
    const notesToggleBtn = document.getElementById('notes-toggle-btn');
    const closeNotesBtn = document.getElementById('close-notes-btn');
    const notesCopyBtn = document.getElementById('notes-copy-btn');
    const notesDlBtn = document.getElementById('notes-dl-btn');

    // ==========================================
    // 3. GAMIFICATION ENGINE
    // ==========================================
    function updateGamification() {
        const lvlBadge = document.getElementById('user-level-badge');
        if (!lvlBadge) return;
        let totalMins = 0;
        for (let date in studyStats) {
            totalMins += (studyStats[date] * pomoSettings.focusTime);
        }
        let lvl = Math.floor(Math.sqrt(totalMins / 30)) + 1;
        
        let title = "Novice";
        if (lvl > 3) title = "Scholar";
        if (lvl > 10) title = "Capybara Sage";
        if (lvl > 25) title = "Ascended Master";

        lvlBadge.innerText = `Lvl ${lvl}: ${title}`;
    }

    // ==========================================
    // 4. LOAD LIBRARIES & MERGE CUSTOMS
    // ==========================================
    setTimeout(() => {
        if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
        if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
        if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
        if (Array.isArray(customLibrary)) masterLibrary.push(...customLibrary);
        
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
            } else { 
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
        if (modalOverlay) modalOverlay.classList.add('open'); 
    });
    
    document.getElementById('pomo-close-modal')?.addEventListener('click', () => {
        if (modalOverlay) modalOverlay.classList.remove('open');
    });

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => { 
            if (e.target === modalOverlay) modalOverlay.classList.remove('open'); 
        });
    }

    document.getElementById('music-open-btn')?.addEventListener('click', () => musicModalOverlay?.classList.add('open'));
    document.getElementById('music-close-modal')?.addEventListener('click', () => musicModalOverlay?.classList.remove('open'));
    if (musicModalOverlay) musicModalOverlay.addEventListener('click', (e) => { if (e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); });

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
        
        if (chatFab) chatFab.style.display = pomoSettings.aiEnabled === 'no' ? 'none' : 'flex';
        if (pomoSettings.aiEnabled === 'no' && chatWindow) chatWindow.classList.remove('open');

        const utilWb = document.getElementById('util-sidebar-whiteboard');
        if (utilWb) utilWb.style.display = pomoSettings.scratchpad === 'yes' ? 'flex' : 'none';

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
        setSettingVal('pomo-setting-scratchpad', pomoSettings.scratchpad || 'no');

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
            pomoSettings.scratchpad = getSettingVal('pomo-setting-scratchpad', 'no');

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
        if (!selectorBox) return;
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
                
                // ROUTING: Utilities vs Library
                const libView = document.getElementById('library-sidebar-view');
                const utilView = document.getElementById('utilities-sidebar-view');
                const phBox = document.getElementById('placeholder-box');
                const mainContainer = document.getElementById('reader-container-main');
                const utilWorkspace = document.getElementById('utilities-workspace');

                if (currentRoot === 'UTILITIES') {
                    if (libView) libView.style.display = 'none';
                    if (utilView) utilView.style.display = 'flex';
                    if (phBox) {
                        phBox.querySelector('h2').innerText = "UTILITIES HUB";
                        phBox.querySelector('p').innerText = "Select a tool from the sidebar to launch it.";
                        phBox.style.display = 'block';
                    }
                    if (utilWorkspace) utilWorkspace.style.display = 'none';
                    if (viewerWrapper) viewerWrapper.style.display = 'none';
                    if (viewerWrapperSplit) viewerWrapperSplit.style.display = 'none';
                    const omrPanel = document.getElementById('omr-panel');
                    if (omrPanel) omrPanel.style.display = 'none';
                    if (splitScreenBtn) splitScreenBtn.style.display = 'none';
                    if (splitLockBtn) splitLockBtn.style.display = 'none';
                    if (startExamBtn) startExamBtn.style.display = 'none';
                    if (resizer) resizer.style.display = 'none';
                    if (mainContainer) mainContainer.classList.remove('split-active');
                    isSplitActive = false;
                } else {
                    if (utilView) utilView.style.display = 'none';
                    if (libView) libView.style.display = 'flex';
                    if (searchBar) searchBar.value = ''; 
                    if (phBox) {
                        phBox.querySelector('h2').innerText = "COMING NEVER";
                        phBox.querySelector('p').innerText = "This was made with AI and the person who gave the command is busy with other shit.";
                        phBox.style.display = 'block';
                    }
                    if (utilWorkspace) utilWorkspace.style.display = 'none';
                    if (viewerWrapper) viewerWrapper.style.display = 'none';
                    if (viewerWrapperSplit) viewerWrapperSplit.style.display = 'none';
                    const omrPanel = document.getElementById('omr-panel');
                    if (omrPanel) omrPanel.style.display = 'none';
                    if (mainContainer) mainContainer.classList.remove('split-active');
                    isSplitActive = false;
                    filterAndRender();
                }
            });
            selectorBox.appendChild(btn);
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
    // 9. FILE VIEWER, SPLIT SCREEN & CONTEXT NOTES
    // ==========================================
    function toggleMobileMenu() {
        if (sidebar) sidebar.classList.toggle('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.toggle('open');
    }
    document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('sidebar-overlay')?.addEventListener('click', toggleMobileMenu);

    desktopSidebarToggle?.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('collapsed');
        desktopSidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    });

    themeToggle?.addEventListener('click', () => {
        pomoSettings.themeShade = pomoSettings.themeShade === 'theme-light' ? 'theme-amoled' : 'theme-light';
        themeToggle.textContent = pomoSettings.themeShade === 'theme-light' ? '🌙' : '☀️';
        applyPomoSettingsUI();
        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    });

    fullscreenBtn?.addEventListener('click', () => {
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

    // Split Screen Draggable Logic
    if (splitScreenBtn) {
        splitScreenBtn.addEventListener('click', () => {
            isSplitActive = !isSplitActive;
            const mainContainer = document.getElementById('reader-container-main');
            
            if (!mainContainer || !viewerWrapperSplit || !bookFrameSplit) return;

            if (isSplitActive) {
                mainContainer.classList.add('split-active');
                viewerWrapperSplit.style.display = 'block';
                if (bookFrame) bookFrameSplit.src = bookFrame.src;
                splitScreenBtn.style.backgroundColor = 'var(--success)';
                const omrPanel = document.getElementById('omr-panel');
                if (omrPanel) omrPanel.style.display = 'none'; 
                
                if (resizer) resizer.style.display = 'block';
                if (splitLockBtn) splitLockBtn.style.display = 'flex';
                if (viewerWrapper) viewerWrapper.style.width = '50%';
                if (viewerWrapperSplit) viewerWrapperSplit.style.width = '50%';
            } else {
                mainContainer.classList.remove('split-active');
                viewerWrapperSplit.style.display = 'none';
                bookFrameSplit.src = '';
                splitScreenBtn.style.backgroundColor = '';
                
                if (resizer) resizer.style.display = 'none';
                if (splitLockBtn) splitLockBtn.style.display = 'none';
                if (viewerWrapper) viewerWrapper.style.width = '100%';
            }
        });
    }

    if (splitLockBtn && resizer) {
        splitLockBtn.addEventListener('click', () => {
            isSplitLocked = !isSplitLocked;
            splitLockBtn.textContent = isSplitLocked ? '🔒' : '🔓';
            if (isSplitLocked) resizer.classList.add('locked');
            else resizer.classList.remove('locked');
        });

        resizer.addEventListener('mousedown', (e) => {
            if (isSplitLocked) return;
            isResizing = true;
            resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            if (viewerWrapper) viewerWrapper.style.pointerEvents = 'none';
            if (viewerWrapperSplit) viewerWrapperSplit.style.pointerEvents = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const mainContainer = document.getElementById('reader-container-main');
            if (!mainContainer) return;
            const containerRect = mainContainer.getBoundingClientRect();
            let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            if (newWidth < 20) newWidth = 20;
            if (newWidth > 80) newWidth = 80;
            if (viewerWrapper) viewerWrapper.style.width = `${newWidth}%`;
            if (viewerWrapperSplit) viewerWrapperSplit.style.width = `${100 - newWidth}%`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('dragging');
                document.body.style.cursor = 'default';
                if (viewerWrapper) viewerWrapper.style.pointerEvents = 'auto';
                if (viewerWrapperSplit) viewerWrapperSplit.style.pointerEvents = 'auto';
            }
        });
    }

    // Context Notes Logic
    let currentNoteKey = 'quick_notes_general';
    if (notesToggleBtn && notesPanel) notesToggleBtn.addEventListener('click', () => notesPanel.classList.toggle('open'));
    if (closeNotesBtn && notesPanel) closeNotesBtn.addEventListener('click', () => notesPanel.classList.remove('open'));
    
    if (notesArea) {
        notesArea.value = localStorage.getItem(currentNoteKey) || '';
        notesArea.addEventListener('input', () => localStorage.setItem(currentNoteKey, notesArea.value));
    }

    function loadContextNotes(bookTitle) {
        if (!notesArea || !document.getElementById('notes-title-label')) return;
        if (bookTitle) {
            currentNoteKey = 'notes_' + bookTitle.replace(/[^a-z0-9]/gi, '_');
            document.getElementById('notes-title-label').innerHTML = `📝 Notes: <span style="opacity:0.7; font-size:0.85em; font-weight:normal;">${bookTitle}</span>`;
        } else {
            currentNoteKey = 'quick_notes_general';
            document.getElementById('notes-title-label').innerHTML = `📝 General Scratchpad`;
        }
        notesArea.value = localStorage.getItem(currentNoteKey) || '';
    }

    if (notesCopyBtn && notesArea) {
        notesCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(notesArea.value).then(() => {
                notesCopyBtn.textContent = '✅';
                setTimeout(() => notesCopyBtn.textContent = '📋', 1500);
            });
        });
    }

    if (notesDlBtn && notesArea) {
        notesDlBtn.addEventListener('click', () => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([notesArea.value], { type: "text/plain" }));
            a.download = "Study_Notes.txt";
            a.click();
        });
    }

    // ==========================================
    // 10. UTILITIES LOGIC (Analytics, Timetable, Syllabus, Whiteboard)
    // ==========================================
    
    function openUtilityWorkspace(type) {
        const utilWorkspace = document.getElementById('utilities-workspace');
        const phBox = document.getElementById('placeholder-box');
        if (!utilWorkspace || !phBox) return;
        
        phBox.style.display = 'none';
        utilWorkspace.style.display = 'flex';

        if (type === 'analytics') {
            let total = 0; let streak = 0; let currDate = new Date();
            for (let date in studyStats) total += studyStats[date];
            
            while(true) {
                let dStr = currDate.toISOString().split('T')[0];
                if (studyStats[dStr] && studyStats[dStr] > 0) {
                    streak++; currDate.setDate(currDate.getDate() - 1);
                } else break;
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

            utilWorkspace.innerHTML = `
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
        else if (type === 'timetable') {
            utilWorkspace.innerHTML = `
                <div class="util-workspace-inner" style="padding: 20px;">
                    <div class="tt-layout">
                        <div class="tt-monthly">
                            <h3>🎯 Monthly Goals</h3>
                            <textarea id="tt-monthly-goals" placeholder="What are we conquering this month?"></textarea>
                        </div>
                        <div class="tt-daily">
                            <div class="tt-tabs" id="tt-tabs-container"></div>
                            <div class="tt-hours-container" id="tt-hours-container"></div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize 10 Dates
            const today = new Date();
            today.setHours(0,0,0,0);
            const dateList = [];
            for (let i = -1; i <= 8; i++) {
                let d = new Date(today);
                d.setDate(d.getDate() + i);
                dateList.push(d);
            }

            let ttData = JSON.parse(localStorage.getItem('study_timetable_pro')) || {};
            
            document.getElementById('tt-monthly-goals').value = ttData.monthly || "";
            document.getElementById('tt-monthly-goals').addEventListener('input', (e) => {
                ttData.monthly = e.target.value;
                localStorage.setItem('study_timetable_pro', JSON.stringify(ttData));
            });

            const tabsContainer = document.getElementById('tt-tabs-container');
            const hoursContainer = document.getElementById('tt-hours-container');

            function renderDay(dateObj) {
                hoursContainer.innerHTML = '';
                const dateKey = dateObj.toISOString().split('T')[0];
                
                for(let hour = 6; hour <= 23; hour++) {
                    let ampm = hour >= 12 ? 'PM' : 'AM';
                    let displayHour = hour % 12 === 0 ? 12 : hour % 12;
                    let timeStr = `${String(displayHour).padStart(2, '0')}:00 ${ampm}`;
                    let slotKey = `${dateKey}_${timeStr}`;

                    let row = document.createElement('div');
                    row.className = 'tt-hour-row';
                    row.innerHTML = `
                        <div class="tt-time">${timeStr}</div>
                        <div class="tt-input" contenteditable="true" placeholder="Plan for ${timeStr}..."></div>
                    `;
                    
                    let inputDiv = row.querySelector('.tt-input');
                    inputDiv.innerText = ttData[slotKey] || "";
                    inputDiv.addEventListener('input', (e) => {
                        ttData[slotKey] = e.target.innerText;
                        localStorage.setItem('study_timetable_pro', JSON.stringify(ttData));
                    });

                    hoursContainer.appendChild(row);
                }
            }

            dateList.forEach((d, idx) => {
                let tab = document.createElement('div');
                tab.className = 'tt-tab';
                if(idx === 1) tab.classList.add('active'); // Today is idx 1
                
                let dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                let monthDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                let label = idx === 1 ? "Today" : `${dayName}, ${monthDate}`;
                tab.innerText = label;

                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tt-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    renderDay(d);
                });
                tabsContainer.appendChild(tab);
            });

            renderDay(dateList[1]); // Render Today
        }
        else if (type === 'syllabus') {
            const deepSyllabus = {
                "Class12": {
                    "Physics": ["Electric Charges & Fields", "Electrostatic Potential", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature", "Atoms", "Nuclei", "Semiconductors"],
                    "Chemistry": ["Solutions", "Electrochemistry", "Chemical Kinetics", "d and f Block", "Coordination Compounds", "Haloalkanes", "Alcohols, Phenols", "Aldehydes, Ketones", "Amines", "Biomolecules"],
                    "Maths": ["Relations & Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "3D Geometry", "Linear Programming", "Probability"]
                },
                "JEEMains": {
                    "Physics": ["Physics & Measurement", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation", "Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations & Waves", "Electrostatics", "Current Electricity", "Magnetic Effects", "EMI & AC", "EM Waves", "Optics", "Dual Nature", "Atoms & Nuclei", "Electronic Devices", "Experimental Skills"],
                    "Chemistry": ["Basic Concepts", "Atomic Structure", "Chemical Bonding", "Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions", "Chemical Kinetics", "Classification", "p-Block", "d & f Block", "Coordination", "Purification", "Hydrocarbons", "Halogens", "Oxygen Compounds", "Nitrogen Compounds", "Biomolecules", "Practical Chemistry"],
                    "Maths": ["Sets & Functions", "Complex Numbers", "Matrices & Determinants", "Permutations & Combinations", "Binomial Theorem", "Sequence & Series", "Limit & Continuity", "Integral Calculus", "Differential Equations", "Coordinate Geometry", "3D Geometry", "Vector Algebra", "Statistics & Probability", "Trigonometry"]
                },
                "JEEAdv": {
                    "Physics": ["General Physics", "Mechanics", "Thermal Physics", "Electricity & Magnetism", "Electromagnetic Waves", "Optics", "Modern Physics"],
                    "Chemistry": ["General Topics", "Gaseous & Liquid States", "Atomic Structure & Bonding", "Energetics", "Chemical Equilibrium", "Electrochemistry", "Chemical Kinetics", "Solid State", "Solutions", "Surface Chemistry", "Nuclear Chemistry", "Isolation of Metals", "Transition Elements", "Basic Organic", "Reaction Mechanisms", "Polymers & Biomolecules"],
                    "Maths": ["Algebra", "Matrices", "Probability", "Trigonometry", "Analytical Geometry (2D & 3D)", "Differential Calculus", "Integral Calculus", "Vectors"]
                }
            };

            const states = [
                { text: '⚪ Unstudied', color: 'var(--text-color)', bg: 'transparent' },
                { text: '🟡 Theory', color: '#000', bg: '#fde047' },
                { text: '🔵 PYQs', color: '#fff', bg: '#3b82f6' },
                { text: '🟢 Mastered', color: '#fff', bg: '#22c55e' }
            ];

            let sylData = JSON.parse(localStorage.getItem('study_syllabus_pro')) || {};

            utilWorkspace.innerHTML = `
                <div class="util-workspace-inner" style="padding: 20px;">
                    <div class="syl-layout">
                        <h2 style="font-size:2.2em; margin-bottom:10px; text-align:center;">📑 Immersive Syllabus Tracker</h2>
                        <div class="syl-tabs">
                            <button class="syl-tab active" data-target="Class12">Class 12 Boards</button>
                            <button class="syl-tab" data-target="JEEMains">JEE Mains</button>
                            <button class="syl-tab" data-target="JEEAdv">JEE Advanced</button>
                        </div>
                        <div class="overall-progress-bar"><div class="overall-progress-fill" id="syllabus-progress"></div></div>
                        <p style="margin-bottom:20px; font-weight:bold; opacity:0.8; text-align:center; margin-top:5px;" id="syllabus-progress-text">0% Completed</p>
                        <div class="syl-content-area" id="syl-content-area"></div>
                    </div>
                </div>
            `;

            const contentArea = document.getElementById('syl-content-area');

            function updateSylProgress() {
                let total = 0; let score = 0;
                for(let page in deepSyllabus) {
                    for(let subj in deepSyllabus[page]) {
                        deepSyllabus[page][subj].forEach(chap => {
                            let dbKey = `${page}_${subj}_${chap}`;
                            total += 3;
                            score += (sylData[dbKey] || 0);
                        });
                    }
                }
                let pct = total === 0 ? 0 : Math.round((score/total)*100);
                const pBar = document.getElementById('syllabus-progress');
                const pText = document.getElementById('syllabus-progress-text');
                if (pBar) pBar.style.width = `${pct}%`;
                if (pText) pText.innerText = `Overall Readiness: ${pct}%`;
            }

            function renderSyllabusPage(pageKey) {
                contentArea.innerHTML = '';
                const pageData = deepSyllabus[pageKey];
                
                for(let subj in pageData) {
                    let detail = document.createElement('details');
                    detail.className = 'syl-subject';
                    detail.open = true;
                    detail.innerHTML = `<summary>${subj} (${pageData[subj].length} Chapters)</summary> <div class="syl-grid" id="grid-${subj}"></div>`;
                    contentArea.appendChild(detail);

                    const grid = detail.querySelector(`#grid-${subj}`);
                    pageData[subj].forEach(chap => {
                        let dbKey = `${pageKey}_${subj}_${chap}`;
                        let stIdx = sylData[dbKey] || 0;
                        
                        let item = document.createElement('div');
                        item.className = 'syl-item';
                        item.innerHTML = `
                            <div class="syl-item-title">${chap}</div>
                            <button class="syl-btn" style="background:${states[stIdx].bg}; color:${states[stIdx].color}; border-color:${stIdx===0?'var(--border-color)':'transparent'}">${states[stIdx].text}</button>
                        `;

                        let btn = item.querySelector('.syl-btn');
                        btn.addEventListener('click', () => {
                            stIdx = (stIdx + 1) % 4;
                            sylData[dbKey] = stIdx;
                            localStorage.setItem('study_syllabus_pro', JSON.stringify(sylData));
                            btn.innerText = states[stIdx].text;
                            btn.style.background = states[stIdx].bg;
                            btn.style.color = states[stIdx].color;
                            btn.style.borderColor = stIdx === 0 ? 'var(--border-color)' : 'transparent';
                            updateSylProgress();
                        });
                        grid.appendChild(item);
                    });
                }
            }

            document.querySelectorAll('.syl-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    document.querySelectorAll('.syl-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    renderSyllabusPage(e.target.getAttribute('data-target'));
                });
            });

            renderSyllabusPage('Class12');
            updateSylProgress();
        }
        else if (type === 'whiteboard') {
            utilWorkspace.innerHTML = `
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

            const canvas = document.getElementById('main-canvas');
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
        
        if (window.innerWidth <= 800) {
            sidebar?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('open');
        }
    }

    // Attach Event Listeners to Sidebar Buttons
    document.getElementById('util-sidebar-analytics')?.addEventListener('click', () => openUtilityWorkspace('analytics'));
    document.getElementById('util-sidebar-timetable')?.addEventListener('click', () => openUtilityWorkspace('timetable'));
    document.getElementById('util-sidebar-syllabus')?.addEventListener('click', () => openUtilityWorkspace('syllabus'));
    document.getElementById('util-sidebar-whiteboard')?.addEventListener('click', () => openUtilityWorkspace('whiteboard'));
    document.getElementById('util-sidebar-settings')?.addEventListener('click', () => document.getElementById('pomo-open-settings')?.click());

    // Legacy Analytics Button from header
    document.getElementById('analytics-btn')?.addEventListener('click', () => openUtilityWorkspace('analytics'));

    // ==========================================
    // 11. NATIVE OMR SIMULATOR (QoL 5)
    // ==========================================
    let examTimerInterval;
    let examSeconds = 10800; 
    const omrPanel = document.getElementById('omr-panel');

    document.getElementById('omr-grid-toggle')?.addEventListener('click', () => {
        const omrGrid = document.getElementById('omr-jump-grid');
        if (omrGrid) omrGrid.style.display = omrGrid.style.display === 'none' ? 'grid' : 'none';
    });

    function renderOMRSheet() {
        const omrContainer = document.getElementById('omr-questions-container');
        const omrGrid = document.getElementById('omr-jump-grid');
        if (!omrContainer || !omrGrid) return;
        
        omrContainer.innerHTML = '';
        omrGrid.innerHTML = '';

        for (let i = 1; i <= 75; i++) {
            let box = document.createElement('div');
            box.className = 'grid-box';
            box.id = `grid-box-${i}`;
            box.innerText = i;
            box.addEventListener('click', () => document.getElementById(`q-row-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            omrGrid.appendChild(box);

            let row = document.createElement('div');
            row.className = 'omr-row';
            row.id = `q-row-${i}`;
            row.innerHTML = `
                <div class="omr-num">${i}.</div>
                <div class="omr-options">
                    <div class="omr-circle" data-q="${i}" data-opt="A">A</div>
                    <div class="omr-circle" data-q="${i}" data-opt="B">B</div>
                    <div class="omr-circle" data-q="${i}" data-opt="C">C</div>
                    <div class="omr-circle" data-q="${i}" data-opt="D">D</div>
                </div>
                <button class="btn-review" id="rev-${i}">Mark</button>
            `;
            omrContainer.appendChild(row);
            
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

    if (startExamBtn && omrPanel) {
        startExamBtn.addEventListener('click', () => {
            isSplitActive = true;
            const mainContainer = document.getElementById('reader-container-main');
            if (mainContainer) mainContainer.classList.add('split-active');
            omrPanel.style.display = 'flex';
            if (viewerWrapperSplit) viewerWrapperSplit.style.display = 'none'; 
            startExamBtn.style.display = 'none';
            
            if (resizer) resizer.style.display = 'block';
            if (splitLockBtn) splitLockBtn.style.display = 'flex';
            if (viewerWrapper) viewerWrapper.style.width = '50%';
            
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
        
        const mainContainer = document.getElementById('reader-container-main');
        if (mainContainer) mainContainer.classList.remove('split-active');
        if (omrPanel) omrPanel.style.display = 'none';
        if (resizer) resizer.style.display = 'none';
        if (splitLockBtn) splitLockBtn.style.display = 'none';
        isSplitActive = false;
        if (startExamBtn) startExamBtn.style.display = 'flex';
    });

    // ==========================================
    // 12. LIBRARY FILTERING & RENDERING
    // ==========================================
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterAndRender, 200); 
        });
    }

    const folderToggleBtn = document.getElementById('folder-toggle-btn');
    if (folderToggleBtn) {
        folderToggleBtn.addEventListener('click', () => {
            isTreeExpanded = !isTreeExpanded;
            document.querySelectorAll('#book-list details').forEach(d => d.open = isTreeExpanded);
        });
    }

    const localFileInput = document.getElementById('local-file-input');
    if (localFileInput) {
        localFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            loadBook({ title: file.name, folders: ["LOCAL FILES", file.name], url: URL.createObjectURL(file) }, {});
        });
    }

    function filterAndRender() {
        if (!bookListElement || masterLibrary.length === 0) return;
        const query = searchBar ? searchBar.value.toLowerCase().trim() : "";
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
        if (!bookListElement) return;
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
        bookListElement.appendChild(buildNode(fileTree, searchBar && searchBar.value.length > 0));
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
        const phBox = document.getElementById('placeholder-box');
        const utilWorkspace = document.getElementById('utilities-workspace');

        if (titleText) titleText.textContent = book.title || "File";
        if (breadcrumbText) breadcrumbText.textContent = book.folders ? book.folders.join(" > ") : (book.title || "");
        if (phBox) phBox.style.display = 'none';
        if (utilWorkspace) utilWorkspace.style.display = 'none';
        
        if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
        if (notesToggleBtn) notesToggleBtn.style.display = 'flex';
        
        // Handle Action Buttons Visibility
        if (currentRoot === 'SIMULATOR') {
            if (startExamBtn) startExamBtn.style.display = 'flex';
            if (splitScreenBtn) splitScreenBtn.style.display = 'none';
            if (splitLockBtn) splitLockBtn.style.display = 'none';
        } else {
            if (startExamBtn) startExamBtn.style.display = 'none';
            if (splitScreenBtn) splitScreenBtn.style.display = 'flex';
            if (splitLockBtn) splitLockBtn.style.display = isSplitActive ? 'flex' : 'none';
            const omrPanel = document.getElementById('omr-panel');
            if (omrPanel) omrPanel.style.display = 'none';
            
            const mainContainer = document.getElementById('reader-container-main');
            if (mainContainer) mainContainer.classList.remove('split-active');
            isSplitActive = false;
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
                    if (bookFrame) bookFrame.src = e.target.value;
                    if (isSplitActive && bookFrameSplit) bookFrameSplit.src = e.target.value;
                };
            }
            if (bookFrame) bookFrame.src = book.playlist[0].url;
            if (isSplitActive && bookFrameSplit) bookFrameSplit.src = book.playlist[0].url;
        } else {
            if (playlistDropdown) playlistDropdown.style.display = 'none';
            if (bookFrame) bookFrame.src = finalUrl;
            if (isSplitActive && currentRoot !== 'SIMULATOR' && bookFrameSplit) bookFrameSplit.src = finalUrl;
        }

        if (viewerWrapper) viewerWrapper.style.display = 'block';

        if (pomoSettings.zenMode === 'yes' && sidebar && desktopSidebarToggle) {
            sidebar.classList.add('collapsed');
            desktopSidebarToggle.textContent = '▶';
        }

        if (window.innerWidth <= 800) {
            sidebar?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('open');
        }
    }

    // ==========================================
    // 13. PHASE 1 & 2: SPOTLIGHT, DATA & CUSTOM LIB
    // ==========================================
    // Data Backup (Phase 1)
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
        const backupData = {
            libraryCompleted: completedBooks,
            libraryStarred: starredBooks,
            studyStats: studyStats,
            pomoSettings: pomoSettings,
            pomoTasks: pomoTasks,
            customLibrary: customLibrary,
            notes: {}
        };
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            if (k && (k.startsWith('notes_') || k.startsWith('quick_notes_') || k === 'study_timetable_pro' || k === 'jee_syllabus')) {
                backupData.notes[k] = localStorage.getItem(k);
            }
        }
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `StudyLibrary_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    document.getElementById('import-data-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.libraryCompleted) localStorage.setItem('library-completed', JSON.stringify(data.libraryCompleted));
                if (data.libraryStarred) localStorage.setItem('library-starred', JSON.stringify(data.libraryStarred));
                if (data.studyStats) localStorage.setItem('study_stats', JSON.stringify(data.studyStats));
                if (data.pomoSettings) localStorage.setItem('pomo_settings', JSON.stringify(data.pomoSettings));
                if (data.pomoTasks) localStorage.setItem('pomo_tasks', JSON.stringify(data.pomoTasks));
                if (data.customLibrary) localStorage.setItem('custom_library', JSON.stringify(data.customLibrary));
                if (data.notes) {
                    for (let k in data.notes) localStorage.setItem(k, data.notes[k]);
                }
                alert("Backup restored successfully! Refreshing...");
                location.reload();
            } catch (err) {
                alert("Invalid backup file.");
            }
        };
        reader.readAsText(file);
    });

    // Custom Resource Modal (Phase 2)
    const addResModal = document.getElementById('add-resource-modal-overlay');
    document.getElementById('open-add-resource-modal')?.addEventListener('click', () => addResModal?.classList.add('open'));
    document.getElementById('add-resource-close-btn')?.addEventListener('click', () => addResModal?.classList.remove('open'));

    document.getElementById('save-new-resource-btn')?.addEventListener('click', () => {
        const title = document.getElementById('new-res-title').value.trim();
        const root = document.getElementById('new-res-root').value;
        const folder = document.getElementById('new-res-folder').value.trim();
        const url = document.getElementById('new-res-url').value.trim();

        if (!title || !url) {
            alert("Please fill in Title and URL!");
            return;
        }

        const foldersArr = [root];
        if (folder) {
            folder.split('>').map(f => f.trim()).forEach(f => { if(f) foldersArr.push(f); });
        }

        const newBook = { title, folders: foldersArr, url };
        customLibrary.push(newBook);
        masterLibrary.push(newBook);
        localStorage.setItem('custom_library', JSON.stringify(customLibrary));

        addResModal?.classList.remove('open');
        document.getElementById('new-res-title').value = '';
        document.getElementById('new-res-folder').value = '';
        document.getElementById('new-res-url').value = '';

        filterAndRender();
        alert("Resource added to library successfully!");
    });

    // Spotlight Command Palette (Phase 2)
    const spotlightOverlay = document.getElementById('spotlight-overlay');
    const spotlightInput = document.getElementById('spotlight-input');
    const spotlightResults = document.getElementById('spotlight-results');

    function openSpotlight() {
        if (!spotlightOverlay || !spotlightInput) return;
        spotlightOverlay.classList.add('open');
        spotlightInput.value = '';
        renderSpotlightResults('');
        setTimeout(() => spotlightInput.focus(), 50);
    }

    function closeSpotlight() {
        if (spotlightOverlay) spotlightOverlay.classList.remove('open');
    }

    function renderSpotlightResults(q) {
        if (!spotlightResults) return;
        spotlightResults.innerHTML = '';
        const query = q.toLowerCase().trim();

        let matches = masterLibrary.filter(b => b && b.title && b.title.toLowerCase().includes(query)).slice(0, 8);
        
        if (matches.length === 0) {
            spotlightResults.innerHTML = `<div style="padding:15px; text-align:center; opacity:0.6; font-size:0.9em;">No matching files found.</div>`;
            return;
        }

        matches.forEach(b => {
            let item = document.createElement('div');
            item.className = 'spotlight-item';
            item.innerHTML = `<span>📄 ${b.title}</span><span style="font-size:0.75em; opacity:0.6;">${b.folders ? b.folders.join(' > ') : ''}</span>`;
            item.addEventListener('click', () => {
                loadBook(b, null);
                closeSpotlight();
            });
            spotlightResults.appendChild(item);
        });
    }

    spotlightInput?.addEventListener('input', (e) => renderSpotlightResults(e.target.value));

    // ==========================================
    // 14. AI COPILOT CHAT
    // ==========================================
    if (chatFab && chatWindow) {
        chatFab.addEventListener('click', () => chatWindow.classList.add('open'));
    }
    if (chatClose && chatWindow) {
        chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));
    }

    if (chatBody) {
        let savedChat = localStorage.getItem('ai_chat_history');
        if (savedChat) { 
            chatBody.innerHTML = savedChat; 
            chatBody.scrollTop = chatBody.scrollHeight; 
        }
    }

    function appendMsg(html, isUser) {
        if (!chatBody) return;
        const d = document.createElement('div');
        d.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
        d.innerHTML = html;
        chatBody.appendChild(d);
        chatBody.scrollTop = chatBody.scrollHeight;
        localStorage.setItem('ai_chat_history', chatBody.innerHTML);
    }

    async function handleChatSubmit() {
        if (!chatInput) return;
        const val = chatInput.value.trim();
        if (!val) return;
        appendMsg(val, true);
        chatInput.value = '';

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
            if (chatWindow) chatWindow.classList.remove('open'); 
        }
    };

    if (chatSend) chatSend.addEventListener('click', handleChatSubmit);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') handleChatSubmit(); 
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            spotlightOverlay?.classList.contains('open') ? closeSpotlight() : openSpotlight();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'b' && desktopSidebarToggle) {
            e.preventDefault();
            desktopSidebarToggle.click();
        }
        if (e.ctrlKey && e.key === ' ' && chatFab && chatWindow) {
            e.preventDefault();
            chatWindow.classList.contains('open') ? chatClose.click() : chatFab.click();
        }
        if (e.key === 'Escape') {
            closeSpotlight();
            addResModal?.classList.remove('open');
            if (modalOverlay) modalOverlay.classList.remove('open');
            if (musicModalOverlay) musicModalOverlay.classList.remove('open');
            const analyticsModal = document.getElementById('analytics-modal-overlay');
            if (analyticsModal) analyticsModal.classList.remove('open');
            const wbOverlay = document.getElementById('whiteboard-overlay');
            if (wbOverlay) wbOverlay.classList.remove('open');
            if (chatWindow) chatWindow.classList.remove('open');
            if (notesPanel) notesPanel.classList.remove('open');
        }
    });

});
