// @ts-check

// set the canvas & canvas variables
let canvas = document.getElementById("box2canvas");
let context = canvas.getContext("2d");
let canvasH = canvas.getAttribute("height");
let canvasW = canvas.getAttribute("width");
context.font = "25px Courier new";
context.textAlign = "center";

// globals
let mouseX;
let mouseY;
let turretRadius = 50;
let turLen = 90;
let baseX = canvasW/2;
let baseY = canvasH - turretRadius;
let score = 0;
let lastMilestone = 0;

//Anti-Ballistic Missile (ABM) globals
let abmTotal = 9;
let abmRadius = 5;
let abmList = [];
let abmTrail = [];
let abmSpeed = 1;
let abmColor = "white";
let abmLineColor = "#d6d6d6"
let abmLineWidth = 2;

//protective explosions globals
let abmExplosionList = [];
let abmExplosionRadius = 35;
let abmExplosionGrowth = 0.35;

//incoming bombs globals
let enemyList = [];
let enemyFrequency = 0.5;
let enemyFrequencyGrowth = 0.25;
let enemyMaxCount = 5;
let enemySpeed = 0.35;
let enemySpeedGrowth = 0.25;
let enemySquareSize = 10;
let enemyColor = "red";
let enemyLineColor = "#800617";
let enemyLineWidth = abmLineWidth;


/**
 * Main draw function to redraw game on each animation iteration
 */
let drawGame = function() {

    // clean & redraw screen
    resetCanvas();

    // set score
    updateScoreAndSpeeds();

    // draws missiles, turret base & gun
    drawABMExplosions();
    drawABMs();
    drawTurret();

    // add & draw enemies
    launchEnemy();
    drawEnemies();

    // next frame
    window.requestAnimationFrame(drawGame);
}

