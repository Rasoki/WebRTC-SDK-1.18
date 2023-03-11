'use strict';

/*
   Tutorial
   Simple click-to-Call phone

   URL parameters:
    'call' call to user name (or phone number). Must be set.
    'caller' caller user name. Optional (default 'Anonymous')
    'callerDN'   caller display name. Optional (default 'Anonymous')
    'server'  Optional. Replace default SBC server address (from config.js) to the parameter value.
 */

let phone = new AudioCodesUA(); // phone API
let activeCall = null; // not null, if exists active call
let callTo; // call to user

// Run when document is ready
function documentIsReady() {
    phone.setAcLogger(ac_log);
    phone.setJsSipLogger(console.log);

    ac_log(`------ Date: ${new Date().toDateString()} -------`);
    ac_log(`AudioCodes WebRTC SDK. Simple click-to-call`);
    ac_log(`SDK: ${phone.version()}`);
    ac_log(`SIP: ${JsSIP.C.USER_AGENT}`);
    ac_log(`Browser: ${phone.getBrowserName()} Internal name: ${phone.getBrowser()}`);

    // Check WebRTC support.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        let noWebRTC = 'WebRTC API is not supported in this browser !';
        guiError(noWebRTC);
        ac_log(noWebRTC);
        return;
    }

    // Get call parameters from URL
    callTo = getParameter('call');
    if (callTo === null) {
        let missedCallParameter = 'Missed "call" parameter in URL';
        guiError(missedCallParameter);
        ac_log(missedCallParameter);
        return;
    }

    // For testing. Replace default SBC address to some other.
    let server = getParameter('server', null);
    if (server !== null) {
        serverConfig.addresses = [server];
    }

    guiInit();

    // Check devices: microphone must exists, camera is optional
    // Note: the method implementation moved to phone API.
    phone.checkAvailableDevices()
        .then(() => {
            let caller = getParameter('caller', 'Anonymous');
            let callerDN = getParameter('callerDN', 'Anonymous');
            initSipStack({ user: caller, displayName: callerDN, password: '' });
        })
        .catch((e) => {
            ac_log('error', e);
            guiError(e);
        })
}

function ac_log() {
    let args = [].slice.call(arguments)
    console.log.apply(console, ['%c' + args[0]].concat(['color: BlueViolet;'], args.slice(1)));
}

function getParameter(name, defValue = null) {
    let s = window.location.search.split('&' + name + '=')[1];
    if (!s) s = window.location.search.split('?' + name + '=')[1];
    return s !== undefined ? decodeURIComponent(s.split('&')[0]) : defValue;
}

function initSipStack(account) {
    phone.setServerConfig(serverConfig.addresses, serverConfig.domain, serverConfig.iceServers);
    phone.setAccount(account.user, account.displayName, account.password);

    // Set phone API listeners
    phone.setListeners({
        loginStateChanged: function (isLogin, cause) {
            switch (cause) {
                case "connected":
                    ac_log('phone>>> loginStateChanged: connected');
                    guiMakeCall(callTo);
                    break;
                case "disconnected":
                    ac_log('phone>>> loginStateChanged: disconnected');
                    if (phone.isInitialized()) // after deinit() phone will disconnect SBC.
                        guiError('Cannot connect to SBC server');
                    break;
                case "login failed":
                    ac_log('phone>>> loginStateChanged: login failed');
                    break;
                case "login":
                    ac_log('phone>>> loginStateChanged: login');
                    break;
                case "logout":
                    ac_log('phone>>> loginStateChanged: logout');
                    break;
            }
        },

        outgoingCallProgress: function (call, response) {
            ac_log('phone>>> outgoing call progress');
            document.getElementById('outgoing_call_progress').innerText = 'dzzz dzzz';
        },

        callTerminated: function (call, message, cause, redirectTo) {
            ac_log(`phone>>> call terminated callback, cause=${cause}`);
            if (call !== activeCall) {
                ac_log('terminated no active call');
                return;
            }
            activeCall = null;
            guiWarning('Call terminated: ' + cause);
            phone.deinit(); // Disconnect from SBC server.
            guiShowPanel('call_terminated_panel');
        },

        callConfirmed: function (call, message, cause) {
            ac_log('phone>>> callConfirmed');
            guiInfo('');
            let remoteVideo = document.getElementById('remote_video');
            let vs = remoteVideo.style;
            vs.display = 'block';
            vs.width = vs.height = call.hasReceiveVideo() ? 'auto' : 0;
            guiShowPanel('call_established_panel');
        },

        callShowStreams: function (call, localStream, remoteStream) {
            ac_log('phone>>> callShowStreams');
            let remoteVideo = document.getElementById('remote_video');
            remoteVideo.srcObject = remoteStream; // to play audio and optional video
        },

        incomingCall: function (call, invite) {
            ac_log('phone>>> incomingCall');
            call.reject();
        },

        callHoldStateChanged: function (call, isHold, isRemote) {
            ac_log('phone>>> callHoldStateChanged ' + isHold ? 'hold' : 'unhold');
        }
    });

    guiInfo('Connecting...');
    phone.init(false);
}

function onBeforeUnload() {
    phone !== null && phone.isInitialized() && phone.deinit();
}

function guiInit() {
    window.addEventListener('beforeunload', onBeforeUnload);
    document.getElementById('cancel_outgoing_call_btn').onclick = guiHangup;
    document.getElementById('hangup_btn').onclick = guiHangup;
    document.getElementById('mute_audio_btn').onclick = guiMuteAudio;
}

function guiMakeCall(callTo) {
    if (activeCall !== null)
        throw 'Already exists active call';
    document.getElementById('outgoing_call_user').innerText = callTo;
    document.getElementById('outgoing_call_progress').innerText = '';
    document.getElementById('call_established_user').innerText = callTo;
    guiInfo('');
    guiShowPanel('outgoing_call_panel');
    activeCall = phone.call(phone.AUDIO, callTo); // Note: Can be used audio or video call.
}

function guiHangup() {
    if (activeCall !== null) {
        activeCall.terminate();
        activeCall = null;
    }
}

function guiMuteAudio() {
    let muted = activeCall.isAudioMuted();
    activeCall.muteAudio(!muted);
    document.getElementById('mute_audio_btn').value = !muted ? 'Unmute' : 'Mute';
}

//--------------- Status line -------
function guiError(text) { guiStatus(text, 'Pink'); }

function guiWarning(text) { guiStatus(text, 'Gold'); }

function guiInfo(text) { guiStatus(text, 'Aquamarine'); }

function guiStatus(text, color) {
    let line = document.getElementById('status_line');
    line.setAttribute('style', `background-color: ${color}`);
    line.innerHTML = text;
}
//--------------- Show or hide element -------
function guiShow(id) {
    document.getElementById(id).style.display = 'block';
}

function guiHide(id) {
    document.getElementById(id).style.display = 'none';
}

function guiIsHidden(id) {
    let elem = document.getElementById(id);
    let display = window.getComputedStyle(elem).getPropertyValue('display');
    return display === 'none';
}

function guiShowPanel(activePanel) {
    const panels = ['call_terminated_panel', 'outgoing_call_panel', 'call_established_panel'];
    for (let panel of panels) {
        if (panel === activePanel) {
            guiShow(panel);
        } else {
            guiHide(panel);
        }
    }
}