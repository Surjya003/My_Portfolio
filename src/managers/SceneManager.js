
import * as THREE from 'three';
import { NeuralNetwork } from '../components/NeuralNetwork.js';
import { StarLayers } from '../components/StarLayers.js';
import { AuroraBackground } from '../components/AuroraBackground.js';
import { ShootingStars } from '../components/ShootingStars.js';

import { CameraManager } from './CameraManager.js';


export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.screenDimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.clock = new THREE.Clock();
        this.sceneSubjects = [];
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.worldMouse = new THREE.Vector3();
        this._animating = false;

        this.init();
    }

    init() {
        this.buildScene();
        this.buildRenderer();
        this.buildCamera();
        this.buildCameraManager();
        this.createSceneSubjects();
        this.addEventListeners();

        this.onWindowResize();
        this._animating = true;
        this.update();
    }

    buildScene() {
        this.scene = new THREE.Scene();

        // Transparent — AuroraBackground fills the screen instead.
        this.scene.background = null;

        // Subtle exponential fog to add depth to the neural particles
        this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.018);

        // ── 3-Point Lighting System ──

        // Key Light
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(5, 5, 5);
        this.scene.add(keyLight);

        // Fill Light — cool blue
        const fillLight = new THREE.PointLight(0x90baff, 1.0);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);

        // Rim Light — magenta accent
        const backLight = new THREE.DirectionalLight(0xcc44ff, 0.8);
        backLight.position.set(0, 5, -5);
        this.scene.add(backLight);

        // Ambient
        const ambientLight = new THREE.AmbientLight(0x202040, 0.6);
        this.scene.add(ambientLight);
    }

    buildRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true
        });

        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = false; // disabled for perf
        this.renderer.setClearColor(0x000000, 0);
    }

    buildCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.screenDimensions.width / this.screenDimensions.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);
    }

    buildCameraManager() {
        this.cameraManager = new CameraManager(this.scene, this.camera);
    }

    createSceneSubjects() {
        // ── 1. Aurora background (full-screen GLSL nebula) ──
        this.aurora = new AuroraBackground(this.scene, this.camera);
        this.sceneSubjects.push(this.aurora);

        // ── 2. Star layers (deep stars, Milky Way, nebula planes, planets) ──
        this.starLayers = new StarLayers(this.scene, this.camera);
        this.sceneSubjects.push(this.starLayers);

        // ── 3. Shooting stars / comets ──
        this.shootingStars = new ShootingStars(this.scene);
        this.sceneSubjects.push(this.shootingStars);

        // ── 4. Neural network particle cloud (foreground) ──
        this.neuralNetwork = new NeuralNetwork(this.scene);
        this.sceneSubjects.push(this.neuralNetwork);
    }

    addEventListeners() {
        this._resizeHandler = () => this.onWindowResize();
        window.addEventListener('resize', this._resizeHandler);

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!this.prefersReducedMotion) {
            this._mousePlaneZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            this._mouseTarget = new THREE.Vector3();

            this._mouseMoveHandler = (event) => {
                this.mouse.x = (event.clientX / window.innerWidth)  * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                this.raycaster.ray.intersectPlane(this._mousePlaneZ, this._mouseTarget);
                this.worldMouse.copy(this._mouseTarget);

                if (this.neuralNetwork) this.neuralNetwork.updateMouse(this.worldMouse);
                if (this.starLayers)    this.starLayers.updateMouse(this.worldMouse);
                if (this.aurora)        this.aurora.updateMouse(this.worldMouse);
            };
            window.addEventListener('mousemove', this._mouseMoveHandler);
        }
    }

    update() {
        if (!this._animating) return;
        requestAnimationFrame(() => this.update());

        const elapsedTime = this.clock.getElapsedTime();

        if (this.cameraManager) this.cameraManager.update();

        for (let i = 0; i < this.sceneSubjects.length; i++) {
            this.sceneSubjects[i].update(elapsedTime);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const { innerWidth, innerHeight, devicePixelRatio } = window;

        this.screenDimensions.width  = innerWidth;
        this.screenDimensions.height = innerHeight;

        if (this.camera) {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
        }

        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

        if (this.cameraManager) this.cameraManager.onWindowResize();
        if (this.aurora)        this.aurora.onWindowResize();
    }

    dispose() {
        this._animating = false;

        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        if (this._mouseMoveHandler) {
            window.removeEventListener('mousemove', this._mouseMoveHandler);
        }

        this.sceneSubjects.forEach(s => s.dispose && s.dispose());

        this.renderer.dispose();
    }
}
