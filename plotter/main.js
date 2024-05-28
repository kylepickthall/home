
//CONSTANTS AND GLOBALS


// SCENE
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//CONTROL DIV INFO
var divControls = document.getElementById("divControls")
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
var gridMesh = new THREE.GridHelper(1000000,2000);
gridMesh.material.transparent = true;
gridMesh.material.opacity = 0.2;
gridMesh.rotation.x = Math.PI / 2;
scene.add(gridMesh);

// ORIGIN ARROWS
var arrowLength = 20;
var xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0xff0000);	//red
var yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x0000ff);	//blue
var zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLength, 0x00ff00);	//green
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

// CAMERA SETUP
camera.position.z = 100;
camera.position.y = 100;
camera.position.x = 100;
camera.up.set(0, 0, 1);
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
    //scene.add(raycastLine);

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
var dots = [];
var dotsArray = [];
var maxVals = { x: 0, y: 0, z: 0 };
var minVals = { x: 999999999, y: 999999999, z: 999999999 };
// Fetch data.csv from the grav folder
fetch('Pivoted.csv')
  .then(response => response.text())
  .then(csvData => {
    const rows = csvData.split('\n');
    rows.shift(); // Remove header if present
    rows.forEach(function(row) {
      row = row.trim(); // Remove leading/trailing whitespace
      if (row) {
        var columns = row.split(',');
        dotsArray.push(columns);
      }
    });
    console.log(1)
		
	//ADDING IN THE DOTS
	const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16);
	const dotMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(255, 255, 255) });
	dotsArray.forEach(function(dotData) {
		if (dotData[0] == "" || dotData[1] == "" || dotData[2] == "") {
			return;
		}
		var dot = new THREE.Mesh(dotGeometry, dotMaterial.clone());
		var velo = new THREE.Vector3(0, 0, 0);
		dot.position.x = parseFloat(dotData[0])
		dot.position.y = parseFloat(dotData[1])
		dot.position.z = parseFloat(dotData[2])
		if (dot.position.x > maxVals.x) {maxVals.x = dot.position.x};
		if (dot.position.y > maxVals.y) {maxVals.y = dot.position.y};
		if (dot.position.z > maxVals.z) {maxVals.z = dot.position.z};
		if (dot.position.x < minVals.x) {minVals.x = dot.position.x};
		if (dot.position.y < minVals.y) {minVals.y = dot.position.y};
		if (dot.position.z < minVals.z) {minVals.z = dot.position.z};
		
		dot.velo = velo;
		scene.add(dot);
		dots.push(dot);
	});
});

//ADDS EVENT HANDLER TO RESET VIEW + FOCUS ON ADDED DOTS
document.getElementById("btnResetView").addEventListener("click", function() {
	resetView();
});

function resetView() {
	if (dots.length === 0) {return;}
	
	var centerPos = new THREE.Vector3( (maxVals.x+minVals.x)/2, (maxVals.y+minVals.y)/2, (maxVals.z+minVals.z)/2 );
	var diffMax = Math.max( maxVals.x - minVals.x, maxVals.y - minVals.y, maxVals.z - minVals.z )
	
    camera.position.x = centerPos.x + diffMax * 0.5;
    camera.position.y = centerPos.y + diffMax * 0.5;
    camera.position.z = centerPos.z + diffMax * 0.5;
	
	controls.target.copy(centerPos);
	controls.update();
};

//ADDS EVENT LISTENER TO TOGGLE CONDITIONAL FORMATTING (COLORING) TO DOTS
var formattingFlag = false;
var btnToggleFormatting = document.getElementById('btnToggleFormatting');
btnToggleFormatting.addEventListener('click',  function () {
	formattingFlag = !formattingFlag;
	if (formattingFlag) {
		btnToggleFormatting.style.backgroundColor = "gray";
	} else {
		btnToggleFormatting.style.backgroundColor = "lightgray";
	}
	
	conditionalFormatting("z", formattingFlag);
});

function conditionalFormatting(axis, toggle) {	
	var colorScalingFactor = { x: 0, y: 0, z: 0 };
	colorScalingFactor.x = 1 / (maxVals.x - minVals.x);
	colorScalingFactor.y = 1 / (maxVals.y - minVals.y);
	colorScalingFactor.z = 1 / (maxVals.z - minVals.z);
	
	dots.forEach( function (dot) {
		var colorVal = colorScalingFactor[axis] * (dot.position[axis] - minVals [axis]);
		if (toggle) {
			dot.material.color.setRGB(1-colorVal, colorVal, colorVal/2);
		} else {
			dot.material.color.setRGB(1, 1, 1);
		};
	});
}


//ADD EVENT LISTENER TO BRING A POSITION FILTER (SECTIONING)
var sectioningFlag = false;
var btnToggleSectioning = document.getElementById('btnToggleSectioning');
btnToggleSectioning.addEventListener('click',  function () {
	sectioningFlag = !sectioningFlag;
	if (sectioningFlag) {
		btnToggleSectioning.style.backgroundColor = "gray";
	} else {
		btnToggleSectioning.style.backgroundColor = "lightgray";
	}
	
	sectioning('z');
});

//ADDS EVENT LISTENER FOR CHANGING THE CONDITIONAL FORMATTING SLIDER
var formattingSlider = document.getElementById("formattingSlider");
formattingSlider.addEventListener('change', function () {
	sectioning('z');
});

function sectioning(axis) {
	const percent = formattingSlider.value / 100;
	var diff = maxVals[axis] - minVals[axis];
	dots.forEach( function (dot) {
		if (sectioningFlag) {
			dot.visible = dot.position[axis] - minVals[axis] >= percent * diff;
		} else {
			dot.visible = true;
		}
	});
}

// ANIMATION LOOP
var animate = function () {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
};

animate();

