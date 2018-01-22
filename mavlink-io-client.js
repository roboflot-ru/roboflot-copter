/*
    This scripts runs on board (Raspberry Pi + Navio 2)
    read UPD port and transmits mavlink messages to socket.io server.
    In order this script to work you need ardupilot and mavproxy running with UPD port configured.
    Check docs/INSTALL.md to configure ardupilot and mavproxy.

    First you need to install your server side scripts and get your ROBOT_ID from web-GCS.
    Then configure ROBOT_ID and SOCKET_IO_SERVER below with your credentials

 */


// Your robot id
const ROBOT_ID = '6c2039bf-b91b-4ebe-b06f-02abdb738963';
// Your socket.io server
const SOCKET_IO_SERVER = 'http://test.roboflot.io:3000';


// UDP port to read
const MAVLINK_UDP_HOST = '127.0.0.1';
const MAVLINK_UDP_PORT = 5763;

// Init UDP server
const dgram = require('dgram');
const udp_server = dgram.createSocket('udp4');

// Init socket.io client
const io = require('socket.io-client');

// Start UDP server
udp_server.bind(MAVLINK_UDP_PORT, MAVLINK_UDP_HOST);

// Show on console when UDP udp_server is ready
udp_server.on('listening', function () {
    const address = udp_server.address();
    console.log('UDP server listening on ' + address.address + ":" + address.port);
});



// Connecting to socket.io server
const socketio = io.connect(SOCKET_IO_SERVER + '?robot_id=' + ROBOT_ID);

// data cache to send to board
let transfer_data = null;

// On socket.io connection
socketio.on('connect', () => {
    console.log("Connected to socket.io server");

    // when data from socket.io server received
    socketio.on('fromserver', (data)=>{
        // it is going to be sent to autopilot next time local UDP receive message and responses to it
        transfer_data = data;
    });

    // when mavlink message comes to local UDP
    udp_server.on('message', function (message, remote) {

        // it is directly transmitted to socket.io server
        socketio.emit('fromboard', message);

        // if there is data to send to autopilot
        if( transfer_data ){
            // it is sent with response
            udp_server.send(transfer_data, 0, transfer_data.length, remote.port, remote.address, function(err){
                if( err ){
                    console.log(err);
                }
                else {
                    // if data is sent, this variable clears not to send it again
                    transfer_data = null;
                }

            });
        }

    });

});

// Log socket.io disconnection state and errors
socketio.on('disconnect', () => {
    console.log("Disconnected from socket.io server");
});
socketio.on('error', console.log);

