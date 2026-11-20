elements.ecosystem_seed = {
    color: "#38b000",
    behavior: behaviors.POWDER,
    category: "custom category",
    state: "solid",
    density: 1400,
    tick: function(pixel) {
        if (!pixel.grown) {
rown = true;
            let cx = pixel.x;
            let cy = pixel.y;

            // 1. Build terrain basin and tiny lake
            for (let dx = -22; dx <= 22; dx++) {
                for (let dy = -12; dy <= 12; dy++) {
                    let tx = cx + dx;
                    let ty = cy + dy;
                    if (tx < 1 || tx >= width - 1 || ty < 1 || ty >= height - 1) continue;

                    // Clear space above ground
                    if (dy < 0 && !isEmpty(tx, ty)) {
                        deletePixel(tx, ty);
                    }

                    // Carve lake in the center
                    if (dx >= -8 && dx <= 8 && dy >= 0 && dy <= 5) {
                        if (!isEmpty(tx, ty)) deletePixel(tx, ty);
                        createPixel(dy === 5 ? "sand" : "water", tx, ty);
                    } 
                    // Create grass and dirt on the banks
                    else if (dy >= 0 && dy <= 8) {
                        if (!isEmpty(tx, ty)) deletePixel(tx, ty);
                        createPixel(dy === 0 ? "grass" : "dirt", tx, ty);
                    }
                }
            }

            // 2. Spawn fish inside the lake
            let lakeSpots = [
                [-4, 2],
                [-2, 4],
                [2, 4]
            ];
            for (let s of lakeSpots) {
                let fx = cx + s[0];
                let fy = cy + s[1];
                if (fx > 1 && fx < width - 1 && fy > 1 && fy < height - 1) {
                    deletePixel(fx, fy);
                    createPixel("fish", fx, fy);
                }
            }

            // 3. Plant trees and flowers on the banks
            let plants = [
                {dx: -18, dy: -1, type: "sapling"},
                {dx: -13, dy: -1, type: "flower_seed"},
                {dx: 13, dy: -1, type: "flower_seed"},
                {dx: 18, dy: -1, type: "sapling"}
            ];
            for (let p of plants) {
                let px = cx + p.dx;
                let py = cy + p.dy;
                if (px > 1 && px < width - 1 && py > 1 && py < height - 1 && isEmpty(px, py)) {
                    createPixel(p.type, px, py);
                }
            }

            // 4. Spawn insects and underground decomposers
            let critters = [
                {dx: -15, dy: 3, type: "worm"},
                {dx: 15, dy: 3, type: "worm"},
                {dx: -14, dy: -5, type: "bee"},
                {dx: 14, dy: -5, type: "bee"},
                {dx: 0, dy: -6, type: "firefly"}
            ];
            for (let c of critters) {
                let bx = cx + c.dx;
                let by = cy + c.dy;
                if (bx > 1 && bx < width - 1 && by > 1 && by < height - 1 && isEmpty(bx, by)) {
                    createPixel(c.type, bx, by);
                }
            }

            // Turn the original seed into grass
            changePixel(pixel, "grass");
        }
    }
};
