const vertexShaderCode = `
	attribute float size;
	attribute float isFlat;
	varying vec3 vPosition;
	varying float vIsFlat;
	void main() {
		vPosition = position;
		vIsFlat = isFlat;
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = size * (300.0 / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
`;
	
const fragmentShaderCode = `
	uniform vec3 uMinVals;
	uniform vec3 uMaxVals;
	uniform bool uToggleFormatting;
	uniform bool uToggleSectioning;
	uniform float uSectioningThreshold;
	varying vec3 vPosition;
	varying float vIsFlat;
	void main() {
		if (uToggleSectioning) {
			if (vPosition.z < uSectioningThreshold) {
				discard;
			}
		}

		vec3 color = vec3(1.0, 1.0, 1.0);
		if (uToggleFormatting) {
			float range = uMaxVals.z - uMinVals.z;
			float colorVal = (vPosition.z - uMinVals.z) / range;
			color = vec3(1.0 - colorVal, colorVal, colorVal * 0.5);
		}
		
		if (vIsFlat == 1.0) {
			color = vec3(0.2, 0.4, 1.0);
		}

		gl_FragColor = vec4(color, 1.0);
	}
`;
