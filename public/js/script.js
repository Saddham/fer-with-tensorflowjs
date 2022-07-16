const video = document.getElementById('webcam')
// const liveView = document.getElementById('liveView')
const demosSection = document.getElementById('demos')
const enableWebcamButton = document.getElementById('webcamButton')
const disableWebcamButton = document.getElementById('webcamStopButton')
const showPredictionButton = document.getElementById('showPredictionButton')
const webcamCanvas = document.getElementById('webcamCanvas')
const faceCanvas = webcamCanvas.getContext('2d')
const width = 640
const height = 480

// Store the resulting model in the global scope of our app.
var modelFace
var modelExpression

// Check if webcam access is supported.
function getUserMediaSupported () {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will
// define in the next step.
if (getUserMediaSupported()) {
  blazeface.load().then(function (loadedModel) {
    modelFace = loadedModel
  })

  tf.loadGraphModel('/js/model/model.json', false).then(function (loadedModel) {
    modelExpression = loadedModel
  })

  enableWebcamButton.addEventListener('click', enableCam)
} else {
  console.warn('getUserMedia() is not supported by your browser')
}

function resetEverything() {
	console.log("Stopping Everything.");

	const stream = video.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach(function(track) {
    track.stop();
  });

  video.srcObject = null;

  enableWebcamButton.classList.add('added');
  enableWebcamButton.classList.remove('removed');

  disableWebcamButton.classList.add('removed');
  disableWebcamButton.classList.remove('added');
}

// Enable the live webcam view and start classification.
function enableCam (event) {
  // Only continue if the COCO-SSD has finished loading.
  if (!modelFace && modelExpression) {
    return
  }

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    audio: false,
    video: { width: 640, height: 480 }
  }

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream
    video.addEventListener('loadeddata', startPrediction);
  })
  
  enableWebcamButton.classList.add('removed');
  enableWebcamButton.classList.remove('added');

  disableWebcamButton.classList.add('added');
  disableWebcamButton.classList.remove('removed');

  disableWebcamButton.addEventListener('click', resetEverything);
}

function startPrediction() {
  showPredictionButton.classList.add('added');
  showPredictionButton.classList.remove('removed');

  showPredictionButton.addEventListener('click', predictWebcam);
}

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment
// to get everything needed to run.
// Note: cocoSsd is an external object loaded from our index.html
// script tag import so ignore any warning in Glitch.
// cocoSsd.load().then(function (loadedModel) {
//   model = loadedModel;
//   // Show demo section now model is ready to use.
//   demosSection.classList.remove('invisible');
// });

// var children = [];

function predictWebcam () {
  faceCanvas.drawImage(video, 0, 0, width, height)
  const frame = faceCanvas.getImageData(0, 0, width, height)
  // Now var's start classifying a frame in the stream.
  modelFace.estimateFaces(frame).then(function (predictions) {
    if (predictions.length === 1) {
      const landmark = predictions[0]['landmarks']
      const nosex = landmark[2][0]
      const nosey = landmark[2][1]
      const right = landmark[4][0]
      const left = landmark[5][0]

      const length = (left - right) / 2 + 5

      // Cropping the image.
      const frame2 = faceCanvas.getImageData(nosex - length, nosey - length, 2 * length, 2 * length)

      // Image is converted to tensor, resized, toBlackandWhite, then additional dimesion are added to match with [1, 48, 48, 1].
      const imageTensor = tf.browser
        .fromPixels(frame2)
        .resizeBilinear([48, 48])
        .mean(2)
        .toFloat()
        .expandDims(0)
        .expandDims(-1)

      // Predicting from image.
      const result = modelExpression.predict(imageTensor)
      const predictedValue = result.arraySync()

      const angry = 100 * predictedValue['0'][0] + '%'
      const disgust = 100 * predictedValue['0'][1] + '%'
      const fear = 100 * predictedValue['0'][2] + '%'
      const happy = 100 * predictedValue['0'][3] + '%'
      const sad = 100 * predictedValue['0'][4] + '%'
      const surprise = 100 * predictedValue['0'][5] + '%'
      const neutral = 100 * predictedValue['0'][6] + '%'

      console.log('angry: ' + angry)
      console.log('disgust: ' + disgust)
      console.log('fear: ' + fear)
      console.log('happy: ' + happy)
      console.log('sad: ' + sad)
      console.log('surprise: ' + surprise)
      console.log('neutral: ' + neutral)
    }
  })

  // // Now var's start classifying a frame in the stream.
  // model.detect(video).then(function (predictions) {
  //   // Remove any highlighting we did previous frame.
  //   for (var i = 0; i < children.length; i++) {
  //     liveView.removeChild(children[i]);
  //   }
  //   children.splice(0);

  //   // Now vars loop through predictions and draw them to the live view if
  //   // they have a high confidence score.
  //   for (var n = 0; n < predictions.length; n++) {
  //     // If we are over 66% sure we are sure we classified it right, draw it!
  //     if (predictions[n].score > 0.66) {
  //       const p = document.createElement('p');
  //       p.innerText = predictions[n].class  + ' - with '
  //           + Math.round(parseFloat(predictions[n].score) * 100)
  //           + '% confidence.';
  //       p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
  //           + (predictions[n].bbox[1] - 10) + 'px; width: '
  //           + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

  //       const highlighter = document.createElement('div');
  //       highlighter.setAttribute('class', 'highlighter');
  //       highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
  //           + predictions[n].bbox[1] + 'px; width: '
  //           + predictions[n].bbox[2] + 'px; height: '
  //           + predictions[n].bbox[3] + 'px;';

  //       liveView.appendChild(highlighter);
  //       liveView.appendChild(p);
  //       children.push(highlighter);
  //       children.push(p);
  //     }
  //   }

  //   // Call this function again to keep predicting when the browser is ready.
  //   window.requestAnimationFrame(predictWebcam);
  // });
}

// // Pretend model has loaded so we can try out the webcam code.
// var model = true;
demosSection.classList.remove('invisible')
