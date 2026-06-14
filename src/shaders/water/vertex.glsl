uniform float uTime;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Simple wave
    float wave = sin(pos.x * 2.0 + uTime) * 0.2 + cos(pos.z * 1.5 + uTime) * 0.2;
    pos.y += wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
