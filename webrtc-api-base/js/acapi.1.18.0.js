'use strict';
/*
 * AudioCodes WebRTC API v1.18.0
 * © 2022 AudioCodes Ltd. All rights reserved.
 *
 */
class AudioCodesUA {
    constructor() {
        this._isInitialized = false;
        this.serverConfig = {};
        this.account = {
            user: null,
            userAuth: null,
            displayName: null,
            password: null,
            registerExpires: 600,
            useSessionTimer: false
        };
        // constraints for current browser
        this.constraints = { audio: true, video: true };

        this.chromiumBased = [
            { n: 'Edge', s: 'edg/' },
            { n: 'Opera', s: 'opr/' },
            { n: 'Samsung', s: 'samsungbrowser/' },
            { n: 'Yandex', s: 'yabrowser/' }
        ];
        this.modes = { // default values for modes and fixes.
            video_call_audio_answer_firefox_fix: true, // use fix
            video_call_audio_answer_safari_fix: true, // true: for Safari versions < 14. ('force' for all versions)
            ice_timeout_fix: 2000,             // ICE gathering timeout (ms)
            chrome_rtp_timeout_fix: 13,        // Currently Chrome don't set 'failed' status to icestate
            sbc_ha_pairs_mode: undefined,      // Set e.g. 15 (seconds) when used multiple URL of HA SBC pairs
            ringing_header_mode: undefined,    // Add extra header(s) to response 180 ringing
            sbc_switch_register5xx_mode: true, // Switch SBC if received REGISTER 5xx.
            cache_register_auth_mode: true,    // Next REGISTER includes authorization header from previous one.
            check_remote_sdp_mode: true        // Check remote SDP at every re-negotiation, and if need print 'AC:SDP' warning
        };
        this.credentials = [];
        this.listeners = {};
        this.registerExtraHeaders = null;
        this.jssipUA = null;
        this.browser = '';       // chrome, firefox, safari, other
        this.browserVersion = 0; // version major number.
        this.browserName = '';   // name with version
        this.os = 'other';       // windows,android,macos,ios,linux,other
        this.reconnectMin = 2;
        this.reconnectMax = 30;
        this.u17 = undefined;
        this.activeCalls = 0;
        this.wsSocket = null;
        this.wsOnMessage = null;
        this.wsPingMs = 0;
        this.wsOrigPingMs = 0;
        this.wsThrottlingPingMs = 0;
        this.wsVisibility = false;
        this.wsCall = false;
        this.wsLog = 0;
        this.wsPongTimeout = true;
        this.wsIsThrottling = false;
        this.wsPingJob = null;
        this.wsPingTime = null;
        this.wsNextPingTime = null;
        this.wsPongReceived = false;
        this.wsPongSupported = null;
        this.wsPongTimeoutTime = null;
        this.wsPongDelays = null;
        this.wsPongDelaysIx = 0;
        this.wsPongReport = 0;
        this.wsPongReportCounter = 0;
        this.wsPongDist = false;
        this.dtmfUseWebRTC = true;
        this.dtmfDuration = 250;
        this.dtmfInterToneGap = 250;
        this.enableAddVideo = false;
        this.oauthToken = null;
        this.oauthTokenUseInInvite = true;
        this.networkPriority = undefined;
        AudioCodesUA.ac_log = console.log;
        AudioCodesUA.js_log = null;
        if (AudioCodesUA.instance === undefined)
            AudioCodesUA.instance = this;
        this._detectBrowser();
        this._detectOS();
        this.webrtcapi = AudioCodesWebRTCWrapper;
        this.replacedCall = null;
        this.codecFilter = null;
        this.AUDIO = Symbol('audio');
        this.VIDEO = Symbol('video');
        this.RECVONLY_VIDEO = Symbol('recvonly_video');
        return AudioCodesUA.instance;
    }

    version() { return '1.18.0'; }
    getBrowserName() { return this.browserName; }
    getBrowser() { return this.browser; }
    getBrowserVersion() { return this.browserVersion; }
    getOS() { return this.os; }

    getWR() { return this.webrtcapi; }
    checkAvailableDevices() { return this.getWR().checkAvailableDevices(); }

    getServerAddress() {
        if (this.wsSocket === null)
            return null;
        let url = this.wsSocket.url;
        if (url.endsWith('/'))
            url = url.slice(0, -1);
        return url;
    }

    setOAuthToken(token, useInInvite = true) {
        this.oauthToken = token;
        this.oauthTokenUseInInvite = useInInvite;
        this.setRegisterExtraHeaders(this.registerExtraHeaders);
    }

    setUserAgent(name) {
        this.u17 = name;
    }

    setConstraints(browser, type, value) {
        let br = this.browser;
        let bs = this.browser + '|' + this.os;
        if (browser !== null && browser !== br && browser !== bs) {
            AudioCodesUA.ac_log(`AC: setConstraints ${browser} - ignored, no current browser`);
            return;
        }
        AudioCodesUA.ac_log(`AC: setConstraints ${browser} ${type}  ${JSON.stringify(value)}`);
        if (type !== 'audio' && type !== 'video')
            throw new TypeError(`Wrong type: ${type}`);
        this.constraints[type] = value;
    }

    setConstraint(type, name, value) {
        if (value !== null && value !== undefined) {
            AudioCodesUA.ac_log(`AC: setConstraint ${type} ${name}=${JSON.stringify(value)}`);
        } else {
            AudioCodesUA.ac_log(`AC: setConstraint remove ${type} ${name}`);
        }
        if (type !== 'audio' && type !== 'video')
            throw new TypeError(`Wrong type: ${type}`);

        if (value !== null && value !== undefined) {
            if (this.constraints[type] === true)
                this.constraints[type] = {};

            this.constraints[type][name] = value;
        } else {
            if (this.constraints[type] !== true && this.constraints[type] !== false) {
                delete this.constraints[type][name];

                if (Object.keys(this.constraints[type]).length === 0)
                    this.constraints[type] = true;
            }
        }
    }

    setBrowsersConstraints(obj) {
        let br = this.browser;
        let bs = this.browser + '|' + this.os;
        for (let key in obj) {
            if (key !== br && key !== bs)
                continue;
            let val = obj[key];
            if (val.audio !== undefined)
                this.setConstraints(key, 'audio', val.audio);
            if (val.video !== undefined)
                this.setConstraints(key, 'video', val.video);
        }
    }

    setCodecFilter(obj) {
        if (obj) {
            AudioCodesUA.ac_log(`AC: setCodecFilter ${JSON.stringify(obj)}`);
            this.codecFilter = this._cf_unpack(obj);
        }
    }

    setServerConfig(serverAddresses, serverDomain, iceServers = []) {
        this.serverConfig = {
            addresses: serverAddresses,
            domain: serverDomain,
            iceServers: this._convertIceList(iceServers)
        };
        AudioCodesUA.ac_log(`AC: setServerConfig() ${JSON.stringify(this.serverConfig)}`);
    }

    setReconnectIntervals(minSeconds, maxSeconds) {
        AudioCodesUA.ac_log(`AC: setReconnectIntervals min=${minSeconds} max=${maxSeconds}`);
        this.reconnectMin = minSeconds;
        this.reconnectMax = maxSeconds;
    }

    setAccount(user, displayName, password, authUser) {
        if (displayName === undefined || displayName === null || displayName.length === 0)
            displayName = undefined;
        if (authUser === undefined || authUser === null || authUser.length === 0)
            authUser = user;
        let a = this.account;
        a.user = user;
        a.displayName = displayName;
        a.password = password;
        a.authUser = authUser;
    }

    setRegisterExpires(seconds) {
        AudioCodesUA.ac_log(`AC: setRegisterExpires=${seconds}`);
        this.account.registerExpires = seconds;
    }

    setUseSessionTimer(use) {
        AudioCodesUA.ac_log(`AC: setUseSessionTimer=${use}`);
        this.account.useSessionTimer = use;
    }

    // null value means use default (see value set in constructor for dtmfDuration, dtmtInterToneGap, dtmfSendDelay).
    setDtmfOptions(useWebRTC, duration = null, interToneGap = null) {
        AudioCodesUA.ac_log(`AC: setDtmfOptions useWebRTC=${useWebRTC} duration=${duration} interToneGap=${interToneGap}`);
        this.dtmfUseWebRTC = useWebRTC;
        if (duration !== null)
            this.dtmfDuration = duration;
        if (interToneGap !== null)
            this.dtmfInterToneGap = interToneGap;
    }

    setEnableAddVideo(enable) {
        AudioCodesUA.ac_log(`AC: setEnableAddVideo=${enable}`);
        this.enableAddVideo = enable;
    }

    getEnableAddVideo() { return this.enableAddVideo; }

    getAccount() { return this.account; }

    setListeners(listeners) {
        AudioCodesUA.ac_log('AC: setListeners()');
        for (let m of ['loginStateChanged', 'outgoingCallProgress', 'callTerminated',
            'callConfirmed', 'callShowStreams', 'incomingCall', 'callHoldStateChanged']) {
            if (m in listeners)
                continue;
            throw new Error(`${m} listener is missed`);
        }

        this.listeners = listeners;
    }

    static getSessionStatusName(status) {
        switch (status) {
            case 0: return 'NULL (0)';
            case 1: return 'INVITE_SENT (1)';
            case 2: return '1XX_RECEIVED (2)';
            case 3: return 'INVITE_RECEIVED (3)';
            case 4: return 'WAITING_FOR_ANSWER (4)';
            case 5: return 'ANSWERED (5)';
            case 6: return 'WAITING_FOR_ACK (6)';
            case 7: return 'CANCELED (7)';
            case 8: return 'TERMINATED (8)';
            case 9: return 'CONFIRMED (9)';
            default: return 'Unknown (' + status + ')';
        }
    }

    setAcLogger(loggerFunction) { AudioCodesUA.ac_log = loggerFunction; }
    setJsSipLogger(loggerFunction) { AudioCodesUA.js_log = loggerFunction; }

    isInitialized() { return this._isInitialized; }

    setModes(modes = {}) {
        AudioCodesUA.ac_log(`AC: setModes() ${JSON.stringify(modes)}`);
        Object.assign(this.modes, modes);
        this._normalizeModes();
    }

    _normalizeModes() {
        function undef(v, m) { return typeof v === 'number' && v <= m ? undefined : v; }
        let m = this.modes;
        m.sbc_ha_pairs_mode = undef(m.sbc_ha_pairs_mode, 0);
        m.chrome_rtp_timeout_fix = undef(m.chrome_rtp_timeout_fix, 0);
    }

    init(autoLogin = true) {
        AudioCodesUA.ac_log(`AC: init() autoLogin=${autoLogin}`);
        if (this._isInitialized)
            return;
        this._isInitialized = true;
        JsSIP.debug.enable('JsSIP:*');
        JsSIP.debug.formatArgs = function () {
            if (AudioCodesUA.js_log)
                this.log = AudioCodesUA.js_log;
        };

        let sockets = [];
        for (let address of this.serverConfig.addresses) {
            if (address instanceof Array) { // 'address' or ['address', weight]
                sockets.push({ socket: new JsSIP.WebSocketInterface(address[0]), weight: address[1] });
            } else {
                sockets.push(new JsSIP.WebSocketInterface(address));
            }
        }

        let config = {
            sockets: sockets,
            uri: 'sip:' + this.account.user + '@' + this.serverConfig.domain,
            contact_uri: 'sip:' + this.account.user + '@' + this._randomToken(12) + '.invalid;transport=ws',
            authorization_user: this.account.authUser,
            password: this.account.password,
            register: autoLogin,
            session_timers: this.account.useSessionTimer,
            register_expires: this.account.registerExpires,
            user_agent: this.u17,
            connection_recovery_min_interval: this.reconnectMin,
            connection_recovery_max_interval: this.reconnectMax
        };

        if (this.account.displayName && this.account.displayName.length > 0) {
            config.display_name = this.account.displayName;
        }

        this.jssipUA = new JsSIP.UA(config);
        this.setRegisterExtraHeaders(this.registerExtraHeaders);
        this._setUACallbacks();

        AudioCodesUA.ac_log(`AC: applied SDK modes: ${JSON.stringify(this.modes, (k, v) => typeof v === 'undefined' ? '<undefined>' : v)}`);
        this.jssipUA.modes = this.modes;

        for (let credential of this.credentials) {
            this.jssipUA.addCredential(credential);
        }
        this.credentials = [];

        this.jssipUA.start();
    }

