const USE_SPRITES = true;
const withUsageInvMatInShadows = false;

const SPHERES_IN_LINE = 64;

const OFFSET_SIZE = 4;
const COLOR_SIZE = 3;

let camera, scene, renderer;
let sphereSprite;
let uniforms;

init();
animate();

function setArrayXYZ(arr, idx, color) {
    arr[idx] = color.r;
    arr[idx + 1] = color.g;
    arr[idx + 2] = color.b;
}

function setArrayXYZW(arr, idx, vec, w) {
    arr[idx] = vec.x;
    arr[idx + 1] = vec.y;
    arr[idx + 2] = vec.z;
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

    initSpheres(scene, USE_SPRITES);

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

    const points = [
        { p: new THREE.Vector3(0.167, -0.706, 0.513), color: new THREE.Color(0xee0045)},
        { p: new THREE.Vector3(-0.439, -0.706, 0.317), color: new THREE.Color(0x45ee15)},
        { p: new THREE.Vector3(-0.439, -0.706, -0.317), color: new THREE.Color(0x78aa16)},
        { p: new THREE.Vector3(0.167, -0.706, -0.513), color: new THREE.Color(0x1245ee)},
        { p: new THREE.Vector3(0.539, -0.706, 0.0), color: new THREE.Color(0x111111)},
        { p: new THREE.Vector3(0.27, -0.167, 0.83), color: new THREE.Color(0x78aa16)},
        { p: new THREE.Vector3(0.27, -0.167, 0.83), color: new THREE.Color(0x1245ee)},
        { p: new THREE.Vector3(-0.706, -0.167, -0.513), color: new THREE.Color(0x111111)},
        { p: new THREE.Vector3(-0.873, -0.167, 0.0), color: new THREE.Color(0xee0045)},
        { p: new THREE.Vector3(-0.706, -0.167, -0.513), color: new THREE.Color(0x45ee15)},
        { p: new THREE.Vector3(20.0, 0.167, 20.0), color: new THREE.Color(0x111111)},
        { p: new THREE.Vector3(-20.0, 0.167, -20.0), color: new THREE.Color(0xee0045)},
        { p: new THREE.Vector3(20.0, 0.167, -20.0), color: new THREE.Color(0x45ee15)},
        { p: new THREE.Vector3(-20.0, 0.167, 20.0), color: new THREE.Color(0x78aa16)},
        { p: new THREE.Vector3(-20.0, 0.167, 20.0), color: new THREE.Color(0x1245ee)},
        { p: new THREE.Vector3(20.0, 0.706, 20.0), color: new THREE.Color(0x45ee15)},
        { p: new THREE.Vector3(-20.0, 0.706, -20.0), color: new THREE.Color(0x78aa16)},
        { p: new THREE.Vector3(20.0, 0.706, -20.0), color: new THREE.Color(0x1245ee)},
        { p: new THREE.Vector3(-20.0, 0.706, 20.0), color: new THREE.Color(0x111111)},
        { p: new THREE.Vector3(-20.0, 0.706, 20.0), color: new THREE.Color(0xee0045)},
    ];
    for (let k = 0; k < 5; k++) {
        points[k].p.x = points[k + 5].p.x = Math.cos(k * (2.0 * Math.PI / 5.0));
        points[k].p.z = points[k + 5].p.z = Math.sin(k * (2.0 * Math.PI / 5.0));
    }
    let shift = 2 * Math.PI / 10.0;
    for (let k = 10; k < 15; k++) {
        points[k].p.x = points[k + 5].p.x = Math.cos(shift + k * (2.0 * Math.PI / 5.0));
        points[k].p.z = points[k + 5].p.z = Math.sin(shift + k * (2.0 * Math.PI / 5.0));
    }

    for (let k = 0; k < 5; k++) {
        points[k].p.x *= Math.sin(0.786962166);
        points[k].p.z *= Math.sin(0.786962166);
    }
    for (let k = 5; k < 10; k++) {
        points[k].p.x *= Math.sin(1.40301018);
        points[k].p.z *= Math.sin(1.40301018);
    }
    for (let k = 10; k < 15; k++) {
        points[k].p.x *= Math.sin(1.40301018);
        points[k].p.z *= Math.sin(1.40301018);
    }
    for (let k = 15; k < 20; k++) {
        points[k].p.x *= Math.sin(0.786962166);
        points[k].p.z *= Math.sin(0.786962166);
    }

    for (let k = 0; k < 20; k++) {
        points[k].p.x *= 25.0;
        points[k].p.y *= 25.0;
        points[k].p.z *= 25.0;
    }

    /*const lines = [
        {p0:0, p1:1},
        {p0:1, p1:2},
        {p0:2, p1:3},
        {p0:3, p1:4},
        {p0:4, p1:0},
        {p0:0, p1:5},
        {p0:1, p1:6},
        {p0:2, p1:7},
        {p0:3, p1:8},
        {p0:4, p1:9},
        {p0:5, p1:10},
        {p0:5, p1:14},
        {p0:6, p1:11},
        {p0:6, p1:10},
        {p0:7, p1:12},
        {p0:7, p1:11},
        {p0:8, p1:13},
        {p0:8, p1:12},
        {p0:9, p1:14},
        {p0:9, p1:13},
        {p0:10, p1:15},
        {p0:11, p1:16},
        {p0:12, p1:17},
        {p0:13, p1:18},
        {p0:14, p1:19},
        {p0:15, p1:19},
        {p0:16, p1:15},
        {p0:17, p1:16},
        {p0:18, p1:17},
        {p0:19, p1:18},
    ];*/

    const lines = [
        {p0:0, p1:8},
        {p0:0, p1:11},
        {p0:0, p1:19},
        {p0:8, p1:11},
        {p0:8, p1:19},
        {p0:11, p1:19},
        {p0:1, p1:9},
        {p0:1, p1:12},
        {p0:1, p1:15},
        {p0:9, p1:12},
        {p0:9, p1:15},
        {p0:12, p1:15},
        {p0:2, p1:5},
        {p0:2, p1:13},
        {p0:2, p1:16},
        {p0:5, p1:13},
        {p0:5, p1:16},
        {p0:13, p1:16},
        {p0:3, p1:6},
        {p0:3, p1:14},
        {p0:3, p1:17},
        {p0:6, p1:14},
        {p0:6, p1:17},
        {p0:14, p1:17},
        {p0:4, p1:7},
        {p0:4, p1:10},
        {p0:4, p1:18},
        {p0:7, p1:10},
        {p0:7, p1:18},
        {p0:10, p1:18},
    ];

    const partGeo = isSprite ? new THREE.PlaneBufferGeometry( 2, 2, 1, 1 ) : new THREE.SphereBufferGeometry(1, 20 * 2, 20, 0, Math.PI * 2, 0, Math.PI);
    const geometry = new THREE.InstancedBufferGeometry().copy(partGeo);

    const _offsets = new Float32Array((points.length + lines.length * SPHERES_IN_LINE) * OFFSET_SIZE);
    const _colors = new Float32Array((points.length + lines.length * SPHERES_IN_LINE) * COLOR_SIZE);

    let i = 0;
    for (; i < points.length; i++) {
        setArrayXYZW(_offsets, i * OFFSET_SIZE, points[i].p, 2.0);
        setArrayXYZ(_colors, i * COLOR_SIZE, points[i].color)
    }

    const tmp = new THREE.Vector3();
    for (let l = 0; l < lines.length; l++) {
        for (let j = 0; j < SPHERES_IN_LINE; j++) {
            let t = j / SPHERES_IN_LINE;
            tmp.copy(points[lines[l].p0].p).multiplyScalar(1 - t);
            tmp.addScaledVector(points[lines[l].p1].p, t);

            setArrayXYZW(_offsets, i* OFFSET_SIZE, tmp, 0.5);
            setArrayXYZ(_colors, i * COLOR_SIZE, points[lines[l].p0].color)
            i++;
        }
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
        side: THREE.DoubleSide,
    } );
    if (isSprite) {
        material.defines.SPHERE_SPRITE =  1;
        material.extensions.fragDepth = true;
        material.uniforms = THREE.UniformsUtils.merge([material.uniforms, {zOffset: { type: 'f', value: 0.0 }}]);
    }
    material.defines.INSTANCED_POS = 1;
    const depthMaterial = new THREE.ShaderMaterial().copy(material);
    depthMaterial.defines.COLOR_FROM_DEPTH = 1;
    depthMaterial.defines.BUILD_SHADOWS = 1;
    if (withUsageInvMatInShadows) {
        depthMaterial.defines.USE_DISCARD_IN_SHADOWS = 1;
    }
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
    sphereSprite.rotation.y += 0.005;

    renderer.render( scene, camera );
}