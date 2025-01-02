precision highp float;

varying vec2 vUV;
uniform sampler2D textureSampler; // UI texture
uniform float time;               // Scrolling time or global time
uniform float jitterAmount;       // Jitter intensity (adjustable for blur strength)
uniform float noiseIntensity;     // Noise intensity
uniform float vSyncAlpha;      // Scrolling V-Sync line position (0 to 1)
uniform float scanlineDark;   // Darkness of scanlines
uniform float scanlineThick;  // Thickness of scanlines
uniform float curveDistortion;    // CRT screen curve strength
uniform float screenHeight; // height of screen for vSync line

// Pseudo-random noise function
float random(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// Add noise with jitter-based blur
vec4 jitteredSample(vec2 uv, float jitter) {
    float noiseX = random(uv + vec2(time, 0.0)) * 2.0 - 1.0; // Random horizontal noise
    float noiseY = random(uv + vec2(0.0, time)) * 2.0 - 1.0; // Random vertical noise
    
    // Apply jitter: shift the UVs slightly
    vec2 jitteredUV = uv + vec2(noiseX, noiseY) * jitter;

    // Return the jittered texture sample
    return texture2D(textureSampler, jitteredUV);
}

void main(void) {
    // Apply CRT curve distortion
    vec2 uv = vUV * 2.0 - 1.0; // Normalize UV to [-1, 1]
    uv.x *= 1.0 + curveDistortion * pow(abs(uv.y), 2.0);
    uv.y *= 1.0 + curveDistortion * pow(abs(uv.x), 2.0);
    uv = uv * 0.5 + 0.5; // Back to [0, 1]

    // Base color with jitter-based sampling
    vec4 baseColor = vec4(0.0);
    baseColor += jitteredSample(uv, jitterAmount) * 0.5; // First jittered sample
    baseColor += jitteredSample(uv + vec2(0.001, 0.001), jitterAmount) * 0.5; // Slight offset
    
    // Add scanlines
    float scanline = mod(gl_FragCoord.y, scanlineThick) < (scanlineThick / 2.0) ? 1.0 - scanlineDark : 1.0;
    
    // baseColor.rgb *= scanline;

    // Scrolling V-Sync line (2x scanline thickness)
    float vSyncY = vSyncAlpha * screenHeight; // Map alpha to screen height
    float vSyncLine = abs(gl_FragCoord.y - vSyncY) < scanlineThick ? 0.5 : 1.0;

    baseColor.rgb *= scanline * vSyncLine;
    // Add fine noise
    float noise = random(uv * time) * noiseIntensity;
    baseColor.rgb += vec3(noise);

    // Final color
    gl_FragColor = baseColor;
}
