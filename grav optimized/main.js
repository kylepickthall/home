
//SETUP SCENE
{
	
// Initialize scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CONTROL DIV INFO
var divControls = document.getElementById("divControls");
var divControlsHeight = 0;

// CAMERA SETUP
camera.position.z = 100;
camera.position.y = 100;
camera.position.x = 100;
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

// SELECTED DOT DATA DISPLAY
var selectedDotData = document.createElement('div');
selectedDotData.style.position = 'absolute';
selectedDotData.style.top = '10px';
selectedDotData.style.left = '10px';
selectedDotData.style.color = 'white';
selectedDotData.style.display = 'none';
document.body.appendChild(selectedDotData);

// MESH
var gridMesh = new THREE.GridHelper(100000, 2000);
gridMesh.material.transparent = true;
gridMesh.material.opacity = 0.2;
gridMesh.rotation.x = Math.PI / 2;
scene.add(gridMesh);

// ORIGIN ARROWS
var arrowLength = 20;
var xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0xff0000); // red
var yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x0000ff); // blue
var zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLength, 0x00ff00); // green
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

// ORBIT CONTROLS
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.rotateSpeed = 0.5;
controls.mouseButtons = {
	MIDDLE: THREE.MOUSE.PAN,
};
function controlsOnChange() {
	visualizeFocusCenter();
	}
controls.addEventListener('change', controlsOnChange);

// ADDS THE DOT AT THE FOCUS CENTER (MIDDLE OF CAMERA)
var focusCenterDot;
function visualizeFocusCenter() {
	scene.remove(focusCenterDot);
	var dotGeometry = new THREE.SphereGeometry(.5, 32, 32);
	var dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
	focusCenterDot = new THREE.Mesh(dotGeometry, dotMaterial);
	focusCenterDot.position.x = controls.target.x;
	focusCenterDot.position.y = controls.target.y;
	focusCenterDot.position.z = controls.target.z;
	scene.add(focusCenterDot);
}
visualizeFocusCenter();

// MOUSE CLICK EVENT HANDLER
function onMouseClick(event) {
	const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
	const mouseY = -((event.clientY - divControlsHeight) / window.innerHeight) * 2 + 1;
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
	const raycastLine = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 1000, 0xffffff, 5, 5);

	const rayOrigin = raycaster.ray.origin;
	const offset = rayOrigin.clone().sub(camera.position).normalize().multiplyScalar(0.1);
	camera.position.add(offset);

	const intersects = raycaster.intersectObject(particleMesh);

	if (intersects.length > 0) {
		const selectedDot = intersects[0].point;
		selectedDotData.innerHTML = selectedDot.x + ', ' + selectedDot.y + ', ' + selectedDot.z;
		selectedDotData.style.display = 'block';
	} else {
		selectedDotData.style.display = 'none';
	}

	setTimeout(() => {
		scene.remove(raycastLine);
	}, 5000);
}
renderer.domElement.addEventListener('click', onMouseClick, false);

//FPS COUNTER
var fpsCounter = document.getElementById("fpsCounter");
var frames_ = 0;
var lastFrameTime = performance.now();

function updateFPS() {
    frames_++;
    var currentTime = performance.now();
    var deltaTime = currentTime - lastFrameTime;
    var fps = 1000 / deltaTime;
    fpsCounter.innerHTML = "FPS: " + fps.toFixed(2);
    lastFrameTime = currentTime;
}


}
//END OF SCENE SETUP

//SOME OPTIONS FOR THE RENDERTARGETS
const options = {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: false,
    stencilBuffer: false
};

//SIZE OF THE SIMULATION + SOME NEEDED UNIFORMS (FOR USE BY THE SHADERS)
const simSizeX = 80;
const simSizeY = 80;
const numParticles = simSizeX * simSizeY;
var uniforms = {
	u_width: {
		type: "f",
		value: simSizeX
	},
	u_width: {
		type: "f",
		value: simSizeY
	},
	u_positionTexture: {
		type: "t",
		value: null
	}
};

//TARGETS TO GET THE SIMULATION OUTPUT
var positionRT1 = new THREE.WebGLRenderTarget(simSizeX, simSizeY, options);
var positionRT2 = new THREE.WebGLRenderTarget(simSizeX, simSizeY, options);
var velocityRT1 = new THREE.WebGLRenderTarget(simSizeX, simSizeY, options);
var velocityRT2 = new THREE.WebGLRenderTarget(simSizeX, simSizeY, options);


// MATERIAL FOR RENDERING PARTICLES (THIS IS THE ONE YOU ACTUALLY SEE ON SCREEN)
const renderMaterial = new THREE.ShaderMaterial({
    vertexShader: renderVertexShader,
    fragmentShader: renderFragmentShader,
    uniforms: uniforms
});

