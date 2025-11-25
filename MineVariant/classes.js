// Canvas
const canvas = document.getElementById('canvasGame');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');

// Popups
const endGamePopup = document.getElementById("gameEndPopup");
const endGamePopupTitle = document.getElementById("gameEndPopupTitle");
const endGamePopupList = document.getElementById("gameEndPopupList");
const endGameScore = document.getElementById("gameEndPopupScore");

let modifiers = {
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
};
let activeModifiers = {}

let canPlayMusic = false;
let canApplyFX = false;

// Holds all cell classes
const bombTypeToDamage = { // This is loaded from data.js as classes.js comes before
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

class cellInfo {
  constructor(isBomb, isClicked, isFlagged, isSmoked, isRevealed, damage) {
    this.isBomb = isBomb;
    this.isClicked = isClicked;
    this.isFlagged = isFlagged;
    this.isSmoked = isSmoked;
    this.isRevealed = isRevealed;
    this.damage = damage;
  }
}

class Echo {
  constructor(x, y, size) {
    this.size = size;
    this.x = x;
    this.y = y;
    setInterval(() => {
      this.size += 5;
    }, 1000/60)
    playSound("sonar.mp3");
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI); 
    ctx.strokeStyle = 'green'; 
    ctx.lineWidth = 3;      
    ctx.stroke();       
  }
}

class Cell {
  constructor(x, y, type, info) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.info = info;
  }
  click() {
    if (this.info.isFlagged) return;
    if (this.info.isRevealed) return;
    if (this.info.isClicked) return;
    this.info.isClicked = true;
    if (!this.info.isBomb) {
      playSound("click.mp3");
    }
    if (currentGame.info.clicks === 0) {
      currentGame.info.beginningLandRecursiveCount = 0;
      currentGame.createBeginningLand(this.x, this.y);
      // "Create" new cell as blank
      this.type == "blank";
      this.info = new cellInfo(false, false, false, false, false, 0);
      currentGame.setNumbers();
    }
    currentGame.info.clicks++;
    if (modifiers.suddenDeath) {
      currentGame.suddenDeathTimer = 4;
    }
    if (this.type === "blank") {
      currentGame.fillFromBlank(this.x, this.y, true);
    }
  }
  flag() {
    if (this.info.isClicked) return;
    this.info.isFlagged = !this.info.isFlagged;
    playSound("flag.mp3");
  }
}

class Renderer {
  constructor() {
    this.game = 0;
    console.log("Renderer made");
  }
  abstractDrawCell(x, y, type, color, bombCount) {
    if (modifiers.camo && bombCount !== -1) {
      ctx.fillStyle = this.numberToColor(bombCount);
      ctx.fillRect(x, y, cellSize, cellSize);
      return;
    }
    if (color !== 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);
    } else {
      ctx.drawImage(textures[type], x, y, cellSize, cellSize);
    }
  }
  drawCell(x, y, type, bombCount) {
    try {
      if (modifiers.blink && !this.game.blinkOn) type = "question_mark";
      if (this.game.info.currentGamemode === "dark" && this.game.info.shouldBeDarkOnDarkGamemode) {
        const gridX = numToGridSpot(x);
        const gridY = numToGridSpot(y);
        const mouseGridX = numToGridSpot(mouseX);
        const mouseGridY = numToGridSpot(mouseY);
        const distance = Math.sqrt(Math.pow(gridX - mouseGridX, 2) + Math.pow(gridY - mouseGridY, 2));
        if (distance <= 1) {
          this.abstractDrawCell(x, y, type, 0, bombCount);
        } else {
          this.abstractDrawCell(x, y, 0, "#000", bombCount);
        }
      } else {
        this.abstractDrawCell(x, y, type, 0, bombCount);
      }
    } catch {
      console.error("Cell that errored: " + JSON.stringify(this.game.grid[numToGridSpot(y)][numToGridSpot(x)]));
      this.game.endRun();
    }
  }
  drawVirusPopups() {
    if (this.game === undefined) return;
    for (let i = 0; i < this.game.info.virusPopups.length; i++) {
      const popup = this.game.info.virusPopups[i];
      ctx.drawImage(textures["glitched"], popup.x, popup.y, popup.width, popup.height);
    }
  }
  drawGrid() {
    const numReversed = {
      "one": "eight",
      "two": "seven",
      "three": "six",
      "four": "five",
      "five": "four",
      "six": "three",
      "seven": "two",
      "eight": "one"
    }
    if (this.game === undefined) return;
    for (let i = 0; i < this.game.info.rows; i++) {
      for (let j = 0; j < this.game.info.cols; j++) {
        let bombCount = -1;
        const cell = this.game.grid[i][j];
        if (modifiers.camo && !cell.info.isBomb) {
          const neighbors = this.game.getNeighbors(j, i)
          bombCount = neighbors.filter(cell => cell.info.isBomb).length;
        }
        if (this.game.renderAllAsRevealed && cell.info.isBomb) {
          this.drawCell(j * cellSize, i * cellSize, "shown_bomb", -1);
          continue;
        }
        if (cell.info.isFlagged) {this.drawCell(j * cellSize, i * cellSize, "flagged", -1); continue;}
        if (cell.info.isBomb && cell.info.isRevealed) {this.drawCell(j * cellSize, i * cellSize, "shown_bomb", -1); continue;}
        if (cell.info.isClicked) {
          if (cell.info.isSmoked) {this.drawCell(j * cellSize, i * cellSize, "question_mark", -1); continue;}
          if (!cell.info.isBomb && modifiers.reversed && cell.type !== "blank") {
            this.drawCell(j * cellSize, i * cellSize, numReversed[cell.type], bombCount);
            continue;
          }
          this.drawCell(j * cellSize, i * cellSize, cell.type, bombCount);
        } else {
          this.drawCell(j * cellSize, i * cellSize, "unclicked", -1);
        }
      }
    }
  }
  numberToColor(value) {
    const colors = [
      "#ffffffff", // 1 
      "#b8b8b8ff", // 2 
      "#7a7a7aff", // 3 
      "#505050ff", // 4 
      "#383838ff", // 5 
      "#222222ff", // 6 
      "#111111ff", // 7 
      "#000000ff"  // 8 
    ];
    value = Math.max(1, Math.min(8, value));
    const t = (value - 1) / (colors.length - 1);

    const index = Math.floor(t * (colors.length - 1));
    const nextIndex = Math.min(index + 1, colors.length - 1);
    const mix = (t * (colors.length - 1)) % 1;

    function mixColors(c1, c2, ratio) {
      const r = Math.round(parseInt(c1.slice(1, 3), 16) * (1 - ratio) + parseInt(c2.slice(1, 3), 16) * ratio);
      const g = Math.round(parseInt(c1.slice(3, 5), 16) * (1 - ratio) + parseInt(c2.slice(3, 5), 16) * ratio);
      const b = Math.round(parseInt(c1.slice(5, 7), 16) * (1 - ratio) + parseInt(c2.slice(5, 7), 16) * ratio);
      return `rgb(${r},${g},${b})`;
    }

    return mixColors(colors[index], colors[nextIndex], mix);
  }
}

