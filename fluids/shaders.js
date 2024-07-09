const vertexShaderCode = `
	attribute float size;
	attribute float s;
	attribute float dye;
	varying vec3 vPosition;
	varying float vS;
	varying float vDye;
	void main() {
		vS = s;
		vDye = dye;
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = size * (300.0 / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
`;
	
const fragmentShaderCode = `
	varying float vS;
	varying float vDye;
	void main() {
		
		vec3 color = vec3(1.0, 1.0, 1.0);
		
		if (vS == 0.0) {
			color = vec3(0.5, 0.5, 0.5);
		} else {
			color = vec3(vDye * 2.0, vDye * 2.0, vDye * 2.0);
		}

		gl_FragColor = vec4(color, 1.0);
	}
`;