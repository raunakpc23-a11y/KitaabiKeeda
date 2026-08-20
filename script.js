// ==========================================
// 1. STATE & STORAGE (Loaded First)
// ==========================================
let masterLibrary = [];
let currentRoot = "CLASS 10"; 
let currentSubject = "All";
let completedBooks = JSON.parse(localStorage.getItem('library-completed')) || [];
let starredBooks = JSON.parse(localStorage.getItem('library-starred')) || [];
let searchTimeout;
let isTreeExpanded = false; 
let isSplitActive = false;

// --- ALL AVAILABLE MODULES ---
const ALL_MODULES = [
    { id: 'CLASS 10', label: '🎓 Class 10' },
    { id: 'IIT-JEE', label: '⚡ IIT-JEE' },
    { id: 'LECTURES', label: '📺 Lectures' },
    { id: 'SIMULATOR', label: '⏱️ Simulator' },
    { id: 'PAST PAPERS', label: '📄 Past Papers' },
    { id: 'FLASHCARDS', label: '📇 Flashcards' },
    { id: 'FAVORITES', label: '⭐ Favorites' }
];

// --- SAFE-MERGE PROTOCOL ---
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

// INITIALIZE THEME, FONT, & ZEN MODE
document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;

let pomoSeconds = pomoSettings.focusTime * 60;
let pomoInterval = null;
let quoteInterval = null;
let isPomoRunning = false;
let isFocusMode = true;

// ==========================================
// 2. DOM ELEMENTS
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

// ==========================================
// 3. INITIALIZATION & DATA LOADING
// ==========================================
setTimeout(() => {
    if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
    if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
    if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
    filterAndRender();
}, 300);

// ==========================================
// 4. SETTINGS & AMBIENT AUDIO LOGIC
// ==========================================
document.getElementById('pomo-open-settings').onclick = () => {
    renderModuleCheckboxes();
    modalOverlay.classList.add('open');
};
document.getElementById('pomo-close-modal').onclick = () => modalOverlay.classList.remove('open');
modalOverlay.onclick = (e) => { if(e.target === modalOverlay) modalOverlay.classList.remove('open'); };

document.getElementById('music-open-btn').onclick = () => musicModalOverlay.classList.add('open');
document.getElementById('music-close-modal').onclick = () => musicModalOverlay.classList.remove('open');
musicModalOverlay.onclick = (e) => { if(e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); };

const ambientAudioStreams = {
    'white-rain': 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_423439b1a5.mp3?filename=heavy-rain-and-thunder-19728.mp3',
    'white-brown': 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db4c979d40.mp3?filename=white-noise-107773.mp3',
    'white-fire': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3693fb1c1.mp3?filename=campfire-crackles-11917.mp3',
    'white-cafe': 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a1bfa7d9.mp3?filename=restaurant-ambience-11005.mp3'
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
        ambientPlayer.play().catch(e => console.log("Audio autoplay restricted:", e));
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
        let embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        musicFrame.src = embedUrl;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if(url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if(url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        if(videoId) musicFrame.src = `https://www.youtube.com/embed/${videoId}`;
    } else {
        musicFrame.src = url;
    }
};

document.getElementById('local-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    loadBook({ title: file.name, folders: ["MY LOCAL FILES", file.name], url: objectUrl }, { classList: { add: ()=>{}, remove: ()=>{} } });
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

    document.querySelectorAll('.mod-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            let checkedBoxes = document.querySelectorAll('.mod-checkbox:checked');
            if (checkedBoxes.length > 4) {
                e.preventDefault();
                e.target.checked = false;
                alert("You can only select a maximum of 4 modules for the top navigation.");
            }
        });
    });
}

