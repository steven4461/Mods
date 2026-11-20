// ========================================================
// AI Custom Biome Generator Add-On for Ecosystem Seed (Beta)
// Author: steven4461
// Extends: Seed.js (Modular Add-On)
// ========================================================
(function() {
// 1. Automatically load base Seed.js if it isn't already loaded
const BASE_MOD_URL = "https://cdn.jsdelivr.net/gh/steven4461/Mods@Beta/Seed.js";
if (!elements.ecosystem_seed && !document.getElementById("steven-base-seed-loader")) {
const script = document.createElement("script");
script.id = "steven-base-seed-loader";
script.src = BASE_MOD_URL;
document.head.appendChild(script);
}
// 2. Helper utilities
function pickValid(list, fallback) {
for (let i = 0; i < list.length; i++) {
if (elements[list[i]]) return list[i];
}
return fallback && elements[fallback] ? fallback : null;
}
function safeSet(x, y, el) {
if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return;
if (!isEmpty(x, y)) deletePixel(x, y);
if (el && elements[el]) createPixel(el, x, y);
}
// 3. Natural-Language AI Parameter Parser
function parseAIPrompt(rawPrompt) {
const p = (rawPrompt || "").toLowerCase();
// Default baseline parameters
const config = {
title: rawPrompt || "Custom AI Biome",
groundTop: "grass",
subsoil: "dirt",
deepLayer: "rock",
liquid: "water",
lakeBed: "sand",
skyElement: "rain_cloud",
lakeRatio: 0.32,
hillAmp: 4,
plantChance: 0.75,
bugChance: 0.18,
waterLifeChance: 0.15,
cavernRoof: false,
plants: ["sapling", "flower_seed", "grass_seed", "berry_seed"],
landBugs: ["bee", "butterfly", "firefly", "ladybug", "ant", "spider"],
undergroundBugs: ["worm", "ant", "termite"],
waterLife: ["fish", "algae", "tadpole", "frog"]
};
// --- Theme & Terrain Detection ---
if (p.includes("volcan") || p.includes("lava") || p.includes("magma") || p.includes("hell") || p.includes("fire")) {
config.groundTop = pickValid(["basalt", "ash", "obsidian", "rock"], "rock");
config.subsoil = pickValid(["basalt", "rock", "stone"], "stone");
config.deepLayer = pickValid(["obsidian", "basalt", "stone"], "stone");
config.liquid = pickValid(["lava", "magma", "water"], "lava");
config.lakeBed = pickValid(["obsidian", "basalt", "rock"], "rock");
config.skyElement = pickValid(["ash", "smoke", "fire_cloud"], null);
config.plants = ["dead_plant", "ash"];
config.landBugs = ["firefly", "beetle", "spider"];
config.undergroundBugs = ["termite"];
config.waterLife = [];
} else if (p.includes("desert") || p.includes("sand") || p.includes("dune") || p.includes("oasis")) {
config.groundTop = "sand";
config.subsoil = "sand";
config.deepLayer = pickValid(["sandstone", "rock"], "rock");
config.lakeBed = "clay";
config.skyElement = null;
config.lakeRatio = 0.20;
config.plants = ["cactus", "palm_tree", "grass_seed"];
config.landBugs = ["scorpion", "spider", "beetle", "ant", "fly"];
config.undergroundBugs = ["ant", "scorpion", "worm"];
} else if (p.includes("snow") || p.includes("ice") || p.includes("arctic") || p.includes("tundra") || p.includes("winter") || p.includes("frozen")) {
config.groundTop = pickValid(["snow", "ice"], "snow");
config.subsoil = pickValid(["permafrost", "ice", "dirt"], "dirt");
config.deepLayer = "ice";
config.lakeBed = pickValid(["gravel", "stone"], "stone");
config.skyElement = pickValid(["snow_cloud", "cloud"], null);
config.plants = ["pine", "sapling", "grass_seed"];
config.landBugs = ["beetle", "spider"];
config.undergroundBugs = ["worm"];
} else if (p.includes("swamp") || p.includes("marsh") || p.includes("bog") || p.includes("mud")) {
config.groundTop = "mud";
config.subsoil = pickValid(["peat", "mud", "dirt"], "dirt");
config.deepLayer = "clay";
config.liquid = pickValid(["dirty_water", "water"], "water");
config.lakeBed = "mud";
config.skyElement = pickValid(["fog", "rain_cloud"], null);
config.lakeRatio = 0.55;
config.plants = ["vine", "mushroom", "bamboo", "grass_seed"];
config.landBugs = ["fly", "mosquito", "firefly", "dragonfly", "snail", "slug", "spider"];
config.waterLife = ["frog", "tadpole", "algae", "fish", "leech"];
} else if (p.includes("cavern") || p.includes("cave") || p.includes("underground") || p.includes("mushroom") || p.includes("glow")) {
config.groundTop = pickValid(["mycelium", "dirt"], "dirt");
config.subsoil = "dirt";
config.deepLayer = pickValid(["basalt", "stone", "rock"], "stone");
config.skyElement = null;
config.cavernRoof = true;
config.plants = ["mushroom", "glow_mushroom", "vine"];
config.landBugs = ["spider", "firefly", "beetle", "ant", "snail", "slug"];
} else if (p.includes("jungle") || p.includes("rainforest") || p.includes("tropical")) {
config.groundTop = "grass";
config.subsoil = "mud";
config.skyElement = "rain_cloud";
config.plantChance = 0.92;
config.plants = ["sapling", "bamboo", "vine", "flower_seed", "grass_seed"];
config.landBugs = ["butterfly", "dragonfly", "beetle", "snail", "bee", "firefly", "spider"];
config.waterLife = ["fish", "frog", "tadpole", "algae", "piranha"];
} else if (p.includes("candy") || p.includes("sweet") || p.includes("sugar") || p.includes("chocolate")) {
config.groundTop = pickValid(["sugar", "frosting", "grass"], "grass");
config.subsoil = pickValid(["chocolate", "caramel", "dirt"], "dirt");
config.deepLayer = pickValid(["hard_candy", "rock"], "rock");
config.liquid = pickValid(["honey", "milk", "sugar_water", "water"], "water");
config.skyElement = null;
config.landBugs = ["bee", "butterfly", "ant", "fly"];
}
// --- Liquid Overrides ---
if (p.includes("acid")) config.liquid = pickValid(["acid", "water"], "water");
if (p.includes("honey")) config.liquid = pickValid(["honey", "water"], "water");
if (p.includes("poison") || p.includes("toxic")) config.liquid = pickValid(["poison", "dirty_water", "water"], "water");
if (p.includes("dirty water") || p.includes("murky")) config.liquid = pickValid(["dirty_water", "water"], "water");
if (p.includes("salt water") || p.includes("ocean") || p.includes("sea")) config.liquid = pickValid(["salt_water", "water"], "water");
// --- Water Size Overrides ---
if (p.includes("no water") || p.includes("no lake") || p.includes("dry")) {
config.lakeRatio = 0;
} else if (p.includes("tiny pond") || p.includes("small pond") || p.includes("puddle")) {
config.lakeRatio = 0.14;
} else if (p.includes("huge lake") || p.includes("big lake") || p.includes("giant lake")) {
config.lakeRatio = 0.60;
} else if (p.includes("ocean") || p.includes("sea") || p.includes("island") || p.includes("aquatic")) {
config.lakeRatio = 0.82;
}
// --- Terrain Elevation Overrides ---
if (p.includes("flat") || p.includes("plain") || p.includes("meadow")) {
config.hillAmp = 0;
} else if (p.includes("mountain") || p.includes("steep") || p.includes("canyon") || p.includes("cliff")) {
config.hillAmp = 10;
} else if (p.includes("hilly") || p.includes("rolling")) {
config.hillAmp = 5;
}
// --- Density & Creature Modifiers ---
if (p.includes("lots of bugs") || p.includes("swarm") || p.includes("infest") || p.includes("many bugs")) {
config.bugChance = 0.45;
} else if (p.includes("no bugs") || p.includes("lifeless") || p.includes("barren")) {
config.bugChance = 0;
config.waterLifeChance = 0;
config.plantChance = 0;
}
if (p.includes("overgrown") || p.includes("dense") || p.includes("lush") || p.includes("forest")) {
config.plantChance = 0.95;
}
if (p.includes("no rain") || p.includes("clear sky") || p.includes("sunny")) {
config.skyElement = null;
} else if (p.includes("storm") || p.includes("heavy rain")) {
config.skyElement = pickValid(["thunder_cloud", "rain_cloud"], "rain_cloud");
}
// Specific requested critters
const specificCritters = ["bee", "butterfly", "firefly", "spider", "ant", "worm", "frog", "fish", "snail", "beetle", "scorpion", "fly", "dragonfly"];
const matchedCritters = specificCritters.filter(c => p.includes(c) && elements[c]);
if (matchedCritters.length > 0) {
config.landBugs = matchedCritters;
}
return config;
}
// 4. Full-Screen Builder for AI-Parsed Configs
function generateCustomAIBiome(promptText) {
const cfg = parseAIPrompt(promptText);
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
const lakeDepth = Math.max(6, Math.floor(usableH * 0.18));
const topEl = pickValid([cfg.groundTop, "grass", "dirt"], "dirt");
const subEl = pickValid([cfg.subsoil, "dirt"], "dirt");
const deepEl = pickValid([cfg.deepLayer, "rock", "stone"], "stone");
const liquidEl = pickValid([cfg.liquid, "water"], "water");
const bedEl = pickValid([cfg.lakeBed, "sand", "dirt"], "sand");
if (cfg.cavernRoof) {
for (let x = left; x <= right; x++) {
const roofThickness = 3 + Math.floor(Math.abs(Math.sin(x * 0.15)) * 4);
for (let y = top; y < top + roofThickness; y++) {
safeSet(x, y, deepEl);
}
}
}
const surfaceMap = {};
for (let x = left; x <= right; x++) {
const isLakeX = cfg.lakeRatio > 0 && x >= lakeStart && x <= lakeEnd;
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
const wave = cfg.hillAmp === 0 ? 0 : Math.round(Math.sin(x * 0.08) * cfg.hillAmp + Math.cos(x * 0.03) * (cfg.hillAmp * 0.5));
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
if (validWaterLife.length > 0 && Math.random() < cfg.waterLifeChance) {
const creature = validWaterLife[Math.floor(Math.random() * validWaterLife.length)];
const spawnY = Math.min(info.bedY - 1, info.y + 1 + Math.floor(Math.random() * Math.max(1, info.bedY - info.y - 1)));
safeSet(x, spawnY, creature);
}
} else {
if (validPlants.length > 0 && x % 4 === 0 && Math.random() < cfg.plantChance) {
const plant = validPlants[Math.floor(Math.random() * validPlants.length)];
safeSet(x, info.y - 1, plant);
}
if (validLandBugs.length > 0 && Math.random() < cfg.bugChance) {
const bug = validLandBugs[Math.floor(Math.random() * validLandBugs.length)];
const airOffset = 2 + Math.floor(Math.random() * 8);
safeSet(x, Math.max(top + 6, info.y - airOffset), bug);
}
if (validUnderground.length > 0 && Math.random() < (cfg.bugChance * 0.7)) {
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
// 5. Inject AI Prompt Box into the Existing Biome Menu Modal
const observer = new MutationObserver(function() {
const modal = document.getElementById("steven-biome-modal");
if (!modal || document.getElementById("steven-ai-box")) return;
const box = modal.firstElementChild;
if (!box) return;
const aiWrapper = document.createElement("div");
aiWrapper.id = "steven-ai-box";
aiWrapper.style.cssText = [
"background:#111417",
"border:1px solid #70e000",
"border-radius:10px",
"padding:10px",
"margin-bottom:12px",
"text-align:left"
].join(";");
const aiLabel = document.createElement("div");
aiLabel.textContent = "✨ AI Custom Biome Generator";
aiLabel.style.cssText = "font-size:13px;font-weight:700;color:#70e000;margin-bottom:6px;";
aiWrapper.appendChild(aiLabel);
const input = document.createElement("input");
input.type = "text";
input.placeholder = "e.g. volcanic island with lava & fireflies...";
input.style.cssText = [
"width:100%",
"box-sizing:border-box",
"padding:9px 10px",
"border-radius:7px",
"border:1px solid #3c4650",
"background:#1e2328",
"color:#ffffff",
"font-size:14px",
"margin-bottom:7px"
].join(";");
aiWrapper.appendChild(input);
const genBtn = document.createElement("button");
genBtn.textContent = "Generate Custom Ecosystem";
genBtn.style.cssText = [
"width:100%",
"padding:9px",
"border-radius:7px",
"border:none",
"background:#38b000",
"color:#ffffff",
"font-size:14px",
"font-weight:700",
"cursor:pointer"
].join(";");
genBtn.onclick = function() {
const promptVal = input.value.trim();
modal.remove();
window.__biomeMenuOpen = false;
generateCustomAIBiome(promptVal);
if (typeof paused !== "undefined") paused = false;
};
aiWrapper.appendChild(genBtn);
// Insert right below the subtitle
box.insertBefore(aiWrapper, box.children[2] || null);
});
observer.observe(document.body, { childList: true, subtree: false });
})();
