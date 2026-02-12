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
// BOOT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    Scene1.init();
});
