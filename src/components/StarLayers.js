import * as THREE from 'three';

/**
 * Starfield layers per spec (approximate with available assets/no textures):
 * Layer 1: deep star sphere (10k+ points, twinkle, subtle rotation)
 * Layer 2: Milky Way band (dense disc-ish point distribution)
 * Layer 3: nebula clouds (procedural sprite-like planes)
 * Layer 4: solar system planets (simple spheres + ring)
 * Layer 5: parallax (handled by updating targets from SceneManager)
 */
export class StarLayers {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.mouseWorld = new THREE.Vector3(0, 0, 0);
    this._parallaxTarget = new THREE.Vector3(0, 0, 0);

    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    this._buildLayer1DeepStars();
    this._buildLayer2MilkyWay();
    this._buildLayer3Nebula();
    this._buildLayer4Planets();

    this._tmpV = new THREE.Vector3();
    this._tmpColor = new THREE.Color();

    this._orbitAngle = 0;

    // Set initial camera-relative scale (keeps things visible at different aspect ratios)
    this._syncToViewport();
    window.addEventListener('resize', () => this._syncToViewport());
  }

  updateMouse(worldMouse) {
    // worldMouse is on an arbitrary plane from SceneManager.
    // We only care about small offsets.
    this.mouseWorld.copy(worldMouse);
  }

  _syncToViewport() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const s = Math.max(0.8, Math.min(1.2, Math.min(w / 1200, h / 800)));
    this._viewportScale = s;
  }

  _buildLayer1DeepStars() {
    const count = 5000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkle = new Float32Array(count);

    // Simple color palette (spec: realistic-ish)
    const palette = [
      { c: new THREE.Color('#ffffff'), w: 0.55 },
      { c: new THREE.Color('#b9d6ff'), w: 0.25 },
      { c: new THREE.Color('#ffd19a'), w: 0.14 },
      { c: new THREE.Color('#ff9aa2'), w: 0.06 }
    ];

    const pickPalette = () => {
      const r = Math.random();
      let acc = 0;
      for (const p of palette) {
        acc += p.w;
        if (r <= acc) return p.c;
      }
      return palette[0].c;
    };

    for (let i = 0; i < count; i++) {
      // Place inside a sphere (not just surface) for depth feel
      const radius = 18 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = pickPalette();
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      const size = 0.5 + Math.random() * 2.5; // 0.5px - 3px (approx in world)
      sizes[i] = size;
      twinkle[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkle, 1));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      sizeAttenuation: true
    });

    // We will emulate twinkle by updating opacity array-ish via PointsMaterial opacity not per-point.
    // To keep it fast, we twinkle subtly by rotating + overall opacity modulation.

    this.layer1 = new THREE.Points(geometry, material);
    this.layer1.name = 'layer1-deep-stars';
    this.group.add(this.layer1);
  }

  _buildLayer2MilkyWay() {
    // Milky Way band: denser disc-like distribution crossing diagonally.
    const count = 2000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.45) * 24; // denser near center
      const a = Math.random() * Math.PI * 2;

      // Disc plane is tilted (diagonal)
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;

      // Height variance (thin band)
      const y = (Math.random() - 0.5) * 1.8;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Warm-to-cool gradient by radius
      const t = THREE.MathUtils.clamp(r / 24, 0, 1);
      const warm = new THREE.Color('#ffd27a');
      const cool = new THREE.Color('#6b93ff');
      const col = warm.lerp(cool, t);
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.10,
      vertexColors: true,
      transparent: true,
      opacity: 0.20,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.layer2 = new THREE.Points(geometry, material);
    this.layer2.rotation.x = Math.PI * 0.32;
    this.layer2.rotation.y = Math.PI * 0.12;
    this.group.add(this.layer2);
  }

  _buildLayer3Nebula() {
    // Procedural nebula clouds (no texture assets). We'll use translucent planes with gradients.
    this.layer3 = new THREE.Group();

    const cloudCount = 2;
    for (let i = 0; i < cloudCount; i++) {
      const w = 10 + Math.random() * 10;
      const h = 6 + Math.random() * 10;

      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: i % 2 === 0 ? new THREE.Color('#8a5cff') : new THREE.Color('#ffd28a')
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (-10 + Math.random() * 20),
        (-3 + Math.random() * 8),
        (-8 + Math.random() * 16)
      );
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.x = (Math.random() - 0.5) * 0.7;

      // Add a custom shader-less visual: scale only; color/opacity gives enough nebula glow with additive blending.
      this.layer3.add(mesh);
    }

    this.group.add(this.layer3);
  }

  _buildLayer4Planets() {
    this.layer4 = new THREE.Group();
    this.group.add(this.layer4);

    // Planets orbit around a central point — pushed further back (z=-8)
    const orbitRadius = 6;
    this._orbitRadius = orbitRadius;

    // Sun glow (smaller, further back)
    const sunGeo = new THREE.SphereGeometry(0.30, 24, 24);
    const sunMat = new THREE.MeshStandardMaterial({
      color: '#ffd27a',
      emissive: '#ffb25c',
      emissiveIntensity: 1.6,
      roughness: 0.35,
      metalness: 0.0
    });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.sun.position.set(0, 0, -8);
    this.layer4.add(this.sun);

    // Earth
    const earthGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const earthMat = new THREE.MeshStandardMaterial({
      color: '#4fa3ff',
      emissive: '#1c7cff',
      emissiveIntensity: 0.4,
      roughness: 0.6,
      metalness: 0.0
    });
    this.earth = new THREE.Mesh(earthGeo, earthMat);

    // Mars
    const marsGeo = new THREE.SphereGeometry(0.14, 20, 20);
    const marsMat = new THREE.MeshStandardMaterial({
      color: '#c45a4a',
      emissive: '#8f2e27',
      emissiveIntensity: 0.25,
      roughness: 0.65,
      metalness: 0.0
    });
    this.mars = new THREE.Mesh(marsGeo, marsMat);

    // Saturn ringed (small)
    const satGeo = new THREE.SphereGeometry(0.16, 20, 20);
    const satMat = new THREE.MeshStandardMaterial({
      color: '#d9c7a2',
      emissive: '#8a7a55',
      emissiveIntensity: 0.18,
      roughness: 0.6,
      metalness: 0.0
    });
    this.saturn = new THREE.Mesh(satGeo, satMat);

    const ringGeo = new THREE.RingGeometry(0.22, 0.45, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#d9c7a2',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.40,
      emissive: '#8a7a55',
      emissiveIntensity: 0.06,
      roughness: 0.65
    });
    this.saturnRing = new THREE.Mesh(ringGeo, ringMat);
    this.saturnRing.rotation.x = Math.PI * 0.5;

    this.layer4.add(this.earth);
    this.layer4.add(this.mars);
    this.layer4.add(this.saturn);
    this.layer4.add(this.saturnRing);

    this.layer4.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });

    // Start positions
    this._planetPhase = {
      earth: 0.2,
      mars: 2.1,
      saturn: 3.9
    };
  }

  update(time) {
    // time is seconds

    const s = this._viewportScale || 1;

    // Layer 1: subtle rotation + twinkle-like modulation
    this.group.rotation.y = time * 0.008;
    if (this.layer1 && this.layer1.material) {
      const tw = 0.22 + 0.09 * Math.sin(time * 0.9);
      this.layer1.material.opacity = tw;
    }

    // Layer 2: slight drift
    if (this.layer2) {
      this.layer2.rotation.y += 0.0009;
    }

    // Layer 3: nebula drift
    if (this.layer3) {
      let idx = 0;
      for (const child of this.layer3.children) {
        child.position.x += Math.sin(time * 0.08 + idx) * 0.0008;
        child.position.y += Math.cos(time * 0.07 + idx) * 0.0006;
        idx++;
      }
    }

    // Layer 4: solar system orbits (slow)
    const orbit = this._orbitRadius * s;
    const t = time;

    this._orbitAngle = t * 0.08;

    // Planets orbit at z=-8 offset (pushed behind main scene)
    const ZB = -8;
    this.earth.position.set(Math.cos(t * 0.06 + this._planetPhase.earth) * orbit, Math.sin(t * 0.06 + this._planetPhase.earth) * 0.6, ZB + Math.sin(t * 0.05 + this._planetPhase.earth) * orbit * 0.3);
    this.mars.position.set(Math.cos(t * 0.04 + this._planetPhase.mars) * orbit * 0.75, -0.3 + Math.sin(t * 0.04 + this._planetPhase.mars) * 0.5, ZB + Math.sin(t * 0.04 + this._planetPhase.mars) * orbit * 0.3);

    const satA = t * 0.03 + this._planetPhase.saturn;
    this.saturn.position.set(Math.cos(satA) * orbit * 0.9, Math.sin(satA) * 0.45, ZB + Math.sin(satA) * orbit * 0.3);
    this.saturnRing.position.copy(this.saturn.position);
    this.saturnRing.rotation.y = satA;
    this.saturnRing.rotation.x = Math.PI * 0.5;

    // Layer 5: parallax interaction (stars shift most, planets shift less, UI unaffected)
    // Use mouseWorld offsets; clamp.
    const mx = THREE.MathUtils.clamp(this.mouseWorld.x / 10, -1, 1);
    const my = THREE.MathUtils.clamp(this.mouseWorld.y / 10, -1, 1);

    this.layer1.position.set(mx * 0.9, my * 0.6, 0);
    this.layer2.position.set(mx * 0.55, my * 0.35, 0);
    if (this.layer3) this.layer3.position.set(mx * 0.25, my * 0.18, 0);
    this.layer4.position.set(mx * 0.12, my * 0.09, 0);
  }
}

