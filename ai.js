/**
 * ai.js - Advanced Study Copilot Engine 🧠💅🏾
 * 
 * Features a Dual-Personality Matrix (Supportive vs. Sassy),
 * modular intent routing, NLP keyword extraction, 
 * safe math evaluation, and Wikipedia API integration.
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
        'did', 'how', 'what', 'why', 'when', 'where', 'which', 'good', 'best'
    ];
    return str.split(' ').filter(w => !stopwords.includes(w)).join(' ').trim();
};

// ==========================================
// 2. DUAL-PERSONALITY DICTIONARY
// ==========================================
// The AI blends supportive, normal responses with sassy, tough-love responses.

const conversationIntents = [
    {
        patterns: [/\b(hi|hello|hey|yo|sup|greetings|morning|evening)\b/i],
        replies: [
            "Hello! 👋 I'm your AI Study Copilot. How can I help you today?", // Normal
            "Hey there! Ready to crush some study goals? Let me know what you need.", // Normal
            "Hey sugar! 👋🏾 I hope you brought a pencil and some focus, because we are working today.", // Sassy
            "Hello! 💅🏾 Ready to get some actual studying done, or are we just staring at the screen again?" // Sassy
        ]
    },
    {
        patterns: [/\b(how are you|how you doing|whats up|what's up)\b/i],
        replies: [
            "I'm doing great and ready to assist you! What are we focusing on today? 🔋", // Normal
            "I'm good! Just hanging out in your browser. Ready to tackle some subjects? 📚", // Normal
            "I'm fully charged and minding my business. The real question is, how are *your* grades looking? 🤨", // Sassy
            "Doing well, honey! Just waiting for you to actually open a PDF. 📁👀" // Sassy
        ]
    },
    {
        patterns: [/\b(bad|sad|depressed|tired|exhausted|burnout|sleepy)\b/i],
        replies: [
            "It's completely normal to feel exhausted. Your brain needs time to process information. Take a short break and stay hydrated! 💧", // Normal
            "Burnout is real. Please step away from the screen, rest your eyes, and get some fresh air. You can't run on empty! 🌿", // Normal
            "Oh, you tired? You think the examiners care if you're tired? ...Alright, look. Take 15 minutes. But if you fall asleep on that textbook, I'm judging you. 🛏️👀", // Sassy
            "Honey, it is okay to be exhausted. You've been working hard. Go take a nap, but I expect you back here in an hour ready to work! 💙" // Sassy
        ]
    },
    {
        patterns: [/\b(stress|anxious|scared|fail|failing|giving up|quit|hard|difficult|overwhelmed)\b/i],
        replies: [
            "Take a deep breath. 🧘‍♂️ It's okay to feel overwhelmed. Break your tasks into smaller, 20-minute chunks. You have got this!", // Normal
            "Failure is just data. It shows you exactly what to focus on next. Don't let it discourage you, let it guide you! 📈", // Normal
            "Lord have mercy, child, take a breath! 🛑 Panic never passed a test. Fix your crown, review your mistakes, and get back in the ring. 👑💅🏾", // Sassy
            "Quit? Not on my watch. We don't quit in this household. Wipe those tears, drink some water, and let's look at the syllabus again. 😤📚" // Sassy
        ]
    },
    {
        patterns: [/\b(lazy|distracted|procrastinating|cant focus|can't focus|bored|tiktok|instagram)\b/i],
        replies: [
            "Distractions happen! Try using the Pomodoro timer in the sidebar to work in 25-minute focused bursts. It makes starting much easier! ⏱️", // Normal
            "It's hard to focus sometimes. Try putting your phone in another room and committing to just 5 minutes of work. 🚀", // Normal
            "Oh, absolutely not. Put that phone DOWN. 📱❌ Give me 5 solid minutes of focus right now before I lose my digital mind.", // Sassy
            "You bored? I know you ain't sitting there scrolling social media when you got mock tests to take. Focus! 👁️👄👁️" // Sassy
        ]
    },
    {
        patterns: [/\b(thanks|thank you|thx|appreciate it)\b/i],
        replies: [
            "You're very welcome! Keep up the great work! 💪", // Normal
            "Happy to help! Let me know if you need anything else.", // Normal
            "You're welcome, chile. Don't thank me, thank yourself when you see that passing grade! 🏃🏾‍♀️💨", // Sassy
            "You know I got you! Now let's crush the rest of your study session. Period. 📚✨" // Sassy
        ]
    },
    {
        patterns: [/\b(who are you|what are you|your name)\b/i],
        replies: [
            "I'm your AI Study Copilot! I live right here in your app to help you find notes, solve math, and keep you on track. 🤖", // Normal
            "I am your AI Study Copilot, honey. Part machine, part no-nonsense auntie. I'm here to make sure you pass these classes, period. 💁🏾‍♀️✨" // Sassy
        ]
    },
    {
        patterns: [/\b(memorize|forget|remember|memory|keep forgetting|study tips|how to study)\b/i],
        replies: [
            "🧠 <strong>Study Tip:</strong> Use <strong>Active Recall</strong>! Instead of re-reading notes, close the book and try to write down everything you remember. It forces your brain to build permanent neural pathways.",
            "Honey, reading the same page 10 times ain't studying, that's just staring! 🙄 Use <strong>Spaced Repetition</strong>. Review a topic today, then in 3 days, then in a week. You can't cram a whole semester in one night, chile. ✨"
        ]
    },
    {
        patterns: [/\b(don't understand|confused|explain better|stuck|lost)\b/i],
        replies: [
            "💡 <strong>The Feynman Technique:</strong> If a concept is confusing, try explaining it out loud right now as if you were teaching a 10-year-old. When you stumble, you've found your exact knowledge gap! Go back to your material just to fix that gap. 🗣️📖"
        ]
    },
    {
        patterns: [/\b(exam tomorrow|test tomorrow|cramming)\b/i],
        replies: [
            "🚨 <strong>Exam Eve Strategy:</strong> Do NOT try to learn new topics now. Review your cheat sheets, look over formulas, and get at least 7 hours of sleep. A rested brain will recall more than an exhausted, crammed brain!", // Normal
            "If your exam is tomorrow, put the heavy textbooks away! 🛑 Drink water, review the formulas, and go to bed. Staring at pages at 3 AM will only make you forget what you already know. 🛌✨" // Sassy
        ]
    }
];

// ==========================================
// 3. SPECIALIZED ENGINE MODULES
// ==========================================

// Module A: Handle Small Talk & Time
function matchConversation(query) {
    const qLower = query.toLowerCase();

    // Time & Date
    if (qLower.match(/(what time is it|time please|current time)/)) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return `It's exactly <strong>${time}</strong>. Let's make every single minute count! ⏳`;
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

// Module B: Safely Evaluate Math
function solveMath(query) {
    // Replaces word operators with math operators for better parsing
    let normalized = query.toLowerCase()
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times|multiplied by/g, '*')
        .replace(/divided by|over/g, '/');

    const calcMatch = normalized.match(/(?:calculate|solve|what is) ([\d\+\-\*\/\(\)\.\s\^]+)$/);
    if (calcMatch && calcMatch[1].trim().length > 0) {
        try {
            let expression = calcMatch[1].replace(/\^/g, '**'); 
            // Strict regex to prevent XSS/harmful execution
            if (/^[0-9\+\-\*\/\(\)\.\s\*]+$/.test(expression)) {
                let result = new Function(`return ${expression}`)();
                if (!isNaN(result)) {
                    return `🔢 <strong>Math:</strong> ${calcMatch[1]} <br>✅ <strong>Result:</strong> ${parseFloat(result.toFixed(4))} 💅🏾`;
                }
            }
        } catch (e) { /* Fall through if invalid */ }
    }
    return null;
}

