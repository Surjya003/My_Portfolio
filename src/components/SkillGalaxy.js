import * as THREE from 'three';

export class SkillGalaxy {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Optional optimization: disable DOM label updates by default.
        this._labelsSkipped = true;


        this.skills = [
            { name: 'Python', type: 'core', color: '#306998' },
            { name: 'Machine Learning', type: 'core', color: '#FF6F00' },
            { name: 'Deep Learning', type: 'core', color: '#E53935' },
            { name: 'Pandas', type: 'satellite', color: '#150458' },
            { name: 'NumPy', type: 'satellite', color: '#4DABCF' },
            { name: 'Scikit-Learn', type: 'satellite', color: '#F7931E' },
            { name: 'PyTorch', type: 'satellite', color: '#EE4C2C' },
            { name: 'TensorFlow', type: 'satellite', color: '#FF6F00' },
            { name: 'SQL', type: 'satellite', color: '#00758F' },
            { name: 'Data Engineering', type: 'satellite', color: '#4CAF50' }
        ];

        this.dummy = new THREE.Object3D();
        this.labelElements = [];
        this.cachedColors = this.skills.map(skill => new THREE.Color(skill.color));

        this.init();
        this.createLabels();
    }

    init() {
        // Geometry
        const geometry = new THREE.IcosahedronGeometry(0.2, 1);

        // Material
        const material = new THREE.MeshStandardMaterial({
            roughness: 0.4,
            metalness: 0.6,
            flatShading: true
        });

        // Instanced Mesh
        this.mesh = new THREE.InstancedMesh(geometry, material, this.skills.length);

        this.updateLayout(0); // Initial layout

        // Container
        this.container = new THREE.Group();
        this.container.add(this.mesh);
        this.container.position.set(-5, 2, 5); // Position in the world (same as before)

        this.scene.add(this.container);
    }

    updateLayout(time) {
        let coreIndex = 0;
        let satelliteIndex = 0;

        const coreCount = this.skills.filter(s => s.type === 'core').length;
        const satelliteCount = this.skills.length - coreCount;

        for (let i = 0; i < this.skills.length; i++) {
            const skill = this.skills[i];

            if (skill.type === 'core') {
                // Place cores in a tight inner circle or center
                // If multiple cores, arrange them in a small ring
                const radius = coreCount > 1 ? 1.5 : 0;
                const angle = (coreIndex / coreCount) * Math.PI * 2 + time * 0.2;

                this.dummy.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle * 0.5) * 0.5, // Slight bob
                    Math.sin(angle) * radius
                );
                this.dummy.scale.set(1.5, 1.5, 1.5);

                coreIndex++;
            } else {
                // Place satellites in a larger outer ring
                const radius = 3.5;
                const angle = (satelliteIndex / satelliteCount) * Math.PI * 2 + time * 0.1;

                this.dummy.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle * 2.0 + time) * 0.5, // Wave motion
                    Math.sin(angle) * radius
                );
                this.dummy.scale.set(1, 1, 1);

                satelliteIndex++;
            }

            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, this.cachedColors[i]);

            // Store position for labels (world position relative to container)
            skill.position = this.dummy.position.clone();
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
    }

    createLabels() {
        // Create a container for labels if not exists
        let labelContainer = document.getElementById('skill-labels');
        if (!labelContainer) {
            labelContainer = document.createElement('div');
            labelContainer.id = 'skill-labels';
            labelContainer.style.position = 'fixed';
            labelContainer.style.top = '0';
            labelContainer.style.left = '0';
            labelContainer.style.width = '100%';
            labelContainer.style.height = '100%';
            labelContainer.style.pointerEvents = 'none';
            labelContainer.style.zIndex = '10';
            document.body.appendChild(labelContainer);
        }


        this.skills.forEach(skill => {
            const label = document.createElement('div');
            label.textContent = skill.name;
            label.style.position = 'absolute';
            label.style.color = 'white';
            label.style.fontFamily = 'var(--ff-poppins, sans-serif)';
            label.style.fontSize = '12px';
            label.style.fontWeight = '500';
            label.style.textShadow = '0 0 4px rgba(0,0,0,0.8)';
            label.style.transform = 'translate(-50%, -50%)';
            label.style.opacity = '0'; // Hidden initially
            label.style.transition = 'opacity 0.3s';

            labelContainer.appendChild(label);
            this.labelElements.push(label);
        });
    }

    updateLabels() {
        // Reuse vector to avoid per-frame allocations.
        if (!this._tempV) this._tempV = new THREE.Vector3();

        const tempV = this._tempV;

        for (let i = 0; i < this.skills.length; i++) {

            const skill = this.skills[i];
            const label = this.labelElements[i];

            // Get world position of the skill node
            // Node pos is local to container, so we need to apply container's world matrix
            // But container is just moved, not rotated/scaled much (except init rotation)
            // Better: clone position and apply matrixWorld

            tempV.copy(skill.position);
            tempV.applyMatrix4(this.container.matrixWorld);

            // Project to screen
            tempV.project(this.camera);

            // Convert to CSS coordinates
            const x = (tempV.x * .5 + .5) * window.innerWidth;
            const y = (tempV.y * -.5 + .5) * window.innerHeight;

            // Check if visible (in front of camera and within screen)
            if (tempV.z < 1 && x > 0 && x < window.innerWidth && y > 0 && y < window.innerHeight) {
                label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

                // Fade in based on distance? Or just always show if on screen
                // Let's fade out if too far
                const dist = this.camera.position.distanceTo(this.container.position);
                if (dist < 15) {
                    label.style.opacity = '1';
                } else {
                    label.style.opacity = '0';
                }
            } else {
                label.style.opacity = '0';
            }
        }
    }

    update(time) {
        // Rotate the galaxy slowly
        // this.container.rotation.y = time * 0.1; 
        // Actually, we are animating positions in updateLayout, so maybe just rotate container slightly

        // Labels are optional and expensive; skip in reduced motion.
        // Also prevents extra allocations/calc every frame.
        this.updateLayout(time);
        if (!this._labelsSkipped) {
            this.updateLabels();
        }

    }
}
