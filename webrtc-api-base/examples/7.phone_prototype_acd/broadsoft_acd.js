/**
 *  BroadSoft Automatic Call Distribution (ACD)
 *
 *  This is an optional part of the AudioCodes Web WebRTC SDK
 * 
 *  Igor Kolosov AudioCodes 2021
 *  Last edit 7-Jul-2021 
 */
class BroadsoftHoteling {
    constructor() {
        this.hoteling = null;
        this.listeners = {};
        this.log = console.log;
        this.targetUser = '';
        this.expires = 0;
        this.acdUser = '';
        this.acdPassword = ''
    }

    setListeners(hotelingGuestAddress, hotelingError) {
        this.listeners.hotelingGuestAddress = hotelingGuestAddress;
        this.listeners.hotelingError = hotelingError;
    }

    configure(acdUser, acdPassword, expires) {
        if (!expires)
            throw 'missed expires';
        if (typeof expires !== 'number')
            throw 'expires must be number';
        if (!acdUser)
            throw 'missed acdUser';
        this.acdUser = acdUser;         // used as hoteling guest address
        this.acdPassword = acdPassword; // used for hoteling md5 xml authentication
        this.expires = expires;         // used for hoteling and acd
        this.targetUser = AudioCodesUA.instance.account.user;
    }

    setLog(log) {
        this.log = log;
    }

    //------------------- subscribe callbacks ------------------------
    active() {
        this.log('Hoteling: subscription is active');
    }

    notify(isFinal, notify, body, contentType) {
        let dom;
        try {
            dom = pjXML.parse(body);
        } catch (e) {
            this.log('[Error] Hoteling: cannot parse XML', e);
            this.listeners.hotelingError('cannot parse XML', false);
            return;
        }

        // Parser debugging
        //this.log('[DEBUG] parsed NOTIFY XML', JSON.stringify(dom, null, 2));

        let root = dom.firstElement()?.name;
        if (root !== 'HotelingEvent') {
            this.log(`[Error] Hoteling: XML unknown root name: ${root}  instead "HotelingEvent"`);
            this.listeners.hotelingError('XML unknown root name', false);
            return;
        }

        let nonce = dom.select('/HotelingEvent/authenticationData/nonce')?.text();
        if (nonce) {
            if (this.hoteling.data.nonce !== nonce) {
                this.log('[Info] Hoteling: resend XML with authentication');
                this.hoteling.data.nonce = nonce; // to prevent authentication repeat forever
                let data = nonce + ':' + this.acdPassword; 
                let response = JsSIP.Utils.calculateMD5(data);
                //this.log(`[DEBUG] Hoteling authentication: data=${data} response=${response}`);
                let xml = this.xmlSetHoteling(this.hoteling.data.guestAddress, nonce, response);
                this.hoteling.subscribe(xml);
            } else {
                // Don't fired in tested genesys server. 
                // The server if authentication is failed don't ask nonce again.
                this.log('[Error] Hoteling: authentication failed');
                this.listeners.hotelingError('authentication failed', false);
            }
            return;
        }

        let guestAddress = dom.select('/HotelingEvent/guestAddress')?.text();
        this.listeners.hotelingGuestAddress(guestAddress);
    }

    // When we stop subscription, the event handler removed, so 
    // it will be called only for error cases.
    terminated(code) {
        let text = subscriberTerminationText(this.hoteling, code)
        this.log(`[Error] Hoteling: subscription is terminated (${text})`);
        this.hoteling = null;
        this.listeners.hotelingError('terminated', true);
    }

    //-------------------------- public API --------------------------
    start() {
        this.log('[Info] Hoteling: start()');
        if (!this.acdUser)
            throw 'no configured';
        if (this.hoteling !== null)
            throw 'hoteling already started'

        this.hoteling = phone.subscribe(this.targetUser,
            'x-broadworks-hoteling', 'application/x-broadworks-hoteling+xml',
            {
                expires: this.expires,
                contentType: 'application/x-broadworks-hoteling+xml',
                params: { cseq: 0 },
                headers: ['Accept-Language: en'],
                credential: null,
            });

        this.hoteling.on('active', this.active.bind(this));
        this.hoteling.on('notify', this.notify.bind(this));
        this.hoteling.on('terminated', this.terminated.bind(this));

        this.hoteling.subscribe();
    }

    setGuestAddress(set = true) {
        this.log(`Hoteling: setGuestAddress(${set})`);
        if (!this.hoteling)
            throw 'no hoteling subscription';
        this.hoteling.data.guestAddress = set ? this.acdUser : undefined;
        let xml = this.xmlSetHoteling(this.hoteling.data.guestAddress);
        this.hoteling.subscribe(xml);
    }

    stop() {
        this.log('Hoteling: stop()');
        if (this.hoteling) {
            this.hoteling.removeAllListeners('active');
            this.hoteling.removeAllListeners('notify');
            this.hoteling.removeAllListeners('terminated');

            this.hoteling.terminate();
            this.hoteling = null;
        } else {
            this.log('No hoteling dialog');
        }
    }

