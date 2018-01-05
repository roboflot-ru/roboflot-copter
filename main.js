/**
 * Created by nee on 06.01.2018.
 */


import io from 'node_modules/socket.io-client'
import mavlink from 'node_modules/mavlink'
import mavlinkMessage from 'node_modules/mavlink'
import rosnodejs, {Time} from 'node_modules/rosnodejs/dist/index.js'
import msgUtil from 'node_modules/rosnodejs/dist/utils/message_utils.js'

// MAVLink Parser (for conversion between ROSMAV - MAV)
const MAVParser = new mavlink();

// Destination server detail
const SOCKET_IO_SERVER = 'http://hub.roboflot.ru:3000';
const socket           = io.connect(SOCKET_IO_SERVER);

// Init ROS Node
const NODENAME = "robot_communication";
const OPTIONS = { onTheFly : true };

var publisher; // Var for hoising from within initNode Routine

// Outermost ' wait for parser to be ready
MAVParser.on('ready' , () => {
    rosnodejs.initNode(NODENAME,OPTIONS).then(
        (nodeHandle) => {
            createSubscriber(nodeHandle);
            checkSocketConnectivity();
            publisher = createPublisher(nodeHandle);//HOISING TO OUTER SCOPE
        }
    );

    // When receiving things from server
    socket.on('from_server',(data)=>{ 
        MAVParser.parse(data);
    });

    // When Parser is finished 
    MAVParser.on('message' , (message)=>{
        //PUB
        const mavros_message = createMavlinkMessage(message);
        publisher.publish(mavros_message);

    });

});

// Create ROS Publisher
const createPublisher = (nodeHandle) => {
    return nodeHandle.advertise('/mavlink/from_gcs', 'mavros_msgs/Mavlink', {
        queueSize: 10,
        latching: true,
        throttleMs: 100
    });
};

// Create ROS Subscriber
const createSubscriber = (nodeHandle) => {
    rosnode_instance.subscribe('/mavlink/to_gcs','mavros_msgs/Mavlink',
        (data)=>{
            // Parse ROS Message to Buffer
            let msgBuf = new Buffer(data.len + 8);
            msgBuf.fill('\0');

            const payload64 = data.payload64.reduce(
                (last,cur)=>Buffer.concat([last,cur.toBuffer('le',8)])
            ,new Buffer(0)); 
            
            // Create mavlink buffer
            msgBuf[0] = data.magic;
            msgBuf[1] = data.len;
            msgBuf[2] = data.seq;
            msgBuf[3] = data.sysid;
            msgBuf[4] = data.compid;
            msgBuf[5] = data.msgid;
            payload64.copy(msgBuf,6,0);
            msgBuf.writeUInt16LE(data.checksum, data.len+6);
            
            // Socket Emit it out
            socket.emit('chat',msgBuf);
        },
    {
      queueSize: 10,
      throttleMs: 100
    });
};

// Check SOCKET.IO on 'connect' connectivity 
const checkSocketConnectivity = () =>{
    socket.on('connect', () => {
            console.log("[ROBOT]['connect'] Connected to SOCKET.IO SERVER ");
    });
};

// Create ROS Message from incoming mavlink buffer
const createMavlinkMessage = (incoming_msg) => {
    //msgUtil.getHandlerForMsgType('UINt64')
      let byte_offset = 0;
    let payload_64 = [];

    // Create Payload 64
    for (let i = 0; i < Math.ceil(incoming_msg.length / 8); i++) {
        // Read Buffer offset 8
        let remaining_count = (incoming_msg.length - byte_offset) > 8 ?
            8 : (incoming_msg.length - byte_offset);
        let temp = new Buffer(8);
        temp.fill(0);
        incoming_msg.payload.copy(temp, 0, byte_offset, byte_offset + remaining_count);
        let bignum = new BN(temp, '8', 'le');
        payload_64.push(bignum);
        byte_offset += 8;
    }

    // Define ROS Message TYPE (Under Scope)
    const mavros_msgs_type = rosnodejs.require('mavros_msgs').msg;
    const Header = rosnodejs.require('std_msgs').msg.Header;
    const header = new Header({
        seq: 0,
        stamp: rosnodejs.Time.now(),
        frame_id: ''
    });
    
    const mav_message = new mavros_msgs_type.Mavlink({
        // // Reuse a message to be sent
        header: header,
        len: message.length,
        seq: message.sequence,
        sysid: message.system,
        compid: message.component,
        msgid: message.id,
        checksum: message.checksum,
        payload64: payload_64
    });
    
    return mav_message;
};