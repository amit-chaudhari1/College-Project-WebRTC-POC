import React, {Component} from 'react';
import './CallWindow.css';
import {Resizable} from "re-resizable";
import {IonPage, IonContent, IonToolbar, IonSpinner, IonButtons, IonButton, IonIcon, IonFooter} from "@ionic/react";
import {
    volumeMuteSharp,
    desktopSharp,
    personAdd,
    sadSharp,
    trashBinSharp,
    callSharp,
    closeCircleSharp
} from "ionicons/icons";

class CallWindow extends Component {
    myStreamWindow;
    otherStreamWindow;

    constructor(props) {
        super(props);
        this.otherStreamWindow = React.createRef();
        this.myStreamWindow = React.createRef();
        this.state = {
            isOpener: props.isOpener,
            isAnswered: false,
            initialState: {x: 300, y: 300},
            initialSize: {x: 300, y: 300},
            mouseMove: false,
            streamUsers: {},
            myStream: null,
            loading: true,
            audio: this.props.audio,
            video: this.props.video,
            screenShare: this.props.screenShare,
            targetUser: this.props.targetUser
        }
        this._isMounted = false;
    }

    gotCallAnswer = (bool) => {
        if (bool) {
            this.setState({
                isAnswered: true
            })
        }
    }

    placeDiv() {
        const d = document.getElementById('CallWindowID');
        d.style.position = "absolute";
        d.style.left = this.state.initialState.x + 'px';
        d.style.top = this.state.initialState.y + 'px';
    }

