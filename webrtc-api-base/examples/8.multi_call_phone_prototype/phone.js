'use strict';

/*
   WebRTC multi call phone.

   Implemented:
   - Multi call
   - Blind and attended call transfer
   - Audio conference
   - Video conference
   - Added support of header: x-genesys-calluuid (Genesys server support example)
   - Added special support of Firefox incoming call notification permission request.
   - Added support of multiple screen sharing (using the same screen sharing stream)
   - Added setCodecFilter and printUsedCodecs() to check used codecs.
   - Added microphone, speaker, camera selection

   Igor Kolosov AudioCodes 2022
   Last edit: 24-Jul-2022
 */

// Global variables
let phone = new AudioCodesUA(); // phone API
let hasCamera = false; // If computer has camera.
let callLogDb = new CallLogDb(100); // last call logs indexeddb. Set max records number.
let messageDb = new MessageDb(100); // last incoming text messages. Set max records number.
let userAccount; // { user: '', password: '', displayName: '', authUser: ''}
let userPref; // User preferences (mostly GUI)
let phoneConfig; // Default from site setting, or custom if user is changed it.
let serverConfig; // Default from site setting, or custom if user is changed it.
let desktopNotification = null; // Desktop notification about incoming call
let audioPlayer = new AudioPlayer2(); // Play ring, ringback & busy tones.
let ac_log = console.log;  // Phone logger function.
let lines = [null, null, null, null, null]; // For the example used 5 lines
let selected = 0; // Selected line index
let restoreMultiCall = null; // To restore calls after page reloading
let conference = 'off'; // Conference modes: off/audio/video
let videoMixer = new CallVideoMixer(); // For video conference
let recallAfterSwitchingSbc = null; // Switching SBC and re-calling after initial INVITE 5xx response.
let serverLocalAddress; // set by optional REGISTER OK header: X-AudioCodes-SBC-FQDN
const screenSharing = { stream: null, counter: 0 };
let keepAliveBeepJob = null;
let devices = new SelectDevices();
let remoteVideoDeviceIds = ['', '', '', '', ''];

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

function documentIsReady() {
    // Load configurations
    serverConfig = guiLoadServerConfig();
    phoneConfig = guiLoadPhoneConfig();
    userPref = guiLoadUserPref();
    devices.load(guiLoadSelectedDevices());

    // Set logger
    if (!serverConfig.logger) {
        setConsoleLoggers();
        startPhone();
    } else {
        setWebsocketLoggers(serverConfig.logger)
            .catch((e) => {
                setConsoleLoggers();
                ac_log('Cannot connect to logger server', e);
            })
            .finally(() => {
                startPhone();
            })
    }
}

function startPhone() {
    ac_log(`------ Date: ${new Date().toDateString()} -------`);
    ac_log(`AudioCodes WebRTC SDK. Multi call phone prototype`);
    ac_log(`SDK: ${phone.version()}`);
    ac_log(`SIP: ${JsSIP.C.USER_AGENT}`);
    ac_log(`Browser: ${phone.getBrowserName()}  Internal name: ${phone.getBrowser()}|${phone.getOS()}`);

    if (navigator.connection) {
        let str = '';
        try {
            let nc = navigator.connection;
            if (nc.type) str += ' type=' + nc.type;
            if (nc.effectiveType) str += ' etype=' + nc.effectiveType;
            if (nc.downlink) str += ' downlink=' + nc.downlink + ' Mbps';
            if (nc.downlinkMax) str += ' downlinkMax=' + nc.downlinkMax + ' Mbps';
            if (nc.rtt) str += ' rtt=' + nc.rtt + ' ms';
        } catch (e) {
            str += ' [error]';
        }
        ac_log('Network connection:' + str);
    }

    devices.setDevices(true,
        [{ name: 'microphone', kind: 'audioinput' },
        { name: 'camera', kind: 'videoinput' },
        { name: 'speaker', kind: 'audiooutput' },
        { name: 'ringer', kind: 'audiooutput' }]);

    devices.enumerate(false)
        .then(() => {
            let str = 'devices: selected';
            for (let name of devices.names) {
                if (devices.getNumber(name) > 1) {
                    str += `\n${name}: "${devices.getSelected(name).label}"`;
                }
            }
            ac_log(str);

            /*
            // print devices list
            for (let name of devices.names) {
                let device = devices.getDevice(name);
                let str = `--- ${name} selected=${device.index}\n`;
                for (let ix = 0; ix < device.list.length; ix++)
                    str += `${ix}: ${JSON.stringify(device.list[ix])}\n`;
                ac_log(str);
            }
            */

            for (let name of devices.names)
                guiFillDeviceList(name);

            setDeviceIds();

            startPhone2()
        });
}

