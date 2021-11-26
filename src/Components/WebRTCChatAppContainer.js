import React, {Component} from 'react';
import './WebRTCChatAppContainer.scss'
import ChatApplication from "./ChatApplication/ChatApplication";


class WebRTCChatAppContainer extends Component {

    peerConnections = {};
    dataChannels = {};
    dataSendQueue = {};
    callTarget = null;
    currentCall = null;
    configuration = {
        'iceServers': [
            {
                'urls': 'stun:stun2.1.google.com:19302'
            },
            {
                'urls': 'turn:numb.viagenie.ca',
                'credential': 'muazkh',
                'username': 'webrtc@live.com'
            },
            {
                'urls': 'turn:192.158.29.39:3478?transport=udp',
                'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                'username': '28224511:1379330808'
            },
            {
                'urls': 'turn:192.158.29.39:3478?transport=udp',
                'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                'username': '28224511:1379330808'
            }
        ]
    }

    constructor(props) {
        super(props);
        this.state = {
            currentUser: '',
            users: []
        }

    }

    activateWebRTC = (currentUser = 'simon') => {
        console.log('henlooo ' + currentUser);
        let makingOffer = false;
        let ignoreOffer = false;
        let descriptionQueue = [];
        this.setState({
            currentUser: currentUser
        })
        const conn = new WebSocket('ws://localhost:9090');
        conn.onopen = () => {
            console.log("Connected to the signaling server");
            if (currentUser.length > 0) {
                conn.send(JSON.stringify({
                    type: "login",
                    name: currentUser
                }));
            }
        };
        conn.onmessage = (msg) => {
            console.log("Got message", msg.data);
            try {
                const data = JSON.parse(msg.data);
                switch (data.type) {
                    case "login":
                        handleLogin(data.success, data.users);
                        break;
                    case "description":
                        handleDescription(data.description, data.name).then();
                        break;
                    case "answer":
                        handleAnswer(data.answer, data.name);
                        break;
                    //when a remote peer sends an ice candidate to us
                    case "candidate":
                        handleCandidate(data.candidate, data.companion);
                        break;
                    case "leave":
                        this.handleLeave(data.name);
                        break;
                    case "addUser":
                        addUser(data.name);
                        break;
                    default:
                        break;
                }
            } catch (e) {
                console.log('Error',e)
            }

        };
        conn.onerror = function (err) {
            console.log("Got error", err);
        };

        const addUser = (user) => {
            if (user !== this.state.currentUser) {
                this.updateStateUsers(user)
                if (!this.peerConnections[user]) {
                    this.peerConnections[user] = new RTCPeerConnection(this.configuration);
                    initiateEventHandler(user, this.peerConnections[user], true)
                }
            } else {
                console.log('can not establish connection to yourself')
            }

        }
        const send = (message, target) => {
            //attach the other peer username to our messages
            if (this.state.currentUser !== target) {
                message.name = target;
                conn.send(JSON.stringify(message));
            } else {
                console.log('can not send to yourself')
            }
        };
        const handleLogin = (success, users) => {
            if (success === false) {
                alert('User is given');
                this.RefChatApplications.diLogin();
                conn.close();
            } else {
                // establishes all previous users
                let usersToAdd = [];
                for (let user in users) {
                    if (users.hasOwnProperty(user)) {
                        usersToAdd.push(user);
                    }
                }
                if (usersToAdd.length > 0) {
                    this.updateStateUsers(usersToAdd)
                }

                console.log('login successful');
            }
        }
        const handleDescription = async (description, user) => {
            if (!this.peerConnections[user]) {
                this.peerConnections[user] = new RTCPeerConnection(this.configuration);
                initiateEventHandler(user, this.peerConnections[user], false)
            }
            const pc = this.peerConnections[user];
            if (description) {
                if (description.type === 'answer') {
                    await pc.setRemoteDescription(description);
                }
                if (description.type === "offer") {
                    await pc.setRemoteDescription(description);
                    const answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer);
                    send({
                        type: "description",
                        description: pc.localDescription,
                        polite: true
                    }, user);
                }
            }
        }
        const handleAnswer = (answer, name) => {
            this.peerConnections[name].setRemoteDescription(answer).then();
        };
        const handleCandidate = (candidate, companion) => {

            console.log('adds candidate');
            console.log('the candidate')
            console.log(candidate);
            console.log(this.peerConnections[companion]);
            var sd = this.peerConnections[companion].currentRemoteDescription;
            console.log("Local session: type='" +
                sd.type + "'; sdp description='" +
                sd.sdp + "'");
            try {
                if (sd && this.peerConnections[companion] !== "stable") {
                    if (descriptionQueue.length > 0) {
                        for (let i = 0; i < descriptionQueue.length; i++) {
                            this.peerConnections[companion].addIceCandidate(descriptionQueue[i]).then();
                        }
                        descriptionQueue = [];
                    }
                    this.peerConnections[companion].addIceCandidate(candidate).then();

                } else {
                    descriptionQueue.push(candidate);
                    console.log("No local session yet.");
                }
            } catch (error) {
                console.log(error)
            }

        };

