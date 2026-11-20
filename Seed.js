// ========================================================
// Ecosystem Seed Mod for Sandboxels
// Author: steven4461
// Category: Custom Category (custom_category)
// ========================================================

(function() {
    function registerEcosystemMod() {
        elements.ecosystem_seed = {
            name: "Ecosystem Seed",
            color: ["#38b000", "#70e000", "#2b9348"],
            behavior: behaviors.POWDER,
            category: "custom_category",
            state: "solid",
            density: 1400,
            desc: "Drop one seed to generate a self-sustaining mini ecosystem with a lake, trees, flowers, and wildlife.",

            tick: function(pixel) {
                if (pixel.grown) return;
                pixel.grown = true;

                // Keep the entire ecosystem inside the playable canvas borders
                const cx = Math.min(Math.max(pixel.x, 25), width - 26);
                const cy = Math.min(Math.max(pixel.y, 15), height - 11);

                // Safe helper to clear space and spawn valid elements
                const safeSet = function(x, y, elementName) {
                    if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return;
                    if (!isEmpty(x, y)) {
                        deletePixel(x, y);
                    }
                    if (elementName && elements[elementName]) {
                        createPixel(elementName, x, y);
                    }
                };

                // 1. Carve sky, soil basin, and central lake
                for (let dx = -22; dx <= 22; dx++) {
                    for (let dy = -12; dy <= 8; dy++) {
                        const tx = cx + dx;
                        const ty = cy + dy;

                        // Clear open air above ground
                        if (dy < 0) {
                            safeSet(tx, ty, null);
                            continue;
                        }

                        // Central lake (17px wide, 6px deep)
                        if (dx >= -8 && dx <= 8 && dy <= 5) {
                            safeSet(tx, ty, dy === 5 ? "sand" : "water");
                        } 
                        // Grassy banks and dirt subsoil
                        else {
                            safeSet(tx, ty, dy === 0 ? "grass" : "dirt");
                        }
                    }
                }

                // 2. Populate lake with fish and algae
                const aquaticLife = [
                    { dx: -4, dy: 2, type: "fish" },
                    { dx: 0,  dy: 3, type: "fish" },
                    { dx: 4,  dy: 2, type: "fish" },
                    { dx: -6, dy: 4, type: "algae" },
                    { dx: 6,  dy: 4, type: "algae" }
                ];
                for (let i = 0; i < aquaticLife.length; i++) {
                    const item = aquaticLife[i];
                    safeSet(cx + item.dx, cy + item.dy, item.type);
                }

                // 3. Plant trees, flowers, and grass on both banks
                const flora = [
                    { dx: -19, dy: -1, type: "sapling" },
                    { dx: -14, dy: -1, type: "flower_seed" },
                    { dx: -11, dy: -1, type: "grass_seed" },
                    { dx: 11,  dy: -1, type: "grass_seed" },
                    { dx: 14,  dy: -1, type: "flower_seed" },
                    { dx: 19,  dy: -1, type: "sapling" }
                ];
                for (let i = 0; i < flora.length; i++) {
                    const plant = flora[i];
                    safeSet(cx + plant.dx, cy + plant.dy, plant.type);
                }

                // 4. Spawn worms, pollinators, and rain clouds
                const faunaAndWeather = [
                    { dx: -16, dy: 3,   type: "worm" },
                    { dx: 16,  dy: 3,   type: "worm" },
                    { dx: -15, dy: -6,  type: "bee" },
                    { dx: 15,  dy: -6,  type: "bee" },
                    { dx: 0,   dy: -7,  type: "firefly" },
                    { dx: -2,  dy: -11, type: "rain_cloud" },
                    { dx: 2,   dy: -11, type: "rain_cloud" }
                ];
                for (let i = 0; i < faunaAndWeather.length; i++) {
                    const entity = faunaAndWeather[i];
                    safeSet(cx + entity.dx, cy + entity.dy, entity.type);
                }

                // 5. Convert the seed pixel itself into grass
                if (pixel && !pixel.del) {
                    changePixel(pixel, "grass");
                }
            }
        };

        // Ensure the category tab & button render even if loaded late
        if (typeof createCategory === "function" && !document.getElementById("categoryButton-custom_category")) {
            createCategory("custom_category");
        }
        if (typeof createElementButton === "function" && !document.getElementById("elementButton-ecosystem_seed")) {
            createElementButton("ecosystem_seed");
        }
    }

    // Run immediately and also hook into Sandboxels' post-load lifecycle
    registerEcosystemMod();
    if (typeof runAfterLoad === "function") {
        runAfterLoad(registerEcosystemMod);
    }
})();
