import React, {Component} from 'react';
import './LoginWindow.scss';
import {
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonPage,
    IonRow,
    IonTitle
} from "@ionic/react";
import TextareaAutosize from "react-autosize-textarea";
import {sendSharp} from "ionicons/icons";

class LoginWindow extends Component {

    constructor(props) {
        super(props);
        this.state = {
            myNameInput: ''
        }
    }

    render() {
        return (
            <IonPage className='loginWindow page'>
                <IonContent color='primary'>
                    <IonPage className='loginForm'>
                        <IonRow className='rowTitleLogin'>
                            <IonTitle className='titleLogin'>Login Chat </IonTitle>
                        </IonRow>
                        <IonRow>
                            <IonAvatar className='myAvatar'>
                                <div className='first-digit-username'>{this.state.myNameInput.charAt(0)}</div>
                            </IonAvatar>
                        </IonRow>
                        <IonRow>
                            <TextareaAutosize className='myNameChanger'
                                              onChange={(input) => this.setState({myNameInput: input.target.value})}
                                              value={this.state.textInput} rows={1} maxRows={1}/>
                        </IonRow>
                        <IonRow>
                            <IonButton className='loginButton' size="large" expands="block" fill="clear"
                                       color="secondary" onClick={() => this.props.diLogin(this.state.myNameInput)}
                                       disabled={this.state.myNameInput === ''}>
                                <IonIcon className='loginIcon' slot="icon-only" icon={sendSharp}/>
                            </IonButton>
                        </IonRow>

                    </IonPage>
                </IonContent>
            </IonPage>
        );
    }
}

export default LoginWindow;