    deinit() {
        this._isInitialized = false;
        this.jssipUA && this.jssipUA.stop();
    }

    setRegisterExtraHeaders(extraHeaders) {
        this.registerExtraHeaders = extraHeaders;
        if (this.jssipUA) {
            let headers = extraHeaders !== null ? extraHeaders : [];
            if (this.oauthToken !== null) {
                headers = headers.slice();
                headers.push(`Authorization: Bearer ${this.oauthToken}`);
            }
            this.jssipUA.registrator().setExtraHeaders(headers);
        }
    }

    getRegisterExtraHeaders() {
        return this.registerExtraHeaders;
    }

    login() {
        AudioCodesUA.ac_log('AC: login()');
        this.jssipUA.register();
    }

    logout() {
        AudioCodesUA.ac_log('AC: logout()');
        if (this.jssipUA.isRegistered()) {
            this.jssipUA.unregister();
        }
    }

    switchSBC(unregister = true) {
        AudioCodesUA.ac_log('AC: switchSBC()');
        return this.jssipUA.switchSBC(unregister);
    }

    getNumberOfSBC() {
        return this.jssipUA.getNumberOfSBC();
    }

    // Keep alive websocket ping/pong (CRLF)
    setWebSocketKeepAlive(pingInterval, pongTimeout = true, timerThrottlingBestEffort = true, pongReport = 0, pongDist = false) {
        AudioCodesUA.ac_log(`AC: setWebSocketKeepAlive pingInterval=${pingInterval} pongTimeout=${pongTimeout}`
            + ` timerThrottlingBestEffort=${JSON.stringify(timerThrottlingBestEffort)} pongReport=${pongReport} pongDist=${pongDist}`);
        if (typeof pingInterval !== 'number' || typeof pongTimeout !== 'boolean')
            throw new TypeError('setWebSocketKeepAlive: wrong type of first or second argument');
        this.wsPingMs = this.wsOrigPingMs = pingInterval * 1000;
        this.wsPongTimeout = pongTimeout;
        this.wsPongReport = pongReport;
        this.wsPongDist = pongDist;
        this.wsPongReportCounter = 0;
        this.wsIsThrottling = false;
        let params;
        if (timerThrottlingBestEffort === true)
            params = { log: 0, chrome: { interval: 1, visibility: true, call: true, log: 1 } };
        else if (timerThrottlingBestEffort === false)
            params = { log: 0 };
        else
            params = timerThrottlingBestEffort;

        let p = params[this.browser];
        this.wsThrottlingPingMs = p && p.interval !== undefined ? p.interval * 1000 : 0;
        this.wsVisibility = p && p.visibility !== undefined ? p.visibility : false;
        this.wsCall = p && p.call !== undefined ? p.call : false;
        this.wsLog = p && p.log !== undefined ? p.log : params.log;

        this.wsPongDelays = new Array(this.wsPongReport > 0 ? this.wsPongReport : 50);
        this.wsPongDelaysIx = 0;
        if (this.wsOrigPingMs !== 0 && this.wsThrottlingPingMs !== 0 && this.wsVisibility)
            document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    }

    _pingLog() {
        return ` (ping=${this.wsPingMs / 1000} sec)`;
    }

    _visibilityLog(changed) {
        let m = 'AC: keep-alive: Page is ' + (document.hidden ? 'hidden' : 'visible');
        if (document.hidden) {
            if (this.wsCall)
                m += ', ' + (this.activeCalls === 0 ? 'no active call' : 'active call');
            m += ' and ' + (this.wsIsThrottling ? 'was' : 'was not') + ' trottling';
        }
        if (changed)
            m += this._pingLog();
        AudioCodesUA.ac_log(m);
    }

    _activeCallsLog(changed) {
        let m = `AC: keep-alive: ${this.activeCalls === 0 ? 'Call ended' : 'Call started'}`;
        if (this.activeCalls === 0) {
            if (this.wsVisibility)
                m += ', page is ' + (document.hidden ? 'hidden' : 'visible');
            else
                m + ', page visibility is ignored';
            m += ' and ' + (this.wsIsThrottling ? 'was' : 'was not') + ' trottling';
        }
        if (changed)
            m += this._pingLog();
        AudioCodesUA.ac_log(m);
    }

    _onActiveCallsChange(n) {
        this.activeCalls += n;
        if (!this.wsCall || this.wsPingMs === 0 || this.wsThrottlingPingMs === 0)
            return;
        if (this.activeCalls < 0)
            AudioCodesUA.ac_log('Warning: keep-alive: activeCalls < 0');
        if (this.activeCalls === 0) {  // open call -> no call
            if ((!this.wsVisibility || document.hidden) && this.wsIsThrottling && this.wsPingMs < this.wsThrottlingPingMs) {
                this.wsPingMs = this.wsThrottlingPingMs;
                this._activeCallsLog(true);
                return;
            }
            if (this.wsLog >= 2)
                this._activeCallsLog(false);
        } else if (this.activeCalls === 1 && n > 0) {  // no call -> open call
            if (this.wsPingMs > this.wsOrigPingMs) {
                this.wsPingMs = this.wsOrigPingMs;
                this._activeCallsLog(true);
                return;
            }
            if (this.wsLog >= 2)
                this._activeCallsLog(false);
        }
    }

    _onVisibilityChange() {
        if (!this.wsVisibility || this.wsPingMs === 0 || this.wsThrottlingPingMs === 0)
            return;
        if (document.hidden) {
            if ((this.wsCall && this.activeCalls === 0) && this.wsIsThrottling && this.wsPingMs < this.wsThrottlingPingMs) {
                this.wsPingMs = this.wsThrottlingPingMs;
                this._visibilityLog(true);
                return;
            }
            if (this.wsLog >= 2)
                this._visibilityLog(false);
        } else {
            if (this.wsPingMs > this.wsOrigPingMs) {
                this.wsPingMs = this.wsOrigPingMs;
                this._visibilityLog(true);
                return;
            }
            if (this.wsLog >= 2)
                this._visibilityLog(false);
        }
    }

    _onMessageHook(arg) {
        if (arg.data === '\r\n') {
            this._onPong();
        } else {
            this.wsOnMessage(arg);
        }
    }

    _onPong() {
        this.wsPongReceived = true;
        if (this.wsPongSupported === null) {
            AudioCodesUA.ac_log('AC: keep-alive: Server supports CRLF pong');
            this.wsPongSupported = true;
        }
        let delay;
        if (this.wsPongTimeoutTime !== null) {
            delay = Date.now() - this.wsPongTimeoutTime;
            this.wsPongTimeoutTime = null;
            AudioCodesUA.ac_log(`AC: keep-alive: Received pong that exceeded the timeout, delay=${delay}`);
        } else {
            delay = Date.now() - this.wsPingTime;
        }

        // Reset the ping timer from a networking callback to avoid Chrome timer throttling from causing timers to run once a minute
        let nextPing = this.wsPingMs - delay;
        if (nextPing < 0) {
            AudioCodesUA.ac_log(`AC: nextPing calculated to ${nextPing}ms, so resetting to 0ms.`);
            nextPing = 0;
        }
        if (this.wsPingJob !== null) {
            clearTimeout(this.wsPingJob);
        }
        this.wsPingJob = setTimeout(this._sendPing.bind(this), nextPing);

        // Save pong delays statistics.
        this.wsPongDelays[this.wsPongDelaysIx] = delay;
        this.wsPongDelaysIx = this.wsPongDelaysIx + 1;
        if (this.wsPongDelaysIx === this.wsPongDelays.length)
            this.wsPongDelaysIx = 0;
        if (this.wsPongReport > 0)
            this.wsPongReportCounter++;
    }

    _onPongTimeout(pingMs) {
        AudioCodesUA.ac_log(`AC: keep-alive: Pong timeout (not received within ${pingMs / 1000} seconds)`);
        AudioCodesUA.ac_log(`AC: keep-alive: Previous pongs statistics: ${this._createPongReport(true)}`);
        if (this.wsPongTimeout) {
            AudioCodesUA.ac_log('AC: keep-alive: Close websocket connection');
            this._stopWsKeepAlive();
            try {
                this.wsSocket.close();
            } catch (e) {
                AudioCodesUA.ac_log('AC: Close websocket error', e);
            }
        } else {
            AudioCodesUA.ac_log(`AC: keep-alive: Warning: websocket is not closed, because pongTimeout=false`);
        }
    }

    _sendPing() {
        try {
            let now = Date.now();
            if (this.wsPingTime !== null) {
                let delay = now - this.wsNextPingTime;
                if (this.wsLog >= 3)
                    AudioCodesUA.ac_log(`AC: keep-alive: timer deviation (ms): ${delay}`);
                let pingMs = this.wsPingMs;
                if (Math.abs(delay) >= 10000) {
                    if (this.wsLog > 0 || !this.wsIsThrottling) {
                        AudioCodesUA.ac_log(`AC: keep-alive detected timer throttling: ${Math.round(delay / 1000)} seconds ${delay > 0 ? 'later' : 'earlier'}`);
                        if (this.wsLog === 0)
                            AudioCodesUA.ac_log('AC: keep-alive: The next timer throttling will not be shown in the logs, because log==0');
                    }
                    this.wsIsThrottling = true;
                    if (this.wsPingMs < this.wsThrottlingPingMs) {
                        this.wsPingMs = this.wsThrottlingPingMs;
                        AudioCodesUA.ac_log(`AC: keep-alive: ping interval increased ${this._pingLog()}`);
                    }
                }
                if (this.wsPongSupported === null && !this.wsPongReceived) {
                    AudioCodesUA.ac_log('AC: keep-alive: Server does not support CRLF pong.');
                    this.wsPongSupported = false;
                }
                if (this.wsPongSupported && !this.wsPongReceived && this.wsPongTimeoutTime === null) {
                    this._onPongTimeout(pingMs);
                    if (this.wsPongTimeout)
                        return;
                    this.wsPongTimeoutTime = this.wsPingTime;
                }
            }
            this.wsPingTime = now;
            this.wsNextPingTime = this.wsPingTime + this.wsPingMs;
            this.wsPongReceived = false;
            if (this.wsSocket.readyState === WebSocket.OPEN) {
                //AudioCodesUA.ac_log('AC: send ping');
                this.wsSocket.send('\r\n\r\n');
            } else {
                AudioCodesUA.ac_log(`AC: keep-alive: Warning: Cannot send Ping, websocket state=${this.wsSocket.readyState}`);
            }
            this.wsPingJob = setTimeout(this._sendPing.bind(this), this.wsPingMs);
            if (this.wsPongReport > 0 && this.wsPongReportCounter >= this.wsPongReport) {
                this.wsPongReportCounter = 0;
                AudioCodesUA.ac_log(`AC: keep-alive: Pong statistics: ${this._createPongReport(this.wsPongDist)}`);
            }
        } catch (e) {
            AudioCodesUA.ac_log('AC: keep-alive: send ping error', e);
        }
    }

