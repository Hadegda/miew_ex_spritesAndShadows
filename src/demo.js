const OFFSET_SIZE = 4;
const COLOR_SIZE = 3;

const SPHERE_COUNT = 256

let camera, scene, renderer;
let sphereSprite;
let uniforms;

init();
animate();

function setArrayXYZ(arr, idx, x, y, z) {
    arr[idx] = x;
    arr[idx + 1] = y;
    arr[idx + 2] = z;
}

function setArrayXYZW(arr, idx, x, y, z, w) {
    arr[idx] = x;
    arr[idx + 1] = y;
    arr[idx + 2] = z;
    arr[idx + 3] = w;
}

function init() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    document.body.appendChild( renderer.domElement );

    renderer.gammaOutput = true;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.004 );
    renderer.setClearColor( scene.fog.color, 1 );

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 80, 40, 80 );

    scene.add( camera );

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI / 2;

    scene.add( new THREE.AmbientLight( 0xffffff, 0.7 ) );

    let light = new THREE.DirectionalLight( 0xffffff, 0.4 );
    light.position.set( 50, 40, 0 );
    light.castShadow = true;
    light.shadow.camera.left = - 40;
    light.shadow.camera.right = 40;
    light.shadow.camera.top = 40;
    light.shadow.camera.bottom = - 40;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 180;
    light.shadow.bias = - 0.001;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;

    scene.add( light );
    // light shadow camera helper
    //light.shadowCameraHelper = new CameraHelper( light.shadow.camera );
    //scene.add( light.shadowCameraHelper );

    initSpheres(scene, false);

    var ground = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 800, 800 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshPhongMaterial( { color: 0x888888 } )
    );
    ground.position.set( 0, - 40, 0 );
    ground.receiveShadow = true;
    scene.add( ground );

    window.addEventListener( 'resize', onWindowResize, false );
}

function initSpheres(scene, isSprite) {
    const partGeo = isSprite ? new THREE.PlaneBufferGeometry( 2, 2, 1, 1 ) : new THREE.SphereBufferGeometry(1, 20 * 2, 20, 0, Math.PI * 2, 0, Math.PI);
    const geometry = new THREE.InstancedBufferGeometry().copy(partGeo);

    const _offsets = new Float32Array(SPHERE_COUNT * OFFSET_SIZE);
    for (let i = 0; i < SPHERE_COUNT; i++) {
        let x = (15.0 - 15.0 * i / SPHERE_COUNT) * Math.cos(i * (5 * Math.PI / SPHERE_COUNT));
        let z = (15.0 - 15.0 * i / SPHERE_COUNT) * Math.sin(i * (5 * Math.PI / SPHERE_COUNT));

        let y = 20.0 - 40.0 * Math.cos(i * (Math.PI / 2 / SPHERE_COUNT));

        let w = 8.0 - i * i * 8.0 / SPHERE_COUNT / SPHERE_COUNT;

        setArrayXYZW(_offsets, i * OFFSET_SIZE, x, y, z, w);
    }
    const _colors = new Float32Array(SPHERE_COUNT * COLOR_SIZE);
    for (let i = 0; i < SPHERE_COUNT; i++) {
        setArrayXYZ(_colors, i * COLOR_SIZE, 0.0, Math.abs(1.0 - i * 2.0 / SPHERE_COUNT), 1.0 - i * 1.0 / SPHERE_COUNT)
    }

    geometry.addAttribute('offset', new THREE.InstancedBufferAttribute(_offsets, OFFSET_SIZE, false, 1));
    geometry.addAttribute('color', new THREE.InstancedBufferAttribute(_colors, COLOR_SIZE, false, 1));

    uniforms = {
        diffuse: { type: 'c', value: new THREE.Color(0xeeeeee) },
        specular: { type: 'c', value: new THREE.Color(0x111111) },
        shininess: { type: 'f', value: 50 },
        invModelViewMatrix: { type: '4fv', value: new THREE.Matrix4() },
    };
    const material = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, uniforms]),
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        lights: true,
    } );
    if (isSprite) {
        material.defines.SPHERE_SPRITE =  1;
        material.extensions.fragDepth = true;
        material.uniforms = THREE.UniformsUtils.merge([material.uniforms, {zOffset: { type: 'f', value: 0.0 }}]);
    }
    material.defines.INSTANCED_POS = 1;
    const depthMaterial = new THREE.ShaderMaterial().copy(material);
    depthMaterial.defines.COLOR_FROM_DEPTH = 1;
    depthMaterial.lights = false;
    material.defines.USE_LIGHTS = 1;

    sphereSprite = new THREE.Mesh( geometry, material );
    sphereSprite.customDepthMaterial = depthMaterial;
    sphereSprite.castShadow = true;
    sphereSprite.receiveShadow = true;
    sphereSprite.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
        this.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);
        this.material.uniforms.invModelViewMatrix.value.getInverse(this.modelViewMatrix);
    }
    scene.add( sphereSprite );
}

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame( animate );
    sphereSprite.rotation.y += 0.05;

    renderer.render( scene, camera );
}