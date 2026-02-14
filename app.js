// ========================================
// SCENE MANAGER
// ========================================
const SceneManager = {
    currentScene: 1,

    goToScene(n) {
        const from = document.querySelector(`#scene-${this.currentScene}`);
        const to   = document.querySelector(`#scene-${n}`);
        if (!to) return;

        const prev = this.currentScene;
        this.currentScene = n;

        // Special case: 3 → 4 keeps flowers; only swap the section visibility
        if (prev === 3 && n === 4) {
            from.classList.remove('is-active');
            to.classList.add('is-active');
            gsap.set(to, { opacity: 1 });
            return;
        }

        // Going away FROM scene 4 — fade out flowers too
        if (prev === 4) {
            const field = document.getElementById('flower-field');
            gsap.to(field, { opacity: 0, duration: 0.6 });
        }

        gsap.to(from, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => from.classList.remove('is-active')
        });

        to.classList.add('is-active');
        gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3 });
    }
};

// ========================================
// SCENE 1 — ENVELOPE
// ========================================
const Scene1 = {

    init() {
        this.envelope  = document.getElementById('envelope');
        this.flap      = document.getElementById('flap');
        this.hint      = document.getElementById('click-hint');
        this.container = document.getElementById('envelope-container');
        this.opened    = false;

        this.playEntry();
        this.container.addEventListener('click', () => this.open());
    },

    // Envelope pops in on load
    playEntry() {
        gsap.from(this.envelope, {
            scale: 0,
            rotation: -20,
            opacity: 0,
            duration: 1.1,
            ease: 'back.out(1.6)',
            delay: 0.2
        });
        gsap.from(this.hint, {
            opacity: 0,
            y: 16,
            duration: 0.7,
            delay: 1.1,
            ease: 'power2.out'
        });
    },

    open() {
        if (this.opened) return;
        this.opened = true;

        // Start background music on first user interaction
        MusicPlayer.start();

        const tl = gsap.timeline();

        // 1. Pause the CSS float animation cleanly
        tl.call(() => {
            this.envelope.style.animation = 'none';
        })

        // 2. Settle to neutral position
        .to(this.envelope, {
            rotation: 0,
            y: 0,
            duration: 0.25,
            ease: 'power2.out'
        })

        // 3. Excited wiggle
        .to(this.envelope, { rotation: -6,  duration: 0.08, ease: 'none' })
        .to(this.envelope, { rotation:  6,  duration: 0.08, ease: 'none' })
        .to(this.envelope, { rotation: -4,  duration: 0.07, ease: 'none' })
        .to(this.envelope, { rotation:  4,  duration: 0.07, ease: 'none' })
        .to(this.envelope, { rotation:  0,  duration: 0.07, ease: 'none' })

        // 4. Fade hint
        .to(this.hint, {
            opacity: 0,
            y: 8,
            duration: 0.3,
            ease: 'power1.in'
        }, '<')

        // 5. FLAP OPEN:
        //    The flap is a ▽ triangle anchored at its top-left.
        //    rotationX: -180 spins it backward around the top edge
        //    so it folds up and away — like a real envelope opening.
        .to(this.flap, {
            rotationX: -180,
            duration: 0.75,
            ease: 'back.out(1.3)',
            transformOrigin: 'top left'
        }, '+=0.1')

        // 6. Brief pause so the open flap is visible
        .to({}, { duration: 0.4 })

        // 7. Transition out to Scene 2
        .to(this.envelope, {
            scale: 0.85,
            y: -40,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => SceneManager.goToScene(2)
        });
    }
};



