/* =========================================
   Helpers
========================================= */
const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

function $(sel, root = document) {
  return root.querySelector(sel);
}
function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function smoothScrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

function setHidden(el, hidden) {
  if (!el) return;
  el.hidden = !!hidden;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =========================================
   Smooth scrolling for internal links
========================================= */
$all("[data-scroll]").forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    const id = href.slice(1);
    e.preventDefault();
    smoothScrollTo(id);
    history.replaceState(null, "", href);
  });
});

/* =========================================
   Hints toggle
========================================= */
const hintBtn = $("#revealHint");
const hintBox = $("#hintBox");
hintBtn?.addEventListener("click", () => {
  const nowHidden = !hintBox.hidden;
  setHidden(hintBox, nowHidden);
});

/* =========================================
   Reveal-on-tap captions
========================================= */
$all(".caption-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("aria-controls");
    const cap = id ? document.getElementById(id) : null;
    if (!cap) return;
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    cap.hidden = expanded;
  });
});

/* =========================================
   Music toggle (optional; off by default)
========================================= */
const musicToggle = $("#musicToggle");
const bgm = $("#bgm");

async function setMusic(on) {
  if (!bgm || !musicToggle) return;

  // If the user didn't provide assets/music.mp3, quietly no-op.
  // (The audio element will fail to play; we handle that gracefully.)
  if (on) {
    try {
      bgm.volume = 0.55;
      await bgm.play();
      musicToggle.setAttribute("aria-pressed", "true");
      $(".music-label", musicToggle).textContent = "Music: On";
    } catch {
      // Autoplay restrictions or missing file
      musicToggle.setAttribute("aria-pressed", "false");
      $(".music-label", musicToggle).textContent = "Music: Off (Unavailable)";
    }
  } else {
    bgm.pause();
    musicToggle.setAttribute("aria-pressed", "false");
    $(".music-label", musicToggle).textContent = "Music: Off";
  }
}
musicToggle?.addEventListener("click", () => {
  const pressed = musicToggle.getAttribute("aria-pressed") === "true";
  setMusic(!pressed);
});

/* =========================================
   Envelope interaction
========================================= */
const envelopeBtn = $("#envelopeBtn");
const paper = $("#letterPaper");
const letterSection = $("#letter");

envelopeBtn?.addEventListener("click", async () => {
  const open = envelopeBtn.classList.toggle("open");
  envelopeBtn.setAttribute("aria-expanded", String(open));

  // reveal paper
  paper?.classList.add("active");

  // focus paper for screen readers / keyboard
  paper?.focus?.({ preventScroll: true });

  // fade envelope into background after opening
  if (open) {
    await delay(850);
    envelopeBtn.classList.add("faded");
    // also subtly fade the whole letter section background after a moment
    await delay(300);
    letterSection?.classList.add("faded");
  }
});

// Keyboard: button already works with Enter/Space by default

/* =========================================
   Sliding Puzzle (3x3 / 8-puzzle)
   - 0 represents the empty space
========================================= */
const IMG_URL = "assets/couple.png";
const puzzleGrid = $("#puzzleGrid");
const shuffleBtn = $("#shuffleBtn");
const resetBtn = $("#resetBtn");
const movesEl = $("#moves");
const statusEl = $("#puzzleStatus");
const puzzleSection = $("#puzzle");

let state = {
  tiles: [1,2,3,4,5,6,7,8,0],
  moves: 0,
  solved: false,
  locked: false
};

const SOLVED = [1,2,3,4,5,6,7,8,0];

function isSolved(arr) {
  return arr.every((v, i) => v === SOLVED[i]);
}

function indexToRowCol(i) {
  return { r: Math.floor(i / 3), c: i % 3 };
}

function neighborsOfEmpty(tiles) {
  const emptyIdx = tiles.indexOf(0);
  const { r, c } = indexToRowCol(emptyIdx);
  const n = [];
  const add = (rr, cc) => {
    if (rr < 0 || rr > 2 || cc < 0 || cc > 2) return;
    n.push(rr * 3 + cc);
  };
  add(r-1, c);
  add(r+1, c);
  add(r, c-1);
  add(r, c+1);
  return { emptyIdx, n };
}

function renderPuzzle() {
  if (!puzzleGrid) return;

  puzzleGrid.innerHTML = "";
  puzzleGrid.style.setProperty("--img", `url("${IMG_URL}")`);

  state.tiles.forEach((val, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile" + (val === 0 ? " empty" : "");
    btn.dataset.idx = String(idx);

    if (val === 0) {
      btn.setAttribute("aria-label", "Empty space");
      btn.tabIndex = -1;
    } else {
      // Determine where this tile should show from the source image:
      // val 1..8 map to solved positions 0..7, each position defines a crop.
      const solvedIndex = val - 1; // 0..7
      const { r, c } = indexToRowCol(solvedIndex);

      // background-position in a 3x3 grid: 0%, 50%, 100% (or 0, 1/2, 1)
      const x = c * 50;
      const y = r * 50;

      btn.style.setProperty("--img", `url("${IMG_URL}")`);
      btn.style.setProperty("--pos", `${x}% ${y}%`);

      btn.setAttribute("aria-label", `Tile ${val}`);
      btn.tabIndex = 0;
    }

    btn.addEventListener("click", () => onTilePress(idx));
    btn.addEventListener("keydown", (e) => {
      // Allow Enter/Space to act, plus arrow keys to move tile if possible.
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onTilePress(idx);
      } else if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        // Optional: arrow keys attempt to move a tile adjacent to empty by moving "toward" empty
        e.preventDefault();
        attemptArrowMove(e.key);
      }
    });

    puzzleGrid.appendChild(btn);
  });

  if (movesEl) movesEl.textContent = `Moves: ${state.moves}`;
  if (statusEl) statusEl.textContent = state.solved ? "Solved 💖" : "Not solved";
}