function startPhone2() {
    audioPlayer.init({ logger: ac_log });

    guiInit();

    // Set selected ring instead default.
    if (userPref.selectedRing) {
        ac_log('Set preferred ring for incoming call: ' + userPref.selectedRing);
        SoundConfig.downloadSounds[0] = { ring: userPref.selectedRing };
    }

    // Prepare audio data
    audioPlayer.downloadSounds('sounds/', SoundConfig.downloadSounds)
        .then(() => {
            let tones = Object.assign({}, SoundConfig.generateTones, audioPlayer.dtmfTones);
            return audioPlayer.generateTonesSuite(tones);
        })
        .then(() => {
            ac_log('audioPlayer: sounds are ready:', audioPlayer.sounds);
        });

    callLogDb.open()
        .then(() => {
            ac_log('call-log db: open');
            return callLogDb.load();
        })
        .then(() => {
            ac_log('call-log db: loaded', callLogDb.list.length);
            for (let entry of callLogDb.list) {
                guiAddLog(entry);
            }
        })
        .catch(e => {
            ac_log('call-log db open/load error', e);
        });

    messageDb.open()
        .then(() => {
            ac_log('message db: open');
            return messageDb.load();
        })
        .then(() => {
            ac_log('message db: loaded', messageDb.list.length);
            for (let entry of messageDb.list) {
                guiAddMessage(entry);
            }
        })
        .catch(e => {
            ac_log('message db open/load error', e);
        });
    // Check WebRTC support
    // Check available devices (microphone must exists, camera is optional)
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

function createDateTimestamp(date = null) {
    function lz(n) { return n < 10 ? '0' + n : '' + n; }
    if (date === null)
        date = new Date();
    let yr = date.getFullYear().toString();
    let mh = date.getMonth() + 1;
    let d = date.getDate();
    let h = date.getHours();
    let m = date.getMinutes();
    return yr + '-' + lz(mh) + '-' + lz(d) + ' ' + lz(h) + ':' + lz(m);
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

function setWebsocketLoggers(url) {
    return new Promise((resolve, reject) => {
        let ws = new WebSocket('wss://' + url, 'wslog');
        ws.onopen = () => { resolve(ws); }
        ws.onerror = (e) => { reject(e); }
    })
        .then(ws => {
            const log = function () {
                let args = [].slice.call(arguments);
                ws.send([createTimestamp() + args[0]].concat(args.slice(1)).join() + '\n');
            };
            ac_log(`Sending log to "${url}"`);
            ac_log = log;
            phone.setAcLogger(log);
            phone.setJsSipLogger(log);
        })
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

    // If an optional TURN server is used, set a username and password for it.
    //
    // Note: Please don't set TURN password in config.js, because everyone can read it !
    // Note: TURN server user name and password can be obtained via REST API request, or entered by user.
    // To keep this example simple, we'll assume that the TURN server is configured
    // to use the same user names and passwords as the SIP server.
    for (let server of serverConfig.iceServers) {
        if (typeof server === 'string')
            continue;
        let url = Array.isArray(server.urls) ? server.urls[0] : server.urls;
        if (url.startsWith('turn:')) {
            // Set TURN user name and password. Don't override if already set.
            if (server.username === undefined)
                server.username = (account.authUser !== '') ? account.authUser : account.user;
            if (server.credential === undefined)
                server.credential = account.password;
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

    // Set some strings to testing. Please don't use them in production.
    phone.setUserAgent(`AudioCodes WebRTC SDK. Multi call phone prototype ${phone.version()} ${phone.getBrowserName()}`);
    phone.setRegisterExtraHeaders(['X-SBC: AudioCodes Mediant']);

    devices.addDeviceChangeListener((e) => {
        ac_log('Devices: device change event', e);
    });

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
                    if (getFirstActiveLine() === -1) // If no active calls
                        guiShowPanel('setting_panel');
                    break;
                case "login failed":
                    ac_log('phone>>> loginStateChanged: login failed');
                    guiError('SBC server: login failed');
                    guiShowPanel('setting_panel');
                    break;
                case "login":
                    ac_log('phone>>> loginStateChanged: login');
                    serverLocalAddress = response.getHeader('X-AudioCodes-SBC-FQDN');

                    let url = serverLocalAddress ? serverLocalAddress : phone.getServerAddress();
                    if (url.startsWith('wss://'))
                        url = url.substring(6);
                    guiInfo(`"${phone.getAccount().user}" is logged in "${url}"`);
                    let restoreData = sessionStorage.getItem('phoneRestoreMultiCall');
                    if (restoreData !== null) {
                        sessionStorage.removeItem('phoneRestoreMultiCall');
                    }
                    if (lines[selected] !== null && lines[selected].isEstablished()) {
                        ac_log('Re-login done, active call exists (SBC might have switched over to backup)');
                    } else if (restoreData !== null && phoneConfig.restoreCall && guiRestoreMultiCall(restoreData)) {
                        ac_log('Calls are restored after page reloading');
                    } else if (recallAfterSwitchingSbc !== null) {
                        ac_log('phone: switched SBC: re-call...');
                        guiMakeCallTo(recallAfterSwitchingSbc.callTo, recallAfterSwitchingSbc.videoOptions);
                        recallAfterSwitchingSbc = null;
                    }
                    guiShowSelectedLine();
                    break;
                case "logout":
                    ac_log('phone>>> loginStateChanged: logout');
                    guiInfo('SBC server: logout');
                    if (recallAfterSwitchingSbc !== null) {
                        ac_log('phone: switching SBC...');
                        break;
                    }
                    if (getFirstActiveLine() === -1) { // if no active call
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
                // Check screen sharing optional SIP header
                call.data['screen-sharing-header'] = request.getHeader('x-screen-sharing');

                //-------------- X-Genesys-CallUUID ---------------
                let genesysId = request.getHeader('x-genesys-calluuid');
                if (genesysId) {
                    ac_log('Genesys UUID=' + genesysId);
                    if (genesysId !== call.data['_genesys_uuid']) {
                        call.data['_genesys_uuid'] = genesysId;
                        if (call.isLocalHold()) {
                            ac_log('Incoming re-INVITE: genesys ID changed & local hold.');
                            call.data['_genesys_uuid_changed'] = true;
                        }
                    }
                }
                //-------------- X-Genesys-CallUUID ---------------
                return;
            }
            //-------------- X-Genesys-CallUUID ---------------                
            if (call.data['_genesys_uuid_changed']) {
                call.data['_genesys_uuid_changed'] = false;
                ac_log('Incoming re-INVITE/Send OK genesys ID changed & local hold.=> unhold !');
                call.hold(false);
            }
            //------------- End of X-Genesys-CallUUID ------------

            ac_log(`phone>>> incoming reinvite line=${getLineName(call)} video current: ` + call.getVideoState() + ' enabled: ' + call.getEnabledVideoState());

            // Other side may start or stop send video.
            let remoteVideo = document.getElementById(`remote_video_${call.data['_line_index']}`);
            setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());
            if (isSelectedLine(call)) {
                guiShowVideoControls(call);

                // Screen sharing. 
                // Here can be some GUI manipulations. (e.g. bigger video size)      
                let screenSharingHeader = call.data['screen-sharing-header'];
                if (call.hasReceiveVideo() && screenSharingHeader === 'on') {
                    ac_log('phone: remote screen shown: on');
                    guiInfo('remote screen shown: On');
                } else if (screenSharingHeader === 'off') {
                    ac_log('remote screen shown: off');
                    guiInfo('remote screen shown: Off');
                }
            }


            // Update video conference if used.
            conferenceAddVideo(call);
        },

        /*
         * Optional callback. Call transferor notification
         *
         * state=0  in progress (REFER accepted or NOTIFY 1xx)
         * state=-1 failed      (REFER rejected or NOTIFY with >= 300)
         * state=1  success     (NOTIFY 2xx)
         */
        transferorNotification: function (call, state) {
            switch (state) {
                case 0:
                    ac_log(`phone>>> transferor: line=${getLineName(call)} transfer in progress...`);
                    guiWarning('call transfer in progress...');
                    break;

                case -1:
                    ac_log(`phone>>> transferor: line=${getLineName(call)} transfer failed`);
                    guiHold(call, false); // un-hold active call
                    if (isSelectedLine(call)) {
                        document.getElementById('transfer_btn').disabled = false;
                        guiError('call transfer failed');
                    }
                    break;

                case 1:
                    ac_log(`phone>>> transferor: line=${getLineName(call)} transfer is successful`);
                    if (isSelectedLine(call)) {
                        guiInfo('call transfer is successful');
                    }
                    call.data['terminated_transferred'] = true;
                    call.terminate(); // terminate call initiated transfer
                    break;
            }
        },

        /*
         * Optional callback for call transferee
         * Accept or reject incoming REFER.
         */
        transfereeRefer: function (call, refer) {
            if (getFirstFreeLine() === -1) {
                ac_log(`phone>>> line=${getLineName(call)} transferee incoming REFER: rejected (no free line)`);
                return false;
            }

            ac_log(`phone>>> line=${getLineName(call)} transferee incoming REFER: accepted`);
            return true;
        },

        /*
         *  Optional callback for call transferee
         *  Created new outgoing call according the incoming REFER.
         *
         *  Note: Transferee uses 2 calls at the same time:
         *       call that receive REFER, and created new outgoing call
         */
        transfereeCreatedCall: function (call) {
            let lineIndex = getFirstFreeLine();
            if (lineIndex === -1) {
                ac_log('phone:>>>transfereeCreatedCall: error - no free line');
                return;
            }
            lines[lineIndex] = call;
            call.data['_line_index'] = lineIndex;

            ac_log(`phone>>> transferee created call. line=${lineIndex + 1} call to: ${call.data['_user']}`);

            let callReceivedREFER = call.data['_created_by_refer'];
            if (isSelectedLine(callReceivedREFER)) {
                guiInfo('transferring call to "' + call.data['_user'] + '" ...');
            }

            // create new call log record
            let time = call.data['_create_time'].getTime();
            let logRecord = {
                id: callLogDb.createId(time),
                time: time,
                duration: -1,
                incoming: false,
                user: call.data['_user'],
                display_name: call.data['_display_name']
            };

            call.data['log_record'] = logRecord;
            guiAddLog(logRecord, 'call_log_ul');
            callLogDb.add(logRecord)
                .then(() => {
                    ac_log('call-log db: added');
                })
                .catch((e) => {
                    ac_log('call-log db: add error', e);
                });
        },

        outgoingCallProgress: function (call, response) {
            let lineIndex = getLineIndex(call);
            ac_log(`phone>>> outgoing call progress line=${lineIndex + 1}`);
            call['outgoing_call_progress'] = true;
            if (!isSelectedLine(call))
                return;
            document.getElementById('outgoing_call_progress').innerText = 'dzzz dzzz';

            if (response.body) {
                call.data['outgoingCallProgress_played'] = true; // If the 18x respone includes SDP, the server plays sound
            } else if (!call.data['outgoingCallProgress_played']) {
                call.data['outgoingCallProgress_played'] = true; // To prevent duplicate playing.
                audioPlayer.play(SoundConfig.play.outgoingCallProgress);
            }
        },

        callTerminated: function (call, message, cause, redirectTo) {
            let lineIndex = getLineIndex(call);
            if (call.data['terminated_transferred'])
                cause = 'call transfer is successful';
            else if (call.data['terminated_replaced'])
                cause = 'call is replaced';
            ac_log(`phone>>> call terminated callback line=${lineIndex + 1}, cause=${cause}`);

            let logRecord = call.data['log_record'];

            // update call log duration
            if (call.wasAccepted()) { // sent or received SIP 2xx response
                logRecord.duration = call.duration();
                guiUpdateLog(logRecord);
                callLogDb.update(logRecord)
                    .then(() => {
                        ac_log('call-log db: updated');
                    })
                    .catch((e) => {
                        ac_log('call-log db: update error', e);
                    });
            }
            // print call log record to console
            let str = new Date(logRecord.time).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            str += logRecord.incoming ? ' in ' : ' out '
            str += logRecord.user;
            if (logRecord.display_name)
                str += ' "' + logRecord.display_name + '"';
            str += logRecord.duration >= 0 ? ' ' + logRecord.duration + ' sec' : ' failed';
            ac_log('Call log: ', str);

            lines[lineIndex] = null; // free line
            guiLineButtonClass(lineIndex, false, 'active_line', 'hold_line');

            // always clear remote video element
            let remoteVideo = document.getElementById(`remote_video_${lineIndex}`);
            remoteVideo.srcObject = null;
            setVideoElementVisibility(remoteVideo, false);

            if (call.data['audioMixer'])
                conferenceRemove(call);

            if (call.data['restoreCall'])
                callRestored(call);

            if (conference === 'video' && lineIndex === videoMixer.data.localVideoIndex) {
                conferenceSetLocalVideo();
            }

            if (!isSelectedLine(call)) {
                ac_log('terminated call [no selected line]');
            } else {
                // update GUI when terminated selected line.
                // clear local video
                ac_log('terminated call [selected line]');
                guiWarning('Call terminated: ' + cause);
                guiShowLocalVideo(false);

                guiShowPanel('dialer_panel');
                guiNotificationClose();

                audioPlayer.stop();
                if (cause !== 'Redirected' && recallAfterSwitchingSbc === null) {
                    if (call.isOutgoing() && !call.wasAccepted()) {
                        audioPlayer.play(SoundConfig.play.busy);
                    } else {
                        audioPlayer.play(SoundConfig.play.disconnect);
                    }
                }
            }

            if (cause === 'Redirected') {
                ac_log('Redirect call to ' + redirectTo);
                guiMakeCallTo(redirectTo, call.hasEnabledSendVideo() ? phone.VIDEO : phone.AUDIO);
                return;
            }

            // 5xx response to initial outgoing INVITE
            if (call.isOutgoing() && !call.wasAccepted()) {
                let statusCode = (message && message.status_code) ? message.status_code : 0;
                if (statusCode >= 500 && statusCode < 600 && phoneConfig.switchSbcAtInvite5xx) {
                    if (phone.getNumberOfSBC() === 1) {
                        ac_log('phone: Cannot switch to other SBC, because set single SBC');
                    } else if (lines.filter(l => l !== null).length > 0) {
                        ac_log('phone: Cannot switch to other SBC, because exists open calls on the current SBC');
                    } else {
                        ac_log('phone: Outgoing call response 5xx. Switching SBC and re-call');
                        recallAfterSwitchingSbc = {
                            callTo: call.data['_user'],
                            videoOptions: call.hasEnabledSendVideo() ? phone.VIDEO : phone.AUDIO
                        };
                        phone.switchSBC();
                    }
                }
            }
        },

        callConfirmed: function (call, message, cause) {
            let lineIndex = getLineIndex(call);
            ac_log(`phone>>> callConfirmed line=${lineIndex + 1}`);
            // update call log duration
            let logRecord = call.data['log_record'];
            logRecord.duration = 0; // zero duration means call is established
            guiUpdateLog(logRecord);
            callLogDb.update(logRecord)
                .then(() => {
                    ac_log('call-log db: updated');
                })
                .catch((e) => {
                    ac_log('call-log db: update error', e);
                });

            //-------------- X-Genesys-CallUUID ---------------
            let genesysId = message !== null ? message.getHeader('x-genesys-calluuid') : undefined;
            if (genesysId) {
                ac_log('Genesys UUID=' + genesysId);
                call.data['_genesys_uuid'] = genesysId;
            }
            //-------------- End of X-Genesys-CallUUID --------

            // for restored call  restore hold or mute state if need.
            let restore = call.data['restoreCall'];
            if (restore) {
                if (restore.hold !== '') {
                    if (restore.hold.includes('remote')) {
                        ac_log('Restore remote hold');
                        guiWarning('Remote HOLD');
                        call.setRemoteHoldState();
                    }
                    if (restore.hold.includes('local')) {
                        ac_log('Restore local hold');
                        guiHold(call, true);
                    }
                } else if (restore.mute !== '') {
                    if (restore.mute.includes('audio')) {
                        ac_log('Restore mute audio');
                        guiMuteAudio(lineIndex);
                    }
                    if (restore.mute.includes('video')) {
                        ac_log('Restore mute video');
                        guiMuteVideo(lineIndex);
                    }
                }
                callRestored(call);
            }

            guiLineButtonClass(lineIndex, true, 'active_line');

            if (call.data['_created_by_refer']) {
                guiShowSelectedLine(getLineIndex(call));
                guiInfo('call transferred to ' + call.data['_user'])
            }

            if (call.data['open_replaced']) {
                guiInfo('call is replaced');
            }

            if (!isSelectedLine(call)) {
                ac_log('phone: call confirmed [no selected line]')
                return;
            }
            guiShowSelectedLine();

            let remoteVideo = document.getElementById(`remote_video_${lineIndex}`);
            setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());

            guiShowPanel('call_established_panel');
        },

        callShowStreams: function (call, localStream, remoteStream) {
            let lineIndex = getLineIndex(call);
            ac_log(`phone>>> callShowStreams line=${lineIndex + 1}`);

            /*
            // additional debugging for remote stream and track. To check PSTN hold/unhold.
            if (remoteStream.getAudioTracks().length > 0) {
                let audioTrack = remoteStream.getAudioTracks()[0];
                ac_log(`[DEBUG] remoteStream.active=${remoteStream.active} audioTrack.readyState="${audioTrack.readyState}"`, audioTrack);
            }
            */

            audioPlayer.stop();

            setRemoteVideoSinkId(lineIndex)
                .catch((e) => {
                    ac_log(`Warning: remote video HTMLVideoElement.setSinkId(): "${e.message}" [Used default browser speaker]`, e);
                })
                .finally(() => {
                    let remoteVideo = document.getElementById(`remote_video_${lineIndex}`);
                    remoteVideo.srcObject = remoteStream;
                });

            if (conference !== 'off' && !call.data['audioMixer'])
                conferenceAdd(call);
        },

        incomingCall: function (call, invite, replacedCall, hasSDP) {
            ac_log('phone>>> incomingCall', call, invite, replacedCall, hasSDP);
            call.data['incoming_invite_hasSDP'] = hasSDP;

            // create new call log record
            let time = call.data['_create_time'].getTime();
            let logRecord = {
                id: callLogDb.createId(time),
                time: time,
                duration: -1,
                incoming: true,
                user: call.data['_user'],
                display_name: call.data['_display_name']
            };
            call.data['log_record'] = logRecord;
            guiAddLog(logRecord);
            callLogDb.add(logRecord)
                .then(() => {
                    ac_log('call-log db: added');
                })
                .catch((e) => {
                    ac_log('call-log db: add error', e);
                });

            // If incoming call replaces existed call (INVITE with replaces header)
            if (replacedCall !== null) {
                let lineIndex = getLineIndex(replacedCall);
                ac_log(`phone: incomingCall with Replaces in line=${lineIndex + 1}`);

                // close the replaced call.
                replacedCall.data['terminated_replaced'] = true;
                replacedCall.terminate();

                // auto answer to replaces call.
                lines[lineIndex] = call; // use the same line as replaced call.
                call.data['_line_index'] = lineIndex;
                call.data['open_replaced'] = true;
                let videoOption = replacedCall.hasVideo() ? phone.VIDEO : (replacedCall.hasReceiveVideo() ? phone.RECVONLY_VIDEO : phone.AUDIO);
                call.answer(videoOption);
                return;
            }

            // check if exists other active call
            let lineIndex = getFirstFreeLine();
            if (lineIndex === -1) {
                ac_log('Reject incoming call, because all lines are busy');
                call.reject();
                return;
            }
            ac_log(`phone: incomingCall allocated line=${lineIndex + 1}`);
            lines[lineIndex] = call;
            call.data['_line_index'] = lineIndex;
            guiLineButtonClass(lineIndex, true, 'active_line');
            guiShowSelectedLine(lineIndex);
            guiInfo('');

            // Can be used custom header in incoming INVITE
            // ------ begin of Alert-Info auto answer example ----
            // JsSIP parse Alert-Info as raw string. We use custom parser defined in utils.js
            let alertInfo = new AlertInfo(invite);
            ac_log(`alert-info header ${alertInfo.exists() ? ' exists' : 'does not exist'}`);
            if (alertInfo.hasAutoAnswer()) {
                ac_log(`alert-info delay=${alertInfo.getDelay()}`); // currently ignored
                ac_log('*** Used Alert-Info Auto answer ***');
                audioPlayer.play(SoundConfig.play.autoAnswer);

                let videoOption;
                if (call.data['incoming_invite_hasSDP']) {
                    videoOption = call.hasVideo() ? (hasCamera ? phone.VIDEO : phone.RECVONLY_VIDEO) : phone.AUDIO;
                } else {
                    videoOption = phoneConfig.audioAutoAnswerNoSdp ? phone.AUDIO : phone.VIDEO;
                }
                guiAnswerCall(videoOption);
                return;
            }
            //------ end of Alert-Info auto answer example ----

            //-------------- X-Genesys-CallUUID ---------------
            let genesysId = invite.getHeader('x-genesys-calluuid');
            if (genesysId) {
                ac_log('Genesys UUID=' + genesysId);
                call.data['_genesys_uuid'] = genesysId;
            }
            //------------ End of X-Genesys-CallUUID ----------

            audioPlayer.play(SoundConfig.play.incomingCall);

            // If set ringer deviceId, playing parallel in 'ringer' device.
            audioPlayer.playRing(SoundConfig.play.incomingCallRinger);

            let user = call.data['_user'];
            let dn = call.data['_display_name'];
            let caller = dn ? `"${dn}" ${user}` : user;
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
            let remoteHold = call.isRemoteHold();
            let localHold = call.isLocalHold();
            ac_log(`phone>>> callHoldStateChanged line=${getLineName(call)} Event: ${isHold ? 'hold' : 'unhold'} ${isRemote ? 'remote' : 'local'} State:isLocalHold=${localHold} isRemoteHold=${remoteHold})`);
            // update call line button
            guiLineButtonClass(getLineIndex(call), localHold || remoteHold, 'hold_line');

            // update GUI for selected line
            if (!isSelectedLine(call))
                return;
            // status line
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
        },

        /*
         * Optional callback. Incoming SIP NOTIFY (in or out of dialog)
         * Can be used for any events.
         * Returns true - process the NOTIFY, false - use default JsSIP processing
         *
         * Here for example supported in dialog NOTIFY events: "talk" and "hold".
         */
        incomingNotify: function (call, eventName, from, contentType, body, request) {
            ac_log(`phone>>> incoming NOTIFY "${eventName}"`, call, from, contentType, body);
            if (call === null) { // out of dialog NOTIFY
                if (eventName === 'vq') { // voice quality event
                    let vq = getXVoiceQuality(request);
                    if (vq) {
                        ac_log(`NOTIFY: "X-VoiceQuality" header: score="${vq.score}", color="${vq.color}"`);
                    } else {
                        ac_log('NOTIFY: missing "X-VoiceQuality" header');
                    }
                    return true;
                } else {
                    return false;
                }

            }

            if (eventName !== 'talk' && eventName !== 'hold' && eventName !== 'dtmf')
                return false; // skip unsupported events

            if (eventName === 'talk') {
                if (!call.isEstablished() && !call.isOutgoing()) {
                    ac_log('incoming NOTIFY "talk": answer call');
                    audioPlayer.play(SoundConfig.play.autoAnswer);
                    guiShowSelectedLine(getLineIndex(call));
                    let videoOption;
                    if (call.data['incoming_invite_hasSDP']) {
                        videoOption = call.hasVideo() ? (hasCamera ? phone.VIDEO : phone.RECVONLY_VIDEO) : phone.AUDIO;
                    } else {
                        videoOption = phoneConfig.audioAutoAnswerNoSdp ? phone.AUDIO : phone.VIDEO;
                    }
                    guiAnswerCall(videoOption);
                } else if (call.isEstablished() && call.isLocalHold()) {
                    ac_log('incoming NOTIFY "talk": un-hold call');
                    guiHold(call, false);
                } else {
                    ac_log('incoming NOTIFY "talk": ignored');
                }
            } else if (eventName === 'hold') {
                if (call.isEstablished() && !call.isLocalHold()) {
                    ac_log('incoming NOTIFY "hold": set call on hold');
                    guiHold(call, true);
                } else {
                    ac_log('incoming NOTIFY "hold": ignored');
                }
            } else if (eventName === 'dtmf') {
                ac_log('incoming NOTIFY "dtmf" body="' + body + '"');
                body = body.trim().toLowerCase();
                if (body.startsWith('signal=')) {
                    let str = body.substring(7);
                    for (let key of str) {
                        call.sendDTMF(key);
                    }
                } else {
                    ac_log('Error: NOTIFY dtmf body - wrong');
                }
            }
            return true;
        },

        /*
         * Optional callback. Incoming SIP MESSAGE (out of dialog)
         */
        incomingMessage: function (call, from, contentType, body, request) {
            ac_log('phone>>> incoming MESSAGE', from, contentType, body);
            let time = new Date();
            let message = {
                id: callLogDb.createId(time),
                incoming: true,
                time: time,
                user: from.user,
                display_name: from.displayName,
                host: from.host,
                contentType: contentType,
                body: body
            };

            if (guiIsHidden('message_panel')) { // If message_panel is not used
                // visual message notification
                if (!userPref.newMessages)
                    userPref.newMessages = 0;
                userPref.newMessages++;
                guiStoreUserPref(userPref);
                let button = document.getElementById('message_btn');
                button.innerText = `Messages (${userPref.newMessages} new)`;
                button.classList.add('new_message');
            }
            audioPlayer.play(SoundConfig.play.incomingMessage);

            guiAddMessage(message);

            messageDb.add(message)
                .then(() => {
                    ac_log('message db: added');
                })
                .catch((e) => {
                    ac_log('message db: add error', e);
                });
        },

        /*
         * Optional callback. Incoming SIP INFO (in dialog)
         */
        incomingInfo: function (call, from, contentType, body, request) {
            ac_log('phone>>> incoming INFO', call, from, contentType, body);
        },

        /* 
         * Optional callback. Screen sharing is ended.
         * Called when:
         * 1. called method call.stopScreenSharing
         * 2. stopped by browser built-in screen-sharing pop up window.
         * 3. call with screen-sharing is terminated. Will be called before callTerminated()
         */
        callScreenSharingEnded: function (call, stream) {
            ac_log(`phone>>> callScreenSharingEnded line=${getLineName(call)}`);
            // If the line is selected - update gui
            if (isSelectedLine(call)) {
                let screenSharingBtn = document.getElementById('screen_sharing_btn');
                screenSharingBtn.disabled = false;
                let sendVideoBtn = document.getElementById('send_video_btn');
                screenSharingBtn.value = 'Start screen sharing';
                sendVideoBtn.value = call.hasSendVideo() ? 'Stop sending video' : 'Start sending video';
                sendVideoBtn.disabled = !hasCamera;
            }
            // If no line used screen sharing stream - close it.
            if (stream === screenSharing.stream) {
                screenSharing.counter--;
            }
            if (screenSharing.counter <= 0) {
                phone.closeScreenSharing(screenSharing.stream);
                screenSharing.stream = null;
                screenSharing.counter = 0;
            }
        }
    });

    // Request permission to use desktop notification (for incoming call)
    if (window.Notification && Notification.permission === 'default') {
        if (phone.browser === 'firefox') {
            // Special for Firefox:
            // If  Notification.requestPermission() is not called from the user driven event,
            // the notification permission pop-up window will not be shown, and instead a special icon will be added to the address bar.
            // The pop-up window will be shown when you click this icon.
            // Another possibility: to show a special button and call the method Notification.requestPermission() when this button 
            // is pressed. In the case notification permission pop-up window will be shown.
            document.getElementById('notification_permission_btn').onclick = guiRequestNotificationPermission;
            guiShow('notification_permission_btn');
        } else {
            guiRequestNotificationPermission();
        }
    }
    guiInfo('Logging...');

    // API modes and workarounds
    phone.setModes(phoneConfig.modes);

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
    if (phone.getBrowser() !== 'safari') {
        videoElement.style.display = isVisible ? 'inline-block' : 'none';
    } else { // Mac Safari stop playing audio if set style.display='none'
        videoElement.style.display = 'inline-block';
        if (isVisible) {
            let size = videoElement.dataset.size;
            guiSetVideoSize(videoElement, size);
        } else {
            ac_log('Safari workaround: to hide HTMLVideoElement used style.width=style.height=0');
            videoElement.style.width = videoElement.style.height = 0;
        }
    }
}

