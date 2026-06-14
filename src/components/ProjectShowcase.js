import * as THREE from 'three';
import heartVertex from '../shaders/heart/vertex.glsl';
import heartFragment from '../shaders/heart/fragment.glsl';
import waterVertex from '../shaders/water/vertex.glsl';
import waterFragment from '../shaders/water/fragment.glsl';

export class ProjectShowcase {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.interactables = [];
        this.hoveredObject = null;

        this.init();
        this.addEventListeners();
    }

    init() {
        this.container = new THREE.Group();
        this.container.position.set(5, 0, -5); // Opposite side of skills
        this.scene.add(this.container);

        this.createHeartProject();
        this.createTitanicProject();
    }

    createHeartProject() {
        // Heart Disease Project
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        this.heartMaterial = new THREE.ShaderMaterial({
            vertexShader: heartVertex,
            fragmentShader: heartFragment,
            uniforms: {
                uTime: { value: 0 }
            }
        });

        this.heart = new THREE.Mesh(geometry, this.heartMaterial);
        this.heart.position.set(-2, 1, 0);
        this.heart.userData = { id: 'heart', name: 'Heart Disease Prediction' };

        this.container.add(this.heart);
        this.interactables.push(this.heart);
    }

    createTitanicProject() {
        // Titanic Project - Ship on Water
        const shipGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        const shipMaterial = new THREE.MeshStandardMaterial({ color: '#333' });
        this.ship = new THREE.Mesh(shipGeometry, shipMaterial);
        this.ship.position.set(2, 0.5, 0);
        this.ship.userData = { id: 'titanic', name: 'Titanic Classification' };

        // Water
        const waterGeometry = new THREE.PlaneGeometry(3, 3, 32, 32);
        this.waterMaterial = new THREE.ShaderMaterial({
            vertexShader: waterVertex,
            fragmentShader: waterFragment,
            uniforms: {
                uTime: { value: 0 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.water = new THREE.Mesh(waterGeometry, this.waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.set(2, 0, 0);

        this.container.add(this.ship);
        this.container.add(this.water);
        this.interactables.push(this.ship);
    }

    addEventListeners() {
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('click', () => {
            if (this.hoveredObject) {
                // Emit custom event
                const event = new CustomEvent('project-selected', {
                    detail: { projectId: this.hoveredObject.userData.id }
                });
                window.dispatchEvent(event);
            }
        });
    }

    update(time) {
        // Update uniforms
        if (this.heartMaterial) this.heartMaterial.uniforms.uTime.value = time;
        if (this.waterMaterial) this.waterMaterial.uniforms.uTime.value = time;

        // Animate ship
        if (this.ship) {
            this.ship.rotation.z = Math.sin(time * 2.0) * 0.05;
            this.ship.position.y = 0.5 + Math.sin(time * 1.5) * 0.1;
        }

        // Raycasting for interaction
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables);

        if (intersects.length > 0) {
            const object = intersects[0].object;

            if (this.hoveredObject !== object) {
                this.hoveredObject = object;
                document.body.style.cursor = 'pointer';
            }

            // Hover effect: Rotate faster or glow
            object.rotation.y += 0.05;
            object.scale.setScalar(THREE.MathUtils.lerp(object.scale.x, 1.2, 0.1));
        } else {
            if (this.hoveredObject) {
                this.hoveredObject.scale.setScalar(THREE.MathUtils.lerp(this.hoveredObject.scale.x, 1.0, 0.1));
                this.hoveredObject = null;
                document.body.style.cursor = 'default';
            }
        }
    }
}
