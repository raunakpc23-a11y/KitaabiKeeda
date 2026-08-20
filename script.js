let masterLibrary = [];

setTimeout(() => {
    if (typeof allBooks !== 'undefined' && Array.isArray(allBooks)) masterLibrary.push(...allBooks);
    if (typeof lectureVideos !== 'undefined' && Array.isArray(lectureVideos)) masterLibrary.push(...lectureVideos);
    if (typeof mockTests !== 'undefined' && Array.isArray(mockTests)) masterLibrary.push(...mockTests);
    filterAndRender();
}, 300);

let pomoSettings = JSON.parse(localStorage.getItem('pomo_settings')) || {
    enabled: 'yes', focusTime: 25, breakTime: 5, quoteRate: 30, sound: 'beep', vibrate: 'no', icon: '🍅', bubbles: 'yes', themeShade: 'theme-amoled', highlightTask: 'yes'
};
let pomoTasks = JSON.parse(localStorage.getItem('pomo_tasks')) || [];

if (pomoSettings.themeShade) {
    document.body.className = pomoSettings.themeShade;
}

let pomoSeconds = pomoSettings.focusTime * 60;
let pomoInterval = null;
let quoteInterval = null;
let isPomoRunning = false;
let isFocusMode = true;

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

// Settings Modal Elements
const modalOverlay = document.getElementById('pomo-modal-overlay');
document.getElementById('pomo-open-settings').onclick = () => modalOverlay.classList.add('open');
document.getElementById('pomo-close-modal').onclick = () => modalOverlay.classList.remove('open');
modalOverlay.onclick = (e) => { if(e.target === modalOverlay) modalOverlay.classList.remove('open'); };

// Music Modal Elements
const musicModalOverlay = document.getElementById('music-modal-overlay');
document.getElementById('music-open-btn').onclick = () => musicModalOverlay.classList.add('open');
document.getElementById('music-close-modal').onclick = () => musicModalOverlay.classList.remove('open');
musicModalOverlay.onclick = (e) => { if(e.target === musicModalOverlay) musicModalOverlay.classList.remove('open'); };

// Music Presets
const musicPresets = {
    'spotify-lofi': 'https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?utm_source=generator&theme=0',
    'spotify-focus': 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
    'spotify-classical': 'https://open.spotify.com/embed/playlist/37i9dQZF1DWV0gynK7Pt6v?utm_source=generator&theme=0',
    'yt-lofi': 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0'
};

window.changeMusicPreset = (val) => {
    const customGroup = document.getElementById('custom-music-group');
    const musicFrame = document.getElementById('music-frame');
    if(val === 'custom') {
        customGroup.style.display = 'flex';
    } else {
        customGroup.style.display = 'none';
        musicFrame.src = musicPresets[val];
    }
};

window.applyCustomMusic = () => {
    let url = document.getElementById('custom-music-url').value.trim();
    if(!url) return;
    const musicFrame = document.getElementById('music-frame');

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

// --- LOCAL FILE UPLOADER ---
document.getElementById('local-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const localBook = {
        title: file.name,
        folders: ["MY LOCAL FILES", file.name],
        url: objectUrl
    };

    loadBook(localBook, { classList: { add: ()=>{}, remove: ()=>{} } });
});

