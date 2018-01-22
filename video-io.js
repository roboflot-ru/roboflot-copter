/**

    This script streams video frames from Raspberry Pi camera over socket.io to view them in browser.
    Install your web-base GCS and get ROBOT_ID to configure below.

    Video stream from camera captures by native service,
    then cut to frames by gstreamer and streams to local TCP port.

    Run tcp server:
    modprobe bcm2835-v4l2 && gst-launch-1.0 -v v4l2src ! video/x-raw, width=320, height=240 ! timeoverlay text="T:" shaded-background=true ! jpegenc quality=20 ! multipartmux  boundary="--videoboundary" ! tcpserversink host=0.0.0.0 port=5001

    You can set video dimensions in the command above

    Check Video Streaming section in docs/INSTALL.md

 */

// Your robot id from GCS
const ROBOT_ID = '6c2039bf-b91b-4ebe-b06f-02abdb738963';
const SOCKET_IO_SERVER = "http://test.roboflot.io:3000";

// Video source
const srcHost = "127.0.0.1";
const srcPort = 5001;
const srcBoundary = "--videoboundary";

// TCP server init
const Net = require('net');
const tcp_socket = Net.Socket();

// Video-cutter init
const Dicer = require('dicer');

// Socket.io client init
const io = require('socket.io-client');
const socketio = io.connect(SOCKET_IO_SERVER + '?robot_id=' + ROBOT_ID);

// Log connection and disconnection
socketio.on('connect', function () {
    console.log("Connected to socket.io server");
});
socketio.on('disconnect', () => {
    console.log("Disconnected from socket.io server");
});


// Connect to TCP video source
tcp_socket.connect(srcPort, srcHost, function () {

    console.log('Connected to TCP video source');

    // Init Dicer:
    const dicer = new Dicer({boundary: srcBoundary});

    // dice gets packet
    dicer.on('part', function (part) {
        try {
            let frameEncoded = '';
            part.setEncoding('base64');

            part.on('header', function (header) {});
            part.on('data', function (data) {
                frameEncoded += data;
            });
            part.on('end', function () {
                // emit frame to socket.io on end of packet
                socketio.emit('video', frameEncoded);
            });
            part.on('error', function () {
                console.log('error');
            });
        }
        catch (e) {
            console.log('dice error 1');
        }
    });

    // log dicer error
    dicer.on('error', function () {
        console.log('error');
    });

    // Handle streams closing
    dicer.on('finish', function () {
        console.log('Dicer stream finished');
    });

    // Pipe TCP video stream to Dicer
    tcp_socket.pipe(dicer);

});

// log tcp socket error
tcp_socket.on('error', function(error) { console.log('tcp socket down'); });

// log tcp closing
tcp_socket.on('close', function() {
    console.log('TCP tcp_socket closed');
    return process.exit(22);
});
