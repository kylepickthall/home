const vertexShaderCode = `
	attribute float size;
	attribute float isFlat;
	attribute float s;
	varying vec3 vPosition;
	varying float vS;
	void main() {
		vS = s;
		vPosition = position;
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = size * (300.0 / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
`;
	
const fragmentShaderCode = `
	varying vec3 vPosition;
	varying float vS;
	void main() {
		
		vec3 color = vec3(1.0, 1.0, 1.0);
		
		color = vec3(vPosition.z * 2.0, vPosition.z * 2.0, vPosition.z * 2.0);
		if (vS == 0.0) {
			color = vec3(0.5, 0.5, 0.5);
		} else {
			color = vec3(vPosition.z * 2.0, vPosition.z * 2.0, vPosition.z * 2.0);
		}

		gl_FragColor = vec4(color, 1.0);
	}
`;