function renderDynamicTopNav() {
    selectorBox.innerHTML = '';
    
    let selectedMods = ALL_MODULES.filter(m => pomoSettings.activeModules.includes(m.id));
    if(selectedMods.length === 0) selectedMods = [ALL_MODULES[0]];

    if (!pomoSettings.activeModules.includes(currentRoot)) {
        currentRoot = selectedMods[0].id;
    }

    selectedMods.forEach(mod => {
        let btn = document.createElement('button');
        btn.className = `mode-btn ${mod.id === currentRoot ? 'active' : ''}`;
        btn.setAttribute('data-root', mod.id);
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

function applyPomoSettingsUI() {
    pomoContainer.style.display = pomoSettings.enabled === 'yes' ? 'flex' : 'none';
    pomoBubble.style.display = pomoSettings.bubbles === 'yes' ? 'block' : 'none';
    pomoLogoIcon.textContent = pomoSettings.icon;
    
    if(pomoSettings.aiEnabled === 'no') {
        chatFab.style.display = 'none';
        chatWindow.classList.remove('open');
    } else {
        chatFab.style.display = 'flex';
    }

    if(pomoSettings.zenMode === 'yes') {
        document.body.classList.add('zen-mode');
    } else {
        document.body.classList.remove('zen-mode');
    }

    if (pomoSettings.highlightTask === 'yes' && pomoTasks.length > 0) {
        let firstIncomplete = pomoTasks.find(t => !t.done) || pomoTasks[0];
        pomoHighlightText.textContent = firstIncomplete.text;
        pomoHighlightBox.style.display = 'flex';
    } else {
        pomoHighlightBox.style.display = 'none';
    }

    if(!isPomoRunning) {
        pomoStatusText.textContent = isFocusMode ? 'Focus Session' : 'Break Time';
    }
}

function playAlertSound(type) {
    if (type === 'none') return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type === 'chime' ? 'sine' : 'square';
        osc.frequency.setValueAtTime(type === 'chime' ? 587.33 : 440, ctx.currentTime);
        gain.gain.setValueAtTime(parseFloat(pomoSettings.volume), ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (type === 'chime' ? 0.8 : 0.4));
    } catch(e) { console.log("Audio not supported"); }
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
    if(checkedModules.length > 0) {
        pomoSettings.activeModules = checkedModules;
    }

    localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    
    document.body.className = `${pomoSettings.themeShade} ${pomoSettings.fontSize} ${pomoSettings.zenMode === 'yes' ? 'zen-mode' : ''}`;
    renderDynamicTopNav();
    applyPomoSettingsUI();
    
    if(!isPomoRunning) {
        pomoSeconds = (isFocusMode ? pomoSettings.focusTime : pomoSettings.breakTime) * 60;
        updatePomoDisplay();
    }
    if (isPomoRunning) setupQuoteRotation();
    modalOverlay.classList.remove('open');
};

function renderTasks() {
    const listEl = document.getElementById('pomo-task-list');
    listEl.innerHTML = '';
    pomoTasks.forEach((t, idx) => {
        let item = document.createElement('div');
        item.className = `pomo-task-item ${t.done ? 'completed' : ''}`;
        item.innerHTML = `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex-grow:1;">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${idx})">
                <span>${t.text}</span>
            </label>
            <button onclick="deleteTask(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
        `;
        listEl.appendChild(item);
    });
    localStorage.setItem('pomo_tasks', JSON.stringify(pomoTasks));
    applyPomoSettingsUI();
}

window.toggleTask = (idx) => { pomoTasks[idx].done = !pomoTasks[idx].done; renderTasks(); };
window.deleteTask = (idx) => { pomoTasks.splice(idx, 1); renderTasks(); };

document.getElementById('pomo-add-task-btn').onclick = () => {
    let input = document.getElementById('pomo-new-task');
    if(input.value.trim() !== '') {
        pomoTasks.push({ text: input.value.trim(), done: false });
        input.value = '';
        renderTasks();
    }
};
renderTasks();

const focusQuotes = [
    "Let's lock in and conquer some problems! 💪",
    "Deep work mode activated. Stay focused! ⚡",
    "One concept at a time. You've got this! 🎯",
    "Distractions out. Equations in. 🚀",
    "Pain of discipline < Pain of regret. Keep pushing! 🔥",
    "Master the fundamentals, and the complex problems will fall. 🧠"
];

const breakQuotes = [
    "Time to stretch your legs and hydrate! ☕",
    "Great focus! Rest your eyes for a moment. 🌿",
    "Breathe in, breathe out. Relax. 🧘‍♂️",
    "Almost ready for the next sprint! 🔋"
];

function rotateQuote() {
    if (!isPomoRunning || pomoSettings.bubbles !== 'yes') return;
    pomoBubble.style.opacity = 0;
    setTimeout(() => {
        const arr = isFocusMode ? focusQuotes : breakQuotes;
        pomoBubble.textContent = arr[Math.floor(Math.random() * arr.length)];
        pomoBubble.style.opacity = 1;
    }, 300);
}

function setupQuoteRotation() {
    if (quoteInterval) clearInterval(quoteInterval);
    const rateMs = (pomoSettings.quoteRate || 30) * 1000;
    quoteInterval = setInterval(rotateQuote, rateMs);
}

function updatePomoDisplay() {
    let m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
    let s = String(pomoSeconds % 60).padStart(2, '0');
    pomoTimeDisplay.textContent = `${m}:${s}`;
}

function toggleTimer() {
    if (isPomoRunning) {
        clearInterval(pomoInterval);
        clearInterval(quoteInterval);
        isPomoRunning = false;
        pomoToggleBtn.textContent = '▶️';
        pomoCard.classList.remove('running');
        pomoBubble.textContent = "Timer paused.";
    } else {
        isPomoRunning = true;
        pomoToggleBtn.textContent = '⏸️';
        pomoCard.classList.add('running');
        rotateQuote();
        setupQuoteRotation();

        pomoInterval = setInterval(() => {
            if (pomoSeconds > 0) {
                pomoSeconds--;
                updatePomoDisplay();
            } else {
                clearInterval(pomoInterval);
                clearInterval(quoteInterval);
                isPomoRunning = false;
                pomoToggleBtn.textContent = '▶️';
                pomoCard.classList.remove('running');
                
                if (pomoSettings.sound !== 'none') playAlertSound(pomoSettings.sound);
                if (pomoSettings.vibrate === 'yes' && navigator.vibrate) navigator.vibrate([200, 100, 200]);

                if (isFocusMode) {
                    pomoSeconds = pomoSettings.breakTime * 60;
                    pomoStatusText.textContent = "Break Time";
                    isFocusMode = false;
                    pomoBubble.textContent = breakQuotes[Math.floor(Math.random() * breakQuotes.length)];
                } else {
                    pomoSeconds = pomoSettings.focusTime * 60;
                    pomoStatusText.textContent = "Focus Session";
                    isFocusMode = true;
                    pomoBubble.textContent = focusQuotes[Math.floor(Math.random() * focusQuotes.length)];
                }
                updatePomoDisplay();

                if(pomoSettings.autoStart === 'yes') {
                    toggleTimer(); 
                } else {
                    alert(isFocusMode ? "Break over! Back to focus." : "Focus Session Complete! Time for a break.");
                }
            }
        }, 1000);
    }
}

pomoToggleBtn.onclick = toggleTimer;

pomoResetBtn.onclick = () => {
    clearInterval(pomoInterval);
    clearInterval(quoteInterval);
    isPomoRunning = false;
    isFocusMode = true;
    pomoStatusText.textContent = "Focus Session";
    pomoSeconds = pomoSettings.focusTime * 60;
    pomoToggleBtn.textContent = '▶️';
    pomoCard.classList.remove('running');
    pomoBubble.textContent = "Timer reset. Ready when you are!";
    updatePomoDisplay();
};

// ==========================================
// 5. LIBRARY RENDERING, FAVORITES & SPLIT-SCREEN
// ==========================================
function toggleMobileMenu() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}
document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
document.getElementById('sidebar-overlay').addEventListener('click', toggleMobileMenu);

document.querySelectorAll('.subj-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.subj-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentSubject = chip.getAttribute('data-subj');
        filterAndRender();
    });
});

