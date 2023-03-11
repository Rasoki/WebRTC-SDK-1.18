'use strict';

/*
   Tutorial
   Simple phone

   Implemented:
   
   - Persistent user account, user preferences, phone and server configuration in browser local storage.
   - SIP server registration.
   - Outgoing call.
   - Incoming call (answer, reject, redirect).
   - Incoming call desktop notification.
   - Hide/show local video view during open call (saved in user preferences)
   - Select video view size (saved in user preferences)
   - Mute audio, mute video.
   - Call hold/un-hold.
   - Send DTMF.
   - Restore call after page reloading.
   - Use the previously connected server after page reloading.
   - Sound playing: incoming call ring, ringing-tone, busy-tone, terminated-tone, dtmf tones.
   - Support of Chrome WebAudio autoplay policy
   - Incoming call with Replaces header
 
   Igor Kolosov AudioCodes 2022
   Last edit: 21-Jul-2022
 */

// Global variables
let phone = new AudioCodesUA(); // phone API
let hasCamera = false;
let userAccount; // { user: '', password: '', displayName: '', authUser: ''}
let userPref; // User preferences (mostly GUI)
let phoneConfig; // Default from site setting, or custom if user is changed it.
let serverConfig; // Default from site setting, or custom if user is changed it.
let desktopNotification = null; // Desktop notification about incoming call
let activeCall = null; // not null, if exists active call
let audioPlayer = new AudioPlayer2(); // Play ring, ringback & busy tones.
let ac_log = console.log;  // Logger function.
let keepAliveBeepJob = null;

const videoSizesSeq = ['Micro', 'X Tiny', 'Tiny', 'X Small', 'Small', 'Medium', 'X Medium', 'Large', 'X Large', 'XX Large', 'Huge'];
const videoSizes = {
    'Default': { width: '', height: '' },
    'Micro': { width: '60px', height: '45px' },
    'X Tiny': { width: '90px', height: '70px' },
    'Tiny': { width: '120px', height: '90px' },
    'X Small': { width: '160px', height: '120px' },
    'Small': { width: '240px', height: '180px' },
    'Medium': { width: '320px', height: '240px' },
    'X Medium': { width: '400px', height: '300px' },
    'Large': { width: '480px', height: '360px' },
    'X Large': { width: '640px', height: '480px' },
    'XX Large': { width: '800px', height: '600px' },
    'Huge': { width: '960px', height: '720px' },
};