    //--------------------------- XML --------------------------------
    xmlSetHoteling(address, nonce, response) {
        let s = '<?xml version="1.0" encoding="ISO-8859-1"?>\r\n' +
            '<SetHoteling xmlns="http://schema.broadsoft.com/hoteling">\r\n';
        if (address) {
            s += `<guestAddress>${address}</guestAddress>\r\n`;
        } else {
            s += '<guestAddress/>\r\n';
        }
        if (nonce) {
            s += '<authenticationData>\r\n' +
                `<nonce>${nonce}</nonce>\r\n` +
                '<algorithm>MD5</algorithm>\r\n' +
                `<response>${response}</response>\r\n` +
                '</authenticationData>\r\n';
        }
        s += '</SetHoteling>\r\n';

        return s;
    }
}

class BroadsoftFeature {
    constructor() {
        this.feature = null;
        this.listeners = {};
        this.log = console.log;
        this.targetUser = '';
        this.expires = 0;
    }

    configure(expires) {
        if (!expires)
            throw 'missed expires';
        if (typeof expires !== 'number')
            throw 'expires must be number';
        this.expires = expires;
        this.targetUser = AudioCodesUA.instance.account.user;
    }

    setListeners(featureState, featureError) {
        this.listeners.featureState = featureState;
        this.listeners.featureError = featureError;
    }

    setLog(log) {
        this.log = log;
    }

    //------------- subscribe callbacks ---------------
    active() {
        this.log('Feature: subscription is active');
    }

    notify(isFinal, notify, body, contentType) {
        let dom;
        try {
            dom = pjXML.parse(body);
        } catch (e) {
            this.log('[Error] Feature: cannot parse XML', e);
            this.listeners.featureError('cannot parse XML', false);
            return;
        }

        // XML parser debugging
        //this.log('[DEBUG] parsed NOTIFY XML', JSON.stringify(dom, null, 2));

        let root = dom.firstElement()?.name;
        switch (root) {
            case 'AgentLoggedOnEvent':
                this.listeners.featureState('loggedOn');
                break;
            case 'AgentLoggedOffEvent':
                this.listeners.featureState('loggedOff');
                break;
            case 'AgentReadyEvent':
                this.listeners.featureState('ready');
                break;
            case 'AgentNotReadyEvent':
                let strReason = dom.select('/AgentNotReadyEvent/extensions/privateData/private/pri:AgentNotReadyReasonValue')?.text();
                let reason = strReason !== undefined ? parseInt(strReason) : undefined;
                this.listeners.featureState('notReady', reason);
                break;
            case 'AgentWorkingAfterCallEvent':
                this.listeners.featureState('workingAfterCall');
                break;
            default:
                this.log(`[Warning] Feature:  ignored unknown state, XML root is "${root}"`);
                return;
        }
    }

    terminated(code) {
        let text = subscriberTerminationText(this.feature, code)
        this.log(`Feature: subscription is terminated (${text})`);
        this.feature = null;
        this.listeners.featureError('terminated', true);
    }
	
    //-------------------- public API ------------------------
    start() {
        this.log('Feature: start()');
        if (!this.expires)
            throw 'no configured';
        if (this.feature !== null)
            throw 'feature already started'

        this.feature = phone.subscribe(this.targetUser,
            'as-feature-event',
            'application/x-as-feature-event+xml',
            {
                expires: this.expires,
                contentType: 'application/x-as-feature-event+xml',
                params: { cseq: 0 },
                headers: ['Accept-Language: en'],
                credential: null,
            });

        this.feature.on('active', this.active.bind(this));
        this.feature.on('notify', this.notify.bind(this));
        this.feature.on('terminated', this.terminated.bind(this));

        this.feature.subscribe();
    }

    stop() {
        this.log('Feature: stop()');
        if (this.feature) {
            this.feature.removeAllListeners('active');
            this.feature.removeAllListeners('notify');
            this.feature.removeAllListeners('terminated');

            this.feature.terminate();
            this.feature = null;
        } else {
            this.log('No feature subscription');
        }
    }

    /** 
     state: "loggedOn "loggedOff" "ready" "notReady"  "workingAfterCall"		
     notReadyReason number used for not ready state.
     */
    setState(state, notReadyReason) {
        this.log('Feature: setState', state, notReadyReason);
        if (!this.feature)
            throw 'no feature subscription';
        if (!['loggedOff', 'ready', 'notReady', 'workingAfterCall'].includes(state))
            throw 'unknown state: ' + state;
        let xml = this.xmlSetAgentState(state, notReadyReason);
        this.feature.subscribe(xml);
    }

