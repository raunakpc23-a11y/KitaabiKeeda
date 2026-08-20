// ai.js - Advanced Smart Study Copilot Engine

// Helper: Pick a random response from an array to make the AI feel dynamic/human
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: NLP Stop-word removal (strips out filler words to extract the actual core subjects)
const removeStopwords = (str) => {
    const stopwords = ['what', 'is', 'the', 'a', 'an', 'how', 'to', 'do', 'can', 'you', 'tell', 'me', 'about', 'find', 'search', 'show', 'where', 'are', 'please', 'for', 'of', 'in', 'on', 'my', 'meaning'];
    return str.split(' ').filter(w => !stopwords.includes(w)).join(' ');
};

async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();
    const cleanQuery = removeStopwords(qLower);

    // ==========================================
    // 1. CONVERSATION, EMOTION & SMALL TALK
    // ==========================================
    
    if (qLower.match(/^(hi|hello|hey|yo|greetings)/)) {
        return { type: 'fact', reply: rand([
            "Hello! 👋 I'm your AI Study Copilot. How can I help you today?",
            "Hey there! Ready to crush some study goals? 🚀 What are we looking for?",
            "Hi! Need me to find a PDF, solve some math, or define a concept?"
        ])};
    }
    if (qLower.match(/(who are you|what are you)/)) {
        return { type: 'fact', reply: "I am your local AI Study Copilot. I can navigate your files, calculate math, look up concepts from Wikipedia, and keep you motivated. 🤖" };
    }
    if (qLower.match(/(how are you|how you doing)/)) {
        return { type: 'fact', reply: "I'm fully charged and ready to help you study! How are you holding up? 🔋" };
    }
    if (qLower.match(/(thanks|thank you|thx|appreciate it)/)) {
        return { type: 'fact', reply: rand([
            "You're very welcome! Keep up the great work! 💪",
            "Anytime! I'm right here if you need anything else.",
            "Happy to help! Now get back to studying! 📚"
        ])};
    }
    if (qLower.match(/^(ok|okay|cool|nice|good|great|awesome)$/)) {
        return { type: 'fact', reply: "Awesome. Let me know if you need anything else! 👍" };
    }

    // Emotion & Burnout Management
    if (qLower.match(/(tired|sleep|exhausted|burnout)/)) {
        return { type: 'fact', reply: "It's absolutely okay to be tired. Take a quick 10-minute break, drink some water, and evaluate. If you're running on empty, get some sleep. Rest is when your brain actually builds memories! 🛌" };
    }
    if (qLower.match(/(stress|anxious|scared|fail|hard|difficult|tough)/)) {
        return { type: 'fact', reply: "Take a deep breath. 🧘‍♂️ You have put in the work. The friction you're feeling right now is your brain literally getting stronger. Trust your preparation, analyze your mistakes, and keep pushing forward!" };
    }
    if (qLower.match(/(lazy|distract|focus|procrastinat)/)) {
        return { type: 'fact', reply: "Stop overthinking it. Close your other tabs, put your phone away, and just start for 5 straight minutes. Motivation follows action, it never comes before it! 🚀" };
    }

    // ==========================================
    // 2. ADVANCED STUDY FRAMEWORKS (New Feature)
    // ==========================================
    if (qLower.match(/(memorize|forget|remember|memory|keep forgetting)/)) {
        return { type: 'fact', reply: "🧠 <strong>Memory Tip:</strong> Don't just re-read your notes! Use <strong>Active Recall</strong> (testing yourself without looking at the book) and <strong>Spaced Repetition</strong> (reviewing material at increasing intervals: 1 day, 3 days, 1 week). That is the scientifically proven way to hack your brain to never forget."};
    }
    if (qLower.match(/(don't understand|confused|hard concept|explain better|stuck)/)) {
        return { type: 'fact', reply: "💡 <strong>The Feynman Technique:</strong> If a concept is confusing, try explaining it out loud as if you were teaching a 10-year-old. When you stumble or use complex jargon to hide what you don't know, you've found your exact knowledge gap. Go back to your book *just* for that specific gap!"};
    }

    // ==========================================
    // 3. EXACT MATH EVALUATION (Secured)
    // ==========================================
    const calcMatch = qLower.match(/(?:calculate|solve|what is) ([\d\+\-\*\/\(\)\.\s\^]+)$/);
    if (calcMatch && calcMatch[1].trim().length > 0) {
        try {
            let expression = calcMatch[1].replace(/\^/g, '**'); // Convert power symbols
            // Strict regex check to prevent harmful code execution
            if (/^[0-9\+\-\*\/\(\)\.\s\*]+$/.test(expression)) {
                let result = new Function(`return ${expression}`)();
                if (!isNaN(result)) {
                    return { type: 'fact', reply: `🔢 <strong>Calculation:</strong> ${calcMatch[1]} <br>✅ <strong>Result:</strong> ${result}` };
                }
            }
        } catch (e) { /* Ignore invalid math and fall through */ }
    }

    // ==========================================
    // 4. NAVIGATION / FILE SEARCH INTENT
    // ==========================================
    const navMatch = qLower.match(/(?:find|search|where is|show me|open|look for) (.+)/);
    if (navMatch) {
        // Strip filler words to extract the actual noun/topic
        const searchWords = removeStopwords(navMatch[1]).split(' ').filter(w => w.length > 2);
        let matches = [];
        
        if (searchWords.length > 0 && libraryData) {
            matches = libraryData.filter(book => {
                const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
                // Match ANY of the strong keywords
                return searchWords.every(w => meta.includes(w)) || searchWords.some(w => meta.includes(w));
            });
        }
        
        if (matches.length > 0) {
            return { type: 'navigation', matches: matches.slice(0, 5) }; // Return top 5 matches
        } else {
            return { type: 'fact', reply: `I searched your entire library for "<em>${navMatch[1]}</em>" but couldn't find any direct matches. Try checking your spelling or using a broader term like 'Physics' or 'Mock'.` };
        }
    }

    // ==========================================
    // 5. WIKIPEDIA API FETCH FOR DEFINITIONS
    // ==========================================
    const defMatch = qLower.match(/(?:what is|define|who is|explain|what are|meaning of) (.+)/);
    if (defMatch) {
        let searchTopic = defMatch[1].replace(/\?$/, '').trim();
        searchTopic = removeStopwords(searchTopic); // "what is the mitochondria" -> "mitochondria"
        
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
    // 6. SHORT QUERY GUARDRAIL
    // ==========================================
    if (qLower.split(' ').length <= 2 && !defMatch && !navMatch) {
         return { type: 'fact', reply: `Are you looking for something specific about "<strong>${query}</strong>"? Try asking me to <em>"Find ${query}"</em> or <em>"Define ${query}"</em>.` };
    }

    // ==========================================
    // 7. ULTIMATE FALLBACK: Broad Keyword Search
    // ==========================================
    let fallbackMatches = [];
    if (libraryData && cleanQuery.length > 2) {
        const fallbackWords = cleanQuery.split(' ').filter(w => w.length > 2);
        fallbackMatches = libraryData.filter(book => {
            const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
            return fallbackWords.some(w => meta.includes(w));
        });
    }
    
    if (fallbackMatches.length > 0) {
        return {
            type: 'navigation',
            matches: fallbackMatches.slice(0, 4),
            prefix: `I couldn't find a direct answer, but I found these highly relevant files in your library:`
        };
    }

    // If absolutely nothing matches
    return {
        type: 'fact',
        reply: rand([
            `I'm not exactly sure how to help with "<em>${query}</em>". Try asking me to <strong>"find [topic]"</strong>, <strong>"calculate [math]"</strong>, or <strong>"define [concept]"</strong>.`,
            `Hmm, that one stumped me! 🤖 I'm best at navigating your files, answering math equations, and defining scientific concepts. What else can I help with?`
        ])
    };
}
