// Contains all static data

// Textures
let textures = {};
let cellSize = 64;
let currentTexturePack = "64x";
async function loadTextures() {
  const textureNames = [
    "unclicked",
    "blank",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "flagged",
    "question_mark",
    "glitched",
    "bomb",
    "shown_bomb",
    "nuke",
    "cluster",
    "flag_bomb",
    "ghost",
    "friendly",
    "smoke",
    "sonar",
    "glitch_bomb",
    "virus",
    "spread",
    "half_bomb",
    "bomb_half_bomb",
    "two_bomb",
    "reverse",
    "random",
    "ultimate",
    "medic",
    "antimatter_bomb"
  ];
  // favicon
  document.getElementById("favicon").href = "alltextures/64x/" + textureNames[Math.floor(Math.random() * textureNames.length)] + ".png";
  textures = {};
  for (const name of textureNames) {
    textures[name] = new Image();
    textures[name].src = `alltextures/${currentTexturePack}/${name}.png`;
    await new Promise(resolve => {
      textures[name].onload = () => resolve();
    })
  }
  console.log("Textures loaded");
}
loadTextures();

// Music
let currentMusic = "sound/click-and-flag.mp3";
const soundElement = document.getElementById("bgMusic");
let musicIsPlaying = false;
function startMusic(path, volume = 1.0) {
  path = path || currentMusic;
  currentMusic = path;
  soundElement.src = path;
  soundElement.volume = path === "sound/eagle-eye.mp3" ? 0.75 : volume;
  soundElement.play();
  musicIsPlaying = true;
}
function stopMusic() {
  soundElement.pause();
  musicIsPlaying = false;
}

// Sounds
let currentlyPlaying = [];
let truncateExtra = [
  "click.mp3",
  "sonar.mp3",
  "win.mp3"
]

function playSound(soundPath, volume = 1.0) {
  if (currentlyPlaying.includes(soundPath) && truncateExtra.includes(soundPath)) return;
  const audio = new Audio("sound/" + soundPath);
  currentlyPlaying.push(soundPath);
  audio.volume = volume;
  const removeFromList = () => {
    const index = currentlyPlaying.indexOf(soundPath);
    if (index !== -1) currentlyPlaying.splice(index, 1);
  };

  audio.addEventListener("ended", removeFromList);
  audio.addEventListener("error", removeFromList);
  audio.play().catch(err => {
    console.warn("Sound play failed:", err);
    removeFromList(); 
  });
}

