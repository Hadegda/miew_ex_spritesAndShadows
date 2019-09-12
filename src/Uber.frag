#extension GL_EXT_frag_depth : enable

precision highp float;
precision highp int;

#define PI 3.14159265359
#define RECIPROCAL_PI 0.31830988618

varying vec4 instOffset;
varying vec4 spritePosEye;
varying vec3 vColor;

varying vec3 vViewPosition;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 invModelViewMatrix;
uniform mat3 normalMatrix;

uniform vec3 diffuse;
uniform vec3 specular;
uniform float shininess;

#if !defined (SPHERE_SPRITE)
varying vec3 vNormal;
#endif

float intersect_ray_sphere(in vec3 origin, in vec3 ray, out vec3 point) {
    // intersect XZ-projected ray with circle
    float a = dot(ray, ray);
    float b = dot(ray, origin);
    float c = dot(origin, origin) - 1.0;
    float det = b * b - a * c;
    if (det < 0.0) return -1.0;
    float t1 = (-b - sqrt(det)) / a;
    float t2 = (-b + sqrt(det)) / a;

    // calculate both intersection points
    vec3 p1 = origin + ray * t1;
    vec3 p2 = origin + ray * t2;

    // choose nearest point
    if (t1 >= 0.0) {
        point = p1;
        return t1;
    }
    if (t2 >= 0.0) {
        point = p2;
        return t2;
    }

    return -1.0;
}

float get_sphere_point(in vec3 pixelPosEye, out vec3 point) {
    // transform camera pos into sphere local coords
    vec4 v = invModelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 origin = (v.xyz - instOffset.xyz) / instOffset.w;

    // transform (camera -> pixel) ray into cylinder local coords
    v = invModelViewMatrix * vec4(pixelPosEye, 0.0);
    vec3 ray = normalize(v.xyz);

    return intersect_ray_sphere(origin, ray, point);
}

struct ReflectedLight {
    vec3 directDiffuse;
    vec3 directSpecular;
    vec3 indirectDiffuse;
};

struct BlinnPhongMaterial {
    vec3  diffuseColor;
    vec3  specularColor;
    float specularShininess;
};

struct GeometricContext {
    vec3 normal;
    vec3 viewDir;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

DirectionalLight directionalLight = DirectionalLight(vec3(0, 0.4, 0.9), vec3(0.45, 0.45, 0.45));
uniform vec3 ambientLightColor;

vec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {
    return RECIPROCAL_PI * diffuseColor;
}

vec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {
    float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
    return ( 1.0 - specularColor ) * fresnel + specularColor;
}

float D_BlinnPhong( const in float shininess, const in float dotNH ) {
    return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}

vec3 BRDF_Specular_BlinnPhong( const in DirectionalLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {
    vec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );
    float dotNH = saturate(dot( geometry.normal, halfDir ));
    float dotLH = saturate(dot( incidentLight.direction, halfDir ));

    vec3 F = F_Schlick( specularColor, dotLH );
    float G = 0.25;
    float D = D_BlinnPhong( shininess, dotNH );

    return F * ( G * D );
}

void RE_Direct_BlinnPhong( const in DirectionalLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

    float dotNL = saturate( dot( geometry.normal, directLight.direction ));

    vec3 irradiance = dotNL * directLight.color * PI;
    reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
    reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess );
}

void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
    reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
}

vec3 calcLighting(const in GeometricContext geometry, const in BlinnPhongMaterial material, vec3 vViewPosition) {
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ));
    vec3 irradiance = vec3(0.4, 0.4, 0.4) * PI;

    RE_Direct_BlinnPhong( directionalLight, geometry, material, reflectedLight);

    RE_IndirectDiffuse_BlinnPhong(irradiance, material, reflectedLight);

    return saturate(reflectedLight.indirectDiffuse + reflectedLight.directDiffuse + reflectedLight.directSpecular);
}

uniform float zOffset;
uniform mat4 projectionMatrix;

float calcDepthForSprites(vec4 pixelPosEye, float zOffset, mat4 projMatrix) {
    vec4 pixelPosScreen = projMatrix * pixelPosEye;
    return 0.5 * (pixelPosScreen.z / pixelPosScreen.w + 1.0) + zOffset;
}

vec3 viewNormalSprites;
vec3 normal;

void main()	{
    // ray-trace sphere surface
    #if defined(SPHERE_SPRITE)
    vec3 p;
    float d = get_sphere_point(-vViewPosition, p);
    if (d == -1.0) discard;
    /*pixelPosWorld = modelMatrix * vec4(instOffset.xyz + p * instOffset.w, 1.0);*/
    vec4 pixelPosEye = vec4(spritePosEye.xyz, 1.0);
    pixelPosEye.z += instOffset.w *
    (modelViewMatrix[0][2] * p.x +
    modelViewMatrix[1][2] * p.y +
    modelViewMatrix[2][2] * p.z);
    normal = normalize(normalMatrix * p);

    gl_FragDepthEXT = calcDepthForSprites(pixelPosEye, zOffset, projectionMatrix);
    #endif

    #if !defined (SPHERE_SPRITE)
    normal = vNormal;
    #endif

    GeometricContext geometry = GeometricContext(normal, normalize( vViewPosition ));
    BlinnPhongMaterial material = BlinnPhongMaterial(vColor, specular, shininess);
    vec3 outgoingLight = calcLighting(geometry, material, vViewPosition);

    gl_FragColor = vec4(outgoingLight, 1.0);
}