import * as THREE from 'three';
import vertexShader   from '../shaders/neural/vertex.glsl';
import fragmentShader from '../shaders/neural/fragment.glsl';

/**
 * NeuralNetwork — Dense glowing particle cloud using THREE.Points.
 * Each particle is a round soft-glow dot with animated color cycling.
 * Mouse repulsion + breathing + orbital drift driven by GLSL shaders.
 */
export class NeuralNetwork {
    constructor(scene) {
        this.scene = scene;
        this.count = 1500;
        this.mouse = new THREE.Vector3(9999, 9999, 9999);

        this._positions = null;
        this._connectionLines = null;

        this.init();
        this._buildConnectionLines();
    }

    init() {
        const geometry = new THREE.BufferGeometry();

        const positions    = new Float32Array(this.count * 3);
        const randoms      = new Float32Array(this.count);
        const speeds       = new Float32Array(this.count);
        const colorPhases  = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            const radius = 3.5 + Math.random() * 8.5;
            const theta  = Math.random() * Math.PI * 2;
            const phi    = Math.acos((Math.random() * 2) - 1);

            positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            randoms[i]     = Math.random();
            speeds[i]      = Math.random();
            colorPhases[i] = Math.random() * Math.PI * 2;
        }

        this._positions = positions;

        geometry.setAttribute('position',    new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aRandom',     new THREE.BufferAttribute(randoms, 1));
        geometry.setAttribute('aSpeed',      new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('aColorPhase', new THREE.BufferAttribute(colorPhases, 1));

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime:       { value: 0 },
                uMouse:      { value: this.mouse },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        this.points = new THREE.Points(geometry, this.material);
        this.points.frustumCulled = false;
        this.scene.add(this.points);
    }

    _buildConnectionLines() {
        const SAMPLE = 300;
        const MAX_DIST = 2.4;
        const MAX_EDGES = 300;

        const verts = [];

        for (let i = 0; i < SAMPLE && verts.length / 6 < MAX_EDGES; i++) {
            const ax = this._positions[i * 3];
            const ay = this._positions[i * 3 + 1];
            const az = this._positions[i * 3 + 2];

            for (let j = i + 1; j < SAMPLE && verts.length / 6 < MAX_EDGES; j++) {
                const bx = this._positions[j * 3];
                const by = this._positions[j * 3 + 1];
                const bz = this._positions[j * 3 + 2];

                const d2 = (ax-bx)*(ax-bx) + (ay-by)*(ay-by) + (az-bz)*(az-bz);
                if (d2 < MAX_DIST * MAX_DIST) {
                    verts.push(ax, ay, az, bx, by, bz);
                }
            }
        }

        if (!verts.length) return;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(verts), 3));

        const mat = new THREE.LineBasicMaterial({
            color: new THREE.Color('#4d80ff'),
            transparent: true,
            opacity: 0.09,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this._connectionLines = new THREE.LineSegments(geo, mat);
        this._connectionLines.frustumCulled = false;
        this.scene.add(this._connectionLines);
    }

    updateMouse(worldMouse) {
        this.material.uniforms.uMouse.value.copy(worldMouse);
        this.mouse.copy(worldMouse);
    }

    update(time) {
        this.material.uniforms.uTime.value = time;

        if (this._connectionLines) {
            const pulse = 0.07 + 0.05 * Math.sin(time * 0.35);
            this._connectionLines.material.opacity = pulse;
            this._connectionLines.rotation.y = time * 0.007;
            this._connectionLines.rotation.x = time * 0.0035;
        }
    }
}
