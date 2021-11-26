import React, {Component} from 'react';
import './UserLayout.scss';
import {IonContent, IonHeader, IonToolbar, IonPage, IonItem, IonAvatar, IonLabel, IonSearchbar, IonList} from "@ionic/react";

class UserLayout extends Component {
    currentUser = 'simon';

    items = [];
    users = [];
    constructor(props) {
        super(props);
        const usersRaw = [];
        for (let i = 0; i < this.props.users.length; i++){
            usersRaw.push({
                name: this.props.users[i],
                lastMessage: 'cool'
            })
        }
        this.state = {
            currentUser: props.currentUser,
            searchInput: '',
            users: this.sortUsers(usersRaw),
            bgColor: "primary",
            clickedColor: "secondary",
            targetUser: this.props.targetUser
        };
    }
    componentWillReceiveProps(nextProps) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        const usersRaw = [];
        for (let i = 0; i < nextProps.users.length; i++){
            usersRaw.push({
                name: nextProps.users[i],
                lastMessage: this.state.users[i]?this.state.users[i].lastMessage: ''
            })
        }
        this.setState({ users: this.sortUsers(usersRaw), targetUser: nextProps.targetUser });

    }

    componentDidMount() {
        this.items = Array.from(document.querySelector('ion-list').children);
    }
    sortUsers(array){
        return array.sort((a,b) => {
            if(a.name < b.name){
                return -1
            }
            if(a.name > b.name){
                return 1
            }
            return 0
        })
    }
    handleInput(input) {
        const searchInput = input.detail.value;
        const query = searchInput.toLowerCase();
        this.setState({   searchInput: input.detail.value});

        requestAnimationFrame(() => {
            this.items.forEach(item => {
                const shouldShow = item.textContent.toLowerCase().indexOf(query) > -1;
                item.style.display = shouldShow ? 'block' : 'none';
            });
        });
    }
    updateUsersMsg = (msg) => {
        let updatedUsersMsg = this.state.users;
        for (let i = 0; i < updatedUsersMsg.length; i++){
            if(updatedUsersMsg[i].name === msg.user){
                updatedUsersMsg[i].lastMessage = msg.text;
            }
        }
        this.setState({
            users: updatedUsersMsg
        })
    }
    render() {
        return (
            <IonPage className='userLayout page'>
                <IonHeader>
                    <IonToolbar color='tertiary'>
                        <IonSearchbar value={this.state.searchInput} onIonChange={(input) => this.handleInput(input)} inputmode="numeric"/>
                    </IonToolbar>
                </IonHeader>
                <IonContent color='primary'>
                    <IonList>
                        {this.state.users.map(user =>
                       user.name !== this.state.currentUser &&
                           <IonItem onClick={() =>{this.props.changeTargetUser(user.name)} } color={this.state.targetUser === user.name ? this.state.clickedColor : this.state.bgColor}>
                               <IonAvatar slot='start' className='avatar-user'>
                                <div className='first-digit-username'>{user.name.charAt(0)}</div>
                               </IonAvatar>
                               <IonLabel>
                                    <h2 className='ion-text-capitalize'>{user.name}</h2>
                                   <p>{user.lastMessage}</p>
                               </IonLabel>
                           </IonItem>
                       )
                        }
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }
}

export default UserLayout;