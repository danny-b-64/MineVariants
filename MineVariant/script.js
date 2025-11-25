// Buttons
const beginnerButton = document.getElementById('beginnerButton');
const easyButton = document.getElementById('easyButton');
const intermediateButton = document.getElementById('intermediateButton');
const hardButton = document.getElementById('hardButton');
const expertButton = document.getElementById('expertButton');
const extremeButton = document.getElementById('extremeButton');
const impossibleButton = document.getElementById('impossibleButton');
const customButton = document.getElementById('customButton');
const resetButton = document.getElementById('resetButton');
const showButton = document.getElementById('showButton');
const bombRevealButton = document.getElementById('bombRevealButton');
const toggleInfoCardsButton = document.getElementById('toggleInfoCardsButton');
const endGameClosePopup = document.getElementById("gameEndClosePopup");
const gamemodeSelector = document.getElementById("gamemode");
const gamemodeButton = document.getElementById("gamemodeButton");
const modifierViewButton = document.getElementById("viewModifiersButton");
const setModifiersButton = document.getElementById("setModifiersButton");

// Inputs
const gameSizeInput = document.getElementById("gameSize");
const txtPackInput = document.getElementById("txtPack");

// Roguelike
const rogueLikePopup = document.getElementById("roguelikePopup");
const rogueLikeOption1Name = document.getElementById("rogueLikeOption1Name");
const rogueLikeOption1Desc = document.getElementById("rogueLikeOption1Desc");
const rogueLikeOption1Button = document.getElementById("rogueLikeOption1Button");
const rogueLikeOption2Name = document.getElementById("rogueLikeOption2Name");
const rogueLikeOption2Desc = document.getElementById("rogueLikeOption2Desc");
const rogueLikeOption2Button = document.getElementById("rogueLikeOption2Button");
const rogueLikeOption1Div = document.getElementById("rogueLikeOption1");
const rogueLikeOption2Div = document.getElementById("rogueLikeOption2");

// Text
const bombsText = document.getElementById('bombsGame');
const timerText = document.getElementById('timerGame');
const livesText = document.getElementById('livesGame');
const bombsRevealedText = document.getElementById('bombsRevealedGame');
const tooltip = document.getElementById("infoTooltip");

// Game variables
let currentGame = null;
let mouseX = 0;
let mouseY = 0;

// Base functions
function findCellWithAttribute(attr, val) {
  let matches = [];
  for (let i = 0; i < currentGame.info.rows; i++) {
    for (let j = 0; j < currentGame.info.cols; j++) {
      if (currentGame.grid[i][j].info[attr] === val) {
        matches.push(currentGame.grid[i][j]);
      }
    }
  }
  if (matches.length === 0) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}
function numToGridSpot(num) {
  return Math.floor((num) / cellSize);
}
function revealBombs(amount, rows, cols) {
  let amountRevealed = 0;
  for (let i = 0; i < amount; i++) {
    let cell = null;
    let safety = 0;
    do {
      cell = findCellWithAttribute("isBomb", true);
      safety += 1;
      if (safety > rows * cols) break;
    } while (cell && (cell.info.isFlagged || cell.info.isClicked || cell.info.isRevealed));
    if (cell && !cell.info.isRevealed && !cell.info.isFlagged && !cell.info.isClicked) {
      amountRevealed += 1;
      cell.info.isRevealed = true;
    }
  }
  if (amountRevealed > 0) {
    playSound("sonar.mp3", 0.75);
  }
  return amountRevealed;
}
function smokeBombs(amount, rows, cols) {
  for (let i = 0; i < amount; i++) {
    let cell = null;
    let safety = 0;
    do {
      cell = findCellWithAttribute("isBomb", false);
      safety += 1;
      if (safety > rows * cols) break;
    } while (cell && !cell.info.isClicked && cell.info.isSmoked && cell.type === "blank");
    if (cell && cell.info.isClicked && !cell.info.isSmoked && !(cell.type === "blank")) {
      cell.info.isSmoked = true;
    }
  }
}
function spreadBombs(amount, rows, cols, useType) {
  for (let i = 0; i < amount; i++) {
    let cell = null;
    let safety = 0;
    do {
      cell = findCellWithAttribute("isBomb", true);
      safety += 1;
      if (safety > rows * cols) break;
    } while (cell && (cell.info.isFlagged || cell.info.isClicked || cell.info.isRevealed))
    if (cell && !cell.info.isRevealed && !cell.info.isFlagged && !cell.info.isClicked) {
      cell = new bombClassList[useType](cell.x, cell.y);  
    }
  }
}
function spawnVirusPopups(amount) {
  for (let i = 0; i < amount; i++) {
    const leftBoundary = currentGame.info.cols * cellSize;
    const bottomBoundary = currentGame.info.rows * cellSize;
    const newX = Math.random() * leftBoundary;
    const newY = Math.random() * bottomBoundary;
    const newWidth = Math.random() * 200;
    const newHeight = Math.random() * 200;
    const newPopup = new VirusPopup(newX, newY, currentGame.info.virusPopups.length, newWidth, newHeight);
    currentGame.info.virusPopups.push(newPopup);
  }
}

