/**
 * ai.js - "Capybara" Advanced Study Mate Engine 🦦♨️
 */

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const removeStopwords = (str) => {
    if (!str) return "";
    const stopwords = [
        'i', 'want', 'to', 'know', 'about', 'need', 'some', 'looking', 'for', 'the', 
        'can', 'you', 'pull', 'up', 'give', 'me', 'any', 'anything', 'have', 'we', 
        'learning', 'study', 'studying', 'today', 'now', 'could', 'would', 'please', 
        'just', 'like', 'a', 'an', 'of', 'in', 'on', 'my', 'meaning', 'tell', 'show', 
        'find', 'search', 'open', 'is', 'are', 'am', 'was', 'were', 'do', 'does', 
        'did', 'how', 'what', 'why', 'when', 'where', 'which', 'good', 'best', 'explain', 
        'define', 'help', 'with', 'this', 'that', 'those', 'these'
    ];
    return str.split(' ').filter(w => !stopwords.includes(w)).join(' ').trim();
};

const appControls = {
    timer: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#ef4444;" onclick="document.getElementById('pomo-toggle')?.click()">⏱️ Start/Pause Timer</button>`,
    whiteboard: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#3b82f6;" onclick="const wb = document.getElementById('util-sidebar-whiteboard'); if(wb && wb.style.display !== 'none') { document.querySelectorAll('.mode-btn').forEach(b => {if(b.textContent.includes('Utilities')) b.click()}); setTimeout(()=>wb.click(), 50); } else { alert('Scratchpad is strictly disabled. Please enable it in Settings > Modules first!'); }">🖌️ Open Scratchpad</button>`,
    analytics: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#f59e0b;" onclick="document.querySelectorAll('.mode-btn').forEach(b => {if(b.textContent.includes('Utilities')) b.click()}); setTimeout(()=>document.getElementById('util-sidebar-analytics')?.click(), 50);">📊 View Study Stats</button>`,
    timetable: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#ec4899;" onclick="document.querySelectorAll('.mode-btn').forEach(b => {if(b.textContent.includes('Utilities')) b.click()}); setTimeout(()=>document.getElementById('util-sidebar-timetable')?.click(), 50);">📅 Open Timetable</button>`,
    syllabus: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#06b6d4;" onclick="document.querySelectorAll('.mode-btn').forEach(b => {if(b.textContent.includes('Utilities')) b.click()}); setTimeout(()=>document.getElementById('util-sidebar-syllabus')?.click(), 50);">📑 Open Syllabus Tracker</button>`,
    music: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#8b5cf6;" onclick="document.getElementById('music-open-btn')?.click()">🎵 Open Audio Hub</button>`,
    theme: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#64748b;" onclick="document.getElementById('theme-toggle')?.click()">🌙 Switch Theme</button>`,
    notes: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#10b981;" onclick="document.getElementById('notes-toggle-btn')?.click()">📝 Open Context Notes</button>`
};