themeToggle.addEventListener('click', () => {
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
});

// FULLSCREEN HANDLER FIX
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    const targetViewer = isSplitActive ? document.getElementById('reader-container-main') : viewerWrapper;
    if (targetViewer.requestFullscreen) {
        targetViewer.requestFullscreen();
    } else if (targetViewer.webkitRequestFullscreen) {
        targetViewer.webkitRequestFullscreen();
    } else if (targetViewer.msRequestFullscreen) {
        targetViewer.msRequestFullscreen();
    }
});

splitScreenBtn.addEventListener('click', () => {
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
});

document.getElementById('notes-toggle-btn').addEventListener('click', () => {
    document.getElementById('notes-panel').classList.toggle('open');
});
document.getElementById('close-notes-btn').addEventListener('click', () => {
    document.getElementById('notes-panel').classList.remove('open');
});

searchBar.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterAndRender, 250); 
});

document.getElementById('folder-toggle-btn').addEventListener('click', () => {
    isTreeExpanded = !isTreeExpanded;
    document.querySelectorAll('#book-list details').forEach(d => d.open = isTreeExpanded);
});

function filterAndRender() {
    if (masterLibrary.length === 0) return;
    const query = searchBar.value.toLowerCase();
    
    let filteredBooks = [];
    if (currentRoot === "FAVORITES") {
        filteredBooks = masterLibrary.filter(book => starredBooks.includes(book.title));
    } else {
        filteredBooks = masterLibrary.filter(book => {
            const searchString = book.title + " " + (book.folders ? book.folders.join(" ") : "");
            const matchesSearch = searchString.toLowerCase().includes(query);
            const matchesSubject = currentSubject === "All" || searchString.toLowerCase().includes(currentSubject.toLowerCase());
            let matchesRoot = book.folders && book.folders[0].toUpperCase() === currentRoot.toUpperCase();
            return matchesRoot && matchesSearch && matchesSubject;
        });
    }
    renderTree(filteredBooks);
}

