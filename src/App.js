import React, {Component} from 'react';
import '@ionic/react/css/core.css';
import WebRTCChatAppContainer from "./Components/WebRTCChatAppContainer";
import './App.css';

class App extends Component {
    render() {
        return (
            <div className="App">
                <div className="MyName" id="MyNameID"><h1>Finn Bossen</h1></div>

                <WebRTCChatAppContainer/>

            </div>
        );
    }
}
export default App;
