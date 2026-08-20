// ai.js - Smart Study Copilot Engine

async function processAIQuery(query, libraryData) {
    const qLower = query.toLowerCase().trim();

    // 1. Chit-chat & Basic greetings
    if (qLower.match(/^(hi|hello|hey|yo)/)) {
        return { type: 'fact', reply: "Hello! I'm your AI Study Copilot. Ask me to find study materials, solve simple math, or define scientific concepts!" };
    }
    if (qLower.match(/(who are you|what are you)/)) {
        return { type: 'fact', reply: "I am your local AI Study Copilot. I can navigate your files, calculate math, and look up concepts for you." };
    }

    // 2. Exact Math Evaluation
    const calcMatch = qLower.match(/(?:calculate|solve|what is) ([\d\+\-\*\/\(\)\.\s\^]+)$/);
    if (calcMatch && calcMatch[1].trim().length > 0) {
        try {
            let expression = calcMatch[1].replace(/\^/g, '**'); // Handle powers
            let result = new Function(`return ${expression}`)();
            if (!isNaN(result)) {
                return { type: 'fact', reply: `🔢 <strong>Result:</strong> ${result}` };
            }
        } catch (e) {
            // Ignore and let it fall through to Wikipedia search
        }
    }

    // 3. Navigation / File Search Intent
    const navMatch = qLower.match(/(?:find|search|where is|show me|open) (.+)/);
    if (navMatch) {
        const searchTerm = navMatch[1].trim();
        const words = searchTerm.split(' ').filter(w => w.length > 2);
        let matches = [];
        if (words.length > 0 && libraryData) {
            matches = libraryData.filter(book => {
                const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
                return words.every(w => meta.includes(w)) || words.some(w => meta.includes(w));
            });
        }
        if (matches.length > 0) {
            return { type: 'navigation', matches: matches.slice(0, 4) };
        }
    }

    // 4. Wikipedia API Fetch for Real Knowledge
    const defMatch = qLower.match(/(?:what is|define|who is|explain|what are) (.+)/);
    let searchTopic = defMatch ? defMatch[1].trim() : qLower;
    searchTopic = searchTopic.replace(/\?$/, '').trim(); // Remove question marks

    if (searchTopic.length > 2) {
        try {
            // Call the free public Wikipedia API
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

    // 5. Ultimate Fallback: Recommend files based on keywords
    let fallbackMatches = [];
    if (libraryData) {
        const fallbackWords = qLower.split(' ').filter(w => w.length > 2);
        fallbackMatches = libraryData.filter(book => {
            const meta = (book.title + " " + (book.folders ? book.folders.join(" ") : "")).toLowerCase();
            return fallbackWords.some(w => meta.includes(w));
        });
    }
    
    if (fallbackMatches.length > 0) {
        return {
            type: 'navigation',
            matches: fallbackMatches.slice(0, 4),
            prefix: `I couldn't find a direct definition, but I found these related files in your library:`
        };
    }

    return {
        type: 'fact',
        reply: `I'm not quite sure how to answer "<em>${query}</em>". Try asking me to <strong>"find [topic]"</strong>, <strong>"calculate [math]"</strong>, or <strong>"define [concept]"</strong>.`
    };
}
