'use strict';
/*
 * The utilities used to build our phone examples.

 * You may consider them an optional part of our SDK.
 * You can use them if they are suitable for your project or replace them with other libraries.
 * For example instead provided in this file AudioPlayer you may use other audio library,
 * instead storageLoadConfig other library to work with local storage, etc.
 *
 *  Load/save configuration from/to local storage
 *  - storageLoadConfig
 *  - storageSaveConfig
 *
 *  IndexedDB
 *  - AbstractDb (abstract indexeddb with single store)
 *  - CallLogDb (call log indexeddb)
 *  - VoiceDb   (recorded voice messages indexeddb)
 *  - MessageDb (received text messages indexeddb)
 *
 *  Audio, video
 *  - AudioPlayer2  
 *  - MRecorder
 *  - AnsweringMachine
 *
 *  SIP
 *  - AlertInfo parser
 *  - XVoiceQuality parser 
 *
 *  Conference
 *  - CallAudioMixer
 *  - CallVideoMixer
 *
 *  loadJavaScript (dinamically load arbitrary javascript)
 *  SelectDevices (enumerate and select microphone, camera, speaker)
 * 
 *  Igor Kolosov AudioCodes 2022
 *  Last edit 27-Jul-2022
 */

/**
 * Load JSON object from local storage
 *
 * If object does not exist, will be used default value.
 * If object exists, and has version different from default value version, will be used default value.
 *
 * The version used to override browser local storage value to default value from site.
 *
 * Example:
 *   We upgrade in our site phone from version 1.1 to 1.2.
 *   There are many users of phone version 1.1 in the world and they store some phone configuration
 *   to browser local storage.
 *   In phone version 1.2 the construction of the configuration object is different.
 *   To prevent errors, we should change version of default configuration object in our site,
 *   it forces to load updated version instead using saved in local storage.
 *   (See phone prototype config.js)
 *
 * For debugging can be used storeBack = true,
 * to edit stored value via browser dev. tools.
 */

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function storageLoadConfig(name) {
  var defValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var useLog = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var storeBack = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var str_value = localStorage.getItem(name);
  var value = null;
  var isLoaded = false;
  var isReplaced = false;
  var isDefault;

  if (str_value) {
    isLoaded = true;
    value = JSON.parse(str_value);
  }

  if (value === null || defValue !== null && value.version !== defValue.version) {
    if (isLoaded) isReplaced = true;
    isLoaded = false;
    isDefault = true;
    if (defValue !== null) value = dataDeepCopy(defValue);
  } else {
    isDefault = dataEquals(value, defValue);
  }

  if (useLog) {
    console.log('Used %s %s', value !== null ? isDefault ? 'default' : 'custom' : 'null', name);
  }

  if (value !== null && (isReplaced || storeBack && !isLoaded)) localStorage.setItem(name, JSON.stringify(value));
  return value;
}
/**
 * Save JSON object to local storage.
 *
 * Default value is optional.
 * If it's provided and object has default value, it will be removed from local storage.
 */


function storageSaveConfig(name, value) {
  var defValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  if (defValue === null || !dataEquals(value, defValue)) {
    if (defValue !== null && defValue.version && !value.version) value.version = defValue.version;
    localStorage.setItem(name, JSON.stringify(value));
  } else {
    localStorage.removeItem(name);
  }
} // Objects deep equals


function dataEquals(obj1, obj2) {
  if (obj1 === null || obj2 === null) return obj1 === obj2;

  for (var p in obj1) {
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

    switch (_typeof(obj1[p])) {
      case 'object':
        if (!dataEquals(obj1[p], obj2[p])) return false;
        break;

      case 'function':
        // No compare functions.
        break;

      default:
        if (obj1[p] != obj2[p]) return false;
    }
  }

  for (var _p in obj2) {
    if (typeof obj1[_p] == 'undefined') return false;
  }

  return true;
}

function dataDeepCopy(src) {
  if (src === null) return null;
  var dst = Array.isArray(src) ? [] : {};

  for (var p in src) {
    switch (_typeof(src[p])) {
      case 'object':
        dst[p] = dataDeepCopy(src[p]);
        break;

      case 'function':
        // No copy
        break;

      default:
        dst[p] = src[p];
        break;
    }
  }

  return dst;
}
/**
 * Database with single store and with copy of the store in memory - objects list
 * Purpose: make the list persistent.
 * Key is part of record, based on current time, unique and has name 'id'
 * Number of objects in store is limited, oldest objects will be deleted.
 * If needed, additional stores can be added: override open(),
 * and use get(), put(), clear(), delete() methods with store name.
 */


var AbstractDb = /*#__PURE__*/function () {
  function AbstractDb(dbName, storeName, maxSize) {
    _classCallCheck(this, AbstractDb);

    this.dbName = dbName;
    this.storeName = storeName;
    this.maxSize = maxSize; // max number of objects

    this.db = null;
    this.list = []; // default store copy in memory.

    this.idSeqNumber = -1; // to generate unique key.
  } // Create store unique key. (no more than 1 million in the same millisecond)
  // key must be part or record and have name 'id'


  _createClass(AbstractDb, [{
    key: "createId",
    value: function createId(time) {
      this.idSeqNumber = (this.idSeqNumber + 1) % 1000000; // range 0..999999

      return time.toString() + '-' + ('00000' + this.idSeqNumber.toString()).slice(-6);
    } // Open the database, if needed create it.

  }, {
    key: "open",
    value: function open() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var r = indexedDB.open(_this.dbName);

        r.onupgradeneeded = function (e) {
          e.target.result.createObjectStore(_this.storeName, {
            keyPath: 'id'
          });
        };

        r.onsuccess = function () {
          _this.db = r.result;
          resolve();
        };

        r.onerror = r.onblocked = function () {
          reject(r.error);
        };
      });
    } // load records to memory, ordered by time, if needed delete oldest records

  }, {
    key: "load",
    value: function load() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.db === null) {
          reject('db is null');
          return;
        }

        var trn = _this2.db.transaction(_this2.storeName, 'readwrite');

        trn.onerror = function () {
          reject(trn.error);
        };

        var store = trn.objectStore(_this2.storeName);

        var onsuccess = function onsuccess(list) {
          _this2.list = list;
          var nDel = _this2.list.length - _this2.maxSize;

          if (nDel <= 0) {
            resolve();
          } else {
            var r = store["delete"](IDBKeyRange.upperBound(_this2.list[nDel - 1].id));

            r.onerror = function () {
              reject(r.error);
            };

            r.onsuccess = function () {
              _this2.list = _this2.list.splice(-_this2.maxSize);
              resolve();
            };
          }
        };

        var onerror = function onerror(e) {
          reject(e);
        };

        var getAll = store.getAll ? _this2._getAllBuiltIn : _this2._getAllCursor;
        getAll(store, onsuccess, onerror);
      });
    }
  }, {
    key: "_getAllBuiltIn",
    value: function _getAllBuiltIn(store, onsuccess, onerror) {
      // Chrome, Firefox
      var r = store.getAll();

      r.onerror = function () {
        return onerror(r.error);
      };

      r.onsuccess = function () {
        return onsuccess(r.result);
      };
    }
  }, {
    key: "_getAllCursor",
    value: function _getAllCursor(store, onsuccess, onerror) {
      // Legacy Edge
      var list = [];
      var r = store.openCursor();

      r.onerror = function () {
        return onerror(r.error);
      };

      r.onsuccess = function (e) {
        var cursor = e.target.result;

        if (cursor) {
          list.push(cursor.value);
          cursor["continue"]();
        } else {
          onsuccess(list);
        }
      };
    } // Add new record. If needed delete oldest records

  }, {
    key: "add",
    value: function add(record) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (_this3.db === null) {
          reject('db is null');
          return;
        }

        var trn = _this3.db.transaction(_this3.storeName, 'readwrite');

        trn.onerror = function () {
          reject(trn.error);
        };

        var store = trn.objectStore(_this3.storeName);
        var r = store.add(record);

        r.onerror = function () {
          reject(r.error);
        };

        r.onsuccess = function () {
          _this3.list.push(record);

          var nDel = _this3.list.length - _this3.maxSize;

          if (nDel <= 0) {
            resolve();
          } else {
            r = store["delete"](IDBKeyRange.upperBound(_this3.list[nDel - 1].id));

            r.onerror = function () {
              reject(r.error);
            };

            r.onsuccess = function () {
              _this3.list = _this3.list.splice(-_this3.maxSize);
              resolve();
            };
          }
        };
      });
    } // Update record with some unique id.

  }, {
    key: "update",
    value: function update(record) {
      var index = this.list.findIndex(function (r) {
        return r.id === record.id;
      });
      if (index == -1) return Promise.reject('Record is not found');
      this.list[index] = record;
      return this._exec('put', this.storeName, record);
    } // Delete record with the key (if store is default delete also from list)

  }, {
    key: "delete",
    value: function _delete(id) {
      var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.storeName;

      if (storeName === this.storeName) {
        var index = this.list.findIndex(function (r) {
          return r.id === id;
        });
        if (index == -1) return Promise.reject('Record is not found');
        this.list.splice(index, 1);
      }

      return this._exec('delete', storeName, id);
    } // Clear all store records

  }, {
    key: "clear",
    value: function clear() {
      var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.storeName;
      this.list = [];
      return this._exec('clear', storeName);
    }
  }, {
    key: "get",
    value: function get(key, storeName) {
      return this._exec('get', storeName, key);
    }
  }, {
    key: "put",
    value: function put(record, storeName) {
      return this._exec('put', storeName, record);
    } // Single transaction operation.

  }, {
    key: "_exec",
    value: function _exec(op, storeName, data) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (_this4.db === null) {
          reject('db is null');
          return;
        }

        var trn = _this4.db.transaction(storeName, 'readwrite');

        trn.onerror = function () {
          reject(trn.error);
        };

        var store = trn.objectStore(storeName);
        var r;

        switch (op) {
          case 'clear':
            r = store.clear();
            break;

          case 'delete':
            r = store["delete"](data);
            break;

          case 'put':
            r = store.put(data);
            break;

          case 'get':
            r = store.get(data);
            break;

          default:
            reject('db: wrong request');
            return;
        }

        r.onerror = function () {
          reject(r.error);
        };

        r.onsuccess = function () {
          resolve(r.result);
        };
      });
    }
  }]);

  return AbstractDb;
}();
/**
 * To keep phone call logs.
 */


