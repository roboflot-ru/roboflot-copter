/**
 * Created by nee on 08.01.2018.
 */

// Socket.io сервер
const SOCKET_IO_SERVER = 'http://hub.roboflot.ru:3000';

// название ноды
const NODENAME = "roboweb";
// параметры ноды
const OPTIONS = { onTheFly : true };
/*
rosMasterUri
Specify the ROS Master address programmatically rather than through the ROS_MASTER_URI environment variable.

onTheFly
Automatically generate messages to use rather than using the pre-generated messages.
Will fall back to pre-generated messages if available.

logging
An object providing logging specific overrides. See logging for more information.

node
An object providing specific overrides to the ROS node itself. See Node for more information.


rosnodejs.on('shutdown', function() {  });

http://wiki.ros.org/mavros

 */

// используемые пакеты
const io = require('socket.io-client');
const mavlink = require('mavlink');
const rosnodejs = require('rosnodejs');

// MAVLink Parser (ROSMAV - MAV)
//const MAVParser = new mavlink();

//let publisher; // инициализация паблишера позже в rosnode

let socket_io_status = 0;



while(1){}