// ========================================
// SCENE 2 — LOVE LETTER
// ========================================
const Scene2 = {

    SALUTATION: 'Dear Emily,',

    init() {
        this.paper   = document.getElementById('letter-paper');
        this.sal     = document.getElementById('letter-salutation');
        this.body    = document.getElementById('letter-body');
        this.closing = document.getElementById('letter-closing');
        this.hint    = document.getElementById('outside-hint');
        this.overlay = document.getElementById('letter-overlay');

        // Click OUTSIDE the paper (on the overlay) → advance
        this.overlay.addEventListener('click', () => this.exit());

        // Stop clicks on the paper from bubbling to the overlay
        this.paper.addEventListener('click', e => e.stopPropagation());
    },

    enter() {
        this._exiting = false;

        // Reset in case of revisit
        this.sal.textContent = '';
        gsap.set(this.body.querySelectorAll('p'), { opacity: 0 });
        gsap.set([this.closing, this.hint], { opacity: 0 });

        const tl = gsap.timeline();

        // 1. Paper slides + fades in
        tl.from(this.paper, {
            opacity: 0,
            y: 40,
            duration: 0.9,
            ease: 'power3.out'
        })

        // 2. Typewriter on "Dear Emily,"
        .call(() => {
            this.typewrite(this.SALUTATION, this.sal, 60, () => {
                // 3. Stagger-fade the body paragraphs
                gsap.to(this.body.querySelectorAll('p'), {
                    opacity: 1,
                    duration: 0.7,
                    stagger: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        // 4. Fade in closing
                        gsap.to(this.closing, {
                            opacity: 1,
                            duration: 0.7,
                            ease: 'power2.out',
                            onComplete: () => {
                                // 5. Reveal hint
                                gsap.to(this.hint, { opacity: 1, duration: 0.6 });
                            }
                        });
                    }
                });
            });
        }, null, '+=0.2');
    },

    typewrite(text, el, msPerChar, onDone) {
        const cursor = document.createElement('span');
        cursor.className = 'tw-cursor';
        el.appendChild(cursor);

        let i = 0;
        const tick = () => {
            if (i < text.length) {
                el.insertBefore(document.createTextNode(text[i]), cursor);
                i++;
                setTimeout(tick, msPerChar);
            } else {
                setTimeout(() => {
                    cursor.remove();
                    if (onDone) onDone();
                }, 500);
            }
        };
        tick();
    },

    exit() {
        if (this._exiting) return;
        this._exiting = true;

        gsap.to(document.getElementById('letter-wrapper'), {
            opacity: 0,
            y: -30,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => SceneManager.goToScene(3)
        });
    }
};