// Game functions
function startGame(gameType) {
  try {
    currentGame.endTimer();
    currentGame.endRun();
  } catch {}
  currentGame = null; 
  currentGame = getGameFromPreset(gameType);
  currentGame.init();
  currentGame.startRun();
}
startGame("beginner");

console.log("Game started");

// Button listeners
beginnerButton.addEventListener('click', () => {
  startGame("beginner");
});
easyButton.addEventListener("click", () => {
  startGame("easy");
});
intermediateButton.addEventListener('click', () => {
  startGame("intermediate");
});
hardButton.addEventListener("click", () => {
  startGame("hard");
});
expertButton.addEventListener('click', () => {
  startGame("expert");
});
extremeButton.addEventListener('click', () => {
  startGame("extreme");
});
impossibleButton.addEventListener('click', () => {
  startGame("impossible");
});
resetButton.addEventListener('click', () => {
  if (currentGame instanceof roguelikeGame) {
    try {
      currentGame.endTimer();
      currentGame.endRun();
    } catch {}
    currentGame = null;
    currentGame = new roguelikeGame(getInfo("beginner"), new Renderer());
    currentGame.init();
    currentGame.startRun();
  } else if (currentGame.info.difficulty === "custom") {
    try {
      currentGame.endTimer();
      currentGame.endRun();
    } catch {}
    currentGame = null;
    currentGame = getGameFromPreset("custom");
    currentGame.init();
    currentGame.startRun();
  } else {
    currentGame.endTimer();
    currentGame.endRun();
    currentGame.init();
    currentGame.startRun();
  }
});
showButton.addEventListener('click', () => {
  if (!currentGame.running) return;
  currentGame.giveUp();
  currentGame.endedGame("gave up", 0);
})
bombRevealButton.addEventListener('click', () => {
  if (!currentGame.running) return;
  let bombsRevealedCount = revealBombs(1, currentGame.info.rows, currentGame.info.cols);
  if (bombsRevealedCount !== 0) {
    currentGame.info.bombsRevealed += bombsRevealedCount;
  }
})
toggleInfoCardsButton.addEventListener('click', () => {
  currentGame.info.infoCardsOn = !currentGame.info.infoCardsOn;
  toggleInfoCardsButton.innerHTML = currentGame.info.infoCardsOn ? "Turn info cards off" : "Turn info cards on";
})
txtPackInput.addEventListener("change", () => {
  currentGame.endRun();
  currentGame.endTimer();
  currentTexturePack = txtPackInput.value;
  loadTextures();
  startGame(currentGame.info.difficulty);
})

// Event listeners
const toolTipInfo = getBombInfo();  
canvas.addEventListener("mousemove", (event) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;

  const boardX = numToGridSpot(mouseX);
  const boardY = numToGridSpot(mouseY);
  if (!currentGame.isInRange(boardX, boardY)) {
    tooltip.style.display = "none";
    return;
  }
  const cell = currentGame.grid[boardY][boardX];
  if (currentGame.info.infoCardsOn && cell.info.isBomb && (cell.info.isClicked || cell.info.isRevealed) && !cell.info.isFlagged && !(cell.type === "virus")) {
    let textColor = cell.info.isRevealed ? "#000000" : "#ffffff";
    let info = cell.info.isRevealed ? toolTipInfo["shown_bomb"] : toolTipInfo[cell.type];
    if (cell instanceof deadlyGhostBomb) {
      info = bombInfo["deadly_ghost"];
    }
    tooltip.style.color = textColor;
    tooltip.innerText = info?.desc || "Unknown";
    tooltip.style.backgroundColor = info?.bgcolor || "#333";
    tooltip.style.borderColor = info?.outline || "#000";
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = rect.left + window.scrollX + mouseX + 15 + "px";
    tooltip.style.top = rect.top + window.scrollY + mouseY + 15 + "px";
    tooltip.style.display = "block";
  } else {
    tooltip.style.display = "none";
  }
})

