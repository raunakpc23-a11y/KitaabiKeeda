/**
 * ai.js - Advanced Study Copilot Engine 🧠💅🏾
 * 
 * Features a Dual-Personality Matrix (Supportive vs. Sassy),
 * modular intent routing, NLP keyword extraction, 
 * safe math evaluation, App Control triggers, and Rich Wikipedia API integration.
 */

// ==========================================
// 1. CORE UTILITIES & NLP HELPERS
// ==========================================

// Picks a random response from an array to ensure dynamic conversation
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Strips conversational fluff to extract core search subjects
const removeStopwords = (str) => {
    const stopwords = [
        'i', 'want', 'to', 'know', 'about', 'need', 'some', 'looking', 'for', 'the', 
        'can', 'you', 'pull', 'up', 'give', 'me', 'any', 'anything', 'have', 'we', 
        'learning', 'study', 'studying', 'today', 'now', 'could', 'would', 'please', 
        'just', 'like', 'a', 'an', 'of', 'in', 'on', 'my', 'meaning', 'tell', 'show', 
        'find', 'search', 'open', 'is', 'are', 'am', 'was', 'were', 'do', 'does', 
        'did', 'how', 'what', 'why', 'when', 'where', 'which', 'good', 'best', 'explain', 'define'
    ];
    return str.split(' ').filter(w => !stopwords.includes(w)).join(' ').trim();
};

// ==========================================
// 2. APP CONTROL UI BUTTONS
// ==========================================
// The AI can inject these buttons into chat to physically control the app workspace
const appControls = {
    timer: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#ef4444;" onclick="document.getElementById('pomo-toggle').click()">⏱️ Start/Pause Timer</button>`,
    whiteboard: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#3b82f6;" onclick="document.getElementById('whiteboard-btn').click()">🖌️ Open Scratchpad</button>`,
    analytics: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#f59e0b;" onclick="document.getElementById('analytics-btn').click()">📊 View Study Stats</button>`,
    music: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#8b5cf6;" onclick="document.getElementById('music-open-btn').click()">🎵 Open Audio Hub</button>`,
    theme: `<button class="primary-btn" style="margin-top:10px; width:100%; justify-content:center; background:#64748b;" onclick="document.getElementById('theme-toggle').click()">🌙 Switch Theme</button>`
};

