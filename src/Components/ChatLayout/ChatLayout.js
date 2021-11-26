import React,{Component} from 'react';
import './ChatLayout.scss';
import streamSaver from 'streamsaver'
import {IonHeader, IonToolbar, IonTitle, IonContent, IonGrid,IonRow, IonCol, IonFooter, IonButton, IonIcon, IonPage, IonButtons} from "@ionic/react";
import TextareaAutosize from 'react-autosize-textarea';
import {sendSharp, videocamSharp, callSharp, documentSharp, desktopSharp, folderSharp} from "ionicons/icons";


class ChatLayout extends Component  {
    ionContentRef = React.createRef();
    messages = {};
    receivedFiles= {};
    receivedFilesIndex= {};
    fileID= 0;
    constructor(props) {
        super(props);
        this.state = {
            currentChatTarget: this.props.targetUser,
            currentUser: props.currentUser,
            textInput: '',
            messages: {},
            callWindow: this.props.callWindow,
            sendingFile: false
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.targetUser.length > 0){
            if(!this.messages[nextProps.targetUser]){
                this.messages[nextProps.targetUser] = [];
            }
            this.setState({     currentChatTarget: nextProps.targetUser,
            callWindow: nextProps.callWindow});
        }

    }
    sayHello = () => {
        console.log('Hello from Chat Layout');
    }
    gotMessage = async (message ) => {
        console.log(message);
        console.log('got Message');
        if(!this.messages[message.user]){
            this.messages[message.user] = [];
        }
        if(message.fileData){
            if(!this.receivedFiles[message.fileID]){
                const msg = {
                    ...message
                }
                this.receivedFiles[message.fileID] = [];
                const progressBar = document.createElement('progress');
                progressBar.id = 'progress_'+message.user+'_'+message.fileID;
                progressBar.className = 'file_progress';
                progressBar.max = message.fileSize;
                progressBar.value = 0;
                msg.progressBar = progressBar;
                this.receivedFilesIndex[message.fileID] = this.messages[message.user].push(msg) - 1;
                this.setState({
                    sendingFile: true
                });
            }
            if(message.fileChunk){
                this.messages[message.user][this.receivedFilesIndex[message.fileID]].progressBar.value = message.offset;
                this.receivedFiles[message.fileID].push(this.str2ab(message.fileChunk.string,message.fileChunk.type));
            }
            if(message.lastData){
                const received = new Blob(this.receivedFiles[message.fileID]);
                console.log('The comparison array', this.receivedFiles[message.fileID]);
                this.messages[message.user][this.receivedFilesIndex[message.fileID]].lastData = true;
                this.messages[message.user][this.receivedFilesIndex[message.fileID]].fileChunk = URL.createObjectURL(received);
                    this.setState({
                        sendingFile: false
                    });
                    setTimeout(()=>{
                        this.ionContentRef.current.scrollToBottom(200).then( );
                    });
                    this.receivedFiles[message.fileID] = [];
                    delete this.receivedFiles[message.fileID];
                    delete this.receivedFilesIndex[message.fileID];
            }

        }else {
            const msg = {
                user: message.user,
                createdAt: message.createdAt,
                text: message.text,
            };
            this.messages[message.user].push(msg)
            if(this.state.currentChatTarget === message.user){
                this.forceUpdate();
                setTimeout(()=>{
                    this.ionContentRef.current.scrollToBottom(200).then( );
                });
            }
        }

    }
    sendMessage = () => {
        const msg = {
            user: this.state.currentUser,
            createdAt: new Date().toDateString(),
            text: this.state.textInput,
            fileData: false
        };
        this.props.sendMessage(msg, this.state.currentChatTarget);
        this.messages[this.state.currentChatTarget].push(msg);
        this.setState({
            textInput: ''
        });
        setTimeout(()=>{
            this.ionContentRef.current.scrollToBottom(200).then( );
        });

    };
    sendFile = (files) => {
        if(!files){
            return;
        }
            console.log('sending Document')
            console.log('the files',files)
            const file = files[0];
        if(file === undefined){
            return;
        }
            const fileTarget = this.state.currentChatTarget;
            if (file.size === 0) {
                console.log('File is empty, please select a non-empty file');
                return;
            }
            const compareArray = [];
            const progressBar = document.createElement('progress');
            progressBar.id = 'progress_'+this.state.currentUser+'_'+this.fileID;
            progressBar.className = 'file_progress';
            progressBar.max = file.size;
            progressBar.value = 0;
            const msg = {
                user: this.state.currentUser,
                createdAt: new Date().toDateString(),
                fileData: true,
                fileID: this.state.currentUser+'_'+this.fileID,
                fileChunk: null,
                progressBar,
                lastData: false,
                fileName: file.name,
                fileSize: file.size,
                isImage: true,
                offset: 0,
                chunkID: 0
            };
            const messageIndex = this.messages[fileTarget].push(msg) - 1;

            this.setState({
                sendingFile: true
            });
            setTimeout(()=>{
                this.ionContentRef.current.scrollToBottom(200).then( );
            });
            this.fileID++;
            const chunkSize = 16384;
            const fileReader = new FileReader();
            let offset = 0;
            fileReader.addEventListener('error', error => console.error('Error reading file:', error));
            fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
            fileReader.addEventListener('load', e => {
            console.log('FileRead.onload ', e);
            offset += e.target.result.byteLength;
            progressBar.value = offset;
                msg.fileChunk = this.ab2str(e.target.result);
                compareArray.push(this.str2ab(msg.fileChunk.string,msg.fileChunk.type));
                msg.offset = offset;
            if (offset < file.size ) {
                this.props.sendMessage(msg, fileTarget);
                readSlice(offset);
            }else {
                msg.lastData = true;
                this.props.sendMessage(msg, fileTarget);
                this.messages[fileTarget][messageIndex].fileChunk =  URL.createObjectURL(file);
                this.messages[fileTarget][messageIndex].lastData = true;
                this.setState({
                    sendingFile: false
                });
                console.log('The comparison array', compareArray);
            }
                msg.chunkID++;
            });
            const readSlice = o => {
            console.log('readSlice ', o);
            const slice = file.slice(offset, o + chunkSize);
            fileReader.readAsArrayBuffer(slice);
            };
            readSlice(0);

    };
    download = (dataUrl, filename) => {
        this.downloadFile(dataUrl, filename).then(()=>{
            console.log('has downloaded File')
        })
    }
    downloadFile = (url, fileName) => {
        return fetch(url).then(res => {
            const fileStream = streamSaver.createWriteStream(fileName);
            const writer = fileStream.getWriter();
            if (res.body.pipeTo) {
                writer.releaseLock();
                return res.body.pipeTo(fileStream);
            }

            const reader = res.body.getReader();
            const pump = () =>
                reader
                    .read()
                    .then(({ value, done }) => (done ? writer.close() : writer.write(value).then(pump)));

            return pump();
        });
    };
    ab2str = (buf) => {
        try {
            return {string: String.fromCharCode.apply(null, new Uint16Array(buf)), type: 'Uint16'};
        }catch (e) {
            return {string: String.fromCharCode.apply(null, new Uint8Array(buf)), type: 'Uint8'};
        }

    }
    str2ab = (str, type) => {
        if(type === 'Uint16'){
            let buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
            let bufView = new Uint16Array(buf);
            for (let i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }else {
            let buf = new ArrayBuffer(str.length ); // 2 bytes for each char
            let bufView = new Uint8Array(buf);
            for (let i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }

    }
    render() {
        return (
            <IonPage className="chatLayout">
                <IonHeader>
                    <IonToolbar color="secondary">
                        <IonTitle>
                            Chat with {this.state.currentChatTarget}
                        </IonTitle>
                        <IonButtons slot="secondary" >
                            <IonButton className="screenShare-btn" onClick = {() => {this.props.switchCallWindow(true,true,true,true)}} disabled={this.state.currentChatTarget === '' || this.state.callWindow}>
                                <IonIcon slot="icon-only" icon={desktopSharp}/>
                            </IonButton>
                            <IonButton className="call-btn" onClick={() => {
                                this.props.switchCallWindow(true,false,false,true)
                            }} disabled={this.state.currentChatTarget === '' || this.state.callWindow}>
                                <IonIcon slot="icon-only" icon={callSharp}/>
                            </IonButton>
                            <IonButton className="videoCall-btn" onClick={() => {
                                this.props.switchCallWindow(true,true,false,true)
                            }} disabled={this.state.currentChatTarget === '' || this.state.callWindow}>
                                <IonIcon slot="icon-only" icon={videocamSharp}/>
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent ref={this.ionContentRef}>
                    <IonGrid>
                        {this.messages[this.state.currentChatTarget] ? this.messages[this.state.currentChatTarget].map(message =>
                            <IonRow>
                                {this.state.currentUser === message.user ?
                                    <IonCol size="9" className="message other-message">
                                        <b>{message.user}</b><br/>
                                        <span>{message.fileData && !message.lastData ? <div className='image_container' ref={ref => ref && ref.appendChild(message.progressBar)}/> : message.fileData ? message.isImage ?
                                            <img onClick={() =>this.download(message.fileChunk, message.fileName)} src={message.fileChunk} alt={"Image with fileID " + message.fileID}
                                                 onError={() => {
                                                     message.isImage = false;
                                                     this.forceUpdate()
                                                 }}/> :
                                            <IonButton onClick={() =>this.download(message.fileChunk, message.fileName)} size="large" expands="block"><IonIcon slot="icon-only" icon={folderSharp}/></IonButton> : message.text} </span>
                                        <div className="time"><br/>
                                            <div className="timeObject">
                                                {message.createdAt}
                                            </div>
                                        </div>
                                    </IonCol> :
                                    <IonCol offset="3" size="9" className="message my-message" color="tertiary">
                                        <b>{message.user}</b><br/>
                                        <span>{message.fileData && !message.lastData ? <div className='image_container' ref={ref => ref && ref.appendChild(message.progressBar)}/> : message.fileData ? message.isImage ?
                                            <img onClick={() =>this.download(message.fileChunk, message.fileName)} src={message.fileChunk} alt={"Image with fileID " + message.fileID}
                                                 onError={() => {
                                                     message.isImage = false;
                                                     this.forceUpdate()
                                                 }}/> :
                                            <IonButton onClick={() =>this.download(message.fileChunk, message.fileName)} size="large" expands="block"><IonIcon slot="icon-only" icon={folderSharp}/></IonButton> : message.text} </span>
                                        <div className="time"><br/>
                                            <div className="timeObject">
                                                {message.createdAt}
                                            </div>
                                        </div>
                                    </IonCol>}
                            </IonRow>) : <div/>}
                    </IonGrid>
                </IonContent>
                <IonFooter className="footer-chat">
                    <IonToolbar color="light">
                        <IonRow>
                            <IonCol size="10">
                                <TextareaAutosize onChange={(input) => this.setState({textInput: input.target.value})}
                                                  value={this.state.textInput} rows={3} maxRows={6}
                                                  className="message-input"/>
                            </IonCol>
                            <IonCol size="2">
                                <IonButtons className='button-wrapper'>
                                    <IonButton className='document-btn' size="large" expands="block" fill="clear"
                                               color="primary" onClick={() => {
                                        !this.state.sendingFile ? document.querySelector('input#files').click() : console.log('a file is currently sending')
                                    }} disabled={this.state.currentChatTarget === ''}>
                                        <IonIcon slot="icon-only" icon={documentSharp}/>
                                    </IonButton>
                                    <input type="file" id="files" name="files[]" onChange={(e) => {
                                        this.sendFile(e.target.files)
                                    }}/>
                                    <IonButton className='message-btn' size="large" expands="block" fill="clear"
                                               color="primary" onClick={this.sendMessage}
                                               disabled={this.state.textInput === '' || this.state.currentChatTarget === ''}>
                                        <IonIcon slot="icon-only" icon={sendSharp}/>
                                    </IonButton>
                                </IonButtons>
                            </IonCol>
                        </IonRow>
                    </IonToolbar>
                </IonFooter>
            </IonPage>
        );
    }
}

export default ChatLayout;