// Ключи для сервера телеметрии и видео из панели управления
const MAVPROXY_KEY = 'abcd1234';
const VIDEO_KEY = 'abcd1234';


// Mavproxy server
const MAV_IO_SERVER = 'http://mavproxy.roboflot.ru:3000';

// Local UDP port to read
const MAVLINK_UDP_HOST = '127.0.0.1';
const MAVLINK_UDP_PORT = 14550;

// Init UDP server
const dgram = require('dgram');
const udp_server = dgram.createSocket('udp4');

// Init socket.io client
const io = require('socket.io-client');


let mavlink_msg_counter = 0;
let io_active = false;


// Connecting to socket.io server
const socketio = io.connect(MAV_IO_SERVER + '?key=' + MAVPROXY_KEY);


// data cache to send back to board
let transfer_data = [];

// On socket.io connection
socketio.on('connect', () => {
    console.log("Connected to socket.io server");

    io_active = true;
});

// when data from socket.io server received
socketio.on('fromserver', (data) => {
    console.log('msg from server');

    transfer_data.push(data);
});

// Команды с сервера
socketio.on('command', (data) => {
    console.log('command ' + data);
});

// Log socket.io disconnection state and errors
socketio.on('disconnect', () => {
    console.log("Disconnected from socket.io server");

    io_active = false;
});

socketio.on('error', () => {
    console.log('socket.io error');

    io_active = false;
});

socketio.on('connect_error', () => {
    console.log('socket.io connect error');

    io_active = false;
});


// Start UDP server
udp_server.bind(MAVLINK_UDP_PORT, MAVLINK_UDP_HOST);

// Show on console when UDP udp_server is ready
udp_server.on('listening', function () {
    const address = udp_server.address();
    console.log('UDP server listening on ' + address.address + ":" + address.port);
});


udp_server.on('close', function () {
    console.log('UDP closed');
});

// when mavlink message comes to local UDP
udp_server.on('message', function (message, remote) {

    // it is directly transmitted to socket.io server
    if( io_active ){
        socketio.emit('fromboard', message);

        mavlink_msg_counter++;
    }


    // if there is data to send to autopilot

    let msg_to_board = transfer_data.shift();
    if( msg_to_board ){
        udp_server.send(msg_to_board, 0, msg_to_board.length, remote.port, remote.address, function(err){
            if( err ){
                console.log('UDP send error ' + err);
            }
        });
    }

});



// Logging counters to console
setInterval(function(){
    console.log(mavlink_msg_counter + ' mavlink msgs sent in last 60sec');
    mavlink_msg_counter = 0;
}, 60000);