class gameInfo {
  constructor(rows, cols, bombsLeft, lives, bombsRevealed, timer, virusPopups, runInterval, timerInterval, difficulty, infoCardsOn, clicks, controlsReversed, currentGamemode, shouldBeDarkOnDarkGamemode, bombMultiplier, bombRatio, specialBombRatio, sonarBombAmount, smokeBombAmount, clusterBombAmount, spreadBombAmount, glitchBombAmount, bombList, landSize) {
    this.rows = rows;
    this.cols = cols;
    this.bombsLeft = bombsLeft;
    this.lives = lives + modifiers.livesIncrease;
    this.bombsRevealed = bombsRevealed;
    this.timer = timer;
    this.virusPopups = virusPopups;
    this.runInterval = runInterval;
    this.timerInterval = timerInterval;
    this.difficulty = difficulty;
    this.infoCardsOn = infoCardsOn;
    this.clicks = clicks;
    this.controlsReversed = controlsReversed;
    this.currentGamemode = currentGamemode;
    this.shouldBeDarkOnDarkGamemode = shouldBeDarkOnDarkGamemode;
    this.bombMultiplier = bombMultiplier;
    this.bombRatio = bombRatio;
    this.specialBombRatio = specialBombRatio;
    this.sonarBombAmount = sonarBombAmount;
    this.smokeBombAmount = smokeBombAmount;
    this.clusterBombAmount = clusterBombAmount;
    this.spreadBombAmount = spreadBombAmount;
    this.glitchBombAmount = glitchBombAmount;
    this.bombList = bombList;
    this.landSize = landSize;
    this.maxLives = this.lives;
    this.echoes = [];
  }
}

