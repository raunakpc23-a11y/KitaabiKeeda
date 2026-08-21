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
    // 2. DOM CACHE (Grabbing all elements securely)
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
    const playlistDropdown = document.getElementById('playlist-dropdown');
    const downloadBtn = document.getElementById('download-btn');
    const splitScreenBtn = document.getElementById('split-screen-btn');
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

    // Load External File Data
    setTimeout(() => {
        if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
        if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
        if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
        renderDynamicTopNav();
    }, 150);

    // ==========================================
    // 3. WEB AUDIO API SYNTHESIZER
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

    document.getElementById('ambient-play-toggle').onclick = () => {
        const type = document.getElementById('music-preset-select').value;
        if (isAmbientPlaying) {
            stopAmbientAudio();
        } else {
            ambientNode = createNoiseGenerator(type);
            isAmbientPlaying = true;
            document.getElementById('ambient-play-toggle').textContent = "⏹ Stop Ambient Sound";
        }
    };

    const musicPresets = {
        'spotify-lofi': 'https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?utm_source=generator&theme=0',
        'spotify-focus': 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
        'spotify-classical': 'https://open.spotify.com/embed/playlist/37i9dQZF1DWV0gynK7Pt6v?utm_source=generator&theme=0',
        'yt-lofi': 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0'
    };

    document.getElementById('music-preset-select').onchange = (e) => {
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
    };

    document.getElementById('custom-music-apply-btn').onclick = () => {
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
    };

    // ==========================================
    // 4. MODALS & SETTINGS LOGIC
    // ==========================================
    document.getElementById('pomo-open-settings').onclick = () => { 
        renderModuleCheckboxes(); 
        modalOverlay.classList.add('open'); 
    };
    document.getElementById('pomo-close-modal').onclick = () => modalOverlay.classList.remove('open');
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); };

    document.getElementById('music-open-btn').onclick = () => musicModalOverlay.classList.add('open');
    document.getElementById('music-close-modal').onclick = () => musicModalOverlay.classList.remove('open');
    musicModalOverlay.onclick = (e) => { if (e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); };

    // Tab Switching inside Modals
    document.querySelectorAll('.pomo-tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.pomo-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.pomo-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        };
    });

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
            cb.onchange = (e) => {
                const checked = grid.querySelectorAll('.mod-checkbox:checked');
                if (checked.length > 4) {
                    e.target.checked = false;
                    alert("You can select up to 4 modules for top navigation.");
                }
            };
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
            btn.onclick = () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRoot = mod.id;
                searchBar.value = ''; 
                filterAndRender();
            };
            selectorBox.appendChild(btn);
        });
        filterAndRender();
    }

    function applyPomoSettingsUI() {
        pomoContainer.style.display = pomoSettings.enabled === 'yes' ? 'flex' : 'none';
        pomoBubble.style.display = pomoSettings.bubbles === 'yes' ? 'block' : 'none';
        pomoLogoIcon.textContent = pomoSettings.icon;
        
        chatFab.style.display = pomoSettings.aiEnabled === 'no' ? 'none' : 'flex';
        if (pomoSettings.aiEnabled === 'no') chatWindow.classList.remove('open');

        document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

        // Prefill form values safely
        document.getElementById('pomo-setting-theme-shade').value = pomoSettings.themeShade;
        document.getElementById('pomo-setting-enable').value = pomoSettings.enabled;
        document.getElementById('pomo-setting-focus').value = pomoSettings.focusTime;
        document.getElementById('pomo-setting-break').value = pomoSettings.breakTime;
        document.getElementById('pomo-setting-rate').value = pomoSettings.quoteRate;
        document.getElementById('pomo-setting-sound').value = pomoSettings.sound;
        document.getElementById('pomo-setting-vibrate').value = pomoSettings.vibrate;
        document.getElementById('pomo-setting-icon').value = pomoSettings.icon;
        document.getElementById('pomo-setting-bubbles').value = pomoSettings.bubbles;
        document.getElementById('pomo-setting-highlight').value = pomoSettings.highlightTask;
        document.getElementById('pomo-setting-ai').value = pomoSettings.aiEnabled;
        document.getElementById('pomo-setting-fontsize').value = pomoSettings.fontSize;
        document.getElementById('pomo-setting-autostart').value = pomoSettings.autoStart;
        document.getElementById('pomo-setting-volume').value = pomoSettings.volume;
        document.getElementById('pomo-setting-zen').value = pomoSettings.zenMode;

        if (pomoSettings.highlightTask === 'yes' && pomoTasks.length > 0) {
            let firstIncomplete = pomoTasks.find(t => !t.done) || pomoTasks[0];
            pomoHighlightText.textContent = firstIncomplete.text;
            pomoHighlightBox.style.display = 'flex';
        } else {
            pomoHighlightBox.style.display = 'none';
        }
    }

    // THE MASTER SETTINGS SAVE BUTTON
    settingsSaveBtn.onclick = () => {
        pomoSettings.themeShade = document.getElementById('pomo-setting-theme-shade').value;
        pomoSettings.enabled = document.getElementById('pomo-setting-enable').value;
        pomoSettings.focusTime = parseInt(document.getElementById('pomo-setting-focus').value);
        pomoSettings.breakTime = parseInt(document.getElementById('pomo-setting-break').value);
        pomoSettings.quoteRate = parseInt(document.getElementById('pomo-setting-rate').value);
        pomoSettings.sound = document.getElementById('pomo-setting-sound').value;
        pomoSettings.vibrate = document.getElementById('pomo-setting-vibrate').value;
        pomoSettings.icon = document.getElementById('pomo-setting-icon').value;
        pomoSettings.bubbles = document.getElementById('pomo-setting-bubbles').value;
        pomoSettings.highlightTask = document.getElementById('pomo-setting-highlight').value;
        pomoSettings.aiEnabled = document.getElementById('pomo-setting-ai').value;
        pomoSettings.fontSize = document.getElementById('pomo-setting-fontsize').value;
        pomoSettings.autoStart = document.getElementById('pomo-setting-autostart').value;
        pomoSettings.volume = document.getElementById('pomo-setting-volume').value;
        pomoSettings.zenMode = document.getElementById('pomo-setting-zen').value;

        const checkedBoxes = Array.from(document.querySelectorAll('#module-checkbox-grid .mod-checkbox:checked')).map(cb => cb.value);
        if (checkedBoxes.length > 0) {
            pomoSettings.activeModules = checkedBoxes;
        }

        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
        
        if (!isPomoRunning) {
            pomoSeconds = (isFocusMode ? pomoSettings.focusTime : pomoSettings.breakTime) * 60;
            updatePomoDisplay();
        }

        renderDynamicTopNav();
        applyPomoSettingsUI();
        modalOverlay.classList.remove('open');
    };

    // Tasks 
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

    document.getElementById('pomo-add-task-btn').onclick = () => {
        let input = document.getElementById('pomo-new-task');
        if (input.value.trim() !== '') {
            pomoTasks.push({ text: input.value.trim(), done: false });
            input.value = '';
            renderTasks();
        }
    };

    // ==========================================
    // 5. POMODORO TIMER LOGIC
    // ==========================================
    function updatePomoDisplay() {
        let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
        let s = String(pomoSeconds % 60).padStart(2, '0');
        pomoTimeDisplay.textContent = `${m}:${s}`;
    }

    pomoToggleBtn.onclick = () => {
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
                    alert("Timer completed!");
                }
            }, 1000);
        }
    };

    pomoResetBtn.onclick = () => {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        pomoSeconds = pomoSettings.focusTime * 60;
        pomoToggleBtn.textContent = '▶️';
        pomoCard.classList.remove('running');
        updatePomoDisplay();
    };

    // ==========================================
    // 6. MAIN WORKSPACE / UI BINDINGS
    // ==========================================
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        document.getElementById('sidebar-overlay').classList.toggle('open');
    }
    document.getElementById('mobile-menu-btn').onclick = toggleMobileMenu;
    document.getElementById('sidebar-overlay').onclick = toggleMobileMenu;

    desktopSidebarToggle.onclick = () => {
        sidebar.classList.toggle('collapsed');
        desktopSidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    };

    document.querySelectorAll('.subj-chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll('.subj-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentSubject = chip.getAttribute('data-subj');
            filterAndRender();
        };
    });

    themeToggle.onclick = () => {
        pomoSettings.themeShade = pomoSettings.themeShade === 'theme-light' ? 'theme-amoled' : 'theme-light';
        themeToggle.textContent = pomoSettings.themeShade === 'theme-light' ? '🌙' : '☀️';
        applyPomoSettingsUI();
        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    };

    // FULLSCREEN BINDING
    fullscreenBtn.onclick = () => {
        const container = document.getElementById('reader-container-main');
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
            else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
            else if (container.msRequestFullscreen) container.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    // SPLIT SCREEN BINDING
    splitScreenBtn.onclick = () => {
        isSplitActive = !isSplitActive;
        const mainContainer = document.getElementById('reader-container-main');
        if (isSplitActive) {
            mainContainer.classList.add('split-active');
            viewerWrapperSplit.style.display = 'block';
            bookFrameSplit.src = bookFrame.src;
            splitScreenBtn.style.backgroundColor = 'var(--success)';
        } else {
            mainContainer.classList.remove('split-active');
            viewerWrapperSplit.style.display = 'none';
            bookFrameSplit.src = '';
            splitScreenBtn.style.backgroundColor = '';
        }
    };

    // NOTES BINDINGS
    notesToggleBtn.onclick = () => notesPanel.classList.toggle('open');
    closeNotesBtn.onclick = () => notesPanel.classList.remove('open');

    notesArea.value = localStorage.getItem('quick_notes') || '';
    notesArea.oninput = () => localStorage.setItem('quick_notes', notesArea.value);

    notesCopyBtn.onclick = () => {
        navigator.clipboard.writeText(notesArea.value).then(() => {
            notesCopyBtn.textContent = '✅';
            setTimeout(() => notesCopyBtn.textContent = '📋', 1500);
        });
    };

    notesDlBtn.onclick = () => {
        const blob = new Blob([notesArea.value], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Study_Notes.txt";
        a.click();
    };

    searchBar.oninput = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndRender, 200); 
    };

    document.getElementById('folder-toggle-btn').onclick = () => {
        isTreeExpanded = !isTreeExpanded;
        document.querySelectorAll('#book-list details').forEach(d => d.open = isTreeExpanded);
    };

    document.getElementById('local-file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        loadBook({ title: file.name, folders: ["LOCAL FILES", file.name], url: URL.createObjectURL(file) }, {});
    };

    // ==========================================
    // 7. LIBRARY RENDER ENGINE
    // ==========================================
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
        starBtn.onclick = (e) => {
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
        };

        const check = document.createElement('input'); 
        check.type = 'checkbox'; 
        check.className = 'check-done';
        check.checked = completedBooks.includes(book.title);
        check.onclick = (e) => {
            e.stopPropagation();
            if (check.checked) completedBooks.push(book.title); 
            else completedBooks = completedBooks.filter(t => t !== book.title);
            localStorage.setItem('library-completed', JSON.stringify(completedBooks));
        };
        
        actions.appendChild(starBtn); 
        actions.appendChild(check);
        div.appendChild(content); 
        div.appendChild(actions);
        div.onclick = () => loadBook(book, div);
        return div;
    }

    function loadBook(book, clickedElement) {
        document.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
        if (clickedElement.classList) clickedElement.classList.add('active');
        
        document.getElementById('current-book-title').textContent = book.title;
        document.getElementById('current-book-breadcrumb').textContent = book.folders ? book.folders.join(" > ") : book.title;
        document.getElementById('placeholder-box').style.display = 'none';
        
        fullscreenBtn.style.display = 'flex';
        splitScreenBtn.style.display = 'flex';
        notesToggleBtn.style.display = 'flex';
        
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
        document.getElementById('floating-nav').style.display = 'flex';
        if (!book.playlist) {
            bookFrame.src = finalUrl;
            if (isSplitActive) bookFrameSplit.src = finalUrl;
        }

        if (pomoSettings.zenMode === 'yes') {
            sidebar.classList.add('collapsed');
            desktopSidebarToggle.textContent = '▶';
        }

        if (window.innerWidth <= 800) toggleMobileMenu(); 
    }

    // ==========================================
    // 8. AI COPILOT LOGIC
    // ==========================================
    chatFab.onclick = () => chatWindow.classList.add('open');
    chatClose.onclick = () => chatWindow.classList.remove('open');

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

    chatSend.onclick = handleChatSubmit;
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleChatSubmit(); };

    // Keybindings
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
            chatWindow.classList.remove('open');
            notesPanel.classList.remove('open');
        }
    });

    // Boot routines
    renderTasks();
    applyPomoSettingsUI();
    updatePomoDisplay();
});