//SHADER MATERIAL FOR SIMULATING VELOCITY UPDATE
const simulationPositionMaterial = new THREE.ShaderMaterial({
    vertexShader: simulationVertexShader,
    fragmentShader: simulationPositionShader,
    uniforms: {
        positionTexture: { value: null },
        velocityTexture: { value: null },
		simSizeX: { value: simSizeX },
		simSizeY: { value: simSizeY }
    }
});

//SHADER MATERIAL FOR SIMULATING VELOCITY UPDATE
const simulationVelocityMaterial = new THREE.ShaderMaterial({
    vertexShader: simulationVertexShader,
    fragmentShader: simulationVelocityShader,
    uniforms: {
        positionTexture: { value: null },
        velocityTexture: { value: null },
		simSizeX: { value: simSizeX },
		simSizeY: { value: simSizeY }
    }
});

//INITIALIZES PARTICLE GEOMETRY + OTHER NEEDED OBJECTS
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(simSizeX * simSizeY * 3);
const particleUvs = new Float32Array(numParticles*2);


//ASSIGNING COORDINATE INDEX (UV DATA) TO THE PARTICLES. USED BY THE SHADERS AS A PARTICLE INDEX
for (let i = 0; i < simSizeX * simSizeY; i++) {
	particleUvs[i * 2 + 0] = (i % simSizeX) / simSizeX; // u
    particleUvs[i * 2 + 1] = Math.floor(i / simSizeY) / simSizeY; // v
}

particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('uv', new THREE.BufferAttribute(particleUvs, 2));

const particleMesh = new THREE.Points(particleGeometry, renderMaterial);
scene.add(particleMesh);

//MAKING THE SIMULATION CAMERA + SCENE
const simulationScene = new THREE.Scene();
const simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

//INITIALIZES THE SIMULATION MESH + ASSIGNS TO RENDERER
let simulationMesh;
const initTexture = (renderTarget, data) => {
    const texture = new THREE.DataTexture(data, simSizeX, simSizeY, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ map: texture });
	simulationMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
	simulationScene.add(simulationMesh);
	
    renderer.setRenderTarget(renderTarget);
    renderer.render(simulationScene, simulationCamera);
	simulationMesh.material = simulationPositionMaterial;
};

//INITIALIZES SOME STARTING DATA
const initialPositionData = new Float32Array(simSizeX * simSizeY * 4);
const initialVelocityData = new Float32Array(simSizeX * simSizeY * 4);
for (let i = 0; i < simSizeX * simSizeY; i++) {
		//initial positions in a grid
    //initialPositionData[i * 4 + 0] = i % simSizeX;
    //initialPositionData[i * 4 + 1] = Math.floor(i / simSizeX);
    //initialPositionData[i * 4 + 2] = 0;
    //initialPositionData[i * 4 + 3] = 1;
	
	initialPositionData[i * 4 + 0] = (Math.random() * 2 - 1) * 100;
    initialPositionData[i * 4 + 1] = (Math.random() * 2 - 1) * 100;
    initialPositionData[i * 4 + 2] = (Math.random() * 2 - 1) * 100;
    initialPositionData[i * 4 + 3] = 1;

    initialVelocityData[i * 4 + 0] = 0;
    initialVelocityData[i * 4 + 1] = 0;
    initialVelocityData[i * 4 + 2] = 0;
    initialVelocityData[i * 4 + 3] = 1;
}

initTexture(positionRT1, initialPositionData);
initTexture(positionRT2, initialPositionData);
initTexture(velocityRT1, initialVelocityData);
initTexture(velocityRT2, initialVelocityData);


//ANIMATE LOOP
function animate() {
    requestAnimationFrame(animate);

    // update positions
    simulationPositionMaterial.uniforms.positionTexture.value = positionRT1.texture;
    simulationPositionMaterial.uniforms.velocityTexture.value = velocityRT1.texture;
	simulationMesh.material = simulationPositionMaterial;
    renderer.setRenderTarget(positionRT2);
    renderer.render(simulationScene, simulationCamera);

    // update velocities
    simulationVelocityMaterial.uniforms.positionTexture.value = positionRT2.texture;
    simulationVelocityMaterial.uniforms.velocityTexture.value = velocityRT1.texture;
	simulationMesh.material = simulationVelocityMaterial;
    renderer.setRenderTarget(velocityRT2);
    renderer.render(simulationScene, simulationCamera);

    // Swap textures
    [positionRT1, positionRT2] = [positionRT2, positionRT1];
    [velocityRT1, velocityRT2] = [velocityRT2, velocityRT1];

    // Render particles
    renderMaterial.uniforms.u_positionTexture.value = positionRT1.texture;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
	
	//updates the fps COUNTER
	updateFPS();
}

animate();