    _startWsKeepAlive(websocket) {
        this.wsSocket = websocket;
        if (this.wsPingMs === 0)
            return;
        this.wsOnMessage = websocket.onmessage;
        websocket.onmessage = this._onMessageHook.bind(this);
        this._stopWsKeepAlive();
        this.wsPingTime = null;
        this.wsPingJob = setTimeout(this._sendPing.bind(this), this.wsPingMs);
    }

    _stopWsKeepAlive() {
        if (this.wsPingJob !== null) {
            clearTimeout(this.wsPingJob);
            this.wsPingJob = null;
        }
    }

    _createPongReport(dist) {
        let dval;
        let dstr = '';
        let dover = false;
        let min = 1000000;
        let max = 0;
        if (dist)
            dval = new Array(this.wsPingMs / 1000 * 4).fill(0);
        let pongs = 0;
        for (let ix = 0; ix < this.wsPongDelays.length; ix++) {
            let delay = this.wsPongDelays[ix];
            if (delay === undefined)
                continue;
            pongs++;
            if (delay < min)
                min = delay;
            if (delay > max)
                max = delay;
            if (dist) {
                let n = Math.floor(delay / 250);
                if (n >= dval.length) {
                    n = dval.length - 1;
                    dover = true;
                }
                dval[n]++;
            }
        }
        if (dist) {
            dstr = '\r\npongs distribution (1/4 second step): ';
            for (let i = 0; i < dval.length; i++) {
                dstr += dval[i].toString();
                if (i !== dval.length - 1)
                    dstr += (i + 1) % 4 === 0 ? ',' : ' ';
            }
            if (dover)
                dstr += ' (+)';
        }
        return `pongs=${pongs} delay=${min}..${max} ms${dstr}`;
    }
    // end of ping/pong keep-alive

    // Catch some JsSIP events, and call corresponding API callbacks.
    _setUACallbacks() {
        this.jssipUA.on('connected', (e) => {
            AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "connected"');
            this._startWsKeepAlive(e.socket.socket._ws);
            this.listeners.loginStateChanged(false, 'connected', null);
        });

        this.jssipUA.on('disconnected', () => {
            this._stopWsKeepAlive();
            AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "disconnected"');
            this.listeners.loginStateChanged(false, 'disconnected', null);
        });

        this.jssipUA.on('registered', (e) => {
            AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=true "login"');
            this.listeners.loginStateChanged(true, 'login', e.response);
        });

        this.jssipUA.on('unregistered', (e) => {
            AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "logout"');
            this.listeners.loginStateChanged(false, 'logout', e.response);
        });

        this.jssipUA.on('registrationFailed', (e) => {
            let statusCode = e.response ? e.response.status_code : 0;

            if (statusCode >= 300 && statusCode < 400) {
                let contact = e.response.parseHeader('contact');
                if (contact) {
                    let cu = contact.uri;
                    let url = 'wss://' + cu.host;
                    if (cu.port && cu.port !== 443) {
                        url += ':' + cu.port.toString();
                    }
                    AudioCodesUA.ac_log(`AC: registerRedirect("${url}")`);
                    if (this.jssipUA.registerRedirect(url))
                        return; // skip 'login failed' callback
                } else {
                    AudioCodesUA.ac_log('AC: 3xx response without "Contact" is ignored');
                }
            } else if (statusCode >= 500 && statusCode < 600 && AudioCodesUA.instance.modes.sbc_switch_register5xx_mode) {
                if (AudioCodesUA.instance.switchSBC(false))
                    return; // skip 'login failed', 'logout' callbacks
            }

            AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "login failed"');
            this.listeners.loginStateChanged(false, 'login failed', e.response ? e.response : null);
        });

        if (this.listeners.incomingMessage) {
            this.jssipUA.on('newMessage', (e) => {
                if (e.originator !== 'remote')
                    return; // ignore outgoing message.
                AudioCodesUA.ac_log('AC>>: incomingMessage', e);
                // null, from, content-type?, body?, request
                this.listeners.incomingMessage(null, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);
            });
        }

        if (this.listeners.incomingNotify) {
            this.jssipUA.on('sipEvent', (e) => {
                AudioCodesUA.ac_log('AC>>: incoming out of dialog NOTIFY', e);
                // null, event, from, content-type? , body?, request
                let taken = this.listeners.incomingNotify(null, e.event ? e.event.event : null, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);
                if (!taken) {
                    e.request.reply(481);
                }
            });
        }

        if (this.listeners.incomingSubscribe) {
            this.jssipUA.on('newSubscribe', (e) => {
                let subs = e.request;
                let ev = subs.parseHeader('event');
                let accepts = subs.getHeaders('accept');
                AudioCodesUA.ac_log('AC>>: incomingSubscribe', subs, ev.event, accepts);
                let code = this.listeners.incomingSubscribe(subs, ev.event, accepts);
                if (code > 0)
                    subs.reply(code);
            });
        }

        this.jssipUA.on('newRTCSession', function (e) {
            AudioCodesUA.ac_log(`AC: event ${e.originator === 'remote' ? 'incoming' : 'outgoing'} "newRTCSession"`, e);
            let call = new AudioCodesSession(e.session);
            // In-dialog incoming NOTIFY.
            // Works only in modified jssip where added the event
            call.js_session.on('sipEvent', function (e) {
                if (!AudioCodesUA.instance.listeners.incomingNotify)
                    return;
                let ac_session = this.data.ac_session;
                AudioCodesUA.ac_log('AC>>: incoming NOTIFY', ac_session, e);
                // call?, event, from, content-type? , body?, request. return true when notify accepted.
                e.taken = AudioCodesUA.instance.listeners.incomingNotify(ac_session, e.event ? e.event.event : null, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);
            });

            call.js_session.on('newInfo', function (e) {
                if (!AudioCodesUA.instance.listeners.incomingInfo)
                    return;
                if (e.originator === 'local')
                    return;
                let ac_session = this.data.ac_session;
                AudioCodesUA.ac_log('AC>>: incoming INFO', ac_session, e);
                // call, from, content-type? , body?, request
                AudioCodesUA.instance.listeners.incomingInfo(ac_session, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);
            });

            call.js_session.on('replaces', function (e) {
                AudioCodesUA.instance.replacedCall = this.data.ac_session;
                AudioCodesUA.ac_log('AC>>: incoming INVITE with Replaces. This call will be replaced:', this.data.ac_session);
                e.accept();
            });

            call.js_session.on('sdp', function (e) {
                AudioCodesUA.instance._sdp_checking(this, e);
            });

            call.js_session.on('connecting', function (r) {
                AudioCodesUA.ac_log('AC>>: connecting');
                let filter = AudioCodesUA.instance.codecFilter;
                if (filter) {
                    AudioCodesUA.instance._cf_filter('audio', this.data.ac_session, filter.audio);
                    AudioCodesUA.instance._cf_filter('video', this.data.ac_session, filter.video);
                }
            });

            call.js_session.on('reinvite', function (e) {
                if (!AudioCodesUA.instance.listeners.callIncomingReinvite)
                    return;
                let ac_session = this.data.ac_session;
                AudioCodesUA.ac_log('AC>>: callIncomingReinvite start');
                AudioCodesUA.instance.listeners.callIncomingReinvite(ac_session, true, e.request);
                e.callback = function () {
                    AudioCodesUA.ac_log('AC>>: callIncomingIncomingReinvite end');
                    AudioCodesUA.instance.listeners.callIncomingReinvite(ac_session, false, null);
                }
            });

            call.js_session.on('hold', function (e) {
                let ac_session = this.data.ac_session;
                let isRemote = e.originator === 'remote';
                AudioCodesUA.ac_log(`AC>>: callHoldStateChanged isHold=true isRemote=${isRemote} session:`, ac_session);
                AudioCodesUA.instance.listeners.callHoldStateChanged(ac_session, true, isRemote);
            });

            call.js_session.on('unhold', function (e) {
                let ac_session = this.data.ac_session;
                let isRemote = e.originator === 'remote';
                AudioCodesUA.ac_log(`AC>>: callHoldStateChanged isHold=false isRemote=${isRemote} session:`, ac_session);
                AudioCodesUA.instance.listeners.callHoldStateChanged(ac_session, false, isRemote);
            });

            call.js_session.on('progress', function (e) {
                if (e.originator === 'remote') {
                    let ac_session = this.data.ac_session;
                    AudioCodesUA.ac_log('AC>>: outgoingCallProgress', ac_session);
                    AudioCodesUA.instance.listeners.outgoingCallProgress(ac_session, e.response);
                }
            });

            call.js_session.on('failed', function (e) {
                let ac_session = this.data.ac_session;
                let contact = null;
                if (e.cause === 'Redirected' && e.message && e.message.headers) {
                    let nameAddress = e.message.parseHeader('Contact');
                    if (nameAddress) {
                        contact = nameAddress.uri.toString();
                    }
                }
                AudioCodesUA.ac_log('AC>>: callTerminated (failed)', ac_session, e.cause, contact);
                AudioCodesUA.instance.listeners.callTerminated(ac_session, e.message, e.cause, contact);
            });

            call.js_session.on('accepted', function (e) {
                let ac_session = this.data.ac_session;
                ac_session.data['_accepted'] = true; // means sent or received OK
                if (e.originator === 'remote') { // Outgoing call
                    ac_session.data['_ok_response'] = e.response;
                }
            });

            // Remove listener that close replaced session when replaces confirmed
            if (e.originator === 'remote' && AudioCodesUA.instance.replacedCall !== null)
                call.js_session.removeAllListeners('confirmed');

            call.js_session.on('confirmed', function () {
                let ac_session = this.data.ac_session;
                let okResponse = null;
                let cause;
                if ('_ok_response' in ac_session.data) {
                    okResponse = ac_session.data['_ok_response'];
                    delete ac_session.data['_ok_response'];
                    cause = 'ACK sent';
                } else {
                    cause = 'ACK received';
                }

                // Video call /audio answer, no sound on answer side issue. Firefox workaround
                if (call.data['_video_call_audio_answer_firefox']) {
                    call.data['_video_call_audio_answer_firefox'] = false;
                    AudioCodesUA.ac_log('AC: [video call/audio answer] Firefox workaround. Send re-INVITE');
                    call.sendReInvite({ showStreams: true });
                }
                AudioCodesUA.ac_log('AC>>: callConfirmed', ac_session, cause);
                AudioCodesUA.instance._onActiveCallsChange.call(AudioCodesUA.instance, 1);
                AudioCodesUA.instance.listeners.callConfirmed(ac_session, okResponse, cause);
            });

            call.js_session.on('ended', function (e) {
                let ac_session = this.data.ac_session;
                if (ac_session.data['_screenSharing']) {
                    ac_session._onEndedScreenSharing.call(ac_session, 'call terminated');
                }
                AudioCodesUA.ac_log('AC>>: callTerminated (ended)', ac_session, e.cause);
                AudioCodesUA.instance._onActiveCallsChange.call(AudioCodesUA.instance, -1);
                AudioCodesUA.instance.listeners.callTerminated(ac_session, e.message, e.cause);
            });

            call.js_session.on('refer', function (e) {
                if (!AudioCodesUA.instance.listeners.transfereeCreatedCall) {
                    AudioCodesUA.ac_log('AC>>: incoming REFER rejected, because transfereeCreatedCall is not set');
                    e.reject();
                } else {
                    let ac_session = this.data.ac_session;
                    let accept;
                    if (AudioCodesUA.instance.listeners.transfereeRefer) {
                        accept = AudioCodesUA.instance.listeners.transfereeRefer(ac_session, e.request);
                    } else {
                        accept = true;
                    }
                    if (accept) {
                        AudioCodesUA.ac_log('AC>>: incoming REFER accepted');
                        // Set new call video according current call
                        let sendVideo;
                        if (ac_session.isScreenSharing()) {
                            sendVideo = ac_session.doesScreenSharingReplaceCamera();
                        } else {
                            sendVideo = ac_session.hasSendVideo();
                        }
                        let options = AudioCodesUA.instance._callOptions(sendVideo, true);
                        e.accept((e) => { e.data['_created_by_refer'] = ac_session; }, options);
                    } else {
                        AudioCodesUA.ac_log('AC>>: incoming REFER rejected');
                        e.reject();
                    }
                }
            });

            // Set the call flag according phone setting.
            call._setEnabledReceiveVideo(AudioCodesUA.instance.enableAddVideo);

            // If connection is already exists set listener.
            // otherwise wait until connection will be created.
            if (call.js_session.connection) {
                AudioCodesUA.instance._set_connection_listener(call);
                AudioCodesUA.ac_log('AC: connection exists, set "track" listener');
            } else {
                AudioCodesUA.ac_log('AC: peer connection does not exist, wait creation');
                call.js_session.on('peerconnection', () => {
                    AudioCodesUA.instance._set_connection_listener(call);
                    AudioCodesUA.ac_log('AC: [event connection] connection created, set "track" listener');
                });
            }

            let remote;
            if (e.originator === 'remote') {
                remote = e.request.from;
            } else {
                remote = e.request.to;
            }

            // set call data
            call.data['_user'] = remote.uri.user;
            call.data['_host'] = remote.uri.host;
            call.data['_display_name'] = remote.display_name; // optional
            call.data['_create_time'] = new Date();

            if (e.originator === 'remote') {
                let replacedCall = null;
                if (AudioCodesUA.instance.replacedCall !== null) {
                    replacedCall = AudioCodesUA.instance.replacedCall;
                    AudioCodesUA.instance.replacedCall = null;
                }

                // Incoming call. Set video flags according m=video in SDP.
                let send, recv, hasSDP;
                if (e.request.body) {
                    hasSDP = true;
                    let sdp = new AudioCodesSDP(e.request.body);
                    [send, recv] = sdp.getMediaDirection('video', true);
                } else {
                    hasSDP = false;
                    call.data['_incoming_invite_without_sdp'] = true;
                    send = recv = true; // to enable answer with or without video.
                    AudioCodesUA.ac_log('AC: warning incoming INVITE without SDP');
                }
                call._setVideoState(send, recv);

                AudioCodesUA.ac_log(`AC>>: incomingCall ${call.hasVideo() ? 'video' : 'audio'} from "${call.data._display_name}" ${call.data._user}`, call, replacedCall);
                AudioCodesUA.instance.listeners.incomingCall(call, e.request, replacedCall, hasSDP);
            } else { // e.originator === 'local'
                if (call.js_session.data['_created_by_refer']) {
                    AudioCodesUA.ac_log('AC>>: outgoing call created by REFER');
                    call.data['_created_by_refer'] = call.js_session.data['_created_by_refer'];
                    AudioCodesUA.instance.listeners.transfereeCreatedCall(call);
                } else {
                    AudioCodesUA.ac_log('AC>>: outgoing call created by phone.call()');
                }
            }
        });
    }