window.switchPomoTab = (evt, tabId) => {
    document.querySelectorAll('.pomo-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pomo-tab-content').forEach(c => c.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
};

document.getElementById('pomo-setting-theme-shade').value = pomoSettings.themeShade || 'theme-amoled';
document.getElementById('pomo-setting-enable').value = pomoSettings.enabled;
document.getElementById('pomo-setting-focus').value = pomoSettings.focusTime;
document.getElementById('pomo-setting-break').value = pomoSettings.breakTime;
document.getElementById('pomo-setting-rate').value = pomoSettings.quoteRate || 30;
document.getElementById('pomo-setting-sound').value = pomoSettings.sound;
document.getElementById('pomo-setting-vibrate').value = pomoSettings.vibrate;
document.getElementById('pomo-setting-icon').value = pomoSettings.icon;
document.getElementById('pomo-setting-bubbles').value = pomoSettings.bubbles;
document.getElementById('pomo-setting-highlight').value = pomoSettings.highlightTask || 'yes';

function applyPomoSettingsUI() {
    pomoContainer.style.display = pomoSettings.enabled === 'yes' ? 'flex' : 'none';
    pomoBubble.style.display = pomoSettings.bubbles === 'yes' ? 'block' : 'none';
    pomoLogoIcon.textContent = pomoSettings.icon;
    
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
applyPomoSettingsUI();

function playAlertSound(type) {
    if (type === 'none') return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type === 'chime' ? 'sine' : 'square';
        osc.frequency.setValueAtTime(type === 'chime' ? 587.33 : 440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
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

    localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
    document.body.className = pomoSettings.themeShade;
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
    "Master the fundamentals, and the complex problems will fall. 🧠",
    "Excellence is not an act, but a daily habit. 📈",
    "Build your future one correct answer at a time. 🌟",
    "Sweat more in practice, bleed less in the exam. ⚙️",
    "Stay hungry for knowledge, ruthless with doubts. 🦁"
];

const breakQuotes = [
    "Time to stretch your legs and hydrate! ☕",
    "Great focus! Rest your eyes for a moment. 🌿",
    "Breathe in, breathe out. Relax. 🧘‍♂️",
    "Almost ready for the next sprint! 🔋",
    "Step away from the screen. Give your brain a breather. 🌳",
    "Hydration check! Drink a glass of water right now. 💧"
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

pomoToggleBtn.onclick = () => {
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
                    alert("Focus Session Complete! Time for a break.");
                    pomoSeconds = pomoSettings.breakTime * 60;
                    pomoStatusText.textContent = "Break Time";
                    isFocusMode = false;
                    pomoBubble.textContent = breakQuotes[Math.floor(Math.random() * breakQuotes.length)];
                } else {
                    alert("Break over! Back to focus.");
                    pomoSeconds = pomoSettings.focusTime * 60;
                    pomoStatusText.textContent = "Focus Session";
                    isFocusMode = true;
                    pomoBubble.textContent = focusQuotes[Math.floor(Math.random() * focusQuotes.length)];
                }
                updatePomoDisplay();
            }
        }, 1000);
    }
};

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

updatePomoDisplay();

// --- LIBRARY NAVIGATION LOGIC ---
let currentRoot = "CLASS 10"; 
let currentSubject = "All";
let completedBooks = JSON.parse(localStorage.getItem('library-completed')) || [];
let searchTimeout;

const bookListElement = document.getElementById('book-list');
const searchBar = document.getElementById('search-bar');
const themeToggle = document.getElementById('theme-toggle');
const viewerWrapper = document.getElementById('viewer-wrapper');
const bookFrame = document.getElementById('book-frame');
const playlistDropdown = document.getElementById('playlist-dropdown');
const downloadBtn = document.getElementById('download-btn');

function toggleMobileMenu() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}
document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
document.getElementById('sidebar-overlay').addEventListener('click', toggleMobileMenu);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRoot = btn.getAttribute('data-root');
        searchBar.value = ''; 
        filterAndRender();
    });
});

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
        document.body.className = 'theme-amoled';
        pomoSettings.themeShade = 'theme-amoled';
        themeToggle.textContent = '☀️';
    } else {
        document.body.className = 'theme-light';
        pomoSettings.themeShade = 'theme-light';
        themeToggle.textContent = '🌙';
    }
    localStorage.setItem('pomo_settings', JSON.stringify(pomoSettings));
});

document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (viewerWrapper.requestFullscreen) viewerWrapper.requestFullscreen();
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

document.getElementById('expand-all').addEventListener('click', () => {
    document.querySelectorAll('#book-list details').forEach(d => d.open = true);
});
document.getElementById('collapse-all').addEventListener('click', () => {
    document.querySelectorAll('#book-list details').forEach(d => d.open = false);
});

function filterAndRender() {
    if (masterLibrary.length === 0) return;
    const query = searchBar.value.toLowerCase();
    
    const filteredBooks = masterLibrary.filter(book => {
        const searchString = book.title + " " + (book.folders ? book.folders.join(" ") : "");
        const matchesSearch = searchString.toLowerCase().includes(query);
        const matchesSubject = currentSubject === "All" || searchString.toLowerCase().includes(currentSubject.toLowerCase());
        
        let matchesRoot = book.folders && book.folders[0].toUpperCase() === currentRoot.toUpperCase();
        return matchesRoot && matchesSearch && matchesSubject;
    });
    renderTree(filteredBooks);
}

