import './assets/js/script.js'; // Portfolio interactions (scroll-spy, animations, form)

// Optional: disable heavy Three.js scene on low-end devices via URL flag.
// Use: ?no3d=1
const shouldDisable3D = new URLSearchParams(window.location.search).get('no3d') === '1';


// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.querySelector('canvas.webgl');

if (!canvas) {
    console.warn('Canvas not found — 3D scene will not load.');
} else if (shouldDisable3D || prefersReducedMotion) {

    // Respect user preference — skip 3D entirely
    canvas.style.display = 'none';
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.remove();
    // Defer 3D initialization to prevent main-thread blocking on initial load
    const init3D = () => {
        setTimeout(() => {
            // Dynamic import — splits Three.js into a separate chunk for performance
            import('./src/managers/SceneManager.js').then(({ SceneManager }) => {
                try {
                    new SceneManager(canvas);

                    // Dismiss loading screen
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) {
                        loadingScreen.style.opacity = '0';
                        setTimeout(() => loadingScreen.remove(), 600);
                    }
                } catch (error) {
                    console.error('Error initializing 3D scene:', error);
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) loadingScreen.remove();
                }
            }).catch(error => {
                console.error('Failed to load 3D scene module:', error);
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) loadingScreen.remove();
            });
        }, 100);
    };

    if (document.readyState === 'complete') {
        init3D();
    } else {
        window.addEventListener('load', init3D);
    }
}