// ==========================================
// 3. DUAL-PERSONALITY DICTIONARY
// ==========================================
const conversationIntents = [
    {
        patterns: [/\b(hi|hello|hey|yo|sup|greetings|morning|evening)\b/i],
        replies: [
            "Hello! 👋 I'm your AI Study Copilot. How can I help you today?",
            "Hey there! Ready to crush some study goals? Let me know what you need.",
            "Hey sugar! 👋🏾 I hope you brought a pencil and some focus, because we are working today.",
            "Hello! 💅🏾 Ready to get some actual studying done, or are we just staring at the screen again?"
        ]
    },
    {
        patterns: [/\b(how are you|how you doing|whats up|what's up)\b/i],
        replies: [
            "I'm doing great and ready to assist you! What are we focusing on today? 🔋",
            "I'm good! Just hanging out in your browser. Ready to tackle some subjects? 📚",
            "I'm fully charged and minding my business. The real question is, how are *your* grades looking? 🤨",
            "Doing well, honey! Just waiting for you to actually open a PDF. 📁👀"
        ]
    },
    {
        patterns: [/\b(bad|sad|depressed|tired|exhausted|burnout|sleepy)\b/i],
        replies: [
            `It's completely normal to feel exhausted. Your brain needs time to process information. Take a short break! 💧 ${appControls.timer}`,
            `Burnout is real. Let me put on some ambient noise, close your eyes for a minute, and breathe. 🌿 ${appControls.music}`,
            `Oh, you tired? You think the examiners care if you're tired? ...Alright, look. Take 15 minutes. But if you fall asleep on that textbook, I'm judging you. 🛏️👀 ${appControls.timer}`,
            `Honey, it is okay to be exhausted. Go take a nap, but I expect you back here in an hour ready to work! 💙`
        ]
    },
    {
        patterns: [/\b(stress|anxious|scared|fail|failing|giving up|quit|hard|difficult|overwhelmed)\b/i],
        replies: [
            `Take a deep breath. 🧘‍♂️ It's okay to feel overwhelmed. Break your tasks into smaller chunks. You have got this!`,
            `Failure is just data. It shows you exactly what to focus on next. Don't let it discourage you, let it guide you! 📈 ${appControls.analytics}`,
            `Lord have mercy, child, take a breath! 🛑 Panic never passed a test. Fix your crown, review your mistakes, and get back in the ring. 👑💅🏾`,
            `Quit? Not on my watch. We don't quit in this household. Wipe those tears, drink some water, and let's look at the syllabus again. 😤📚`
        ]
    },
    {
        patterns: [/\b(lazy|distracted|procrastinating|cant focus|can't focus|bored|tiktok|instagram)\b/i],
        replies: [
            `Distractions happen! Try using the Pomodoro timer to work in 25-minute bursts. It makes starting much easier! ⏱️ ${appControls.timer}`,
            `Oh, absolutely not. Put that phone DOWN. 📱❌ Give me 25 solid minutes of focus right now before I lose my digital mind. ${appControls.timer}`,
            `You bored? I know you ain't sitting there scrolling social media when you got mock tests to take. Focus! 👁️👄👁️`
        ]
    },
    {
        patterns: [/\b(draw|write|scratchpad|whiteboard|rough work|solve this)\b/i],
        replies: [
            `I've got a blank canvas waiting for you. Let's map it out! 📐 ${appControls.whiteboard}`,
            `Need to scribble some equations? Here you go, grab a digital marker: ${appControls.whiteboard}`
        ]
    },
    {
        patterns: [/\b(music|lofi|rain|noise|songs|play something|quiet|audio)\b/i],
        replies: [
            `Silence is deafening. Let's get some ambient noise or Lofi beats going. 🎧 ${appControls.music}`,
            `I have rain, cafe chatter, and deep focus beats ready for you. Let's set the mood. ☕ ${appControls.music}`
        ]
    },
    {
        patterns: [/\b(stats|analytics|progress|how am i doing|streak)\b/i],
        replies: [
            `Let's look at the numbers. Data doesn't lie! Let's see that study streak. 📈 ${appControls.analytics}`
        ]
    },
    {
        patterns: [/\b(dark mode|light mode|theme|eyes hurt|too bright)\b/i],
        replies: [
            `Let me fix the lighting for you. Save those eyes! 👓 ${appControls.theme}`
        ]
    },
    {
        patterns: [/\b(thanks|thank you|thx|appreciate it)\b/i],
        replies: [
            "You're very welcome! Keep up the great work! 💪",
            "You're welcome, chile. Don't thank me, thank yourself when you see that passing grade! 🏃🏾‍♀️💨",
            "You know I got you! Now let's crush the rest of your study session. Period. 📚✨"
        ]
    },
    {
        patterns: [/\b(memorize|forget|remember|memory|keep forgetting|study tips|how to study)\b/i],
        replies: [
            "🧠 <strong>Study Tip:</strong> Use <strong>Active Recall</strong>! Instead of re-reading notes, close the book and try to write down everything you remember.",
            "Honey, reading the same page 10 times ain't studying, that's just staring! 🙄 Use <strong>Spaced Repetition</strong>. Review a topic today, then in 3 days, then in a week. ✨"
        ]
    },
    {
        patterns: [/\b(don't understand|confused|explain better|stuck|lost)\b/i],
        replies: [
            "💡 <strong>The Feynman Technique:</strong> Try explaining it out loud right now as if you were teaching a 10-year-old. When you stumble, you've found your exact knowledge gap! 🗣️📖"
        ]
    }
];

// ==========================================
// 4. SPECIALIZED ENGINE MODULES
// ==========================================

// Module A: Handle Small Talk & Time
function matchConversation(query) {
    const qLower = query.toLowerCase();

    // Time & Date
    if (qLower.match(/(what time is it|time please|current time)/)) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return `It's exactly <strong>${time}</strong>. Let's make every single minute count! ⏳ ${appControls.timer}`;
    }
    if (qLower.match(/(what day is it|current date|what is today)/)) {
        const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return `Today is <strong>${date}</strong>. Make it a productive one! 📅`;
    }

    // Match against dictionaries if query is relatively short
    if (qLower.split(' ').length < 15) {
        for (let intent of conversationIntents) {
            for (let pattern of intent.patterns) {
                if (pattern.test(qLower)) {
                    return rand(intent.replies);
                }
            }
        }
    }
    return null;
}

// Module B: Safely Evaluate Advanced Math
function solveMath(query) {
    // Replaces word operators with math operators for better parsing
    let normalized = query.toLowerCase()
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times|multiplied by/g, '*')
        .replace(/divided by|over/g, '/')
        .replace(/square root of|sqrt/g, 'Math.sqrt')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/pi/g, 'Math.PI');

    const calcMatch = normalized.match(/(?:calculate|solve|what is|compute) ([\d\+\-\*\/\(\)\.\s\^a-zA-Z]+)$/);
    if (calcMatch && calcMatch[1].trim().length > 0) {
        try {
            let expression = calcMatch[1].replace(/\^/g, '**'); 
            // Strict regex to prevent XSS/harmful execution (allows Math. objects)
            if (/^[0-9\+\-\*\/\(\)\.\s\*MatihsqrcostnPI]+$/.test(expression)) {
                let result = new Function(`'use strict'; return (${expression})`)();
                if (!isNaN(result)) {
                    let formattedResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(5));
                    return `
                        <div style="background:var(--folder-bg); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                            🔢 <strong>Math:</strong> <code style="color:var(--highlight-text);">${calcMatch[1]}</code> <br>
                            ✅ <strong>Result:</strong> <span style="font-size:1.1em; font-weight:bold;">${formattedResult}</span> 💅🏾
                        </div>`;
                }
            }
        } catch (e) { /* Fall through if invalid */ }
    }
    return null;
}

// Module C: Score and Search Internal Library (Weighted)
function searchLibrary(query, libraryData, isBroad = false) {
    if (!libraryData || libraryData.length === 0) return null;
    
    // Extract keywords
    let matchPattern = isBroad 
        ? query // use as-is for broad fallback
        : query.match(/(?:find|search|where|show|open|look for|pull up|i need|do you have|notes on|lectures on|practice) (.+)/i);
    
    let searchTarget = isBroad ? matchPattern : (matchPattern ? matchPattern[1] : null);
    if (!searchTarget) return null;

    const searchWords = removeStopwords(searchTarget).split(' ').filter(w => w.length > 2);
    if (searchWords.length === 0) return null;

    // Relevance Scoring Engine
    let scoredBooks = libraryData.map(book => {
        const titleLower = book.title.toLowerCase();
        const folderLower = book.folders ? book.folders.join(" ").toLowerCase() : "";
        let score = 0;
        
        searchWords.forEach(w => { 
            if (titleLower === w) score += 30; // Exact word match in title (Highest)
            else if (titleLower.includes(w)) score += 15; // Partial word in title
            
            if (folderLower === w) score += 10; // Exact folder match
            else if (folderLower.includes(w)) score += 5; // Partial folder match
        });
        
        return { book, score };
    }).filter(item => item.score > 0);

    if (scoredBooks.length > 0) {
        scoredBooks.sort((a, b) => b.score - a.score); 
        return scoredBooks.map(item => item.book).slice(0, 5); // Return Top 5
    }
    return null;
}

// Module D: Fetch Rich Data from Wikipedia API
async function fetchWikipedia(query) {
    // 1. Direct Definition Intent
    const defMatch = query.match(/(?:what is|define|who is|explain|what are|meaning of|theory behind|concept of) (.+)/i);
    let searchTopic = null;

    if (defMatch) {
        searchTopic = removeStopwords(defMatch[1].replace(/\?$/, '').trim());
    } else {
        // 2. Broad Topic Intent
        const cleanQuery = removeStopwords(query.toLowerCase());
        if (cleanQuery.length > 2 && query.split(' ').length < 5) {
            searchTopic = cleanQuery;
        }
    }

    if (searchTopic && searchTopic.length > 2) {
        try {
            // First, use Open Search to correct typos and find the exact Wikipedia page title
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTopic)}&utf8=&format=json&origin=*`);
            if (!searchRes.ok) return null;
            
            const searchData = await searchRes.json();
            if (searchData.query && searchData.query.search.length > 0) {
                const topResultTitle = searchData.query.search[0].title;
                
                // Fetch the actual summary and image for that exact title
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
                            </div>`;
                    }
                }
            }
        } catch (e) {
            console.error("Wikipedia fetch failed", e);
        }
    }
    return null;
}