/*
 *  Print call information for debugging. Using SDK.
 */
async function printStreamsParameters() {
    let call = lines[selected];
    if (call === null) {
        ac_log('call is null');
        return;
    }
    // Current video state set according answer SDP (hold answer will be ignored)
    ac_log('Video State current: ' + call.getVideoState() + ' enabled: ' + call.getEnabledVideoState());

    // WebRTC tracks
    let li = await phone.getWR().stream.getInfo(call.getRTCLocalStream());
    let ri = await phone.getWR().stream.getInfo(call.getRTCRemoteStream());
    ac_log(`Enabled Tracks: local ${li} remote ${ri}`)

    // WebRTC transceivers
    let ti = await phone.getWR().connection.getTransceiversInfo(call.getRTCPeerConnection());
    ac_log(`Transceivers: ${ti}`);
}


/*
 Print call statistics for debugging. Using SDK
 */
function printCallStats() {
    let call = lines[selected];
    if (call === null) {
        ac_log('call is null');
        return;
    }
    let conn = call.getRTCPeerConnection();
    phone.getWR().connection.getStats(conn, ['outbound-rtp', 'inbound-rtp'])
        .then(str => {
            ac_log('call stats: ' + str);
        })
        .catch(err => {
            ac_log('stat error', err);
        });
}

