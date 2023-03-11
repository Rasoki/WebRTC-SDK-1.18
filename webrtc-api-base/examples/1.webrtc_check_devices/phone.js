'use strict';

function documentIsReady() {
    // Check devices: microphone must exist, camera is optional
    checkAvailableDevices()
        .then((camera) => {
            let str = 'microphone is found'
            if (camera)
                str = 'microphone and camera are found'
            guiInfo(str);
            console.log(str)
        })
        .catch((e) => {
            guiError(e);
            console.log(e);
        })
}

// Check WebRTC support. Check presence of microphone and camera.
function checkAvailableDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        return Promise.reject('WebRTC is not supported');
    let cam = false,
        mic = false,
        spkr = false;
    return navigator.mediaDevices.enumerateDevices()
        .then((deviceInfos) => {
            deviceInfos.forEach(function (d) {
                console.log(d);  // print device info for debugging
                switch (d.kind) {
                    case 'videoinput':
                        cam = true;
                        break;
                    case 'audioinput':
                        mic = true;
                        break;
                    case 'audiooutput':
                        spkr = true;
                        break;
                }
            });
            // Chrome supports 'audiooutput', Firefox and Safari do not support.
            if (navigator.webkitGetUserMedia === undefined) { // Not Chrome
                spkr = true;
            }
            if (!spkr)
                return Promise.reject('Missing a speaker! Please connect one and reload');
            if (!mic)
                return Promise.reject('Missing a microphone! Please connect one and reload');

            return Promise.resolve(cam);
        });
}

//------------- Set status line --------------------
function guiError(text) { guiStatus(text, 'Pink'); }

function guiWarning(text) { guiStatus(text, 'Gold'); }

function guiInfo(text) { guiStatus(text, 'Aquamarine'); }

function guiStatus(text, color) {
    let line = document.getElementById('status_line');
    line.setAttribute('style', `background-color: ${color}`);
    line.innerHTML = text;
}