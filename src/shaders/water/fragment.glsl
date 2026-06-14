uniform float uTime;
varying vec2 vUv;

void main() {
    vec3 baseColor = vec3(0.0, 0.4, 0.8);

    // Animated wave stripes
    float wave = sin(vUv.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
    wave *= sin(vUv.y * 8.0 - uTime * 1.5) * 0.5 + 0.5;

    vec3 color = mix(baseColor, baseColor * 1.5, wave * 0.3);
    float alpha = 0.6 + wave * 0.2;

    gl_FragColor = vec4(color, alpha);
}