// ========================================
// SCENE 3 — WILL YOU BE MY VALENTINE?
// ========================================
const Scene3 = {

    FLOWERS: [
        { x: 8,  stemH: 110, petal: '#f9a8d4', centre: '#fde68a', size: 'md' },
        { x: 18, stemH: 80,  petal: '#fca5a5', centre: '#fde68a', size: 'sm' },
        { x: 28, stemH: 130, petal: '#c4b5fd', centre: '#fde68a', size: 'lg' },
        { x: 38, stemH: 90,  petal: '#f9a8d4', centre: '#fed7aa', size: 'sm' },
        { x: 50, stemH: 140, petal: '#fca5a5', centre: '#fde68a', size: 'lg' },
        { x: 62, stemH: 85,  petal: '#c4b5fd', centre: '#fde68a', size: 'sm' },
        { x: 72, stemH: 125, petal: '#f9a8d4', centre: '#fde68a', size: 'md' },
        { x: 82, stemH: 75,  petal: '#fca5a5', centre: '#fed7aa', size: 'sm' },
        { x: 91, stemH: 115, petal: '#c4b5fd', centre: '#fde68a', size: 'md' },
        { x: 13, stemH: 60,  petal: '#fde68a', centre: '#f9a8d4', size: 'sm' },
        { x: 33, stemH: 55,  petal: '#fde68a', centre: '#fca5a5', size: 'sm' },
        { x: 55, stemH: 65,  petal: '#a5f3fc', centre: '#fde68a', size: 'sm' },
        { x: 75, stemH: 50,  petal: '#fde68a', centre: '#f9a8d4', size: 'sm' },
        { x: 95, stemH: 60,  petal: '#a5f3fc', centre: '#fde68a', size: 'sm' },
    ],

    BLOOM_PX: { sm: 5, md: 7, lg: 9 },

    init() {
        this.field  = document.getElementById('flower-field');
        this.card   = document.getElementById('valentine-card');
        this.btnYes = document.getElementById('btn-yes');
        this.btnNo  = document.getElementById('btn-no');
        this._buildFlowers();
        this._bindButtons();
    },

    _buildFlowers() {
        this._flowerEls = [];
        this.FLOWERS.forEach((cfg) => {
            const px = this.BLOOM_PX[cfg.size];
            const flower = document.createElement('div');
            flower.className = 'flower';
            flower.style.left = `${cfg.x}%`;

            const stem = document.createElement('div');
            stem.className = 'stem';
            stem.style.height = `${cfg.stemH}px`;

            const leafL = document.createElement('div');
            leafL.className = 'leaf leaf-l';
            leafL.style.bottom = `${cfg.stemH * 0.45}px`;

            const leafR = document.createElement('div');
            leafR.className = 'leaf leaf-r';
            leafR.style.bottom = `${cfg.stemH * 0.45}px`;

            const bloom = document.createElement('div');
            bloom.className = 'bloom';
            bloom.style.bottom = `${cfg.stemH}px`;

            const seed = document.createElement('div');
            seed.className = 'bloom-seed';
            seed.style.width  = `${px}px`;
            seed.style.height = `${px}px`;
            seed.style.left   = `${px * -3}px`;
            seed.style.top    = `${px * -3}px`;

            const P = cfg.petal, C = cfg.centre;
            const grid = [
                [0,P,P,0,P,P,0],
                [P,P,P,P,P,P,P],
                [P,P,C,C,C,P,P],
                [0,P,C,C,C,P,0],
                [P,P,C,C,C,P,P],
                [P,P,P,P,P,P,P],
                [0,P,P,0,P,P,0],
            ];

            const shadows = [];
            grid.forEach((row, r) => {
                row.forEach((col, c) => {
                    if (col) shadows.push(`${c * px}px ${r * px}px 0 0 ${col}`);
                });
            });
            seed.style.boxShadow = shadows.join(', ');

            bloom.appendChild(seed);
            flower.appendChild(stem);
            flower.appendChild(leafL);
            flower.appendChild(leafR);
            flower.appendChild(bloom);
            this.field.appendChild(flower);

            gsap.set(flower, { scaleY: 0, scaleX: 0, transformOrigin: 'bottom center' });
            this._flowerEls.push(flower);
        });
    },

    _bindButtons() {
        this.btnYes.addEventListener('click', () => {
            // Fade out ONLY the card — flowers stay visible for scene 4
            gsap.to(this.card, {
                scale: 0.9, opacity: 0, duration: 0.5, ease: 'power2.in',
                onComplete: () => SceneManager.goToScene(4)
            });
        });

        this.btnNo.addEventListener('mouseenter', () => {
            gsap.to(this.btnNo, {
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 10,
                duration: 0.15, ease: 'power1.out'
            });
        });
        this.btnNo.addEventListener('mouseleave', () => {
            gsap.to(this.btnNo, { x: 0, y: 0, duration: 0.3, ease: 'elastic.out(1,0.5)' });
        });
    },

    enter() {
        // Make flower field visible
        gsap.set(this.field, { opacity: 1 });
        gsap.set(this.card, { opacity: 0, scale: 0.7 });
        this._flowerEls.forEach(f =>
            gsap.set(f, { scaleY: 0, scaleX: 0, transformOrigin: 'bottom center' })
        );

        const tl = gsap.timeline();
        tl.to(this._flowerEls, {
            scaleY: 1, scaleX: 1,
            duration: 0.7,
            ease: 'back.out(1.4)',
            stagger: { each: 0.08, from: 'random' }
        })
        .to({}, { duration: 0.4 })
        .to(this.card, {
            opacity: 1, scale: 1,
            duration: 0.65,
            ease: 'back.out(2)',
        });
    }
};

// ========================================
// MUSIC PLAYER
// ========================================
const MusicPlayer = {
    init() {
        this.audio  = document.getElementById('bg-music');
        this.toggle = document.getElementById('music-toggle');
        this.icon   = document.getElementById('music-icon');
        this.started = false;

        this.toggle.addEventListener('click', () => this.togglePlay());

        // Handle browsers that suspend even after user gesture
        this.audio.addEventListener('play',  () => this._setPlaying(true));
        this.audio.addEventListener('pause', () => this._setPlaying(false));
    },

    start() {
        if (this.started) return;
        this.started = true;

        this.audio.volume = 0;
        this.audio.play().then(() => {
            // Fade volume in gently
            this.toggle.hidden = false;
            gsap.to(this.audio, { volume: 0.55, duration: 2.5, ease: 'power1.inOut' });
            gsap.from(this.toggle, { opacity: 0, scale: 0.6, duration: 0.5, ease: 'back.out(2)', delay: 0.5 });
            this._setPlaying(true);
        }).catch(() => {
            // Autoplay blocked — show toggle so user can manually start
            this.toggle.hidden = false;
        });
    },

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    },

    _setPlaying(playing) {
        this.icon.textContent = playing ? '♪' : '♩';
        this.toggle.classList.toggle('is-playing', playing);
    }
};

