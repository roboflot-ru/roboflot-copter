/**
 * Created by nee on 06.01.2018.
 */

const ROBOT_ID = '6c2039bf-b71b-4ebe-b06f-02abdb738963';

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

// соединяемся с сервером
const socket = io.connect(SOCKET_IO_SERVER + '?robot_id=' + ROBOT_ID);


socket.on('connect', () => {
    console.log("Connected to SOCKET.IO SERVER ");

    socket_io_status = 1;
    //
    socket.on('fromserver', (data)=>{
        console.log('Data from server:' + data);
        //MAVParser.parse(data);
    });

    //socket.emit('chat','hello from robot');
});

socket.on('disconnect', () => {
    console.log("Disconnected from SOCKET.IO SERVER ");
    socket_io_status = 0;
});

socket.on('error', console.log);



// Инициализация rosnode
rosnodejs.initNode(NODENAME, OPTIONS).then(
    (nodeHandler) => {


        createSubscriber(nodeHandler);

        //publisher = createPublisher(nodeHandler);

    }
);




/*
// Outermost ' wait for parser to be ready
MAVParser.on('ready' , () => {
    console.log('mavparser initialized');

    // When Parser is finished 
    MAVParser.on('message' , (message)=>{
        //PUB
        const mavros_message = createMavlinkMessage(message);
        console.log(message);

        //publisher.publish(mavros_message);

    });

});
*/

/*
// Create ROS Publisher
const createPublisher = (nodeHandle) => {
    console.log('creating publisher');

    // Создаем паблишер const pub = nh.advertise('/topic', 'std_msgs/String');
    return nodeHandle.advertise('/mavlink/to', 'mavros_msgs/Mavlink', {
        queueSize: 10,
        latching: true,
        throttleMs: 100
    });
    // tcpNoDelay

};
*/



// Подписываемся на топик ROS с сообщениями MAVLink для пульта управления от автопилота
const createSubscriber = (nodeHandle) => {
    nodeHandle.subscribe('/mavlink/from','mavros_msgs/Mavlink',
        (data)=>{
            // после получения сообщения запаковываем его в бинарный формат MAVLink
            let msgBuf = Buffer.alloc(data.len + 8);
            msgBuf.fill('\0');

            const payload64 = data.payload64.reduce(
                (last,cur)=>Buffer.concat([last,cur.toBuffer('le',8)]), Buffer.alloc(0)
            );
            
            // Create mavlink buffer
            msgBuf[0] = data.magic;
            msgBuf[1] = data.len;
            msgBuf[2] = data.seq;
            msgBuf[3] = data.sysid; // ID системы
            msgBuf[4] = data.compid; // ID компьютера
            msgBuf[5] = data.msgid;
            payload64.copy(msgBuf,6,0);
            msgBuf.writeUInt16LE(data.checksum, data.len+6);

            // Отправляем на сервер
            socket.emit('fromboard', msgBuf);
        },
    {
        queueSize: 100
        //,throttleMs: 100
    });
};


/*
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
    
    return new mavros_msgs_type.Mavlink({
        // // Reuse a message to be sent
        header: header,
        len: incoming_msg.length,
        seq: incoming_msg.sequence,
        sysid: incoming_msg.system,
        compid: incoming_msg.component,
        msgid: incoming_msg.id,
        checksum: incoming_msg.checksum,
        payload64: payload_64
    });

};
*/
