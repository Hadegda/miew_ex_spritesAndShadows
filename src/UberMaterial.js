/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './Uber.vert';
import fragmentShader from './Uber.frag';
import capabilities from '../capabilities';

const defaultUniforms = THREE.UniformsUtils.merge([

    THREE.UniformsLib.fog,
    THREE.UniformsLib.lights,

    {
        // are updated automatically by three.js (see THREE.ShaderLib.common)
        diffuse: { value: new THREE.Color(0x111111) },
        specular: { type: 'c', value: new THREE.Color(0x111111) },
        shininess: { type: 'f', value: 30 },
        zOffset: { type: 'f', value: 0.0 },
        invModelViewMatrix: { type: '4fv', value: new THREE.Matrix4() },
        projMatrixInv: { type: '4fv', value: new THREE.Matrix4() },
    },

]);

const uberOptionNames = [
    'shininess',
    'zOffset',
    'diffuse',
    'specular',
    'projMatrixInv',
];

function UberMaterial(params) {
    THREE.RawShaderMaterial.call(this);

    this.instancedPos = false;
    this.instancedMatrix = false;
    this.sphereSprite = false;
    this.cylinderSprite = false;

    // uber options of "root" materials are inherited from single uber-options object that resides in prototype
    this.uberOptions = Object.create(UberMaterial.prototype.uberOptions);

    // set default values
    THREE.RawShaderMaterial.prototype.setValues.call(this, {
        uniforms: THREE.UniformsUtils.clone(defaultUniforms),
        vertexShader: this.precisionString() + vertexShader,
        fragmentShader: this.precisionString() + fragmentShader,
        lights: true,
        fog: true,
        side: THREE.DoubleSide,
    });

    this.setValues(params);
}

UberMaterial.prototype = Object.create(THREE.RawShaderMaterial.prototype);
UberMaterial.prototype.constructor = UberMaterial;

UberMaterial.prototype.precisionString = function () {
    const str = `precision highp float;\n`
        + `precision highp int;\n\n`;
    return str;
};

// properties that convert to uniforms
UberMaterial.prototype.uberOptions = {
    diffuse: new THREE.Color(0xffffff), // used in phong lighting
    specular: new THREE.Color(0x111111), // used in phong lighting
    shininess: 30, // used in phong lighting
    zOffset: 0.0, // used fo zsprites (see SPHERE_SPRITE CYLINDER_SPRITE)
    projMatrixInv: new THREE.Matrix4(),

    copy(source) {
        this.diffuse.copy(source.diffuse);
        this.specular.copy(source.specular);
        this.shininess = source.shininess;
        this.zOffset = source.zOffset;
        this.projMatrixInv = source.projMatrixInv;
    },
};

UberMaterial.prototype.copy = function (source) {
    THREE.RawShaderMaterial.prototype.copy.call(this, source);

    this.fragmentShader = source.fragmentShader;
    this.vertexShader = source.vertexShader;

    this.uniforms = THREE.UniformsUtils.clone(source.uniforms);
    this.defines = { ...source.defines };
    this.extensions = source.extensions;

    this.instancedPos = source.instancedPos;
    this.instancedMatrix = source.instancedMatrix;
    this.sphereSprite = source.sphereSprite;
    this.cylinderSprite = source.cylinderSprite;

    this.uberOptions.copy(source.uberOptions);

    return this;
};

// create copy of this material
// its options are prototyped after this material's options
UberMaterial.prototype.createInstance = function () {
    const inst = new UberMaterial();
    inst.copy(this);
    inst.uberOptions = Object.create(this.uberOptions);
    return inst;
};

UberMaterial.prototype.setValues = function (values) {
    if (typeof values === 'undefined') {
        return;
    }

    // set direct values
    THREE.RawShaderMaterial.prototype.setValues.call(this, values);

    const defines = {};
    const extensions = {};

    if (this.instancedPos) {
        defines.INSTANCED_POS = 1;
    }
    if (this.instancedMatrix) {
        defines.INSTANCED_MATRIX = 1;
    }
    if (this.sphereSprite) {
        defines.SPHERE_SPRITE = 1;
        extensions.fragDepth = 1;
    }
    if (this.cylinderSprite) {
        defines.CYLINDER_SPRITE = 1;
        extensions.fragDepth = 1;
    }
    // set dependent values
    this.defines = defines;
    this.extensions = extensions;
};

UberMaterial.prototype.setUberOptions = function (values) {
    if (typeof values === 'undefined') {
        return;
    }

    for (const key in values) {
        if (!values.hasOwnProperty(key)) {
            continue;
        }

        if (this.uberOptions[key] instanceof THREE.Color) {
            this.uberOptions[key] = values[key].clone();
        } else {
            this.uberOptions[key] = values[key];
        }
    }
};

UberMaterial.prototype.clone = function (shallow) {
    if (!shallow) {
        return THREE.Material.prototype.clone.call(this);
    }
    return this.createInstance();
};

UberMaterial.prototype.updateUniforms = function () {
    const self = this;

    uberOptionNames.forEach((p) => {
        if (self.uniforms.hasOwnProperty(p)) {
            if (self.uberOptions[p] instanceof THREE.Color
                || self.uberOptions[p] instanceof THREE.Matrix4) {
                self.uniforms[p].value = self.uberOptions[p].clone();
            } else {
                self.uniforms[p].value = self.uberOptions[p];
            }
        }
    });
};

export default UberMaterial;