function renderTree(booksArray) {
    bookListElement.innerHTML = ''; 
    if (booksArray.length === 0) {
        bookListElement.innerHTML = `<div class="placeholder-text" style="font-size:0.9em; margin-top:20px; text-align:center;">${currentRoot === 'FAVORITES' ? 'No starred favorites yet! Click the ⭐ next to any file.' : 'No files found for this module.'}</div>`; 
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

    if ((book.url && book.url.includes("youtube")) || book.playlist) {
        content.classList.add('is-video');
    }

    const actions = document.createElement('div'); actions.className = 'book-actions';
    
    const starBtn = document.createElement('button');
    starBtn.className = `star-btn ${starredBooks.includes(book.title) ? 'starred' : ''}`;
    starBtn.innerHTML = starredBooks.includes(book.title) ? '⭐' : '☆';
    starBtn.title = "Toggle Favorite";
    starBtn.onclick = (e) => {
        e.stopPropagation();
        if(starredBooks.includes(book.title)) {
            starredBooks = starredBooks.filter(t => t !== book.title);
            starBtn.innerHTML = '☆';
            starBtn.classList.remove('starred');
        } else {
            starredBooks.push(book.title);
            starBtn.innerHTML = '⭐';
            starBtn.classList.add('starred');
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
    
    actions.appendChild(starBtn);
    actions.appendChild(check);
    div.appendChild(content); div.appendChild(actions);
    div.onclick = () => loadBook(book, div);
    return div;
}

function loadBook(book, clickedElement) {
    document.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('summary.active-path').forEach(el => el.classList.remove('active-path'));
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
            opt.value = vid.url;
            opt.textContent = vid.title || `Lecture ${index + 1}`;
            playlistDropdown.appendChild(opt);
        });
        playlistDropdown.style.display = 'block';
        
        bookFrame.src = book.playlist[0].url;
        if(isSplitActive) bookFrameSplit.src = book.playlist[0].url;
        document.getElementById('current-book-title').textContent = book.playlist[0].title;
        
        playlistDropdown.onchange = (e) => {
            bookFrame.src = e.target.value;
            if(isSplitActive) bookFrameSplit.src = e.target.value;
            let selectedOption = playlistDropdown.options[playlistDropdown.selectedIndex];
            document.getElementById('current-book-title').textContent = selectedOption.textContent;
        };
    } else {
        playlistDropdown.style.display = 'none';
    }

    if (currentRoot === "SIMULATOR") {
        downloadBtn.style.display = 'flex';
        downloadBtn.innerHTML = '⏱️ <span style="font-size: 0.9em; margin-left: 6px; font-family: sans-serif;">Start Exam</span>';
        downloadBtn.className = 'icon-btn primary-btn';
        downloadBtn.style.backgroundColor = '#ef4444';
        let qTarget = book.questionUrl || book.url;
        let aTarget = book.answerKeyUrl || '';
        downloadBtn.onclick = () => window.open(`simulator.html?qUrl=${encodeURIComponent(qTarget)}&aUrl=${encodeURIComponent(aTarget)}&title=${encodeURIComponent(book.title)}`, '_blank');
    } else if (!finalUrl || finalUrl.includes("youtube")) {
        downloadBtn.style.display = 'none';
    } else {
        downloadBtn.style.display = 'flex';
        downloadBtn.innerHTML = '⬇️';
        downloadBtn.className = 'icon-btn';
        downloadBtn.style.backgroundColor = 'transparent';
        const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) downloadBtn.onclick = () => window.open(`https://drive.google.com/uc?export=download&id=${match[1]}`, '_blank');
    }

    viewerWrapper.style.display = 'block';
    viewerWrapper.style.animation = 'none';
    viewerWrapper.offsetHeight; 
    viewerWrapper.style.animation = null;

    document.getElementById('floating-nav').style.display = 'flex';
    if (!book.playlist) {
        bookFrame.src = finalUrl;
        if(isSplitActive) bookFrameSplit.src = finalUrl;
    }
    localStorage.setItem('last-opened-book', book.title);

    if (window.innerWidth <= 800) toggleMobileMenu(); 
}

