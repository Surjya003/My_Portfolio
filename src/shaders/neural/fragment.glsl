uniform float uTime;

varying float vDistToMouse;
varying float vBrightness;
varying float vPhase;

void main() {
    // Round soft-glow particle using gl_PointCoord
    vec2 uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.18, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5,  dist);
    float strength = core * 0.8 + glow * 0.2;
    strength = pow(strength, 1.3) * (0.5 + vBrightness * 0.5);

    // Color cycling: cyan → indigo → violet → cyan
    float t = uTime * 0.20 + vPhase;
    vec3 cyan   = vec3(0.0,  0.83, 1.0);
    vec3 indigo = vec3(0.49, 0.51, 1.0);
    vec3 violet = vec3(0.62, 0.24, 1.0);

    float t1 = abs(sin(t));
    float t2 = abs(sin(t + 1.047));
    float t3 = abs(sin(t + 2.094));
    float tot = t1 + t2 + t3 + 0.0001;

    vec3 color = (cyan * t1 + indigo * t2 + violet * t3) / tot;

    // Teal tint near mouse
    float prox = 1.0 - clamp(vDistToMouse / 5.0, 0.0, 1.0);
    color = mix(color, vec3(0.0, 0.85, 0.75), prox * 0.55);

    // White pulse near mouse
    color = mix(color, vec3(1.0), prox * abs(sin(uTime * 3.0)) * 0.4);

    gl_FragColor = vec4(color, strength * 0.45);
}