function updateScoreAndSpeeds () {
    context.save();
        context.strokeStyle="white";
        context.strokeText("Score: "+score, (canvasW/2), canvasH*0.1);
    context.restore();

    // if score is a multiple of 10, increment speed, frequency, and max enemies
    if((score > lastMilestone) && (score % 10 == 0)) {
        lastMilestone = score;
        let scoreMilestones = lastMilestone / 10;

        enemySpeed += (scoreMilestones*0.25);
        enemyFrequency += (scoreMilestones*0.25);
        enemyMaxCount++;
    }

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
 * Draws enemy bombs in the enemyList array
 */
function drawEnemies() {
    context.save();
    for(let i = 0; i < enemyList.length; i++) {
        let curEnemy = enemyList[i];
        curEnemy.dist += curEnemy.speed;
        let newPos = getPointOnPath(curEnemy.x, curEnemy.y, curEnemy.tx, curEnemy.ty, curEnemy.dist);
        
        // draw enemy path
        context.beginPath();
        context.moveTo(curEnemy.x, curEnemy.y);
        context.lineTo(newPos.x, newPos.y);
        context.strokeStyle=enemyLineColor;
        context.lineWidth=enemyLineWidth;
        context.stroke();
        context.closePath();

        // draw enemy
		context.fillStyle="red";
		context.fillRect(newPos.x - enemySquareSize/2, newPos.y - enemySquareSize/2, enemySquareSize, enemySquareSize);

        // if enemy is beyond their target or is defeated by an anti-ballistic missile, remove it
        if(newPos.isBeyond) {
            enemyList.splice(i, 1); 
            score--;
        }

        if(isDefeated(newPos)) {
            enemyList.splice(i, 1); 
            score++;
        }
    }
    context.restore();
}

/**
 * Check to see if an enemy projectile was defeated by an anti-ballistic explosion
 * @param {object} curEnemy - enemy object with x & y values
 * @returns true if defeated, false if not
 */
function isDefeated(curEnemy) {

    // set return variable
    let ret = false;

    let enemyRadius = enemySquareSize / 2; // treat enemy like a circle

    // loop through protective explosions; if one is
    for(let i = 0; ((i < abmExplosionList.length) && (!ret)) ; i++) {
        
        let curExplosion = abmExplosionList[i];
        let dist = distBetweenTwoPoints(curEnemy.x, curEnemy.y, curExplosion.sourceAbm.tx, curExplosion.sourceAbm.ty);
        
        // if the distance between the two source points is less than
        // the radii of the two objects, then enemy is defeated
        if(dist < (enemyRadius + curExplosion.radius)) ret = true;
    }

    return ret;
}

/**
 * Handles enemy launching. Launches enemies at random intervals
 * based on enemyFrequency variable.
 * 
 * Will stop launching new enemies if the current enemies launched
 * surpass the enemy max count
 * 
 * @returns nothing
 */
function launchEnemy() {

    if(Math.random() > enemyFrequency/100) return;
    if(enemyList.length >= enemyMaxCount) return;

    let startX = Math.random()*canvasW;
    let startY = 0;

    let targetX = Math.random()*canvasW;
    let targetY = canvasH;

    // build elements of the enemy missile
    enemyList.push({
        x:  startX,
        y:  startY,
        tx: targetX,
        ty: targetY,
        speed: enemySpeed,
        dist:0,
    });
}

/**
 * Draws the missiles currently in flight
 */
function drawABMs() {
    context.save();
    for(let i = 0; i < abmList.length; i++) {
        let curABM = abmList[i];
        curABM.dist += abmSpeed;
        let newPos = getPointOnPath(curABM.x, curABM.y, curABM.tx, curABM.ty, curABM.dist);

        // set style
        context.strokeStyle=abmLineColor;
        context.lineWidth=abmLineWidth;

        // draw the targets
        context.beginPath();
        context.moveTo(curABM.tx - abmRadius, curABM.ty - abmRadius);
        context.lineTo(curABM.tx + abmRadius, curABM.ty + abmRadius);
        context.stroke();
        context.closePath();

        context.beginPath();
        context.moveTo(curABM.tx - abmRadius, curABM.ty + abmRadius);
        context.lineTo(curABM.tx + abmRadius, curABM.ty - abmRadius);
        context.stroke();
        context.closePath();
        
        // draw ABM missile path
        context.beginPath();
        context.moveTo(curABM.x, curABM.y);
        context.lineTo(newPos.x, newPos.y);
        context.stroke();
        context.closePath();

        // draw missile
		context.beginPath();
		context.arc(newPos.x, newPos.y, abmRadius, 0, 2 * Math.PI, false);
		context.fillStyle=abmColor;
		context.fill();

        // if pct >= 1.0 no more missile
        if(newPos.isBeyond) {
            addABMExplosion(curABM);
            abmList.splice(i, 1); 
        }
    }
    context.restore();
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
}

/**
 * Adds a protective explosion
 * 
 * @param {object} curAbm - ABM object with x & y coords
 */
function addABMExplosion(curAbm) {

    abmExplosionList.push({
        sourceAbm: curAbm,
        radius: abmRadius,
        growthMultiplier: 1
    });

}

/**
 * Draws the protective explosion from an Anti-Ballistic Missile
 */
function drawABMExplosions() {

    context.save();
    for(let i = 0; i < abmExplosionList.length; i++) {
        let curExplosion = abmExplosionList[i];
        
        // draw explosion path
        context.beginPath();
        context.moveTo(curExplosion.sourceAbm.x, curExplosion.sourceAbm.y);
        context.lineTo(curExplosion.sourceAbm.tx, curExplosion.sourceAbm.ty);
        context.strokeStyle=abmLineColor;
        context.lineWidth=abmLineWidth;
        context.stroke();
        context.closePath();

        // draw explosion
		context.beginPath();
		context.arc(curExplosion.sourceAbm.tx, curExplosion.sourceAbm.ty, curExplosion.radius, 0, 2 * Math.PI, false);
		context.fillStyle=getRandomColorString();
		context.fill();

        // increment radius
        curExplosion.radius += (abmExplosionGrowth * curExplosion.growthMultiplier);

        // if pct >= 1.0 no more missile
        if(curExplosion.radius > abmExplosionRadius) curExplosion.growthMultiplier = -1;
        if(curExplosion.radius <= 0) abmExplosionList.splice(i, 1);
    }
    context.restore();

}

/**
 * Draws the gun turret player users to shoot
 */
function drawTurret() {
    context.save();

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
    //resetTransormationMatrix();
    
    //draw circle turret platform
    let turretColor = "#992593";
    context.beginPath();
    context.arc(baseX, baseY, turretRadius, 0, 2 * Math.PI, false);
    context.fillStyle=turretColor;
    context.fill();

    //draw bullets
    let r = -1;
    let c = 0.5;
    for(let i = 0; i < (abmTotal - abmList.length - abmExplosionList.length); i++) {
        drawAmmo(baseX + (r * 15), baseY + (c * 15));
        r++;
        if(r > 1) {
            c--;
            r = -1;
        }
    }
    
    context.restore();
}

/**
 * Draws 'ammo' on the turret to let player know how many bullets
 * are left
 * 
 * @param {number} x - x position of the ammo image
 * @param {number} y - y position of the ammo image
 */
function drawAmmo(x, y) {
    context.beginPath();
    context.arc(x, y, abmRadius, 0, 2 * Math.PI, false);
    context.fillStyle="white";
    context.fill();
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
* Function to return a random RGB color string
* @returns string with RGBA css format, ex: "rgba(100,200,100,1.0)"
*/
function getRandomColorString() {
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
    let dist = distBetweenTwoPoints(bx,by,tx,ty);
    
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
    let dist = distBetweenTwoPoints(startX, startY, targetX, targetY);
    
    // calculate the % of the total distance that is the desired length
    let fraction = increment / dist;

    // set the new target X & Y to draw the turret to
    let newX = startX - ((startX - targetX) * fraction);
    let newY = startY - ((startY - targetY) * fraction);
    return {x:newX, y:newY, isBeyond:(fraction >= 1.0)};
}

/**
 * Calculates the distnace between two points
 * @param {number} x1 - point 1 x coordinate
 * @param {number} y1 - point 2 x coordinate
 * @param {number} x2 - point 1 y coordinate
 * @param {number} y2 - point 2 y coordinate
 * @returns distance value
 */
function distBetweenTwoPoints(x1, y1, x2, y2) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2) };

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


window.requestAnimationFrame(drawGame); // start game