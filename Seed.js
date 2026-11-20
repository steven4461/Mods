// ==========================================
// Ecosystem Seed Mod for Sandboxels
// Category: Custom Category
// ==========================================

elements.ecosystem_seed = {
    name: "Ecosystem Seed",
    color: ["#38b000", "#70e000", "#2b9348"],
    behavior: behaviors.POWDER,
    category: "custom category",
    state: "solid",
    density: 1400,
    desc: "Drop a single seed to generate a self-sustaining mini ecosystem with a lake, trees, flowers, and wildlife.",

    tick: function(pixel) {
        // Prevent the seed from triggering more than once
        if (pixel.grown) return;
        pixel.grown = true;

        // Shift center upward if dropped too close to the bottom edge
        const cx = Math.min(Math.max(pixel.x, 25), width - 26);
        const cy = Math.min(Math.max(pixel.y, 15), height - 11);

        // Helper function to safely clear and place pixels inside canvas bounds
        const safeSet = (x, y, elementName) => {
            if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return;
            if (!isEmpty(x, y)) {
                deletePixel(x, y);
            }
            if (elementName && elements[elementName]) {
                createPixel(elementName, x, y);
            }
        };

        // 1. Carve sky, terrain basin, and central lake
        for (let dx = -22; dx <= 22; dx++) {
            for (let dy = -12; dy <= 8; dy++) {
                const tx = cx + dx;
                const ty = cy + dy;

                // Clear open air above ground
                if (dy < 0) {
                    safeSet(tx, ty, null);
                    continue;
                }

                // Build central lake (width: 17px, depth: 6px)
                if (dx >= -8 && dx <= 8 && dy <= 5) {
                    const lakeLayer = (dy === 5) ? "sand" : "water";
                    safeSet(tx, ty, lakeLayer);
                } 
                // Build grassy banks and soil
                else {
                    const groundLayer = (dy === 0) ? "grass" : "dirt";
                    safeSet(tx, ty, groundLayer);
                }
            }
        }

        // 2. Populate lake with aquatic life and algae
        const aquaticLife = [
            { dx: -4, dy: 2, type: "fish" },
            { dx: 0,  dy: 3, type: "fish" },
            { dx: 4,  dy: 2, type: "fish" },
            { dx: -6, dy: 4, type: "algae" },
            { dx: 6,  dy: 4, type: "algae" }
        ];
        for (const item of aquaticLife) {
            safeSet(cx + item.dx, cy + item.dy, item.type);
        }

        // 3. Plant trees and flowers along both banks
        const flora = [
            { dx: -19, dy: -1, type: "sapling" },
            { dx: -14, dy: -1, type: "flower_seed" },
            { dx: -11, dy: -1, type: "grass_seed" },
            { dx: 11,  dy: -1, type: "grass_seed" },
            { dx: 14,  dy: -1, type: "flower_seed" },
            { dx: 19,  dy: -1, type: "sapling" }
        ];
        for (const plant of flora) {
            safeSet(cx + plant.dx, cy + plant.dy, plant.type);
        }

        // 4. Add underground decomposers, pollinators, and a rain cloud
        const faunaAndWeather = [
            { dx: -16, dy: 3,   type: "worm" },
            { dx: 16,  dy: 3,   type: "worm" },
            { dx: -15, dy: -6,  type: "bee" },
            { dx: 15,  dy: -6,  type: "bee" },
            { dx: 0,   dy: -7,  type: "firefly" },
            { dx: -2,  dy: -11, type: "rain_cloud" },
            { dx: 2,   dy: -11, type: "rain_cloud" }
        ];
        for (const entity of faunaAndWeather) {
            safeSet(cx + entity.dx, cy + entity.dy, entity.type);
        }

        // 5. Convert the original seed pixel cleanly into grass
        if (pixel && !pixel.del) {
            changePixel(pixel, "grass");
        }
    }
};
