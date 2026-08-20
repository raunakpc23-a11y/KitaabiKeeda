// ai.js - Conversational Study Copilot Engine

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
// MASSIVE CONVERSATIONAL DICTIONARY
// ==========================================
const conversationIntents = [
    {
        patterns: [/\b(hi|hello|hey|yo|sup|greetings)\b/i],
        replies: [
            "Hey there! 👋 How's your day going?",
            "Hello! Ready to get some studying done? 🚀",
            "Hi! I'm here and ready to help. What's on your mind?"
        ]
    },
    {
        patterns: [/\b(how are you|how you doing|whats up|what's up)\b/i],
        replies: [
            "I'm just lines of code, but I'm feeling great! How are you holding up? 🔋",
            "Doing well and ready to assist! What are we focusing on today?",
            "I'm good! Just hanging out in your browser. Ready to tackle some subjects?"
        ]
    },
    {
        patterns: [/\b(good|great|awesome|fine|okay|ok|doing well|not bad)\b/i],
        replies: [
            "Glad to hear that! Want to dive into some study material?",
            "Awesome! A positive mindset is half the battle. What should we study?",
            "Love that energy! Let me know if you need me to pull up any notes or mock tests."
        ]
    },
    {
        patterns: [/\b(bad|sad|depressed|tired|exhausted|stressed|anxious|scared|fail|failing|giving up|quit)\b/i],
        replies: [
            "I hear you. 💙 Studying can be incredibly overwhelming. It's completely okay to step back and take a breather. Your mental health comes first.",
            "Take a deep breath. 🧘‍♂️ Don't look at the whole mountain right now, just focus on the next step. You've got this.",
            "It's tough, but you are tougher. Try taking a 10-minute walk, grab some water, and come back. I'll be right here waiting! 💪"
        ]
    },
    {
        patterns: [/\b(lazy|distracted|procrastinating|cant focus|can't focus)\b/i],
        replies: [
            "It happens to the best of us! Try this: close your other tabs, put your phone out of reach, and just start for 5 straight minutes. Motivation follows action! 🚀",
            "Want to try the Pomodoro timer in the sidebar? Working in small 25-minute bursts makes it so much easier to start."
        ]
    },
    {
        patterns: [/\b(thanks|thank you|thx|appreciate it)\b/i],
        replies: [
            "You're very welcome! Keep up the amazing work.",
            "Anytime! I'm always right here if you need more help.",
            "Happy to help! Now let's crush the rest of your study session. 📚"
        ]
    },
    {
        patterns: [/\b(joke|funny|laugh)\b/i],
        replies: [
            "Why was the math book sad? Because it had too many problems! 😂",
            "Are you made of Copper and Tellurium? Because you are Cu Te! 🧪",
            "I'd tell you a chemistry joke, but I know I wouldn't get a reaction. 🤓"
        ]
    },
    {
        patterns: [/\b(who are you|what are you|your name)\b/i],
        replies: [
            "I'm your AI Study Copilot! I live right here in your app to help you find notes, solve math, and keep you on track.",
            "Think of me as your personal study assistant. I navigate your files, grab facts from the web, and chat with you when you need a break!"
        ]
    },
    {
        patterns: [/\b(bye|goodbye|see ya|cya|later|going to sleep)\b/i],
        replies: [
            "Goodbye! Rest up and come back stronger! 👋",
            "See ya! Remember to take care of yourself.",
            "Catch you later! Awesome job today. 🌟"
        ]
    },
    {
        patterns: [/\b(memorize|forget|remember|memory|keep forgetting)\b/i],
        replies: [
            "🧠 <strong>Memory Tip:</strong> Don't just re-read your notes! Use <strong>Active Recall</strong> (testing yourself without looking) and <strong>Spaced Repetition</strong>. It forces your brain to build permanent neural pathways."
        ]
    },
    {
        patterns: [/\b(don't understand|confused|explain better|stuck)\b/i],
        replies: [
            "💡 <strong>The Feynman Technique:</strong> If a concept is confusing, try explaining it out loud right now as if you were teaching a 10-year-old. When you stumble, you've found your exact knowledge gap!"
        ]
    }
];

async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();
    const cleanQuery = removeStopwords(qLower);

    // ==========================================
    // 1. SMALL TALK & CONVERSATION CHECK
    // ==========================================
    // If the query is short (under 10 words), check our conversation dictionary first
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
        return { type: 'fact', reply: `It's currently <strong>${time}</strong>. Let's make this next hour count! ⏳` };
    }
    if (qLower.match(/(what day is it|current date|what is today)/)) {
        const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return { type: 'fact', reply: `Today is <strong>${date}</strong>. 📅` };
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
                    return { type: 'fact', reply: `🔢 <strong>Calculation:</strong> ${calcMatch[1]} <br>✅ <strong>Result:</strong> ${result}` };
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
                            reply: `🧠 <strong>${wikiData.title}:</strong> ${wikiData.extract} <br><br><a href="${wikiData.content_urls.desktop.page}" target="_blank" style="color:var(--highlight-text);font-size:0.85em;text-decoration:underline;">Read more on Wikipedia</a>` 
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
                prefix: `I was listening to what you said and found these relevant files in your library:`
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
                                reply: `🌐 <strong>Web Search Result:</strong><br><br><strong>${summaryData.title}:</strong> ${summaryData.extract} <br><br><a href="${summaryData.content_urls.desktop.page}" target="_blank" style="color:var(--highlight-text);font-size:0.85em;text-decoration:underline;">Read more</a>`
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
    // 7. CONVERSATIONAL CATCH-ALL (If the AI is stumped)
    // ==========================================
    // Check if it's a question
    if (qLower.includes('?')) {
        return {
            type: 'fact',
            reply: `That's a great question, but I couldn't find a direct answer in your library or the web.<br><br>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" class="nav-shortcut-btn" style="flex:1; text-align:center; justify-content:center; text-decoration:none;">🔍 Google It</a>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" class="nav-shortcut-btn" style="flex:1; text-align:center; justify-content:center; text-decoration:none;">▶️ YouTube It</a>
            </div>`
        };
    } else {
        // If it's just a statement
        return {
            type: 'fact',
            reply: rand([
                "I hear you! Does that relate to a specific topic you're studying right now? 🤖",
                "Interesting! Want me to search your library for anything related to that?",
                "Got it! Let me know if you want me to pull up any notes, solve math, or define a concept for you."
            ])
        };
    }
}
