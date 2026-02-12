// ========================================
// SCENE MANAGER
// ========================================
const SceneManager = {
    currentScene: 1,

    goToScene(n) {
        const from = document.querySelector(`#scene-${this.currentScene}`);
        const to   = document.querySelector(`#scene-${n}`);
        if (!to) return;

        gsap.to(from, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => from.classList.remove('is-active')
        });

        to.classList.add('is-active');
        gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3 });

        this.currentScene = n;
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
            gsap.to(this.card, {
                scale: 0.9, opacity: 0, duration: 0.4, ease: 'power2.in',
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
// BOOT — wire everything up
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    Scene1.init();
    Scene2.init();
    Scene3.init();
});

// Patch SceneManager to call scene enter() hooks
const _origGoTo = SceneManager.goToScene.bind(SceneManager);
SceneManager.goToScene = function(n) {
    _origGoTo(n);
    if (n === 2) setTimeout(() => Scene2.enter(), 350);
    if (n === 3) setTimeout(() => Scene3.enter(), 350);
};
