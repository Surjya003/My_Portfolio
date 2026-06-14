import * as THREE from 'three';

/**
 * ShootingStars — Periodic meteor-like streaks across the background.
 * Each comet is a short tapered line with a bright head and fading tail.
 * Uses instanced approach with manual position updates.
 */
export class ShootingStars {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.comets = [];
        this.MAX_COMETS = 6;
        this._spawnCooldown = 0;
        this._minInterval = 2.5;  // seconds between spawns
        this._lastTime = -1;

        this._initPool();
    }

    _initPool() {
        for (let i = 0; i < this.MAX_COMETS; i++) {
            const comet = this._createComet();
            comet.active = false;
            comet.mesh.visible = false;
            this.comets.push(comet);
            this.group.add(comet.mesh);
        }
    }

    _createComet() {
        const TAIL_LENGTH = 3.5 + Math.random() * 3.5;
        const SEGMENTS = 20;

        const positions = [];
        const colors = [];
        const alphas = [];

        for (let i = 0; i < SEGMENTS; i++) {
            const t = i / (SEGMENTS - 1);
            // Head at i=0, tail at i=SEGMENTS-1
            positions.push(t * TAIL_LENGTH, 0, 0);

            // Head: bright white-cyan, tail: dim indigo then transparent
            const headColor = new THREE.Color('#00d4ff');
            const tailColor = new THREE.Color('#4f46e5');
            const col = headColor.clone().lerp(tailColor, t);
            colors.push(col.r, col.g, col.b);

            // Alpha: 1 at head, 0 at tail
            alphas.push(1.0 - t);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            linewidth: 1
        });

        const mesh = new THREE.Line(geometry, material);
        mesh.frustumCulled = false;

        return {
            mesh,
            active: false,
            opacity: 0,
            life: 0,
            maxLife: 0,
            velocity: new THREE.Vector3(),
            tailLength: TAIL_LENGTH,
        };
    }

    _spawnComet(time) {
        // Find an inactive comet slot
        const comet = this.comets.find(c => !c.active);
        if (!comet) return;

        // Random spawn on a sphere edge behind/above camera
        const side = Math.random() > 0.5 ? 1 : -1;
        const startX = side * (10 + Math.random() * 8);
        const startY = 4 + Math.random() * 8;
        const startZ = -3 + Math.random() * 8;

        // Diagonal direction (upper-left to lower-right or vice versa)
        const vx = -side * (1.5 + Math.random() * 1.5);
        const vy = -(0.6 + Math.random() * 0.9);
        const vz = 0;

        comet.mesh.position.set(startX, startY, startZ);

        // Random rotation to vary the trail angle
        const angle = Math.atan2(vy, vx);
        comet.mesh.rotation.z = angle;

        comet.velocity.set(vx, vy, vz);
        comet.opacity = 0;
        comet.life = 0;
        comet.maxLife = 1.8 + Math.random() * 1.5;
        comet.active = true;
        comet.mesh.visible = true;
        comet.mesh.material.opacity = 0;
    }

    update(time) {
        if (this._lastTime < 0) {
            this._lastTime = time;
            return;
        }
        const dt = Math.min(time - this._lastTime, 0.1);
        this._lastTime = time;

        // Spawn cooldown
        this._spawnCooldown -= dt;
        if (this._spawnCooldown <= 0 && Math.random() < 0.35) {
            this._spawnComet(time);
            this._spawnCooldown = this._minInterval + Math.random() * 2.5;
        }

        // Update active comets
        for (const comet of this.comets) {
            if (!comet.active) continue;

            comet.life += dt;
            const progress = comet.life / comet.maxLife;

            if (progress >= 1.0) {
                comet.active = false;
                comet.mesh.visible = false;
                continue;
            }

            // Fade in first 15%, hold, fade out last 25%
            let opacity = 1.0;
            if (progress < 0.15) {
                opacity = progress / 0.15;
            } else if (progress > 0.75) {
                opacity = 1.0 - (progress - 0.75) / 0.25;
            }
            comet.mesh.material.opacity = opacity * 0.85;

            // Move along velocity
            comet.mesh.position.addScaledVector(comet.velocity, dt);
        }
    }

    onWindowResize() { /* nothing needed */ }
}