// ========================================
// SCENE 4 — SURPRISE GIFTS
// ========================================
const Scene4 = {
    TITLE: 'Surprise Gifts For You',

    init() {
        this.card     = document.getElementById('gifts-card');
        this.titleEl  = document.getElementById('gifts-title');
        this.subtitle = document.getElementById('gifts-subtitle');
        this.portals  = Array.from(document.querySelectorAll('.gift-portal'));

        this._bindPortals();
    },

    _bindPortals() {
        this.portals.forEach(portal => {
            portal.addEventListener('click', () => {
                const target = parseInt(portal.dataset.scene, 10);
                gsap.to(this.card, {
                    opacity: 0, y: -20, duration: 0.4, ease: 'power2.in',
                    onComplete: () => SceneManager.goToScene(target)
                });
            });
        });
    },

    enter() {
        // Reset
        this.titleEl.textContent = '';
        this.hearts = Array.from(document.querySelectorAll('.gh'));
        gsap.set(this.card,     { opacity: 0, y: 50 });
        gsap.set(this.subtitle, { opacity: 0 });
        gsap.set(this.portals,  { opacity: 0, y: 30 });
        gsap.set(this.hearts,   { opacity: 0 });

        const tl = gsap.timeline();

        // 1. Card slides up
        tl.to(this.card, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power3.out'
        })

        // 2. Typewrite the title
        .call(() => {
            // Reuse Scene2's typewriter helper (same speed)
            Scene2.typewrite(this.TITLE, this.titleEl, 55, () => {

                // 3. Subtitle fades in
                gsap.to(this.subtitle, {
                    opacity: 1, duration: 0.6, ease: 'power2.out',
                    onComplete: () => {

                        // 4. Gift portals stagger in
                        gsap.to(this.portals, {
                            opacity: 1, y: 0,
                            duration: 0.55,
                            stagger: 0.15,
                            ease: 'back.out(1.6)',
                            onComplete: () => {
                                // 5. Decorative hearts drift in
                                gsap.to(this.hearts, {
                                    opacity: 0.7,
                                    duration: 0.8,
                                    stagger: 0.1,
                                    ease: 'power2.out'
                                });
                            }
                        });
                    }
                });
            });
        }, null, '+=0.15');
    }
};

