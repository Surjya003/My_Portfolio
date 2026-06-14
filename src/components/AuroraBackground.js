import * as THREE from 'three';
import vertexShader from '../shaders/aurora/vertex.glsl';
import fragmentShader from '../shaders/aurora/fragment.glsl';

/**
 * AuroraBackground — Full-screen procedural GLSL nebula.
 * Uses a camera-space orthographic approach: the plane is a child of the camera
 * so it always fills the screen regardless of camera movement.
 */
export class AuroraBackground {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mouse = new THREE.Vector3(0, 0, 0);
        this.init();
    }

    init() {
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime:       { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uMouse:      { value: this.mouse }
            },
            depthWrite: false,
            depthTest:  false,
        });

        // A large plane that covers the full clip space when projected
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, this.material);

        // By using renderOrder -100 and disabling depth test, this renders first behind everything
        this.mesh.renderOrder = -100;
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;

        // Attach to camera so it moves with it
        this.camera.add(this.mesh);

        // Position it just in front of camera's near plane
        this.mesh.position.set(0, 0, -1);

        // Scale to fill the view
        this._resize();

        // Camera must be added to scene for its children to render
        if (!this.scene.children.includes(this.camera)) {
            this.scene.add(this.camera);
        }
    }

    _resize() {
        // Scale the plane to fill the camera frustum at z=-1
        const cam = this.camera;
        const fov = cam.fov * (Math.PI / 180);
        const h = 2 * Math.tan(fov / 2) * 1.0;  // height at distance 1 from camera (z=-1)
        const w = h * cam.aspect;
        this.mesh.scale.set(w, h, 1);
        this.mesh.updateMatrix();
    }

    updateMouse(worldMouse) {
        // Normalize to [-1, 1] for shader
        this.material.uniforms.uMouse.value.copy(worldMouse);
    }

    update(time) {
        this.material.uniforms.uTime.value = time;
    }

    onWindowResize() {
        this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        this._resize();
    }
}