// Run when document is ready
function documentIsReady() {
    serverConfig = guiLoadServerConfig();
    phoneConfig = guiLoadPhoneConfig();
    userPref = guiLoadUserPref();

    setConsoleLoggers();

    ac_log(`------ Date: ${new Date().toDateString()} -------`);
    ac_log(`AudioCodes WebRTC SDK. Simple phone`);
    ac_log(`SDK: ${phone.version()}`);
    ac_log(`SIP: ${JsSIP.C.USER_AGENT}`);
    ac_log(`Browser: ${phone.getBrowserName()} Internal name: ${phone.getBrowser()}`);

    audioPlayer.init({ logger: ac_log });

    guiInit();

    // Prepare audio data
    audioPlayer.downloadSounds('sounds/', SoundConfig.downloadSounds)
        .then(() => {
            let tones = Object.assign({}, SoundConfig.generateTones, audioPlayer.dtmfTones);
            return audioPlayer.generateTonesSuite(tones);
        })
        .then(() => {
            ac_log('audioPlayer: sounds are ready:', audioPlayer.sounds);
        });

    // Check WebRTC support.
    // Check devices: microphone must exist, camera is optional
    phone.checkAvailableDevices()
        .then((camera) => {
            hasCamera = camera;
            guiSetCamera();
            ac_log(`hasCamera=${hasCamera}`);
        })
        .catch((e) => {
            ac_log('Warning: missed micropone/speaker', e);
            throw e;
        })
        .then(() => {
            // Account can be null, if was not saved in local storage before
            guiSetServerFields(serverConfig);

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
    let useTimestamp = phoneConfig.addLoggerTimestamp;
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
    // If page is reloaded, try reconnect previously connected SBC server
    let data = sessionStorage.getItem('phoneRestoreServer');
    if (data !== null) {
        sessionStorage.removeItem('phoneRestoreServer');
        if (phoneConfig.restoreServer) {
            let restoreServer = JSON.parse(data);
            let delay = Math.ceil(Math.abs(restoreServer.time - new Date().getTime()) / 1000);
            if (delay <= phoneConfig.restoreCallMaxDelay) {
                if (restoreServer.isLocal) {
                    serverConfig.addresses.unshift(restoreServer.address);
                }
                let ix = searchServerAddress(serverConfig.addresses, restoreServer.address);
                if (ix !== -1) {
                    ac_log('Page reloading, raise priority of previously connected server: "' + restoreServer.address + '"');
                    serverConfig.addresses[ix] = [restoreServer.address, 1000];
                } else {
                    ac_log('Cannot find previously connected server: ' + restoreServer.address + ' in configuration');
                }
            }
        }
    }

    phone.setServerConfig(serverConfig.addresses, serverConfig.domain, serverConfig.iceServers);
    phone.setAccount(account.user, account.displayName, account.password, account.authUser);

    // Setting phone options
    phone.setReconnectIntervals(phoneConfig.reconnectIntervalMin, phoneConfig.reconnectIntervalMax);
    phone.setRegisterExpires(phoneConfig.registerExpires);
    phone.setUseSessionTimer(phoneConfig.useSessionTimer);
    phone.setBrowsersConstraints(phoneConfig.constraints);
    phone.setWebSocketKeepAlive(phoneConfig.pingInterval, phoneConfig.pongTimeout, phoneConfig.timerThrottlingBestEffort, phoneConfig.pongReport, phoneConfig.pongDist);
    phone.setDtmfOptions(phoneConfig.dtmfUseWebRTC, phoneConfig.dtmfDuration, phoneConfig.dtmfInterToneGap);
    phone.setEnableAddVideo(phoneConfig.enableAddVideo);
    phone.setNetworkPriority(phoneConfig.networkPriority);
    phone.setCodecFilter(phoneConfig.codecFilter);
    phone.setUserAgent(`AudioCodes WebRTC SDK. Simple phone ${phone.version()} ${phone.getBrowserName()}`);
    phone.setRegisterExtraHeaders(['X-SBC: AudioCodes Mediant']);

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
                    let url = phone.getServerAddress();
                    if (url.startsWith('wss://'))
                        url = url.substring(6);
                    guiInfo(`"${phone.getAccount().user}" is logged in "${url}"`);
                    let restoreData = sessionStorage.getItem('phoneRestoreCall');
                    if (restoreData !== null) {
                        sessionStorage.removeItem('phoneRestoreCall');
                    }
                    if (activeCall !== null && activeCall.isEstablished()) {
                        ac_log('Re-login done, active call exists (SBC might have switched over to secondary)');
                        guiShowPanel('call_established_panel');
                    } else if (restoreData !== null && phoneConfig.restoreCall && guiRestoreCall(restoreData)) {
                        ac_log('Call is restored after page reloading');
                    } else {
                        guiShowPanel('dialer_panel');
                    }
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

        /*
         * Optional callback. Incoming re-INVITE request.
         * Called twice: the 1st incoming re-INVITE (start=true),
         * the 2nd after send OK (start=false)
         */
        callIncomingReinvite: function (call, start, request) {
            if (start) {
                return;
            }
            ac_log('phone>>> call incoming reinvite, video current: ' + call.getVideoState() + ' enabled: ' + call.getEnabledVideoState());
            // Other side may start or stop send video.
            guiShowVideoControls(call);
            setEnableReceiveVideoButton();
            let remoteVideo = document.getElementById('remote_video');
            setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());
        },

        outgoingCallProgress: function (call, response) {
            ac_log('phone>>> outgoing call progress');
            document.getElementById('outgoing_call_progress').innerText = 'dzzz dzzz';
            if (response.body) {
                call.data['outgoingCallProgress_played'] = true; // If the 18x respone includes SDP, the server plays sound
            } else if (!call.data['outgoingCallProgress_played']) {
                call.data['outgoingCallProgress_played'] = true; // To prevent duplicate playing.
                audioPlayer.play(SoundConfig.play.outgoingCallProgress);
            }
        },

        callTerminated: function (call, message, cause, redirectTo) {
            if (call.data['terminated_replaced'])
                cause = 'call is replaced';
            ac_log(`phone>>> call terminated callback, cause=${cause}`);

            // Incoming call during active call or call that receive REFER.
            if (call !== activeCall) {
                ac_log('terminated no active call');
                return;
            }

            activeCall = null;

            guiWarning('Call terminated: ' + cause);
            guiShowPanel('dialer_panel');
            guiClearVideoView();
            guiNotificationClose();
            audioPlayer.stop();
            if (cause !== 'Redirected') {
                if (call.isOutgoing() && !call.wasAccepted()) {
                    audioPlayer.play(SoundConfig.play.busy);
                } else {
                    audioPlayer.play(SoundConfig.play.disconnect);
                }
            } else {
                ac_log('Redirect call to ' + redirectTo);
                guiMakeCallTo(redirectTo, call.hasEnabledSendVideo() ? phone.VIDEO : phone.AUDIO);
                return;
            }
        },

        callConfirmed: function (call, message, cause) {
            ac_log('phone>>> callConfirmed');
            guiInfo('');
            audioPlayer.stop();

            // Show/hide video controls and local video
            let remoteVideo = document.getElementById('remote_video');
            setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());
            guiShowVideoControls(call);
            setEnableReceiveVideoButton();
            guiShowLocalVideo(call.hasSendVideo() && !userPref.hideLocalVideo);

            if (call.data['open_replaced']) {
                guiInfo('call is replaced');
            }

            let sendVideoBtn = document.getElementById('send_video_btn');
            sendVideoBtn.value = call.hasEnabledSendVideo() ? 'Stop sending video' : 'Start sending video';
            sendVideoBtn.disabled = !hasCamera;

            // restore button values to initial state
            document.getElementById('hold_btn').value = 'Hold';
            document.getElementById('hold_btn').disabled = false;
            document.getElementById('mute_audio_btn').value = 'Mute';
            document.getElementById('mute_video_btn').value = 'Mute video';

            // for restored call  restore hold or mute state if need.
            let restore = activeCall.data['restoreCall'];
            if (restore) {
                if (restore.hold !== '') {
                    if (restore.hold.includes('remote')) {
                        ac_log('Restore remote hold');
                        guiWarning('Remote HOLD');
                        activeCall.setRemoteHoldState();
                    }
                    if (restore.hold.includes('local')) {
                        ac_log('Restore local hold');
                        guiHold(true);
                    }
                } else if (restore.mute !== '') {
                    if (restore.mute.includes('audio')) {
                        ac_log('Restore mute audio');
                        guiMuteAudio();
                    }
                    if (restore.mute.includes('video')) {
                        ac_log('Restore mute video');
                        guiMuteVideo();
                    }
                }
            }
            guiShowPanel('call_established_panel');
        },

        callShowStreams: function (call, localStream, remoteStream) {
            ac_log('phone>>> callShowStreams');
            audioPlayer.stop();
            printStreamsParameters();
            document.getElementById('remote_video').srcObject = remoteStream;
        },

        incomingCall: function (call, invite, replacedCall, hasSDP) {
            ac_log('phone>>> incomingCall', call, invite, replacedCall, hasSDP);
            call.data['incoming_invite_hasSDP'] = hasSDP;

            // If received INVITE with Replaces header
            if (replacedCall !== null) {
                ac_log('phone: incomingCall, INVITE with Replaces');

                // close the replaced call.
                replacedCall.data['terminated_replaced'] = true;
                replacedCall.terminate();

                // auto answer to replaces call.
                activeCall = call;
                activeCall.data['open_replaced'] = true;

                let videoOption = replacedCall.hasVideo() ? phone.VIDEO : (replacedCall.hasReceiveVideo() ? phone.RECVONLY_VIDEO : phone.AUDIO);
                activeCall.answer(videoOption);
                return;
            }

            // Check if exists other active call
            if (activeCall !== null) {
                ac_log('Reject incoming call, because we during other call');
                call.reject();
                return;
            }

            // Incoming call
            guiInfo('');
            activeCall = call;

            audioPlayer.play(SoundConfig.play.incomingCall);

            let user = call.data['_user'];
            let dn = call.data['_display_name']; // optional
            let caller = dn ? `"${dn}" ${user}` : user;

            document.getElementById('incoming_call_user').innerText = caller;
            document.getElementById('call_established_user').innerText = caller;
            document.getElementById('accept_video_btn').disabled = !hasCamera || !call.hasVideo();
            document.getElementById('accept_recvonly_video_btn').disabled = !call.hasVideo();
            guiShowPanel('incoming_call_panel');
            guiNotificationShow(caller);
        },

        /*
         * Here isHold, and isRemote arguments described hold event.
         *
         * For example arguments can be isHold=false isRemote=true
         * It means that remote phone remove its hold.
         * But phone can still be in local hold.
         *
         * So recommended within the callback check
         * call.isRemoteHold() and call.isLocalHold().
         */
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

            // Update hold button
            if (!isRemote) {
                document.getElementById('hold_btn').value = isHold ? 'Unhold' : 'Hold';
            }
            if (!localHold && isRemote && phoneConfig.avoidTwoWayHold) {
                document.getElementById('hold_btn').disabled = remoteHold;
            }
        }
    });

    // Request permission to use desktop notification (for incoming call)
    if (window.Notification && Notification.permission === 'default') {
        guiRequestNotificationPermission();
    }

    // API modes and browser issues workarounds
    phone.setModes(phoneConfig.modes);

    guiInfo('Logging...');

    // Initialize SIP, establish connection to SBC.
    phone.init(true); // autoLogin=true, so after SBC connection is established, automatically send SIP REGISTER.
}