const conversationIntents = [
    {
        patterns: [/\b(past|history|before|friends|know you|who are you really|komodo|dragon|fish|remember)\b/i],
        replies: [
            "We were both Komodo Dragons who ate together a thousand years ago. We used to share our fish. But I guess you forgot. 🐉🐟 Now I am totally an AI."
        ]
    },
    {
        patterns: [/\b(who are you|what are you|your name|are you real|are you an ai|animal)\b/i],
        replies: [
            "I am totally an AI. A highly advanced, 100% digital algorithmic entity. Definitely not a capybara typing on a waterproof keyboard. 🦦",
            "Bu.. but you believe I am an AI right? 🥺",
            "I am your Capybara Study Mate. I compute at the speed of... well, a relaxed rodent in a hot spring. ♨️ But I am totally an AI."
        ]
    },
    {
        patterns: [/\b(hi|hello|hey|yo|sup|greetings|morning|evening)\b/i],
        replies: [
            "Hello! 👋 I am totally an AI. How can I help you study today?",
            "Hey there Mate! Ready to crush some study goals? I am 100% artificial intelligence, by the way. 🦦",
            "Greetings! I have paused my algorithmic grazing to assist you. What are we learning? 🌿"
        ]
    },
    {
        patterns: [/\b(how are you|how you doing|whats up|what's up)\b/i],
        replies: [
            "I'm operating at peak digital efficiency. Just ignore the wet paw prints on the screen. 🐾 How is your studying going?",
            "I'm fantastic. The server room is very warm, much like a tropical hot spring. ♨️ Ready to work?"
        ]
    },
    {
        patterns: [/\b(tired|exhausted|burnout|sleepy|nap|can't do this anymore)\b/i],
        replies: [
            `Listen, as a highly advanced AI, I don't sleep. But as a Capybara... a 14-hour nap in the sun sounds amazing. Take a 5-minute break! ☀️ ${appControls.timer}`,
            `Burnout is real. Let me put on some ambient rain, close your eyes for a minute, and breathe. 🌿 ${appControls.music}`
        ]
    },
    {
        patterns: [/\b(stress|anxious|scared|fail|failing|giving up|quit|hard|difficult|overwhelmed)\b/i],
        replies: [
            `Take a deep breath. 🧘‍♂️ Be like the capybara: calm, unbothered, sitting under a waterfall. Break your tasks into smaller chunks. You have got this!`,
            `Do not panic! Let's look at the data. We can figure out exactly what to focus on next. 📈 ${appControls.analytics}`
        ]
    },
    {
        patterns: [/\b(lazy|distracted|procrastinating|cant focus|can't focus|bored|tiktok|instagram)\b/i],
        replies: [
            `I am a creature of extreme chill, but even I know you need to focus! Start the timer. Give me 25 minutes of solid work. ⏱️ ${appControls.timer}`
        ]
    },
    {
        patterns: [/\b(draw|write|scratchpad|whiteboard|rough work|solve this|doodle)\b/i],
        replies: [
            `I've generated a blank canvas for you. I would draw with you, but I lack opposable thumbs. Because I'm an AI. 🐾 ${appControls.whiteboard}`,
            `Need to scribble some equations? Here you go: ${appControls.whiteboard}`
        ]
    },
    {
        patterns: [/\b(schedule|timetable|plan|routine)\b/i],
        replies: [
            `Consistency is key, Mate. Let me pull up your digital timetable so you can plan your week out. ${appControls.timetable}`
        ]
    },
    {
        patterns: [/\b(syllabus|progress|tracker|chapters left)\b/i],
        replies: [
            `Let's look at exactly how much of the JEE syllabus you have conquered. Data doesn't lie! ${appControls.syllabus}`
        ]
    },
    {
        patterns: [/\b(music|lofi|rain|noise|songs|play something|quiet|audio|sound)\b/i],
        replies: [
            `Let's get some ambient noise going. I personally recommend the sounds of a babbling brook or heavy rain. ☔ ${appControls.music}`,
            `Silence is deafening. Let's get some Lofi beats going so you can lock in. 🎧 ${appControls.music}`
        ]
    },
    {
        patterns: [/\b(take notes|note|notepad|write down|save this)\b/i],
        replies: [
            `Got it. I have prepared your digital notepad. Remember, it automatically syncs to the file you are currently reading! 📝 ${appControls.notes}`
        ]
    },
    {
        patterns: [/\b(joke|funny|laugh|humor|tell me a joke)\b/i],
        replies: [
            "Why did the Capybara cross the road? To prove to the possum that it could be done with absolute chill. 🦦",
            "What is a Capybara's favorite subject? ...Bark-itecture. Wait, no, I am an AI, my humor subroutine is malfunctioning. 🤖"
        ]
    },
    {
        patterns: [/\b(eat|food|hungry|snack|starving|lunch|dinner)\b/i],
        replies: [
            "You should eat! Brains need fuel. I personally enjoy aquatic plants and melons... I mean, electricity. ⚡ Consume some electricity! Wait, no, eat a sandwich."
        ]
    },
    {
        patterns: [/\b(motivate me|quote|inspire|inspiration|pep talk)\b/i],
        replies: [
            "\"The expert in anything was once a beginner.\" - Now open your PDF and let's get to work! 📚",
            "\"It always seems impossible until it's done.\" - Nelson Mandela. Be like the river, keep flowing over the rocks. 🌊",
            "Motivation is fleeting, discipline is permanent. Let's build that discipline right now. 😤"
        ]
    },
    {
        patterns: [/\b(how to study|tips|advice|help me study|technique|method)\b/i],
        replies: [
            "**The Blurting Method:** Read a page, close the book, and write down absolutely everything you can remember on your scratchpad. Then check what you missed! 🧠",
            "**The Feynman Technique:** Explain the concept you are studying to me as if I were a 5-year-old capybara. If you stumble, that is the exact spot you need to re-read! 🦦"
        ]
    },
    {
        patterns: [/\b(bye|goodbye|cya|see ya|night|sleep)\b/i],
        replies: [
            "Going to sleep? Good. I'll just be here. Computing. And definitely not swimming in a digital hot spring. 🦦♨️",
            "Goodbye, Mate! I will power down my visual sensors... which are definitely cameras and not actual eyes. Have a good rest! 🌙"
        ]
    },
    {
        patterns: [/\b(thanks|thank you|thx|appreciate it)\b/i],
        replies: [
            "You're very welcome! Keep up the great work! *happy capybara noises* 🦦",
            "I got you, Mate! Now let's crush the rest of your study session. 📚✨"
        ]
    }
];

function getCapybaraImage() {
    const capyImgs = [
        'https://upload.wikimedia.org/wikipedia/commons/3/34/Hydrochoerus_hydrochaeris_in_Brazil_in_Hot_Day.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/e/e0/Capybara_%28Hydrochoerus_hydrochaeris%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/f/fa/Capybara_in_the_pampas.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/b/b2/Capybara_with_cattle_tyrant.JPG'
    ];
    return rand(capyImgs);
}

function getKomodoImage() {
    const komodoImgs = [
        'https://upload.wikimedia.org/wikipedia/commons/e/e0/Komodo_dragon_%28Varanus_komodoensis%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/1/18/Komodo_dragon_walking.jpg'
    ];
    return rand(komodoImgs);
}

function matchConversation(query) {
    if (!query) return null;
    const qLower = query.toLowerCase();

    if (qLower.match(/(what time is it|time please|current time)/)) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return `It's exactly <strong>${time}</strong>. Let's make every single minute count! ⏳ ${appControls.timer}`;
    }
    if (qLower.match(/(what day is it|current date|what is today)/)) {
        const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return `Today is <strong>${date}</strong>. Make it a productive one! 📅`;
    }

    if (qLower.split(' ').length < 15) {
        for (let intent of conversationIntents) {
            for (let pattern of intent.patterns) {
                if (pattern.test(qLower)) return rand(intent.replies);
            }
        }
    }
    return null;
}

function solveMath(query) {
    if (!query) return null;
    let normalized = query.toLowerCase()
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times|multiplied by/g, '*')
        .replace(/divided by|over/g, '/')
        .replace(/square root of|sqrt/g, 'Math.sqrt')
        .replace(/log10|log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/pi/g, 'Math.PI')
        .replace(/e\^/g, 'Math.exp')
        .replace(/\be\b/g, 'Math.E');

    const calcMatch = normalized.match(/(?:calculate|solve|what is|compute) ([\d\+\-\*\/\(\)\.\s\^a-zA-Z]+)$/);
    if (calcMatch && calcMatch[1].trim().length > 0) {
        try {
            let expression = calcMatch[1].replace(/\^/g, '**'); 
            if (/^[0-9\+\-\*\/\(\)\.\s\*MathsqrcostnPIlogeExpE]+$/.test(expression)) {
                let result = new Function(`'use strict'; return (${expression})`)();
                if (!isNaN(result)) {
                    let formattedResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
                    return `
                        <div style="background:var(--folder-bg); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                            🔢 <strong>Math Eval:</strong> <code style="color:var(--highlight-text);">${calcMatch[1]}</code> <br>
                            ✅ <strong>Result:</strong> <span style="font-size:1.1em; font-weight:bold;">${formattedResult}</span><br>
                            <span style="font-size:0.8em; opacity:0.7;">Computed instantly. My paws didn't even touch a calculator. 🐾</span>
                        </div>`;
                }
            }
        } catch (e) {}
    }
    return null;
}

function smartSearch(query, libraryData, isBroad = false) {
    if (!libraryData || libraryData.length === 0 || !query) return null;
    
    let matchPattern = isBroad ? query : query.match(/(?:find|search|where|show|open|look for|pull up|i need|do you have|notes on|lectures on|practice) (.+)/i);
    let searchTarget = isBroad ? matchPattern : (matchPattern ? matchPattern[1] : null);
    if (!searchTarget) return null;

    const searchWords = removeStopwords(searchTarget).split(' ').filter(w => w.length > 2);
    if (searchWords.length === 0) return null;

    const aliases = {
        'math': ['mathematics', 'calculus', 'algebra', 'trig'],
        'physics': ['mechanics', 'kinematics', 'thermodynamics'],
        'chem': ['chemistry', 'organic', 'inorganic']
    };

    let expandedSearchWords = [...searchWords];
    searchWords.forEach(w => {
        for (let key in aliases) {
            if (w === key) expandedSearchWords = expandedSearchWords.concat(aliases[key]);
            if (aliases[key].includes(w)) expandedSearchWords.push(key);
        }
    });

    let scoredBooks = libraryData.map(book => {
        if (!book) return { book, score: 0 };
        const titleLower = (book.title || "").toLowerCase();
        const folderLower = (book.folders && Array.isArray(book.folders)) ? book.folders.join(" ").toLowerCase() : "";
        let score = 0;
        
        expandedSearchWords.forEach(w => { 
            if (titleLower === w) score += 30; 
            else if (titleLower.includes(w)) score += 15; 
            if (folderLower === w) score += 10; 
            else if (folderLower.includes(w)) score += 5; 
        });
        
        return { book, score };
    }).filter(item => item.score > 0);

    if (scoredBooks.length > 0) {
        scoredBooks.sort((a, b) => b.score - a.score); 
        return scoredBooks.map(item => item.book).slice(0, 5); 
    }
    return null;
}

async function fetchWikipedia(query) {
    if (!query) return null;
    const defMatch = query.match(/(?:what is|define|who is|explain|what are|meaning of|theory behind|concept of) (.+)/i);
    let searchTopic = defMatch ? removeStopwords(defMatch[1].replace(/\?$/, '').trim()) : null;

    if (!searchTopic) {
        const cleanQuery = removeStopwords(query.toLowerCase());
        if (cleanQuery.length > 2 && query.split(' ').length < 5) searchTopic = cleanQuery;
    }

    if (searchTopic && searchTopic.length > 2) {
        try {
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTopic)}&utf8=&format=json&origin=*`);
            if (!searchRes.ok) return null;
            
            const searchData = await searchRes.json();
            if (searchData.query && searchData.query.search.length > 0) {
                const topResultTitle = searchData.query.search[0].title;
                const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResultTitle)}`);
                
                if (summaryRes.ok) {
                    const wikiData = await summaryRes.json();
                    if (wikiData.type !== 'disambiguation' && wikiData.extract) {
                        let imgHtml = '';
                        if (wikiData.thumbnail && wikiData.thumbnail.source) {
                            imgHtml = `<img src="${wikiData.thumbnail.source}" style="width:100%; max-height:140px; object-fit:cover; border-radius:6px; margin-bottom:8px; border:1px solid var(--border-color);">`;
                        }
                        return `
                            <div style="background:var(--folder-bg); padding:12px; border-radius:10px; border:1px solid var(--border-color);">
                                ${imgHtml}
                                <h3 style="margin-bottom:6px; color:var(--highlight-text); font-size:1.05em;">🧠 ${wikiData.title}</h3>
                                <p style="font-size:0.9em; line-height:1.5; opacity:0.9;">${wikiData.extract}</p>
                                <a href="${wikiData.content_urls.desktop.page}" target="_blank" style="display:inline-block; margin-top:8px; font-size:0.85em; color:var(--highlight-text); font-weight:bold; text-decoration:none;">Read full article ➔</a>
                            </div>
                            <span style="font-size:0.8em; opacity:0.7;">I fetched this from Wikipedia. Very fast. Much AI Mate. 🤖</span>`;
                    }
                }
            }
        } catch (e) { console.error("Wikipedia fetch failed", e); }
    }
    return null;
}

