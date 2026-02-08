/* =========================================
   Slideshow controller + Envelope + Puzzle
========================================= */
const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
const delay = (ms) => new Promise(r => setTimeout(r, ms));

/* -------------------------
   Scene management
------------------------- */
let currentScene = 1;

function setScene(n) {
  const scenes = $all(".scene");
  scenes.forEach(s => s.classList.remove("scene-active"));
  const target = scenes.find(s => s.dataset.scene === String(n));
  if (target) {
    target.classList.add("scene-active");
    currentScene = n;

    // Focus first focusable element inside the scene for keyboard users
    const focusable = target.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    focusable?.focus?.({ preventScroll: true });
  }
}

/* -------------------------
   Reveal-on-tap captions
------------------------- */
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

/* -------------------------
   Music toggle (optional)
------------------------- */
const musicToggle = $("#musicToggle");
const bgm = $("#bgm");

async function setMusic(on) {
  if (!bgm || !musicToggle) return;
  if (on) {
    try {
      bgm.volume = 0.55;
      await bgm.play();
      musicToggle.setAttribute("aria-pressed", "true");
      $(".music-label", musicToggle).textContent = "Music: On";
    } catch {
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

/* -------------------------
   Envelope interaction
   Requirement #2 + #3 transition timing:
   - click → flap flips → card slides out a little
   - then transition to Scene 2 (overlay)
------------------------- */
const envelopeBtn = $("#envelopeBtn");
const letterCard = $("#letterCard");

let envelopeOpened = false;

envelopeBtn?.addEventListener("click", async () => {
  if (envelopeOpened) return;
  envelopeOpened = true;

  envelopeBtn.classList.add("open");
  envelopeBtn.setAttribute("aria-expanded", "true");
  await delay(prefersReducedMotion ? 50 : 650);

  // Focus the card for accessibility
  letterCard?.focus?.({ preventScroll: true });

  // After the card slides out a little, transition
  await delay(prefersReducedMotion ? 50 : 550);
  setScene(2);
});

$("#toPuzzleBtn")?.addEventListener("click", () => setScene(3));

/* =========================================
   Sliding Puzzle (3x3) — short solve
   Requirement #4: 3–4 click solve
   Approach: start solved, then apply exactly 3 random valid moves.
========================================= */
const IMG_URL = "assets/couple.jpg";
const puzzleGrid = $("#puzzleGrid");
const shuffleBtn = $("#shuffleBtn");
const movesEl = $("#moves");
const statusEl = $("#puzzleStatus");

const SOLVED = [1,2,3,4,5,6,7,8,0];

let state = {
  tiles: SOLVED.slice(),
  moves: 0,
  solved: false
};

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

  state.tiles.forEach((val, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile" + (val === 0 ? " empty" : "");
    btn.dataset.idx = String(idx);

    if (val === 0) {
      btn.setAttribute("aria-label", "Empty space");
      btn.tabIndex = -1;
    } else {
      const solvedIndex = val - 1; // 0..7
      const { r, c } = indexToRowCol(solvedIndex);
      const x = c * 50;
      const y = r * 50;

      btn.style.setProperty("--img", `url("${IMG_URL}")`);
      btn.style.setProperty("--pos", `${x}% ${y}%`);
      btn.setAttribute("aria-label", `Tile ${val}`);
      btn.tabIndex = 0;
    }

    btn.addEventListener("click", () => onTilePress(idx));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onTilePress(idx);
      }
    });

    puzzleGrid.appendChild(btn);
  });

  movesEl && (movesEl.textContent = `Moves: ${state.moves}`);
  statusEl && (statusEl.textContent = state.solved ? "Solved 💖" : "Not solved");
}

function swap(i, j) {
  const next = state.tiles.slice();
  [next[i], next[j]] = [next[j], next[i]];
  state.tiles = next;
}

function onTilePress(tileIdx) {
  if (state.solved) return;

  const { emptyIdx, n } = neighborsOfEmpty(state.tiles);
  if (!n.includes(tileIdx)) return;

  swap(tileIdx, emptyIdx);
  state.moves += 1;

  if (isSolved(state.tiles)) {
    state.solved = true;
    statusEl && (statusEl.textContent = "Solved 💖");
    onPuzzleSolved();
  }

  renderPuzzle();
}

/* Create a “short” puzzle: exactly 3 moves away from solved.
   That means the user can solve it in ~3 clicks (sometimes 3–4 if they misclick). */
function shortShuffle(moves = 3) {
  state.tiles = SOLVED.slice();
  state.moves = 0;
  state.solved = false;

  let prevEmpty = null;

  for (let i = 0; i < moves; i++) {
    const { emptyIdx, n } = neighborsOfEmpty(state.tiles);

    // avoid immediately undoing the last move by avoiding prevEmpty if possible
    const choices = n.filter(idx => idx !== prevEmpty);
    const pick = (choices.length ? choices : n)[Math.floor(Math.random() * (choices.length ? choices.length : n.length))];

    prevEmpty = emptyIdx; // track for undo-avoid
    swap(pick, emptyIdx);
  }

  renderPuzzle();
}

shuffleBtn?.addEventListener("click", () => shortShuffle(3));

async function onPuzzleSolved() {
  // brief celebratory pause, then move to final question scene
  await delay(prefersReducedMotion ? 50 : 650);
  setScene(4);
  await startTypingQuestion();
}

/* =========================================
   Final question typing + yes/no
========================================= */
const typingText = $("#typingText");
const yesBtn = $("#yesBtn");
const noBtn = $("#noBtn");
const response = $("#response");

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

async function startTypingQuestion() {
  const message = "Will you be my Valentine?";
  await typeText(typingText, message, 42);
  yesBtn?.focus?.({ preventScroll: true });
}

yesBtn?.addEventListener("click", () => {
  if (!response) return;
  response.textContent = "YES?! 😭💞 Okay… my heart is doing cartwheels.";
  confettiHeartsBurst();
});

noBtn?.addEventListener("click", async () => {
  if (!response) return;
  if (!prefersReducedMotion) {
    noBtn.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }],
      { duration: 380, easing: "ease-out" }
    );
  }
  response.textContent = "I’ll pretend I didn’t hear that 😌💗 (You can still press Yes.)";
});

/* tasteful heart burst */
function confettiHeartsBurst() {
  if (prefersReducedMotion) return;

  const count = 10;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.textContent = ["💗","💖","💘","💞"][Math.floor(Math.random()*4)];
    s.style.position = "fixed";
    s.style.left = `${50 + (Math.random()*18 - 9)}%`;
    s.style.top = `${55 + (Math.random()*10 - 5)}%`;
    s.style.fontSize = `${14 + Math.random()*18}px`;
    s.style.zIndex = 9999;
    s.style.pointerEvents = "none";
    document.body.appendChild(s);

    const dx = (Math.random() * 200 - 100);
    const dy = -(150 + Math.random() * 120);

    s.animate(
      [
        { transform: "translate(0, 0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random()*220 - 110}deg)`, opacity: 0 }
      ],
      { duration: 900 + Math.random()*260, easing: "cubic-bezier(.2,.7,.2,1)" }
    );

    setTimeout(() => s.remove(), 1200);
  }
}

/* =========================================
   Init
========================================= */
(function init() {
  setScene(1);
  renderPuzzle();
  // Prepare a short puzzle but don't show it until scene 3
  shortShuffle(3);
})();
