const demosSection = document.getElementById('demos');
const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');

const toggleBtn = document.getElementById('toggle-btn');
const container = document.querySelector('.container');

const recordBtn = document.querySelector(".record"),
    result = document.querySelector(".result"),
    downloadBtn = document.querySelector(".download"),
    inputLanguage = document.querySelector("#language"),
    clearBtn = document.querySelector(".clear");

let lastsaid = ""
let lastsentence = ""

let SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition,
    recognition,
    recording = false;

var model = undefined;

cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    // Show demo section now model is ready to use.
});


function hasGetUserMedia() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

var children = [];

if (hasGetUserMedia()) {
    const enableWebcamButton = document.getElementById('webcamButton');
    enableWebcamButton.addEventListener('click', enableCam);
}

// Enable the live webcam view and start classification.
function enableCam(event) {

    // Hide the button.
    event.target.classList.add('removed');

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}


let indexs = []; //the index of objects per scan;
let boundingBoxes = [];
let heightHistory = [];
let distance = [];
let flag = false;
let secondsPassed = 0;
let passy = 0;
let velocity = 0;

function predictWebcam() {
    // Now let's start classifying the stream.
    model.detect(video).then(function (predictions) {
        // Remove any highlighting we did previous frame.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // Now lets loop through predictions and draw them to the live view if
        // they have a high confidence score.
        boundingBoxes = []
        indexs = []
        
        for (let n = 0; n < predictions.length; n++) {
            // If we are over 66% sure we are sure we classified it right, draw it!

            if (((predictions[n].score > 0.66) && (predictions[n].class == "person")) || ((predictions[n].score > 0) && (predictions[n].class == "sports ball"))) {
                const p = document.createElement('p');
                p.innerText = predictions[n].class + ' - with '
                    + Math.round(parseFloat(predictions[n].score) * 100)
                    + '% confidence ' + velocity + "cm/s";
                // Draw in top left of bounding box outline.
                p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                    'top: ' + predictions[n].bbox[1] + 'px;' +
                    'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

                // Draw the actual bounding box.

                if (predictions[n].class == "person") {
                    console.log("hit");
                    let index = predictions[n].bbox[2]; //the lower the height (closer to the top), the closer it is since it is "taller"
                    //so smaller height = smaller index.
                    let fromLeft = predictions[n].bbox[0];
                    let fromRight = fromLeft + predictions[n].bbox[2] - 10;
                    let dimensions = [fromLeft, fromRight];
                    console.log(index);
                    indexs.push(index);
                    boundingBoxes.push(dimensions);
                } 
                
                else if(predictions[n].class == "sports ball"){
                    const p = document.createElement('p');
                    p.innerText = "hey"
                    //if reads soccer ball
                    const temp = setInterval(() => {
                        passy++;

                        if (passy == 50) {

                            passy = 0;
                            //calculate distance

                            let coords = undefined;
                            if (predictions[n] != undefined && predictions[n].bbox != undefined) {

                                //x y
                                coords = [predictions[n].bbox[0], predictions[n].bbox[1]];
                            }
                            if (distance.length != 0 && distance.length != 1) {
                                distance.push(coords);
                                distance.shift();

                                // 0 0 is initial x

                                //console.log("distance[0][0]" + distance[0][0]);
                                const displacementX = distance[0][0] - distance[1][0];
                                const displacementY = distance[0][1] - distance[1][1];
                                const displacementXY = Math.sqrt((displacementX * displacementX) + (displacementY * displacementY));

                                velocity = (displacementXY / 50).toFixed(3); //5 seconds

                                p.innerText = (velocity + "cm/s");
                                if (velocity>10 && !passy > 0) {
                                    const temp = setInterval(() => {
                                        if (passy == 50) {
                                            passy = 0;
                                            clearInterval(temp);
                                        }
                                    }, 5);
                                    runCheck();
                                }

                            }
                            else {
                                let pp = [predictions[n].bbox[0], predictions[n].bbox[1]];
                                distance.push(pp)
                            }

                            clearInterval(temp);
                        }
                    }, 5);
                }








                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
                    + predictions[n].bbox[1] + 'px; width: '
                    + predictions[n].bbox[2] + 'px; height: '
                    + predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);

                // Store drawn objects in memory so we can delete them next time around.
                children.push(highlighter);
                children.push(p);


            }

        }

        window.requestAnimationFrame(predictWebcam);
    });
}