    //---------------------- XML ----------------------------
    xmlSetAgentState(state, notReadyReason = 0) {
        let s = '<?xml version="1.0" encoding="ISO-8859-1"?>\r\n'
            + '<SetAgentState xmlns="http://www.ecma-international.org/standards/ecma-323/csta/ed3">\r\n'
            + '<device></device>\r\n'
            + `<requestedAgentState>${state}</requestedAgentState>\r\n`;

        if (state === 'notReady') {
            s += '<extensions>\r\n'
                + '<privateData>\r\n'
                + '<private xmlns:pri="http://schema.broadsoft.com/CSTAPrivateData">\r\n'
                + `<pri:AgentNotReadyReasonValue>${notReadyReason}</pri:AgentNotReadyReasonValue>`
                + '</private>\r\n'
                + '</privateData>\r\n'
                + '</extensions>\r\n';
        }

        s += '<agentID></agentID>\r\n'
            + '<password></password>\r\n'
            + '</SetAgentState>\r\n';

        return s;
    }
}

function subscriberTerminationText(subscriber, terminationCode) {
    if (!subscriber)
        return `subscriber terminated with code ${terminationCode}`;
    switch (terminationCode) {
        case subscriber.C.SUBSCRIBE_RESPONSE_TIMEOUT: return 'subscribe response timeout';
        case subscriber.C.SUBSCRIBE_TRANSPORT_ERROR: return 'subscribe transport error';
        case subscriber.C.SUBSCRIBE_NON_OK_RESPONSE: return 'subscribe non-OK response';
        case subscriber.C.SUBSCRIBE_BAD_OK_RESPONSE: return 'subscribe bad response (missed Contact)';
        case subscriber.C.SUBSCRIBE_FAILED_AUTHENTICATION: return 'subscribe failed authentication';
        case subscriber.C.UNSUBSCRIBE_TIMEOUT: return 'un-subscribe timeout';
        case subscriber.C.RECEIVE_FINAL_NOTIFY: return 'receive final notify';
        case subscriber.C.RECEIVE_BAD_NOTIFY: return 'receive bad notify';
        default: return 'unknown termination code: ' + terminationCode;
    }
}

class BroadsoftAcdAgent {
    constructor() {
        this.broadsoftHoteling = new BroadsoftHoteling();
        this.broadsoftFeature = new BroadsoftFeature();
        this.listeners = null;
        this.isLoginInProgress = false;
        this.loginState = 'ready';
        this.loginSubstate = undefined;
        this.isLogoffInProgress = false;
    }

    setListeners(state, error) {
        this.listeners = {
            state: state,
            error: error
        };
    }

    setLog(log) {
        this.log = log;
        this.broadsoftHoteling.setLog(log);
        this.broadsoftFeature.setLog(log);
    }

    setAccount(acdUser, acdPassword, expires) {
        if (!expires)
            throw 'missed expires';
        if (typeof expires !== 'number')
            throw 'expires must be number';
        if (!acdUser)
            throw 'missed acdUser';
        this.broadsoftHoteling.configure(acdUser, acdPassword, expires);
        this.broadsoftFeature.configure(expires);
    }

    setLoginState(state, substate) {
        this.loginState = state;
        this.loginSubstate = substate;
    }

    _hotelingGuestAddressCallback(address) {
        this.listeners.state('guestAddress', address);
        if (this.isLoginInProgress) {
            if (address) {
                this.isLoginInProgress = false;
                this.broadsoftFeature.setState(this.loginState, this.loginSubstate);
            } else {
                this.log('Warning: ignore empty guest address during login');
            }
        }
    }

    _hotelingErrorCallback(err, terminated) {
        this.listeners.error(`hoteling ${err}`, terminated);
    }

    _featureStateCallback(state, substate) {
        this.listeners.state(state, substate);
        if (this.isLogoffInProgress && state === 'loggedOff') {
            this.isLogoffInProgress = false;
            this.broadsoftHoteling.setGuestAddress(false);
        }
    }

    _featureErrorCallback(err, terminated) {
        this.listeners.error(`feature ${err}`, terminated);
    }

    start() {
        if (!this.listeners.state || !this.listeners.error)
            throw 'listeners not set';
        this.broadsoftHoteling.setListeners(this._hotelingGuestAddressCallback.bind(this), this._hotelingErrorCallback.bind(this));
        this.broadsoftFeature.setListeners(this._featureStateCallback.bind(this), this._featureErrorCallback.bind(this));
        if( this.broadsoftHoteling.hoteling)
          throw 'already started';
        this.broadsoftHoteling.start();
        this.broadsoftFeature.start();
    }

    stop() {
        this.broadsoftFeature.stop();
        this.broadsoftHoteling.stop();
    }

    logon() {
        if( !this.broadsoftHoteling.hoteling)
          throw 'not started';
        this.isLoginInProgress = true;
        this.broadsoftHoteling.setGuestAddress(true);
    }

    logoff() {
        if( !this.broadsoftHoteling.hoteling)
          throw 'not started';
        this.isLogoffInProgress = true;
        this.broadsoftFeature.setState('loggedOff');
    }

    setState(state, substate) {
        if( !this.broadsoftFeature.feature)
          throw 'not started';
        this.broadsoftFeature.setState(state, substate);
    }
}
