precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;

uniform float vSyncAlpha;     // Position of V-Sync line (0 = bottom, 1 = top)
uniform float scanlineDark;   // Darkness of scanlines
uniform float scanlineThick;  // Thickness of scanlines
uniform float curveAmount;    // Amount of curve distortion
uniform float screenHeight;   // Screen height in pixels
uniform float time;   // Screen height in pixels

void main(void) {
    vec2 uv = vUV;

    // Curve distortion
    uv = uv * 2.0 - 1.0;  // Map UV to -1 to 1
    uv.x *= 1.0 + curveAmount * pow(abs(uv.y), 2.0);
    uv.y *= 1.0 + curveAmount * pow(abs(uv.x), 2.0);
    uv = uv * 0.5 + 0.5;  // Map back to 0 to 1

    // Scanlines effect
    float scanline = mod(gl_FragCoord.y, scanlineThick) < (scanlineThick / 2.0) ? 1.0 - scanlineDark : 1.0;

    // Scrolling V-Sync line (2x scanline thickness)
    float vSyncY = vSyncAlpha * screenHeight; // Map alpha to screen height
    float vSyncLine = abs(gl_FragCoord.y - vSyncY) < scanlineThick ? 0.8 : 1.0;

    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);

    float flicker = 0.95 + 0.05 * sin(time * 60.0);

    vec4 color = texture2D(textureSampler, uv);
    color.rgb *= scanline * vSyncLine;
    // color.rgb *= 1.0 - 0.05 * noise; // Subtle static
    // color.rgb *= flicker;

    gl_FragColor = color;
}