var CallLogDb = /*#__PURE__*/function (_AbstractDb) {
  _inherits(CallLogDb, _AbstractDb);

  var _super = _createSuper(CallLogDb);

  function CallLogDb(maxSize) {
    _classCallCheck(this, CallLogDb);

    return _super.call(this, 'phone', 'call_log', maxSize);
  }

  return CallLogDb;
}(AbstractDb);
/*
 *  To use with automatic answer machine. Created 2 stores:
 *  'records' default store, to save last (up to maxSize) answer records.
 *  'greeting' additional store, to save custom greeting.
 */


var VoiceDb = /*#__PURE__*/function (_AbstractDb2) {
  _inherits(VoiceDb, _AbstractDb2);

  var _super2 = _createSuper(VoiceDb);

  function VoiceDb(maxSize) {
    _classCallCheck(this, VoiceDb);

    return _super2.call(this, 'voice_db', 'records', maxSize);
  }

  _createClass(VoiceDb, [{
    key: "open",
    value: function open() {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        var r = indexedDB.open(_this5.dbName);

        r.onupgradeneeded = function (e) {
          e.target.result.createObjectStore(_this5.storeName, {
            keyPath: 'id'
          });
          e.target.result.createObjectStore('greeting', {
            keyPath: 'id'
          });
        };

        r.onsuccess = function () {
          _this5.db = r.result;
          resolve();
        };

        r.onerror = r.onblocked = function () {
          reject(r.error);
        };
      });
    }
  }]);

  return VoiceDb;
}(AbstractDb);
/**
 * To keep incoming text messages.
 */


var MessageDb = /*#__PURE__*/function (_AbstractDb3) {
  _inherits(MessageDb, _AbstractDb3);

  var _super3 = _createSuper(MessageDb);

  function MessageDb(maxSize) {
    _classCallCheck(this, MessageDb);

    return _super3.call(this, 'message_db', 'messages', maxSize);
  }

  return MessageDb;
}(AbstractDb);
/* 
 * AudioPlayer2
 *
 * There are audio web API: 
 *   - HTMLAudioElement  (Can be associated with speaker. Chrome only)
 *   - Audio Context.    (Uses default speaker)
 * 
 * For most operation systems and browsers HTMLAudioElement is best option.
 * The exception is macOS Safari and all iOS browsers (WebKit codebase)
 * WebKit HTMLAudioElement is about unusable for our case.
 * 
 * AudioPlayer2 can be configured to use HTMLAudioElement or AudioContext API to
 * play sound.
 * Both modes used AudioContext API to generate tones and sending audio stream.
 * 
 * Igor Kolosov AudioCodes Ltd 2022
 */


