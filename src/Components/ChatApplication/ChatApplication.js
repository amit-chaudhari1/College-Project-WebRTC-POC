import React, {Component} from 'react';
import './ChatApplication.css'
import UserLayout from "../UserLayout/UserLayout";
import ChatLayout from "../ChatLayout/ChatLayout";
import {IonApp, IonPage} from "@ionic/react"
import CallWindow from "../CallWindow/CallWindow";
import LoginWindow from "../LoginWindow/LoginWindow";

class ChatApplication extends Component {

    constructor(props) {
        super(props);

        this.state = {
            users: props.users,
            showCallWindow: false,
            currentUser: '',
            didLogin: false,
            streams: [],
            newMsg: '',
            targetUser: '',
            audioCall: true,
            videoCall: true,
            screenShareCall: false,
            isOpener: false
        }

    }

    componentDidMount() {
        const MyName = document.getElementById("MyNameID");
        MyName.style.color = "black";
    }

    componentWillReceiveProps(nextProps) {
        this.setState({users: nextProps.users});
    }

    componentWillUnmount() {
        const MyName = document.getElementById("MyNameID");
        MyName.style.color = "white";
    }

    acceptCall = () => {
        this.setState({
            showCallWindow: true
        })
    }
    switchCallWindow = (audio = true, video = true, screenShare = false, opener = false) => {
        this.setState(prevState => ({
            showCallWindow: !prevState.showCallWindow,
            audioCall: audio,
            videoCall: video,
            screenShareCall: screenShare,
            isOpener: opener,
        }))
    };
    hangUpCall = (user = '', initialize = false) => {
        this.setState({
            showCallWindow: false,
            audioCall: true,
            videoCall: true,
            screenShareCall: false,
            isOpener: false
        })
        if (initialize) {
            this.props.sendMessage({
                type: 'hangUpCall'
            }, user)
        }
    }
    diLogin = (loginName = '') => {
        if (!this.state.didLogin) {
            this.props.activateWebRTC(loginName);
        }
        this.setState(
            prevState => ({
                didLogin: !prevState.didLogin,
                currentUser: loginName
            })
        )
    }
    changeTargetUser = (user) => {
        this.setState({
            targetUser: user
        })
    }

    render() {
        return (
            <IonApp>
                <IonPage>
                    <div className="chatApplication">
                        <div className="chatBox">
                            {this.state.didLogin ? <React.Fragment><UserLayout ref={this.props.setRefUsers}
                                                                               changeTargetUser={this.changeTargetUser}
                                                                               targetUser={this.state.targetUser}
                                                                               users={this.state.users}
                                                                               currentUser={this.state.currentUser}/><ChatLayout
                                    ref={this.props.setRefChat} targetUser={this.state.targetUser}
                                    switchCallWindow={this.switchCallWindow} currentUser={this.state.currentUser}
                                    callActivate={this.props.callActivate}
                                    callWindow={this.state.showCallWindow}
                                    sendMessage={this.props.sendMessage}/></React.Fragment> :
                                <LoginWindow diLogin={this.diLogin}/>
                            }
                        </div>
                    </div>
                </IonPage>
                {
                    this.state.showCallWindow &&
                    <CallWindow ref={this.props.setRefCallWindow} acceptedCall={this.props.acceptedCall}
                                replaceTrack={this.props.replaceTrack} audio={this.state.audioCall}
                                video={this.state.videoCall} screenShare={this.state.screenShareCall}
                                targetUser={this.state.targetUser} hangUpCall={this.hangUpCall}
                                stream={this.state.streams} isOpener={this.state.isOpener}
                                addTrack={this.props.addTrack}/>
                }
            </IonApp>

        );
    }
}

export default ChatApplication;

