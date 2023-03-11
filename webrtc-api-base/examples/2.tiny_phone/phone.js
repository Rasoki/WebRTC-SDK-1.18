'use strict';

/*
 * Tutorial
 * Tiny phone.
 *
 * Igor Kolosov AudioCodes 2021
   Last edit: 2-Jun-2022
 */

// Global variables
let phone = new AudioCodesUA(); // phone API
let hasCamera = false;
let userAccount; // { user: '', password: '' password, displayName: '', authUser: ''}
let serverConfig = DefaultServerConfig; // from site settings
let activeCall = null; // not null, if exists active call
let ac_log = console.log;  // Logger function.

// Run when document is ready
function documentIsReady() {
    setConsoleLoggers();

    ac_log(`------ Date: ${new Date().toDateString()} -------`);
    ac_log(`AudioCodes WebRTC SDK. Tiny phone`);
    ac_log(`SDK: ${phone.version()}`);
    ac_log(`SIP: ${JsSIP.C.USER_AGENT}`);
    ac_log(`Browser: ${phone.getBrowserName()} Internal name: ${phone.getBrowser()}`);

    guiInit();

    // Check WebRTC support.
    // Check devices: microphone must exist, camera is optional
    phone.checkAvailableDevices()
        .then((camera) => {
            hasCamera = camera;
            guiSetCamera();
            ac_log(`hasCamera=${hasCamera}`);
        })
        .then(() => {
            // Account can be null, if was not saved in local storage before
            userAccount = guiLoadAccount();
            if (userAccount) {
                guiSetAcountFields(userAccount);
                initSipStack(userAccount);
            } else {
                throw 'Please set user, display-name and password, and optional authorization name.';
            }
        })
        .catch((e) => {
            ac_log('error', e);
            guiError(e);
            guiShowPanel('setting_panel');
        })
}

function createTimestamp(date = null) {
    if (date === null)
        date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();
    let ms = date.getMilliseconds();
    return ((h < 10) ? '0' + h : h) + ':' + ((m < 10) ? '0' + m : m) + ':' + ((s < 10) ? '0' + s : s) + '.' + ('00' + ms).slice(-3) + ' ';
}

function setConsoleLoggers() {
    let useTimestamp = true;
    let useColor = ['chrome', 'firefox', 'safari'].includes(phone.getBrowser());

    ac_log = function () {
        let args = [].slice.call(arguments);
        let firstArg = [(useTimestamp ? createTimestamp() : '') + (useColor ? '%c' : '') + args[0]];
        if (useColor) firstArg = firstArg.concat(['color: BlueViolet;']);
        console.log.apply(console, firstArg.concat(args.slice(1)));
    };
    let js_log = function () {
        let args = [].slice.call(arguments);
        let firstArg = [(useTimestamp ? createTimestamp() : '') + args[0]];
        console.log.apply(console, firstArg.concat(args.slice(1)));
    };

    phone.setAcLogger(ac_log);
    phone.setJsSipLogger(js_log);
}

