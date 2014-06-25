var ctx, canvas, audioCtx, audio, audioSrc, analyser, frequencyData,  settingsOpen, microphone,
lines, lineAmount, lineWidth, lineSpaceing, lineColor1, lineColor2, lineColor3, bgColor, rotation, bump, pulsation,
screenMid, settings, col2Pckr, col3Pckr, pulseCB;


window.onload = function () {
	setup();
}

function setup() {
	var i;

	//Canvas and Audio setup
	canvas = document.getElementById('board');
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	ctx = canvas.getContext('2d');

	audio = document.getElementById('player'); //The HTML5 player
	audioCtx = new (window.AudioContext || window.webkitAudioContext);

	analyser = audioCtx.createAnalyser();
  	analyser.fftSize = 64;

	audioSrc = audioCtx.createMediaElementSource(audio);

	audioSrc.connect(audioCtx.destination);
	audioSrc.connect(analyser);

  	frequencyData = new Uint8Array(analyser.frequencyBinCount); //The current frequency data will be stored here later.

  	//Menu setup
  	settings = document.getElementById('settings');
  	settingsOpen = true;

  	//Calc the screen's center point (used later)
	screenMid = {x : Math.round(canvas.width / 2), y : Math.round(canvas.height / 2)};

	//Settin' up data for the circles
	lineAmount = 25;
	lineWidth = 6;
	lineSpacing = 5;
	lineColor1 = {r: 255, g: 255, b: 255, a: 0.5};
	lineColor2 = {r: 133, g: 191, b: 37, a: 1}; //Upvote-Color!
	lineColor3 = {r: 50, g: 191, b: 200, a: 1};
	bgColor = "rgba(133, 191, 137, 0.3)"; //For the background gradient
	rotation = Math.PI;
	bump = 0; //background gradient size
	pulsation = true;

	lines = []; //Stores a number between 0 and 1 for each line. 0 = completely retracted; 1 = full circle
	for (i = 0; i < lineAmount; i++) {
		//Fill with zeros
		lines.push(0.0);
	}

	//aaaaaand go!
	tick();

	window.onresize = function(event) {
		//Change variables when the window is resized
		canvas.height = window.innerHeight;
		canvas.width = window.innerWidth;
		screenMid.x = Math.round(canvas.width / 2);
		screenMid.y = Math.round(canvas.height / 2);
	}

	//Music file input setup
	document.getElementById('fileIn').addEventListener('change', playFile, false);
	document.body.addEventListener('drop', playFile, false);

	//Options setup (color selectors etc.)
	col2Pckr = document.getElementById('col2');
	col3Pckr = document.getElementById('col3');
	pulseCB = document.getElementById('pulsating');

	col2Pckr.addEventListener("change",
		function() {
			lineColor2 = hexToRgba(this.value);
		}
		, false);

	col3Pckr.addEventListener("change",
		function() {
			lineColor3 = hexToRgba(this.value);
		}
		, false);

	pulseCB.addEventListener("change",
		function() {
			pulsation = this.checked;
			if (!this.checked) {
				lineSpacing = 5;
			}
		}
		, false);
}

function tick() {
	var i;
	requestAnimationFrame(tick); //Repeat
	analyser.getByteFrequencyData(frequencyData); //Frequency Data right now; integers between 0 and 256

	if (pulsation) {
		//To make the circle and background gradient pulsate to the beat:
		bump = Math.pow(frequencyData[17], 1) / 256;
		lineSpacing = (2 * lineSpacing + 5 + 2 * (((frequencyData[17] + frequencyData[27]) / 2) / 256)) / 3;
	}

	//Read data to visualization...
	for (i = 0; i < lineAmount; i++) {
		lines[i] = frequencyData[i] / 256;
	}


	//rotation +=0.005 //Currently not used

	//...and draw the circles!
	drawLines();
}

function drawLines() {
	var i, grd;
	
	//Clean everything up
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (pulsation) {
		//Draw background gradient
		grd = ctx.createRadialGradient(screenMid.x, screenMid.y, 0, screenMid.x, screenMid.y, 1000 * bump);
		grd.addColorStop(0, bgColor);
		grd.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(
					screenMid.x,
					screenMid.y,
					1000 * bump,
					0,
					2 * Math.PI, false);
		ctx.fill();
	}


	//Draw Circles
	ctx.lineCap = 'round';
	ctx.lineWidth = lineWidth;

	for (i = 0; i < lines.length; i++) {
		

		if (lines[i] === 0 || i === 0) {

			//If the line is fully retracted, even the round caps aren't drawn, so we need to
			//draw small circles in this specific case. Also, the center 'line' is always a dot.

			ctx.fillStyle = getColor(lineColor1, lineColor2, lines[i]).string; //Color depending on line length
			ctx.beginPath();
			ctx.arc(
				screenMid.x - i * (lineWidth + lineSpacing),
				screenMid.y,
				Math.round(lineWidth / 2),
				0,
				2 * Math.PI, false);
			ctx.fill();

		} else {

			//In every other case simply draw the arc.

			ctx.strokeStyle = getColor(lineColor1, getColor(lineColor2, lineColor3, i / lineAmount).col, lines[i]).string; //Color depending on line length
			
			ctx.beginPath();
			ctx.arc(
				screenMid.x, //Center
				screenMid.y,
				i * (lineWidth + lineSpacing), //Radius
				rotation, //Starting angle
				rotation + Math.PI * 2 * lines[i]); //End Angle

			ctx.stroke();

		}
	}
}

function playDemo(file) {
	//Gets called via the button in the HTML
	audio.setAttribute('src', file);
	audio.play();
}

function playFile(evt) {
	//Gets called when selecting a file
	audio.pause();
	evt.stopPropagation();
    evt.preventDefault();
    console.log(evt);
    audio.setAttribute('src', URL.createObjectURL(evt.target.files[0]));
    audio.play();
}

function togglesettings() {
	//Self-explaining
	settings.style.marginBottom = "-" + settings.clientHeight * (settingsOpen ? 1 : 0) + "px";
	settingsOpen = !settingsOpen;
}

function getColor(col1, col2, pos) {
	//Returns the color that's a mix between the 2 given ones, with position being the ratio between them
	var nR, nG, nB, nA;
	nR = Math.round(col1.r * (1 - pos) + col2.r * pos);
	nG = Math.round(col1.g * (1 - pos) + col2.g * pos);
	nB = Math.round(col1.b * (1 - pos) + col2.b * pos);
	nA = col1.a * (1 - pos) + col2.a * pos;

	return {col: {r: nR, g: nG, b: nB, a: nA},
			string: "rgba(" + String(nR) + ", " + String(nG) + ", " + String(nB) + ", "  + String(nA) + ")"};
}

function hexToRgba(hex) {
	//Used for the color selectors
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
    } : null;
}
