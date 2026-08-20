// ai.js - Advanced Smart Study Copilot Engine

// Helper: Pick a random response from an array
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: NLP Stop-word removal (strips conversational fluff to extract core topics)
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

async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();
    const cleanQuery = removeStopwords(qLower);

    // ==========================================
    // 1. CONVERSATION, EMOTION & SMALL TALK
    // ==========================================
    if (qLower.match(/^(hi|hello|hey|yo|greetings|sup)/)) {
        return { type: 'fact', reply: rand([
            "Hello! 👋 I'm your AI Study Copilot. How can I help you today?",
            "Hey there! Ready to crush some study goals? 🚀 You can talk to me naturally—just ask for what you need!",
            "Hi! Need me to find a PDF, solve some math, or explain a concept to you?"
        ])};
    }
    if (qLower.match(/(who are you|what are you)/)) {
        return { type: 'fact', reply: "I am your AI Study Copilot. I can parse natural sentences to navigate your files, solve math equations, look up Wikipedia concepts, and keep you motivated. 🤖" };
    }
    if (qLower.match(/(how are you|how you doing)/)) {
        return { type: 'fact', reply: "I'm fully charged and ready to help you study! How are you holding up today? 🔋" };
    }
    if (qLower.match(/(thanks|thank you|thx|appreciate it)/)) {
        return { type: 'fact', reply: rand([
            "You're very welcome! Keep up the great work! 💪",
            "Anytime! I'm right here if you need anything else.",
            "Happy to help! Now let's get back to studying! 📚"
        ])};
    }
    if (qLower.match(/^(ok|okay|cool|nice|good|great|awesome|understood)$/)) {
        return { type: 'fact', reply: "Awesome. Let me know if you need anything else! 👍" };
    }

    // Emotion & Burnout Management
    if (qLower.match(/(tired|sleep|exhausted|burnout|can't focus)/)) {
        return { type: 'fact', reply: "It's absolutely okay to be tired. Take a quick 10-minute break, drink some water, and step away from the screen. If you're running on empty, get some sleep. Rest is when your brain actually locks in memories! 🛌" };
    }
    if (qLower.match(/(stress|anxious|scared|fail|hard|difficult|tough|giving up|quit)/)) {
        return { type: 'fact', reply: "Take a deep breath. 🧘‍♂️ You have put in the work. The friction you're feeling right now is your brain literally getting stronger. Trust your preparation, analyze your mistakes, and keep pushing forward!" };
    }
    if (qLower.match(/(lazy|distracted|procrastinating)/)) {
        return { type: 'fact', reply: "Stop overthinking it. Close your other tabs, put your phone out of reach, and just start for 5 straight minutes. Motivation follows action, it never comes before it! 🚀" };
    }

    // Advanced Study Frameworks
    if (qLower.match(/(memorize|forget|remember|memory|keep forgetting)/)) {
        return { type: 'fact', reply: "🧠 <strong>Memory Tip:</strong> Don't just re-read your notes! Use <strong>Active Recall</strong> (testing yourself without looking) and <strong>Spaced Repetition</strong> (reviewing material after 1 day, then 3 days, then a week). This forces your brain to build permanent neural pathways."};
    }
    if (qLower.match(/(don't understand|confused|explain better|stuck)/)) {
        return { type: 'fact', reply: "💡 <strong>The Feynman Technique:</strong> If a concept is confusing, try explaining it out loud right now as if you were teaching a 10-year-old. When you stumble, you've found your exact knowledge gap. Go back to your material *just* to fix that gap!"};
    }

    // Time & Date
    if (qLower.match(/(what time is it|time please|current time)/)) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return { type: 'fact', reply: `It's currently <strong>${time}</strong>. Let's make this next hour count! ⏳` };
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
    // Catches phrases like: "I need to practice physics", "Do you have lectures on math?", "Pull up mock tests"
    const navMatch = qLower.match(/(?:find|search|where|show|open|look for|looking for|pull up|i need|do you have|got anything on|notes on|lectures on|material on|practice) (.+)/i);
    
    if (navMatch) {
        const searchWords = removeStopwords(navMatch[1]).split(' ').filter(w => w.length > 2);
        
        if (searchWords.length > 0 && libraryData) {
            // Intelligent Relevance Scoring
            let scoredBooks = libraryData.map(book => {
                const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
                let score = 0;
                searchWords.forEach(w => { if (meta.includes(w)) score += 10; });
                return { book, score };
            }).filter(item => item.score > 0);

            if (scoredBooks.length > 0) {
                scoredBooks.sort((a, b) => b.score - a.score); // Highest scores first
                return { type: 'navigation', matches: scoredBooks.map(item => item.book).slice(0, 5) };
            }
        }
    }

    // ==========================================
    // 4. WIKIPEDIA API: PHRASE-BASED DEFINITIONS
    // ==========================================
    // Catches: "Tell me about thermodynamics", "What's the theory behind relativity", "Explain gravity"
    const defMatch = qLower.match(/(?:what is|define|who is|explain|what are|meaning of|tell me about|theory behind|how does|concept of) (.+)/i);
    
    if (defMatch) {
        let searchTopic = defMatch[1].replace(/\?$/, '').trim();
        searchTopic = removeStopwords(searchTopic); // "the mitochondria" -> "mitochondria"
        
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
                console.error("Wiki fetch failed", e);
            }
        }
    }

    // ==========================================
    // 5. ULTIMATE FALLBACK: SMART SENTENCE SCORING
    // ==========================================
    // If the user just types a raw sentence like "I really want to study some organic chemistry right now"
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
                prefix: `I analyzed what you said and found these highly relevant files for you:`
            };
        }
    }

    // If absolutely no keywords match anything in the library or knowledge base
    return {
        type: 'fact',
        reply: rand([
            `I'm not quite sure how to help with that specific phrase! Try asking me something like <strong>"Pull up physics mock tests"</strong> or <strong>"Explain Newton's laws"</strong>.`,
            `Hmm, I couldn't find any direct matches in your library or my knowledge base for that. Could you try rephrasing your question? 🤖`
        ])
    };
}