var AudioPlayer2 = /*#__PURE__*/function () {
  function AudioPlayer2() {
    _classCallCheck(this, AudioPlayer2);

    this.browser = this._browser();
    this.speakerDeviceId = undefined; // undefined - don't use setSinkId, null or string uses setSinkId()

    this.ringerDeviceId = undefined; // additional loudspeaker to play rings

    this.useAudioElement = undefined; // true/false switch HTMLAudioElement/AudioContext API

    this.logger = console.log;
    this.sounds = {}; // Sounds

    this.sound = null; // Current sound

    this.ringer = null; // Ringer sound

    this.ssound = null; // Short sound

    this.audioCtx = null;
    this.dtmfTones = {
      '1': [{
        f: [697, 1209],
        t: 0.2
      }],
      '2': [{
        f: [697, 1336],
        t: 0.2
      }],
      '3': [{
        f: [697, 1477],
        t: 0.2
      }],
      '4': [{
        f: [770, 1209],
        t: 0.2
      }],
      '5': [{
        f: [770, 1336],
        t: 0.2
      }],
      '6': [{
        f: [770, 1477],
        t: 0.2
      }],
      '7': [{
        f: [852, 1209],
        t: 0.2
      }],
      '8': [{
        f: [852, 1336],
        t: 0.2
      }],
      '9': [{
        f: [852, 1477],
        t: 0.2
      }],
      '*': [{
        f: [941, 1209],
        t: 0.2
      }],
      '0': [{
        f: [941, 1336],
        t: 0.2
      }],
      '#': [{
        f: [941, 1477],
        t: 0.2
      }],
      'A': [{
        f: [697, 1633],
        t: 0.2
      }],
      'B': [{
        f: [770, 1633],
        t: 0.2
      }],
      'C': [{
        f: [852, 1633],
        t: 0.2
      }],
      'D': [{
        f: [941, 1633],
        t: 0.2
      }]
    };
  }
  /**
   * User can select API by setting:
   * useAudioElement: true
   * useAudioElement: false
   * useAudioElement: undefined (default) - API selected according using browser:
   *   used AudioElement API, except macOS Safari and any iOS browsers.
   */


  _createClass(AudioPlayer2, [{
    key: "init",
    value: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        logger: null,
        audioCtx: null,
        useAudioElement: undefined
      };
      this.logger = options.logger ? options.logger : console.log;
      this.audioCtx = options.audioCtx ? options.audioCtx : new (window.AudioContext || window.webkitAudioContext)();
      if (options.useAudioElement === true || options.useAudioElement === false) this.useAudioElement = options.useAudioElement; // user can select using API.
      else // or API will be selected automatically
        this.useAudioElement = !['safari', 'safari|ios'].includes(this.browser);
      this.logger("AudioPlayer2: init ".concat(this.useAudioElement ? 'AudioElement' : 'AudioContext', " (").concat(this.browser, ")"));
    } // Set earpeace device for play().  For AudioElement mode in Chrome

  }, {
    key: "setSpeakerId",
    value: function setSpeakerId(deviceId) {
      this.logger("AudioPlayer2: setSpeakerId(".concat(deviceId, ")"));
      this.speakerDeviceId = deviceId !== null ? deviceId : '';
    } // Set loudspeaker device for playRing(). For AudioElement mode in Chrome

  }, {
    key: "setRingerId",
    value: function setRingerId(deviceId) {
      this.logger("AudioPlayer2: setRingerId(".concat(deviceId, ")"));
      this.ringerDeviceId = deviceId ? deviceId : null;
    }
  }, {
    key: "_browser",
    value: function _browser() {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'safari|ios'; // all iOS browsers (includes Safari, Chrome or Firefox)

      if (navigator.mozGetUserMedia) return 'firefox';
      if (navigator.webkitGetUserMedia) return 'chrome';
      if (window.safari) return 'safari';
      return 'other';
    } // To support auto-play policy.

  }, {
    key: "isDisabled",
    value: function isDisabled() {
      if (this.audioCtx.state === 'interrupted') this.logger('AudioPlayer2: isDisabled() state = interrupted ! Hello from iOS');

      if (['chrome', 'safari', 'safari|ios'].includes(this.browser)) {
        return this.audioCtx.state === 'suspended';
      } else {
        return false;
      }
    }
  }, {
    key: "enable",
    value: function enable() {
      if (['chrome', 'safari', 'safari|ios'].includes(this.browser)) {
        return this.audioCtx.resume();
      } else {
        return Promise.resolve();
      }
    }
    /* 
     * Download MP3 sounds. Resolved when all sounds are loaded
     */

  }, {
    key: "downloadSounds",
    value: function downloadSounds(path, soundList) {
      this.logger("AudioPlayer2: downloadSounds ".concat(path, " ").concat(JSON.stringify(soundList)));

      if (!this.useAudioElement && ['safari', 'safari|ios'].includes(this.browser)) {
        this._setDecodeAudioDataShim(this.audioCtx);
      }

      var readyList = [];

      var _iterator = _createForOfIteratorHelper(soundList),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var sound = _step.value;
          var name = void 0,
              sname = void 0;

          if (typeof sound === 'string') {
            name = sname = sound;
          } else {
            name = Object.keys(sound)[0];
            sname = sound[name];
          }

          var file = path + sname + '.mp3';
          readyList.push(this.useAudioElement ? this._downloadSound1(name, file) : this._downloadSound2(name, file));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return Promise.allSettled(readyList);
    }
  }, {
    key: "generateTonesSuite",
    value: function generateTonesSuite(suite) {
      this.logger('AudioPlayer2: generateTonesSuite');
      var readyList = [];

      for (var _i = 0, _Object$keys = Object.keys(suite); _i < _Object$keys.length; _i++) {
        var toneName = _Object$keys[_i];
        var toneDefinition = suite[toneName];
        readyList.push(this.useAudioElement ? this._generateTone1(toneName, toneDefinition) : this._generateTone2(toneName, toneDefinition));
      }

      return Promise.allSettled(readyList);
    }
    /**
     * Play sound in speaker
     * 
     * @param options
     *   name  sound clip name (must be set)
     *
     *   volume = 0 .. 1.0  Default 1.0   (for iOS HTMLAudioElement always 1.0)
     *   loop = true/false Endless loop
     *   repeat = number  Repeat <number> times
     *
     *   streamDestination (undefined by default), value mediaStreamDestination.
     *   Assign output to audio stream instead of speaker.
     *   
     * @returns Promise to check when playing is finished.
     */

  }, {
    key: "play",
    value: function play(options) {
      var streamDestination = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (this.isDisabled()) {
        this.logger("AudioPlayer2: play: ".concat(JSON.stringify(options), " [Sound is disabled]"));
        return Promise.resolve();
      }

      if (this.useAudioElement) {
        return streamDestination ? this._playStream1(options, streamDestination) : this._play1(options);
      } else {
        return this._play2(options, streamDestination);
      }
    }
    /**
     * Play ringing additionaly in loudspeaker (if configured)
     *
     * Note: the same sound name cannot be used in play() and playRing() -
     * because for each sound name created own HTMLAudioElement associated with
     * speaker.
     * So if for play() and playRing() used the same MP3 sound file,
     * use it with different sound names. (e.g. 'ring' and 'r_ring' in our examples)
     */

  }, {
    key: "playRing",
    value: function playRing(options) {
      if (this.isDisabled()) {
        this.logger("AudioPlayer2: playRing: ".concat(JSON.stringify(options), " [Sound is disabled]"));
        return Promise.resolve();
      }

      return this.useAudioElement ? this._playRing1(options) : Promise.resolve();
    }
    /**
     * Stops playing. (if played)
     * Stops play() and playRing(), does not stop playShortSound()
     */

  }, {
    key: "stop",
    value: function stop() {
      this.useAudioElement ? this._stop1() : this._stop2();
    }
    /*
     * For independent of play(), playRing() and stop() usage.
     * Cannot be stopped.
     */

  }, {
    key: "playShortSound",
    value: function playShortSound(options) {
      if (!this.audioCtx) return Promise.reject('No audio context');
      return this.useAudioElement ? this._playShortSound1(options) : this._playShortSound2(options);
    }
    /*
      HTMLAudioElement implementation
     */

  }, {
    key: "_downloadSound1",
    value: function _downloadSound1(name, file) {
      var _this6 = this;

      var audioElem = new Audio(file);
      this.sounds[name] = {
        audioElem: audioElem,
        deviceId: '',
        // associated device id
        source: null,
        // linked MediaElementSource 
        streamDestination: null // linked StreamDestination 

      };
      return new Promise(function (resolved, rejected) {
        audioElem.oncanplaythrough = resolved;

        if (['safari', 'safari|ios'].includes(_this6.browser)) {
          audioElem.oncanplay = resolved;
          audioElem.onloadedmetadata = resolved;
        }

        audioElem.onerror = rejected;
      });
    }
  }, {
    key: "_generateTone1",
    value: function _generateTone1(toneName, toneDefinition) {
      var _this7 = this;

      return this._generateTone(toneDefinition).then(function (data) {
        var audioElem = new Audio();

        var blob = _this7._createBlob1(data);

        audioElem.src = URL.createObjectURL(blob);
        _this7.sounds[toneName] = {
          audioElem: audioElem,
          deviceId: '',
          // associated device id
          source: null,
          streamDestination: null
        };
      });
    } // Convert AudioBuffer to WAV Blob. 
    // Thanks to https://github.com/mattdiamond/Recorderjs  MIT lisence

  }, {
    key: "_createBlob1",
    value: function _createBlob1(audioBuffer) {
      function writeString(view, offset, string) {
        for (var i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }

      function floatTo16BitPCM(output, offset, input, k) {
        for (var i = 0; i < input.length; i++, offset += 2) {
          var v = input[i] / k;
          var s = Math.max(-1, Math.min(1, v));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
      }

      function normalize(input) {
        var max = 0,
            min = 0;

        for (var i = 0; i < input.length; i++) {
          var v = input[i];
          max = Math.max(max, v);
          min = Math.min(min, v);
        }

        return (max - min) / 2;
      }

      var samples = audioBuffer.getChannelData(0);
      var sampleRate = audioBuffer.sampleRate;
      var format = 1;
      var bitDepth = 16;
      var bytesPerSample = bitDepth / 8;
      var numChannels = 1;
      var blockAlign = numChannels * bytesPerSample;
      var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
      var view = new DataView(buffer);
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + samples.length * bytesPerSample, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(view, 36, 'data');
      view.setUint32(40, samples.length * bytesPerSample, true);
      var k = normalize(samples);
      floatTo16BitPCM(view, 44, samples, k);
      return new Blob([buffer], {
        type: "audio/wav"
      });
    }
  }, {
    key: "_play1",
    value: function _play1(options) {
      this.logger("AudioPlayer2 [AudioElement]: play: ".concat(JSON.stringify(options)));
      return this._play1_impl(options, 'sound', this.speakerDeviceId);
    }
  }, {
    key: "_playRing1",
    value: function _playRing1(options) {
      if (!this.ringerDeviceId) return Promise.resolve();
      this.logger("AudioPlayer2 [AudioElement]: playRing: ".concat(JSON.stringify(options)));
      return this._play1_impl(options, 'ringer', this.ringerDeviceId);
    }
  }, {
    key: "_playShortSound1",
    value: function _playShortSound1(options) {
      return this._play1_impl(options, 'ssound', this.speakerDeviceId);
    }
  }, {
    key: "_play1_impl",
    value: function _play1_impl(options, sname, deviceId) {
      var _this8 = this;

      this._silentStop1(this[sname]);

      var sound = this[sname] = this.sounds[options.name];

      if (!sound) {
        this.logger("AudioPlayer2 [AudioElement]: missed sound: \"".concat(options.name, "\""));
        return Promise.reject();
      }

      if (sound.source) {
        this.logger("AudioPlayer2 [AudioElement]: sound \"".concat(options.name, "\" was used for streaming"));
        return Promise.reject();
      }

      return Promise.resolve().then(function () {
        if (deviceId !== undefined && sound.audioElem.setSinkId !== undefined) {
          if (sound.deviceId === deviceId) {
            return Promise.resolve();
          } else {
            _this8.logger("AudioPlayer2 [AudioElement]: \"".concat(options.name, "\": setSinkId deviceId=\"").concat(deviceId, "\""));

            return sound.audioElem.setSinkId(deviceId);
          }
        } else {
          return Promise.resolve();
        }
      }).then(function () {
        sound.deviceId = deviceId;
      })["catch"](function (e) {
        // Sometimes there is Chrome error: 'The operation could not be performed and was aborted'
        _this8.logger("AudioPlayer2 [AudioElement]: HTMLAudioElement.setSinkId error \"".concat(e.message, "\" [used default speaker]"));
      }).then(function () {
        sound.audioElem.volume = options.volume !== undefined ? options.volume : 1.0;
        sound.audioElem.loop = !!options.loop && options.repeat === undefined;
        var repeat = options.repeat !== undefined ? options.repeat : 1;
        return new Promise(function (resolve) {
          sound.audioElem.onended = function () {
            if (--repeat > 0 && _this8[sname]) {
              sound.audioElem.currentTime = 0;
              sound.audioElem.play()["catch"](function (e) {
                _this8.logger('AudioPlayer2 [AudioElement]: play error', e);
              });
            } else {
              resolve();
            }
          };

          sound.audioElem.currentTime = 0;
          sound.audioElem.play()["catch"](function (e) {
            _this8.logger('AudioPlayer2 [AudioElement]: play error', e);
          });
        });
      });
    }
  }, {
    key: "_playStream1",
    value: function _playStream1(options, streamDestination) {
      var _this9 = this;

      this.logger("AudioPlayer2 [AudioElement]: play stream: ".concat(JSON.stringify(options)));

      this._silentStop1(this.sound);

      this.sound = null;
      this.sound = this.sounds[options.name];

      if (!this.sound) {
        this.logger("AudioPlayer2 [AudioElement]: missed media file: \"".concat(options.name, "\""));
        return Promise.reject();
      }

      return new Promise(function (resolve) {
        _this9.sound.audioElem.volume = options.volume !== undefined ? options.volume : 1.0;
        _this9.sound.audioElem.loop = !!options.loop && options.repeat === undefined;
        var repeat = options.repeat !== undefined ? options.repeat : 1;

        _this9.sound.audioElem.onended = function () {
          if (--repeat > 0 && _this9.sound) {
            _this9.sound.audioElem.currentTime = 0;

            _this9.sound.audioElem.play()["catch"](function (e) {
              _this9.logger('AudioPlayer2 [AudioElement]: streaming error', e);
            });
          } else {
            _this9.logger('AudioPlayer2 [AudioElement]: stopped');

            resolve();
          }
        };

        _this9.sound.audioElem.currentTime = 0; // It's workaround of the issue: https://bugs.chromium.org/p/chromium/issues/detail?id=429204
        // (The Audio cannot be used in createMediaElementSource again)

        if (!_this9.sound.source) {
          _this9.sound.source = _this9.audioCtx.createMediaElementSource(_this9.sound.audioElem);
        }

        _this9.sound.streamDestination = streamDestination;

        _this9.sound.source.connect(_this9.sound.streamDestination);

        _this9.sound.audioElem.play()["catch"](function (e) {
          _this9.logger('AudioPlayer2 [AudioElement]: streaming error', e);
        });
      });
    }
  }, {
    key: "_stop1",
    value: function _stop1() {
      this.logger('AudioPlayer2 [AudioElement]: stop');

      this._silentStop1(this.sound);

      this.sound = null;

      this._silentStop1(this.ringer);

      this.ringer = null;
    }
  }, {
    key: "_silentStop1",
    value: function _silentStop1(sound) {
      if (!sound) return;
      sound.audioElem.pause();

      if (sound.source) {
        try {
          sound.source && sound.source.disconnect();
          sound.streamDestination && sound.streamDestination.disconnect();
          sound.streamDestination = null;
        } catch (e) {
          this.logger('AudioPlayer2 [AudioElement]: disconnect AudioContext error', e);
        }
      }
    }
    /* 
      AudioContext implementation
    */

  }, {
    key: "_downloadSound2",
    value: function _downloadSound2(name, file) {
      var _this10 = this;

      return fetch(file, {
        credentials: 'same-origin'
      }).then(function (response) {
        if (response.status >= 200 && response.status <= 299) return response.arrayBuffer()["catch"](function () {
          throw 'download body error';
        });
        throw response.status === 404 ? 'file not found' : 'download error';
      }).then(function (data) {
        return _this10.audioCtx.decodeAudioData(data)["catch"](function () {
          throw 'decoding error';
        });
      }).then(function (decodedData) {
        _this10.sounds[name] = {
          data: decodedData,
          source: null,
          gain: null,
          streamDestination: null
        };
      })["catch"](function (e) {
        _this10.logger('AudioPlayer2 [AudioContext]: ' + e + ': ' + file);
      });
    }
  }, {
    key: "_generateTone2",
    value: function _generateTone2(toneName, toneDefinition) {
      var _this11 = this;

      return this._generateTone(toneDefinition).then(function (data) {
        if (data) {
          _this11.sounds[toneName] = {
            data: data,
            source: null,
            gain: null,
            streamDestination: null
          };
        }
      });
    }
  }, {
    key: "_play2",
    value: function _play2(options) {
      var _this12 = this;

      var streamDestination = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.logger("AudioPlayer2 [AudioContext]: ".concat(streamDestination ? 'playStream' : 'play', ": ").concat(JSON.stringify(options)));

      this._silentStop2();

      this.sound = this.sounds[options.name];

      if (!this.sound) {
        this.logger("AudioPlayer2 [AudioContext]: missed media: \"".concat(options.name, "\""));
        return Promise.reject();
      }

      return new Promise(function (resolve, reject) {
        try {
          _this12.sound.source = _this12.audioCtx.createBufferSource();
          _this12.sound.source.buffer = _this12.sound.data;

          _this12.sound.source.onended = function () {
            _this12.logger("AudioPlayer2 [AudioContext]:  onended ".concat(options.name));

            _this12._silentStop2();

            resolve(true);
          };

          _this12.sound.source.onerror = function (e) {
            _this12.logger("AudioPlayer2 [AudioContext]:  onerror ".concat(options.name));

            _this12._silentStop2();

            reject(new Error('onerror callback'));
          };

          _this12.sound.gain = _this12.audioCtx.createGain();
          var volume = options.volume ? options.volume : 1.0;

          _this12.sound.gain.gain.setValueAtTime(volume, _this12.audioCtx.currentTime);

          _this12.sound.source.connect(_this12.sound.gain);

          if (streamDestination) {
            _this12.sound.streamDestination = streamDestination;

            _this12.sound.gain.connect(_this12.sound.streamDestination);
          } else {
            _this12.sound.streamDestination = null;

            _this12.sound.gain.connect(_this12.audioCtx.destination);
          }

          if (options.loop === true || options.repeat) {
            _this12.sound.source.loop = true;
            _this12.sound.source.loopStart = 0;
          }

          var duration = null;

          if (options.repeat) {
            duration = _this12.sound.source.buffer.duration * options.repeat;
          }

          _this12.sound.source.start(0, 0);

          if (duration) _this12.sound.source.stop(_this12.audioCtx.currentTime + duration);
        } catch (e) {
          _this12.logger('AudioPlayer2 [AudioContext]: play error', e);

          _this12._silentStop2();

          reject(e);
        }
      });
    }
  }, {
    key: "_playShortSound2",
    value: function _playShortSound2(options) {
      var _this13 = this;

      var source;
      var gain;

      function release() {
        try {
          source && source.stop();
          gain && gain.disconnect();
          source && source.disconnect();
        } catch (e) {
          this.logger('AudioPlayer [AudioContext]: playShortSound: release error', e);
        }
      }

      return new Promise(function (resolve, reject) {
        try {
          var sound = _this13.sounds[options.name];

          if (!sound) {
            "AudioPlayer2 [AudioContext]: playShortSound: no sound: \"".concat(options.name, "\"");
            reject('No sound');
            return;
          }

          source = _this13.audioCtx.createBufferSource();
          source.buffer = sound.data;

          source.onended = function () {
            release();
            resolve();
          };

          source.onerror = function (e) {
            release();
            reject(e);
          };

          gain = _this13.audioCtx.createGain();
          var volume = options.volume ? options.volume : 1.0;
          gain.gain.setValueAtTime(volume, _this13.audioCtx.currentTime);
          source.connect(gain);
          gain.connect(_this13.audioCtx.destination);
          source.start();
        } catch (e) {
          _this13.logger('AudioPlayer [AudioContext]: playShortSound error', e);

          reject(e);
        }
      });
    }
  }, {
    key: "_stop2",
    value: function _stop2() {
      this.logger('AudioPlayer2 [AudioContext]: stop');

      this._silentStop2();
    }
  }, {
    key: "_silentStop2",
    value: function _silentStop2() {
      if (!this.sound) {
        return;
      }

      try {
        this.sound.source && this.sound.source.stop();
      } catch (e) {}

      try {
        this.sound.gain && this.sound.gain.disconnect();
        this.sound.source && this.sound.source.disconnect();
        this.sound.streamDestination && this.sound.streamDestination.disconnect();
        this.sound.gain = null;
        this.sound.source = null;
        this.sound.streamDestination = null;
      } catch (e) {
        this.logger('AudioPlayer2 [AudioContext]: release resources error', e);
      }

      this.sound = null;
    }
    /*
      Used in both implementations
    */
    // for Safari

  }, {
    key: "_setDecodeAudioDataShim",
    value: function _setDecodeAudioDataShim(audioCtx) {
      var origDecodeAudioData = audioCtx.decodeAudioData;

      audioCtx.decodeAudioData = function (data) {
        return new Promise(function (resolve, reject) {
          origDecodeAudioData.call(audioCtx, data, function (d) {
            return resolve(d);
          }, function (e) {
            return reject(e);
          });
        });
      };
    } // for Safari

  }, {
    key: "_setStartRenderingShim",
    value: function _setStartRenderingShim(offlineCtx) {
      var origStartRendering = offlineCtx.startRendering;

      offlineCtx.startRendering = function () {
        return new Promise(function (resolve) {
          offlineCtx.oncomplete = function (e) {
            resolve(e.renderedBuffer);
          };

          origStartRendering.call(offlineCtx);
        });
      };
    }
  }, {
    key: "_generateTone",
    value: function _generateTone(toneDefinition) {
      function getArray(e) {
        if (e === undefined) return [];
        if (Array.isArray(e)) return e;
        return [e];
      }

      try {
        var duration = 0;
        var oscillatorNumber = 0;

        var _iterator2 = _createForOfIteratorHelper(toneDefinition),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var _step4 = _step2.value;
            duration += _step4.t;
            oscillatorNumber = Math.max(oscillatorNumber, getArray(_step4.f).length);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        var channels = 1;
        var sampleRate = this.audioCtx.sampleRate;
        var frameCount = sampleRate * duration;
        var offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, frameCount, sampleRate);
        if (this.browser === 'safari' || this.browser === 'safari|ios') this._setStartRenderingShim(offlineCtx);
        var oscillators = new Array(oscillatorNumber);

        for (var i = 0; i < oscillators.length; i++) {
          oscillators[i] = offlineCtx.createOscillator();
          oscillators[i].connect(offlineCtx.destination);
        }

        var time = 0;

        for (var _i2 = 0, num = toneDefinition.length; _i2 < num; _i2++) {
          var step = toneDefinition[_i2];
          var frequencies = getArray(step.f);

          for (var j = 0; j < oscillators.length; j++) {
            var f = j < frequencies.length ? frequencies[j] : 0;
            oscillators[j].frequency.setValueAtTime(f, offlineCtx.currentTime + time);
          }

          time += step.t;
        }

        for (var _i3 = 0, _oscillators = oscillators; _i3 < _oscillators.length; _i3++) {
          var o = _oscillators[_i3];
          o.start(0);
          o.stop(offlineCtx.currentTime + duration);
        }

        return offlineCtx.startRendering().then(function (renderedBuffer) {
          var _iterator3 = _createForOfIteratorHelper(oscillators),
              _step3;

          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var _o = _step3.value;

              _o.disconnect();
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }

          return renderedBuffer;
        });
      } catch (e) {
        this.logger('AudioPlayer2: cannot generate tone', e);
        return Promise.reject(e);
      }
    }
  }]);

  return AudioPlayer2;
}();
/*
 * Recording audio/video.
 * For modern browsers only. Used MediaRecorder API.
 * Can be used in Chrome, Edge, Firefox and Safari
 */


