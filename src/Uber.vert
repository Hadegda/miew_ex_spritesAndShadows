float INSTANCED_SPRITE_OVERSCALE = 1.3;

precision highp float;
precision highp int;

attribute vec4 offset;
attribute vec3 color;

varying vec4 instOffset;
varying vec4 spritePosEye;
varying vec3 vColor;

varying vec3 vViewPosition;

void main()	{
    vColor = color;

    #if defined(SPHERE_SPRITE)
    instOffset = offset;

    vec4 posEye = modelViewMatrix * vec4( offset.xyz, 1.0 );
    float scale = length(modelViewMatrix[0]);
    vec4 mvPosition = posEye + vec4( position.xyz * offset.w * scale * INSTANCED_SPRITE_OVERSCALE, 0.0 );
    posEye.w = offset.w * scale;

    spritePosEye = posEye;
    #else
    vec4 localPos = vec4( offset.xyz + position.xyz * offset.w, 1.0 );
    //      vec4 worldPos = modelMatrix * localPos;
    vec4 mvPosition = modelViewMatrix * localPos;
    #endif

    vViewPosition = - mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
