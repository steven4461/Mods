/**
 * AI Alchemy & Element Genesis - Main Entry & Lifecycle Orchestrator
 * File: alchemy-main.js
 * Load this file in Sandboxels Mod Manager. It will automatically bootstrap all sub-modules.
 */

(function () {
    "use strict";

    // Prevent double-initialization
    if (window.AIAlchemy && window.AIAlchemy._initialized) {
        console.warn("[AIAlchemy] Mod is already initialized.");
        return;
    }

    // Determine base path for loading sibling module files
    const currentScript = document.currentScript || (function () {
        const scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
    })();
    const BASE_URL = currentScript && currentScript.src
        ? currentScript.src.substring(0, currentScript.src.lastIndexOf("/") + 1)
        : "./";

    // Global Namespace Initialization
    window.AIAlchemy = Object.assign(window.AIAlchemy || {}, {
        version: "1.0.0",
        baseUrl: BASE_URL,
        _initialized: true,
        modules: {},
        state: {
            customElements: {},   // Persisted AI-generated element definitions
            discoveredRecipes: [], // Array of { elem1, elem2, result, type, timestamp }
            worldRules: [],        // Active conditional physics rules
            autoDiscovery: false,  // Background collision synthesis toggle
            isBusy: false          // Global lock for rate-limiting background LLM calls
        },

        STORAGE_KEYS: {
            ELEMENTS: "aialchemy_elements_v1",
            RECIPES: "aialchemy_recipes_v1",
            SETTINGS: "aialchemy_llm_settings_v1",
            CACHE: "aialchemy_prompt_cache_v1"
        },

        /**
         * Event bus for decoupled communication between Engine and HUD
         */
        _listeners: {},
        on(event, callback) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(callback);
        },
        emit(event, payload) {
            if (!this._listeners[event]) return;
            this._listeners[event].forEach(cb => {
                try { cb(payload); } catch (e) { console.error(`[AIAlchemy] Event error (${event}):`, e); }
            });
        },

        /**
         * Persistent State Management
         */
        saveState() {
            try {
                localStorage.setItem(this.STORAGE_KEYS.ELEMENTS, JSON.stringify(this.state.customElements));
                localStorage.setItem(this.STORAGE_KEYS.RECIPES, JSON.stringify(this.state.discoveredRecipes));
            } catch (e) {
                console.error("[AIAlchemy] Failed to save state to localStorage:", e);
            }
        },

        loadState() {
            try {
                const rawElements = localStorage.getItem(this.STORAGE_KEYS.ELEMENTS);
                const rawRecipes = localStorage.getItem(this.STORAGE_KEYS.RECIPES);
                if (rawElements) this.state.customElements = JSON.parse(rawElements);
                if (rawRecipes) this.state.discoveredRecipes = JSON.parse(rawRecipes);
            } catch (e) {
                console.error("[AIAlchemy] Failed to load state from localStorage:", e);
            }
        },

        /**
         * Dynamic sequential module loader
         */
        async loadModules(fileList) {
            for (const file of fileList) {
                // Skip if module already attached (e.g., if user loaded files manually in Mod Manager)
                const moduleKey = file.replace(".js", "");
                if (this.modules[moduleKey]) continue;

                await new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = this.baseUrl + file;
                    script.async = false;
                    script.onload = () => {
                        console.log(`[AIAlchemy] Loaded module: ${file}`);
                        resolve();
                    };
                    script.onerror = (err) => {
                        console.warn(`[AIAlchemy] Could not auto-load ${file} from ${this.baseUrl}. Ensure it is loaded in Mod Manager if hosted separately.`, err);
                        resolve(); // Resolve anyway so standalone/manual loading doesn't deadlock
                    };
                    document.head.appendChild(script);
                });
            }
        },

        /**
         * Bootstrap sequence executed once Sandboxels core & modules are ready
         */
        async boot() {
            console.log(`[AIAlchemy] Booting v${this.version}...`);
            this.loadState();

            // Load core sub-modules in dependency order
            await this.loadModules([
                "ai-core.js",
                "element-forge.js",
                "collision-engine.js",
                "world-director.js",
                "forge-ui.js"
            ]);

            // Initialize subsystems if present
            if (this.Core && typeof this.Core.init === "function") {
                await this.Core.init();
            }

            if (this.Forge && typeof this.Forge.init === "function") {
                this.Forge.init();
                // Re-hydrate previously saved custom elements into Sandboxels
                const savedIds = Object.keys(this.state.customElements);
                if (savedIds.length > 0) {
                    console.log(`[AIAlchemy] Restoring ${savedIds.length} saved elements...`);
                    savedIds.forEach(id => {
                        try {
                            this.Forge.compileAndRegister(this.state.customElements[id], { silent: true });
                        } catch (err) {
                            console.warn(`[AIAlchemy] Failed to restore element '${id}':`, err);
                        }
                    });
                }
            }

            if (this.Collision && typeof this.Collision.init === "function") {
                this.Collision.init();
            }

            if (this.Director && typeof this.Director.init === "function") {
                this.Director.init();
            }

            if (this.UI && typeof this.UI.init === "function") {
                this.UI.init();
            }

            // Register Sandboxels global tick hook for World Director rules & background collision scans
            if (typeof runAfterTick === "function") {
                runAfterTick(() => {
                    if (this.Director && typeof this.Director.onTick === "function") {
                        this.Director.onTick();
                    }
                    if (this.Collision && typeof this.Collision.onTick === "function") {
                        this.Collision.onTick();
                    }
                });
            }

            console.log("[AIAlchemy] Ready!");
            this.emit("ready");
        }
    });

    // Hook into Sandboxels native load lifecycle
    if (typeof runAfterLoad === "function") {
        runAfterLoad(() => window.AIAlchemy.boot());
    } else {
        window.addEventListener("load", () => window.AIAlchemy.boot());
    }
})();