function runCheck() {
    //look for indexes of the objects and pick the 1st and 2nd largest
    //check if their coresponding bounding boxes at their given index overlaps
    console.log("Indexes" + indexs);
    console.log("boundingBoxes" + boundingBoxes);
    const synth = window.speechSynthesis

    let max1 = indexs[0];
    let maxBounds1 = boundingBoxes[0];
    let max2 = indexs[1];
    let maxBounds2 = boundingBoxes[1];

    if (max2 > max1) {
        [max1, max2] = [max2, max1];
    }

    for (let i = 2; i < indexs.length; i++) {
        const num = indexs[i];
        if (num < max1) {

            //shift down the values
            max2 = max1;
            maxBounds2 = maxBounds1;
            max1 = num;
            maxBounds1 = boundingBoxes[i];
        } else if (num < max2) {
            max2 = num;
            maxBounds2 = boundingBoxes[i];
        }
    }

    //check the two boxes for overlap


    //check if the defender is more to the right
    //in this case, max2 (behind) will be the bounds and then check with the left side of maxBounds1
    if (maxBounds2 == undefined || (maxBounds2[0] == undefined && maxBounds2[1] == undefined)) {
        let ourText = "you should pass"
        const utterThis = new SpeechSynthesisUtterance(ourText)
        synth.speak(utterThis)
    }

    else if (maxBounds1[0] > maxBounds2[0] && maxBounds1[0] < maxBounds2[1]) {
        //cut left

        let ourText = "Don't pass, cut left"
        const utterThis = new SpeechSynthesisUtterance(ourText)
        synth.speak(utterThis)
    }


    //check if the defender is more to the left
    //in this case, max2 will be the bounds and then check with the right side of maxBounds1

    else if (maxBounds1[1] > maxBounds1[0] && maxBounds1[1] < maxBounds2[1]) {
        //cut right

        let ourText = "Don't pass, cut right"
        const utterThis = new SpeechSynthesisUtterance(ourText)
        synth.speak(utterThis)
    }

    else {
        let ourText = "you should pass"
        const utterThis = new SpeechSynthesisUtterance(ourText)
        synth.speak(utterThis)
    }

    lastsentence = "";
}


let pass = 0;


function speechToText() {
    try {
        recognition = new SpeechRecognition();
        recognition.lang = 'en';
        recognition.interimResults = true;
        recordBtn.classList.add("recording");
        recordBtn.querySelector("p").innerHTML = "Listening...";
        recognition.start();



        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;


            lastsaid = speechResult.split(" ").pop();
            lastsentence = speechResult.split(".").pop();

            //to solve the repeating error
            console.log(pass);
            if (lastsentence.includes("open") && !pass > 0) {
                const temp = setInterval(() => {
                    pass++;
                    if (pass == 100) {
                        pass = 0;
                        clearInterval(temp);
                    }
                }, 5);
                runCheck();
            }
            lastsentence = ""


            //detect when intrim results
            if (event.results[0].isFinal) {
                result.innerHTML += " " + speechResult;
                result.querySelector("p").remove();
            } else {
                //creative p with class interim if not already there
                if (!document.querySelector(".interim")) {
                    const interim = document.createElement("p");
                    interim.classList.add("interim");
                    result.appendChild(interim);
                }
                //update the interim p with the speech result
                document.querySelector(".interim").innerHTML = " " + speechResult;
            }
        };
        recognition.onspeechend = () => {
            speechToText();
        };
    } catch (error) {
        recording = false;
        console.log(error);
    }
}

recordBtn.addEventListener("click", () => {

    if (!recording) {
        //call();
        speechToText();
        recording = true;
    } else {
        stopRecording();
        recordBtn.querySelector("p").innerHTML = "Recording Paused";
    }
});

function stopRecording() {
    recognition.stop();
    recordBtn.querySelector("p").innerHTML = "Start Listening";
    recordBtn.classList.remove("recording");
    recording = false;
}