// ========================================
// SCENE 5 — SLIDING PUZZLE
// ========================================
const Scene5 = {
    SIZE: 3,
    // !! Replace with your image path, e.g. 'assets/puzzle.jpg'
    IMAGE: 'assets/puzzle.jpg',

    init() {
        this.board        = document.getElementById('puzzle-board');
        this.titleEl      = document.getElementById('puzzle-title');
        this.solvedEl     = document.getElementById('puzzle-solved');
        this.backBtn      = document.getElementById('puzzle-back-btn');
        this.persistBack  = document.getElementById('puzzle-persist-back');
        this.tiles        = [];
        this.state        = [];

        const doBack = () => {
            gsap.to(document.getElementById('puzzle-wrapper'), {
                opacity: 0, y: 20, duration: 0.4, ease: 'power2.in',
                onComplete: () => SceneManager.goToScene(4)
            });
        };
        this.backBtn.addEventListener('click', doBack);
        this.persistBack.addEventListener('click', doBack);
    },

    enter() {
        // Reset wrapper visibility
        gsap.set(document.getElementById('puzzle-wrapper'), { opacity: 1, y: 0 });
        gsap.set(this.titleEl, { opacity: 0 });
        gsap.set(this.board,   { opacity: 0 });
        gsap.set(this.solvedEl, { opacity: 0 });
        gsap.set(this.persistBack, { opacity: 0 });
        this.solvedEl.classList.remove('is-visible');

        this._buildBoard();

        const tl = gsap.timeline();
        tl.to(this.titleEl, { opacity: 1, duration: 0.7, ease: 'power2.out' })
          .to(this.board,   { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
          .to(this.persistBack, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');
    },

    _buildBoard() {
        this.board.innerHTML = '';
        this.tiles = [];

        const n = this.SIZE;
        const total = n * n;

        // Build solved state [1,2,3,...,n*n-1, 0]  (0 = empty)
        const solved = Array.from({ length: total }, (_, i) => (i + 1) % total);
        this.solved = solved;

        // Shuffle with a solvable sequence (random adjacent swaps from solved)
        let state = [...solved];
        let emptyIdx = total - 1;

        // 3-4 random legal moves from solved (very beginner friendly)
        const shuffleMoves = 3 + Math.floor(Math.random() * 2); // 3 or 4
        for (let m = 0; m < shuffleMoves; m++) {
            const neighbors = this._neighbors(emptyIdx, n);
            const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
            [state[emptyIdx], state[pick]] = [state[pick], state[emptyIdx]];
            emptyIdx = pick;
        }
        this.state = state;

        // Render tiles
        const boardPx = this.board.getBoundingClientRect().width || 360;
        const tilePx  = boardPx / n;

        state.forEach((val, idx) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile' + (val === 0 ? ' puzzle-tile--empty' : '');
            tile.dataset.idx = idx;

            if (val !== 0) {
                // val is 1-based solved position
                const solvedPos = val - 1;
                const sCol = solvedPos % n;
                const sRow = Math.floor(solvedPos / n);
                tile.style.backgroundImage = `url('${this.IMAGE}')`;
                tile.style.backgroundSize  = `${n * 100}%`;
                tile.style.backgroundPosition =
                    `${sCol * (100 / (n - 1))}% ${sRow * (100 / (n - 1))}%`;
            }

            tile.addEventListener('click', () => this._tryMove(idx));
            this.board.appendChild(tile);
            this.tiles.push(tile);
        });
    },

    _neighbors(idx, n) {
        const row = Math.floor(idx / n), col = idx % n;
        const result = [];
        if (row > 0)     result.push(idx - n);
        if (row < n - 1) result.push(idx + n);
        if (col > 0)     result.push(idx - 1);
        if (col < n - 1) result.push(idx + 1);
        return result;
    },

    _tryMove(clickedIdx) {
        const emptyIdx = this.state.indexOf(0);
        const neighbors = this._neighbors(emptyIdx, this.SIZE);

        if (!neighbors.includes(clickedIdx)) return;

        // Swap in state
        [this.state[emptyIdx], this.state[clickedIdx]] =
            [this.state[clickedIdx], this.state[emptyIdx]];

        // Animate the clicked tile sliding into the empty spot
        const boardEl   = this.board;
        const boardPx   = boardEl.getBoundingClientRect().width;
        const tilePx    = boardPx / this.SIZE;

        const fromCol = clickedIdx % this.SIZE;
        const fromRow = Math.floor(clickedIdx / this.SIZE);
        const toCol   = emptyIdx   % this.SIZE;
        const toRow   = Math.floor(emptyIdx   / this.SIZE);

        const dx = (toCol - fromCol) * tilePx;
        const dy = (toRow - fromRow) * tilePx;

        const movingTile  = this.tiles[clickedIdx];
        const emptyTile   = this.tiles[emptyIdx];

        gsap.to(movingTile, {
            x: dx, y: dy,
            duration: 0.18,
            ease: 'power2.out',
            onComplete: () => {
                // Re-render board cleanly (reset transforms)
                gsap.set(movingTile, { x: 0, y: 0 });
                this._rebuildTileStyles();
                if (this._isSolved()) this._showSolved();
            }
        });
    },

    _rebuildTileStyles() {
        const n = this.SIZE;
        this.tiles.forEach((tile, idx) => {
            const val = this.state[idx];
            if (val === 0) {
                tile.className = 'puzzle-tile puzzle-tile--empty';
                tile.style.backgroundImage = '';
            } else {
                tile.className = 'puzzle-tile';
                const solvedPos = val - 1;
                const sCol = solvedPos % n;
                const sRow = Math.floor(solvedPos / n);
                tile.style.backgroundImage = `url('${this.IMAGE}')`;
                tile.style.backgroundSize  = `${n * 100}%`;
                tile.style.backgroundPosition =
                    `${sCol * (100 / (n - 1))}% ${sRow * (100 / (n - 1))}%`;
            }
        });
    },

    _isSolved() {
        return this.state.every((val, idx) => val === this.solved[idx]);
    },

    _showSolved() {
        this.solvedEl.classList.add('is-visible');
        gsap.to(this.solvedEl, {
            opacity: 1,
            duration: 1.2,
            ease: 'power2.out',
            delay: 0.3
        });
    }
};


// ========================================
// SCENE 6 — WORD SEARCH
// ========================================
const Scene6 = {

    WORDS: [
        { word: 'MOMO',            hint: 'your new son 🐱' },
        { word: 'CHINATRIP',       hint: 'your fall extravaganza 🥟' },
        { word: 'INTOTHEWISH',     hint: 'we traveled to asia for this 🌸' },
        { word: 'YOSEMITE',        hint: 'we touched grass 🌲' },
        { word: 'UNIVERSALSTUDIOS',hint: 'childhood dreams came true 🎢' },
        { word: 'AQUARIUM',        hint: 'Monterey Bay 🐠' },
        { word: 'BRONXZOO',        hint: 'animal time!! we witnessed dog abuse though 🐘' },
        { word: 'GRADUATION',      hint: 'something we both celebrated!! 🎓' },
    ],

    COLS: 22,
    ROWS: 18,
    DIRS: [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]],

    init() {
        this.gridEl  = document.getElementById('ws-grid');
        this.bankEl  = document.getElementById('ws-bank');
        this.backBtn = document.getElementById('ws-back-btn');
        this.wrapper = document.getElementById('wordsearch-wrapper');
        this.backBtn.addEventListener('click', () => {
            gsap.to(this.wrapper, {
                opacity: 0, y: 20, duration: 0.4, ease: 'power2.in',
                onComplete: () => SceneManager.goToScene(4)
            });
        });
    },

    enter() {
        gsap.set(this.wrapper, { opacity: 0, y: 30 });
        this.foundCount = 0;
        this.cells      = [];
        this.grid       = [];
        this.wordData   = [];
        this._buildGrid();
        this._buildBank();
        this._bindInteraction();
        gsap.to(this.wrapper, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    },

    _buildGrid() {
        const R = this.ROWS, C = this.COLS;
        this.grid = Array.from({ length: R }, () => Array(C).fill(''));
        this.wordData = this.WORDS.map((w, wi) => {
            const placed = this._placeWord(w.word);
            return { ...w, cells: placed, found: false, idx: wi };
        });
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < R; r++)
            for (let c = 0; c < C; c++)
                if (!this.grid[r][c])
                    this.grid[r][c] = alpha[Math.floor(Math.random() * 26)];
        this.gridEl.innerHTML = '';
        this.gridEl.style.gridTemplateColumns = `repeat(${C}, 1fr)`;
        this.cells = [];
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                const cell = document.createElement('div');
                cell.className = 'ws-cell';
                cell.textContent = this.grid[r][c];
                cell.dataset.r = r;
                cell.dataset.c = c;
                this.gridEl.appendChild(cell);
                this.cells.push(cell);
            }
        }
    },

    _placeWord(word) {
        const R = this.ROWS, C = this.COLS;
        const dirs = [...this.DIRS];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        for (let attempt = 0; attempt < 500; attempt++) {
            const [dr, dc] = dirs[attempt % dirs.length];
            const sr = Math.floor(Math.random() * R);
            const sc = Math.floor(Math.random() * C);
            const cells = [];
            let fits = true;
            for (let i = 0; i < word.length; i++) {
                const nr = sr + dr * i, nc = sc + dc * i;
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) { fits = false; break; }
                const ex = this.grid[nr][nc];
                if (ex && ex !== word[i]) { fits = false; break; }
                cells.push(nr * C + nc);
            }
            if (fits) {
                for (let i = 0; i < word.length; i++)
                    this.grid[sr + dr*i][sc + dc*i] = word[i];
                return cells;
            }
        }
        // Hard fallback: horizontal on a fresh row
        const row = (this.wordData ? this.wordData.length : 0) % R;
        const cells = [];
        for (let i = 0; i < word.length && i < C; i++) {
            this.grid[row][i] = word[i];
            cells.push(row * C + i);
        }
        return cells;
    },

    _buildBank() {
        this.bankEl.innerHTML = '';
        this.WORDS.forEach((w, i) => {
            const item = document.createElement('div');
            item.className = 'ws-word-item';
            item.id = `ws-item-${i}`;

            const label = document.createElement('span');
            label.className = 'ws-word-label';
            label.id = `ws-label-${i}`;
            label.textContent = w.word[0] + '_ '.repeat(w.word.length - 1).trim();

            const hintBtn = document.createElement('button');
            hintBtn.className = 'ws-hint-btn';
            hintBtn.textContent = '? hint';

            const tip = document.createElement('span');
            tip.className = 'ws-hint-tip';
            tip.textContent = w.hint;
            tip.style.opacity = '0';

            hintBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tip.style.opacity = tip.style.opacity === '1' ? '0' : '1';
            });

            item.append(label, hintBtn, tip);
            this.bankEl.appendChild(item);
        });
    },

    _bindInteraction() {
        let selecting = false, startFlat = null;
        const C = this.COLS;

        const flatOf = (el) => {
            if (!el || !el.classList.contains('ws-cell')) return null;
            return parseInt(el.dataset.r) * C + parseInt(el.dataset.c);
        };

        const cellsInLine = (a, b) => {
            if (a === null || b === null) return [];
            const r1 = Math.floor(a/C), c1 = a%C;
            const r2 = Math.floor(b/C), c2 = b%C;
            const dr = Math.sign(r2-r1), dc = Math.sign(c2-c1);
            const isDiag  = Math.abs(r2-r1) === Math.abs(c2-c1);
            const isStraight = r1===r2 || c1===c2;
            if (!isDiag && !isStraight) return [];
            const len = Math.max(Math.abs(r2-r1), Math.abs(c2-c1));
            const out = [];
            for (let i = 0; i <= len; i++)
                out.push((r1+dr*i)*C + (c1+dc*i));
            return out;
        };

        const clearHighlight = () =>
            this.cells.forEach(c => c.classList.remove('is-selecting'));

        const doHighlight = (a, b) => {
            clearHighlight();
            cellsInLine(a, b).forEach(idx => {
                if (this.cells[idx]) this.cells[idx].classList.add('is-selecting');
            });
        };

        const doSubmit = (a, b) => {
            clearHighlight();
            const sel = cellsInLine(a, b);
            if (!sel.length) return;
            this.wordData.forEach((wd, wi) => {
                if (wd.found) return;
                const rev = [...wd.cells].reverse();
                const eq  = (arr) => arr.length===sel.length && arr.every((v,i)=>v===sel[i]);
                if (eq(wd.cells) || eq(rev)) {
                    wd.found = true;
                    wd.cells.forEach(idx => {
                        this.cells[idx].className = `ws-cell is-found-${wi}`;
                    });
                    this._revealWord(wi, wd);
                    this._celebrate(wd.cells);
                }
            });
        };

        // Mouse
        this.gridEl.addEventListener('mousedown', (e) => {
            const f = flatOf(e.target); if (f===null) return;
            selecting=true; startFlat=f; doHighlight(f,f);
        });
        this.gridEl.addEventListener('mousemove', (e) => {
            if (!selecting) return; doHighlight(startFlat, flatOf(e.target));
        });
        window.addEventListener('mouseup', (e) => {
            if (!selecting) return; selecting=false;
            doSubmit(startFlat, flatOf(e.target)); startFlat=null;
        });

        // Touch
        const touchFlat = (e) => {
            const t = e.touches[0] || e.changedTouches[0];
            return flatOf(document.elementFromPoint(t.clientX, t.clientY));
        };
        this.gridEl.addEventListener('touchstart', (e) => {
            const f = touchFlat(e); if (f===null) return;
            e.preventDefault(); selecting=true; startFlat=f; doHighlight(f,f);
        }, {passive:false});
        this.gridEl.addEventListener('touchmove', (e) => {
            if (!selecting) return; e.preventDefault();
            doHighlight(startFlat, touchFlat(e));
        }, {passive:false});
        this.gridEl.addEventListener('touchend', (e) => {
            if (!selecting) return; selecting=false;
            doSubmit(startFlat, touchFlat(e)); startFlat=null;
        });
    },

    _revealWord(wi, wd) {
        const item  = document.getElementById(`ws-item-${wi}`);
        const label = document.getElementById(`ws-label-${wi}`);
        if (!item||!label) return;
        gsap.fromTo(item, {scale:1},{
            scale:1.18, duration:0.15, yoyo:true, repeat:1, ease:'power2.out',
            onComplete: () => {
                item.classList.add('is-found');
                label.textContent = wd.word;
            }
        });
    },

    _celebrate(cells) {
        const emojis = ['💖','✨','🌸','💕','⭐','🎉','💗','🌟'];
        const midIdx = cells[Math.floor(cells.length/2)];
        const rect   = this.cells[midIdx].getBoundingClientRect();
        const ox = rect.left + rect.width/2, oy = rect.top + rect.height/2;
        for (let i = 0; i < 8; i++) {
            const b = document.createElement('div');
            b.className = 'ws-burst';
            b.textContent = emojis[i%emojis.length];
            b.style.left = ox+'px'; b.style.top = oy+'px';
            document.body.appendChild(b);
            const angle = (i/8)*Math.PI*2, dist = 55+Math.random()*45;
            gsap.fromTo(b,
                {x:0,y:0,opacity:1,scale:0.4},
                {x:Math.cos(angle)*dist, y:Math.sin(angle)*dist,
                 opacity:0, scale:1.3, duration:0.85, ease:'power2.out',
                 onComplete:()=>b.remove()}
            );
        }
    }
};


