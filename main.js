// @ts-check

// set the canvas & canvas variables
let canvas = document.getElementById("box2canvas");
let context = canvas.getContext("2d");
let canvasH = canvas.getAttribute("height");
let canvasW = canvas.getAttribute("width");
context.font = "25px Courier new";
context.textAlign = "center";

// variables
let mouseX;
let mouseY;
let turretRadius = 50;
let turLen = 90;
let baseX = canvasW/2;
let baseY = canvasH - turretRadius;
let score = 0;
let health = 100;
let milestoneScoreMultiple = 5;
let lastMilestone = 0;
let start = false;
let pause = false;
let pauseDrawn = false;
let gameOver = false;

// city variables
let cityColor = "#992593";
let buildingColor = "#55326b";
let windowColor = "#726bb3";
let groundStart = 0.925*canvasH;

//Anti-Ballistic Missile (ABM) variables
let abmTotal = 9;
let abmRadius = 5;
let abmList = [];
let abmTrail = [];
let abmSpeed = 1;
let abmColor = "white";
let abmLineColor = "#d6d6d6"
let abmLineWidth = 2;

//protective explosions variables
let abmExplosionList = [];
let abmExplosionRadius = 35;
let abmExplosionGrowth = 0.35;

//enemy bombs variables
let enemyList = [];
let enemyFrequency = 0.5;
let enemyFrequencyGrowth = 0.25;
let enemyMaxCount = 5;
let enemyBaseSpeed = 0.35;
let enemySpeedGrowth = 0.25;
let enemyLineWidth = abmLineWidth;
let enemyExplosionList = []; //explosions when enemies are defeated
let enemyExplosionCount = 20;
let explosionFrames = 75;


/**
 * Main draw function to redraw game on each animation iteration
 */
let drawGame = function() {

    // if game over, that's it
    if(gameOver) {
        drawGameOverScreen();
        return;
    }

    // check start & paused conditions before drawing game
    if(!start) {
        drawStartScreen();
    }
    else if(pause) {
        drawPauseScreen();
    } 
    else {
        pauseDrawn = false;

        // clean & redraw screen
        resetCanvas();

        // update score & health
        updateScoreDisplay();

        // update behaviors
        updateEnemyIntensity();

        // draw the city
        drawCity();

        // draws missiles, turret base & gun
        drawDefeatExplosions();
        drawTurret();
        drawABMExplosions();
        drawABMs();

        // add & draw enemies
        launchEnemy();
        drawEnemies();
    }

    // next frame
    window.requestAnimationFrame(drawGame);
}

/**
 * Draws the game over screen
 */
function drawGameOverScreen() {
    resetCanvas();
    context.save();
    context.fillStyle = "black"
    context.fillRect(0,0,canvasW,canvasH);
    context.save();
        let textX = canvasW/2;
        let textY = canvasH/2;
        context.strokeStyle="white";
        context.font = "80px Courier new";
        context.strokeText("GAME OVER", textX, textY-50);
        context.font = "40px Courier new";
        context.strokeText("Final score: "+score, textX, textY);
        context.font = "18px Courier new";
        context.strokeText("refresh page to start a new game", textX, textY + 35);
    context.restore();
}

/**
 * Draws the start screen
 */
function drawStartScreen() {
    resetCanvas();
    context.save();
    context.fillStyle = "black"
    context.fillRect(0,0,canvasW,canvasH);
    context.save();
        let textX = canvasW/2;
        let textY = canvasH/2;
        context.strokeStyle="white";
        context.strokeText("Press 'S' to Start", textX, textY);
    context.restore();
}

/**
 * Draws the pause menu
 */
