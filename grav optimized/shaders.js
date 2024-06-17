//FOR RENDERING PARTICLE POSITION + SIZES
const renderVertexShader = `
varying vec3 vPosition;

uniform sampler2D u_positionTexture;

void main() {
	vec3 position = texture2D(u_positionTexture, uv).xyz;
	vPosition = position;
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	
    gl_PointSize = 200.0 / length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
}
`;

//FOR RENDERING PARTICLE COLORS
const renderFragmentShader = `
void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White color
}
`;

//SIMULATION: PASSING THROUGH NEEDED DATA
const simulationVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

//SIMULATION: GETTING POSITION DATA
const simulationPositionShader = `
varying vec2 vUv;

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;

void main() {
    vec3 position = texture2D(positionTexture, vUv).xyz;
    vec3 velocity = texture2D(velocityTexture, vUv).xyz;

    // Simulate physics here, for example, simple gravity
    vec3 newPosition = position + velocity * 0.1;

    gl_FragColor = vec4(newPosition, 1.0);
}
`;

//SIMULATION: GETTING VELOCITY DATA
const simulationVelocityShader = `
precision highp float;

varying vec2 vUv;

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float simSizeX;
uniform float simSizeY;

void main() {
    vec3 position = texture2D(positionTexture, vUv).xyz;
    vec3 velocity = texture2D(velocityTexture, vUv).xyz;
	vec2 resolution = vec2(simSizeX, simSizeY);
	
	//used to store the differences in velocity made by each particle
	vec3 deltaV = vec3(0.0);
	
	//used in case the particles get too close together, which would case deltaV to be too big
	float softening = 0.1;
	
	for (float i = 0.0; i < simSizeX * simSizeY; i++) {
		//position of the sub particle
		vec2 particleUv = vec2(mod(i, simSizeX) + 0.5, floor(i / simSizeX) + 0.5) / resolution;
		vec3 subPosition = texture2D(positionTexture, particleUv).xyz;
		
		//direction + distance of the force
		vec3 direction = position - subPosition;
		float distance = length(direction);
		
		//skips if distance = 0 (comparing to itself)
		if (distance == 0.0) continue;
		
		//adds to the deltaV
		deltaV -= 0.01 * (direction / distance) / pow(distance + softening, 2.0);
	}

    gl_FragColor = vec4(velocity + deltaV, 1.0);
}
`;