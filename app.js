// ========================================
// SCENE MANAGER
// ========================================
const SceneManager = {
    currentScene: 1,
    
    goToScene(sceneNumber) {
        // Exit current scene
        const currentSceneEl = document.querySelector(`#scene-${this.currentScene}`);
        const nextSceneEl = document.querySelector(`#scene-${sceneNumber}`);
        
        if (!nextSceneEl) {
            console.error(`Scene ${sceneNumber} not found`);
            return;
        }
        
        // Transition out current scene
        gsap.to(currentSceneEl, {
            opacity: 0,
            duration: 0.6,
            onComplete: () => {
                currentSceneEl.classList.remove('is-active');
            }
        });
        
        // Transition in next scene
        nextSceneEl.classList.add('is-active');
        gsap.fromTo(nextSceneEl, 
            { opacity: 0 },
            { opacity: 1, duration: 0.6, delay: 0.3 }
        );
        
        this.currentScene = sceneNumber;
    }
};

// ========================================
// SCENE 1: ENVELOPE ANIMATION
// ========================================
const Scene1 = {
    init() {
        this.envelope = document.getElementById('envelope');
        this.flap = document.getElementById('flap');
        this.clickHint = document.querySelector('.click-hint');
        
        this.setupClickHandler();
        this.playEntryAnimation();
    },
    
    setupClickHandler() {
        this.envelope.addEventListener('click', () => {
            this.playOpenAnimation();
        });
    },
    
    playEntryAnimation() {
        // Animate envelope and hint entering the scene
        const tl = gsap.timeline();
        
        tl.from(this.envelope, {
            scale: 0,
            rotation: -180,
            opacity: 0,
            duration: 1,
            ease: 'back.out(1.7)'
        })
        .from(this.clickHint, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out'
        }, '-=0.4');
    },
    
    playOpenAnimation() {
        // Disable further clicks
        this.envelope.style.pointerEvents = 'none';
        
        const tl = gsap.timeline({
            onComplete: () => {
                // Transition to next scene after animation
                this.transitionOut();
            }
        });
        
        // 1. Stop bobbing animation
        tl.set(this.envelope, {
            animation: 'none'
        })
        
        // 2. Wiggle excitedly
        .to(this.envelope, {
            rotation: -5,
            duration: 0.1,
            ease: 'power1.inOut'
        })
        .to(this.envelope, {
            rotation: 5,
            duration: 0.1,
            ease: 'power1.inOut'
        })
        .to(this.envelope, {
            rotation: -5,
            duration: 0.1,
            ease: 'power1.inOut'
        })
        .to(this.envelope, {
            rotation: 0,
            duration: 0.1,
            ease: 'power1.inOut'
        })
        
        // 3. Open the flap
        .to(this.flap, {
            rotationX: 180,
            duration: 0.8,
            ease: 'back.out(1.2)'
        }, '+=0.2')
        
        // 4. Fade out click hint
        .to(this.clickHint, {
            opacity: 0,
            duration: 0.3
        }, '-=0.6');
    },
    
    transitionOut() {
        const tl = gsap.timeline({
            onComplete: () => {
                SceneManager.goToScene(2);
            }
        });
        
        // Scale up and fade out the whole envelope
        tl.to(this.envelope, {
            scale: 1.5,
            y: -100,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.in'
        });
    }
};

// ========================================
// INITIALIZE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    Scene1.init();
});
