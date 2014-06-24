var ctx, canvas, audioCtx, audio, audioSrc, analyser, frequencyData,
lines, lineAmount, lineWidth, lineSpaceing, lineColor, rotation,
screenMid;

function setup() {
	var i;

	//Canvas and Audio setup
	canvas = document.getElementById('board');
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	ctx = canvas.getContext('2d');

	audio = document.getElementById('player');
	audio.setAttribute('src', "you will be perfect.mp3");
	audio.setAttribute('src', "Hustle.mp3");
	audioCtx = new (window.AudioContext || window.webkitAudioContext);
	audioSrc = audioCtx.createMediaElementSource(audio);
	audioSrc.connect(audioCtx.destination);
	analyser = audioCtx.createAnalyser();
  	analyser.fftSize = 64;
  	audioSrc.connect(analyser);
  	frequencyData = new Uint8Array(analyser.frequencyBinCount);

  	//Woop-di-doo
  	audio.play();

  	//Calc the Screens center point (used later)
	screenMid = {x : Math.round(canvas.width / 2), y : Math.round(canvas.height / 2)};

	//Settin' up data for the circles
	lineAmount = 25;
	lineWidth = 6;
	lineSpacing = 5;
	lineColor1 = {r: 255, g: 255, b: 255, a: 0.5};
	lineColor2 = {r: 133, g: 191, b: 37, a: 1}; //Upvote-Color!
	lineColor3 = {r: 0, g: 191, b: 255, a: 1};
	rotation = Math.PI;

	lines = []; //Stores a number between 0 and 1 for each line. 0 = Compl. retracted; 1 = full circle
	for (i = 0; i < lineAmount; i++) {
		//Fill with zeros
		lines.push(0.0);
	}

	//aaaaaand start!
	tick();

	window.onresize = function(event) {
		//Change variables when the window is resized
		canvas.height = window.innerHeight;
		canvas.width = window.innerWidth;
		screenMid.x = Math.round(canvas.width / 2);
		screenMid.y = Math.round(canvas.height / 2);
	}
}

function tick() {
	var i;
	requestAnimationFrame(tick); //Repeat
	analyser.getByteFrequencyData(frequencyData); //Frequency Data right now

	//To make the circle grow to the beat:
	lineSpacing = (2 * lineSpacing + 5 + Math.round(24 * (frequencyData[27] / 256))) / 3;
	if (lineSpacing > 5) {lineSpacing -= 2;}

	//Read data to visualisation...
	for (i = 0; i < lineAmount; i++) {
		lines[/*lineAmount - 1 - */i] = frequencyData[i] / 256;
	}
	//rotation +=0.5

	//...and draw the circles!
	drawLines();
}

function drawLines() {
	var i, grd;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//Draw Background
	grd = ctx.createRadialGradient(screenMid.x, screenMid.y, 0, screenMid.x, screenMid.y, Math.pow(lineSpacing - 4, 4))
	grd.addColorStop(0, "rgba(133, 191, 137, 0.4)");
	grd.addColorStop(1, "rgba(0, 0, 0, 0)");
	ctx.fillStyle = grd;
	ctx.beginPath();
	ctx.arc(
				screenMid.x,
				screenMid.y,
				Math.pow(lineSpacing - 4, 4),
				0,
				2 * Math.PI, false);
	ctx.fill();


	//Draw Circles
	ctx.lineCap = 'round';
	ctx.lineWidth = lineWidth;

	for (i = 0; i < lines.length; i++) {
		

		if (lines[i] === 0 || i === 0) {
			ctx.fillStyle = getColor(lineColor1, lineColor2, lines[i]).string;
			ctx.beginPath();
			//ctx.moveTo(screenMid.x, screenMid.y);
			ctx.arc(
				screenMid.x - i * (lineWidth + lineSpacing),
				screenMid.y,
				Math.round(lineWidth / 2),
				0,
				2 * Math.PI, false);
			ctx.fill();
		} else {
			ctx.strokeStyle = getColor(lineColor1, getColor(lineColor2, lineColor3, i / lineAmount).col, lines[i]).string;
			
			ctx.beginPath();
			//ctx.moveTo(screenMid.x - i * (lineWidth + lineSpacing), screenMid.y);
			ctx.arc(
				screenMid.x, //center
				screenMid.y,
				i * (lineWidth + lineSpacing), //rad
				rotation, //ang1
				rotation + Math.PI * 2 * lines[i]); //ang2

			ctx.stroke();

		}
	}
}

function getColor(col1, col2, pos) {
	var nR, nG, nB, nA;
	nR = Math.round(col1.r * (1 - pos) + col2.r * pos);
	nG = Math.round(col1.g * (1 - pos) + col2.g * pos);
	nB = Math.round(col1.b * (1 - pos) + col2.b * pos);
	nA = col1.a * (1 - pos) + col2.a * pos;

	return {col: {r: nR, g: nG, b: nB, a: nA},
			string: "rgba(" + String(nR) + ", " + String(nG) + ", " + String(nB) + ", "  + String(nA) + ")"};
}

window.onload = function () {
	setup();
}