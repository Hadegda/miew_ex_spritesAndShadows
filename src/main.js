const OFFSET_SIZE = 4;
const COLOR_SIZE = 3;

let camera, scene, renderer, clock;
let dirLight;
let sphereSprite, cylinderSprite;
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
	initScene();
	initMisc();
	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
}

function initLight(scene) {
	dirLight = new THREE.DirectionalLight( 0xffffff, 0.45 );
	dirLight.name = 'Dir. Light';
	dirLight.position.set(0.3, 12.414, 12);
	dirLight.castShadow = true;
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = 30;
	dirLight.shadow.camera.right = 15;
	dirLight.shadow.camera.left = - 15;
	dirLight.shadow.camera.top	= 15;
	dirLight.shadow.camera.bottom = - 15;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	scene.add( dirLight );
	scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );
}

function _calcCylinderMatrix(posBegin, posEnd, radius) {
	const posCenter = posBegin.clone().lerp(posEnd, 0.5);
	const matScale = new THREE.Matrix4();
	matScale.makeScale(radius, posBegin.distanceTo(posEnd), radius);

	const matRotHalf = new THREE.Matrix4();
	matRotHalf.makeRotationX(Math.PI / 2);

	const matRotLook = new THREE.Matrix4();
	const vUp = new THREE.Vector3(0, 1, 0);
	matRotLook.lookAt(posCenter, posEnd, vUp);

	matRotLook.multiply(matRotHalf);
	matRotLook.multiply(matScale);
	matRotLook.setPosition(posCenter);
	return matRotLook;
}