function swap(i, j) {
  const next = state.tiles.slice();
  [next[i], next[j]] = [next[j], next[i]];
  state.tiles = next;
}

function onTilePress(tileIdx) {
  if (state.locked || state.solved) return;

  const { emptyIdx, n } = neighborsOfEmpty(state.tiles);
  if (!n.includes(tileIdx)) return;

  swap(tileIdx, emptyIdx);
  state.moves += 1;

  if (isSolved(state.tiles)) {
    state.solved = true;
    onPuzzleSolved();
  }

  renderPuzzle();
}

function attemptArrowMove(key) {
  if (state.locked || state.solved) return;

  const { emptyIdx } = neighborsOfEmpty(state.tiles);
  const { r, c } = indexToRowCol(emptyIdx);

  // Arrow keys move the empty space (classic control):
  // ArrowUp means empty moves up by swapping with tile above (if exists).
  let target = null;
  if (key === "ArrowUp" && r < 2) target = (r + 1) * 3 + c;
  if (key === "ArrowDown" && r > 0) target = (r - 1) * 3 + c;
  if (key === "ArrowLeft" && c < 2) target = r * 3 + (c + 1);
  if (key === "ArrowRight" && c > 0) target = r * 3 + (c - 1);

  if (target == null) return;
  swap(target, emptyIdx);
  state.moves += 1;

  if (isSolved(state.tiles)) {
    state.solved = true;
    onPuzzleSolved();
  }
  renderPuzzle();
}

function shuffle(times = 140) {
  // Start from solved and do random valid moves => always solvable
  state.tiles = SOLVED.slice();
  state.moves = 0;
  state.solved = false;

  for (let i = 0; i < times; i++) {
    const { emptyIdx, n } = neighborsOfEmpty(state.tiles);
    const pick = n[Math.floor(Math.random() * n.length)];
    const next = state.tiles.slice();
    [next[pick], next[emptyIdx]] = [next[emptyIdx], next[pick]];
    state.tiles = next;
  }

  renderPuzzle();
}

function resetPuzzle() {
  state.tiles = SOLVED.slice();
  state.moves = 0;
  state.solved = false;
  renderPuzzle();
}

shuffleBtn?.addEventListener("click", () => shuffle());
resetBtn?.addEventListener("click", () => resetPuzzle());

/* =========================================
   On puzzle completion: fade puzzle section,
   unlock Valentine card, typing + fade-in
========================================= */
const lockedMessage = $("#lockedMessage");
const valentineCard = $("#valentineCard");
const typingText = $("#typingText");

const yesBtn = $("#yesBtn");
const noBtn = $("#noBtn");
const response = $("#response");

async function onPuzzleSolved() {
  if (statusEl) statusEl.textContent = "Solved 💖";
  // Fade puzzle into background
  await delay(350);
  puzzleSection?.classList.add("faded");

  unlockValentineCard();
}

async function unlockValentineCard() {
  setHidden(lockedMessage, true);
  setHidden(valentineCard, false);

  // Fade in card
  await delay(80);
  valentineCard?.classList.add("show");

  // Start typing
  const message = "Will you be my Valentine?";
  await typeText(typingText, message, 42);

  // Move focus to "Yes" for keyboard users
  yesBtn?.focus?.({ preventScroll: true });
}

async function typeText(el, text, speedMs = 40) {
  if (!el) return;
  el.textContent = "";
  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await delay(speedMs);
  }
}

/* =========================================
   Yes / No interactions
========================================= */
yesBtn?.addEventListener("click", () => {
  if (!response) return;
  response.textContent = "YES?! 😭💞 Okay, my heart is doing cartwheels.";
  confettiHeartsBurst();
});

noBtn?.addEventListener("click", async () => {
  if (!response) return;

  // Make "No" playful but not annoying; gently scoot once
  if (!prefersReducedMotion) {
    noBtn.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }],
      { duration: 380, easing: "ease-out" }
    );
  }
  response.textContent = "I’ll pretend I didn’t hear that 😌💗 (You can still press Yes.)";
});

/* =========================================
   Tiny tasteful heart burst (no libs)
========================================= */
function confettiHeartsBurst() {
  if (prefersReducedMotion) return;

  const count = 12;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.textContent = ["💗","💖","💘","💞"][Math.floor(Math.random()*4)];
    s.style.position = "fixed";
    s.style.left = `${50 + (Math.random()*20 - 10)}%`;
    s.style.top = `${62 + (Math.random()*8 - 4)}%`;
    s.style.fontSize = `${14 + Math.random()*18}px`;
    s.style.zIndex = 9999;
    s.style.pointerEvents = "none";
    document.body.appendChild(s);

    const dx = (Math.random() * 220 - 110);
    const dy = -(180 + Math.random() * 140);

    s.animate(
      [
        { transform: "translate(0, 0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random()*220 - 110}deg)`, opacity: 0 }
      ],
      { duration: 900 + Math.random()*300, easing: "cubic-bezier(.2,.7,.2,1)" }
    );

    setTimeout(() => s.remove(), 1300);
  }
}

/* =========================================
   Init
========================================= */
(function init() {
  // Make sure paper starts dim until envelope opens
  paper?.classList.remove("active");

  // Build puzzle UI and shuffle at start
  renderPuzzle();
  shuffle(120);

  // Locked by default
  setHidden($("#valentineCard"), true);
  setHidden($("#lockedMessage"), false);
})();
