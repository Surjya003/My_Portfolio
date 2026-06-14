uniform float uTime;
uniform vec3 cameraPosition;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    // Red pulsing color
    float pulse = sin(uTime * 5.0) * 0.05 + 0.8;
    vec3 color = vec3(pulse, 0.1, 0.1);

    // Fresnel rim light with proper view direction
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

    color += fresnel * 0.5;

    gl_FragColor = vec4(color, 1.0);
}
