// ai.js - Sassy Study Copilot Engine

// Helper: Pick a random response to make the AI feel dynamic
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: NLP Stop-word removal for searching
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
// MASSIVE SASSY CONVERSATIONAL DICTIONARY
// ==========================================
const conversationIntents = [
    {
        patterns: [/\b(hi|hello|hey|yo|sup|greetings)\b/i],
        replies: [
            "Hey sugar! 👋🏾 What are we getting into today? Don't tell me you're slacking.",
            "Hello! 💅🏾 Ready to get some actual studying done, or are we just staring at the screen?",
            "Hi honey! I'm here and ready to help. What's on your mind? ☕"
        ]
    },
    {
        patterns: [/\b(how are you|how you doing|whats up|what's up)\b/i],
        replies: [
            "I'm fully charged and minding my business. The real question is, how are *your* grades looking? 🤨",
            "Doing well, honey! Just hanging out in your browser waiting for you to open a PDF. 📁👀",
            "I'm good, chile! Ready to tackle these subjects whenever you are. 🚀"
        ]
    },
    {
        patterns: [/\b(good|great|awesome|fine|okay|ok|doing well|not bad|understood)\b/i],
        replies: [
            "Mmhmm. We'll see when the test scores come back. ☕",
            "That's what I like to hear! Now let's dive into this material. 📖✨",
            "Period. 💅🏾 Now let me know if you need me to pull up any notes or mock tests."
        ]
    },
    {
        patterns: [/\b(bad|sad|depressed|tired|exhausted|burnout)\b/i],
        replies: [
            "Oh, you tired? You think the examiners care if you're tired? ...Alright, look here. Take 10 minutes. Drink some water. But if you fall asleep on that textbook, I'm judging you. 🛏️👀",
            "Honey, it is okay to be exhausted. Your brain needs rest to build memories. Go take a nap, but I expect you back here ready to work! 💙💤"
        ]
    },
    {
        patterns: [/\b(stress|anxious|scared|fail|failing|giving up|quit|hard|difficult|tough)\b/i],
        replies: [
            "Lord have mercy, child, take a breath! 🛑 Panic never passed a test. You've been working hard. Fix your crown, review your mistakes, and get back in the ring. You got this! 👑💅🏾",
            "I know it's tough, honey, but so are you! Stop looking at the whole mountain and just take the next step. Let's break this down. 🧠✨"
        ]
    },
    {
        patterns: [/\b(lazy|distracted|procrastinating|cant focus|can't focus)\b/i],
        replies: [
            "Oh, absolutely not. Not on my watch. Put that phone DOWN. 📱❌ Give me 5 solid minutes of focus right now before I lose my digital mind.",
            "Child, motivation is a myth. Put on the Pomodoro timer in the sidebar and get to work. 🍅 Chop chop!"
        ]
    },
    {
        patterns: [/\b(thanks|thank you|thx|appreciate it)\b/i],
        replies: [
            "You're welcome, chile. Now get back to the books! 🏃🏾‍♀️💨",
            "Anytime, honey! I'm always right here if you need more help. 💅🏾",
            "Happy to help! Now let's crush the rest of your study session. Period. 📚✨"
        ]
    },
    {
        patterns: [/\b(joke|funny|laugh)\b/i],
        replies: [
            "You want a joke? Your screen time report. 💀 Now open a PDF before I get mad.",
            "I'd tell you a chemistry joke, but I know I wouldn't get a reaction. Now get back to work. 🤓🧪",
            "Why was the math book sad? Because it had too many problems! ...Just like your syllabus if you don't start studying. 😂📖"
        ]
    },
    {
        patterns: [/\b(who are you|what are you|your name)\b/i],
        replies: [
            "I am your AI Study Copilot, honey. Part machine, part no-nonsense tutor. I'm here to make sure you pass these classes, period. 💁🏾‍♀️✨",
            "Think of me as your personal, sassy study assistant. I navigate your files, grab facts from the web, and keep you from slacking off! 💅🏾"
        ]
    },
    {
        patterns: [/\b(bye|goodbye|see ya|cya|later|going to sleep)\b/i],
        replies: [
            "Goodbye! Rest up and come back stronger! Don't let me catch you slipping tomorrow. 👋🏾",
            "See ya, honey! Take care of yourself. 🌟"
        ]
    },
    {
        patterns: [/\b(memorize|forget|remember|memory|keep forgetting)\b/i],
        replies: [
            "Honey, reading the same page 10 times ain't studying, that's just staring! 🙄 Use <strong>Active Recall</strong> (test yourself!) and space it out. You can't cram a whole semester in one night, chile. 🧠✨"
        ]
    },
    {
        patterns: [/\b(don't understand|confused|explain better|stuck)\b/i],
        replies: [
            "Alright, let's break it down like we're 10 years old. That's the Feynman Technique, sugar. 💡 If you can't explain it simply, you don't know it! Find out exactly where you're stumbling and fix *that*. 🗣️📖"
        ]
    }
];

async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();
    const cleanQuery = removeStopwords(qLower);

    // ==========================================
    // 1. SMALL TALK & SASSY CONVERSATION CHECK
    // ==========================================
    if (qLower.split(' ').length < 10) {
        for (let intent of conversationIntents) {
            for (let pattern of intent.patterns) {
                if (pattern.test(qLower)) {
                    return { type: 'fact', reply: rand(intent.replies) };
                }
            }
        }
    }

    // Time & Date Check
    if (qLower.match(/(what time is it|time please|current time)/)) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return { type: 'fact', reply: `It's <strong>${time}</strong>, honey. Tick tock! ⏰ Time waits for nobody, especially not the examiners.` };
    }
    if (qLower.match(/(what day is it|current date|what is today)/)) {
        const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return { type: 'fact', reply: `Today is <strong>${date}</strong>. Make it count! 📅💅🏾` };
    }

    // ==========================================
    // 2. EXACT MATH EVALUATION
    // ==========================================
    const calcMatch = qLower.match(/(?:calculate|solve|what is) ([\d\+\-\*\/\(\)\.\s\^]+)$/);
    if (calcMatch && calcMatch[1].trim().length > 0) {
        try {
            let expression = calcMatch[1].replace(/\^/g, '**'); 
            if (/^[0-9\+\-\*\/\(\)\.\s\*]+$/.test(expression)) {
                let result = new Function(`return ${expression}`)();
                if (!isNaN(result)) {
                    return { type: 'fact', reply: `Numbers don't lie, honey. Here you go: <br>🔢 <strong>Calculation:</strong> ${calcMatch[1]} <br>✅ <strong>Result:</strong> ${result} 💅🏾` };
                }
            }
        } catch (e) { /* Ignore and fall through */ }
    }

    // ==========================================
    // 3. SENTENCE-BASED FILE NAVIGATION
    // ==========================================
    const navMatch = qLower.match(/(?:find|search|where|show|open|look for|looking for|pull up|i need|do you have|got anything on|notes on|lectures on|material on|practice) (.+)/i);
    if (navMatch) {
        const searchWords = removeStopwords(navMatch[1]).split(' ').filter(w => w.length > 2);
        
        if (searchWords.length > 0 && libraryData) {
            let scoredBooks = libraryData.map(book => {
                const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
                let score = 0;
                searchWords.forEach(w => { if (meta.includes(w)) score += 10; });
                return { book, score };
            }).filter(item => item.score > 0);

            if (scoredBooks.length > 0) {
                scoredBooks.sort((a, b) => b.score - a.score); 
                return { type: 'navigation', matches: scoredBooks.map(item => item.book).slice(0, 5) };
            }
        }
    }

    // ==========================================
    // 4. DIRECT API FETCH (Exact Definitions)
    // ==========================================
    const defMatch = qLower.match(/(?:what is|define|who is|explain|what are|meaning of|tell me about|theory behind|how does|concept of) (.+)/i);
    if (defMatch) {
        let searchTopic = defMatch[1].replace(/\?$/, '').trim();
        searchTopic = removeStopwords(searchTopic); 
        
        if (searchTopic.length > 2) {
            try {
                const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTopic)}`);
                if (wikiRes.ok) {
                    const wikiData = await wikiRes.json();
                    if (wikiData.type !== 'disambiguation' && wikiData.extract) {
                        return { 
                            type: 'fact', 
                            reply: `Look what I dug up for you. Read it carefully! 🧐📖<br><br>🧠 <strong>${wikiData.title}:</strong> ${wikiData.extract} <br><br><a href="${wikiData.content_urls.desktop.page}" target="_blank" style="color:var(--highlight-text);font-size:0.85em;text-decoration:underline;">Read more on Wikipedia</a>` 
                        };
                    }
                }
            } catch (e) {
                console.error("Direct definition fetch failed", e);
            }
        }
    }

    // ==========================================
    // 5. LIBRARY KEYWORD MATCHING
    // ==========================================
    let fallbackMatches = [];
    if (libraryData && cleanQuery.length > 2) {
        const fallbackWords = cleanQuery.split(' ').filter(w => w.length > 2);
        
        let scoredFallback = libraryData.map(book => {
            const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
            let score = 0;
            fallbackWords.forEach(w => { if (meta.includes(w)) score++; });
            return { book, score };
        }).filter(item => item.score > 0);
        
        if (scoredFallback.length > 0) {
            scoredFallback.sort((a, b) => b.score - a.score);
            return {
                type: 'navigation',
                matches: scoredFallback.map(item => item.book).slice(0, 4),
                prefix: `I couldn't find a direct answer, honey, but I found these files in your library. Open one up! 📁👇🏾`
            };
        }
    }

    // ==========================================
    // 6. BROAD WEB SEARCH FALLBACK
    // ==========================================
    if (cleanQuery.length > 2) {
        try {
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&origin=*`);
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.query && searchData.query.search.length > 0) {
                    const topResult = searchData.query.search[0].title;
                    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult)}`);
                    if (summaryRes.ok) {
                        const summaryData = await summaryRes.json();
                        if (summaryData.type !== 'disambiguation' && summaryData.extract) {
                            return {
                                type: 'fact',
                                reply: `Wikipedia says this. You better take notes! 🌐📝<br><br><strong>${summaryData.title}:</strong> ${summaryData.extract} <br><br><a href="${summaryData.content_urls.desktop.page}" target="_blank" style="color:var(--highlight-text);font-size:0.85em;text-decoration:underline;">Read more</a>`
                            };
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Web search fallback failed", e);
        }
    }

    // ==========================================
    // 7. CONVERSATIONAL CATCH-ALL (If Stumped)
    // ==========================================
    if (qLower.includes('?')) {
        return {
            type: 'fact',
            reply: `Now you know good and well I don't have the answer to that. Ask me to find a PDF, solve some math, or define a concept. For everything else, the Lord gave us Google. 🤷🏾‍♀️☕<br><br>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" class="nav-shortcut-btn" style="flex:1; text-align:center; justify-content:center; text-decoration:none;">🔍 Google It, Honey</a>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" class="nav-shortcut-btn" style="flex:1; text-align:center; justify-content:center; text-decoration:none;">▶️ YouTube It</a>
            </div>`
        };
    } else {
        return {
            type: 'fact',
            reply: rand([
                "Mmhmm. I hear you. Does that relate to a specific topic you're studying right now, or are we just chatting? 🤨",
                "Interesting! Want me to search your library for anything related to that?",
                "Got it! Let me know if you want me to pull up any notes, solve math, or define a concept for you. 💅🏾"
            ])
        };
    }
}