canvas.addEventListener("click", () => {
  currentGame.clickAtRelativePos(mouseX, mouseY);
})
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    currentGame.flagAtRelativePos(mouseX, mouseY);
  }
})
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault(); 
  currentGame.flagAtRelativePos(mouseX, mouseY);
});

endGameClosePopup.addEventListener("click", () => {
  endGamePopup.style.display = "none";
})

gameSizeInput.addEventListener("change", () => {
  cellSize = parseInt(gameSizeInput.value);
})

function startWithGamemodeInMind(gamemode) {
  const currDiff = currentGame.info.difficulty;
  switch (gamemode) {
    case "normal":
      startGame(currentGame.info.difficulty);
      currentGame.info.currentGamemode = "normal";
      break;
    case "dark":
      try {
        currentGame.endTimer();
        currentGame.endRun();
      } catch {}
      currentGame = null; 
      currentGame = createDarkGame(currDiff);
      currentGame.init();
      currentGame.startRun();
      break;
    case "ultimate":
      try {
        currentGame.endTimer();
        currentGame.endRun();
      } catch {}
      currentGame = null; 
      currentGame = createUltimateGame(currDiff);
      currentGame.init();
      currentGame.startRun();
      break;
    case "roguelike":
      try {
        currentGame.endTimer();
        currentGame.endRun();
      } catch {}
      currentGame = null;
      currentGame = new roguelikeGame(getInfo("beginner"), new Renderer());
      currentGame.init();
      currentGame.startRun();
  }
}

gamemodeButton.addEventListener("click", () => {
  startWithGamemodeInMind(gamemodeSelector.value);
})

// Custom
const customPopup = document.getElementById("customPopup");
const customPopupClose = document.getElementById("customClosePopup");

const customRows = document.getElementById("customRows");
const customCols = document.getElementById("customCols");
const customLives = document.getElementById("customLives");
const customBombRatio = document.getElementById("customBombRatio");
const customSpecialBombRatio = document.getElementById("customSpecialBombRatio");
const customSonarAmount = document.getElementById("customSonarAmount");
const customSmokeAmount = document.getElementById("customSmokeAmount");
const customClusterAmount = document.getElementById("customClusterAmount");
const customSpreadAmount = document.getElementById("customSpreadAmount");
const customGlitchAmount = document.getElementById("customGlitchAmount");

const customHasHalfBomb = document.getElementById("customHasHalfBomb");
const customHasSonar = document.getElementById("customHasSonar");
const customHasFlagBomb = document.getElementById("customHasFlagBomb");
const customHasGhost = document.getElementById("customHasGhost");
const customHasFriendly = document.getElementById("customHasFriendly");
const customHasBombHalfBomb = document.getElementById("customHasBombHalfBomb");
const customHasSmoke = document.getElementById("customHasSmoke");
const customHasCluster = document.getElementById("customHasCluster");
const customHasNuke = document.getElementById("customHasNuke");
const customHasTwoBomb = document.getElementById("customHasTwoBomb");
const customHasGlitchBomb = document.getElementById("customHasGlitchBomb");
const customHasSpread = document.getElementById("customHasSpread");
const customHasVirus = document.getElementById("customHasVirus");
const customHasReverse = document.getElementById("customHasReverse");
const customHasRandom = document.getElementById("customHasRandom");
const customHasUltimate = document.getElementById("customHasUltimate");
const customHasMedic = document.getElementById("customHasMedic");
const customLandSize = document.getElementById("customLandSize");
const customHasAntimatter = document.getElementById("customHasAntimatter");

const customStartButton = document.getElementById("customStartButton");

