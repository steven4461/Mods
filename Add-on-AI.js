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
// --- 300 Extended AI Prompt Rules for Add-on-AI.js (Paste right before `return config;`) ---
if (p.includes("beach") || p.includes("coast")) { config.groundTop = "sand"; config.subsoil = "sand"; config.liquid = pickValid(["salt_water", "water"], "water"); config.lakeRatio = 0.50; }
if (p.includes("coral") || p.includes("reef")) { config.liquid = pickValid(["salt_water", "water"], "water"); config.lakeBed = pickValid(["coral", "sand"], "sand"); config.lakeRatio = 0.78; }
if (p.includes("glacier") || p.includes("iceberg")) { config.groundTop = "ice"; config.subsoil = "ice"; config.deepLayer = pickValid(["packed_ice", "ice"], "ice"); config.hillAmp = 8; }
if (p.includes("taiga") || p.includes("boreal")) { config.groundTop = pickValid(["snow", "grass"], "grass"); config.plants = ["pine", "sapling", "berry_seed"]; config.skyElement = "snow_cloud"; }
if (p.includes("savanna") || p.includes("prairie")) { config.groundTop = pickValid(["dry_grass", "grass", "sand"], "grass"); config.hillAmp = 2; config.plants = ["grass_seed", "sapling"]; }
if (p.includes("mesa") || p.includes("badlands")) { config.groundTop = pickValid(["terracotta", "red_sand", "sand"], "sand"); config.subsoil = pickValid(["clay", "sandstone"], "sand"); config.hillAmp = 9; }
if (p.includes("red desert") || p.includes("mars")) { config.groundTop = pickValid(["red_sand", "rust", "sand"], "sand"); config.subsoil = pickValid(["rust", "sandstone"], "sand"); config.lakeRatio = 0; config.skyElement = null; }
if (p.includes("moon") || p.includes("lunar")) { config.groundTop = pickValid(["moon_rock", "gravel", "ash"], "gravel"); config.subsoil = "rock"; config.lakeRatio = 0; config.skyElement = null; }
if (p.includes("space") || p.includes("asteroid")) { config.groundTop = pickValid(["meteorite", "basalt", "rock"], "rock"); config.lakeRatio = 0; config.skyElement = null; config.plantChance = 0; }
if (p.includes("alien") || p.includes("extraterrestrial")) { config.groundTop = pickValid(["mycelium", "slime", "purple_sand"], "mycelium"); config.liquid = pickValid(["slime", "acid", "poison"], "water"); }
if (p.includes("nuclear") || p.includes("radiation")) { config.groundTop = pickValid(["ash", "gravel", "dirt"], "dirt"); config.liquid = pickValid(["radioactive_water", "acid", "dirty_water"], "dirty_water"); config.plantChance = 0.05; }
if (p.includes("wasteland") || p.includes("apocalypse")) { config.groundTop = pickValid(["ash", "dirt", "gravel"], "dirt"); config.plants = ["dead_plant"]; config.skyElement = pickValid(["ash", "smoke"], null); }
if (p.includes("toxic") || p.includes("sludge")) { config.liquid = pickValid(["poison", "slime", "dirty_water"], "dirty_water"); config.groundTop = "mud"; config.skyElement = "fog"; }
if (p.includes("acidic") || p.includes("corrosive")) { config.liquid = pickValid(["acid", "water"], "water"); config.lakeBed = pickValid(["glass", "obsidian", "stone"], "stone"); }
if (p.includes("crystal") || p.includes("gem")) { config.groundTop = pickValid(["crystal", "quartz", "ice"], "ice"); config.deepLayer = pickValid(["diamond", "amethyst", "rock"], "rock"); }
if (p.includes("gold") || p.includes("treasure")) { config.deepLayer = pickValid(["gold", "gold_coin", "rock"], "rock"); config.lakeBed = pickValid(["gold_dust", "sand"], "sand"); }
if (p.includes("iron") || p.includes("metal")) { config.deepLayer = pickValid(["iron", "steel", "rock"], "rock"); config.groundTop = pickValid(["rust", "gravel", "dirt"], "gravel"); }
if (p.includes("copper") || p.includes("bronze")) { config.deepLayer = pickValid(["copper", "rock"], "rock"); }
if (p.includes("coal") || p.includes("mine")) { config.deepLayer = pickValid(["coal", "rock"], "rock"); config.cavernRoof = true; }
if (p.includes("obsidian") || p.includes("glass")) { config.groundTop = pickValid(["obsidian", "glass", "basalt"], "basalt"); config.deepLayer = "obsidian"; }
if (p.includes("ash") || p.includes("soot")) { config.groundTop = pickValid(["ash", "dirt"], "dirt"); config.skyElement = pickValid(["ash", "smoke"], null); }
if (p.includes("charcoal") || p.includes("burned")) { config.groundTop = pickValid(["charcoal", "ash", "dirt"], "dirt"); config.plants = ["dead_plant"]; }
if (p.includes("clay") || p.includes("pottery")) { config.groundTop = "clay"; config.subsoil = "clay"; config.lakeBed = "clay"; }
if (p.includes("gravel") || p.includes("pebble")) { config.groundTop = "gravel"; config.subsoil = "gravel"; config.lakeBed = "gravel"; }
if (p.includes("silt") || p.includes("riverbank")) { config.groundTop = pickValid(["silt", "mud", "sand"], "mud"); config.subsoil = "mud"; }
if (p.includes("peat") || p.includes("fen")) { config.groundTop = pickValid(["peat", "mud"], "mud"); config.subsoil = "peat"; }
if (p.includes("limestone") || p.includes("karst")) { config.deepLayer = pickValid(["limestone", "rock"], "rock"); config.hillAmp = 7; }
if (p.includes("granite") || p.includes("alpine")) { config.deepLayer = pickValid(["granite", "rock"], "rock"); config.hillAmp = 9; }
if (p.includes("marble") || p.includes("ruins")) { config.deepLayer = pickValid(["marble", "limestone", "stone"], "stone"); }
if (p.includes("brick") || p.includes("city")) { config.deepLayer = pickValid(["brick", "concrete", "stone"], "stone"); config.hillAmp = 0; }
if (p.includes("concrete") || p.includes("urban")) { config.groundTop = pickValid(["concrete", "asphalt", "stone"], "stone"); config.hillAmp = 0; config.plantChance = 0.05; }
if (p.includes("asphalt") || p.includes("road")) { config.groundTop = pickValid(["asphalt", "gravel", "stone"], "stone"); config.hillAmp = 0; }
if (p.includes("wood") || p.includes("lumber")) { config.deepLayer = pickValid(["wood", "dirt"], "dirt"); config.plants = ["sapling", "pine"]; }
if (p.includes("bamboo") || p.includes("panda")) { config.plants = ["bamboo"]; config.plantChance = 0.95; config.groundTop = "grass"; }
if (p.includes("cactus") || p.includes("succulent")) { config.plants = ["cactus"]; config.groundTop = "sand"; config.lakeRatio = 0.10; }
if (p.includes("palm") || p.includes("tropical island")) { config.plants = ["palm_tree", "grass_seed"]; config.groundTop = "sand"; config.lakeRatio = 0.70; }
if (p.includes("pine") || p.includes("evergreen")) { config.plants = ["pine"]; config.groundTop = pickValid(["snow", "grass"], "grass"); }
if (p.includes("mushroom") || p.includes("fungus")) { config.plants = ["mushroom", "glow_mushroom"]; config.groundTop = pickValid(["mycelium", "dirt"], "dirt"); }
if (p.includes("glow") || p.includes("bioluminescent")) { config.plants = ["glow_mushroom"]; config.landBugs = ["firefly"]; config.bugChance = 0.35; }
if (p.includes("flower") || p.includes("blossom")) { config.plants = ["flower_seed", "grass_seed"]; config.plantChance = 0.90; config.landBugs = ["bee", "butterfly"]; }
if (p.includes("berry") || p.includes("orchard")) { config.plants = ["berry_seed", "sapling"]; config.plantChance = 0.85; }
if (p.includes("vine") || p.includes("overgrowth")) { config.plants = ["vine", "sapling", "grass_seed"]; config.plantChance = 0.95; }
if (p.includes("wheat") || p.includes("farm")) { config.plants = ["wheat", "grass_seed"]; config.groundTop = "dirt"; config.hillAmp = 0; }
if (p.includes("corn") || p.includes("crop")) { config.plants = ["corn", "wheat", "grass_seed"]; config.groundTop = "dirt"; config.hillAmp = 1; }
if (p.includes("potato") || p.includes("garden")) { config.plants = ["potato", "flower_seed", "grass_seed"]; config.groundTop = "dirt"; }
if (p.includes("pumpkin") || p.includes("autumn")) { config.plants = ["pumpkin", "dead_plant", "grass_seed"]; config.groundTop = "dirt"; }
if (p.includes("moss") || p.includes("damp")) { config.groundTop = pickValid(["moss", "grass", "mud"], "grass"); config.skyElement = "rain_cloud"; }
if (p.includes("seaweed") || p.includes("kelp")) { config.waterLife = ["kelp", "seaweed", "algae", "fish"]; config.lakeRatio = 0.75; }
if (p.includes("algae") || p.includes("pond scum")) { config.waterLife = ["algae", "frog", "tadpole"]; config.waterLifeChance = 0.35; }
if (p.includes("lily") || p.includes("lotus")) { config.waterLife = ["lily_pad", "frog", "tadpole", "fish"]; }
if (p.includes("honey") || p.includes("beehive")) { config.liquid = pickValid(["honey", "water"], "water"); config.landBugs = ["bee"]; config.bugChance = 0.45; }
if (p.includes("milk") || p.includes("dairy")) { config.liquid = pickValid(["milk", "water"], "water"); config.groundTop = "grass"; }
if (p.includes("chocolate") || p.includes("cocoa")) { config.subsoil = pickValid(["chocolate", "dirt"], "dirt"); config.liquid = pickValid(["melted_chocolate", "milk", "water"], "water"); }
if (p.includes("sugar") || p.includes("sweet")) { config.groundTop = pickValid(["sugar", "sand"], "sand"); config.landBugs = ["ant", "bee", "fly"]; }
if (p.includes("salt") || p.includes("salt flat")) { config.groundTop = pickValid(["salt", "sand"], "sand"); config.liquid = pickValid(["salt_water", "water"], "water"); config.hillAmp = 0; }
if (p.includes("oil") || p.includes("tar")) { config.liquid = pickValid(["oil", "tar", "dirty_water"], "dirty_water"); config.plants = ["dead_plant"]; }
if (p.includes("gasoline") || p.includes("fuel")) { config.liquid = pickValid(["gasoline", "oil", "water"], "water"); config.skyElement = null; }
if (p.includes("slime") || p.includes("goo")) { config.liquid = pickValid(["slime", "water"], "water"); config.groundTop = pickValid(["slime", "mud"], "mud"); }
if (p.includes("blood") || p.includes("crimson")) { config.liquid = pickValid(["blood", "water"], "water"); config.groundTop = pickValid(["flesh", "dirt"], "dirt"); }
if (p.includes("soda") || p.includes("cola")) { config.liquid = pickValid(["soda", "sugar_water", "water"], "water"); }
if (p.includes("juice") || p.includes("fruit")) { config.liquid = pickValid(["juice", "sugar_water", "water"], "water"); config.plants = ["berry_seed", "sapling"]; }
if (p.includes("coffee") || p.includes("espresso")) { config.liquid = pickValid(["coffee", "dirty_water", "water"], "water"); config.groundTop = "dirt"; }
if (p.includes("tea") || p.includes("herbal")) { config.liquid = pickValid(["tea", "water"], "water"); config.plants = ["grass_seed", "flower_seed"]; }
if (p.includes("soup") || p.includes("broth")) { config.liquid = pickValid(["broth", "water"], "water"); }
if (p.includes("soap") || p.includes("bubble")) { config.liquid = pickValid(["soap", "water"], "water"); }
if (p.includes("glue") || p.includes("sticky")) { config.liquid = pickValid(["glue", "honey", "water"], "water"); }
if (p.includes("wax") || p.includes("candle")) { config.deepLayer = pickValid(["wax", "stone"], "stone"); }
if (p.includes("cheese") || p.includes("moon cheese")) { config.groundTop = pickValid(["cheese", "sand"], "sand"); config.subsoil = pickValid(["cheese", "dirt"], "dirt"); }
if (p.includes("bread") || p.includes("bakery")) { config.groundTop = pickValid(["bread", "dough", "sand"], "sand"); }
if (p.includes("ice cream") || p.includes("sundae")) { config.groundTop = pickValid(["ice_cream", "snow"], "snow"); config.liquid = pickValid(["melted_chocolate", "milk", "water"], "water"); }
if (p.includes("frosting") || p.includes("cake")) { config.groundTop = pickValid(["frosting", "sugar", "snow"], "snow"); config.subsoil = pickValid(["cake", "bread", "dirt"], "dirt"); }
if (p.includes("cloud") || p.includes("sky")) { config.groundTop = pickValid(["cloud", "snow"], "snow"); config.subsoil = pickValid(["cloud", "snow"], "snow"); config.lakeRatio = 0; }
if (p.includes("thunder") || p.includes("lightning")) { config.skyElement = pickValid(["thunder_cloud", "rain_cloud"], "rain_cloud"); }
if (p.includes("rain") || p.includes("drizzle")) { config.skyElement = "rain_cloud"; }
if (p.includes("snowfall") || p.includes("blizzard")) { config.skyElement = "snow_cloud"; config.groundTop = "snow"; }
if (p.includes("fog") || p.includes("mist")) { config.skyElement = "fog"; }
if (p.includes("hail") || p.includes("sleet")) { config.skyElement = pickValid(["hail_cloud", "snow_cloud"], "snow_cloud"); }
if (p.includes("acid rain") || p.includes("polluted")) { config.skyElement = pickValid(["acid_cloud", "smog", "fog"], "fog"); }
if (p.includes("sandstorm") || p.includes("dust")) { config.skyElement = pickValid(["sandstorm", "dust", "ash"], null); config.groundTop = "sand"; }
if (p.includes("firestorm") || p.includes("ember")) { config.skyElement = pickValid(["fire_cloud", "ash", "smoke"], null); }
if (p.includes("sunny") || p.includes("cloudless")) { config.skyElement = null; }
if (p.includes("piranha") || p.includes("dangerous water")) { config.waterLife = ["piranha", "fish"]; config.waterLifeChance = 0.25; }
if (p.includes("shark") || p.includes("deep sea")) { config.waterLife = ["shark", "fish", "kelp"]; config.lakeRatio = 0.85; }
if (p.includes("crab") || p.includes("shore")) { config.landBugs = ["crab", "snail", "fly"]; config.groundTop = "sand"; }
if (p.includes("shrimp") || p.includes("krill")) { config.waterLife = ["shrimp", "fish", "algae"]; }
if (p.includes("jellyfish") || p.includes("abyss")) { config.waterLife = ["jellyfish", "fish"]; config.lakeRatio = 0.85; }
if (p.includes("squid") || p.includes("octopus")) { config.waterLife = ["squid", "octopus", "fish"]; config.lakeRatio = 0.85; }
if (p.includes("clam") || p.includes("oyster")) { config.waterLife = ["clam", "fish", "algae"]; }
if (p.includes("turtle") || p.includes("tortoise")) { config.waterLife = ["turtle", "fish", "frog"]; }
if (p.includes("duck") || p.includes("waterfowl")) { config.waterLife = ["duck", "fish", "frog"]; }
if (p.includes("frog") || p.includes("amphibian")) { config.waterLife = ["frog", "tadpole", "algae"]; config.waterLifeChance = 0.30; }
if (p.includes("tadpole") || p.includes("spawn")) { config.waterLife = ["tadpole", "algae"]; config.waterLifeChance = 0.35; }
if (p.includes("fish") || p.includes("aquarium")) { config.waterLife = ["fish", "algae"]; config.waterLifeChance = 0.30; }
if (p.includes("leech") || p.includes("parasite")) { config.waterLife = ["leech", "frog", "dirty_water"]; }
if (p.includes("bee") || p.includes("apiary")) { config.landBugs = ["bee"]; config.bugChance = 0.35; config.plants = ["flower_seed"]; }
if (p.includes("butterfly") || p.includes("monarch")) { config.landBugs = ["butterfly"]; config.bugChance = 0.35; config.plants = ["flower_seed"]; }
if (p.includes("firefly") || p.includes("lightning bug")) { config.landBugs = ["firefly"]; config.bugChance = 0.35; }
if (p.includes("ladybug") || p.includes("aphid")) { config.landBugs = ["ladybug"]; config.bugChance = 0.30; }
if (p.includes("ant") || p.includes("anthill")) { config.landBugs = ["ant"]; config.undergroundBugs = ["ant"]; config.bugChance = 0.40; }
if (p.includes("termite") || p.includes("woodworm")) { config.undergroundBugs = ["termite"]; config.landBugs = ["termite"]; config.bugChance = 0.35; }
if (p.includes("spider") || p.includes("arachnid")) { config.landBugs = ["spider"]; config.bugChance = 0.35; }
if (p.includes("scorpion") || p.includes("stinger")) { config.landBugs = ["scorpion"]; config.undergroundBugs = ["scorpion"]; config.groundTop = "sand"; }
if (p.includes("worm") || p.includes("earthworm")) { config.undergroundBugs = ["worm"]; config.bugChance = 0.40; }
if (p.includes("snail") || p.includes("shell")) { config.landBugs = ["snail"]; config.groundTop = "mud"; }
if (p.includes("slug") || p.includes("slimy")) { config.landBugs = ["slug"]; config.groundTop = "mud"; }
if (p.includes("beetle") || p.includes("scarab")) { config.landBugs = ["beetle"]; config.bugChance = 0.30; }
if (p.includes("dragonfly") || p.includes("damselfly")) { config.landBugs = ["dragonfly"]; config.lakeRatio = 0.50; }
if (p.includes("mosquito") || p.includes("gnat")) { config.landBugs = ["mosquito", "fly"]; config.liquid = pickValid(["dirty_water", "water"], "water"); }
if (p.includes("fly") || p.includes("housefly")) { config.landBugs = ["fly"]; config.bugChance = 0.35; }
if (p.includes("rat") || p.includes("rodent")) { config.landBugs = ["rat", "mouse"]; config.bugChance = 0.25; }
if (p.includes("bird") || p.includes("aviary")) { config.landBugs = ["bird", "pigeon", "bee"]; config.bugChance = 0.25; }
if (p.includes("bat") || p.includes("nocturnal")) { config.landBugs = ["bat", "firefly", "spider"]; config.cavernRoof = true; }
if (p.includes("snake") || p.includes("viper")) { config.landBugs = ["snake", "scorpion", "beetle"]; }
if (p.includes("lizard") || p.includes("gecko")) { config.landBugs = ["lizard", "beetle", "ant"]; }
if (p.includes("human") || p.includes("village")) { config.landBugs = ["human"]; config.bugChance = 0.08; config.hillAmp = 1; }
if (p.includes("zombie") || p.includes("undead")) { config.landBugs = ["zombie"]; config.bugChance = 0.12; config.groundTop = "dirt"; }
if (p.includes("flat") || p.includes("level")) { config.hillAmp = 0; }
if (p.includes("gentle") || p.includes("soft hills")) { config.hillAmp = 2; }
if (p.includes("rolling") || p.includes("undulating")) { config.hillAmp = 4; }
if (p.includes("steep") || p.includes("jagged")) { config.hillAmp = 9; }
if (p.includes("extreme") || p.includes("cliff")) { config.hillAmp = 12; }
if (p.includes("canyon") || p.includes("gorge")) { config.hillAmp = 11; config.lakeRatio = 0.25; }
if (p.includes("valley") || p.includes("basin")) { config.hillAmp = 7; config.lakeRatio = 0.45; }
if (p.includes("plateau") || p.includes("tableland")) { config.hillAmp = 1; }
if (p.includes("archipelago") || p.includes("islands")) { config.lakeRatio = 0.78; config.hillAmp = 5; }
if (p.includes("peninsula") || p.includes("cape")) { config.lakeRatio = 0.62; }
if (p.includes("lagoon") || p.includes("atoll")) { config.lakeRatio = 0.68; config.groundTop = "sand"; }
if (p.includes("puddle") || p.includes("tiny pond")) { config.lakeRatio = 0.12; }
if (p.includes("small lake") || p.includes("pond")) { config.lakeRatio = 0.22; }
if (p.includes("medium lake") || p.includes("lake")) { config.lakeRatio = 0.35; }
if (p.includes("large lake") || p.includes("great lake")) { config.lakeRatio = 0.55; }
if (p.includes("sea") || p.includes("ocean")) { config.lakeRatio = 0.82; }
if (p.includes("waterworld") || p.includes("flooded")) { config.lakeRatio = 0.92; }
if (p.includes("arid") || p.includes("waterless")) { config.lakeRatio = 0; config.skyElement = null; }
if (p.includes("drought") || p.includes("parched")) { config.lakeRatio = 0.06; config.groundTop = "dirt"; config.skyElement = null; }
if (p.includes("monsoon") || p.includes("downpour")) { config.skyElement = "rain_cloud"; config.lakeRatio = 0.58; }
if (p.includes("humid") || p.includes("wet")) { config.skyElement = "rain_cloud"; config.groundTop = "mud"; }
if (p.includes("frozen lake") || p.includes("ice sheet")) { config.liquid = "ice"; config.groundTop = "snow"; }
if (p.includes("hot spring") || p.includes("thermal")) { config.liquid = pickValid(["warm_water", "water"], "water"); config.skyElement = "fog"; }
if (p.includes("geyser") || p.includes("steam")) { config.skyElement = pickValid(["steam", "fog"], "fog"); config.groundTop = "rock"; }
if (p.includes("magma chamber") || p.includes("caldera")) { config.liquid = "lava"; config.cavernRoof = true; config.groundTop = "basalt"; }
if (p.includes("subterranean") || p.includes("hollow")) { config.cavernRoof = true; config.skyElement = null; }
if (p.includes("open sky") || p.includes("surface")) { config.cavernRoof = false; }
if (p.includes("barren") || p.includes("empty")) { config.plantChance = 0; config.bugChance = 0; config.waterLifeChance = 0; }
if (p.includes("sparse") || p.includes("scarce")) { config.plantChance = 0.20; config.bugChance = 0.06; }
if (p.includes("moderate") || p.includes("balanced")) { config.plantChance = 0.65; config.bugChance = 0.18; }
if (p.includes("dense") || p.includes("thick")) { config.plantChance = 0.90; config.bugChance = 0.28; }
if (p.includes("teeming") || p.includes("vibrant")) { config.plantChance = 0.96; config.bugChance = 0.42; config.waterLifeChance = 0.35; }
if (p.includes("no plants") || p.includes("plantless")) { config.plantChance = 0; }
if (p.includes("no fish") || p.includes("dead water")) { config.waterLifeChance = 0; }
if (p.includes("bugless") || p.includes("insect free")) { config.bugChance = 0; }
if (p.includes("spring") || p.includes("vernal")) { config.plants = ["flower_seed", "sapling", "grass_seed"]; config.skyElement = "rain_cloud"; }
if (p.includes("summer") || p.includes("solstice")) { config.skyElement = null; config.plants = ["grass_seed", "flower_seed", "berry_seed"]; }
if (p.includes("fall") || p.includes("harvest")) { config.plants = ["pumpkin", "wheat", "dead_plant"]; config.groundTop = "dirt"; }
if (p.includes("winter") || p.includes("frost")) { config.groundTop = "snow"; config.skyElement = "snow_cloud"; config.plants = ["pine"]; }
if (p.includes("everglades") || p.includes("bayou")) { config.groundTop = "mud"; config.liquid = pickValid(["dirty_water", "water"], "water"); config.lakeRatio = 0.60; config.plants = ["vine", "grass_seed", "bamboo"]; }
if (p.includes("mangrove") || p.includes("estuary")) { config.groundTop = "mud"; config.liquid = pickValid(["salt_water", "dirty_water", "water"], "water"); config.plants = ["sapling", "vine"]; }
if (p.includes("tundra") || p.includes("permafrost")) { config.groundTop = "snow"; config.subsoil = pickValid(["permafrost", "dirt"], "dirt"); config.deepLayer = "ice"; }
if (p.includes("steppe") || p.includes("grassland")) { config.groundTop = "grass"; config.plants = ["grass_seed"]; config.hillAmp = 2; }
if (p.includes("meadow") || p.includes("pasture")) { config.groundTop = "grass"; config.plants = ["flower_seed", "grass_seed"]; config.hillAmp = 1; }
if (p.includes("woodland") || p.includes("grove")) { config.groundTop = "grass"; config.plants = ["sapling", "grass_seed"]; config.plantChance = 0.85; }
if (p.includes("redwood") || p.includes("ancient forest")) { config.plants = ["sapling", "pine", "mushroom"]; config.plantChance = 0.95; }
if (p.includes("fairy") || p.includes("enchanted")) { config.groundTop = pickValid(["mycelium", "grass"], "grass"); config.plants = ["glow_mushroom", "flower_seed"]; config.landBugs = ["firefly", "butterfly"]; }
if (p.includes("haunted") || p.includes("spooky")) { config.groundTop = "dirt"; config.plants = ["dead_plant", "mushroom"]; config.skyElement = "fog"; config.landBugs = ["spider", "bat", "fly"]; }
if (p.includes("cursed") || p.includes("dark")) { config.groundTop = pickValid(["basalt", "ash", "dirt"], "dirt"); config.liquid = pickValid(["blood", "poison", "dirty_water"], "dirty_water"); config.skyElement = "fog"; }
if (p.includes("heaven") || p.includes("angelic")) { config.groundTop = pickValid(["cloud", "gold", "snow"], "snow"); config.liquid = pickValid(["honey", "milk", "water"], "water"); config.landBugs = ["butterfly", "bee"]; }
if (p.includes("underworld") || p.includes("nether")) { config.groundTop = pickValid(["basalt", "obsidian", "rock"], "rock"); config.liquid = "lava"; config.cavernRoof = true; }
if (p.includes("quarry") || p.includes("pit")) { config.groundTop = "stone"; config.subsoil = "rock"; config.deepLayer = "bedrock"; config.hillAmp = 8; }
if (p.includes("sandbar") || p.includes("shoal")) { config.groundTop = "sand"; config.lakeRatio = 0.65; config.hillAmp = 1; }
if (p.includes("delta") || p.includes("wetland")) { config.groundTop = "mud"; config.lakeRatio = 0.52; config.plants = ["grass_seed", "bamboo"]; }
if (p.includes("oasis") || p.includes("mirage")) { config.groundTop = "sand"; config.lakeRatio = 0.24; config.plants = ["palm_tree", "grass_seed"]; }
if (p.includes("dune") || p.includes("erg")) { config.groundTop = "sand"; config.subsoil = "sand"; config.hillAmp = 7; config.lakeRatio = 0; }
if (p.includes("crater") || p.includes("impact")) { config.groundTop = pickValid(["meteorite", "ash", "rock"], "rock"); config.lakeRatio = 0.40; config.hillAmp = 6; }
if (p.includes("bedrock") || p.includes("deep core")) { config.deepLayer = pickValid(["bedrock", "obsidian", "rock"], "rock"); }
if (p.includes("sandstone") || p.includes("canyonlands")) { config.groundTop = "sand"; config.deepLayer = pickValid(["sandstone", "rock"], "rock"); }
if (p.includes("dirt") || p.includes("soil")) { config.groundTop = "dirt"; config.subsoil = "dirt"; }
if (p.includes("rocky") || p.includes("boulder")) { config.groundTop = "rock"; config.subsoil = "stone"; }
if (p.includes("sandy") || p.includes("beachy")) { config.groundTop = "sand"; config.lakeBed = "sand"; }
if (p.includes("muddy") || p.includes("sloppy")) { config.groundTop = "mud"; config.subsoil = "mud"; }
if (p.includes("icy") || p.includes("slippery")) { config.groundTop = "ice"; config.lakeBed = "ice"; }
if (p.includes("snowy") || p.includes("powdery")) { config.groundTop = "snow"; config.skyElement = "snow_cloud"; }
if (p.includes("grassy") || p.includes("turf")) { config.groundTop = "grass"; config.plants = ["grass_seed"]; }
if (p.includes("mossy") || p.includes("overgrown stone")) { config.groundTop = pickValid(["moss", "grass"], "grass"); config.deepLayer = "stone"; }
if (p.includes("wetlands") || p.includes("mire")) { config.groundTop = "mud"; config.liquid = "dirty_water"; config.lakeRatio = 0.55; }
if (p.includes("saltwater") || p.includes("brine")) { config.liquid = pickValid(["salt_water", "water"], "water"); }
if (p.includes("freshwater") || p.includes("clear water")) { config.liquid = "water"; }
if (p.includes("murky") || p.includes("stagnant")) { config.liquid = pickValid(["dirty_water", "water"], "water"); }
if (p.includes("boiling") || p.includes("hot water")) { config.liquid = pickValid(["boiling_water", "water"], "water"); }
if (p.includes("cold water") || p.includes("frigid")) { config.liquid = pickValid(["cold_water", "water"], "water"); }
if (p.includes("seltzer") || p.includes("sparkling")) { config.liquid = pickValid(["seltzer", "water"], "water"); }
if (p.includes("vinegar") || p.includes("sour")) { config.liquid = pickValid(["vinegar", "water"], "water"); }
if (p.includes("bleach") || p.includes("chemical")) { config.liquid = pickValid(["bleach", "acid", "water"], "water"); }
if (p.includes("ammonia") || p.includes("fumes")) { config.liquid = pickValid(["ammonia", "poison", "water"], "water"); }
if (p.includes("mercury") || p.includes("quicksilver")) { config.liquid = pickValid(["mercury", "water"], "water"); }
if (p.includes("liquid nitrogen") || p.includes("cryo")) { config.liquid = pickValid(["liquid_nitrogen", "ice", "water"], "water"); config.groundTop = "ice"; }
if (p.includes("molten gold") || p.includes("liquid gold")) { config.liquid = pickValid(["molten_gold", "lava"], "lava"); }
if (p.includes("molten iron") || p.includes("foundry")) { config.liquid = pickValid(["molten_iron", "lava"], "lava"); }
if (p.includes("molten glass") || p.includes("glassworks")) { config.liquid = pickValid(["molten_glass", "lava"], "lava"); }
if (p.includes("wax lake") || p.includes("melted wax")) { config.liquid = pickValid(["melted_wax", "honey", "water"], "water"); }
if (p.includes("butter") || p.includes("cream")) { config.liquid = pickValid(["melted_butter", "milk", "water"], "water"); }
if (p.includes("ketchup") || p.includes("sauce")) { config.liquid = pickValid(["ketchup", "blood", "water"], "water"); }
if (p.includes("mayo") || p.includes("mayonnaise")) { config.liquid = pickValid(["mayo", "milk", "water"], "water"); }
if (p.includes("mustard") || p.includes("yellow")) { config.liquid = pickValid(["mustard", "honey", "water"], "water"); }
if (p.includes("ink") || p.includes("black water")) { config.liquid = pickValid(["ink", "dirty_water", "water"], "water"); }
if (p.includes("paint") || p.includes("colorful")) { config.liquid = pickValid(["paint", "water"], "water"); }
if (p.includes("dye") || p.includes("tinted")) { config.liquid = pickValid(["dye", "water"], "water"); }
if (p.includes("perfume") || p.includes("fragrant")) { config.liquid = pickValid(["perfume", "water"], "water"); config.plants = ["flower_seed"]; }
if (p.includes("alcohol") || p.includes("ethanol")) { config.liquid = pickValid(["alcohol", "water"], "water"); }
if (p.includes("wine") || p.includes("vineyard")) { config.liquid = pickValid(["wine", "juice", "water"], "water"); config.plants = ["vine", "berry_seed"]; }
if (p.includes("beer") || p.includes("tavern")) { config.liquid = pickValid(["beer", "water"], "water"); config.plants = ["wheat"]; }
if (p.includes("root beer") || p.includes("float")) { config.liquid = pickValid(["root_beer", "soda", "water"], "water"); }
if (p.includes("lemonade") || p.includes("citrus")) { config.liquid = pickValid(["lemonade", "juice", "water"], "water"); }
if (p.includes("honeycomb") || p.includes("hive")) { config.deepLayer = pickValid(["honeycomb", "wax", "stone"], "stone"); config.landBugs = ["bee"]; }
if (p.includes("anthill") || p.includes("colony")) { config.subsoil = "dirt"; config.undergroundBugs = ["ant"]; config.bugChance = 0.45; }
if (p.includes("spiderweb") || p.includes("nest")) { config.landBugs = ["spider"]; config.bugChance = 0.45; }
if (p.includes("swamp gas") || p.includes("methane")) { config.skyElement = pickValid(["methane", "fog"], "fog"); config.groundTop = "mud"; }
if (p.includes("hydrogen") || p.includes("float")) { config.skyElement = pickValid(["hydrogen", "cloud"], null); }
if (p.includes("helium") || p.includes("balloon")) { config.skyElement = pickValid(["helium", "cloud"], null); }
if (p.includes("oxygen") || p.includes("fresh air")) { config.skyElement = pickValid(["oxygen", "rain_cloud"], "rain_cloud"); }
if (p.includes("carbon dioxide") || p.includes("co2")) { config.skyElement = pickValid(["carbon_dioxide", "smoke"], null); }
if (p.includes("steam") || p.includes("sauna")) { config.skyElement = pickValid(["steam", "fog"], "fog"); }
if (p.includes("smoke") || p.includes("smoky")) { config.skyElement = pickValid(["smoke", "ash"], null); }
if (p.includes("smog") || p.includes("industrial")) { config.skyElement = pickValid(["smog", "smoke", "fog"], "fog"); }
if (p.includes("pollen") || p.includes("allergy")) { config.skyElement = pickValid(["pollen", "rain_cloud"], null); config.plants = ["flower_seed"]; }
if (p.includes("spore") || p.includes("fungal")) { config.skyElement = pickValid(["spore", "fog"], null); config.plants = ["mushroom", "glow_mushroom"]; }
if (p.includes("ash fall") || p.includes("volcanic winter")) { config.skyElement = "ash"; config.groundTop = "ash"; }
if (p.includes("meteor") || p.includes("shower")) { config.skyElement = pickValid(["meteor", "fire_cloud"], null); }
if (p.includes("firework") || p.includes("celebration")) { config.skyElement = pickValid(["firework", "cloud"], null); }
if (p.includes("confetti") || p.includes("party")) { config.skyElement = pickValid(["confetti", "cloud"], null); }
if (p.includes("glitter") || p.includes("sparkle")) { config.skyElement = pickValid(["glitter", "cloud"], null); }
if (p.includes("feather") || p.includes("pillow")) { config.groundTop = pickValid(["feather", "snow"], "snow"); }
if (p.includes("wool") || p.includes("sheep")) { config.groundTop = pickValid(["wool", "grass"], "grass"); }
if (p.includes("cotton") || p.includes("fluffy")) { config.groundTop = pickValid(["cotton", "cloud", "snow"], "snow"); }
if (p.includes("paper") || p.includes("origami")) { config.groundTop = pickValid(["paper", "sand"], "sand"); }
if (p.includes("cardboard") || p.includes("box")) { config.deepLayer = pickValid(["cardboard", "wood", "dirt"], "dirt"); }
if (p.includes("plastic") || p.includes("landfill")) { config.groundTop = pickValid(["plastic", "trash", "dirt"], "dirt"); }
if (p.includes("rubber") || p.includes("bouncy")) { config.groundTop = pickValid(["rubber", "dirt"], "dirt"); }
if (p.includes("sponge") || p.includes("absorbent")) { config.lakeBed = pickValid(["sponge", "sand"], "sand"); }
if (p.includes("soapstone") || p.includes("talc")) { config.deepLayer = pickValid(["soapstone", "stone"], "stone"); }
if (p.includes("slate") || p.includes("shale")) { config.deepLayer = pickValid(["slate", "shale", "stone"], "stone"); }
if (p.includes("pumice") || p.includes("volcanic rock")) { config.groundTop = pickValid(["pumice", "basalt", "rock"], "rock"); }
if (p.includes("tuff") || p.includes("tephra")) { config.subsoil = pickValid(["tuff", "ash", "dirt"], "dirt"); }
if (p.includes("peridot") || p.includes("green gem")) { config.deepLayer = pickValid(["peridot", "crystal", "rock"], "rock"); }
if (p.includes("ruby") || p.includes("red gem")) { config.deepLayer = pickValid(["ruby", "crystal", "rock"], "rock"); }
if (p.includes("sapphire") || p.includes("blue gem")) { config.deepLayer = pickValid(["sapphire", "crystal", "rock"], "rock"); }
if (p.includes("emerald") || p.includes("jewel")) { config.deepLayer = pickValid(["emerald", "crystal", "rock"], "rock"); }
if (p.includes("silver") || p.includes("precious")) { config.deepLayer = pickValid(["silver", "rock"], "rock"); }
if (p.includes("lead") || p.includes("heavy metal")) { config.deepLayer = pickValid(["lead", "iron", "rock"], "rock"); }
if (p.includes("tin") || p.includes("alloy")) { config.deepLayer = pickValid(["tin", "rock"], "rock"); }
if (p.includes("zinc") || p.includes("galvanized")) { config.deepLayer = pickValid(["zinc", "rock"], "rock"); }
if (p.includes("nickel") || p.includes("coin")) { config.deepLayer = pickValid(["nickel", "rock"], "rock"); }
if (p.includes("aluminum") || p.includes("foil")) { config.deepLayer = pickValid(["aluminum", "rock"], "rock"); }
if (p.includes("titanium") || p.includes("strong")) { config.deepLayer = pickValid(["titanium", "steel", "rock"], "rock"); }
if (p.includes("uranium") || p.includes("reactor")) { config.deepLayer = pickValid(["uranium", "rock"], "rock"); config.liquid = pickValid(["radioactive_water", "water"], "water"); }
if (p.includes("plutonium") || p.includes("fallout")) { config.deepLayer = pickValid(["plutonium", "uranium", "rock"], "rock"); config.groundTop = "ash"; }
if (p.includes("sulfur") || p.includes("brimstone")) { config.groundTop = pickValid(["sulfur", "sand"], "sand"); config.liquid = "lava"; }
if (p.includes("phosphorus") || p.includes("match")) { config.groundTop = pickValid(["phosphorus", "dirt"], "dirt"); }
if (p.includes("potassium") || p.includes("reactive")) { config.groundTop = pickValid(["potassium", "salt", "sand"], "sand"); }
if (p.includes("sodium") || p.includes("explosive water")) { config.groundTop = pickValid(["sodium", "salt", "sand"], "sand"); }
if (p.includes("calcium") || p.includes("chalk")) { config.deepLayer = pickValid(["chalk", "limestone", "stone"], "stone"); }
if (p.includes("magnesium") || p.includes("flash")) { config.deepLayer = pickValid(["magnesium", "rock"], "rock"); }
if (p.includes("silicon") || p.includes("wafer")) { config.subsoil = pickValid(["silicon", "sand"], "sand"); }
if (p.includes("carbon") || p.includes("graphite")) { config.deepLayer = pickValid(["graphite", "coal", "rock"], "rock"); }
if (p.includes("nitrogen") || p.includes("freeze")) { config.liquid = pickValid(["liquid_nitrogen", "water"], "water"); }
if (p.includes("dry ice") || p.includes("sublimate")) { config.groundTop = pickValid(["dry_ice", "snow"], "snow"); }
if (p.includes("slush") || p.includes("melting")) { config.groundTop = pickValid(["slush", "snow", "mud"], "snow"); }
if (p.includes("permafrost") || p.includes("frozen dirt")) { config.subsoil = pickValid(["permafrost", "ice", "dirt"], "dirt"); }
if (p.includes("quicksand") || p.includes("sinking")) { config.groundTop = pickValid(["quicksand", "sand"], "sand"); config.subsoil = pickValid(["quicksand", "sand"], "sand"); }
if (p.includes("red sand") || p.includes("outback")) { config.groundTop = pickValid(["red_sand", "sand"], "sand"); }
if (p.includes("black sand") || p.includes("volcanic beach")) { config.groundTop = pickValid(["black_sand", "basalt", "sand"], "sand"); }
if (p.includes("soul sand") || p.includes("spooky sand")) { config.groundTop = pickValid(["soul_sand", "mud", "sand"], "sand"); }
if (p.includes("topsoil") || p.includes("rich dirt")) { config.groundTop = "dirt"; config.plantChance = 0.90; }
if (p.includes("loam") || p.includes("fertile")) { config.groundTop = "grass"; config.subsoil = "dirt"; config.plantChance = 0.92; }
if (p.includes("humus") || p.includes("compost")) { config.groundTop = pickValid(["compost", "dirt"], "dirt"); config.plantChance = 0.95; }
if (p.includes("mulch") || p.includes("woodchips")) { config.groundTop = pickValid(["mulch", "wood", "dirt"], "dirt"); }
if (p.includes("sawdust") || p.includes("mill")) { config.groundTop = pickValid(["sawdust", "sand"], "sand"); }
if (p.includes("hay") || p.includes("barn")) { config.groundTop = pickValid(["hay", "straw", "grass"], "grass"); }
if (p.includes("straw") || p.includes("thatch")) { config.groundTop = pickValid(["straw", "hay", "grass"], "grass"); }
if (p.includes("rose") || p.includes("thorns")) { config.plants = ["rose", "flower_seed"]; }
if (p.includes("tulip") || p.includes("holland")) { config.plants = ["tulip", "flower_seed"]; config.hillAmp = 0; }
if (p.includes("sunflower") || p.includes("sunny field")) { config.plants = ["sunflower", "flower_seed"]; config.skyElement = null; }
if (p.includes("dandelion") || p.includes("weeds")) { config.plants = ["dandelion", "grass_seed"]; }
if (p.includes("clover") || p.includes("lucky")) { config.plants = ["clover", "grass_seed"]; }
if (p.includes("fern") || p.includes("prehistoric")) { config.plants = ["fern", "sapling", "vine"]; }
if (p.includes("reed") || p.includes("cattail")) { config.plants = ["reed", "bamboo", "grass_seed"]; config.lakeRatio = 0.50; }
if (p.includes("oak") || p.includes("deciduous")) { config.plants = ["sapling"]; config.plantChance = 0.85; }
if (p.includes("birch") || p.includes("white bark")) { config.plants = ["birch", "sapling"]; }
if (p.includes("willow") || p.includes("weeping")) { config.plants = ["willow", "vine", "sapling"]; config.lakeRatio = 0.45; }
if (p.includes("cherry") || p.includes("sakura")) { config.plants = ["cherry_blossom", "flower_seed", "sapling"]; }
if (p.includes("apple") || p.includes("cider")) { config.plants = ["apple_tree", "sapling"]; }
if (p.includes("banana") || p.includes("monkey")) { config.plants = ["banana_tree", "palm_tree", "vine"]; }
if (p.includes("coconut") || p.includes("castaway")) { config.plants = ["palm_tree"]; config.groundTop = "sand"; config.lakeRatio = 0.75; }
if (p.includes("acorn") || p.includes("squirrel")) { config.plants = ["sapling", "grass_seed"]; }
if (p.includes("pinecone") || p.includes("conifer")) { config.plants = ["pine"]; }
if (p.includes("spore blossom") || p.includes("lush cave")) { config.cavernRoof = true; config.plants = ["vine", "glow_mushroom", "moss"]; }
if (p.includes("dripstone") || p.includes("stalactite")) { config.cavernRoof = true; config.deepLayer = "stone"; config.skyElement = null; }
if (p.includes("geode") || p.includes("amethyst")) { config.cavernRoof = true; config.deepLayer = pickValid(["amethyst", "crystal", "basalt"], "basalt"); }
if (p.includes("magma") || p.includes("core")) { config.liquid = "lava"; config.deepLayer = "basalt"; }
if (p.includes("steam vent") || p.includes("hydrothermal")) { config.lakeRatio = 0.70; config.skyElement = "steam"; }
if (p.includes("abyssal") || p.includes("trench")) { config.lakeRatio = 0.90; config.waterLife = ["fish", "jellyfish"]; }
if (p.includes("tide pool") || p.includes("rocky shore")) { config.groundTop = "rock"; config.lakeRatio = 0.45; config.waterLife = ["crab", "shrimp", "algae", "fish"]; }
if (p.includes("fjord") || p.includes("glacier valley")) { config.hillAmp = 10; config.lakeRatio = 0.45; config.groundTop = "snow"; }
if (p.includes("atoll") || p.includes("ring island")) { config.groundTop = "sand"; config.lakeRatio = 0.72; config.plants = ["palm_tree"]; }
if (p.includes("salt marsh") || p.includes("tidal")) { config.groundTop = "mud"; config.liquid = pickValid(["salt_water", "water"], "water"); config.lakeRatio = 0.55; }
if (p.includes("bog") || p.includes("quagmire")) { config.groundTop = "mud"; config.subsoil = "peat"; config.plants = ["mushroom", "moss"]; }
if (p.includes("moor") || p.includes("heather")) { config.groundTop = "grass"; config.plants = ["flower_seed", "grass_seed"]; config.skyElement = "fog"; }
if (p.includes("chaparral") || p.includes("shrubland")) { config.groundTop = "dirt"; config.plants = ["grass_seed", "cactus"]; config.skyElement = null; }
if (p.includes("veldt") || p.includes("bush")) { config.groundTop = "grass"; config.hillAmp = 2; config.plants = ["grass_seed", "sapling"]; }
if (p.includes("pampas") || p.includes("plains")) { config.groundTop = "grass"; config.hillAmp = 0; config.plants = ["grass_seed"]; }
if (p.includes("zen") || p.includes("rock garden")) { config.groundTop = "sand"; config.deepLayer = "stone"; config.hillAmp = 1; config.lakeRatio = 0.15; config.plants = ["bamboo"]; }
if (p.includes("terrarium") || p.includes("jar")) { config.cavernRoof = true; config.groundTop = "grass"; config.plants = ["moss", "fern", "mushroom"]; config.landBugs = ["snail", "beetle", "ant"]; }
if (p.includes("ant farm") || p.includes("tunnel")) { config.groundTop = "sand"; config.subsoil = "dirt"; config.undergroundBugs = ["ant"]; config.bugChance = 0.50; }
if (p.includes("worm bin") || p.includes("vermicompost")) { config.groundTop = "dirt"; config.subsoil = "mud"; config.undergroundBugs = ["worm"]; config.bugChance = 0.50; }
if (p.includes("butterfly garden") || p.includes("pollinator")) { config.plants = ["flower_seed"]; config.plantChance = 0.95; config.landBugs = ["butterfly", "bee"]; config.bugChance = 0.40; }
if (p.includes("firefly night") || p.includes("glowing bugs")) { config.landBugs = ["firefly"]; config.bugChance = 0.45; config.skyElement = null; }
if (p.includes("frog pond") || p.includes("lily pond")) { config.lakeRatio = 0.55; config.waterLife = ["frog", "tadpole", "algae"]; config.waterLifeChance = 0.35; }
if (p.includes("koi pond") || p.includes("fish pond")) { config.lakeRatio = 0.50; config.waterLife = ["fish", "algae"]; config.waterLifeChance = 0.35; }
if (p.includes("piranha river") || p.includes("infested water")) { config.lakeRatio = 0.60; config.waterLife = ["piranha"]; config.waterLifeChance = 0.35; }
if (p.includes("scorpion pit") || p.includes("venom")) { config.groundTop = "sand"; config.landBugs = ["scorpion"]; config.bugChance = 0.40; }
if (p.includes("spider cave") || p.includes("arachnophobia")) { config.cavernRoof = true; config.landBugs = ["spider"]; config.bugChance = 0.45; }
if (p.includes("bee swarm") || p.includes("hornet")) { config.landBugs = ["bee"]; config.bugChance = 0.50; }
if (p.includes("locust") || p.includes("plague")) { config.landBugs = ["beetle", "fly", "ant"]; config.bugChance = 0.55; config.plants = ["dead_plant"]; }
if (p.includes("chaos") || p.includes("random")) { config.hillAmp = 10; config.bugChance = 0.45; config.plantChance = 0.90; config.waterLifeChance = 0.35; }
if (p.includes("peaceful") || p.includes("calm")) { config.hillAmp = 1; config.skyElement = null; config.landBugs = ["butterfly", "bee"]; config.waterLife = ["fish", "algae"]; }

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
