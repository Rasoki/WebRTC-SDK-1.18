/**
 * Wrapper of Citrix API used in the project
 * 
 * Usage:
 * - citrix_jssip.js (modified jssip with Citrix API)
 * - phone.js 
 */

// Notify Citrix API that redirector is used.
window.getCitrixWebrtcRedir = () => Promise.resolve("1");

// Citrix API can be used after vdiClientConnected event.
window.CitrixVdiConnected = new Promise((resolve, reject) => {
    window.VMEventCallback = (e) => {
        console.log(`AC:CitrixVdi: >>>VMEventCallback: ${JSON.stringify(e)}`);
        if (e.event === 'vdiClientConnected') {
            resolve()
        } else {
            reject();
        }
    }
});

// Wrapper with used in the example Citrix functions.
window.CitrixVdi = {
    microphoneId: null,
    speakerId: null,

    getUserMedia: function (constraints) {
        // Add constraints.audio.deviceId if missed
        if (!constraints)
            constraints = {};
        if (!constraints.audio)
            constraints.audio = {};
        if (!constraints.audio.deviceId)
            constraints.audio.deviceId = CitrixVdi.microphoneId;

        return new Promise((resolve, reject) => {
            console.log(`AC:CitrixVdi: getUserMedia ${JSON.stringify(constraints)}`);
            window.CitrixWebRTC.getUserMedia(constraints,
                (s) => {
                    resolve(s.clone());
                },
                (e) => {
                    console.log(`AC: CitrixVdi getUserMedia error`, e);
                    reject(e);
                });
        })
    },

    createPeerConnection: function (pcConfig) {
        pcConfig.enableDtlsSrtp = true;
        pcConfig.sdpSemantics = 'unified';
        console.log(`AC:CitrixVdi: createPeerConnection ${JSON.stringify(pcConfig)}`);
        let conn = new CitrixWebRTC.CitrixPeerConnection(pcConfig);
        CitrixVdi.setEvents(conn);
        return conn;
    },

    createOffer: function (connection, originalConstraints) {
        console.log(`AC:CitrixVdi: createOffer`);
        return connection.createOffer(
            {
                offerToReceiveAudio: true
            }
        );
    },

    createAnswer: function (connection, originalConstraints) {
        console.log(`AC:CitrixVdi: createAnswer`);
        return connection.createAnswer();
    },

    mapAudioElement: function (remoteAudio) {
        console.log(`AC:CitrixVdi: mapAudioElement and set sinkId`);
        CitrixWebRTC.mapAudioElement(remoteAudio);
        remoteAudio.sinkId = CitrixVdi.speakerId;
    },

    enumerateDevices(){
        return CitrixWebRTC.enumerateDevices;
    },

    setEvents: function (conn) {
        // Set event listeners
        conn.AcEvents = {
            oniceconnectionstatechange: undefined,
            onicecandidate: undefined,
            onicegatheringstatechange: undefined,
            ontrack: undefined,
            onsignalingstatechange: undefined
        };

        CitrixVdi.setEventListener(conn, 'oniceconnectionstatechange');
        CitrixVdi.setEventListener(conn, 'onicecandidate');
        CitrixVdi.setEventListener(conn, 'onicegatheringstatechange');
        CitrixVdi.setEventListener(conn, 'ontrack');
        CitrixVdi.setEventListener(conn, 'onsignalingstatechange');

        // Define missed addEventListener, removeEventListener
        conn.addEventListener = (name, func) => {
            // console.log(`AC:Event addEventListener ${name}`);
            conn.AcEvents[`on${name}`] = func;
        }
        conn.removeEventListener = (name) => {
            // console.log(`AC:Event removeEventListener ${name}`);
            conn.AcEvents[`on${name}`] = undefined;
        }
    },

    setEventListener: function (conn, name) {
        conn[name] = (ev) => {
            let fn = conn.AcEvents[name];
            if (fn) {
                // console.log(`AC:Event fire "${name}"`);
                fn(ev);
            } else {
                // console.log(`AC:Event fire "${name}" [IGNORED - callback not set]`);
            }
        }
    }
}