// Bomb info
const dataJSbombInfo = {
  "bomb": {
    "desc": "Regular bomb - 1 DMG",
    "bgcolor": "#ff0000",
    "outline": "#000000"
  },
  "half_bomb": {
    "desc": "Half bomb - 0.5 DMG",
    "bgcolor": "#ff0000",
    "outline": "#000000"
  },
  "sonar": {
    "desc": "Reveals other bombs! - 1.5 DMG",
    "bgcolor": "#000000",
    "outline": "#00ff00"
  },
  "flag_bomb": {
    "desc": "Destroys all flags! - 0.5 DMG",
    "bgcolor": "#ff0000",
    "outline": "#000000"
  },
  "ghost": {
    "desc": "Phases into a deadly bomb somewhere else - 0 DMG",
    "bgcolor": "#aaaaaa",
    "outline": "#ffffff"
  },
  "friendly": {
    "desc": "Heals you! - 1 HEAL",
    "bgcolor": "#009900",
    "outline": "#00ff00"
  },
  "bomb_half_bomb": {
    "desc": "One and half bombs - 1.5 DMG",
    "bgcolor": "#ff0000",
    "outline": "#000000"
  },
  "smoke": {
    "desc": "Hides the number of some cells - 0.5 DMG",
    "bgcolor": "#424242",
    "outline": "#000000"
  },
  "cluster": {
    "desc": "Creates new regular bombs - 1 DMG",
    "bgcolor": "#420000",
    "outline": "#000000"
  },
  "nuke": {
    "desc": "Instakill! - 999 DMG",
    "bgcolor": "#000000",
    "outline": "#ffff00"
  },
  "two_bomb": {
    "desc": "Two bombs in one! - 2 DMG",
    "bgcolor": "#ff0000",
    "outline": "#000000"
  },
  "glitch_bomb": {
    "desc": "Hello, your computer has virus! - 0.5 DMG",
    "bgcolor": "#000000",
    "outline": "#000000"
  },
  "spread": {
    "desc": "Creates copies of itself - 1 DMG",
    "bgcolor": "#000000",
    "outline": "#ff0000"
  },
  "shown_bomb": {
    "desc": "This bomb has been safely revealed",
    "bgcolor": "#ffffff",
    "outline": "#000000"
  },
  "deadly_ghost": {
    "desc": "Deadly ghost bomb! - 2 DMG",
    "bgcolor": "#aaaaaa",
    "outline": "#ffffff"
  },
  "reverse": {
    "desc": "Reverses controls! - 0.5 DMG",
    "bgcolor": "#000000",
    "outline": "#ff0000"
  },
  "random": {
    "desc": "Dice bomb, random effect - 1 DMG",
    "bgcolor": "#000000",
    "outline": "#ffffff"
  },
  "ultimate": {
    "desc": "Ultimate bomb, everything at once - 2 DMG",
    "bgcolor": "#000000",
    "outline": "#ffffff"
  },
  "medic": {
    "desc": "Heals you! - 2 HEAL",
    "bgcolor": "#009900",
    "outline": "#00ff00"
  },
  "antimatter_bomb": {
    "desc": "Resets cells in a plus shape - 1 DMG",
    "bgcolor": "#00a7d1",
    "outline": "#fff"
  }
}
function getBombInfo() {
  return dataJSbombInfo;
}
const dataJSrogueLikeChoices = {
  "heal": {
    "desc": "Heal 0.5 lives",
    "name": "Lesser Heal",
    "rarity": "common",
    "id": "heal"
  },
  "betterHeal": {
    "desc": "Heal 1 life",
    "name": "Heal",
    "rarity": "rare",
    "id": "heal2"
  },
  "bestHeal": {
    "desc": "Heal 2 lives",
    "name": "Greater Heal",
    "rarity": "mythic",
    "id": "heal3"
  },
  "reveal": {
    "desc": "Reveal one bomb on start",
    "name": "Lesser Sonar",
    "rarity": "common",
    "id": "reveal"
  },
  "bestReveal": {
    "desc": "Reveal 3 bombs on start",
    "name": "Sonar",
    "rarity": "rare",
    "id": "reveal2"
  },
  "current": {
    "desc": "Stay at current difficulty",
    "name": "Contemporary",
    "rarity": "mythic",
    "id": "current"
  },
  "lessBombs": {
    "desc": "Reduce bomb percentage by 5%",
    "name": "Lesser Remove",
    "rarity": "rare",
    "id": "lessBombs"
  },
  "lesserBombs": {
    "desc": "Reduce bomb percentage by 10%",
    "name": "Remove",
    "rarity": "mythic",
    "id": "lessBombs2"
  },
  "leastBombs": {
    "desc": "Reduce bomb percentage by 15%",
    "name": "Greater Remove",
    "rarity": "legendary",
    "id": "lessBombs3"
  },
  "backDiff": {
    "desc": "Go back one difficulty",
    "name": "Rewind",
    "rarity": "legendary",
    "id": "backOne"
  },
  "landIncrease": {
    "desc": "Increase beginning land size by 8",
    "name": "Lesser Build",
    "rarity": "common",
    "id": "landIncrease"
  },
  "landIncrease2": {
    "desc": "Increase beginning land size by 16",
    "name": "Build",
    "rarity": "rare",
    "id": "landIncrease2"
  },
  "landIncrease3": {
    "desc": "Increase beginning land size by 32",
    "name": "Greater Build",
    "rarity": "mythic",
    "id": "landIncrease3"
  },
  "landIncrease4": {
    "desc": "Increase beginning land size by 48",
    "name": "Construct",
    "rarity": "legendary",
    "id": "landIncrease4"
  },
  "luck1": {
    "desc": "5% extra luck for abilities",
    "name": "Fluke",
    "rarity": "rare",
    "id": "luck1"
  },
  "luck2": {
    "desc": "10% extra luck for abilities",
    "name": "Prosperity",
    "rarity": "mythic",
    "id": "luck2"
  },
  "luck3": {
    "desc": "15% extra luck for abilities",
    "name": "Fortune",
    "rarity": "legendary",
    "id": "luck3"
  },
  "friendly1": {
    "desc": "Small increase in chance for friendly and medic bombs",
    "name": "Lesser Safety",
    "rarity": "rare",
    "id": "friendly1"
  },
  "friendly2": {
    "desc": "Increase in chance for friendly and medic bombs",
    "name": "Safety",
    "rarity": "mythic",
    "id": "friendly2"
  },
  "friendly3": {
    "desc": "Large increase in chance for friendly and medic bombs",
    "name": "Greater Safety",
    "rarity": "legendary",
    "id": "friendly3"
  },
  "everything": {
    "desc": "All cards at once",
    "name": "Everything",
    "rarity": "everything",
    "id": "everything"
  },
  "landIncrease5": {
    "desc": "Increase beginning land size by 256",
    "name": "Fabricate",
    "rarity": "everything",
    "id": "landIncrease5"
  }
}
const rarityToClass = {
  "common": "commonChoice",
  "rare": "rareChoice",
  "mythic": "mythicChoice",
  "legendary": "legendaryChoice",
  "everything": "everythingChoice"
}
function getRogueLikeChoices() {
  return dataJSrogueLikeChoices;
}
const dataJSbombToDamage = {
  "bomb": 1,
  "half_bomb": 0.5,
  "sonar": 1.5,
  "flag_bomb": 0.5,
  "ghost": 0,
  "friendly": -1,
  "bomb_half_bomb": 1.5,
  "smoke": 0.5,
  "cluster": 1,
  "nuke": 999,
  "two_bomb": 2,
  "virus": 0,
  "glitch_bomb": 0.5,
  "spread": 1,
  "shown_bomb": 0,
  "reverse": 0.5,
  "random": 1,
  "ultimate": 2,
  "medic": -2,
  "antimatter_bomb": 1
};
function getBombToDamage() {
  return dataJSbombToDamage;
}
// Bombs
const bombClassList = {
  "bomb": regularBomb,
  "half_bomb": halfBomb,
  "sonar": sonarBomb,
  "flag_bomb": flagBomb,
  "ghost": ghostBomb,
  "friendly": friendlyBomb,
  "bomb_half_bomb": bombHalfBomb,
  "smoke": smokeBomb,
  "cluster": clusterBomb,
  "nuke": nukeBomb,
  "two_bomb": twoBomb,
  "virus": hiddenBomb,
  "glitch_bomb": glitchBomb,
  "spread": spreadBomb,
  "shown_bomb": null,
  "reverse": reverseBomb,
  "random": randomBomb,
  "ultimate": ultimateBomb,
  "medic": medicBomb,
  "antimatter_bomb": antimatterBomb
}

