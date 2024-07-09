// CONSTANTS AND GLOBALS


//INIT SCENE
{


// SCENE
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CONTROL DIV INFO
var divControls = document.getElementById("divControls");
var divControlsHeight = 0;

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
var xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0xff0000);    // red
var yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x0000ff);    // blue
var zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLength, 0x00ff00);    // green
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

// CAMERA SETUP
camera.position.z = 100;
camera.position.y = 100;
camera.position.x = 100;
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

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

    const intersects = raycaster.intersectObject(dotsMesh);

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

//MOUSEWHEEL EVENT HANDLER - DOLLIES THE CAMERA ON SHIFT + MOUSEWHEEL
function onMouseWheel(e) {
	if (e.shiftKey) {
		e.preventDefault();
		const diff = new THREE.Vector3().copy(camera.position).sub(controls.target).multiplyScalar(0.001*e.deltaY);
		camera.position.add(diff);
		diff.multiplyScalar(3/2);		//Why does this work? No one knows.
		camera.lookAt(controls.target.add(diff));
	}
}
renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });


}

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

//END OF INIT


//DATA FROM SELECTED CSV
document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const csvData = event.target.result;
        const rows = csvData.split('\n');
        rows.shift();

		addDataFromRows(rows);
	};
    reader.readAsText(file);
});

//DATA FROM DEFAULT CHOICES (ONLY ON GITHUB VERSION)
function loadData(event, fileName) {
	fetch(fileName)
		.then(response => response.text())
		.then(csvData => {
			const rows = csvData.split('\n');
			rows.shift(); // Remove header if present
			addDataFromRows(rows);
		});
		
	event.target.onclick = "";
};

//ADDS SOME DEFAULT DATA
var dotsGeometry = new THREE.BufferGeometry();
var dotArr = [];
var dotRadius = 2;
var rowNum = 200;
var colNum = 100;
function createDefaultData() {
	var dotSizes = [];
	
	for (let i = 0; i < rowNum; i++) {
		dotArr[i] = [];
		for (let j = 0; j < colNum; j++) {
			dotArr[i][j] = {
				pos: {x: i, y: j, z: 0},
				velo: {x: 0, y: 0, z: 0},
				dye: 0,
				s: 1,
				pressure: 0,
				divergence: 0
			};
			
			if (i == 1) {
				dotArr[i][j].s = 0;
				dotArr[i][j].velo.x = 5;
			}
			if (i == 2) {
				dotArr[i][j].velo.x = 5;
			}
			if (i < 80 && i > 50 && j < 60 && j > 40) {
				dotArr[i][j].velo.x = 0;
				dotArr[i][j].s = 0;
			}
			if (i == 1 && j < 70 && j > 30 && !(j % 3)) {
				dotArr[i][j].dye = 2;
			}
			
			dotSizes.push(dotRadius);
		}
	}
	
	if (!scene.children.includes(dotsMesh)) {
		scene.add(dotsMesh);
	}
	dotsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(dotSizes, 1));
	updateRender();
	resetView();
}


//UPDATES THE RENDERER GIVEN THE DOT ARRAY
function updateRender() {
	//cancels if the array is not initialized (checks 1st cell only)
	if (dotArr === null) return;
	
	var dotPositions = [];
	var dotS = [];
	var dotDye = [];
	
	for (var i = 0; i < dotArr.length; i++) {
		for (var j = 0; j < dotArr[0].length; j++) {
			dotPositions.push(dotArr[i][j].pos.x);
			dotPositions.push(dotArr[i][j].pos.y);
			dotPositions.push(dotArr[i][j].pos.z);
			
			dotS.push(dotArr[i][j].s);
			
			dotDye.push(dotArr[i][j].dye);
		}
	}
	dotsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
	dotsGeometry.setAttribute('s', new THREE.Float32BufferAttribute(dotS, 1));
	dotsGeometry.setAttribute('dye', new THREE.Float32BufferAttribute(dotDye, 1));
}

// SHADER MATERIAL
var shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode,
    uniforms: {

    },
    transparent: true
});

// DOTS MESH
var dotsMesh = new THREE.Points(dotsGeometry, shaderMaterial);

// ADDS EVENT HANDLER TO RESET VIEW + FOCUS ON ADDED DOTS
document.getElementById("btnResetView").addEventListener("click", function() {
    resetView();
});

function resetView() {
    if (dotArr.length === 0) { return; }

    var centerPos = new THREE.Vector3((rowNum) / 2, (colNum) / 2, (0) / 2);
    var diffMax = Math.max(rowNum, colNum, 0);

    camera.position.x = centerPos.x - diffMax * 0.5;
    camera.position.y = centerPos.y - diffMax * 0.5;
    camera.position.z = centerPos.z + diffMax * 0.5;

    controls.target.copy(centerPos);
    controls.update();
}

// ANIMATION LOOP
createDefaultData();		//automatically makes some default data upon open
var animate = function () {
    requestAnimationFrame(animate);
	fluidSim();
    controls.update();
	updateRender();
	updateFPS();
    renderer.render(scene, camera);
};

animate();