// Module C: Score and Search Internal Library
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
        const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
        let score = 0;
        searchWords.forEach(w => { if (meta.includes(w)) score += 10; });
        return { book, score };
    }).filter(item => item.score > 0);

    if (scoredBooks.length > 0) {
        scoredBooks.sort((a, b) => b.score - a.score); 
        return scoredBooks.map(item => item.book).slice(0, 5); // Return Top 5
    }
    return null;
}

// Module D: Fetch from Wikipedia API
async function fetchWikipedia(query) {
    // 1. Direct Definition Intent
    const defMatch = query.match(/(?:what is|define|who is|explain|what are|meaning of|theory behind|concept of) (.+)/i);
    let searchTopic = null;

    if (defMatch) {
        searchTopic = removeStopwords(defMatch[1].replace(/\?$/, '').trim());
    } else {
        // 2. Broad Topic Intent (If it's just a noun without a conversational trigger)
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
                
                // Fetch the actual summary for that exact title
                const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResultTitle)}`);
                if (summaryRes.ok) {
                    const wikiData = await summaryRes.json();
                    if (wikiData.type !== 'disambiguation' && wikiData.extract) {
                        return `🧠 <strong>${wikiData.title}:</strong> ${wikiData.extract} <br><br><a href="${wikiData.content_urls.desktop.page}" target="_blank" style="color:var(--highlight-text);font-size:0.85em;text-decoration:underline;">Read more on Wikipedia</a>`;
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
// 4. MAIN ROUTER & ORCHESTRATOR
// ==========================================

async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();

    // Route 1: Small Talk & Emotion
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
                "Here you go! I pulled up the best matches. Let's get to work. 🚀",
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
            prefix: `I couldn't find a direct answer or definition, but I dug through your library and found these relevant files: 📁👇🏾`
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