class Game {
  constructor(info, renderer) {
    this.grid = [];
    this.info = info;
    this.renderer = renderer;
    this.renderer.game = this;
    this.beginningLandRecursiveCount = 0;
    this.renderAllAsRevealed = false;
    this.running = false;
    this.suddenDeathTimer = 0;
    this.suddenDeathInterval = null;
    this.radarTimer = 0;
    this.radarInterval = null;
    this.radarRevealed = 0;
    this.blinkTimer = 0;
    this.blinkInterval = null;
    this.blinkOn = false;
  }
  isInRange(x, y) {
    return x >= 0 && x < this.info.cols && y >= 0 && y < this.info.rows;
  }
  getNeighbors(x, y) {
    let neighbors = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (j === 0 && i === 0) continue;
        let newX = x + j;
        let newY = y + i;
        if (this.isInRange(newX, newY)) {
          neighbors.push(this.grid[newY][newX]);
        }
      }
    }
    return neighbors;
  }
  setNumbers() {
    for (let i = 0; i < this.info.rows; i++) {
      for (let j = 0; j < this.info.cols; j++) {
        if (this.grid[i][j].info.isBomb) continue;
        const neighbors = this.getNeighbors(j, i);
        const bombCount = neighbors.filter(cell => cell.info.isBomb).length;
        switch (bombCount) {
          case 0:
            this.grid[i][j] = new Cell(j, i, "blank", new cellInfo(false, false, false, false, false, 0));
            break;
          case 1:
            this.grid[i][j] = new Cell(j, i, "one", new cellInfo(false, false, false, false, false, 0));
            break;
          case 2:
            this.grid[i][j] = new Cell(j, i, "two", new cellInfo(false, false, false, false, false, 0));
            break;
          case 3:
            this.grid[i][j] = new Cell(j, i, "three", new cellInfo(false, false, false, false, false, 0));
            break;
          case 4:
            this.grid[i][j] = new Cell(j, i, "four", new cellInfo(false, false, false, false, false, 0));
            break;
          case 5:
            this.grid[i][j] = new Cell(j, i, "five", new cellInfo(false, false, false, false, false, 0));
            break;
          case 6:
            this.grid[i][j] = new Cell(j, i, "six", new cellInfo(false, false, false, false, false, 0));
            break;
          case 7:
            this.grid[i][j] = new Cell(j, i, "seven", new cellInfo(false, false, false, false, false, 0));
            break;
          case 8:
            this.grid[i][j] = new Cell(j, i, "eight", new cellInfo(false, false, false, false, false, 0));
            break;
          default:
            this.grid[i][j] = new Cell(j, i, "blank", new cellInfo(false, false, false, false, false, 0));
            break;
        }
      }
    }
  }
  setSpecialBombs(ratio, bombList) {
    const allBombs = this.grid.flat().filter(cell => cell.info.isBomb);
    for (let i = 0; i < allBombs.length; i++) {
      if (Math.random() <= ratio) {
        const bomb = allBombs[i];
        const newType = bombList[Math.floor(Math.random() * bombList.length)];
        this.grid[bomb.y][bomb.x] = new bombClassList[newType](bomb.x, bomb.y);
      }
    }
  }
  setBombs(ratio) {
    for (let i = 0; i < this.info.rows; i++) {
      for (let j = 0; j < this.info.cols; j++) {
        if (Math.random() <= (ratio * modifiers.bombMultiplier)) {
          this.grid[i][j] = new bombClassList["bomb"](j, i);
        }
      }
    }
  }
  init() {
    // Play music
    const diffToMusic = {
      "beginner": "sound/click-and-flag.mp3",
      "easy": "sound/click-and-flag.mp3",
      "intermediate": "sound/bomba-sweepin.mp3",
      "hard": "sound/bomba-sweepin.mp3",
      "expert": "sound/bomba-sweepin.mp3",
      "extreme": "sound/eagle-eye.mp3",
      "impossible": "sound/eagle-eye.mp3",
      "custom": "sound/bomba-sweepin.mp3"
    }
    if (canPlayMusic && currentMusic !== diffToMusic[this.info.difficulty]) {
      currentMusic = diffToMusic[this.info.difficulty];
      stopMusic();
      startMusic(currentMusic);
    }
    // Init grid
    this.grid = [];
    this.info.bombsLeft = 0;
    this.renderAllAsRevealed = false;
    this.info.lives = this.info.maxLives;
    for (let i = 0; i < this.info.rows; i++) {
      this.grid.push([]);
      let row = this.grid[i];
      for (let j = 0; j < this.info.cols; j++) {
        row.push(new Cell(j, i, "blank", new cellInfo(false, false, false, false, false, 0)));
      }
    }
    // Set bombs
    this.setBombs(this.info.bombRatio);
    this.setSpecialBombs(this.info.specialBombRatio, this.info.bombList);
    this.info.bombsLeft = this.grid.flat().filter(cell => cell.info.isBomb).length;
    // Set numbers
    this.setNumbers();
    // Reset relevant info
    this.info.bombsRevealed = 0;
    this.info.clicks = 0;
    this.info.controlsReversed = false;
    this.info.shouldBeDarkOnDarkGamemode = true;
    this.info.virusPopups = [];
    this.info.inRogueLikeMode = false;
    this.info.timer = 0;
    this.info.radarTimer = 0;
    this.info.suddenDeathTimer = 0;
    this.info.echoes = [];
    this.radarRevealed = 0;
    this.blinkTimer = 0;
    // Start timer
    this.startTimer();
  }
  startTimer() {
    this.info.timerInterval = setInterval(() => {
      this.info.timer += 1;
    }, 1000);
  }
  endTimer() {
    clearInterval(this.info.timerInterval);
  }
  timerToString() {
    const seconds = this.info.timer % 60;
    const minutes = Math.floor(this.info.timer / 60);
    let secondString = seconds.toString();
    let minuteString = minutes.toString();
    if (secondString.length < 2) {
      secondString = "0" + secondString;
    }
    if (minuteString.length < 2) {
      minuteString = "0" + minuteString;
    }
    return minuteString + ":" + secondString;
  }
  checkForWin() {
    for (let i = 0; i < this.info.rows; i++) {
      for (let j = 0; j < this.info.cols; j++) {
        let cell = this.grid[i][j];
        if (!cell.info.isClicked && !cell.info.isBomb) return false;
        if (cell.info.isBomb && !(cell.info.isClicked || cell.info.isFlagged || cell.info.isRevealed)) return false;
      }
    }
    return true;
  }
  run() {
    // Render all cells
    canvas.width = this.info.cols * cellSize;
    canvas.height = this.info.rows * cellSize;
    this.renderer.drawGrid();
    // Render echoes
    if (modifiers.echo) {
      for (let i = 0; i < this.info.echoes.length; i++) {
        const echo = this.info.echoes[i];
        if (echo.size >= 500) {
          this.info.echoes.splice(i, 1);
          i--;
          continue;
        } else {
          echo.draw();
        }
      }
    }
    // Render all popups
    this.renderer.drawVirusPopups();
    // Set timer
    timerText.innerHTML = "Time: " + this.timerToString();
    // Set lives
    livesText.innerHTML = "Lives left: " + (modifiers.sandbox ? "INF" : this.info.lives);
    // Set bombs left
    bombsText.innerHTML = "Bombs left: " + (this.info.bombsLeft - this.info.bombsRevealed - this.radarRevealed);
    // Set bombs revealed
    bombsRevealedText.innerHTML = "Bombs revealed: " + this.info.bombsRevealed;
    // Check for loss/win
    if (this.info.lives <= 0) {
      this.endedGame("lost", 0.5);
    } else if (this.checkForWin()) {
      this.endedGame("won", 1);
    }
    // Modifiers
    if (modifiers.suddenDeath && this.suddenDeathTimer <= 0) {
      this.endedGame("ran out of time", 0);
    }
    if (modifiers.radar && this.radarTimer >= 30) {
      const revealed = revealBombs(2, this.info.rows, this.info.cols);
      this.radarRevealed += revealed;
      this.radarTimer = 0;
    }
    if (modifiers.blink && this.blinkTimer >= 2) {
      this.blinkOn = !this.blinkOn;
      this.blinkTimer = 0;
    }
  }
  startRun() {
    this.info.runInterval = setInterval(() => this.run(), 1000/20);
    if (modifiers.suddenDeath) {
      this.suddenDeathTimer = 4;
      this.suddenDeathInterval = setInterval(() => this.suddenDeathTimer--, 1000);
    }
    if (modifiers.radar) {
      this.radarInterval = setInterval(() => this.radarTimer++, 1000);
    }
    if (modifiers.blink) {
      this.blinkInterval = setInterval(() => this.blinkTimer++, 1000);
    }
    this.running = true;
  }
  endRun() {
    clearInterval(this.info.runInterval);
    if (modifiers.suddenDeath) {
      clearInterval(this.suddenDeathInterval);
    }
    if (modifiers.radar) {
      clearInterval(this.radarInterval);
    }
    this.running = false;
  }
  fillFromBlank(x, y, isFirst) {
    if (!this.isInRange(x, y)) return;
    if (this.grid[y][x].info.isClicked && !isFirst) return;
    if (!isFirst) this.grid[y][x].click();
    if (this.grid[y][x].type === "blank") {
      this.fillFromBlank(x + 1, y, false);
      this.fillFromBlank(x - 1, y, false);
      this.fillFromBlank(x + 1, y + 1, false);
      this.fillFromBlank(x + 1, y - 1, false);
      this.fillFromBlank(x, y + 1, false);
      this.fillFromBlank(x, y - 1, false);
      this.fillFromBlank(x - 1, y + 1, false);
      this.fillFromBlank(x - 1, y - 1, false);
    }
  }
  createBeginningLand(x, y) {
    if (!this.isInRange(x, y)) return;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let newX = x + j;
        let newY = y + i;
        if (this.isInRange(newX, newY)) {
          if (this.grid[newY][newX].info.isBomb) {
            this.info.bombsLeft--;
          }
          this.grid[newY][newX] = new Cell(newX, newY, "blank", new cellInfo(false, false, false, false, false, 0));
        }
      }
      // Update bombs left
      this.info.bombsLeft = this.grid.flat().filter(cell => cell.info.isBomb).length;
    }
    this.beginningLandRecursiveCount++;
    if ((Math.ceil(Math.random() * this.info.landSize) > this.beginningLandRecursiveCount) || (this.beginningLandRecursiveCount <= 2)) {
      this.createBeginningLand(x + 1, y);
      this.createBeginningLand(x - 1, y);
      this.createBeginningLand(x, y + 1);
      this.createBeginningLand(x, y - 1);
    } else {return}
  }
  clickAtRelativePos(x, y) {
    const gridX = numToGridSpot(x);
    const gridY = numToGridSpot(y);
    for (let i = 0; i < this.info.virusPopups.length; i++) {
      let popup = this.info.virusPopups[i];
      if (popup.posInRange(x, y)) {
        this.info.virusPopups.splice(i, 1);
        return;
      }
    }
    if (this.isInRange(gridX, gridY)) {
      if (this.info.controlsReversed) {
        this.grid[gridY][gridX].flag();
      } else {
        this.grid[gridY][gridX].click();
      }
    }
  }
  flagAtRelativePos(x, y) {
    const gridX = numToGridSpot(x);
    const gridY = numToGridSpot(y);
    if (this.isInRange(gridX, gridY)) {
      if (this.info.controlsReversed) {
        this.grid[gridY][gridX].click();
      } else {
        this.grid[gridY][gridX].flag();
      }
    }
  }
  giveUp() {
    for (let i = 0; i < this.info.rows; i++) {
      for (let j = 0; j < this.info.cols; j++) {
        const cell = this.grid[i][j];
        cell.info.isClicked = true;
        cell.info.isFlagged = false;
      }
    }
  }
  getGameScore(multiplier) {
    const sizeFactor = (this.info.rows * this.info.cols) * 2;
    const bombsFactor = (this.grid.flat().filter(cell => cell.info.isBomb).length);
    let revealedFactor = this.info.bombsRevealed;
    const livesFactor = this.info.lives;
    const maxLivesFactor = this.info.maxLives;
    let timerFactor = this.info.timer;
    timerFactor = timerFactor === 0 ? 0.1 : timerFactor;
    revealedFactor = revealedFactor === 0 ? 1 : revealedFactor / 3;
    let baseScore = Math.round(((((sizeFactor * bombsFactor * livesFactor) / revealedFactor) / (maxLivesFactor / 2)) / timerFactor));
    baseScore = Math.round(baseScore * multiplier);
    baseScore = Number.isNaN(baseScore) ? 0 : baseScore;
    return Math.max(Math.round(baseScore * modifiers.scoreMultiplier), 0);
  }
  showGameEndInfo(mult) {
    endGamePopupList.replaceChildren();
    let timerLI = document.createElement("li");
    timerLI.innerHTML = "Time spent: " + this.timerToString();
    endGamePopupList.appendChild(timerLI);
    let bombsRevealedLI = document.createElement("li");
    bombsRevealedLI.innerHTML = "Bombs revealed: " + this.info.bombsRevealed;
    endGamePopupList.appendChild(bombsRevealedLI);
    let livesLI = document.createElement("li");
    livesLI.innerHTML = "Lives left: " + this.info.lives;
    endGamePopupList.appendChild(livesLI);
    let gamemodeLI = document.createElement("li");
    gamemodeLI.innerHTML = "Gamemode: " + this.info.currentGamemode;
    endGamePopupList.appendChild(gamemodeLI);
    let bombCountLI = document.createElement("li");
    bombCountLI.innerHTML = "Final bomb count: " + this.info.bombsLeft;
    endGamePopupList.appendChild(bombCountLI);
    let totalCellsLI = document.createElement("li");
    totalCellsLI.innerHTML = "Total cells: " + (this.info.rows * this.info.cols);
    endGamePopupList.appendChild(totalCellsLI);
    for (const akey in activeModifiers) {
      const key = activeModifiers[akey];
      if (key === 0) continue;
      let newModifierLI = document.createElement("li");
      newModifierLI.innerHTML = key.name;
      if (key.canceled) {
        newModifierLI.innerHTML += " (Canceled by " + key.canceled + ")";
      }
      newModifierLI.classList.add(key.canceled ? "canceled" : key.class);
      endGamePopupList.appendChild(newModifierLI);
    }
    let modifierScoreLI = document.createElement("li");
    modifierScoreLI.innerHTML = "Score multiplier: " + modifiers.scoreMultiplier + "x";
    endGamePopupList.append(modifierScoreLI);
    const endScore = this.getGameScore(mult);
    endGameScore.innerHTML = endScore;
    endGameScore.classList.remove("badScore", "mediocreScore", "goodScore", "greatScore", "ultimateScore");
    if (endScore <= 50) {
      endGameScore.classList.add("badScore");
    } else if (endScore <= 250) {
      endGameScore.classList.add("mediocreScore");
    } else if (endScore <= 400) {
      endGameScore.classList.add("goodScore");
    } else if (endScore <= 550) {
      endGameScore.classList.add("greatScore");
    } else {
      endGameScore.classList.add("ultimateScore");
    }
    endGamePopup.style.display = "block";
  }
  endedGame(endType, mult) {
    if (modifiers.sandbox && mult !== 1) return;
    console.log("Game ended");
    // Stop game
    this.endRun();
    this.endTimer();
    this.giveUp();
    if (mult === 1) {
      // Won
      this.renderAllAsRevealed = true;
      playSound("win.mp3", 0.75);
    }
    this.info.shouldBeDarkOnDarkGamemode = false;
    this.renderer.drawGrid();
    // Show lost frame
    endGamePopupTitle.innerHTML = "You " + endType + "!";
    this.showGameEndInfo(mult);
  }
}
class VirusPopup {
  constructor(x, y, z, width, height) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = width;
    this.height = height;
  } 
  posInRange(x, y) {
    const isInsideX = (x >= this.x && x <= this.x + this.width);
    const isInsideY = (y >= this.y && y <= this.y + this.height);
    return isInsideX && isInsideY;
  }
}

