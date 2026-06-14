uniform float uTime;
uniform vec3  uMouse;
uniform float uPixelRatio;

attribute float aRandom;
attribute float aSpeed;
attribute float aColorPhase;

varying float vDistToMouse;
varying float vBrightness;
varying float vPhase;

void main() {
    vec3 pos = position;

    // Breathing: per-particle frequency scaled by aSpeed
    float speed = 0.7 + aSpeed * 1.3;
    pos.y += sin(uTime * speed       + aRandom * 6.28319) * 0.08;
    pos.x += cos(uTime * speed * 0.7 + aRandom * 4.20)    * 0.05;
    pos.z += sin(uTime * speed * 0.5 + aRandom * 3.10)    * 0.04;

    // Slow orbital spin around origin
    float orbitT = uTime * 0.035 * (0.5 + aRandom * 0.8);
    float cosO = cos(orbitT);
    float sinO = sin(orbitT);
    float ox = pos.x * cosO - pos.z * sinO;
    float oz = pos.x * sinO + pos.z * cosO;
    pos.x = ox;
    pos.z = oz;

    // Mouse repulsion
    float dist = distance(pos, uMouse);
    vDistToMouse = dist;

    if (dist < 5.0) {
        vec3 dir   = normalize(pos - uMouse);
        float force = pow(1.0 - dist / 5.0, 2.0) * 4.0;
        pos += dir * force;
    }

    vBrightness = 1.0 - clamp(length(pos.xy) / 12.0, 0.0, 0.75);
    vPhase = aColorPhase;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Point size: bigger near camera, larger when mouse is close
    float size = (40.0 + aRandom * 30.0) * uPixelRatio;
    float proximity = 1.0 - clamp(dist / 5.0, 0.0, 1.0);
    size *= (1.0 + proximity * 1.8);
    gl_PointSize = clamp(size / (-mvPos.z), 0.8, 4.0);
}