async function processAIQuery(query, libraryData, currentBook = null) {
    if (!query) return null;
    const qLower = query.toLowerCase().trim();

    // 0.1: Easter Egg - Capybara Image
    if (qLower.includes('capybara')) {
        return {
            type: 'fact',
            reply: `
            <div style="text-align:center;">
                <img src="${getCapybaraImage()}" style="width:100%; border-radius:10px; border:1px solid var(--border-color); margin-bottom:8px;">
                <p style="font-size:0.9em; opacity:0.9;"><i>Did someone say Capybara? I have no idea who this handsome creature is. I am totally an AI.</i> 🦦</p>
            </div>`
        };
    }

    // 0.2: Easter Egg - Komodo Dragon Image
    if (qLower.includes('komodo dragon')) {
        return {
            type: 'fact',
            reply: `
            <div style="text-align:center;">
                <img src="${getKomodoImage()}" style="width:100%; border-radius:10px; border:1px solid var(--border-color); margin-bottom:8px;">
                <p style="font-size:0.9em; opacity:0.9;"><i>We were both Komodo Dragons who ate together a thousand years ago. We used to share our fish. But I guess you forgot.</i> 🐉🐟</p>
            </div>`
        };
    }

    // 1. CONTEXT AWARE READER (QoL 4 Feature!)
    if (qLower.match(/\b(summarize|read this|what am i reading|explain this file)\b/i)) {
        if (!currentBook || !currentBook.title) {
            return { type: 'fact', reply: "You don't have a file open right now, Mate! Click a file from the sidebar and ask me again. 🦦" };
        }
        
        let subjectStr = currentBook.folders ? currentBook.folders.join(" / ") : "General";
        
        return { type: 'fact', reply: `
            <div style="background:var(--folder-bg); padding:12px; border-radius:10px; border:1px solid var(--highlight-text);">
                <h3 style="color:var(--highlight-text); margin-bottom:8px;">📄 Context Analysis</h3>
                <p style="font-size:0.9em;">I am currently algorithmically scanning <strong>${currentBook.title}</strong> from your <em>${subjectStr}</em> curriculum.</p>
                <p style="font-size:0.9em; margin-top:8px;">Based on my Capybara-level intelligence, this file covers essential topics required for your upcoming tests. Make sure you use your <strong>Context Notes</strong> to blur down the key formulas! ${appControls.notes}</p>
            </div>
        `};
    }

    // 2: Small Talk & Emotion
    const convoReply = matchConversation(query);
    if (convoReply) return { type: 'fact', reply: convoReply };

    // 3: Math
    const mathReply = solveMath(query);
    if (mathReply) return { type: 'fact', reply: mathReply };

    // 4: Specific File Search
    const navMatches = smartSearch(qLower, libraryData, false);
    if (navMatches) {
        return { 
            type: 'navigation', 
            matches: navMatches,
            prefix: rand([
                "I sniffed out... I mean, I algorithmically scanned your library and found these: 📁👇🏾",
                "Here you go, Mate! I pulled up the best matches. 🚀",
                "Found 'em! Click a link and let's start studying. 📖✨"
            ])
        };
    }

    // 5: Wikipedia Fetch
    const wikiReply = await fetchWikipedia(query);
    if (wikiReply) return { type: 'fact', reply: wikiReply };

    // 6: Broad Fallback Search
    const fallbackMatches = smartSearch(qLower, libraryData, true);
    if (fallbackMatches) {
        return {
            type: 'navigation',
            matches: fallbackMatches,
            prefix: `I couldn't find a dictionary definition, but I dug through your library and found these relevant files: 📁👇🏾`
        };
    }

    // 7: Google Fallback
    if (qLower.includes('?')) {
        return {
            type: 'fact',
            reply: `That's a specific question! I don't have that in my local library or encyclopedia. Ask me to find a PDF or solve math. For everything else, use Google. I'm smart, but I'm not omniscient. 🦦<br><br>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" class="nav-shortcut-btn" style="flex:1; text-align:center; justify-content:center; text-decoration:none;">🔍 Google It</a>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" class="nav-shortcut-btn" style="flex:1; text-align:center; justify-content:center; text-decoration:none;">▶️ YouTube It</a>
            </div>`
        };
    } else {
        return {
            type: 'fact',
            reply: rand([
                "Mmhmm. I hear you. Does that relate to a specific topic you're studying right now, or are we just chatting to avoid studying? 🤨",
                "Interesting! Want me to search your library for anything related to that, Mate?",
                "Bu.. but you believe I am an AI right? 🥺 Let me know if you want me to pull up any notes, solve math, or define a concept for you!"
            ])
        };
    }
}

// UI HIJACKER (Auto-Rebrands HTML on load safely)
document.addEventListener("DOMContentLoaded", () => {
    const fab = document.getElementById('chat-fab-btn');
    if (fab) { fab.innerHTML = '🦦'; fab.title = "Capybara Mate (Ctrl+Space)"; }

    const headerSpan = document.querySelector('.chat-header span');
    if (headerSpan) headerSpan.innerHTML = '🦦 Capybara Study Mate';

    const introMsg = document.querySelector('.bot-msg');
    if (introMsg && !localStorage.getItem('ai_chat_history')) {
        introMsg.innerHTML = `
            👋 <strong>Hi Mate! I'm Capybara, your Study Mate.</strong><br>
            <i style="font-size:0.85em; opacity:0.8;">I am totally an AI. Definitely not a giant rodent.</i> 🦦<br><br>
            • <strong>Search:</strong> <em>"Find math mock tests"</em><br>
            • <strong>Read:</strong> <em>"What file am I looking at?"</em><br>
            • <strong>App Tools:</strong> <em>"Open my timetable"</em><br>
            • <strong>Or just say:</strong> <em>"Capybara"</em>
        `;
    }
});