// Game presets
const gamePresets = {
  "beginner": new Game(
    new gameInfo(
      10, // Rows
      10, // Cols
      0, // Bombs left
      3, // Lives
      0, // Bombs revealed
      0, // Timer
      [], // Virus popups
      null, // Run interval
      null, // Timer interval
      "beginner", // Difficulty
      true, // Info cards on
      0, // Clicks
      false, // Controls reversed
      "normal", // Current gamemode
      true, // Should be dark on dark gamemode
      1, // Bomb multiplier
      0.1, // Bomb ratio
      0.45, // Special bomb ratio
      1, // Sonar bomb amount
      1, // Smoke bomb amount
      1, // Cluster bomb amount
      1, // Spread bomb amount
      1, // Glitch bomb amount
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "smoke", "ghost", "reverse"], // Bomb list
      10 // Land size
    ),
    new Renderer()
  ),
  "intermediate": new Game(
    new gameInfo(
      16, // Rows
      16, // Cols
      0, // Bombs left
      3, // Lives
      0, // Bombs revealed
      0, // Timer
      [], // Virus popups
      null, // Run interval
      null, // Timer interval
      "intermediate", // Difficulty
      true, // Info cards on
      0, // Clicks
      false, // Controls reversed
      "normal", // Current gamemode
      true, // Should be dark on dark gamemode
      1, // Bomb multiplier
      0.15, // Bomb ratio
      0.55, // Special bomb ratio
      2, // Sonar bomb amount
      1, // Smoke bomb amount
      2, // Cluster bomb amount
      2, // Spread bomb amount
      2, // Glitch bomb amount
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "ghost", "friendly", "smoke", "nuke", "reverse", "antimatter_bomb"], // Bomb list
      10 // Land size
    ),
    new Renderer()
  ),
  "expert": new Game(
    new gameInfo(
      16, // Rows
      30, // Cols
      0, // Bombs left
      2, // Lives
      0, // Bombs revealed
      0, // Timer
      [], // Virus popups
      null, // Run interval
      null, // Timer interval
      "expert", // Difficulty
      true, // Info cards on
      0, // Clicks
      false, // Controls reversed
      "normal", // Current gamemode
      true, // Should be dark on dark gamemode
      1, // Bomb multiplier
      0.2, // Bomb ratio
      0.6, // Special bomb ratio
      3, // Sonar bomb amount
      2, // Smoke bomb amount
      3, // Cluster bomb amount
      3, // Spread bomb amount
      4, // Glitch bomb amount
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "ghost", "friendly", "smoke", "two_bomb", "nuke", "bomb_half_bomb", "virus", "reverse", "random", "antimatter_bomb"], // Bomb list
      10 // Land size
    ),
    new Renderer()
  ),
  "extreme": new Game(
    new gameInfo(
      20, // Rows
      30, // Cols
      0, // Bombs left
      1, // Lives
      0, // Bombs revealed
      0, // Timer
      [], // Virus popups
      null, // Run interval
      null, // Timer interval
      "extreme", // Difficulty
      true, // Info cards on
      0, // Clicks
      false, // Controls reversed
      "normal", // Current gamemode
      true, // Should be dark on dark gamemode
      1, // Bomb multiplier
      0.25, // Bomb ratio
      0.75, // Special bomb ratio
      4, // Sonar bomb amount
      3, // Smoke bomb amount
      4, // Cluster bomb amount
      4, // Spread bomb amount
      8, // Glitch bomb amount
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "ghost", "friendly", "smoke", "two_bomb", "nuke", "bomb_half_bomb", "virus", "glitch_bomb", "spread", "reverse", "random", "medic", "antimatter_bomb"], // Bomb list
      10 // Land size
    ),
    new Renderer()
  ),
  "impossible": new Game(
    new gameInfo(
      30, // Rows
      30, // Cols
      0, // Bombs left
      1, // Lives
      0, // Bombs revealed
      0, // Timer
      [], // Virus popups
      null, // Run interval
      null, // Timer interval
      "impossible", // Difficulty
      true, // Info cards on
      0, // Clicks
      false, // Controls reversed
      "normal", // Current gamemode
      true, // Should be dark on dark gamemode
      1, // Bomb multiplier
      0.35, // Bomb ratio
      0.95, // Special bomb ratio
      5, // Sonar bomb amount
      3, // Smoke bomb amount
      5, // Cluster bomb amount
      5, // Spread bomb amount
      16, // Glitch bomb amount
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "ghost", "friendly", "smoke", "two_bomb", "nuke", "bomb_half_bomb", "virus", "glitch_bomb", "spread", "reverse", "random", "medic", "antimatter_bomb"], // Bomb list
      10 // Land size
    ),
    new Renderer()
  ),
  "easy": new Game(
    new gameInfo(
      13,
      13,
      0,
      3,
      0,
      0,
      [],
      null,
      null,
      "easy",
      true,
      0,
      false,
      "normal",
      true,
      1,
      0.125,
      0.5,
      1,
      1,
      1,
      1,
      2,
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "smoke", "ghost", "reverse", "antimatter_bomb"],
      10
    ), new Renderer()
  ),
  "hard": new Game(
    new gameInfo(
      20,
      20,
      0,
      2,
      0,
      0,
      [],
      null,
      null,
      "hard",
      true,
      0,
      false,
      "normal",
      true,
      1,
      0.175,
      0.575,
      2,
      2,
      2,
      2,
      4,
      ["bomb", "half_bomb", "sonar", "flag_bomb", "cluster", "ghost", "friendly", "smoke", "two_bomb", "nuke", "bomb_half_bomb", "virus", "glitch_bomb", "spread", "reverse", "random", "medic", "antimatter_bomb"],
      10
    ), new Renderer()
  )
}
let customPresetGame = gamePresets["beginner"];
function getInfo(preset) {
  return structuredClone(gamePresets[preset].info);
}
function getGameFromPreset(preset) {
  const base = preset === "custom" ? customPresetGame : gamePresets[preset];
  if (!base) throw new Error(`Unknown preset: ${preset}`);
  const clonedInfo = structuredClone(base.info);
  const clonedRenderer = new Renderer();
  return new Game(new gameInfo(...Object.values(clonedInfo)), clonedRenderer);
}
function getGameFromPresetToRogueLike(preset) {
  const game = getGameFromPreset(preset);
  return new roguelikeGame(game.info, game.renderer);
}
function createUltimateGame(difficulty) {
  let game = getGameFromPreset(difficulty);
  game.info.bombList = ["ultimate"];
  game.info.specialBombRatio = 1;
  game.info.currentGamemode = "ultimate";
  return game;
}
function createDarkGame(difficulty) {
  let game = getGameFromPreset(difficulty);
  game.info.currentGamemode = "dark";
  return game;
}
