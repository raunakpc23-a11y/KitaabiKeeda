document.addEventListener("DOMContentLoaded", () => {
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

    let savedData = {};
    try { savedData = JSON.parse(localStorage.getItem('pomo_settings')) || {}; } catch(e) {}
    let pomoSettings = { ...defaultSettings, ...savedData };

    if (!pomoSettings.activeModules || !Array.isArray(pomoSettings.activeModules) || pomoSettings.activeModules.length === 0) {
        pomoSettings.activeModules = ['CLASS 10', 'IIT-JEE', 'LECTURES', 'SIMULATOR'];
    }

    let pomoTasks = JSON.parse(localStorage.getItem('pomo_tasks')) || [];
    document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

    let pomoSeconds = pomoSettings.focusTime * 60;
    let pomoInterval = null;
    let quoteInterval = null;
    let isPomoRunning = false;
    let isFocusMode = true;

    // DOM Elements Mapping
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

    setTimeout(() => {
        if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
        if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
        if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
        filterAndRender();
    }, 300);

    // Settings Modal
    document.getElementById('pomo-open-settings').onclick = () => { renderModuleCheckboxes(); modalOverlay.classList.add('open'); };
    document.getElementById('pomo-close-modal').onclick = () => modalOverlay.classList.remove('open');
    modalOverlay.onclick = (e) => { if(e.target === modalOverlay) modalOverlay.classList.remove('open'); };

    document.getElementById('music-open-btn').onclick = () => musicModalOverlay.classList.add('open');
    document.getElementById('music-close-modal').onclick = () => musicModalOverlay.classList.remove('open');
    musicModalOverlay.onclick = (e) => { if(e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); };

    // Working Audio Streams
    const ambientAudioStreams = {
        'white-rain': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Rain_on_tent.ogg',
        'white-brown': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Brown_noise.ogg',
        'white-fire': 'https://upload.wikimedia.org/wikipedia/commons/0/06/Crackling_campfire.ogg',
        'white-cafe': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Coffee_shop_ambiance.ogg'
    };

    const musicPresets = {
        'spotify-lofi': 'https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?utm_source=generator&theme=0',
        'spotify-focus': 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
        'spotify-classical': 'https://open.spotify.com/embed/playlist/37i9dQZF1DWV0gynK7Pt6v?utm_source=generator&theme=0',
        'yt-lofi': 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0'
    };

    window.changeMusicPreset = (val) => {
        const customGroup = document.getElementById('custom-music-group');
        const musicFrame = document.getElementById('music-frame');
        const ambientPlayer = document.getElementById('ambient-audio-player');

        ambientPlayer.pause();
        ambientPlayer.src = '';
        ambientPlayer.style.display = 'none';
        musicFrame.style.display = 'block';

        if(val === 'custom') {
            customGroup.style.display = 'flex';
        } else if (ambientAudioStreams[val]) {
            customGroup.style.display = 'none';
            musicFrame.style.display = 'none';
            ambientPlayer.style.display = 'block';
            ambientPlayer.src = ambientAudioStreams[val];
            ambientPlayer.volume = parseFloat(pomoSettings.volume);
            ambientPlayer.play().catch(e => console.log("Audio autoplay restricted"));
        } else {
            customGroup.style.display = 'none';
            musicFrame.src = musicPresets[val];
        }
    };

    window.applyCustomMusic = () => {
        let url = document.getElementById('custom-music-url').value.trim();
        if(!url) return;
        const musicFrame = document.getElementById('music-frame');
        document.getElementById('ambient-audio-player').pause();
        document.getElementById('ambient-audio-player').style.display = 'none';
        musicFrame.style.display = 'block';

        if(url.includes('open.spotify.com')) {
            musicFrame.src = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
            if(videoId) musicFrame.src = `https://www.youtube.com/embed/${videoId}`;
        } else {
            musicFrame.src = url;
        }
    };

    document.getElementById('local-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        loadBook({ title: file.name, folders: ["MY LOCAL FILES", file.name], url: URL.createObjectURL(file) }, {});
    });

    window.switchPomoTab = (evt, tabId) => {
        document.querySelectorAll('.pomo-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pomo-tab-content').forEach(c => c.classList.remove('active'));
        evt.currentTarget.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    };

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
    document.getElementById('pomo-setting-zen').value = pomoSettings.zenMode || 'no';

    function renderModuleCheckboxes() {
        const grid = document.getElementById('module-checkbox-grid');
        grid.innerHTML = '';
        ALL_MODULES.forEach(mod => {
            let isChecked = pomoSettings.activeModules.includes(mod.id) ? 'checked' : '';
            let label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${mod.id}" class="mod-checkbox" ${isChecked}> ${mod.label}`;
            grid.appendChild(label);
        });
    }

    function renderDynamicTopNav() {
        selectorBox.innerHTML = '';
        let selectedMods = ALL_MODULES.filter(m => pomoSettings.activeModules.includes(m.id));
        if(selectedMods.length === 0) selectedMods = [ALL_MODULES[0]];

        if (!pomoSettings.activeModules.includes(currentRoot)) currentRoot = selectedMods[0].id;

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
        if(pomoSettings.aiEnabled === 'no') chatWindow.classList.remove('open');
        if(pomoSettings.zenMode === 'yes') document.body.classList.add('zen-mode');
        else document.body.classList.remove('zen-mode');
    }

    document.getElementById('pomo-save-settings').onclick = () => {
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

        let checkedModules = Array.from(document.querySelectorAll('.mod-checkbox:checked')).map(cb => cb.value);
        if(checkedModules.length > 0) pomoSettings.activeModules = checkedModules;

        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
        document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;
        renderDynamicTopNav();
        applyPomoSettingsUI();
        modalOverlay.classList.remove('open');
    };

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
                if (pomoSeconds > 0) { pomoSeconds--; updatePomoDisplay(); }
                else { clearInterval(pomoInterval); isPomoRunning = false; pomoToggleBtn.textContent = '▶️'; alert("Timer done!"); }
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

    // UI & Render triggers
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        document.getElementById('sidebar-overlay').classList.toggle('open');
    }
    document.getElementById('mobile-menu-btn').onclick = toggleMobileMenu;
    document.getElementById('sidebar-overlay').onclick = toggleMobileMenu;

    document.querySelectorAll('.subj-chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll('.subj-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentSubject = chip.getAttribute('data-subj');
            filterAndRender();
        };
    });

    themeToggle.onclick = () => {
        if (document.body.classList.contains('theme-light')) {
            document.body.className = `theme-amoled ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;
            pomoSettings.themeShade = 'theme-amoled';
            themeToggle.textContent = '☀️';
        } else {
            document.body.className = `theme-light ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;
            pomoSettings.themeShade = 'theme-light';
            themeToggle.textContent = '🌙';
        }
        localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    };

    // Fullscreen fix
    document.getElementById('fullscreen-btn').onclick = () => {
        const targetViewer = isSplitActive ? document.getElementById('reader-container-main') : viewerWrapper;
        if (targetViewer.requestFullscreen) targetViewer.requestFullscreen();
    };

    // Split Screen fix
    splitScreenBtn.onclick = () => {
        isSplitActive = !isSplitActive;
        const readerContainerMain = document.getElementById('reader-container-main');
        if (isSplitActive) {
            readerContainerMain.classList.add('split-active');
            viewerWrapperSplit.style.display = 'block';
            bookFrameSplit.src = bookFrame.src; 
            splitScreenBtn.style.backgroundColor = 'var(--success)';
        } else {
            readerContainerMain.classList.remove('split-active');
            viewerWrapperSplit.style.display = 'none';
            splitScreenBtn.style.backgroundColor = '';
        }
    };

    document.getElementById('notes-toggle-btn').onclick = () => document.getElementById('notes-panel').classList.toggle('open');
    document.getElementById('close-notes-btn').onclick = () => document.getElementById('notes-panel').classList.remove('open');

    searchBar.oninput = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndRender, 250); 
    };

    document.getElementById('folder-toggle-btn').onclick = () => {
        isTreeExpanded = !isTreeExpanded;
        document.querySelectorAll('#book-list details').forEach(d => d.open = isTreeExpanded);
    };

    function filterAndRender() {
        if (masterLibrary.length === 0) return;
        const query = searchBar.value.toLowerCase();
        let filteredBooks = currentRoot === "FAVORITES" 
            ? masterLibrary.filter(book => starredBooks.includes(book.title))
            : masterLibrary.filter(book => {
                const searchString = book.title + " " + (book.folders ? book.folders.join(" ") : "");
                return searchString.toLowerCase().includes(query) && 
                       (currentSubject === "All" || searchString.toLowerCase().includes(currentSubject.toLowerCase())) &&
                       book.folders && book.folders[0].toUpperCase() === currentRoot.toUpperCase();
            });
        renderTree(filteredBooks);
    }

    function renderTree(booksArray) {
        bookListElement.innerHTML = ''; 
        if (booksArray.length === 0) {
            bookListElement.innerHTML = `<div class="placeholder-text" style="font-size:0.9em; margin-top:20px; text-align:center;">${currentRoot === 'FAVORITES' ? 'No starred favorites yet!' : 'No files found.'}</div>`; 
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

        function countAllFiles(node) {
            let count = (node._files ? node._files.length : 0);
            Object.keys(node).filter(k => k !== '_files' && k !== '_isFolder').forEach(k => count += countAllFiles(node[k]));
            return count;
        }

        function buildHTMLNode(nodeObj, isOpen) {
            const container = document.createElement('div');
            Object.keys(nodeObj).filter(k => k !== '_files' && k !== '_isFolder').sort().forEach(folderName => {
                const details = document.createElement('details'); 
                if (isOpen || isTreeExpanded) details.open = true; 
                const summary = document.createElement('summary');
                summary.textContent = `${folderName} (${countAllFiles(nodeObj[folderName])})`;
                details.appendChild(summary);
                const contents = document.createElement('div'); contents.className = 'folder-contents';
                contents.appendChild(buildHTMLNode(nodeObj[folderName], isOpen));
                details.appendChild(contents); container.appendChild(details);
            });
            if (nodeObj._files) nodeObj._files.sort((a,b) => a.title.localeCompare(b.title)).forEach(b => container.appendChild(createBookElement(b)));
            return container;
        }
        bookListElement.appendChild(buildHTMLNode(fileTree, searchBar.value.length > 0));
    }

    function createBookElement(book) {
        const div = document.createElement('div'); div.className = 'book-item';
        const content = document.createElement('div'); content.className = 'book-item-content'; content.textContent = book.title;
        if ((book.url && book.url.includes("youtube")) || book.playlist) content.classList.add('is-video');

        const actions = document.createElement('div'); actions.className = 'book-actions';
        const starBtn = document.createElement('button');
        starBtn.className = `star-btn ${starredBooks.includes(book.title) ? 'starred' : ''}`;
        starBtn.innerHTML = starredBooks.includes(book.title) ? '⭐' : '☆';
        starBtn.onclick = (e) => {
            e.stopPropagation();
            if(starredBooks.includes(book.title)) {
                starredBooks = starredBooks.filter(t => t !== book.title);
                starBtn.innerHTML = '☆'; starBtn.classList.remove('starred');
            } else {
                starredBooks.push(book.title);
                starBtn.innerHTML = '⭐'; starBtn.classList.add('starred');
            }
            localStorage.setItem('library-starred', JSON.stringify(starredBooks));
            if(currentRoot === "FAVORITES") filterAndRender();
        };

        const check = document.createElement('input'); check.type = 'checkbox'; check.className = 'check-done';
        check.checked = completedBooks.includes(book.title);
        check.onclick = (e) => {
            e.stopPropagation();
            if(check.checked) completedBooks.push(book.title); else completedBooks = completedBooks.filter(t => t !== book.title);
            localStorage.setItem('library-completed', JSON.stringify(completedBooks));
        };
        
        actions.appendChild(starBtn); actions.appendChild(check);
        div.appendChild(content); div.appendChild(actions);
        div.onclick = () => loadBook(book, div);
        return div;
    }

    function loadBook(book, clickedElement) {
        document.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
        if(clickedElement.classList) clickedElement.classList.add('active');
        
        document.getElementById('current-book-title').textContent = book.title;
        document.getElementById('current-book-breadcrumb').textContent = book.folders ? book.folders.join(" > ") : book.title;
        document.getElementById('placeholder-box').style.display = 'none';
        document.getElementById('fullscreen-btn').style.display = 'flex';
        document.getElementById('split-screen-btn').style.display = 'flex';
        document.getElementById('notes-toggle-btn').style.display = 'flex';
        
        let finalUrl = book.url || book.questionUrl || book.answerKeyUrl || '';
        if (book.playlist && book.playlist.length > 0) {
            playlistDropdown.innerHTML = '';
            book.playlist.forEach((vid, index) => {
                let opt = document.createElement('option');
                opt.value = vid.url; opt.textContent = vid.title || `Lecture ${index + 1}`;
                playlistDropdown.appendChild(opt);
            });
            playlistDropdown.style.display = 'block';
            bookFrame.src = book.playlist[0].url;
            if(isSplitActive) bookFrameSplit.src = book.playlist[0].url;
            playlistDropdown.onchange = (e) => {
                bookFrame.src = e.target.value;
                if(isSplitActive) bookFrameSplit.src = e.target.value;
            };
        } else {
            playlistDropdown.style.display = 'none';
        }

        viewerWrapper.style.display = 'block';
        document.getElementById('floating-nav').style.display = 'flex';
        if (!book.playlist) {
            bookFrame.src = finalUrl;
            if(isSplitActive) bookFrameSplit.src = finalUrl;
        }
        if (window.innerWidth <= 800) toggleMobileMenu(); 
    }

    // Hotkeys & Notes
    desktopSidebarToggle.onclick = () => {
        sidebar.classList.toggle('collapsed');
        desktopSidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    };

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); desktopSidebarToggle.click(); }
        if (e.ctrlKey && e.key === ' ') { e.preventDefault(); chatWindow.classList.contains('open') ? chatClose.click() : chatFab.click(); }
    });

    const notesArea = document.getElementById('notes-area');
    notesArea.value = localStorage.getItem('quick_notes') || '';
    notesArea.oninput = () => localStorage.setItem('quick_notes', notesArea.value);

    document.getElementById('notes-copy-btn').onclick = () => {
        navigator.clipboard.writeText(notesArea.value);
        alert("Notes copied!");
    };
    document.getElementById('notes-dl-btn').onclick = () => {
        const blob = new Blob([notesArea.value], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Study_Notes.txt";
        a.click();
    };

    // AI Chat Bindings
    chatFab.onclick = () => chatWindow.classList.add('open');
    chatClose.onclick = () => chatWindow.classList.remove('open');

    let savedChat = localStorage.getItem('ai_chat_history');
    if (savedChat) { chatBody.innerHTML = savedChat; chatBody.scrollTop = chatBody.scrollHeight; }

    async function handleChatSubmit() {
        const val = chatInput.value.trim();
        if (!val) return;
        appendMsg(val, true);
        chatInput.value = '';

        try {
            if (typeof processAIQuery !== 'undefined') {
                const res = await processAIQuery(val, masterLibrary);
                appendMsg(res.type === 'fact' ? res.reply : `Found matches in library!`, false);
            }
        } catch(e) { appendMsg("AI error.", false); }
    }

    function appendMsg(html, isUser) {
        const d = document.createElement('div');
        d.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
        d.innerHTML = html;
        chatBody.appendChild(d);
        chatBody.scrollTop = chatBody.scrollHeight;
        localStorage.setItem('ai_chat_history', chatBody.innerHTML);
    }

    chatSend.onclick = handleChatSubmit;
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleChatSubmit(); };

    applyPomoSettingsUI();
    updatePomoDisplay();
    renderDynamicTopNav();
});