customButton.addEventListener("click", () => {
  customPopup.style.display = "block";
})
customPopupClose.addEventListener("click", () => {
  customPopup.style.display = "none";
})
customStartButton.onclick = () => {
  let C_bombRatio = parseFloat(customBombRatio.value) / 100;
  let C_specialBombRatio = parseFloat(customSpecialBombRatio.value) / 100;
  let C_bombList = [];
  if (customHasHalfBomb.checked) C_bombList.push("half_bomb");
  if (customHasSonar.checked) C_bombList.push("sonar");
  if (customHasFlagBomb.checked) C_bombList.push("flag_bomb");
  if (customHasGhost.checked) C_bombList.push("ghost");
  if (customHasFriendly.checked) C_bombList.push("friendly");
  if (customHasBombHalfBomb.checked) C_bombList.push("bomb_half_bomb");
  if (customHasSmoke.checked) C_bombList.push("smoke");
  if (customHasCluster.checked) C_bombList.push("cluster");
  if (customHasNuke.checked) C_bombList.push("nuke");
  if (customHasTwoBomb.checked) C_bombList.push("two_bomb");
  if (customHasGlitchBomb.checked) C_bombList.push("glitch_bomb");
  if (customHasSpread.checked) C_bombList.push("spread");
  if (customHasVirus.checked) C_bombList.push("virus");
  if (customHasReverse.checked) C_bombList.push("reverse");
  if (customHasRandom.checked) C_bombList.push("random");
  if (customHasUltimate.checked) C_bombList.push("ultimate");
  if (customHasMedic.checked) C_bombList.push("medic");
  if (customHasAntimatter.checked) C_bombList.push("antimatter_bomb");

  if (C_bombList.length === 0) {
    C_bombList = ["bomb"];
  }

  let C_rows = parseInt(customRows.value, 10) || 10;
  let C_cols = parseInt(customCols.value, 10) || 10;
  let C_sonarBombAmount = parseInt(customSonarAmount.value, 10) || 1;
  let C_smokeBombAmount = parseInt(customSmokeAmount.value, 10) || 1;
  let C_clusterBombAmount = parseInt(customClusterAmount.value, 10) || 1;
  let C_spreadBombAmount = parseInt(customSpreadAmount.value, 10) || 1;
  let C_glitchBombAmount = parseInt(customGlitchAmount.value, 10) || 1;
  let C_maxLives = parseInt(customLives.value, 10) || 3;
  let C_landSize = parseInt(customLandSize.value, 10) || 10;

  try {
    currentGame.endTimer();
    currentGame.endRun();
  } catch {}
  currentGame = null; 
  currentGame = new Game(new gameInfo(
    C_rows,
    C_cols,
    0,
    C_maxLives,
    0,
    0,
    [],
    null,
    null,
    "custom",
    true,
    0,
    false,
    "normal",
    true,
    1,
    C_bombRatio,
    C_specialBombRatio,
    C_sonarBombAmount,
    C_smokeBombAmount,
    C_clusterBombAmount,
    C_spreadBombAmount,
    C_glitchBombAmount,
    C_bombList,
    C_landSize
  ), new Renderer());
  customPresetGame = new Game(new gameInfo(
    C_rows,
    C_cols,
    0,
    C_maxLives,
    0,
    0,
    [],
    null,
    null,
    "custom",
    true,
    0,
    false,
    "normal",
    true,
    1,
    C_bombRatio,
    C_specialBombRatio,
    C_sonarBombAmount,
    C_smokeBombAmount,
    C_clusterBombAmount,
    C_spreadBombAmount,
    C_glitchBombAmount,
    C_bombList,
    C_landSize
  ), new Renderer());;
  currentGame.init();
  currentGame.startRun();
  customPopup.style.display = "none";
}

// Modifiers
const modifiersPopup = document.getElementById("modifierPopup");
const closeModifiersButton = document.getElementById("modifiersClose");

const M_live = document.getElementById("m_life_active");
const M_bomb = document.getElementById("m_bomb_active");
const M_precision = document.getElementById("m_precision_active");
const M_overload = document.getElementById("m_overload_active");
const M_suddendeath = document.getElementById("m_suddendeath_active");
const M_radar = document.getElementById("m_radar_active");
const M_camo = document.getElementById("m_camo_active");
const M_binded = document.getElementById("m_binded_active");
const M_sandbox = document.getElementById("m_sandbox_active");
const M_echo = document.getElementById("m_echo_active");
const M_reverse = document.getElementById("m_reverse_active");
const M_blink = document.getElementById("m_blink_active");

modifierViewButton.onclick = () => {
  modifiersPopup.style.display = "block";
}
closeModifiersButton.onclick = () => {
  modifiersPopup.style.display = "none";
}