// ========================================
// SCENE 7 — YOUTUBE VIDEO
// ========================================
const Scene7 = {
    init() {
        this.wrapper     = document.getElementById('video-wrapper');
        this.backBtn     = document.getElementById('video-back-btn');
        this.continueBtn = document.getElementById('video-continue-btn');

        this.backBtn.addEventListener('click', () => {
            gsap.to(this.wrapper, {
                opacity: 0, y: 20, duration: 0.4, ease: 'power2.in',
                onComplete: () => SceneManager.goToScene(4)
            });
        });

        this.continueBtn.addEventListener('click', () => {
            gsap.to(this.wrapper, {
                opacity: 0, y: -20, duration: 0.5, ease: 'power2.in',
                onComplete: () => SceneManager.goToScene(8)
            });
        });
    },

    enter() {
        gsap.set(this.wrapper, { opacity: 0, y: 40 });
        gsap.to(this.wrapper, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out'
        });
    }
};

// ========================================
// SCENE 8 — THE END
// ========================================
const Scene8 = {
    init() {
        this.wrapper = document.getElementById('ending-wrapper');
        this.l1      = document.getElementById('ending-l1');
        this.l2      = document.getElementById('ending-l2');
        this.l3      = document.getElementById('ending-l3');
        this.hearts  = document.getElementById('ending-hearts');
    },

    enter() {
        // Reset
        gsap.set([this.l1, this.l2, this.l3, this.hearts], { opacity: 0, y: 30 });
        gsap.set(this.wrapper, { opacity: 1 });

        const tl = gsap.timeline();

        // "The End!" — big dramatic entrance
        tl.to(this.l1, {
            opacity: 1, y: 0,
            duration: 1.0,
            ease: 'back.out(1.4)',
            delay: 0.3
        })
        // Rest of the message fades in line by line
        .to(this.l2, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power2.out'
        }, '+=0.15')
        .to(this.l3, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power2.out'
        }, '-=0.3')
        // Hearts float in
        .to(this.hearts, {
            opacity: 1, y: 0,
            duration: 0.6, ease: 'power2.out'
        }, '+=0.2');
    }
};

// ========================================
// BOOT — wire everything up
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    MusicPlayer.init();
    Scene1.init();
    Scene2.init();
    Scene3.init();
    Scene4.init();
    Scene5.init();
    Scene6.init();
    Scene7.init();
    Scene8.init();

    // Photo fallback: if image fails to load, show emoji heart instead
    const photo = document.getElementById('vc-photo');
    if (photo) {
        photo.addEventListener('error', () => {
            photo.classList.add('error');
        });
    }
});

// Patch SceneManager to call scene enter() hooks
const _origGoTo = SceneManager.goToScene.bind(SceneManager);
SceneManager.goToScene = function(n) {
    _origGoTo(n);
    if (n === 2) setTimeout(() => Scene2.enter(), 350);
    if (n === 3) setTimeout(() => Scene3.enter(), 350);
    if (n === 4) setTimeout(() => Scene4.enter(), 350);
    if (n === 5) setTimeout(() => Scene5.enter(), 350);
    if (n === 6) setTimeout(() => Scene6.enter(), 350);
    if (n === 7) setTimeout(() => Scene7.enter(), 350);
    if (n === 8) setTimeout(() => Scene8.enter(), 400);
};