// Search server address in array of addresses
function searchServerAddress(addresses, searchAddress) {
    searchAddress = searchAddress.toLowerCase();
    for (let ix = 0; ix < addresses.length; ix++) {
        let data = addresses[ix]; // can be address or [address, priority]
        let address = data instanceof Array ? data[0] : data;
        if (address.toLowerCase() === searchAddress)
            return ix;
    }
    return -1;
}

function setVideoElementVisibility(videoElement, isVisible) {
    videoElement.style.display = 'block';
    if (isVisible) {
        guiSetVideoSize(videoElement, userPref.videoSize);
    } else {
        videoElement.style.width = videoElement.style.height = '0px';
    }
}

/*
   Print call information for debugging. Using SDK.
 */
async function printStreamsParameters() {
    if (activeCall === null) {
        ac_log('activeCall is null');
        return;
    }
    // Current video state set according answer SDP (hold answer will be ignored)
    ac_log('Video State current: ' + activeCall.getVideoState() + ' enabled: ' + activeCall.getEnabledVideoState());

    // WebRTC tracks
    let li = await phone.getWR().stream.getInfo(activeCall.getRTCLocalStream());
    let ri = await phone.getWR().stream.getInfo(activeCall.getRTCRemoteStream());
    ac_log(`Enabled Tracks: local ${li} remote ${ri}`)

    // WebRTC transceivers
    let ti = await phone.getWR().connection.getTransceiversInfo(activeCall.getRTCPeerConnection());
    ac_log(`Transceivers: ${ti}`);
}

