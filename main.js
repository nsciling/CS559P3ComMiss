// @ts-check

// set the canvas & canvas variables
let canvas = document.getElementById("box2canvas");
let context = canvas.getContext("2d");
let canvasH = canvas.getAttribute("height");
let canvasW = canvas.getAttribute("width");

// globals
let mouseX;
let mouseY;
let turretRadius = 40;
let baseX = canvasW/2;
let baseY = canvasH - turretRadius;

//this is a 'display list' -> list of objects we plan to draw
let newColor = getRGBcolorString();
let fwList = [{n:25, x: 250, y: 400, vx: 0, vy: -2, tx: 300, ty: 150, ay: 0.005, curColor: newColor, origColor: newColor}]
let expList = [];   // explosions
let expCount = 35;  // default number of explosions to produce

canvas.onmousedown = function(event) {
    let box = event.target.getBoundingClientRect();
    let tx = event.clientX - box.left;  // target X coord for firework
    let ty = event.clientY - box.top;   // target Y coord for firework
    
    newColor = getRGBcolorString();

    fwList.push({n: expCount, x: tx, y: 400, vx: 0, vy: -(Math.random() * 6 + 2), tx: tx, ty: ty, ay: 0.005, curColor: newColor, origColor: newColor});
}

canvas.onmousemove = function(event) {
    mouseX = event.offsetX;
    mouseY = event.offsetY;
}

/**
 * A function to draw a display list representing a firework.
 */
let draw = function() {

    resetCanvas();

    drawTurret();

    //check to add random fireworks
    if(Math.random() > 0.99) { launchRandomFirework(); }
    
    // Update the list
    for(let li of fwList) {
        li.x += li.vx;

        //make y decelerate as it nears the target
        if((li.y - li.ty) < 75) li.vy += li.ay;
        if((li.y - li.ty) > 0) li.y += li.vy;

        //make an explosion
        if (li.y <= li.ty && li.n > 0) {
            //once firework reaches target y value, hide it by making it the same
            //color as the canvas, with slight delay
            if (li.n < expCount) { li.curColor = context.fillStyle; };
            
            //decrease the explosion count, and push another explosion element
            li.n--;
            expList.push({x: li.x, y: li.y, vx: 4 * (Math.random() * 2 - 1),
                vy: 4 * (Math.random() * 2 - 1), ay: 0.04, color: li.origColor});
        }

        //remove the element if it is done exploding
        if(li.n <= 0) {
            let index = fwList.indexOf(li);
            fwList.splice(index,1);
        } else {
            //animate
            drawFirework(li.x, li.y, 5, li.curColor);
        }
    }

    // animate the explosion
    for(let an of expList) {
        an.x += an.vx;  // update x position of explosion
        an.vy += an.ay; // update y velocity (so that it speeds up towards ground)
        an.y += an.vy;  // update y position

        //remove the element if outside canvas bounds
        if(outsideBounds(an)) {
            let index = expList.indexOf(an);
            expList.splice(index,1);
        } else {
            an.color = fadeColor(an.color); // make the explosion more transparent
            drawExplosion(an.x, an.y, 4, an.color);
        }
    }

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
 * Draws the gun turret player users to shoot
 */
function drawTurret() {
    // target
    let adjTarget = getAdjustedTurretPos(baseX,baseY,mouseX,mouseY,90);

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
 * Function to launch a random firework
 */
function launchRandomFirework() {
    newColor = getRGBcolorString();

    let x = getRandomBetween(0.1,0.9) * canvas.getAttribute("width"); // don't fire at the screen edges
    let y = getRandomBetween(0,0.95) * canvas.getAttribute("height"); // on't fire all the way to the top

    fwList.push({n:expCount, x: x, y: 400, vx: 0, vy: -(Math.random() * 5 + 1), 
        tx: 300, ty: y, ay: 0.005, curColor: newColor, origColor: newColor});
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
 * Function to draw a firework circle
 * 
 * @param {number} x - x-coordinate of the circle in the frame
 * @param {number} y - y-coordinate of the circle in the frame
 * @param {number} rad - radius of the circle6
 * @param {string} color - color of the circle
 * @returns none; draws a circle on the webpage
 */
function drawFirework(x, y, rad, color) {
    //if we don't have the necessary data, quit
    if(x===undefined || y===undefined || rad===undefined || color===undefined) return;
    
    //save off context before 
    context.save();

    //draw firework
    context.beginPath();
    context.arc(x, y, rad, 0, 2 * Math.PI, false);
    context.fillStyle=color;
    context.fill();

    //restore context
    context.restore();
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

function getAdjustedTurretPos(bx,by,tx,ty,len) {
    let dist = Math.sqrt((tx-bx)**2 + (by-ty)**2);
    
    let mult = len / dist;
    let newX = bx - ((bx - tx)*mult);
    let newY = by - ((by - ty)*mult);
    
    return {x:newX, y:newY};
}


window.requestAnimationFrame(draw); // start animation