function initSipStack(account) {
    phone.setServerConfig(serverConfig.addresses, serverConfig.domain, serverConfig.iceServers);
    phone.setAccount(account.user, account.displayName, account.password, account.authUser);

    // Set phone API listeners
    phone.setListeners({
        loginStateChanged: function (isLogin, cause, response) {
            switch (cause) {
                case "connected":
                    ac_log('phone>>> loginStateChanged: connected');
                    break;
                case "disconnected":
                    ac_log('phone>>> loginStateChanged: disconnected');
                    guiError('SBC server: disconnected');
                    if (activeCall === null) // if no active call
                        guiShowPanel('setting_panel');
                    break;
                case "login failed":
                    ac_log('phone>>> loginStateChanged: login failed');
                    guiError('SBC server: login failed');
                    guiShowPanel('setting_panel');
                    break;
                case "login":
                    ac_log('phone>>> loginStateChanged: login');
                    guiInfo('SBC server: "' + phone.getAccount().user + '" is logged in');
                    guiShowPanel('dialer_panel');
                    break;
                case "logout":
                    ac_log('phone>>> loginStateChanged: logout');
                    guiInfo('SBC server: logout');
                    if (activeCall === null || !activeCall.isEstablished()) { // if no active call
                        guiShowPanel('setting_panel');
                        break;
                    }
            }
        },

        outgoingCallProgress: function (call, response) {
            ac_log('phone>>> outgoing call progress');
            document.getElementById('outgoing_call_progress').innerText = 'dzzz dzzz';
        },

        callTerminated: function (call, message, cause, redirectTo) {
            ac_log('phone>>> call terminated callback, cause=%o', cause);
            // Incoming call during active call or call that receive REFER.
            if (call !== activeCall) {
                ac_log('terminated no active call');
                return;
            }

            activeCall = null;

            guiWarning('Call terminated: ' + cause);
            guiShowPanel('dialer_panel');
            guiClearVideoView();
        },

        callConfirmed: function (call, message, cause) {
            ac_log('phone>>> callConfirmed');
            guiInfo('');
            // Show or hide video controls, according call property 'video'
            let videoControls = document.getElementById('video_controls_span');
            videoControls.style.display = call.hasVideo() ? 'inline' : 'none';

            // show or hide local video
            guiToggleLocalVideo();

            // show of hide remote video
            let remoteVideo = document.getElementById('remote_video');
            let vs = remoteVideo.style;
            vs.display = 'block';
            vs.width = vs.height = call.hasReceiveVideo() ? 'auto' : 0;

            guiShowPanel('call_established_panel');
        },

        callShowStreams: function (call, localStream, remoteStream) {
            ac_log('phone>>> callShowStreams');
            document.getElementById('remote_video').srcObject = remoteStream;
        },

        incomingCall: function (call, invite, replacedCall, hasSDP) {
            ac_log('phone>>> incomingCall', call, invite, replacedCall, hasSDP);
            // Check if exists other active call
            if (activeCall !== null) {
                ac_log('Reject incoming call, because we during other call');
                call.reject();
                return;
            }
            // Incoming call
            guiInfo('');
            activeCall = call;

            let user = call.data['_user'];
            let dn = call.data['_display_name']; // optional
            let caller = dn ? `"${dn}" ${user}` : user;

            document.getElementById('incoming_call_user').innerText = caller;
            document.getElementById('call_established_user').innerText = caller;
            document.getElementById('accept_video_btn').disabled = !hasCamera || !call.hasVideo();

            guiShowPanel('incoming_call_panel');
        },

        callHoldStateChanged: function (call, isHold, isRemote) {
            ac_log('phone>>> callHoldStateChanged');
            let remoteHold = call.isRemoteHold();
            let localHold = call.isLocalHold();
            if (remoteHold && localHold) {
                guiWarning('Remote & Local HOLD');
            } else if (remoteHold && !localHold) {
                guiWarning('Remote HOLD');
            } else if (!remoteHold && localHold) {
                guiWarning('Local HOLD');
            } else {
                guiInfo('Unhold done');
            }
        }
    });

    guiInfo('Logging...');

    // Initialize SIP, establish connection to SBC.
    phone.init(true); // autoLogin=true, so after SBC connection is established, automatically send SIP REGISTER.
}

function onBeforeUnload() {
    if (phone === null || !phone.isInitialized())
        return;
    // Send BYE
    if (activeCall != null) {
        activeCall.terminate();
    }
    // Send un-REGISTER
    phone.logout();
}

/*
 *  Simple GUI
 */
function guiInit() {
    window.addEventListener('beforeunload', onBeforeUnload);

    document.getElementById('login_btn').onclick = function () {
        let user = document.querySelector('#setting [name=user]').value;
        let authUser = document.querySelector('#setting [name=auth_user]').value || '';
        let password = document.querySelector('#setting [name=password]').value;
        let displayName = document.querySelector('#setting [name=display_name]').value || '';

        let account = {
            user: user,
            authUser: authUser,
            password: password,
            displayName: displayName
        };
        guiStoreAccount(account);
        location.reload();
    }

    document.getElementById('settings_btn').onclick = function () {
        guiShowPanel('setting_panel');
    }

    document.getElementById('audio_call_btn').onclick = function () { guiMakeCall(phone.AUDIO); }
    document.getElementById('video_call_btn').onclick = function () { guiMakeCall(phone.VIDEO); }

    document.getElementById('accept_audio_btn').onclick = function () { guiAnswerCall(phone.AUDIO); }
    document.getElementById('accept_video_btn').onclick = function () { guiAnswerCall(phone.VIDEO); }
    document.getElementById('reject_btn').onclick = guiRejectCall;

    document.getElementById('cancel_outgoing_call_btn').onclick = guiHangup;
    document.getElementById('hangup_btn').onclick = guiHangup;
    document.getElementById('mute_audio_btn').onclick = guiMuteAudio;
    document.getElementById('mute_video_btn').onclick = guiMuteVideo;
    document.getElementById('hide_local_video_ckb').onclick = guiToggleLocalVideo;
    document.getElementById('hide_local_video_ckb').checked = true;
}

