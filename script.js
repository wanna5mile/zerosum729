// ===== ZEROSUM729 Main Script =====
// Supports PvP + NPC (random) mode
// Ultimate Tic Tac Toe logic with coin flip start

const playBtn = document.getElementById("playBtn");
const modeSelect = document.getElementById("modeSelect");
const titleScreen = document.getElementById("titleScreen");
const gameArea = document.getElementById("gameArea");
const board = document.getElementById("board");
const statusText = document.getElementById("statusText");

let gameMode = null;
let turn = null;
let bigBoards = [];
let bigWinners = Array(9).fill(null);
let activeBig = null;
let npcSymbol = null;
let playerSymbol = null;

// ===== Screen Transitions =====
playBtn.addEventListener("click", () => {
  modeSelect.style.display = "flex";
});

document.getElementById("npcMode").addEventListener("click", () => startGame("npc"));
document.getElementById("pvpMode").addEventListener("click", () => startGame("pvp"));

function startGame(mode) {
  gameMode = mode;
  titleScreen.style.opacity = "0";
  setTimeout(() => {
    titleScreen.style.display = "none";
    modeSelect.style.display = "none";
    initBoard();
    gameArea.style.display = "flex";
    requestAnimationFrame(() => gameArea.classList.add("active"));
    coinFlip();
  }, 800);
}

// ===== Game Setup =====
function initBoard() {
  board.innerHTML = "";
  bigBoards = [];
  bigWinners = Array(9).fill(null);
  activeBig = null;

  for (let i = 0; i < 9; i++) {
    const bigCell = document.createElement("div");
    bigCell.classList.add("big-cell");
    bigCell.dataset.index = i;

    const smalls = [];
    for (let j = 0; j < 9; j++) {
      const smallCell = document.createElement("div");
      smallCell.classList.add("small-cell");
      smallCell.dataset.big = i;
      smallCell.dataset.small = j;
      smalls.push(smallCell);
      bigCell.appendChild(smallCell);
    }

    bigBoards.push({ element: bigCell, cells: smalls });
    board.appendChild(bigCell);
  }
}

// ===== Coin Flip =====
function coinFlip() {
  const flip = Math.random() < 0.5 ? "X" : "O";
  turn = flip;
  if (gameMode === "npc") {
    npcSymbol = flip === "X" ? "O" : "X";
    playerSymbol = flip;
  }

  statusText.textContent = `Coin flip result: ${turn} starts first! Choose a big box.`;

  // Let starter click any big box to begin
  bigBoards.forEach((b, i) => {
    b.element.addEventListener("click", () => {
      if (activeBig !== null) return; // only once
      activeBig = i;
      activateBigBoard(i);
      statusText.textContent = `Player ${turn} starts in box ${i + 1}`;
      if (gameMode === "npc" && turn === npcSymbol) npcPlay();
    }, { once: true });
  });
}

// ===== Activate specific big board =====
function activateBigBoard(index) {
  bigBoards.forEach((b, i) => {
    b.element.style.opacity = i === index ? "1" : "0.4";
    b.element.style.pointerEvents = i === index ? "auto" : "none";
  });

  const { cells } = bigBoards[index];
  cells.forEach((cell) => {
    if (!cell.textContent) {
      cell.onclick = handleMove;
    }
  });
}

// ===== Handle Small Cell Move =====
function handleMove(e) {
  const cell = e.target;
  const bigIndex = +cell.dataset.big;
  const smallIndex = +cell.dataset.small;

  if (cell.textContent !== "") return;
  cell.textContent = turn;
  cell.classList.add("taken");
  cell.onclick = null;

  // Check small win
  if (checkSmallWin(bigIndex, turn)) {
    bigWinners[bigIndex] = turn;
    bigBoards[bigIndex].element.style.background = turn === "X" ? "#1a4" : "#a14";
  }

  // Check overall win
  if (checkBigWin(turn)) {
    statusText.textContent = `Player ${turn} wins the entire game!`;
    disableAll();
    return;
  }

  // Determine next big board
  if (bigWinners[smallIndex] || isFull(bigBoards[smallIndex].cells)) {
    activeBig = null;
    bigBoards.forEach((b) => (b.element.style.opacity = "1"));
    statusText.textContent = `Player ${turn === "X" ? "O" : "X"}, choose any big box.`;

    bigBoards.forEach((b, i) => {
      if (!bigWinners[i] && !isFull(b.cells)) {
        b.element.addEventListener("click", () => {
          if (activeBig !== null) return;
          activeBig = i;
          activateBigBoard(i);
          statusText.textContent = `Now playing in box ${i + 1}`;
          if (gameMode === "npc" && turn === npcSymbol) npcPlay();
        }, { once: true });
      }
    });
  } else {
    activeBig = smallIndex;
    activateBigBoard(smallIndex);
    if (gameMode === "npc") {
      setTimeout(() => {
        if (turn === npcSymbol) npcPlay();
      }, 400);
    }
  }

  // Switch turn
  turn = turn === "X" ? "O" : "X";
  statusText.textContent = `Player ${turn}'s turn`;
}

// ===== NPC AI =====
function npcPlay() {
  // Delay to feel natural
  setTimeout(() => {
    let possibleCells = [];

    if (activeBig !== null) {
      possibleCells = bigBoards[activeBig].cells.filter((c) => !c.textContent);
    }

    // If current big board full, pick any available
    if (possibleCells.length === 0) {
      const openBoards = bigBoards
        .filter((b, i) => !bigWinners[i] && !isFull(b.cells))
        .map((b, i) => ({ index: i, cells: b.cells.filter((c) => !c.textContent) }));

      if (openBoards.length === 0) return; // no moves

      const pickBoard = openBoards[Math.floor(Math.random() * openBoards.length)];
      activeBig = pickBoard.index;
      possibleCells = pickBoard.cells;
      activateBigBoard(activeBig);
    }

    const cell = possibleCells[Math.floor(Math.random() * possibleCells.length)];
    cell.click();
  }, 500);
}

// ===== Helpers =====
function isFull(cells) {
  return cells.every((c) => c.textContent !== "");
}

function checkSmallWin(bigIndex, mark) {
  const cells = bigBoards[bigIndex].cells.map((c) => c.textContent);
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return wins.some((combo) => combo.every((i) => cells[i] === mark));
}

function checkBigWin(mark) {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return wins.some((combo) => combo.every((i) => bigWinners[i] === mark));
}

function disableAll() {
  bigBoards.forEach((b) => {
    b.element.style.pointerEvents = "none";
  });
}
