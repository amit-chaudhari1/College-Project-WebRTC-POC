//require our websocket library
var WebSocketServer = require('ws').Server;

//creating a websocket server at port 9090
var wss = new WebSocketServer({port: 9090});

//all connected to the server users
var users = {};
//when a user connects to our sever
wss.on('connection', function (connection) {

    console.log('User connected');

    //when server gets a message from a connected user
    connection.on('message', function (message) {

        var data;
        //accepting only JSON messages
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log('Invalid JSON');
            data = {};
        }

        //switching type of the user message
        switch (data.type) {
            //when a user tries to login

            case 'login':
                console.log('User logged' + data.name);

                //if anyone is logged in with this username then refuse
                if (users[data.name]) {
                    sendTo(connection, {
                        type: 'login',
                        success: false,
                        name: data.name
                    });
                } else {
                    sendTo(connection, {
                        type: 'login',
                        success: true,
                        users: users
                    });
                    sendToAll({
                        type: 'addUser',
                        name: data.name
                    })
                    users[data.name] = connection;
                    connection.name = data.name;
                }

                break;

            case 'description':
                console.log('Sending offer to: ', data.name);

                var conn = users[data.name];

                if (conn != null) {
                    connection.otherName = data.name;

                    sendTo(conn, {
                        type: 'description',
                        description: data.description,
                        name: connection.name,
                        polite: data.polite
                    });
                }

                break;

            case 'answer':
                console.log('Sending answer to: ', data.name);
                var conn = users[data.name];

                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: 'answer',
                        answer: data.answer,
                        name: connection.name
                    });
                }

                break;

            case 'candidate':
                console.log('Sending candidate to:', data.name);
                var conn = users[data.name];

                if (conn != null) {
                    sendTo(conn, {
                        type: 'candidate',
                        candidate: data.candidate,
                        companion: data.companion
                    });
                }

                break;

            case 'leave':
                console.log('Disconnecting from', data.name);
                var conn = users[data.name];
                if (conn.otherName) {
                    conn.otherName = null;
                }
                if (users[data.name]) {
                    delete users[data.name]
                }

                //notify the other user so he can disconnect his peer connection
                if (conn) {
                    sendTo(conn, {
                        type: 'leave',
                        name: data.name
                    });
                }

                break;

            default:
                sendTo(connection, {
                    type: 'error',
                    message: 'Command not found: ' + data.type
                });

                break;
        }
    });

    //when user exits (closes Browser)
    connection.on('close', function () {

        if (connection.name) {
            if (users[connection.name]) {
                delete users[connection.name]
            }
            sendToAll({
                name: connection.name,
                type: 'leave'
            })
        }
    });

    connection.send('Hello world');

});

function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}

function sendToAll(message) {
    for (let user in users) {
        if (users.hasOwnProperty(user)) {
            sendTo(users[user], message);
        }
    }

}