function onBeforeUnload() {
    guiNotificationClose(); // If was notification on desktop, remove it.

    if (phone === null || !phone.isInitialized())
        return;

    if (activeCall != null) {
        if (activeCall.isEstablished() && phoneConfig.restoreCall) {
            let data = {
                callTo: activeCall.data['_user'],
                video: activeCall.getVideoState(), // sendrecv, sendonly, recvonly, inactive
                replaces: activeCall.getReplacesHeader(),
                time: new Date().getTime(),
                hold: `${activeCall.isLocalHold() ? 'local' : ''}${activeCall.isRemoteHold() ? 'remote' : ''}`,
                mute: `${activeCall.isAudioMuted() ? 'audio' : ''}${activeCall.isVideoMuted() ? 'video' : ''}`
            }
            sessionStorage.setItem('phoneRestoreCall', JSON.stringify(data));
        } else {
            // Send SIP BYE
            activeCall.terminate();
        }
    }

    // Save connected server address to restore after page reloading
    let serverAddress = phone.getServerAddress();
    if (serverAddress !== null) {
        let data = {
            time: new Date().getTime(),
            address: serverAddress,
            isLocal: false
        }
        sessionStorage.setItem('phoneRestoreServer', JSON.stringify(data));
    }
    // Send SIP un-REGISTER
    phone.logout();
}

/*
 *  Simple GUI
 */
