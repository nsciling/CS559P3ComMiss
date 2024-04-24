// @ts-check

// set the canvas & canvas variables
let canvas = document.getElementById("box2canvas");
let context = canvas.getContext("2d");
let canvasH = canvas.getAttribute("height");
let canvasW = canvas.getAttribute("width");

// globals
let mouseX;
let mouseY;
let turretRadius = 50;
let turLen = 90;
let baseX = canvasW/2;
let baseY = canvasH - turretRadius;

//this is a 'display list' -> list of objects we plan to draw
let newColor = getRGBcolorString();
let abmTotal = 9;
let abmRad = 5;
let abmList = [];
let abmTrail = [];
let abmSpeed = 2.5;
let bombList = [];
let expList = [];   // explosions
let expCount = 35;  // default number of explosions to produce


/**
 * Main draw function to redraw game on each animation iteration
 */
let draw = function() {

    // clean & redraw screen
    resetCanvas();

    // draws missiles, turret base & gun
    drawABMs();
    drawTurret();

    // next frame
    window.requestAnimationFrame(draw);
}

/**
 * Resets the game state on each animation
 */
function resetCanvas() {
    //reset the canvas
    context.clearRect(0, 0, canvasW, canvasH);
    context.fillStyle = "#131862";
    context.fillRect(0,0,canvasW, canvasH);
}


/**
 * Draws the missiles currently in flight
 */
function drawABMs() {

    for(let i = 0; i < abmList.length; i++) {
        let curABM = abmList[i];
        curABM.dist += abmSpeed;
        let newPos = getPointOnPath(curABM.x, curABM.y, curABM.tx, curABM.ty, curABM.dist);
        
        // draw missile
		context.beginPath();
		context.arc(newPos.x, newPos.y, abmRad, 0, 2 * Math.PI, false);
		context.fillStyle="white";
		context.fill();

        // if pct >= 1.0 no more missile
        if(newPos.isBeyond) abmList.splice(i, 1); 
    }
}

/**
 * Draws the gun turret player users to shoot
 */
function drawTurret() {
    // target
    let adjTarget = getAdjustedTurretPos(baseX,baseY,mouseX,mouseY,turLen);

    //draw gun & rotate matrix
    let gunColor = "#05e322";
    context.lineWidth = 20;
    context.beginPath();
    context.moveTo(baseX, baseY);
    context.strokeStyle = gunColor;
    context.lineTo(adjTarget.x, adjTarget.y);
    context.stroke();
    context.closePath();
    resetTransormationMatrix();
    
    //draw circle turret platform
    let turretColor = "#992593";
    context.beginPath();
    context.arc(baseX, baseY, turretRadius, 0, 2 * Math.PI, false);
    context.fillStyle=turretColor;
    context.fill();
}

/**
 * Fires an anti-ballistic missle (aka adds an element to the abmList array)
 * 
 * @param {number} tx - client target X coord for the missile
 * @param {number} ty - client target Y coord for the missile
 * @returns nothing
 */
function fireABM(tx, ty) {
    // if already fired all bullets, don't fire anything
    if(abmList.length >= abmTotal) return;

    // bet base x & y from adjusted turret position
    let turretEdge = getAdjustedTurretPos(baseX, baseY, tx, ty, turLen);

    // build elements of the AMB missile
    abmList.push({
        x:  turretEdge.x,
        y:  turretEdge.y,
        tx: tx,
        ty: ty,
        dist:0,
    });

    return;
}

/**
 * Function to get a random number between 2 numbers
 * 
 * @param {number} min - minimum limit
 * @param {number} max - maximum limit
 * @returns a number, or undefined if error
 */
function getRandomBetween(min, max) {
    if(max===undefined || min===undefined || max < min) return undefined;
    return ((Math.random() * (max - min)) + min);
}

/**
 * Function to draw an explosion square
 * 
 * @param {number} x - x-coordinate of the explosion particle
 * @param {number} y - y-coordinate of the explosion particle
 * @param {number} lw - the length(width) of the explosion particle
 * @param {string} color - color of the particle
 * @returns none; draws a square particle on the webpage
 */
