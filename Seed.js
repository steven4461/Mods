elements.ecosystem_seed = {
    name: "Ecosystem Seed",
    color: ["#38b000", "#70e000", "#2b9348"],
    behavior: behaviors.POWDER,
    category: "custom_category",
    state: "solid",
    density: 1400,
    desc: "Drop one seed to generate a self-sustaining mini ecosystem.",
    tick: function(pixel) {
        if (pixel.grown) return;
        pixel.grown = true;

        var cx = Math.min(Math.max(pixel.x, 25), width - 26);
        var cy = Math.min(Math.max(pixel.y, 15), height - 11);

        var safeSet = function(x, y, el) {
            if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return;
            if (!isEmpty(x, y)) deletePixel(x, y);
            if (el && elements[el]) createPixel(el, x, y);
        };

        for (var dx = -22; dx <= 22; dx++) {
            for (var dy = -12; dy <= 8; dy++) {
                var tx = cx + dx;
                var ty = cy + dy;
                if (dy < 0) {
                    safeSet(tx, ty, null);
                } else if (dx >= -8 && dx <= 8 && dy <= 5) {
                    safeSet(tx, ty, dy === 5 ? "sand" : "water");
                } else {
                    safeSet(tx, ty, dy === 0 ? "grass" : "dirt");
                }
            }
        }

        var items = [
            [-4, 2, "fish"], [0, 3, "fish"], [4, 2, "fish"],
            [-6, 4, "algae"], [6, 4, "algae"],
            [-19, -1, "sapling"], [-14, -1, "flower_seed"], [-11, -1, "grass_seed"],
            [11, -1, "grass_seed"], [14, -1, "flower_seed"], [19, -1, "sapling"],
            [-16, 3, "worm"], [16, 3, "worm"],
            [-15, -6, "bee"], [15, -6, "bee"], [0, -7, "firefly"],
            [-2, -11, "rain_cloud"], [2, -11, "rain_cloud"]
        ];

        for (var i = 0; i < items.length; i++) {
            safeSet(cx + items[i][0], cy + items[i][1], items[i][2]);
        }

        if (pixel && !pixel.del) {
            changePixel(pixel, "grass");
        }
    }
};