function renderTree(booksArray) {
    bookListElement.innerHTML = ''; 
    if (booksArray.length === 0) {
        bookListElement.innerHTML = '<div class="placeholder-text" style="font-size:0.9em; margin-top:20px; text-align:center;">No files found.</div>'; return;
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
            const details = document.createElement('details'); if (isOpen) details.open = true; 
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
    const check = document.createElement('input'); check.type = 'checkbox'; check.className = 'check-done';
    check.checked = completedBooks.includes(book.title);
    check.onclick = (e) => {
        e.stopPropagation();
        if(check.checked) completedBooks.push(book.title); else completedBooks = completedBooks.filter(t => t !== book.title);
        localStorage.setItem('library-completed', JSON.stringify(completedBooks));
    };
    
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
        document.getElementById('current-book-title').textContent = book.playlist[0].title;
        
        playlistDropdown.onchange = (e) => {
            bookFrame.src = e.target.value;
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

// --- AI STUDY NAVIGATOR & DIRECT COPILOT LOGIC ---
const chatFab = document.getElementById('chat-fab-btn');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close-btn');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send-btn');

chatFab.onclick = () => chatWindow.classList.add('open');
chatClose.onclick = () => chatWindow.classList.remove('open');

// Quick Facts / Knowledge Base for Instant Answers
const factsKnowledgeBase = [
    { keys: ["ohm's law", "ohms law"], reply: "⚡ <strong>Ohm's Law:</strong> $V = IR$. Voltage ($V$) equals Current ($I$) multiplied by Resistance ($R$)." },
    { keys: ["quadratic formula", "quadratic"], reply: "📐 <strong>Quadratic Formula:</strong> For $ax^2 + bx + c = 0$, $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$." },
    { keys: ["kinetic energy"], reply: "🏃 <strong>Kinetic Energy:</strong> $KE = \\frac{1}{2}mv^2$, where $m$ is mass and $v$ is velocity." },
    { keys: ["gravitational force", "gravity formula", "newton gravity"], reply: "🪐 <strong>Newton's Law of Gravitation:</strong> $F = G \\frac{m_1 m_2}{r^2}$." },
    { keys: ["snell's law", "snells law", "refraction"], reply: "🔍 <strong>Snell's Law:</strong> $n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)$." },
    { keys: ["ideal gas", "gas equation"], reply: "🧪 <strong>Ideal Gas Law:</strong> $PV = nRT$." },
    { keys: ["simulator", "cbt"], reply: "⏱️ You can click the <strong>Simulator</strong> tab above to launch full 3-hour NTA JEE Mock Tests with OMR palettes and countdown timers!" },
    { keys: ["pomodoro", "timer"], reply: "🍅 The <strong>Pomodoro Timer</strong> is located at the top of the sidebar. You can customize focus durations, themes, and alert sounds using the ⚙️ icon." },
    { keys: ["music", "spotify", "songs"], reply: "🎵 Click the <strong>🎵</strong> icon in the header to open background lofi beats or stream custom Spotify/YouTube links while studying." }
];

function processAIQuery(query) {
    const qLower = query.toLowerCase().trim();

    // 1. Check knowledge base for direct factual answers
    for (let item of factsKnowledgeBase) {
        if (item.keys.some(k => qLower.includes(k))) {
            return { type: 'fact', reply: item.reply };
        }
    }

    // 2. Search masterLibrary for pinpoint resource routing
    const words = qLower.replace(/find|show|me|where|are|the|open|search|pdf|video/gi, '').trim().split(' ').filter(w => w.length > 2);
    
    let matches = [];
    if (words.length > 0) {
        matches = masterLibrary.filter(book => {
            const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
            return words.every(w => meta.includes(w)) || words.some(w => meta.includes(w));
        });
    }

    if (matches.length > 0) {
        return {
            type: 'navigation',
            matches: matches.slice(0, 4) // Top 4 matches
        };
    }

    // 3. Fallback response
    return {
        type: 'fact',
        reply: `I couldn't find an exact file or formula for "<em>${query}</em>". Try searching for specific chapters (e.g. <em>Electrostatics</em>, <em>Carbon</em>, <em>Calculus</em>, or <em>Mock Test</em>).`
    };
}

function handleNavigateToResource(bookIndex) {
    const book = masterLibrary[bookIndex];
    if (!book) return;

    // Switch to the correct mode category if applicable
    const rootCategory = book.folders ? book.folders[0].toUpperCase() : 'CLASS 10';
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.getAttribute('data-root') === rootCategory) {
            btn.click();
        }
    });

    // Auto-load the book
    loadBook(book, { classList: { add: ()=>{}, remove: ()=>{} } });
    chatWindow.classList.remove('open');
}

function appendAIMessage(htmlContent, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
    msgDiv.innerHTML = htmlContent;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function handleChatSubmit() {
    const val = chatInput.value.trim();
    if (!val) return;

    appendAIMessage(val, true);
    chatInput.value = '';

    setTimeout(() => {
        const result = processAIQuery(val);
        if (result.type === 'fact') {
            appendAIMessage(result.reply, false);
        } else if (result.type === 'navigation') {
            let cardHtml = `📍 <strong>Found ${result.matches.length} matching material(s):</strong><div class="chat-nav-card">`;
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
    }, 400);
}

chatSend.onclick = handleChatSubmit;
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});
