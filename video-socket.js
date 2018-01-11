/**
 * Created by nee on 11.01.2018.
 */

const ROBOT_ID = '6c2039bf-b71b-4ebe-b06f-02abdb738963';

const srcHost = "127.0.0.1";
const srcPort = 5001;
const srcBoundary = "--videoboundary";

const SOCKET_IO_SERVER = "http://hub.roboflot.ru:3000";

const Net = require('net');
const Dicer = require('dicer');
const io = require('socket.io-client');



const tcp_socket = Net.Socket();

const socketio = io.connect(SOCKET_IO_SERVER + '?robot_id=' + ROBOT_ID);

socketio.on('connect', function () {
    console.log("Connected to SOCKET.IO SERVER ");

    //socketio.emit('image', 'test');
});

socketio.on('disconnect', () => {
    console.log("Disconnected from SOCKET.IO SERVER ");
});


tcp_socket.connect(srcPort, srcHost, function () {

    console.log('net connected');

    // Init Dicer :
    const dicer = new Dicer({boundary: srcBoundary});

    let part_no = 0;

    dicer.on('part', function (part) {
        //console.log("part " + part_no++);

        try {
            let frameEncoded = '';
            part.setEncoding('base64');

            part.on('header', function (header) {
                //console.log(header);
            });
            part.on('data', function (data) {
                frameEncoded += data;
            });
            part.on('end', function () {
                socketio.emit('image', frameEncoded);
            });
            part.on('error', function () {
                console.log('error');
            });
        }
        catch (e) {
            console.log('error');
        }

    });

    dicer.on('error', function () {
        console.log('error');
    });


    // Handle streams closing :
    dicer.on('finish', function () {
        console.log('Dicer stream finished');
    });

    // Pipe :
    tcp_socket.pipe(dicer);

});

tcp_socket.on('error', function(error) { console.log('tcp socket down'); });
tcp_socket.on('close', function() {
    console.log('TCP tcp_socket closed');
    return process.exit(22);
});