function guiInit() {
    window.addEventListener('beforeunload', onBeforeUnload);

    document.getElementById('send_video_btn').onclick = guiToggleSendVideo;
    document.getElementById('enable_sound_btn').onclick = guiEnableSound;

    // pressing enter key leads to audio call.
    document.querySelector('#call_form [name=call_to]').addEventListener("keydown", function (ev) {
        if (ev.keyCode === 13) {
            ev.preventDefault();
            guiMakeCall(phone.AUDIO);
        }
    });

    document.getElementById('login_btn').onclick = function () {
        let user = document.querySelector('#setting [name=user]').value || '';
        let authUser = document.querySelector('#setting [name=auth_user]').value || '';
        let password = document.querySelector('#setting [name=password]').value || '';
        let displayName = document.querySelector('#setting [name=display_name]').value || '';

        user = user.trim();
        authUser = authUser.trim();
        password = password.trim();
        displayName = displayName.trim();

        let account = {
            user: user,
            authUser: authUser,
            password: password,
            displayName: displayName
        };
        guiStoreAccount(account);

        try {
            let domain = document.querySelector('#setting [name=sip_domain]').value;
            let addresses = document.querySelector('#setting [name=sip_addresses]').value;
            let iceServers = document.querySelector('#setting [name=ice_servers]').value;

            domain = domain.trim();
            addresses = addresses.trim();
            iceServers = iceServers.trim();

            if (iceServers === '')
                iceServers = '[]';

            let conf = {
                domain: domain,
                addresses: JSON.parse(addresses),
                iceServers: JSON.parse(iceServers)
            };
            guiStoreServerConfig(conf);
            location.reload();
        } catch (e) {
            ac_log('Store settings error', e);
            guiError('Please fix settings');
        }
    }

    document.getElementById('info_btn').onclick = function () {
        printStreamsParameters();
        let conn = activeCall.getRTCPeerConnection();
        ac_log('connection', conn);
    }

    document.getElementById('settings_btn').onclick = function () {
        guiShowPanel('setting_panel');
    }

    document.getElementById('audio_call_btn').onclick = function () { guiMakeCall(phone.AUDIO); }
    document.getElementById('video_call_btn').onclick = function () { guiMakeCall(phone.VIDEO); }
    document.getElementById('accept_audio_btn').onclick = function () { guiAnswerCall(phone.AUDIO); }
    document.getElementById('accept_recvonly_video_btn').onclick = function () { guiAnswerCall(phone.RECVONLY_VIDEO); }
    document.getElementById('accept_video_btn').onclick = function () { guiAnswerCall(phone.VIDEO); }
    document.getElementById('reject_btn').onclick = guiRejectCall;
    document.getElementById('redirect_btn').onclick = guiRedirectCall;
    document.getElementById('do_redirect_btn').onclick = guiDoRedirectCall;
    document.getElementById('cancel_outgoing_call_btn').onclick = guiHangup;
    document.getElementById('hangup_btn').onclick = guiHangup;
    document.getElementById('hold_btn').onclick = guiToggleHold;
    document.getElementById('send_reinvite_btn').onclick = guiSendReInvite;
    document.getElementById('enable_receive_video_btn').onclick = guiEnableReceiveVideo;
    document.getElementById('mute_audio_btn').onclick = guiMuteAudio;
    document.getElementById('mute_video_btn').onclick = guiMuteVideo;
    document.getElementById('hide_local_video_ckb').onclick = guiToggleLocalVideo;
    document.getElementById('hide_local_video_ckb').checked = userPref.hideLocalVideo;
    document.getElementById('video_size_select').onchange = guiVideoSizeChanged;
    document.getElementById('keypad_btn').onclick = guiToggleDTMFKeyPad;
    guiSetVideoSizeControl(userPref.videoSize);
    guiVideoSizeChanged(false);

    // For Chrome only
    if (phoneConfig.keepAliveBeep > 0 && phone.getBrowser() === 'chrome') {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                ac_log('Phone: page is hidden: start sending keep alive beep');
                if (audioPlayer.isDisabled()) {
                    ac_log('Warning: cannot play keep alive beep, because sound is not enabled');
                    return;
                }
                keepAliveBeepJob = setInterval(() => {
                    audioPlayer.playShortSound(SoundConfig.play.keepAliveBeep);
                }, phoneConfig.keepAliveBeep * 1000);
            } else {
                ac_log('Phone: page is visible: stop sending keep alive beep');
                if (keepAliveBeepJob)
                    clearInterval(keepAliveBeepJob);
            }
        });
    }
}

