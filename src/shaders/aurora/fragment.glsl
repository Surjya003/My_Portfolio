uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uMouse;

varying vec2 vUv;

/* ── Noise helpers ─────────────────────────────────── */
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

/* ── FBM for richer noise ─────────────────────────── */
float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; i++) {
        v += a * snoise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv;

    /* Subtle mouse parallax warp */
    float mx = uMouse.x * 0.04;
    float my = uMouse.y * 0.04;
    uv += vec2(mx, my);

    float t = uTime * 0.065;

    /* ── Layer 1: Deep nebula clouds ─────────────────── */
    vec3 p1 = vec3(uv * 1.6 + vec2(0.3, 0.1), t * 0.7);
    float n1 = fbm(p1);
    float n1b = fbm(p1 + vec3(1.4, -0.7, 0.3));
    float nebula = smoothstep(-0.25, 0.6, n1) * smoothstep(-0.2, 0.55, n1b);

    /* ── Layer 2: Flowing aurora bands ───────────────── */
    vec3 p2 = vec3(uv * vec2(2.2, 0.9) + vec2(-0.5, 0.8), t * 0.45);
    float n2 = snoise(p2) * 0.5 + snoise(p2 * 2.1 + vec3(0.7, -0.3, 0.9)) * 0.25;
    float aurora = smoothstep(0.05, 0.55, n2 + 0.3);

    /* ── Layer 3: Wispy tendrils ──────────────────────── */
    vec3 p3 = vec3(uv * 3.0 + vec2(t * 0.3, -t * 0.2), t * 0.5);
    float n3 = fbm(p3 + vec3(n1 * 0.5, n2 * 0.3, 0.0));
    float tendrils = smoothstep(0.1, 0.7, n3 * 0.5 + 0.3);

    /* ── Color palette (portfolio: cyan/indigo/violet/deep-blue) */
    vec3 deepSpace   = vec3(0.055, 0.063, 0.090);   // #0e1017 — near black
    vec3 cyanGlow    = vec3(0.000, 0.765, 0.953);   // #00c3f3 — electric cyan
    vec3 indigoGlow  = vec3(0.392, 0.400, 0.949);   // #6466f2 — indigo
    vec3 violetGlow  = vec3(0.545, 0.180, 0.859);   // #8b2edb — violet
    vec3 pinkGlow    = vec3(0.878, 0.176, 0.518);   // #e02d84 — hot pink (rare)
    vec3 tealGlow    = vec3(0.059, 0.549, 0.494);   // #0f8c7e — teal

    /* Animated color mixing — slow hue drift */
    float hueShift = sin(t * 0.6) * 0.5 + 0.5;

    vec3 auroraColor = mix(cyanGlow, indigoGlow, smoothstep(0.0, 0.5, hueShift));
    auroraColor = mix(auroraColor, violetGlow, smoothstep(0.4, 1.0, hueShift));

    /* Rare pink pulse (every ~30s) */
    float pinkPulse = smoothstep(0.85, 1.0, sin(t * 0.18) * 0.5 + 0.5);
    auroraColor = mix(auroraColor, pinkGlow, pinkPulse * 0.35);

    /* Teal accent on nebula edges */
    vec3 nebulaColor = mix(tealGlow, cyanGlow, nebula * 0.7);

    /* ── Compose layers ──────────────────────────────── */
    vec3 color = deepSpace;

    /* Nebula cloud base */
    color = mix(color, nebulaColor, nebula * 0.18);

    /* Aurora bands on top */
    color = mix(color, auroraColor, aurora * 0.26);

    /* Tendrils add detail */
    color = mix(color, mix(cyanGlow, indigoGlow, tendrils), tendrils * 0.10);

    /* Vignette — darken corners so content reads well */
    vec2 vigCoord = vUv * 2.0 - 1.0;
    float vignette = 1.0 - dot(vigCoord, vigCoord) * 0.38;
    color *= vignette;

    /* Glow hot-spots near top-left and bottom-right */
    float spot1 = exp(-length((uv - vec2(0.12, 0.10)) * 1.4) * 3.5);
    float spot2 = exp(-length((uv - vec2(0.88, 0.92)) * 1.4) * 4.0);
    color += cyanGlow * spot1 * 0.06;
    color += violetGlow * spot2 * 0.05;

    /* Subtle brightness push to avoid pure black */
    color = max(color, deepSpace * 1.1);

    gl_FragColor = vec4(color, 1.0);
}
