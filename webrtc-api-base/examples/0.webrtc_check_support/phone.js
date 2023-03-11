'use strict';

function documentIsReady() {
    if( !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia ){
      guiError("WebRTC is not supported");
    } else {
      guiInfo("WebRTC is supported");        
    }
}    


function guiError(text) { guiStatus(text, 'Pink'); }
function guiInfo(text) { guiStatus(text, 'Aquamarine'); }

function guiStatus(text, color) {
    let line = document.getElementById('status_line');
    line.setAttribute('style', `background-color: ${color}`);
    line.innerHTML = text;
}