var MRecorder = /*#__PURE__*/function () {
  function MRecorder() {
    _classCallCheck(this, MRecorder);

    this.logger = null;
    this.audioCtx = null;
    this.chunks = [];
    this.recorder = null;
    this.browser = this._browser();
    this.defaultOptions = {
      'chrome': {
        audio: {
          mimeType: 'audio/webm;codec=opus'
        },

        /* 
          Chrome 91 mediaRecorder
           Not supported:
            video: { mimeType: 'video/mp4;codecs=h264,opus' }
            video: { mimeType: 'video/webm;codecs=av1x,opus' } // Could be supported in the future.
           Supported:
            video: { mimeType: 'video/webm;codecs=avc1,opus' } // CodecID: V_MPEG4/ISO/AVC  It's H264
            video: { mimeType: 'video/webm;codecs=h264,opus' } // CodecID: V_MPEG4/ISO/AVC  It's H264
            video: { mimeType: 'video/webm;codecs=vp8,opus' }  // CodecID: V_VP8
            video: { mimeType: 'video/webm;codecs=vp9,opus' }  // CodecID: V_VP9
        */
        video: {
          mimeType: 'video/webm;codecs=vp8,opus'
        }
      },
      'firefox': {
        audio: {
          mimeType: 'audio/webm;codec=opus'
        },
        video: {
          mimeType: 'video/webm;codecs=vp8,opus'
        }
      },
      'safari': {
        audio: {
          mimeType: 'audio/mp4'
        },
        video: {
          mimeType: 'video/mp4'
        }
      },
      'ios_safari': {
        audio: {
          mimeType: 'audio/mp4'
        },
        video: {
          mimeType: 'video/mp4'
        }
      },
      'other': {
        audio: {
          mimeType: 'audio/webm'
        }
      }
    }[this.browser];
    this.selectedOptions = null;
  }

  _createClass(MRecorder, [{
    key: "_browser",
    value: function _browser() {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'ios_safari';
      if (navigator.mozGetUserMedia) return 'firefox';
      if (navigator.webkitGetUserMedia) // Work only for secure connection
        return 'chrome';
      if (window.safari) return 'safari';
      return 'other';
    }
  }, {
    key: "init",
    value: function init(logger, audioCtx) {
      this.logger = logger;
      this.audioCtx = audioCtx;
    }
  }, {
    key: "isRecording",
    value: function isRecording() {
      return this.recorder && this.recorder.state === 'recording';
    }
  }, {
    key: "recordStream",
    value: function recordStream(stream, options) {
      var _this14 = this;

      this.logger("MRecorder: recordStream()");
      this.create(stream, options);
      return this.start().then(function (blob) {
        _this14.closeStream();

        return blob;
      });
    }
  }, {
    key: "create",
    value:
    /**
     * To record only audio from audio/video stream use:
     * stream = new MediaStream(stream.getAudioTracks());
     *
     * To set non-default browser codecs use:
     * options = { mimeType: 'video/webm;codecs=vp9,opus' };
     */
    function create(stream) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var isVideo = stream.getVideoTracks().length > 0;

      if (!options && isVideo && !this.defaultOptions.video) {
        isVideo = false;
        this.logger("Warning: video mime undefined for ".concat(this.browser, ", records audio only"));
      }

      if (!options) {
        options = isVideo ? this.defaultOptions.video : this.defaultOptions.audio;
      }

      this.selectedOptions = options;
      this.logger("MRecorder recorded ".concat(isVideo ? '"video"' : '"audio"', ". Options: ").concat(JSON.stringify(this.selectedOptions)));
      this.recorder = new MediaRecorder(stream, this.selectedOptions);
    }
  }, {
    key: "start",
    value: function start() {
      var _this15 = this;

      return new Promise(function (resolve, reject) {
        _this15.chunks = [];

        _this15.recorder.ondataavailable = function (e) {
          _this15.chunks.push(e.data);
        };

        _this15.recorder.onerror = function (e) {
          reject(e);
        };

        _this15.recorder.onstop = function () {
          _this15.logger("MRecorder: create blob");

          resolve(new Blob(_this15.chunks, {
            type: _this15.selectedOptions.mimeType
          }));
          _this15.chunks = [];
        };

        _this15.recorder.start();
      });
    }
  }, {
    key: "stop",
    value: function stop() {
      if (!this.recorder || this.recorder.state !== 'recording') return;
      this.logger('MRecorder: stop');
      this.recorder.stop();
    }
  }, {
    key: "closeStream",
    value: function closeStream() {
      var _iterator4 = _createForOfIteratorHelper(this.recorder.stream.getTracks()),
          _step5;

      try {
        for (_iterator4.s(); !(_step5 = _iterator4.n()).done;) {
          var track = _step5.value;
          track.stop();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  }], [{
    key: "canBeUsed",
    value: function canBeUsed() {
      return typeof MediaRecorder === 'function';
    }
  }]);

  return MRecorder;
}();
/**
 * Automatic answering machine.
 * Play greeting, record answer.
 */


var AnsweringMachine = /*#__PURE__*/function () {
  function AnsweringMachine() {
    _classCallCheck(this, AnsweringMachine);

    this.use = true;
    this.startDelay = 16;
    this.recordDuration = 20;
    this.run = false;
    this.logger = null;
    this.call = null;
    this.streamDest = null;
    this.answerTimer = null;
    this.recordingTimer = null;
    this.audioPlayer = null;
    this.recorder = null;
    this.logger = null;
  }

  _createClass(AnsweringMachine, [{
    key: "init",
    value: function init(audioPlayer, recorder) {
      this.audioPlayer = audioPlayer;
      this.logger = audioPlayer.logger;
      this.recorder = recorder;
    }
  }, {
    key: "startTimer",
    value: function startTimer(call, answerCallback) {
      var _this16 = this;

      this.call = call;
      this.stopTimer();
      this.answerTimer = setTimeout(function () {
        _this16.run = true;
        answerCallback();
      }, this.startDelay * 1000);
    }
  }, {
    key: "stopTimer",
    value: function stopTimer() {
      if (this.answerTimer !== null) {
        clearTimeout(this.answerTimer);
        this.answerTimer = null;
      }
    }
  }, {
    key: "setStreamDestination",
    value: function setStreamDestination(streamDest) {
      this.streamDest = streamDest;
    } // Called if a call is terminated.

  }, {
    key: "stop",
    value: function stop(call) {
      if (call === this.call) {
        this.stopTimer();
        this.recorder.stop();

        if (this.recordingTimer !== null) {
          clearTimeout(this.recordingTimer);
          this.recordingTimer = null;
        }

        this.run = false;
      }
    } // Use destination stream, instead speaker.

  }, {
    key: "playGreeting",
    value: function playGreeting() {
      var _this17 = this;

      return this.audioPlayer.play({
        name: 'greeting',
        streamDestination: this.streamDest,
        volume: 1.0,
        startDelay: 1.6
      }).then(function () {
        return _this17.audioPlayer.play({
          name: 'beep',
          volume: 0.2,
          streamDestination: _this17.streamDest
        });
      });
    } // Record remote stream of the call.

  }, {
    key: "recordAnswer",
    value: function recordAnswer(remoteStream) {
      var _this18 = this;

      this.recorder.create(remoteStream);
      this.recordingTimer = setTimeout(function () {
        _this18.logger('AnsweringMachine: maximum recording time reached.');

        _this18.recorder.stop();
      }, this.recordDuration * 1000);
      return this.recorder.start().then(function (blob) {
        _this18.run = false;
        return blob;
      });
    }
  }]);

  return AnsweringMachine;
}();
/**
 *  SIP Alert-Info header parser.
 *
 * Alert-Info   =  "Alert-Info" HCOLON alert-param *(COMMA alert-param)
 * alert-param  =  LAQUOT absoluteURI RAQUOT *( SEMI generic-param )
 */


var AlertInfo = /*#__PURE__*/function () {
  function AlertInfo(incomingMsg) {
    _classCallCheck(this, AlertInfo);

    this.parsed = [];

    try {
      var _iterator5 = _createForOfIteratorHelper(incomingMsg.getHeaders('alert-info')),
          _step6;

      try {
        for (_iterator5.s(); !(_step6 = _iterator5.n()).done;) {
          var hh = _step6.value;

          var _iterator6 = _createForOfIteratorHelper(hh.split(',')),
              _step7;

          try {
            for (_iterator6.s(); !(_step7 = _iterator6.n()).done;) {
              var h = _step7.value;

              this._parseHeader(h);
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    } catch (e) {
      console.log('Alert-Info parsing error', e);
    }
  }

  _createClass(AlertInfo, [{
    key: "_parseHeader",
    value: function _parseHeader(h) {
      var st = h.split(';');
      var url;
      var pr_st = 0;

      if (st[0].startsWith('<') && st[0].endsWith('>')) {
        url = st[0].slice(1, -1);
        pr_st = 1;
      }

      var params = new Map();

      var _iterator7 = _createForOfIteratorHelper(st.slice(pr_st)),
          _step8;

      try {
        for (_iterator7.s(); !(_step8 = _iterator7.n()).done;) {
          var pr = _step8.value;
          var eq = pr.indexOf('=');

          if (eq !== -1) {
            var k = pr.substring(0, eq);
            var v = pr.substring(eq + 1);
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            params.set(k.toLowerCase(), v.toLowerCase());
          }
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }

      this.parsed.push({
        url: url,
        params: params
      });
    }
  }, {
    key: "exists",
    value: function exists() {
      return this.parsed.length > 0;
    }
  }, {
    key: "param",
    value: function param(key) {
      var ix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      if (ix >= this.parsed.length) return null;
      return this.parsed[ix].params.get(key);
    }
  }, {
    key: "url",
    value: function url() {
      var ix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      return this.parsed[ix].url;
    }
  }, {
    key: "getDelay",
    value: function getDelay() {
      var ix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var delay = this.param('delay', ix);
      if (!delay) return -1;
      return parseInt(delay);
    }
  }, {
    key: "hasAutoAnswer",
    value: function hasAutoAnswer() {
      var ix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      return this.param('info', ix) === 'alert-autoanswer';
    }
  }]);

  return AlertInfo;
}();
/* 
 * AudioCodes X-VoiceQuality header parser
 */


function getXVoiceQuality(request) {
  var header = request.getHeader('X-VoiceQuality');

  if (!header) {
    return undefined;
  }

  var words = header.trim().split(' ');

  if (words.length !== 2) {
    // should be 2 tokens.
    console.log('X-VoiceQuality header: parsing problem: must be 2 tokens');
    return undefined;
  }

  var score = parseInt(words[0]);

  if (isNaN(score)) {
    console.log('X-VoiceQuality header: parsing problem: the first token is not number');
    return undefined;
  }

  var color = words[1].trim().toLowerCase();
  return {
    score: score,
    color: color
  };
}
/**
 *  Audio mixer (for audio conference)
 */


var CallAudioMixer = /*#__PURE__*/function () {
  // For each call created audio mixer instance.
  // Аudio context can be taken from audio player
  function CallAudioMixer(audioCtx, call) {
    _classCallCheck(this, CallAudioMixer);

    this.audioCtx = audioCtx;
    this.dest = this.audioCtx.createMediaStreamDestination();
    this.calls = [];
    var source = this.audioCtx.createMediaStreamSource(call.getRTCLocalStream());
    source.connect(this.dest);
    this.calls.push({
      call: call,
      source: source
    });
  } // Close mixer, release all resources.


  _createClass(CallAudioMixer, [{
    key: "close",
    value: function close() {
      if (this.dest !== null) {
        this.dest.disconnect();
        this.dest = null;
      }

      var _iterator8 = _createForOfIteratorHelper(this.calls),
          _step9;

      try {
        for (_iterator8.s(); !(_step9 = _iterator8.n()).done;) {
          var c = _step9.value;
          c.source.disconnect();
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }

      this.calls = [];
    } // Get mixed audio stream

  }, {
    key: "getMix",
    value: function getMix() {
      return this.dest.stream;
    } // Add call to mixer.
    // Returns true if added, false if the call is already added.

  }, {
    key: "add",
    value: function add(call) {
      var ix = this.calls.findIndex(function (c) {
        return c.call === call;
      });
      if (ix !== -1) return false;
      var stream = call.getRTCRemoteStream();
      var source = this.audioCtx.createMediaStreamSource(stream);
      source.connect(this.dest);
      this.calls.push({
        call: call,
        source: source
      });
      return true;
    } // Remove call from mixer
    // Returns true if removed.
    // Returns false, if the call was not added, or cannot be removed, because set in constructor.

  }, {
    key: "remove",
    value: function remove(call) {
      var ix = this.calls.findIndex(function (c) {
        return c.call === call;
      });
      if (ix === -1 || ix === 0) return false;
      this.calls[ix].source.disconnect();
      this.calls.splice(ix, 1);
      return true;
    } // Returns string with calls list

  }, {
    key: "toString",
    value: function toString() {
      return 'audio mixer ' + this.calls.map(function (c) {
        return c.call.data['_line_index'] + 1;
      });
    }
  }]);

  return CallAudioMixer;
}();
/**
 *  Video mixer (for video conference)
 */


var CallVideoMixer = /*#__PURE__*/function () {
  // Used single instance for all calls.
  function CallVideoMixer() {
    _classCallCheck(this, CallVideoMixer);

    this.layout = 'compact';
    this.run = false;
    this.calls = [];
    this.localVideo = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.canvasBackground = "#F5F5F5"; // light smoke

    this.width = 160;
    this.height = 120;
    this.nVideo = 0;
    this.drawInterval = 100;
    this.remoteVideoId = '';
    this.frame = 1;
    this.data = {};
  } // Set canvas id.
  // Set local video element id.
  // Set remote video element id prefix. (will be added video element index 0, 1, ...)


  _createClass(CallVideoMixer, [{
    key: "setElements",
    value: function setElements(canvasId, localVideoId, remoteVideoId) {
      this.canvas = document.getElementById(canvasId);
      this.canvasCtx = this.canvas.getContext('2d');
      this.localVideo = document.getElementById(localVideoId);
      this.remoteVideoId = remoteVideoId;
    } // Set number of frames per seconds of mixed stream.
    // For example: 1, 2, 5, 10, 20, 50.
    // Default: 10

  }, {
    key: "setFPS",
    value: function setFPS(v) {
      this.setDrawInterval(1000 / v);
    } // Set interval between draw (milliseconds)
    // Default: 100
    // It can be set also via setFPS

  }, {
    key: "setDrawInterval",
    value: function setDrawInterval(v) {
      this.drawInterval = v;
    } // Set calls video layout: 'linear' or 'compact'
    // Default: 'compact'

  }, {
    key: "setLayout",
    value: function setLayout(v) {
      switch (v) {
        case 'linear':
        case 'compact':
          this.layout = v;
          break;

        default:
          throw new TypeError("Unknown layout: ".concat(v));
      }

      this.resize();
    } // Set call video size (pixels)
    // Default w=160, h=120

  }, {
    key: "setSize",
    value: function setSize(w, h) {
      this.width = w;
      this.height = h;
      this.resize();
    } // Set call video sizes (pixels)
    // size likes: {width: '160px', height: '120px'}

  }, {
    key: "setSizes",
    value: function setSizes(size) {
      // format {width: '160px', height: '120px'}
      var w = parseInt(size.width.slice(0, -2));
      var h = parseInt(size.height.slice(0, -2));
      this.setSize(w, h);
    } // Returns true when mixer is started

  }, {
    key: "isOn",
    value: function isOn() {
      return this.run;
    } // Start mixer

  }, {
    key: "start",
    value: function start() {
      if (this.run) return;
      setTimeout(this._draw.bind(this), this.drawInterval);
      this.run = true;
    } // Stop mixer, remove all calls, release resources.
    // After using stop the mixer can be restarted.

  }, {
    key: "stop",
    value: function stop() {
      while (this.calls.length > 0) {
        this.remove(this.calls[0].call);
      }

      this.run = false;
    } // Get mixed video stream for added call.

  }, {
    key: "getMix",
    value: function getMix(call) {
      var ix = this.calls.findIndex(function (d) {
        return d.call === call;
      });
      return ix !== -1 ? this.calls[ix].mix : null;
    } // Add call to mixer or update send/receive mode.
    // Returns true if send video was added (should be replaced connection sender track)

  }, {
    key: "add",
    value: function add(call) {
      var send = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var receive = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var ix = this.calls.findIndex(function (d) {
        return d.call === call;
      });

      if (ix === -1) {
        return this._add(call, send, receive);
      } else {
        return this._update(ix, send, receive);
      }
    }
  }, {
    key: "_add",
    value: function _add(call, send, receive) {
      var mix = send ? this.canvas.captureStream() : null;
      var elt = receive ? document.getElementById(this.remoteVideoId + call.data['_line_index']) : null;
      var x = 0;
      var y = 0;
      this.calls.push({
        call: call,
        elt: elt,
        mix: mix,
        x: x,
        y: y
      });
      if (elt !== null) this.resize();
      return mix !== null;
    }
  }, {
    key: "_update",
    value: function _update(ix, send, receive) {
      var d = this.calls[ix];
      var sendModified = false;

      if (send) {
        if (d.mix === null) {
          d.mix = this.canvas.captureStream();
          sendModified = true;
        }
      } else {
        if (d.mix !== null) {
          var _iterator9 = _createForOfIteratorHelper(d.mix.getVideoTracks()),
              _step10;

          try {
            for (_iterator9.s(); !(_step10 = _iterator9.n()).done;) {
              var track = _step10.value;
              track.stop();
            }
          } catch (err) {
            _iterator9.e(err);
          } finally {
            _iterator9.f();
          }

          d.mix = null;
          sendModified = true;
        }
      }

      if (receive) {
        if (d.elt === null) {
          d.elt = document.getElementById(this.remoteVideoId + d.call.data['_line_index']);
          this.resize();
        }
      } else {
        if (d.elt !== null) {
          d.elt = null;
          this.resize();
        }
      }

      return sendModified;
    } // Remove call from mixer.
    // Returns true if removed, false if was not added.

  }, {
    key: "remove",
    value: function remove(call) {
      var ix = this.calls.findIndex(function (d) {
        return d.call === call;
      }); //console.log('video mixer: remove call with index=', call.data['_line_index'], ix);

      if (ix === -1) return false;
      var d = this.calls[ix];

      if (d.mix !== null) {
        var _iterator10 = _createForOfIteratorHelper(d.mix.getVideoTracks()),
            _step11;

        try {
          for (_iterator10.s(); !(_step11 = _iterator10.n()).done;) {
            var track = _step11.value;
            track.stop();
          }
        } catch (err) {
          _iterator10.e(err);
        } finally {
          _iterator10.f();
        }
      }

      this.calls.splice(ix, 1);
      if (d.elt !== null) this.resize();
      return true;
    } // number of video displayed in canvas

  }, {
    key: "_nVideo",
    value: function _nVideo() {
      var n = 0;
      if (this.localVideo.srcObject !== null) n++;

      var _iterator11 = _createForOfIteratorHelper(this.calls),
          _step12;

      try {
        for (_iterator11.s(); !(_step12 = _iterator11.n()).done;) {
          var d = _step12.value;
          if (d.elt !== null) n++;
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }

      return n;
    } // Resize video layout then changed number of video channels
    // Used when added/removed local video channel.
    // Called automatically in methods: add, remove, setLayout, setSize
    //
    // Warning: it's designed for 5 lines phone !
    // Max number of video controls is 6 (including local video)
    // If you use more lines, please modify this method.
    //
    // Video layouts
    // linear   0 1     0 1 2     0 1 2 3    0 1 2 3 4 ....
    //
    // compact  0 1     0 1      0 1      0 1 2     0 1 2
    //                   2       2 3       3 4      3 4 5

  }, {
    key: "resize",
    value: function resize() {
      this.nVideo = this._nVideo(); // number of shown video
      //console.log(`videoMixer: resize nVideo=${this.nVideo} [${this.localVideo.srcObject !== null ? 'with local':'without local'} video]`);

      switch (this.layout) {
        case 'linear':
          this.canvas.width = (this.width + this.frame) * this.nVideo;
          this.canvas.height = this.height;
          break;

        case 'compact':
          if (this.nVideo <= 2) {
            this.canvas.width = (this.width + this.frame) * this.nVideo;
            this.canvas.height = this.height;
          } else if (this.nVideo <= 4) {
            this.canvas.width = (this.width + this.frame) * 2;
            this.canvas.height = this.height * 2 + this.frame;
          } else {
            this.canvas.width = this.width * 3;
            this.canvas.height = this.height * 2 + this.frame;
          }

          break;
      }

      this.canvasCtx.fillStyle = this.canvasBackground;
      this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height); // sort calls by line index

      this.calls.sort(function (d1, d2) {
        return d1.call.data['_line_index'] - d2.call.data['_line_index'];
      }); // reorder pictures in canvas

      var ix = 0;
      if (this.localVideo.srcObject !== null) ix++;

      var _iterator12 = _createForOfIteratorHelper(this.calls),
          _step13;

      try {
        for (_iterator12.s(); !(_step13 = _iterator12.n()).done;) {
          var d = _step13.value;

          if (d.elt !== null) {
            var _this$_location = this._location(ix),
                _this$_location2 = _slicedToArray(_this$_location, 2),
                x = _this$_location2[0],
                y = _this$_location2[1];

            d.x = x;
            d.y = y;
            ix++;
          }
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
    } // Calculate video picture location by index.
    //
    // Warning: it's designed for 5 lines phone !
    // Max number of video controls is 6 (including local video)
    // If you use more lines, modify this method

  }, {
    key: "_location",
    value: function _location(ix) {
      var w = this.width + this.frame;
      var h = this.height + this.frame;

      switch (this.layout) {
        case 'linear':
          return [ix * w, 0];

        case 'compact':
          switch (this.nVideo) {
            case 0:
            case 1:
            case 2:
              return [ix * w, 0];

            case 3:
              return ix < 2 ? [w, 0] : [w * (ix - 2) + 0.5 * w, h];

            case 4:
              return ix < 2 ? [w, 0] : [w * (ix - 2), h];

            case 5:
              return ix < 3 ? [w * ix, 0] : [w * (ix - 3) + 0.5 * w, h];

            case 6:
              return ix < 3 ? [w * ix, 0] : [w * (ix - 3), h];
          }

      }
    }
  }, {
    key: "_draw",
    value: function _draw() {
      if (!this.run) return;

      try {
        if (this.nVideo > 0) {
          if (this.localVideo.srcObject !== null) this.canvasCtx.drawImage(this.localVideo, 0, 0, this.width, this.height);

          var _iterator13 = _createForOfIteratorHelper(this.calls),
              _step14;

          try {
            for (_iterator13.s(); !(_step14 = _iterator13.n()).done;) {
              var d = _step14.value;
              if (d.elt !== null) this.canvasCtx.drawImage(d.elt, d.x, d.y, this.width, this.height);
            }
          } catch (err) {
            _iterator13.e(err);
          } finally {
            _iterator13.f();
          }
        }
      } catch (e) {
        console.log(e);
      }

      setTimeout(this._draw.bind(this), this.drawInterval);
    } // Returns string with calls list

  }, {
    key: "toString",
    value: function toString() {
      if (this.run) {
        return 'video mixer ' + this.calls.map(function (c) {
          return "".concat(c.call.data['_line_index'] + 1).concat(c.mix !== null ? 's' : '').concat(c.elt !== null ? 'r' : '');
        });
      } else {
        return 'video mixer is off';
      }
    }
  }]);

  return CallVideoMixer;
}(); // Dynamically load arbitrary javascript


function loadJavaScript(url) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.onload = resolve;
    script.onerror = reject;
    script.src = url;
    document.head.appendChild(script);
  });
}
/**
 * Enumerate available devices: microphones, cameras, speakers (only Chrome provides speakers).
 * Allow select devices, save the selection to local storage.
 * Restore the device selection in the next sessions.
 *
 * Selected microphone and camera used in getUserMedia method as deviceId constraint.
 * Selected speaker and ringer associated with HTMLAudioElement by setSinkId method (only in Chrome).
 */


var SelectDevices = /*#__PURE__*/function () {
  // Parameters can be modified before enumerate() method.
  function SelectDevices() {
    _classCallCheck(this, SelectDevices);

    this.defaultPseudoDevice = true;
    this.names = [];
    this.enumerateDevices = AudioCodesUA.instance.getWR().mediaDevices.enumerateDevices; // enumerate devices function.

    this.browserDefaultLabel = '-- browser default--'; // default pseudo device - means do not use deviceId and sinkId

    this.emptyLabel = '-- no label --'; // for label = '' in incomplete device list

    this.previousSelection = null; // device selection from local storage
  }

  _createClass(SelectDevices, [{
    key: "setDevices",
    value: function setDevices(defaultPseudoDevice, devices) {
      this.defaultPseudoDevice = defaultPseudoDevice;
      this.names = [];

      var _iterator14 = _createForOfIteratorHelper(devices),
          _step15;

      try {
        for (_iterator14.s(); !(_step15 = _iterator14.n()).done;) {
          var device = _step15.value;
          if (!['audioinput', 'audiooutput', 'videoinput'].includes(device.kind)) throw new TypeException("Illegal kind: ".concat(device.kind));
          this.names.push(device.name);
          this[device.name] = {
            kind: device.kind
          };
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
    }
  }, {
    key: "setEnumerateDevices",
    value: function setEnumerateDevices(method) {
      this.enumerateDevices = method;
    }
  }, {
    key: "enumerate",
    value: function enumerate(useGetUserMediaIfNeed) {
      var _this19 = this;

      var stream = null;
      var incomplete = false;
      return Promise.resolve().then(function () {
        return _this19.doEnumerate();
      }).then(function (inc) {
        incomplete = inc;

        if (incomplete && useGetUserMediaIfNeed) {
          return AudioCodesUA.instance.getWR().getUserMedia({
            audio: true,
            video: true
          });
        } else {
          return Promise.resolve(null);
        }
      }).then(function (s) {
        stream = s;

        if (stream) {
          // For incomplete device list repeat with open stream.
          return _this19.doEnumerate();
        }
      }).then(function () {
        if (stream) {
          incomplete = false;
          stream.getTracks().forEach(function (track) {
            return track.stop();
          });
        }
      }).then(function () {
        // Restore previous selection.
        if (_this19.previousSelection) {
          var _iterator15 = _createForOfIteratorHelper(_this19.names),
              _step16;

          try {
            for (_iterator15.s(); !(_step16 = _iterator15.n()).done;) {
              var name = _step16.value;

              if (!_this19.findPreviousSelection(name)) {
                if (incomplete) _this19.addPreviousSelection(name);
              }
            }
          } catch (err) {
            _iterator15.e(err);
          } finally {
            _iterator15.f();
          }
        }
      });
    } // Without open stream by getUserMedia (or without permission to use microphone/camera)
    // device list will be incomplete:
    // some devices will be with empty string label, some devices can be missed.

  }, {
    key: "doEnumerate",
    value: function doEnumerate() {
      var _this20 = this;

      var incomplete = false; // exists incomplete device lists

      var emptyLabel = this.emptyLabel;

      function setLabel(device, str) {
        if (str) return str;
        incomplete = device.incomplete = true;
        return emptyLabel;
      } // reset device list and selection index.


      var _iterator16 = _createForOfIteratorHelper(this.names),
          _step17;

      try {
        for (_iterator16.s(); !(_step17 = _iterator16.n()).done;) {
          var name = _step17.value;
          var device = this.getDevice(name);
          device.incomplete = false;

          if (this.defaultPseudoDevice) {
            device.index = 0; // selected browser default pseudo-device.

            device.list = [{
              deviceId: null,
              label: this.browserDefaultLabel
            }];
          } else {
            device.index = -1; // device is not selected.

            device.list = [];
          }
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }

      return this.enumerateDevices().then(function (infos) {
        var _iterator17 = _createForOfIteratorHelper(infos),
            _step18;

        try {
          for (_iterator17.s(); !(_step18 = _iterator17.n()).done;) {
            var info = _step18.value;

            var _iterator18 = _createForOfIteratorHelper(_this20.names),
                _step19;

            try {
              for (_iterator18.s(); !(_step19 = _iterator18.n()).done;) {
                var name = _step19.value;

                var device = _this20.getDevice(name);

                if (info.kind === device.kind) {
                  device.list.push({
                    deviceId: info.deviceId,
                    label: setLabel(device, info.label)
                  });
                }
              }
            } catch (err) {
              _iterator18.e(err);
            } finally {
              _iterator18.f();
            }
          }
        } catch (err) {
          _iterator17.e(err);
        } finally {
          _iterator17.f();
        }
      }).then(function () {
        return incomplete;
      });
    } // Select device using previously saved device label

  }, {
    key: "findPreviousSelection",
    value: function findPreviousSelection(name) {
      var device = this.getDevice(name);
      var sel = this.previousSelection && this.previousSelection[name];
      if (!sel || sel.label === this.emptyLabel) return false;

      for (var ix = 0; ix < device.list.length; ix++) {
        if (device.list[ix].label === sel.label) {
          device.index = ix;
          return true;
        }
      }

      return false;
    } // Without open stream by getUserMedia enumerate devices provides incomplete device list.
    // In the case we add previously selected device to the incomplete list.
    // Problem: previously used USB or bluetooth headset/camera could be disconnected.

  }, {
    key: "addPreviousSelection",
    value: function addPreviousSelection(name) {
      var device = this.getDevice(name);
      var sel = this.previousSelection && this.previousSelection[name];

      if (sel && sel.label !== this.browserDefaultLabel && sel.label !== this.emptyLabel) {
        AudioCodesUA.ac_log("devices: added previously selected ".concat(name, " \"").concat(sel.label, "\""));
        device.list.push(sel);
        device.index = device.list.length - 1;
      }
    } // Returns selected device object { deviceId: '', label: ''}

  }, {
    key: "getDevice",
    value: function getDevice(name) {
      if (!this[name]) throw new TypeError("wrong device name: ".concat(name));
      return this[name];
    }
  }, {
    key: "getSelected",
    value: function getSelected(name) {
      var device = this.getDevice(name);
      if (device.list.length === 0 || device.index === -1) // device list is empty or device is not selected 
        return {
          deviceId: null,
          label: this.emptyLabel
        };
      return device.list[device.index];
    }
  }, {
    key: "getNumber",
    value: function getNumber(name) {
      return this.getDevice(name).list.length;
    } // Set selected by GUI device

  }, {
    key: "setSelectedIndex",
    value: function setSelectedIndex(name, index) {
      var device = this.getDevice(name);
      if (index < 0 || index >= device.list.length) throw new RangeError("setSelectedIndex ".concat(name, " index=").concat(index));
      device.index = index;
    } // Store selected devices. Supposed local storage usage.

  }, {
    key: "store",
    value: function store() {
      this.previousSelection = null;

      var _iterator19 = _createForOfIteratorHelper(this.names),
          _step20;

      try {
        for (_iterator19.s(); !(_step20 = _iterator19.n()).done;) {
          var name = _step20.value;
          var device = this.getDevice(name);
          if (device.list.length === 0 || device.index === -1) continue;
          if (!this.previousSelection) this.previousSelection = {};
          this.previousSelection[name] = this.getSelected(name);
        }
      } catch (err) {
        _iterator19.e(err);
      } finally {
        _iterator19.f();
      }

      return this.previousSelection;
    } // Load previously stored selected devices. Can be null if no stored devices.

  }, {
    key: "load",
    value: function load(obj) {
      this.previousSelection = obj;
    } // Device connected/removed event

  }, {
    key: "addDeviceChangeListener",
    value: function addDeviceChangeListener(listener) {
      AudioCodesUA.instance.getWR().mediaDevices.addDeviceChangeListener(listener);
    }
  }, {
    key: "removeDeviceChangeListener",
    value: function removeDeviceChangeListener(listener) {
      AudioCodesUA.instance.getWR().mediaDevices.removeDeviceChangeListener(listener);
    }
  }]);

  return SelectDevices;
}();