function drawPauseScreen() {
    if(pauseDrawn) return;
    context.save();
    context.fillStyle = "rgba(0,0,0,0.65)";
    context.fillRect(0,0,canvasW,canvasH);
    context.save();
        context.strokeStyle="white";
        let pauseX = canvasW/2;
        let pauseY = canvasH/2;
        context.strokeText("PAUSED", pauseX, pauseY);
        context.font = "18px Courier new";
        context.strokeText("press 'ESC' again to resume", pauseX, pauseY + 20);
    context.restore();
    context.restore();
    pauseDrawn = true;
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
 *  Updates the displayable score
 */
function updateScoreDisplay() {
    context.save();
        context.strokeStyle="white";
        let scoreX =(canvasW/2);
        let scoreY = canvasH*0.05;
        context.strokeText("Score: "+score, scoreX, scoreY);
        context.strokeText("Health: "+health+"%", scoreX, scoreY+30);
    context.restore();

    if(health <= 0) gameOver = true;
}

/**
 * Updates enemy behaviors/intensity. Specifically, if score is a multiple of 10,
 * increment speed, frequency, and max enemies
 */
function updateEnemyIntensity() {
    // if score is a multiple of 10, increment speed, frequency, and max enemies
    if((score > lastMilestone) && (score % 10 == 0)) {
        lastMilestone = score;
        let scoreMilestones = lastMilestone / milestoneScoreMultiple;

        enemyBaseSpeed += (scoreMilestones*0.1);
        enemyFrequency += (scoreMilestones*0.25);
        enemyMaxCount++;
    }
}

function drawCity() {
    context.save();

    // draw ground
    context.fillStyle=cityColor;
    context.fillRect(0, groundStart, canvasW, canvasH-groundStart);

    // draw the buildings

    context.restore();
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
        curEnemy.curX = newPos.x;
        curEnemy.curY = newPos.y;
        
        // draw enemy path
        context.beginPath();
        context.moveTo(curEnemy.x, curEnemy.y);
        context.lineTo(curEnemy.curX, curEnemy.curY);
        context.strokeStyle=curEnemy.lineColor;
        context.lineWidth=enemyLineWidth;
        context.stroke();
        context.closePath();

        // draw enemy
		context.fillStyle=curEnemy.color;
		context.fillRect(curEnemy.curX - curEnemy.size/2, curEnemy.curY - curEnemy.size/2, curEnemy.size, curEnemy.size);

        // if enemy is beyond their target or is defeated by an anti-ballistic missile, remove it
        if(newPos.isBeyond) {
            enemyList.splice(i, 1); 
            health -= curEnemy.damage;
        }

        if(isDefeated(curEnemy)) {
            enemyList.splice(i, 1); 

            // update enemy x & y positions for explosion handling
            addDefeatExplosions(curEnemy);

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

    let enemyRadius = curEnemy.size / 2; // treat enemy like a circle

    // loop through protective explosions; if one is
    for(let i = 0; ((i < abmExplosionList.length) && (!ret)) ; i++) {
        
        let curExplosion = abmExplosionList[i];
        let dist = distBetweenTwoPoints(curEnemy.curX, curEnemy.curY, curExplosion.sourceAbm.tx, curExplosion.sourceAbm.ty);
        
        // if the distance between the two source points is less than
        // the radii of the two objects, then enemy is defeated
        if(dist < (enemyRadius + curExplosion.radius)) ret = true;
    }

    return ret;
}

/**
 * Adds explosion to the enemyExplosionList array
 * @param {object} enemy - enemy with curX & curY coords
 */
function addDefeatExplosions(enemy) {

    if(enemy===undefined || enemy.curX===undefined || enemy.curY===undefined) return;

    // add explosions to the enemyExplosionList
    for(let i = 0; i < enemyExplosionCount; i++) {
        enemyExplosionList.push({x: enemy.curX, y: enemy.curY, vx: 4 * (Math.random() * 2 - 1),
            vy: 4 * (Math.random() * 2 - 1), ay: 0.04, size: enemy.size*0.75, color: enemy.color, frames: explosionFrames});
    }
}

/**
 * Draws all the 'defeat' explosions in enemyExplosionList
 */
function drawDefeatExplosions() {

    for(let explosion of enemyExplosionList) {
        explosion.x += explosion.vx;  // update x position of explosion
        explosion.vy += explosion.ay; // update y velocity (so that it speeds up towards ground)
        explosion.y += explosion.vy;  // update y position

        //remove the element if outside canvas bounds
        if(outsideBounds(explosion) || explosion.frames <= 0) {
            let index = enemyExplosionList.indexOf(explosion);
            enemyExplosionList.splice(index,1);
        } else {
            //draw explosions
            explosion.color = fadeColor(explosion.color); // make the explosion more transparent
            
            //save off context before 
            context.save();

            //draw explosion
            context.fillStyle = explosion.color;
            context.fillRect(explosion.x - Math.floor(explosion.size/2),
                explosion.y - Math.floor(explosion.size/2), explosion.size, explosion.size);
            explosion.frames--;

            //restore context
            context.restore();
        }
    }

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

    let targetX;
    // so that enemies don't attack turret directly, check targetX
    do { targetX = Math.random()*canvasW; } while(Math.abs(targetX-(canvasW/2)) < (turretRadius*1.25));
    let targetY = groundStart;

    // determines which enemy type to add
    // if we haven't reached any scoring milestones, only send basic enemies
    if(lastMilestone < 1) {
        addBasicEnemy(startX, startY, targetX, targetY);
    } 
    // if we've reached milestones 1-3, launch speedy enemies 20% of the time
    else if(lastMilestone < 4) {
        if(Math.random() < 0.2) addSpeedyEnemy(startX, startY, targetX, targetY);
        else addBasicEnemy(startX, startY, targetX, targetY);
    }
    // if we've reached milestones 4 and beyond, launch large enemies 15% of the time,
    // speedy enemies 25% of the time, and basic enemies the rest
    else {
        let rand = Math.random();
        if(rand < 0.15) addLargeEnemy(startX, startY, targetX, targetY);
        else if (rand < 0.4) addSpeedyEnemy(startX, startY, targetX, targetY);
        else addBasicEnemy(startX, startY, targetX, targetY);
    }
    
}

/**
 * Adds a basic enemy to the game
 * 
 * @param {number} startX - starting X coord for this enemy
 * @param {number} startY - starting Y coord for this enemy
 * @param {number} targetX - target X coord for this enemy
 * @param {number} targetY - target Y coord for this enemy
 */
function addBasicEnemy(startX, startY, targetX, targetY) {
    enemyList.push({
        x:  startX,
        y:  startY,
        curX: startX,
        curY: startY,
        tx: targetX,
        ty: targetY,
        color: "RGBA(209,19,35,1.0)",
        lineColor: "#800617",
        speed: enemyBaseSpeed,
        size: 10,
        damage: 5,
        dist:0
    });
}

/**
 * Adds a fast enemy to the game; it is smaller but faster than the basic enemy
 * 
 * @param {number} startX - starting X coord for this enemy
 * @param {number} startY - starting Y coord for this enemy
 * @param {number} targetX - target X coord for this enemy
 * @param {number} targetY - target Y coord for this enemy
 */
function addSpeedyEnemy(startX, startY, targetX, targetY) {
    enemyList.push({
        x:  startX,
        y:  startY,
        curX: startX,
        curY: startY,
        tx: targetX,
        ty: targetY,
        color: "RGBA(229,232,37,1.0)",
        lineColor: "#9c9e37",
        speed: enemyBaseSpeed*1.25,
        size: 7,
        damage: 3,
        dist:0
    });

}

/**
 * Adds a large enemy to the game; it is slower but bigger, and does more damage than the basic enemy
 * 
 * @param {number} startX - starting X coord for this enemy
 * @param {number} startY - starting Y coord for this enemy
 * @param {number} targetX - target X coord for this enemy
 * @param {number} targetY - target Y coord for this enemy
 */
function addLargeEnemy(startX, startY, targetX, targetY) {
    enemyList.push({
        x:  startX,
        y:  startY,
        curX: startX,
        curY: startY,
        tx: targetX,
        ty: targetY,
        color: "RGBA(232,152,5,1.0)",
        lineColor: "#9c6d16",
        speed: enemyBaseSpeed*0.85,
        size: 20,
        damage: 10,
        dist:0
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
    context.beginPath();
    context.arc(baseX, baseY, turretRadius, 0, 2 * Math.PI, false);
    context.fillStyle=cityColor;
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

    // reduce the transparency by 0.95x, rounded to 3 decimals
    let reduce = Math.round(match.valueOf()*0.95*1000)/1000

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
 * Calculates the distance between two points
 * @param {number} x1 - point 1 x coordinate
 * @param {number} y1 - point 2 x coordinate
 * @param {number} x2 - point 1 y coordinate
 * @param {number} y2 - point 2 y coordinate
 * @returns distance value
 */
function distBetweenTwoPoints(x1, y1, x2, y2) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2) };

/**
 * Determines if an object/element is beyond the canvas x & y bounds
 * @param {object} obj - an element with an x & y attribute
 * @returns true if oustide canvas bounds, false otherwise
 */
function outsideBounds(obj) {

    if(obj===undefined || obj===null) return false;

    // check if element is outside canvas bounds
    if(obj.x < 0 || obj.x > obj) return true;
    if(obj.y < 0 || obj.y > obj) return true;
    
    //default
    return false;

}

// Function wrappers to get mouse coords
function getMouseX(event) { return event.clientX - event.target.getBoundingClientRect().left; }
function getMouseY(event) { return event.clientY - event.target.getBoundingClientRect().top; }


// Event handlers
canvas.onmousedown = function(event) {

    //if not left click, quit
    if(event.button != 0) return;

    let tx = getMouseX(event);
    let ty = getMouseY(event);

    fireABM(tx, ty);
}

canvas.onmousemove = function(event) {
    mouseX = getMouseX(event);
    mouseY = getMouseY(event);
}

// Start & pause handling
canvas.onkeydown = function(event) {
    //console.log(event.keyCode);
    pause = (event.keyCode==27) ? !pause : pause; //27 = Escape button
    
    if(!start && (event.keyCode==83)) start = true; //83 = S button
}

let span = document.getElementById("milestone");
span.textContent = milestoneScoreMultiple.toString();
window.requestAnimationFrame(drawGame); // start game