document.getElementById('prev-btn').onclick = () => {
    const items = Array.from(document.querySelectorAll('#book-list .book-item'));
    const idx = items.findIndex(i => i.classList.contains('active'));
    if(idx > 0) items[idx - 1].click();
};
document.getElementById('next-btn').onclick = () => {
    const items = Array.from(document.querySelectorAll('#book-list .book-item'));
    const idx = items.findIndex(i => i.classList.contains('active'));
    if(idx !== -1 && items[idx + 1]) items[idx + 1].click();
};

// ==========================================
// 6. DESKTOP SIDEBAR TOGGLE & HOTKEYS
// ==========================================
desktopSidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    desktopSidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
});

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
        document.getElementById('notes-panel').classList.remove('open');
    }
});

// ==========================================
// 7. NOTES AUTO-SAVE & EXPORT
// ==========================================
const notesArea = document.getElementById('notes-area');
const notesCopyBtn = document.getElementById('notes-copy-btn');
const notesDlBtn = document.getElementById('notes-dl-btn');

notesArea.value = localStorage.getItem('quick_notes') || '';

notesArea.addEventListener('input', () => {
    localStorage.setItem('quick_notes', notesArea.value);
});

notesCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(notesArea.value).then(() => {
        notesCopyBtn.textContent = '✅';
        setTimeout(() => notesCopyBtn.textContent = '📋', 2000);
    });
});

notesDlBtn.addEventListener('click', () => {
    const blob = new Blob([notesArea.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Study_Notes.txt";
    a.click();
    URL.revokeObjectURL(url);
});

// ==========================================
// 8. AI COPILOT CHAT BINDINGS & MEMORY
// ==========================================
chatFab.onclick = () => chatWindow.classList.add('open');
chatClose.onclick = () => chatWindow.classList.remove('open');

let savedChat = localStorage.getItem('ai_chat_history');
if (savedChat) {
    chatBody.innerHTML = savedChat;
    chatBody.scrollTop = chatBody.scrollHeight;
}

function handleNavigateToResource(bookIndex) {
    const book = masterLibrary[bookIndex];
    if (!book) return;

    const rootCategory = book.folders ? book.folders[0].toUpperCase() : 'CLASS 10';
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.getAttribute('data-root') === rootCategory) {
            btn.click();
        }
    });

    loadBook(book, { classList: { add: ()=>{}, remove: ()=>{} } });
    chatWindow.classList.remove('open');
}

function appendAIMessage(htmlContent, isUser, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
    if (id) msgDiv.id = id;
    msgDiv.innerHTML = htmlContent;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    if(!htmlContent.includes('typing-indicator')) {
        localStorage.setItem('ai_chat_history', chatBody.innerHTML);
    }
}

async function handleChatSubmit() {
    const val = chatInput.value.trim();
    if (!val) return;

    appendAIMessage(val, true);
    chatInput.value = '';

    const typingId = 'typing-' + Date.now();
    appendAIMessage('<span class="typing-indicator">Typing... 💅🏾</span>', false, typingId);

    try {
        if (typeof processAIQuery !== 'undefined') {
            const result = await processAIQuery(val, masterLibrary);
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();

            if (result.type === 'fact') {
                appendAIMessage(result.reply, false);
            } else if (result.type === 'navigation') {
                let prefix = result.prefix ? `<p style="margin-bottom:8px;">${result.prefix}</p>` : `📍 <strong>Found ${result.matches.length} matches:</strong>`;
                let cardHtml = `${prefix}<div class="chat-nav-card">`;
                result.matches.forEach((b) => {
                    const globalIdx = masterLibrary.indexOf(b);
                    const isVid = (b.url && b.url.includes("youtube")) || b.playlist;
                    cardHtml += `
                        <button class="nav-shortcut-btn" onclick="handleNavigateToResource(${globalIdx})">
                            <span>${isVid ? '▶️' : '📄'} ${b.title}</span>
                            <span style="opacity:0.6; font-size:0.9em;">Open ➔</span>
                        </button>
                    `;
                });
                cardHtml += `</div>`;
                appendAIMessage(cardHtml, false);
            }
        } else {
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();
            appendAIMessage("Oops, ai.js is missing! Ensure it is linked properly.", false);
        }
    } catch(e) {
        const typingEl = document.getElementById(typingId);
        if(typingEl) typingEl.remove();
        appendAIMessage("Oops, my brain disconnected. Try again.", false);
        console.error("AI Error:", e);
    }
}

chatSend.onclick = handleChatSubmit;
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});

// STARTUP RENDER TRIGGERS
applyPomoSettingsUI();
updatePomoDisplay();
renderDynamicTopNav();