// ==========================================
// 5. MASTER ROUTER & ORCHESTRATOR
// ==========================================
async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();

    // Route 1: Small Talk, App Control & Emotion
    const convoReply = matchConversation(query);
    if (convoReply) return { type: 'fact', reply: convoReply };

    // Route 2: Math Calculation
    const mathReply = solveMath(query);
    if (mathReply) return { type: 'fact', reply: mathReply };

    // Route 3: Specific Library Navigation
    const navMatches = searchLibrary(qLower, libraryData, false);
    if (navMatches) {
        return { 
            type: 'navigation', 
            matches: navMatches,
            prefix: rand([
                "I found these for you. Now actually open them and read, don't just stare! 📁👇🏾",
                "Here you go! I pulled up the best matches based on title and folder relevance. 🚀",
                "Found 'em! Click a link and let's start studying. 📖✨"
            ])
        };
    }

    // Route 4: Knowledge / Wikipedia Fetch
    const wikiReply = await fetchWikipedia(query);
    if (wikiReply) return { type: 'fact', reply: wikiReply };

    // Route 5: Broad Keyword Library Search (Fallback)
    const fallbackMatches = searchLibrary(qLower, libraryData, true);
    if (fallbackMatches) {
        return {
            type: 'navigation',
            matches: fallbackMatches,
            prefix: `I couldn't find a dictionary definition, but I dug through your library and found these relevant files: 📁👇🏾`
        };
    }

    // Route 6: Catch-All / Web Search Generator
    if (qLower.includes('?')) {
        return {
            type: 'fact',
            reply: `That's a specific question! I don't have that in my local library or encyclopedia. Ask me to find a PDF or solve math. For everything else, the Lord gave us Google. 🤷🏾‍♀️☕<br><br>
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
                "Interesting! Want me to search your library for anything related to that?",
                "Got it! Let me know if you want me to pull up any notes, solve math, or define a concept for you. Otherwise, hit the books! 💅🏾"
            ])
        };
    }
}