class Bomb extends Cell {
  constructor(x, y, type) {
    super(x, y, type, new cellInfo(true, false, false, false, false, bombTypeToDamage[type]));
    this.recursiveSafe = false;
  }
  click() {
    if (this.info.isFlagged) return;
    if (this.info.isRevealed) return;
    if (this.info.isClicked) return;
    if (currentGame.info.clicks === 0) {
      currentGame.info.beginningLandRecursiveCount = 0;
      currentGame.createBeginningLand(this.x, this.y);
      // "Create" new cell as blank
      this.type == "blank";
      this.info = new cellInfo(false, false, false, false, false, 0);
      currentGame.setNumbers();
      currentGame.info.clicks++;
      return;
    }
    currentGame.info.clicks++;
    if (modifiers.suddenDeath) {
      currentGame.suddenDeathTimer = 4;
    }
    if (this.info.isBomb) {
      currentGame.info.lives -= this.info.damage;
      currentGame.info.bombsLeft -= 1;
      playSound("bomb.mp3");
      if (modifiers.percise) {
        currentGame.info.lives = 0;
      }
      if (modifiers.echo) {
        if (currentGame.info.echoes.filter(echo => (echo.x === this.x) && (echo.y === this.y)).length <= 0) {
          const chosenBomb = findCellWithAttribute("isBomb", true)
          if (chosenBomb !== null) {
            const echoX = chosenBomb.x * cellSize + cellSize / 2;
            const echoY = chosenBomb.y * cellSize + cellSize / 2;
            currentGame.info.echoes.push(new Echo(echoX, echoY, 1));
          }
        }
      }
      if (modifiers.binded && !this.recursiveSafe) {
        this.recursiveSafe = true;
        const neighbors = currentGame.getNeighbors(this.x, this.y);
        const bombNeighbors = neighbors.filter(cell => cell.info.isBomb);
        if (bombNeighbors.length <= 0) {
          // Reset recursion
          const bombs = currentGame.grid.flat().filter(cell => (cell.info.isBomb && !cell.recursiveSafe));
          for (let i = 0; i < bombs.length; i++) {
            bombs[i].recursiveSafe = false;
          }
        }
        for (let i = 0; i < bombNeighbors.length; i++) {
          bombNeighbors[i].info.damage = 0;
          bombNeighbors[i].click();
        }
      }
    }
    this.info.isClicked = true;
  }
}
class regularBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "bomb");
  }
}
class halfBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "half_bomb");
  }
}
class sonarBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "sonar");
  }
  click() {
    super.click();
    const sonarBombAmount = currentGame.info.sonarBombAmount;
    revealBombs(sonarBombAmount, currentGame.info.rows, currentGame.info.cols);
  }
}
class flagBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "flag_bomb");
  }
  click() {
    super.click();
    const flaggedCells = currentGame.grid.flat().filter(cell => cell.info.isFlagged);
    for (let i = 0; i < flaggedCells.length; i++) {
      flaggedCells[i].info.isFlagged = false;
    }
  }
}
class deadlyGhostBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "ghost");
    this.info.damage = 2;
  }
}
class ghostBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "ghost");
  }
  click() {
    super.click();
    let cell = null;
    let safety = 0;
    do {
      cell = findCellWithAttribute("isBomb", true);
      safety += 1;
      if (safety > currentGame.info.rows * currentGame.info.cols) break;
    } while (cell && (cell.info.isFlagged || cell.info.isClicked || cell.info.isRevealed));
    if (cell && !cell.info.isRevealed && !cell.info.isFlagged && !cell.info.isClicked) {
      cell = new deadlyGhostBomb(cell.x, cell.y);
    }
  }
}
class friendlyBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "friendly");
  }
}
class bombHalfBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "bomb_half_bomb");
  }
}
class smokeBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "smoke");
  }
  click() {
    super.click();
    const smokeBombAmount = currentGame.info.smokeBombAmount;
    smokeBombs(smokeBombAmount, currentGame.info.rows, currentGame.info.cols);
  }
}
class clusterBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "cluster");
  }
  click() {
    super.click();
    const clusterBombAmount = currentGame.info.clusterBombAmount;
    spreadBombs(clusterBombAmount, currentGame.info.rows, currentGame.info.cols, "bomb");
  }
}
class nukeBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "nuke");
  }
}
class twoBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "two_bomb");
  }
}
class hiddenBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "virus");
  }
}
class glitchBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "glitch_bomb");
  }
  click() {
    super.click();
    const glitchBombAmount = currentGame.info.glitchBombAmount;
    spawnVirusPopups(glitchBombAmount);
  }
}
class spreadBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "spread");
  }
  click() {
    super.click();
    const spreadBombAmount = currentGame.info.spreadBombAmount;
    spreadBombs(spreadBombAmount, currentGame.info.rows, currentGame.info.cols, "spread");
  }
}
class reverseBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "reverse");
  }
  click() {
    super.click();
    currentGame.info.controlsReversed = !currentGame.info.controlsReversed;
  }
}
class randomBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "random");
  }
  click() {
    super.click();
    const bombList = currentGame.info.bombList;
    const bomb = bombList[Math.floor(Math.random() * bombList.length)];
    let randomBomb = new bombClassList[bomb](this.x, this.y);
    randomBomb.click();
    randomBomb = null;
  }
}
class antimatterBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "antimatter_bomb");
  }
  click() {
    super.click();
    const directions = [
      {dx: 0, dy: -1}, 
      {dx: 0, dy: 1},  
      {dx: -1, dy: 0}, 
      {dx: 1, dy: 0},  
    ];
    for (const {dx, dy} of directions) {
      let nx = this.x + dx;
      let ny = this.y + dy;
      while (currentGame.isInRange(nx, ny)) {
        const cell = currentGame.grid[ny][nx];
        cell.info.isClicked = false;
        cell.info.isFlagged = false;
        cell.info.isRevealed = false;
        nx += dx;
        ny += dy;
      }
    }
  }
}

class ultimateBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "ultimate");
  }
  click() {
    super.click();
    const types = [
      sonarBomb,
      spreadBomb,
      clusterBomb,
      smokeBomb,
      glitchBomb,
      flagBomb,
      antimatterBomb
    ]
    for (let i = 0; i < types.length; i++) {
      let newBomb = new types[i](this.x, this.y);
      newBomb.info.damage = 0;
      newBomb.click();
      newBomb = null;
    }
  }
}
class medicBomb extends Bomb {
  constructor(x, y) {
    super(x, y, "medic");
  }
}

// Roguelike
class roguelikeGame extends Game {
  constructor(info, renderer) {
    super(info, renderer);
    this.info.currentGamemode = "roguelike";
    this.info.rogueLikeDifficulty = 1; // Can start as any but will go back to regular logic after first win
    this.info.roundCount = 0;
    this.info.startRevealCount = 0;
    this.info.luck = 1;
    this.info.lives = 5;
    this.info.maxLives = 5;
  }
  pickRandomOption(luck) {
    const rogueLikeChoices = getRogueLikeChoices();
    let randNum = Math.random();
    randNum = Math.pow(randNum, 1 / luck);
    // Everything / Fabricate
    if (randNum <= 0.02) { 
      if (Math.random() >= 0.5) {
        return rogueLikeChoices["landIncrease5"];
      }
      return rogueLikeChoices["everything"];
    } 
    if (randNum <= 0.5) {
      const common = Object.keys(rogueLikeChoices)
        .filter(key => rogueLikeChoices[key].rarity === "common");
      return rogueLikeChoices[common[Math.floor(Math.random() * common.length)]];
    } else if (randNum <= 0.8) {
      const rare = Object.keys(rogueLikeChoices)
        .filter(key => rogueLikeChoices[key].rarity === "rare");
      return rogueLikeChoices[rare[Math.floor(Math.random() * rare.length)]];
    } else if (randNum <= 0.95) {
      const mythic = Object.keys(rogueLikeChoices)
        .filter(key => rogueLikeChoices[key].rarity === "mythic");
      return rogueLikeChoices[mythic[Math.floor(Math.random() * mythic.length)]];
    } else {
      const legendary = Object.keys(rogueLikeChoices)
        .filter(key => rogueLikeChoices[key].rarity === "legendary");
      return rogueLikeChoices[legendary[Math.floor(Math.random() * legendary.length)]];
    }
  }
  getChoice() {
    // Set text
    const chosenAbility1 = this.pickRandomOption(this.info.luck);
    const chosenAbility2 = this.pickRandomOption(this.info.luck);
    rogueLikeOption1Name.innerHTML = chosenAbility1.name;
    rogueLikeOption1Desc.innerHTML = chosenAbility1.desc;
    rogueLikeOption1Div.classList.remove("commonChoice", "rareChoice", "mythicChoice", "legendaryChoice");
    rogueLikeOption1Div.classList.add(rarityToClass[chosenAbility1.rarity]);
    rogueLikeOption2Name.innerHTML = chosenAbility2.name;
    rogueLikeOption2Desc.innerHTML = chosenAbility2.desc;
    rogueLikeOption2Div.classList.remove("commonChoice", "rareChoice", "mythicChoice", "legendaryChoice");
    rogueLikeOption2Div.classList.add(rarityToClass[chosenAbility2.rarity]);
    // Show popup
    rogueLikePopup.style.display = "block";
    // Promise
    return new Promise((resolve) => {
      const option1 = () => {
        resolve(chosenAbility1.id);
        cleanup();
      }
      const option2 = () => {
        resolve(chosenAbility2.id);
        cleanup();
      }
      function cleanup() {
        rogueLikeOption1Button.removeEventListener("click", option1);
        rogueLikeOption2Button.removeEventListener("click", option2);
      }
      rogueLikeOption1Button.addEventListener("click", option1);
      rogueLikeOption2Button.addEventListener("click", option2);
    });
  }
  setup(choice) {
    // For when a new game is created but the choice from the previous game is needed
    // Reveal bombs
    switch (choice) {
      case "reveal":
        this.info.startRevealCount++;
        break;
      case "reveal2":
        this.info.startRevealCount += 3;
        break;
      default:
        break;
    }
    revealBombs(this.info.startRevealCount, this.info.rows, this.info.cols);
  }
  async roguelikeLogic() {
    // End current game
    this.endRun();
    this.endTimer();
    this.info.roundCount++;
    console.log(this.info.roundCount);
    // Show popup and get choice
    const choice = await this.getChoice();
    // Hide popup
    rogueLikePopup.style.display = "none";
    // Current/back one choice
    if (choice !== "current" && choice !== "backOne" && choice !== "everything") {
      this.info.rogueLikeDifficulty++;
      if (this.info.rogueLikeDifficulty > 7) {
        this.info.rogueLikeDifficulty = 1;
      }
    }
    if (choice === "backOne" || choice === "everything") {
      this.info.rogueLikeDifficulty = Math.max(1, this.info.rogueLikeDifficulty - 1);
    }
    const numToDifficulty = ["beginner", "easy", "intermediate", "hard", "expert", "extreme", "impossible"];
    let nextGame = getGameFromPresetToRogueLike(numToDifficulty[this.info.rogueLikeDifficulty - 1] || "beginner");
    nextGame.info.currentGamemode = "roguelike";
    nextGame.info.lives = this.info.lives;
    nextGame.info.maxLives = this.info.lives;
    nextGame.info.roundCount = this.info.roundCount;  
    nextGame.info.rogueLikeDifficulty = this.info.rogueLikeDifficulty; 
    nextGame.info.startRevealCount = this.info.startRevealCount;
    nextGame.info.luck = this.info.luck + (this.info.roundCount / 10);
    // Luck
    switch (choice) {
      case "luck1":
        nextGame.info.luck *= 1.05;
        break;
      case "luck2":
        nextGame.info.luck *= 1.1;
        break;
      case "everything":
      case "luck3":
        nextGame.info.luck *= 1.15;
        break;
      default:
        break;
    }
    // Lives
    switch (choice) {
      case "heal":
        nextGame.info.lives += 0.5;
        nextGame.info.maxLives += 0.5;
        break;
      case "heal2":
        nextGame.info.lives += 1;
        nextGame.info.maxLives += 1;
        break;
      case "everything":
      case "heal3":
        nextGame.info.lives += 2;
        nextGame.info.maxLives += 2;
        break;
      default:
        break;
    }
    // Less bombs
    switch (choice) {
      case "lessBombs":
        nextGame.info.bombMultiplier *= 0.95;
        break;
      case "lessBombs2":
        nextGame.info.bombMultiplier *= 0.9;
        break;
      case "everything":
      case "lessBombs3":
        nextGame.info.bombMultiplier *= 0.85;
        break;
      default:
        break;
    }
    // Land increase
    switch (choice) {
        case "landIncrease":
        nextGame.info.landSize += 8;
        break;
      case "landIncrease2":
        nextGame.info.landSize += 16;
        break;
      case "landIncrease3":
        nextGame.info.landSize += 32;
        break;
      case "everything":
      case "landIncrease4":
        nextGame.info.landSize += 48;
        break;
      case "landIncrease5":
        nextGame.info.landSize += 256;
        break;
      default:
        break;
    }
    // Friendly 
    switch (choice) {
      case "friendly1":
        nextGame.info.bombList.push("friendly");
        break;
      case "friendly2":
        nextGame.info.bombList.push("friendly");
        nextGame.info.bombList.push("medic");
        break;
      case "everything":
      case "friendly3":
        nextGame.info.bombList.push("friendly");
        nextGame.info.bombList.push("medic");
        nextGame.info.bombList.push("medic");
        break;
      default:
        break;
    }
    // Start game
    currentGame = nextGame;
    currentGame.init();
    currentGame.setup(choice);
    currentGame.startRun();
    nextGame.info.timer = this.info.timer;
  }
  // Override
  getGameScore(multiplier) {
    const sizeFactor = (this.info.rows * this.info.cols) * 2;
    const bombsFactor = (this.grid.flat().filter(cell => cell.info.isBomb).length);
    let revealedFactor = this.info.bombsRevealed;
    const livesFactor = Math.max(1, this.info.lives);
    const maxLivesFactor = this.info.maxLives;
    let timerFactor = this.info.timer;
    timerFactor = timerFactor === 0 ? 0.1 : timerFactor;
    revealedFactor = revealedFactor === 0 ? 1 : Math.max(1, revealedFactor / 2);
    let baseScore = Math.round(((((sizeFactor * bombsFactor * livesFactor) / revealedFactor) / (maxLivesFactor / 2)) / timerFactor) / 3);
    baseScore = Math.round(baseScore * multiplier);
    baseScore = Number.isNaN(baseScore) ? 0 : baseScore;
    baseScore *= Math.max(1, this.info.roundCount / 2);
    return Math.max(Math.round(baseScore * modifiers.scoreMultiplier), 0);
  }
  // Override
  showGameEndInfo(mult) {
    endGamePopupList.replaceChildren();
    let timerLI = document.createElement("li");
    timerLI.innerHTML = "Time spent: " + this.timerToString();
    endGamePopupList.appendChild(timerLI);
    let bombsRevealedLI = document.createElement("li");
    bombsRevealedLI.innerHTML = "Bombs revealed: " + this.info.bombsRevealed;
    endGamePopupList.appendChild(bombsRevealedLI);
    let livesLI = document.createElement("li");
    livesLI.innerHTML = "Lives left: " + this.info.lives;
    endGamePopupList.appendChild(livesLI);
    let gamemodeLI = document.createElement("li");
    gamemodeLI.innerHTML = "Gamemode: " + this.info.currentGamemode;
    endGamePopupList.appendChild(gamemodeLI);
    let bombCountLI = document.createElement("li");
    bombCountLI.innerHTML = "Final bomb count: " + this.info.bombsLeft;
    endGamePopupList.appendChild(bombCountLI);
    let totalCellsLI = document.createElement("li");
    totalCellsLI.innerHTML = "Total cells: " + (this.info.rows * this.info.cols);
    endGamePopupList.appendChild(totalCellsLI);
    for (const akey in activeModifiers) {
      const key = activeModifiers[akey];
      if (key === 0) continue;
      let newModifierLI = document.createElement("li");
      newModifierLI.innerHTML = key.name;
      if (key.canceled) {
        newModifierLI.innerHTML += " (Canceled by " + key.canceled + ")";
      }
      newModifierLI.classList.add(key.canceled ? "canceled" : key.class);
      endGamePopupList.appendChild(newModifierLI);
    }
    let modifierScoreLI = document.createElement("li");
    modifierScoreLI.innerHTML = "Score multiplier: " + modifiers.scoreMultiplier + "x";
    endGamePopupList.append(modifierScoreLI);
    const endScore = this.getGameScore(mult);
    endGameScore.innerHTML = endScore;
    endGameScore.classList.remove("badScore", "mediocreScore", "goodScore", "greatScore", "ultimateScore");
    if (endScore <= 50) {
      endGameScore.classList.add("badScore");
    } else if (endScore <= 250) {
      endGameScore.classList.add("mediocreScore");
    } else if (endScore <= 400) {
      endGameScore.classList.add("goodScore");
    } else if (endScore <= 550) {
      endGameScore.classList.add("greatScore");
    } else {
      endGameScore.classList.add("ultimateScore");
    }
    endGamePopup.style.display = "block";
  }
  run() {
    super.run();
  }
  // Override
  endedGame(endType, mult) {
    if (modifiers.sandbox && mult !== 1) return;
    if (this.info.lives <= 0) mult = 0.99;
    // Stop game
    this.endRun();
    this.endTimer();
    this.giveUp();
    if (mult === 1) {
      // Won
      this.info.renderAllAsRevealed = true;
      playSound("win.mp3", 0.75);
    }
    // Logic
    console.log(endType);
    if (endType === "won") {
      this.roguelikeLogic();
    } else {
      endGamePopupTitle.innerHTML = "You " + endType + "! " + this.info.roundCount + " rounds finished!";
      this.showGameEndInfo(mult);
    }
  }
}