    _get_from(msg) {
        return {
            user: msg.from.uri.user,
            host: msg.from.uri.host,
            displayName: msg.from.display_name ? msg.from.display_name : null
        };
    }

    _get_content_type(msg) {
        let ct = msg.headers['Content-Type'];
        return (ct && ct.length > 0) ? ct[0].parsed : null;
    }

    _set_connection_listener(call) {
        AudioCodesUA.instance.getWR().connection.addEventListener(call.js_session.connection, 'track', (e) => {
            AudioCodesUA.ac_log(`AC>>: "track" event kind= ${e.track.kind}`, e);
            // save call remote stream
            if (e.streams.length > 0) { // if track is in stream
                let stream = e.streams[0];
                AudioCodesUA.ac_log(`AC: set call remote stream id=${stream.id}`, call);
                call.data['_remoteMediaStream'] = stream;
            } else {
                AudioCodesUA.ac_log('AC: Warning "track" event without stream');
            }
            if (e.track.kind === 'video') {
                if (!call.hasEnabledReceiveVideo()) {
                    // Video call - audio answer, no sound on answer side issue. Patch for Safari.
                    if (call.data['_video_call_audio_answer_safari']) {
                        e.track.onmute = () => {
                            AudioCodesUA.ac_log('AC: [video call/audio answer] Safari fix. Fired video track "mute" event.  Call callShowStream');
                            e.track.onmute = null;
                            let localStream = call.getRTCLocalStream();
                            let remoteStream = call.getRTCRemoteStream();
                            AudioCodesUA.ac_log('AC>>: callShowStreams', call, localStream, remoteStream);
                            AudioCodesUA.instance.listeners.callShowStreams(call, localStream, remoteStream);
                        }
                        AudioCodesUA.ac_log('AC: [video call/audio answer] Safari fix. Set video track "mute" event listener');
                        call.data['_video_call_audio_answer_safari'] = false;
                    }

                    AudioCodesUA.ac_log('AC>>: event "track" video and !hasEnabledReceiveVideo therefore change transceiver direction.', call);
                    let vt = AudioCodesUA.instance.getWR().connection.getTransceiver(call.js_session.connection, 'video');
                    if (vt !== null) {
                        let dir = call.hasEnabledSendVideo() ? 'sendonly' : 'inactive';
                        AudioCodesUA.instance.getWR().transceiver.setDirection(vt, dir);
                    }
                }

                if (AudioCodesUA.instance.codecFilter) {
                    AudioCodesUA.instance._cf_filter('video', call, AudioCodesUA.instance.codecFilter.video);
                }

                // No call callShowStreams() for event 'track' video, because we use the same stream for audio and video.
                // and to prevent calling callShowStreams twice and use wrong video flags.
                return;
            }
            let localStream = call.getRTCLocalStream();
            let remoteStream = call.getRTCRemoteStream();
            AudioCodesUA.ac_log('AC>>: callShowStreams', call, localStream, remoteStream);
            AudioCodesUA.instance.listeners.callShowStreams(call, localStream, remoteStream);
        });
    }

    /* 
       SDP may change with every new browser release and modified by SBC
       We do not edit the SDP in client to avoid chaos.
       However, it could be useful for testing
           
    // Remove ICE candidates with with a type different from 'relay'
    _sdp_editing(sdp) {
        for (let mIndex = 0; mIndex < sdp.media.length; mIndex++) {
            let media = sdp.media[mIndex];
            let modifiedMedia = [];
            for (let i = 0; i < media.length; i++) {
                let line = media[i];
                if (line.startsWith('a=candidate:')) {
                    // a=candidate:1467250027 1 udp 2122260223 192.168.0.196 46243 typ host generation 0
                    let tokens = line.split(' ');
                    if (tokens[7] === 'relay') {
                        modifiedMedia.push(line);
                    } else {
                        AudioCodesUA.ac_log('Removed line:' + line);
                    }
                } else {
                    modifiedMedia.push(line);
                }
            }
            sdp.media[mIndex] = modifiedMedia;
        }
        return sdp.toString();
    }
     
    // Usage:
    e.sdp = AudioCodesUA.instance._sdp_editing(sdp);
    */

    /**
     * Chrome WebRTC engine check if current SDP compatible with previous SDP.
     * Chrome exception is almost unreadable, e.g: 
     * "Failed to set local answer sdp: Failed to set local audio description recv parameters for m-section with mid='0'"
     * The function compare current and previous remote SDP and print warnings.
     */
    _check_remote_sdp(sdp, data) {
        try {
            if (!data.codec_map) {
                data.codec_map = {};
            }
            let mAudio = sdp.getMedia('audio');
            AudioCodesUA.instance._check_remote_m(mAudio, data.codec_map);

            let mVideo = sdp.getMedia('video');
            if (mVideo) {
                AudioCodesUA.instance._check_remote_m(mVideo, data.codec_map);
            }
        } catch (e) {
            AudioCodesUA.ac_log('AC:SDP exception', e);
        }
    }

    _check_remote_m(m, previous) {
        // Collect current SDP information
        // pt : { rtpmap:xxx, [fmtp: yyy] }
        let current = {};
        function parse(offset, str) {
            let ix = str.indexOf(' ', offset);
            if (ix === -1)
                return ['?', '?'];
            return [str.substring(offset, ix), str.substring(ix + 1).toLowerCase()];
        }

        for (let l of m) {
            if (l.startsWith('a=rtpmap:')) {
                let [pt, rtpmap] = parse(9, l);
                if (!current[pt])
                    current[pt] = {};
                current[pt].rtpmap = rtpmap;
            } else if (l.startsWith('a=fmtp:')) {
                let [pt, fmtp] = parse(7, l);
                if (!current[pt])
                    current[pt] = {};
                current[pt].fmtp = fmtp;
            }
        }

        // AudioCodesUA.ac_log(`current ` + JSON.stringify(current, null, 2));
        // AudioCodesUA.ac_log(`previous ` + JSON.stringify(previous, null, 2));

        // Compare current SDP information with previous one.
        for (let pt of Object.keys(current)) {
            if (previous[pt]) {
                if (current[pt].rtpmap === previous[pt].rtpmap) {
                    if (current[pt].fmtp !== previous[pt].fmtp) {
                        AudioCodesUA.ac_log(`AC:SDP [The same payload type and codec name, different fmtp] pt=${pt} rtpmap=${current[pt].rtpmap} fmtp=${current[pt].fmtp}, previously was fmtp=${previous[pt].fmtp}`);
                    }
                } else {
                    // Check that used dynamic payload type or both rtpmat is defined.
                    if (parseInt(pt) >= 64 || (!!current[pt].rtpmap && !!previous[pt].rtpmap)) {
                        AudioCodesUA.ac_log(`AC:SDP [The same payload type, different codec names] pt=${pt} rtpmap=${current[pt].rtpmap}, previously was rtpmap=${previous[pt].rtpmap}`);
                    }
                }
            } else {
                let data = current[pt];
                let foundPt;
                for (let [pt1, data1] of Object.entries(previous)) {
                    if (data.rtpmap === data1.rtpmap && data.fmtp === data1.fmtp) {
                        foundPt = pt1;
                        break;
                    }
                }
                if (foundPt) {
                    let prevData = previous[foundPt];
                    if (!data.fmtp && !prevData.fmtp) {
                        AudioCodesUA.ac_log(`AC:SDP [The same codec name used with different payload types] pt=${pt} rtpmap=${data.rtpmap}, previously was pt=${foundPt} rtpmap=${prevData.rtpmap}`);
                    } else {
                        AudioCodesUA.ac_log(`AC:SDP [The same codec name used with different payload types] pt=${pt} rtpmap=${data.rtpmap} fmtp=${data.fmtp}, previously was pt=${foundPt} rtpmap=${prevData.rtpmap} fmtp=${prevData.fmtp}`);
                    }
                } else {
                    previous[pt] = data;
                }
            }
        }
    }