function drawExplosion(x, y, lw, color) {
    //quit without necessary data
    if(x===undefined || y===undefined || lw===undefined || color===undefined) return;
    
    //save off context before 
    context.save();

    //draw explosion
    context.fillStyle = color;
    context.fillRect(x - Math.floor(lw/2), y - Math.floor(lw/2), lw, lw);

    //restore context
    context.restore();
}

/**
 * Function to return a random RGB color string
 * @returns string with RGB css format, ex: "rgb(100,200,100)"
 */
function getRGBcolorString() {
    let red = Math.floor(Math.random() * 255);
    let green = Math.floor(Math.random() * 255);
    let blue = Math.floor(Math.random() * 255);
    
    return "rgba(" + red + "," + green + "," + blue + ",1.0)";    
}

/**
 * Function to transparent-ify the RGBA color string received
 * 
 * @param {string} colorString - an RGBA color string to edit
 * @returns an updated color string with a lower transparency value,
 *  or the original color string if no transparency value is found
 */
function fadeColor(colorString) {
    //console.log("Color: "+colorString);  // for testing

    // match on a regex for the transparency value
    const regex = /\,(\d\.\d+)\)/;
    let match=regex.exec(colorString)[1];

    if(match===undefined || match==null) return colorString;

    // reduce the transparency by 0.985x, rounded to 3 decimals
    let reduce = Math.round(match.valueOf()*0.985*1000)/1000

    //console.log("Replace: "+colorString.replace(regex,","+reduce+")")) // for testing
    return colorString.replace(regex,","+reduce+")");
}

/**
 * Checks if the passed-in element is outside the canvas bounds
 * 
 * @param {object} element - an element with an x & y attribute; expected from the 'fwList' or 'expList' arrays
 * @returns 1 if oustide canvas bounds, 0 otherwise
 */
function outsideBounds(element) {

    if(element===undefined || element===null) return 0;

    // check if element is outside canvas bounds
    if(element.x < 0 || element.x > canvasW) return 1;
    if(element.y < 0 || element.y > canvasH) return 1;
    
    //default
    return 0;

}

/**
 * Resets the transformation matrix
 */
function resetTransormationMatrix() {
    context.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Draws a turret pointing towards the target x & y coordinates.
 * 
 * @param {number} bx - base turret x position
 * @param {number} by - base turret y position
 * @param {number} tx - sky target x pos
 * @param {number} ty - sky target y pos
 * @param {number} len - length of the turret
 * @returns an object with x and y coordinate attributes
 */
function getAdjustedTurretPos(bx,by,tx,ty,len) {

    // distance between base and target points
    let dist = Math.sqrt((tx-bx)**2 + (by-ty)**2);
    
    // calculate the % of the total distance that is the desired length
    let fraction = len / dist;

    // set the new target X & Y to draw the turret to
    let newX = bx - ((bx - tx) * fraction);
    let newY = by - ((by - ty) * fraction);
    
    return {x:newX, y:newY};
}

/**
 * Gets a point on the path between start & target at the designated added distance
 * 
 * @param {number} startX 
 * @param {number} startY 
 * @param {number} targetX 
 * @param {number} targetY 
 * @param {number} increment 
 * @returns an object with x and y coordinate attributes
 */
function getPointOnPath(startX, startY, targetX, targetY, increment) {
    // distance between base and target points
    let dist = Math.sqrt((targetX - startX)**2 + (targetY - startY)**2);
    
    // calculate the % of the total distance that is the desired length
    let fraction = increment / dist;

    // set the new target X & Y to draw the turret to
    let newX = startX - ((startX - targetX) * fraction);
    let newY = startY - ((startY - targetY) * fraction);
    return {x:newX, y:newY, isBeyond:(fraction >= 1.0)};
}

// Function wrappers to get mouse coords
function getMouseX(event) { return event.clientX - event.target.getBoundingClientRect().left; }
function getMouseY(event) { return event.clientY - event.target.getBoundingClientRect().top; }


// Event handlers

canvas.onmousedown = function(event) {
    let tx = getMouseX(event);
    let ty = getMouseY(event);

    fireABM(tx, ty);
}

canvas.onmousemove = function(event) {
    mouseX = getMouseX(event);
    mouseY = getMouseY(event);
}


window.requestAnimationFrame(draw); // start animation