setModifiersButton.onclick = () => {
  // Init
  modifiers = {
    "scoreMultiplier": 1,
    "livesIncrease": 0,
    "bombMultiplier": 1,
    "percise": false,
    "suddenDeath": false,
    "radar": false,
    "camo": false,
    "binded": false,
    "sandbox": false,
    "echo": false,
    "reversed": false,
    "blink": false
  }
  activeModifiers = {};
  // Lives
  modifiers.livesIncrease += M_live.checked ? 1 : 0;
  modifiers.scoreMultiplier *= M_live.checked ? 0.9 : 1;
  activeModifiers.lives = M_live.checked ? {"class": "green", "name": "Lifeforce"} : 0;
  // Bomb
  modifiers.bombMultiplier *= M_bomb.checked ? 1.25 : 1;
  modifiers.scoreMultiplier *= M_bomb.checked ? 1.1 : 1;
  activeModifiers.bombs = M_bomb.checked ? {"class": "red", "name": "Bombardment"} : 0;
  // Precision
  modifiers.percise = M_precision.checked;
  modifiers.scoreMultiplier *= M_precision.checked ? 1.5 : 1; 
  activeModifiers.percise = M_precision.checked ? {"class": "red", "name": "Percision"} : 0;
  // Overload
  modifiers.bombMultiplier *= M_overload.checked ? 1.55 : 1;
  modifiers.scoreMultiplier *= M_overload.checked ? 1.3 : 1;
  activeModifiers.overload = M_overload.checked ? {"class": "red", "name": "Overload"} : 0;
  // Sandbox
  modifiers.sandbox = M_sandbox.checked;
  modifiers.scoreMultiplier *= M_sandbox.checked ? 0 : 1;
  activeModifiers.sandbox = M_sandbox.checked ? {"class": "green", "name": "Sandbox"} : 0;
  // Sudden death
  modifiers.suddenDeath = M_suddendeath.checked;
  if (M_sandbox.checked) {
    activeModifiers.suddendeath = M_suddendeath.checked ? {"class": "red", "name": "Sudden Death", "canceled": "Sandbox"} : 0;
  } else {
    modifiers.scoreMultiplier *= M_suddendeath.checked ? 2 : 1;
    activeModifiers.suddendeath = M_suddendeath.checked ? {"class": "red", "name": "Sudden Death"} : 0;
  }
  // Radar
  modifiers.radar = M_radar.checked;
  modifiers.scoreMultiplier *= M_radar.checked ? 0.75 : 1;
  activeModifiers.radar = M_radar.checked ? {"class": "green", "name": "Radar"} : 0;
  // Camouflage
  modifiers.camo = M_camo.checked;
  modifiers.scoreMultiplier *= M_camo.checked ? 1.25 : 1;
  activeModifiers.camo = M_camo.checked ? {"class": "red", "name": "Camouflage"} : 0;
  // Binded
  modifiers.binded = M_binded.checked;
  if (M_precision.checked) {
    activeModifiers.binded = M_binded.checked ? {"class": "red", "name": "Binded", "canceled": "Precision"} : 0;
  } else {
    modifiers.scoreMultiplier *= M_binded.checked ? 1.4 : 1;
    activeModifiers.binded = M_binded.checked ? {"class": "red", "name": "Binded"} : 0;
  }
  // Echo
  modifiers.echo = M_echo.checked;
  modifiers.scoreMultiplier *= M_echo.checked ? 0.7 : 1;
  activeModifiers.echo = M_echo.checked ? {"class": "green", "name": "Echo"} : 0;
  // Reverse
  modifiers.reversed = M_reverse.checked;
  if (M_camo.checked) {
    activeModifiers.reversed = M_reverse.checked ? {"class": "red", "name": "Reverse", "canceled": "Camouflage"} : 0;
  } else {
    modifiers.scoreMultiplier *= M_reverse.checked ? 1.15 : 1;
    activeModifiers.reversed = M_reverse.checked ? {"class": "red", "name": "Reverse"} : 0;
  }
  // Blink
  modifiers.blink = M_blink.checked;
  modifiers.scoreMultiplier *= M_blink.checked ? 1.35 : 1;
  activeModifiers.blink = M_blink.checked ? {"class": "red", "name": "Blink"} : 0;
  // Fix
  modifiers.scoreMultiplier = modifiers.scoreMultiplier.toFixed(2);
  // Start
  startWithGamemodeInMind(currentGame.info.currentGamemode);
  modifiersPopup.style.display = "none";
}
document.addEventListener('click', () => {
  startMusic(currentMusic);
  canPlayMusic = true;
}, { once: true });