    _sdp_checking(js_session, e) {
        let type = e.originator + ' ' + e.type;
        let ac_session = js_session.data.ac_session;
        let sdp, send, recv;
        try {
            sdp = new AudioCodesSDP(e.sdp);
            [send, recv] = sdp.getMediaDirection('video', e.originator === 'remote');
        } catch (e) {
            AudioCodesUA.ac_log('AC: cannot parse SDP', e);
            return;
        }
        let initial = ac_session.data._initial;
        if (e.type === 'answer') // after 1st answer it's not initial SDP negotiation.
            ac_session.data._initial = false;

        AudioCodesUA.ac_log(`AC: Event "sdp" ${initial ? 'initial' : ''} ${type}   Session state:${AudioCodesUA.getSessionStatusName(js_session._status)}`);
        switch (type) {
            case 'remote offer':
                if (AudioCodesUA.instance.modes.check_remote_sdp_mode) {
                    AudioCodesUA.instance._check_remote_sdp(sdp, js_session.data);
                }
                break;

            case 'remote answer':
                if (AudioCodesUA.instance.modes.check_remote_sdp_mode) {
                    AudioCodesUA.instance._check_remote_sdp(sdp, js_session.data);
                }
                if (ac_session.isLocalHold() || ac_session.isRemoteHold())
                    break; // ignore hold re-INVITE
                ac_session._setVideoState(send, recv);
                break;

            case 'local offer':
                if (AudioCodesUA.instance.networkPriority) {
                    AudioCodesUA.instance._set_senders_dscp(js_session);
                }
                break;

            case 'local answer':
                if (ac_session.isLocalHold() || ac_session.isRemoteHold())
                    break;  // ignore hold re-INVITE
                if (AudioCodesUA.instance.networkPriority) {
                    AudioCodesUA.instance._set_senders_dscp(js_session);
                }
                ac_session._setVideoState(send, recv);
                break;
        }
    }

    _set_senders_dscp(js_session) {
        if (AudioCodesUA.instance.browser !== 'chrome')
            return;
        AudioCodesUA.ac_log('AC: _set_senders_dscp()');
        let priority = AudioCodesUA.instance.networkPriority;
        AudioCodesUA.instance._set_dscp(js_session, 'audio', priority);
        AudioCodesUA.instance._set_dscp(js_session, 'video', priority);
    }

    _set_dscp(js_session, type, priority) {
        let conn = js_session.connection;
        let tr = AudioCodesUA.instance.getWR().connection.getTransceiver(conn, type);
        if (!tr && type === 'video')
            return Promise.resolve(false);
        return Promise.resolve()
            .then(() => {
                let params = tr.sender.getParameters();
                if (!params)
                    throw new Error('sender getParameters() returns undefined');
                let encodings = params.encodings;
                if (!encodings)
                    throw new Error('parameters encodings is undefined');
                if (encodings.length === 0)
                    throw new Error('parameters encodings is empty array');
                let previous = encodings[0].networkPriority;
                if (!previous)
                    throw new Error('parameters encodings networkPriority is undefined');
                if (previous === priority)
                    return true; // nothing to do.
                encodings[0].networkPriority = priority;
                return tr.sender.setParameters(params)
                    .then(() => {
                        AudioCodesUA.ac_log(`AC: DSCP: ${type} "${priority}"`);
                        return true;
                    });
            })
            .catch(e => {
                AudioCodesUA.ac_log(`AC: DSCP: ${type} error: ${e}`);
                return false;
            });
    }

    // Codec filter
    _cf_unpack(obj) {
        // Unpack 'pcmu', 'pcmu/8000'  'VP9#profile-id=0'
        function unpack(type, s) {
            let slash = s.indexOf('/');
            let num = s.indexOf('#');
            let end;
            end = (slash !== -1) ? slash : (num !== -1 ? num : undefined);
            let res = { mimeType: (type + '/' + s.substring(0, end)).toLowerCase() };
            if (slash !== -1) {
                end = (num !== -1) ? num : undefined;
                res.clockRate = parseInt(s.substring(slash + 1, end));
            }
            if (num !== -1) {
                res.sdpFmtpLine = s.substring(num + 1);
            }
            return res;
        }
        if (!obj)
            return null;
        let result = {};
        for (let type in obj) {
            result[type] = {};
            for (let op in obj[type]) {
                result[type][op] = obj[type][op].map(s => unpack(type, s));
            }
        }
        return result;
    }

    _cf_pack(codecs) {
        function pack(c) {
            let r = c.mimeType.substring(6).toLowerCase();
            if (c.clockRate)
                r += '/' + c.clockRate;
            if (c.sdpFmtpLine)
                r += '#' + c.sdpFmtpLine;
            return r;
        }
        return codecs.map(c => pack(c));
    }

    _cf_str(codecs) {
        return JSON.stringify(AudioCodesUA.instance._cf_pack(codecs));
    }

    _cf_match(codec, filters) {
        let mimeType = codec.mimeType.toLowerCase();
        for (let filter of filters) {
            if (filter.mimeType === mimeType) {
                if (filter.clockRate && filter.clockRate !== codec.clockRate)
                    continue;
                if (filter.sdpFmtpLine && filter.sdpFmtpLine !== codec.sdpFmtpLine)
                    continue;
                return true;
            }
        }
        return false;
    }

    _cf_find(filter, codecs) {
        let found = [];
        for (let codec of codecs) {
            let mimeType = codec.mimeType.toLowerCase();
            if (filter.mimeType === mimeType) {
                if (filter.clockRate && filter.clockRate !== codec.clockRate)
                    continue;
                if (filter.sdpFmtpLine && filter.sdpFmtpLine !== codec.sdpFmtpLine)
                    continue;
                found.push(codec);
            }
        }
        return found;
    }

    _cf_filter(type, call, filter) {
        if (!filter)
            return;
        // Used once for audio and once for video 
        if (call.data[`_used_${type}_codec_filter`])
            return;
        try {
            let conn = call.getRTCPeerConnection();
            let transceiver = AudioCodesUA.instance.getWR().connection.getTransceiver(conn, type);
            if (!transceiver) {
                if (type === 'audio')
                    AudioCodesUA.ac_log('AC: codec-filter: cannot get audio transceiver');
                return;
            }

            call.data[`_used_${type}_codec_filter`] = true;

            if (!RTCRtpSender.getCapabilities || !RTCRtpReceiver.getCapabilities || !transceiver.setCodecPreferences) {
                AudioCodesUA.ac_log(`AC: codec-filter is not supported.`);
                return;
            }
            let sndCodecs = RTCRtpSender.getCapabilities(type).codecs;
            let rcvCodecs = RTCRtpReceiver.getCapabilities(type).codecs;

            let uniqRcvCodecs = [];
            for (let rc of rcvCodecs) {
                let ix = sndCodecs.findIndex(sc => rc.mimeType === sc.mimeType && rc.clockRate === sc.clockRate && rc.sdpFmtpLine === sc.sdpFmtpLine);
                if (ix === -1)
                    uniqRcvCodecs.push(rc);
            }

            /*
            AudioCodesUA.ac_log(`AC: ${type} codec-filter original [sender]: ${AudioCodesUA.instance._cf_str(sndCodecs)}`);
            AudioCodesUA.ac_log(`AC: ${type} codec-filter original [receiver]: ${AudioCodesUA.instance._cf_str(rcvCodecs)}`);
            AudioCodesUA.ac_log(`AC: ${type} codec-filter original [unique receiver]: ${AudioCodesUA.instance._cf_str(uniqRcvCodecs)}`);
            */

            let codecs = sndCodecs.concat(uniqRcvCodecs);
            AudioCodesUA.ac_log(`AC: ${type} codec-filter original: ${AudioCodesUA.instance._cf_str(codecs)}\n(receiver: ${uniqRcvCodecs.length})`);

            if (filter.remove && filter.remove.length > 0) {
                let len0 = codecs.length;
                codecs = codecs.filter((codec) => !AudioCodesUA.instance._cf_match(codec, filter.remove));
                if (codecs.length < len0) {
                    AudioCodesUA.ac_log(`AC: ${type} codec-filter remaining: ${AudioCodesUA.instance._cf_str(codecs)}`);
                }
            }

            if (filter.priority && filter.priority.length > 0) {
                let newCodecs = [];
                for (let cf of filter.priority) {
                    let found = AudioCodesUA.instance._cf_find(cf, codecs);
                    if (found.length === 0)
                        continue;
                    newCodecs = newCodecs.concat(found);
                    codecs = codecs.filter(codec => !found.includes(codec));
                }
                codecs = newCodecs.concat(codecs);
                AudioCodesUA.ac_log(`AC: ${type} codec-filter changed priority: ${AudioCodesUA.instance._cf_str(codecs)}`);
            }

            transceiver.setCodecPreferences(codecs);
            return;
        } catch (e) {
            AudioCodesUA.ac_log('AC: codec filter exception', e);
            return;
        }
    }
    // end of codec filter

    _convertIceList(ices) {
        let result = [];
        for (let entry of ices) {
            // convert short form of stun server to object
            if (typeof entry === 'string') {
                entry = { 'urls': 'stun:' + entry };
            }
            result.push(entry);
        }
        return result;
    }

    _randomToken(size) {
        let t = '';
        for (let i = 0; i < size; i++)
            t += Math.floor(Math.random() * 36).toString(36);
        return t;
    }

    _detectBrowser() {
        try {
            let ua = navigator.userAgent;
            this.browser = 'other';
            this.browserName = ua;
            this.browserVersion = 0;
            if (navigator.mozGetUserMedia) {
                this.browser = 'firefox'
                this.browserName = ua.match(/Firefox\/([.\d]+)$/)[0];
                this.browserVersion = parseInt(ua.match(/Firefox\/(\d+)\./)[1], 10);
            } else if (navigator.webkitGetUserMedia) { // Only works for secure connection.
                this.browser = 'chrome';
                this.browserName = ua.match(/Chrom(e|ium)\/([\d]+)/)[0];
                this.browserVersion = parseInt(ua.match(/Chrom(e|ium)\/(\d+)\./)[2], 10);
                // Detect known Chromium based browsers: Edge, Opera etc - classified as 'chrome'
                let ual = ua.toLowerCase();
                for (let ix = 0; ix < this.chromiumBased.length; ix++) {
                    let s = this.chromiumBased[ix].s;
                    let f = ual.indexOf(s);
                    if (f !== -1) {
                        let v = ual.substring(f + s.length).match(/([.\d]+)/)[1];
                        this.browserName += ' (' + this.chromiumBased[ix].n + '/' + v + ')';
                        break;
                    }
                }
            } else if (window.safari) {
                this.browser = 'safari';
                this.browserName = 'Safari/' + ua.match(/Version\/([.\d]+)/)[1];
                this.browserVersion = parseInt(ua.match(/Version\/(\d+)\./)[1], 10);
            } else if (ua.indexOf('Edge/') !== -1) { // legacy Edge
                this.browser = 'other';
                this.browserName = ua.match(/Edge\/([.\d]+)/)[0];
                this.browserVersion = parseInt(ua.match(/Edge\/(\d+).(\d+)$/)[2], 10);
            }

            if (/iPad|iPhone|iPod/.test(ua)) {
                this.browserName = ua;
                if (ua.includes('CriOS')) {
                    this.browser = 'chrome';
                    this.browserVersion = parseInt(ua.match(/CriOS\/(\d+)\./)[1], 10);
                } else if (ua.includes('FxiOS')) {
                    this.browser = 'firefox';
                    this.browserVersion = parseInt(ua.match(/FxiOS\/(\d+)\./)[1], 10);
                } else {
                    this.browser = 'safari';
                    this.browserVersion = parseInt(ua.match(/Version\/(\d+)\./)[1], 10);
                }
            }
        } catch (e) {
            AudioCodesUA.ac_log('AC: Browser detection error', e);
            this.browser = 'other';
            this.browserName = navigator.userAgent;
            this.browserVersion = 0;
        }
    }

    // windows,android,macos,ios,linux,other
    _detectOS() {
        this._detectOS1();
        if (this.os !== 'other')
            return;
        this._detectOS2();
    }

    _detectOS1() {
        try {
            let p = navigator.userAgentData ? navigator.userAgentData.platform : false;
            if (!p)
                return;
            p = p.toLowerCase();
            if (p === 'windows' || p === 'linux' || p === 'android' || p === 'macos')
                this.os = p;
        } catch (e) {
            AudioCodesUA.ac_log('AC: detectOS1 error', e);
            this.os = 'other';
        }
    }

