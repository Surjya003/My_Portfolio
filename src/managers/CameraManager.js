import * as THREE from 'three';

export class CameraManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.scrollProgress = 0;
        this.targetProgress = 0;
        this.curve = null;
        this.lookAtCurve = null;
        this.isMobile = false;

        this.checkMobile();
        this.initPath();
        this.addEventListeners();
    }

    checkMobile() {
        this.isMobile = window.innerWidth < 768;
    }

    initPath() {
        // Define key waypoints for the camera journey
        // Each point corresponds to a major section of the portfolio

        let points, lookAtPoints;

        if (this.isMobile) {
            // Mobile: Zoomed out to prevent clipping on portrait aspect ratio
            points = [
                new THREE.Vector3(0, 3, 25),     // 0.0 - Top: Inside Neural Particle Cloud (pulled back)
                new THREE.Vector3(0, 4, 18),     // 0.2 - About Me: Seeing cloud as backdrop
                new THREE.Vector3(-8, 4, 12),    // 0.5 - Skills: Centered on Skill Galaxy (0,0,0)
                new THREE.Vector3(8, 3, 12),     // 0.8 - Projects: Angled down to view Ship & Heart
                new THREE.Vector3(0, 2, 20)      // 1.0 - Contact: Back out for final view
            ];

            // LookAt targets for mobile (slightly offset for cinematic effect)
            lookAtPoints = [
                new THREE.Vector3(0, 0, 0),      // Looking into neural cloud center
                new THREE.Vector3(0, 1, 0),      // Looking at about content
                new THREE.Vector3(-5, 0, 0),     // Looking at skills galaxy
                new THREE.Vector3(5, -1, -2),    // Looking at projects (ship/heart)
                new THREE.Vector3(0, 0, 0)       // Looking at center
            ];
        } else {
            // Desktop: Closer, more immersive positions
            points = [
                new THREE.Vector3(0, 2, 20),     // 0.0 - Top: Inside Neural Particle Cloud
                new THREE.Vector3(0, 3, 12),     // 0.2 - About Me: Pulled back, cloud as backdrop
                new THREE.Vector3(-5, 2, 8),     // 0.5 - Skills: Centered on Skill Galaxy
                new THREE.Vector3(5, 1.5, 8),    // 0.8 - Projects: Angled down to view Ship & Heart
                new THREE.Vector3(0, 1, 15)      // 1.0 - Contact: Back out for overview
            ];

            // LookAt targets for desktop (slightly offset for smooth, cinematic rotation)
            lookAtPoints = [
                new THREE.Vector3(0, 0, 5),      // Looking slightly forward into cloud
                new THREE.Vector3(0, 1, 0),      // Looking at about content area
                new THREE.Vector3(-3, 0, 0),     // Looking at skills galaxy position
                new THREE.Vector3(5, 0, -2),     // Looking at projects area (ship/heart)
                new THREE.Vector3(0, 0, 0)       // Looking at center
            ];
        }

        // Create the camera path using Catmull-Rom spline
        // This creates a smooth curve through all waypoints
        this.curve = new THREE.CatmullRomCurve3(points);
        this.curve.tension = 0.5; // Controls curve smoothness (0 = sharp, 1 = very smooth)

        // Create a parallel curve for lookAt targets
        this.lookAtCurve = new THREE.CatmullRomCurve3(lookAtPoints);
        this.lookAtCurve.tension = 0.5;

        // Debug visualization (uncomment to see the camera path in the scene)
        // this.addDebugPath();
    }

    addDebugPath() {
        // Visual representation of the camera path (for development only)
        const pathPoints = this.curve.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const material = new THREE.LineBasicMaterial({
            color: 0xff0000,
            linewidth: 2,
            opacity: 0.5,
            transparent: true
        });
        const curveObject = new THREE.Line(geometry, material);
        this.scene.add(curveObject);

        // Add markers at waypoints
        pathPoints.forEach((point, index) => {
            if (index % 25 === 0) { // Show marker every 25 points
                const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                marker.position.copy(point);
                this.scene.add(marker);
            }
        });
    }

    addEventListeners() {
        // Scroll event listener with throttling for performance
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollProgress();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Map tab navigation to camera progress
        // Portfolio uses tabs (display:none), not scroll — so scrollY barely changes.
        // Listen for the custom event dispatched by script.js when a tab is clicked.
        const sectionProgress = {
            hero: 0.0,
            services: 0.2,
            work: 0.55,
            stack: 0.72,
            experience: 0.85,
            contact: 1.0
        };

        window.addEventListener('navigate-section', (e) => {
            const progress = sectionProgress[e.detail.section];
            if (progress !== undefined) {
                this.jumpToSection(progress);
            }
        });
    }

    updateScrollProgress() {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (maxScroll <= 50) {
            return;
        }
        this.targetProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }

    update() {
        // **CRITICAL: Smooth damping algorithm**
        // This prevents camera jitter by gradually interpolating to target
        // Formula: current += (target - current) * dampingFactor
        // Lower factor = smoother but slower, Higher = snappier but can jitter
        const dampingFactor = 0.05; // 5% of the difference per frame (smooth)

        this.scrollProgress += (this.targetProgress - this.scrollProgress) * dampingFactor;

        if (this.curve && this.lookAtCurve) {
            // Get position on the camera path curve
            const position = this.curve.getPointAt(this.scrollProgress);
            this.camera.position.copy(position);

            // **Cinematic LookAt Logic**
            // Instead of looking ahead on the path, we look at specific targets
            // This creates more intentional framing for each section
            const lookAtTarget = this.lookAtCurve.getPointAt(this.scrollProgress);

            // Optional: Add slight offset based on scroll progress for dynamic framing
            // This makes the camera feel more alive and less robotic
            const offsetX = Math.sin(this.scrollProgress * Math.PI * 2) * 0.5;
            const offsetY = Math.cos(this.scrollProgress * Math.PI * 2) * 0.3;

            lookAtTarget.x += offsetX;
            lookAtTarget.y += offsetY;

            this.camera.lookAt(lookAtTarget);
        }
    }

    onWindowResize() {
        // Called by SceneManager when window is resized
        // Camera aspect ratio is handled by SceneManager
        // We just need to check if we need to rebuild the path for mobile/desktop
        const wasMobile = this.isMobile;
        this.checkMobile();

        if (wasMobile !== this.isMobile) {
            this.initPath();
        }
    }

    // Utility method to get current section based on scroll progress
    getCurrentSection() {
        if (this.scrollProgress < 0.2)  return 'hero';
        if (this.scrollProgress < 0.55) return 'services';
        if (this.scrollProgress < 0.72) return 'work';
        if (this.scrollProgress < 0.85) return 'stack';
        if (this.scrollProgress < 1.0)  return 'experience';
        return 'contact';
    }

    // Optional: Jump to a specific section programmatically
    jumpToSection(sectionProgress) {
        this.targetProgress = Math.max(0, Math.min(1, sectionProgress));
    }
}
