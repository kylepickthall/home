//constants
var diffusion = 0.2;	//how quickly dye naturally diffuses
var viscosity = 0.0;	//how easily velocity is transferred
var dt = 0.1;			//time step
var totalDye = 0;
var maxK = 15;

//Simple fluid sim
//fixed
function fluidSim() {
    if (dotArr === null) return;
    
	//diffuseVelocity();
	updateVelocity();
	advectVelocity();
	advectDye();
}

//diffuse velocity
function diffuseVelocity() {
	
	for (var i = 1; i < dotArr.length - 1; i++) {
        for (var j = 1; j < dotArr[0].length - 1; j++) {
			//skips unnecessary calculation
			if (dotArr[i][j].s == 0) continue;		
			
			//updates x velocity of the cell
			dotArr[i][j].velo.x += viscosity * (dotArr[i-1][j].velo.x - dotArr[i][j].velo.x) * dotArr[i-1][j].w * dt;
			dotArr[i][j].velo.x += viscosity * (dotArr[i+1][j].velo.x - dotArr[i][j].velo.x) * dotArr[i+1][j].w * dt;
			dotArr[i][j].velo.x += viscosity * (dotArr[i][j-1].velo.x - dotArr[i][j].velo.x) * dotArr[i][j-1].w * dt;
			dotArr[i][j].velo.x += viscosity * (dotArr[i][j+1].velo.x - dotArr[i][j].velo.x) * dotArr[i][j+1].w * dt;
			
			//updates y velocity of the cell
			dotArr[i][j].velo.y += viscosity * (dotArr[i-1][j].velo.y - dotArr[i][j].velo.y) * dotArr[i-1][j].w * dt;
			dotArr[i][j].velo.y += viscosity * (dotArr[i+1][j].velo.y - dotArr[i][j].velo.y) * dotArr[i+1][j].w * dt;
			dotArr[i][j].velo.y += viscosity * (dotArr[i][j-1].velo.y - dotArr[i][j].velo.y) * dotArr[i][j-1].w * dt;
			dotArr[i][j].velo.y += viscosity * (dotArr[i][j+1].velo.y - dotArr[i][j].velo.y) * dotArr[i][j+1].w * dt;
        }
    }
	
}



//updates velocity based on non-compressible fluid
//positive divergence = too much outflow
//goal is to get the divergence in each cell to zero
function updateVelocity() {
	//iterations performed each frame. increasing is performance heavy
	for (var k = 0; k < maxK; k++) {
		for (var i = 1; i < dotArr.length - 1; i++) {
			for (var j = 1; j < dotArr[0].length - 1; j++) {
				//skips unnecessary calculation
				if (dotArr[i][j].s == 0) continue;
				
				//s values for neighbouring cells (is the neighbour a wall?)
				var sx0 = dotArr[i-1][j].s;
				var sy0 = dotArr[i][j-1].s;
				var sx1 = dotArr[i+1][j].s;
				var sy1 = dotArr[i][j+1].s;
				
				var sTotal = sx0 + sy0 + sx1 + sy1;
				
				var divergence = 1.5 * (dotArr[i+1][j].velo.x - dotArr[i][j].velo.x + dotArr[i][j+1].velo.y - dotArr[i][j].velo.y);
				
				//updates velocities
				dotArr[i][j].velo.x = dotArr[i][j].velo.x + divergence * sx0 / sTotal;
				dotArr[i][j].velo.y = dotArr[i][j].velo.y + divergence * sy0 / sTotal;
				dotArr[i+1][j].velo.x = dotArr[i+1][j].velo.x - divergence * sx1 / sTotal;
				dotArr[i][j+1].velo.y = dotArr[i][j+1].velo.y - divergence * sy1 / sTotal;
			}
		}
	}
}