    componentDidMount() {
        this._isMounted = true;
        this._isMounted && this.handleMounting();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    createGetUserMedia = () => {
        let stream = null;
        if (!this.state.screenShare) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {width: 1280, height: 720}
            }).then((videoCallStream) => {
                /* use the stream */
                videoCallStream.getVideoTracks()[0].enabled = this.state.video;
                videoCallStream.getAudioTracks()[0].enabled = this.state.audio;
                console.log('the type of', typeof this.myStreamWindow.current);
                this.myStreamWindow.current.srcObject = videoCallStream;
                this.myStreamWindow.current.onloadedmetadata = () => {
                    this.myStreamWindow.current.play();
                };
                this.initiateCall(videoCallStream, this.state.targetUser)
                stream = videoCallStream;
                this._isMounted && this.setState({
                    myStream: stream
                })
            });
        } else {
            navigator.mediaDevices.getDisplayMedia({
                video: {width: 1280, height: 720}
            }).then((screenShareStream) => {
                console.log('the type of', typeof this.myStreamWindow.current);
                screenShareStream.getVideoTracks()[0].enabled = this.state.video;
                this.myStreamWindow.current.srcObject = screenShareStream;
                this.myStreamWindow.current.onloadedmetadata = () => {
                    this.myStreamWindow.current.play();
                };
                this.initiateCall(screenShareStream, this.state.targetUser)
                stream = screenShareStream;
                this._isMounted && this.setState({
                    myStream: stream
                })
            });
        }
    }
    handleMounting = () => {
        try {
            if (this.state.isOpener) {
                this.createGetUserMedia();
            }
        } catch (error) {
            /* handle the error */
            console.log('getUserMedia not supported', error)
        }
        this.placeDiv();
    }

    toggleAudio = () => {
        this.state.myStream.getAudioTracks()[0].enabled = !this.state.myStream.getAudioTracks()[0].enabled;
        this.setState(prevState => ({
            audio: !prevState.audio
        }))
    }
    toggleVideo = () => {
        this.state.myStream.getVideoTracks()[0].enabled = !this.state.myStream.getVideoTracks()[0].enabled;
        this.setState(prevState => ({
            video: !prevState.video
        }))
    }

    toggleStreamType = () => {
        let stream;
        if (this.state.screenShare) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {width: 1280, height: 720}
            }).then((videoCallStream) => {
                /* use the stream */
                videoCallStream.getVideoTracks()[0].enabled = this.state.video;
                videoCallStream.getAudioTracks()[0].enabled = this.state.audio;
                this.props.replaceTrack(this.state.targetUser, videoCallStream.getVideoTracks()[0])
                this.props.replaceTrack(this.state.targetUser, videoCallStream.getAudioTracks()[0])
                console.log('the type of', typeof this.myStreamWindow.current);
                this.myStreamWindow.current.srcObject = videoCallStream;
                this.myStreamWindow.current.onloadedmetadata = () => {
                    this.myStreamWindow.current.play();
                };
                stream = videoCallStream;
                this._isMounted && this.setState({
                    myStream: stream
                })
            });
        } else {
            navigator.mediaDevices.getDisplayMedia({
                video: {width: 1280, height: 720}
            }).then((screenShareStream) => {
                console.log('the type of', typeof this.myStreamWindow.current);
                this.myStreamWindow.current.srcObject = screenShareStream;
                this.props.replaceTrack(this.state.targetUser, screenShareStream.getVideoTracks()[0])
                this.myStreamWindow.current.onloadedmetadata = () => {
                    this.myStreamWindow.current.play();
                };
                stream = screenShareStream;
                this._isMounted && this.setState({
                    myStream: stream
                })
            });
        }
        this.setState(prevState => ({
            screenShare: !prevState.screenShare
        }))
    }

    initiateCall = (stream, user) => {
        if (!this.state.streamUsers[user]) {
            // send track
            this.props.addTrack(stream, user);
            this.setState({
                loading: true
            })
        }
    }
    gotTrack = (track) => {

        //handling new Track
        this.otherStreamWindow.current.srcObject = track;
        if (this.state.isAnswered) {
            this.otherStreamWindow.current.onloadedmetadata = () => {
                this.otherStreamWindow.current.play();
            };
        }

    }
    toggleMove = (didLeave = false) => {
        this.setState(prevState => ({
            mouseMove: didLeave === true ? false : !prevState.mouseMove
        }));

        const d = document.getElementById('call-content-ID');
        if (this.state.mouseMove === true) {
            d.style.cursor = 'grab';
        } else {
            d.style.cursor = 'grabbing';
        }
    };
    removeTracks = (user = '', initialize = false) => {
        this.setState({
            isOpener: false,
            isAnswered: false,
            loading: true
        });
        const audioTrack = this.state.myStream.getAudioTracks();
        if (audioTrack.length > 0) {
            this.state.myStream.removeTrack(audioTrack[0]);
        }
        const videoTrack = this.state.myStream.getVideoTracks();
        if (videoTrack.length > 0) {
            this.state.myStream.removeTrack(videoTrack[0]);
        }
        this.props.hangUpCall(user, initialize);
    }
    showCoordinates = (e) => {
        console.log(e.nativeEvent.clientX);
        console.log(e.nativeEvent.clientY);
        this.setState({
            initialState: {x: e.nativeEvent.clientX, y: e.nativeEvent.clientY},
        });

        if (this.state.mouseMove) {
            this.placeDiv();
        }
    };
    acceptCall = () => {

        this.createGetUserMedia();
        this.otherStreamWindow.current.play();
        this.setState({
            isOpener: true,
            isAnswered: true,
            loading: false
        })
        this.props.acceptedCall(this.state.targetUser, true);

    }

    render() {
        return (
            <Resizable size={{width: this.state.initialSize.x, height: this.state.initialSize.y}}
                       onResizeStop={(e, direction, ref, d) => {
                           this.setState({
                               initialSize: {
                                   x: this.state.initialSize.x + d.width,
                                   y: this.state.initialSize.y + d.height
                               }
                           });
                       }} className='CallWindow' id='CallWindowID'>
                <IonPage>
                    <IonContent className='call-content' id='call-content-ID' onClick={this.toggleMove}
                                onMouseMove={this.showCoordinates} onMouseLeave={() => {
                        this.toggleMove(true)
                    }}>
                        {this.state.isOpener ? <div className='otherStreamsContainer'>
                                {!this.state.isAnswered &&
                                <div className='loadingSpinnerContainer'><p className='loadingText'>Is waiting for
                                    answer</p><IonSpinner name="crescent" className='loadingSpinner'/></div>}
                            </div> :
                            <div className='CallOfferContainer'>
                                <IonButtons className='CallOfferButtons-wrapper'>
                                    <IonButton className='accept-btn' size="large" expands="block" fill="clear"
                                               color="primary" onClick={this.acceptCall}
                                               disabled={this.state.screenShare}>
                                        <IonIcon slot="icon-only" icon={callSharp}/>
                                    </IonButton>
                                    <IonButton className='decline-btn' size="large" expands="block" fill="clear"
                                               color="primary" onClick={() => {
                                        this.props.hangUpCall(this.state.targetUser, true)
                                    }}>
                                        <IonIcon slot="icon-only" icon={closeCircleSharp}/>
                                    </IonButton>
                                </IonButtons>
                            </div>
                        }
                        <video ref={this.otherStreamWindow} className='otherStream'/>
                        <div className='myStreamContainer'>
                            <video ref={this.myStreamWindow} className='myStream'/>
                        </div>
                    </IonContent>
                    <IonFooter className="footer-chat">
                        <IonToolbar color="light">
                            <IonButtons className='button-wrapper'>
                                <IonButton className='mute-btn' size="large" expands="block" fill="clear"
                                           color="primary" onClick={this.toggleAudio} disabled={this.state.screenShare}>
                                    <IonIcon slot="icon-only" icon={volumeMuteSharp}/>
                                </IonButton>
                                <IonButton className='desktop-btn' size="large" expands="block" fill="clear"
                                           color="primary" onClick={this.toggleStreamType}>
                                    <IonIcon slot="icon-only" icon={desktopSharp}/>
                                </IonButton>
                                <IonButton className='add-btn' size="large" expands="block" fill="clear" color="primary"
                                           onClick={this.addCallMember} disabled={true}>
                                    <IonIcon slot="icon-only" icon={personAdd}/>
                                </IonButton>
                                <IonButton className='face-btn' size="large" expands="block" fill="clear"
                                           color="primary" onClick={this.toggleVideo}>
                                    <IonIcon slot="icon-only" icon={sadSharp}/>
                                </IonButton>
                                <IonButton className='cancel-btn' size="large" expands="block" fill="clear"
                                           color="primary"
                                           onClick={() => this.removeTracks(this.state.targetUser, true)}>
                                    <IonIcon slot="icon-only" icon={trashBinSharp}/>
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonFooter>
                </IonPage>
            </Resizable>
        )
    }
}

export default CallWindow;