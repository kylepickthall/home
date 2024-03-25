
//CONSTANTS


// SCENE
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//CONTROL DIV INFO
var divControls = document.getElementById("divControls")
var divControlsHeight = divControls.clientHeight;

// SELECTED DOT DATA DISPLAY
var selectedDotData = document.createElement('div');
selectedDotData.style.position = 'absolute';
selectedDotData.style.top = '30px';
selectedDotData.style.left = '10px';
selectedDotData.style.color = 'white';
selectedDotData.style.display = 'none';
document.body.appendChild(selectedDotData);

// MESH
var gridMesh = new THREE.GridHelper(1000,100);
gridMesh.material.transparent = true;
gridMesh.material.opacity = 0.2;
scene.add(gridMesh);

// ORIGIN ARROWS
var arrowLength = 20;
var xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x0000ff);	//blue
var yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x00ff00);	//green
var zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLength, 0xff0000);	//red
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

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

// CAMERA SETUP
camera.position.z = 100;
camera.position.y = 100;
camera.position.x = 100;
camera.lookAt(0,0,0)


// ORBIT CONTROLS
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.rotateSpeed = 0.5;
controls.mouseButtons = {
	MIDDLE: THREE.MOUSE.PAN,
}
function controlsOnChange() {
	visualizeFocusCenter();
}
controls.addEventListener('change', controlsOnChange);

//ADDS THE DOT AT THE FOCUS CENTER (MIDDLE OF CAMERA)
var focusCenterDot;
function visualizeFocusCenter() {
	scene.remove(focusCenterDot);
	var dotGeometry = new THREE.SphereGeometry(.5, 32, 32);
	var dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
	focusCenterDot = new THREE.Mesh(dotGeometry, dotMaterial);
	focusCenterDot.position.x = controls.target.x
	focusCenterDot.position.y = controls.target.y
	focusCenterDot.position.z = controls.target.z
	scene.add(focusCenterDot);
}
visualizeFocusCenter();

// MOUSE CLICK EVENT HANDLER
function onMouseClick(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -((event.clientY - divControlsHeight) / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
	
	//const raycastMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.1});
    const raycastLine = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 1000, 0xffffff, 5, 5);
    scene.add(raycastLine);

    const rayOrigin = raycaster.ray.origin;
    const offset = rayOrigin.clone().sub(camera.position).normalize().multiplyScalar(0.1);
    camera.position.add(offset);
	
    const intersects = raycaster.intersectObjects(dots);

    if (intersects.length > 0) {
        const selectedDot = intersects[0].object;

        selectedDotData.innerHTML = selectedDot.position.x + ', ' + selectedDot.position.y + ', ' + selectedDot.position.z;
        selectedDotData.style.display = 'block';
    } else {
        selectedDotData.style.display = 'none';
    }

	setTimeout(() => {
        scene.remove(raycastLine);
    }, 5000);
}
renderer.domElement.addEventListener('click', onMouseClick, false);

// DOTS FROM CSV - COLUMN ORDER IS XYZ
var dots = []
var dotsArray = [];
document.getElementById('csvFileInput').addEventListener('change', function(event) {
	const file = event.target.files[0];
	const reader = new FileReader();
	const dotRadius = .5;

	reader.onload = function(event) {
		const csvData = event.target.result;

		const rows = csvData.split('\n');
		rows.shift()
		rows.forEach(function(row) {
			row = row.substring(0, row.length - 1);
			var columns = row.split(',');
			dotsArray.push(columns);
		});
		dotsArray.pop();
		
		//ADDING IN THE DOTS
		const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16);
		const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		dotsArray.forEach(function(dotData) {
			var dot = new THREE.Mesh(dotGeometry, dotMaterial);
			var velo = new THREE.Vector3(0, 0, 0);
			dot.position.x = parseFloat(dotData[0]*10)
			dot.position.y = parseFloat(dotData[1]*10)
			dot.position.z = parseFloat(dotData[2]*10)
			dot.velo = velo;
			scene.add(dot);
			dots.push(dot);
		});
	};
	reader.readAsText(file);
});

//GRAVITY
function gravity() {
	const g = 0.01;
	const timeFactor = 1;
	
	const dotsClone = [];
	dots.forEach(function(dot) {
		var dotClone = new THREE.Mesh();
		dotClone.geometry = dot.geometry.clone();
		dotClone.position.copy(dot.position);
		dotClone.velo = new THREE.Vector3().copy(dot.velo);
		dotsClone.push(dotClone);
	});
	
	var totalForce = new THREE.Vector3();
	dots.forEach(function(dot) {
		var force = new THREE.Vector3();
		dotsClone.forEach(function(subDot) {
			var diffVector = new THREE.Vector3().subVectors(subDot.position, dot.position);
			if (diffVector.length() !== 0) {
				const gravMagnitude = g / (Math.pow(diffVector.length(), 2) + 0.1);
				const gravDirection = diffVector.clone().normalize();
				force.add(gravDirection.multiplyScalar(gravMagnitude));
			}
		});
		dot.velo.add(force.multiplyScalar(timeFactor));
		dot.position.add(dot.velo);
		totalForce.add(force);
	});
}

// ANIMATION LOOP
var animate = function () {
	requestAnimationFrame(animate);
	updateFPS();
	gravity();
	controls.update();
	renderer.render(scene, camera);
};

animate();

