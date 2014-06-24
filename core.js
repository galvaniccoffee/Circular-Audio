var ctx, canvas, audioCtx, audio, audioSrc, bufferSrc, analyser, frequencyData,  settingsOpen, microphone,
lines, lineAmount, lineWidth, lineSpaceing, lineColor1, lineColor2, lineColor3, bgColor, rotation, bump, pulsation,
screenMid, settings, col2Pckr, col3Pckr, pulseCB;

function setup() {
	var i;

	//Canvas and Audio setup
	canvas = document.getElementById('board');
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	ctx = canvas.getContext('2d');

	audio = document.getElementById('player');
	//audio.setAttribute('src', "you will be perfect.mp3");
	//audio.setAttribute('src', "Hustle.mp3");
	audioCtx = new (window.AudioContext || window.webkitAudioContext);

	analyser = audioCtx.createAnalyser();
  	analyser.fftSize = 64;

	audioSrc = audioCtx.createMediaElementSource(audio);
	bufferSrc = audioCtx.createBufferSource();

	audioSrc.connect(audioCtx.destination);
	audioSrc.connect(analyser);
	bufferSrc.connect(audioCtx.destination);
	bufferSrc.connect(analyser);

  	
  	frequencyData = new Uint8Array(analyser.frequencyBinCount);

  	settings = document.getElementById('settings');
  	settingsOpen = true;

  	//Calc the Screens center point (used later)
	screenMid = {x : Math.round(canvas.width / 2), y : Math.round(canvas.height / 2)};

	//Settin' up data for the circles
	lineAmount = 25;
	lineWidth = 6;
	lineSpacing = 5;
	lineColor1 = {r: 255, g: 255, b: 255, a: 0.5};
	lineColor2 = {r: 133, g: 191, b: 37, a: 1}; //Upvote-Color!
	lineColor3 = {r: 50, g: 191, b: 200, a: 1};
	bgColor = "rgba(133, 191, 137, 0.3)";
	rotation = Math.PI;
	bump = 0;
	pulsation = true;

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

	document.getElementById('fileIn').addEventListener('change', playFile, false);
	document.body.addEventListener('drop', playFile, false);

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

	//fileIn.addEventListener("change",
	//	function() {
	//		var reader = new FileReader();
//
	//		reader.onload = function(ev) {
	//				audioCtx.decodeAudioData(ev.target.result, function(buffer) {
	//					console.log("hey");
	//					bufferSrc.buffer = buffer;
	//					bufferSrc.start();
	//				});
	//		};
//
	//		reader.readAsArrayBuffer(this.files[0]);
	//		console.log(this.files[0]);
	//	}, false);
}

function tick() {
	var i;
	requestAnimationFrame(tick); //Repeat
	analyser.getByteFrequencyData(frequencyData); //Frequency Data right now

	if (pulsation) {
		//To make the circle and background grow to the beat:
		bump = Math.pow(frequencyData[17], 1) / 256;
		lineSpacing = (2 * lineSpacing + 5 + 2 * (((frequencyData[17] + frequencyData[27]) / 2) / 256)) / 3;
		//lineSpacing = (2 * lineSpacing + 5 + Math.round(24 * ((Math.abs(frequencyData[28] + frequencyData[30]) / 2) / 256))) / 3;
		//if (lineSpacing > 5) {lineSpacing = Math.round(lineSpacing / 1.3);}
	}

	//Read data to visualization...
	for (i = 0; i < lineAmount; i++) {
		lines[/*lineAmount - 1 - */i] = frequencyData[i] / 256;
	}
	//rotation +=0.005

	//...and draw the circles!
	drawLines();
}

function drawLines() {
	var i, grd;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (pulsation) {
		//Draw Background
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
			//draw small circles in the specific case.
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

function playDemo(file) {
	audio.setAttribute('src', file);
	audio.play();
}

function playFile(evt) {
	audio.pause();
	evt.stopPropagation();
    evt.preventDefault();
    console.log(evt);
    audio.setAttribute('src', URL.createObjectURL(evt.target.files[0]));
    audio.play();
}

//function useMic() {
//	audio.pause();
//	navigator.getUserMedia = (navigator.getUserMedia ||
//                          navigator.webkitGetUserMedia ||
//                          navigator.mozGetUserMedia ||
//                          navigator.msGetUserMedia);
//	navigator.getUserMedia({audio: true}, 
//		function(stream) {
//			console.log(stream);
//			microphone = audioCtx.createMediaStreamSource(stream);
//			microphone.connect(analyser);
//		},
//		function(err) {
//			console.log('The following gUM error occured: ' + err);
//      	});
//	
//}

function togglesettings() {
	settings.style.marginBottom = "-" + settings.clientHeight * (settingsOpen ? 1 : 0) + "px";
	settingsOpen = !settingsOpen;
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

function hexToRgba(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
    } : null;
}

window.onload = function () {
	setup();
}