/*
 * Support of Chrome Audio Policy.
 * Important: work only when called in GUI event callback (likes button click)
 */
function guiEnableSound() {
    if (!audioPlayer.isDisabled())
        return;
    ac_log('Let enable sound...');
    audioPlayer.enable()
        .then(() => {
            ac_log('Sound is enabled')
            guiHide('enable_sound_btn');
        })
        .catch((e) => {
            ac_log('Cannot enable sound', e);
        });
}

function guiSetCamera() {
    document.getElementById('video_call_btn').disabled = !hasCamera;
}

function guiAnswerCall(videoOption) {
    guiEnableSound();
    guiNotificationClose();

    // restore button values to initial state
    document.getElementById('hold_btn').value = 'Hold';
    document.getElementById('mute_audio_btn').value = 'Mute';
    document.getElementById('mute_video_btn').value = 'Mute video';

    guiShowPanel('call_established_panel');

    // Some values to testing. Please don't use in production.
    let extraHeaders = ['X-Greeting: You are welcome !']
    activeCall.answer(videoOption, extraHeaders);
}

// Try to restore call terminated by page reloading
function guiRestoreCall(restoreData) {
    let restore = JSON.parse(restoreData);
    let delay = Math.ceil(Math.abs(restore.time - new Date().getTime()) / 1000);
    if (delay > phoneConfig.restoreCallMaxDelay) {
        ac_log('No restore call, delay is too long (' + delay + ' seconds)');
        return false;
    }
    ac_log('Trying to restore call', restore);
    document.getElementById('outgoing_call_user').innerText = restore.callTo;
    document.getElementById('outgoing_call_progress').innerText = '';
    document.getElementById('call_established_user').innerText = restore.callTo;
    let videoOption = hasCamera && (restore.video === 'sendrecv' || restore.video === 'sendonly') ? phone.VIDEO : phone.AUDIO;
    guiMakeCallTo(restore.callTo, videoOption, ['Replaces: ' + restore.replaces], { 'restoreCall': restore });
    return true;
}

function guiMakeCall(videoOption) {
    guiEnableSound();
    if (activeCall !== null)
        throw 'Already exists active call';
    let callTo = document.querySelector('#call_form [name=call_to]').value.trim();
    if (callTo === '')
        return;
    document.querySelector('#call_form [name=call_to]').value = '';
    document.getElementById('outgoing_call_user').innerText = callTo;
    document.getElementById('outgoing_call_progress').innerText = '';
    document.getElementById('call_established_user').innerText = callTo;
    guiMakeCallTo(callTo, videoOption);
}

function guiMakeCallTo(callTo, videoOption, extraHeaders = null, extraData = null) {
    document.getElementById('local_video').style.display = 'block';
    document.getElementById('remote_video').style.display = 'block';

    guiInfo('');
    guiShowPanel('outgoing_call_panel');

    // Some extra headers to testing. Please don't use the test strings in production !
    if (!extraHeaders) {
        extraHeaders = ['X-Greeting: Nice to see you!'];
    }

    activeCall = phone.call(videoOption, callTo, extraHeaders);
    if (extraData !== null) {
        Object.assign(activeCall.data, extraData);
    }
}

function guiRejectCall() {
    guiEnableSound();
    guiNotificationClose();
    if (activeCall !== null) {
        activeCall.reject();
        activeCall = null;
    }
    guiShowPanel('dialer_panel');
}

function guiRedirectCall() {
    guiEnableSound();
    audioPlayer.stop();
    guiNotificationClose();
    guiShowPanel('redirect_call_panel');
}

function guiDoRedirectCall() {
    let redirectTo = document.querySelector('#redirect_form [name=redirect_to]').value.trim();
    if (redirectTo === '') {
        guiRejectCall();
        return;
    }
    if (activeCall !== null) {
        activeCall.redirect(redirectTo);
        activeCall = null;
    }
    guiShowPanel('dialer_panel');
}

function guiHangup() {
    guiEnableSound();
    guiNotificationClose();
    if (activeCall !== null) {
        activeCall.terminate();
        activeCall = null;
    }
    guiShowPanel('dialer_panel');
}