//backtracks a "particle" one step and finds out it's velocity, then sets the current cell's velocity to it.
function advectVelocity() {
	for (var i = 1; i < dotArr.length - 1; i++) {
        for (var j = 1; j < dotArr[0].length - 1; j++) {
			//skips unnecessary calculation
			if (dotArr[i][j].s == 0) continue;
			
            //previous time step's coordinates, remember i and j are acting as the positions
			var x0 = i - dotArr[i][j].velo.x * dt;
			x0 = Math.max(Math.min(x0, dotArr.length), 0);
			var y0 = j - dotArr[i][j].velo.y * dt;
			y0 = Math.max(Math.min(y0, dotArr[0].length), 0);
			
			//coordinates of the cell (and 1 more than the cell) of which our particle originated
			var i0 = Math.floor(x0);
			var i1 = i0 + 1;
			var j0 = Math.floor(y0);
			var j1 = j0 + 1;
			
			//relative positions of the "particle" within the originating cell
			var s0 = x0 - i0;
			var s1 = 1 - s0;
			var t0 = y0 - j0;
			var t1 = 1 - t0;
			
			//sets the velocities to that of the particle
			dotArr[i][j].velo.x = dotArr[i0][j0].velo.x * s0 + dotArr[i1][j1].velo.x * s1;
			dotArr[i][j].velo.y = dotArr[i0][j0].velo.y * t0 + dotArr[i1][j1].velo.y * t1;
        }
    }
}

//advects dye due to movement, and diffuses dye due to natural motion
function advectDye() {
	
	//used to store the new positions of the dye amount
    var newDye = new Array(dotArr.length);
    for (var i = 0; i < dotArr.length; i++) {
        newDye[i] = new Array(dotArr[0].length).fill(0);
    }
    
	//main loop for advecting (transferring dye based on fluid velocity)
	//concept is to find out how much fluid is being transferred into the cell by backtracing and finding where it would have come from
    for (var i = 1; i < dotArr.length - 1; i++) {
        for (var j = 1; j < dotArr[0].length - 1; j++) {
			//skips unnecessary calculation
			if (dotArr[i][j].s == 0) continue;
			
			//finds the "previous" cell. as if we're tracing a particle back in time 1 frame
			//remember i and j are acting as the positions
			var x0 = i - dotArr[i][j].velo.x * dt;
			x0 = Math.max(Math.min(x0, dotArr.length), 0);
			var y0 = j - dotArr[i][j].velo.y * dt;
			y0 = Math.max(Math.min(y0, dotArr[0].length), 0);
			
			//coordinates of the cell (and 1 more than the cell) of which our particle originated
			var i0 = Math.floor(x0);
			var i1 = i0 + 1;
			var j0 = Math.floor(y0);
			var j1 = j0 + 1;
			
			//relative positions of the "particle" within the originating cell
			var s0 = x0 - i0;
			var s1 = 1 - s0;
			var t0 = y0 - j0;
			var t1 = 1 - t0;
			
			//new amount of dye to be in the cell after advection. still needs diffusion as below
			newDye[i][j] = s1 * (t1 * dotArr[i0][j0].dye + t0 * dotArr[i0][j1].dye) +
						   s0 * (t1 * dotArr[i1][j0].dye + t0 * dotArr[i1][j1].dye);
        }
    }
    
    //loop for dye diffusion
    for (var i = 1; i < dotArr.length - 1; i++) {
        for (var j = 1; j < dotArr[0].length - 1; j++) {
			//skips unnecessary calculation
			if (dotArr[i][j].s == 0) continue;
			
			var dye = newDye[i][j];
			var deltaDye = newDye[i-1][j] + newDye[i+1][j] +
						   newDye[i][j-1] + newDye[i][j+1] - 4 * dye;
			dotArr[i][j].dye = dye + deltaDye * diffusion * dt;
        }
    }

    //checks total dye
	totalDye = 0;
    for (var i = 1; i < dotArr.length - 1; i++) {
        for (var j = 1; j < dotArr[0].length - 1; j++) {
            totalDye += dotArr[i][j].dye;
        }
    }
    //console.log(totalDye);
	
}