    _detectOS2() {
        try {
            let p = navigator.platform;
            if (!p)
                return;
            p = p.toLowerCase();
            if (p.startsWith('win')) {
                this.os = 'windows';
            } else if (p.startsWith('android')) {
                this.os = 'android';
            } else if (p.startsWith('linux')) {
                if (navigator.userAgent.includes('Android')) {
                    this.os = 'android'; // for Android Firefox
                } else {
                    this.os = 'linux';
                }
            } else if (p.startsWith('mac')) {
                this.os = 'macos';
            } else if (/ipad|iphone|ipod/.test(p)) {
                this.os = 'ios';
            }
        } catch (e) {
            AudioCodesUA.ac_log('AC: detectOS2 error', e);
            this.os = 'other';
        }
    }

    _mediaConstraints(sendVideo) {
        let inst = AudioCodesUA.instance;
        let constraints = { 'audio': inst.constraints.audio };
        if (sendVideo) {
            constraints.video = inst.constraints.video;
        }
        return constraints;
    }

    _callOptions(sendVideo, isOutgoing, extraHeaders = null, extraOptions = null) {
        let options = {};
        let inst = AudioCodesUA.instance;

        // No need since Chrome 102, see: https://groups.google.com/g/discuss-webrtc/c/85e-f_siCws
        if (inst.browser === 'chrome' && inst.networkPriority) {
            options = { rtcConstraints: { optional: [{ googDscp: true }] } };
        }

        if (extraOptions !== null) {
            Object.assign(options, extraOptions);
        }

        options.mediaConstraints = inst._mediaConstraints(sendVideo);

        if (options.pcConfig === undefined) {
            options.pcConfig = {};
        }
        options.pcConfig.iceServers = inst.serverConfig.iceServers;

        if (extraHeaders !== null) {
            extraHeaders = extraHeaders.slice();
        }
        if (inst.oauthToken !== null && inst.oauthTokenUseInInvite && isOutgoing) {
            if (extraHeaders === null) {
                extraHeaders = [];
            }
            extraHeaders.push('Authorization: Bearer ' + inst.oauthToken);
        }
        if (extraHeaders !== null) {
            options.extraHeaders = extraHeaders;
        }
        return options;
    }

    /**
     * videoOption = phone.AUDIO, phone.VIDEO or false(=phone.AUDIO) true(=phone.VIDEO)
     */
    call(videoOption, call_to, extraHeaders = null, extraOptions = null) {
        // Convert boolean value to Symbol
        if (videoOption === false)
            videoOption = AudioCodesUA.instance.AUDIO;
        else if (videoOption === true)
            videoOption = AudioCodesUA.instance.VIDEO;

        if (typeof videoOption !== 'symbol' || ![AudioCodesUA.instance.AUDIO, AudioCodesUA.instance.VIDEO].includes(videoOption))
            throw new TypeError(`Illegal videoOption=${videoOption.toString()}`);

        call_to = call_to.replace(/\s+/g, ''); // remove whitespaces.
        AudioCodesUA.ac_log(`AC: call ${videoOption.description} to ${call_to}`);
        let options = this._callOptions(videoOption === AudioCodesUA.instance.VIDEO, true, extraHeaders, extraOptions);
        let js_session = this.jssipUA.call(call_to, options);
        if (options.mediaStream)
            js_session._localMediaStreamLocallyGenerated = true; // to enable jssip close the stream
        let ac_session = js_session.data.ac_session;
        ac_session._setEnabledSendVideo(videoOption === AudioCodesUA.instance.VIDEO);
        if (videoOption === AudioCodesUA.instance.VIDEO)
            ac_session._setEnabledReceiveVideo(true);
        return ac_session;
    }

    sendMessage(to, body, contentType = 'text/plain') {
        AudioCodesUA.ac_log(`AC: sendMessage to: ${to} "${body}"`);
        return new Promise((resolve, reject) => {
            let options = {
                contentType: contentType,
                eventHandlers: { succeeded: (e) => resolve(e), failed: (e) => reject(e) }
            }
            this.jssipUA.sendMessage(to, body, options);
        });
    }

    isScreenSharingSupported() {
        return AudioCodesUA.instance.getWR().hasDisplayMedia();
    }

    openScreenSharing() {
        if (!this.isScreenSharingSupported()) {
            AudioCodesUA.ac_log('AC: openScreenSharing: screen sharing is not supported in the browser');
            return Promise.reject('Screen sharing is not supported');
        }
        AudioCodesUA.ac_log('AC: openScreenSharing()');
        return AudioCodesUA.instance.getWR().getDisplayMedia()
            .then(stream => {
                return stream;
            })
            .catch(e => {
                AudioCodesUA.ac_log('AC: openScreenSharing() error', e);
                throw e;
            });
    }

    closeScreenSharing(displayStream) {
        AudioCodesUA.ac_log('AC: closeScreenSharing()');
        if (displayStream) {
            let tracks = displayStream.getVideoTracks();
            if (tracks.length == 0)
                return;
            let track = tracks[0];
            if (track.readyState === 'live') {
                track.stop();
                track.dispatchEvent(new Event("ended"));
            }
        }
    }

    setNetworkPriority(p) {
        AudioCodesUA.ac_log(`AC: setNetworkPriority ${p}`);
        if (p !== undefined && p !== 'high' && p !== 'medium' && p !== 'low' && p !== 'very-low')
            throw new TypeError(`setNetworkPriority: illegal value: ${p}`);
        this.networkPriority = p;
    }

    subscribe(...args) {
        return this.jssipUA.subscribe(...args);
    }

    notify(...args) {
        return this.jssipUA.notify(...args);
    }

    /**
     * Experimental JsSIP extension: another SIP credential.
     * Use it before phone.init() if SUBSCRIBE authentication is different from REGISTER
     */
    addCredential(credential) {
        if (!credential.realm || !credential.password || !credential.username)
            throw new TypeError('wrong credential structure');
        this.credentials.push(credential);
    }
}

/*
 * Session
 */
class AudioCodesSession {
    constructor(js_session) {
        this.js_session = js_session;
        this.data = {
            _user: null,
            _display_name: null,
            _create_time: null,
            _initial: true,
            _remoteMediaStream: null,
            _wasUsedSendVideo: false,
            _screenSharing: null,
            _video: {
                send: false,
                receive: false,
                enabledSend: false,
                enabledReceive: false
            }
        };
        js_session.data.ac_session = this;
    }

    getRTCPeerConnection() { return this.js_session.connection; }
    getRTCLocalStream() { return this.js_session._localMediaStream; }
    getRTCRemoteStream() { return this.data['_remoteMediaStream']; }
    isEstablished() { return this.js_session.isEstablished(); }
    isTerminated() { return this.js_session.isEnded(); }
    isOutgoing() { return this.js_session.direction === 'outgoing'; }
    isAudioMuted() { return this.js_session.isMuted().audio; }
    isVideoMuted() { return this.js_session.isMuted().video; }
    wasAccepted() { return this.data['_accepted'] === true; }

    getReplacesHeader() {
        if (!this.js_session.isEstablished() || !this.js_session._dialog) {
            AudioCodesUA.ac_log('getReplacesHeader(): call is not established');
            return null;
        }
        let id = this.js_session._dialog.id;
        return `${id.call_id};to-tag=${id.remote_tag};from-tag=${id.local_tag}`;
    }

    muteAudio(set) {
        AudioCodesUA.ac_log(`AC: muteAudio() arg=${set} `);
        if (set) {
            this.js_session.mute({ audio: true, video: false });
        } else {
            this.js_session.unmute({ audio: true, video: false });
        }
    }

    muteVideo(set) {
        AudioCodesUA.ac_log(`AC: muteVideo() arg=${set} `);
        if (set) {
            this.js_session.mute({ audio: false, video: true });
        } else {
            this.js_session.unmute({ audio: false, video: true });
        }
    }

    sendDTMF(tone) {
        let useWebRTC = AudioCodesUA.instance.dtmfUseWebRTC;
        if (useWebRTC && AudioCodesUA.instance.browser === 'safari') {
            let dtmfSender = AudioCodesUA.instance.getWR().connection.getDTMFSender(this.js_session.connection);
            if (dtmfSender === undefined) { // If used obsolete Safari send DTMF as SIP INFO
                useWebRTC = false;
            }
        }
        AudioCodesUA.ac_log(`AC: sendDTMF() tone=${tone} ${useWebRTC ? '[RFC2833]' : '[INFO]'}`);
        let options = {
            duration: AudioCodesUA.instance.dtmfDuration,
            interToneGap: AudioCodesUA.instance.dtmfInterToneGap,
            transportType: useWebRTC ? 'RFC2833' : 'INFO'
        };
        this.js_session.sendDTMF(tone, options);
    }

    sendInfo(body, contentType, extraHeaders = null) {
        AudioCodesUA.ac_log('AC: sendInfo()', body, contentType, extraHeaders);
        let options = (extraHeaders !== null) ? { extraHeaders: extraHeaders } : undefined;
        this.js_session.sendInfo(contentType, body, options);
    }