// Note: don't work immediatelly after call established,
// because getStats missed 'inbound-rtp', 'outbound-rtp', 'codec'
// Repeat after a few seconds
async function printUsedCodecs() {
    let call = lines[selected];
    if (call === null) {
        ac_log('call is null');
        return;
    }
    let conn = call.getRTCPeerConnection();

    let stats = await conn.getStats();
    let reports = {};
    stats.forEach(entry => {
        let type = entry.type;
        if (['inbound-rtp', 'outbound-rtp', 'codec'].includes(type)) {
            if (!reports[type])
                reports[type] = [];
            reports[type].push(Object.assign({}, entry));
        }
    });

    try {
        let audioIn = getCodec(reports, 'inbound-rtp', 'audio');
        let audioOut = getCodec(reports, 'outbound-rtp', 'audio');
        let videoIn = getCodec(reports, 'inbound-rtp', 'video');
        let videoOut = getCodec(reports, 'outbound-rtp', 'video');
        ac_log(`audio in: ${audioIn ? audioIn : '-'}`);
        ac_log(`audio out: ${audioOut ? audioOut : '-'}`);
        if (videoIn || videoOut) {
            ac_log(`video in: ${videoIn ? videoIn : '-'}`);
            ac_log(`video out: ${videoOut ? videoOut : '-'}`);
        }
    } catch (e) {
        ac_log('Cannot detect codec. Repeat after a few seconds', e);
    }
}

function getCodec(reports, report, mediaType) {
    let rtps = reports[report];
    if (!rtps)
        throw `Missed "${report}" stats`;
    let foundRtp = null;
    for (let rtp of rtps) {
        if (rtp.mediaType === mediaType) {
            foundRtp = rtp;
            break;
        }
    }
    if (!foundRtp)
        return undefined;
    let searchId = foundRtp.codecId;
    if (!searchId)
        return undefined;
    let codecs = reports['codec'];
    if (!codecs)
        throw 'Missed "codec" stats';
    for (let codec of codecs) {
        if (codec.id === searchId) {
            let name = codec.mimeType;
            name = name.substring(6).toUpperCase();
            if (codec.sdpFmtpLine)
                name += '#' + codec.sdpFmtpLine;
            return name;
        }
    }
    throw `Not found "codec" id=="${searchId}"`;
}

function onBeforeUnload() {
    guiNotificationClose(); // If was notification on desktop, remove it.

    if (phone === null || !phone.isInitialized())
        return;

    let mData = {
        time: new Date().getTime(),
        selected: selected,
        lines: [],
        conference: conference,
        savedCalls: 0
    };
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        let call = lines[lineIndex];
        let data = null;
        if (call !== null) {
            // If used restoreCall phone mode, save to local storage data
            // to restore the call after page reloading
            if (call.isEstablished()) {
                data = {
                    callTo: call.data['_user'],
                    video: call.getVideoState(), // sendrecv, sendonly, recvonly, inactive
                    replaces: call.getReplacesHeader(),
                    hold: `${call.isLocalHold() ? 'local' : ''}${call.isRemoteHold() ? 'remote' : ''}`,
                    mute: `${call.isAudioMuted() ? 'audio' : ''}${call.isVideoMuted() ? 'video' : ''}`
                }
                if (call.isScreenSharing()) {
                    data.screenSharing = true;
                    data.video = call.doesScreenSharingReplaceCamera() ? 'sendrecv' : 'inactive';
                }
                mData.savedCalls++;
            } else {
                // send SIP BYE
                call.terminate();
            }
        }
        mData.lines.push(data);
    }
    if (mData.savedCalls > 0 && phoneConfig.restoreCall)
        sessionStorage.setItem('phoneRestoreMultiCall', JSON.stringify(mData));

    // Save connected server address to restore after page reloading
    let serverAddress = phone.getServerAddress();
    if (serverAddress !== null || serverLocalAddress !== undefined) {
        let data = {
            time: new Date().getTime(),
            address: serverLocalAddress ? 'wss:/' + serverLocalAddress.trim() : serverAddress,
            isLocal: serverLocalAddress !== undefined
        }
        sessionStorage.setItem('phoneRestoreServer', JSON.stringify(data));
    }

    // Send SIP unREGISTER
    phone.logout();
}

/*
 *  Simple GUI
 */