function guiClearVideoView() {
    document.getElementById('local_video').srcObject = null;
    document.getElementById('remote_video').srcObject = null;
}

/*
 * Start/Stop sending video
 */
function guiToggleSendVideo() {
    if (activeCall === null) {
        ac_log('send video: no active call');
        return;
    }
    guiInfo('');
    let sendVideoBtn = document.getElementById('send_video_btn');
    if (!activeCall.hasEnabledSendVideo()) {
        sendVideoBtn.disabled = true;
        activeCall.startSendingVideo()
            .then(() => {
                sendVideoBtn.value = 'Stop sending video';
                guiShowVideoControls(activeCall);
                guiShowLocalVideo(!userPref.hideLocalVideo);
                let remoteVideo = document.getElementById('remote_video');
                setVideoElementVisibility(remoteVideo, activeCall.hasReceiveVideo());
                setEnableReceiveVideoButton();
            })
            .catch((e) => {
                ac_log('start sending video failure', e);
            })
            .finally(() => {
                sendVideoBtn.disabled = false;
            });
    } else {
        sendVideoBtn.disabled = true;
        activeCall.stopSendingVideo()
            .then(() => {
                sendVideoBtn.value = 'Start sending video';
                guiShowVideoControls(activeCall);
                guiShowLocalVideo(false);
                let remoteVideo = document.getElementById('remote_video');
                setVideoElementVisibility(remoteVideo, activeCall.hasReceiveVideo());
                setEnableReceiveVideoButton();
            })
            .catch((e) => {
                ac_log('stop sending video failure', e);
            })
            .finally(() => {
                sendVideoBtn.disabled = false;
            });
    }
}

function guiToggleHold() {
    if (activeCall === null) {
        ac_log('toggle hold: no active call');
        return;
    }
    guiHold(!activeCall.isLocalHold());
}

function guiSendReInvite() {
    if (activeCall === null) {
        ac_log('send re-INVITE: no active call');
        return;
    }
    activeCall.sendReInvite();
}

function setEnableReceiveVideoButton() {
    document.getElementById('enable_receive_video_btn').value = (activeCall.hasEnabledReceiveVideo() ? 'Disable' : 'Enable') + ' receive video';
}

function guiEnableReceiveVideo() {
    if (activeCall === null) {
        ac_log('enable receive video: no active call');
        return;
    }
    let receive = activeCall.hasEnabledReceiveVideo();
    let hasTransceiver = activeCall.enableReceiveVideo(!receive);
    setEnableReceiveVideoButton();
    if (hasTransceiver) {
        activeCall.sendReInvite({ showStreams: true });
    }
}

function guiHold(hold) {
    ac_log('guiHold set ' + hold);
    document.getElementById('hold_btn').disabled = true;
    return activeCall.hold(hold)
        .catch(() => {
            ac_log('hold/unhold - failure');
        })
        .finally(() => {
            document.getElementById('hold_btn').disabled = false;
        });
}

function guiSendDTMF(key) {
    if (activeCall != null) {
        audioPlayer.play(Object.assign({ 'name': key }, SoundConfig.play.dtmf));
        activeCall.sendDTMF(key);
    }
}

function guiToggleDTMFKeyPad() {
    if (guiIsHidden('dtmf_keypad')) {
        ac_log('show DTMF keypad');
        document.getElementById('keypad_btn').value = 'Close keypad';
        guiShow('dtmf_keypad');
    } else {
        ac_log('hide DTMF keypad');
        document.getElementById('keypad_btn').value = 'Keypad';
        guiHide('dtmf_keypad');
    }
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
    let hide = userPref.hideLocalVideo = document.getElementById('hide_local_video_ckb').checked;
    userPref.hideLocalVideo = hide;
    guiStoreUserPref(userPref);
    guiShowLocalVideo(!hide);
}

function guiShowLocalVideo(show) {
    ac_log(`${show ? 'show' : 'hide'} local video`);
    if (activeCall === null) {
        ac_log('activeCall is null');
        return;
    }
    let localVideo = document.getElementById('local_video');
    localVideo.volume = 0.0;
    localVideo.mute = true;
    setVideoElementVisibility(localVideo, show);
    if (show) {
        localVideo.srcObject = activeCall.getRTCLocalStream();
    } else {
        localVideo.srcObject = null;
    }
}

