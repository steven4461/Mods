/**
 * AI Alchemy & Element Genesis - Universal Free + BYOK LLM Router
 * File: ai-core.js
 */

(function () {
    "use strict";

    window.AIAlchemy = window.AIAlchemy || {};
    window.AIAlchemy.modules = window.AIAlchemy.modules || {};
    window.AIAlchemy.modules["ai-core"] = true;

    const PROVIDERS = {
        AUTO_FREE: "auto_free",
        OLLAMA: "ollama",
        POLLINATIONS: "pollinations",
        OPENAI_COMPAT: "openai_compat",
        GEMINI: "gemini",
        ANTHROPIC: "anthropic"
    };

    const PRESETS = {
        auto_free: {
            label: "Zero-Config Free (Auto Ollama -> Pollinations)",
            baseUrl: "",
            model: "auto"
        },
        ollama: {
            label: "Local Ollama (Free)",
            baseUrl: "http://localhost:11434/api/chat",
            model: "llama3.2"
        },
        pollinations: {
            label: "Pollinations.ai (Keyless Cloud Free)",
            baseUrl: "https://text.pollinations.ai/",
            model: "openai"
        },
        openai: {
            label: "OpenAI (BYOK)",
            baseUrl: "https://openai.com",
            model: "gpt-4o-mini"
        },
        groq: {
            label: "Groq Fast Inference (BYOK)",
            baseUrl: "https://groq.com",
            model: "llama-3.3-70b-versatile"
        },
        openrouter: {
            label: "OpenRouter (BYOK)",
            baseUrl: "https://openrouter.ai",
            model: "google/gemini-2.0-flash-001"
        },
        deepseek: {
            label: "DeepSeek (BYOK)",
            baseUrl: "https://deepseek.com",
            model: "deepseek-chat"
        },
        mistral: {
            label: "Mistral AI (BYOK)",
            baseUrl: "https://mistral.ai",
            model: "mistral-small-latest"
        },
        together: {
            label: "Together AI (BYOK)",
            baseUrl: "https://together.xyz",
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo"
        },
        lmstudio: {
            label: "LM Studio Local (Free)",
            baseUrl: "http://localhost:1234/v1/chat/completions",
            model: "local-model"
        },
        gemini: {
            label: "Google Gemini Native (BYOK)",
            baseUrl: "https://googleapis.com",
            model: "gemini-2.0-flash"
        },
        anthropic: {
            label: "Anthropic Claude Native (BYOK)",
            baseUrl: "https://anthropic.com",
            model: "claude-3-5-haiku-latest"
        }
    };

    const Core = {
        PROVIDERS,
        PRESETS,

        settings: {
            provider: PROVIDERS.AUTO_FREE,
            baseUrl: "",
            model: "",
            apiKey: "",
            temperature: 0.4,
            enableCache: true
        },

        ollamaStatus: {
            checked: false,
            available: false,
            detectedModel: "llama3.2"
        },

        cache: {},
        MAX_CACHE_ENTRIES: 250,

        async init() {
            this.loadSettings();
            this.loadCache();
            // Probe local Ollama silently in background on startup
            await this.detectOllama();
        },

        loadSettings() {
            try {
                const raw = localStorage.getItem(window.AIAlchemy.STORAGE_KEYS.SETTINGS);
                if (raw) {
                    this.settings = Object.assign({}, this.settings, JSON.parse(raw));
                }
            } catch (e) {
                console.warn("[AIAlchemy:Core] Could not parse saved settings:", e);
            }
        },

        saveSettings(newSettings) {
            this.settings = Object.assign({}, this.settings, newSettings);
            try {
                localStorage.setItem(window.AIAlchemy.STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            } catch (e) {
                console.error("[AIAlchemy:Core] Failed to save settings:", e);
            }
            window.AIAlchemy.emit("settingsUpdated", this.settings);
        },

        loadCache() {
            try {
                const raw = localStorage.getItem(window.AIAlchemy.STORAGE_KEYS.CACHE);
                if (raw) this.cache = JSON.parse(raw);
            } catch (e) {
                this.cache = {};
            }
        },

        saveCache() {
            try {
                const keys = Object.keys(this.cache);
                if (keys.length > this.MAX_CACHE_ENTRIES) {
                    // Evict oldest 50 entries
                    keys.slice(0, 50).forEach(k => delete this.cache[k]);
                }
                localStorage.setItem(window.AIAlchemy.STORAGE_KEYS.CACHE, JSON.stringify(this.cache));
            } catch (e) {
                console.warn("[AIAlchemy:Core] Cache write failed (quota exceeded):", e);
            }
        },

        clearCache() {
            this.cache = {};
            localStorage.removeItem(window.AIAlchemy.STORAGE_KEYS.CACHE);
        },

        /**
         * Deterministic FNV-1a hash for prompt caching
         */
        hashPrompt(systemPrompt, userPrompt) {
            const str = `${systemPrompt}::${userPrompt}`;
            let hash = 2166136261;
            for (let i = 0; i < str.length; i++) {
                hash ^= str.charCodeAt(i);
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
            return "h_" + (hash >>> 0).toString(16);
        },

        /**
         * Auto-detect local Ollama instance and pick an installed model
         */
        async detectOllama(timeoutMs = 1500) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch("http://localhost:11434/api/tags", {
                    method: "GET",
                    signal: controller.signal
                });
                clearTimeout(timer);
                if (!res.ok) throw new Error("Ollama tags endpoint non-200");

                const data = await res.json();
                const models = Array.isArray(data.models) ? data.models : [];
                if (models.length > 0) {
                    // Prefer fast general models if installed, otherwise pick first available
                    const preferred = models.find(m => /llama3|qwen|mistral|gemma|phi/i.test(m.name));
                    this.ollamaStatus = {
                        checked: true,
                        available: true,
                        detectedModel: preferred ? preferred.name : models[0].name
                    };
                    console.log(`[AIAlchemy:Core] Local Ollama detected! Using model: ${this.ollamaStatus.detectedModel}`);
                    return this.ollamaStatus;
                }
            } catch (_) {
                clearTimeout(timer);
            }
            this.ollamaStatus = { checked: true, available: false, detectedModel: "llama3.2" };
            return this.ollamaStatus;
        },

        /**
         * Primary Entry: Generate structured JSON from any configured LLM with caching & fallback
         */
        async generateJSON({ systemPrompt, userPrompt, bypassCache = false, retries = 2 }) {
            const cacheKey = this.hashPrompt(systemPrompt, userPrompt);

            if (this.settings.enableCache && !bypassCache && this.cache[cacheKey]) {
                return {
                    data: this.cache[cacheKey],
                    source: "cache"
                };
            }

            let lastError = null;
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const effectivePrompt = attempt === 0
                        ? userPrompt
                        : `${userPrompt}\n\nCRITICAL: Your previous output was invalid JSON. Return ONLY raw, valid JSON matching the schema with no markdown fences or commentary.`;

                    const { rawText, providerUsed } = await this.routeRequest(systemPrompt, effectivePrompt);
                    const parsed = this.sanitizeAndParseJSON(rawText);

                    if (this.settings.enableCache) {
                        this.cache[cacheKey] = parsed;
                        this.saveCache();
                    }

                    return {
                        data: parsed,
                        source: providerUsed
                    };
                } catch (err) {
                    lastError = err;
                    console.warn(`[AIAlchemy:Core] Attempt ${attempt + 1} failed:`, err.message);
                }
            }

            throw new Error(`LLM generation failed after ${retries + 1} attempts: ${lastError ? lastError.message : "Unknown error"}`);
        },

        /**
         * Route request according to active provider or zero-config fallback chain
         */
        async routeRequest(systemPrompt, userPrompt) {
            const provider = this.settings.provider;

            if (provider === PROVIDERS.AUTO_FREE) {
                if (!this.ollamaStatus.checked) {
                    await this.detectOllama();
                }
                if (this.ollamaStatus.available) {
                    try {
                        const rawText = await this.callOllama(systemPrompt, userPrompt, this.ollamaStatus.detectedModel);
                        return { rawText, providerUsed: `ollama:${this.ollamaStatus.detectedModel}` };
                    } catch (ollamaErr) {
                        console.warn("[AIAlchemy:Core] Ollama failed mid-session, falling back to Pollinations:", ollamaErr.message);
                        this.ollamaStatus.available = false;
                    }
                }
const rawText = await this.callPollinations(systemPrompt, userPrompt);
return { rawText, providerUsed: "pollinations:free" };
}
if (provider === PROVIDERS.OLLAMA) {
const model = this.settings.model || this.ollamaStatus.detectedModel || "llama3.2";
const rawText = await this.callOllama(systemPrompt, userPrompt, model, this.settings.baseUrl);
return { rawText, providerUsed: ollama:${model} };
}
if (provider === PROVIDERS.POLLINATIONS) {
const rawText = await this.callPollinations(systemPrompt, userPrompt, this.settings.model);
return { rawText, providerUsed: "pollinations:free" };
}
if (provider === PROVIDERS.OPENAI_COMPAT) {
const rawText = await this.callOpenAICompat(systemPrompt, userPrompt);
return { rawText, providerUsed: openai_compat:${this.settings.model} };
}
if (provider === PROVIDERS.GEMINI) {
const rawText = await this.callGemini(systemPrompt, userPrompt);
return { rawText, providerUsed: gemini:${this.settings.model} };
}
if (provider === PROVIDERS.ANTHROPIC) {
const rawText = await this.callAnthropic(systemPrompt, userPrompt);
return { rawText, providerUsed: anthropic:${this.settings.model} };
}
throw new Error(Unsupported LLM provider: ${provider});
},
/**
* Adapter 1: Local Ollama (/api/chat with format: "json")
*/
async callOllama(systemPrompt, userPrompt, model = "llama3.2", customUrl = "") {
const url = customUrl || "http://localhost:11434/api/chat";
const res = await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
model,
format: "json",
stream: false,
options: { temperature: Number(this.settings.temperature) || 0.4 },
messages: [
{ role: "system", content: systemPrompt },
{ role: "user", content: userPrompt }
]
})
});
if (!res.ok) throw new Error(Ollama HTTP ${res.status});
const data = await res.json();
if (!data.message || !data.message.content) throw new Error("Empty response from Ollama");
return data.message.content;
},
/**
* Adapter 2: Pollinations.ai Free Keyless API
*/
async callPollinations(systemPrompt, userPrompt, model = "openai") {
const url = this.settings.baseUrl && this.settings.provider === PROVIDERS.POLLINATIONS
? this.settings.baseUrl
: "https://text.pollinations.ai/";
const res = await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
model: model || "openai",
jsonMode: true,
seed: Math.floor(Math.random() * 100000),
messages: [
{ role: "system", content: systemPrompt },
{ role: "user", content: userPrompt }
]
})
});
if (!res.ok) throw new Error(Pollinations HTTP ${res.status});
return await res.text();
},
/**
* Adapter 3: Universal OpenAI-Compatible (OpenAI, Groq, OpenRouter, Mistral, DeepSeek, Together, LM Studio)
*/
async callOpenAICompat(systemPrompt, userPrompt) {
const url = this.settings.baseUrl || "openai.com";
const model = this.settings.model || "gpt-4o-mini";
const headers = { "Content-Type": "application/json" };
if (this.settings.apiKey) {
headers["Authorization"] = Bearer ${this.settings.apiKey.trim()};
}
if (url.includes("openrouter.ai")) {
headers["HTTP-Referer"] = window.location.origin || "r74n.com";
headers["X-Title"] = "Sandboxels AI Alchemy";
}
const body = {
model,
temperature: Number(this.settings.temperature) || 0.4,
messages: [
{ role: "system", content: systemPrompt },
{ role: "user", content: userPrompt }
]
};
// Add json_object response_format for providers that support it reliably
if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
body.response_format = { type: "json_object" };
}
const res = await fetch(url, {
method: "POST",
headers,
body: JSON.stringify(body)
});
if (!res.ok) {
const errText = await res.text().catch(() => "");
throw new Error(OpenAI-Compat HTTP ${res.status}: ${errText.slice(0, 160)});
}
const data = await res.json();
const content = data?.choices?.[0]?.message?.content;
if (!content) throw new Error("Empty choice content from OpenAI-compatible API");
return content;
},
/**
* Adapter 4: Google Gemini Native API with responseMimeType: "application/json"
*/
async callGemini(systemPrompt, userPrompt) {
const apiKey = (this.settings.apiKey || "").trim();
if (!apiKey) throw new Error("Google Gemini requires an API key.");
const model = this.settings.model || "gemini-2.0-flash";
const base = this.settings.baseUrl || "googleapis.com";
const endpoint = ${base.replace(/\/$/, "")}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)};
const res = await fetch(endpoint, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
systemInstruction: {
parts: [{ text: systemPrompt }]
},
contents: [
{
role: "user",
parts: [{ text: userPrompt }]
}
],
generationConfig: {
temperature: Number(this.settings.temperature) || 0.4,
responseMimeType: "application/json"
}
})
});
if (!res.ok) {
const errText = await res.text().catch(() => "");
throw new Error(Gemini HTTP ${res.status}: ${errText.slice(0, 160)});
}
const data = await res.json();
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) throw new Error("Empty candidate text from Gemini API");
return text;
},
/**
* Adapter 5: Anthropic Claude Native Messages API
*/
async callAnthropic(systemPrompt, userPrompt) {
const apiKey = (this.settings.apiKey || "").trim();
if (!apiKey) throw new Error("Anthropic Claude requires an API key.");
const url = this.settings.baseUrl || "anthropic.com";
const model = this.settings.model || "claude-3-5-haiku-latest";
const res = await fetch(url, {
method: "POST",
headers: {
"Content-Type": "application/json",
"x-api-key": apiKey,
"anthropic-version": "2023-06-01",
"anthropic-dangerous-direct-browser-access": "true"
},
body: JSON.stringify({
model,
max_tokens: 1500,
temperature: Number(this.settings.temperature) || 0.4,
system: systemPrompt,
messages: [
{ role: "user", content: userPrompt }
]
})
});
if (!res.ok) {
const errText = await res.text().catch(() => "");
throw new Error(Anthropic HTTP ${res.status}: ${errText.slice(0, 160)});
}
const data = await res.json();
const text = data?.content?.[0]?.text;
if (!text) throw new Error("Empty content block from Anthropic API");
return text;
},
/**
* Multi-pass JSON Sanitizer & Extractor
* Strips markdown code fences, prose wrappers, and trailing commas before parsing.
*/
sanitizeAndParseJSON(rawText) {
if (typeof rawText === "object" && rawText !== null) return rawText;
if (typeof rawText !== "string") throw new Error("LLM returned non-string payload");
let cleaned = rawText.trim();
// 1. Strip json ...  or ... wrappers
const fenceMatch = cleaned.match(/(?:json)?\s*([\s\S]*?)/i);
if (fenceMatch && fenceMatch[1]) {
cleaned = fenceMatch[1].trim();
}
// 2. Extract outermost JSON object {...} or array [...]
const firstBrace = cleaned.indexOf("{");
const firstBracket = cleaned.indexOf("[");
let startIdx = -1;
let endIdx = -1;
if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
startIdx = firstBrace;
endIdx = cleaned.lastIndexOf("}");
} else if (firstBracket !== -1) {
startIdx = firstBracket;
endIdx = cleaned.lastIndexOf("]");
}
if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
cleaned = cleaned.slice(startIdx, endIdx + 1);
}
// 3. Remove trailing commas before } or ]
cleaned = cleaned.replace(/,\s*([}]])/g, "$1");
try {
return JSON.parse(cleaned);
} catch (err) {
throw new Error(JSON Parse Error: ${err.message} | Raw snippet: ${cleaned.slice(0, 120)});
}
},
/**
* Diagnostic Connection Tester for the Settings Tab
*/
async testConnection() {
const start = performance.now();
const res = await this.generateJSON({
systemPrompt: "You are a connectivity diagnostic assistant. Respond strictly in JSON.",
userPrompt: 'Return {"status":"ok","message":"AI Alchemy connected"}',
bypassCache: true,
retries: 0
});
const latencyMs = Math.round(performance.now() - start);
return {
ok: true,
latencyMs,
provider: res.source,
response: res.data
};
}
};
window.AIAlchemy.Core = Core;
})();