    duration() {
        let start = this.js_session.start_time;
        if (!start)
            return 0;
        let end = this.js_session.end_time;
        if (!end)
            end = new Date();
        return Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    // Call actual video state.
    // Set by initial INVITE and re-INVITEs. HOLD re-INVITEs will be ignored.
    hasSendVideo() { return this.data._video.send; }
    hasReceiveVideo() { return this.data._video.receive; }
    hasVideo() { return this.hasSendVideo() && this.hasReceiveVideo(); }
    getVideoState() {
        if (this.hasSendVideo() && this.hasReceiveVideo()) return "sendrecv";
        if (this.hasSendVideo()) return "sendonly";
        if (this.hasReceiveVideo()) return "recvonly";
        return "inactive";
    }
    _setVideoState(send, receive) {
        AudioCodesUA.ac_log(`AC: _setVideoState(send=${send}, receive=${receive})`);
        this.data._video.send = send;
        this.data._video.receive = receive;
    }

    // Call enabled to send/receive video
    hasEnabledSendVideo() { return this.data._video.enabledSend; }
    hasEnabledReceiveVideo() { return this.data._video.enabledReceive; }
    getEnabledVideoState() {
        if (this.hasEnabledSendVideo() && this.hasEnabledReceiveVideo()) return "sendrecv";
        if (this.hasEnabledSendVideo()) return "sendonly";
        if (this.hasEnabledReceiveVideo()) return "recvonly";
        return "inactive";
    }
    _setEnabledSendVideo(enable) {
        AudioCodesUA.ac_log(`AC: _setEnabledSendVideo(${enable})`);
        this.data._video.enabledSend = enable;
    }
    _setEnabledReceiveVideo(enable) {
        AudioCodesUA.ac_log(`AC: _setEnabledReceiveVideo(${enable})`);
        this.data._video.enabledReceive = enable;
    }

    /**
     * videoOption = phone.AUDIO, phone.VIDEO, phone.RECVONLY_VIDEO
     * or false (=phone.AUDIO), true(=phone.VIDEO)
     */
    answer(videoOption, extraHeaders = null, extraOptions = null) {
        if (this.data['_answer_called']) {
            AudioCodesUA.ac_log('AC: answer() is already called. [Ignored]');
            return;
        }
        this.data['_answer_called'] = true;

        // Convert boolean value to Symbol
        if (videoOption === false)
            videoOption = AudioCodesUA.instance.AUDIO;
        else if (videoOption === true)
            videoOption = AudioCodesUA.instance.VIDEO;

        if (typeof videoOption !== 'symbol' || ![AudioCodesUA.instance.AUDIO, AudioCodesUA.instance.RECVONLY_VIDEO, AudioCodesUA.instance.VIDEO].includes(videoOption))
            throw new TypeError(`Illegal videoOption=${videoOption.toString()}`);

        AudioCodesUA.ac_log(`AC: ${videoOption.description} answer`);

        if (!this.hasVideo() && (videoOption === AudioCodesUA.instance.RECVONLY_VIDEO || videoOption === AudioCodesUA.instance.VIDEO)) {
            AudioCodesUA.ac_log('AC: incoming INVITE without video, so answer can be only "audio"');
            videoOption = AudioCodesUA.instance.AUDIO;
        }

        // video call - audio answer: no sound in answer phone.
        if (this.hasVideo() && videoOption === AudioCodesUA.instance.AUDIO) {
            let ua = AudioCodesUA.instance;
            let br = ua.browser;
            let md = ua.modes;
            let vr = ua.browserVersion;
            if (br === 'firefox' && md.video_call_audio_answer_firefox_fix) {
                this.data['_video_call_audio_answer_firefox'] = true;
            } else if (br === 'safari') {
                if ((md.video_call_audio_answer_safari_fix === true && vr < 14) || md.video_call_audio_answer_safari_fix === 'force')
                    this.data['_video_call_audio_answer_safari'] = true;
            }
        }

        // Set enabled and current send/receive video flags
        switch (videoOption) {
            case AudioCodesUA.instance.AUDIO:
                this._setEnabledSendVideo(false);
                if (this.data['_incoming_invite_without_sdp']) {
                    this._setEnabledReceiveVideo(AudioCodesUA.instance.enableAddVideo);
                } else {
                    this._setEnabledReceiveVideo(this.hasVideo() ? false : AudioCodesUA.instance.enableAddVideo);
                }
                this._setVideoState(false, false);
                break;
            case AudioCodesUA.instance.VIDEO:
                this._setEnabledSendVideo(true);
                this._setEnabledReceiveVideo(true);
                this._setVideoState(true, true);
                break;
            case AudioCodesUA.instance.RECVONLY_VIDEO:
                this._setEnabledSendVideo(false);
                this._setEnabledReceiveVideo(true);
                this._setVideoState(false, true);
                break;
        }

        let options = AudioCodesUA.instance._callOptions(videoOption === AudioCodesUA.instance.VIDEO, false, extraHeaders, extraOptions);

        Promise.resolve()
            .then(() => {
                if (!options.mediaStream) {
                    return AudioCodesUA.instance.getWR().getUserMedia(options.mediaConstraints)
                } else {
                    return options.mediaStream;
                }
            })
            .then((stream) => {
                options.mediaStream = stream;
                this.js_session._localMediaStreamLocallyGenerated = true; // to enable jssip close the stream
                AudioCodesUA.ac_log('AC: answer options:', options);
                this.js_session.answer(options);
            })
            .catch((e) => {
                AudioCodesUA.ac_log('AC: getUserMedia failure', e);
                this.reject(488);
            });
    }

    reject(statusCode = 486, extraHeaders = null) {
        AudioCodesUA.ac_log('AC: reject()');
        try {
            let options = { status_code: statusCode }
            if (extraHeaders) {
                options.extraHeaders = extraHeaders;
            }
            this.js_session.terminate(options);
        } catch (e) {
            AudioCodesUA.ac_log('AC: call reject error:', e);
        }
    }

    terminate() {
        AudioCodesUA.ac_log('AC: terminate()');
        try {
            this.js_session.terminate();
        } catch (e) {
            AudioCodesUA.ac_log('AC: call terminate error:', e);
        }
    }

    redirect(callTo, statusCode = 302, extraHeaders = null) {
        AudioCodesUA.ac_log(`AC: redirect() callTo=${callTo}`);
        try {
            let contact = 'Contact: ' + AudioCodesUA.instance.jssipUA.normalizeTarget(callTo);
            let options = {
                status_code: statusCode,
                extraHeaders: [contact]
            };
            if (extraHeaders) {
                options.extraHeaders.push(...extraHeaders);
            }

            this.js_session.terminate(options);
        } catch (e) {
            AudioCodesUA.ac_log('AC: call redirect error:', e);
        }
    }

    isLocalHold() { return this.js_session.isOnHold().local; }
    isRemoteHold() { return this.js_session.isOnHold().remote; }
    isReadyToReOffer() { return this.js_session._isReadyToReOffer(); }

    hold(set) {
        AudioCodesUA.ac_log(`AC: hold(${set})`);
        return new Promise((resolve, reject) => {
            let method = set ? this.js_session.hold : this.js_session.unhold;
            let result = method.call(this.js_session, {}, () => {
                AudioCodesUA.ac_log('AC: hold()/unhold() is completed');
                resolve();
            });

            if (!result) {
                AudioCodesUA.ac_log('AC: hold()/unhold() failed');
                reject();
            }
        });
    }

    /*    
     * To enable/disable receive video
     * Set enabledReceiveVideo flag, and set corresponding mode for video transceiver (if exists)
     * Returns true if video transceiver exists, in the case call: reInvite({ showStreams: true })
     */
    enableReceiveVideo(enable) {
        this._setEnabledReceiveVideo(enable);
        let conn = this.getRTCPeerConnection();
        let vt = AudioCodesUA.instance.getWR().connection.getTransceiver(conn, 'video');
        if (vt !== null) {
            let dir = this.getEnabledVideoState();
            AudioCodesUA.instance.getWR().transceiver.setDirection(vt, dir);
        }
        AudioCodesUA.ac_log(`AC: enableReceiveVideo(${enable}) ${vt !== null ? "" : "No video transceiver"}`);
        return vt !== null;
    }

    /*
     * For audio call. Start sending video
       Get user media with camera stream. Add video. Send re-INVITE with video.
       In re-INVITE can be added extra headers using options.extraHeaders.
       By default set enabled to receive video from other side.
       to disable set options.enabledReceiveVideo = false;
     */
    startSendingVideo(options = {}) {
        let enabledReceiveVideo = options && options.enabledReceiveVideo !== false; // undefined | true => true
        if (this.hasEnabledSendVideo()) {
            AudioCodesUA.ac_log('AC: startSendingVideo(). Already started');
            return Promise.reject('video already started');
        }
        AudioCodesUA.ac_log('AC: startSendingVideo()');
        return AudioCodesUA.instance.getWR().getUserMedia({ video: AudioCodesUA.instance.constraints.video })
            .catch(e => {
                AudioCodesUA.ac_log('AC: startSendingVideo() getUserMedia failure', e);
                throw e;
            })
            .then(videoStream => {
                // to allow JsSIP automatically stop stream after call termination.
                let videoTrack = videoStream.getVideoTracks()[0];
                let localStream = this.getRTCLocalStream();
                localStream.addTrack(videoTrack);
                this._setEnabledSendVideo(true);
                this._setEnabledReceiveVideo(enabledReceiveVideo);
                let wasUsedSendVideo = this.data['_wasUsedSendVideo'];
                return AudioCodesUA.instance.getWR().connection.addVideo(this.getRTCPeerConnection(), this.getRTCLocalStream(), videoTrack, this.hasEnabledReceiveVideo(), wasUsedSendVideo)
                    .then(() => {
                        if (!wasUsedSendVideo && AudioCodesUA.instance.codecFilter) {
                            AudioCodesUA.instance._cf_filter('video', this, AudioCodesUA.instance.codecFilter.video);
                        }
                    })
                    .catch(e => {
                        AudioCodesUA.ac_log('AC: startSendingVideo(). Adding video error', e);
                        throw e;
                    });
            })
            .then(() => {
                return this._renegotiate(options);
            });
    }

    /*
     *  For video call.
     *  Stop sending video. Remove video. Send re-INVITE with inactive video.
     *  Optionally can be used options.extraHeaders
     */
    stopSendingVideo(options = {}) {
        if (!this.hasEnabledSendVideo()) {
            AudioCodesUA.ac_log('AC: stopSendingVideo(). Already stopped');
            return Promise.reject('video already stopped');
        }
        AudioCodesUA.ac_log('AC: stopSendingVideo()');
        return AudioCodesUA.instance.getWR().connection.removeVideo(this.getRTCPeerConnection(), this.getRTCLocalStream())
            .catch(e => {
                AudioCodesUA.ac_log('AC: stopSendingVideo(). Remove video error', e);
                throw e;
            })
            .then(() => {
                this._setEnabledSendVideo(false);
                this.data['_wasUsedSendVideo'] = true;
                return this._renegotiate(options);
            });
    }

    _doRenegotiate(options) {
        if (this.js_session.isEnded()) {
            return Promise.reject('call is ended');
        }
        return new Promise(resolve => {
            if (!this.js_session.renegotiate(options, () => resolve(true))) {
                return resolve(false);
            }
        });
    }

    _renegotiate(options, attemptsLeft = 30, delay = 500) {
        AudioCodesUA.ac_log(`AC: _renegotiate() attemptsLeft=${attemptsLeft}`);
        return this._doRenegotiate(options)
            .then(done => {
                if (done) {
                    AudioCodesUA.ac_log('AC: Renegotiation success');
                    return true;
                }
                if (attemptsLeft <= 1) {
                    throw new Error('Too many attempts');
                }
                return new Promise(resolve => setTimeout(resolve, delay))
                    .then(() => {
                        return this._renegotiate(options, attemptsLeft - 1, delay);
                    });
            })
            .catch(e => {
                AudioCodesUA.ac_log('AC: Renegotiation failed', e);
                throw e;
            });
    }

    sendReInvite(options = {}) {
        AudioCodesUA.ac_log('AC: sendReInvite()');
        return this._renegotiate(options)
            .then(() => {
                if (options.showStreams) {
                    let localStream = this.getRTCLocalStream();
                    let remoteStream = this.getRTCRemoteStream();
                    AudioCodesUA.ac_log('AC>>: [after send re-INVITE] callShowStreams', this, localStream, remoteStream);
                    AudioCodesUA.instance.listeners.callShowStreams(this, localStream, remoteStream);
                }
            });
    }

    // screen sharing.
    startScreenSharing(stream, modes = { localScreenSharing: true, enabledReceiveVideo: true, separateVideo: false }) {
        AudioCodesUA.ac_log('AC: startScreenSharing');
        if (!stream)
            return Promise.reject('missed stream argument');
        if (this.data['_screenSharing'])
            return Promise.reject('the call is already using screen-sharing');
        let enabledReceiveVideo = modes && modes.enabledReceiveVideo !== false; // undefined | true => true
        let track = stream.getVideoTracks()[0];
        let onEnded = undefined;
        if (modes.localScreenSharing) {
            onEnded = this._onEndedScreenSharingTrack.bind(this);
            track.addEventListener('ended', onEnded);
        }
        this.data['_screenSharing'] = {
            stream: stream,            // screen sharing video track
            onended: onEnded,                 // callback
            hadSendVideo: this.hasSendVideo() // if was video before screen sharing
        };
        let wasUsedSendVideo = this.data['_wasUsedSendVideo'];
        this._setEnabledSendVideo(true);
        this._setEnabledReceiveVideo(enabledReceiveVideo);

        return AudioCodesUA.instance.getWR().connection.addVideo(this.getRTCPeerConnection(), this.getRTCLocalStream(), track, this.hasEnabledReceiveVideo(), wasUsedSendVideo)
            .then(() => {
                if (!wasUsedSendVideo && AudioCodesUA.instance.codecFilter) {
                    AudioCodesUA.instance._cf_filter('video', this, AudioCodesUA.instance.codecFilter.video);
                }
            })
            .catch(e => {
                AudioCodesUA.ac_log('AC: startScreenSharing() error', e);
                this.data['_screenSharing'] = null;
                throw e;
            })
            .then(() => {
                let options = { extraHeaders: ['X-Screen-Sharing: on'] };
                return this._renegotiate(options);
            });
    }

    stopScreenSharing() {
        AudioCodesUA.ac_log('AC: stopScreenSharing');
        if (!this.data['_screenSharing'])
            return Promise.reject('the call does not use screen-sharing');
        return this._onEndedScreenSharing('called stopScreenSharing()');
    }

    isScreenSharing() {
        return !!this.data['_screenSharing'];
    }

    doesScreenSharingReplaceCamera() {
        let sh = this.data['_screenSharing'];
        return sh && sh.hadSendVideo;
    }

    _onEndedScreenSharingTrack() {
        return this._onEndedScreenSharing('track ended');
    }

    _onEndedScreenSharing(reason) {
        let screenSharing = this.data['_screenSharing'];
        this.data['_screenSharing'] = null;
        let stream = screenSharing.stream;
        let onended = screenSharing.onended;
        if (stream && onended) {
            let track = stream.getVideoTracks()[0];
            track.removeEventListener('ended', onended);
        }
        return Promise.resolve()
            .then(() => {
                if (!this.isTerminated()) { // Restore previously sending video (if was) and send re-INVITE.
                    let connection = this.getRTCPeerConnection();
                    let localStream = this.getRTCLocalStream();
                    let options = { extraHeaders: ['X-Screen-Sharing: off'] };
                    if (screenSharing.hadSendVideo) {
                        AudioCodesUA.ac_log('AC: screen sharing stopped - restore previously sending video track');
                        AudioCodesUA.instance.getWR().connection.replaceSenderTrack(connection, 'video', localStream);
                        return this._renegotiate(options);
                    } else {
                        AudioCodesUA.ac_log('AC: screen sharing stopped - stop send video');
                        return this.stopSendingVideo(options);
                    }
                }
            })
            .then(() => {
                if (AudioCodesUA.instance.listeners.callScreenSharingEnded) {
                    AudioCodesUA.ac_log(`AC>>: callScreenSharingEnded "${reason}"`, this, stream);
                    AudioCodesUA.instance.listeners.callScreenSharingEnded(this, stream);
                }
            });
    }

    /*
     * To restore call "remote hold" state after page reload.
     */
    setRemoteHoldState() {
        this.js_session._remoteHold = true;
    }

    /*
     * Blind or attended transfer
     */
    sendRefer(callTo, probeSession = null) {
        if (!AudioCodesUA.instance.listeners.transferorNotification)
            throw new Error('transferorNotification listener is missed');

        let ac_session = this;
        let options = {
            eventHandlers: {
                requestSucceeded() {
                    AudioCodesUA.ac_log('AC>>: transferorNotification progress [REFER accepted]');
                    AudioCodesUA.instance.listeners.transferorNotification(ac_session, 0);
                },
                requestFailed() {
                    AudioCodesUA.ac_log('AC>>: transferorNotification failed [REFER failed]');
                    AudioCodesUA.instance.listeners.transferorNotification(ac_session, -1);
                },
                trying() {
                    AudioCodesUA.ac_log('AC>>: transferorNotification progress [NOTIFY 1xx]');
                    AudioCodesUA.instance.listeners.transferorNotification(ac_session, 0);
                },
                progress() {
                    AudioCodesUA.ac_log('AC>>: transferorNotification progress [NOTIFY 1xx]');
                    AudioCodesUA.instance.listeners.transferorNotification(ac_session, 0);
                },
                accepted() {
                    AudioCodesUA.ac_log('AC>>: transferorNotification success [NOTIFY 2xx]');
                    AudioCodesUA.instance.listeners.transferorNotification(ac_session, 1);
                },
                failed() {
                    AudioCodesUA.ac_log('AC>>: transferorNotification failed [NOTIFY >= 300]');
                    AudioCodesUA.instance.listeners.transferorNotification(ac_session, -1);
                }
            }
        };

        // REFER with header ReferTo with replaces parameter
        if (probeSession !== null) {
            options.replaces = probeSession.js_session;
        }

        this.js_session.refer(callTo, options);
    }
}

// SDP parser
class AudioCodesSDP {
    constructor(sdp) {
        this.start = [];
        this.media = [];
        let lines = sdp.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let current = this.start;
        for (let line of lines) {
            if (line.startsWith('m=')) {
                current = [];
                this.media.push(current);
            }
            current.push(line);
        }
    }
    getMedia(type) {
        for (let m of this.media)
            if (m.length > 0 && m[0].startsWith('m=' + type))
                return m;
        return null;
    }
    checkSendRecv(line) {
        switch (line) {
            case 'a=sendrecv':
                return 'sendrecv';
            case 'a=sendonly':
                return 'sendonly';
            case 'a=recvonly':
                return 'recvonly';
            case 'a=inactive':
                return 'inactive';
            default:
                return null;
        }
    }
    getMediaDirectionValue(type) {
        let media = this.getMedia(type);
        if (media === null)
            return null;

        let t;
        let result = 'sendrecv';
        for (let line of this.start) {
            if ((t = this.checkSendRecv(line)) !== null) {
                result = t;
                break;
            }
        }
        for (let line of media) {
            if ((t = this.checkSendRecv(line)) !== null) {
                result = t;
                break;
            }
        }
        return result;
    }
    getMediaDirection(type, remote) {
        let dir = this.getMediaDirectionValue(type);
        switch (dir) {
            case 'sendrecv':
                return [true, true, dir];
            case 'sendonly':
                return remote ? [false, true, dir] : [true, false, dir];
            case 'recvonly':
                return remote ? [true, false, dir] : [false, true, dir];
            case null:
            case 'inactive':
                return [false, false, dir];
        }
    }
    toString() {
        let result = this.start;
        for (let m of this.media) {
            result = result.concat(m);
        }
        return result.join('\r\n') + '\r\n';
    }
}

// WebRTC Wrapper
let AudioCodesWebRTCWrapper = {
    getUserMedia(constraints) {
        AudioCodesUA.ac_log(`[webrtc] getUserMedia constraints=${JSON.stringify(constraints)}`);
        return navigator.mediaDevices.getUserMedia(constraints);
    },

    hasDisplayMedia() {
        return navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
    },

    getDisplayMedia() {
        AudioCodesUA.ac_log('[webrtc] getDisplayMedia');
        return navigator.mediaDevices.getDisplayMedia({ video: true });
    },

    mediaDevices: {
        enumerateDevices() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
                return Promise.reject('WebRTC is not supported');
            return navigator.mediaDevices.enumerateDevices()
        },

        addDeviceChangeListener(listener) {
            if (!navigator.mediaDevices)
                return;
            navigator.mediaDevices.addEventListener('devicechange', listener);
        },

        removeDeviceChangeListener(listener) {
            if (!navigator.mediaDevices)
                return;
            navigator.mediaDevices.removeEventListener('devicechange', listener);
        }
    },


