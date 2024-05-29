// CONSTANTS AND GLOBALS

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
var gridMesh = new THREE.GridHelper(10000000, 2000);
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
    var dotGeometry = new THREE.SphereGeometry(5, 32, 32);
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
		camera.lookAt(controls.target.add(diff));
	}
}
renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });

// DOTS GEOMETRY + SOME CONSTANTS
var dotsGeometry = new THREE.BufferGeometry();
var dotPositions = [];
var dotSizes = [];
var dots = [];
var maxVals = { x: -Infinity, y: -Infinity, z: -Infinity };
var minVals = { x: Infinity, y: Infinity, z: Infinity };
var dotRadius = 3;

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

//DATA FROM DEFAULT CHOICES
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

//ADDS DATA FROM SOME GIVEN ROW INFO (ROW IN FORM OF XYZ)
function addDataFromRows(rows) {
	rows.forEach(function(row) {
		row = row.trim();
		var columns = row.split(',');
		if (columns[0] !== "" && columns[1] !== "" && columns[2] !== "") {
			var dotData = columns.map(Number);
			dots.push(dotData);
			dotPositions.push(dotData[0], dotData[1], dotData[2]);
			dotSizes.push(dotRadius);
			if (dotData[0] > maxVals.x) { maxVals.x = dotData[0]; }
			if (dotData[1] > maxVals.y) { maxVals.y = dotData[1]; }
			if (dotData[2] > maxVals.z) { maxVals.z = dotData[2]; }
			if (dotData[0] < minVals.x) { minVals.x = dotData[0]; }
			if (dotData[1] < minVals.y) { minVals.y = dotData[1]; }
			if (dotData[2] < minVals.z) { minVals.z = dotData[2]; }
		}
	});

	console.log("Dot Positions:", dotPositions);
	console.log("Dot Sizes:", dotSizes);

	dotsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
	dotsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(dotSizes, 1));

	// Update shader uniforms
	shaderMaterial.uniforms.uMinVals.value.set(minVals.x, minVals.y, minVals.z);
	shaderMaterial.uniforms.uMaxVals.value.set(maxVals.x, maxVals.y, maxVals.z);

	if (!scene.children.includes(dotsMesh)) {
		scene.add(dotsMesh);
	}
	
	dotsGeometry.attributes.position.needsUpdate = true;
	dotsGeometry.attributes.size.needsUpdate = true;
	
	resetView();
};



// SHADER MATERIAL
var shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode,
    uniforms: {
        uMinVals: { value: new THREE.Vector3(minVals.x, minVals.y, minVals.z) },
        uMaxVals: { value: new THREE.Vector3(maxVals.x, maxVals.y, maxVals.z) },
        uToggleFormatting: { value: formattingFlag },
        uToggleSectioning: { value: sectioningFlag },
        uSectioningThreshold: { value: 0.0 }
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
    if (dots.length === 0) { return; }

    var centerPos = new THREE.Vector3((maxVals.x + minVals.x) / 2, (maxVals.y + minVals.y) / 2, (maxVals.z + minVals.z) / 2);
    var diffMax = Math.max(maxVals.x - minVals.x, maxVals.y - minVals.y, maxVals.z - minVals.z);

    camera.position.x = centerPos.x - diffMax * 0.5;
    camera.position.y = centerPos.y - diffMax * 0.5;
    camera.position.z = centerPos.z + diffMax * 0.5;

    controls.target.copy(centerPos);
    controls.update();
}

// ADDS EVENT LISTENER TO TOGGLE CONDITIONAL FORMATTING (COLORING) TO DOTS
var formattingFlag = false;
var btnToggleFormatting = document.getElementById('btnToggleFormatting');
btnToggleFormatting.addEventListener('click', function () {
    formattingFlag = !formattingFlag;
    btnToggleFormatting.style.backgroundColor = formattingFlag ? "gray" : "lightgray";
    shaderMaterial.uniforms.uToggleFormatting.value = formattingFlag;
});

// ADD EVENT LISTENER TO BRING A POSITION FILTER (SECTIONING)
var sectioningFlag = false;
var btnToggleSectioning = document.getElementById('btnToggleSectioning');
btnToggleSectioning.addEventListener('click', function () {
    sectioningFlag = !sectioningFlag;
    btnToggleSectioning.style.backgroundColor = sectioningFlag ? "gray" : "lightgray";
    shaderMaterial.uniforms.uToggleSectioning.value = sectioningFlag;
    sectioning('z');
});

// ADDS EVENT LISTENER FOR CHANGING THE CONDITIONAL FORMATTING SLIDER
var formattingSlider = document.getElementById("formattingSlider");
formattingSlider.addEventListener('change', function () {
    sectioning('z');
});

function sectioning(axis) {
    const percent = formattingSlider.value / 100;
    var diff = maxVals[axis] - minVals[axis];
    shaderMaterial.uniforms.uSectioningThreshold.value = minVals[axis] + percent * diff;
}

// ANIMATION LOOP
var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};

animate();
