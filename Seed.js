// ========================================================
// Full-Screen Ecosystem & Biome Seed Mod for Sandboxels (Beta)
// Author: steven4461
// Category: Custom Category (custom_category)
// ========================================================
(function() {
const BIOMES = {
forest: {
label: "🌲 Lush Forest & Lake",
groundTop: "grass",
subsoil: "dirt",
deepLayer: "rock",
liquid: "water",
lakeBed: "sand",
skyElement: "rain_cloud",
lakeRatio: 0.32,
hillAmp: 4,
plants: ["sapling", "flower_seed", "grass_seed", "grass_seed", "berry_seed"],
landBugs: ["bee", "butterfly", "firefly", "ladybug", "ant", "spider"],
undergroundBugs: ["worm", "ant", "termite"],
waterLife: ["fish", "algae", "tadpole", "frog"]
},
rainforest: {
label: "🌴 Tropical Rainforest",
groundTop: "grass",
subsoil: "mud",
deepLayer: "dirt",
liquid: "water",
lakeBed: "clay",
skyElement: "rain_cloud",
lakeRatio: 0.42,
hillAmp: 5,
plants: ["sapling", "bamboo", "vine", "flower_seed", "grass_seed"],
landBugs: ["butterfly", "dragonfly", "beetle", "snail", "bee", "firefly", "spider"],
undergroundBugs: ["worm", "termite", "ant"],
waterLife: ["fish", "frog", "tadpole", "algae", "piranha"]
},
desert: {
label: "🏜️ Desert Oasis",
groundTop: "sand",
subsoil: "sand",
deepLayer: "sandstone",
liquid: "water",
lakeBed: "clay",
skyElement: null,
lakeRatio: 0.22,
hillAmp: 6,
plants: ["cactus", "palm_tree", "grass_seed", "flower_seed"],
landBugs: ["scorpion", "spider", "beetle", "ant", "fly"],
undergroundBugs: ["ant", "scorpion", "worm"],
waterLife: ["fish", "algae"]
},
swamp: {
label: "🐸 Swamp & Marshland",
groundTop: "mud",
subsoil: "peat",
deepLayer: "clay",
liquid: "dirty_water",
lakeBed: "mud",
skyElement: "fog",
lakeRatio: 0.55,
hillAmp: 2,
plants: ["vine", "mushroom", "grass_seed", "bamboo", "algae"],
landBugs: ["fly", "mosquito", "firefly", "dragonfly", "snail", "slug", "spider"],
undergroundBugs: ["worm", "slug", "ant"],
waterLife: ["frog", "tadpole", "algae", "fish", "leech"]
},
tundra: {
label: "❄️ Alpine Tundra & Springs",
groundTop: "snow",
subsoil: "permafrost",
deepLayer: "ice",
liquid: "water",
lakeBed: "gravel",
skyElement: "snow_cloud",
lakeRatio: 0.26,
hillAmp: 7,
plants: ["pine", "sapling", "grass_seed"],
landBugs: ["beetle", "spider", "fly"],
undergroundBugs: ["worm"],
waterLife: ["fish", "algae"]
},
cavern: {
label: "🍄 Subterranean Glow Cavern",
groundTop: "mycelium",
subsoil: "dirt",
deepLayer: "basalt",
liquid: "water",
lakeBed: "gravel",
skyElement: null,
lakeRatio: 0.35,
hillAmp: 4,
plants: ["mushroom", "glow_mushroom", "vine"],
landBugs: ["spider", "firefly", "beetle", "ant", "snail", "slug"],
undergroundBugs: ["worm", "ant", "termite"],
waterLife: ["fish", "algae"]
}
};
function pickValidElement(candidates, fallback) {
for (let i = 0; i < candidates.length; i++) {
const name = candidates[i];
if (elements[name]) return name;
}
return fallback && elements[fallback] ? fallback : null;
}
function safeSet(x, y, el) {
if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return;
if (!isEmpty(x, y)) deletePixel(x, y);
if (el && elements[el]) createPixel(el, x, y);
}
function generateFullScreenBiome(biomeKey) {
const cfg = BIOMES[biomeKey] || BIOMES.forest;
const left = 1;
const right = width - 2;
const top = 1;
const bottom = height - 2;
const usableW = right - left;
const usableH = bottom - top;
for (let x = left; x <= right; x++) {
for (let y = top; y <= bottom; y++) {
if (!isEmpty(x, y)) deletePixel(x, y);
}
}
const baseGroundY = Math.floor(top + usableH * 0.64);
const lakeHalfW = Math.floor((usableW * cfg.lakeRatio) / 2);
const centerX = Math.floor((left + right) / 2);
const lakeStart = centerX - lakeHalfW;
const lakeEnd = centerX + lakeHalfW;
const lakeDepth = Math.max(6, Math.floor(usableH * 0.16));
const topEl = pickValidElement([cfg.groundTop, "grass", "dirt"], "dirt");
const subEl = pickValidElement([cfg.subsoil, "dirt"], "dirt");
const deepEl = pickValidElement([cfg.deepLayer, "rock", "stone"], "stone");
const liquidEl = pickValidElement([cfg.liquid, "water"], "water");
const bedEl = pickValidElement([cfg.lakeBed, "sand", "dirt"], "sand");
if (biomeKey === "cavern") {
for (let x = left; x <= right; x++) {
const roofThickness = 3 + Math.floor(Math.abs(Math.sin(x * 0.15)) * 4);
for (let y = top; y < top + roofThickness; y++) {
safeSet(x, y, deepEl);
}
}
}
const surfaceMap = {};
for (let x = left; x <= right; x++) {
const isLakeX = x >= lakeStart && x <= lakeEnd;
if (isLakeX) {
const distFromCenter = Math.abs(x - centerX) / Math.max(1, lakeHalfW);
const bowlDepth = Math.max(2, Math.round(lakeDepth * (1 - distFromCenter * distFromCenter * 0.65)));
const waterTopY = baseGroundY + 1;
const bedY = Math.min(bottom - 3, waterTopY + bowlDepth);
for (let y = waterTopY; y <= bottom; y++) {
if (y < bedY) {
safeSet(x, y, liquidEl);
} else if (y === bedY) {
safeSet(x, y, bedEl);
} else if (y < bottom - 3) {
safeSet(x, y, subEl);
} else {
safeSet(x, y, deepEl);
}
}
surfaceMap[x] = { y: waterTopY, isWater: true, bedY: bedY };
} else {
const wave = Math.round(Math.sin(x * 0.08) * cfg.hillAmp + Math.cos(x * 0.03) * (cfg.hillAmp * 0.5));
const surfY = Math.min(bottom - 6, Math.max(top + 12, baseGroundY + wave));
for (let y = surfY; y <= bottom; y++) {
if (y === surfY) {
safeSet(x, y, topEl);
} else if (y < bottom - 4) {
safeSet(x, y, subEl);
} else {
safeSet(x, y, deepEl);
}
}
surfaceMap[x] = { y: surfY, isWater: false };
}
}
const validPlants = cfg.plants.filter(el => elements[el]);
const validLandBugs = cfg.landBugs.filter(el => elements[el]);
const validUnderground = cfg.undergroundBugs.filter(el => elements[el]);
const validWaterLife = cfg.waterLife.filter(el => elements[el]);
for (let x = left + 2; x <= right - 2; x++) {
const info = surfaceMap[x];
if (!info) continue;
if (info.isWater) {
if (validWaterLife.length > 0 && Math.random() < 0.14) {
const creature = validWaterLife[Math.floor(Math.random() * validWaterLife.length)];
const spawnY = Math.min(info.bedY - 1, info.y + 1 + Math.floor(Math.random() * Math.max(1, info.bedY - info.y - 1)));
safeSet(x, spawnY, creature);
}
} else {
if (validPlants.length > 0 && x % 4 === 0 && Math.random() < 0.75) {
const plant = validPlants[Math.floor(Math.random() * validPlants.length)];
safeSet(x, info.y - 1, plant);
}
if (validLandBugs.length > 0 && Math.random() < 0.16) {
const bug = validLandBugs[Math.floor(Math.random() * validLandBugs.length)];
const airOffset = 2 + Math.floor(Math.random() * 8);
safeSet(x, Math.max(top + 6, info.y - airOffset), bug);
}
if (validUnderground.length > 0 && Math.random() < 0.12) {
const burrower = validUnderground[Math.floor(Math.random() * validUnderground.length)];
const depthY = Math.min(bottom - 5, info.y + 2 + Math.floor(Math.random() * 5));
safeSet(x, depthY, burrower);
}
}
}
const skyEl = cfg.skyElement && elements[cfg.skyElement] ? cfg.skyElement : null;
if (skyEl) {
const cloudY = top + 3;
for (let x = left + 4; x <= right - 4; x += 6) {
if (Math.random() < 0.65) {
safeSet(x, cloudY, skyEl);
safeSet(x + 1, cloudY, skyEl);
}
}
}
}
function openBiomeMenu(seedPixel) {
const existing = document.getElementById("steven-biome-modal");
if (existing) existing.remove();
const wasPaused = typeof paused !== "undefined" ? paused : false;
if (typeof paused !== "undefined") paused = true;
const overlay = document.createElement("div");
overlay.id = "steven-biome-modal";
overlay.style.cssText = [
"position:fixed",
"inset:0",
"background:rgba(0,0,0,0.68)",
"display:flex",
"align-items:center",
"justify-content:center",
"z-index:999999",
"font-family:-apple-system,BlinkMacSystemFont,sans-serif"
].join(";");
const box = document.createElement("div");
box.style.cssText = [
"background:#181c20",
"color:#ffffff",
"border:2px solid #38b000",
"border-radius:14px",
"padding:18px",
"width:min(340px, 88vw)",
"box-shadow:0 12px 32px rgba(0,0,0,0.6)",
"text-align:center"
].join(";");
const title = document.createElement("div");
title.textContent = "Choose Your Ecosystem Biome";
title.style.cssText = "font-size:18px;font-weight:700;margin-bottom:6px;color:#70e000;";
box.appendChild(title);
const subtitle = document.createElement("div");
subtitle.textContent = "Generates a full-screen habitat with matching terrain, plants, and bugs.";
subtitle.style.cssText = "font-size:12px;color:#b8c2cc;margin-bottom:14px;";
box.appendChild(subtitle);
Object.keys(BIOMES).forEach(function(key) {
const btn = document.createElement("button");
btn.textContent = BIOMES[key].label;
btn.style.cssText = [
"display:block",
"width:100%",
"padding:11px 12px",
"margin-bottom:8px",
"background:#242a30",
"color:#ffffff",
"border:1px solid #3c4650",
"border-radius:9px",
"font-size:15px",
"font-weight:600",
"cursor:pointer",
"text-align:left"
].join(";");
btn.onclick = function() {
overlay.remove();
window.__biomeMenuOpen = false;
generateFullScreenBiome(key);
if (typeof paused !== "undefined") paused = wasPaused;
};
box.appendChild(btn);
});
const cancelBtn = document.createElement("button");
cancelBtn.textContent = "Cancel";
cancelBtn.style.cssText = [
"margin-top:4px",
"padding:8px 14px",
"background:transparent",
"color:#9aa5b1",
"border:1px solid #3c4650",
"border-radius:8px",
"font-size:13px",
"cursor:pointer"
].join(";");
cancelBtn.onclick = function() {
overlay.remove();
window.__biomeMenuOpen = false;
if (seedPixel && !seedPixel.del) deletePixel(seedPixel.x, seedPixel.y);
if (typeof paused !== "undefined") paused = wasPaused;
};
box.appendChild(cancelBtn);
overlay.appendChild(box);
document.body.appendChild(overlay);
}
elements.ecosystem_seed = {
name: "Ecosystem Seed",
color: ["#38b000", "#70e000", "#2b9348"],
behavior: behaviors.POWDER,
category: "custom_category",
state: "solid",
density: 1400,
desc: "Drop one seed to open the Biome Picker and fill the entire screen with a living ecosystem.",
tick: function(pixel) {
if (pixel.triggered) return;
pixel.triggered = true;
if (window.__biomeMenuOpen) {
deletePixel(pixel.x, pixel.y);
return;
}
window.__biomeMenuOpen = true;
openBiomeMenu(pixel);
}
};
})();