function initSpheres(scene, isSprite) {
	const partGeo = isSprite ? new THREE.PlaneBufferGeometry( 2, 2, 1, 1 ) : new THREE.SphereBufferGeometry(1, 20 * 2, 20, 0, Math.PI * 2, 0, Math.PI);
	const geometry = new THREE.InstancedBufferGeometry().copy(partGeo);

	const _offsets = new Float32Array(4 * OFFSET_SIZE);
	setArrayXYZW(_offsets, 0, 1.0, 4.0, 1.0, 0.8);
	setArrayXYZW(_offsets, 4, -1.0, 2.0, 1.0, 0.8);
	setArrayXYZW(_offsets, 8, -1.0, 4.0, -1.0, 0.8);
	setArrayXYZW(_offsets, 12, 1.0, 2.0, -1.0, 0.8);
	const _colors = new Float32Array(4 * COLOR_SIZE);
	setArrayXYZ(_colors, 0, 0.0, 0.0, 1.0)
	setArrayXYZ(_colors, 3, 0.0, 0.0, 1.0)
	setArrayXYZ(_colors, 6, 0.0, 0.0, 1.0)
	setArrayXYZ(_colors, 9, 0.0, 0.0, 1.0)

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

function initCylinders(scene, isSprite) {
	const tmpColor = new THREE.Color();
	const invMatrix = new THREE.Matrix4();

	const partGeo = isSprite ? new THREE.PlaneBufferGeometry( 2, 2, 1, 1 ) : new CylinderBufferGeometry(1, 1, 1.0, 10, 2, true);
	const geometry = new THREE.InstancedBufferGeometry().copy(partGeo);

	const _matVector1 = new Float32Array(1 * OFFSET_SIZE);
	const _matVector2 = new Float32Array(1 * OFFSET_SIZE);
	const _matVector3 = new Float32Array(1 * OFFSET_SIZE);
	const _invmatVector1 = new Float32Array(1 * OFFSET_SIZE);
	const _invmatVector2 = new Float32Array(1 * OFFSET_SIZE);
	const _invmatVector3 = new Float32Array(1 * OFFSET_SIZE);

	function setCylinderItem(itemIdx, matVec1, matVec2, matVec3, invmatVec1, invmatVec2, invmatVec3, botPos, topPos, itemRad) {
		const matrix = _calcCylinderMatrix(botPos, topPos, itemRad);
		let me = matrix.elements;
		const mtxOffset = itemIdx * OFFSET_SIZE;

		//this._collisionGeo.setItem(itemIdx, botPos, topPos, itemRad);
		setArrayXYZW(matVec1, mtxOffset, me[0], me[4], me[8], me[12]);
		setArrayXYZW(matVec2, mtxOffset, me[1], me[5], me[9], me[13]);
		setArrayXYZW(matVec3, mtxOffset, me[2], me[6], me[10], me[14]);

		if (this._useZSprites) {
			invMatrix.getInverse(matrix);
			me = invMatrix.elements;
			setArrayXYZW(invmatVec1, mtxOffset, me[0], me[4], me[8], me[12]);
			setArrayXYZW(invmatVec2, mtxOffset, me[1], me[5], me[9], me[13]);
			setArrayXYZW(invmatVec3, mtxOffset, me[2], me[6], me[10], me[14]);
		}
	}

	const p0 = new THREE.Vector3(1.0, 4.0, 1.0);
	const p1 = new THREE.Vector3(-1.0, 2.0, 1.0);
	const p2 = new THREE.Vector3(-1.0, 4.0, -1.0);
	const p3 = new THREE.Vector3(1.0, 2.0, -1.0);

	setCylinderItem(0, _matVector1, _matVector2, _matVector3, _invmatVector1, _invmatVector2, _invmatVector3, p0, p1, 0.8);

	const _colors = new Float32Array(1 * COLOR_SIZE);
	setArrayXYZ(_colors, 0, 0.0, 0.0, 1.0)

	geometry.addAttribute('matVector1', new THREE.InstancedBufferAttribute(_matVector1, OFFSET_SIZE, false, 1));
	geometry.addAttribute('matVector2', new THREE.InstancedBufferAttribute(_matVector2, OFFSET_SIZE, false, 1));
	geometry.addAttribute('matVector3', new THREE.InstancedBufferAttribute(_matVector3, OFFSET_SIZE, false, 1));
	geometry.addAttribute('color', new THREE.InstancedBufferAttribute(_colors, COLOR_SIZE, false, 1));

	if (isSprite) {
		geometry.addAttribute('invmatVector1', new THREE.InstancedBufferAttribute(_invmatVector1, OFFSET_SIZE, false, 1));
		geometry.addAttribute('invmatVector2', new THREE.InstancedBufferAttribute(_invmatVector2, OFFSET_SIZE, false, 1));
		geometry.addAttribute('invmatVector3', new THREE.InstancedBufferAttribute(_invmatVector3, OFFSET_SIZE, false, 1));
	}

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
		material.defines.CYLINDER_SPRITE =  1;
		material.extensions.fragDepth = true;
		material.uniforms = THREE.UniformsUtils.merge([material.uniforms, {zOffset: { type: 'f', value: 0.0 }}]);
	}
	material.defines.INSTANCED_POS = 1;
	const depthMaterial = new THREE.ShaderMaterial().copy(material);
	depthMaterial.defines.COLOR_FROM_DEPTH = 1;
	depthMaterial.lights = false;
	material.defines.USE_LIGHTS = 1;

	cylinderSprite = new THREE.Mesh( geometry, material );
	cylinderSprite.customDepthMaterial = depthMaterial;
	cylinderSprite.castShadow = true;
	cylinderSprite.receiveShadow = true;
	cylinderSprite.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
		this.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);
		this.material.uniforms.invModelViewMatrix.value.getInverse(this.modelViewMatrix);
	}
	scene.add( cylinderSprite );
}

function initScene() {
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 0, 15, 35 );
	scene = new THREE.Scene();
	// Lights
	scene.add( new THREE.AmbientLight( 0x404040 ) );
	initLight(scene)
	// Object
	//initSpheres(scene, false);
	initCylinders(scene, true);

	const geometry1 = new THREE.BoxBufferGeometry( 10, 0.005, 10 );
	const material1 = new THREE.MeshPhongMaterial( {
		color: 0xeeeeee,
		shininess: 30,
		specular: 0x111111
	} );
	const ground = new THREE.Mesh( geometry1, material1 );
	ground.scale.multiplyScalar( 3 );
	ground.castShadow = false;
	ground.receiveShadow = true;
	scene.add( ground );
}
function initMisc() {
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	// Mouse control
	const controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 2, 0 );
	controls.update();
	clock = new THREE.Clock();
}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function renderScene() {
	renderer.render( scene, camera );
}
function render() {
	const delta = clock.getDelta();
	renderScene();
	scene.children[3].rotation.y += 0.8*delta;
}