function guiSetCamera() {
    document.getElementById('video_call_btn').disabled = !hasCamera;
}

function guiAnswerCall(videoOption) {
    guiShowPanel('call_established_panel');
    activeCall.answer(videoOption);
}

function guiMakeCall(videoOption) {
    if (activeCall !== null)
        throw 'Already exists active call';
    let callTo = document.querySelector('#call_form [name=call_to]').value.trim();
    if (callTo === '')
        return;

    document.querySelector('#call_form [name=call_to]').value = '';
    document.getElementById('outgoing_call_user').innerText = callTo;
    document.getElementById('outgoing_call_progress').innerText = '';
    document.getElementById('call_established_user').innerText = callTo;

    let lvs = document.getElementById('local_video').style;
    lvs.display = 'block';
    lvs.height = lvs.width = 'auto';
    let rvs = document.getElementById('remote_video').style;
    rvs.display = 'block';
    rvs.height = rvs.width = 'auto';

    guiInfo('');
    guiShowPanel('outgoing_call_panel');
    activeCall = phone.call(videoOption, callTo);
}

function guiRejectCall() {
    if (activeCall !== null) {
        activeCall.reject();
        activeCall = null;
    }
    guiShowPanel('dialer_panel');
}

function guiHangup() {
    if (activeCall !== null) {
        activeCall.terminate();
        activeCall = null;
    }
    guiShowPanel('dialer_panel');
}

function guiClearVideoView() {
    document.getElementById('local_video').srcObject = null;
    let remoteVideo = document.getElementById('remote_video');
    remoteVideo.srcObject = null;
    remoteVideo.style.width = remoteVideo.style.height = 0;
}

function guiMuteAudio() {
    let muted = activeCall.isAudioMuted();
    activeCall.muteAudio(!muted);
    document.getElementById('mute_audio_btn').value = !muted ? 'Unmute' : 'Mute';
}

function guiMuteVideo() {
    let muted = activeCall.isVideoMuted();
    activeCall.muteVideo(!muted);
    document.getElementById('mute_video_btn').value = !muted ? 'Unmute video' : 'Mute video';
}


function guiToggleLocalVideo() {
    let hide = document.getElementById('hide_local_video_ckb').checked;
    guiShowLocalVideo(!hide);
}

function guiShowLocalVideo(show) {
    ac_log(`${show ? 'show' : 'hide'} local video view`);
    if (activeCall === null) {
        ac_log('activeCall is null');
        return;
    }
    let localVideo = document.getElementById('local_video');
    localVideo.volume = 0.0;
    localVideo.mute = true;
    if (show) {
        localVideo.srcObject = activeCall.getRTCLocalStream();
        localVideo.style.height = localVideo.style.width = 'auto';
    } else {
        localVideo.srcObject = null;
        localVideo.style.height = localVideo.style.width = 0;
    }
}


//----------------- Store/Load Account  to/from local storage ---------------
function guiStoreAccount(account) {
    localStorage.setItem('phoneAccount', JSON.stringify(account));
}

function guiLoadAccount() {
    let account = localStorage.getItem('phoneAccount');
    return account ? JSON.parse(account) : null;
}

function guiSetAcountFields(account) {
    document.querySelector('#setting [name=user]').value = account.user;
    document.querySelector('#setting [name=password]').value = account.password;
    document.querySelector('#setting [name=display_name]').value = account.displayName;
    document.querySelector('#setting [name=auth_user]').value = account.authUser;
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

//--------------- Show active panel and hide others  ----------------
function guiShowPanel(activePanel) {
    const panels = ['setting_panel', 'dialer_panel', 'outgoing_call_panel',
        'incoming_call_panel', 'call_established_panel'
    ];
    for (let panel of panels) {
        if (panel === activePanel) {
            guiShow(panel);
        } else {
            guiHide(panel);
        }
    }
}