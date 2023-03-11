'use strict';
/*
 * AudioCodes WebRTC API v1.18.0
 * © 2022 AudioCodes Ltd. All rights reserved.
 *
 */

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AudioCodesUA = /*#__PURE__*/function () {
  function AudioCodesUA() {
    _classCallCheck(this, AudioCodesUA);

    this._isInitialized = false;
    this.serverConfig = {};
    this.account = {
      user: null,
      userAuth: null,
      displayName: null,
      password: null,
      registerExpires: 600,
      useSessionTimer: false
    }; // constraints for current browser

    this.constraints = {
      audio: true,
      video: true
    };
    this.chromiumBased = [{
      n: 'Edge',
      s: 'edg/'
    }, {
      n: 'Opera',
      s: 'opr/'
    }, {
      n: 'Samsung',
      s: 'samsungbrowser/'
    }, {
      n: 'Yandex',
      s: 'yabrowser/'
    }];
    this.modes = {
      // default values for modes and fixes.
      video_call_audio_answer_firefox_fix: true,
      // use fix
      video_call_audio_answer_safari_fix: true,
      // true: for Safari versions < 14. ('force' for all versions)
      ice_timeout_fix: 2000,
      // ICE gathering timeout (ms)
      chrome_rtp_timeout_fix: 13,
      // Currently Chrome don't set 'failed' status to icestate
      sbc_ha_pairs_mode: undefined,
      // Set e.g. 15 (seconds) when used multiple URL of HA SBC pairs
      ringing_header_mode: undefined,
      // Add extra header(s) to response 180 ringing
      sbc_switch_register5xx_mode: true,
      // Switch SBC if received REGISTER 5xx.
      cache_register_auth_mode: true,
      // Next REGISTER includes authorization header from previous one.
      check_remote_sdp_mode: true // Check remote SDP at every re-negotiation, and if need print 'AC:SDP' warning

    };
    this.credentials = [];
    this.listeners = {};
    this.registerExtraHeaders = null;
    this.jssipUA = null;
    this.browser = ''; // chrome, firefox, safari, other

    this.browserVersion = 0; // version major number.

    this.browserName = ''; // name with version

    this.os = 'other'; // windows,android,macos,ios,linux,other

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
    if (AudioCodesUA.instance === undefined) AudioCodesUA.instance = this;

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

  _createClass(AudioCodesUA, [{
    key: "version",
    value: function version() {
      return '1.18.0';
    }
  }, {
    key: "getBrowserName",
    value: function getBrowserName() {
      return this.browserName;
    }
  }, {
    key: "getBrowser",
    value: function getBrowser() {
      return this.browser;
    }
  }, {
    key: "getBrowserVersion",
    value: function getBrowserVersion() {
      return this.browserVersion;
    }
  }, {
    key: "getOS",
    value: function getOS() {
      return this.os;
    }
  }, {
    key: "getWR",
    value: function getWR() {
      return this.webrtcapi;
    }
  }, {
    key: "checkAvailableDevices",
    value: function checkAvailableDevices() {
      return this.getWR().checkAvailableDevices();
    }
  }, {
    key: "getServerAddress",
    value: function getServerAddress() {
      if (this.wsSocket === null) return null;
      var url = this.wsSocket.url;
      if (url.endsWith('/')) url = url.slice(0, -1);
      return url;
    }
  }, {
    key: "setOAuthToken",
    value: function setOAuthToken(token) {
      var useInInvite = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      this.oauthToken = token;
      this.oauthTokenUseInInvite = useInInvite;
      this.setRegisterExtraHeaders(this.registerExtraHeaders);
    }
  }, {
    key: "setUserAgent",
    value: function setUserAgent(name) {
      this.u17 = name;
    }
  }, {
    key: "setConstraints",
    value: function setConstraints(browser, type, value) {
      var br = this.browser;
      var bs = this.browser + '|' + this.os;

      if (browser !== null && browser !== br && browser !== bs) {
        AudioCodesUA.ac_log("AC: setConstraints ".concat(browser, " - ignored, no current browser"));
        return;
      }

      AudioCodesUA.ac_log("AC: setConstraints ".concat(browser, " ").concat(type, "  ").concat(JSON.stringify(value)));
      if (type !== 'audio' && type !== 'video') throw new TypeError("Wrong type: ".concat(type));
      this.constraints[type] = value;
    }
  }, {
    key: "setConstraint",
    value: function setConstraint(type, name, value) {
      if (value !== null && value !== undefined) {
        AudioCodesUA.ac_log("AC: setConstraint ".concat(type, " ").concat(name, "=").concat(JSON.stringify(value)));
      } else {
        AudioCodesUA.ac_log("AC: setConstraint remove ".concat(type, " ").concat(name));
      }

      if (type !== 'audio' && type !== 'video') throw new TypeError("Wrong type: ".concat(type));

      if (value !== null && value !== undefined) {
        if (this.constraints[type] === true) this.constraints[type] = {};
        this.constraints[type][name] = value;
      } else {
        if (this.constraints[type] !== true && this.constraints[type] !== false) {
          delete this.constraints[type][name];
          if (Object.keys(this.constraints[type]).length === 0) this.constraints[type] = true;
        }
      }
    }
  }, {
    key: "setBrowsersConstraints",
    value: function setBrowsersConstraints(obj) {
      var br = this.browser;
      var bs = this.browser + '|' + this.os;

      for (var key in obj) {
        if (key !== br && key !== bs) continue;
        var val = obj[key];
        if (val.audio !== undefined) this.setConstraints(key, 'audio', val.audio);
        if (val.video !== undefined) this.setConstraints(key, 'video', val.video);
      }
    }
  }, {
    key: "setCodecFilter",
    value: function setCodecFilter(obj) {
      if (obj) {
        AudioCodesUA.ac_log("AC: setCodecFilter ".concat(JSON.stringify(obj)));
        this.codecFilter = this._cf_unpack(obj);
      }
    }
  }, {
    key: "setServerConfig",
    value: function setServerConfig(serverAddresses, serverDomain) {
      var iceServers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      this.serverConfig = {
        addresses: serverAddresses,
        domain: serverDomain,
        iceServers: this._convertIceList(iceServers)
      };
      AudioCodesUA.ac_log("AC: setServerConfig() ".concat(JSON.stringify(this.serverConfig)));
    }
  }, {
    key: "setReconnectIntervals",
    value: function setReconnectIntervals(minSeconds, maxSeconds) {
      AudioCodesUA.ac_log("AC: setReconnectIntervals min=".concat(minSeconds, " max=").concat(maxSeconds));
      this.reconnectMin = minSeconds;
      this.reconnectMax = maxSeconds;
    }
  }, {
    key: "setAccount",
    value: function setAccount(user, displayName, password, authUser) {
      if (displayName === undefined || displayName === null || displayName.length === 0) displayName = undefined;
      if (authUser === undefined || authUser === null || authUser.length === 0) authUser = user;
      var a = this.account;
      a.user = user;
      a.displayName = displayName;
      a.password = password;
      a.authUser = authUser;
    }
  }, {
    key: "setRegisterExpires",
    value: function setRegisterExpires(seconds) {
      AudioCodesUA.ac_log("AC: setRegisterExpires=".concat(seconds));
      this.account.registerExpires = seconds;
    }
  }, {
    key: "setUseSessionTimer",
    value: function setUseSessionTimer(use) {
      AudioCodesUA.ac_log("AC: setUseSessionTimer=".concat(use));
      this.account.useSessionTimer = use;
    } // null value means use default (see value set in constructor for dtmfDuration, dtmtInterToneGap, dtmfSendDelay).

  }, {
    key: "setDtmfOptions",
    value: function setDtmfOptions(useWebRTC) {
      var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var interToneGap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      AudioCodesUA.ac_log("AC: setDtmfOptions useWebRTC=".concat(useWebRTC, " duration=").concat(duration, " interToneGap=").concat(interToneGap));
      this.dtmfUseWebRTC = useWebRTC;
      if (duration !== null) this.dtmfDuration = duration;
      if (interToneGap !== null) this.dtmfInterToneGap = interToneGap;
    }
  }, {
    key: "setEnableAddVideo",
    value: function setEnableAddVideo(enable) {
      AudioCodesUA.ac_log("AC: setEnableAddVideo=".concat(enable));
      this.enableAddVideo = enable;
    }
  }, {
    key: "getEnableAddVideo",
    value: function getEnableAddVideo() {
      return this.enableAddVideo;
    }
  }, {
    key: "getAccount",
    value: function getAccount() {
      return this.account;
    }
  }, {
    key: "setListeners",
    value: function setListeners(listeners) {
      AudioCodesUA.ac_log('AC: setListeners()');

      for (var _i = 0, _arr = ['loginStateChanged', 'outgoingCallProgress', 'callTerminated', 'callConfirmed', 'callShowStreams', 'incomingCall', 'callHoldStateChanged']; _i < _arr.length; _i++) {
        var m = _arr[_i];
        if (m in listeners) continue;
        throw new Error("".concat(m, " listener is missed"));
      }

      this.listeners = listeners;
    }
  }, {
    key: "setAcLogger",
    value: function setAcLogger(loggerFunction) {
      AudioCodesUA.ac_log = loggerFunction;
    }
  }, {
    key: "setJsSipLogger",
    value: function setJsSipLogger(loggerFunction) {
      AudioCodesUA.js_log = loggerFunction;
    }
  }, {
    key: "isInitialized",
    value: function isInitialized() {
      return this._isInitialized;
    }
  }, {
    key: "setModes",
    value: function setModes() {
      var modes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      AudioCodesUA.ac_log("AC: setModes() ".concat(JSON.stringify(modes)));
      Object.assign(this.modes, modes);

      this._normalizeModes();
    }
  }, {
    key: "_normalizeModes",
    value: function _normalizeModes() {
      function undef(v, m) {
        return typeof v === 'number' && v <= m ? undefined : v;
      }

      var m = this.modes;
      m.sbc_ha_pairs_mode = undef(m.sbc_ha_pairs_mode, 0);
      m.chrome_rtp_timeout_fix = undef(m.chrome_rtp_timeout_fix, 0);
    }
  }, {
    key: "init",
    value: function init() {
      var autoLogin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      AudioCodesUA.ac_log("AC: init() autoLogin=".concat(autoLogin));
      if (this._isInitialized) return;
      this._isInitialized = true;
      JsSIP.debug.enable('JsSIP:*');

      JsSIP.debug.formatArgs = function () {
        if (AudioCodesUA.js_log) this.log = AudioCodesUA.js_log;
      };

      var sockets = [];

      var _iterator = _createForOfIteratorHelper(this.serverConfig.addresses),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var address = _step.value;

          if (address instanceof Array) {
            // 'address' or ['address', weight]
            sockets.push({
              socket: new JsSIP.WebSocketInterface(address[0]),
              weight: address[1]
            });
          } else {
            sockets.push(new JsSIP.WebSocketInterface(address));
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      var config = {
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

      AudioCodesUA.ac_log("AC: applied SDK modes: ".concat(JSON.stringify(this.modes, function (k, v) {
        return typeof v === 'undefined' ? '<undefined>' : v;
      })));
      this.jssipUA.modes = this.modes;

      var _iterator2 = _createForOfIteratorHelper(this.credentials),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var credential = _step2.value;
          this.jssipUA.addCredential(credential);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      this.credentials = [];
      this.jssipUA.start();
    }
  }, {
    key: "deinit",
    value: function deinit() {
      this._isInitialized = false;
      this.jssipUA && this.jssipUA.stop();
    }
  }, {
    key: "setRegisterExtraHeaders",
    value: function setRegisterExtraHeaders(extraHeaders) {
      this.registerExtraHeaders = extraHeaders;

      if (this.jssipUA) {
        var headers = extraHeaders !== null ? extraHeaders : [];

        if (this.oauthToken !== null) {
          headers = headers.slice();
          headers.push("Authorization: Bearer ".concat(this.oauthToken));
        }

        this.jssipUA.registrator().setExtraHeaders(headers);
      }
    }
  }, {
    key: "getRegisterExtraHeaders",
    value: function getRegisterExtraHeaders() {
      return this.registerExtraHeaders;
    }
  }, {
    key: "login",
    value: function login() {
      AudioCodesUA.ac_log('AC: login()');
      this.jssipUA.register();
    }
  }, {
    key: "logout",
    value: function logout() {
      AudioCodesUA.ac_log('AC: logout()');

      if (this.jssipUA.isRegistered()) {
        this.jssipUA.unregister();
      }
    }
  }, {
    key: "switchSBC",
    value: function switchSBC() {
      var unregister = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      AudioCodesUA.ac_log('AC: switchSBC()');
      return this.jssipUA.switchSBC(unregister);
    }
  }, {
    key: "getNumberOfSBC",
    value: function getNumberOfSBC() {
      return this.jssipUA.getNumberOfSBC();
    } // Keep alive websocket ping/pong (CRLF)

  }, {
    key: "setWebSocketKeepAlive",
    value: function setWebSocketKeepAlive(pingInterval) {
      var pongTimeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var timerThrottlingBestEffort = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var pongReport = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var pongDist = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      AudioCodesUA.ac_log("AC: setWebSocketKeepAlive pingInterval=".concat(pingInterval, " pongTimeout=").concat(pongTimeout) + " timerThrottlingBestEffort=".concat(JSON.stringify(timerThrottlingBestEffort), " pongReport=").concat(pongReport, " pongDist=").concat(pongDist));
      if (typeof pingInterval !== 'number' || typeof pongTimeout !== 'boolean') throw new TypeError('setWebSocketKeepAlive: wrong type of first or second argument');
      this.wsPingMs = this.wsOrigPingMs = pingInterval * 1000;
      this.wsPongTimeout = pongTimeout;
      this.wsPongReport = pongReport;
      this.wsPongDist = pongDist;
      this.wsPongReportCounter = 0;
      this.wsIsThrottling = false;
      var params;
      if (timerThrottlingBestEffort === true) params = {
        log: 0,
        chrome: {
          interval: 1,
          visibility: true,
          call: true,
          log: 1
        }
      };else if (timerThrottlingBestEffort === false) params = {
        log: 0
      };else params = timerThrottlingBestEffort;
      var p = params[this.browser];
      this.wsThrottlingPingMs = p && p.interval !== undefined ? p.interval * 1000 : 0;
      this.wsVisibility = p && p.visibility !== undefined ? p.visibility : false;
      this.wsCall = p && p.call !== undefined ? p.call : false;
      this.wsLog = p && p.log !== undefined ? p.log : params.log;
      this.wsPongDelays = new Array(this.wsPongReport > 0 ? this.wsPongReport : 50);
      this.wsPongDelaysIx = 0;
      if (this.wsOrigPingMs !== 0 && this.wsThrottlingPingMs !== 0 && this.wsVisibility) document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    }
  }, {
    key: "_pingLog",
    value: function _pingLog() {
      return " (ping=".concat(this.wsPingMs / 1000, " sec)");
    }
  }, {
    key: "_visibilityLog",
    value: function _visibilityLog(changed) {
      var m = 'AC: keep-alive: Page is ' + (document.hidden ? 'hidden' : 'visible');

      if (document.hidden) {
        if (this.wsCall) m += ', ' + (this.activeCalls === 0 ? 'no active call' : 'active call');
        m += ' and ' + (this.wsIsThrottling ? 'was' : 'was not') + ' trottling';
      }

      if (changed) m += this._pingLog();
      AudioCodesUA.ac_log(m);
    }
  }, {
    key: "_activeCallsLog",
    value: function _activeCallsLog(changed) {
      var m = "AC: keep-alive: ".concat(this.activeCalls === 0 ? 'Call ended' : 'Call started');

      if (this.activeCalls === 0) {
        if (this.wsVisibility) m += ', page is ' + (document.hidden ? 'hidden' : 'visible');else m + ', page visibility is ignored';
        m += ' and ' + (this.wsIsThrottling ? 'was' : 'was not') + ' trottling';
      }

      if (changed) m += this._pingLog();
      AudioCodesUA.ac_log(m);
    }
  }, {
    key: "_onActiveCallsChange",
    value: function _onActiveCallsChange(n) {
      this.activeCalls += n;
      if (!this.wsCall || this.wsPingMs === 0 || this.wsThrottlingPingMs === 0) return;
      if (this.activeCalls < 0) AudioCodesUA.ac_log('Warning: keep-alive: activeCalls < 0');

      if (this.activeCalls === 0) {
        // open call -> no call
        if ((!this.wsVisibility || document.hidden) && this.wsIsThrottling && this.wsPingMs < this.wsThrottlingPingMs) {
          this.wsPingMs = this.wsThrottlingPingMs;

          this._activeCallsLog(true);

          return;
        }

        if (this.wsLog >= 2) this._activeCallsLog(false);
      } else if (this.activeCalls === 1 && n > 0) {
        // no call -> open call
        if (this.wsPingMs > this.wsOrigPingMs) {
          this.wsPingMs = this.wsOrigPingMs;

          this._activeCallsLog(true);

          return;
        }

        if (this.wsLog >= 2) this._activeCallsLog(false);
      }
    }
  }, {
    key: "_onVisibilityChange",
    value: function _onVisibilityChange() {
      if (!this.wsVisibility || this.wsPingMs === 0 || this.wsThrottlingPingMs === 0) return;

      if (document.hidden) {
        if (this.wsCall && this.activeCalls === 0 && this.wsIsThrottling && this.wsPingMs < this.wsThrottlingPingMs) {
          this.wsPingMs = this.wsThrottlingPingMs;

          this._visibilityLog(true);

          return;
        }

        if (this.wsLog >= 2) this._visibilityLog(false);
      } else {
        if (this.wsPingMs > this.wsOrigPingMs) {
          this.wsPingMs = this.wsOrigPingMs;

          this._visibilityLog(true);

          return;
        }

        if (this.wsLog >= 2) this._visibilityLog(false);
      }
    }
  }, {
    key: "_onMessageHook",
    value: function _onMessageHook(arg) {
      if (arg.data === '\r\n') {
        this._onPong();
      } else {
        this.wsOnMessage(arg);
      }
    }
  }, {
    key: "_onPong",
    value: function _onPong() {
      this.wsPongReceived = true;

      if (this.wsPongSupported === null) {
        AudioCodesUA.ac_log('AC: keep-alive: Server supports CRLF pong');
        this.wsPongSupported = true;
      }

      var delay;

      if (this.wsPongTimeoutTime !== null) {
        delay = Date.now() - this.wsPongTimeoutTime;
        this.wsPongTimeoutTime = null;
        AudioCodesUA.ac_log("AC: keep-alive: Received pong that exceeded the timeout, delay=".concat(delay));
      } else {
        delay = Date.now() - this.wsPingTime;
      } // Reset the ping timer from a networking callback to avoid Chrome timer throttling from causing timers to run once a minute


      var nextPing = this.wsPingMs - delay;

      if (nextPing < 0) {
        AudioCodesUA.ac_log("AC: nextPing calculated to ".concat(nextPing, "ms, so resetting to 0ms."));
        nextPing = 0;
      }

      if (this.wsPingJob !== null) {
        clearTimeout(this.wsPingJob);
      }

      this.wsPingJob = setTimeout(this._sendPing.bind(this), nextPing); // Save pong delays statistics.

      this.wsPongDelays[this.wsPongDelaysIx] = delay;
      this.wsPongDelaysIx = this.wsPongDelaysIx + 1;
      if (this.wsPongDelaysIx === this.wsPongDelays.length) this.wsPongDelaysIx = 0;
      if (this.wsPongReport > 0) this.wsPongReportCounter++;
    }
  }, {
    key: "_onPongTimeout",
    value: function _onPongTimeout(pingMs) {
      AudioCodesUA.ac_log("AC: keep-alive: Pong timeout (not received within ".concat(pingMs / 1000, " seconds)"));
      AudioCodesUA.ac_log("AC: keep-alive: Previous pongs statistics: ".concat(this._createPongReport(true)));

      if (this.wsPongTimeout) {
        AudioCodesUA.ac_log('AC: keep-alive: Close websocket connection');

        this._stopWsKeepAlive();

        try {
          this.wsSocket.close();
        } catch (e) {
          AudioCodesUA.ac_log('AC: Close websocket error', e);
        }
      } else {
        AudioCodesUA.ac_log("AC: keep-alive: Warning: websocket is not closed, because pongTimeout=false");
      }
    }
  }, {
    key: "_sendPing",
    value: function _sendPing() {
      try {
        var now = Date.now();

        if (this.wsPingTime !== null) {
          var delay = now - this.wsNextPingTime;
          if (this.wsLog >= 3) AudioCodesUA.ac_log("AC: keep-alive: timer deviation (ms): ".concat(delay));
          var pingMs = this.wsPingMs;

          if (Math.abs(delay) >= 10000) {
            if (this.wsLog > 0 || !this.wsIsThrottling) {
              AudioCodesUA.ac_log("AC: keep-alive detected timer throttling: ".concat(Math.round(delay / 1000), " seconds ").concat(delay > 0 ? 'later' : 'earlier'));
              if (this.wsLog === 0) AudioCodesUA.ac_log('AC: keep-alive: The next timer throttling will not be shown in the logs, because log==0');
            }

            this.wsIsThrottling = true;

            if (this.wsPingMs < this.wsThrottlingPingMs) {
              this.wsPingMs = this.wsThrottlingPingMs;
              AudioCodesUA.ac_log("AC: keep-alive: ping interval increased ".concat(this._pingLog()));
            }
          }

          if (this.wsPongSupported === null && !this.wsPongReceived) {
            AudioCodesUA.ac_log('AC: keep-alive: Server does not support CRLF pong.');
            this.wsPongSupported = false;
          }

          if (this.wsPongSupported && !this.wsPongReceived && this.wsPongTimeoutTime === null) {
            this._onPongTimeout(pingMs);

            if (this.wsPongTimeout) return;
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
          AudioCodesUA.ac_log("AC: keep-alive: Warning: Cannot send Ping, websocket state=".concat(this.wsSocket.readyState));
        }

        this.wsPingJob = setTimeout(this._sendPing.bind(this), this.wsPingMs);

        if (this.wsPongReport > 0 && this.wsPongReportCounter >= this.wsPongReport) {
          this.wsPongReportCounter = 0;
          AudioCodesUA.ac_log("AC: keep-alive: Pong statistics: ".concat(this._createPongReport(this.wsPongDist)));
        }
      } catch (e) {
        AudioCodesUA.ac_log('AC: keep-alive: send ping error', e);
      }
    }
  }, {
    key: "_startWsKeepAlive",
    value: function _startWsKeepAlive(websocket) {
      this.wsSocket = websocket;
      if (this.wsPingMs === 0) return;
      this.wsOnMessage = websocket.onmessage;
      websocket.onmessage = this._onMessageHook.bind(this);

      this._stopWsKeepAlive();

      this.wsPingTime = null;
      this.wsPingJob = setTimeout(this._sendPing.bind(this), this.wsPingMs);
    }
  }, {
    key: "_stopWsKeepAlive",
    value: function _stopWsKeepAlive() {
      if (this.wsPingJob !== null) {
        clearTimeout(this.wsPingJob);
        this.wsPingJob = null;
      }
    }
  }, {
    key: "_createPongReport",
    value: function _createPongReport(dist) {
      var dval;
      var dstr = '';
      var dover = false;
      var min = 1000000;
      var max = 0;
      if (dist) dval = new Array(this.wsPingMs / 1000 * 4).fill(0);
      var pongs = 0;

      for (var ix = 0; ix < this.wsPongDelays.length; ix++) {
        var delay = this.wsPongDelays[ix];
        if (delay === undefined) continue;
        pongs++;
        if (delay < min) min = delay;
        if (delay > max) max = delay;

        if (dist) {
          var n = Math.floor(delay / 250);

          if (n >= dval.length) {
            n = dval.length - 1;
            dover = true;
          }

          dval[n]++;
        }
      }

      if (dist) {
        dstr = '\r\npongs distribution (1/4 second step): ';

        for (var i = 0; i < dval.length; i++) {
          dstr += dval[i].toString();
          if (i !== dval.length - 1) dstr += (i + 1) % 4 === 0 ? ',' : ' ';
        }

        if (dover) dstr += ' (+)';
      }

      return "pongs=".concat(pongs, " delay=").concat(min, "..").concat(max, " ms").concat(dstr);
    } // end of ping/pong keep-alive
    // Catch some JsSIP events, and call corresponding API callbacks.

  }, {
    key: "_setUACallbacks",
    value: function _setUACallbacks() {
      var _this = this;

      this.jssipUA.on('connected', function (e) {
        AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "connected"');

        _this._startWsKeepAlive(e.socket.socket._ws);

        _this.listeners.loginStateChanged(false, 'connected', null);
      });
      this.jssipUA.on('disconnected', function () {
        _this._stopWsKeepAlive();

        AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "disconnected"');

        _this.listeners.loginStateChanged(false, 'disconnected', null);
      });
      this.jssipUA.on('registered', function (e) {
        AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=true "login"');

        _this.listeners.loginStateChanged(true, 'login', e.response);
      });
      this.jssipUA.on('unregistered', function (e) {
        AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "logout"');

        _this.listeners.loginStateChanged(false, 'logout', e.response);
      });
      this.jssipUA.on('registrationFailed', function (e) {
        var statusCode = e.response ? e.response.status_code : 0;

        if (statusCode >= 300 && statusCode < 400) {
          var contact = e.response.parseHeader('contact');

          if (contact) {
            var cu = contact.uri;
            var url = 'wss://' + cu.host;

            if (cu.port && cu.port !== 443) {
              url += ':' + cu.port.toString();
            }

            AudioCodesUA.ac_log("AC: registerRedirect(\"".concat(url, "\")"));
            if (_this.jssipUA.registerRedirect(url)) return; // skip 'login failed' callback
          } else {
            AudioCodesUA.ac_log('AC: 3xx response without "Contact" is ignored');
          }
        } else if (statusCode >= 500 && statusCode < 600 && AudioCodesUA.instance.modes.sbc_switch_register5xx_mode) {
          if (AudioCodesUA.instance.switchSBC(false)) return; // skip 'login failed', 'logout' callbacks
        }

        AudioCodesUA.ac_log('AC>>: loginStateChanged: isLogin=false "login failed"');

        _this.listeners.loginStateChanged(false, 'login failed', e.response ? e.response : null);
      });

      if (this.listeners.incomingMessage) {
        this.jssipUA.on('newMessage', function (e) {
          if (e.originator !== 'remote') return; // ignore outgoing message.

          AudioCodesUA.ac_log('AC>>: incomingMessage', e); // null, from, content-type?, body?, request

          _this.listeners.incomingMessage(null, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);
        });
      }

      if (this.listeners.incomingNotify) {
        this.jssipUA.on('sipEvent', function (e) {
          AudioCodesUA.ac_log('AC>>: incoming out of dialog NOTIFY', e); // null, event, from, content-type? , body?, request

          var taken = _this.listeners.incomingNotify(null, e.event ? e.event.event : null, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);

          if (!taken) {
            e.request.reply(481);
          }
        });
      }

      if (this.listeners.incomingSubscribe) {
        this.jssipUA.on('newSubscribe', function (e) {
          var subs = e.request;
          var ev = subs.parseHeader('event');
          var accepts = subs.getHeaders('accept');
          AudioCodesUA.ac_log('AC>>: incomingSubscribe', subs, ev.event, accepts);

          var code = _this.listeners.incomingSubscribe(subs, ev.event, accepts);

          if (code > 0) subs.reply(code);
        });
      }

      this.jssipUA.on('newRTCSession', function (e) {
        AudioCodesUA.ac_log("AC: event ".concat(e.originator === 'remote' ? 'incoming' : 'outgoing', " \"newRTCSession\""), e);
        var call = new AudioCodesSession(e.session); // In-dialog incoming NOTIFY.
        // Works only in modified jssip where added the event

        call.js_session.on('sipEvent', function (e) {
          if (!AudioCodesUA.instance.listeners.incomingNotify) return;
          var ac_session = this.data.ac_session;
          AudioCodesUA.ac_log('AC>>: incoming NOTIFY', ac_session, e); // call?, event, from, content-type? , body?, request. return true when notify accepted.

          e.taken = AudioCodesUA.instance.listeners.incomingNotify(ac_session, e.event ? e.event.event : null, AudioCodesUA.instance._get_from(e.request), AudioCodesUA.instance._get_content_type(e.request), e.request.body, e.request);
        });
        call.js_session.on('newInfo', function (e) {
          if (!AudioCodesUA.instance.listeners.incomingInfo) return;
          if (e.originator === 'local') return;
          var ac_session = this.data.ac_session;
          AudioCodesUA.ac_log('AC>>: incoming INFO', ac_session, e); // call, from, content-type? , body?, request

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
          var filter = AudioCodesUA.instance.codecFilter;

          if (filter) {
            AudioCodesUA.instance._cf_filter('audio', this.data.ac_session, filter.audio);

            AudioCodesUA.instance._cf_filter('video', this.data.ac_session, filter.video);
          }
        });
        call.js_session.on('reinvite', function (e) {
          if (!AudioCodesUA.instance.listeners.callIncomingReinvite) return;
          var ac_session = this.data.ac_session;
          AudioCodesUA.ac_log('AC>>: callIncomingReinvite start');
          AudioCodesUA.instance.listeners.callIncomingReinvite(ac_session, true, e.request);

          e.callback = function () {
            AudioCodesUA.ac_log('AC>>: callIncomingIncomingReinvite end');
            AudioCodesUA.instance.listeners.callIncomingReinvite(ac_session, false, null);
          };
        });
        call.js_session.on('hold', function (e) {
          var ac_session = this.data.ac_session;
          var isRemote = e.originator === 'remote';
          AudioCodesUA.ac_log("AC>>: callHoldStateChanged isHold=true isRemote=".concat(isRemote, " session:"), ac_session);
          AudioCodesUA.instance.listeners.callHoldStateChanged(ac_session, true, isRemote);
        });
        call.js_session.on('unhold', function (e) {
          var ac_session = this.data.ac_session;
          var isRemote = e.originator === 'remote';
          AudioCodesUA.ac_log("AC>>: callHoldStateChanged isHold=false isRemote=".concat(isRemote, " session:"), ac_session);
          AudioCodesUA.instance.listeners.callHoldStateChanged(ac_session, false, isRemote);
        });
        call.js_session.on('progress', function (e) {
          if (e.originator === 'remote') {
            var ac_session = this.data.ac_session;
            AudioCodesUA.ac_log('AC>>: outgoingCallProgress', ac_session);
            AudioCodesUA.instance.listeners.outgoingCallProgress(ac_session, e.response);
          }
        });
        call.js_session.on('failed', function (e) {
          var ac_session = this.data.ac_session;
          var contact = null;

          if (e.cause === 'Redirected' && e.message && e.message.headers) {
            var nameAddress = e.message.parseHeader('Contact');

            if (nameAddress) {
              contact = nameAddress.uri.toString();
            }
          }

          AudioCodesUA.ac_log('AC>>: callTerminated (failed)', ac_session, e.cause, contact);
          AudioCodesUA.instance.listeners.callTerminated(ac_session, e.message, e.cause, contact);
        });
        call.js_session.on('accepted', function (e) {
          var ac_session = this.data.ac_session;
          ac_session.data['_accepted'] = true; // means sent or received OK

          if (e.originator === 'remote') {
            // Outgoing call
            ac_session.data['_ok_response'] = e.response;
          }
        }); // Remove listener that close replaced session when replaces confirmed

        if (e.originator === 'remote' && AudioCodesUA.instance.replacedCall !== null) call.js_session.removeAllListeners('confirmed');
        call.js_session.on('confirmed', function () {
          var ac_session = this.data.ac_session;
          var okResponse = null;
          var cause;

          if ('_ok_response' in ac_session.data) {
            okResponse = ac_session.data['_ok_response'];
            delete ac_session.data['_ok_response'];
            cause = 'ACK sent';
          } else {
            cause = 'ACK received';
          } // Video call /audio answer, no sound on answer side issue. Firefox workaround


          if (call.data['_video_call_audio_answer_firefox']) {
            call.data['_video_call_audio_answer_firefox'] = false;
            AudioCodesUA.ac_log('AC: [video call/audio answer] Firefox workaround. Send re-INVITE');
            call.sendReInvite({
              showStreams: true
            });
          }

          AudioCodesUA.ac_log('AC>>: callConfirmed', ac_session, cause);

          AudioCodesUA.instance._onActiveCallsChange.call(AudioCodesUA.instance, 1);

          AudioCodesUA.instance.listeners.callConfirmed(ac_session, okResponse, cause);
        });
        call.js_session.on('ended', function (e) {
          var ac_session = this.data.ac_session;

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
            var ac_session = this.data.ac_session;
            var accept;

            if (AudioCodesUA.instance.listeners.transfereeRefer) {
              accept = AudioCodesUA.instance.listeners.transfereeRefer(ac_session, e.request);
            } else {
              accept = true;
            }

            if (accept) {
              AudioCodesUA.ac_log('AC>>: incoming REFER accepted'); // Set new call video according current call

              var sendVideo;

              if (ac_session.isScreenSharing()) {
                sendVideo = ac_session.doesScreenSharingReplaceCamera();
              } else {
                sendVideo = ac_session.hasSendVideo();
              }

              var options = AudioCodesUA.instance._callOptions(sendVideo, true);

              e.accept(function (e) {
                e.data['_created_by_refer'] = ac_session;
              }, options);
            } else {
              AudioCodesUA.ac_log('AC>>: incoming REFER rejected');
              e.reject();
            }
          }
        }); // Set the call flag according phone setting.

        call._setEnabledReceiveVideo(AudioCodesUA.instance.enableAddVideo); // If connection is already exists set listener.
        // otherwise wait until connection will be created.


        if (call.js_session.connection) {
          AudioCodesUA.instance._set_connection_listener(call);

          AudioCodesUA.ac_log('AC: connection exists, set "track" listener');
        } else {
          AudioCodesUA.ac_log('AC: peer connection does not exist, wait creation');
          call.js_session.on('peerconnection', function () {
            AudioCodesUA.instance._set_connection_listener(call);

            AudioCodesUA.ac_log('AC: [event connection] connection created, set "track" listener');
          });
        }

        var remote;

        if (e.originator === 'remote') {
          remote = e.request.from;
        } else {
          remote = e.request.to;
        } // set call data


        call.data['_user'] = remote.uri.user;
        call.data['_host'] = remote.uri.host;
        call.data['_display_name'] = remote.display_name; // optional

        call.data['_create_time'] = new Date();

        if (e.originator === 'remote') {
          var replacedCall = null;

          if (AudioCodesUA.instance.replacedCall !== null) {
            replacedCall = AudioCodesUA.instance.replacedCall;
            AudioCodesUA.instance.replacedCall = null;
          } // Incoming call. Set video flags according m=video in SDP.


          var send, recv, hasSDP;

          if (e.request.body) {
            hasSDP = true;
            var sdp = new AudioCodesSDP(e.request.body);

            var _sdp$getMediaDirectio = sdp.getMediaDirection('video', true);

            var _sdp$getMediaDirectio2 = _slicedToArray(_sdp$getMediaDirectio, 2);

            send = _sdp$getMediaDirectio2[0];
            recv = _sdp$getMediaDirectio2[1];
          } else {
            hasSDP = false;
            call.data['_incoming_invite_without_sdp'] = true;
            send = recv = true; // to enable answer with or without video.

            AudioCodesUA.ac_log('AC: warning incoming INVITE without SDP');
          }

          call._setVideoState(send, recv);

          AudioCodesUA.ac_log("AC>>: incomingCall ".concat(call.hasVideo() ? 'video' : 'audio', " from \"").concat(call.data._display_name, "\" ").concat(call.data._user), call, replacedCall);
          AudioCodesUA.instance.listeners.incomingCall(call, e.request, replacedCall, hasSDP);
        } else {
          // e.originator === 'local'
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
  }, {
    key: "_get_from",
    value: function _get_from(msg) {
      return {
        user: msg.from.uri.user,
        host: msg.from.uri.host,
        displayName: msg.from.display_name ? msg.from.display_name : null
      };
    }
  }, {
    key: "_get_content_type",
    value: function _get_content_type(msg) {
      var ct = msg.headers['Content-Type'];
      return ct && ct.length > 0 ? ct[0].parsed : null;
    }
  }, {
    key: "_set_connection_listener",
    value: function _set_connection_listener(call) {
      AudioCodesUA.instance.getWR().connection.addEventListener(call.js_session.connection, 'track', function (e) {
        AudioCodesUA.ac_log("AC>>: \"track\" event kind= ".concat(e.track.kind), e); // save call remote stream

        if (e.streams.length > 0) {
          // if track is in stream
          var stream = e.streams[0];
          AudioCodesUA.ac_log("AC: set call remote stream id=".concat(stream.id), call);
          call.data['_remoteMediaStream'] = stream;
        } else {
          AudioCodesUA.ac_log('AC: Warning "track" event without stream');
        }

        if (e.track.kind === 'video') {
          if (!call.hasEnabledReceiveVideo()) {
            // Video call - audio answer, no sound on answer side issue. Patch for Safari.
            if (call.data['_video_call_audio_answer_safari']) {
              e.track.onmute = function () {
                AudioCodesUA.ac_log('AC: [video call/audio answer] Safari fix. Fired video track "mute" event.  Call callShowStream');
                e.track.onmute = null;
                var localStream = call.getRTCLocalStream();
                var remoteStream = call.getRTCRemoteStream();
                AudioCodesUA.ac_log('AC>>: callShowStreams', call, localStream, remoteStream);
                AudioCodesUA.instance.listeners.callShowStreams(call, localStream, remoteStream);
              };

              AudioCodesUA.ac_log('AC: [video call/audio answer] Safari fix. Set video track "mute" event listener');
              call.data['_video_call_audio_answer_safari'] = false;
            }

            AudioCodesUA.ac_log('AC>>: event "track" video and !hasEnabledReceiveVideo therefore change transceiver direction.', call);
            var vt = AudioCodesUA.instance.getWR().connection.getTransceiver(call.js_session.connection, 'video');

            if (vt !== null) {
              var dir = call.hasEnabledSendVideo() ? 'sendonly' : 'inactive';
              AudioCodesUA.instance.getWR().transceiver.setDirection(vt, dir);
            }
          }

          if (AudioCodesUA.instance.codecFilter) {
            AudioCodesUA.instance._cf_filter('video', call, AudioCodesUA.instance.codecFilter.video);
          } // No call callShowStreams() for event 'track' video, because we use the same stream for audio and video.
          // and to prevent calling callShowStreams twice and use wrong video flags.


          return;
        }

        var localStream = call.getRTCLocalStream();
        var remoteStream = call.getRTCRemoteStream();
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

  }, {
    key: "_check_remote_sdp",
    value: function _check_remote_sdp(sdp, data) {
      try {
        if (!data.codec_map) {
          data.codec_map = {};
        }

        var mAudio = sdp.getMedia('audio');

        AudioCodesUA.instance._check_remote_m(mAudio, data.codec_map);

        var mVideo = sdp.getMedia('video');

        if (mVideo) {
          AudioCodesUA.instance._check_remote_m(mVideo, data.codec_map);
        }
      } catch (e) {
        AudioCodesUA.ac_log('AC:SDP exception', e);
      }
    }
  }, {
    key: "_check_remote_m",
    value: function _check_remote_m(m, previous) {
      // Collect current SDP information
      // pt : { rtpmap:xxx, [fmtp: yyy] }
      var current = {};

      function parse(offset, str) {
        var ix = str.indexOf(' ', offset);
        if (ix === -1) return ['?', '?'];
        return [str.substring(offset, ix), str.substring(ix + 1).toLowerCase()];
      }

      var _iterator3 = _createForOfIteratorHelper(m),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var l = _step3.value;

          if (l.startsWith('a=rtpmap:')) {
            var _parse = parse(9, l),
                _parse2 = _slicedToArray(_parse, 2),
                _pt = _parse2[0],
                rtpmap = _parse2[1];

            if (!current[_pt]) current[_pt] = {};
            current[_pt].rtpmap = rtpmap;
          } else if (l.startsWith('a=fmtp:')) {
            var _parse3 = parse(7, l),
                _parse4 = _slicedToArray(_parse3, 2),
                _pt2 = _parse4[0],
                fmtp = _parse4[1];

            if (!current[_pt2]) current[_pt2] = {};
            current[_pt2].fmtp = fmtp;
          }
        } // AudioCodesUA.ac_log(`current ` + JSON.stringify(current, null, 2));
        // AudioCodesUA.ac_log(`previous ` + JSON.stringify(previous, null, 2));
        // Compare current SDP information with previous one.

      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      for (var _i2 = 0, _Object$keys = Object.keys(current); _i2 < _Object$keys.length; _i2++) {
        var pt = _Object$keys[_i2];

        if (previous[pt]) {
          if (current[pt].rtpmap === previous[pt].rtpmap) {
            if (current[pt].fmtp !== previous[pt].fmtp) {
              AudioCodesUA.ac_log("AC:SDP [The same payload type and codec name, different fmtp] pt=".concat(pt, " rtpmap=").concat(current[pt].rtpmap, " fmtp=").concat(current[pt].fmtp, ", previously was fmtp=").concat(previous[pt].fmtp));
            }
          } else {
            // Check that used dynamic payload type or both rtpmat is defined.
            if (parseInt(pt) >= 64 || !!current[pt].rtpmap && !!previous[pt].rtpmap) {
              AudioCodesUA.ac_log("AC:SDP [The same payload type, different codec names] pt=".concat(pt, " rtpmap=").concat(current[pt].rtpmap, ", previously was rtpmap=").concat(previous[pt].rtpmap));
            }
          }
        } else {
          var data = current[pt];
          var foundPt = void 0;

          for (var _i3 = 0, _Object$entries = Object.entries(previous); _i3 < _Object$entries.length; _i3++) {
            var _Object$entries$_i = _slicedToArray(_Object$entries[_i3], 2),
                pt1 = _Object$entries$_i[0],
                data1 = _Object$entries$_i[1];

            if (data.rtpmap === data1.rtpmap && data.fmtp === data1.fmtp) {
              foundPt = pt1;
              break;
            }
          }

          if (foundPt) {
            var prevData = previous[foundPt];

            if (!data.fmtp && !prevData.fmtp) {
              AudioCodesUA.ac_log("AC:SDP [The same codec name used with different payload types] pt=".concat(pt, " rtpmap=").concat(data.rtpmap, ", previously was pt=").concat(foundPt, " rtpmap=").concat(prevData.rtpmap));
            } else {
              AudioCodesUA.ac_log("AC:SDP [The same codec name used with different payload types] pt=".concat(pt, " rtpmap=").concat(data.rtpmap, " fmtp=").concat(data.fmtp, ", previously was pt=").concat(foundPt, " rtpmap=").concat(prevData.rtpmap, " fmtp=").concat(prevData.fmtp));
            }
          } else {
            previous[pt] = data;
          }
        }
      }
    }
  }, {
    key: "_sdp_checking",
    value: function _sdp_checking(js_session, e) {
      var type = e.originator + ' ' + e.type;
      var ac_session = js_session.data.ac_session;
      var sdp, send, recv;

      try {
        sdp = new AudioCodesSDP(e.sdp);

        var _sdp$getMediaDirectio3 = sdp.getMediaDirection('video', e.originator === 'remote');

        var _sdp$getMediaDirectio4 = _slicedToArray(_sdp$getMediaDirectio3, 2);

        send = _sdp$getMediaDirectio4[0];
        recv = _sdp$getMediaDirectio4[1];
      } catch (e) {
        AudioCodesUA.ac_log('AC: cannot parse SDP', e);
        return;
      }

      var initial = ac_session.data._initial;
      if (e.type === 'answer') // after 1st answer it's not initial SDP negotiation.
        ac_session.data._initial = false;
      AudioCodesUA.ac_log("AC: Event \"sdp\" ".concat(initial ? 'initial' : '', " ").concat(type, "   Session state:").concat(AudioCodesUA.getSessionStatusName(js_session._status)));

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

          if (ac_session.isLocalHold() || ac_session.isRemoteHold()) break; // ignore hold re-INVITE

          ac_session._setVideoState(send, recv);

          break;

        case 'local offer':
          if (AudioCodesUA.instance.networkPriority) {
            AudioCodesUA.instance._set_senders_dscp(js_session);
          }

          break;

        case 'local answer':
          if (ac_session.isLocalHold() || ac_session.isRemoteHold()) break; // ignore hold re-INVITE

          if (AudioCodesUA.instance.networkPriority) {
            AudioCodesUA.instance._set_senders_dscp(js_session);
          }

          ac_session._setVideoState(send, recv);

          break;
      }
    }
  }, {
    key: "_set_senders_dscp",
    value: function _set_senders_dscp(js_session) {
      if (AudioCodesUA.instance.browser !== 'chrome') return;
      AudioCodesUA.ac_log('AC: _set_senders_dscp()');
      var priority = AudioCodesUA.instance.networkPriority;

      AudioCodesUA.instance._set_dscp(js_session, 'audio', priority);

      AudioCodesUA.instance._set_dscp(js_session, 'video', priority);
    }
  }, {
    key: "_set_dscp",
    value: function _set_dscp(js_session, type, priority) {
      var conn = js_session.connection;
      var tr = AudioCodesUA.instance.getWR().connection.getTransceiver(conn, type);
      if (!tr && type === 'video') return Promise.resolve(false);
      return Promise.resolve().then(function () {
        var params = tr.sender.getParameters();
        if (!params) throw new Error('sender getParameters() returns undefined');
        var encodings = params.encodings;
        if (!encodings) throw new Error('parameters encodings is undefined');
        if (encodings.length === 0) throw new Error('parameters encodings is empty array');
        var previous = encodings[0].networkPriority;
        if (!previous) throw new Error('parameters encodings networkPriority is undefined');
        if (previous === priority) return true; // nothing to do.

        encodings[0].networkPriority = priority;
        return tr.sender.setParameters(params).then(function () {
          AudioCodesUA.ac_log("AC: DSCP: ".concat(type, " \"").concat(priority, "\""));
          return true;
        });
      })["catch"](function (e) {
        AudioCodesUA.ac_log("AC: DSCP: ".concat(type, " error: ").concat(e));
        return false;
      });
    } // Codec filter

  }, {
    key: "_cf_unpack",
    value: function _cf_unpack(obj) {
      // Unpack 'pcmu', 'pcmu/8000'  'VP9#profile-id=0'
      function unpack(type, s) {
        var slash = s.indexOf('/');
        var num = s.indexOf('#');
        var end;
        end = slash !== -1 ? slash : num !== -1 ? num : undefined;
        var res = {
          mimeType: (type + '/' + s.substring(0, end)).toLowerCase()
        };

        if (slash !== -1) {
          end = num !== -1 ? num : undefined;
          res.clockRate = parseInt(s.substring(slash + 1, end));
        }

        if (num !== -1) {
          res.sdpFmtpLine = s.substring(num + 1);
        }

        return res;
      }

      if (!obj) return null;
      var result = {};

      var _loop = function _loop(type) {
        result[type] = {};

        for (var op in obj[type]) {
          result[type][op] = obj[type][op].map(function (s) {
            return unpack(type, s);
          });
        }
      };

      for (var type in obj) {
        _loop(type);
      }

      return result;
    }
  }, {
    key: "_cf_pack",
    value: function _cf_pack(codecs) {
      function pack(c) {
        var r = c.mimeType.substring(6).toLowerCase();
        if (c.clockRate) r += '/' + c.clockRate;
        if (c.sdpFmtpLine) r += '#' + c.sdpFmtpLine;
        return r;
      }

      return codecs.map(function (c) {
        return pack(c);
      });
    }
  }, {
    key: "_cf_str",
    value: function _cf_str(codecs) {
      return JSON.stringify(AudioCodesUA.instance._cf_pack(codecs));
    }
  }, {
    key: "_cf_match",
    value: function _cf_match(codec, filters) {
      var mimeType = codec.mimeType.toLowerCase();

      var _iterator4 = _createForOfIteratorHelper(filters),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var filter = _step4.value;

          if (filter.mimeType === mimeType) {
            if (filter.clockRate && filter.clockRate !== codec.clockRate) continue;
            if (filter.sdpFmtpLine && filter.sdpFmtpLine !== codec.sdpFmtpLine) continue;
            return true;
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      return false;
    }
  }, {
    key: "_cf_find",
    value: function _cf_find(filter, codecs) {
      var found = [];

      var _iterator5 = _createForOfIteratorHelper(codecs),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var codec = _step5.value;
          var mimeType = codec.mimeType.toLowerCase();

          if (filter.mimeType === mimeType) {
            if (filter.clockRate && filter.clockRate !== codec.clockRate) continue;
            if (filter.sdpFmtpLine && filter.sdpFmtpLine !== codec.sdpFmtpLine) continue;
            found.push(codec);
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      return found;
    }
  }, {
    key: "_cf_filter",
    value: function _cf_filter(type, call, filter) {
      if (!filter) return; // Used once for audio and once for video 

      if (call.data["_used_".concat(type, "_codec_filter")]) return;

      try {
        var conn = call.getRTCPeerConnection();
        var transceiver = AudioCodesUA.instance.getWR().connection.getTransceiver(conn, type);

        if (!transceiver) {
          if (type === 'audio') AudioCodesUA.ac_log('AC: codec-filter: cannot get audio transceiver');
          return;
        }

        call.data["_used_".concat(type, "_codec_filter")] = true;

        if (!RTCRtpSender.getCapabilities || !RTCRtpReceiver.getCapabilities || !transceiver.setCodecPreferences) {
          AudioCodesUA.ac_log("AC: codec-filter is not supported.");
          return;
        }

        var sndCodecs = RTCRtpSender.getCapabilities(type).codecs;
        var rcvCodecs = RTCRtpReceiver.getCapabilities(type).codecs;
        var uniqRcvCodecs = [];

        var _iterator6 = _createForOfIteratorHelper(rcvCodecs),
            _step6;

        try {
          var _loop3 = function _loop3() {
            var rc = _step6.value;
            var ix = sndCodecs.findIndex(function (sc) {
              return rc.mimeType === sc.mimeType && rc.clockRate === sc.clockRate && rc.sdpFmtpLine === sc.sdpFmtpLine;
            });
            if (ix === -1) uniqRcvCodecs.push(rc);
          };

          for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
            _loop3();
          }
          /*
          AudioCodesUA.ac_log(`AC: ${type} codec-filter original [sender]: ${AudioCodesUA.instance._cf_str(sndCodecs)}`);
          AudioCodesUA.ac_log(`AC: ${type} codec-filter original [receiver]: ${AudioCodesUA.instance._cf_str(rcvCodecs)}`);
          AudioCodesUA.ac_log(`AC: ${type} codec-filter original [unique receiver]: ${AudioCodesUA.instance._cf_str(uniqRcvCodecs)}`);
          */

        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }

        var codecs = sndCodecs.concat(uniqRcvCodecs);
        AudioCodesUA.ac_log("AC: ".concat(type, " codec-filter original: ").concat(AudioCodesUA.instance._cf_str(codecs), "\n(receiver: ").concat(uniqRcvCodecs.length, ")"));

        if (filter.remove && filter.remove.length > 0) {
          var len0 = codecs.length;
          codecs = codecs.filter(function (codec) {
            return !AudioCodesUA.instance._cf_match(codec, filter.remove);
          });

          if (codecs.length < len0) {
            AudioCodesUA.ac_log("AC: ".concat(type, " codec-filter remaining: ").concat(AudioCodesUA.instance._cf_str(codecs)));
          }
        }

        if (filter.priority && filter.priority.length > 0) {
          var newCodecs = [];

          var _iterator7 = _createForOfIteratorHelper(filter.priority),
              _step7;

          try {
            var _loop2 = function _loop2() {
              var cf = _step7.value;

              var found = AudioCodesUA.instance._cf_find(cf, codecs);

              if (found.length === 0) return "continue";
              newCodecs = newCodecs.concat(found);
              codecs = codecs.filter(function (codec) {
                return !found.includes(codec);
              });
            };

            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              var _ret = _loop2();

              if (_ret === "continue") continue;
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }

          codecs = newCodecs.concat(codecs);
          AudioCodesUA.ac_log("AC: ".concat(type, " codec-filter changed priority: ").concat(AudioCodesUA.instance._cf_str(codecs)));
        }

        transceiver.setCodecPreferences(codecs);
        return;
      } catch (e) {
        AudioCodesUA.ac_log('AC: codec filter exception', e);
        return;
      }
    } // end of codec filter

  }, {
    key: "_convertIceList",
    value: function _convertIceList(ices) {
      var result = [];

      var _iterator8 = _createForOfIteratorHelper(ices),
          _step8;

      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var entry = _step8.value;

          // convert short form of stun server to object
          if (typeof entry === 'string') {
            entry = {
              'urls': 'stun:' + entry
            };
          }

          result.push(entry);
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }

      return result;
    }
  }, {
    key: "_randomToken",
    value: function _randomToken(size) {
      var t = '';

      for (var i = 0; i < size; i++) {
        t += Math.floor(Math.random() * 36).toString(36);
      }

      return t;
    }
  }, {
    key: "_detectBrowser",
    value: function _detectBrowser() {
      try {
        var ua = navigator.userAgent;
        this.browser = 'other';
        this.browserName = ua;
        this.browserVersion = 0;

        if (navigator.mozGetUserMedia) {
          this.browser = 'firefox';
          this.browserName = ua.match(/Firefox\/([.\d]+)$/)[0];
          this.browserVersion = parseInt(ua.match(/Firefox\/(\d+)\./)[1], 10);
        } else if (navigator.webkitGetUserMedia) {
          // Only works for secure connection.
          this.browser = 'chrome';
          this.browserName = ua.match(/Chrom(e|ium)\/([\d]+)/)[0];
          this.browserVersion = parseInt(ua.match(/Chrom(e|ium)\/(\d+)\./)[2], 10); // Detect known Chromium based browsers: Edge, Opera etc - classified as 'chrome'

          var ual = ua.toLowerCase();

          for (var ix = 0; ix < this.chromiumBased.length; ix++) {
            var s = this.chromiumBased[ix].s;
            var f = ual.indexOf(s);

            if (f !== -1) {
              var v = ual.substring(f + s.length).match(/([.\d]+)/)[1];
              this.browserName += ' (' + this.chromiumBased[ix].n + '/' + v + ')';
              break;
            }
          }
        } else if (window.safari) {
          this.browser = 'safari';
          this.browserName = 'Safari/' + ua.match(/Version\/([.\d]+)/)[1];
          this.browserVersion = parseInt(ua.match(/Version\/(\d+)\./)[1], 10);
        } else if (ua.indexOf('Edge/') !== -1) {
          // legacy Edge
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
    } // windows,android,macos,ios,linux,other

  }, {
    key: "_detectOS",
    value: function _detectOS() {
      this._detectOS1();

      if (this.os !== 'other') return;

      this._detectOS2();
    }
  }, {
    key: "_detectOS1",
    value: function _detectOS1() {
      try {
        var p = navigator.userAgentData ? navigator.userAgentData.platform : false;
        if (!p) return;
        p = p.toLowerCase();
        if (p === 'windows' || p === 'linux' || p === 'android' || p === 'macos') this.os = p;
      } catch (e) {
        AudioCodesUA.ac_log('AC: detectOS1 error', e);
        this.os = 'other';
      }
    }
  }, {
    key: "_detectOS2",
    value: function _detectOS2() {
      try {
        var p = navigator.platform;
        if (!p) return;
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
  }, {
    key: "_mediaConstraints",
    value: function _mediaConstraints(sendVideo) {
      var inst = AudioCodesUA.instance;
      var constraints = {
        'audio': inst.constraints.audio
      };

      if (sendVideo) {
        constraints.video = inst.constraints.video;
      }

      return constraints;
    }
  }, {
    key: "_callOptions",
    value: function _callOptions(sendVideo, isOutgoing) {
      var extraHeaders = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var extraOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      var options = {};
      var inst = AudioCodesUA.instance; // No need since Chrome 102, see: https://groups.google.com/g/discuss-webrtc/c/85e-f_siCws

      if (inst.browser === 'chrome' && inst.networkPriority) {
        options = {
          rtcConstraints: {
            optional: [{
              googDscp: true
            }]
          }
        };
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

  }, {
    key: "call",
    value: function call(videoOption, call_to) {
      var extraHeaders = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var extraOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      // Convert boolean value to Symbol
      if (videoOption === false) videoOption = AudioCodesUA.instance.AUDIO;else if (videoOption === true) videoOption = AudioCodesUA.instance.VIDEO;
      if (_typeof(videoOption) !== 'symbol' || ![AudioCodesUA.instance.AUDIO, AudioCodesUA.instance.VIDEO].includes(videoOption)) throw new TypeError("Illegal videoOption=".concat(videoOption.toString()));
      call_to = call_to.replace(/\s+/g, ''); // remove whitespaces.

      AudioCodesUA.ac_log("AC: call ".concat(videoOption.description, " to ").concat(call_to));

      var options = this._callOptions(videoOption === AudioCodesUA.instance.VIDEO, true, extraHeaders, extraOptions);

      var js_session = this.jssipUA.call(call_to, options);
      if (options.mediaStream) js_session._localMediaStreamLocallyGenerated = true; // to enable jssip close the stream

      var ac_session = js_session.data.ac_session;

      ac_session._setEnabledSendVideo(videoOption === AudioCodesUA.instance.VIDEO);

      if (videoOption === AudioCodesUA.instance.VIDEO) ac_session._setEnabledReceiveVideo(true);
      return ac_session;
    }
  }, {
    key: "sendMessage",
    value: function sendMessage(to, body) {
      var _this2 = this;

      var contentType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'text/plain';
      AudioCodesUA.ac_log("AC: sendMessage to: ".concat(to, " \"").concat(body, "\""));
      return new Promise(function (resolve, reject) {
        var options = {
          contentType: contentType,
          eventHandlers: {
            succeeded: function succeeded(e) {
              return resolve(e);
            },
            failed: function failed(e) {
              return reject(e);
            }
          }
        };

        _this2.jssipUA.sendMessage(to, body, options);
      });
    }
  }, {
    key: "isScreenSharingSupported",
    value: function isScreenSharingSupported() {
      return AudioCodesUA.instance.getWR().hasDisplayMedia();
    }
  }, {
    key: "openScreenSharing",
    value: function openScreenSharing() {
      if (!this.isScreenSharingSupported()) {
        AudioCodesUA.ac_log('AC: openScreenSharing: screen sharing is not supported in the browser');
        return Promise.reject('Screen sharing is not supported');
      }

      AudioCodesUA.ac_log('AC: openScreenSharing()');
      return AudioCodesUA.instance.getWR().getDisplayMedia().then(function (stream) {
        return stream;
      })["catch"](function (e) {
        AudioCodesUA.ac_log('AC: openScreenSharing() error', e);
        throw e;
      });
    }
  }, {
    key: "closeScreenSharing",
    value: function closeScreenSharing(displayStream) {
      AudioCodesUA.ac_log('AC: closeScreenSharing()');

      if (displayStream) {
        var tracks = displayStream.getVideoTracks();
        if (tracks.length == 0) return;
        var track = tracks[0];

        if (track.readyState === 'live') {
          track.stop();
          track.dispatchEvent(new Event("ended"));
        }
      }
    }
  }, {
    key: "setNetworkPriority",
    value: function setNetworkPriority(p) {
      AudioCodesUA.ac_log("AC: setNetworkPriority ".concat(p));
      if (p !== undefined && p !== 'high' && p !== 'medium' && p !== 'low' && p !== 'very-low') throw new TypeError("setNetworkPriority: illegal value: ".concat(p));
      this.networkPriority = p;
    }
  }, {
    key: "subscribe",
    value: function subscribe() {
      var _this$jssipUA;

      return (_this$jssipUA = this.jssipUA).subscribe.apply(_this$jssipUA, arguments);
    }
  }, {
    key: "notify",
    value: function notify() {
      var _this$jssipUA2;

      return (_this$jssipUA2 = this.jssipUA).notify.apply(_this$jssipUA2, arguments);
    }
    /**
     * Experimental JsSIP extension: another SIP credential.
     * Use it before phone.init() if SUBSCRIBE authentication is different from REGISTER
     */

  }, {
    key: "addCredential",
    value: function addCredential(credential) {
      if (!credential.realm || !credential.password || !credential.username) throw new TypeError('wrong credential structure');
      this.credentials.push(credential);
    }
  }], [{
    key: "getSessionStatusName",
    value: function getSessionStatusName(status) {
      switch (status) {
        case 0:
          return 'NULL (0)';

        case 1:
          return 'INVITE_SENT (1)';

        case 2:
          return '1XX_RECEIVED (2)';

        case 3:
          return 'INVITE_RECEIVED (3)';

        case 4:
          return 'WAITING_FOR_ANSWER (4)';

        case 5:
          return 'ANSWERED (5)';

        case 6:
          return 'WAITING_FOR_ACK (6)';

        case 7:
          return 'CANCELED (7)';

        case 8:
          return 'TERMINATED (8)';

        case 9:
          return 'CONFIRMED (9)';

        default:
          return 'Unknown (' + status + ')';
      }
    }
  }]);

  return AudioCodesUA;
}();
/*
 * Session
 */


var AudioCodesSession = /*#__PURE__*/function () {
  function AudioCodesSession(js_session) {
    _classCallCheck(this, AudioCodesSession);

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

  _createClass(AudioCodesSession, [{
    key: "getRTCPeerConnection",
    value: function getRTCPeerConnection() {
      return this.js_session.connection;
    }
  }, {
    key: "getRTCLocalStream",
    value: function getRTCLocalStream() {
      return this.js_session._localMediaStream;
    }
  }, {
    key: "getRTCRemoteStream",
    value: function getRTCRemoteStream() {
      return this.data['_remoteMediaStream'];
    }
  }, {
    key: "isEstablished",
    value: function isEstablished() {
      return this.js_session.isEstablished();
    }
  }, {
    key: "isTerminated",
    value: function isTerminated() {
      return this.js_session.isEnded();
    }
  }, {
    key: "isOutgoing",
    value: function isOutgoing() {
      return this.js_session.direction === 'outgoing';
    }
  }, {
    key: "isAudioMuted",
    value: function isAudioMuted() {
      return this.js_session.isMuted().audio;
    }
  }, {
    key: "isVideoMuted",
    value: function isVideoMuted() {
      return this.js_session.isMuted().video;
    }
  }, {
    key: "wasAccepted",
    value: function wasAccepted() {
      return this.data['_accepted'] === true;
    }
  }, {
    key: "getReplacesHeader",
    value: function getReplacesHeader() {
      if (!this.js_session.isEstablished() || !this.js_session._dialog) {
        AudioCodesUA.ac_log('getReplacesHeader(): call is not established');
        return null;
      }

      var id = this.js_session._dialog.id;
      return "".concat(id.call_id, ";to-tag=").concat(id.remote_tag, ";from-tag=").concat(id.local_tag);
    }
  }, {
    key: "muteAudio",
    value: function muteAudio(set) {
      AudioCodesUA.ac_log("AC: muteAudio() arg=".concat(set, " "));

      if (set) {
        this.js_session.mute({
          audio: true,
          video: false
        });
      } else {
        this.js_session.unmute({
          audio: true,
          video: false
        });
      }
    }
  }, {
    key: "muteVideo",
    value: function muteVideo(set) {
      AudioCodesUA.ac_log("AC: muteVideo() arg=".concat(set, " "));

      if (set) {
        this.js_session.mute({
          audio: false,
          video: true
        });
      } else {
        this.js_session.unmute({
          audio: false,
          video: true
        });
      }
    }
  }, {
    key: "sendDTMF",
    value: function sendDTMF(tone) {
      var useWebRTC = AudioCodesUA.instance.dtmfUseWebRTC;

      if (useWebRTC && AudioCodesUA.instance.browser === 'safari') {
        var dtmfSender = AudioCodesUA.instance.getWR().connection.getDTMFSender(this.js_session.connection);

        if (dtmfSender === undefined) {
          // If used obsolete Safari send DTMF as SIP INFO
          useWebRTC = false;
        }
      }

      AudioCodesUA.ac_log("AC: sendDTMF() tone=".concat(tone, " ").concat(useWebRTC ? '[RFC2833]' : '[INFO]'));
      var options = {
        duration: AudioCodesUA.instance.dtmfDuration,
        interToneGap: AudioCodesUA.instance.dtmfInterToneGap,
        transportType: useWebRTC ? 'RFC2833' : 'INFO'
      };
      this.js_session.sendDTMF(tone, options);
    }
  }, {
    key: "sendInfo",
    value: function sendInfo(body, contentType) {
      var extraHeaders = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      AudioCodesUA.ac_log('AC: sendInfo()', body, contentType, extraHeaders);
      var options = extraHeaders !== null ? {
        extraHeaders: extraHeaders
      } : undefined;
      this.js_session.sendInfo(contentType, body, options);
    }
  }, {
    key: "duration",
    value: function duration() {
      var start = this.js_session.start_time;
      if (!start) return 0;
      var end = this.js_session.end_time;
      if (!end) end = new Date();
      return Math.floor((end.getTime() - start.getTime()) / 1000);
    } // Call actual video state.
    // Set by initial INVITE and re-INVITEs. HOLD re-INVITEs will be ignored.

  }, {
    key: "hasSendVideo",
    value: function hasSendVideo() {
      return this.data._video.send;
    }
  }, {
    key: "hasReceiveVideo",
    value: function hasReceiveVideo() {
      return this.data._video.receive;
    }
  }, {
    key: "hasVideo",
    value: function hasVideo() {
      return this.hasSendVideo() && this.hasReceiveVideo();
    }
  }, {
    key: "getVideoState",
    value: function getVideoState() {
      if (this.hasSendVideo() && this.hasReceiveVideo()) return "sendrecv";
      if (this.hasSendVideo()) return "sendonly";
      if (this.hasReceiveVideo()) return "recvonly";
      return "inactive";
    }
  }, {
    key: "_setVideoState",
    value: function _setVideoState(send, receive) {
      AudioCodesUA.ac_log("AC: _setVideoState(send=".concat(send, ", receive=").concat(receive, ")"));
      this.data._video.send = send;
      this.data._video.receive = receive;
    } // Call enabled to send/receive video

  }, {
    key: "hasEnabledSendVideo",
    value: function hasEnabledSendVideo() {
      return this.data._video.enabledSend;
    }
  }, {
    key: "hasEnabledReceiveVideo",
    value: function hasEnabledReceiveVideo() {
      return this.data._video.enabledReceive;
    }
  }, {
    key: "getEnabledVideoState",
    value: function getEnabledVideoState() {
      if (this.hasEnabledSendVideo() && this.hasEnabledReceiveVideo()) return "sendrecv";
      if (this.hasEnabledSendVideo()) return "sendonly";
      if (this.hasEnabledReceiveVideo()) return "recvonly";
      return "inactive";
    }
  }, {
    key: "_setEnabledSendVideo",
    value: function _setEnabledSendVideo(enable) {
      AudioCodesUA.ac_log("AC: _setEnabledSendVideo(".concat(enable, ")"));
      this.data._video.enabledSend = enable;
    }
  }, {
    key: "_setEnabledReceiveVideo",
    value: function _setEnabledReceiveVideo(enable) {
      AudioCodesUA.ac_log("AC: _setEnabledReceiveVideo(".concat(enable, ")"));
      this.data._video.enabledReceive = enable;
    }
    /**
     * videoOption = phone.AUDIO, phone.VIDEO, phone.RECVONLY_VIDEO
     * or false (=phone.AUDIO), true(=phone.VIDEO)
     */

  }, {
    key: "answer",
    value: function answer(videoOption) {
      var _this3 = this;

      var extraHeaders = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var extraOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      if (this.data['_answer_called']) {
        AudioCodesUA.ac_log('AC: answer() is already called. [Ignored]');
        return;
      }

      this.data['_answer_called'] = true; // Convert boolean value to Symbol

      if (videoOption === false) videoOption = AudioCodesUA.instance.AUDIO;else if (videoOption === true) videoOption = AudioCodesUA.instance.VIDEO;
      if (_typeof(videoOption) !== 'symbol' || ![AudioCodesUA.instance.AUDIO, AudioCodesUA.instance.RECVONLY_VIDEO, AudioCodesUA.instance.VIDEO].includes(videoOption)) throw new TypeError("Illegal videoOption=".concat(videoOption.toString()));
      AudioCodesUA.ac_log("AC: ".concat(videoOption.description, " answer"));

      if (!this.hasVideo() && (videoOption === AudioCodesUA.instance.RECVONLY_VIDEO || videoOption === AudioCodesUA.instance.VIDEO)) {
        AudioCodesUA.ac_log('AC: incoming INVITE without video, so answer can be only "audio"');
        videoOption = AudioCodesUA.instance.AUDIO;
      } // video call - audio answer: no sound in answer phone.


      if (this.hasVideo() && videoOption === AudioCodesUA.instance.AUDIO) {
        var ua = AudioCodesUA.instance;
        var br = ua.browser;
        var md = ua.modes;
        var vr = ua.browserVersion;

        if (br === 'firefox' && md.video_call_audio_answer_firefox_fix) {
          this.data['_video_call_audio_answer_firefox'] = true;
        } else if (br === 'safari') {
          if (md.video_call_audio_answer_safari_fix === true && vr < 14 || md.video_call_audio_answer_safari_fix === 'force') this.data['_video_call_audio_answer_safari'] = true;
        }
      } // Set enabled and current send/receive video flags


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

      var options = AudioCodesUA.instance._callOptions(videoOption === AudioCodesUA.instance.VIDEO, false, extraHeaders, extraOptions);

      Promise.resolve().then(function () {
        if (!options.mediaStream) {
          return AudioCodesUA.instance.getWR().getUserMedia(options.mediaConstraints);
        } else {
          return options.mediaStream;
        }
      }).then(function (stream) {
        options.mediaStream = stream;
        _this3.js_session._localMediaStreamLocallyGenerated = true; // to enable jssip close the stream

        AudioCodesUA.ac_log('AC: answer options:', options);

        _this3.js_session.answer(options);
      })["catch"](function (e) {
        AudioCodesUA.ac_log('AC: getUserMedia failure', e);

        _this3.reject(488);
      });
    }
  }, {
    key: "reject",
    value: function reject() {
      var statusCode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 486;
      var extraHeaders = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      AudioCodesUA.ac_log('AC: reject()');

      try {
        var options = {
          status_code: statusCode
        };

        if (extraHeaders) {
          options.extraHeaders = extraHeaders;
        }

        this.js_session.terminate(options);
      } catch (e) {
        AudioCodesUA.ac_log('AC: call reject error:', e);
      }
    }
  }, {
    key: "terminate",
    value: function terminate() {
      AudioCodesUA.ac_log('AC: terminate()');

      try {
        this.js_session.terminate();
      } catch (e) {
        AudioCodesUA.ac_log('AC: call terminate error:', e);
      }
    }
  }, {
    key: "redirect",
    value: function redirect(callTo) {
      var statusCode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 302;
      var extraHeaders = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      AudioCodesUA.ac_log("AC: redirect() callTo=".concat(callTo));

      try {
        var contact = 'Contact: ' + AudioCodesUA.instance.jssipUA.normalizeTarget(callTo);
        var options = {
          status_code: statusCode,
          extraHeaders: [contact]
        };

        if (extraHeaders) {
          var _options$extraHeaders;

          (_options$extraHeaders = options.extraHeaders).push.apply(_options$extraHeaders, _toConsumableArray(extraHeaders));
        }

        this.js_session.terminate(options);
      } catch (e) {
        AudioCodesUA.ac_log('AC: call redirect error:', e);
      }
    }
  }, {
    key: "isLocalHold",
    value: function isLocalHold() {
      return this.js_session.isOnHold().local;
    }
  }, {
    key: "isRemoteHold",
    value: function isRemoteHold() {
      return this.js_session.isOnHold().remote;
    }
  }, {
    key: "isReadyToReOffer",
    value: function isReadyToReOffer() {
      return this.js_session._isReadyToReOffer();
    }
  }, {
    key: "hold",
    value: function hold(set) {
      var _this4 = this;

      AudioCodesUA.ac_log("AC: hold(".concat(set, ")"));
      return new Promise(function (resolve, reject) {
        var method = set ? _this4.js_session.hold : _this4.js_session.unhold;
        var result = method.call(_this4.js_session, {}, function () {
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

  }, {
    key: "enableReceiveVideo",
    value: function enableReceiveVideo(enable) {
      this._setEnabledReceiveVideo(enable);

      var conn = this.getRTCPeerConnection();
      var vt = AudioCodesUA.instance.getWR().connection.getTransceiver(conn, 'video');

      if (vt !== null) {
        var dir = this.getEnabledVideoState();
        AudioCodesUA.instance.getWR().transceiver.setDirection(vt, dir);
      }

      AudioCodesUA.ac_log("AC: enableReceiveVideo(".concat(enable, ") ").concat(vt !== null ? "" : "No video transceiver"));
      return vt !== null;
    }
    /*
     * For audio call. Start sending video
       Get user media with camera stream. Add video. Send re-INVITE with video.
       In re-INVITE can be added extra headers using options.extraHeaders.
       By default set enabled to receive video from other side.
       to disable set options.enabledReceiveVideo = false;
     */

  }, {
    key: "startSendingVideo",
    value: function startSendingVideo() {
      var _this5 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var enabledReceiveVideo = options && options.enabledReceiveVideo !== false; // undefined | true => true

      if (this.hasEnabledSendVideo()) {
        AudioCodesUA.ac_log('AC: startSendingVideo(). Already started');
        return Promise.reject('video already started');
      }

      AudioCodesUA.ac_log('AC: startSendingVideo()');
      return AudioCodesUA.instance.getWR().getUserMedia({
        video: AudioCodesUA.instance.constraints.video
      })["catch"](function (e) {
        AudioCodesUA.ac_log('AC: startSendingVideo() getUserMedia failure', e);
        throw e;
      }).then(function (videoStream) {
        // to allow JsSIP automatically stop stream after call termination.
        var videoTrack = videoStream.getVideoTracks()[0];

        var localStream = _this5.getRTCLocalStream();

        localStream.addTrack(videoTrack);

        _this5._setEnabledSendVideo(true);

        _this5._setEnabledReceiveVideo(enabledReceiveVideo);

        var wasUsedSendVideo = _this5.data['_wasUsedSendVideo'];
        return AudioCodesUA.instance.getWR().connection.addVideo(_this5.getRTCPeerConnection(), _this5.getRTCLocalStream(), videoTrack, _this5.hasEnabledReceiveVideo(), wasUsedSendVideo).then(function () {
          if (!wasUsedSendVideo && AudioCodesUA.instance.codecFilter) {
            AudioCodesUA.instance._cf_filter('video', _this5, AudioCodesUA.instance.codecFilter.video);
          }
        })["catch"](function (e) {
          AudioCodesUA.ac_log('AC: startSendingVideo(). Adding video error', e);
          throw e;
        });
      }).then(function () {
        return _this5._renegotiate(options);
      });
    }
    /*
     *  For video call.
     *  Stop sending video. Remove video. Send re-INVITE with inactive video.
     *  Optionally can be used options.extraHeaders
     */

  }, {
    key: "stopSendingVideo",
    value: function stopSendingVideo() {
      var _this6 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!this.hasEnabledSendVideo()) {
        AudioCodesUA.ac_log('AC: stopSendingVideo(). Already stopped');
        return Promise.reject('video already stopped');
      }

      AudioCodesUA.ac_log('AC: stopSendingVideo()');
      return AudioCodesUA.instance.getWR().connection.removeVideo(this.getRTCPeerConnection(), this.getRTCLocalStream())["catch"](function (e) {
        AudioCodesUA.ac_log('AC: stopSendingVideo(). Remove video error', e);
        throw e;
      }).then(function () {
        _this6._setEnabledSendVideo(false);

        _this6.data['_wasUsedSendVideo'] = true;
        return _this6._renegotiate(options);
      });
    }
  }, {
    key: "_doRenegotiate",
    value: function _doRenegotiate(options) {
      var _this7 = this;

      if (this.js_session.isEnded()) {
        return Promise.reject('call is ended');
      }

      return new Promise(function (resolve) {
        if (!_this7.js_session.renegotiate(options, function () {
          return resolve(true);
        })) {
          return resolve(false);
        }
      });
    }
  }, {
    key: "_renegotiate",
    value: function _renegotiate(options) {
      var _this8 = this;

      var attemptsLeft = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 30;
      var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
      AudioCodesUA.ac_log("AC: _renegotiate() attemptsLeft=".concat(attemptsLeft));
      return this._doRenegotiate(options).then(function (done) {
        if (done) {
          AudioCodesUA.ac_log('AC: Renegotiation success');
          return true;
        }

        if (attemptsLeft <= 1) {
          throw new Error('Too many attempts');
        }

        return new Promise(function (resolve) {
          return setTimeout(resolve, delay);
        }).then(function () {
          return _this8._renegotiate(options, attemptsLeft - 1, delay);
        });
      })["catch"](function (e) {
        AudioCodesUA.ac_log('AC: Renegotiation failed', e);
        throw e;
      });
    }
  }, {
    key: "sendReInvite",
    value: function sendReInvite() {
      var _this9 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      AudioCodesUA.ac_log('AC: sendReInvite()');
      return this._renegotiate(options).then(function () {
        if (options.showStreams) {
          var localStream = _this9.getRTCLocalStream();

          var remoteStream = _this9.getRTCRemoteStream();

          AudioCodesUA.ac_log('AC>>: [after send re-INVITE] callShowStreams', _this9, localStream, remoteStream);
          AudioCodesUA.instance.listeners.callShowStreams(_this9, localStream, remoteStream);
        }
      });
    } // screen sharing.

  }, {
    key: "startScreenSharing",
    value: function startScreenSharing(stream) {
      var _this10 = this;

      var modes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        localScreenSharing: true,
        enabledReceiveVideo: true,
        separateVideo: false
      };
      AudioCodesUA.ac_log('AC: startScreenSharing');
      if (!stream) return Promise.reject('missed stream argument');
      if (this.data['_screenSharing']) return Promise.reject('the call is already using screen-sharing');
      var enabledReceiveVideo = modes && modes.enabledReceiveVideo !== false; // undefined | true => true

      var track = stream.getVideoTracks()[0];
      var onEnded = undefined;

      if (modes.localScreenSharing) {
        onEnded = this._onEndedScreenSharingTrack.bind(this);
        track.addEventListener('ended', onEnded);
      }

      this.data['_screenSharing'] = {
        stream: stream,
        // screen sharing video track
        onended: onEnded,
        // callback
        hadSendVideo: this.hasSendVideo() // if was video before screen sharing

      };
      var wasUsedSendVideo = this.data['_wasUsedSendVideo'];

      this._setEnabledSendVideo(true);

      this._setEnabledReceiveVideo(enabledReceiveVideo);

      return AudioCodesUA.instance.getWR().connection.addVideo(this.getRTCPeerConnection(), this.getRTCLocalStream(), track, this.hasEnabledReceiveVideo(), wasUsedSendVideo).then(function () {
        if (!wasUsedSendVideo && AudioCodesUA.instance.codecFilter) {
          AudioCodesUA.instance._cf_filter('video', _this10, AudioCodesUA.instance.codecFilter.video);
        }
      })["catch"](function (e) {
        AudioCodesUA.ac_log('AC: startScreenSharing() error', e);
        _this10.data['_screenSharing'] = null;
        throw e;
      }).then(function () {
        var options = {
          extraHeaders: ['X-Screen-Sharing: on']
        };
        return _this10._renegotiate(options);
      });
    }
  }, {
    key: "stopScreenSharing",
    value: function stopScreenSharing() {
      AudioCodesUA.ac_log('AC: stopScreenSharing');
      if (!this.data['_screenSharing']) return Promise.reject('the call does not use screen-sharing');
      return this._onEndedScreenSharing('called stopScreenSharing()');
    }
  }, {
    key: "isScreenSharing",
    value: function isScreenSharing() {
      return !!this.data['_screenSharing'];
    }
  }, {
    key: "doesScreenSharingReplaceCamera",
    value: function doesScreenSharingReplaceCamera() {
      var sh = this.data['_screenSharing'];
      return sh && sh.hadSendVideo;
    }
  }, {
    key: "_onEndedScreenSharingTrack",
    value: function _onEndedScreenSharingTrack() {
      return this._onEndedScreenSharing('track ended');
    }
  }, {
    key: "_onEndedScreenSharing",
    value: function _onEndedScreenSharing(reason) {
      var _this11 = this;

      var screenSharing = this.data['_screenSharing'];
      this.data['_screenSharing'] = null;
      var stream = screenSharing.stream;
      var onended = screenSharing.onended;

      if (stream && onended) {
        var track = stream.getVideoTracks()[0];
        track.removeEventListener('ended', onended);
      }

      return Promise.resolve().then(function () {
        if (!_this11.isTerminated()) {
          // Restore previously sending video (if was) and send re-INVITE.
          var connection = _this11.getRTCPeerConnection();

          var localStream = _this11.getRTCLocalStream();

          var options = {
            extraHeaders: ['X-Screen-Sharing: off']
          };

          if (screenSharing.hadSendVideo) {
            AudioCodesUA.ac_log('AC: screen sharing stopped - restore previously sending video track');
            AudioCodesUA.instance.getWR().connection.replaceSenderTrack(connection, 'video', localStream);
            return _this11._renegotiate(options);
          } else {
            AudioCodesUA.ac_log('AC: screen sharing stopped - stop send video');
            return _this11.stopSendingVideo(options);
          }
        }
      }).then(function () {
        if (AudioCodesUA.instance.listeners.callScreenSharingEnded) {
          AudioCodesUA.ac_log("AC>>: callScreenSharingEnded \"".concat(reason, "\""), _this11, stream);
          AudioCodesUA.instance.listeners.callScreenSharingEnded(_this11, stream);
        }
      });
    }
    /*
     * To restore call "remote hold" state after page reload.
     */

  }, {
    key: "setRemoteHoldState",
    value: function setRemoteHoldState() {
      this.js_session._remoteHold = true;
    }
    /*
     * Blind or attended transfer
     */

  }, {
    key: "sendRefer",
    value: function sendRefer(callTo) {
      var probeSession = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (!AudioCodesUA.instance.listeners.transferorNotification) throw new Error('transferorNotification listener is missed');
      var ac_session = this;
      var options = {
        eventHandlers: {
          requestSucceeded: function requestSucceeded() {
            AudioCodesUA.ac_log('AC>>: transferorNotification progress [REFER accepted]');
            AudioCodesUA.instance.listeners.transferorNotification(ac_session, 0);
          },
          requestFailed: function requestFailed() {
            AudioCodesUA.ac_log('AC>>: transferorNotification failed [REFER failed]');
            AudioCodesUA.instance.listeners.transferorNotification(ac_session, -1);
          },
          trying: function trying() {
            AudioCodesUA.ac_log('AC>>: transferorNotification progress [NOTIFY 1xx]');
            AudioCodesUA.instance.listeners.transferorNotification(ac_session, 0);
          },
          progress: function progress() {
            AudioCodesUA.ac_log('AC>>: transferorNotification progress [NOTIFY 1xx]');
            AudioCodesUA.instance.listeners.transferorNotification(ac_session, 0);
          },
          accepted: function accepted() {
            AudioCodesUA.ac_log('AC>>: transferorNotification success [NOTIFY 2xx]');
            AudioCodesUA.instance.listeners.transferorNotification(ac_session, 1);
          },
          failed: function failed() {
            AudioCodesUA.ac_log('AC>>: transferorNotification failed [NOTIFY >= 300]');
            AudioCodesUA.instance.listeners.transferorNotification(ac_session, -1);
          }
        }
      }; // REFER with header ReferTo with replaces parameter

      if (probeSession !== null) {
        options.replaces = probeSession.js_session;
      }

      this.js_session.refer(callTo, options);
    }
  }]);

  return AudioCodesSession;
}(); // SDP parser


var AudioCodesSDP = /*#__PURE__*/function () {
  function AudioCodesSDP(sdp) {
    _classCallCheck(this, AudioCodesSDP);

    this.start = [];
    this.media = [];
    var lines = sdp.split('\n').map(function (l) {
      return l.trim();
    }).filter(function (l) {
      return l.length > 0;
    });
    var current = this.start;

    var _iterator9 = _createForOfIteratorHelper(lines),
        _step9;

    try {
      for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
        var line = _step9.value;

        if (line.startsWith('m=')) {
          current = [];
          this.media.push(current);
        }

        current.push(line);
      }
    } catch (err) {
      _iterator9.e(err);
    } finally {
      _iterator9.f();
    }
  }

  _createClass(AudioCodesSDP, [{
    key: "getMedia",
    value: function getMedia(type) {
      var _iterator10 = _createForOfIteratorHelper(this.media),
          _step10;

      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var m = _step10.value;
          if (m.length > 0 && m[0].startsWith('m=' + type)) return m;
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }

      return null;
    }
  }, {
    key: "checkSendRecv",
    value: function checkSendRecv(line) {
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
  }, {
    key: "getMediaDirectionValue",
    value: function getMediaDirectionValue(type) {
      var media = this.getMedia(type);
      if (media === null) return null;
      var t;
      var result = 'sendrecv';

      var _iterator11 = _createForOfIteratorHelper(this.start),
          _step11;

      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var line = _step11.value;

          if ((t = this.checkSendRecv(line)) !== null) {
            result = t;
            break;
          }
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }

      var _iterator12 = _createForOfIteratorHelper(media),
          _step12;

      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var _line = _step12.value;

          if ((t = this.checkSendRecv(_line)) !== null) {
            result = t;
            break;
          }
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }

      return result;
    }
  }, {
    key: "getMediaDirection",
    value: function getMediaDirection(type, remote) {
      var dir = this.getMediaDirectionValue(type);

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
  }, {
    key: "toString",
    value: function toString() {
      var result = this.start;

      var _iterator13 = _createForOfIteratorHelper(this.media),
          _step13;

      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
          var m = _step13.value;
          result = result.concat(m);
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }

      return result.join('\r\n') + '\r\n';
    }
  }]);

  return AudioCodesSDP;
}(); // WebRTC Wrapper


var AudioCodesWebRTCWrapper = {
  getUserMedia: function getUserMedia(constraints) {
    AudioCodesUA.ac_log("[webrtc] getUserMedia constraints=".concat(JSON.stringify(constraints)));
    return navigator.mediaDevices.getUserMedia(constraints);
  },
  hasDisplayMedia: function hasDisplayMedia() {
    return navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
  },
  getDisplayMedia: function getDisplayMedia() {
    AudioCodesUA.ac_log('[webrtc] getDisplayMedia');
    return navigator.mediaDevices.getDisplayMedia({
      video: true
    });
  },
  mediaDevices: {
    enumerateDevices: function enumerateDevices() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return Promise.reject('WebRTC is not supported');
      return navigator.mediaDevices.enumerateDevices();
    },
    addDeviceChangeListener: function addDeviceChangeListener(listener) {
      if (!navigator.mediaDevices) return;
      navigator.mediaDevices.addEventListener('devicechange', listener);
    },
    removeDeviceChangeListener: function removeDeviceChangeListener(listener) {
      if (!navigator.mediaDevices) return;
      navigator.mediaDevices.removeEventListener('devicechange', listener);
    }
  },
  // Check WebRTC support. Check presence of microphone and camera
  checkAvailableDevices: function checkAvailableDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject('WebRTC is not supported');
    var cam = false,
        mic = false,
        spkr = false;
    return navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
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
      });

      if (navigator.webkitGetUserMedia === undefined) {
        // Not Chrome
        spkr = true;
      }

      if (!spkr) return Promise.reject('Missing a speaker! Please connect one and reload');
      if (!mic) return Promise.reject('Missing a microphone! Please connect one and reload');
      return Promise.resolve(cam);
    });
  },
  transceiver: {
    setDirection: function setDirection(transceiver, direction) {
      var kind = '';
      if (transceiver.sender.track !== null) kind = transceiver.sender.track.kind;else if (transceiver.receiver.track !== null) kind = transceiver.receiver.track.kind;
      AudioCodesUA.ac_log("[webrtc] set ".concat(kind, " transceiver direction=").concat(direction));
      transceiver.direction = direction;
    }
  },
  stream: {
    // For logging
    getInfo: function getInfo(stream) {
      function getTrackInfo(tr) {
        return tr.length > 0 ? tr[0].enabled.toString() : '-';
      }

      if (stream === null) return Promise.resolve('stream is null');
      return Promise.resolve("audio: ".concat(getTrackInfo(stream.getAudioTracks()), " video: ").concat(getTrackInfo(stream.getVideoTracks())));
    }
  },
  connection: {
    // For logging
    getTransceiversInfo: function getTransceiversInfo(connection) {
      function getTransInfo(t) {
        return t === null ? 'none' : "d=".concat(t.direction, " c=").concat(t.currentDirection);
      }

      var ts = connection.getTransceivers();
      var at = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'audio');
      var vt = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'video');
      return Promise.resolve("(".concat(ts.length, ") audio ").concat(getTransInfo(at), " video ").concat(getTransInfo(vt)));
    },
    getTransceiver: function getTransceiver(connection, kind) {
      var _iterator14 = _createForOfIteratorHelper(connection.getTransceivers()),
          _step14;

      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var t = _step14.value;

          if (t.sender !== null && t.sender.track !== null && t.sender.track.kind === kind) {
            return t;
          }

          if (t.receiver !== null && t.receiver.track !== null && t.receiver.track.kind === kind) {
            return t;
          }
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }

      return null;
    },
    addEventListener: function addEventListener(connection, eventName, listener) {
      AudioCodesUA.ac_log("[webrtc] Connection addEventListener ".concat(eventName));
      if (eventName !== 'track') return Promise.reject("Wrong event name: ".concat(eventName));
      connection.addEventListener(eventName, listener);
      return Promise.resolve();
    },
    getDTMFSender: function getDTMFSender(connection) {
      var sender = connection.getSenders().find(function (s) {
        return s.track && s.track.kind === 'audio';
      });
      if (sender && sender.dtmf) return sender.dtmf;
      return undefined;
    },
    addVideo: function addVideo(connection, localStream, videoTrack, enabledReceiveVideo, wasUsedSendVideo) {
      AudioCodesUA.ac_log('[webrtc] Connection addVideo');
      var vt = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'video');

      if (vt !== null) {
        var dir = enabledReceiveVideo ? 'sendrecv' : 'sendonly';
        AudioCodesUA.instance.getWR().transceiver.setDirection(vt, dir);
      }

      if (vt === null || vt.sender.track === null && !wasUsedSendVideo) {
        AudioCodesUA.ac_log('[webrtc] addVideo (connection addTrack)');
        connection.addTrack(videoTrack, localStream);
        return Promise.resolve(true);
      } else {
        AudioCodesUA.ac_log('[webrtc] addVideo (video transceiver sender replaceTrack)');
        return vt.sender.replaceTrack(videoTrack).then(function () {
          return false;
        });
      }
    },
    removeVideo: function removeVideo(connection, localStream) {
      AudioCodesUA.ac_log('[webrtc] Connection removeVideo');
      var vt = AudioCodesUA.instance.getWR().connection.getTransceiver(connection, 'video');
      if (vt === null) return Promise.reject('no video transceiver found');
      connection.removeTrack(vt.sender);

      if (localStream) {
        var _iterator15 = _createForOfIteratorHelper(localStream.getVideoTracks()),
            _step15;

        try {
          for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
            var track = _step15.value;
            localStream.removeTrack(track);
            track.stop();
          }
        } catch (err) {
          _iterator15.e(err);
        } finally {
          _iterator15.f();
        }
      }

      return Promise.resolve();
    },
    replaceSenderTrack: function replaceSenderTrack(connection, kind, stream) {
      AudioCodesUA.ac_log("[webrtc] ReplaceSenderTrack ".concat(kind));
      var foundSender = null;

      var _iterator16 = _createForOfIteratorHelper(connection.getSenders()),
          _step16;

      try {
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
          var sender = _step16.value;

          if (sender.track !== null && sender.track.kind === kind) {
            foundSender = sender;
            break;
          }
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }

      if (foundSender === null) return Promise.reject("No ".concat(kind, " sender"));
      var tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
      if (tracks.length === 0) return Promise.reject("No ".concat(kind, " track"));
      return foundSender.replaceTrack(tracks[0]);
    },
    // "types" example ['outboud-rtp', 'inbound-rtp']
    getStats: function getStats(connection, types) {
      var str = '';
      return connection.getStats(null).then(function (report) {
        report.forEach(function (now) {
          if (types.includes(now.type)) {
            str += ' {';
            var first = true;

            for (var _i4 = 0, _Object$keys2 = Object.keys(now); _i4 < _Object$keys2.length; _i4++) {
              var key = _Object$keys2[_i4];
              if (first) first = false;else str += ',';
              str += key + '=' + now[key];
            }

            str += '} \r\n';
          }
        });
        return str;
      });
    }
  }
};