        const initiateEventHandler = (user, peerConnection) => {

            peerConnection.onnegotiationneeded = async () => {
                try {
                    makingOffer = true;
                    const offer = await peerConnection.createOffer()
                    if (peerConnection.signalingState !== "stable") return;
                    await peerConnection.setLocalDescription(offer);
                    send({
                        type: "description",
                        description: peerConnection.localDescription,
                    }, user);
                } catch (err) {
                    console.error(err);
                } finally {
                    makingOffer = false;
                }
            };
            peerConnection.ontrack = (event) => {
                this.gotTrack(event).then();
            }
            peerConnection.onconnectionstatechange = () => {
                switch (peerConnection.connectionState) {
                    case "connected":
                        // The connection has become fully connected
                        console.log('peerConnection is connected')
                        break;
                    case "disconnected":
                        console.log('peerConnection is disconnected')
                        break;
                    case "failed":
                        // One or more transports has terminated unexpectedly or in an error
                        console.log('error in peerConnection')
                        break;
                    case "closed":
                        console.log('peerConnection is closed')
                        break;
                    default:
                        break;
                }
            }
            peerConnection.onicecandidate = ({candidate}) => {
                if (candidate) {
                    console.log('sending candidate')
                    console.log(candidate)
                    console.log('sends candidate');
                    send({
                        type: 'candidate',
                        candidate: candidate,
                        companion: this.state.currentUser
                    }, user);
                }

            };
            this.createDataChannel(user);
        }

    }
    createDataChannel = (target) => {
        this.peerConnections[target].ondatachannel = this.handleChannelCallback;
        const dataChannel = this.peerConnections[target].createDataChannel('channel_' + target, {
            ordered: true
        });
        this.dataChannels[target] = dataChannel;
        dataChannel.onmessage = this.handleDataChannelMessageReceived;
        dataChannel.onerror = this.handleDataChannelError;
        dataChannel.onclose = this.handleDataChannelClose;

    }
    handleDataChannelOpen = (event) => {
        console.log(event.target.label, ' open');
    };

    handleDataChannelMessageReceived = (event) => {
        console.log('received message from channel ' + event.target.label);
        console.log('message data', event);
        const data = JSON.parse(event.data);
        console.log('parsed stuff', data);
        if (!data.type) {
            this.gotMessage(data);
        } else {
            if (data.type === 'callOffer') {
                this.callTarget = data.user
            } else if (data.type === 'hangUpCall') {
                this.RefCallWindow.removeTracks();
            } else if (data.type === 'acceptedCall') {
                this.RefCallWindow.gotCallAnswer(data.bool);
            } else if (data.type === 'difference') {
                this.sendRemainingErrors(data.errors, data.target);
            }
        }
    };

    handleDataChannelError = (error) => {
        console.log('channel error', error);
    };

    handleDataChannelClose = (event) => {
        console.log(event.target.label, ' closed');
    };

    handleChannelCallback = (event) => {
        const dataChannel = event.channel;
        dataChannel.onopen = this.handleDataChannelOpen;
        dataChannel.onmessage = this.handleDataChannelMessageReceived;
        dataChannel.onerror = this.handleDataChannelError;
        dataChannel.onclose = this.handleDataChannelClose;
    };
    replaceTrack = (user, track) => {
        const sender = this.peerConnections[user].getSenders().find((s) => {
            return s.track.kind === track.kind;
        });
        console.log('found sender:', sender);
        sender.replaceTrack(track).then(() => {
            console.log('successfully replaced track');
        });
    }

    ArrayIDsSend = []
    sendRemainingErrors = (array, target) => {
        for (let i = 0; i < array.length; i++) {
            for (let a = array[i].first; a < array[i].last; a++) {
                this.dataChannels[target].send(this.ArrayIDsSend[a]);
            }
        }
    }
    sendMessage = (msg, target) => {
        console.log('sends message', msg);
        console.log('to', target);
        msg.user = this.state.currentUser;
        this.ArrayIDsSend.push(msg);
        if (this.dataChannels[target].readyState === 'open') {
            if (this.dataSendQueue[target]) {
                if (this.dataSendQueue[target].length > 0) {
                    for (let i = 0; i < this.dataSendQueue[target].length; i++) {
                        console.log('the ChunkID now' + msg.chunkID + 'and before' + this.dataSendQueue[target][i]);
                        this.dataChannels[target].send(JSON.stringify(this.dataSendQueue[target][i]));
                    }
                    this.dataSendQueue[target] = [];
                }
            }
            this.dataChannels[target].send(JSON.stringify(msg));
            if (msg.lastData) {
                console.log('all Msg IDs send', this.ArrayIDsSend)
            }
        } else {
            if (!this.dataSendQueue[target]) {
                this.dataSendQueue[target] = [];
            }
            this.dataSendQueue[target].push(msg.chunkID);
            this.createDataChannel(target)
        }
    }
    str2ab = (str, type) => {
        if (type === 'Uint16') {
            let buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
            let bufView = new Uint16Array(buf);
            for (let i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        } else {
            let buf = new ArrayBuffer(str.length); // 2 bytes for each char
            let bufView = new Uint8Array(buf);
            for (let i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }

    }
    handleMsgQueue = async (target) => {
        if (this.dataSendQueue[target].length > 0) {
            for (let i = 0; i < this.dataSendQueue[target].length; i++) {
                this.dataChannels[target].send(this.dataSendQueue[target][i]);
            }
            this.dataSendQueue[target] = [];
        } else {
            console.log('dataSendQueue is empty nothing to send')
        }
    }
    waitForStateChange = async (target) => {
        if (this.dataChannels[target].readyState === 'open') {
            this.handleMsgQueue(target)
        } else {
            setTimeout(() => {

            }, 5000);
            this.waitForStateChange(target)
        }

    }
    gotTrack = async (track) => {
        if (this.callTarget) {
            await this.RefChatApplications.changeTargetUser(this.callTarget);
            this.currentCall = this.callTarget;
            this.callTarget = null;
        }
        await this.RefChatApplications.acceptCall();
        this.RefCallWindow.gotTrack(track.streams[0]);

    }
    acceptedCall = (user, bool) => {
        this.sendMessage({type: 'acceptedCall', bool}, user)
    }
    addtrack = (stream, user) => {
        this.sendMessage({type: 'callOffer'}, user)
        for (const track of stream.getTracks()) {
            this.peerConnections[user].addTrack(track, stream);
        }
    }
    ArrayIDs = [];
    inconsistencyMatchUp = 0;
    allInconsistencies = 0;
    ArrayError = [];

    onlySeconds = (array) => {
        const everySecond = [];
        for (let i = 0; i < array.length; i = i + 2) {
            everySecond.push(array[i]);
        }
        return everySecond;
    }
    gotMessage = (message) => {
        this.ArrayIDs.push(message.chunkID)
        if (this.ArrayIDs.length - 1 !== message.chunkID - this.inconsistencyMatchUp) {
            this.inconsistencyMatchUp = this.ArrayIDs.length - 1;
            this.inconsistencyMatchUp = message.chunkID - this.inconsistencyMatchUp;
            this.ArrayError.push({
                first: this.ArrayIDs.length - 1,
                last: message.chunkID
            })
            this.allInconsistencies = this.allInconsistencies + this.inconsistencyMatchUp;
            console.log('there is an inconisty with the chunks the ChunkID is: ' + message.chunkID + 'and here the array', this.ArrayIDs)
        }
        if (message.lastData) {
            console.log('all incosisistys', this.ArrayError)
            console.log('the difference', this.allInconsistencies)
            console.log('all Msg IDs send', this.ArrayIDs)
        }
        console.log('all Msg IDs send', this.ArrayIDs)
        this.RefChat.gotMessage({
            ...message
        });
        this.RefUsers.updateUsersMsg({
            user: message.user,
            text: message.text
        });
    }
    updateStateUsers = (usersToAdd) => {
        this.setState(state => {
            if (usersToAdd instanceof Array) {
                const users = [...state.users, ...usersToAdd];
                return {
                    users,
                };
            } else {
                const users = [...state.users, usersToAdd];
                return {
                    users,
                };
            }
        });
    }
    handleLeave = (user) => {
        if (this.RefCallWindow) {
            if (this.currentCall === user) {
                this.RefCallWindow.removeTracks();
            }
        }
        this.peerConnections[user].close();
        this.peerConnections[user].onicecandidate = null;
        delete this.peerConnections[user];
        let rawUsers = this.state.users;
        rawUsers.splice(rawUsers.indexOf(user), 1)
        // removes the User from array
        this.setState({
            users: rawUsers
        })
    }
    setRefChat = (input) => {
        console.log('input of ref', input)
        this.RefChat = input;
        try {
            input.sayHello();
        } catch (e) {

        }

    }
    setRefUsers = (input) => {
        this.RefUsers = input;
    }
    setRefCallWindow = (input) => {
        this.RefCallWindow = input;
    }
    setRefChatApplication = (input) => {
        this.RefChatApplications = input;
    }


    render() {
        return (
            <React.Fragment>
                <ChatApplication ref={this.setRefChatApplication} users={this.state.users}
                                 sendMessage={this.sendMessage} activateWebRTC={this.activateWebRTC}
                                 setRefUsers={this.setRefUsers}
                                 setRefChat={this.setRefChat} setRefCallWindow={this.setRefCallWindow}
                                 addTrack={this.addtrack} replaceTrack={this.replaceTrack}
                                 acceptedCall={this.acceptedCall}/>
            </React.Fragment>

        );
    }
}

export default WebRTCChatAppContainer;