function guiInit() {
    window.addEventListener('beforeunload', onBeforeUnload);

    document.getElementById('send_video_btn').onclick = guiToggleSendVideo;

    if (phone.isScreenSharingSupported()) {
        document.getElementById('screen_sharing_btn').onclick = function () { guiToggleScreenSharing(); }
    } else {
        ac_log('Warning: screen sharing is not supported');
        guiHide('screen_sharing_btn');
    }
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

            // if user name was changed, clear call log and then reload page
            let sameUserAsWas = userAccount && 'user' in userAccount && userAccount.user === user;
            if (sameUserAsWas) {
                ac_log('user name is not changed');
                location.reload();
            } else {
                ac_log('user name is changed, clear the user databases');
                callLogDb.clear()
                    .then(() => {
                        return messageDb.clear();
                    })
                    .finally(() => {
                        location.reload();
                    })
            }
        } catch (e) {
            ac_log('Store settings error', e);
            guiError('Please fix settings');
        }
    }

    document.getElementById('info_btn').onclick = function () {
        printStreamsParameters();
    }

    document.getElementById('stats_btn').onclick = function () {
        printCallStats();
    }

    document.getElementById('codecs_btn').onclick = function () {
        printUsedCodecs();
    }

    document.getElementById('conference_select').onchange = guiConferenceSwitch;

    document.getElementById('transfer_btn').onclick = guiTransfer;
    document.getElementById('do_transfer_btn').onclick = guiDoTransfer;

    document.getElementById('settings_btn').onclick = function () {
        guiShowPanel('setting_panel');
    }

    document.getElementById('devices_btn').onclick = function () {
        devices.enumerate(true)
            .catch((e) => {
                ac_log('getUserMedia() exception', e);
            })
            .finally(() => {
                for (let name of devices.names)
                    guiFillDeviceList(name);

                guiShowPanel('devices_panel');
            });
    }

    document.getElementById('devices_exact_ckb').checked = userPref.devicesExact;

    document.getElementById('devices_done_btn').onclick = function () {
        // set selected in GUI devices.
        for (let name of devices.names) {
            let selectElement = document.querySelector(`#devices [name=${name}]`);
            let index = selectElement.selectedIndex;
            if (index !== -1) { // -1 indicates that no element is selected
                let n = selectElement.options[index].value;
                devices.setSelectedIndex(name, parseInt(n));
            }
        }

        let str = 'Devices done: selected';
        for (let name of devices.names) {
            if (devices.getNumber(name) > 1) {
                str += `\n${name}: "${devices.getSelected(name).label}"`;
            }
        }
        ac_log(str);

        /*
        // print device list
        for (let name of devices.names) {
            let device = devices.getDevice(name);
            let str = `--- ${name} selected=${device.index}\n`;
            for (let ix = 0; ix < device.list.length; ix++)
                str += `${ix}: ${JSON.stringify(device.list[ix])}\n`;
            ac_log(str);
        }
        */

        userPref.devicesExact = document.getElementById('devices_exact_ckb').checked;
        guiStoreUserPref(userPref);
        guiStoreSelectedDevices(devices.store());

        setDeviceIds();

        guiShowPanel('dialer_panel');
    }

    document.getElementById('call_log_btn').onclick = function () {
        guiEnableSound();
        guiShowPanel('call_log_panel');
    }

    document.getElementById('redial_last_call_btn').onclick = function () {
        guiRedialLastCall();
    }

    document.getElementById('call_log_return_btn').onclick = function () {
        guiShowPanel('dialer_panel');
    }

    document.getElementById('call_log_clear_btn').onclick = function () {
        guiClearLog();
        callLogDb.clear()
            .then(() => {
                ac_log('call-log db: cleared');
            })
            .catch(e => {
                ac_log('call-log db: clear error', e)
            });
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
    document.getElementById('hold_btn').onclick = function () { guiToggleHold(); }
    document.getElementById('send_reinvite_btn').onclick = function () { guiSendReInvite(); }
    document.getElementById('send_info_btn').onclick = function () { guiSendInfo(); }
    document.getElementById('mute_audio_btn').onclick = function () { guiMuteAudio(); }
    document.getElementById('mute_video_btn').onclick = function () { guiMuteVideo(); }
    document.getElementById('hide_local_video_ckb').onclick = guiToggleLocalVideo;
    document.getElementById('hide_local_video_ckb').checked = userPref.hideLocalVideo;
    document.getElementById('video_size_select').onchange = guiVideoSizeChanged;
    document.getElementById('keypad_btn').onclick = guiToggleDTMFKeyPad;
    document.getElementById('call_log_ul').onclick = guiClickOnCallLog;
    guiSetVideoSizeControl(userPref.videoSize);
    guiVideoSizeChanged(false);

    document.getElementById('message_btn').onclick = guiMessage;
    document.getElementById('send_message_btn').onclick = guiSendMessage;
    if (userPref.newMessages && userPref.newMessages > 0) {
        let button = document.getElementById('message_btn');
        button.innerText = `Messages (${userPref.newMessages} new)`;
        button.classList.add('new_message');
    }

    document.getElementById('message_return_btn').onclick = function () { guiShowSelectedLine(); }
    document.getElementById('message_clear_btn').onclick = function () {
        guiClearMessages();
        messageDb.clear()
            .then(() => {
                ac_log('message db: cleared');
            })
            .catch(e => {
                ac_log('message db: clear error', e)
            });
    }

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

    // Buttons to select line.
    document.getElementById('line_0_btn').onclick = function () { guiInfo(''); guiShowSelectedLine(0); }
    document.getElementById('line_1_btn').onclick = function () { guiInfo(''); guiShowSelectedLine(1); }
    document.getElementById('line_2_btn').onclick = function () { guiInfo(''); guiShowSelectedLine(2); }
    document.getElementById('line_3_btn').onclick = function () { guiInfo(''); guiShowSelectedLine(3); }
    document.getElementById('line_4_btn').onclick = function () { guiInfo(''); guiShowSelectedLine(4); }
    guiShowSelectedLine(0);

    // Conference settings.
    videoMixer.setElements('canvas_id', 'local_video', 'remote_video_');
    videoMixer.data.localVideoIndex = undefined;
    guiVideoConferenceSettings();
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

function guiRequestNotificationPermission() {
    guiHide('notification_permission_btn');
    Notification.requestPermission();
}

function guiSetCamera() {
    document.getElementById('video_call_btn').disabled = !hasCamera;
}

function guiAnswerCall(videoOption) {
    guiEnableSound();
    guiNotificationClose();
    guiShowSelectedLine();
    guiShowPanel('call_established_panel');
    // Some values to testing. Please don't use them in production.
    let extraHeaders = ['X-Greeting: You are welcome !']

    lines[selected].answer(videoOption, extraHeaders);
}

// Find last outgoing call from call log history, and set it in dialer
function guiRedialLastCall() {
    guiEnableSound();
    let callTo = document.querySelector('#call_form [name=call_to]');
    for (let index = callLogDb.list.length - 1; index >= 0; index--) {
        let logRecord = callLogDb.list[index];
        if (!logRecord.incoming) {
            callTo.value = logRecord.user;
            break;
        }
    }
    callTo.focus();
}

// Callback: call restored (successfully or not)
async function callRestored(call) {
    ac_log('Call is restored', call)
    call.data['restoreCall'] = undefined;
    if (--restoreMultiCall.savedCalls <= 0) {
        ac_log('All calls are restored');
        // restore screen sharing 
        for (let ix = 0; ix < lines.length; ix++) {
            let restore = restoreMultiCall.lines[ix];
            if (restore !== null && restore.screenSharing && lines[ix] !== null) {
                await guiToggleScreenSharing(ix);
            }
        }
        // restore conference
        if (restoreMultiCall.conference !== 'off') {
            ac_log('Restore conference');
            document.getElementById('conference_select').value = restoreMultiCall.conference;
            guiConferenceSwitch();
        }
    }
}

// Try to restore calls terminated by page reloading
function guiRestoreMultiCall(restoreData) {
    restoreMultiCall = JSON.parse(restoreData);
    let delay = Math.ceil(Math.abs(restoreMultiCall.time - new Date().getTime()) / 1000);
    if (delay > phoneConfig.restoreCallMaxDelay) {
        ac_log('No restore calls, delay is too long (' + delay + ' seconds)');
        restoreMultiCall = null;
        return false;
    }
    for (let ix = 0; ix < lines.length; ix++) {
        let restore = restoreMultiCall.lines[ix];
        if (restore !== null) {
            selected = ix;
            guiMakeCallTo(restore.callTo, restore.video === 'sendrecv' || restore.video === 'sendonly' ? phone.VIDEO : phone.AUDIO,
                ['Replaces: ' + restore.replaces], { 'restoreCall': restore });
        }
    }
    selected = restoreMultiCall.selected;
    return true;
}

function guiMakeCall(videoOption) {
    guiEnableSound();
    if (lines[selected] !== null)
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
    let call;

    guiInfo('');
    guiShowPanel('outgoing_call_panel');

    // Some extra headers to testing. Please don't use the test strings in production !
    if (!extraHeaders) {
        extraHeaders = ['X-Greeting: Nice to see you!'];
    }
    if (phoneConfig.sendAlertInfoAutoAnswer) {
        extraHeaders.push('Alert-Info: <http://www.notused.com>;info=alert-autoanswer');
    }
    call = lines[selected] = phone.call(videoOption, callTo, extraHeaders);
    if (extraData !== null) {
        Object.assign(call.data, extraData);
    }
    call.data['_line_index'] = selected;

    // create new call log record
    let time = call.data['_create_time'].getTime();
    let logRecord = {
        id: callLogDb.createId(time),
        time: time,
        duration: -1,
        incoming: false,
        user: call.data['_user'],
        display_name: call.data['_display_name']
    };

    call.data['log_record'] = logRecord;
    guiAddLog(logRecord, 'call_log_ul');
    callLogDb.add(logRecord)
        .then(() => {
            ac_log('call-log db: added');
        })
        .catch((e) => {
            ac_log('call-log db: add error', e);
        });
}

function guiRejectCall() {
    guiEnableSound();
    guiNotificationClose();
    if (lines[selected] !== null) {
        lines[selected].reject();
        lines[selected] = null;
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
    if (lines[selected] !== null) {
        lines[selected].redirect(redirectTo);
        lines[selected] = null;
    }
    guiShowPanel('dialer_panel');
}

function guiTransfer() {
    guiShowPanel('call_transfer_panel');
}

function guiDoTransfer() {
    let to = document.querySelector('#call_transfer_form [name=transfer_to]').value.trim();
    if (to === '') {
        guiShowPanel('call_established_panel');
        return;
    }
    let transferTo;
    let targetCall;
    if (document.querySelector('#call_transfer_form [name=transfer_type]').options.selectedIndex === 0) {
        // blind transfer
        transferTo = to;
        targetCall = null;
    } else {
        // attended transfer
        let targetLine = parseInt(to, 10);
        if (isNaN(targetLine)) {
            guiWarning('attended transfer - enter target line number')
            return;
        }
        if (targetLine <= 0 || targetLine > lines.length) {
            ac_log(`attended transfer: line number is not in range 1..${lines.length}`);
            guiWarning(`attended transfer: line number is not in range 1..${lines.length}`);
            return;
        }

        if (targetLine - 1 == selected) {
            ac_log('attended transfer: selected line cannot be used as target');
            guiWarning('attended transfer: selected line cannot be used as target');
            return;
        }
        targetCall = lines[targetLine - 1];
        if (targetCall === null) {
            ac_log(`attended transfer: line ${targetLine} is not connected`);
            guiWarning(`attended transfer: line ${targetLine} is not connected`);
            return;
        }
        transferTo = targetCall.data['_user'] + '@' + targetCall.data['_host'];
    }
    guiShowPanel('call_established_panel');
    document.getElementById('transfer_btn').disabled = true;
    transfer(transferTo, targetCall);
}

async function transfer(transferTo, targetCall = null) {
    if (targetCall === null)
        ac_log(`blind call transfer: line: ${selected + 1}, target URL: ${transferTo}`);
    else
        ac_log(`attended call transfer: line ${selected + 1}, target line: ${getLineName(targetCall)}`)

    let sel = selected;
    //  wait until selected call be on hold
    while (lines[sel] !== null && !lines[sel].isLocalHold()) {
        try {
            ac_log(`call transfer: hold line ${sel + 1}`)
            await guiHold(lines[sel], true);
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    if (lines[sel] === null) {
        ac_log(`call transfer: cannot hold line ${sel + 1} (it is closed)`)
        return;
    }

    ac_log(`call transfer: line ${sel + 1} is on hold`)

    // if after hold, the line is still selected
    if (sel === selected) {
        document.getElementById('hold_btn').disabled = true;
    }

    lines[sel].sendRefer(transferTo, targetCall);
}

function guiHangup() {
    guiEnableSound();
    guiNotificationClose();
    if (lines[selected] !== null) {
        lines[selected].terminate();
        lines[selected] = null;
    }
    guiShowPanel('dialer_panel');
}

/*
 * Start/Stop sending video
 */
function guiToggleSendVideo() {
    let call = lines[selected];
    if (call === null) {
        ac_log('start/stop sending video: no active call');
        return;
    }
    guiInfo('');
    if (call.data['_toggle_send_video_in_progress']) {
        ac_log('start/stop sending video: in progress...');
        return;
    }
    let savedSelected = selected;
    if (!call.hasEnabledSendVideo()) {
        document.getElementById('send_video_btn').disabled = true;
        call.data['_toggle_send_video_in_progress'] = true;
        call.startSendingVideo()
            .then(() => {
                // if line is still selected, update GUI
                if (savedSelected === selected) {
                    document.getElementById('send_video_btn').value = 'Stop sending video';
                    guiShowVideoControls(call);
                    guiShowLocalVideo(!userPref.hideLocalVideo);
                }

                // Other side may start or stop send video.
                let remoteVideo = document.getElementById(`remote_video_${call.data['_line_index']}`);
                setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());

                // update video conference if used.
                if (videoMixer.isOn()) {
                    if (videoMixer.data.localVideoIndex === undefined)
                        conferenceSetLocalVideo(savedSelected);
                    conferenceAddVideo(call, true, null);
                }
            })
            .catch((e) => {
                ac_log('start sending video failure', e);
            })
            .finally(() => {
                call.data['_toggle_send_video_in_progress'] = false;
                if (savedSelected === selected)
                    document.getElementById('send_video_btn').disabled = false;
            });
    } else {
        document.getElementById('send_video_btn').disabled = true;
        call.data['_toggle_send_video_in_progress'] = true;
        call.stopSendingVideo()
            .then(() => {
                // if line is still selected, update GUI
                if (savedSelected === selected) {
                    guiShowVideoControls(call);
                    guiShowLocalVideo(false);
                    document.getElementById('send_video_btn').value = 'Start sending video';
                }

                // Other side may start or stop send video.
                let remoteVideo = document.getElementById(`remote_video_${call.data['_line_index']}`);
                setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());

                // update video conference if used.
                if (videoMixer.isOn()) {
                    if (videoMixer.data.localVideoIndex === savedSelected)
                        conferenceSetLocalVideo();
                    conferenceAddVideo(call, false, null);
                }
            })
            .catch((e) => {
                ac_log('stop sending video failure', e);
            })
            .finally(() => {
                call.data['_toggle_send_video_in_progress'] = false;
                if (savedSelected === selected)
                    document.getElementById('send_video_btn').disabled = false;
            });
    }
}


// Start/stop screen sharing.
async function guiToggleScreenSharing(lineIndex = selected) {
    ac_log(`phone: guiToggleScreenSharing() line=${lineIndex + 1}`);
    let call = lines[lineIndex];
    if (call === null) {
        ac_log('start/stop screen sharing: no active call');
        return;
    }
    let savedIndex = lineIndex;
    let screenSharingBtn = document.getElementById('screen_sharing_btn');
    let sendVideoBtn = document.getElementById('send_video_btn');

    guiInfo('');
    if (!call.isScreenSharing()) {
        return Promise.resolve()
            .then(() => {
                if (screenSharing.stream === null) {
                    // open new screen-sharing stream
                    return phone.openScreenSharing()
                        .then(stream => {
                            screenSharing.stream = stream;
                            screenSharing.counter = 0;
                        });
                }
            })
            .then(() => {
                if (savedIndex === selected) {
                    screenSharingBtn.disabled = true;
                    sendVideoBtn.value = 'Start sending video';
                    sendVideoBtn.disabled = true;
                }
                return call.startScreenSharing(screenSharing.stream);
            })
            .then(() => {
                screenSharing.counter++;
                if (savedIndex === selected) {
                    screenSharingBtn.value = 'Stop screen sharing';
                    sendVideoBtn.value = 'Start sending video';
                    sendVideoBtn.disabled = true;
                }
                // Optional check if other side receive the video.
                if (!call.hasSendVideo()) {
                    ac_log('Warning: Currently other side does not accept the screen sharing video');
                    guiWarning('Currently other side does not accept the screen sharing video');
                }
            })
            .catch((e) => {
                if (savedIndex === selected) {
                    sendVideoBtn.disabled = !hasCamera;
                }
                ac_log('guiScreenSharing: error: ' + e);
            })
            .finally(() => {
                if (savedIndex === selected) {
                    screenSharingBtn.disabled = false;
                }
            });
    } else {
        // Note: GUI updated in callScreenSharingEnded callback
        return call.stopScreenSharing();
    }
}

function guiToggleHold(lineIndex = selected) {
    ac_log('hold toggle');
    let call = lines[lineIndex];
    if (call === null)
        return;
    let hold = call.isLocalHold();
    guiHold(call, !hold);
}

function guiSendReInvite() {
    ac_log('send re-INVITE');
    let call = lines[selected];
    if (call === null)
        return;
    call.sendReInvite();
}

function guiSendInfo() {
    ac_log('send INFO');
    let call = lines[selected];
    if (call === null)
        return;
    let data = {
        location: 'Haifa',
        attractions: ['Bahai Gardens', 'Carmelite Monastery', 'Beaches']
    };
    call.sendInfo(JSON.stringify(data), 'application/json');
}


function guiHold(call, hold) {
    if (call === null)
        return Promise.resolve();
    if (isSelectedLine(call))
        document.getElementById('hold_btn').disabled = true;
    return call.hold(hold)
        .catch(() => {
            ac_log('hold/unhold - failure');
        })
        .finally(() => {
            if (isSelectedLine(call))
                document.getElementById('hold_btn').disabled = false;
        });
}

function guiSendDTMF(key) {
    if (lines[selected] != null) {
        audioPlayer.play(Object.assign({ 'name': key }, SoundConfig.play.dtmf));
        lines[selected].sendDTMF(key);
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

function guiMuteAudio(lineIndex = selected) {
    let muted = lines[lineIndex].isAudioMuted();
    lines[lineIndex].muteAudio(!muted);
    if (lineIndex === selected)
        document.getElementById('mute_audio_btn').value = !muted ? 'Unmute' : 'Mute';
}

function guiMuteVideo(lineIndex = selected) {
    let muted = lines[lineIndex].isVideoMuted();
    lines[lineIndex].muteVideo(!muted);
    if (lineIndex === selected)
        document.getElementById('mute_video_btn').value = !muted ? 'Unmute video' : 'Mute video';
}

function guiToggleLocalVideo() {
    let hide = userPref.hideLocalVideo = document.getElementById('hide_local_video_ckb').checked;
    userPref.hideLocalVideo = hide;
    guiStoreUserPref(userPref);
    guiShowLocalVideo(!hide);
}

function guiShowLocalVideo(show, lineIndex = selected, conf = conference) {
    if (conf === 'video') {
        ac_log('guiShowLocalVideo: ignored in conference video mode');
        return;
    }
    let call = (lineIndex >= 0) ? lines[lineIndex] : null;
    if (call === null)
        show = false;
    let localVideo = document.getElementById('local_video');
    localVideo.volume = 0.0;
    localVideo.mute = true;
    if (show) {
        localVideo.srcObject = call.getRTCLocalStream();
        localVideo.autoplay = true;
        localVideo.style.display = 'inline-block';
        ac_log(`guiShowLocalVideo: show for line:${lineIndex + 1}`);
    } else {
        localVideo.srcObject = null;
        localVideo.autoplay = false;
        localVideo.style.display = 'none';
        ac_log('guiShowLocalVideo: hide');
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

// Video size.
function guiSetVideoSizeControl(selectedSize) {
    if (selectedSize === 'Reset Custom' || selectedSize === 'Custom') {
        selectedSize = 'Small';
    }
    let options = document.getElementById('video_size_select')
    // Set selected property in options
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        option.selected = (option.value === selectedSize);
    }
}

function guiVideoSizeChanged(save = true) {
    let size = document.getElementById('video_size_select').value;
    let localVideo = document.getElementById('local_video');
    localVideo.style.position = 'static';
    localVideo.left = localVideo.top = 'auto';
    guiSetVideoSize(localVideo, size);

    for (let ix = 0; ix < lines.length; ix++) {
        let remoteVideo = document.getElementById(`remote_video_${ix}`);
        remoteVideo.style.position = 'static';
        remoteVideo.style['z-index'] = 'auto';
        remoteVideo.left = remoteVideo.top = 'auto';
        guiSetVideoSize(remoteVideo, size);
    }

    if (save) {
        userPref.videoSize = size;
        guiStoreUserPref(userPref);
    }
}

function guiSetVideoSize(video, size) {
    let s = videoSizes[size];
    video.style.width = s.width;
    video.style.height = s.height;
    video.dataset.size = size;
}

//----------------- Local storage load/store ----------------------
function guiLoadAccount() { return storageLoadConfig('phoneAccount'); }

function guiStoreAccount(value) { storageSaveConfig('phoneAccount', value); }

function guiLoadServerConfig() { return storageLoadConfig('phoneServerConfig', DefaultServerConfig); }

function guiStoreServerConfig(value) { storageSaveConfig('phoneServerConfig', value, DefaultServerConfig); }

function guiLoadPhoneConfig() { return storageLoadConfig('phoneConfig', DefaultPhoneConfig, true, true); }

function guiLoadUserPref() { return storageLoadConfig('phoneUserPref', DefaultUserPref, false, false); }

function guiStoreUserPref(value) { storageSaveConfig('phoneUserPref', value, DefaultUserPref); }

function guiLoadSelectedDevices() { return storageLoadConfig('phoneSelectedDevices'); }

function guiStoreSelectedDevices(value) { storageSaveConfig('phoneSelectedDevices', value); }

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
//-------------------- call buttons --------------------------------
function guiLineButtonClass(ix, add, ...names) {
    let button = document.getElementById(`line_${ix}_btn`);
    if (!button) {
        ac_log('Cannot get call button index=' + ix);
        return;
    }
    if (add)
        button.classList.add(...names);
    else
        button.classList.remove(...names);
}

// Optionaly change selected line.
// Show panel for selected line call (one of dialer_panel, incoming_call_panel, outgoing_call_panel or call_established_panel)
// According call state fill the panel, enable or disable GUI controls.
function guiShowSelectedLine(lineIndex = selected) {
    if (lineIndex < 0 || lineIndex >= lines.length)
        throw "selected line index=" + ix + " is out of range";
    selected = lineIndex;
    ac_log(`Select line ${selected + 1}`);

    // Mark selected line button using border.
    for (let i = 0; i < lines.length; i++) {
        document.getElementById(`line_${i}_btn`).classList.remove('selected_line');
    }
    document.getElementById(`line_${selected}_btn`).classList.add("selected_line");

    // Show and fill selected line panel. Show/hide local video.
    let call = lines[selected];
    if (call === null) {
        guiShowPanel('dialer_panel');
        guiShowLocalVideo(false);
    } else if (!call.isEstablished()) {
        if (call.isOutgoing()) {
            document.getElementById('outgoing_call_user').innerText = call.data['_user'];
            document.getElementById('outgoing_call_progress').innerText = call['outgoing_call_progress'] ? 'dzzz dzzz' : '';
            guiShowPanel('outgoing_call_panel');
            guiShowLocalVideo(false);
        } else {
            let user = call.data['_user'];
            let dn = call.data['_display_name'];
            let caller = dn ? `"${dn}" ${user}` : user;
            document.getElementById('incoming_call_user').innerText = caller;
            document.getElementById('accept_video_btn').disabled = !hasCamera || !call.hasVideo();
            document.getElementById('accept_recvonly_video_btn').disabled = !call.hasVideo();
            guiShowPanel('incoming_call_panel');
            document.getElementById('hold_btn').value = 'Hold';
            document.getElementById('mute_audio_btn').value = 'Mute';
            document.getElementById('mute_video_btn').value = 'Mute video';
            guiShowLocalVideo(false);
        }
    } else {
        let user = call.data['_user'];
        let dn = call.data['_display_name'];
        let caller = dn ? `"${dn}" ${user}` : user;
        document.getElementById('call_established_user').innerText = caller;

        let sendVideoBtn = document.getElementById('send_video_btn');
        sendVideoBtn.value = call.hasEnabledSendVideo() ? 'Stop sending video' : 'Start sending video';
        sendVideoBtn.disabled = !hasCamera || call.data['_toggle_send_video_in_progress']; // if defined and true.

        let holdBtn = document.getElementById('hold_btn');
        let remoteHold = call.isRemoteHold();
        let localHold = call.isLocalHold();
        holdBtn.value = localHold ? 'Unhold' : 'Hold';
        holdBtn.disabled = phoneConfig.avoidTwoWayHold && !localHold && remoteHold;

        document.getElementById('mute_audio_btn').value = call.isAudioMuted() ? 'Unmute' : 'Mute';
        document.getElementById('mute_video_btn').value = call.isVideoMuted() ? 'Unmute video' : 'Mute video';
        document.getElementById('transfer_btn').disabled = false;
        guiShowVideoControls(call);

        let screenSharingBtn = document.getElementById('screen_sharing_btn');
        screenSharingBtn.disabled = false;
        if (call.data['_screenSharing']) {
            screenSharingBtn.value = 'Stop screen sharing';
            sendVideoBtn.disabled = true; // The video track is used for screen sharing.
            sendVideoBtn.value = 'Start sending video';
        } else {
            screenSharingBtn.value = 'Start screen sharing';
        }

        guiShowPanel('call_established_panel');

        // show local video only if selected line has it.
        guiShowLocalVideo(call.hasSendVideo() && !userPref.hideLocalVideo);
    }
}

function isSelectedLine(call) {
    return getLineIndex(call) === selected;
}

function getLineIndex(call) {
    let index = call.data['_line_index'];
    if (isNaN(index)) {
        ac_log('phone: getLineIndex(): No line index assigned to the call !');
        return -1;
    }
    return index;
}

// The 1st line has name "1" (not "0")
function getLineName(call) {
    return getLineIndex(call) + 1;
}

function getFirstFreeLine() {
    for (let i = 0; i < lines.length; i++)
        if (lines[i] === null)
            return i;
    return -1;
}

function getFirstActiveLine() {
    for (let i = 0; i < lines.length; i++)
        if (lines[i] !== null)
            return i;
    return -1;
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
    const panels = ['setting_panel', 'devices_panel', 'dialer_panel', 'call_log_panel',
        'outgoing_call_panel', 'incoming_call_panel', 'call_established_panel',
        'redirect_call_panel', 'call_transfer_panel', 'message_panel'
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
function guiNotificationShow(caller) {
    if (!window.Notification)
        return;
    if (Notification.permission !== "granted")
        return;
    guiNotificationClose();

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
}

function guiNotificationClose() {
    if (desktopNotification) {
        desktopNotification.close();
        desktopNotification = null;
        ac_log('desktopNofification.close()');
    }
}

/*
 * Work with some UL list.
 * Used for call log and text messages
 */
// Add li element to top (or to bottom). If need remove oldest element.
function guiListAdd(newLI, listId, maxSize, top = true) {
    let list = document.getElementById(listId);
    if (top) {
        list.insertBefore(newLI, list.childNodes[0]);
    } else {
        list.appendChild(newLI);
    }
    if (list.getElementsByTagName("LI").length > maxSize) {
        list.removeChild(top ? list.lastElementChild : list.childNodes[0]);
    }
}

// Search in list LI element by unique ID, and update it.
function guiListUpdate(newLI, id, listId) {
    let list = document.getElementById(listId);
    let oldLI = null;
    let elems = list.getElementsByTagName("LI");
    for (let i = 0; i < elems.length; i++) { // without "for of" to compatibility with Edge
        let li = elems[i];

        if (li.dataset.id === id) {
            oldLI = li;
            break;
        }
    }
    if (!oldLI) {
        return;
    }
    list.replaceChild(newLI, oldLI);
}

// Clear log list.
function guiListClear(listId) {
    let list = document.getElementById(listId);
    while (list.firstChild) {
        list.firstChild.remove();
    }
}

function guiListDelete(li) {
    li.parentNode.removeChild(li);
}

/* ---------------- Call log record ----------------
 * To keep call logs after page reload it saved in indexedDB.
 *
 * Log record:
 * 'id'       - fixed length string, build from time and sequence number.
 * 'time'     - call creation time (ms from 1970, date.getTime())
 * 'incoming' - call is incoming (true/false)
 * 'user'     - remote user name
 * 'display_name' - remote user display name
 * 'duration' time interval between call confirmation and hangup,
 *  has two special values: -1 or 0
 *
 *    at creation until confirmed, or when failed set to -1
 *    after call confirmed updated to 0
 *    after call ended updated to real value (sec)
 *
 * So you can separate failed call (-1) from established call with
 * unknown duration (0).
 * The unknown duration can be set, if phone page was reloaded during call.
 */
/* ---------------- Call log GUI---------------------*/
// Create LI for log record
function guiCreateLogLI(logRecord) {
    let str = new Date(logRecord.time).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });
    str += ' <b>' + logRecord.user;
    if (logRecord.display_name)
        str += ' "' + logRecord.display_name + '"';
    str += '</b> ';
    if (logRecord.duration >= 0)
        str += logRecord.duration + ' sec';
    let li = document.createElement('li');
    li.innerHTML = str;
    li.dataset.id = logRecord.id;
    // icon selected by class name.
    let className = `${logRecord.incoming ? 'in_' : 'out_'}${logRecord.duration >= 0 ? 'green' : 'red'}`;
    li.classList.add(className);
    return li;
}

function guiAddLog(logRecord) {
    guiListAdd(guiCreateLogLI(logRecord), 'call_log_ul', callLogDb.maxSize);
}

function guiUpdateLog(logRecord) {
    guiListUpdate(guiCreateLogLI(logRecord), logRecord.id, 'call_log_ul')
}

function guiClearLog() {
    guiListClear('call_log_ul');
}

// Get user from call log, and set it in dialer panel.
function guiClickOnCallLog(ev) {
    let target = ev.target;
    ac_log('clicked on call log:', target);
    if (target.nodeName !== 'LI')
        return;
    let id = target.dataset.id;
    let index = callLogDb.list.findIndex((r) => r.id === id);
    if (index === -1) // should not be.
        return;
    let logRecord = callLogDb.list[index];
    let callTo = document.querySelector('#call_form [name=call_to]');
    callTo.value = logRecord.user;
    guiShowPanel('dialer_panel');
    callTo.focus();
}

/* ---------------- Messages GUI---------------------*/
function guiMessage() {
    guiEnableSound();
    guiShowPanel('message_panel');

    // Clear new messages visual notification
    userPref.newMessages = 0;
    guiStoreUserPref(userPref);
    let button = document.getElementById('message_btn');
    button.innerText = 'Messages';
    button.classList.remove('new_message');
}

/* Create LI for message */
function guiCreateMessageLI(msg) {
    let li = document.createElement('li');
    li.innerHTML = `<tt>${createDateTimestamp(msg.time)}</tt> ${msg.incoming ? 'from ' : 'to '}<b>${msg.user}</b> <span class="${msg.incoming ? 'incoming_message' : 'outgoing_message'}">"${msg.body}"</span>`;
    return li;
}

function guiClearMessages() {
    guiListClear('message_ul');
}

function guiAddMessage(msg) {
    guiListAdd(guiCreateMessageLI(msg), 'message_ul', MessageDb.maxSize, false);
}

function guiSendMessage() {
    let sendTo = document.querySelector('#send_message_form [name=send_to]').value.trim();
    let textArea = document.querySelector('#send_message_form [name=message]');
    let text = textArea.value.trim();
    if (sendTo === '' || text === '')
        return;

    let time = new Date();
    let contentType = 'text/plain';

    phone.sendMessage(sendTo, text, contentType)
        .then((e) => {
            ac_log('message sent', e);

            guiInfo('Message sent');
            textArea.value = '';

            // split sendTo to user and optional host
            let ix = sendTo.indexOf('@');
            let user = ix === -1 ? sendTo : sendTo.substring(0, ix);
            let host = ix === -1 ? null : sendTo.substring(ix + 1);

            let message = {
                id: callLogDb.createId(time),
                incoming: false,
                time: time,
                user: user,
                display_name: null,
                host: host,
                contentType: contentType,
                body: text
            };

            guiAddMessage(message);

            messageDb.add(message)
                .then(() => {
                    ac_log('message db: added');
                })
                .catch((e) => {
                    ac_log('message db: add error', e);
                });
        })
        .catch((e) => {
            ac_log('message sending error', e);
            guiError('Cannot send message: ' + e.cause);
        });
}

/* ------- Conference -------*/
function guiConferenceSwitch() {
    let prevConference = conference;
    conference = document.getElementById('conference_select').value;
    ac_log(`Conference switch ${prevConference} -> ${conference}`);
    if (prevConference === conference)
        return;
    let cl = document.getElementById('phone_lines').classList; // show conference mode
    switch (prevConference) {
        case 'off':
            switch (conference) {
                case 'audio':
                    cl.add('audio_conf');
                    conferenceStartAudio();
                    break;
                case 'video':
                    cl.add('video_conf');
                    guiSetVideoSizeControl('Micro');
                    guiVideoSizeChanged(false);
                    document.getElementById('hide_local_video_ckb').disabled = true;
                    conferenceStartAudio();
                    conferenceStartVideo();
                    break;
            }
            break;
        case 'audio':
            switch (conference) {
                case 'off':
                    cl.remove('audio_conf');
                    conferenceStopAudio();
                    break;
                case 'video':
                    cl.remove('audio_conf');
                    cl.add('video_conf');
                    guiSetVideoSizeControl('Micro');
                    guiVideoSizeChanged(false);
                    document.getElementById('hide_local_video_ckb').disabled = true;
                    conferenceStartVideo();
                    break;
            }
            break;
        case 'video':
            switch (conference) {
                case 'off':
                    cl.remove('video_conf');
                    conferenceStopVideo();
                    conferenceStopAudio();
                    document.getElementById('hide_local_video_ckb').disabled = false;
                    break;
                case 'audio':
                    cl.remove('video_conf');
                    cl.add('audio_conf');
                    document.getElementById('hide_local_video_ckb').disabled = false;
                    conferenceStopVideo();
                    break;
            }
            guiSetVideoSizeControl(userPref.videoSize);
            guiVideoSizeChanged(false);
            break;
    }
}

function getOpenLines(exceptCall = null) {
    let result = [];
    for (let call of lines) {
        if (call !== null && call.isEstablished() && call !== exceptCall)
            result.push(call);
    }
    return result;
}

function conferenceStartAudio() {
    ac_log('Start audio conference');
    for (let call of getOpenLines()) {
        conferenceAddAudio(call);
    }
}

function conferenceStopAudio() {
    ac_log('Stop audio conference');
    for (let call of getOpenLines()) {
        conferenceRemoveAudio(call);
    }
}

function conferenceAdd(call) {
    conferenceAddAudio(call);
    conferenceAddVideo(call);
}

function conferenceRemove(call) {
    conferenceRemoveVideo(call);
    conferenceRemoveAudio(call);
}

function conferenceAddAudio(call) {
    ac_log(`Conference add audio ${getLineName(call)}`);
    if (call.data['audioMixer']) {
        ac_log(`Warning: audio mixer already set in line ${getLineName(call)}`);
        return;
    }
    let audioMixer = call.data['audioMixer'] = new CallAudioMixer(audioPlayer.audioCtx, call);
    ac_log(audioMixer.toString() + ' created')

    for (let otherCall of getOpenLines(call)) {
        if (audioMixer.add(otherCall)) {
            ac_log(`Line ${getLineName(otherCall)} added to audio mixer ${getLineName(call)}`)
        }
    }
    for (let otherCall of getOpenLines(call)) {
        let audioMixer = otherCall.data['audioMixer'];
        if (audioMixer) {
            if (audioMixer.add(call)) {
                ac_log(`Line ${getLineName(call)} added to audio mixer ${getLineName(otherCall)}`)
            }
        }
    }

    ac_log(`Let set audio mix as sender for line ${getLineName(call)}`);
    let mixStream = audioMixer.getMix();
    let connection = call.getRTCPeerConnection();
    phone.getWR().connection.replaceSenderTrack(connection, 'audio', mixStream)
        .then(() => {
            ac_log(`Audio mix set as audio sender for line ${getLineName(call)}`);
        })
        .catch(e => {
            ac_log(`Cannot set audio mix as sender for line ${getLineName(call)}`, e);
        });
}

function conferenceRemoveAudio(call) {
    ac_log(`Conference remove audio ${getLineName(call)}`);
    let audioMixer = call.data['audioMixer'];
    if (!audioMixer) {
        ac_log(`Audio mixer is not found on line ${getLineName(call)}`);
        return;
    }
    audioMixer.close();
    call.data['audioMixer'] = undefined;
    ac_log(`Audio mixer ${getLineName(call)} closed`);

    for (let otherCall of getOpenLines(call)) {
        let audioMixer = otherCall.data['audioMixer'];
        if (audioMixer) {
            if (audioMixer.remove(call)) {
                ac_log(`Line ${getLineName(call)} removed from audio mixer ${getLineName(otherCall)}`)
            }
        }
    }

    if (call.isTerminated()) {
        return;
    }
    let connection = call.getRTCPeerConnection();
    let localStream = call.getRTCLocalStream();
    ac_log(`Let restore audio sender for line ${getLineName(call)}`);
    phone.getWR().connection.replaceSenderTrack(connection, 'audio', localStream)
        .then(() => {
            ac_log(`Audio sender restored for line ${getLineName(call)}`);
        })
        .catch(e => {
            ac_log(`Cannot restore audio sender for line ${getLineName(call)}`, e);
        });
}

function conferenceStartVideo() {
    ac_log('Start video conference');
    if (videoMixer.isOn()) {
        ac_log('video conference is already started');
        return;
    }
    conferenceSetLocalVideo();
    guiShow('conference_view');
    videoMixer.start();
    for (let call of getOpenLines()) {
        conferenceAddVideo(call);
    }
}

function conferenceStopVideo() {
    ac_log('Stop video conference');
    if (!videoMixer.isOn()) {
        ac_log('Video conference is already stopped');
        return;
    }
    for (let call of getOpenLines()) {
        conferenceRemoveVideo(call);
    }
    guiHide('conference_view');
    videoMixer.stop();
    videoMixer.data.localVideoIndex = undefined;
    guiShowSelectedLine();
}

function conferenceAddVideo(call, send = null, receive = null) {
    if (!videoMixer.isOn())
        return;
    if (!call.isEstablished())
        return;
    if (send === null)
        send = call.hasSendVideo();
    if (receive === null)
        receive = call.hasReceiveVideo();
    ac_log(`Conference add video ${getLineName(call)} send=${send} receive=${receive}`);

    if (videoMixer.data.localVideoIndex === undefined)
        conferenceSetLocalVideo();

    let sendModified = videoMixer.add(call, send, receive);
    if (sendModified) {
        let connection = call.getRTCPeerConnection();
        let videoMix = videoMixer.getMix(call);
        if (videoMix !== null) {
            ac_log(`Let set video mix as sender for line ${getLineName(call)}`);
            phone.getWR().connection.replaceSenderTrack(connection, 'video', videoMix)
                .then(() => {
                    ac_log(`Video mix set as video sender for line ${getLineName(call)}`);
                })
                .catch(e => {
                    ac_log(`Cannot set video mix as video sender for line ${getLineName(call)}`, e);
                });
        } else {
            let localStream = call.getRTCLocalStream();
            ac_log(`Let restore video sender for line ${getLineName(call)}`);
            phone.getWR().connection.replaceSenderTrack(connection, 'video', localStream)
                .then(() => {
                    ac_log(`Video sender restored for line ${getLineName(call)}`);
                })
                .catch(e => {
                    ac_log(`Cannot restore video sender for line ${getLineName(call)}`, e);
                });
        }
    }
}

function conferenceRemoveVideo(call) {
    if (!videoMixer.isOn())
        return;
    ac_log(`Conference remove video ${getLineName(call)}`);
    let videoMix = videoMixer.getMix(call);
    if (!videoMixer.remove(call)) {
        ac_log(`line ${getLineName(call)} doesn't use video mixer`);
        return;
    }
    if (videoMix === null) {
        ac_log(`line ${getLineName(call)} removed from video mixer (video receive only)`);
        return;
    }
    if (call.isTerminated()) {
        return;
    }
    let localStream = call.getRTCLocalStream();
    let connection = call.getRTCPeerConnection();
    ac_log(`Let restore video sender for line ${getLineName(call)}`);
    phone.getWR().connection.replaceSenderTrack(connection, 'video', localStream)
        .then(() => {
            ac_log(`Video sender restored for line ${getLineName(call)}`);
        })
        .catch(e => {
            ac_log(`Cannot restore video sender for line ${getLineName(call)}`, e);
        });
}

function guiVideoConferenceSettings() {
    // Set video layout
    let layoutOption = document.getElementById('conference_layout_select');
    let layout = userPref.conference.layout;
    videoMixer.setLayout(layout);
    layoutOption.value = layout;

    layoutOption.onchange = () => {
        layout = layoutOption.value;
        ac_log(`Conference set layout: ${layout}`);
        userPref.conference.layout = layout;
        videoMixer.setLayout(layout);
        guiStoreUserPref(userPref);
    }

    // Set video size.
    let sizeOption = document.getElementById('conference_size_select');
    let size = userPref.conference.size;
    let vs = videoSizes[size];
    videoMixer.setSizes(vs);
    sizeOption.value = size;

    sizeOption.onchange = () => {
        size = sizeOption.value;
        ac_log(`Conference set video size: ${size}`);
        userPref.conference.size = size;
        let vs = videoSizes[size];
        videoMixer.setSizes(vs);
        guiStoreUserPref(userPref);
    }
    // Set frames per second
    let fpsOption = document.getElementById('conference_fps_select');
    let fps = userPref.conference.fps;
    videoMixer.setFPS(parseInt(fps));
    fpsOption.value = fps;

    fpsOption.onchange = () => {
        fps = fpsOption.value;
        ac_log(`Conference fps: ${fps}`);
        userPref.conference.fps = fps;
        videoMixer.setFPS(parseInt(fps));
        guiStoreUserPref(userPref);
    }
}

function conferenceSetLocalVideo(lineIndex = -1) {
    if (lineIndex === -1) {
        for (let ix = 0; ix < lines.length; ix++) {
            let call = lines[ix];
            if (call !== null && call.isEstablished()) {
                if (call.hasSendVideo()) {
                    lineIndex = ix;
                    break;
                }
            }
        }
    }
    if (lineIndex === -1) {
        ac_log('conferenceSetLocalVideo: no call sending video');
    } else {
        ac_log(`conferenceSetLocalVideo: ${lineIndex + 1}`);
    }
    videoMixer.data.localVideoIndex = (lineIndex !== -1) ? lineIndex : undefined;
    guiShowLocalVideo(true, lineIndex, 'off');
    videoMixer.resize();
}

function conferencePrint() {
    ac_log('Conference print');
    for (let call of getOpenLines()) {
        let audioMixer = call.data['audioMixer'];
        if (audioMixer) {
            ac_log(audioMixer.toString());
        } else {
            ac_log(`Audio mixer is not found in line ${getLineName(call)}`);
        }
    }
    ac_log(videoMixer.toString());
}

// Use device list in SelectDevices class instance to fill GUI select list.
function guiFillDeviceList(name) {
    let device = devices.getDevice(name); // name is one of 'microphone', 'speaker', 'camera', 'ringer'
    let selector = document.querySelector(`#devices [name=${name}]`);
    // Clear select push-down list
    while (selector.firstChild) {
        selector.removeChild(selector.firstChild);
    }
    if (device.incomplete) {
        selector.disabled = true;
        ac_log(`Warning: To device selection let enable ${name} usage`);
    } else {
        selector.disabled = false;
    }
    // Loop by device labels and add option elements.
    for (let ix = 0; ix < device.list.length; ix++) {
        let dev = device.list[ix]
        let option = document.createElement("option");
        option.text = dev.label;      // device name
        option.value = ix.toString(); // index in device list
        option.selected = (device.index === ix); // selected device
        selector.add(option);
    }
    document.getElementById(`${name}_dev`).style.display = (device.list.length > 1) ? 'block' : 'none';
}

// Set deviceId constraint for microphone and camera.
// Set deviceId for audioPlayer
function setDeviceIds() {
    let micId = devices.getSelected('microphone').deviceId;
    phone.setConstraint('audio', 'deviceId', userPref.devicesExact && micId ? { exact: micId } : micId);

    let camId = devices.getSelected('camera').deviceId;
    phone.setConstraint('video', 'deviceId', userPref.devicesExact && camId ? { exact: camId } : camId);

    let spkrId = devices.getSelected('speaker').deviceId;
    audioPlayer.setSpeakerId(spkrId);

    let ringId = devices.getSelected('ringer').deviceId;
    audioPlayer.setRingerId(ringId);
}

// Set (or remove) deviceId as audio element sinkId for speaker
function setRemoteVideoSinkId(lineIndex) {
    let remoteVideo = document.getElementById(`remote_video_${lineIndex}`);

    let deviceId = devices.getSelected('speaker').deviceId;
    if (deviceId === null)
        deviceId = '';

    if (deviceId === remoteVideoDeviceIds[lineIndex]) {
        ac_log(`line=${lineIndex + 1} remote video: sinkId is already assigned`);
        return Promise.resolve();
    }

    if (!remoteVideo.setSinkId) {
        return Promise.reject(new Error('setSinkId is not implemented'));
    }

    ac_log(`line=${lineIndex + 1} remote video: setSinkId "${deviceId}"`);
    remoteVideo.srcObject = null; // probably setSinkId check srcObject
    return remoteVideo.setSinkId(deviceId)
        .then(() => {
            ac_log(`line=${lineIndex + 1} remote video: setSinkId completed`);
            remoteVideoDeviceIds[lineIndex] = deviceId;
        });
}