    // Check WebRTC support. Check presence of microphone and camera
    checkAvailableDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
            return Promise.reject('WebRTC is not supported');
        let cam = false,
            mic = false,
            spkr = false;
        return navigator.mediaDevices.enumerateDevices()
            .then((deviceInfos) => {
                deviceInfos.forEach(function (d) {
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
                })
                if (navigator.webkitGetUserMedia === undefined) { // Not Chrome
                    spkr = true;
                }
                if (!spkr)
                    return Promise.reject('Missing a speaker! Please connect one and reload');
                if (!mic)
                    return Promise.reject('Missing a microphone! Please connect one and reload');

                return Promise.resolve(cam);
            })
    },

    transceiver:
    {
        setDirection(transceiver, direction) {
            let kind = '';
            if (transceiver.sender.track !== null)
                kind = transceiver.sender.track.kind;
            else if (transceiver.receiver.track !== null)
                kind = transceiver.receiver.track.kind;
            AudioCodesUA.ac_log(`[webrtc] set ${kind} transceiver direction=${direction}`);
            transceiver.direction = direction;
        }
    },

    stream:
    {
        // For logging
        getInfo(stream) {
            function getTrackInfo(tr) { return tr.length > 0 ? tr[0].enabled.toString() : '-'; }
            if (stream === null)
                return Promise.resolve('stream is null');
            return Promise.resolve(`audio: ${getTrackInfo(stream.getAudioTracks())} video: ${getTrackInfo(stream.getVideoTracks())}`)
        },
    },

    connection:
    {
        // For logging
        getTransceiversInfo(connection) {
            function getTransInfo(t) { return t === null ? 'none' : `d=${t.direction} c=${t.currentDirection}`; }
            let ts = connection.getTransceivers();
            let at = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'audio');
            let vt = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'video');
            return Promise.resolve(`(${ts.length}) audio ${getTransInfo(at)} video ${getTransInfo(vt)}`);
        },

        getTransceiver(connection, kind) {
            for (let t of connection.getTransceivers()) {
                if (t.sender !== null && t.sender.track !== null && t.sender.track.kind === kind) {
                    return t;
                }
                if (t.receiver !== null && t.receiver.track !== null && t.receiver.track.kind === kind) {
                    return t;
                }
            }
            return null;
        },

        addEventListener(connection, eventName, listener) {
            AudioCodesUA.ac_log(`[webrtc] Connection addEventListener ${eventName}`);
            if (eventName !== 'track')
                return Promise.reject(`Wrong event name: ${eventName}`);
            connection.addEventListener(eventName, listener);
            return Promise.resolve();
        },

        getDTMFSender(connection) {
            let sender = connection.getSenders().find((s) => {
                return s.track && s.track.kind === 'audio';
            });
            if (sender && sender.dtmf)
                return sender.dtmf;
            return undefined;
        },

        addVideo(connection, localStream, videoTrack, enabledReceiveVideo, wasUsedSendVideo) {
            AudioCodesUA.ac_log('[webrtc] Connection addVideo');
            let vt = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'video');
            if (vt !== null) {
                let dir = enabledReceiveVideo ? 'sendrecv' : 'sendonly';
                AudioCodesUA.instance.getWR().transceiver.setDirection(vt, dir);
            }

            if (vt === null || (vt.sender.track === null && !wasUsedSendVideo)) {
                AudioCodesUA.ac_log('[webrtc] addVideo (connection addTrack)');
                connection.addTrack(videoTrack, localStream);
                return Promise.resolve(true);
            } else {
                AudioCodesUA.ac_log('[webrtc] addVideo (video transceiver sender replaceTrack)');
                return vt.sender.replaceTrack(videoTrack)
                    .then(() => {
                        return false;
                    });
            }
        },

        removeVideo(connection, localStream) {
            AudioCodesUA.ac_log('[webrtc] Connection removeVideo');
            let vt = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'video');
            if (vt === null)
                return Promise.reject('no video transceiver found');
            connection.removeTrack(vt.sender);

            if (localStream) {
                for (let track of localStream.getVideoTracks()) {
                    localStream.removeTrack(track);
                    track.stop();
                }
            }
            return Promise.resolve();
        },

        replaceSenderTrack(connection, kind, stream) {
            AudioCodesUA.ac_log(`[webrtc] ReplaceSenderTrack ${kind}`);
            let foundSender = null;
            for (let sender of connection.getSenders()) {
                if (sender.track !== null && sender.track.kind === kind) {
                    foundSender = sender;
                    break;
                }
            }
            if (foundSender === null)
                return Promise.reject(`No ${kind} sender`);
            let tracks = (kind === 'audio') ? stream.getAudioTracks() : stream.getVideoTracks();
            if (tracks.length === 0)
                return Promise.reject(`No ${kind} track`);
            return foundSender.replaceTrack(tracks[0]);
        },

        // "types" example ['outboud-rtp', 'inbound-rtp']
        getStats(connection, types) {
            let str = '';
            return connection.getStats(null)
                .then(report => {
                    report.forEach(now => {
                        if (types.includes(now.type)) {
                            str += ' {';
                            let first = true;
                            for (let key of Object.keys(now)) {
                                if (first) first = false;
                                else str += ',';
                                str += (key + '=' + now[key]);
                            }
                            str += '} \r\n';
                        }
                    });
                    return str;
                })
        }
    }
}