function guiShowVideoControls(call) {
    let send = call.hasSendVideo();
    let receive = call.hasReceiveVideo();
    let videoControls = document.getElementById('video_controls_span');
    let muteVideoBtn = document.getElementById('mute_video_btn');
    videoControls.style.display = (send || receive) ? 'inline' : 'none';
    muteVideoBtn.disabled = !send;
}

function guiSetVideoSizeControl(selectedSize) {
    let options = document.getElementById('video_size_select')
    // Set selected property in options
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        option.selected = (option.value === selectedSize);
    }
}

function guiVideoSizeChanged(save = true) {
    let size = document.getElementById('video_size_select').value;
    guiSetVideoSizeControl(size);
    let localVideo = document.getElementById('local_video');
    let remoteVideo = document.getElementById('remote_video');
    if (localVideo.style.height !== '0px') { // if shown.
        guiSetVideoSize(localVideo, size);
    }
    guiSetVideoSize(remoteVideo, size);
    if (save) {
        userPref.videoSize = size;
        guiStoreUserPref(userPref);
    }
}

function guiSetVideoSize(video, size) {
    let s = videoSizes[size];
    video.style.width = s.width;
    video.style.height = s.height;
}

function guiSetVideoPos(video, left, top) {
    video.style.left = left;
    video.style.top = top;
}

//----------------- Local storage load/store ----------------------
function guiLoadAccount() { return storageLoadConfig('phoneAccount'); }
function guiStoreAccount(value) { storageSaveConfig('phoneAccount', value); }
function guiLoadServerConfig() { return storageLoadConfig('phoneServerConfig', DefaultServerConfig); }
function guiStoreServerConfig(value) { storageSaveConfig('phoneServerConfig', value, DefaultServerConfig); }
function guiLoadPhoneConfig() { return storageLoadConfig('phoneConfig', DefaultPhoneConfig, true, true); }
function guiLoadUserPref() { return storageLoadConfig('phoneUserPref', DefaultUserPref, false, false); }
function guiStoreUserPref(value) { storageSaveConfig('phoneUserPref', value, DefaultUserPref); }

//----------- set server and account fields in HTML ------------
function guiSetServerFields(server_config) {
    document.querySelector('#setting [name=sip_domain]').value = server_config.domain;
    document.querySelector('#setting [name=sip_addresses]').value = JSON.stringify(server_config.addresses);
    // An empty array seems strange to a non-programmer ;-)
    let ice = JSON.stringify(server_config.iceServers);
    if (ice === '[]')
        ice = '';
    document.querySelector('#setting [name=ice_servers]').value = ice;
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
    // Instead  elem.style.display, because display set via CSS.
    let display = window.getComputedStyle(elem).getPropertyValue('display');
    return display === 'none';
}

//--------------- Show active panel and hide others  ----------------
function guiShowPanel(activePanel) {
    const panels = ['setting_panel', 'dialer_panel', 'outgoing_call_panel',
        'incoming_call_panel', 'call_established_panel',
        'redirect_call_panel'
    ];
    for (let panel of panels) {
        if (panel === activePanel) {
            guiShow(panel);
        } else {
            guiHide(panel);
        }
    }
    // special settings for some panels.
    switch (activePanel) {
        case 'dialer_panel':
            if (!audioPlayer.isDisabled())
                guiHide('enable_sound_btn');
            break;
    }
}

//-------- Desktop notification (for incoming call) ---------
function guiRequestNotificationPermission() {
    Notification.requestPermission();
}

function guiNotificationShow(caller) {
    if (!window.Notification)
        return;
    if (Notification.permission !== "granted")
        return;
    guiNotificationClose();

    try {
        const options = {
            image: 'images/old-phone.jpg',
            requireInteraction: true
        }
        desktopNotification = new Notification("Calling " + caller, options);
        ac_log('desktopNotification created');
        desktopNotification.onclick = function (event) {
            event.target.close();
            desktopNotification = null;
        }
    } catch (e) {
        ac_log('cannot create Notification', e);
    }
}

function guiNotificationClose() {
    if (desktopNotification) {
        desktopNotification.close();
        desktopNotification = null;
        ac_log('desktopNofification.close()');
    }
}
